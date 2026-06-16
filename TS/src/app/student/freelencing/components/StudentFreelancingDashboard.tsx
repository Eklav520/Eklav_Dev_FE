import React, { useEffect, useMemo, useState } from 'react'
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
  FaBriefcase,
  FaCalendarAlt,
  FaCheckCircle,
  FaChevronRight,
  FaCodeBranch,
  FaGraduationCap,
  FaLock,
  FaSearch,
  FaTags,
  FaUserGraduate,
  FaUsers,
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

  const [selectedTask, setSelectedTask] = useState<FreelancingTask | null>(null)
  const [boardFilter, setBoardFilter] = useState<string | null>(null)
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
    return tasks.filter((t) => {
      const matchSearch =
        (t.title || '').toLowerCase().includes(q) ||
        (t.category || '').toLowerCase().includes(q) ||
        (t.skills || []).some((s) => s.toLowerCase().includes(q))
      const matchCategory = categoryFilter === 'all' || t.category === categoryFilter
      return matchSearch && matchCategory
    })
  }, [tasks, searchTerm, categoryFilter])

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
        <div className="tc-card" onClick={() => enrolled ? openWorkflow(task) : openDetails(task)}>
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
            <button className="tc-btn-ghost" onClick={() => enrolled ? openWorkflow(task) : openDetails(task)}>
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

  // ── JSX ──────────────────────────────────────────────────────────────────
  return (
    <>
      <Container fluid className="student-freelancing px-2 px-md-3">
        {/* Header */}
        <div className="sf-header">
          <div className="sf-header-left">
            <FaBriefcase className="header-icon me-2" />
            <h1 className="sf-title mb-0">Freelancing Tasks</h1>
          </div>
          <div className="sf-header-right">
            <Tabs
              activeKey={activeTab}
              onSelect={(k) =>
                setActiveTab((k as 'available' | 'deadline-crossed' | 'enrolled') || 'available')
              }
              className="sf-tabs"
            >
              <Tab
                eventKey="available"
                title={
                  <span>
                    Available{' '}
                    <Badge className="tab-count">{availableTasks.length}</Badge>
                  </span>
                }
              />
              <Tab
                eventKey="deadline-crossed"
                title={
                  <span>
                    Deadline Crossed{' '}
                    <Badge className="tab-count">{deadlineCrossedTasks.length}</Badge>
                  </span>
                }
              />
              <Tab
                eventKey="enrolled"
                title={
                  <span>
                    My Tasks{' '}
                    <Badge className="tab-count">{myTasks.length}</Badge>
                  </span>
                }
              />
            </Tabs>
          </div>
        </div>

        {/* Search + Category filter (available tab only) */}
        {(activeTab === 'available' || activeTab === 'deadline-crossed') && (
          <div className="sf-filters">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search tasks, skills, category…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="category-pills">
              <button
                className={`cat-pill ${categoryFilter === 'all' ? 'active' : ''}`}
                onClick={() => setCategoryFilter('all')}
              >
                All
              </button>
              {uniqueCategories.map((cat) => (
                <button
                  key={cat}
                  className={`cat-pill ${categoryFilter === cat ? 'active' : ''}`}
                  onClick={() => setCategoryFilter(cat)}
                >
                  {CATEGORY_LABELS[cat]?.replace(/^[^\s]+\s/, '') || cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="sf-content">
          {activeTab === 'available' && (
            <>
              {loading ? (
                <div className="sf-loading">
                  <Spinner animation="border" />
                  <p>Loading tasks…</p>
                </div>
              ) : availableTasks.length === 0 ? (
                <div className="sf-empty">
                  <FaBriefcase size={56} className="empty-icon" />
                  <h3>No tasks available</h3>
                  <p>Check back later for new freelancing opportunities</p>
                </div>
              ) : (
                <Row className="g-3 g-md-4">
                  {availableTasks.map((t) => renderTaskCard(t, false))}
                </Row>
              )}
            </>
          )}

          {activeTab === 'deadline-crossed' && (
            <>
              {loading ? (
                <div className="sf-loading">
                  <Spinner animation="border" />
                  <p>Loading tasks…</p>
                </div>
              ) : deadlineCrossedTasks.length === 0 ? (
                <div className="sf-empty">
                  <FaCalendarAlt size={56} className="empty-icon" />
                  <h3>No deadline crossed tasks</h3>
                  <p>Tasks whose deadline has passed will appear here</p>
                </div>
              ) : (
                <Row className="g-3 g-md-4">
                  {deadlineCrossedTasks.map((t) => renderTaskCard(t, false))}
                </Row>
              )}
            </>
          )}

          {activeTab === 'enrolled' && (
            <>
              {myTasks.length === 0 ? (
                <div className="sf-empty">
                  <FaGraduationCap size={56} className="empty-icon" />
                  <h3>No enrollments yet</h3>
                  <Button
                    className="btn-enroll mt-3"
                    onClick={() => setActiveTab('available')}
                  >
                    Browse Tasks
                  </Button>
                </div>
              ) : (
                renderMyTasksJiraBoard()
              )}
            </>
          )}
        </div>
      </Container>

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
        onSubmitted={async () => {
          await fetchMyTasks()
        }}
      />

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
        .td-modal .modal-content {
          background: #0a0a0a;
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
