import { useAuthContext } from '@/context/useAuthContext'
import React, { useEffect, useState, useMemo } from 'react'
import { Card, Button, Container, Row, Col, Badge, Modal, Tabs, Tab, Pagination } from 'react-bootstrap'
import {
  FaPlay,
  FaCalendar,
  FaClock,
  FaUserTie,
  FaBook,
  FaExternalLinkAlt,
  FaRegCalendarCheck,
  FaChalkboardTeacher,
  FaGraduationCap,
  FaRocket,
  FaVideo,
  FaUsers,
  FaChartLine,
  FaSearch,
  FaFilter,
  FaStar,
  FaLayerGroup,
  FaCertificate,
  FaArrowRight,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaDesktop,
  FaMobileAlt,
  FaGlobe,
  FaLaptop,
} from 'react-icons/fa'

interface Course {
  _id: string
  title: string
  description: string
  instructor: string
  category?: string
  duration?: string
  level?: string
  thumbnail?: string
  rating?: number
  students?: number
}

interface ClassSession {
  _id: string
  title: string
  courseId: Course | null
  date: string | null // tolerate bad data
  startTime: string | null
  endTime: string | null
  meetingLink: string
  capacity?: number
  enrolled?: number
  type?: 'live' | 'recorded' | 'workshop'
}

interface Props {
  userId: string
}

/* ===================== null-safe helpers & predicates ===================== */

/* ===================== null-safe helpers & predicates ===================== */

const notNil = <T,>(x: T | null | undefined): x is T => x != null

type RowWithTimes = { date?: string | null; startTime?: string | null; endTime?: string | null }
type RowWithEnd = { date?: string | null; endTime?: string | null }

const hasDateStartEnd = (x: unknown): x is Required<RowWithTimes> => {
  const r = x as any
  return (
    !!r &&
    typeof r.date === 'string' &&
    r.date.trim() &&
    typeof r.startTime === 'string' &&
    r.startTime.trim() &&
    typeof r.endTime === 'string' &&
    r.endTime.trim()
  )
}

const hasDateEnd = (x: unknown): x is Required<RowWithEnd> => {
  const r = x as any
  return !!r && typeof r.date === 'string' && r.date.trim() && typeof r.endTime === 'string' && r.endTime.trim()
}

/** ---------- date/time normalizers that accept ISO, dd/MM/yyyy, etc. ---------- */
const normalizeDate = (dateStr?: string | null): string | null => {
  if (!dateStr) return null
  let d = dateStr.trim()

  // dd/MM/yyyy -> yyyy-MM-dd
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(d)) {
    const [dd, mm, yyyy] = d.split('/')
    return `${yyyy}-${mm}-${dd}`
  }

  // If ISO like 2025-09-26T00:00:00.000Z, keep only the date
  if (d.includes('T')) return d.slice(0, 10)

  // already yyyy-MM-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d

  // fallback: let Date parse then extract yyyy-MM-dd
  const tmp = new Date(d)
  return Number.isNaN(tmp.getTime()) ? null : tmp.toISOString().slice(0, 10)
}

const normalizeTime = (timeStr?: string | null): string | null => {
  if (!timeStr) return null
  const t = timeStr.trim()
  // supports "H", "HH", "H:mm", "HH:mm"
  const m = t.match(/^(\d{1,2})(?::?(\d{1,2}))?$/)
  if (!m) return null
  const hh = String(Math.min(23, Math.max(0, parseInt(m[1], 10)))).padStart(2, '0')
  const mm = String(Math.min(59, Math.max(0, parseInt(m[2] ?? '0', 10)))).padStart(2, '0')
  return `${hh}:${mm}`
}

/** tolerant parser: works with ISO/“yyyy-MM-dd”/“dd/MM/yyyy” + time */
const safeParseDateTime = (dateStr?: string | null, timeStr?: string | null): Date | null => {
  const d = normalizeDate(dateStr)
  const t = normalizeTime(timeStr)
  if (!d || !t) return null
  const dt = new Date(`${d}T${t}`) // local time (consistent with UI)
  return Number.isNaN(dt.getTime()) ? null : dt
}

