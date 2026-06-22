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

interface LiveStudent {
  studentId: string;
  name: string;
  email: string;
  status: string;
  joinedAt: string;
  lastSeenAt?: string;
}

const AdminResults: React.FC<{ defaultExamId?: string; hideHeader?: boolean; hideExamSelector?: boolean; filterRoundType?: string }> = ({ defaultExamId, hideHeader, hideExamSelector, filterRoundType }) => {
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
    roundType: filterRoundType || ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 30;
  const [exams, setExams] = useState<{ id: string; title: string }[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const examsLoadedRef = React.useRef(false);
  const [showLiveStudentsModal, setShowLiveStudentsModal] = useState(false);
  const [liveStudents, setLiveStudents] = useState<LiveStudent[]>([]);
  const [selectedLiveExamId, setSelectedLiveExamId] = useState<string>('');
  const [liveStudentsLoading, setLiveStudentsLoading] = useState(false);
  const [liveStudentsError, setLiveStudentsError] = useState('');

  // Detailed answers state
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailedAnswers, setDetailedAnswers] = useState<any[]>([]);
  const [englishAnswers, setEnglishAnswers] = useState<any[]>([]);
  const [detailTab, setDetailTab] = useState<'overview' | 'mcq' | 'english'>('overview');

  useEffect(() => {
    fetchStats(selectedExamId || undefined);
  }, [selectedExamId]);

  useEffect(() => {
    if (filterRoundType !== undefined) {
      setFilters(f => ({ ...f, roundType: filterRoundType }));
    }
  }, [filterRoundType]);

  // Poll for live students when modal is open
  useEffect(() => {
    if (showLiveStudentsModal && selectedLiveExamId) {
      const pollInterval = setInterval(() => {
        fetchLiveStudents(undefined, true);
      }, 3000); // Poll every 3 seconds
      return () => clearInterval(pollInterval);
    }
  }, [showLiveStudentsModal, selectedLiveExamId]);

  useEffect(() => {
    fetchResults();
  }, [currentPage, filters.search, filters.status, filters.roundType, selectedExamId]);

  const fetchLiveStudents = async (examId?: string, isBackgroundPoll = false) => {
    const targetExamId = examId || selectedLiveExamId;
    if (!targetExamId || !token) return;
    try {
      if (!isBackgroundPoll) {
        setLiveStudentsLoading(true);
      }
      setLiveStudentsError('');
      const response = await axios.get(
        `${baseURL}/api/assessment/admin/exams/${targetExamId}/live-students`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const payload = response.data?.data ?? response.data?.students ?? response.data?.liveStudents ?? [];

      if (response.data?.success && Array.isArray(payload)) {
        // Normalize multiple backend shapes into one structure the UI can render safely.
        const normalizedStudents: LiveStudent[] = payload.map((entry: any, idx: number) => {
          const studentId =
            entry?.studentId ||
            entry?.student?._id ||
            entry?.student?.id ||
            entry?.userId ||
            entry?._id ||
            `temp-${idx}`;

          const name =
            entry?.name ||
            entry?.studentName ||
            entry?.student?.name ||
            'N/A';

          const email =
            entry?.email ||
            entry?.studentEmail ||
            entry?.student?.email ||
            'N/A';

          const status =
            entry?.status ||
            entry?.examStatus ||
            'in-progress';

          const joinedAt =
            entry?.joinedAt ||
            entry?.startedAt ||
            entry?.startTime ||
            entry?.createdAt ||
            new Date().toISOString();

          const lastSeenAt =
            entry?.lastSeenAt ||
            entry?.updatedAt ||
            null;

          return { studentId, name, email, status, joinedAt, lastSeenAt };
        });

        setLiveStudents((prevStudents) => {
          // First load: oldest at top, newest at bottom.
          if (!prevStudents.length) {
            return normalizedStudents.sort(
              (a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
            );
          }

          const incomingById = new Map(normalizedStudents.map((s) => [s.studentId, s]));
          const merged: LiveStudent[] = [];

          // Keep current rows stable and only update changed fields.
          prevStudents.forEach((existing) => {
            const latest = incomingById.get(existing.studentId);
            if (latest) {
              merged.push({ ...existing, ...latest });
              incomingById.delete(existing.studentId);
            }
          });

          // Append only newly joined students at the bottom.
          const newcomers = Array.from(incomingById.values()).sort(
            (a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
          );

          return [...merged, ...newcomers];
        });
      } else {
        setLiveStudents([]);
        setLiveStudentsError('Live students API response format is invalid.');
      }
    } catch (err: any) {
      console.error('Failed to fetch live students:', err);
      setLiveStudents([]);
      setLiveStudentsError(err?.response?.data?.error || 'Failed to fetch live students.');
    } finally {
      if (!isBackgroundPoll) {
        setLiveStudentsLoading(false);
      }
    }
  };

  const openLiveStudentsModal = (examId: string) => {
    setSelectedLiveExamId(examId);
    setShowLiveStudentsModal(true);
    setLiveStudentsError('');
    fetchLiveStudents(examId);
  };

  const fetchResults = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await axios.get(`${baseURL}/api/assessment/admin/results`, {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: filters.search,
          status: filters.status,
          roundType: filters.roundType,
          examId: selectedExamId || undefined
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        const rawResults: Result[] = Array.isArray(response.data.data) ? response.data.data : [];
        const validResults = rawResults.filter(
          (r: Result) => r.student?.name !== 'N/A' && r.student?.email !== 'N/A'
        );

        // Client-side exam filter — backend may return cross-exam results
        const examFiltered = selectedExamId
          ? validResults.filter((r) => r.exam.id === selectedExamId)
          : validResults;
        setResults(examFiltered);
        setTotalPages(response.data.totalPages);

        // Build exam list only once (from the first unfiltered call).
        // Subsequent filtered calls must NOT overwrite it or the dropdown loses all other options.
        if (!examsLoadedRef.current) {
          const uniqueExams = new Map<string, { id: string; title: string; createdAt?: string }>();
          rawResults.forEach((result: Result) => {
            if (result.exam?.id && !uniqueExams.has(result.exam.id)) {
              uniqueExams.set(result.exam.id, {
                id: result.exam.id,
                title: result.exam.title,
                createdAt: result.createdAt
              });
            }
          });
          const examList = Array.from(uniqueExams.values());
          examList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          setExams(examList);
          examsLoadedRef.current = true;
          // Default to the provided exam or the latest
          if (examList.length > 0) {
            const preselect = defaultExamId && examList.find(e => e.id === defaultExamId)
              ? defaultExamId
              : examList[0].id;
            setSelectedExamId(preselect);
          }
        }
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.response?.data?.error || 'Failed to fetch results');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (examId?: string) => {
    try {
      const response = await axios.get(`${baseURL}/api/assessment/admin/results/stats/summary`, {
        params: examId ? { examId } : {},
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
        await fetchStats(selectedExamId || undefined);
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
        await fetchStats(selectedExamId || undefined);
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

  const formatRelativeDuration = (date: Date) => {
    const diffMs = Date.now() - date.getTime();
    const safeDiffMs = Number.isNaN(diffMs) ? 0 : Math.max(0, diffMs);
    const totalMinutes = Math.floor(safeDiffMs / 60000);

    if (totalMinutes < 1) return 'just now';

    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;

    if (days > 0) {
      return `${days}d ${hours}h ago`;
    }

    if (hours > 0) {
      return `${hours}h ${minutes}m ago`;
    }

    return `${minutes}m ago`;
  };

  const formatJoinedDateTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="admin-results-container">
      {/* Header */}
      {!hideHeader && (
        <div className="header-section">
          <h1 className="page-title">
            <FaGraduationCap className="title-icon" />
            Assessment Results Dashboard
          </h1>
          <p className="page-subtitle">Monitor and manage student assessment submissions</p>
        </div>
      )}

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
          {!hideExamSelector && (
            <select
              value={selectedExamId}
              onChange={(e) => {
                setSelectedExamId(e.target.value);
                setCurrentPage(1);
              }}
              style={{ minWidth: '200px', fontWeight: 600, color: selectedExamId ? '#ff7a00' : '#ffffff' }}
            >
              <option value="">-- Select an Exam --</option>
              {exams.map((exam, idx) => (
                <option key={exam.id} value={exam.id}>
                  {idx === 0 ? `⭐ ${exam.title} (Latest)` : exam.title}
                </option>
              ))}
            </select>
          )}

          {/* <button 
            className="live-btn"
            onClick={() => {
              const targetExamId = selectedExamId || exams[0]?.id;
              if (targetExamId) openLiveStudentsModal(targetExamId);
            }}
            title={exams.length > 0 ? 'View students currently taking this exam' : 'No exams available'}
            disabled={exams.length === 0}
          >
            <span className="live-dot"></span> Live Students
          </button> */}

          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by name or email..."
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
            if (exams.length > 0) setSelectedExamId(exams[0].id);
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
                  <th>Round Results</th>
                  <th>Approval</th>
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
                        <div>
                          <span className="student-name">{result.student.name || 'N/A'}</span>
                          {result.roundResults?.some((r: any) => r.violationAutoSubmit) && (
                            <span style={{
                              display: 'inline-block', marginLeft: '6px',
                              background: 'rgba(220,53,69,0.15)', color: '#dc3545',
                              border: '1px solid rgba(220,53,69,0.4)',
                              borderRadius: '5px', padding: '1px 6px',
                              fontSize: '0.68rem', fontWeight: 700,
                            }}>
                              ⚠ Violation
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="email-cell">{result.student.email || 'N/A'}</td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {(result.roundResults || [])
                          .filter((r: any) => !filterRoundType || r.roundType === filterRoundType)
                          .map((r: any) => {
                          const LABELS: Record<string, string> = { mcq: 'MCQ', coding: 'Code', tr: 'Tech', hr: 'HR', english: 'English' };
                          const label = LABELS[r.roundType] || r.roundType?.toUpperCase();
                          const passed = r.passed;
                          return (
                            <span key={r.roundType} style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              padding: '3px 9px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700,
                              background: passed ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                              color: passed ? '#22c55e' : '#ef4444',
                              border: `1px solid ${passed ? '#22c55e44' : '#ef444444'}`,
                            }}>
                              {passed ? '✓' : '✗'} {label}
                              <span style={{ fontWeight: 400, opacity: 0.8 }}>{r.percentage?.toFixed(0)}%</span>
                            </span>
                          );
                        })}
                        {(!result.roundResults || result.roundResults.length === 0) && (
                          <span style={{ color: '#555', fontSize: '0.78rem' }}>—</span>
                        )}
                      </div>
                    </td>
                    <td>{getApprovalBadge(result.approvalStatus)}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="view-btn"
                          onClick={async () => {
                            setSelectedResult(result);
                            setDetailTab(
                              filterRoundType === 'mcq' ? 'mcq'
                              : filterRoundType === 'english' ? 'english'
                              : 'overview'
                            );
                            setDetailedAnswers([]);
                            setEnglishAnswers([]);
                            setShowDetailsModal(true);
                            setDetailLoading(true);
                            try {
                              const r = await axios.get(`${baseURL}/api/assessment/admin/results/${result._id}`, {
                                headers: { Authorization: `Bearer ${token}` },
                              });
                              if (r.data.success) {
                                setDetailedAnswers(r.data.data.detailedAnswers || []);
                                setEnglishAnswers(r.data.data.englishAnswers || []);
                              }
                            } catch { /* ignore */ }
                            setDetailLoading(false);
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
              {/* ── Tab nav ── */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid #1f1f1f', paddingBottom: 12 }}>
                {[
                  ...(!filterRoundType ? [{ key: 'overview', label: '📊 Overview' }] : []),
                  ...(detailedAnswers.length > 0 && (!filterRoundType || filterRoundType === 'mcq') ? [{ key: 'mcq', label: `📝 MCQ Answers (${detailedAnswers.length})` }] : []),
                  ...(englishAnswers.length > 0 && (!filterRoundType || filterRoundType === 'english') ? [{ key: 'english', label: `🇬🇧 English Answers (${englishAnswers.length})` }] : []),
                  ...(filterRoundType && filterRoundType !== 'mcq' && filterRoundType !== 'english' ? [{ key: 'overview', label: '📊 Overview' }] : []),
                ].map(t => (
                  <button
                    key={t.key}
                    onClick={() => setDetailTab(t.key as any)}
                    style={{
                      padding: '6px 16px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                      background: detailTab === t.key ? '#ff6b35' : 'transparent',
                      border: `1px solid ${detailTab === t.key ? '#ff6b35' : '#2a2a2a'}`,
                      color: detailTab === t.key ? '#000' : '#888',
                    }}
                  >{t.label}</button>
                ))}
                {detailLoading && <span style={{ color: '#666', fontSize: '0.78rem', alignSelf: 'center' }}>Loading answers…</span>}
              </div>

              {/* ── MCQ Answers Tab ── */}
              {detailTab === 'mcq' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {detailedAnswers.map((ans: any, i: number) => (
                    <div key={i} style={{ background: '#0d0d0d', border: `1px solid ${ans.isCorrect === true ? '#22c55420' : ans.isCorrect === false ? '#ef444420' : '#1f1f1f'}`, borderLeft: `3px solid ${ans.isCorrect === true ? '#22c554' : ans.isCorrect === false ? '#ef4444' : '#444'}`, borderRadius: 10, padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 10 }}>
                        <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: '50%', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 800, color: '#666' }}>{i + 1}</span>
                        <p style={{ margin: 0, fontSize: '0.88rem', color: '#e0e0e0', lineHeight: 1.6, fontWeight: 500 }}>{ans.questionText}</p>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {(ans.options || []).map((opt: any) => {
                          const key = opt.key || opt;
                          const text = opt.text || opt;
                          const isSelected = ans.selectedOption === key;
                          const isCorrect = ans.correctAnswer === key;
                          return (
                            <span key={key} style={{ padding: '4px 12px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600, border: `1px solid ${isCorrect ? '#22c554' : isSelected ? '#ef4444' : '#252525'}`, background: isCorrect ? 'rgba(34,197,84,0.1)' : isSelected ? 'rgba(239,68,68,0.1)' : '#111', color: isCorrect ? '#22c554' : isSelected ? '#ef4444' : '#666' }}>
                              {isSelected && !isCorrect && '✗ '}{isCorrect && '✓ '}{key}: {text}
                            </span>
                          );
                        })}
                      </div>
                      {ans.isCorrect === null && <div style={{ fontSize: '0.75rem', color: '#555', marginTop: 6 }}>Answer: {ans.selectedOption || '—'} (auto-correct unavailable)</div>}
                    </div>
                  ))}
                </div>
              )}

              {/* ── English Answers Tab ── */}
              {detailTab === 'english' && (
                englishAnswers.length > 0 ? (
                  <EnglishAnswersView answers={englishAnswers} />
                ) : (
                  (() => {
                    const engResult = (selectedResult.roundResults || []).find((r: any) => r.roundType === 'english');
                    return (
                      <div style={{ padding: '2rem', textAlign: 'center' }}>
                        {engResult ? (
                          <>
                            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🇬🇧</div>
                            <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: 8 }}>
                              Detailed answer breakdown is not available for this submission.
                            </p>
                            <div style={{ display: 'inline-flex', gap: 16, marginTop: 8, background: '#1a1a1a', padding: '12px 24px', borderRadius: 10 }}>
                              <span style={{ color: '#888', fontSize: '0.85rem' }}>Score: <strong style={{ color: '#fff' }}>{engResult.score}/{engResult.total}</strong></span>
                              <span style={{ color: '#888', fontSize: '0.85rem' }}>Percentage: <strong style={{ color: engResult.passed ? '#22c55e' : '#ef4444' }}>{engResult.percentage?.toFixed(1)}%</strong></span>
                              <span style={{ background: engResult.passed ? '#22c55e22' : '#ef444422', color: engResult.passed ? '#22c55e' : '#ef4444', padding: '2px 10px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 700 }}>{engResult.passed ? 'Passed' : 'Failed'}</span>
                            </div>
                          </>
                        ) : (
                          <p style={{ color: '#666', fontSize: '0.9rem' }}>No English round data found.</p>
                        )}
                      </div>
                    );
                  })()
                )
              )}

              {/* ── Overview Tab ── */}
              {detailTab === 'overview' && <>
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
                  {(() => {
                    const ROUND_META: Record<string, { label: string; icon: string; css: string }> = {
                      mcq:     { label: 'MCQ Round',       icon: '📝', css: 'mcq' },
                      coding:  { label: 'Coding Round',    icon: '⌨️', css: 'coding' },
                      tr:      { label: 'Technical Round', icon: '💻', css: 'tr' },
                      hr:      { label: 'HR Round',        icon: '👔', css: 'hr' },
                      english: { label: 'English Round',   icon: '🇬🇧', css: 'english' },
                    };
                    const rounds: any[] = (selectedResult.roundResults || [])
                      .filter((r: any) => !filterRoundType || r.roundType === filterRoundType);
                    if (!rounds.length) return <p style={{ color: '#666', fontSize: '0.85rem' }}>No round results yet.</p>;
                    return rounds.map((r: any) => {
                      const meta = ROUND_META[r.roundType] || { label: r.roundType?.toUpperCase(), icon: '📋', css: 'mcq' };
                      return (
                        <div key={r.roundType} className={`round-item ${meta.css}`}>
                          <div className="round-icon">{meta.icon}</div>
                          <div className="round-details">
                            <div className="round-name">{meta.label}</div>
                            <div className="round-score">Score: {r.score}/{r.total}</div>
                            <div className="round-percentage">{r.percentage?.toFixed(1)}%</div>
                            <Badge bg={r.passed ? 'success' : 'danger'}>
                              {r.passed ? 'Passed' : 'Failed'}
                            </Badge>
                            {r.violationAutoSubmit && (
                              <span style={{ display: 'block', marginTop: 4, fontSize: '0.72rem', color: '#ef4444' }}>⚠ Auto-submitted</span>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Video Recordings — compact, supports native fullscreen via controls */}
              {selectedResult.recordings && Object.keys(selectedResult.recordings).length > 0 && (
                <div className="recordings-card">
                  <h5 className="section-title">
                    <FaVideo className="me-2" /> Session Recordings
                  </h5>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                    {Object.entries(selectedResult.recordings)
                      .filter(([round]) => !filterRoundType || round === filterRoundType)
                      .map(([round, recording]: [string, any]) => (
                      recording?.videoUrl && (
                        <div key={round} className="video-item">
                          <div className="video-header">
                            <span className="video-round">{round.toUpperCase()} Recording</span>
                            <a href={recording.videoUrl} target="_blank" rel="noopener noreferrer" className="video-link">
                              <FaExternalLinkAlt /> Open in new tab
                            </a>
                          </div>
                          <video controls className="video-player">
                            <source src={recording.videoUrl} type="video/webm" />
                            <source src={recording.videoUrl} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}
              </> /* end overview tab */}
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

      {/* Live Students Modal */}
      <Modal show={showLiveStudentsModal} onHide={() => setShowLiveStudentsModal(false)} size="xl" centered className="professional-modal live-students-modal">
        <Modal.Header closeButton className="modal-header-custom">
          <Modal.Title className="modal-title-custom">
            <FaUsers className="me-2" />
            Live Exam Sessions
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-body-custom">
          {liveStudentsLoading ? (
            <div className="loading-state">
              <Spinner animation="border" variant="warning" />
              <p>Loading live students...</p>
            </div>
          ) : liveStudentsError ? (
            <Alert variant="danger">{liveStudentsError}</Alert>
          ) : liveStudents.length === 0 ? (
            <div className="empty-state">
              <p>No students currently taking this exam</p>
            </div>
          ) : (
            <div className="live-students-list">
              {liveStudents.map((student, idx) => {
                const joinTime = new Date(student.joinedAt);
                const isValidJoinTime = !Number.isNaN(joinTime.getTime());
                const lastSeenTime = new Date(student.lastSeenAt || student.joinedAt);
                const isValidLastSeenTime = !Number.isNaN(lastSeenTime.getTime());
                const relativeActivityTime = isValidLastSeenTime ? formatRelativeDuration(lastSeenTime) : null;
                const isJustJoined = relativeActivityTime === 'just now';
                const showStartedTime = isValidJoinTime && isValidLastSeenTime && Math.abs(lastSeenTime.getTime() - joinTime.getTime()) > 5 * 60 * 1000;

                return (
                  <div key={student.studentId || `live-student-${idx}`} className="live-student-item">
                    <div className="student-avatar-live">
                      {student.name?.charAt(0) || '?'}
                    </div>
                    <div className="student-info-live">
                      <div className="student-name-live">
                        {student.name || 'N/A'}
                        {isJustJoined && <span className="just-joined-badge">Just Joined</span>}
                      </div>
                      <div className="student-email-live">{student.email || 'N/A'}</div>
                      <div className="student-joined-live">
                        {isValidLastSeenTime
                          ? `Active ${relativeActivityTime} (${formatJoinedDateTime(lastSeenTime)})`
                          : 'Activity time not available'}
                      </div>
                      {showStartedTime && (
                        <div className="student-started-live">
                          Started at {formatJoinedDateTime(joinTime)}
                        </div>
                      )}
                    </div>
                    <div className="student-status-live">
                      <Badge bg={student.status === 'completed' ? 'secondary' : 'success'}>
                        <span className="status-dot"></span> {String(student.status || 'in-progress').toLowerCase() === 'in-progress' ? 'JOINED' : String(student.status || 'in-progress').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="modal-footer-custom">
          <Button variant="outline-orange" onClick={() => setShowLiveStudentsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
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
          overflow-x: hidden;
        }

        .results-table {
          width: 100%;
          border-collapse: collapse;
        }

        .results-table th,
        .results-table td {
          padding: 10px 12px;
          text-align: left;
          border-bottom: 1px solid #2c2c2c;
          word-break: break-word;
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
          word-break: break-all;
          max-width: 180px;
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
          background: #0d0d0d;
          border: 1px solid #2c2c2c;
          border-radius: 10px;
          padding: 12px;
          width: 320px;
          flex-shrink: 0;
        }

        .video-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .video-round {
          font-weight: 600;
          color: #ff7a00;
          font-size: 12px;
        }

        .video-link {
          color: #ff7a00;
          text-decoration: none;
          font-size: 11px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .video-link:hover {
          text-decoration: underline;
        }

        .video-player {
          width: 100%;
          height: 200px;
          border-radius: 6px;
          background: #000;
          object-fit: cover;
          display: block;
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

        /* Live Students Modal Styles */
        .live-students-modal .modal-dialog {
          max-width: 980px;
        }

        .live-btn {
          background: linear-gradient(135deg, #ff2e63 0%, #ff6b9d 100%);
          border: none;
          border-radius: 8px;
          padding: 8px 16px;
          color: #ffffff;
          cursor: pointer;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s ease;
        }

        .live-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 46, 99, 0.4);
        }

        .live-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .live-dot {
          width: 8px;
          height: 8px;
          background: #ff2e63;
          border-radius: 50%;
          display: inline-block;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.2);
          }
        }

        .live-students-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .live-student-item {
          background: #0a0a0a;
          border: 1px solid #2c2c2c;
          border-radius: 12px;
          padding: 18px;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 0.3s ease;
          animation: slideInStudent 0.5s ease-out forwards;
        }

        @keyframes slideInStudent {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .live-student-item:hover {
          border-color: #ff2e63;
          box-shadow: 0 4px 12px rgba(255, 46, 99, 0.2);
        }

        .student-avatar-live {
          width: 52px;
          height: 52px;
          background: linear-gradient(135deg, #ff2e63, #ff6b9d);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 18px;
          flex-shrink: 0;
        }

        .student-info-live {
          flex: 1;
        }

        .student-name-live {
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 4px;
          font-size: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .just-joined-badge {
          background: linear-gradient(135deg, #ff2e63, #ff6b9d);
          color: white;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 20px;
          animation: pulse 1.5s infinite;
        }

        .student-email-live {
          font-size: 13px;
          color: #8a8a8a;
          margin-bottom: 4px;
        }

        .student-joined-live {
          font-size: 12px;
          color: #666666;
        }

        .student-started-live {
          font-size: 11px;
          color: #8a8a8a;
          margin-top: 2px;
        }

        .student-status-live {
          flex-shrink: 0;
        }

        .status-dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          background: #28a745;
          border-radius: 50%;
          margin-right: 6px;
          animation: pulse 2s infinite;
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

// ── English Answers View ─────────────────────────────────────────────────────

const ENGLISH_SECTION_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  reading_comprehension: { label: 'Reading Comprehension', emoji: '📖', color: '#3b82f6' },
  verbal_ability:        { label: 'Verbal Ability',        emoji: '🔤', color: '#8b5cf6' },
  sentence_correction:   { label: 'Sentence Correction',   emoji: '✅', color: '#22c55e' },
  error_detection:       { label: 'Error Detection',       emoji: '🔍', color: '#f59e0b' },
  para_jumbles:          { label: 'Para Jumbles',          emoji: '🔀', color: '#ef4444' },
  email_writing:         { label: 'Email Writing',         emoji: '✉️', color: '#06b6d4' },
  essay_writing:         { label: 'Essay Writing',         emoji: '✍️', color: '#ec4899' },
};

const EnglishAnswersView: React.FC<{ answers: any[] }> = ({ answers }) => {
  if (!answers.length) return <p style={{ color: '#555', textAlign: 'center', padding: '2rem' }}>No English answers found.</p>;

  // Group by section
  const grouped: Record<string, any[]> = {};
  for (const a of answers) {
    const s = a.section || 'unknown';
    if (!grouped[s]) grouped[s] = [];
    grouped[s].push(a);
  }

  const OPTIONS = ['A', 'B', 'C', 'D'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {Object.entries(grouped).map(([section, qs]) => {
        const meta = ENGLISH_SECTION_LABELS[section] || { label: section, emoji: '📄', color: '#888' };
        const isMCQ = qs[0]?.answerType !== 'writing';
        const correct = isMCQ ? qs.filter(q => q.isCorrect).length : 0;

        return (
          <div key={section}>
            {/* Section header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, padding: '10px 14px', background: `${meta.color}10`, border: `1px solid ${meta.color}30`, borderRadius: 10 }}>
              <span style={{ fontSize: '1.3rem' }}>{meta.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: meta.color }}>{meta.label}</div>
                <div style={{ fontSize: '0.72rem', color: '#666' }}>{qs.length} question{qs.length > 1 ? 's' : ''}{isMCQ ? ` · ${correct}/${qs.length} correct` : ''}</div>
              </div>
              {isMCQ && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: correct === qs.length ? '#22c55e' : correct === 0 ? '#ef4444' : '#f59e0b' }}>{Math.round((correct / qs.length) * 100)}%</div>
                  <div style={{ fontSize: '0.65rem', color: '#555' }}>accuracy</div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {qs.map((ans: any, qi: number) => {
                if (!isMCQ) {
                  // Writing answer
                  const wordCount = ans.writtenAnswer?.trim().split(/\s+/).length || 0;
                  return (
                    <div key={qi} style={{ background: '#0d0d0d', border: `1px solid ${ans.writtenAnswer ? meta.color + '30' : '#1f1f1f'}`, borderRadius: 10, padding: '14px 16px' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: meta.color, marginBottom: 8 }}>{ans.questionText}</div>
                      {ans.prompt && <div style={{ background: '#141414', borderRadius: 8, padding: '10px 12px', fontSize: '0.83rem', color: '#bbb', lineHeight: 1.65, marginBottom: 10 }}>{ans.prompt}</div>}
                      {ans.evaluationCriteria?.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
                          {ans.evaluationCriteria.map((c: string) => (
                            <span key={c} style={{ background: `${meta.color}15`, color: meta.color, border: `1px solid ${meta.color}30`, borderRadius: 4, fontSize: '0.65rem', fontWeight: 600, padding: '2px 7px' }}>{c}</span>
                          ))}
                        </div>
                      )}
                      {ans.writtenAnswer ? (
                        <div style={{ background: '#111', border: `1px solid ${meta.color}25`, borderRadius: 8, padding: '12px 14px', fontSize: '0.85rem', color: '#ddd', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
                          {ans.writtenAnswer}
                          <div style={{ marginTop: 8, fontSize: '0.7rem', color: '#555' }}>{wordCount} words · {ans.marks} marks</div>
                        </div>
                      ) : (
                        <div style={{ color: '#444', fontSize: '0.8rem', fontStyle: 'italic' }}>No answer submitted</div>
                      )}
                    </div>
                  );
                }

                // MCQ answer
                const borderColor = ans.isCorrect === true ? '#22c554' : ans.isCorrect === false ? '#ef4444' : '#1f1f1f';
                return (
                  <div key={qi} style={{ background: '#0d0d0d', border: `1px solid ${borderColor}30`, borderLeft: `3px solid ${borderColor}`, borderRadius: 10, padding: '12px 16px' }}>
                    {ans.passage && qi === 0 && (
                      <div style={{ background: '#141414', border: `1px solid ${meta.color}20`, borderRadius: 8, padding: '10px 12px', fontSize: '0.82rem', color: '#bbb', lineHeight: 1.7, marginBottom: 12 }}>
                        <div style={{ fontSize: '0.62rem', fontWeight: 700, color: meta.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Passage</div>
                        {ans.passage}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                      <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: '50%', background: ans.isCorrect === true ? '#22c55420' : ans.isCorrect === false ? '#ef444420' : '#1a1a1a', border: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 800, color: borderColor }}>{qi + 1}</span>
                      <p style={{ margin: 0, fontSize: '0.87rem', color: '#e0e0e0', lineHeight: 1.6 }}>{ans.questionText}</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
                      {OPTIONS.map(opt => {
                        const text = ans[`option${opt}`];
                        if (!text) return null;
                        const isSelected = (ans.selectedOption || '').toUpperCase() === opt;
                        const isCorrectOpt = (ans.correctAnswer || '').toUpperCase() === opt;
                        return (
                          <div key={opt} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 7, background: isCorrectOpt ? 'rgba(34,197,84,0.08)' : isSelected ? 'rgba(239,68,68,0.08)' : '#111', border: `1px solid ${isCorrectOpt ? '#22c55440' : isSelected ? '#ef444440' : '#1f1f1f'}` }}>
                            <span style={{ flexShrink: 0, width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, background: isCorrectOpt ? '#22c554' : isSelected ? '#ef4444' : '#1a1a1a', color: (isCorrectOpt || isSelected) ? '#fff' : '#555' }}>{opt}</span>
                            <span style={{ fontSize: '0.8rem', color: isCorrectOpt ? '#22c554' : isSelected ? '#ef4444' : '#888' }}>{isSelected && !isCorrectOpt ? '✗ ' : isCorrectOpt ? '✓ ' : ''}{text}</span>
                          </div>
                        );
                      })}
                    </div>
                    {ans.explanation && (
                      <div style={{ marginTop: 8, padding: '6px 10px', background: 'rgba(34,197,84,0.05)', border: '1px solid rgba(34,197,84,0.15)', borderRadius: 6, fontSize: '0.75rem', color: '#22c554' }}>
                        💡 {ans.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AdminResults;