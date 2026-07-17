import React, { useEffect, useMemo, useState } from 'react'
import boyImg from '@/assets/images/Boy.png'
import {
  Badge,
  Button,
  Card,
  Col,
  Container,
  Modal,
  Row,
  Spinner,
  Tab,
  Tabs,
} from 'react-bootstrap'
import {
  FaBriefcase, FaCalendarAlt, FaCheckCircle, FaChevronRight, FaCodeBranch,
  FaGraduationCap, FaLock, FaSearch, FaTags, FaUserGraduate, FaUsers,
  FaMapMarkerAlt, FaClock, FaChartBar, FaFilter, FaThLarge,
  FaCode, FaRobot, FaDatabase, FaMobile, FaShieldAlt, FaCloud, FaPaintBrush,
  FaBell, FaChevronLeft, FaEllipsisH, FaArrowRight, FaTrophy, FaCertificate,
  FaLayerGroup, FaSortAmountDown, FaAlignLeft, FaBullseye, FaChartLine, FaPlay,
} from 'react-icons/fa'
import { useAuthContext } from '@/context/useAuthContext'
import { useLocation } from 'react-router-dom'
import StudentTaskSubmissionWizard from './StudentTaskSubmissionWizard'

// ─── Types ──────────────────────────────────────────────────────────────────

type Attachment = {
  fileName?: string
  fileUrl?: string
  s3Key?: string
}

type TaskSubmission = {
  _id?: string
  codeLink?: string
  codeDescription?: string
  attachments?: Attachment[]
  status?: 'pending' | 'completed'
  adminReviewStatus?: 'pending' | 'approved' | 'rejected'
  adminFeedback?: string
}

type EnrolledStudentDetail = {
  studentId: string
  name: string
  email: string
}

