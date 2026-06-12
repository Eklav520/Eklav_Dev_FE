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
  status: 'open' | 'pending' | 'resolved';
}

interface ChatMessage {
  id: string;
  text: string;
  sender: 'student' | 'admin';
  timestamp: Date;
  isRead?: boolean;
  adminName?: string;
}

type QueryTab = 'all' | 'open' | 'pending' | 'resolved';

const AdminChatPanel = () => {
  const { user } = useAuthContext();
  const baseURL = import.meta.env.VITE_API_BASE_URL;

  const [queries, setQueries] = useState<StudentQuery[]>([]);
  const [activeTab, setActiveTab] = useState<QueryTab>('open');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [adminName, setAdminName] = useState('Support Team');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /* ---------------- API LOADERS ---------------- */

  useEffect(() => {
    loadQueries();
    loadStats();
  }, []);

  useEffect(() => {
    if (selectedStudent) loadStudentMessages(selectedStudent);
  }, [selectedStudent]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const authHeader = () => ({ Authorization: `Bearer ${user?.token}` });

  const loadQueries = async () => {
    const res = await fetch(`${baseURL}/api/admin/chat/queries`, { headers: authHeader() });
    const data = await res.json();
    if (data.success) setQueries(data.queries);
  };

  const loadStats = async () => {
    const res = await fetch(`${baseURL}/api/admin/chat/stats`, { headers: authHeader() });
    const data = await res.json();
    if (data.success) setStats(data.stats);
  };

  const loadStudentMessages = async (studentId: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`${baseURL}/api/admin/chat/student/${studentId}`, { headers: authHeader() });
      const data = await res.json();
      if (data.success) {
        setMessages(
          data.messages.map((m: any) => ({
            id: m._id,
            text: m.message,
            sender: m.sender,
            timestamp: new Date(m.timestamp),
            adminName: m.adminName
          }))
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  /* ---------------- ACTIONS ---------------- */

  const sendReply = async () => {
    if (!newMessage.trim() || !selectedStudent) return;

    await fetch(`${baseURL}/api/admin/chat/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({
        studentId: selectedStudent,
        message: newMessage,
        adminName
      })
    });

    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        text: newMessage,
        sender: 'admin',
        timestamp: new Date(),
        adminName
      }
    ]);

    setNewMessage('');
    loadQueries();
    loadStats();
  };

  const updateStatus = async (status: 'open' | 'pending' | 'resolved') => {
    if (!selectedStudent) return;

    await fetch(`${baseURL}/api/admin/chat/status/${selectedStudent}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });

    setSelectedStudent(null);
    setMessages([]);
    loadQueries();
  };

  /* ---------------- FILTER LOGIC ---------------- */

  const filteredQueries = queries.filter(q =>
    activeTab === 'all' ? true : q.status === activeTab
  );

  const getStatusBadge = (status: string) => {
    const map = { open: 'warning', pending: 'info', resolved: 'success' };
    return <Badge bg={map[status as keyof typeof map]}>{status}</Badge>;
  };

  const selectedStudentInfo = queries.find(q => q._id === selectedStudent);

  /* ---------------- UI ---------------- */

  return (
    <div className="container-fluid py-4">

      {/* Admin Name */}
      <Form.Group className="mb-3 col-md-6">
        <Form.Label>Admin Name</Form.Label>
        <Form.Control value={adminName} onChange={e => setAdminName(e.target.value)} />
      </Form.Group>

      {/* Stats */}
      <Row className="g-3 mb-3">
        <Col md={3}><Stat icon={<BsPerson />} value={stats?.totalQueries} label="Total Queries" /></Col>
        <Col md={3}><Stat icon={<BsExclamationCircle />} value={stats?.pendingQueries} label="Pending" /></Col>
        <Col md={3}><Stat icon={<BsChatDots />} value={stats?.statusCounts?.resolved} label="Resolved" /></Col>
        <Col md={3}><Stat icon={<BsClock />} value={stats?.todayQueries} label="Today" /></Col>
      </Row>

      <Row className="g-4">

        {/* LEFT PANEL */}
        <Col md={4}>
          <Card style={{ height: 'calc(100vh - 260px)' }}>
            <Card.Header className="bg-primary text-white d-flex justify-content-between">
              <span>Student Queries</span>
              <Button size="sm" variant="outline-light" onClick={loadQueries}>Refresh</Button>
            </Card.Header>

            {/* Tabs */}
            <div className="btn-group p-2">
              {(['all','open','pending','resolved'] as QueryTab[]).map(tab => (
                <Button
                  key={tab}
                  size="sm"
                  variant={activeTab === tab ? 'primary' : 'outline-primary'}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab.toUpperCase()}
                </Button>
              ))}
            </div>

            <Card.Body className="p-0 overflow-auto">
              <ListGroup variant="flush">
                {filteredQueries.map(q => (
                  <ListGroup.Item
                    key={q._id}
                    action
                    onClick={() => setSelectedStudent(q._id)}
                    className={q.needsResponse ? 'bg-warning-subtle' : ''}
                  >
                    <strong>{q.studentName}</strong>
                    <div className="small text-muted">{q.lastMessageText}</div>
                    <div className="d-flex gap-1 mt-1">
                      {getStatusBadge(q.status)}
                      {q.unreadCount > 0 && <Badge bg="danger">{q.unreadCount}</Badge>}
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>

        {/* CHAT PANEL */}
        <Col md={8}>
          <Card style={{ height: 'calc(100vh - 260px)' }}>
            <Card.Header className="bg-primary text-white d-flex justify-content-between">
              {selectedStudentInfo
                ? `Chat with ${selectedStudentInfo.studentName}`
                : 'Select a student'}
              {selectedStudent && (
                <Dropdown>
                  <Dropdown.Toggle size="sm" variant="outline-light">
                    <BsThreeDots />
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => updateStatus('open')}>Open</Dropdown.Item>
                    <Dropdown.Item onClick={() => updateStatus('pending')}>Pending</Dropdown.Item>
                    <Dropdown.Item onClick={() => updateStatus('resolved')}>Resolved</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              )}
            </Card.Header>

            <Card.Body className="overflow-auto">
              {messages.map(m => (
                <div key={m.id} className={`d-flex ${m.sender === 'admin' ? 'justify-content-end' : ''}`}>
                  <div className={`p-2 rounded ${m.sender === 'admin' ? 'bg-primary text-white' : 'bg-light'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </Card.Body>

            {selectedStudent && (
              <Card.Footer>
                <InputGroup>
                  <Form.Control
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendReply()}
                  />
                  <Button onClick={sendReply}><BsSend /></Button>
                </InputGroup>
              </Card.Footer>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

/* -------- SMALL STAT COMPONENT -------- */
const Stat = ({ icon, value, label }: any) => (
  <Card className="border-0 shadow-sm text-center">
    <Card.Body>
      {icon}
      <h4>{value || 0}</h4>
      <small>{label}</small>
    </Card.Body>
  </Card>
);

export default AdminChatPanel;