const isLive = (row: unknown): boolean => {
  if (!hasDateStartEnd(row)) return false
  const start = safeParseDateTime(row.date, row.startTime)
  const end = safeParseDateTime(row.date, row.endTime)
  if (!start || !end) return false
  const now = new Date()
  return start <= now && now <= end
}

const isUpcoming = (row: unknown): boolean => {
  if (!hasDateStartEnd(row)) return false
  const start = safeParseDateTime(row.date, row.startTime)
  return !!start && start > new Date()
}

/* ===================== component ===================== */

const StudentDashboard: React.FC<Props> = ({ userId }) => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const [availableClasses, setAvailableClasses] = useState<ClassSession[]>([])
  const [enrolledClasses, setEnrolledClasses] = useState<ClassSession[]>([])
  const [selectedClass, setSelectedClass] = useState<ClassSession | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [activeTab, setActiveTab] = useState('available')
  const [searchTerm, setSearchTerm] = useState('')
  const { user } = useAuthContext()
  const token = user?.token
  // Available tab pagination
  const [availPage, setAvailPage] = useState(1)
  const [availPageSize, setAvailPageSize] = useState(9) // cards per page

  // Enrolled tab pagination (optional)
  const [enrPage, setEnrPage] = useState(1)
  const [enrPageSize, setEnrPageSize] = useState(6)

  useEffect(() => {
    fetchAvailableClasses()
    fetchEnrolledClasses()
  }, [])

  const fetchAvailableClasses = async () => {
    try {
      const res = await fetch(`${baseURL}/student/classes`)
      const data = await res.json()
      setAvailableClasses(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error fetching available classes:', err)
    }
  }

  const fetchEnrolledClasses = async () => {
    try {
      const res = await fetch(`${baseURL}/student/my-classes`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      const enrolled = Array.isArray(data) ? data : data.enrolledClasses
      setEnrolledClasses((enrolled || []).filter(notNil))
    } catch (err) {
      console.error('Error fetching enrolled classes:', err)
    }
  }

  // safer “pretty” date/time formatters
  const formatTime = (time24?: string | null): string => {
    if (!time24) return '--'
    const [hStr, mStr = '00'] = time24.split(':')
    const hour = Number(hStr)
    const minute = Number(mStr)
    if (Number.isNaN(hour) || Number.isNaN(minute)) return time24
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 === 0 ? 12 : hour % 12
    return `${hour12}:${String(minute).padStart(2, '0')} ${ampm}`
  }

  const formatDate = (dateStr?: string | null): string => {
    if (!dateStr) return '--'
    let d = dateStr
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(d)) {
      const [dd, mm, yyyy] = d.split('/')
      d = `${yyyy}-${mm}-${dd}`
    }
    const dt = new Date(d)
    if (Number.isNaN(dt.getTime())) return dateStr
    return dt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  }

  const getTimeUntilClass = (cls: ClassSession): string => {
    const start = safeParseDateTime(cls.date, cls.startTime)
    if (!start) return ''
    const now = new Date()
    const diff = start.getTime() - now.getTime()
    if (diff <= 0) return 'Starting now'
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const handleEnroll = async (classId: string) => {
    try {
      const res = await fetch(`${baseURL}/student/enroll/${classId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        alert('Enrolled successfully!')
        fetchEnrolledClasses()
      } else {
        const error = await res.json()
        alert(`Enrollment failed: ${error.error}`)
      }
    } catch (err) {
      console.error('Error during enrollment:', err)
    }
  }

  const showClassDetails = (cls: ClassSession) => {
    setSelectedClass(cls)
    setShowModal(true)
  }

  // SAFE search (don’t call .toLowerCase on undefined)
  const filteredAvailableClasses = useMemo(() => {
    const q = (searchTerm || '').toLowerCase()
    return (availableClasses ?? []).filter(notNil).filter((cls) => {
      const t1 = (cls.title || '').toLowerCase()
      const t2 = (cls.courseId?.title || '').toLowerCase()
      return t1.includes(q) || t2.includes(q)
    })
  }, [availableClasses, searchTerm])

  // Upcoming / Live
  const upcomingClasses = useMemo(
    () => (filteredAvailableClasses ?? []).filter(notNil).filter((cls) => isUpcoming(cls) || isLive(cls)),
    [filteredAvailableClasses],
  )

  // Available
const availTotalPages = Math.max(1, Math.ceil(upcomingClasses.length / availPageSize))
const pagedUpcoming = useMemo(() => {
  const start = (availPage - 1) * availPageSize
  return upcomingClasses.slice(start, start + availPageSize)
}, [upcomingClasses, availPage, availPageSize])

// Enrolled
const enrTotalPages = Math.max(1, Math.ceil(enrolledClasses.length / enrPageSize))
const pagedEnrolled = useMemo(() => {
  const start = (enrPage - 1) * enrPageSize
  return enrolledClasses.slice(start, start + enrPageSize)
}, [enrolledClasses, enrPage, enrPageSize])


  useEffect(() => {
    setAvailPage(1)
  }, [searchTerm, filteredAvailableClasses.length])
  useEffect(() => {
    setEnrPage(1)
  }, [enrolledClasses.length])

  // Completed
  const completedClasses = useMemo(
    () =>
      (enrolledClasses ?? [])
        .filter(notNil)
        .filter(hasDateEnd)
        .filter((cls) => {
          const end = safeParseDateTime(cls.date, cls.endTime)
          return !!end && end < new Date()
        }),
    [enrolledClasses],
  )

  return (
    <>
      <Container fluid className="professional-dashboard">
        {/* Header Section */}
        <div className="dashboard-header">
          <Row className="align-items-center">
            <Col lg={8}>
              <div className="header-content">
                <h1 className="dashboard-title">
                  <FaGraduationCap className="header-icon" />
                  Learning Dashboard
                </h1>
                <p className="dashboard-subtitle">Manage your classes and track your learning journey</p>

                <div className="stats-container">
                  <div className="stat-card">
                    <div className="stat-icon enrolled">
                      <FaBook />
                    </div>
                    <div className="stat-info">
                      <div className="stat-number">{enrolledClasses.filter(notNil).length}</div>
                      <div className="stat-label">Enrolled Classes</div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon upcoming">
                      <FaRocket />
                    </div>
                    <div className="stat-info">
                      <div className="stat-number">{upcomingClasses.length}</div>
                      <div className="stat-label">Upcoming</div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon completed">
                      <FaCertificate />
                    </div>
                    <div className="stat-info">
                      <div className="stat-number">{completedClasses.length}</div>
                      <div className="stat-label">Completed</div>
                    </div>
                  </div>
                </div>
              </div>
            </Col>

            <Col lg={4}>
              <div className="header-actions">
                <div className="search-box">
                  <FaSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search classes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
              </div>
            </Col>
          </Row>
        </div>

        {/* Main Content */}
        <div className="dashboard-content">
          <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'available')} className="professional-tabs">
            {/* Available Classes Tab */}
            <Tab
              eventKey="available"
              title={
                <span className="tab-title">
                  <FaRegCalendarCheck className="tab-icon" />
                  Available Classes
                  <Badge bg="primary" className="tab-badge">
                    {availableClasses.filter(notNil).length}
                  </Badge>
                </span>
              }>
              <div className="tab-content">
                <div className="section-header">
                  <h2>Upcoming Learning Sessions</h2>
                  <p>Discover and enroll in new learning opportunities tailored for you</p>
                </div>

                {upcomingClasses.length === 0 ? (
                  <div className="empty-state">
                    <FaCalendarAlt size={64} className="empty-icon" />
                    <h3>No Upcoming Classes</h3>
                    <p>Check back later for new learning sessions</p>
                  </div>
                ) : (
                  <Row className="g-4">
                    {pagedUpcoming.map((cls) => {
                      const classLive = isLive(cls)
                      const classUpcoming = !classLive && isUpcoming(cls)

                      return (
                        <Col key={cls._id} xl={4} lg={6} md={6}>
                          <Card className="class-card premium">
                            <Card.Body>
                              <div className="class-header">
                                <div className="class-badges">
                                  <span className={`badge status-badge ${classLive ? 'live' : 'upcoming'}`}>
                                    {classLive ? (
                                      <>
                                        <FaVideo className="me-1" />
                                        LIVE NOW
                                      </>
                                    ) : (
                                      'UPCOMING'
                                    )}
                                  </span>
                                  <span className="badge type-badge">
                                    <FaLaptop className="me-1" />
                                    {(cls.type || 'live').toUpperCase()}
                                  </span>
                                </div>

                                {classUpcoming && (
                                  <div className="countdown">
                                    <FaClock className="me-1" />
                                    Starts in {getTimeUntilClass(cls)}
                                  </div>
                                )}
                              </div>

                              <h3 className="class-title">{cls.title}</h3>

                              <div className="class-meta">
                                <div className="meta-item">
                                  <FaCalendar className="meta-icon" />
                                  <span>{formatDate(cls.date || undefined)}</span>
                                </div>
                                <div className="meta-item">
                                  <FaClock className="meta-icon" />
                                  <span>
                                    {formatTime(cls.startTime)} - {formatTime(cls.endTime)}
                                  </span>
                                </div>
                                <div className="meta-item">
                                  <FaUserTie className="meta-icon" />
                                  <span>{cls.courseId?.instructor || 'Expert Instructor'}</span>
                                </div>
                              </div>

                              <div className="class-description">
                                {cls.courseId?.description || 'Join this interactive learning session to enhance your skills.'}
                              </div>

                              <div className="class-actions">
                                <Button variant="outline-primary" className="action-btn details-btn" onClick={() => showClassDetails(cls)}>
                                  View Details
                                </Button>
                                <Button variant="primary" className="action-btn enroll-btn" onClick={() => handleEnroll(cls._id)}>
                                  Enroll Now
                                  <FaArrowRight className="ms-2" />
                                </Button>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      )
                    })}
                  </Row>
                )}
              </div>
            </Tab>

            {/* Enrolled Classes Tab */}
            <Tab
              eventKey="enrolled"
              title={
                <span className="tab-title">
                  <FaBook className="tab-icon" />
                  My Enrollments
                  <Badge bg="success" className="tab-badge">
                    {enrolledClasses.filter(notNil).length}
                  </Badge>
                </span>
              }>
              <div className="tab-content">
                <div className="section-header">
                  <h2>Your Learning Journey</h2>
                  <p>Track your progress and access your enrolled classes</p>
                </div>

                {enrolledClasses.length === 0 ? (
                  <div className="empty-state">
                    <FaGraduationCap size={64} className="empty-icon" />
                    <h3>No Enrollments Yet</h3>
                    <p>Start your learning journey by enrolling in available classes</p>
                    <Button variant="primary" className="cta-button" onClick={() => setActiveTab('available')}>
                      Browse Classes
                    </Button>
                  </div>
                ) : (
                  <Row className="g-4">
                    {enrolledClasses.filter(notNil).map((cls) => {
                      const classLive = isLive(cls)
                      const classUpcoming = !classLive && isUpcoming(cls)
                      const classCompleted = (() => {
                        const end = safeParseDateTime(cls.date, cls.endTime)
                        return !!end && end < new Date()
                      })()

                      return (
                        <Col key={cls._id} xl={6} lg={6} md={12}>
                          <Card className={`enrollment-card ${classLive ? 'live' : classCompleted ? 'completed' : 'upcoming'}`}>
                            <Card.Body>
                              <div className="enrollment-header">
                                <div className="enrollment-status">
                                  <span className={`badge status-badge ${classLive ? 'live' : classCompleted ? 'completed' : 'upcoming'}`}>
                                    {classLive ? 'LIVE NOW' : classCompleted ? 'COMPLETED' : 'UPCOMING'}
                                  </span>
                                  <span className="enrollment-date">
                                    <FaCalendar className="me-1" />
                                    {formatDate(cls.date || undefined)}
                                  </span>
                                </div>
                                <div className="enrollment-type">
                                  <FaDesktop className="type-icon" />
                                  Online Class
                                </div>
                              </div>

                              <h3 className="enrollment-title">{cls.title}</h3>

                              <div className="enrollment-details">
                                <div className="detail-group">
                                  <div className="detail-item">
                                    <strong>Course:</strong> {cls.courseId?.title || 'Professional Development'}
                                  </div>
                                  <div className="detail-item">
                                    <strong>Time:</strong> {formatTime(cls.startTime)} - {formatTime(cls.endTime)}
                                  </div>
                                  <div className="detail-item">
                                    <strong>Instructor:</strong> {cls.courseId?.instructor || 'Industry Expert'}
                                  </div>
                                </div>
                              </div>

                              <div className="enrollment-actions">
                                <Button
                                  variant={classLive ? 'danger' : 'primary'}
                                  href={cls.meetingLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  disabled={classCompleted && !classLive}
                                  className="join-button">
                                  <FaVideo className="me-2" />
                                  {classLive ? 'Join Live Session' : classCompleted ? 'Session Ended' : 'Join Class'}
                                  <FaExternalLinkAlt className="ms-2" />
                                </Button>
                              </div>

                              {classUpcoming && (
                                <div className="upcoming-notice">
                                  <FaClock className="me-2" />
                                  Session starts in {getTimeUntilClass(cls)}
                                </div>
                              )}
                            </Card.Body>
                          </Card>
                        </Col>
                      )
                    })}
                  </Row>
                  
                )}
                {availTotalPages > 1 && (
  <div className="list-footer">
    <div className="page-size">
      <label>
        Per page:&nbsp;
        <select
          value={availPageSize}
          onChange={(e) => { setAvailPageSize(Number(e.target.value)); setAvailPage(1) }}
        >
          <option value={6}>6</option>
          <option value={9}>9</option>
          <option value={12}>12</option>
        </select>
      </label>
    </div>

    <Pagination className="glass-pagination">
      <Pagination.First onClick={() => setAvailPage(1)} disabled={availPage === 1} />
      <Pagination.Prev onClick={() => setAvailPage(p => Math.max(1, p - 1))} disabled={availPage === 1} />

      {/* compact window of page numbers */}
      {(() => {
        const maxBtns = 5
        const pages = []
        let start = Math.max(1, availPage - Math.floor(maxBtns / 2))
        let end = Math.min(availTotalPages, start + maxBtns - 1)
        start = Math.max(1, end - maxBtns + 1)
        for (let i = start; i <= end; i++) pages.push(i)
        return (
          <>
            {start > 1 && <Pagination.Ellipsis disabled />}
            {pages.map(n => (
              <Pagination.Item key={n} active={n === availPage} onClick={() => setAvailPage(n)}>
                {n}
              </Pagination.Item>
            ))}
            {end < availTotalPages && <Pagination.Ellipsis disabled />}
          </>
        )
      })()}

      <Pagination.Next onClick={() => setAvailPage(p => Math.min(availTotalPages, p + 1))} disabled={availPage === availTotalPages} />
      <Pagination.Last onClick={() => setAvailPage(availTotalPages)} disabled={availPage === availTotalPages} />
    </Pagination>
  </div>
)}

              </div>
            </Tab>
          </Tabs>
        </div>
      </Container>

      {/* Class Details Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered className="professional-modal">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaChalkboardTeacher className="me-2" />
            Class Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedClass && (
            <div className="class-details">
              <div className="class-hero">
                <h3>{selectedClass.title}</h3>
                <span className="badge modal-badge">{isLive(selectedClass) ? 'LIVE' : isUpcoming(selectedClass) ? 'UPCOMING' : 'COMPLETED'}</span>
              </div>

              <div className="details-grid">
                <div className="detail-card">
                  <FaCalendar className="detail-icon" />
                  <div>
                    <label>Date</label>
                    <span>{formatDate(selectedClass.date || undefined)}</span>
                  </div>
                </div>

                <div className="detail-card">
                  <FaClock className="detail-icon" />
                  <div>
                    <label>Time</label>
                    <span>
                      {formatTime(selectedClass.startTime)} - {formatTime(selectedClass.endTime)}
                    </span>
                  </div>
                </div>

                <div className="detail-card">
                  <FaUserTie className="detail-icon" />
                  <div>
                    <label>Instructor</label>
                    <span>{selectedClass.courseId?.instructor || 'Industry Expert'}</span>
                  </div>
                </div>

                <div className="detail-card">
                  <FaGlobe className="detail-icon" />
                  <div>
                    <label>Format</label>
                    <span>Live Online Session</span>
                  </div>
                </div>
              </div>

              {selectedClass.courseId?.description && (
                <div className="description-section">
                  <h5>About This Session</h5>
                  <p>{selectedClass.courseId.description}</p>
                </div>
              )}

              <div className="modal-actions">
                <Button
                  variant="primary"
                  onClick={() => {
                    handleEnroll(selectedClass._id)
                    setShowModal(false)
                  }}
                  disabled={(() => {
                    const end = safeParseDateTime(selectedClass.date, selectedClass.endTime)
                    return !!end && end < new Date()
                  })()}
                  className="enroll-button">
                  Enroll in This Class
                </Button>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* (your styles unchanged) */}
      <style>{`
        /* ===================== GLASS THEME ===================== */
:root{
  --bg-deep-1: #0b1020;
  --bg-deep-2: #0a0f1e;
  --glass-bg: rgba(255,255,255,.06);
  --glass-border: rgba(255,255,255,.18);
  --glass-text: #e5e7eb;
  --glass-muted: #9aa3af;
  --primary-1: #60a5fa;
  --primary-2: #2563eb;
  --success-1: #34d399;
  --success-2: #059669;
}

/* Page background */
.professional-dashboard{
  background:
    radial-gradient(900px 520px at 100% 8%, rgba(59,130,246,.22) 0, rgba(59,130,246,0) 60%),
    radial-gradient(700px 420px at -10% 0%,  rgba(16,185,129,.20) 0, rgba(16,185,129,0) 60%),
    linear-gradient(180deg, var(--bg-deep-1) 0%, var(--bg-deep-2) 100%) !important;
  min-height: 100vh;
  padding: 0;
  color: var(--glass-text);
}

/* ===== Header (glass panel) ===== */
.dashboard-header{
  background: var(--glass-bg) !important;
  color: var(--glass-text);
  padding: 2rem 2rem !important;
  margin: 2rem 2rem 1.5rem !important;
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  backdrop-filter: blur(14px) saturate(140%);
  -webkit-backdrop-filter: blur(14px) saturate(140%);
  box-shadow: 0 18px 50px rgba(2,8,23,.45);
}
.header-content{ max-width: 800px; }
.dashboard-title{
  font-size: 2.5rem; font-weight: 700;color:#fff; margin-bottom: 1rem; display:flex; align-items:center;
}
.header-icon{ margin-right: 1rem; font-size: 2rem; }
.dashboard-subtitle{ font-size: 1.1rem; color: var(--glass-muted); margin-bottom: 2rem; }

/* Stats chips */
.stats-container{ display:flex; gap:1.5rem; margin-top:2rem; flex-wrap:wrap; }
.stat-card{
  display:flex; align-items:center; gap:1rem;
  background: rgba(255,255,255,.06);
  border:1px solid var(--glass-border);
  border-radius:12px;
  padding:1rem 1.5rem;
  backdrop-filter: blur(12px) saturate(140%);
  -webkit-backdrop-filter: blur(12px) saturate(140%);
}
.stat-icon{ width:50px; height:50px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:1.5rem; }
.stat-icon.enrolled{ background: rgba(16,185,129,.18); color:#6ee7b7; }
.stat-icon.upcoming{ background: rgba(251,146,60,.18); color:#fdba74; }
.stat-icon.completed{ background: rgba(59,130,246,.18); color:#93c5fd; }
.stat-number{ font-size:1.5rem; font-weight:700; line-height:1; }
.stat-label{ font-size:.9rem; color:var(--glass-muted); }

/* Search box */
.header-actions{ display:flex; justify-content:flex-end; }
.search-box{ position:relative; width:100%; max-width:400px; }
.search-icon{ position:absolute; left:1rem; top:50%; transform:translateY(-50%); color:#93a2b8; }
.search-input{
  width:100%; padding:.875rem 1rem .875rem 3rem; border:none; border-radius:12px;
  background: rgba(255,255,255,.08) !important; color:#e5e7eb !important;
  border: 1px solid var(--glass-border) !important; box-shadow:none !important;
}
.search-input::placeholder{ color:#9aa3b2; }

/* ===== Tabs container (glass) ===== */
.dashboard-content{ padding: 0 2rem 2rem; }
.professional-tabs{
  background: var(--glass-bg) !important;
  border:1px solid var(--glass-border);
  border-radius: 18px !important;
  backdrop-filter: blur(12px) saturate(140%);
  -webkit-backdrop-filter: blur(12px) saturate(140%);
  box-shadow: 0 16px 40px rgba(2,8,23,.35);
  overflow:hidden;
}
.professional-tabs .nav-link{
  padding:1.25rem 2rem; border:none; font-weight:600;
  color: var(--glass-muted) !important; display:flex; align-items:center; gap:.5rem;
}
.professional-tabs .nav-link.active{
  background: linear-gradient(135deg, rgba(59,130,246,.35), rgba(37,99,235,.35)) !important;
  color:#fff !important; border-radius:999px;
}
.tab-icon{ font-size:1.1rem; }
.tab-badge{ margin-left:.5rem; font-size:.8rem; }
.tab-content{ padding:2rem; }

/* Section header */
.section-header{ text-align:center; margin-bottom:3rem; }
.section-header h2{ font-size:2rem; font-weight:700; color:#f8fafc; margin-bottom:1rem; }
.section-header p{ font-size:1.05rem; color:var(--glass-muted); max-width:600px; margin:0 auto; }

/* ===== Cards (glass panels) ===== */
.class-card,
.class-card.premium,
.enrollment-card{
  background: var(--glass-bg) !important;
  color: var(--glass-text) !important;
  border: 1px solid var(--glass-border) !important;
  backdrop-filter: blur(12px) saturate(140%);
  -webkit-backdrop-filter: blur(12px) saturate(140%);
  box-shadow: 0 18px 50px rgba(2,8,23,.45) !important;
  border-radius:16px; transition: transform .25s ease, box-shadow .25s ease;
}
.class-card:hover, .enrollment-card:hover{
  transform: translateY(-4px);
  box-shadow: 0 22px 60px rgba(5,12,30,.55) !important;
}
.class-card.premium{ border-left: 4px solid rgba(59,130,246,.45) !important; }

.class-header{ display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.5rem; }
.class-badges{ display:flex; gap:.5rem; flex-wrap:wrap; }

.class-title, .enrollment-title{ font-size:1.3rem; font-weight:700; color:#fff !important; margin-bottom:1rem; line-height:1.3; }
.class-meta{ display:flex; flex-direction:column; gap:.8rem; margin-bottom:1.5rem; }
.meta-item{ display:flex; align-items:center; gap:.8rem; color:var(--glass-muted); font-size:.95rem; }
.meta-icon{ color:#93c5fd; width:16px; }
.class-description{ color:var(--glass-muted); line-height:1.6; margin-bottom:2rem; font-size:.95rem; }

/* Buttons */
.action-btn{ flex:1; padding:.75rem 1.25rem; border-radius:12px; font-weight:600; transition: transform .2s ease; }
.action-btn:active{ transform: translateY(1px); }
.action-btn.details-btn{ border:1px solid rgba(96,165,250,.65) !important; color:#bfdbfe !important; background:transparent !important; }
.action-btn.enroll-btn{
  background: linear-gradient(135deg, var(--primary-1) 0%, var(--primary-2) 100%) !important;
  border:none !important;
  box-shadow: 0 10px 28px rgba(37,99,235,.45) !important;
}

.join-button{
  background: linear-gradient(135deg, var(--success-1) 0%, var(--success-2) 100%) !important;
  border:none !important; color:#052e2b !important;
}

/* Badges / chips */
.badge.status-badge,
.badge.type-badge,
.badge.modal-badge{
  padding:.5rem 1rem; border-radius:999px; font-size:.8rem; font-weight:600;
  display:inline-flex; align-items:center; gap:.35rem; border:1px solid transparent;
}
.badge.status-badge.live{       background: rgba(239,68,68,.15);  color:#fecaca;  border-color: rgba(239,68,68,.35); }
.badge.status-badge.upcoming{   background: rgba(251,146,60,.14); color:#fed7aa;  border-color: rgba(251,146,60,.35); }
.badge.status-badge.completed{  background: rgba(34,197,94,.14);  color:#bbf7d0;  border-color: rgba(34,197,94,.35); }
.badge.type-badge{ background: rgba(56,189,248,.14); color:#bae6fd; border-color: rgba(56,189,248,.35); font-size:.72rem; }
.badge.modal-badge{ background: rgba(148,163,184,.16); color:#e5e7eb; border-color: rgba(148,163,184,.35); }

/* Countdown chip */
.countdown{
  background: rgba(251,191,36,.12) !important;
  color:#fde68a !important;
  border:1px solid rgba(251,191,36,.35);
  border-radius:12px; font-weight:600; padding:.4rem .8rem;
}

/* Empty state */
.empty-state{ text-align:center; padding:3rem 2rem; color:var(--glass-muted); }
.empty-icon{ margin-bottom:1rem; opacity:.7; }
.empty-state h3{ margin-bottom:1rem; color:#e5e7eb; }

/* Enrollment specific */
.enrollment-card.live{      border-left: 4px solid rgba(239,68,68,.45) !important; }
.enrollment-card.upcoming{  border-left: 4px solid rgba(251,146,60,.45) !important; }
.enrollment-card.completed{ border-left: 4px solid rgba(34,197,94,.45) !important; }
.enrollment-header{ display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.5rem; }
.enrollment-status{ display:flex; align-items:center; gap:1rem; }
.enrollment-date{ color:var(--glass-muted); font-size:.9rem; }
.enrollment-type{ display:flex; align-items:center; gap:.5rem; color:#93c5fd; font-size:.9rem; font-weight:600; }

/* Modal (glass) */
.professional-modal .modal-content{
  background: var(--glass-bg);
  border:1px solid var(--glass-border);
  border-radius:20px;
  backdrop-filter: blur(14px) saturate(140%);
  -webkit-backdrop-filter: blur(14px) saturate(140%);
  box-shadow: 0 22px 70px rgba(2,8,23,.55);
  color: var(--glass-text);
}
.class-hero{ display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem; }
.class-hero h3{ font-size:1.5rem; font-weight:700; color:#fff; margin:0; }

.details-grid{ display:grid; grid-template-columns: repeat(auto-fit, minmax(200px,1fr)); gap:1rem; margin-bottom:2rem; }
.detail-card{ display:flex; align-items:center; gap:1rem; padding:1rem; background: rgba(255,255,255,.06); border:1px solid var(--glass-border); border-radius:12px; }
.detail-icon{ font-size:1.5rem; color:#93c5fd; }
.detail-card label{ display:block; font-size:.8rem; color:var(--glass-muted); margin-bottom:.2rem; }
.detail-card span{ font-weight:600; color:#e5e7eb; }

.description-section{ margin-bottom:2rem; }
.description-section h5{ color:#fff; margin-bottom:1rem; }
.description-section p{ color:var(--glass-muted); line-height:1.6; }

.modal-actions{ text-align:center; }
.enroll-button{
  padding:.875rem 1.75rem; border-radius:12px; font-weight:600;
  background: linear-gradient(135deg, var(--primary-1) 0%, var(--primary-2) 100%) !important;
  border:none;
}

/* Responsive */
@media (max-width: 768px){
  .dashboard-title{ font-size:2rem; }
  .stats-container{ flex-direction:column; gap:1rem; }
  .class-actions{ flex-direction:column; }
  .details-grid{ grid-template-columns:1fr; }
  .class-header{ flex-direction:column; gap:1rem; }
  .dashboard-header{ margin: 1rem 1rem 1rem !important; }
}

/* Fallback for browsers without backdrop-filter */
@supports not ((backdrop-filter: blur(10px)) or (-webkit-backdrop-filter: blur(10px))){
  .dashboard-header,
  .professional-tabs,
  .class-card,
  .enrollment-card,
  .professional-modal .modal-content{
    background: rgba(17,24,39,.92) !important;
  }
}



      `}</style>
    </>
  )
}

export default StudentDashboard
