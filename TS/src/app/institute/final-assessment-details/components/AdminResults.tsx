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
  FaPlay, FaStop, FaRedoAlt, FaFilePdf, FaEdit
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
  const [selectedRoundTypes, setSelectedRoundTypes] = useState<string[]>([]);
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
  const [detailedAnswers, setDetailedAnswers] = useState<any[]>([]);
  const [answersLoading, setAnswersLoading] = useState(false);
  const [rescoring, setRescoring] = useState(false);
  const [showLiveStudentsModal, setShowLiveStudentsModal] = useState(false);
  const [liveStudents, setLiveStudents] = useState<LiveStudent[]>([]);
  const [selectedLiveExamId, setSelectedLiveExamId] = useState<string>('');
  const [liveStudentsLoading, setLiveStudentsLoading] = useState(false);
  const [liveStudentsError, setLiveStudentsError] = useState('');

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
        { approvalStatus: status, comments: approveComments, roundTypes: selectedRoundTypes },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        await fetchResults();
        await fetchStats(selectedExamId || undefined);
        setShowApproveModal(false);
        setSelectedResult(null);
        setApproveComments('');
        setSelectedRoundTypes([]);
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

  const [englishAnswers, setEnglishAnswers] = useState<any[]>([]);
  const [codeSubmissions, setCodeSubmissions] = useState<any[]>([]);
  const [aiEvaluating, setAiEvaluating] = useState<string | null>(null);

  const fetchDetailedAnswers = async (resultId: string) => {
    try {
      setAnswersLoading(true);
      setDetailedAnswers([]);
      setEnglishAnswers([]);
      setCodeSubmissions([]);
      const res = await axios.get(`${baseURL}/api/assessment/admin/results/${resultId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setDetailedAnswers(res.data.data?.detailedAnswers || []);
        setEnglishAnswers(res.data.data?.englishAnswers || []);
        setCodeSubmissions(res.data.data?.codeSubmissions || []);
      }
    } catch (err) {
      console.error('Failed to fetch detailed answers', err);
    } finally {
      setAnswersLoading(false);
    }
  };

  const handleRescore = async () => {
    if (!selectedResult) return;
    try {
      setRescoring(true);
      const res = await axios.post(
        `${baseURL}/api/assessment/admin/results/${selectedResult._id}/rescore`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        // Refresh answers display and result list
        await fetchDetailedAnswers(selectedResult._id);
        await fetchResults();
        // Update selectedResult score inline
        setSelectedResult(prev => prev ? {
          ...prev,
          totalScore: res.data.data.score,
          finalPercentage: res.data.data.percentage,
          resultStatus: res.data.data.resultStatus,
        } : prev);
        alert(`Re-scored: ${res.data.message}`);
      }
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Re-score failed');
    } finally {
      setRescoring(false);
    }
  };

  const handleDownloadReport = () => {
    if (!selectedResult) return;

    const correctCount = detailedAnswers.filter(a => a.isCorrect === true).length;
    const totalCount = detailedAnswers.length;

    const answersHTML = detailedAnswers.length > 0 ? detailedAnswers.map((ans, idx) => {
      const isFill = (ans.questionType || '').toUpperCase() === 'FILL';
      const isCorrect = ans.isCorrect === true;
      const isWrong = ans.isCorrect === false;
      const borderColor = isCorrect ? '#28a745' : isWrong ? '#dc3545' : '#ccc';
      const statusIcon = isCorrect ? '✓' : isWrong ? '✗' : '—';
      const statusColor = isCorrect ? '#28a745' : isWrong ? '#dc3545' : '#999';

      const optionsHTML = !isFill && ans.options?.length > 0
        ? `<div style="margin:6px 0 8px 0; display:flex; flex-wrap:wrap; gap:6px;">
            ${ans.options.map((opt: any) => {
              const isSel = opt.key === ans.selectedOption;
              const isCorr = opt.key === ans.correctAnswer;
              return `<span style="padding:3px 10px; border-radius:4px; font-size:12px; font-weight:600;
                background:${isCorr ? '#d4edda' : isSel && !isCorr ? '#f8d7da' : '#f5f5f5'};
                border:1px solid ${isCorr ? '#28a745' : isSel && !isCorr ? '#dc3545' : '#ddd'};
                color:${isCorr ? '#155724' : isSel && !isCorr ? '#721c24' : '#555'};">
                ${opt.key}. ${opt.text}${isCorr ? ' ✓' : isSel && !isCorr ? ' ✗' : ''}
              </span>`;
            }).join('')}
           </div>` : '';

      return `<div style="border:1px solid ${borderColor}; border-radius:8px; padding:14px 16px; margin-bottom:10px; background:#fff;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
          <div style="display:flex; gap:8px; flex:1;">
            <span style="color:#999; font-size:12px; min-width:24px; padding-top:2px;">Q${idx + 1}.</span>
            <span style="font-size:14px; color:#111; line-height:1.5;">${ans.questionText || '—'}</span>
          </div>
          <div style="display:flex; align-items:center; gap:6px; flex-shrink:0; margin-left:12px;">
            <span style="background:${isFill ? '#d4edda' : '#fff3e0'}; color:${isFill ? '#155724' : '#e65100'}; border:1px solid ${isFill ? '#28a745' : '#ff7a00'}; border-radius:20px; padding:1px 9px; font-size:10px; font-weight:700;">
              ${isFill ? 'FILL' : 'MCQ'}
            </span>
            <span style="font-size:18px; font-weight:700; color:${statusColor};">${statusIcon}</span>
          </div>
        </div>
        ${optionsHTML}
        <div style="display:flex; gap:10px; flex-wrap:wrap; padding-left:32px;">
          <span style="background:#f5f5f5; border-radius:4px; padding:4px 10px; font-size:12px;">
            <span style="color:#999;">Student: </span>
            <span style="font-weight:600; color:${statusColor};">${ans.selectedOption || '(no answer)'}</span>
          </span>
          ${ans.correctAnswer ? `<span style="background:#f5f5f5; border-radius:4px; padding:4px 10px; font-size:12px;">
            <span style="color:#999;">Correct: </span>
            <span style="font-weight:600; color:#28a745;">${ans.correctAnswer}</span>
          </span>` : ''}
        </div>
      </div>`;
    }).join('') : '<p style="color:#999; text-align:center;">No answer data available</p>';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Exam Report — ${selectedResult.student.name}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 24px; color: #111; background: #fff; }
    @media print { body { padding: 0; } .no-print { display: none; } }
    h1 { color: #ff7a00; font-size: 22px; margin-bottom: 4px; }
    .meta { color: #555; font-size: 13px; margin-bottom: 24px; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 15px; font-weight: 700; color: #ff7a00; border-bottom: 2px solid #ff7a00; padding-bottom: 6px; margin-bottom: 14px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; }
    .info-item { display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding: 5px 0; font-size: 13px; }
    .info-label { color: #777; }
    .info-value { font-weight: 600; }
    .score-box { background: ${selectedResult.resultStatus === 'passed' ? '#d4edda' : '#f8d7da'}; border: 1px solid ${selectedResult.resultStatus === 'passed' ? '#28a745' : '#dc3545'}; border-radius: 8px; padding: 16px; display: flex; justify-content: space-around; margin-bottom: 24px; text-align: center; }
    .score-item span { display: block; font-size: 12px; color: #777; margin-bottom: 4px; }
    .score-item strong { font-size: 20px; font-weight: 700; color: ${selectedResult.resultStatus === 'passed' ? '#155724' : '#721c24'}; }
    .print-btn { background: #ff7a00; color: #fff; border: none; padding: 10px 24px; border-radius: 6px; font-size: 14px; cursor: pointer; margin-right: 10px; }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom:20px;">
    <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
  </div>

  <h1>📋 Exam Assessment Report</h1>
  <p class="meta">Generated on ${new Date().toLocaleString('en-IN')}</p>

  <div class="section">
    <div class="section-title">Student Information</div>
    <div class="info-grid">
      <div class="info-item"><span class="info-label">Name</span><span class="info-value">${selectedResult.student.name || 'N/A'}</span></div>
      <div class="info-item"><span class="info-label">Email</span><span class="info-value">${selectedResult.student.email || 'N/A'}</span></div>
      <div class="info-item"><span class="info-label">Exam</span><span class="info-value">${selectedResult.exam.title}</span></div>
      <div class="info-item"><span class="info-label">Submitted</span><span class="info-value">${formatDate(selectedResult.createdAt)}</span></div>
    </div>
  </div>

  <div class="score-box">
    <div class="score-item"><span>Total Score</span><strong>${selectedResult.totalScore}</strong></div>
    <div class="score-item"><span>Percentage</span><strong>${selectedResult.finalPercentage?.toFixed(1)}%</strong></div>
    <div class="score-item"><span>Result</span><strong>${selectedResult.resultStatus?.toUpperCase()}</strong></div>
    <div class="score-item"><span>Correct Answers</span><strong>${correctCount} / ${totalCount}</strong></div>
  </div>

  <div class="section">
    <div class="section-title">Student Answers</div>
    ${answersHTML}
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `exam-report-${selectedResult.student.name?.replace(/\s+/g, '-')}-${Date.now()}.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
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

  const getApprovalBadge = (status: string, roundResults?: any[]) => {
    if (roundResults && roundResults.length > 0) {
      const anyApproved = roundResults.some((r: any) => r.approvalStatus === 'approved');
      const allApproved = roundResults.every((r: any) => r.approvalStatus === 'approved');
      const anyRejected = roundResults.some((r: any) => r.approvalStatus === 'rejected');
      if (anyRejected) return <Badge bg="danger"><FaTimesCircle className="me-1" /> Rejected</Badge>;
      if (allApproved) return <Badge bg="success"><FaCheckCircle className="me-1" /> Approved</Badge>;
      if (anyApproved) return <Badge style={{ background: '#f59e0b' }}><FaClock className="me-1" /> Partial</Badge>;
    }
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
                          const isApproved = r.approvalStatus === 'approved';
                          const isPending = !r.approvalStatus || r.approvalStatus === 'pending';
                          return (
                            <span key={r.roundType} style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              padding: '3px 9px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700,
                              background: isApproved
                                ? (passed ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)')
                                : 'rgba(100,116,139,0.12)',
                              color: isApproved
                                ? (passed ? '#22c55e' : '#ef4444')
                                : '#64748b',
                              border: `1px solid ${isApproved ? (passed ? '#22c55e44' : '#ef444444') : '#64748b44'}`,
                              opacity: isPending ? 0.6 : 1,
                            }}>
                              {isApproved ? (passed ? '✓' : '✗') : '⏳'} {label}
                              <span style={{ fontWeight: 400, opacity: 0.8 }}>{r.percentage?.toFixed(0)}%</span>
                            </span>
                          );
                        })}
                        {(!result.roundResults || result.roundResults.length === 0) && (
                          <span style={{ color: '#555', fontSize: '0.78rem' }}>—</span>
                        )}
                      </div>
                    </td>
                    <td>{getApprovalBadge(result.approvalStatus, result.roundResults)}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="view-btn"
                          onClick={() => {
                            setSelectedResult(result);
                            setShowDetailsModal(true);
                            fetchDetailedAnswers(result._id);
                          }}
                        >
                          <FaEye /> View
                        </button>
                        <button
                          className="edit-approval-btn"
                          onClick={() => {
                            setSelectedResult(result);
                            setSelectedRoundTypes((result.roundResults || []).filter((r: any) => r.approvalStatus === 'approved').map((r: any) => r.roundType));
                            setApproveComments(result.approvalComments || '');
                            setShowApproveModal(true);
                          }}
                        >
                          <FaEdit /> Edit
                        </button>
                        {result.approvalStatus === 'pending' && (
                          <button
                            className="approve-btn"
                            onClick={() => {
                              setSelectedResult(result);
                              setSelectedRoundTypes((result.roundResults || []).filter((r: any) => r.approvalStatus === 'approved').map((r: any) => r.roundType));
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
      <Modal show={showDetailsModal} onHide={() => { setShowDetailsModal(false); setDetailedAnswers([]); setCodeSubmissions([]); }} fullscreen className="professional-modal">
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
                            {r.tabSwitchViolationCount > 0 && (
                              <span style={{ display: 'block', marginTop: 4, fontSize: '0.72rem', color: '#ef4444' }}>
                                🖥 Tab/window switches: {r.tabSwitchViolationCount}{r.violationAutoSubmit ? ' (auto-submitted)' : ''}
                              </span>
                            )}
                            {r.violationAutoSubmit && !r.tabSwitchViolationCount && (
                              <span style={{ display: 'block', marginTop: 4, fontSize: '0.72rem', color: '#ef4444' }}>⚠ Auto-submitted</span>
                            )}
                            {r.faceViolationCount > 0 && (
                              <span style={{ display: 'block', marginTop: 4, fontSize: '0.72rem', color: '#f59e0b' }}>
                                👁 Face/gaze violations: {r.faceViolationCount}
                                {' '}(Eye: {r.eyeViolationCount || 0} · Head: {r.headViolationCount || 0} · Mask: {r.maskViolationCount || 0} · No face: {r.noFaceViolationCount || 0})
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Video Recordings — moved up, compact layout */}
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

              {/* Code Submission */}
              {((!filterRoundType || filterRoundType === 'coding') && selectedResult.roundResults?.some((r: any) => r.roundType === 'coding')) && (
                <div className="rounds-card">
                  <h5 className="section-title">
                    <span className="me-2">⌨️</span> Code Submission
                  </h5>
                  {answersLoading ? (
                    <p style={{ color: '#666', padding: '1rem 0', fontSize: '0.85rem' }}>Loading code submission...</p>
                  ) : codeSubmissions.length === 0 ? (
                    <p style={{ color: '#555', padding: '1rem 0', fontSize: '0.85rem' }}>No code submission found for this student.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                      {codeSubmissions.map((sub: any) => (
                        <div key={sub._id} style={{ background: '#080808', border: '1px solid #1e1e1e', borderRadius: 12, overflow: 'hidden' }}>
                          {/* Header */}
                          <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>{sub.challengeId?.title || 'Code Challenge'}</span>
                              <span style={{ background: '#1a1a1a', color: '#888', border: '1px solid #2a2a2a', borderRadius: 20, padding: '2px 9px', fontSize: '0.7rem', fontWeight: 600 }}>{sub.language?.toUpperCase()}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ color: sub.testsPassed === sub.testsTotal ? '#22c55e' : '#f97316', fontWeight: 700, fontSize: '0.82rem' }}>
                                {sub.testsPassed}/{sub.testsTotal} tests passed
                              </span>
                              <span style={{ background: sub.testsPassed > 0 ? 'rgba(249,115,22,0.12)' : 'rgba(239,68,68,0.12)', color: sub.testsPassed > 0 ? '#f97316' : '#ef4444', border: `1px solid ${sub.testsPassed > 0 ? '#f9731644' : '#ef444444'}`, borderRadius: 20, padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700 }}>
                                {sub.testsPassed === sub.testsTotal && sub.testsTotal > 0 ? '✓ All Passed' : sub.testsPassed > 0 ? `${sub.testsPassed} Partial` : '✗ Failed'}
                              </span>
                            </div>
                          </div>

                          {/* Code block */}
                          <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', top: 8, right: 10, zIndex: 1, display: 'flex', gap: 6 }}>
                              <span style={{ color: '#555', fontSize: '0.68rem', padding: '2px 8px', background: '#111', borderRadius: 4 }}>{sub.language}</span>
                              <button onClick={() => navigator.clipboard.writeText(sub.code || '')} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#888', padding: '2px 8px', borderRadius: 4, fontSize: '0.68rem', cursor: 'pointer' }}>Copy</button>
                            </div>
                            <pre style={{ margin: 0, padding: '14px 16px', overflowX: 'auto', fontSize: '0.78rem', lineHeight: 1.6, color: '#e2e8f0', background: '#050505', maxHeight: 280, overflowY: 'auto' }}>
                              <code>{sub.code || '(no code submitted)'}</code>
                            </pre>
                          </div>

                          {/* Test case results */}
                          {sub.results?.length > 0 && (
                            <div style={{ padding: '12px 16px', borderTop: '1px solid #1e1e1e' }}>
                              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#666', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Test Cases</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                {sub.results.map((t: any, i: number) => (
                                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, padding: '7px 12px', borderRadius: 7, background: t.passed ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.05)', border: `1px solid ${t.passed ? '#22c55e22' : '#ef444422'}`, fontSize: '0.73rem' }}>
                                    <span style={{ color: '#666' }}>In: <code style={{ color: '#bbb' }}>{t.input?.replace(/\n/g, '↵')}</code></span>
                                    <span style={{ color: '#666' }}>Expected: <code style={{ color: '#bbb' }}>{t.expectedOutput || '—'}</code></span>
                                    <span style={{ color: '#666' }}>Got: <code style={{ color: t.passed ? '#22c55e' : '#ef4444' }}>{t.actualOutput || '—'}</code></span>
                                    <span style={{ fontWeight: 700, color: t.passed ? '#22c55e' : '#ef4444', textAlign: 'right' }}>{t.passed ? '✓' : '✗'}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* AI Evaluation */}
                          <div style={{ padding: '12px 16px', borderTop: '1px solid #1e1e1e' }}>
                            {sub.aiEvaluation ? (
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                                  <span style={{ fontWeight: 700, color: '#a855f7', fontSize: '0.85rem' }}>🤖 AI Evaluation</span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ background: 'rgba(168,85,247,0.12)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 20, padding: '2px 12px', fontSize: '0.76rem', fontWeight: 700 }}>Score: {sub.aiEvaluation.score}/100</span>
                                    <span style={{ background: sub.aiEvaluation.rating === 'Excellent' ? 'rgba(34,197,94,0.12)' : sub.aiEvaluation.rating === 'Good' ? 'rgba(59,130,246,0.12)' : sub.aiEvaluation.rating === 'Fair' ? 'rgba(234,179,8,0.12)' : 'rgba(239,68,68,0.12)', color: sub.aiEvaluation.rating === 'Excellent' ? '#22c55e' : sub.aiEvaluation.rating === 'Good' ? '#3b82f6' : sub.aiEvaluation.rating === 'Fair' ? '#eab308' : '#ef4444', borderRadius: 20, padding: '2px 12px', fontSize: '0.76rem', fontWeight: 700 }}>{sub.aiEvaluation.rating}</span>
                                    <button onClick={async () => { setAiEvaluating(sub._id); try { const r = await axios.post(`${baseURL}/api/assessment/admin/ai-evaluate-code/${sub._id}`, {}, { headers: { Authorization: `Bearer ${token}` } }); if (r.data.success) setCodeSubmissions(prev => prev.map(s => s._id === sub._id ? { ...s, aiEvaluation: r.data.evaluation } : s)); } catch {} setAiEvaluating(null); }} disabled={!!aiEvaluating} style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)', color: '#a855f7', padding: '3px 10px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}>
                                      {aiEvaluating === sub._id ? '⏳' : '🔄'} Re-evaluate
                                    </button>
                                  </div>
                                </div>
                                <p style={{ color: '#bbb', fontSize: '0.82rem', lineHeight: 1.6, marginBottom: 10 }}>{sub.aiEvaluation.summary}</p>
                                <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                                  {sub.aiEvaluation.codeQuality && <span style={{ background: '#111', color: '#777', border: '1px solid #222', borderRadius: 20, padding: '2px 9px', fontSize: '0.7rem' }}>Quality: {sub.aiEvaluation.codeQuality}</span>}
                                  {sub.aiEvaluation.timeComplexity && <span style={{ background: '#111', color: '#777', border: '1px solid #222', borderRadius: 20, padding: '2px 9px', fontSize: '0.7rem' }}>Time: {sub.aiEvaluation.timeComplexity}</span>}
                                  {sub.aiEvaluation.spaceComplexity && <span style={{ background: '#111', color: '#777', border: '1px solid #222', borderRadius: 20, padding: '2px 9px', fontSize: '0.7rem' }}>Space: {sub.aiEvaluation.spaceComplexity}</span>}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                  <div style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid #22c55e22', borderRadius: 8, padding: '10px 12px' }}>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#22c55e', marginBottom: 5 }}>✓ Strengths</div>
                                    {(sub.aiEvaluation.strengths || []).map((s: string, i: number) => <div key={i} style={{ color: '#999', fontSize: '0.76rem', marginBottom: 2 }}>• {s}</div>)}
                                  </div>
                                  <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid #ef444422', borderRadius: 8, padding: '10px 12px' }}>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#ef4444', marginBottom: 5 }}>↑ Improvements</div>
                                    {(sub.aiEvaluation.improvements || []).map((s: string, i: number) => <div key={i} style={{ color: '#999', fontSize: '0.76rem', marginBottom: 2 }}>• {s}</div>)}
                                  </div>
                                </div>
                                <div style={{ marginTop: 6, fontSize: '0.67rem', color: '#444' }}>Evaluated by {sub.aiEvaluation.model} · {sub.aiEvaluation.evaluatedAt ? new Date(sub.aiEvaluation.evaluatedAt).toLocaleString() : ''}</div>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ color: '#555', fontSize: '0.82rem' }}>No AI evaluation yet</span>
                                <button
                                  onClick={async () => { setAiEvaluating(sub._id); try { const r = await axios.post(`${baseURL}/api/assessment/admin/ai-evaluate-code/${sub._id}`, {}, { headers: { Authorization: `Bearer ${token}` } }); if (r.data.success) setCodeSubmissions(prev => prev.map(s => s._id === sub._id ? { ...s, aiEvaluation: r.data.evaluation } : s)); } catch {} setAiEvaluating(null); }}
                                  disabled={!!aiEvaluating}
                                  style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)', border: 'none', color: '#fff', padding: '8px 20px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 700, cursor: aiEvaluating ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, opacity: aiEvaluating ? 0.7 : 1 }}
                                >
                                  {aiEvaluating === sub._id ? '⏳ Evaluating...' : '🤖 AI Evaluate Code'}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Student Answers — MCQ */}
              {(!filterRoundType || filterRoundType === 'mcq') && <div className="info-card" style={{ marginBottom: '20px' }}>
                <h5 className="section-title">
                  <FaBookOpen className="me-2" /> Student Answers
                  {!answersLoading && detailedAnswers.length > 0 && (
                    <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#8a8a8a', fontWeight: 400 }}>
                      {detailedAnswers.filter(a => a.isCorrect === true).length} / {detailedAnswers.length} correct
                    </span>
                  )}
                </h5>

                {answersLoading ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: '#8a8a8a' }}>
                    <Spinner animation="border" size="sm" style={{ color: '#ff7a00' }} />
                    <span style={{ marginLeft: '10px' }}>Loading answers...</span>
                  </div>
                ) : detailedAnswers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#555', fontSize: '13px' }}>
                    No answer data available for this submission.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {detailedAnswers.map((ans, idx) => {
                      const isCorrect = ans.isCorrect === true;
                      const isWrong = ans.isCorrect === false;
                      const isFill = (ans.questionType || '').toUpperCase() === 'FILL';
                      return (
                        <div key={idx} style={{
                          background: '#0d0d0d',
                          border: `1px solid ${isCorrect ? '#28a745' : isWrong ? '#dc3545' : '#2c2c2c'}`,
                          borderRadius: '10px',
                          padding: '14px 16px',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flex: 1 }}>
                              <span style={{ color: '#555', fontSize: '12px', minWidth: '26px', paddingTop: '2px' }}>Q{idx + 1}.</span>
                              <span style={{ color: '#e0e0e0', fontSize: '14px', lineHeight: '1.5' }}>{ans.questionText || '—'}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                              <span style={{
                                background: isFill ? 'rgba(40,167,69,0.15)' : 'rgba(255,107,53,0.15)',
                                color: isFill ? '#28a745' : '#ff6b35',
                                border: `1px solid ${isFill ? '#28a745' : '#ff6b35'}`,
                                borderRadius: '20px', padding: '1px 9px', fontSize: '10px', fontWeight: 700
                              }}>
                                {isFill ? 'FILL' : 'MCQ'}
                              </span>
                              {isCorrect && <span style={{ color: '#28a745', fontSize: '18px', fontWeight: 700 }}>✓</span>}
                              {isWrong && <span style={{ color: '#dc3545', fontSize: '18px', fontWeight: 700 }}>✗</span>}
                            </div>
                          </div>

                          {/* MCQ options with highlight */}
                          {!isFill && ans.options?.length > 0 && (
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', paddingLeft: '34px', marginBottom: '8px' }}>
                              {ans.options.map((opt: any) => {
                                const isSelected = opt.key === ans.selectedOption;
                                const isCorrectOpt = opt.key === ans.correctAnswer;
                                return (
                                  <span key={opt.key} style={{
                                    padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                                    background: isCorrectOpt ? 'rgba(40,167,69,0.2)' : isSelected ? 'rgba(220,53,69,0.2)' : '#1a1a1a',
                                    border: `1px solid ${isCorrectOpt ? '#28a745' : isSelected ? '#dc3545' : '#333'}`,
                                    color: isCorrectOpt ? '#28a745' : isSelected ? '#dc3545' : '#888',
                                  }}>
                                    {opt.key}. {opt.text}
                                    {isSelected && !isCorrectOpt && ' ✗'}
                                    {isCorrectOpt && ' ✓'}
                                  </span>
                                );
                              })}
                            </div>
                          )}

                          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', paddingLeft: '34px' }}>
                            <div style={{ background: '#1a1a1a', borderRadius: '6px', padding: '5px 12px', fontSize: '12px' }}>
                              <span style={{ color: '#8a8a8a' }}>Student: </span>
                              <span style={{ color: isCorrect ? '#28a745' : isWrong ? '#dc3545' : '#aaa', fontWeight: 600 }}>
                                {ans.selectedOption || '(no answer)'}
                              </span>
                            </div>
                            {ans.correctAnswer && (
                              <div style={{ background: '#1a1a1a', borderRadius: '6px', padding: '5px 12px', fontSize: '12px' }}>
                                <span style={{ color: '#8a8a8a' }}>Correct: </span>
                                <span style={{ color: '#28a745', fontWeight: 600 }}>{ans.correctAnswer}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>}

              {/* English Round Answers */}
              {(!filterRoundType || filterRoundType === 'english') && (() => {
                const engResult = (selectedResult.roundResults || []).find((r: any) => r.roundType === 'english');
                if (!engResult) return null;
                return (
                  <div className="info-card" style={{ marginBottom: '20px' }}>
                    <h5 className="section-title">
                      <span style={{ marginRight: 8 }}>🇬🇧</span> English Round Answers
                      {englishAnswers.length > 0 && (
                        <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#8a8a8a', fontWeight: 400 }}>
                          {englishAnswers.filter((a: any) => a.isCorrect === true).length} / {englishAnswers.filter((a: any) => a.answerType === 'mcq').length} MCQ correct
                        </span>
                      )}
                    </h5>
                    {englishAnswers.length > 0 ? (
                      <InstituteEnglishAnswersView answers={englishAnswers} />
                    ) : (
                      <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                        <p style={{ color: '#aaa', fontSize: '0.88rem', marginBottom: 10 }}>
                          Detailed answer breakdown is not available for this submission.
                        </p>
                        <div style={{ display: 'inline-flex', gap: 16, background: '#1e1e1e', padding: '10px 20px', borderRadius: 10 }}>
                          <span style={{ color: '#888', fontSize: '0.85rem' }}>Score: <strong style={{ color: '#fff' }}>{engResult.score}/{engResult.total}</strong></span>
                          <span style={{ color: '#888', fontSize: '0.85rem' }}>Percentage: <strong style={{ color: engResult.passed ? '#22c55e' : '#ef4444' }}>{engResult.percentage?.toFixed(1)}%</strong></span>
                          <span style={{ background: engResult.passed ? '#22c55e22' : '#ef444422', color: engResult.passed ? '#22c55e' : '#ef4444', padding: '2px 10px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 700 }}>{engResult.passed ? 'Passed' : 'Failed'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

            </div>
          )}
        </Modal.Body>

        <Modal.Footer className="modal-footer-custom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              style={{ background: '#1a6fc4', border: 'none', color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={handleRescore}
              disabled={rescoring}
            >
              {rescoring ? <Spinner size="sm" animation="border" /> : <FaRedoAlt />}
              {rescoring ? 'Re-scoring...' : 'Re-score'}
            </Button>
            <Button
              style={{ background: '#28a745', border: 'none', color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={handleDownloadReport}
              disabled={answersLoading}
            >
              <FaFilePdf /> Download Report
            </Button>
          </div>
          <Button variant="secondary" onClick={() => { setShowDetailsModal(false); setDetailedAnswers([]); setCodeSubmissions([]); }} className="close-modal-btn">
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

              {/* Per-round selection */}
              {selectedResult.roundResults && selectedResult.roundResults.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1', marginBottom: 8 }}>Select rounds to approve:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {selectedResult.roundResults.map((r: any) => {
                      const label: Record<string, string> = { mcq: 'MCQ Quiz', coding: 'Code Challenge', tr: 'Technical Round', hr: 'HR Round', english: 'English' }
                      const checked = selectedRoundTypes.includes(r.roundType)
                      return (
                        <label
                          key={r.roundType}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                            background: checked ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)',
                            border: `1px solid ${checked ? '#22c55e' : '#334155'}`,
                            borderRadius: 8, padding: '6px 12px', fontSize: 13, fontWeight: 600,
                            color: checked ? '#22c55e' : '#94a3b8', transition: 'all 0.15s',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => setSelectedRoundTypes(prev =>
                              checked ? prev.filter(x => x !== r.roundType) : [...prev, r.roundType]
                            )}
                            style={{ accentColor: '#22c55e' }}
                          />
                          {label[r.roundType] || r.roundType}
                          <span style={{ opacity: 0.7, fontWeight: 400 }}>({r.score}/{r.total})</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}

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
          <Button variant="success" onClick={() => handleApprove('approved')} disabled={approving || selectedRoundTypes.length === 0} className="approve-modal-btn">
            {approving ? <Spinner size="sm" className="me-1" /> : <FaCheckCircle className="me-1" />}
            Approve {selectedRoundTypes.length > 0 ? `(${selectedRoundTypes.length} round${selectedRoundTypes.length > 1 ? 's' : ''})` : ''}
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

        .view-btn, .approve-btn, .edit-approval-btn {
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

        .edit-approval-btn {
          background: transparent;
          border: 1px solid #6366f1;
          color: #6366f1;
        }

        .edit-approval-btn:hover {
          background: #6366f1;
          color: #fff;
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
          overflow-y: auto;
          flex: 1;
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

const ENGLISH_SECTION_META: Record<string, { label: string; emoji: string; color: string }> = {
  reading_comprehension: { label: 'Reading Comprehension', emoji: '📖', color: '#3b82f6' },
  verbal_ability:        { label: 'Verbal Ability',        emoji: '🔤', color: '#8b5cf6' },
  sentence_correction:   { label: 'Sentence Correction',   emoji: '✅', color: '#22c55e' },
  error_detection:       { label: 'Error Detection',       emoji: '🔍', color: '#f59e0b' },
  para_jumbles:          { label: 'Para Jumbles',          emoji: '🔀', color: '#ef4444' },
  email_writing:         { label: 'Email Writing',         emoji: '✉️', color: '#06b6d4' },
  essay_writing:         { label: 'Essay Writing',         emoji: '✍️', color: '#ec4899' },
};

const InstituteEnglishAnswersView: React.FC<{ answers: any[] }> = ({ answers }) => {
  if (!answers.length) return null;
  const grouped: Record<string, any[]> = {};
  for (const a of answers) {
    const s = a.section || 'unknown';
    if (!grouped[s]) grouped[s] = [];
    grouped[s].push(a);
  }
  const OPTIONS = ['A', 'B', 'C', 'D'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {Object.entries(grouped).map(([section, qs]) => {
        const meta = ENGLISH_SECTION_META[section] || { label: section, emoji: '📄', color: '#888' };
        const isMCQ = qs[0]?.answerType !== 'writing';
        const correct = isMCQ ? qs.filter((q: any) => q.isCorrect).length : 0;
        return (
          <div key={section}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, padding: '8px 12px', background: `${meta.color}10`, border: `1px solid ${meta.color}30`, borderRadius: 8 }}>
              <span>{meta.emoji}</span>
              <span style={{ fontWeight: 700, fontSize: '0.88rem', color: meta.color }}>{meta.label}</span>
              {isMCQ && <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#666' }}>{correct}/{qs.length} correct</span>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {qs.map((ans: any, qi: number) => {
                if (ans.answerType === 'writing') {
                  return (
                    <div key={qi} style={{ background: '#0d0d0d', border: `1px solid ${meta.color}25`, borderRadius: 8, padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: meta.color, marginBottom: 6 }}>{ans.questionText}</div>
                      {ans.prompt && <div style={{ background: '#141414', borderRadius: 6, padding: '8px 10px', fontSize: '0.8rem', color: '#bbb', lineHeight: 1.6, marginBottom: 8 }}>{ans.prompt}</div>}
                      {ans.writtenAnswer ? (
                        <div style={{ background: '#111', border: `1px solid #2a2a2a`, borderRadius: 6, padding: '10px 12px', fontSize: '0.83rem', color: '#ddd', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                          {ans.writtenAnswer}
                          <div style={{ marginTop: 6, fontSize: '0.68rem', color: '#555' }}>{ans.writtenAnswer.trim().split(/\s+/).length} words</div>
                        </div>
                      ) : <div style={{ color: '#555', fontSize: '0.78rem', fontStyle: 'italic' }}>No answer submitted</div>}
                    </div>
                  );
                }
                const borderColor = ans.isCorrect === true ? '#28a745' : ans.isCorrect === false ? '#dc3545' : '#2c2c2c';
                return (
                  <div key={qi} style={{ background: '#0d0d0d', border: `1px solid ${borderColor}`, borderRadius: 8, padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <span style={{ color: '#555', fontSize: '12px', minWidth: 22 }}>Q{qi + 1}.</span>
                      <span style={{ color: '#e0e0e0', fontSize: '13.5px', lineHeight: 1.55 }}>{ans.questionText}</span>
                      <span style={{ marginLeft: 'auto', fontSize: '18px', color: ans.isCorrect === true ? '#28a745' : '#dc3545' }}>{ans.isCorrect === true ? '✓' : ans.isCorrect === false ? '✗' : ''}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingLeft: 30 }}>
                      {OPTIONS.map(opt => {
                        const text = ans[`option${opt}`];
                        if (!text) return null;
                        const isSel = (ans.selectedOption || '').toUpperCase() === opt;
                        const isCorr = (ans.correctAnswer || '').toUpperCase() === opt;
                        return (
                          <div key={opt} style={{ padding: '4px 10px', borderRadius: 5, fontSize: '12px', border: `1px solid ${isCorr ? '#28a745' : isSel ? '#dc3545' : '#252525'}`, background: isCorr ? 'rgba(40,167,69,0.08)' : isSel ? 'rgba(220,53,69,0.08)' : '#111', color: isCorr ? '#28a745' : isSel ? '#dc3545' : '#666' }}>
                            {isSel && !isCorr ? '✗ ' : isCorr ? '✓ ' : ''}{opt}: {text}
                          </div>
                        );
                      })}
                    </div>
                    {ans.explanation && <div style={{ marginTop: 6, paddingLeft: 30, fontSize: '11px', color: '#22c55e' }}>💡 {ans.explanation}</div>}
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