type FreelancingTask = {
  _id: string
  title: string
  description?: string
  highlights?: string
  category?: string
  skills?: string[]
  experience?: string
  acceptanceCriteria?: string
  maxStudents?: number
  amount?: number
  deadline?: string
  startDate?: string
  githubLink?: string
  terms?: string
  ndaRequired?: boolean
  attachments?: Attachment[]
  createdAt?: string
  // server-augmented fields
  enrolledCount?: number
  spotsLeft?: number
  isEnrolled?: boolean
  mySubmission?: TaskSubmission
  enrolledStudentsDetails?: EnrolledStudentDetail[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  'web-development': '🌐 Web Development',
  'ai-ml': '🤖 AI / ML',
  'data-science': '📊 Data Science',
  'ui-ux': '🎨 UI/UX Design',
  'mobile-development': '📱 Mobile Development',
  devops: '⚙️ DevOps',
  cybersecurity: '🔒 Cybersecurity',
  blockchain: '⛓️ Blockchain',
}

const EXPERIENCE_LABELS: Record<string, string> = {
  beginner: '🌱 Beginner (0-1 yr)',
  intermediate: '📈 Intermediate (2-4 yr)',
  advanced: '🚀 Advanced (5+ yr)',
  expert: '🏆 Expert (8+ yr)',
}

const formatDate = (d?: string | null) => {
  if (!d) return '—'
  const dt = new Date(d)
  return isNaN(dt.getTime())
    ? d
    : dt.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
}

const isDeadlinePast = (d?: string | null) => {
  if (!d) return false
  return new Date(d) < new Date()
}

// Reads the same --dash-* CSS vars StudentLayout sets for dark mode
// (light-mode values as fallback), so this page re-themes with the portal.
const PAGE_BG     = 'var(--dash-page-bg, #f8fafc)'
const CARD_BG     = 'var(--dash-card-bg, #ffffff)'
const PAGE_BORDER = 'var(--dash-border, #e2e8f0)'
const PAGE_TEXT   = 'var(--dash-text, #0f172a)'
const PAGE_GRAY   = 'var(--dash-gray, #64748b)'

const getFreelancingTabFromPath = (pathname: string): 'available' | 'deadline-crossed' | 'enrolled' => {
  if (pathname.includes('/student/freelancing/my-tasks')) return 'enrolled'
  return 'available'
}

// ─── Component ───────────────────────────────────────────────────────────────

const StudentFreelancingDashboard: React.FC = () => {
  const { user } = useAuthContext()
  const location = useLocation()
  const token = user?.token
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [tasks, setTasks] = useState<FreelancingTask[]>([])
  const [myTasks, setMyTasks] = useState<FreelancingTask[]>([])
  const [loading, setLoading] = useState(false)
  const [enrolling, setEnrolling] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'available' | 'deadline-crossed' | 'enrolled'>(() =>
    getFreelancingTabFromPath(location.pathname)
  )
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [durationFilter, setDurationFilter] = useState('all')
  const [difficultyFilter, setDifficultyFilter] = useState('all')
  const [sortFilter, setSortFilter] = useState('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const TASKS_PER_PAGE = 5
  useEffect(() => { setCurrentPage(1) }, [activeTab, searchTerm, categoryFilter, durationFilter, difficultyFilter, sortFilter])

  const [selectedTask, setSelectedTask] = useState<FreelancingTask | null>(null)
  const [boardFilter, setBoardFilter] = useState<string | null>(null)
  const [myInternshipSubTab, setMyInternshipSubTab] = useState<'overview' | 'tasks' | 'submissions' | 'feedback' | 'certificate'>('overview')
  const [showTaskDetailsModal, setShowTaskDetailsModal] = useState(false)
  const [taskDetailsTask, setTaskDetailsTask] = useState<FreelancingTask | null>(null)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [feedbackTask, setFeedbackTask] = useState<FreelancingTask | null>(null)
  const [taskSearch,   setTaskSearch]   = useState('')
  const [moduleFilter, setModuleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [overviewSearch, setOverviewSearch] = useState('')
  const [overviewStatus, setOverviewStatus] = useState('all')
  const [overviewSort,   setOverviewSort]   = useState('newest')
  const [showModal, setShowModal] = useState(false)
  const [showWorkflowModal, setShowWorkflowModal] = useState(false)
  const [enrollError, setEnrollError] = useState('')
  const [enrollSuccess, setEnrollSuccess] = useState('')

  // ── Fetch ───────────────────────────────────────────────────────────────
  const fetchTasks = async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch(`${baseURL}/api/student/freelancing/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setTasks(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Fetch freelancing tasks error:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchMyTasks = async () => {
    if (!token) return
    try {
      const res = await fetch(`${baseURL}/api/student/freelancing/my-tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setMyTasks(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Fetch my tasks error:', err)
    }
  }

  useEffect(() => {
    fetchTasks()
    fetchMyTasks()
  }, [token])

  useEffect(() => {
    setActiveTab(getFreelancingTabFromPath(location.pathname))
  }, [location.pathname])

  useEffect(() => {
    const anyModalOpen = showTaskDetailsModal || showModal || showWorkflowModal || showFeedbackModal
    document.body.style.overflow = anyModalOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [showTaskDetailsModal, showModal, showWorkflowModal])

  // ── Enroll ──────────────────────────────────────────────────────────────
  const handleEnroll = async (taskId: string) => {
    if (!token) return
    setEnrolling(taskId)
    setEnrollError('')
    setEnrollSuccess('')
    try {
      const res = await fetch(
        `${baseURL}/api/student/freelancing/tasks/${taskId}/enroll`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      const data = await res.json()
      if (!res.ok) {
        setEnrollError(data.error || 'Failed to enroll')
      } else {
        setEnrollSuccess(data.message || 'Enrolled successfully!')
        // optimistic update
        setTasks((prev) =>
          prev.map((t) =>
            t._id === taskId
              ? { ...t, isEnrolled: true, spotsLeft: (t.spotsLeft ?? 1) - 1, enrolledCount: (t.enrolledCount ?? 0) + 1 }
              : t
          )
        )
        await fetchMyTasks()
        // update selected task if open
        setSelectedTask((prev) =>
          prev?._id === taskId
            ? { ...prev, isEnrolled: true, spotsLeft: (prev.spotsLeft ?? 1) - 1 }
            : prev
        )
      }
    } catch (err) {
      setEnrollError('Something went wrong. Please try again.')
    } finally {
      setEnrolling(null)
    }
  }

  // ── Filtered / paginated lists ───────────────────────────────────────────
  const filteredTasks = useMemo(() => {
    const q = searchTerm.toLowerCase()
    let result = tasks.filter((t) => {
      const matchSearch =
        (t.title || '').toLowerCase().includes(q) ||
        (t.category || '').toLowerCase().includes(q) ||
        (t.skills || []).some((s) => s.toLowerCase().includes(q))
      const matchCategory = categoryFilter === 'all' || t.category === categoryFilter
      const matchDifficulty = difficultyFilter === 'all' || (t.experience || '').toLowerCase() === difficultyFilter
      const durationDays = t.startDate && t.deadline
        ? Math.ceil((new Date(t.deadline).getTime() - new Date(t.startDate).getTime()) / (1000 * 60 * 60 * 24))
        : null
      const matchDuration = durationFilter === 'all' ||
        (durationFilter === 'short'  && durationDays != null && durationDays <= 7) ||
        (durationFilter === 'medium' && durationDays != null && durationDays > 7 && durationDays <= 30) ||
        (durationFilter === 'long'   && durationDays != null && durationDays > 30)
      return matchSearch && matchCategory && matchDifficulty && matchDuration
    })
    result = [...result].sort((a, b) => {
      const da = new Date(a.createdAt || 0).getTime()
      const db = new Date(b.createdAt || 0).getTime()
      return sortFilter === 'oldest' ? da - db : db - da
    })
    return result
  }, [tasks, searchTerm, categoryFilter, durationFilter, difficultyFilter, sortFilter])

  const availableTasks = useMemo(
    () => filteredTasks.filter((t) => !isDeadlinePast(t.deadline)),
    [filteredTasks]
  )

  const deadlineCrossedTasks = useMemo(
    () => filteredTasks.filter((t) => isDeadlinePast(t.deadline)),
    [filteredTasks]
  )

  const uniqueCategories = useMemo(
    () => Array.from(new Set(tasks.map((t) => t.category).filter(Boolean))) as string[],
    [tasks]
  )

  const openDetails = (task: FreelancingTask) => {
    setSelectedTask(task)
    setEnrollError('')
    setEnrollSuccess('')
    setShowModal(true)
  }

  const openWorkflow = (task: FreelancingTask) => {
    setSelectedTask(task)
    setShowWorkflowModal(true)
  }

  const openTaskDetails = (task: FreelancingTask) => {
    // Prefer the myTasks version which has mySubmission + enrollment data
    const enriched = myTasks.find(t => t._id === task._id) ?? task
    setTaskDetailsTask(enriched)
    setShowTaskDetailsModal(true)
  }

  const isBeforeStartDate = (d?: string | null) => {
    if (!d) return false
    return new Date() < new Date(d)
  }

  // ── Render: Task Card ────────────────────────────────────────────────────
  const renderTaskCard = (task: FreelancingTask, enrolled = false) => {
    const deadlinePast = isDeadlinePast(task.deadline)
    const full = (task.spotsLeft ?? 0) <= 0
    const notStarted = isBeforeStartDate(task.startDate)
    const submissionStatus = task.mySubmission?.status || 'pending'
    const reviewStatus = task.mySubmission?.adminReviewStatus || 'pending'
    const enrolledPct = task.maxStudents ? Math.round(((task.enrolledCount ?? 0) / task.maxStudents) * 100) : 0

    const statusChip = deadlinePast
      ? <span className="tc-status-chip closed">Closed</span>
      : full
        ? <span className="tc-status-chip full">Full</span>
        : notStarted
          ? <span className="tc-status-chip soon">{getStartCountdown(task.startDate)}</span>
          : task.isEnrolled
            ? <span className="tc-status-chip enrolled">Enrolled</span>
            : <span className="tc-status-chip open">{task.spotsLeft ?? task.maxStudents ?? 0} spot{(task.spotsLeft ?? 1) !== 1 ? 's' : ''} left</span>

    return (
      <Col key={task._id} lg={4} md={6} xs={12}>
        <div className="tc-card" onClick={() => enrolled ? openWorkflow(task) : openTaskDetails(task)}>
          {/* Top row: category + status */}
          <div className="tc-top">
            <div className="tc-chips">
              {task.category && (
                <span className="tc-chip tc-cat">
                  {(CATEGORY_LABELS[task.category] || task.category).replace(/^[^\s]+\s/, '')}
                </span>
              )}
              {task.ndaRequired && (
                <span className="tc-chip tc-nda"><FaLock size={9} style={{marginRight:3}}/>NDA</span>
              )}
            </div>
            {statusChip}
          </div>

          {/* Title */}
          <h4 className="tc-title">{task.title}</h4>

          {/* Meta line */}
          <div className="tc-meta">
            {task.amount
              ? <span className="tc-budget">₹{task.amount.toLocaleString()}</span>
              : <span className="tc-budget-nil">No budget</span>
            }
            {task.deadline && (
              <>
                <span className="tc-sep">·</span>
                <span className={deadlinePast ? 'tc-date overdue' : 'tc-date'}>
                  <FaCalendarAlt style={{fontSize:'0.6rem', marginRight:3}}/>
                  Due {new Date(task.deadline).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'})}
                </span>
              </>
            )}
            {task.experience && (
              <>
                <span className="tc-sep">·</span>
                <span className="tc-exp">{EXPERIENCE_LABELS[task.experience]?.replace(/^[^\s]+\s/, '') || task.experience}</span>
              </>
            )}
          </div>

          {/* Skills */}
          {(task.skills?.length ?? 0) > 0 && (
            <div className="tc-skills">
              {task.skills!.slice(0, 3).map((s) => (
                <span key={s} className="tc-skill">{s}</span>
              ))}
              {task.skills!.length > 3 && (
                <span className="tc-skill more">+{task.skills!.length - 3}</span>
              )}
            </div>
          )}

          {/* Enrollment bar */}
          {typeof task.maxStudents === 'number' && task.maxStudents > 0 && (
            <div className="tc-bar-wrap">
              <div className="tc-bar">
                <div className="tc-bar-fill" style={{ width: `${enrolledPct}%` }} />
              </div>
              <span className="tc-bar-text">{task.enrolledCount ?? 0}/{task.maxStudents}</span>
            </div>
          )}

          {/* Submission status (enrolled tab) */}
          {enrolled && (
            <div className="tc-sub-row">
              <span className={`tc-sub-chip ${submissionStatus === 'completed' ? 'done' : 'pend'}`}>
                {submissionStatus === 'completed' ? '✓ Submitted' : '● Pending'}
              </span>
              <span className={`tc-sub-chip ${reviewStatus === 'approved' ? 'appr' : reviewStatus === 'rejected' ? 'rej' : 'rev'}`}>
                {reviewStatus === 'approved' ? '✓ Approved' : reviewStatus === 'rejected' ? '✕ Rejected' : '⌛ In Review'}
              </span>
            </div>
          )}

          {/* Footer actions */}
          <div className="tc-actions" onClick={e => e.stopPropagation()}>
            <button className="tc-btn-ghost" onClick={() => enrolled ? openWorkflow(task) : openTaskDetails(task)}>
              {enrolled ? 'Open Task' : 'View Details'}
            </button>
            {enrolled ? (
              <button className="tc-btn-primary" onClick={() => openWorkflow(task)}>Continue →</button>
            ) : task.isEnrolled ? (
              <button className="tc-btn-success" disabled><FaCheckCircle size={11} style={{marginRight:4}}/>Enrolled</button>
            ) : deadlinePast || notStarted || full ? (
              <button className="tc-btn-disabled" disabled>{deadlinePast ? 'Closed' : notStarted ? 'Soon' : 'Full'}</button>
            ) : (
              <button className="tc-btn-primary" disabled={enrolling === task._id} onClick={() => handleEnroll(task._id)}>
                {enrolling === task._id ? <Spinner animation="border" size="sm" className="me-1"/> : null}
                Apply Now
              </button>
            )}
          </div>
        </div>
      </Col>
    )
  }

  const getStartCountdown = (d?: string | null) => {
  if (!d) return ''
  const diff = new Date(d).getTime() - Date.now()

  if (diff <= 0) return 'Live'

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 0) return `Starts in ${hours}h ${mins}m`
  return `Starts in ${mins}m`
}

  // ── Render: Jira Kanban Board ────────────────────────────────────────────
  const renderMyTasksJiraBoard = () => {
    const COLUMNS = [
      { key: 'todo',     label: 'To Do',           color: '#6b778c', actionLabel: 'Submit Work',     actionStyle: { background: '#ff6b35', border: 'none', color: '#fff' } },
      { key: 'inreview', label: 'In Review',        color: '#0052cc', actionLabel: 'View Submission', actionStyle: { border: '1px solid #0052cc', color: '#0052cc', background: 'transparent' } },
      { key: 'approved', label: 'Approved',          color: '#36b37e', actionLabel: 'View Result',     actionStyle: { border: '1px solid #36b37e', color: '#36b37e', background: 'transparent' } },
      { key: 'revision', label: 'Revision Needed',   color: '#de350b', actionLabel: 'Resubmit',        actionStyle: { border: '1px solid #de350b', color: '#de350b', background: 'transparent' } },
    ]

    const classify = (task: FreelancingTask): string => {
      const sub = task.mySubmission
      if (!sub) return 'todo'
      const r = sub.adminReviewStatus || 'pending'
      if (r === 'approved') return 'approved'
      if (r === 'rejected') return 'revision'
      if ((sub.status || 'pending') === 'completed') return 'inreview'
      return 'todo'
    }

    const buckets: Record<string, FreelancingTask[]> = { todo: [], inreview: [], approved: [], revision: [] }
    myTasks.forEach((t) => buckets[classify(t)].push(t))

    const formatShortDate = (d?: string | null) => {
      if (!d) return '—'
      const dt = new Date(d)
      return isNaN(dt.getTime()) ? d : dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    }

    const getDaysLeft = (d?: string | null) => {
      if (!d) return { label: '', overdue: false }
      const diff = new Date(d).getTime() - Date.now()
      if (diff < 0) return { label: 'Overdue', overdue: true }
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
      return { label: `${days}d left`, overdue: false }
    }


    return (
      <div className="jira-kanban-board">
        {COLUMNS.map(col => {
          const colTasks = buckets[col.key]
          const isActive = boardFilter === col.key || boardFilter === null
          return (
            <div key={col.key} className={`jira-kanban-col${!isActive ? ' jira-col-dimmed' : ''}`}>
              {/* Column header */}
              <div
                className="jira-kanban-header"
                onClick={() => setBoardFilter(boardFilter === col.key ? null : col.key)}
              >
                <span className="jira-kanban-label" style={{ color: col.color }}>
                  {col.label.toUpperCase()}
                </span>
                <span className="jira-kanban-count">{colTasks.length}</span>
              </div>

              {/* Cards */}
              <div className="jira-kanban-cards">
                {colTasks.length === 0 ? (
                  <div className="jira-kanban-empty">No tasks</div>
                ) : colTasks.map((task, idx) => {
                  const { overdue } = getDaysLeft(task.deadline)
                  const categoryLabel = task.category ? (CATEGORY_LABELS[task.category] || task.category) : null
                  const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
                    web_development:   { bg: '#0052cc22', text: '#4c9aff' },
                    mobile_development:{ bg: '#6554c022', text: '#998dd9' },
                    design:            { bg: '#00875a22', text: '#57d9a3' },
                    data_science:      { bg: '#ff5630220', text: '#ff8f73' },
                    writing:           { bg: '#ff991f22', text: '#ffc400' },
                    marketing:         { bg: '#00b8d922', text: '#00c7e6' },
                    other:             { bg: '#42526e22', text: '#8993a4' },
                  }
                  const catColor = categoryLabel
                    ? (CATEGORY_COLORS[task.category!] ?? { bg: 'rgba(255,107,53,0.12)', text: '#ff6b35' })
                    : null

                  return (
                    <div
                      key={task._id}
                      className="jira-kanban-card"
                      style={{ borderLeft: `3px solid ${col.color}` }}
                      onClick={() => openWorkflow(task)}
                    >
                      {/* EK ticket id */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.45rem' }}>
                        <span style={{
                          fontFamily: 'monospace',
                          fontSize: '0.66rem',
                          fontWeight: 700,
                          color: col.color,
                          background: `${col.color}18`,
                          padding: '0.1rem 0.4rem',
                          borderRadius: '3px',
                          letterSpacing: '0.3px',
                        }}>
                          EK-{(idx + 1).toString().padStart(3, '0')}
                        </span>
                        {task.amount ? (
                          <span style={{ marginLeft: 'auto', fontSize: '0.72rem', fontWeight: 700, color: '#ff6b35' }}>
                            ₹{task.amount.toLocaleString()}
                          </span>
                        ) : null}
                      </div>

                      {/* Title */}
                      <div className="jira-kanban-card-title">{task.title}</div>

                      {/* Feedback for revision */}
                      {task.mySubmission?.adminFeedback && col.key === 'revision' && (
                        <div className="jira-feedback" style={{ marginTop: '0.5rem' }}>
                          {task.mySubmission.adminFeedback}
                        </div>
                      )}

                      {/* Category badge */}
                      {categoryLabel && catColor && (
                        <div style={{ marginTop: '0.55rem' }}>
                          <span style={{
                            display: 'inline-block',
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            letterSpacing: '0.3px',
                            background: catColor.bg,
                            color: catColor.text,
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                            border: `1px solid ${catColor.text}33`,
                          }}>
                            {categoryLabel.replace(/^[^\s]+\s/, '').toUpperCase()}
                          </span>
                        </div>
                      )}

                      {/* Deadline row */}
                      {task.deadline && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          marginTop: '0.55rem',
                          fontSize: '0.68rem',
                          color: overdue ? '#de350b' : '#555',
                        }}>
                          <span style={{ fontSize: '0.6rem' }}>📅</span>
                          {formatShortDate(task.deadline)}
                          {overdue && <span style={{ fontWeight: 600, color: '#de350b' }}>· Overdue</span>}
                        </div>
                      )}

                      {/* Action button */}
                      <button
                        className="kanban-action-btn"
                        style={{ ...col.actionStyle, marginTop: '0.7rem' }}
                        onClick={e => { e.stopPropagation(); openWorkflow(task) }}
                      >
                        {col.actionLabel}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // ── Render: My Tasks List View ───────────────────────────────────────────
  const renderMyTasksListView = () => {
    const classify = (task: FreelancingTask) => {
      const r = task.mySubmission?.adminReviewStatus
      const s = task.mySubmission?.status
      if (r === 'approved') return 'approved'
      if (r === 'rejected') return 'revision'
      if (s === 'completed') return 'review'
      if (task.isEnrolled) return 'inprogress'
      return 'upcoming'
    }

    const getProgress = (task: FreelancingTask) => {
      const status = classify(task)
      if (status === 'approved') return 100
      if (status === 'review') return 85
      if (status === 'revision') return 40
      if (status === 'inprogress') return 60
      return 0
    }

    const formatDate = (d?: string | null) =>
      d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

    const getDaysLeft = (d?: string | null) => {
      if (!d) return null
      const diff = Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      if (diff < 0) return { label: 'Overdue', overdue: true }
      return { label: `${diff} days left`, overdue: false }
    }

    const filtered = myTasks.filter(t => {
      const matchSearch = !taskSearch || t.title.toLowerCase().includes(taskSearch.toLowerCase())
      const matchStatus = statusFilter === 'all' || classify(t) === statusFilter
      const matchModule = moduleFilter === 'all' || t.category === moduleFilter
      return matchSearch && matchStatus && matchModule
    })

    const categories = Array.from(new Set(myTasks.map(t => t.category).filter(Boolean)))

    return (
      <div>
        {/* Search + Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200, background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px' }}>
            <FaSearch style={{ color: PAGE_GRAY, fontSize: 13, flexShrink: 0 }} />
            <input value={taskSearch} onChange={e => setTaskSearch(e.target.value)} placeholder="Search task..." style={{ border: 'none', outline: 'none', fontSize: 13, color: PAGE_GRAY, background: 'none', width: '100%' }} />
          </div>
          <select value={moduleFilter} onChange={e => setModuleFilter(e.target.value)} style={{ padding: '9px 14px', borderRadius: 10, border: `1px solid ${PAGE_BORDER}`, fontSize: 13, color: PAGE_GRAY, background: CARD_BG, outline: 'none' }}>
            <option value="all">All Modules</option>
            {categories.map(c => <option key={c} value={c!}>{c}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '9px 14px', borderRadius: 10, border: `1px solid ${PAGE_BORDER}`, fontSize: 13, color: PAGE_GRAY, background: CARD_BG, outline: 'none' }}>
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="inprogress">In Progress</option>
            <option value="review">Under Review</option>
            <option value="revision">Revision</option>
            <option value="upcoming">Upcoming</option>
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
            <span style={{ fontSize: 12, color: PAGE_GRAY, fontWeight: 600 }}>View:</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#fff7f0', border: `1px solid ${ORANGE}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FaThLarge style={{ color: ORANGE, fontSize: 14 }} />
            </div>
            <div style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${PAGE_BORDER}`, background: CARD_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <FaFilter style={{ color: PAGE_GRAY, fontSize: 12 }} />
            </div>
          </div>
        </div>

        {/* Heading */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: PAGE_TEXT }}>Tasks & Progress</div>
          <div style={{ fontSize: 12, color: PAGE_GRAY, marginTop: 2 }}>Complete tasks in order and submit for review.</div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ background: CARD_BG, borderRadius: 14, border: `1px solid ${PAGE_BORDER}`, padding: 48, textAlign: 'center' }}>
            <FaBriefcase style={{ fontSize: 40, color: '#cbd5e1', marginBottom: 12 }} />
            <div style={{ fontWeight: 700, color: PAGE_TEXT }}>No tasks found</div>
          </div>
        ) : (
          <div style={{ background: CARD_BG, borderRadius: 14, border: `1px solid ${PAGE_BORDER}`, overflow: 'hidden' }}>
            {filtered.map((task, i) => {
              const status = classify(task)
              const progress = getProgress(task)
              const daysLeft = getDaysLeft(task.deadline)
              const isActive = status === 'inprogress'
              const isDone = status === 'approved'
              const isRevision = status === 'revision'
              const isReview = status === 'review'
              const isUpcoming = status === 'upcoming'
              const isLast = i === filtered.length - 1

              const circleColor = isDone ? '#22c55e' : isActive ? ORANGE : isRevision ? '#f59e0b' : isReview ? '#3b82f6' : '#cbd5e1'
              const lineColor = isDone ? '#22c55e40' : isActive ? `${ORANGE}40` : '#f1f5f9'

              const score = getScore(task)
              const submittedAt = (task.mySubmission as any)?.submittedAt || (task.mySubmission as any)?.createdAt

              return (
                <div key={task._id} style={{
                  display: 'grid',
                  gridTemplateColumns: '54px 1fr 140px 120px 110px 190px',
                  alignItems: 'center',
                  padding: '18px 24px',
                  borderBottom: isLast ? 'none' : `1px solid ${PAGE_BORDER}`,
                  background: isActive ? '#fff8f5' : CARD_BG,
                }}>

                  {/* Number + timeline line */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: circleColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: isUpcoming ? PAGE_GRAY : '#fff', zIndex: 1 }}>
                      {isDone ? <FaCheckCircle style={{ fontSize: 16, color: '#fff' }} /> : i + 1}
                    </div>
                  </div>

                  {/* Task info */}
                  <div style={{ minWidth: 0, paddingRight: 24 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: PAGE_TEXT, marginBottom: 3 }}>{task.title}</div>
                    {task.description && (
                      <div style={{ fontSize: 12, color: PAGE_GRAY, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{stripHtml(task.description)}</div>
                    )}
                  </div>

                  {/* Date info */}
                  <div style={{ borderLeft: `1px solid ${PAGE_BORDER}`, paddingLeft: 16 }}>
                    <div style={{ fontSize: 11, color: PAGE_GRAY, fontWeight: 600, marginBottom: 4 }}>{isDone || isReview ? 'Submitted on' : 'Deadline'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: PAGE_GRAY, fontWeight: 600 }}>
                      <FaCalendarAlt style={{ fontSize: 10, color: PAGE_GRAY }} />
                      {isDone || isReview ? formatDate(submittedAt) : formatDate(task.deadline)}
                    </div>
                    {isActive && daysLeft && (
                      <div style={{ fontSize: 11, fontWeight: 700, color: daysLeft.overdue ? '#ef4444' : ORANGE, marginTop: 4 }}>{daysLeft.label}</div>
                    )}
                  </div>

                  {/* Status badge */}
                  <div style={{ borderLeft: `1px solid ${PAGE_BORDER}`, paddingLeft: 16 }}>
                    <div style={{ fontSize: 11, color: PAGE_GRAY, fontWeight: 600, marginBottom: 6 }}>Status</div>
                    {isDone && <span style={{ fontSize: 12, fontWeight: 700, color: '#22c55e', background: '#f0fdf4', borderRadius: 20, padding: '4px 12px' }}>Approved</span>}
                    {isActive && <span style={{ fontSize: 12, fontWeight: 700, color: ORANGE, background: '#fff7f0', border: `1px solid ${ORANGE}40`, borderRadius: 20, padding: '4px 12px' }}>In Progress</span>}
                    {isReview && <span style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6', background: '#eff6ff', borderRadius: 20, padding: '4px 12px' }}>Under Review</span>}
                    {isRevision && <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', background: '#fffbeb', borderRadius: 20, padding: '4px 12px' }}>Revision</span>}
                    {isUpcoming && <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', background: '#f8fafc', borderRadius: 20, padding: '4px 12px' }}>Upcoming</span>}
                  </div>

                  {/* Score / Progress */}
                  <div style={{ borderLeft: `1px solid ${PAGE_BORDER}`, paddingLeft: 16 }}>
                    {isDone || isReview ? (
                      <>
                        <div style={{ fontSize: 11, color: PAGE_GRAY, fontWeight: 600, marginBottom: 4 }}>Score</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: score != null ? (score >= 7 ? '#22c55e' : score >= 5 ? '#f59e0b' : '#ef4444') : PAGE_GRAY }}>
                          {score != null ? `${score} / 10` : '— / 10'}
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: 11, color: PAGE_GRAY, fontWeight: 600, marginBottom: 4 }}>Progress</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: PAGE_TEXT, marginBottom: 5 }}>{progress}%</div>
                        <div style={{ height: 5, background: PAGE_BORDER, borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${progress}%`, background: isActive ? ORANGE : '#cbd5e1', borderRadius: 3 }} />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Action button */}
                  <div style={{ borderLeft: `1px solid ${PAGE_BORDER}`, paddingLeft: 16, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                    {isDone && (
                      <button onClick={() => { setFeedbackTask(task); setShowFeedbackModal(true) }} style={{ padding: '8px 16px', borderRadius: 9, border: '1.5px solid #22c55e', background: CARD_BG, color: '#22c55e', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>View Feedback</button>
                    )}
                    {isReview && (
                      <button onClick={() => openWorkflow(task)} style={{ padding: '8px 16px', borderRadius: 9, border: '1.5px solid #3b82f6', background: CARD_BG, color: '#3b82f6', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>View Submission</button>
                    )}
                    {isRevision && (
                      <button onClick={() => openWorkflow(task)} style={{ padding: '8px 16px', borderRadius: 9, border: 'none', background: '#f59e0b', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>Resubmit</button>
                    )}
                    {isActive && (
                      <button onClick={() => openWorkflow(task)} style={{ padding: '8px 20px', borderRadius: 9, border: 'none', background: ORANGE, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>Continue Task</button>
                    )}
                    {isUpcoming && (
                      <button disabled style={{ padding: '8px 20px', borderRadius: 9, border: `1.5px solid ${PAGE_BORDER}`, background: CARD_BG, color: PAGE_GRAY, fontSize: 12, fontWeight: 700, cursor: 'not-allowed', whiteSpace: 'nowrap' }}>Start Task</button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // ── Render: My Internship View ───────────────────────────────────────────
  const renderMyInternshipView = () => {
    const ORANGE = '#ff6b00'
    const SUB_TABS = ['Overview', 'My Tasks', 'My Submissions', 'Feedback', 'Certificate'] as const

    const getStatusInfo = (task: FreelancingTask) => {
      const r = task.mySubmission?.adminReviewStatus
      const s = task.mySubmission?.status
      if (r === 'approved')  return { label: 'Completed',         color: '#22c55e', bg: '#f0fdf4' }
      if (r === 'rejected')  return { label: 'Needs Improvement', color: '#ef4444', bg: '#fef2f2' }
      if (s === 'completed') return { label: 'Review Pending',    color: '#f59e0b', bg: '#fffbeb' }
      return                        { label: 'In Progress',       color: '#3b82f6', bg: '#eff6ff' }
    }

    const getProgress = (task: FreelancingTask) => {
      const r = task.mySubmission?.adminReviewStatus
      const s = task.mySubmission?.status
      if (r === 'approved') return 100
      if (r === 'rejected') return 40
      if (s === 'completed') return 85
      return task.isEnrolled ? 30 : 0
    }

    const CAT_META_LOCAL: Record<string, { color: string; bg: string }> = {
      'web-development':    { color: '#3b82f6', bg: '#eff6ff' },
      'ai-ml':              { color: '#8b5cf6', bg: '#f5f3ff' },
      'data-science':       { color: '#06b6d4', bg: '#ecfeff' },
      'ui-ux':              { color: '#ec4899', bg: '#fdf2f8' },
      'mobile-development': { color: '#f59e0b', bg: '#fffbeb' },
      devops:               { color: '#22c55e', bg: '#f0fdf4' },
      cybersecurity:        { color: '#ef4444', bg: '#fef2f2' },
      blockchain:           { color: '#6366f1', bg: '#eef2ff' },
    }

    return (
      <div>
        {/* Sub-tab bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: CARD_BG, borderRadius: 12, border: `1px solid ${PAGE_BORDER}`, padding: '6px 12px', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {SUB_TABS.map(tab => {
              const key = tab.toLowerCase().replace(' ', '-').replace('my-', '') as typeof myInternshipSubTab
              const k = tab === 'My Tasks' ? 'tasks' : tab === 'My Submissions' ? 'submissions' : tab.toLowerCase() as typeof myInternshipSubTab
              const active = myInternshipSubTab === k
              return (
                <button
                  key={tab}
                  onClick={() => setMyInternshipSubTab(k)}
                  style={{ padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', background: active ? '#fff7f0' : 'transparent', color: active ? ORANGE : PAGE_GRAY, borderBottom: active ? `2px solid ${ORANGE}` : '2px solid transparent' }}
                >
                  {tab}
                </button>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ background: PAGE_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 7, padding: '7px 12px' }}>
              <FaSearch style={{ color: PAGE_GRAY, fontSize: 12 }} />
              <input value={overviewSearch} onChange={e => setOverviewSearch(e.target.value)} placeholder="Search internships..." style={{ border: 'none', background: 'none', outline: 'none', fontSize: 12, color: PAGE_GRAY, width: 140 }} />
            </div>
            <select value={overviewStatus} onChange={e => setOverviewStatus(e.target.value)} style={{ padding: '7px 10px', borderRadius: 8, border: `1px solid ${PAGE_BORDER}`, fontSize: 12, color: PAGE_GRAY, background: CARD_BG, outline: 'none' }}>
              <option value="all">Status (All)</option>
              <option value="inprogress">In Progress</option>
              <option value="review">Review Pending</option>
              <option value="approved">Completed</option>
              <option value="revision">Revision</option>
            </select>
            <select value={overviewSort} onChange={e => setOverviewSort(e.target.value)} style={{ padding: '7px 10px', borderRadius: 8, border: `1px solid ${PAGE_BORDER}`, fontSize: 12, color: PAGE_GRAY, background: CARD_BG, outline: 'none' }}>
              <option value="newest">Sort: Newest</option>
              <option value="oldest">Sort: Oldest</option>
            </select>
          </div>
        </div>

        {myInternshipSubTab === 'overview' && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: PAGE_TEXT }}>My Enrolled Internships</div>
              <div style={{ fontSize: 12, color: PAGE_GRAY, marginTop: 2 }}>Track your progress and complete tasks on time.</div>
            </div>

            {myTasks.length === 0 ? (
              <div style={{ background: CARD_BG, borderRadius: 14, border: `1px solid ${PAGE_BORDER}`, padding: 48, textAlign: 'center' }}>
                <FaGraduationCap style={{ fontSize: 48, color: '#cbd5e1', marginBottom: 12 }} />
                <div style={{ fontWeight: 700, color: PAGE_TEXT, marginBottom: 6 }}>No enrollments yet</div>
                <button onClick={() => setActiveTab('available')} style={{ marginTop: 10, padding: '9px 20px', borderRadius: 10, border: 'none', background: ORANGE, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Browse Internships</button>
              </div>
            ) : (() => {
              const overviewClassify = (task: FreelancingTask) => {
                const r = task.mySubmission?.adminReviewStatus
                const s = task.mySubmission?.status
                if (r === 'approved') return 'approved'
                if (r === 'rejected') return 'revision'
                if (s === 'completed') return 'review'
                if (task.isEnrolled) return 'inprogress'
                return 'inprogress'
              }
              const filteredTasks = myTasks
                .filter(task => {
                  const matchSearch = !overviewSearch || task.title.toLowerCase().includes(overviewSearch.toLowerCase())
                  const matchStatus = overviewStatus === 'all' || overviewClassify(task) === overviewStatus
                  return matchSearch && matchStatus
                })
                .sort((a, b) => {
                  const da = new Date(a.startDate || 0).getTime()
                  const db = new Date(b.startDate || 0).getTime()
                  return overviewSort === 'oldest' ? da - db : db - da
                })
              return filteredTasks.length === 0 ? (
                <div style={{ background: CARD_BG, borderRadius: 14, border: `1px solid ${PAGE_BORDER}`, padding: 48, textAlign: 'center' }}>
                  <FaBriefcase style={{ fontSize: 40, color: '#cbd5e1', marginBottom: 12 }} />
                  <div style={{ fontWeight: 700, color: PAGE_TEXT }}>No internships match your filters</div>
                </div>
              ) : (
              <div>
                {filteredTasks.map(task => {
                  const catStyle = CAT_META_LOCAL[task.category || ''] ?? { color: PAGE_GRAY, bg: PAGE_BG }
                  const status = getStatusInfo(task)
                  const progress = getProgress(task)
                  const totalTasks = task.maxStudents ?? 20
                  const doneTasks = Math.round((progress / 100) * totalTasks)
                  const currentStage = task.mySubmission?.adminReviewStatus === 'rejected' ? 'Revision Required'
                    : task.mySubmission?.status === 'completed' ? 'Final Review'
                    : task.title.split(' ').slice(0, 2).join(' ')
                  const taskScore = getScore(task)

                  return (
                    <div key={task._id} style={{ background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 14, padding: '20px 22px', marginBottom: 14, display: 'flex', gap: 20, alignItems: 'stretch', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
                      {/* Left: company icon + details */}
                      <div style={{ display: 'flex', gap: 14, flex: 1, minWidth: 0 }}>
                        <div style={{ width: 52, height: 52, borderRadius: 12, background: catStyle.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <FaBriefcase style={{ color: catStyle.color, fontSize: 22 }} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 15, fontWeight: 800, color: PAGE_TEXT, marginBottom: 3 }}>{task.title}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <span style={{ fontSize: 12, color: PAGE_GRAY, fontWeight: 600 }}>Eklav Technologies</span>
                            <span style={{ fontSize: 10, background: PAGE_BORDER, color: PAGE_GRAY, borderRadius: 20, padding: '2px 8px', fontWeight: 600 }}>Remote</span>
                          </div>
                          {task.description && (
                            <p style={{ fontSize: 12, color: PAGE_GRAY, margin: '0 0 10px', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
                              {stripHtml(task.description)}
                            </p>
                          )}
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {task.deadline && task.startDate && (
                              <span style={{ fontSize: 11, background: PAGE_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 20, padding: '3px 10px', color: PAGE_GRAY, fontWeight: 600 }}>
                                Duration: {Math.ceil((new Date(task.deadline).getTime() - new Date(task.startDate).getTime()) / (1000 * 60 * 60 * 24))} Days
                              </span>
                            )}
                            <span style={{ fontSize: 11, background: PAGE_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 20, padding: '3px 10px', color: PAGE_GRAY, fontWeight: 600 }}>
                              Enrolled on: {task.startDate ? new Date(task.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                            </span>
                            {task.maxStudents != null && (
                              <span style={{ fontSize: 11, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 20, padding: '3px 10px', color: '#3b82f6', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <FaUsers style={{ fontSize: 9 }} />
                                {task.enrolledCount ?? 0} / {task.maxStudents} Seats
                              </span>
                            )}
                            {task.spotsLeft != null && (
                              <span style={{ fontSize: 11, background: task.spotsLeft === 0 ? '#fef2f2' : '#f0fdf4', border: `1px solid ${task.spotsLeft === 0 ? '#fecaca' : '#bbf7d0'}`, borderRadius: 20, padding: '3px 10px', color: task.spotsLeft === 0 ? '#ef4444' : '#22c55e', fontWeight: 600 }}>
                                {task.spotsLeft === 0 ? 'Full' : `${task.spotsLeft} spot${task.spotsLeft !== 1 ? 's' : ''} left`}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Center: Progress */}
                      <div style={{ width: 190, flexShrink: 0, borderLeft: `1px solid ${PAGE_BORDER}`, paddingLeft: 20 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: PAGE_GRAY, textTransform: 'uppercase', marginBottom: 4 }}>Overall Progress</div>
                        <div style={{ fontSize: 26, fontWeight: 900, color: PAGE_TEXT, lineHeight: 1, marginBottom: 6 }}>{progress}%</div>
                        <div style={{ height: 6, background: PAGE_BORDER, borderRadius: 4, marginBottom: 6, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${progress}%`, background: progress >= 80 ? '#22c55e' : progress >= 50 ? '#f59e0b' : ORANGE, borderRadius: 4, transition: 'width 0.3s' }} />
                        </div>
                        <div style={{ fontSize: 11, color: PAGE_GRAY }}>{doneTasks} / {totalTasks} Tasks Completed</div>
                      </div>

                      {/* Center: Stage + Submission */}
                      <div style={{ width: 190, flexShrink: 0, borderLeft: `1px solid ${PAGE_BORDER}`, paddingLeft: 20 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: PAGE_GRAY, textTransform: 'uppercase', marginBottom: 4 }}>Current Stage</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: catStyle.color, marginBottom: 12 }}>{currentStage}</div>
                        {taskScore != null ? (
                          <>
                            <div style={{ fontSize: 10, fontWeight: 700, color: PAGE_GRAY, textTransform: 'uppercase', marginBottom: 4 }}>AI Score</div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                              <span style={{ fontSize: 20, fontWeight: 900, color: taskScore >= 7 ? '#22c55e' : taskScore >= 5 ? '#f59e0b' : '#ef4444' }}>{taskScore}</span>
                              <span style={{ fontSize: 11, color: PAGE_GRAY, fontWeight: 600 }}> / 10</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div style={{ fontSize: 10, fontWeight: 700, color: PAGE_GRAY, textTransform: 'uppercase', marginBottom: 4 }}>Next Submission</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: PAGE_GRAY, fontWeight: 600 }}>
                              <FaCalendarAlt style={{ fontSize: 10, color: PAGE_GRAY }} />
                              {task.deadline ? new Date(task.deadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Right: Status + Actions */}
                      <div style={{ width: 190, flexShrink: 0, borderLeft: `1px solid ${PAGE_BORDER}`, paddingLeft: 20, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: PAGE_GRAY, textTransform: 'uppercase', marginBottom: 4 }}>Status</div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: status.color, whiteSpace: 'nowrap' }}>{status.label}</div>
                        </div>
                        {task.mySubmission?.adminReviewStatus === 'rejected' ? (
                          <button onClick={() => openWorkflow(task)} style={{ width: '100%', padding: '9px 0', borderRadius: 9, border: `1.5px solid ${status.color}`, background: CARD_BG, color: status.color, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                            View Feedback
                          </button>
                        ) : task.mySubmission?.status !== 'completed' ? (
                          <button onClick={() => openWorkflow(task)} style={{ width: '100%', padding: '9px 0', borderRadius: 9, border: 'none', background: ORANGE, color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                            Continue Work
                          </button>
                        ) : null}
                        <button onClick={() => openTaskDetails(task)} style={{ padding: 0, border: 'none', background: 'transparent', color: ORANGE, fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                          View Details <FaArrowRight style={{ fontSize: 10 }} />
                        </button>
                      </div>
                    </div>
                  )
                })}

                <div style={{ textAlign: 'center', fontSize: 12, color: PAGE_GRAY, marginTop: 16 }}>
                  Showing {filteredTasks.length} of {myTasks.length} internship{myTasks.length !== 1 ? 's' : ''}
                </div>
              </div>
              )
            })()}
          </div>
        )}

        {myInternshipSubTab === 'tasks' && renderMyTasksListView()}

        {(myInternshipSubTab === 'submissions' || myInternshipSubTab === 'feedback' || myInternshipSubTab === 'certificate') && (
          <div style={{ background: CARD_BG, borderRadius: 14, border: `1px solid ${PAGE_BORDER}`, padding: 48, textAlign: 'center' }}>
            <FaBriefcase style={{ fontSize: 40, color: '#cbd5e1', marginBottom: 12 }} />
            <div style={{ fontWeight: 700, color: PAGE_TEXT, marginBottom: 4 }}>Coming Soon</div>
            <div style={{ fontSize: 13, color: PAGE_GRAY }}>This section is under development.</div>
          </div>
        )}
      </div>
    )
  }

  // ── JSX ──────────────────────────────────────────────────────────────────

  const ORANGE = '#ff6b00'

  const CAT_META: Record<string, { Icon: any; color: string; bg: string; label: string }> = {
    'web-development':    { Icon: FaCode,       color: '#3b82f6', bg: '#eff6ff', label: 'Web Development'    },
    'ai-ml':              { Icon: FaRobot,      color: '#8b5cf6', bg: '#f5f3ff', label: 'AI / ML'            },
    'data-science':       { Icon: FaDatabase,   color: '#06b6d4', bg: '#ecfeff', label: 'Data Science'       },
    'ui-ux':              { Icon: FaPaintBrush, color: '#ec4899', bg: '#fdf2f8', label: 'UI/UX Design'       },
    'mobile-development': { Icon: FaMobile,     color: '#f59e0b', bg: '#fffbeb', label: 'Mobile Development' },
    devops:               { Icon: FaCloud,      color: '#22c55e', bg: '#f0fdf4', label: 'DevOps'             },
    cybersecurity:        { Icon: FaShieldAlt,  color: '#ef4444', bg: '#fef2f2', label: 'Cyber Security'     },
    blockchain:           { Icon: FaLayerGroup, color: '#6366f1', bg: '#eef2ff', label: 'Blockchain'         },
  }

  const DIFF_COLOR: Record<string, { color: string; bg: string }> = {
    beginner:     { color: '#22c55e', bg: '#f0fdf4' },
    intermediate: { color: '#f59e0b', bg: '#fffbeb' },
    advanced:     { color: '#ef4444', bg: '#fef2f2' },
    expert:       { color: '#8b5cf6', bg: '#f5f3ff' },
  }

  const enrolledTasks  = tasks.filter(t => t.isEnrolled)
  const inProgressCount = myTasks.filter(t => !t.mySubmission || t.mySubmission.status === 'pending').length
  const underReviewCount = myTasks.filter(t => t.mySubmission?.status === 'completed' && t.mySubmission?.adminReviewStatus === 'pending').length
  const completedCount = myTasks.filter(t => t.mySubmission?.adminReviewStatus === 'approved').length

  const getScore = (task: FreelancingTask): number | null => {
    const ai = (task.mySubmission as any)?.aiEvaluation
    if (!ai) return null
    if (ai.adminFinalScore != null) return ai.adminFinalScore
    if (ai.score != null) return ai.score
    const criteria: { score: number; maxScore: number }[] = ai.criteriaEvaluation || []
    if (criteria.length > 0) {
      const total = criteria.reduce((s, c) => s + (c.score || 0), 0)
      const max   = criteria.reduce((s, c) => s + (c.maxScore || 10), 0)
      return max > 0 ? Math.round((total / max) * 10 * 10) / 10 : null
    }
    return null
  }

  const stripHtml = (html?: string | null) => {
    if (!html) return ''
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s{2,}/g, ' ')
      .trim()
  }


  const JOURNEY_STEPS = [
    { label: 'Enrolled',          sub: enrolledTasks[0] ? new Date(enrolledTasks[0].createdAt || '').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Not yet', color: '#22c55e', done: enrolledTasks.length > 0,  Icon: FaCheckCircle  },
    { label: 'In Progress',       sub: 'Working on tasks',         color: ORANGE,    done: inProgressCount > 0,  Icon: FaClock        },
    { label: 'Under Review',      sub: 'Submitted for evaluation', color: '#3b82f6', done: underReviewCount > 0, Icon: FaChartBar     },
    { label: 'Revision (if any)', sub: 'Make changes & resubmit',  color: '#f59e0b', done: false,                Icon: FaCodeBranch   },
    { label: 'Approved',          sub: 'Final approval by mentor', color: '#8b5cf6', done: completedCount > 0,  Icon: FaCheckCircle  },
    { label: 'Completed',         sub: 'Certificate generated',    color: '#06b6d4', done: completedCount > 0,  Icon: FaTrophy       },
  ]

  const upcomingDeadlines = availableTasks
    .filter(t => t.deadline && !isDeadlinePast(t.deadline))
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 3)

  const topCategories = Object.entries(
    tasks.reduce((acc, t) => { if (t.category) acc[t.category] = (acc[t.category] || 0) + 1; return acc }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]).slice(0, 4)

  const getDaysLeft = (d?: string | null) => {
    if (!d) return { label: '', overdue: false }
    const diff = new Date(d).getTime() - Date.now()
    if (diff < 0) return { label: 'Overdue', overdue: true }
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    if (days <= 2) return { label: `${days} days left`, overdue: true }
    if (days <= 7) return { label: `${days} days left`, overdue: false }
    return { label: `In ${days} days`, overdue: false }
  }

  const renderInternshipCard = (task: FreelancingTask, enrolled = false) => {
    const deadlinePast = isDeadlinePast(task.deadline)
    const full = (task.spotsLeft ?? 0) <= 0
    const notStarted = isBeforeStartDate(task.startDate)
    const catMeta = CAT_META[task.category || ''] ?? { Icon: FaBriefcase, color: PAGE_GRAY, bg: PAGE_BG, label: task.category || 'General' }
    const diffStyle = DIFF_COLOR[task.experience || ''] ?? { color: PAGE_GRAY, bg: PAGE_BG }
    const isNew = task.createdAt && (Date.now() - new Date(task.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000
    const daysLeft = getDaysLeft(task.deadline)

    const badge = deadlinePast ? { text: 'Closed', color: '#ef4444', bg: '#fef2f2' }
      : isNew ? { text: 'New', color: '#22c55e', bg: '#f0fdf4' }
      : (task.enrolledCount ?? 0) > (task.maxStudents ?? 10) * 0.8 ? { text: 'Hot', color: '#ef4444', bg: '#fef2f2' }
      : null

    return (
      <div
        key={task._id}
        style={{ background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 14, padding: '18px 20px', display: 'flex', gap: 16, marginBottom: 12, transition: 'box-shadow 0.15s', fontFamily: "'Inter','Segoe UI',sans-serif" }}
        onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'}
        onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'}
      >
        {/* Company icon */}
        <div style={{ width: 52, height: 52, borderRadius: 12, background: catMeta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <catMeta.Icon style={{ color: catMeta.color, fontSize: 22 }} />
        </div>

        {/* Center content */}
        <div style={{ flex: 1, minWidth: 0, maxWidth: 520 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: PAGE_TEXT }}>{task.title}</span>
            {badge && <span style={{ fontSize: 10, fontWeight: 700, color: badge.color, background: badge.bg, borderRadius: 20, padding: '2px 8px' }}>{badge.text}</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: PAGE_GRAY, marginBottom: 8 }}>
            <span style={{ fontWeight: 600, color: catMeta.color }}>{catMeta.label}</span>
            <span>·</span>
            <FaMapMarkerAlt style={{ fontSize: 10 }} />
            <span>Remote</span>
            {task.ndaRequired && (
              <span style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 20, padding: '1px 8px', marginLeft: 2 }}>NDA Required</span>
            )}
          </div>
          {(task.skills?.length ?? 0) > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {task.skills!.map(s => (
                <span key={s} style={{ fontSize: 10, fontWeight: 600, background: PAGE_BORDER, color: PAGE_TEXT, borderRadius: 6, padding: '3px 8px', border: `1px solid ${PAGE_BORDER}` }}>{s}</span>
              ))}
            </div>
          )}
        </div>

        {/* Meta column: 5 stat items with icon — two columns */}
        <div style={{ flexShrink: 0, borderLeft: `1px solid ${PAGE_BORDER}`, paddingLeft: 20, display: 'flex', flexDirection: 'row', gap: 0 }}>
          {/* Column 1 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center', minWidth: 180, paddingRight: 16 }}>
            {[
              {
                label: 'Duration',
                value: task.startDate && task.deadline
                  ? `${Math.ceil((new Date(task.deadline).getTime() - new Date(task.startDate).getTime()) / (1000 * 60 * 60 * 24))} Days`
                  : '—',
                valueColor: PAGE_TEXT,
                Icon: FaClock,
                iconColor: '#6366f1',
                iconBg: 'rgba(99,102,241,0.1)',
              },
              {
                label: 'Seats',
                value: `${task.enrolledCount ?? 0} / ${task.maxStudents ?? '—'}`,
                valueColor: PAGE_TEXT,
                Icon: FaUsers,
                iconColor: '#0ea5e9',
                iconBg: 'rgba(14,165,233,0.1)',
              },
              {
                label: 'Deadline',
                value: task.deadline ? new Date(task.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—',
                valueColor: daysLeft.overdue ? '#ef4444' : PAGE_TEXT,
                Icon: FaCalendarAlt,
                iconColor: daysLeft.overdue ? '#ef4444' : '#f59e0b',
                iconBg: daysLeft.overdue ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
              },
            ].map(({ label, value, valueColor, Icon, iconColor, iconBg }, idx, arr) => (
              <div key={label}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon style={{ fontSize: 14, color: iconColor }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <div style={{ fontSize: 10, color: PAGE_GRAY, fontWeight: 600 }}>{label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: valueColor }}>{value}</div>
                  </div>
                </div>
                {idx < arr.length - 1 && <div style={{ borderBottom: `1px solid ${PAGE_BORDER}`, marginTop: 10 }} />}
              </div>
            ))}
          </div>
          {/* Column 2 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center', minWidth: 180, borderLeft: `1px solid ${PAGE_BORDER}`, paddingLeft: 16 }}>
            {[
              {
                label: 'Start Date',
                value: task.startDate ? new Date(task.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—',
                valueColor: PAGE_TEXT,
                Icon: FaCalendarAlt,
                iconColor: '#22c55e',
                iconBg: 'rgba(34,197,94,0.1)',
                pill: false,
              },
              {
                label: 'Difficulty',
                value: task.experience ? task.experience.charAt(0).toUpperCase() + task.experience.slice(1) : '—',
                valueColor: diffStyle.color,
                valueBg: diffStyle.bg,
                Icon: FaChartBar,
                iconColor: diffStyle.color,
                iconBg: diffStyle.bg,
                pill: true,
              },
            ].map(({ label, value, valueColor, valueBg, pill, Icon, iconColor, iconBg }, idx, arr) => (
              <div key={label}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon style={{ fontSize: 14, color: iconColor }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <div style={{ fontSize: 10, color: PAGE_GRAY, fontWeight: 600 }}>{label}</div>
                    {pill ? (
                      <span style={{ fontSize: 11, fontWeight: 700, color: valueColor, background: valueBg, borderRadius: 20, padding: '1px 8px', alignSelf: 'flex-start' }}>{value}</span>
                    ) : (
                      <div style={{ fontSize: 13, fontWeight: 700, color: valueColor }}>{value}</div>
                    )}
                  </div>
                </div>
                {idx < arr.length - 1 && <div style={{ borderBottom: `1px solid ${PAGE_BORDER}`, marginTop: 10 }} />}
              </div>
            ))}
          </div>
        </div>

        {/* Action column */}
        <div style={{ flexShrink: 0, borderLeft: `1px solid ${PAGE_BORDER}`, paddingLeft: 20, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8, minWidth: 140 }} onClick={e => e.stopPropagation()}>
          {enrolled ? (
            <button onClick={() => openWorkflow(task)} style={{ padding: '9px 0', borderRadius: 9, border: 'none', background: ORANGE, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', width: '100%' }}>
              Open Task
            </button>
          ) : task.isEnrolled ? (
            <>
              <button disabled style={{ padding: '9px 0', borderRadius: 9, border: '1.5px solid #22c55e', background: '#f0fdf4', color: '#22c55e', fontSize: 12, fontWeight: 800, cursor: 'default', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <FaCheckCircle style={{ fontSize: 13 }} /> Enrolled
              </button>
              <button onClick={() => openTaskDetails(task)} style={{ padding: '8px 0', borderRadius: 9, border: `1.5px solid ${PAGE_BORDER}`, background: CARD_BG, color: PAGE_GRAY, fontSize: 12, fontWeight: 600, cursor: 'pointer', width: '100%' }}>
                View Details
              </button>
            </>
          ) : deadlinePast || full || notStarted ? (
            <button disabled style={{ padding: '9px 0', borderRadius: 9, border: `1.5px solid ${PAGE_BORDER}`, background: PAGE_BG, color: PAGE_GRAY, fontSize: 12, fontWeight: 700, cursor: 'not-allowed', width: '100%' }}>
              {deadlinePast ? 'Closed' : notStarted ? 'Coming Soon' : 'Full'}
            </button>
          ) : (
            <>
              <button onClick={() => handleEnroll(task._id)} disabled={enrolling === task._id} style={{ padding: '9px 0', borderRadius: 9, border: 'none', background: ORANGE, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                {enrolling === task._id ? <Spinner animation="border" size="sm" /> : null}
                Enroll Now
              </button>
              <button onClick={() => openTaskDetails(task)} style={{ padding: '8px 0', borderRadius: 9, border: `1.5px solid ${PAGE_BORDER}`, background: CARD_BG, color: PAGE_GRAY, fontSize: 12, fontWeight: 600, cursor: 'pointer', width: '100%' }}>
                View Details
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  const displayTasks = activeTab === 'enrolled' ? myTasks : activeTab === 'deadline-crossed' ? deadlineCrossedTasks : availableTasks
  const totalPages = Math.ceil(displayTasks.length / TASKS_PER_PAGE)
  const pagedTasks = displayTasks.slice((currentPage - 1) * TASKS_PER_PAGE, currentPage * TASKS_PER_PAGE)

  return (
    <>
      <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif", background: PAGE_BG, minHeight: '100vh', padding: '0' }}>

        <div style={{ padding: '20px 28px' }}>

          {/* ── Main Layout: Content + Sidebar ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>

            {/* ── Left: Content ── */}
            <div>
              {/* ── Hero Banner ── */}
              <div style={{ background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 14, padding: '0', display: 'flex', alignItems: 'stretch', gap: 0, overflow: 'hidden', marginBottom: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.04)', minHeight: 130 }}>
                {/* Illustration */}
                <div style={{ position: 'relative', width: 120, flexShrink: 0, alignSelf: 'stretch', background: 'linear-gradient(135deg, #fff7f0, #fff3e0)', borderRadius: '14px 0 0 14px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', overflow: 'hidden' }}>
                  <img src={boyImg} alt="Internship" style={{ height: '100%', width: 'auto', objectFit: 'contain', display: 'block' }} />
                </div>
                {/* Text */}
                <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px', flexShrink: 0 }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 900, lineHeight: 1.25, marginBottom: 10 }}>
                      <span style={{ color: ORANGE }}>Build your career</span>
                      <span style={{ color: PAGE_TEXT }}> with</span>
                      <br />
                      <span style={{ color: PAGE_TEXT }}>real industry internships</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {['Work on Live Projects', 'Learn from Industry Mentors', 'Earn Completion Certificates'].map(pt => (
                        <div key={pt} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: PAGE_GRAY, fontWeight: 500 }}>
                          <FaCheckCircle style={{ color: '#22c55e', fontSize: 12, flexShrink: 0 }} />
                          {pt}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Divider */}
                <div style={{ width: 1, background: PAGE_BORDER, margin: '16px 0 16px 20px', flexShrink: 0 }} />
                {/* KPI stats */}
                <div style={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'space-evenly' }}>
                  {[
                    { label: 'Live Internships', value: availableTasks.length, sub: 'Explore now',       color: ORANGE,    Icon: FaBriefcase,    onClick: () => setActiveTab('available') },
                    { label: 'Enrolled',         value: enrolledTasks.length,  sub: 'View details',      color: '#8b5cf6', Icon: FaGraduationCap, onClick: () => setActiveTab('enrolled')  },
                    { label: 'In Progress',      value: inProgressCount,       sub: 'Keep going!',       color: '#3b82f6', Icon: FaClock,         onClick: () => setActiveTab('enrolled')  },
                    { label: 'Under Review',     value: underReviewCount,      sub: 'Awaiting feedback', color: '#f59e0b', Icon: FaChartBar,      onClick: () => setActiveTab('enrolled')  },
                    { label: 'Completed',        value: completedCount,        sub: 'Well done!',        color: '#22c55e', Icon: FaCheckCircle,   onClick: () => setActiveTab('enrolled')  },
                  ].map(({ label, value, sub, color, Icon: KIcon, onClick }, idx, arr) => (
                    <div key={label} style={{ padding: '0 8px', borderRight: idx < arr.length - 1 ? `1px solid ${PAGE_BORDER}` : 'none', textAlign: 'center', flex: 1 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 5px' }}>
                        <KIcon style={{ color, fontSize: 14 }} />
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: PAGE_TEXT, lineHeight: 1 }}>{value}</div>
                      <div style={{ fontSize: 11, color: PAGE_GRAY, fontWeight: 600, margin: '3px 0 4px' }}>{label}</div>
                      <button onClick={onClick} style={{ fontSize: 11, color, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>{sub}</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: 0, background: CARD_BG, borderRadius: 12, border: `1px solid ${PAGE_BORDER}`, padding: 4, marginBottom: 16, width: 'fit-content' }}>
                {[
                  { key: 'available', label: 'All Internships', count: availableTasks.length },
                  { key: 'enrolled',  label: 'My Internship',   count: myTasks.length },
                  { key: 'deadline-crossed', label: 'Closed', count: deadlineCrossedTasks.length },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as typeof activeTab)}
                    style={{
                      padding: '8px 18px', borderRadius: 9, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                      background: activeTab === tab.key ? ORANGE : 'transparent',
                      color: activeTab === tab.key ? '#fff' : PAGE_GRAY,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      lineHeight: 1,
                    }}
                  >
                    <span>{tab.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 800, background: activeTab === tab.key ? 'rgba(255,255,255,0.3)' : PAGE_BORDER, color: activeTab === tab.key ? '#fff' : PAGE_GRAY, borderRadius: 20, padding: '2px 8px', lineHeight: 1.4, display: 'inline-flex', alignItems: 'center' }}>{tab.count}</span>
                  </button>
                ))}
              </div>

              {activeTab !== 'enrolled' && (
                <>
                  {/* Search + Filters */}
                  <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 200, background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px' }}>
                      <FaSearch style={{ color: PAGE_GRAY, fontSize: 13, flexShrink: 0 }} />
                      <input
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Search internships, roles, skills..."
                        style={{ border: 'none', outline: 'none', fontSize: 13, color: PAGE_GRAY, background: 'transparent', width: '100%' }}
                      />
                    </div>
                    <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ padding: '9px 12px', borderRadius: 10, border: `1px solid ${categoryFilter !== 'all' ? ORANGE : PAGE_BORDER}`, background: CARD_BG, fontSize: 12, color: PAGE_GRAY, cursor: 'pointer', fontWeight: 600, outline: 'none' }}>
                      <option value="all">Category</option>
                      {uniqueCategories.map(cat => (
                        <option key={cat} value={cat}>{CATEGORY_LABELS[cat]?.replace(/^[^\s]+\s/, '') || cat}</option>
                      ))}
                    </select>
                    <select value={durationFilter} onChange={e => setDurationFilter(e.target.value)} style={{ padding: '9px 12px', borderRadius: 10, border: `1px solid ${durationFilter !== 'all' ? ORANGE : PAGE_BORDER}`, background: CARD_BG, fontSize: 12, color: PAGE_GRAY, cursor: 'pointer', fontWeight: 600, outline: 'none' }}>
                      <option value="all">Duration</option>
                      <option value="short">Short (≤ 1 week)</option>
                      <option value="medium">Medium (1–4 weeks)</option>
                      <option value="long">Long (&gt; 1 month)</option>
                    </select>
                    <select value={difficultyFilter} onChange={e => setDifficultyFilter(e.target.value)} style={{ padding: '9px 12px', borderRadius: 10, border: `1px solid ${difficultyFilter !== 'all' ? ORANGE : PAGE_BORDER}`, background: CARD_BG, fontSize: 12, color: PAGE_GRAY, cursor: 'pointer', fontWeight: 600, outline: 'none' }}>
                      <option value="all">Difficulty</option>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                    <select value={sortFilter} onChange={e => setSortFilter(e.target.value)} style={{ padding: '9px 12px', borderRadius: 10, border: `1px solid ${PAGE_BORDER}`, background: CARD_BG, fontSize: 12, color: PAGE_GRAY, cursor: 'pointer', fontWeight: 600, outline: 'none' }}>
                      <option value="newest">Sort by: Newest</option>
                      <option value="oldest">Sort by: Oldest</option>
                    </select>
                    <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, border: `1px solid ${PAGE_BORDER}`, background: CARD_BG, fontSize: 12, fontWeight: 700, color: PAGE_GRAY, cursor: 'pointer' }}>
                      <FaFilter style={{ fontSize: 11 }} /> Filters
                    </button>
                  </div>

                  {/* Category pills — only when there's data to filter */}
                  {tasks.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                      <button
                        onClick={() => setCategoryFilter('all')}
                        style={{ padding: '6px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700, border: `1px solid ${categoryFilter === 'all' ? ORANGE : PAGE_BORDER}`, cursor: 'pointer', background: categoryFilter === 'all' ? ORANGE : CARD_BG, color: categoryFilter === 'all' ? '#fff' : PAGE_GRAY }}
                      >All</button>
                      {uniqueCategories.map(cat => {
                        const meta = CAT_META[cat]
                        return (
                          <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            style={{ padding: '6px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: categoryFilter === cat ? `${meta?.color || ORANGE}15` : CARD_BG, color: categoryFilter === cat ? (meta?.color || ORANGE) : PAGE_GRAY, border: `1px solid ${categoryFilter === cat ? (meta?.color || ORANGE) : PAGE_BORDER}` }}
                          >
                            {meta?.label || CATEGORY_LABELS[cat]?.replace(/^[^\s]+\s/, '') || cat}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </>
              )}

              {/* Cards */}
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, gap: 12 }}>
                  <Spinner animation="border" style={{ color: ORANGE }} />
                  <span style={{ color: PAGE_GRAY }}>Loading internships...</span>
                </div>
              ) : activeTab === 'enrolled' ? (
                renderMyInternshipView()
              ) : displayTasks.length === 0 ? (
                <div style={{ background: CARD_BG, borderRadius: 14, border: `1px solid ${PAGE_BORDER}`, padding: 48, textAlign: 'center' }}>
                  <FaBriefcase style={{ fontSize: 48, color: '#cbd5e1', marginBottom: 12 }} />
                  <div style={{ fontWeight: 700, color: PAGE_TEXT, marginBottom: 6 }}>No internships found</div>
                  <div style={{ fontSize: 13, color: PAGE_GRAY }}>Try adjusting your filters</div>
                </div>
              ) : (
                <div>
                  {pagedTasks.map(t => renderInternshipCard(t, false))}

                  {/* Pagination */}
                  {totalPages > 1 && (() => {
                    const btnStyle = (active: boolean, disabled?: boolean): React.CSSProperties => ({
                      width: 34, height: 34, borderRadius: 8,
                      border: active ? 'none' : `1px solid ${PAGE_BORDER}`,
                      background: active ? ORANGE : CARD_BG,
                      color: active ? '#fff' : disabled ? '#cbd5e1' : PAGE_GRAY,
                      fontWeight: 700, fontSize: 13,
                      cursor: disabled ? 'default' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    })
                    const pages: (number | '...')[] = []
                    if (totalPages <= 7) {
                      for (let i = 1; i <= totalPages; i++) pages.push(i)
                    } else {
                      pages.push(1)
                      if (currentPage > 3) pages.push('...')
                      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i)
                      if (currentPage < totalPages - 2) pages.push('...')
                      pages.push(totalPages)
                    }
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 20 }}>
                        <button style={btnStyle(false, currentPage === 1)} disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                          <FaChevronLeft style={{ fontSize: 10 }} />
                        </button>
                        {pages.map((p, i) =>
                          p === '...'
                            ? <span key={`ellipsis-${i}`} style={{ width: 34, textAlign: 'center', color: PAGE_GRAY, fontSize: 13 }}>...</span>
                            : <button key={p} style={btnStyle(p === currentPage)} onClick={() => setCurrentPage(p as number)}>{p}</button>
                        )}
                        <button style={{ ...btnStyle(false, currentPage === totalPages), width: 'auto', padding: '0 12px', gap: 4 }} disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                          Next <FaChevronRight style={{ fontSize: 10 }} />
                        </button>
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>

            {/* ── Right Sidebar ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* My Internship Journey */}
              <div style={{ background: CARD_BG, borderRadius: 14, border: `1px solid ${PAGE_BORDER}`, padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: PAGE_TEXT }}>My Internship Journey</div>
                  <button style={{ fontSize: 11, color: ORANGE, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>View All</button>
                </div>
                <div style={{ position: 'relative' }}>
                  {JOURNEY_STEPS.map((step, i) => (
                    <div key={step.label} style={{ display: 'flex', gap: 10, paddingBottom: i < JOURNEY_STEPS.length - 1 ? 14 : 0, position: 'relative' }}>
                      {i < JOURNEY_STEPS.length - 1 && (
                        <div style={{ position: 'absolute', left: 13, top: 28, width: 2, height: 'calc(100% - 6px)', background: step.done ? step.color + '50' : PAGE_BORDER, borderRadius: 2 }} />
                      )}
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: step.done ? step.color : PAGE_BORDER, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1, boxShadow: step.done ? `0 0 0 3px ${step.color}25` : 'none' }}>
                        <step.Icon style={{ color: step.done ? '#fff' : '#cbd5e1', fontSize: 11 }} />
                      </div>
                      <div style={{ paddingTop: 2 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: step.done ? PAGE_TEXT : PAGE_GRAY, lineHeight: 1.2 }}>{step.label}</div>
                        <div style={{ fontSize: 11, color: step.done ? PAGE_GRAY : '#cbd5e1', marginTop: 2 }}>{step.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming Deadlines */}
              <div style={{ background: CARD_BG, borderRadius: 14, border: `1px solid ${PAGE_BORDER}`, padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: PAGE_TEXT }}>Upcoming Deadlines</div>
                  <button style={{ fontSize: 11, color: ORANGE, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>View Calendar</button>
                </div>
                {upcomingDeadlines.length === 0 ? (
                  <div style={{ fontSize: 12, color: PAGE_GRAY, textAlign: 'center', padding: '12px 0' }}>No upcoming deadlines</div>
                ) : upcomingDeadlines.map(t => {
                  const dl = getDaysLeft(t.deadline)
                  const d = new Date(t.deadline!)
                  return (
                    <div key={t._id} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-start' }}>
                      <div style={{ width: 40, flexShrink: 0, background: '#fff7f0', borderRadius: 8, textAlign: 'center', padding: '4px 0', border: `1px solid ${ORANGE}30` }}>
                        <div style={{ fontSize: 16, fontWeight: 900, color: ORANGE, lineHeight: 1 }}>{d.getDate()}</div>
                        <div style={{ fontSize: 9, fontWeight: 700, color: ORANGE, textTransform: 'uppercase' }}>{d.toLocaleString('en', { month: 'short' })}</div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: PAGE_TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                        <div style={{ fontSize: 11, color: PAGE_GRAY, marginTop: 1 }}>Submission Deadline</div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: dl.overdue ? '#ef4444' : '#22c55e', marginTop: 2 }}>{dl.label}</div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Quick Actions */}
              <div style={{ background: CARD_BG, borderRadius: 14, border: `1px solid ${PAGE_BORDER}`, padding: '18px 20px' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: PAGE_TEXT, marginBottom: 14 }}>Quick Actions</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { label: 'Browse Internships', Icon: FaBriefcase, color: '#3b82f6', bg: '#eff6ff', onClick: () => setActiveTab('available') },
                    { label: 'My Submissions',     Icon: FaTags,      color: '#8b5cf6', bg: '#f5f3ff', onClick: () => { setActiveTab('enrolled'); setMyInternshipSubTab('submissions') } },
                    { label: 'My Feedback',        Icon: FaChartBar,  color: '#f59e0b', bg: '#fffbeb', onClick: () => { setActiveTab('enrolled'); setMyInternshipSubTab('feedback') } },
                    { label: 'My Certificates',    Icon: FaCertificate, color: '#22c55e', bg: '#f0fdf4', onClick: () => { setActiveTab('enrolled'); setMyInternshipSubTab('certificate') } },
                  ].map(({ label, Icon, color, bg, onClick }) => (
                    <button key={label} onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 10, border: `1px solid ${PAGE_BORDER}`, background: PAGE_BG, cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon style={{ color, fontSize: 14 }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: PAGE_GRAY }}>{label}</span>
                      <FaArrowRight style={{ fontSize: 10, color: PAGE_GRAY, marginLeft: 'auto' }} />
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ── Detail Modal ───────────────────────────────────────────────── */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        fullscreen={true}
        className="td-modal"
        style={{ zIndex: 10001 }}
      >
        <Modal.Header closeButton className="td-modal-header">
          <span className="td-modal-title"><FaBriefcase size={15} style={{marginRight:8,color:'#ff6b35'}}/>Task Details</span>
        </Modal.Header>

        <Modal.Body className="td-modal-body p-0">
          {selectedTask && (
            <div className="td-layout">
              {/* ── Left sidebar ── */}
              <div className="td-sidebar">
                {/* Category + NDA chips */}
                <div className="td-chip-row">
                  {selectedTask.category && (
                    <span className="td-chip td-chip-cat">
                      {(CATEGORY_LABELS[selectedTask.category] || selectedTask.category).replace(/^[^\s]+\s/, '')}
                    </span>
                  )}
                  {selectedTask.ndaRequired && (
                    <span className="td-chip td-chip-nda"><FaLock size={9} style={{marginRight:3}}/>NDA</span>
                  )}
                </div>

                <h2 className="td-title">{selectedTask.title}</h2>

                {/* Stats */}
                <div className="td-stats">
                  <div className="td-stat-row">
                    <span className="td-stat-label">Budget</span>
                    <span className="td-stat-val budget">{selectedTask.amount ? `₹${selectedTask.amount.toLocaleString()}` : '—'}</span>
                  </div>
                  <div className="td-stat-row">
                    <span className="td-stat-label">Experience</span>
                    <span className="td-stat-val">{EXPERIENCE_LABELS[selectedTask.experience || ''] || selectedTask.experience || '—'}</span>
                  </div>
                  <div className="td-stat-row">
                    <span className="td-stat-label">Team Size</span>
                    <span className="td-stat-val">{selectedTask.maxStudents ?? '—'} students</span>
                  </div>
                  <div className="td-stat-row">
                    <span className="td-stat-label">Spots Left</span>
                    <span className={`td-stat-val ${(selectedTask.spotsLeft ?? 0) === 0 ? 'danger' : 'success'}`}>
                      {selectedTask.spotsLeft ?? selectedTask.maxStudents ?? '—'}
                    </span>
                  </div>
                  <div className="td-stat-row">
                    <span className="td-stat-label">Start</span>
                    <span className="td-stat-val sm">{formatDate(selectedTask.startDate)}</span>
                  </div>
                  <div className="td-stat-row">
                    <span className="td-stat-label">Deadline</span>
                    <span className={`td-stat-val sm ${isDeadlinePast(selectedTask.deadline) ? 'danger' : ''}`}>
                      {formatDate(selectedTask.deadline)}{isDeadlinePast(selectedTask.deadline) ? ' · Closed' : ''}
                    </span>
                  </div>
                </div>

                {/* Enrollment bar */}
                {typeof selectedTask.maxStudents === 'number' && selectedTask.maxStudents > 0 && (
                  <div className="td-enroll-bar-wrap">
                    <div className="td-enroll-bar">
                      <div className="td-enroll-fill" style={{
                        width: `${Math.round(((selectedTask.enrolledCount ?? 0) / selectedTask.maxStudents) * 100)}%`
                      }}/>
                    </div>
                    <span className="td-enroll-txt">{selectedTask.enrolledCount ?? 0}/{selectedTask.maxStudents} enrolled</span>
                  </div>
                )}

                {/* Skills */}
                {(selectedTask.skills?.length ?? 0) > 0 && (
                  <div className="td-skills-wrap">
                    <span className="td-skills-label">Required Skills</span>
                    <div className="td-skills">
                      {selectedTask.skills!.map((s) => (
                        <span key={s} className="td-skill">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Feedback */}
                {enrollError && <div className="td-alert error">{enrollError}</div>}
                {enrollSuccess && <div className="td-alert success">✓ {enrollSuccess}</div>}

                {/* CTA button */}
                <div className="td-cta">
                  {selectedTask.isEnrolled ? (
                    <button className="td-btn-success" disabled><FaCheckCircle size={13} style={{marginRight:6}}/>Already Enrolled</button>
                  ) : isBeforeStartDate(selectedTask.startDate) ? (
                    <button className="td-btn-disabled" disabled>Not Started Yet</button>
                  ) : isDeadlinePast(selectedTask.deadline) ? (
                    <button className="td-btn-disabled" disabled>Deadline Passed</button>
                  ) : (selectedTask.spotsLeft ?? 0) <= 0 ? (
                    <button className="td-btn-disabled" disabled>No Spots Available</button>
                  ) : (
                    <button className="td-btn-primary" disabled={enrolling === selectedTask._id} onClick={() => handleEnroll(selectedTask._id)}>
                      {enrolling === selectedTask._id ? <><Spinner animation="border" size="sm" className="me-1"/>Enrolling…</> : 'Apply Now →'}
                    </button>
                  )}
                  <button className="td-btn-ghost" onClick={() => setShowModal(false)}>Close</button>
                </div>
              </div>

              {/* ── Right content ── */}
              <div className="td-content">
                {selectedTask.description && (
                  <div className="td-section">
                    <div className="td-section-heading"><FaTags size={13} style={{marginRight:8}}/>Description</div>
                    <div className="td-rich" dangerouslySetInnerHTML={{ __html: selectedTask.description }}/>
                  </div>
                )}
                {selectedTask.highlights && (
                  <div className="td-section">
                    <div className="td-section-heading">⭐ Key Highlights</div>
                    <div className="td-rich" dangerouslySetInnerHTML={{ __html: selectedTask.highlights }}/>
                  </div>
                )}
                {selectedTask.acceptanceCriteria && (
                  <div className="td-section">
                    <div className="td-section-heading"><FaCheckCircle size={13} style={{marginRight:8}}/>Acceptance Criteria</div>
                    <div className="td-rich" dangerouslySetInnerHTML={{ __html: selectedTask.acceptanceCriteria }}/>
                  </div>
                )}
                {selectedTask.githubLink && (
                  <div className="td-section">
                    <div className="td-section-heading"><FaCodeBranch size={13} style={{marginRight:8}}/>Repository</div>
                    <a href={selectedTask.githubLink} target="_blank" rel="noreferrer" className="td-link">{selectedTask.githubLink}</a>
                  </div>
                )}
                {selectedTask.terms && (
                  <div className="td-section">
                    <div className="td-section-heading">📋 Terms & Conditions</div>
                    <div className="td-rich" dangerouslySetInnerHTML={{ __html: selectedTask.terms }}/>
                  </div>
                )}
                {(selectedTask.attachments?.length ?? 0) > 0 && (
                  <div className="td-section">
                    <div className="td-section-heading">📎 Attachments</div>
                    <div className="td-attachments">
                      {selectedTask.attachments!.map((att, i) => (
                        <a key={i} href={att.fileUrl} target="_blank" rel="noreferrer" className="td-att-link">
                          📄 {att.fileName || `Attachment ${i + 1}`}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>

      <StudentTaskSubmissionWizard
        show={showWorkflowModal}
        onHide={() => setShowWorkflowModal(false)}
        task={selectedTask}
        token={token}
        baseURL={baseURL}
        onSubmitted={async () => { await fetchMyTasks() }}
        taskIndex={selectedTask ? myTasks.findIndex(t => t._id === selectedTask._id) : undefined}
        totalTasks={myTasks.length}
      />

      {/* ── Feedback Modal ─────────────────────────────────────────────────── */}
      {showFeedbackModal && feedbackTask && (() => {
        const t = feedbackTask
        const sub = t.mySubmission as any
        const ai = sub?.aiEvaluation
        const score = getScore(t)
        const isApproved = sub?.adminReviewStatus === 'approved'
        const isRejected = sub?.adminReviewStatus === 'rejected'
        const statusLabel = isApproved ? 'Approved' : isRejected ? 'Needs Improvement' : 'Under Review'
        const statusColor = isApproved ? '#22c55e' : isRejected ? '#ef4444' : '#f59e0b'
        const taskIdx = myTasks.findIndex(task => task._id === t._id)
        const taskXofY = taskIdx >= 0 ? `Task ${taskIdx + 1} of ${myTasks.length}` : null
        const submittedAt = sub?.completedAt ? new Date(sub.completedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null
        const reviewedAt  = sub?.reviewedAt  ? new Date(sub.reviewedAt).toLocaleString('en-IN',  { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null
        const strengths: string[] = ai?.strengths || []
        const improvements: string[] = ai?.improvements || []
        const recommendations: string[] = ai?.facultyReport?.recommendations || []
        const submissionAttachments: any[] = sub?.attachments || []
        const formatSize = (bytes: number) => bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`

        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10060, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, overflow: 'hidden' }} onClick={() => setShowFeedbackModal(false)}>
            <div style={{ background: CARD_BG, borderRadius: 18, width: '100%', maxWidth: 560, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>

              {/* Header */}
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${PAGE_BORDER}`, display: 'flex', alignItems: 'flex-start', gap: 12, flexShrink: 0 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: `${statusColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                  <FaBriefcase style={{ color: statusColor, fontSize: 18 }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: PAGE_TEXT, marginBottom: 4 }}>{t.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: PAGE_GRAY, fontWeight: 600 }}>Frontend Developer Internship</span>
                    {taskXofY && <span style={{ fontSize: 11, background: PAGE_BG, color: PAGE_GRAY, border: `1px solid ${PAGE_BORDER}`, borderRadius: 20, padding: '2px 10px', fontWeight: 700, whiteSpace: 'nowrap' }}>{taskXofY}</span>}
                    <span style={{ fontSize: 12, fontWeight: 800, color: statusColor, background: `${statusColor}15`, border: `1.5px solid ${statusColor}40`, borderRadius: 20, padding: '3px 12px', whiteSpace: 'nowrap' }}>{statusLabel}</span>
                  </div>
                </div>
                <button onClick={() => setShowFeedbackModal(false)} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${PAGE_BORDER}`, background: CARD_BG, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: PAGE_GRAY, flexShrink: 0 }}>✕</button>
              </div>

              {/* Dates bar */}
              {(submittedAt || reviewedAt) && (
                <div style={{ padding: '10px 20px', borderBottom: `1px solid ${PAGE_BORDER}`, display: 'flex', gap: 0, background: PAGE_BG, flexShrink: 0 }}>
                  {submittedAt && <div style={{ fontSize: 12, color: PAGE_GRAY, flex: 1 }}><span style={{ fontWeight: 700, color: PAGE_GRAY }}>Submitted on: </span>{submittedAt}</div>}
                  {reviewedAt  && <div style={{ fontSize: 12, color: PAGE_GRAY, flex: 1 }}><span style={{ fontWeight: 700, color: PAGE_GRAY }}>Reviewed on: </span>{reviewedAt}</div>}
                </div>
              )}

              {/* Scrollable body */}
              <div className="task-modal-body" style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

                {/* Score + Status cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                  <div style={{ background: '#f0fdf4', borderRadius: 12, padding: '14px 16px', border: '1px solid #bbf7d0' }}>
                    <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 700, marginBottom: 6 }}>Score</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: score != null && score >= 7 ? '#16a34a' : score != null && score >= 5 ? '#f59e0b' : '#ef4444' }}>
                      {score != null ? `${score} / 10` : '— / 10'}
                    </div>
                  </div>
                  <div style={{ background: `${statusColor}10`, borderRadius: 12, padding: '14px 16px', border: `1px solid ${statusColor}30` }}>
                    <div style={{ fontSize: 11, color: statusColor, fontWeight: 700, marginBottom: 6 }}>Status</div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: statusColor, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {statusLabel} {isApproved && <FaCheckCircle style={{ fontSize: 14 }} />}
                    </div>
                  </div>
                </div>

                {/* Mentor Feedback */}
                {sub?.adminFeedback && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                      <FaRobot style={{ color: '#8b5cf6', fontSize: 14 }} />
                      <span style={{ fontSize: 13, fontWeight: 800, color: PAGE_TEXT }}>Mentor Feedback</span>
                    </div>
                    <div style={{ fontSize: 13, color: PAGE_GRAY, lineHeight: 1.7, background: PAGE_BG, borderRadius: 10, padding: '12px 14px', border: `1px solid ${PAGE_BORDER}` }}>
                      {sub.adminFeedback}
                    </div>
                  </div>
                )}

                {/* AI Summary */}
                {ai?.summary && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                      <FaLayerGroup style={{ color: '#3b82f6', fontSize: 13 }} />
                      <span style={{ fontSize: 13, fontWeight: 800, color: PAGE_TEXT }}>Detailed Feedback</span>
                    </div>
                    <div style={{ fontSize: 12, color: PAGE_GRAY, lineHeight: 1.7, background: PAGE_BG, borderRadius: 10, padding: '12px 14px', border: `1px solid ${PAGE_BORDER}` }}>
                      {ai.summary}
                    </div>
                  </div>
                )}

                {/* Strengths */}
                {strengths.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <FaCheckCircle style={{ color: '#22c55e', fontSize: 13 }} />
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#22c55e' }}>What's Good</span>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 20, listStyle: 'disc' }}>
                      {strengths.map((s, i) => <li key={i} style={{ fontSize: 12, color: PAGE_GRAY, marginBottom: 4, lineHeight: 1.6 }}>{s}</li>)}
                    </ul>
                  </div>
                )}

                {/* Improvements */}
                {improvements.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <FaBullseye style={{ color: ORANGE, fontSize: 13 }} />
                      <span style={{ fontSize: 12, fontWeight: 800, color: ORANGE }}>Improvements</span>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 20, listStyle: 'disc' }}>
                      {improvements.map((s, i) => <li key={i} style={{ fontSize: 12, color: PAGE_GRAY, marginBottom: 4, lineHeight: 1.6 }}>{s}</li>)}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {recommendations.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <FaChartLine style={{ color: '#3b82f6', fontSize: 13 }} />
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#3b82f6' }}>Recommendations</span>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 20, listStyle: 'disc' }}>
                      {recommendations.map((s, i) => <li key={i} style={{ fontSize: 12, color: PAGE_GRAY, marginBottom: 4, lineHeight: 1.6 }}>{s}</li>)}
                    </ul>
                  </div>
                )}

                {/* Submission Attachments */}
                {submissionAttachments.length > 0 && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                      <FaTags style={{ color: PAGE_GRAY, fontSize: 13 }} />
                      <span style={{ fontSize: 13, fontWeight: 800, color: PAGE_TEXT }}>Attachments</span>
                    </div>
                    {submissionAttachments.map((att: any, i: number) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: PAGE_BG, borderRadius: 10, border: `1px solid ${PAGE_BORDER}`, padding: '10px 14px', marginBottom: 8 }}>
                        {att.mimeType?.startsWith('image/') ? (
                          <img src={att.fileUrl} alt={att.fileName} style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover', border: `1px solid ${PAGE_BORDER}`, flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: 52, height: 52, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <FaTags style={{ color: '#3b82f6', fontSize: 20 }} />
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: PAGE_TEXT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{att.fileName}</div>
                          <div style={{ fontSize: 11, color: PAGE_GRAY, marginTop: 2 }}>{formatSize(att.size)}</div>
                          <a href={att.fileUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#3b82f6', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                            <FaChevronRight style={{ fontSize: 9 }} /> Download
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{ padding: '14px 24px', borderTop: `1px solid ${PAGE_BORDER}`, flexShrink: 0 }}>
                <button onClick={() => setShowFeedbackModal(false)} style={{ width: '100%', padding: '12px 0', borderRadius: 10, border: 'none', background: ORANGE, color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
                  Close
                </button>
              </div>

            </div>
          </div>
        )
      })()}

      {/* ── Task Details Modal ─────────────────────────────────────────────── */}
      {showTaskDetailsModal && taskDetailsTask && (() => {
        const t = taskDetailsTask
        const status = (() => {
          const r = t.mySubmission?.adminReviewStatus
          const s = t.mySubmission?.status
          if (r === 'approved') return { label: 'Completed',        color: '#22c55e' }
          if (r === 'rejected') return { label: 'Needs Improvement',color: '#ef4444' }
          if (s === 'completed') return { label: 'Review Pending',  color: '#f59e0b' }
          if (t.isEnrolled)     return { label: 'In Progress',      color: ORANGE    }
          return                       { label: 'Not Started',      color: '#94a3b8' }
        })()
        const progress = (() => {
          const r = t.mySubmission?.adminReviewStatus; const s = t.mySubmission?.status
          if (r === 'approved') return 100; if (s === 'completed') return 85; if (t.isEnrolled) return 60; return 0
        })()
        const daysLeft = (() => {
          if (!t.deadline) return null
          const diff = Math.ceil((new Date(t.deadline).getTime() - Date.now()) / 86400000)
          return diff < 0 ? { label: 'Overdue', overdue: true } : { label: `${diff} days left`, overdue: false }
        })()
        const score = getScore(t)
        const attachments: any[] = (t as any).attachments || []

        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, overflow: 'hidden' }} onClick={() => setShowTaskDetailsModal(false)}>
            <div style={{ background: CARD_BG, borderRadius: 18, width: '100%', maxWidth: 720, height: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>

              {/* Header */}
              <div style={{ padding: '16px 24px', borderBottom: `1px solid ${PAGE_BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: '#fff7f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FaBriefcase style={{ color: ORANGE, fontSize: 16 }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: PAGE_TEXT }}>Task Details</div>
                    <div style={{ fontSize: 12, color: PAGE_GRAY }}>Understand the task requirements and submit your best work.</div>
                  </div>
                </div>
                <button onClick={() => setShowTaskDetailsModal(false)} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${PAGE_BORDER}`, background: CARD_BG, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: PAGE_GRAY }}>✕</button>
              </div>

              {/* Task info bar */}
              {(() => {
                const taskIdx = myTasks.findIndex(task => task._id === t._id)
                const taskXofY = taskIdx >= 0 ? `Task ${taskIdx + 1} of ${myTasks.length}` : null
                return (
                  <div style={{ padding: '14px 24px', borderBottom: `1px solid ${PAGE_BORDER}`, display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: `${status.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FaBriefcase style={{ color: status.color, fontSize: 17 }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: PAGE_TEXT, marginBottom: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'nowrap', alignItems: 'center' }}>
                        {t.category && <span style={{ fontSize: 11, background: '#eff6ff', color: '#3b82f6', borderRadius: 20, padding: '2px 10px', fontWeight: 700, whiteSpace: 'nowrap' }}>{t.category.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>}
                        {t.experience && <span style={{ fontSize: 11, background: '#f0fdf4', color: '#22c55e', borderRadius: 20, padding: '2px 10px', fontWeight: 700, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>{t.experience}</span>}
                        {taskXofY && <span style={{ fontSize: 11, background: PAGE_BG, color: PAGE_GRAY, border: `1px solid ${PAGE_BORDER}`, borderRadius: 20, padding: '2px 10px', fontWeight: 700, whiteSpace: 'nowrap' }}>{taskXofY}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 0, flexShrink: 0, alignItems: 'stretch', borderLeft: `1px solid ${PAGE_BORDER}`, marginLeft: 8 }}>
                      <div style={{ textAlign: 'center', padding: '4px 20px', borderRight: `1px solid ${PAGE_BORDER}` }}>
                        <div style={{ fontSize: 10, color: PAGE_GRAY, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.06em' }}>Status</div>
                        <span style={{ fontSize: 12, fontWeight: 800, color: status.color, background: `${status.color}15`, border: `1.5px solid ${status.color}40`, borderRadius: 20, padding: '4px 12px', display: 'inline-block', whiteSpace: 'nowrap' }}>{status.label}</span>
                      </div>
                      <div style={{ textAlign: 'center', padding: '4px 20px' }}>
                        <div style={{ fontSize: 10, color: PAGE_GRAY, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.06em' }}>Progress</div>
                        <span style={{ fontSize: 18, fontWeight: 900, color: ORANGE }}>{progress}%</span>
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Body: single scroll wrapper → two columns inside */}
              <div className="task-modal-body" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 230px', gap: 0 }}>

                {/* Left */}
                <div style={{ padding: '18px 24px', borderRight: `1px solid ${PAGE_BORDER}`, minWidth: 0 }}>
                  {t.description && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: PAGE_TEXT, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 7 }}>
                        <FaAlignLeft style={{ color: PAGE_GRAY, fontSize: 12 }} /> Task Description
                      </div>
                      <div className="task-html-content" style={{ fontSize: 13, color: PAGE_GRAY, lineHeight: 1.7, wordBreak: 'break-word', overflowWrap: 'break-word', overflowX: 'hidden' }} dangerouslySetInnerHTML={{ __html: t.description }} />
                    </div>
                  )}
                  {(t as any).acceptanceCriteria && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: PAGE_TEXT, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 7 }}>
                        <FaCheckCircle style={{ color: PAGE_GRAY, fontSize: 12 }} /> Acceptance Criteria
                      </div>
                      <div className="task-html-content" style={{ fontSize: 13, color: PAGE_GRAY, lineHeight: 1.8, wordBreak: 'break-word', overflowWrap: 'break-word', overflowX: 'hidden' }} dangerouslySetInnerHTML={{ __html: (t as any).acceptanceCriteria }} />
                    </div>
                  )}
                  <div style={{ background: '#fff7f0', border: `1px solid ${ORANGE}30`, borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 8 }}>
                    <FaBullseye style={{ color: ORANGE, fontSize: 13, marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: '#92400e' }}>Please ensure you follow the task requirements and submission guidelines. Late submissions may not be accepted.</span>
                  </div>
                </div>

                {/* Right sidebar */}
                <div style={{ padding: '14px 18px', overflowY: 'hidden', overflowX: 'hidden' }}>
                  {[
                    { label: 'Start Date',   value: t.startDate  ? new Date(t.startDate).toLocaleString('en-IN',  { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—', Icon: FaCalendarAlt, iconColor: '#6366f1', extra: null as { label: string; color: string } | null },
                    { label: 'Deadline',     value: t.deadline   ? new Date(t.deadline).toLocaleString('en-IN',   { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—', Icon: FaCalendarAlt, iconColor: '#f59e0b', extra: daysLeft ? { label: daysLeft.label, color: daysLeft.overdue ? '#ef4444' : ORANGE } : null },
                    { label: 'Spots',        value: `${t.enrolledCount ?? 0} / ${t.maxStudents ?? '—'} Enrolled`, Icon: FaUsers, iconColor: '#06b6d4', extra: t.spotsLeft != null ? { label: t.spotsLeft === 0 ? 'Full' : `${t.spotsLeft} spot${t.spotsLeft !== 1 ? 's' : ''} left`, color: t.spotsLeft === 0 ? '#ef4444' : '#22c55e' } : null },
                    { label: 'Experience Level', value: t.experience ? t.experience.charAt(0).toUpperCase() + t.experience.slice(1) : '—', Icon: FaChartBar, iconColor: '#8b5cf6', extra: null },
                  ].map(({ label, value, Icon, iconColor, extra }) => (
                    <div key={label} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <Icon style={{ fontSize: 15, color: iconColor, flexShrink: 0 }} />
                        <span style={{ fontSize: 10, fontWeight: 700, color: PAGE_GRAY, textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1 }}>{label}</span>
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: PAGE_TEXT, paddingLeft: 22 }}>{value}</div>
                      {extra && <div style={{ fontSize: 10, fontWeight: 700, color: extra.color, marginTop: 2, paddingLeft: 22 }}>{extra.label}</div>}
                    </div>
                  ))}

                  {/* NDA */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <FaShieldAlt style={{ fontSize: 15, color: '#ef4444', flexShrink: 0 }} />
                      <span style={{ fontSize: 10, fontWeight: 700, color: PAGE_GRAY, textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1 }}>NDA Required</span>
                    </div>
                    <div style={{ paddingLeft: 22 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, background: (t as any).ndaRequired ? '#fef2f2' : '#f0fdf4', color: (t as any).ndaRequired ? '#ef4444' : '#22c55e', borderRadius: 20, padding: '2px 10px', display: 'inline-block' }}>
                        {(t as any).ndaRequired ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>

                  {/* Reward */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <FaChartLine style={{ fontSize: 15, color: '#22c55e', flexShrink: 0 }} />
                      <span style={{ fontSize: 10, fontWeight: 700, color: PAGE_GRAY, textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1 }}>Reward / Stipend</span>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: PAGE_TEXT, paddingLeft: 22 }}>₹{(t as any).amount ?? 0}</div>
                  </div>

                  {/* Skills */}
                  {t.skills && t.skills.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                        <FaCode style={{ fontSize: 15, color: '#3b82f6', flexShrink: 0 }} />
                        <span style={{ fontSize: 10, fontWeight: 700, color: PAGE_GRAY, textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1 }}>Skills Required</span>
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', paddingLeft: 22 }}>
                        {t.skills.map(s => <span key={s} style={{ fontSize: 11, background: '#eff6ff', color: '#3b82f6', borderRadius: 20, padding: '2px 8px', fontWeight: 700 }}>{s}</span>)}
                      </div>
                    </div>
                  )}

                  {/* Attachment */}
                  {attachments.length > 0 && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <FaTags style={{ fontSize: 15, color: '#f59e0b', flexShrink: 0 }} />
                        <span style={{ fontSize: 10, fontWeight: 700, color: PAGE_GRAY, textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1 }}>Attachment</span>
                      </div>
                      <div style={{ paddingLeft: 18 }}>
                        {attachments.map((att, i) => (
                          att.mimeType?.startsWith('image/') ? (
                            <a key={i} href={att.fileUrl} target="_blank" rel="noopener noreferrer"
                              style={{ display: 'block', position: 'relative', borderRadius: 8, overflow: 'hidden', border: `1px solid ${PAGE_BORDER}`, cursor: 'zoom-in' }}
                              title="Click to open full size"
                              onMouseEnter={e => { const ov = e.currentTarget.querySelector('.att-overlay') as HTMLElement; if (ov) { ov.style.opacity = '1' } }}
                              onMouseLeave={e => { const ov = e.currentTarget.querySelector('.att-overlay') as HTMLElement; if (ov) { ov.style.opacity = '0' } }}>
                              <img src={att.fileUrl} alt={att.fileName} style={{ width: '100%', display: 'block', objectFit: 'cover', maxHeight: 90 }} />
                              <div className="att-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}>
                                <FaSearch style={{ color: '#fff', fontSize: 20 }} />
                              </div>
                            </a>
                          ) : (
                            <a key={i} href={att.fileUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: PAGE_BG, borderRadius: 8, border: `1px solid ${PAGE_BORDER}`, fontSize: 11, color: '#3b82f6', fontWeight: 600, textDecoration: 'none' }}>
                              <FaTags style={{ fontSize: 11 }} /> {att.fileName}
                            </a>
                          )
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              </div>

              {/* Footer */}
              {score != null && (
                <div style={{ padding: '14px 24px', borderTop: `1px solid ${PAGE_BORDER}`, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: PAGE_BG, borderRadius: 10, padding: '8px 16px', border: `1px solid ${PAGE_BORDER}` }}>
                    <FaChartLine style={{ color: PAGE_GRAY, fontSize: 12 }} />
                    <span style={{ fontSize: 12, color: PAGE_GRAY, fontWeight: 600 }}>AI Score</span>
                    <span style={{ fontSize: 16, fontWeight: 900, color: score >= 7 ? '#22c55e' : score >= 5 ? '#f59e0b' : '#ef4444' }}>{score}<span style={{ fontSize: 12, fontWeight: 600, color: PAGE_GRAY }}> / 10</span></span>
                  </div>
                </div>
              )}

            </div>
          </div>
        )
      })()}

      {/* ── Styles ─────────────────────────────────────────────────────────── */}
      <style>{`
        /* Layout */
        .student-freelancing {
          background: #000;
          min-height: 100vh;
          padding-bottom: 3rem;
        }

        /* Header */
        .sf-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
          padding: 1.5rem 0 1rem;
          border-bottom: 1px solid #1f1f1f;
          margin-bottom: 1.5rem;
        }

        .sf-header-left {
          display: flex;
          align-items: center;
        }

        /* Task modal body — hide scrollbar, allow scroll */
        .task-modal-body {
          scrollbar-width: none;
        }
        .task-modal-body::-webkit-scrollbar {
          display: none;
        }

        /* Prevent HTML-rendered rich text from overflowing the task details modal */
        .task-html-content * {
          max-width: 100%;
          word-break: break-word;
          overflow-wrap: break-word;
          box-sizing: border-box;
        }
        .task-html-content pre, .task-html-content code {
          white-space: pre-wrap;
        }

        .sf-title {
          font-size: 1.6rem;
          font-weight: 700;
          color: #ff6b35;
        }

        .header-icon {
          color: #ff6b35;
          font-size: 1.6rem;
        }

        /* Tabs */
        .sf-tabs .nav-link {
          color: #888;
          border: none;
          padding: 0.5rem 1rem;
          font-weight: 500;
        }

        .sf-tabs .nav-link.active {
          color: #ff6b35;
          border-bottom: 2px solid #ff6b35;
          background: transparent;
        }

        .tab-count {
          background: rgba(255,107,53,0.15) !important;
          color: #ff6b35 !important;
          border: 1px solid rgba(255,107,53,0.3) !important;
          font-size: 0.75rem;
          font-weight: 700;
          margin-left: 4px;
          padding: 0.2rem 0.5rem;
          border-radius: 20px;
        }

        /* Filters */
        .sf-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 1.5rem;
          align-items: center;
        }

        .search-box {
          position: relative;
          flex: 1;
          min-width: 220px;
          max-width: 400px;
        }

        .search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #666;
          font-size: 0.9rem;
        }

        .search-input {
          width: 100%;
          background: #1a1a1a;
          border: 1px solid #333;
          color: #fff;
          border-radius: 10px;
          padding: 0.55rem 1rem 0.55rem 2.4rem;
          font-size: 0.9rem;
          outline: none;
          transition: border-color 0.2s;
        }

        .search-input:focus {
          border-color: #ff6b35;
        }

        .search-input::placeholder { color: #555; }

        .category-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .cat-pill {
          background: #1a1a1a;
          border: 1px solid #333;
          color: #bbb;
          padding: 0.35rem 0.9rem;
          border-radius: 20px;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .cat-pill.active,
        .cat-pill:hover {
          background: rgba(255,107,53,0.15);
          border-color: #ff6b35;
          color: #ff6b35;
        }

        /* Loading / empty */
        .sf-loading, .sf-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 1rem;
          color: #666;
          text-align: center;
        }

        .sf-loading .spinner-border { color: #ff6b35; margin-bottom: 1rem; }
        .empty-icon { opacity: 0.35; color: #ff6b35; margin-bottom: 1rem; }
        .sf-empty h3 { color: #888; }

        /* ── Task Card ─────────────────────────────────────────────────── */
        .tc-card {
          background: #0f0f0f;
          border: 1px solid #1a1a1a;
          border-radius: 12px;
          padding: 1rem 1.1rem;
          height: 100%;
          display: flex;
          flex-direction: column;
          cursor: pointer;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .tc-card:hover {
          border-color: #2a2a2a;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        }
        .tc-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
          gap: 0.5rem;
        }
        .tc-chips { display: flex; gap: 0.35rem; flex-wrap: wrap; }
        .tc-chip {
          font-size: 0.65rem;
          font-weight: 500;
          padding: 0.12rem 0.5rem;
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
        }
        .tc-chip.tc-cat { background: transparent; border: 1px solid #2a2a2a; color: #888; }
        .tc-chip.tc-nda { background: rgba(220,53,69,0.1); border: 1px solid rgba(220,53,69,0.3); color: #ff7784; }
        .tc-status-chip {
          font-size: 0.63rem;
          font-weight: 600;
          padding: 0.12rem 0.5rem;
          border-radius: 4px;
          white-space: nowrap;
        }
        .tc-status-chip.open { background: rgba(255,107,53,0.1); color: #ff6b35; border: 1px solid rgba(255,107,53,0.3); }
        .tc-status-chip.enrolled { background: rgba(40,167,69,0.1); color: #4ad46d; border: 1px solid rgba(40,167,69,0.35); }
        .tc-status-chip.closed, .tc-status-chip.full { background: transparent; color: #555; border: 1px solid #2a2a2a; }
        .tc-status-chip.soon { background: rgba(255,193,7,0.1); color: #ffc107; border: 1px solid rgba(255,193,7,0.3); }

        .tc-title {
          font-size: 0.92rem;
          font-weight: 600;
          color: #e0e0e0;
          margin: 0 0 0.5rem;
          line-height: 1.4;
        }
        .tc-meta {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.2rem;
          font-size: 0.72rem;
          color: #666;
          margin-bottom: 0.5rem;
        }
        .tc-budget { color: #ff6b35; font-weight: 700; font-size: 0.85rem; }
        .tc-budget-nil { color: #444; font-style: italic; }
        .tc-sep { color: #333; margin: 0 0.15rem; }
        .tc-date { display: inline-flex; align-items: center; }
        .tc-date.overdue { color: #de350b; }
        .tc-exp { color: #666; }
        .tc-skills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.3rem;
          margin-bottom: 0.55rem;
        }
        .tc-skill {
          font-size: 0.65rem;
          padding: 0.1rem 0.45rem;
          border-radius: 4px;
          background: transparent;
          border: 1px solid #1e1e1e;
          color: #777;
          font-weight: 500;
        }
        .tc-skill.more { border-style: dashed; color: #555; }
        .tc-bar-wrap {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.55rem;
        }
        .tc-bar { flex: 1; height: 3px; background: #1a1a1a; border-radius: 2px; overflow: hidden; }
        .tc-bar-fill { height: 100%; background: linear-gradient(90deg,#ff6b35,#ff9a5c); border-radius: 2px; }
        .tc-bar-text { font-size: 0.65rem; color: #555; white-space: nowrap; }
        .tc-sub-row { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.5rem; }
        .tc-sub-chip {
          font-size: 0.65rem;
          padding: 0.1rem 0.5rem;
          border-radius: 4px;
          font-weight: 600;
          border: 1px solid transparent;
        }
        .tc-sub-chip.done { background: rgba(40,167,69,0.1); color: #4ad46d; border-color: rgba(40,167,69,0.3); }
        .tc-sub-chip.pend { background: rgba(255,193,7,0.1); color: #ffd85d; border-color: rgba(255,193,7,0.3); }
        .tc-sub-chip.appr { background: rgba(40,167,69,0.1); color: #4ad46d; border-color: rgba(40,167,69,0.3); }
        .tc-sub-chip.rej { background: rgba(220,53,69,0.1); color: #ff7784; border-color: rgba(220,53,69,0.3); }
        .tc-sub-chip.rev { background: rgba(255,193,7,0.1); color: #ffd85d; border-color: rgba(255,193,7,0.3); }
        .tc-actions {
          display: flex;
          gap: 0.45rem;
          margin-top: auto;
          padding-top: 0.65rem;
        }
        .tc-btn-ghost, .tc-btn-primary, .tc-btn-success, .tc-btn-disabled {
          flex: 1;
          height: 32px;
          border: none;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }
        .tc-btn-ghost { background: transparent; border: 1px solid #2a2a2a; color: #888; }
        .tc-btn-ghost:hover { border-color: #ff6b35; color: #ff6b35; }
        .tc-btn-primary { background: linear-gradient(135deg,#ff6b35,#ff9a5c); color: #fff; }
        .tc-btn-primary:hover { opacity: 0.9; }
        .tc-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .tc-btn-success { background: rgba(40,167,69,0.12); border: 1px solid #28a745; color: #4ad46d; cursor: not-allowed; }
        .tc-btn-disabled { background: transparent; border: 1px solid #1e1e1e; color: #444; cursor: not-allowed; }

        /* ── Detail Modal ──────────────────────────────────────────────── */
        body.modal-open > *:not(.modal):not(.modal-backdrop) {
          filter: blur(4px);
          transition: filter 0.2s ease;
        }
        .td-modal .modal-content {
          background: rgba(10, 10, 10, 0.88);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: none;
          color: #fff;
          height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .td-modal-header {
          background: #0d0d0d;
          border-bottom: 1px solid #1a1a1a;
          padding: 0.75rem 1.25rem;
          flex-shrink: 0;
        }
        .td-modal-header .btn-close { filter: invert(1) brightness(0.6); }
        .td-modal-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #ccc;
          display: flex;
          align-items: center;
        }
        .td-modal-body {
          flex: 1;
          overflow: hidden;
        }
        .td-layout {
          display: grid;
          grid-template-columns: 300px 1fr;
          height: 100%;
          overflow: hidden;
        }
        .td-sidebar {
          border-right: 1px solid #161616;
          overflow-y: auto;
          padding: 1.5rem 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0;
          background: #0d0d0d;
        }
        .td-chip-row { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.75rem; }
        .td-chip {
          font-size: 0.65rem;
          font-weight: 500;
          padding: 0.15rem 0.55rem;
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
        }
        .td-chip-cat { background: transparent; border: 1px solid #2a2a2a; color: #888; }
        .td-chip-nda { background: rgba(220,53,69,0.1); border: 1px solid rgba(220,53,69,0.3); color: #ff7784; }
        .td-title {
          font-size: 1rem;
          font-weight: 700;
          color: #e8e8e8;
          line-height: 1.4;
          margin: 0 0 1.25rem;
        }
        .td-stats { display: flex; flex-direction: column; gap: 0; margin-bottom: 1rem; }
        .td-stat-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 0.5rem 0;
          border-bottom: 1px solid #161616;
          gap: 0.5rem;
        }
        .td-stat-row:last-child { border-bottom: none; }
        .td-stat-label { font-size: 0.67rem; color: #555; text-transform: uppercase; letter-spacing: 0.4px; font-weight: 500; flex-shrink: 0; }
        .td-stat-val { font-size: 0.82rem; font-weight: 600; color: #ccc; text-align: right; }
        .td-stat-val.budget { color: #ff6b35; font-size: 1rem; }
        .td-stat-val.success { color: #4ad46d; }
        .td-stat-val.danger { color: #ff5555; }
        .td-stat-val.sm { font-size: 0.72rem; font-weight: 400; color: #999; }
        .td-enroll-bar-wrap { margin-bottom: 1rem; }
        .td-enroll-bar { height: 4px; background: #1a1a1a; border-radius: 2px; overflow: hidden; margin-bottom: 0.3rem; }
        .td-enroll-fill { height: 100%; background: linear-gradient(90deg,#ff6b35,#ff9a5c); border-radius: 2px; }
        .td-enroll-txt { font-size: 0.67rem; color: #555; }
        .td-skills-wrap { margin-bottom: 1rem; }
        .td-skills-label { font-size: 0.62rem; color: #555; text-transform: uppercase; letter-spacing: 0.4px; display: block; margin-bottom: 0.4rem; }
        .td-skills { display: flex; flex-wrap: wrap; gap: 0.3rem; }
        .td-skill { font-size: 0.67rem; padding: 0.12rem 0.5rem; border-radius: 4px; background: transparent; border: 1px solid #1e1e1e; color: #777; font-weight: 500; }
        .td-alert { padding: 0.6rem 0.85rem; border-radius: 8px; font-size: 0.82rem; margin-bottom: 0.75rem; }
        .td-alert.error { background: rgba(220,53,69,0.1); border: 1px solid #dc3545; color: #ff7784; }
        .td-alert.success { background: rgba(40,167,69,0.1); border: 1px solid #28a745; color: #4ad46d; }
        .td-cta { display: flex; flex-direction: column; gap: 0.5rem; margin-top: auto; padding-top: 1rem; }
        .td-btn-primary, .td-btn-ghost, .td-btn-success, .td-btn-disabled {
          width: 100%;
          height: 38px;
          border: none;
          border-radius: 8px;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.15s;
        }
        .td-btn-primary { background: linear-gradient(135deg,#ff6b35,#ff9a5c); color: #fff; }
        .td-btn-primary:hover { opacity: 0.9; }
        .td-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .td-btn-ghost { background: transparent; border: 1px solid #2a2a2a; color: #777; }
        .td-btn-ghost:hover { border-color: #444; color: #aaa; }
        .td-btn-success { background: rgba(40,167,69,0.12); border: 1px solid #28a745; color: #4ad46d; cursor: not-allowed; }
        .td-btn-disabled { background: transparent; border: 1px solid #1e1e1e; color: #444; cursor: not-allowed; }
        .td-content { overflow-y: auto; padding: 1.5rem 2rem; }
        .td-section { margin-bottom: 1.75rem; padding-bottom: 1.75rem; border-bottom: 1px solid #141414; }
        .td-section:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
        .td-section-heading {
          font-size: 0.8rem;
          font-weight: 700;
          color: #ff6b35;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 0.85rem;
          display: flex;
          align-items: center;
        }
        .td-rich { font-size: 0.88rem; color: #bbb; line-height: 1.7; word-break: break-word; overflow-wrap: anywhere; }
        .td-rich p { margin-bottom: 0.5rem; }
        .td-rich ul, .td-rich ol { padding-left: 1.5rem; }
        .td-rich li { margin-bottom: 0.25rem; }
        .td-rich strong { color: #e0e0e0; }
        .td-rich a { color: #ff6b35; }
        .td-rich pre, .td-rich code { white-space: pre-wrap !important; word-break: break-word; }
        .td-link { color: #ff6b35; font-size: 0.85rem; word-break: break-all; text-decoration: none; }
        .td-link:hover { text-decoration: underline; }
        .td-attachments { display: flex; flex-direction: column; gap: 0.45rem; }
        .td-att-link {
          background: #111;
          border: 1px solid #1e1e1e;
          color: #aaa;
          padding: 0.45rem 0.85rem;
          border-radius: 6px;
          font-size: 0.82rem;
          text-decoration: none;
          width: fit-content;
          transition: border-color 0.2s;
        }
        .td-att-link:hover { border-color: #ff6b35; color: #ff6b35; }

        /* Responsive */
        @media (max-width: 768px) {
          .td-layout { grid-template-columns: 1fr; }
          .td-sidebar { border-right: none; border-bottom: 1px solid #161616; }
        }
        @media (max-width: 576px) {
          .sf-header { flex-direction: column; align-items: flex-start; }
          .sf-filters { flex-direction: column; }
          .search-box { max-width: 100%; }
        }

        /* ── Jira Kanban Board ─────────────────────────────────────────── */
        /* ── Jira stat boxes ── */
        .jira-stat-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        @media (max-width: 768px) {
          .jira-stat-row { grid-template-columns: repeat(2, 1fr); }
        }

        .jira-stat-box {
          background: #0d0d0d;
          border: 1px solid #1f1f1f;
          border-radius: 12px;
          padding: 1.1rem 1.2rem 0.9rem;
          position: relative;
          transition: border-color 0.2s, background 0.2s;
          user-select: none;
        }

        .jira-stat-box:hover {
          border-color: #333;
          background: #111;
        }

        .jira-stat-box.active {
          background: #111;
          border-color: #333;
        }

        .jira-stat-count {
          font-size: 2rem;
          font-weight: 800;
          line-height: 1;
          margin-bottom: 0.3rem;
        }

        .jira-stat-label {
          font-size: 0.72rem;
          font-weight: 600;
          color: #888;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .jira-stat-active-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
        }

        /* ── New Jira Board (jb-*) ── */
        .jb-stat-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 1.25rem;
        }
        @media (max-width: 768px) {
          .jb-stat-row { grid-template-columns: repeat(2, 1fr); }
        }

        .jb-stat-box {
          background: #0d0d0d;
          border: 1px solid #1f1f1f;
          border-radius: 12px;
          padding: 1rem 1.1rem 0.85rem;
          position: relative;
          cursor: pointer;
          overflow: hidden;
          transition: border-color 0.2s, background 0.2s;
          user-select: none;
        }
        .jb-stat-box:hover { border-color: #333; background: #111; }
        .jb-stat-box.active { background: #111; border-color: #333; }

        .jb-stat-top {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          margin-bottom: 0.65rem;
        }
        .jb-stat-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .jb-stat-name {
          font-size: 0.72rem;
          font-weight: 600;
          color: #888;
          letter-spacing: 0.4px;
          text-transform: uppercase;
        }
        .jb-stat-count {
          font-size: 2rem;
          font-weight: 800;
          line-height: 1;
          margin-bottom: 0.2rem;
        }
        .jb-stat-sub {
          font-size: 0.68rem;
          color: #555;
        }
        .jb-stat-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
        }

        .jb-filter-pill {
          display: inline-flex;
          align-items: center;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.2rem 0.6rem;
          border-radius: 20px;
          border: 1px solid;
        }

        /* ── jb table ── */
        .jb-table {
          background: #0d0d0d;
          border: 1px solid #1f1f1f;
          border-radius: 12px;
          overflow: hidden;
        }
        .jb-thead {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.6rem 1rem;
          background: #111;
          border-bottom: 1px solid #1f1f1f;
          font-size: 0.68rem;
          font-weight: 700;
          color: #555;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }
        .jb-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.8rem 1rem;
          border-bottom: 1px solid #141414;
          cursor: pointer;
          transition: background 0.15s;
        }
        .jb-row:last-child { border-bottom: none; }
        .jb-row:hover { background: #111; }
        .jb-row-title {
          font-size: 0.85rem;
          font-weight: 600;
          color: #fff;
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* ── Jira list ── */
        .jira-list {
          background: #0d0d0d;
          border: 1px solid #1f1f1f;
          border-radius: 12px;
          overflow: hidden;
        }

        .jira-list-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.65rem 1rem;
          background: #111;
          border-bottom: 1px solid #1f1f1f;
          font-size: 0.72rem;
          font-weight: 700;
          color: #555;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .jira-list-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.85rem 1rem;
          border-bottom: 1px solid #141414;
          cursor: pointer;
          transition: background 0.15s;
        }

        .jira-list-row:last-child { border-bottom: none; }

        .jira-list-row:hover { background: #111; }

        .jira-row-id {
          font-size: 0.72rem;
          color: #555;
          font-family: monospace;
          flex-shrink: 0;
        }

        .jira-row-title {
          color: #fff;
          font-size: 0.88rem;
          font-weight: 600;
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* ── Jira Kanban (new) ── */
        .jira-kanban-board {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.75rem;
          align-items: flex-start;
        }
        @media (max-width: 900px) {
          .jira-kanban-board { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 576px) {
          .jira-kanban-board { grid-template-columns: 1fr; }
        }

        .jira-kanban-col {
          background: #111;
          border-radius: 8px;
          overflow: hidden;
          transition: opacity 0.2s;
        }
        .jira-col-dimmed { opacity: 0.45; }

        .jira-kanban-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.65rem 0.85rem;
          border-bottom: 1px solid #1a1a1a;
          cursor: pointer;
          user-select: none;
        }
        .jira-kanban-header:hover { background: #161616; }

        .jira-kanban-label {
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.6px;
        }

        .jira-kanban-count {
          background: #1f1f1f;
          color: #888;
          font-size: 0.7rem;
          font-weight: 700;
          min-width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 0.3rem;
        }

        .jira-kanban-cards {
          padding: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          min-height: 80px;
        }

        .jira-kanban-empty {
          text-align: center;
          padding: 1.5rem 0;
          color: #333;
          font-size: 0.75rem;
        }

        .jira-kanban-card {
          background: #0d0d0d;
          border: 1px solid #1f1f1f;
          border-left-width: 3px;
          border-radius: 6px;
          padding: 0.7rem 0.8rem 0.65rem;
          cursor: pointer;
          transition: box-shadow 0.18s, background 0.18s;
        }
        .jira-kanban-card:hover {
          background: #111;
          box-shadow: 0 2px 14px rgba(0,0,0,0.5);
        }

        .jira-kanban-card-title {
          font-size: 0.83rem;
          font-weight: 500;
          color: #ddd;
          line-height: 1.45;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .jira-kanban-card-footer {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.65rem;
          padding-top: 0.5rem;
          border-top: 1px solid #1a1a1a;
          flex-wrap: wrap;
        }

        /* legacy — kept for action button */
        .kanban-col { background: #0d0d0d; border: 1px solid #1a1a1a; border-radius: 12px; overflow: hidden; }
        .kanban-col-header { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 0.9rem; background: #111; border-bottom: 1px solid #1a1a1a; }
        .kanban-col-name { font-size: 0.75rem; font-weight: 700; color: #ccc; letter-spacing: 0.5px; text-transform: uppercase; }
        .kanban-col-count { font-size: 0.72rem; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: 20px; }
        .kanban-col-body { padding: 0.6rem; display: flex; flex-direction: column; gap: 0.6rem; min-height: 120px; }
        .kanban-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem 0.5rem; color: #333; font-size: 0.78rem; text-align: center; }
        .kanban-card { background: #111; border: 1px solid #222; border-radius: 8px; padding: 0.75rem; cursor: pointer; transition: border-color 0.2s, transform 0.15s, box-shadow 0.2s; }
        .kanban-card:hover { border-color: #ff6b35; transform: translateY(-2px); box-shadow: 0 4px 16px rgba(255,107,53,0.12); }
        .kanban-card-title { font-size: 0.85rem; font-weight: 600; color: #fff; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 0.1rem; }

        .kanban-action-btn {
          display: block;
          width: 100%;
          margin-top: 0.65rem;
          font-size: 0.74rem;
          font-weight: 600;
          padding: 0.36rem 0.5rem;
          border-radius: 5px;
          cursor: pointer;
          transition: opacity 0.2s;
          text-align: center;
        }

        .kanban-action-btn:hover { opacity: 0.8; }

        /* legacy reference kept */
        .jira-board {
          display: flex;
          gap: 1rem;
          overflow-x: auto;
          padding-bottom: 1rem;
          align-items: flex-start;
        }

        .jira-column {
          min-width: 280px;
          max-width: 300px;
          flex-shrink: 0;
          background: #0d0d0d;
          border-radius: 12px;
          padding: 0.75rem;
        }

        .jira-col-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.25rem;
        }

        .jira-col-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .jira-col-name {
          color: #fff;
          font-size: 0.82rem;
          font-weight: 600;
          flex: 1;
          letter-spacing: 0.3px;
        }

        .jira-col-count {
          background: rgba(255,107,53,0.15);
          color: #ff6b35;
          border: 1px solid rgba(255,107,53,0.3);
          font-size: 0.72rem;
          font-weight: 700;
          padding: 0.1rem 0.45rem;
          border-radius: 20px;
        }

        .jira-ticket {
          background: #111;
          border: 1px solid #222;
          border-left-width: 3px;
          border-radius: 8px;
          padding: 0.75rem;
          margin-top: 0.6rem;
          cursor: pointer;
          transition: border-color 0.2s, transform 0.15s;
        }

        .jira-ticket:hover {
          border-color: #ff6b35 !important;
          transform: translateY(-1px);
        }

        .jira-ticket-id {
          font-size: 0.68rem;
          color: #555;
          margin-bottom: 0.25rem;
        }

        .jira-ticket-title {
          color: #fff;
          font-size: 0.88rem;
          font-weight: 700;
          line-height: 1.4;
          margin-bottom: 0.4rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .jira-ticket-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          font-size: 0.75rem;
          color: #888;
          margin-bottom: 0.2rem;
        }

        .jira-ticket-skills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.3rem;
          margin: 0.4rem 0;
        }

        .jira-ticket-skill {
          background: #1a1a1a;
          border: 1px solid #2a2a2a;
          color: #ccc;
          font-size: 0.7rem;
          padding: 0.15rem 0.5rem;
          border-radius: 6px;
        }

        .jira-ticket-action {
          display: block;
          width: 100%;
          margin-top: 0.6rem;
          font-size: 0.78rem;
          font-weight: 600;
          padding: 0.35rem 0.5rem;
          border-radius: 6px;
          border-width: 1px;
          border-style: solid;
          cursor: pointer;
          transition: opacity 0.2s;
          text-align: center;
        }

        .jira-ticket-action:hover {
          opacity: 0.8;
        }

        .jira-feedback {
          font-size: 0.72rem;
          color: #cc8888;
          background: rgba(222,53,11,0.07);
          border-left: 2px solid rgba(222,53,11,0.5);
          padding: 0.3rem 0.55rem;
          border-radius: 4px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.45;
          font-style: italic;
        }
      `}</style>
    </>
  )
}

export default StudentFreelancingDashboard
