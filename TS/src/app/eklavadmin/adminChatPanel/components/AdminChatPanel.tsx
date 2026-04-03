import { useState, useEffect, useRef } from 'react';
import { Card, Button, Form, InputGroup, Badge, ListGroup, Row, Col, Dropdown, Spinner, Alert } from 'react-bootstrap';
import { 
  BsChatDots, BsSend, BsPerson, BsClock, BsExclamationCircle, 
  BsThreeDots, BsSearch, BsFilter, BsCheckCircle, BsHourglassSplit, 
  BsReply, BsArrowLeft, BsArrowRight, BsEye, BsEyeSlash,
  BsCheck2, BsCheck2All, BsDownload, BsTrash, BsFlag
} from 'react-icons/bs';
import { FaUserGraduate, FaHeadset, FaStar, FaRegStar } from 'react-icons/fa';
import { useAuthContext } from '@/context/useAuthContext';

interface StudentQuery {
  _id: string;
  studentName: string;
  studentEmail?: string;
  studentPhone?: string;
  lastMessage: string;
  lastMessageText?: string;
  messageCount: number;
  unreadCount: number;
  needsResponse: boolean;
  status: 'open' | 'pending' | 'resolved';
  lastMessageTime?: string;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: 'student' | 'admin';
  timestamp: Date;
  isRead?: boolean;
  adminName?: string;
  isDelivered?: boolean;
}

type QueryTab = 'all' | 'open' | 'pending' | 'resolved';

// Helper function to format time ago
const getTimeAgo = (dateString?: string) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  
  return date.toLocaleDateString();
};

// Helper function to format time
const formatTime = (date: Date) => {
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
};

