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

  // ── Render: Task Card ────────────────────────────────────────────────────
  const renderTaskCard = (task: FreelancingTask, enrolled = false) => {
    const deadlinePast = isDeadlinePast(task.deadline)
    const full = (task.spotsLeft ?? 0) <= 0
    const submissionStatus = task.mySubmission?.status || 'pending'
    const reviewStatus = task.mySubmission?.adminReviewStatus || 'pending'

    const reviewLabel =
      reviewStatus === 'approved'
        ? 'Approved'
        : reviewStatus === 'rejected'
          ? 'Rejected'
          : 'Pending Review'

    return (
      <Col key={task._id} lg={4} md={6} xs={12}>
        <Card className="task-card">
          <Card.Body>
            {/* Category badge + NDA */}
            <div className="task-badges">
              {task.category && (
                <span className="badge cat-badge">
                  {CATEGORY_LABELS[task.category] || task.category}
                </span>
              )}
              {task.ndaRequired && (
                <span className="badge nda-badge">
                  <FaLock size={10} className="me-1" />
                  NDA
                </span>
              )}
            </div>

            <h4 className="task-title">{task.title}</h4>

            {/* Meta row */}
            <div className="task-meta">
              {task.amount ? (
                <span className="meta-item budget">
                  ₹{task.amount.toLocaleString()}
                </span>
              ) : null}

              {task.experience && (
                <span className="meta-item exp">
                  {EXPERIENCE_LABELS[task.experience] || task.experience}
                </span>
              )}
            </div>

            {/* Deadline + spots */}
            <div className="task-info-row">
              <div className="info-item">
                <FaCalendarAlt className="info-icon" />
                <span className={deadlinePast ? 'text-danger' : ''}>
                  {task.deadline ? formatDate(task.deadline) : '—'}
                  {deadlinePast && ' (Closed)'}
                </span>
              </div>
              <div className="info-item">
                <FaUsers className="info-icon" />
                <span>
                  {task.spotsLeft ?? task.maxStudents ?? 0} spots left
                </span>
              </div>
            </div>

            {/* Skills */}
            {(task.skills?.length ?? 0) > 0 && (
              <div className="skills-row">
                {task.skills!.slice(0, 4).map((s) => (
                  <span key={s} className="skill-chip">
                    {s}
                  </span>
                ))}
                {task.skills!.length > 4 && (
                  <span className="skill-chip more">+{task.skills!.length - 4}</span>
                )}
              </div>
            )}

            {/* Spots bar */}
            {typeof task.maxStudents === 'number' && task.maxStudents > 0 && (
              <div className="spots-bar-wrap">
                <div className="spots-bar">
                  <div
                    className="spots-fill"
                    style={{
                      width: `${Math.round(
                        ((task.enrolledCount ?? 0) / task.maxStudents) * 100
                      )}%`,
                    }}
                  />
                </div>
                <span className="spots-text">
                  {task.enrolledCount ?? 0}/{task.maxStudents} enrolled
                </span>
              </div>
            )}

            {enrolled && (
              <div className="submission-status-row">
                <span className={`submission-chip ${submissionStatus === 'completed' ? 'completed' : 'pending'}`}>
                  Submission: {submissionStatus === 'completed' ? 'Completed' : 'Pending'}
                </span>
                <span
                  className={`submission-chip review ${
                    reviewStatus === 'approved'
                      ? 'approved'
                      : reviewStatus === 'rejected'
                        ? 'rejected'
                        : 'pending-review'
                  }`}
                >
                  Review: {reviewLabel}
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="task-actions">
              <Button
                className="btn-details"
                variant="outline-primary"
                size="sm"
                onClick={() => (enrolled ? openWorkflow(task) : openDetails(task))}
              >
                {enrolled ? 'Open 3-Step Flow' : 'View Details'}
              </Button>

              {enrolled || task.isEnrolled ? (
                enrolled ? (
                  <Button className="btn-enroll" size="sm" onClick={() => openWorkflow(task)}>
                    Continue Task
                  </Button>
                ) : (
                  <Button className="btn-enrolled" size="sm" disabled>
                    <FaCheckCircle size={12} className="me-1" />
                    Enrolled
                  </Button>
                )
              ) : deadlinePast ? (
                <Button className="btn-closed" size="sm" disabled>
                  Closed
                </Button>
              ) : full ? (
                <Button className="btn-closed" size="sm" disabled>
                  Full
                </Button>
              ) : (
                <Button
                  className="btn-enroll"
                  size="sm"
                  disabled={enrolling === task._id}
                  onClick={() => handleEnroll(task._id)}
                >
                  {enrolling === task._id ? (
                    <Spinner animation="border" size="sm" className="me-1" />
                  ) : null}
                  Apply Now
                </Button>
              )}
            </div>
          </Card.Body>
        </Card>
      </Col>
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
                <Row className="g-3 g-md-4">
                  {myTasks.map((t) => renderTaskCard(t, true))}
                </Row>
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
        centered
        className="task-detail-modal"
        dialogClassName="modal-dialog-scrollable"
        style={{ zIndex: 10001 }}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaBriefcase className="me-2" />
            Task Details
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {selectedTask && (
            <div className="detail-body">
              {/* Title + badges */}
              <div className="detail-hero">
                <h3 className="detail-title">{selectedTask.title}</h3>
                <div className="detail-badges">
                  {selectedTask.category && (
                    <Badge className="cat-badge">
                      {CATEGORY_LABELS[selectedTask.category] || selectedTask.category}
                    </Badge>
                  )}
                  {selectedTask.ndaRequired && (
                    <Badge className="nda-badge">
                      <FaLock size={10} className="me-1" />
                      NDA Required
                    </Badge>
                  )}
                </div>
              </div>

              {/* Key stats row */}
              <Row className="g-3 mb-4">
                <Col sm={3} xs={6}>
                  <div className="stat-card">
                    <span className="stat-label">Budget</span>
                    <span className="stat-value budget">
                      {selectedTask.amount ? `₹${selectedTask.amount.toLocaleString()}` : '—'}
                    </span>
                  </div>
                </Col>
                <Col sm={3} xs={6}>
                  <div className="stat-card">
                    <span className="stat-label">Max Students</span>
                    <span className="stat-value">{selectedTask.maxStudents ?? '—'}</span>
                  </div>
                </Col>
                <Col sm={3} xs={6}>
                  <div className="stat-card">
                    <span className="stat-label">Spots Left</span>
                    <span className={`stat-value ${(selectedTask.spotsLeft ?? 0) === 0 ? 'danger' : 'success'}`}>
                      {selectedTask.spotsLeft ?? selectedTask.maxStudents ?? '—'}
                    </span>
                  </div>
                </Col>
                <Col sm={3} xs={6}>
                  <div className="stat-card">
                    <span className="stat-label">Experience</span>
                    <span className="stat-value exp-sm">
                      {EXPERIENCE_LABELS[selectedTask.experience || ''] || selectedTask.experience || '—'}
                    </span>
                  </div>
                </Col>
              </Row>

              {/* Dates */}
              <div className="detail-section">
                <h6 className="section-heading">
                  <FaCalendarAlt className="me-2" />
                  Timeline
                </h6>
                <div className="dates-row">
                  <div className="date-item">
                    <span className="date-lbl">Start Date</span>
                    <span className="date-val">{formatDate(selectedTask.startDate)}</span>
                  </div>
                  <FaChevronRight className="date-arrow" />
                  <div className="date-item">
                    <span className="date-lbl">Deadline</span>
                    <span className={`date-val ${isDeadlinePast(selectedTask.deadline) ? 'text-danger' : ''}`}>
                      {formatDate(selectedTask.deadline)}
                      {isDeadlinePast(selectedTask.deadline) && ' (Closed)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedTask.description && (
                <div className="detail-section">
                  <h6 className="section-heading">
                    <FaTags className="me-2" />
                    Description
                  </h6>
                  <div
                    className="rich-content"
                    dangerouslySetInnerHTML={{ __html: selectedTask.description }}
                  />
                </div>
              )}

              {/* Highlights */}
              {selectedTask.highlights && (
                <div className="detail-section">
                  <h6 className="section-heading">⭐ Key Highlights</h6>
                  <div
                    className="rich-content"
                    dangerouslySetInnerHTML={{ __html: selectedTask.highlights }}
                  />
                </div>
              )}

              {/* Acceptance Criteria */}
              {selectedTask.acceptanceCriteria && (
                <div className="detail-section">
                  <h6 className="section-heading">
                    <FaCheckCircle className="me-2" />
                    Acceptance Criteria
                  </h6>
                  <div
                    className="rich-content"
                    dangerouslySetInnerHTML={{ __html: selectedTask.acceptanceCriteria }}
                  />
                </div>
              )}

              {/* Skills */}
              {(selectedTask.skills?.length ?? 0) > 0 && (
                <div className="detail-section">
                  <h6 className="section-heading">
                    <FaUserGraduate className="me-2" />
                    Required Skills
                  </h6>
                  <div className="skills-row">
                    {selectedTask.skills!.map((s) => (
                      <span key={s} className="skill-chip">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* GitHub */}
              {selectedTask.githubLink && (
                <div className="detail-section">
                  <h6 className="section-heading">
                    <FaCodeBranch className="me-2" />
                    Repository
                  </h6>
                  <a
                    href={selectedTask.githubLink}
                    target="_blank"
                    rel="noreferrer"
                    className="github-link"
                  >
                    {selectedTask.githubLink}
                  </a>
                </div>
              )}

              {/* Terms */}
              {selectedTask.terms && (
                <div className="detail-section">
                  <h6 className="section-heading">📋 Terms & Conditions</h6>
                  <div
                    className="rich-content"
                    dangerouslySetInnerHTML={{ __html: selectedTask.terms }}
                  />
                </div>
              )}

              {/* Attachments */}
              {(selectedTask.attachments?.length ?? 0) > 0 && (
                <div className="detail-section">
                  <h6 className="section-heading">📎 Attachments</h6>
                  <div className="attachments-list">
                    {selectedTask.attachments!.map((att, i) => (
                      <a
                        key={i}
                        href={att.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="attachment-link"
                      >
                        📄 {att.fileName || `Attachment ${i + 1}`}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Enroll feedback */}
              {enrollError && (
                <div className="enroll-alert error">{enrollError}</div>
              )}
              {enrollSuccess && (
                <div className="enroll-alert success">✓ {enrollSuccess}</div>
              )}
            </div>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="outline-secondary" className="modal-footer-btn" onClick={() => setShowModal(false)}>
            Close
          </Button>
          {selectedTask && (
            selectedTask.isEnrolled ? (
              <Button className="btn-enrolled modal-footer-btn" disabled>
                <FaCheckCircle size={14} className="me-1" />
                Already Enrolled
              </Button>
            ) : isDeadlinePast(selectedTask.deadline) ? (
              <Button className="btn-closed" disabled>Deadline Passed</Button>
            ) : (selectedTask.spotsLeft ?? 0) <= 0 ? (
              <Button className="btn-closed" disabled>No Spots Available</Button>
            ) : (
              <Button
                className="btn-enroll modal-footer-btn"
                disabled={enrolling === selectedTask._id}
                onClick={() => handleEnroll(selectedTask._id)}
              >
                {enrolling === selectedTask._id ? (
                  <><Spinner animation="border" size="sm" className="me-1" /> Enrolling…</>
                ) : (
                  'Apply Now'
                )}
              </Button>
            )
          )}
        </Modal.Footer>
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
          background: rgba(255,107,53,0.2);
          color: #ff6b35;
          font-size: 0.75rem;
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

        /* Task Card */
        .task-card {
          background: #0d0d0d;
          border: 1px solid #1f1f1f;
          border-radius: 16px;
          height: 100%;
          transition: border-color 0.2s, transform 0.2s;
        }

        .task-card:hover {
          border-color: #ff6b35;
          transform: translateY(-2px);
        }

        .task-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          margin-bottom: 0.75rem;
        }

        .cat-badge {
          background: rgba(255,107,53,0.15) !important;
          color: #ff6b35 !important;
          font-size: 0.75rem;
          padding: 0.3rem 0.7rem;
          border-radius: 8px;
          font-weight: 500;
        }

        .nda-badge {
          background: rgba(220,53,69,0.15) !important;
          color: #ff4d5e !important;
          font-size: 0.72rem;
          padding: 0.3rem 0.6rem;
          border-radius: 8px;
          display: flex;
          align-items: center;
        }

        .task-title {
          font-size: 1rem;
          font-weight: 600;
          color: #fff;
          margin-bottom: 0.6rem;
          line-height: 1.4;
        }

        .task-meta {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-bottom: 0.75rem;
        }

        .meta-item.budget {
          font-size: 1rem;
          font-weight: 700;
          color: #ff6b35;
        }

        .meta-item.exp {
          font-size: 0.78rem;
          color: #aaa;
          background: #1a1a1a;
          padding: 0.2rem 0.6rem;
          border-radius: 6px;
        }

        .task-info-row {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          margin-bottom: 0.75rem;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.82rem;
          color: #999;
        }

        .info-icon { color: #ff6b35; font-size: 0.8rem; }

        /* Skills */
        .skills-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          margin-bottom: 0.75rem;
        }

        .skill-chip {
          background: #1a1a1a;
          border: 1px solid #2a2a2a;
          color: #ccc;
          font-size: 0.75rem;
          padding: 0.2rem 0.6rem;
          border-radius: 6px;
        }

        .skill-chip.more {
          background: #333;
          color: #aaa;
        }

        /* Spots bar */
        .spots-bar-wrap {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .spots-bar {
          flex: 1;
          height: 5px;
          background: #1f1f1f;
          border-radius: 3px;
          overflow: hidden;
        }

        .spots-fill {
          height: 100%;
          background: linear-gradient(90deg, #ff6b35, #ff9a5c);
          border-radius: 3px;
          transition: width 0.4s;
        }

        .spots-text {
          font-size: 0.75rem;
          color: #888;
          white-space: nowrap;
        }

        .submission-status-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 0.9rem;
        }

        .submission-chip {
          font-size: 0.74rem;
          border-radius: 999px;
          padding: 0.2rem 0.65rem;
          border: 1px solid transparent;
          font-weight: 600;
        }

        .submission-chip.completed {
          background: rgba(40, 167, 69, 0.12);
          color: #4ad46d;
          border-color: rgba(40, 167, 69, 0.45);
        }

        .submission-chip.pending {
          background: rgba(255, 193, 7, 0.14);
          color: #ffd85d;
          border-color: rgba(255, 193, 7, 0.4);
        }

        .submission-chip.review.approved {
          background: rgba(40, 167, 69, 0.12);
          color: #4ad46d;
          border-color: rgba(40, 167, 69, 0.45);
        }

        .submission-chip.review.rejected {
          background: rgba(220, 53, 69, 0.12);
          color: #ff7784;
          border-color: rgba(220, 53, 69, 0.45);
        }

        .submission-chip.review.pending-review {
          background: rgba(255, 193, 7, 0.14);
          color: #ffd85d;
          border-color: rgba(255, 193, 7, 0.4);
        }

        /* Buttons */
        .task-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .btn-details {
          flex: 1;
          font-size: 0.82rem;
          border-color: #444;
          color: #ccc;
          background: transparent;
          border-radius: 8px;
        }

        .btn-details:hover {
          border-color: #ff6b35;
          color: #ff6b35;
          background: transparent;
        }

        .btn-enroll {
          flex: 1;
          font-size: 0.82rem;
          background: linear-gradient(135deg, #ff6b35, #ff9a5c) !important;
          border: none !important;
          color: #fff !important;
          border-radius: 8px;
          font-weight: 600;
        }

        .btn-enrolled {
          flex: 0 0 auto;
          width: auto;
          font-size: 0.78rem;
          background: rgba(40,167,69,0.15) !important;
          border: 1px solid #28a745 !important;
          color: #28a745 !important;
          border-radius: 8px;
          padding: 0.28rem 0.65rem;
          line-height: 1.2;
        }

        .btn-closed {
          flex: 1;
          font-size: 0.82rem;
          background: #1a1a1a !important;
          border: 1px solid #444 !important;
          color: #666 !important;
          border-radius: 8px;
        }

        .modal-footer-btn {
          min-width: 148px;
          height: 38px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .btn-enroll.modal-footer-btn {
          flex: 0 0 auto;
          width: auto;
        }

        /* ── Detail Modal ──────────────────────────────────────────────── */
        .task-detail-modal .modal-content {
          background: #0a0a0a;
          border: 1px solid #333;
          border-radius: 16px;
          color: #fff;
        }

        .task-detail-modal .modal-header {
          background: #0d0d0d;
          border-bottom: 1px solid #1f1f1f;
        }

        .task-detail-modal .modal-title {
          color: #ff6b35;
          font-weight: 700;
          display: flex;
          align-items: center;
        }

        .task-detail-modal .modal-footer {
          background: #0d0d0d;
          border-top: 1px solid #1f1f1f;
        }

        .task-detail-modal .btn-close {
          filter: invert(1) brightness(0.7);
        }

        .detail-hero {
          margin-bottom: 1.5rem;
        }

        .detail-title {
          font-size: 1.3rem;
          font-weight: 700;
          color: #fff;
          margin-bottom: 0.75rem;
        }

        .detail-badges { display: flex; gap: 0.5rem; flex-wrap: wrap; }

        /* Stat cards */
        .stat-card {
          background: #111;
          border: 1px solid #222;
          border-radius: 12px;
          padding: 0.85rem;
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          height: 100%;
        }

        .stat-label {
          font-size: 0.75rem;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-value {
          font-size: 1rem;
          font-weight: 700;
          color: #fff;
        }

        .stat-value.budget { color: #ff6b35; }
        .stat-value.success { color: #28a745; }
        .stat-value.danger { color: #dc3545; }
        .stat-value.exp-sm { font-size: 0.78rem; }

        /* Detail sections */
        .detail-section {
          margin-bottom: 1.5rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid #1a1a1a;
        }

        .detail-section:last-child {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }

        .section-heading {
          color: #ff6b35;
          font-size: 0.95rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
          display: flex;
          align-items: center;
        }

        /* Timeline */
        .dates-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .date-item {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .date-lbl { font-size: 0.75rem; color: #666; }
        .date-val { font-size: 0.95rem; color: #ccc; font-weight: 500; }
        .date-arrow { color: #555; }

        /* Rich HTML content */
        .rich-content {
          font-size: 0.9rem;
          color: #bbb;
          line-height: 1.65;
        }

        .rich-content p { margin-bottom: 0.5rem; }
        .rich-content ul, .rich-content ol { padding-left: 1.5rem; }
        .rich-content li { margin-bottom: 0.25rem; }
        .rich-content strong { color: #fff; }
        .rich-content a { color: #ff6b35; }

        /* GitHub link */
        .github-link {
          color: #ff6b35;
          font-size: 0.88rem;
          word-break: break-all;
          text-decoration: none;
        }
        .github-link:hover { text-decoration: underline; }

        /* Attachments */
        .attachments-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .attachment-link {
          background: #111;
          border: 1px solid #222;
          color: #ccc;
          padding: 0.5rem 0.85rem;
          border-radius: 8px;
          font-size: 0.85rem;
          text-decoration: none;
          transition: border-color 0.2s;
          width: fit-content;
        }

        .attachment-link:hover {
          border-color: #ff6b35;
          color: #ff6b35;
        }

        /* Enroll alerts */
        .enroll-alert {
          padding: 0.75rem 1rem;
          border-radius: 10px;
          font-size: 0.88rem;
          margin-top: 1rem;
        }

        .enroll-alert.error {
          background: rgba(220,53,69,0.1);
          border: 1px solid #dc3545;
          color: #ff6b6b;
        }

        .enroll-alert.success {
          background: rgba(40,167,69,0.1);
          border: 1px solid #28a745;
          color: #6ddf8c;
        }

        /* Responsive */
        @media (max-width: 576px) {
          .sf-header { flex-direction: column; align-items: flex-start; }
          .sf-filters { flex-direction: column; }
          .search-box { max-width: 100%; }
        }
      `}</style>
    </>
  )
}

export default StudentFreelancingDashboard
