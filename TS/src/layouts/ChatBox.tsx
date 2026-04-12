import { useState, useEffect, useRef } from 'react';
import { Card, Button, Form, InputGroup, Badge, Alert } from 'react-bootstrap';
import { BsChatDots, BsSend, BsX, BsClock, BsCheck, BsCheckAll } from 'react-icons/bs';
import { useAuthContext } from '@/context/useAuthContext';

export type ChatMessage = {
  id: string;
  text: string;
  sender: 'user' | 'support';
  timestamp: Date;
  isRead?: boolean;
  studentId?: string;
  studentName?: string;
  status?: 'sent' | 'delivered' | 'read';
};

interface ChatBoxProps {
  position?: 'bottom-right' | 'bottom-left';
}

const CHAT_BUTTON_SIZE = 54;
const CHAT_ICON_SIZE = 19;

const ChatBox = ({ position = 'bottom-right' }: ChatBoxProps) => {
  const { user } = useAuthContext();
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const token = user?.token;
  
  const studentId = user?.id || (user as any)?._id;
  const studentName = (user as any)?.fullName || (user as any)?.name || 'Student';

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [lastUserMessageTime, setLastUserMessageTime] = useState<Date | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history from database
  useEffect(() => {
    if (token && studentId && isChatOpen) {
      loadChatHistory();
    }
  }, [token, studentId, isChatOpen]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Update unread count and check if waiting for response
  useEffect(() => {
    const unread = messages.filter(msg => msg.sender === 'support' && !msg.isRead).length;
    setUnreadCount(unread);

    // Check if we're waiting for admin response
    const lastMessage = messages[messages.length - 1];
    const waiting = lastMessage && lastMessage.sender === 'user' && 
                   !messages.some(msg => msg.sender === 'support' && 
                   msg.timestamp > lastMessage.timestamp);
    setIsWaitingForResponse(waiting);

    // Set last user message time for the status indicator
    const userMessages = messages.filter(msg => msg.sender === 'user');
    if (userMessages.length > 0) {
      setLastUserMessageTime(userMessages[userMessages.length - 1].timestamp);
    }
  }, [messages]);

  const loadChatHistory = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${baseURL}/api/chat/messages`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.messages) {
          const formattedMessages = data.messages.map((msg: any) => ({
            id: msg._id || msg.id,
            text: msg.message,
            sender: msg.sender === 'student' ? 'user' : 'support', // Fix sender mapping
            timestamp: new Date(msg.timestamp),
            isRead: msg.isRead,
            status: msg.isRead ? 'read' : 'delivered'
          }));
          setMessages(formattedMessages);
        }
      } else {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        // If API fails, load default welcome message
        if (messages.length === 0) {
          setMessages([{
            id: '1',
            text: 'Hello! How can I help you today?',
            sender: 'support',
            timestamp: new Date(),
            isRead: true,
            status: 'read'
          }]);
        }
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      // Load default welcome message if no history exists
      if (messages.length === 0) {
        setMessages([{
          id: '1',
          text: 'Hello! How can I help you today?',
          sender: 'support',
          timestamp: new Date(),
          isRead: true,
          status: 'read'
        }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const saveMessageToDB = async (messageText: string): Promise<string | null> => {
    try {
      const response = await fetch(`${baseURL}/api/chat/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save message');
      }

      const data = await response.json();
      return data.messageId;
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !token || !studentId) return;

    const userMessageText = newMessage.trim();
    
    // Optimistically add message to UI
    const tempId = Date.now().toString();
    const userMessage: ChatMessage = {
      id: tempId,
      text: userMessageText,
      sender: 'user',
      timestamp: new Date(),
      studentId: studentId,
      studentName: studentName,
      status: 'sent'
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsWaitingForResponse(true);

    try {
      // Save to database
      const messageId = await saveMessageToDB(userMessageText);
      
      // Update with actual ID from database and mark as delivered
      if (messageId) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempId ? { ...msg, id: messageId, status: 'delivered' } : msg
          )
        );
      }

    } catch (error: any) {
      console.error('Error sending message:', error);
      // Remove the optimistic message if sending failed
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      setIsWaitingForResponse(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const markAllAsRead = async () => {
    try {
      if (token) {
        await fetch(`${baseURL}/api/chat/mark-read`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }

      setMessages(prev => 
        prev.map(msg => 
          msg.sender === 'support' ? { ...msg, isRead: true, status: 'read' } : msg
        )
      );
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const toggleChat = () => {
    const newState = !isChatOpen;
    setIsChatOpen(newState);
    if (newState) {
      markAllAsRead();
    }
  };

  const positionStyles = {
    'bottom-right': { bottom: '14px', right: '14px' },
    'bottom-left': { bottom: '14px', left: '14px' }
  };

  // Format time to 12-hour format with AM/PM
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Get status icon for user messages
  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'sent':
        return <BsCheck className="ms-1" size={12} />;
      case 'delivered':
        return <BsCheckAll className="ms-1" size={12} />;
      case 'read':
        return <BsCheckAll className="ms-1 text-primary" size={12} />;
      default:
        return <BsClock className="ms-1" size={12} />;
    }
  };

  // Calculate how long we've been waiting for response
  const getWaitingTime = () => {
    if (!lastUserMessageTime) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - lastUserMessageTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 minute ago';
    return `${diffMins} minutes ago`;
  };

  return (
    <div 
      className="position-fixed"
      style={{
        ...positionStyles[position],
        zIndex: 1040
      }}
    >
      {/* Chat Widget */}
      {isChatOpen && (
        <Card 
          className="shadow-lg border-0"
          style={{
            width: '380px',
            height: '520px',
            bottom: '80px',
            [position === 'bottom-right' ? 'right' : 'left']: '0',
            position: 'absolute',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center py-3">
            <div>
              <h6 className="mb-0 fw-bold">Support Chat</h6>
              <small className="opacity-75">We&apos;re here to help!</small>
            </div>
            <div className="d-flex align-items-center">
              {isWaitingForResponse && (
                <Badge bg="warning" text="dark" className="me-2">
                  <BsClock className="me-1" size={10} />
                  Waiting
                </Badge>
              )}
              <Button 
                variant="link" 
                className="text-white p-0 opacity-75 hover-opacity-100"
                onClick={() => setIsChatOpen(false)}
                style={{ transition: 'opacity 0.2s' }}
              >
                <BsX size={24} />
              </Button>
            </div>
          </Card.Header>

          <Card.Body 
            className="flex-grow-1 p-0 bg-light"
            style={{
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {isLoading ? (
              <div className="d-flex justify-content-center align-items-center h-100">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <>
                {/* Waiting for response indicator */}
                {isWaitingForResponse && (
                  <Alert variant="info" className="m-3 py-2">
                    <div className="d-flex align-items-center">
                      <BsClock className="me-2" />
                      <small>
                        <strong>Waiting for support response</strong>
                        <br />
                        <span className="text-muted">Last message sent {getWaitingTime()}</span>
                      </small>
                    </div>
                  </Alert>
                )}

                {/* Messages */}
                <div className="p-3 d-flex flex-column gap-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`d-flex ${message.sender === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
                    >
                      <div
                        className={`rounded-3 p-3 shadow-sm ${
                          message.sender === 'user' 
                            ? 'bg-primary text-white' 
                            : 'bg-white border text-dark'
                        }`}
                        style={{ 
                          maxWidth: '85%',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1) !important'
                        }}
                      >
                        <div 
                          className="mb-1"
                          style={{ 
                            fontSize: '0.9rem',
                            lineHeight: '1.4',
                            wordWrap: 'break-word'
                          }}
                        >
                          {message.text}
                        </div>
                        <div 
                          className={`small d-flex align-items-center ${message.sender === 'user' ? 'text-light' : 'text-secondary'}`}
                          style={{ fontSize: '0.75rem' }}
                        >
                          {formatTime(message.timestamp)}
                          {message.sender === 'user' && getStatusIcon(message.status)}
                          {message.sender === 'support' && !message.isRead && (
                            <Badge bg="success" className="ms-1" style={{ fontSize: '0.6rem' }}>
                              New
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </>
            )}
          </Card.Body>

          <Card.Footer className="border-0 bg-white p-3">
            <InputGroup className="mb-2">
              <Form.Control
                type="text"
                placeholder="Type your message here..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="rounded-start"
                style={{
                  border: '1px solid #dee2e6',
                  fontSize: '0.9rem',
                  padding: '12px 16px',
                }}
              />
              <Button 
                variant="primary" 
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || isLoading}
                className="rounded-end px-3"
                style={{
                  border: 'none',
                  padding: '12px 16px',
                }}
              >
                <BsSend size={16} />
              </Button>
            </InputGroup>
            <div className="text-center">
              <small className="text-muted-grey" style={{ fontSize: '0.8rem' }}>
                Typically replies within 5 minutes
              </small>
            </div>
          </Card.Footer>
        </Card>
      )}

      {/* Chat Toggle Button */}
      <Button
        variant="primary"
        className="rounded-circle shadow-lg d-flex align-items-center justify-content-center"
        style={{
          width: `${CHAT_BUTTON_SIZE}px`,
          height: `${CHAT_BUTTON_SIZE}px`,
          position: 'relative',
          border: 'none',
          transition: 'all 0.3s ease'
        }}
        onClick={toggleChat}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <BsChatDots size={CHAT_ICON_SIZE} />
        {unreadCount > 0 && (
          <Badge
            bg="danger"
            className="position-absolute"
            style={{
              top: '-2px',
              right: '-2px',
              fontSize: '0.65rem',
              minWidth: '18px',
              height: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {unreadCount}
          </Badge>
        )}
      </Button>
    </div>
  );
};

export default ChatBox;