const AdminChatPanel = () => {
  const { user } = useAuthContext();
  const baseURL = import.meta.env.VITE_API_BASE_URL;

  const [queries, setQueries] = useState<StudentQuery[]>([]);
  const [filteredQueries, setFilteredQueries] = useState<StudentQuery[]>([]);
  const [activeTab, setActiveTab] = useState<QueryTab>('open');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [adminName, setAdminName] = useState('Support Team');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [typingStatus, setTypingStatus] = useState<{ isTyping: boolean; studentId: string | null }>({ isTyping: false, studentId: null });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* ---------------- API LOADERS ---------------- */

  useEffect(() => {
    loadQueries();
    loadStats();
  }, []);

  useEffect(() => {
    filterQueries();
  }, [activeTab, searchTerm, queries]);

  useEffect(() => {
    if (selectedStudent) {
      loadStudentMessages(selectedStudent);
      markMessagesAsRead(selectedStudent);
    }
  }, [selectedStudent]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!selectedStudent) {
        loadQueries();
        loadStats();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedStudent]);

  const loadQueries = async () => {
    try {
      const res = await fetch(`${baseURL}/api/admin/chat/queries`);
      const data = await res.json();
      if (data.success) {
        setQueries(data.queries);
        setFilteredQueries(data.queries);
      }
    } catch (err) {
      console.error('Error loading queries:', err);
      setError('Failed to load queries');
      setTimeout(() => setError(null), 3000);
    }
  };

  const loadStats = async () => {
    try {
      const res = await fetch(`${baseURL}/api/admin/chat/stats`);
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const loadStudentMessages = async (studentId: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`${baseURL}/api/admin/chat/student/${studentId}`);
      const data = await res.json();
      if (data.success) {
        setMessages(
          data.messages.map((m: any) => ({
            id: m._id,
            text: m.message,
            sender: m.sender,
            timestamp: new Date(m.timestamp),
            adminName: m.adminName,
            isDelivered: m.isDelivered || true
          }))
        );
      }
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Failed to load messages');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const markMessagesAsRead = async (studentId: string) => {
    try {
      await fetch(`${baseURL}/api/admin/chat/mark-read/${studentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      loadQueries();
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  const filterQueries = () => {
    let filtered = [...queries];
    
    if (activeTab !== 'all') {
      filtered = filtered.filter(q => q.status === activeTab);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(q => 
        q.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.studentEmail && q.studentEmail.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Sort by urgency: needsResponse first, then unreadCount, then lastMessageTime
    filtered.sort((a, b) => {
      if (a.needsResponse && !b.needsResponse) return -1;
      if (!a.needsResponse && b.needsResponse) return 1;
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
      return new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime();
    });
    
    setFilteredQueries(filtered);
  };

  /* ---------------- ACTIONS ---------------- */

  const sendReply = async () => {
    if (!newMessage.trim() || !selectedStudent || isSending) return;

    setIsSending(true);
    try {
      await fetch(`${baseURL}/api/admin/chat/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudent,
          message: newMessage,
          adminName
        })
      });

      const tempMessage: ChatMessage = {
        id: Date.now().toString(),
        text: newMessage,
        sender: 'admin',
        timestamp: new Date(),
        adminName,
        isDelivered: false
      };

      setMessages(prev => [...prev, tempMessage]);
      setNewMessage('');
      loadQueries();
      loadStats();
      
      setSuccessMessage('Message sent successfully');
      setTimeout(() => setSuccessMessage(null), 2000);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const updateStatus = async (status: 'open' | 'pending' | 'resolved') => {
    if (!selectedStudent) return;

    try {
      await fetch(`${baseURL}/api/admin/chat/status/${selectedStudent}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      setSelectedStudent(null);
      setMessages([]);
      loadQueries();
      loadStats();
      
      setSuccessMessage(`Query marked as ${status}`);
      setTimeout(() => setSuccessMessage(null), 2000);
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update status');
      setTimeout(() => setError(null), 3000);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      open: { bg: 'warning', icon: <BsExclamationCircle size={10} className="me-1" />, label: 'Open' },
      pending: { bg: 'info', icon: <BsHourglassSplit size={10} className="me-1" />, label: 'Pending' },
      resolved: { bg: 'success', icon: <BsCheckCircle size={10} className="me-1" />, label: 'Resolved' }
    };
    const { bg, icon, label } = config[status as keyof typeof config];
    return <Badge bg={bg} className="px-2 py-1">{icon}{label}</Badge>;
  };

  const selectedStudentInfo = queries.find(q => q._id === selectedStudent);

  const totalUnread = queries.reduce((sum, q) => sum + q.unreadCount, 0);
  const needsResponse = queries.filter(q => q.needsResponse).length;

  return (
    <div className="admin-chat-panel">
      {/* Header Section */}
      <div className="chat-header mb-4">
        <div className="header-left">
          <div className="header-icon">
            <BsChatDots />
          </div>
          <div>
            <h2 className="text-white mb-1">Chat Support</h2>
            <p className="text-muted mb-0">Manage and respond to student inquiries</p>
          </div>
        </div>
        <div className="header-stats">
          <div className="stat-chip">
            <BsExclamationCircle className="text-warning me-1" />
            <span>{needsResponse} Needs Response</span>
          </div>
          <div className="stat-chip">
            <BsEye className="text-info me-1" />
            <span>{totalUnread} Unread</span>
          </div>
        </div>
      </div>

      {/* Admin Name Section */}
      <Card className="bg-dark border-secondary mb-4">
        <Card.Body className="py-3">
          <Row className="align-items-center">
            <Col md={4}>
              <Form.Label className="text-muted mb-0">Display Name</Form.Label>
              <Form.Control
                value={adminName}
                onChange={e => setAdminName(e.target.value)}
                className="bg-dark-lighter border-secondary text-white mt-1"
                size="sm"
              />
            </Col>
            <Col md={8}>
              <div className="text-end">
                <Badge bg="orange" className="me-2">
                  <FaHeadset className="me-1" />
                  Online
                </Badge>
                <Badge bg="secondary">
                  <BsClock className="me-1" />
                  Response Time: &lt; 5min
                </Badge>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Success/Error Messages */}
      {successMessage && (
        <Alert variant="success" className="custom-alert" onClose={() => setSuccessMessage(null)} dismissible>
          <BsCheckCircle className="me-2" /> {successMessage}
        </Alert>
      )}
      {error && (
        <Alert variant="danger" className="custom-alert" onClose={() => setError(null)} dismissible>
          <BsExclamationCircle className="me-2" /> {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Row className="g-3 mb-4">
        <Col md={3}>
          <Card className="stat-card bg-dark-lighter border-secondary">
            <Card.Body className="d-flex align-items-center justify-content-between">
              <div>
                <h6 className="text-muted mb-1">Total Queries</h6>
                <h2 className="text-white mb-0">{stats?.totalQueries || 0}</h2>
              </div>
              <div className="stat-icon bg-orange">
                <BsChatDots size={24} />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stat-card bg-dark-lighter border-secondary">
            <Card.Body className="d-flex align-items-center justify-content-between">
              <div>
                <h6 className="text-muted mb-1">Open/Pending</h6>
                <h2 className="text-white mb-0">{stats?.pendingQueries || 0}</h2>
              </div>
              <div className="stat-icon bg-warning">
                <BsHourglassSplit size={24} />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stat-card bg-dark-lighter border-secondary">
            <Card.Body className="d-flex align-items-center justify-content-between">
              <div>
                <h6 className="text-muted mb-1">Resolved</h6>
                <h2 className="text-white mb-0">{stats?.statusCounts?.resolved || 0}</h2>
              </div>
              <div className="stat-icon bg-success">
                <BsCheckCircle size={24} />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stat-card bg-dark-lighter border-secondary">
            <Card.Body className="d-flex align-items-center justify-content-between">
              <div>
                <h6 className="text-muted mb-1">Today's Queries</h6>
                <h2 className="text-white mb-0">{stats?.todayQueries || 0}</h2>
              </div>
              <div className="stat-icon bg-info">
                <BsClock size={24} />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4">
        {/* LEFT PANEL - Student List */}
        <Col lg={showSidebar ? 4 : 3}>
          <Card className="chat-sidebar bg-dark border-secondary">
            <Card.Header className="bg-dark border-secondary">
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-white">Student Queries</span>
                <div className="d-flex gap-2">
                  <Button 
                    variant="outline-secondary" 
                    size="sm" 
                    onClick={() => setShowSidebar(!showSidebar)}
                    title="Toggle Sidebar"
                  >
                    {showSidebar ? <BsArrowLeft /> : <BsArrowRight />}
                  </Button>
                  <Button variant="outline-secondary" size="sm" onClick={loadQueries}>
                    <BsArrowRight /> Refresh
                  </Button>
                </div>
              </div>
            </Card.Header>

            {/* Search Bar */}
            <div className="p-2 border-bottom border-secondary">
              <InputGroup size="sm">
                <InputGroup.Text className="bg-dark-lighter border-secondary">
                  <BsSearch />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-dark-lighter border-secondary text-white"
                />
              </InputGroup>
            </div>

            {/* Tabs - Fixed Layout */}
            <div className="chat-tabs-container">
              <div className="chat-tabs-wrapper">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`chat-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                >
                  <BsChatDots className="tab-icon" />
                  <span>All</span>
                  <Badge bg={activeTab === 'all' ? 'orange' : 'secondary'} pill className="tab-count">
                    {queries.length}
                  </Badge>
                </button>
                <button
                  onClick={() => setActiveTab('open')}
                  className={`chat-tab-btn ${activeTab === 'open' ? 'active' : ''}`}
                >
                  <BsExclamationCircle className="tab-icon" />
                  <span>Open</span>
                  <Badge bg={activeTab === 'open' ? 'orange' : 'warning'} pill className="tab-count">
                    {queries.filter(q => q.status === 'open').length}
                  </Badge>
                </button>
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`chat-tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
                >
                  <BsHourglassSplit className="tab-icon" />
                  <span>Pending</span>
                  <Badge bg={activeTab === 'pending' ? 'orange' : 'info'} pill className="tab-count">
                    {queries.filter(q => q.status === 'pending').length}
                  </Badge>
                </button>
                <button
                  onClick={() => setActiveTab('resolved')}
                  className={`chat-tab-btn ${activeTab === 'resolved' ? 'active' : ''}`}
                >
                  <BsCheckCircle className="tab-icon" />
                  <span>Resolved</span>
                  <Badge bg={activeTab === 'resolved' ? 'orange' : 'success'} pill className="tab-count">
                    {queries.filter(q => q.status === 'resolved').length}
                  </Badge>
                </button>
              </div>
            </div>

            <Card.Body className="p-0 overflow-auto" style={{ height: 'calc(100vh - 520px)' }}>
              {isLoading && !filteredQueries.length ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="orange" size="sm" />
                  <p className="text-muted mt-2">Loading queries...</p>
                </div>
              ) : filteredQueries.length === 0 ? (
                <div className="text-center py-5">
                  <BsChatDots size={32} className="text-muted mb-2" />
                  <p className="text-muted">No queries found</p>
                </div>
              ) : (
                <ListGroup variant="flush">
                  {filteredQueries.map(q => (
                    <ListGroup.Item
                      key={q._id}
                      action
                      onClick={() => setSelectedStudent(q._id)}
                      className={`chat-student-item ${selectedStudent === q._id ? 'active' : ''} ${q.needsResponse ? 'needs-response' : ''}`}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="student-info">
                          <div className="student-name">
                            <FaUserGraduate className="text-orange me-1" size={12} />
                            <strong>{q.studentName}</strong>
                          </div>
                          <div className="last-message">
                            <small className="text-muted">{q.lastMessageText || q.lastMessage}</small>
                          </div>
                        </div>
                        <div className="student-meta">
                          <div className="timestamp">
                            <small className="text-muted">{getTimeAgo(q.lastMessageTime)}</small>
                          </div>
                          <div className="mt-1 d-flex gap-1">
                            {getStatusBadge(q.status)}
                            {q.unreadCount > 0 && (
                              <Badge bg="danger" pill className="unread-badge">
                                {q.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* RIGHT PANEL - Chat Area */}
        <Col lg={showSidebar ? 8 : 9}>
          <Card className="chat-area bg-dark border-secondary">
            {selectedStudentInfo ? (
              <>
                <Card.Header className="bg-dark border-secondary chat-area-header">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-3">
                      <div className="student-avatar">
                        <FaUserGraduate size={24} />
                      </div>
                      <div>
                        <h6 className="text-white mb-0">{selectedStudentInfo.studentName}</h6>
                        <div className="d-flex gap-2 mt-1">
                          {getStatusBadge(selectedStudentInfo.status)}
                          <small className="text-muted">
                            {selectedStudentInfo.messageCount} messages
                          </small>
                        </div>
                      </div>
                    </div>
                    <Dropdown>
                      <Dropdown.Toggle variant="outline-secondary" size="sm">
                        <BsThreeDots />
                      </Dropdown.Toggle>
                      <Dropdown.Menu align="end" className="bg-dark border-secondary">
                        <Dropdown.Item onClick={() => updateStatus('open')} className="text-warning">
                          <BsExclamationCircle className="me-2" /> Mark as Open
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => updateStatus('pending')} className="text-info">
                          <BsHourglassSplit className="me-2" /> Mark as Pending
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => updateStatus('resolved')} className="text-success">
                          <BsCheckCircle className="me-2" /> Mark as Resolved
                        </Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item onClick={() => {
                          setSelectedStudent(null);
                          setMessages([]);
                        }} className="text-danger">
                          <BsTrash className="me-2" /> Close Chat
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                </Card.Header>

                <Card.Body 
                  className="chat-messages overflow-auto" 
                  ref={messagesContainerRef}
                  style={{ background: '#1a1a1a' }}
                >
                  {isLoading ? (
                    <div className="text-center py-5">
                      <Spinner animation="border" variant="orange" />
                      <p className="text-muted mt-2">Loading messages...</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-5">
                      <BsChatDots size={48} className="text-muted mb-3" />
                      <p className="text-muted">No messages yet</p>
                      <small className="text-muted">Start the conversation by sending a message</small>
                    </div>
                  ) : (
                    messages.map((msg, idx) => (
                      <div
                        key={msg.id}
                        className={`message ${msg.sender === 'admin' ? 'message-out' : 'message-in'}`}
                      >
                        <div className="message-bubble">
                          {msg.sender === 'student' && (
                            <div className="message-sender">
                              <FaUserGraduate size={12} className="me-1" />
                              Student
                            </div>
                          )}
                          {msg.sender === 'admin' && (
                            <div className="message-sender">
                              <FaHeadset size={12} className="me-1" />
                              {msg.adminName || 'Support'}
                            </div>
                          )}
                          <div className="message-text">{msg.text}</div>
                          <div className="message-meta">
                            <small>{formatTime(msg.timestamp)}</small>
                            {msg.sender === 'admin' && (
                              msg.isDelivered ? 
                                <BsCheck2All className="ms-1 text-success" size={12} /> :
                                <BsCheck2 className="ms-1 text-muted" size={12} />
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  {typingStatus.isTyping && typingStatus.studentId === selectedStudent && (
                    <div className="typing-indicator">
                      <div className="typing-bubble">
                        <span className="dot"></span>
                        <span className="dot"></span>
                        <span className="dot"></span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </Card.Body>

                <Card.Footer className="bg-dark border-secondary">
                  <InputGroup>
                    <Form.Control
                      ref={inputRef}
                      placeholder="Type your message here..."
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendReply()}
                      className="bg-dark-lighter border-secondary text-white"
                    />
                    <Button 
                      variant="orange" 
                      onClick={sendReply}
                      disabled={isSending || !newMessage.trim()}
                    >
                      {isSending ? <Spinner animation="border" size="sm" /> : <BsSend />}
                    </Button>
                  </InputGroup>
                  <div className="text-muted mt-2 small">
                    <BsFlag className="me-1" size={10} />
                    Press Enter to send
                  </div>
                </Card.Footer>
              </>
            ) : (
              <Card.Body className="d-flex flex-column align-items-center justify-content-center text-center" style={{ minHeight: 400 }}>
                <div className="empty-chat-state">
                  <BsChatDots size={64} className="text-muted mb-3" />
                  <h5 className="text-white">Select a Conversation</h5>
                  <p className="text-muted">Choose a student from the sidebar to start chatting</p>
                  {filteredQueries.length > 0 && (
                    <Button 
                      variant="orange" 
                      onClick={() => setSelectedStudent(filteredQueries[0]._id)}
                    >
                      View Latest Query
                    </Button>
                  )}
                </div>
              </Card.Body>
            )}
          </Card>
        </Col>
      </Row>

      {/* Global Styles */}
      <style>{`
        .admin-chat-panel { padding: 0; }
        
        .chat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
          padding: 1.5rem;
          border-radius: 16px;
          border: 1px solid rgba(255, 140, 0, 0.2);
        }
        
        .header-left { display: flex; align-items: center; gap: 1rem; }
        
        .header-icon {
          width: 48px;
          height: 48px;
          background: rgba(255, 140, 0, 0.1);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ff8c00;
          font-size: 24px;
        }
        
        .header-stats { display: flex; gap: 1rem; }
        .stat-chip {
          background: #2a2a2a;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          color: #e0e0e0;
          font-size: 0.875rem;
        }
        
        .stat-card { transition: transform 0.2s, box-shadow 0.2s; }
        .stat-card:hover { transform: translateY(-4px); box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3); }
        
        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        
        .bg-orange { background-color: #ff8c00; }
        .bg-dark-lighter { background-color: #2a2a2a; }
        .text-orange { color: #ff8c00; }
        
        /* Fixed Tabs Styles - No Overlap */
       .chat-tabs-container {
  padding: 12px;
  border-bottom: 1px solid #3a3a3a;
  background: #1a1a1a;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
}
        
        .chat-tabs-wrapper {
  display: flex;
  gap: 8px;
  flex-wrap: nowrap;
  min-width: min-content;
  width: 100%;
}

.chat-tab-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  background: #2a2a2a;
  border: 1px solid #3a3a3a;
  border-radius: 8px;
  color: #adb5bd;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

/* Alternative: If you want them to wrap on very small screens instead of scroll */
@media (max-width: 576px) {
  .chat-tabs-wrapper {
    flex-wrap: wrap;
  }
  
  .chat-tab-btn {
    flex: 1;
    min-width: calc(50% - 4px);
  }
}
        
        .chat-tab-btn:hover {
          background: rgba(255, 140, 0, 0.1);
          border-color: #ff8c00;
          color: #ff8c00;
        }
        
        .chat-tab-btn.active {
          background: #ff8c00;
          border-color: #ff8c00;
          color: white;
        }
        
        .tab-icon {
          font-size: 12px;
        }
        
        .tab-count {
          font-size: 10px;
          padding: 2px 6px;
          margin-left: 4px;
        }
        
        .chat-student-item {
          background: #2a2a2a;
          border-bottom: 1px solid #3a3a3a;
          cursor: pointer;
          transition: all 0.2s;
        }
        .chat-student-item:hover { background: rgba(255, 140, 0, 0.1); }
        .chat-student-item.active { background: rgba(255, 140, 0, 0.15); border-left: 3px solid #ff8c00; }
        .chat-student-item.needs-response { background: rgba(255, 193, 7, 0.1); }
        
        .student-name { color: white; font-weight: 500; margin-bottom: 0.25rem; }
        .last-message { font-size: 0.75rem; }
        .timestamp { font-size: 0.7rem; }
        
        .unread-badge { font-size: 0.7rem; min-width: 20px; }
        
        .chat-area-header { padding: 1rem; }
        .student-avatar {
          width: 40px;
          height: 40px;
          background: rgba(255, 140, 0, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ff8c00;
        }
        
        .chat-messages { padding: 1rem; }
        
        .message {
          display: flex;
          margin-bottom: 1rem;
        }
        .message-in { justify-content: flex-start; }
        .message-out { justify-content: flex-end; }
        
        .message-bubble {
          max-width: 70%;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          background: #2a2a2a;
          color: #e0e0e0;
        }
        .message-out .message-bubble {
          background: #ff8c00;
          color: white;
        }
        
        .message-sender {
          font-size: 0.7rem;
          margin-bottom: 0.25rem;
          opacity: 0.8;
        }
        
        .message-text { word-wrap: break-word; }
        
        .message-meta {
          font-size: 0.65rem;
          margin-top: 0.25rem;
          opacity: 0.7;
          display: flex;
          justify-content: flex-end;
          gap: 0.25rem;
        }
        
        .typing-indicator { margin-bottom: 1rem; }
        .typing-bubble {
          background: #2a2a2a;
          padding: 0.5rem 1rem;
          border-radius: 12px;
          display: inline-flex;
          gap: 0.25rem;
        }
        .dot {
          width: 6px;
          height: 6px;
          background: #6c757d;
          border-radius: 50%;
          animation: typing 1.4s infinite;
        }
        .dot:nth-child(2) { animation-delay: 0.2s; }
        .dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typing {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
        
        .empty-chat-state { text-align: center; }
        
        .custom-alert { border-radius: 12px; border: none; }
        
        .btn-orange {
          background-color: #ff8c00;
          border-color: #ff8c00;
          color: white;
        }
        .btn-orange:hover { background-color: #e67e00; border-color: #e67e00; }
        
        .form-control:focus, .form-select:focus {
          border-color: #ff8c00;
          box-shadow: 0 0 0 0.2rem rgba(255, 140, 0, 0.25);
        }
        
        /* Scrollbar Styling */
        .overflow-auto::-webkit-scrollbar {
          width: 6px;
        }
        .overflow-auto::-webkit-scrollbar-track {
          background: #2a2a2a;
        }
        .overflow-auto::-webkit-scrollbar-thumb {
          background: #ff8c00;
          border-radius: 3px;
        }
        
        @media (max-width: 768px) {
          .chat-tab-btn span { display: none; }
          .chat-tab-btn { justify-content: center; }
          .tab-count { margin-left: 0; }
        }
      `}</style>
    </div>
  );
};

export default AdminChatPanel;