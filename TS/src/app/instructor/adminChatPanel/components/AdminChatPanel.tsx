import { useState, useEffect, useRef } from 'react';
import { Card, Button, Form, InputGroup, Badge, ListGroup, Row, Col, Dropdown } from 'react-bootstrap';
import { BsChatDots, BsSend, BsPerson, BsClock, BsExclamationCircle, BsThreeDots } from 'react-icons/bs';
import { useAuthContext } from '@/context/useAuthContext';

interface StudentQuery {
  _id: string;
  studentName: string;
  lastMessage: string;
  lastMessageText?: string;
  messageCount: number;
  unreadCount: number;
  needsResponse: boolean;
  status: string;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: 'student' | 'admin';
  timestamp: Date;
  isRead?: boolean;
  studentId?: string;
  studentName?: string;
  adminName?: string;
}

const AdminChatPanel = () => {
  const { user } = useAuthContext();
  const baseURL = import.meta.env.VITE_API_BASE_URL;

  const [queries, setQueries] = useState<StudentQuery[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [adminName, setAdminName] = useState('Support Team');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadQueries();
    loadStats();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      loadStudentMessages(selectedStudent);
    }
  }, [selectedStudent]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadQueries = async () => {
    try {
      const response = await fetch(`${baseURL}/api/admin/chat/queries`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setQueries(data.queries);
        }
      }
    } catch (error) {
      console.error('Error loading queries:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`${baseURL}/api/admin/chat/stats`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStats(data.stats);
        }
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadStudentMessages = async (studentId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${baseURL}/api/admin/chat/student/${studentId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const formattedMessages = data.messages.map((msg: any) => ({
            id: msg._id || msg.id,
            text: msg.message,
            sender: msg.sender,
            timestamp: new Date(msg.timestamp),
            isRead: msg.isRead,
            adminName: msg.adminName,
          }));
          setMessages(formattedMessages);
        }
      }
    } catch (error) {
      console.error('Error loading student messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendReply = async () => {
    if (!newMessage.trim() || !selectedStudent) return;

    try {
      const response = await fetch(`${baseURL}/api/admin/chat/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: selectedStudent,
          message: newMessage.trim(),
          adminName: adminName
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const replyMessage: ChatMessage = {
            id: data.messageId || Date.now().toString(),
            text: newMessage.trim(),
            sender: 'admin',
            timestamp: new Date(),
            isRead: false,
            adminName: adminName,
          };
          setMessages(prev => [...prev, replyMessage]);
          setNewMessage('');
          loadQueries();
          loadStats();
        }
      }
    } catch (error) {
      console.error('Error sending reply:', error);
    }
  };

  const updateStatus = async (status: string) => {
    if (!selectedStudent) return;

    try {
      const response = await fetch(`${baseURL}/api/admin/chat/status/${selectedStudent}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        loadQueries();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendReply();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      open: 'warning',
      resolved: 'success',
      pending: 'info'
    };
    return <Badge bg={variants[status as keyof typeof variants]}>{status}</Badge>;
  };

  const selectedStudentInfo = queries.find(q => q._id === selectedStudent);

  return (
    <div className="container-fluid py-4">
      {/* Admin Name Input */}
      <div className="row mb-3">
        <div className="col-md-6">
          <Form.Group>
            <Form.Label>Admin Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter your name"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
            />
            <Form.Text className="text-muted">
              This name will appear in your replies to students
            </Form.Text>
          </Form.Group>
        </div>
      </div>

      <Row className="g-4">
        {/* Statistics Cards */}
        <Col xs={12}>
          <Row className="g-3">
            <Col xs={12} sm={6} md={3}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="text-center">
                  <BsPerson size={24} className="text-primary mb-2" />
                  <h4 className="mb-1">{stats?.totalQueries || 0}</h4>
                  <small className="text-muted">Total Queries</small>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} sm={6} md={3}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="text-center">
                  <BsExclamationCircle size={24} className="text-warning mb-2" />
                  <h4 className="mb-1">{stats?.pendingQueries || 0}</h4>
                  <small className="text-muted">Pending Response</small>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} sm={6} md={3}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="text-center">
                  <BsChatDots size={24} className="text-success mb-2" />
                  <h4 className="mb-1">{stats?.statusCounts?.resolved || 0}</h4>
                  <small className="text-muted">Resolved</small>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} sm={6} md={3}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="text-center">
                  <BsClock size={24} className="text-info mb-2" />
                  <h4 className="mb-1">{stats?.todayQueries || 0}</h4>
                  <small className="text-muted">Today's Queries</small>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>

        <Col md={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Student Queries</h6>
              <Button variant="outline-light" size="sm" onClick={loadQueries}>
                Refresh
              </Button>
            </Card.Header>
            <Card.Body className="p-0">
              <ListGroup variant="flush">
                {queries.map((query) => (
                  <ListGroup.Item
                    key={query._id}
                    action
                    onClick={() => setSelectedStudent(query._id)}
                    className={`border-0 ${selectedStudent === query._id ? 'bg-light' : ''}`}
                  >
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center mb-1">
                          <h6 className="mb-0 me-2">{query.studentName}</h6>
                          {getStatusBadge(query.status)}
                          {query.needsResponse && (
                            <Badge bg="warning" className="ms-1">Response Needed</Badge>
                          )}
                          {query.unreadCount > 0 && (
                            <Badge bg="danger" className="ms-1">{query.unreadCount}</Badge>
                          )}
                        </div>
                        {query.lastMessageText && (
                          <p className="text-muted small mb-1">
                            {query.lastMessageText.length > 50 
                              ? `${query.lastMessageText.substring(0, 50)}...`
                              : query.lastMessageText
                            }
                          </p>
                        )}
                        <small className="text-muted">
                          {new Date(query.lastMessage).toLocaleDateString()} • {query.messageCount} messages
                        </small>
                      </div>
                    </div>
                  </ListGroup.Item>
                ))}
                {queries.length === 0 && (
                  <ListGroup.Item className="text-center text-muted py-4">
                    No student queries yet
                  </ListGroup.Item>
                )}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>

        <Col md={8}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
              <div>
                <h6 className="mb-0">
                  {selectedStudentInfo ? `Chat with ${selectedStudentInfo.studentName}` : 'Select a student'}
                </h6>
                {selectedStudentInfo && (
                  <div className="d-flex align-items-center gap-2 mt-1">
                    {getStatusBadge(selectedStudentInfo.status)}
                    {selectedStudentInfo.needsResponse && (
                      <Badge bg="warning">Response needed</Badge>
                    )}
                  </div>
                )}
              </div>
              {selectedStudent && (
                <div className="d-flex gap-2">
                  <Dropdown>
                    <Dropdown.Toggle variant="outline-light" size="sm">
                      <BsThreeDots />
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item onClick={() => updateStatus('open')}>Mark as Open</Dropdown.Item>
                      <Dropdown.Item onClick={() => updateStatus('pending')}>Mark as Pending</Dropdown.Item>
                      <Dropdown.Item onClick={() => updateStatus('resolved')}>Mark as Resolved</Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                  <Button
                    variant="outline-light"
                    size="sm"
                    onClick={() => {
                      setSelectedStudent(null);
                      setMessages([]);
                    }}
                  >
                    Close
                  </Button>
                </div>
              )}
            </Card.Header>

            <Card.Body 
              className="flex-grow-1 p-0 bg-light"
              style={{
                overflowY: 'auto',
                height: '400px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {!selectedStudent ? (
                <div className="d-flex justify-content-center align-items-center h-100 text-muted">
                  <div className="text-center">
                    <BsChatDots size={48} className="mb-3 opacity-50" />
                    <p>Select a student to view and reply to their messages</p>
                  </div>
                </div>
              ) : isLoading ? (
                <div className="d-flex justify-content-center align-items-center h-100">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <div className="p-3 d-flex flex-column gap-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`d-flex ${message.sender === 'admin' ? 'justify-content-end' : 'justify-content-start'}`}
                    >
                      <div
                        className={`rounded-3 p-3 shadow-sm ${
                          message.sender === 'admin' 
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
                          className={`small ${message.sender === 'admin' ? 'text-light' : 'text-secondary'}`}
                          style={{ fontSize: '0.7rem', opacity: 0.8 }}
                        >
                          {formatTime(message.timestamp)}
                          {message.sender === 'admin' && message.adminName && (
                            <span> • by {message.adminName}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </Card.Body>

            {selectedStudent && (
              <Card.Footer className="border-0 bg-white">
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Type your reply..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isLoading}
                  />
                  <Button 
                    variant="primary" 
                    onClick={sendReply}
                    disabled={!newMessage.trim() || isLoading}
                  >
                    <BsSend className="me-1" />
                    Send
                  </Button>
                </InputGroup>
              </Card.Footer>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminChatPanel;