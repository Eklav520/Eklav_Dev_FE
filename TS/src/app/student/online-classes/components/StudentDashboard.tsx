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

interface Tutor {
  _id: string
  name: string
  experience?: string
  achievements?: string[]
  bio?: string
  profileImage?: string
}

interface ClassSession {
  _id: string
  title: string
  courseName: string
  startDate?: string | null
  startTime?: string | null

  endTime?: string | null
  meetingLink: string
  description?: string
  createdBy?: Tutor | null

  // ✅ ADD THESE
  cost?: number
  totalSeats?: number
  availableSeats?: number
  days?: string[]
  tags?: string[]
}

interface Props {
  userId: string
}

/* ===================== null-safe helpers & predicates ===================== */

/* ===================== null-safe helpers & predicates ===================== */

const notNil = <T,>(x: T | null | undefined): x is T => x != null

type RowWithTimes = { startDate?: string | null; startTime?: string | null; endTime?: string | null }
type RowWithEnd = { startDate?: string | null; endTime?: string | null }

const hasDateStartEnd = (x: unknown): x is Required<RowWithTimes> => {
  const r = x as any
  return (
    !!r &&
    typeof r.startDate === 'string' &&
    r.startDate.trim() &&
    typeof r.startTime === 'string' &&
    r.startTime.trim() &&
    typeof r.endTime === 'string' &&
    r.endTime.trim()
  )
}

const hasDateEnd = (x: unknown): x is Required<RowWithEnd> => {
  const r = x as any
  return (
    !!r &&
    typeof r.startDate === 'string' &&
    r.startDate.trim() &&
    typeof r.endTime === 'string' &&
    r.endTime.trim()
  )
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
  const start = safeParseDateTime(row.startDate, row.startTime)
  const end = safeParseDateTime(row.startDate, row.endTime)
  if (!start || !end) return false
  const now = new Date()
  return start <= now && now <= end
}

const isUpcoming = (row: unknown): boolean => {
  if (!hasDateStartEnd(row)) return false
  const start = safeParseDateTime(row.startDate, row.startTime)
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
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [selectedPurchaseClass, setSelectedPurchaseClass] = useState<ClassSession | null>(null)
  const [purchasing, setPurchasing] = useState(false)

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
    const start = safeParseDateTime(cls.startDate, cls.startTime)
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

  const loadRazorpayScript = () => {
    return new Promise<boolean>((resolve) => {
      // If already loaded, resolve immediately
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleClassPurchase = async (classId: string) => {
    try {
      setPurchasing(true);

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert("Failed to load payment gateway. Please try again.");
        return;
      }

      // 1️⃣ Create Order
      const res = await fetch(
        `${baseURL}/payment/create-class-order/${classId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error("Failed to create payment order");
      }

      const data = await res.json();

      // 2️⃣ Razorpay Options
      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: "Eklav Learning",
        description: "Online Class Purchase",
        order_id: data.orderId,

        handler: async function (response: any) {
          try {
            const verifyRes = await fetch(
              `${baseURL}/payment/verify-class-payment`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  classId,
                }),
              }
            );

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok || !verifyData.success) {
              throw new Error("Payment verification failed");
            }

            // ✅ Success
            await fetchEnrolledClasses();
            await fetchAvailableClasses();
            setShowPurchaseModal(false);
            setActiveTab("enrolled");

          } catch (verifyError) {
            console.error("Verification error:", verifyError);
            alert("Payment verification failed. Contact support.");
          }
        },

        modal: {
          ondismiss: function () {
            console.log("Payment popup closed");
          },
        },

        theme: {
          color: "#f97316",
        },
      };

      const rzp = new (window as any).Razorpay(options);

      rzp.on("payment.failed", function (response: any) {
        console.error("Payment failed:", response.error);
        alert("Payment failed. Please try again.");
      });

      rzp.open();

    } catch (err) {
      console.error("Class purchase error:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setPurchasing(false);
    }
  };

  const handleEnroll = async (classId: string) => {
    try {
      const res = await fetch(`${baseURL}/student/enroll/${classId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      if (res.ok) {
        fetchEnrolledClasses()
      } else {
        const error = await res.json()
        alert(`Purchase failed: ${error.error}`)
      }
    } catch (err) {
      console.error('Error during purchase:', err)
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
      const t2 = (cls.courseName || '').toLowerCase()
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
          const end = safeParseDateTime(cls.startDate, cls.endTime)
          return !!end && end < new Date()
        }),
    [enrolledClasses],
  )

  return (
    <>
      <Container fluid className="professional-dashboard">
        {/* Header Section */}
        {/* ================= HEADER ================= */}
        <div className="dashboard-header">
          <div className="header-left">
            <FaGraduationCap className="header-icon me-2" />
            <h1 className="dashboard-title mb-0">Learning Dashboard</h1>
          </div>

          <div className="header-center">
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

          <div className="header-right">
            <Tabs
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k || "available")}
              className="professional-tabs"
            >
              <Tab
                eventKey="available"
                title={
                  <span>
                    Available
                    <Badge className="tab-badge">
                      {availableClasses.filter(notNil).length}
                    </Badge>
                  </span>
                }
              />
              <Tab
                eventKey="enrolled"
                title={
                  <span>
                    Enrolled
                    <Badge className="tab-badge">
                      {enrolledClasses.filter(notNil).length}
                    </Badge>
                  </span>
                }
              />
            </Tabs>
          </div>
        </div>

        {/* ================= CONTENT ================= */}
        <div className="dashboard-content">

          {activeTab === "available" && (
            <>
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
                    const alreadyPurchased = enrolledClasses.some(
                      (e) => e._id === cls._id
                    )

                    return (
                      <Col key={cls._id} xl={4} lg={6} md={6}>
                        <Card className="class-card premium">
                          <Card.Body>

                            <div className="class-header">
                              <div className="class-badges">
                                <span className={`badge status-badge ${classLive ? "live" : "upcoming"}`}>
                                  {classLive ? "LIVE NOW" : "UPCOMING"}
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
                                <span>{formatDate(cls.startDate)}</span>
                              </div>
                              <div className="meta-item">
                                <FaClock className="meta-icon" />
                                <span>
                                  {formatTime(cls.startTime)} - {formatTime(cls.endTime)}
                                </span>
                              </div>
                              <div className="meta-item">
                                <FaUserTie className="meta-icon" />
                                <span>{cls.createdBy?.name || "Instructor"}</span>
                              </div>
                            </div>
                            <div className="class-extra-info">
                              {cls.cost && (
                                <div className="info-item">
                                  {cls.cost && (
                                    <div className="price-badge">
                                      ₹ {cls.cost.toLocaleString()}
                                    </div>
                                  )}
                                </div>
                              )}

                              {typeof cls.availableSeats === "number" &&
                                typeof cls.totalSeats === "number" && (
                                  <div className="info-item">
                                    <div className="slots-wrapper">
                                      <div className="slots-text">
                                        🎟 {cls.availableSeats} / {cls.totalSeats} Seats Left
                                      </div>

                                      <div className="slots-progress">
                                        <div
                                          className="slots-fill"
                                          style={{
                                            width: `${((cls.totalSeats - cls.availableSeats) /
                                              cls.totalSeats) *
                                              100
                                              }%`,
                                          }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              {cls.days?.length && (
                                <div className="info-item">
                                  {cls.days?.length && (
                                    <div className="info-item">
                                      📅 {cls.days
                                        .sort(
                                          (a, b) =>
                                            ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].indexOf(a) -
                                            ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].indexOf(b)
                                        )
                                        .join(", ")}
                                    </div>
                                  )}
                                </div>
                              )}

                              {cls.tags?.length && (
                                <div className="tags-container">
                                  {cls.tags.map((tag, index) => (
                                    <span key={index} className="tag-badge">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}

                            </div>

                            <div className="class-actions">
                              <Button
                                variant="outline-primary"
                                className="action-btn details-btn"
                                onClick={() => showClassDetails(cls)}
                              >
                                View Details
                              </Button>
                              {alreadyPurchased ? (
                                <Button
                                  variant="success"
                                  className="action-btn"
                                  disabled
                                >
                                  Purchased
                                </Button>
                              ) : (
                                <Button
                                  variant="primary"
                                  className="action-btn enroll-btn"
                                  onClick={() => {
                                    setSelectedPurchaseClass(cls)
                                    setShowPurchaseModal(true)
                                  }}
                                >
                                  Purchase
                                </Button>
                              )}
                            </div>

                          </Card.Body>
                        </Card>
                      </Col>
                    )
                  })}
                </Row>
              )}
            </>
          )}

          {activeTab === "enrolled" && (
            <>
              {enrolledClasses.length === 0 ? (
                <div className="empty-state">
                  <FaGraduationCap size={64} className="empty-icon" />
                  <h3>No Enrollments Yet</h3>
                  <Button onClick={() => setActiveTab("available")}>
                    Browse Classes
                  </Button>
                </div>
              ) : (
                <Row className="g-4">
                  {enrolledClasses.filter(notNil).map((cls) => {
                    const classLive = isLive(cls)
                    const endDate = safeParseDateTime(cls.startDate, cls.endTime)
                    const classCompleted = endDate ? endDate < new Date() : false

                    return (
                      <Col key={cls._id} xl={6} lg={6} md={12}>
                        <Card className={`enrollment-card ${classLive ? "live" : classCompleted ? "completed" : "upcoming"}`}>
                          <Card.Body>

                            <h3 className="enrollment-title">{cls.title}</h3>

                            <div className="enrollment-details">
                              <div><strong>Course:</strong> {cls.courseName}</div>
                              <div>
                                <strong>Time:</strong> {formatTime(cls.startTime)} - {formatTime(cls.endTime)}
                              </div>
                              <div>
                                <strong>Instructor:</strong> {cls.createdBy?.name}
                              </div>
                            </div>

                            <Button
                              variant={classLive ? "danger" : "primary"}
                              href={cls.meetingLink}
                              target="_blank"
                              disabled={classCompleted && !classLive}
                              className="join-button mt-3"
                            >
                              {classLive ? "Join Live Session" : classCompleted ? "Session Ended" : "Join Class"}
                            </Button>

                          </Card.Body>
                        </Card>
                      </Col>
                    )
                  })}
                </Row>
              )}
            </>
          )}

        </div>

        {/* Main Content */}

      </Container>

      {/* Class Details Modal */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="xl"
        centered
        fullscreen
        className="professional-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaChalkboardTeacher className="me-2" />
            Class Details
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {selectedClass && (() => {
            const alreadyPurchased = enrolledClasses.some(
              (e) => e._id === selectedClass._id
            )

            return (
              <div className="class-modal-layout">

                {/* LEFT SIDE */}
                <div className="modal-left">

                  <div className="class-hero">
                    <h3>{selectedClass.title}</h3>
                    <span className="badge modal-badge">
                      {isLive(selectedClass)
                        ? 'LIVE'
                        : isUpcoming(selectedClass)
                          ? 'UPCOMING'
                          : 'COMPLETED'}
                    </span>
                  </div>

                  <div className="details-grid">
                    <div className="detail-card">
                      <FaCalendar className="detail-icon" />
                      <div>
                        <label>Date</label>
                        <span>{formatDate(selectedClass.startDate || undefined)}</span>
                      </div>
                    </div>

                    <div className="detail-card">
                      <FaClock className="detail-icon" />
                      <div>
                        <label>Time</label>
                        <span>
                          {formatTime(selectedClass.startTime)} -{' '}
                          {formatTime(selectedClass.endTime)}
                        </span>
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

                  {selectedClass.description && (
                    <div className="description-section">
                      <h5>About This Session</h5>
                      <div
                        dangerouslySetInnerHTML={{
                          __html: selectedClass.description || ''
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* RIGHT SIDE – INSTRUCTOR */}
                <div className="modal-right">
                  {selectedClass.createdBy && (
                    <div className="instructor-card">
                      <h5 className="section-title">Instructor</h5>

                      <div className="instructor-profile">
                        <div className="instructor-avatar">
                          {selectedClass.createdBy.profileImage ? (
                            <img
                              src={selectedClass.createdBy.profileImage}
                              alt={selectedClass.createdBy.name}
                            />
                          ) : (
                            <div className="avatar-placeholder">
                              {selectedClass.createdBy.name?.charAt(0)}
                            </div>
                          )}
                        </div>

                        <div className="instructor-info">
                          <h6>{selectedClass.createdBy.name}</h6>

                          {selectedClass.createdBy.experience && (
                            <p className="exp">
                              {selectedClass.createdBy.experience} Experience
                            </p>
                          )}

                          {selectedClass.createdBy.bio && (
                            <p className="bio">
                              {selectedClass.createdBy.bio}
                            </p>
                          )}
                        </div>
                      </div>

                      {selectedClass.createdBy.achievements?.length ? (
                        <ul className="achievements">
                          {selectedClass.createdBy.achievements.map((a, i) => (
                            <li key={i}>{a}</li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  )}

                  {/* Purchase Button */}
                  <div className="modal-actions">
                    {alreadyPurchased ? (
                      <Button variant="success" disabled>
                        Already Purchased
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        onClick={() => {
                          setSelectedPurchaseClass(selectedClass)
                          setShowModal(false)
                          setShowPurchaseModal(true)
                        }}
                      >
                        Purchase This Class
                      </Button>
                    )}
                  </div>
                </div>

              </div>
            )
          })()}
        </Modal.Body>
      </Modal>
      {/* ================= PURCHASE MODAL ================= */}
      <Modal
        show={showPurchaseModal}
        onHide={() => setShowPurchaseModal(false)}
        centered
        className="professional-modal"
      >
        <Modal.Body>
          {selectedPurchaseClass && (
            <div className="purchase-modal-content">

              <h3 className="mb-3">
                Confirm Purchase
              </h3>

              <div className="purchase-info">
                <h5>{selectedPurchaseClass.title}</h5>
                <div className="price-display">
                  ₹ {selectedPurchaseClass.cost?.toLocaleString() || 0}
                </div>
              </div>

              <div className="purchase-actions mt-4">
                <Button
                  variant="outline-light"
                  onClick={() => setShowPurchaseModal(false)}
                  disabled={purchasing}
                >
                  Cancel
                </Button>

                <Button
                  variant="primary"
                  disabled={purchasing}
                  onClick={async () => {
                    if (!selectedPurchaseClass) return
                    try {
                      setPurchasing(true)
                      await handleClassPurchase(selectedPurchaseClass._id)
                      setShowPurchaseModal(false)
                    } finally {
                      setPurchasing(false)
                    }
                  }}
                >
                  {purchasing ? "Processing..." : "Confirm & Purchase"}
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
  --bg-deep-1: #0f172a;
  --bg-deep-2: #0b1220;

  --glass-bg: rgba(255,255,255,.04);
  --glass-border: rgba(255,255,255,.08);

  --text-main: #f1f5f9;
  --text-muted: #94a3b8;

  /* 🔥 ORANGE THEME */
  --accent: #f97316;
  --accent-dark: #ea580c;
  --accent-soft: rgba(249,115,22,.15);
}

/* Page background */
.professional-dashboard{
  background:
    radial-gradient(800px 400px at 90% 10%, rgba(249,115,22,.15), transparent 60%),
    linear-gradient(180deg, #0f172a 0%, #0b1220 100%);
  min-height: 100vh;
  padding: 0;
  color: var(--text-main);
}

/* ===== Header (glass panel) ===== */
.dashboard-header{
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 14px;
  padding: 1rem 2rem;
  margin: 1.5rem;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:2rem;
}

.header-left{
  display:flex;
  align-items:center;
  gap:.75rem;
  flex:1;
}

.header-center{
  flex:1;
  display:flex;
  justify-content:center;
}

.header-right{
  flex:1;
  display:flex;
  justify-content:flex-end;
}

.dashboard-title{
  font-size:1.5rem;
  font-weight:600;
  white-space:nowrap;
}
.header-content{ max-width: 800px; }
.dashboard-title{
  font-size: 1.8rem;
  margin-bottom: .5rem;
}
.header-icon{ margin-right: 1rem; font-size: 2rem; }
.dashboard-subtitle{
  margin-bottom: 1rem;
  font-size: .95rem;
}

/* Stats chips */
.stats-container{ display:flex; gap:1.5rem; margin-top:2rem; flex-wrap:wrap; }
.stat-card{
  display:flex; align-items:center; gap:1rem;
  background: rgba(255,255,255,.06);
  border:1px solid var(--glass-border);
  border-radius:12px;
  padding: .7rem 1rem;
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
.dashboard-content{
  padding: 0 1.5rem 2rem;
  margin-top: 1rem;   /* 🔥 add this */
}
.professional-tabs{
  background: rgba(255,255,255,.04);
  padding: 4px;
  border-radius: 999px;
  display: inline-flex !important;
  align-items: center;
  gap: 4px;

  /* IMPORTANT FIX */
  overflow: hidden;
}

.professional-tabs .nav-item{
  margin: 0 !important;
}

.professional-tabs .nav-link{
  border: none !important;
  border-radius: 999px !important;
  padding: .45rem 1.1rem !important;
  font-size: .9rem;
  color: var(--text-muted) !important;
  background: transparent !important;
  transition: all .2s ease;
}

.professional-tabs .nav-link.active{
  background: var(--accent) !important;
  color: #fff !important;
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
  width: 100%;   /* 🔥 make card fill column */
  background: var(--glass-bg) !important;
  border: 1px solid var(--glass-border) !important;
  backdrop-filter: blur(12px) saturate(140%);
  border-radius:16px;
  box-shadow: 0 18px 50px rgba(2,8,23,.45) !important;
  transition: transform .25s ease, box-shadow .25s ease;
}

.class-card .card-body{
  padding: 1.5rem 1.5rem;  /* reduced */
}

.class-card:hover, .enrollment-card:hover{
  transform: translateY(-4px);
  box-shadow: 0 22px 60px rgba(5,12,30,.55) !important;
}
.class-card.premium{
  border-left: 4px solid var(--accent);
}

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
.action-btn.details-btn{
  border:1px solid var(--accent) !important;
  color: var(--accent) !important;
  background: transparent !important;
}

.action-btn.details-btn:hover{
  background: var(--accent-soft) !important;
}

.action-btn.enroll-btn,
.enroll-button,
.join-button{
  background: var(--accent) !important;
  border:none !important;
  color:#fff !important;
}

.action-btn.enroll-btn:hover,
.enroll-button:hover,
.join-button:hover{
  background: var(--accent-dark) !important;
}
.join-button{
  background: var(--accent) !important;
  border: 1px solid var(--accent-dark) !important;
  color: #fff !important;
}

/* Badges / chips */
.badge.status-badge,
.badge.type-badge,
.badge.modal-badge{
  padding:.5rem 1rem; border-radius:999px; font-size:.8rem; font-weight:600;
  display:inline-flex; align-items:center; gap:.35rem; border:1px solid transparent;
}
.badge.status-badge.live{       background: rgba(239,68,68,.15);  color:#fecaca;  border-color: rgba(239,68,68,.35); }
.badge.status-badge.upcoming{
  background: var(--accent-soft);
  color: var(--accent);
  border:1px solid var(--accent);
}
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
  padding:.875rem 1.75rem;
  border-radius:12px;
  font-weight:600;
  background: var(--accent) !important;
  border: 1px solid var(--accent-dark) !important;  /* ✅ add border */
  color: #fff !important;
}

.class-actions{
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

/* Responsive */
@media (max-width: 768px){
  .dashboard-title{ font-size:2rem; }
  .stats-container{ flex-direction:column; gap:1rem; }
  .class-actions{
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}
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

.dashboard-header.compact{
  padding: 1rem 1.5rem !important;
  margin: 1rem 1.5rem !important;
  border-radius: 14px;
}

.header-tabs-nav .nav-link{
  padding: .5rem 1rem !important;
  font-size: .9rem;
  border-radius: 999px !important;
}

.header-tabs-nav .nav-link.active{
  background: linear-gradient(135deg, rgba(59,130,246,.4), rgba(37,99,235,.4)) !important;
  color: #fff !important;
}

.header-left{
  display:flex;
  align-items:center;
}

.dashboard-title{
  font-size:1.6rem;
  margin-bottom:0;
}

/* Modal Layout */
.class-modal-layout{
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
}

.modal-left{
  padding-right: 1rem;
}

.modal-right{
  background: rgba(255,255,255,.05);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  padding: 1.5rem;
  height: fit-content;
}

.section-title{
  margin-bottom: 1rem;
  color: #fff;
}

/* Instructor */
.instructor-profile{
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.instructor-avatar img{
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--accent);
}

.avatar-placeholder{
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--accent-soft);
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  font-weight: bold;
}

.instructor-info h6{
  font-size: 1.1rem;
  font-weight: 700;
  color: #fff;
}

.exp{
  color: var(--accent);
  font-weight: 600;
  margin: .3rem 0;
}

.bio{
  color: var(--text-muted);
  font-size: .9rem;
}

.achievements{
  margin-top: 1rem;
  padding-left: 1rem;
  color: var(--text-muted);
}

.modal-actions{
  margin-top: 2rem;
}

/* Responsive */
@media (max-width: 992px){
  .class-modal-layout{
    grid-template-columns: 1fr;
  }
}

.class-extra-info{
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: .5rem;
}

.info-item{
  font-size: .9rem;
  color: var(--text-muted);
}

.tags-container{
  display: flex;
  flex-wrap: wrap;
  gap: .5rem;
  margin-top: .5rem;
}

.tag-badge{
  background: var(--accent-soft);
  color: var(--accent);
  padding: .3rem .7rem;
  border-radius: 999px;
  font-size: .75rem;
  border: 1px solid var(--accent);
}

.price-badge{
  display:inline-block;
  background: rgba(34,197,94,.15);
  color:#86efac;
  padding:.4rem .8rem;
  border-radius:12px;
  font-weight:700;
  font-size:.9rem;
  border:1px solid rgba(34,197,94,.4);
}

.slots-wrapper{
  display:flex;
  flex-direction:column;
  gap:.3rem;
}

.slots-text{
  font-size:.85rem;
  color:#fde68a;
  font-weight:600;
}

.slots-progress{
  height:6px;
  background: rgba(255,255,255,.08);
  border-radius:999px;
  overflow:hidden;
}

.slots-fill{
  height:100%;
  background: linear-gradient(90deg, #f97316, #ea580c);
}

.purchase-modal-content{
  text-align:center;
  padding:1.5rem;
}

.purchase-info{
  background: rgba(255,255,255,.05);
  border:1px solid var(--glass-border);
  border-radius:16px;
  padding:1.5rem;
}

.price-display{
  font-size:2rem;
  font-weight:700;
  color:#86efac;
  margin-top:.5rem;
}

.purchase-actions{
  display:flex;
  justify-content:center;
  gap:1rem;
}



      `}</style>
    </>
  )
}

export default StudentDashboard
