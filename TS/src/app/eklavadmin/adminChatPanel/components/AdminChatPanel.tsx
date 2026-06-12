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

  const authHeader = () => ({ Authorization: `Bearer ${user?.token}` });

  const loadQueries = async () => {
    try {
      const res = await fetch(`${baseURL}/api/admin/chat/queries`, { headers: authHeader() });
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
      const res = await fetch(`${baseURL}/api/admin/chat/stats`, { headers: authHeader() });
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
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
        headers: { 'Content-Type': 'application/json', ...authHeader() }
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
        headers: { 'Content-Type': 'application/json', ...authHeader() },
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
        headers: { 'Content-Type': 'application/json', ...authHeader() },
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

  const PANEL_H = 'calc(100vh - 160px)';

  return (
    <div className="acp-wrap">

      {/* ── Compact top bar ── */}
      <div className="acp-topbar">
        <div className="acp-topbar-left">
          <div className="acp-topbar-icon"><BsChatDots size={16} /></div>
          <span className="acp-topbar-title">Chat Support</span>
          <div className="acp-stat-pill"><BsChatDots size={11} /><b>{stats?.totalQueries || 0}</b><span>Total</span></div>
          <div className="acp-stat-pill warn"><BsExclamationCircle size={11} /><b>{stats?.pendingQueries || 0}</b><span>Open</span></div>
          <div className="acp-stat-pill succ"><BsCheckCircle size={11} /><b>{stats?.statusCounts?.resolved || 0}</b><span>Resolved</span></div>
          <div className="acp-stat-pill info"><BsClock size={11} /><b>{stats?.todayQueries || 0}</b><span>Today</span></div>
          {needsResponse > 0 && <div className="acp-stat-pill danger"><BsFlag size={11} /><b>{needsResponse}</b><span>Needs Reply</span></div>}
        </div>
        <div className="acp-topbar-right">
          <Form.Control
            value={adminName}
            onChange={e => setAdminName(e.target.value)}
            className="acp-name-input"
            size="sm"
            placeholder="Your display name"
          />
          <span className="acp-online-chip"><FaHeadset size={11} /> Online</span>
        </div>
      </div>

      {/* ── Toast messages ── */}
      {successMessage && (
        <div className="acp-toast acp-toast-success"><BsCheckCircle className="me-2" />{successMessage}</div>
      )}
      {error && (
        <div className="acp-toast acp-toast-error"><BsExclamationCircle className="me-2" />{error}</div>
      )}

      {/* ── Main split panel ── */}
      <div className="acp-main" style={{ height: PANEL_H }}>

        {/* LEFT — student list */}
        <div className="acp-sidebar">
          {/* Sidebar header */}
          <div className="acp-sidebar-hdr">
            <span className="acp-sidebar-title">
              Student Queries
              {totalUnread > 0 && <span className="acp-unread-dot">{totalUnread}</span>}
            </span>
            <button className="acp-icon-btn" onClick={loadQueries} title="Refresh"><BsArrowRight size={13} /></button>
          </div>

          {/* Search */}
          <div className="acp-search-wrap">
            <BsSearch size={12} className="acp-search-icon" />
            <input
              className="acp-search"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter tabs */}
          <div className="acp-tabs">
            {(['all','open','pending','resolved'] as QueryTab[]).map(tab => {
              const count = tab === 'all' ? queries.length : queries.filter(q => q.status === tab).length;
              return (
                <button key={tab} className={`acp-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  <span className="acp-tab-count">{count}</span>
                </button>
              );
            })}
          </div>

          {/* List */}
          <div className="acp-list">
            {filteredQueries.length === 0 ? (
              <div className="acp-empty-list">
                <BsChatDots size={28} /><p>No queries found</p>
              </div>
            ) : filteredQueries.map(q => (
              <div
                key={q._id}
                className={`acp-row ${selectedStudent === q._id ? 'active' : ''} ${q.needsResponse ? 'urgent' : ''}`}
                onClick={() => setSelectedStudent(q._id)}
              >
                <div className="acp-row-avatar">
                  <FaUserGraduate size={14} />
                </div>
                <div className="acp-row-body">
                  <div className="acp-row-top">
                    <span className="acp-row-name">{q.studentName}</span>
                    <span className="acp-row-time">{getTimeAgo(q.lastMessageTime)}</span>
                  </div>
                  <div className="acp-row-preview">{q.lastMessageText || q.lastMessage}</div>
                  <div className="acp-row-bottom">
                    <span className={`acp-status-dot status-${q.status}`}>{q.status}</span>
                    {q.unreadCount > 0 && <span className="acp-badge-red">{q.unreadCount}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — chat area */}
        <div className="acp-chat">
          {selectedStudentInfo ? (
            <>
              {/* Chat header */}
              <div className="acp-chat-hdr">
                <div className="acp-chat-avatar"><FaUserGraduate size={18} /></div>
                <div className="acp-chat-info">
                  <span className="acp-chat-name">{selectedStudentInfo.studentName}</span>
                  <span className={`acp-status-dot status-${selectedStudentInfo.status} ms-2`}>{selectedStudentInfo.status}</span>
                  <span className="acp-chat-meta">{selectedStudentInfo.messageCount} msgs</span>
                </div>
                <div className="ms-auto d-flex gap-2 align-items-center">
                  <Dropdown>
                    <Dropdown.Toggle variant="outline-secondary" size="sm" style={{ borderColor: '#3a3a3a', background: 'transparent', color: '#aaa' }}>
                      <BsThreeDots />
                    </Dropdown.Toggle>
                    <Dropdown.Menu align="end" className="bg-dark border-secondary">
                      <Dropdown.Item onClick={() => updateStatus('open')} className="text-warning"><BsExclamationCircle className="me-2" />Mark as Open</Dropdown.Item>
                      <Dropdown.Item onClick={() => updateStatus('pending')} className="text-info"><BsHourglassSplit className="me-2" />Mark as Pending</Dropdown.Item>
                      <Dropdown.Item onClick={() => updateStatus('resolved')} className="text-success"><BsCheckCircle className="me-2" />Mark as Resolved</Dropdown.Item>
                      <Dropdown.Divider />
                      <Dropdown.Item onClick={() => { setSelectedStudent(null); setMessages([]); }} className="text-danger"><BsTrash className="me-2" />Close Chat</Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </div>
              </div>

              {/* Messages */}
              <div className="acp-messages" ref={messagesContainerRef}>
                {isLoading ? (
                  <div className="acp-msg-center"><Spinner animation="border" style={{ color: '#ff8c00', width: 22, height: 22 }} /></div>
                ) : messages.length === 0 ? (
                  <div className="acp-msg-center">
                    <BsChatDots size={40} style={{ color: '#333' }} />
                    <p style={{ color: '#555', marginTop: 8 }}>No messages yet</p>
                  </div>
                ) : messages.map((msg) => (
                  <div key={msg.id} className={`acp-msg ${msg.sender === 'admin' ? 'out' : 'in'}`}>
                    <div className="acp-bubble">
                      <div className="acp-bubble-sender">
                        {msg.sender === 'student' ? <FaUserGraduate size={10} className="me-1" /> : <FaHeadset size={10} className="me-1" />}
                        {msg.sender === 'student' ? 'Student' : (msg.adminName || 'Support')}
                      </div>
                      <div className="acp-bubble-text">{msg.text}</div>
                      <div className="acp-bubble-meta">
                        <span>{formatTime(msg.timestamp)}</span>
                        {msg.sender === 'admin' && (msg.isDelivered
                          ? <BsCheck2All size={11} style={{ color: '#4ade80' }} />
                          : <BsCheck2 size={11} style={{ color: '#666' }} />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {typingStatus.isTyping && typingStatus.studentId === selectedStudent && (
                  <div className="acp-typing"><span className="dot" /><span className="dot" /><span className="dot" /></div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="acp-input-bar">
                <input
                  ref={inputRef as any}
                  className="acp-input"
                  placeholder="Type a message… (Enter to send)"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendReply()}
                />
                <button className="acp-send-btn" onClick={sendReply} disabled={isSending || !newMessage.trim()}>
                  {isSending ? <Spinner animation="border" size="sm" /> : <BsSend size={15} />}
                </button>
              </div>
            </>
          ) : (
            <div className="acp-msg-center acp-select-prompt">
              <BsChatDots size={52} style={{ color: '#2a2a2a', marginBottom: 12 }} />
              <h6 style={{ color: '#555' }}>Select a Conversation</h6>
              <p style={{ color: '#333', fontSize: 13 }}>Choose a student from the left panel</p>
              {filteredQueries.length > 0 && (
                <button className="acp-open-btn" onClick={() => setSelectedStudent(filteredQueries[0]._id)}>
                  Open Latest Query
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .acp-wrap { padding: 0; display: flex; flex-direction: column; gap: 10px; }

        /* ── Top bar ── */
        .acp-topbar {
          display: flex; align-items: center; justify-content: space-between;
          background: #141414; border: 1px solid #222; border-radius: 12px;
          padding: 8px 16px; gap: 10px; flex-wrap: wrap;
        }
        .acp-topbar-left  { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .acp-topbar-right { display: flex; align-items: center; gap: 8px; }
        .acp-topbar-icon  {
          width: 30px; height: 30px; border-radius: 8px;
          background: rgba(255,140,0,.12); display: flex; align-items: center;
          justify-content: center; color: #ff8c00;
        }
        .acp-topbar-title { color: #fff; font-weight: 700; font-size: .92rem; margin-right: 4px; }
        .acp-stat-pill {
          display: flex; align-items: center; gap: 4px;
          background: #1e1e1e; border: 1px solid #2a2a2a; border-radius: 20px;
          padding: 3px 10px; font-size: .72rem; color: #888;
        }
        .acp-stat-pill b { color: #ccc; }
        .acp-stat-pill.warn  { border-color: #f59e0b33; } .acp-stat-pill.warn b  { color: #f59e0b; }
        .acp-stat-pill.succ  { border-color: #22c55e33; } .acp-stat-pill.succ b  { color: #22c55e; }
        .acp-stat-pill.info  { border-color: #38bdf833; } .acp-stat-pill.info b  { color: #38bdf8; }
        .acp-stat-pill.danger{ border-color: #ef444433; } .acp-stat-pill.danger b{ color: #ef4444; }
        .acp-name-input {
          background: #1e1e1e !important; border: 1px solid #2a2a2a !important;
          color: #ccc !important; border-radius: 8px !important; font-size: .8rem !important;
          width: 160px;
        }
        .acp-online-chip {
          background: rgba(34,197,94,.12); border: 1px solid rgba(34,197,94,.25);
          color: #22c55e; border-radius: 20px; padding: 3px 10px; font-size: .72rem;
          display: flex; align-items: center; gap: 5px; white-space: nowrap;
        }

        /* ── Toast ── */
        .acp-toast {
          padding: 8px 16px; border-radius: 8px; font-size: .82rem;
          display: flex; align-items: center;
        }
        .acp-toast-success { background: rgba(34,197,94,.12); border: 1px solid rgba(34,197,94,.25); color: #22c55e; }
        .acp-toast-error   { background: rgba(239,68,68,.12);  border: 1px solid rgba(239,68,68,.25);  color: #ef4444; }

        /* ── Main panel ── */
        .acp-main {
          display: flex; gap: 0;
          background: #141414; border: 1px solid #222; border-radius: 12px;
          overflow: hidden;
        }

        /* ── Sidebar ── */
        .acp-sidebar {
          width: 300px; min-width: 260px; max-width: 320px; flex-shrink: 0;
          border-right: 1px solid #1e1e1e;
          display: flex; flex-direction: column;
        }
        .acp-sidebar-hdr {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 14px; border-bottom: 1px solid #1e1e1e;
        }
        .acp-sidebar-title { color: #ccc; font-weight: 700; font-size: .85rem; display: flex; align-items: center; gap: 6px; }
        .acp-unread-dot {
          background: #ef4444; color: #fff; border-radius: 20px;
          font-size: .65rem; font-weight: 700; padding: 1px 7px;
        }
        .acp-icon-btn {
          background: none; border: 1px solid #2a2a2a; color: #666;
          border-radius: 6px; padding: 3px 7px; cursor: pointer;
          transition: all .15s;
        }
        .acp-icon-btn:hover { border-color: #ff8c00; color: #ff8c00; }

        .acp-search-wrap {
          position: relative; padding: 8px 10px; border-bottom: 1px solid #1e1e1e;
        }
        .acp-search-icon { position: absolute; left: 18px; top: 50%; transform: translateY(-50%); color: #555; }
        .acp-search {
          width: 100%; background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 8px;
          color: #ccc; font-size: .78rem; padding: 5px 10px 5px 30px; outline: none;
        }
        .acp-search:focus { border-color: #ff8c00; }

        .acp-tabs {
          display: flex; gap: 4px; padding: 8px 10px; border-bottom: 1px solid #1e1e1e;
          overflow-x: auto; scrollbar-width: none;
        }
        .acp-tabs::-webkit-scrollbar { display: none; }
        .acp-tab {
          flex: 1; background: #1e1e1e; border: 1px solid #2a2a2a; border-radius: 6px;
          color: #666; font-size: .7rem; font-weight: 600; padding: 4px 6px;
          cursor: pointer; white-space: nowrap; display: flex; align-items: center;
          justify-content: center; gap: 4px; transition: all .15s;
        }
        .acp-tab:hover { border-color: #ff8c0055; color: #ff8c00; }
        .acp-tab.active { background: #ff8c00; border-color: #ff8c00; color: #fff; }
        .acp-tab-count {
          background: rgba(255,255,255,.15); border-radius: 10px;
          padding: 0 5px; font-size: .65rem;
        }

        .acp-list { flex: 1; overflow-y: auto; scrollbar-width: thin; scrollbar-color: #2a2a2a #141414; }
        .acp-empty-list {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; height: 120px; color: #333; font-size: .8rem; gap: 6px;
        }

        .acp-row {
          display: flex; gap: 10px; padding: 10px 12px;
          border-bottom: 1px solid #1a1a1a; cursor: pointer; transition: background .15s;
        }
        .acp-row:hover { background: rgba(255,140,0,.06); }
        .acp-row.active { background: rgba(255,140,0,.12); border-left: 3px solid #ff8c00; padding-left: 9px; }
        .acp-row.urgent { background: rgba(245,158,11,.06); }
        .acp-row-avatar {
          width: 34px; height: 34px; border-radius: 50%; background: rgba(255,140,0,.1);
          display: flex; align-items: center; justify-content: center; color: #ff8c00;
          flex-shrink: 0; margin-top: 2px;
        }
        .acp-row-body { flex: 1; min-width: 0; }
        .acp-row-top { display: flex; justify-content: space-between; margin-bottom: 2px; }
        .acp-row-name { color: #ddd; font-weight: 600; font-size: .8rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .acp-row-time { color: #444; font-size: .68rem; flex-shrink: 0; margin-left: 4px; }
        .acp-row-preview { color: #555; font-size: .72rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 4px; }
        .acp-row-bottom { display: flex; align-items: center; gap: 6px; }

        .acp-status-dot {
          font-size: .65rem; font-weight: 700; text-transform: capitalize;
          padding: 1px 7px; border-radius: 10px;
        }
        .status-open     { background: rgba(245,158,11,.15); color: #f59e0b; }
        .status-pending  { background: rgba(56,189,248,.15);  color: #38bdf8; }
        .status-resolved { background: rgba(34,197,94,.15);   color: #22c55e; }
        .acp-badge-red {
          background: #ef4444; color: #fff; font-size: .65rem;
          font-weight: 700; border-radius: 10px; padding: 1px 6px;
        }

        /* ── Chat panel ── */
        .acp-chat { flex: 1; display: flex; flex-direction: column; min-width: 0; }

        .acp-chat-hdr {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 16px; border-bottom: 1px solid #1e1e1e;
          background: #141414; flex-shrink: 0;
        }
        .acp-chat-avatar {
          width: 36px; height: 36px; border-radius: 50%;
          background: rgba(255,140,0,.15); display: flex; align-items: center;
          justify-content: center; color: #ff8c00; flex-shrink: 0;
        }
        .acp-chat-info { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .acp-chat-name { color: #fff; font-weight: 700; font-size: .88rem; }
        .acp-chat-meta { color: #444; font-size: .72rem; }

        .acp-messages {
          flex: 1; overflow-y: auto; padding: 14px 16px;
          background: #111; scrollbar-width: thin; scrollbar-color: #2a2a2a #111;
          display: flex; flex-direction: column; gap: 2px;
        }
        .acp-msg-center {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center; text-align: center;
        }
        .acp-select-prompt { gap: 4px; }
        .acp-open-btn {
          margin-top: 8px; background: #ff8c00; border: none; color: #fff;
          border-radius: 8px; padding: 6px 18px; font-size: .82rem;
          font-weight: 600; cursor: pointer;
        }

        .acp-msg { display: flex; margin-bottom: 10px; }
        .acp-msg.in  { justify-content: flex-start; }
        .acp-msg.out { justify-content: flex-end; }
        .acp-bubble {
          max-width: 68%; padding: 8px 12px; border-radius: 12px;
          background: #1e1e1e; color: #ddd;
        }
        .acp-msg.out .acp-bubble { background: #ff8c00; color: #fff; }
        .acp-bubble-sender { font-size: .65rem; opacity: .7; margin-bottom: 3px; display: flex; align-items: center; }
        .acp-bubble-text { font-size: .83rem; word-wrap: break-word; line-height: 1.45; }
        .acp-bubble-meta {
          font-size: .62rem; opacity: .65; margin-top: 4px;
          display: flex; justify-content: flex-end; align-items: center; gap: 3px;
        }

        .acp-typing {
          display: flex; gap: 4px; padding: 8px 12px; background: #1e1e1e;
          border-radius: 12px; width: fit-content; margin-bottom: 8px;
        }
        .dot {
          width: 6px; height: 6px; background: #555; border-radius: 50%;
          animation: acp-bounce 1.4s infinite;
        }
        .dot:nth-child(2) { animation-delay: .2s; }
        .dot:nth-child(3) { animation-delay: .4s; }
        @keyframes acp-bounce {
          0%,60%,100% { transform: translateY(0); opacity:.4; }
          30% { transform: translateY(-5px); opacity:1; }
        }

        .acp-input-bar {
          display: flex; gap: 8px; padding: 10px 14px;
          border-top: 1px solid #1e1e1e; background: #141414; flex-shrink: 0;
        }
        .acp-input {
          flex: 1; background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 10px;
          color: #ccc; font-size: .84rem; padding: 8px 14px; outline: none;
          transition: border-color .15s;
        }
        .acp-input:focus { border-color: #ff8c00; }
        .acp-send-btn {
          background: #ff8c00; border: none; color: #fff; border-radius: 10px;
          width: 40px; height: 40px; display: flex; align-items: center;
          justify-content: center; cursor: pointer; flex-shrink: 0;
          transition: background .15s;
        }
        .acp-send-btn:hover:not(:disabled) { background: #e67e00; }
        .acp-send-btn:disabled { opacity: .4; cursor: not-allowed; }

        .bg-orange { background-color: #ff8c00; }
        .bg-dark-lighter { background-color: #2a2a2a; }
        .text-orange { color: #ff8c00; }
      `}</style>
    </div>
  );
};

export default AdminChatPanel;