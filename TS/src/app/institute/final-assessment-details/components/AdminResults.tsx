import React, { useEffect, useState } from 'react';
import {
  Table, Badge, Modal, Spinner, Alert, Form, Button
} from 'react-bootstrap';
import {
  FaEye, FaCheckCircle, FaTimesCircle, FaClock,
  FaVideo, FaFilter, FaSearch, FaChartLine,
  FaUserGraduate, FaExternalLinkAlt,
  FaCheckDouble, FaFileExport, FaGraduationCap,
  FaTrophy, FaUsers, FaAward, FaCalendarAlt,
  FaUser, FaEnvelope, FaBookOpen, FaPercent,
  FaPlay, FaStop
} from 'react-icons/fa';
import { useAuthContext } from '@/context/useAuthContext';
import axios from 'axios';

interface Result {
  _id: string;
  student: {
    id: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
  exam: {
    id: string;
    title: string;
  };
  status: string;
  resultStatus: string;
  approvalStatus: string;
  totalScore: number;
  finalPercentage: number;
  completedRounds: string[];
  roundResults: any[];
  mcqResult: any;
  trResult: any;
  hrResult: any;
  codingResult: any;
  recordings: any;
  createdAt: string;
  updatedAt: string;
}

const AdminResults: React.FC = () => {
  const { user } = useAuthContext();
  const token = user?.token;
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedResult, setSelectedResult] = useState<Result | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveComments, setApproveComments] = useState('');
  const [approving, setApproving] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([]);
  const [showBulkApproveModal, setShowBulkApproveModal] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    roundType: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchResults();
    fetchStats();
  }, [currentPage, filters.search, filters.status, filters.roundType]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${baseURL}/api/assessment/admin/results`, {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: filters.search,
          status: filters.status,
          roundType: filters.roundType
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        const validResults = response.data.data.filter(
          (r: Result) => r.student?.name !== 'N/A' && r.student?.email !== 'N/A'
        );
        setResults(validResults);
        setTotalPages(response.data.totalPages);
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.response?.data?.error || 'Failed to fetch results');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${baseURL}/api/assessment/admin/results/stats/summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleApprove = async (status: 'approved' | 'rejected') => {
    if (!selectedResult) return;
    
    try {
      setApproving(true);
      const response = await axios.put(
        `${baseURL}/api/assessment/admin/results/${selectedResult._id}/approve`,
        { approvalStatus: status, comments: approveComments },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        await fetchResults();
        await fetchStats();
        setShowApproveModal(false);
        setSelectedResult(null);
        setApproveComments('');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update approval status');
    } finally {
      setApproving(false);
    }
  };

  const handleBulkApprove = async (status: 'approved' | 'rejected') => {
    if (selectedSubmissions.length === 0) return;
    
    try {
      setApproving(true);
      const response = await axios.post(
        `${baseURL}/api/assessment/admin/results/bulk-approve`,
        { 
          submissionIds: selectedSubmissions, 
          approvalStatus: status,
          comments: approveComments 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        await fetchResults();
        await fetchStats();
        setShowBulkApproveModal(false);
        setSelectedSubmissions([]);
        setApproveComments('');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to bulk approve');
    } finally {
      setApproving(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedSubmissions.length === results.length && results.length > 0) {
      setSelectedSubmissions([]);
    } else {
      setSelectedSubmissions(results.map(r => r._id));
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedSubmissions.includes(id)) {
      setSelectedSubmissions(selectedSubmissions.filter(s => s !== id));
    } else {
      setSelectedSubmissions([...selectedSubmissions, id]);
    }
  };

  const exportCSV = async () => {
    try {
      const response = await axios.get(`${baseURL}/api/assessment/admin/results/export/csv`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'exam-results.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to export CSV');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      'in-progress': 'warning',
      'completed': 'success',
      'pending': 'info',
      'failed': 'danger',
      'passed': 'success'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const getApprovalBadge = (status: string) => {
    switch(status) {
      case 'approved':
        return <Badge bg="success"><FaCheckCircle className="me-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge bg="danger"><FaTimesCircle className="me-1" /> Rejected</Badge>;
      default:
        return <Badge bg="warning"><FaClock className="me-1" /> Pending</Badge>;
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 70) return 'text-success';
    if (percentage >= 50) return 'text-warning';
    return 'text-danger';
  };

  const formatDate = (date: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="admin-results-container">
      {/* Header */}
      <div className="header-section">
        <h1 className="page-title">
          <FaGraduationCap className="title-icon" />
          Assessment Results Dashboard
        </h1>
        <p className="page-subtitle">Monitor and manage student assessment submissions</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="stats-wrapper">
          <div className="stat-card">
            <div className="stat-icon"><FaUsers /></div>
            <div className="stat-info">
              <span>Total Submissions</span>
              <strong>{stats.totalSubmissions || 0}</strong>
            </div>
          </div>
          
          <div className="stat-card success">
            <div className="stat-icon"><FaTrophy /></div>
            <div className="stat-info">
              <span>Passed</span>
              <strong>{stats.passedSubmissions || 0}</strong>
            </div>
          </div>
          
          <div className="stat-card danger">
            <div className="stat-icon"><FaTimesCircle /></div>
            <div className="stat-info">
              <span>Failed</span>
              <strong>{stats.failedSubmissions || 0}</strong>
            </div>
          </div>
          
          <div className="stat-card warning">
            <div className="stat-icon"><FaClock /></div>
            <div className="stat-info">
              <span>Pending Approval</span>
              <strong>{stats.pendingApproval || 0}</strong>
            </div>
          </div>
          
          <div className="stat-card info">
            <div className="stat-icon"><FaAward /></div>
            <div className="stat-info">
              <span>Avg Score</span>
              <strong>{stats.averagePercentage?.toFixed(1) || 0}%</strong>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="filters-bar">
        <div className="filters-group">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by student name or email..."
              value={filters.search}
              onChange={(e) => {
                setFilters({...filters, search: e.target.value});
                setCurrentPage(1);
              }}
            />
          </div>
          
          <select
            value={filters.status}
            onChange={(e) => {
              setFilters({...filters, status: e.target.value});
              setCurrentPage(1);
            }}
          >
            <option value="">All Results</option>
            <option value="passed">Passed</option>
            <option value="failed">Failed</option>
          </select>
          
          <select
            value={filters.roundType}
            onChange={(e) => {
              setFilters({...filters, roundType: e.target.value});
              setCurrentPage(1);
            }}
          >
            <option value="">All Rounds</option>
            <option value="mcq">MCQ</option>
            <option value="tr">Technical Round</option>
            <option value="hr">HR Round</option>
            <option value="coding">Coding</option>
          </select>
          
          <button className="clear-btn" onClick={() => {
            setFilters({search: '', status: '', roundType: ''});
            setCurrentPage(1);
          }}>
            <FaFilter /> Clear
          </button>
          
          <button className="export-btn" onClick={exportCSV}>
            <FaFileExport /> Export
          </button>
        </div>
        
        {selectedSubmissions.length > 0 && (
          <div className="bulk-actions">
            <button className="bulk-approve-btn" onClick={() => setShowBulkApproveModal(true)}>
              <FaCheckDouble /> Bulk Approve ({selectedSubmissions.length})
            </button>
          </div>
        )}
      </div>

      {/* Results Table */}
      <div className="table-wrapper">
        {loading ? (
          <div className="loading-state">
            <Spinner animation="border" variant="warning" />
            <p>Loading results...</p>
          </div>
        ) : error ? (
          <Alert variant="danger">{error}</Alert>
        ) : results.length === 0 ? (
          <div className="empty-state">
            <p>No results found</p>
          </div>
        ) : (
          <>
            <table className="results-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={selectedSubmissions.length === results.length && results.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th>Student</th>
                  <th>Email</th>
                  <th>Exam</th>
                  <th>Rounds</th>
                  <th>Score</th>
                  <th>Percentage</th>
                  <th>Result</th>
                  <th>Approval</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result) => (
                  <tr key={result._id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedSubmissions.includes(result._id)}
                        onChange={() => handleSelectOne(result._id)}
                      />
                    </td>
                    <td>
                      <div className="student-cell">
                        <div className="student-avatar">
                          {result.student.name?.charAt(0) || '?'}
                        </div>
                        <span className="student-name">{result.student.name || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="email-cell">{result.student.email || 'N/A'}</td>
                    <td className="exam-cell">{result.exam.title}</td>
                    <td>
                      <div className="rounds-badges">
                        {result.completedRounds?.map(round => (
                          <span key={round} className="round-badge">{round.toUpperCase()}</span>
                        ))}
                      </div>
                    </td>
                    <td className="score-cell">{result.totalScore || 0}</td>
                    <td className={`percentage-cell ${getScoreColor(result.finalPercentage)}`}>
                      {result.finalPercentage?.toFixed(1) || 0}%
                    </td>
                    <td>{getStatusBadge(result.resultStatus)}</td>
                    <td>{getApprovalBadge(result.approvalStatus)}</td>
                    <td className="date-cell">
                      <FaCalendarAlt className="me-1" />
                      {formatDate(result.createdAt)}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="view-btn"
                          onClick={() => {
                            setSelectedResult(result);
                            setShowDetailsModal(true);
                          }}
                        >
                          <FaEye /> View
                        </button>
                        {result.approvalStatus === 'pending' && (
                          <button
                            className="approve-btn"
                            onClick={() => {
                              setSelectedResult(result);
                              setShowApproveModal(true);
                            }}
                          >
                            <FaCheckCircle /> Approve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination-wrapper">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p-1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      className={pageNum === currentPage ? 'active' : ''}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Professional Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg" centered className="professional-modal">
        <Modal.Header closeButton className="modal-header-custom">
          <Modal.Title className="modal-title-custom">
            <FaUserGraduate className="me-2" />
            Student Result Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-body-custom">
          {selectedResult && (
            <div>
              {/* Student Info Card */}
              <div className="info-card">
                <h5 className="section-title">
                  <FaUser className="me-2" /> Student Information
                </h5>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Full Name:</span>
                    <span className="info-value">{selectedResult.student.name || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Email Address:</span>
                    <span className="info-value">{selectedResult.student.email || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Exam Title:</span>
                    <span className="info-value">{selectedResult.exam.title}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Submission Date:</span>
                    <span className="info-value">{formatDate(selectedResult.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Round Results */}
              <div className="rounds-card">
                <h5 className="section-title">
                  <FaBookOpen className="me-2" /> Round Results
                </h5>
                <div className="rounds-grid">
                  {selectedResult.mcqResult && (
                    <div className="round-item mcq">
                      <div className="round-icon">📝</div>
                      <div className="round-details">
                        <div className="round-name">MCQ Round</div>
                        <div className="round-score">
                          Score: {selectedResult.mcqResult.score}/{selectedResult.mcqResult.total}
                        </div>
                        <div className="round-percentage">
                          {selectedResult.mcqResult.percentage?.toFixed(1)}%
                        </div>
                        <Badge bg={selectedResult.mcqResult.passed ? 'success' : 'danger'}>
                          {selectedResult.mcqResult.passed ? 'Passed' : 'Failed'}
                        </Badge>
                      </div>
                    </div>
                  )}
                  
                  {selectedResult.trResult && (
                    <div className="round-item tr">
                      <div className="round-icon">💻</div>
                      <div className="round-details">
                        <div className="round-name">Technical Round</div>
                        <div className="round-score">
                          Score: {selectedResult.trResult.score}/{selectedResult.trResult.total}
                        </div>
                        <div className="round-percentage">
                          {selectedResult.trResult.percentage?.toFixed(1)}%
                        </div>
                        <Badge bg={selectedResult.trResult.passed ? 'success' : 'danger'}>
                          {selectedResult.trResult.passed ? 'Passed' : 'Failed'}
                        </Badge>
                      </div>
                    </div>
                  )}
                  
                  {selectedResult.hrResult && (
                    <div className="round-item hr">
                      <div className="round-icon">👔</div>
                      <div className="round-details">
                        <div className="round-name">HR Round</div>
                        <div className="round-score">
                          Score: {selectedResult.hrResult.score}/{selectedResult.hrResult.total}
                        </div>
                        <div className="round-percentage">
                          {selectedResult.hrResult.percentage?.toFixed(1)}%
                        </div>
                        <Badge bg={selectedResult.hrResult.passed ? 'success' : 'danger'}>
                          {selectedResult.hrResult.passed ? 'Passed' : 'Failed'}
                        </Badge>
                      </div>
                    </div>
                  )}
                  
                  {selectedResult.codingResult && (
                    <div className="round-item coding">
                      <div className="round-icon">⌨️</div>
                      <div className="round-details">
                        <div className="round-name">Coding Round</div>
                        <div className="round-score">
                          Score: {selectedResult.codingResult.score}/{selectedResult.codingResult.total}
                        </div>
                        <div className="round-percentage">
                          {selectedResult.codingResult.percentage?.toFixed(1)}%
                        </div>
                        <Badge bg={selectedResult.codingResult.passed ? 'success' : 'danger'}>
                          {selectedResult.codingResult.passed ? 'Passed' : 'Failed'}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Video Recordings */}
              {selectedResult.recordings && Object.keys(selectedResult.recordings).length > 0 && (
                <div className="recordings-card">
                  <h5 className="section-title">
                    <FaVideo className="me-2" /> Session Recordings
                  </h5>
                  {Object.entries(selectedResult.recordings).map(([round, recording]: [string, any]) => (
                    recording?.videoUrl && (
                      <div key={round} className="video-item">
                        <div className="video-header">
                          <span className="video-round">{round.toUpperCase()} Recording</span>
                          <a href={recording.videoUrl} target="_blank" rel="noopener noreferrer" className="video-link">
                            <FaExternalLinkAlt /> Open in new tab
                          </a>
                        </div>
                        <video controls className="video-player">
                          <source src={recording.videoUrl} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    )
                  ))}
                </div>
              )}

              {/* Overall Result */}
              <div className="overall-card">
                <h5 className="section-title">
                  <FaTrophy className="me-2" /> Overall Result
                </h5>
                <div className={`overall-result ${selectedResult.resultStatus}`}>
                  <div className="result-status">
                    <strong>Status:</strong> {selectedResult.resultStatus?.toUpperCase()}
                  </div>
                  <div className="result-score">
                    <strong>Total Score:</strong> {selectedResult.totalScore}
                  </div>
                  <div className="result-percentage">
                    <strong>Percentage:</strong> {selectedResult.finalPercentage?.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="modal-footer-custom">
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)} className="close-modal-btn">
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Single Approve Modal */}
      <Modal show={showApproveModal} onHide={() => setShowApproveModal(false)} centered className="professional-modal">
        <Modal.Header closeButton className="modal-header-custom">
          <Modal.Title className="modal-title-custom">
            <FaCheckCircle className="me-2" />
            Approve/Reject Submission
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-body-custom">
          {selectedResult && (
            <>
              <div className="info-card compact">
                <div className="info-item">
                  <span className="info-label">Student:</span>
                  <span className="info-value">{selectedResult.student.name || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Exam:</span>
                  <span className="info-value">{selectedResult.exam.title}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Score:</span>
                  <span className="info-value">{selectedResult.totalScore || 0} ({selectedResult.finalPercentage?.toFixed(1) || 0}%)</span>
                </div>
              </div>
              <Form.Group className="mt-3">
                <Form.Label className="comment-label">Comments (Optional)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={approveComments}
                  onChange={(e) => setApproveComments(e.target.value)}
                  placeholder="Add any comments about this submission..."
                  className="comment-input"
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="modal-footer-custom">
          <Button variant="danger" onClick={() => handleApprove('rejected')} disabled={approving} className="reject-modal-btn">
            <FaTimesCircle className="me-1" /> Reject
          </Button>
          <Button variant="success" onClick={() => handleApprove('approved')} disabled={approving} className="approve-modal-btn">
            {approving ? <Spinner size="sm" className="me-1" /> : <FaCheckCircle className="me-1" />}
            Approve
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Bulk Approve Modal */}
      <Modal show={showBulkApproveModal} onHide={() => setShowBulkApproveModal(false)} centered className="professional-modal">
        <Modal.Header closeButton className="modal-header-custom">
          <Modal.Title className="modal-title-custom">
            <FaCheckDouble className="me-2" />
            Bulk Approve Submissions
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-body-custom">
          <p>You are about to approve <strong>{selectedSubmissions.length}</strong> submissions.</p>
          <Form.Group className="mt-3">
            <Form.Label className="comment-label">Comments (Optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={approveComments}
              onChange={(e) => setApproveComments(e.target.value)}
              placeholder="Add comments for all selected submissions..."
              className="comment-input"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="modal-footer-custom">
          <Button variant="danger" onClick={() => handleBulkApprove('rejected')} disabled={approving} className="reject-modal-btn">
            <FaTimesCircle className="me-1" /> Reject All
          </Button>
          <Button variant="success" onClick={() => handleBulkApprove('approved')} disabled={approving} className="approve-modal-btn">
            {approving ? <Spinner size="sm" className="me-1" /> : <FaCheckCircle className="me-1" />}
            Approve All
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .admin-results-container {
          padding: 24px;
          background: #0a0a0a;
          min-height: 100vh;
        }

        .header-section {
          text-align: center;
          margin-bottom: 32px;
        }

        .page-title {
          color: #ffffff;
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }

        .title-icon {
          color: #ff7a00;
          font-size: 32px;
        }

        .page-subtitle {
          color: #8a8a8a;
          font-size: 14px;
        }

        .stats-wrapper {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: nowrap;
          overflow-x: auto;
        }

        .stat-card {
          flex: 1;
          min-width: 180px;
          background: #1a1a1a;
          border: 1px solid #2c2c2c;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          border-color: #ff7a00;
          transform: translateY(-2px);
        }

        .stat-icon {
          font-size: 32px;
          color: #ff7a00;
        }

        .stat-info {
          display: flex;
          flex-direction: column;
        }

        .stat-info span {
          font-size: 12px;
          color: #8a8a8a;
        }

        .stat-info strong {
          font-size: 24px;
          font-weight: 700;
          color: #ffffff;
        }

        .filters-bar {
          background: #1a1a1a;
          border: 1px solid #2c2c2c;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 24px;
        }

        .filters-group {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          align-items: center;
        }

        .search-box {
          flex: 1;
          min-width: 200px;
          display: flex;
          align-items: center;
          background: #0a0a0a;
          border: 1px solid #2c2c2c;
          border-radius: 8px;
          padding: 8px 12px;
        }

        .search-icon {
          color: #ff7a00;
          margin-right: 8px;
        }

        .search-box input {
          flex: 1;
          background: transparent;
          border: none;
          color: #ffffff;
          outline: none;
        }

        select {
          background: #0a0a0a;
          border: 1px solid #2c2c2c;
          border-radius: 8px;
          padding: 8px 12px;
          color: #ffffff;
          cursor: pointer;
        }

        .clear-btn, .export-btn {
          background: transparent;
          border: 1px solid #ff7a00;
          border-radius: 8px;
          padding: 8px 16px;
          color: #ff7a00;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .clear-btn:hover, .export-btn:hover {
          background: #ff7a00;
          color: #000000;
        }

        .export-btn {
          background: #ff7a00;
          color: #000000;
          border: none;
        }

        .bulk-actions {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #2c2c2c;
        }

        .bulk-approve-btn {
          background: #ff7a00;
          border: none;
          border-radius: 8px;
          padding: 8px 16px;
          color: #000000;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .table-wrapper {
          background: #1a1a1a;
          border: 1px solid #2c2c2c;
          border-radius: 12px;
          overflow-x: auto;
        }

        .results-table {
          width: 100%;
          border-collapse: collapse;
        }

        .results-table th,
        .results-table td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid #2c2c2c;
        }

        .results-table th {
          background: #0d0d0d;
          color: #ff7a00;
          font-weight: 600;
          font-size: 13px;
        }

        .results-table td {
          color: #e0e0e0;
          font-size: 14px;
        }

        .results-table tr:hover {
          background: #252525;
        }

        input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
          accent-color: #ff7a00;
        }

        .student-cell {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .student-avatar {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #ff7a00, #ff944d);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 14px;
        }

        .student-name {
          font-weight: 500;
          color: #ffffff;
        }

        .email-cell {
          color: #8a8a8a;
          font-size: 13px;
        }

        .exam-cell {
          font-weight: 500;
          color: #ff7a00;
        }

        .rounds-badges {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .round-badge {
          background: rgba(255, 122, 0, 0.2);
          color: #ff7a00;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        }

        .score-cell {
          font-weight: 700;
          color: #ff7a00;
        }

        .percentage-cell {
          font-weight: 700;
        }

        .date-cell {
          font-size: 12px;
          color: #8a8a8a;
          white-space: nowrap;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
        }

        .view-btn, .approve-btn {
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.3s ease;
        }

        .view-btn {
          background: transparent;
          border: 1px solid #ff7a00;
          color: #ff7a00;
        }

        .view-btn:hover {
          background: #ff7a00;
          color: #000000;
        }

        .approve-btn {
          background: #28a745;
          border: none;
          color: white;
        }

        .approve-btn:hover {
          background: #218838;
        }

        .pagination-wrapper {
          display: flex;
          justify-content: center;
          gap: 8px;
          padding: 20px;
        }

        .pagination-wrapper button {
          background: #0a0a0a;
          border: 1px solid #2c2c2c;
          border-radius: 6px;
          padding: 6px 12px;
          color: #ffffff;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .pagination-wrapper button:hover:not(:disabled) {
          border-color: #ff7a00;
          color: #ff7a00;
        }

        .pagination-wrapper button.active {
          background: #ff7a00;
          border-color: #ff7a00;
          color: #000000;
        }

        .loading-state, .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #8a8a8a;
        }

        /* Professional Modal Styles */
        .professional-modal .modal-content {
          background: #1a1a1a;
          border: 1px solid #2c2c2c;
          border-radius: 16px;
        }

        .modal-header-custom {
          border-bottom: 1px solid #2c2c2c;
          padding: 20px 24px;
          background: #0d0d0d;
          border-radius: 16px 16px 0 0;
        }

        .modal-title-custom {
          color: #ff7a00;
          font-weight: 700;
          font-size: 20px;
          display: flex;
          align-items: center;
        }

        .modal-body-custom {
          padding: 24px;
          color: #e0e0e0;
          max-height: 70vh;
          overflow-y: auto;
        }

        .modal-footer-custom {
          border-top: 1px solid #2c2c2c;
          padding: 16px 24px;
          background: #0d0d0d;
          border-radius: 0 0 16px 16px;
        }

        .info-card, .rounds-card, .recordings-card, .overall-card {
          background: #0a0a0a;
          border: 1px solid #2c2c2c;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .info-card.compact {
          padding: 16px;
        }

        .section-title {
          color: #ff7a00;
          font-weight: 600;
          font-size: 16px;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 1px solid #2c2c2c;
          display: flex;
          align-items: center;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #2c2c2c;
        }

        .info-label {
          font-size: 13px;
          color: #8a8a8a;
          font-weight: 500;
        }

        .info-value {
          font-size: 13px;
          color: #ffffff;
          font-weight: 600;
        }

        .rounds-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .round-item {
          background: #1a1a1a;
          border: 1px solid #2c2c2c;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.3s ease;
        }

        .round-item:hover {
          border-color: #ff7a00;
          transform: translateY(-2px);
        }

        .round-icon {
          font-size: 32px;
        }

        .round-details {
          flex: 1;
        }

        .round-name {
          font-weight: 600;
          color: #ff7a00;
          margin-bottom: 4px;
        }

        .round-score {
          font-size: 12px;
          color: #8a8a8a;
          margin-bottom: 4px;
        }

        .round-percentage {
          font-size: 18px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 8px;
        }

        .video-item {
          margin-bottom: 16px;
        }

        .video-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .video-round {
          font-weight: 600;
          color: #ff7a00;
        }

        .video-link {
          color: #ff7a00;
          text-decoration: none;
          font-size: 12px;
        }

        .video-link:hover {
          text-decoration: underline;
        }

        .video-player {
          width: 100%;
          border-radius: 8px;
          background: #000000;
        }

        .overall-result {
          text-align: center;
          padding: 16px;
          border-radius: 12px;
          display: flex;
          justify-content: space-around;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }

        .overall-result.passed {
          background: rgba(40, 167, 69, 0.1);
          border: 1px solid #28a745;
        }

        .overall-result.failed {
          background: rgba(220, 53, 69, 0.1);
          border: 1px solid #dc3545;
        }

        .result-status, .result-score, .result-percentage {
          font-size: 14px;
          color: #ffffff;
        }

        .comment-label {
          color: #ff7a00;
          font-weight: 500;
          margin-bottom: 8px;
        }

        .comment-input {
          background: #0a0a0a;
          border: 1px solid #2c2c2c;
          color: #ffffff;
        }

        .comment-input:focus {
          background: #0a0a0a;
          border-color: #ff7a00;
          color: #ffffff;
          box-shadow: none;
        }

        .approve-modal-btn {
          background: #ff7a00;
          border: none;
          color: #000000;
          font-weight: 600;
        }

        .approve-modal-btn:hover {
          background: #e66a00;
        }

        .reject-modal-btn {
          background: #dc3545;
          border: none;
        }

        .close-modal-btn {
          background: #2c2c2c;
          border: none;
          color: #ffffff;
        }

        .close-modal-btn:hover {
          background: #3a3a3a;
        }

        @media (max-width: 768px) {
          .admin-results-container {
            padding: 16px;
          }
          
          .stats-wrapper {
            flex-wrap: wrap;
          }
          
          .stat-card {
            min-width: calc(50% - 8px);
          }
          
          .filters-group {
            flex-direction: column;
          }
          
          .search-box, select, .clear-btn, .export-btn {
            width: 100%;
          }

          .info-grid {
            grid-template-columns: 1fr;
          }

          .rounds-grid {
            grid-template-columns: 1fr;
          }

          .overall-result {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminResults;