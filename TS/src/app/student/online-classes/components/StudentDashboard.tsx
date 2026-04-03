import { useAuthContext } from '@/context/useAuthContext'
import React, { useEffect, useState, useMemo } from 'react'
import { Card, Button, Container, Row, Col, Badge, Modal, Tabs, Tab, Form } from 'react-bootstrap'
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
  FaComment,
  FaPaperPlane,
  FaUserCircle,
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

interface Instructor {
  designation: string
  id: string
  name: string
  email?: string
  aboutMe?: string
  experience?: string
  skills?: string[]
  profileImage?: string
  department?: string
}

interface Comment {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  text: string
  rating: number
  createdAt: string
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
  instructor?: Instructor | null
  designation?: string
  cost?: number
  totalSeats?: number
  availableSeats?: number
  days?: string[]
  tags?: string[]
  purchaseLastDate?: string | null
  comments?: Comment[]
}

/* interface Props {
  userId: string
} */

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

const isPurchaseClosed = (purchaseLastDate?: string | null) => {
  if (!purchaseLastDate) return false

  const normalized = normalizeDate(purchaseLastDate)
  if (!normalized) return false

  const lastDate = new Date(normalized + "T23:59:59")
  return new Date() > lastDate
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

const StudentDashboard: React.FC = () => {
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
  const [availPageSize, setAvailPageSize] = useState(6) // Reduced from 9 for mobile
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [selectedPurchaseClass, setSelectedPurchaseClass] = useState<ClassSession | null>(null)
  const [purchasing, setPurchasing] = useState(false)

  // Comment state
  const [commentText, setCommentText] = useState('')
  const [comments, setComments] = useState<Comment[]>([])
  const [submittingComment, setSubmittingComment] = useState(false)

  // Enrolled tab pagination (optional)
  const [enrPage, setEnrPage] = useState(1)
  const [enrPageSize, setEnrPageSize] = useState(4) // Reduced from 6 for mobile
  const [imgError, setImgError] = useState(false);
  const [rating, setRating] = useState<number>(0)
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'upcoming' | 'completed'>('all')

  useEffect(() => {
    fetchAvailableClasses()
    fetchEnrolledClasses()
  }, [])

  const hasUserCommented = useMemo(() => {
    if (!user) return false
    return comments.some(
      c => String(c.userId) === String(user?.id)
    )
  }, [comments, user])

  const averageRating = useMemo(() => {
    if (!comments.length) return 0
    const total = comments.reduce((sum, c) => sum + c.rating, 0)
    return (total / comments.length).toFixed(1)
  }, [comments])

  const fetchAvailableClasses = async () => {
    try {
      const res = await fetch(`${baseURL}/student/classes`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
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

  const fetchClassComments = async (classId: string) => {
    try {
      const res = await fetch(`${baseURL}/classes/${classId}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        const mapped = (Array.isArray(data) ? data : []).map((c: any) => ({
          id: c._id,
          userId: String(c.userId),
          userName: c.user?.fullName || "Student",
          userAvatar: c.user?.profileImage || "",
          text: c.comment,
          rating: c.rating || 0,
          createdAt: c.createdAt,
        }))

        setComments(mapped)
      }
    } catch (err) {
      console.error('Error fetching comments:', err)
    }
  }

  const handleJoinClass = async (classId: string) => {
    try {
      const res = await fetch(`${baseURL}/student/join-class/${classId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Not authorized to join this class");
        return;
      }

      window.open(data.meetingLink, "_blank");

    } catch (err) {
      console.error("Join class error:", err);
    }
  };

  const handleSubmitComment = async () => {
    if (!selectedClass) return

    const trimmedComment = commentText.trim()

    if (!trimmedComment) {
      alert("Please enter your feedback.")
      return
    }

    if (rating === 0) {
      alert("Please select a rating.")
      return
    }

    setSubmittingComment(true)

    try {
      const res = await fetch(
        `${baseURL}/classes/${selectedClass._id}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            comment: trimmedComment,
            rating: rating,
          }),
        }
      )

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || "Failed to submit feedback.")
        return
      }

      const mappedComment: Comment = {
        id: data._id,
        userId: String(data.userId),
        userName: user?.fullName || "You",
        userAvatar: "",
        text: data.comment,
        rating: data.rating,
        createdAt: data.createdAt,
      }

      setComments((prev) => [mappedComment, ...prev])

      // Reset form
      setCommentText("")
      setRating(0)

    } catch (err) {
      console.error("Error posting feedback:", err)
      alert("Something went wrong. Please try again.")
    } finally {
      setSubmittingComment(false)
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

  const formatCommentDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
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
    setComments(cls.comments || [])
    setCommentText("")
    setRating(0) // 🔥 reset rating
    setShowModal(true)

    if (cls._id) {
      fetchClassComments(cls._id)
    }
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

  // ✅ PLACE HERE (top of component)
  const getClassStatus = (cls: any) => {
    const live = isLive(cls)
    const upcoming = isUpcoming(cls)

    if (live) return "live"
    if (upcoming) return "upcoming"

    return "completed"
  }

  // 👇 THEN your useMemo
  const upcomingClasses = useMemo(() => {
    let data = (filteredAvailableClasses ?? []).filter(notNil)

    if (statusFilter === "all") return data

    return data.filter((cls) => getClassStatus(cls) === statusFilter)
  }, [filteredAvailableClasses, statusFilter])

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
      <Container fluid className="professional-dashboard px-2 px-md-3">
        {/* Header Section */}
        <div className="dashboard-header">
          <div className="header-left">
            <FaGraduationCap className="header-icon me-2" />
            <h1 className="dashboard-title mb-0">Learn With Industry Experts</h1>
          </div>
          <div className="status-filter d-flex gap-2 flex-wrap mt-2">
            {["all", "live", "upcoming", "completed"].map((type) => (
              <Button
                key={type}
                size="sm"
                variant={statusFilter === type ? "primary" : "outline-secondary"}
                onClick={() => setStatusFilter(type as any)}
                className="text-capitalize"
              >
                {type}
              </Button>
            ))}
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
                <Row className="g-3 g-md-4">
                  {pagedUpcoming.map((cls) => {
                    const purchaseClosed = isPurchaseClosed(cls.purchaseLastDate)
                    const status = getClassStatus(cls)   // ✅ ADD THIS
                    const alreadyPurchased = enrolledClasses.some(
                      (e) => e._id === cls._id
                    )

                    return (
                      <Col key={cls._id} lg={4} md={6} xs={12}>
                        <Card className="class-card premium">
                          <Card.Body>
                            <div className="class-header">
                              <div className="class-badges">
                                <span
                                  className={`badge status-badge ${purchaseClosed ? "completed" : status
                                    }`}
                                >
                                  {purchaseClosed
                                    ? "DATE CLOSED"
                                    : status === "live"
                                      ? "LIVE NOW"
                                      : status === "upcoming"
                                        ? "UPCOMING"
                                        : "COMPLETED"}
                                </span>
                              </div>

                              {status === "upcoming" && (
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
                                <span>{cls.instructor?.name || "Instructor"}</span>
                              </div>
                            </div>

                            <div className="class-extra-info">
                              {cls.cost && (
                                <div className="info-item">
                                  <div className="price-badge">
                                    ₹ {cls.cost.toLocaleString()}
                                  </div>
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
                              {(cls.days?.length ?? 0) > 0 && (
                                <div className="info-item">
                                  📅 {cls.days!
                                    .sort(
                                      (a, b) =>
                                        ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].indexOf(a) -
                                        ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].indexOf(b)
                                    )
                                    .join(", ")}
                                </div>
                              )}
                              {(cls.tags?.length ?? 0) > 0 && (
                                <div className="tags-container">
                                  {cls.tags!.map((tag, index) => (
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
                                <Button className="action-btn btn-orange" disabled>
                                  Purchased
                                </Button>
                              ) : purchaseClosed ? (
                                <Button className="action-btn btn-disabled" disabled>
                                  Date Closed
                                </Button>
                              ) : status === "completed" ? (
                                <Button className="action-btn btn-disabled" disabled>
                                  Completed
                                </Button>
                              ) : (
                                <Button
                                  className="action-btn btn-orange"
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

              {/* Pagination for Available Classes */}
              {availTotalPages > 1 && (
                <div className="pagination-container mt-4">
                  <Button
                    variant="outline-secondary"
                    onClick={() => setAvailPage(p => Math.max(1, p - 1))}
                    disabled={availPage === 1}
                    className="pagination-btn"
                  >
                    Previous
                  </Button>
                  <span className="pagination-info">
                    Page {availPage} of {availTotalPages}
                  </span>
                  <Button
                    variant="outline-secondary"
                    onClick={() => setAvailPage(p => Math.min(availTotalPages, p + 1))}
                    disabled={availPage === availTotalPages}
                    className="pagination-btn"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}

          {activeTab === "enrolled" && (
            <>
              {enrolledClasses.length === 0 ? (
                <div className="empty-state">
                  <FaGraduationCap size={64} className="empty-icon" />
                  <h3>No Enrollments Yet</h3>
                  <Button onClick={() => setActiveTab("available")} className="btn-orange">
                    Browse Classes
                  </Button>
                </div>
              ) : (
                <Row className="g-3 g-md-4">
                  {pagedEnrolled.filter(notNil).map((cls) => {
                    const status = getClassStatus(cls)   // ✅ ADD THIS

                    return (
                      <Col key={cls._id} lg={6} md={6} xs={12}>
                        <Card className={`enrollment-card ${status}`}>
                          <Card.Body>

                            <h3 className="enrollment-title">{cls.title}</h3>

                            <div className="enrollment-details">
                              <div className="detail-item">
                                <strong>Course:</strong> {cls.courseName}
                              </div>
                              <div className="detail-item">
                                <strong>Time:</strong> {formatTime(cls.startTime)} - {formatTime(cls.endTime)}
                              </div>
                            </div>

                            <Button
                              onClick={() => handleJoinClass(cls._id)}
                              className="join-button btn-orange mt-3 w-100"
                            >
                              {status === 'live' ? "Join Live Session" : "Join Class"}
                            </Button>

                          </Card.Body>
                        </Card>
                      </Col>
                    )
                  })}
                </Row>
              )}

              {/* Pagination for Enrolled Classes */}
              {enrTotalPages > 1 && (
                <div className="pagination-container mt-4">
                  <Button
                    variant="outline-secondary"
                    onClick={() => setEnrPage(p => Math.max(1, p - 1))}
                    disabled={enrPage === 1}
                    className="pagination-btn"
                  >
                    Previous
                  </Button>
                  <span className="pagination-info">
                    Page {enrPage} of {enrTotalPages}
                  </span>
                  <Button
                    variant="outline-secondary"
                    onClick={() => setEnrPage(p => Math.min(enrTotalPages, p + 1))}
                    disabled={enrPage === enrTotalPages}
                    className="pagination-btn"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}

        </div>
      </Container>

      {/* Class Details Modal */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        className="professional-modal"
        dialogClassName="modal-fullscreen-custom modal-dialog-scrollable"
        fullscreen="lg-down"
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
              <>
                <div className="class-modal-layout">

                  {/* LEFT SIDE - Class Info */}
                  <div className="modal-left">
                    <div className="class-hero">
                      <h3 className="modal-class-title">{selectedClass.title}</h3>
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

                    {/* About This Session */}
                    <div className="description-section">
                      <h5>
                        <FaBook className="me-2" />
                        About This Session
                      </h5>
                      {selectedClass.description ? (
                        <div
                          dangerouslySetInnerHTML={{
                            __html: selectedClass.description
                          }}
                        />
                      ) : (
                        <div className="description-placeholder">
                          <p className="text-muted mb-0">No description available for this session.</p>
                        </div>
                      )}
                    </div>

                    {/* Purchase button for mobile view */}
                    <div className="modal-actions-mobile mt-4">
                      {alreadyPurchased ? (
                        <Button className="btn-orange w-100" disabled>
                          Already Purchased
                        </Button>
                      ) : (
                        <Button
                          className="btn-orange w-100"
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

                  {/* RIGHT SIDE - Instructor Info */}
                  <div className="modal-right">
                    <h5 className="section-title">
                      <FaUserTie className="me-2" />
                      Instructor Details
                    </h5>

                    {selectedClass.instructor ? (
                      <div className="instructor-card professional">
                        {/* Profile Header */}
                        <div className="instructor-header">
                          <div className="instructor-avatar">
                            {selectedClass.instructor.profileImage && !imgError ? (
                              <img
                                src={selectedClass.instructor.profileImage}
                                alt={selectedClass.instructor.name}
                                onError={() => setImgError(true)}
                              />
                            ) : (
                              <div className="avatar-placeholder">
                                {selectedClass.instructor.name?.charAt(0)?.toUpperCase() || "I"}
                              </div>
                            )}
                          </div>

                          <div className="instructor-main">
                            <h4 className="instructor-name">
                              {selectedClass.instructor.name}
                            </h4>

                            {selectedClass.instructor.email && (
                              <div className="instructor-email">
                                {selectedClass.instructor.email}
                              </div>
                            )}

                            {/* Rating */}
                            <div className="rating-row">
                              <span className="label">Rating :</span>
                              <div className="stars">
                                ⭐⭐⭐⭐☆
                                <span className="rating-value">(4.5)</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Designation */}
                        {selectedClass.instructor.designation && (
                          <div className="info-block">
                            <span className="label">Designation :</span>
                            <span className="value">
                              {selectedClass.instructor.designation}
                            </span>
                          </div>
                        )}

                        {/* Experience */}
                        {selectedClass.instructor.experience && (
                          <div className="info-block">
                            <span className="label">Experience :</span>
                            <span className="value highlight">
                              {selectedClass.instructor.experience}
                            </span>
                          </div>
                        )}

                        {/* Bio */}
                        {selectedClass.instructor.aboutMe && (
                          <div className="info-block">
                            <span className="label">Bio :</span>
                            <p className="bio-text">
                              {selectedClass.instructor.aboutMe}
                            </p>
                          </div>
                        )}

                        {/* Skills */}
                        {selectedClass.instructor.skills?.length ? (
                          <div className="info-block">
                            <span className="label">Skills :</span>
                            <div className="skills-container">
                              {selectedClass.instructor.skills.map((skill, i) => (
                                <span key={i} className="skill-badge">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="instructor-card professional">
                        <p className="text-muted text-center py-4">
                          <FaUserCircle size={48} className="mb-3 opacity-50" />
                          <br />
                          No instructor information available
                        </p>
                      </div>
                    )}

                    {/* Purchase button for desktop view */}
                    <div className="modal-actions mt-4">
                      {alreadyPurchased ? (
                        <Button className="btn-orange w-100" disabled>
                          Already Purchased
                        </Button>
                      ) : (
                        <Button
                          className="btn-orange w-100"
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

                {/* Comments Section */}
                <div className="comments-section">
                  <h5 className="comments-title">
                    <FaComment className="me-2" />
                    Feedback ({comments.length}) {comments.length > 0 && (
                      <span className="ms-2 text-warning">
                        ⭐ {averageRating}
                      </span>
                    )}
                  </h5>

                  {/* Comment Input */}
                  {hasUserCommented ? (
                    <div className="already-commented text-center py-3">
                      <p className="text-muted mb-0">
                        You have already submitted feedback for this class.
                      </p>
                    </div>
                  ) : (
                    <div className="comment-input-wrapper">
                      <div className="comment-avatar">
                        <FaUserCircle size={36} />
                      </div>

                      <div className="comment-input-container">
                        <Form.Control
                          as="textarea"
                          rows={2}
                          placeholder="Share your feedback about this session..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          className="comment-textarea"
                        />

                        {/* ⭐ Rating Input */}
                        <div className="rating-input">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <FaStar
                              key={star}
                              size={18}
                              onClick={() => setRating(star)}
                              style={{
                                cursor: "pointer",
                                color: star <= rating ? "#facc15" : "#334155",
                                transition: "transform 0.15s ease"
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "scale(1.2)"
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "scale(1)"
                              }}
                            />
                          ))}
                        </div>

                        <Button
                          className="comment-submit-btn"
                          onClick={handleSubmitComment}
                          disabled={!commentText.trim() || rating === 0 || submittingComment}
                        >
                          <FaPaperPlane className="me-2" />
                          {submittingComment ? "Posting..." : "Submit Feedback"}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Comments List */}
                  <div className="comments-list scrollable-feedback">
                    {comments.length === 0 ? (
                      <div className="no-comments">
                        <p>No feedback yet. Be the first to rate this session!</p>
                      </div>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.id} className="comment-item">
                          <div className="comment-avatar">
                            {comment.userAvatar ? (
                              <img src={comment.userAvatar} alt={comment.userName} />
                            ) : (
                              <FaUserCircle size={32} />
                            )}
                          </div>
                          <div className="comment-content">
                            <div className="comment-header">
                              <span className="comment-author">{comment.userName}</span>
                              <span className="comment-time">
                                {formatCommentDate(comment.createdAt)}
                              </span>
                            </div>
                            <div className="comment-rating">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <FaStar
                                  key={star}
                                  size={12}
                                  style={{
                                    color: star <= comment.rating ? "#facc15" : "#334155",
                                    marginRight: "2px"
                                  }}
                                />
                              ))}
                            </div>
                            <p className="comment-text">{comment.text}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )
          })()}
        </Modal.Body>
      </Modal>

      {/* ================= PURCHASE MODAL ================= */}
      <Modal
        show={showPurchaseModal}
        onHide={() => setShowPurchaseModal(false)}
        className="purchase-modal"
        centered
        size="sm"
      >
        <Modal.Body>
          {selectedPurchaseClass && (
            <div className="purchase-modal-content">

              <h4 className="mb-3">Confirm Purchase</h4>

              <div className="purchase-info">
                <h5 className="purchase-class-title">{selectedPurchaseClass.title}</h5>
                <div className="price-display">
                  ₹ {selectedPurchaseClass.cost?.toLocaleString() || 0}
                </div>
              </div>

              <div className="purchase-actions mt-4">
                <Button
                  variant="outline-light"
                  onClick={() => setShowPurchaseModal(false)}
                  disabled={purchasing}
                  className="flex-grow-1"
                >
                  Cancel
                </Button>

                <Button
                  className={`btn-orange flex-grow-1 ${purchasing ? "btn-disabled" : ""}`}
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
                  {purchasing ? "Processing..." : "Confirm"}
                </Button>
              </div>

            </div>
          )}
        </Modal.Body>
      </Modal>

      <style>{`
        /* ===================== GLASS THEME ===================== */
        :root {
          --bg-deep-1: #0f172a;
          --bg-deep-2: #0b1220;
          --glass-bg: rgba(255,255,255,.04);
          --glass-border: rgba(255,255,255,.08);
          --text-main: #f1f5f9;
          --text-muted: #94a3b8;
          --accent: #f97316;
          --accent-dark: #ea580c;
          --accent-soft: rgba(249,115,22,.15);
        }

        /* Page background */
        .professional-dashboard {
          background: radial-gradient(800px 400px at 90% 10%, rgba(249,115,22,.15), transparent 60%),
                      linear-gradient(180deg, #0f172a 0%, #0b1220 100%);
          min-height: 100vh;
          padding: 0;
          color: var(--text-main);
        }

        /* ===== Header (glass panel) ===== */
        .dashboard-header {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 14px;
          padding: 1rem;
          margin: 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        @media (min-width: 768px) {
          .dashboard-header {
            flex-direction: row;
            padding: 1rem 2rem;
            margin: 1.5rem;
          }
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: .75rem;
          width: 100%;
          justify-content: center;
        }

        @media (min-width: 768px) {
          .header-left {
            width: auto;
            justify-content: flex-start;
          }
        }

        .header-center {
          width: 100%;
          display: flex;
          justify-content: center;
        }

        @media (min-width: 768px) {
          .header-center {
            width: auto;
          }
        }

        .header-right {
          width: 100%;
          display: flex;
          justify-content: center;
        }

        @media (min-width: 768px) {
          .header-right {
            width: auto;
            justify-content: flex-end;
          }
        }

        .dashboard-title {
          font-size: clamp(1.2rem, 4vw, 1.5rem);
          font-weight: 600;
          white-space: normal;
          text-align: center;
        }

        @media (min-width: 768px) {
          .dashboard-title {
            white-space: nowrap;
          }
        }

        .header-icon {
          font-size: clamp(1.5rem, 4vw, 2rem);
          flex-shrink: 0;
        }

        /* Search box */
        .search-box {
          position: relative;
          width: 100%;
          max-width: 100%;
        }

        @media (min-width: 768px) {
          .search-box {
            max-width: 400px;
          }
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #93a2b8;
          font-size: 0.9rem;
        }

        .search-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.5rem;
          border: none;
          border-radius: 30px;
          background: rgba(255,255,255,.08) !important;
          color: #e5e7eb !important;
          border: 1px solid var(--glass-border) !important;
          box-shadow: none !important;
          font-size: 0.9rem;
        }

        .search-input::placeholder {
          color: #9aa3b2;
          font-size: 0.85rem;
        }

        /* ===== Tabs container (glass) ===== */
        .dashboard-content {
          padding: 0 1rem 2rem;
          margin-top: 1rem;
        }

        .professional-tabs {
          background: rgba(255,255,255,.04);
          padding: 4px;
          border-radius: 40px;
          display: inline-flex !important;
          align-items: center;
          gap: 4px;
          overflow: hidden;
          width: 100%;
          justify-content: center;
        }

        @media (min-width: 768px) {
          .professional-tabs {
            width: auto;
          }
        }

        .professional-tabs .nav-item {
          margin: 0 !important;
          flex: 1;
        }

        @media (min-width: 768px) {
          .professional-tabs .nav-item {
            flex: 0 1 auto;
          }
        }

        .professional-tabs .nav-link {
          border: none !important;
          border-radius: 40px !important;
          padding: 0.5rem 1rem !important;
          font-size: 0.85rem;
          color: var(--text-muted) !important;
          background: transparent !important;
          transition: all .2s ease;
          text-align: center;
          width: 100%;
        }

        .professional-tabs .nav-link.active {
          background: var(--accent) !important;
          color: #fff !important;
        }

        .tab-badge {
          margin-left: 0.25rem;
          font-size: 0.7rem;
          background: rgba(255,255,255,.2);
          padding: 0.2rem 0.4rem;
        }

        /* ===== Cards (glass panels) ===== */
        .class-card,
        .class-card.premium,
        .enrollment-card {
          width: 100%;
          background: var(--glass-bg) !important;
          border: 1px solid var(--glass-border) !important;
          backdrop-filter: blur(12px) saturate(140%);
          -webkit-backdrop-filter: blur(12px) saturate(140%);
          border-radius: 16px;
          box-shadow: 0 18px 50px rgba(2,8,23,.45) !important;
          transition: transform .25s ease, box-shadow .25s ease;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .class-card .card-body {
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .class-card:hover,
        .enrollment-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 22px 60px rgba(5,12,30,.55) !important;
        }

        .class-card.premium {
          border-left: 4px solid var(--accent);
        }

        .class-header {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        @media (min-width: 576px) {
          .class-header {
            flex-direction: row;
            justify-content: space-between;
            align-items: flex-start;
          }
        }

        .class-badges {
          display: flex;
          gap: .5rem;
          flex-wrap: wrap;
        }

        .class-title,
        .enrollment-title {
          font-size: clamp(1.1rem, 4vw, 1.3rem);
          font-weight: 700;
          color: #fff !important;
          margin-bottom: 1rem;
          line-height: 1.3;
          word-break: break-word;
        }

        .class-meta {
          display: flex;
          flex-direction: column;
          gap: .8rem;
          margin-bottom: 1.5rem;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: .8rem;
          color: var(--text-muted);
          font-size: 0.9rem;
          flex-wrap: wrap;
        }

        .meta-icon {
          color: #93c5fd;
          width: 16px;
          flex-shrink: 0;
        }

        /* Badges / chips */
        .badge.status-badge,
        .badge.modal-badge {
          padding: 0.4rem 0.75rem;
          border-radius: 999px;
          font-size: 0.7rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: .35rem;
          border: 1px solid transparent;
          white-space: nowrap;
        }

        @media (min-width: 768px) {
          .badge.status-badge,
          .badge.modal-badge {
            font-size: 0.8rem;
            padding: .5rem 1rem;
          }
        }

        .badge.status-badge.live {
          background: rgba(239,68,68,.15);
          color: #fecaca;
          border-color: rgba(239,68,68,.35);
        }

        .badge.status-badge.upcoming {
          background: var(--accent-soft);
          color: var(--accent);
          border: 1px solid var(--accent);
        }

        .badge.status-badge.completed {
          background: rgba(34,197,94,.14);
          color: #bbf7d0;
          border-color: rgba(34,197,94,.35);
        }

        .badge.modal-badge {
          background: rgba(148,163,184,.16);
          color: #e5e7eb;
          border-color: rgba(148,163,184,.35);
        }

        /* Countdown chip */
        .countdown {
          background: rgba(251,191,36,.12) !important;
          color: #fde68a !important;
          border: 1px solid rgba(251,191,36,.35);
          border-radius: 30px;
          font-weight: 600;
          padding: 0.3rem 0.6rem;
          font-size: 0.8rem;
          display: inline-flex;
          align-items: center;
          width: fit-content;
        }

        /* Empty state */
        .empty-state {
          text-align: center;
          padding: 2rem 1rem;
          color: var(--text-muted);
        }

        .empty-icon {
          margin-bottom: 1rem;
          opacity: .7;
        }

        .empty-state h3 {
          margin-bottom: 1rem;
          color: #e5e7eb;
          font-size: 1.2rem;
        }

        .empty-state p {
          font-size: 0.9rem;
        }

        /* Enrollment specific */
        .enrollment-card.live {
          border-left: 4px solid rgba(239,68,68,.45) !important;
        }

        .enrollment-card.upcoming {
          border-left: 4px solid rgba(251,146,60,.45) !important;
        }

        .enrollment-card.completed {
          border-left: 4px solid rgba(34,197,94,.45) !important;
        }

        .enrollment-details {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          font-size: 0.9rem;
          color: var(--text-muted);
        }

        .enrollment-details .detail-item {
          word-break: break-word;
        }

        /* Class actions */
        .class-actions {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-top: auto;
        }

        @media (min-width: 576px) {
          .class-actions {
            flex-direction: row;
            gap: 1rem;
          }
        }

        .action-btn {
          flex: 1;
          padding: 0.6rem 1rem;
          border-radius: 30px;
          font-weight: 600;
          transition: transform .2s ease;
          font-size: 0.85rem;
          width: 100%;
        }

        @media (min-width: 576px) {
          .action-btn {
            width: auto;
          }
        }

        .action-btn:active {
          transform: translateY(1px);
        }

        .action-btn.details-btn {
          border: 1px solid var(--accent) !important;
          color: var(--accent) !important;
          background: transparent !important;
        }

        .action-btn.details-btn:hover {
          background: var(--accent-soft) !important;
        }

        /* Buttons */
        .btn-orange {
          background: var(--accent) !important;
          border: 1px solid var(--accent-dark) !important;
          color: #fff !important;
          border-radius: 30px !important;
          font-weight: 600;
          transition: all 0.2s ease;
          padding: 0.6rem 1rem !important;
          font-size: 0.85rem;
        }

        .btn-orange:hover {
          background: var(--accent-dark) !important;
          transform: translateY(-2px);
        }

        .btn-orange:disabled,
        .btn-disabled {
          background: rgba(249,115,22,.3) !important;
          border: 1px solid rgba(249,115,22,.3) !important;
          color: #fff !important;
          cursor: not-allowed;
          transform: none !important;
        }

        .join-button {
          background: var(--accent) !important;
          border: 1px solid var(--accent-dark) !important;
          color: #fff !important;
          border-radius: 30px !important;
          font-size: 0.85rem;
          padding: 0.6rem !important;
        }

        /* Class extra info */
        .class-extra-info {
          margin-bottom: 1rem;
          display: flex;
          flex-direction: column;
          gap: .5rem;
        }

        .info-item {
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .tags-container {
          display: flex;
          flex-wrap: wrap;
          gap: .5rem;
          margin-top: .5rem;
        }

        .tag-badge {
          background: var(--accent-soft);
          color: var(--accent);
          padding: 0.2rem 0.6rem;
          border-radius: 999px;
          font-size: 0.7rem;
          border: 1px solid var(--accent);
        }

        .price-badge {
          display: inline-block;
          background: rgba(34,197,94,.15);
          color: #86efac;
          padding: 0.3rem 0.6rem;
          border-radius: 30px;
          font-weight: 700;
          font-size: 0.85rem;
          border: 1px solid rgba(34,197,94,.4);
        }

        .slots-wrapper {
          display: flex;
          flex-direction: column;
          gap: .3rem;
        }

        .slots-text {
          font-size: 0.75rem;
          color: #fde68a;
          font-weight: 600;
        }

        .slots-progress {
          height: 4px;
          background: rgba(255,255,255,.08);
          border-radius: 999px;
          overflow: hidden;
        }

        .slots-fill {
          height: 100%;
          background: linear-gradient(90deg, #f97316, #ea580c);
        }

        /* Pagination */
        .pagination-container {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .pagination-btn {
          border-radius: 30px !important;
          padding: 0.4rem 1rem !important;
          font-size: 0.85rem !important;
          border: 1px solid var(--glass-border) !important;
          background: transparent !important;
          color: var(--text-muted) !important;
        }

        .pagination-btn:hover:not(:disabled) {
          background: var(--accent-soft) !important;
          color: var(--accent) !important;
        }

        .pagination-info {
          color: var(--text-muted);
          font-size: 0.85rem;
        }

        /* ===== Modal Styles ===== */
        .professional-modal .modal-content {
          background: var(--bg-deep-1);
          border: 1px solid var(--glass-border);
          border-radius: 20px;
          backdrop-filter: blur(14px) saturate(140%);
          -webkit-backdrop-filter: blur(14px) saturate(140%);
          box-shadow: 0 22px 70px rgba(2,8,23,.55);
          color: var(--text-main);
        }

        .professional-modal .modal-header {
          border-bottom: 1px solid var(--glass-border);
          padding: 1rem;
        }

        .professional-modal .modal-header .btn-close {
          filter: invert(1) grayscale(100%) brightness(200%);
          font-size: 0.8rem;
        }

        .professional-modal .modal-dialog {
          margin: 0;
          height: 100vh;
          max-width: 100vw;
        }

        .professional-modal .modal-dialog-scrollable .modal-body {
          max-height: calc(100vh - 70px);
          overflow-y: auto;
          padding: 1rem;
        }

        /* Modal Layout */
        .class-modal-layout {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        @media (min-width: 992px) {
          .class-modal-layout {
            display: grid;
            grid-template-columns: 1.5fr 1fr;
            gap: 1.5rem;
          }
        }

        .modal-left,
        .modal-right {
          width: 100%;
        }

        .modal-right {
          background: rgba(255,255,255,.05);
          border: 1px solid var(--glass-border);
          border-radius: 16px;
          padding: 1.25rem;
        }

        .class-hero {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        @media (min-width: 576px) {
          .class-hero {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }
        }

        .class-hero h3.modal-class-title {
          font-size: clamp(1.2rem, 4vw, 1.5rem);
          font-weight: 700;
          color: #fff;
          margin: 0;
          word-break: break-word;
        }

        .details-grid {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        @media (min-width: 576px) {
          .details-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1rem;
          }
        }

        .detail-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem;
          background: rgba(255,255,255,.06);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
        }

        .detail-icon {
          font-size: 1.2rem;
          color: #93c5fd;
          flex-shrink: 0;
        }

        .detail-card label {
          display: block;
          font-size: 0.7rem;
          color: var(--text-muted);
          margin-bottom: .1rem;
        }

        .detail-card span {
          font-weight: 600;
          color: #e5e7eb;
          font-size: 0.85rem;
          word-break: break-word;
        }

        .description-section {
          margin-bottom: 1.5rem;
          max-width: 100%;
          overflow: hidden;
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        .description-section * {
          max-width: 100% !important;
          box-sizing: border-box;
        }

        .description-section img {
          max-width: 100% !important;
          height: auto !important;
          border-radius: 12px;
        }

        .description-section pre,
        .description-section code {
          white-space: pre-wrap !important;
          word-break: break-word !important;
        }

        .description-section table {
          width: 100% !important;
          display: block;
          overflow-x: auto;
        }

        .description-section h5 {
          color: #fff;
          margin-bottom: 0.75rem;
          display: flex;
          align-items: center;
          font-size: 1rem;
        }

        .description-section p {
          color: var(--text-muted);
          line-height: 1.6;
          font-size: 0.9rem;
        }

        .description-placeholder {
          background: rgba(255,255,255,.02);
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
        }

        .modal-actions-mobile {
          display: block;
        }

        @media (min-width: 992px) {
          .modal-actions-mobile {
            display: none;
          }
        }

        .modal-actions {
          display: none;
        }

        @media (min-width: 992px) {
          .modal-actions {
            display: block;
          }
        }

        /* ===== Professional Instructor Card ===== */
        .instructor-card.professional {
          background: rgba(255,255,255,.05);
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 16px;
          padding: 1.25rem;
        }

      .section-title {
        display: flex;
        align-items: center;
        font-size: 1.2rem;
        font-weight: 700;
        color: #fffefe; /* Highlight color */

        margin-bottom: 1rem;
        padding-bottom: 8px;

        border-bottom: 2px solid rgba(255, 122, 0, 0.5);
      }

        .instructor-header {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1.25rem;
          align-items: center;
          text-align: center;
        }

        @media (min-width: 576px) {
          .instructor-header {
            flex-direction: row;
            gap: 1.2rem;
            align-items: center;
            text-align: left;
          }
        }

        .instructor-avatar img {
          width: 70px;
          height: 70px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid var(--accent);
        }

        @media (min-width: 768px) {
          .instructor-avatar img {
            width: 80px;
            height: 80px;
          }
        }

        .avatar-placeholder {
          width: 70px;
          height: 70px;
          border-radius: 50%;
          background: linear-gradient(135deg,#f97316,#ea580c);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.8rem;
          font-weight: 700;
        }

        .instructor-name {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 700;
          color: #fff;
        }

        .instructor-email {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-top: .3rem;
          word-break: break-word;
        }

        .rating-row {
          margin-top: .6rem;
          display: flex;
          align-items: center;
          gap: .5rem;
          justify-content: center;
        }

        @media (min-width: 576px) {
          .rating-row {
            justify-content: flex-start;
          }
        }

        .stars {
          color: #facc15;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .rating-value {
          margin-left: .3rem;
          color: var(--text-muted);
        }

        .info-block {
          margin-bottom: 1rem;
        }

        .label {
          display: block;
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--accent);
          text-transform: uppercase;
          letter-spacing: .5px;
          margin-bottom: .3rem;
        }

        .value {
          font-size: 0.85rem;
          color: #e5e7eb;
          word-break: break-word;
        }

        .highlight {
          color: #86efac;
          font-weight: 600;
        }

        .bio-text {
          font-size: 0.85rem;
          color: var(--text-muted);
          line-height: 1.6;
          margin: 0;
          word-break: break-word;
        }

        .skills-container {
          display: flex;
          flex-wrap: wrap;
          gap: .5rem;
          margin-top: .3rem;
        }

        .skill-badge {
          background: rgba(249,115,22,.12);
          color: #f97316;
          border: 1px solid #f97316;
          padding: 0.25rem 0.6rem;
          border-radius: 999px;
          font-size: 0.65rem;
          font-weight: 600;
        }

        /* Comments Section */
        .comments-section {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--glass-border);
        }

        .comments-title {
          color: #fff;
          margin-bottom: 1.25rem;
          font-size: 1rem;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
        }

        .comment-input-wrapper {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        @media (min-width: 576px) {
          .comment-input-wrapper {
            flex-direction: row;
            gap: 1rem;
          }
        }

        .comment-avatar {
          flex-shrink: 0;
          display: flex;
          justify-content: center;
        }

        .comment-avatar svg,
        .comment-avatar img {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          color: var(--text-muted);
        }

        .comment-input-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .comment-textarea {
          background: rgba(255,255,255,.05) !important;
          border: 1px solid var(--glass-border) !important;
          color: #fff !important;
          border-radius: 12px !important;
          resize: vertical;
          min-height: 70px;
          font-size: 0.9rem;
        }

        .comment-textarea:focus {
          background: rgba(255,255,255,.08) !important;
          border-color: var(--accent) !important;
          box-shadow: none !important;
        }

        .rating-input {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
          margin: 0.25rem 0;
        }

        @media (min-width: 576px) {
          .rating-input {
            justify-content: flex-start;
          }
        }

        .comment-submit-btn {
          background: var(--accent) !important;
          border: 1px solid var(--accent-dark) !important;
          color: #fff !important;
          border-radius: 999px !important;
          padding: 0.5rem 1rem !important;
          font-weight: 600;
          transition: all 0.2s ease;
          font-size: 0.85rem;
          width: 100%;
        }

        @media (min-width: 576px) {
          .comment-submit-btn {
            width: auto;
            align-self: flex-end;
          }
        }

        .comment-submit-btn:hover:not(:disabled) {
          background: var(--accent-dark) !important;
          transform: translateY(-2px);
        }

        .comment-submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .comments-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .scrollable-feedback {
          max-height: 300px;
          overflow-y: auto;
          padding-right: 6px;
        }

        .scrollable-feedback::-webkit-scrollbar {
          width: 4px;
        }

        .scrollable-feedback::-webkit-scrollbar-track {
          background: transparent;
        }

        .scrollable-feedback::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.2);
          border-radius: 999px;
        }

        .no-comments {
          text-align: center;
          color: var(--text-muted);
          padding: 1.5rem;
          background: rgba(255,255,255,.02);
          border-radius: 12px;
          font-size: 0.9rem;
        }

        .comment-item {
          display: flex;
          gap: 0.75rem;
          padding: 0.75rem;
          background: rgba(255,255,255,.02);
          border-radius: 12px;
          transition: background 0.2s ease;
        }

        .comment-item:hover {
          background: rgba(255,255,255,.04);
        }

        .comment-content {
          flex: 1;
        }

        .comment-header {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          margin-bottom: 0.5rem;
        }

        @media (min-width: 576px) {
          .comment-header {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }
        }

        .comment-author {
          font-weight: 600;
          color: #fff;
          font-size: 0.9rem;
        }

        .comment-time {
          font-size: 0.7rem;
          color: var(--text-muted);
        }

        .comment-rating {
          margin-bottom: 0.5rem;
        }

        .comment-text {
          color: var(--text-main);
          margin-bottom: 0;
          line-height: 1.5;
          font-size: 0.85rem;
          word-break: break-word;
        }

        /* Purchase Modal */
        .purchase-modal-content {
          text-align: center;
          padding: 1rem;
        }

        .purchase-info {
          background: rgba(255,255,255,.05);
          border: 1px solid var(--glass-border);
          border-radius: 16px;
          padding: 1.25rem;
        }

        .purchase-class-title {
          font-size: 1rem;
          margin-bottom: 1rem;
          word-break: break-word;
        }

        .price-display {
          font-size: 1.5rem;
          font-weight: 700;
          color: #86efac;
        }

        .purchase-actions {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        @media (min-width: 576px) {
          .purchase-actions {
            flex-direction: row;
            gap: 1rem;
          }
        }

        /* Utility */
        .w-100 {
          width: 100%;
        }

        .text-muted {
          color: var(--text-muted) !important;
        }

        .text-warning {
          color: #facc15 !important;
        }

        /* Make column stretch */
        .row > [class*='col-'] {
          display: flex;
        }
        .status-filter button {
          border-radius: 20px;
          padding: 4px 12px;
          font-weight: 500;
        }

        .status-filter .btn-primary {
          background-color: #ff7a00;
          border-color: #ff7a00;
        }
          .purchase-actions {
  display: flex;
  gap: 12px;
  margin-top: 1.5rem;
}

.purchase-actions .btn {
  flex: 1;
  border-radius: 999px;
  padding: 0.6rem;
  font-weight: 600;
}

/* Cancel */
.purchase-actions .btn-outline-light {
  border: 1px solid rgba(255,255,255,0.2);
  color: #cbd5f5;
}

/* Confirm */
.purchase-actions .btn-orange {
  background: linear-gradient(135deg, #f97316, #ea580c);
  border: none;
  box-shadow: 0 8px 25px rgba(249,115,22,0.4);
}
  .purchase-info {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14px;
  padding: 1rem;
  margin-top: 1rem;
}

.purchase-class-title {
  font-size: 0.95rem;
  color: #cbd5f5;
  margin-bottom: 0.5rem;
}

.price-display {
  font-size: 2rem;
  font-weight: 700;
  color: #4ade80;
}
  .professional-modal.modal {
  background: rgba(2, 6, 23, 0.75);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

/* ===== PURCHASE MODAL ONLY ===== */

.purchase-modal.modal {
  background: rgba(2, 6, 23, 0.75);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

.purchase-modal .modal-dialog {
  max-width: 380px;
  margin: auto;
}

.purchase-modal .modal-content {
  background: linear-gradient(145deg, rgba(30,41,59,0.95), rgba(15,23,42,0.98));
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 18px;
  padding: 1.8rem 1.5rem;
  box-shadow: 0 25px 80px rgba(0,0,0,0.6);
  text-align: center;
}

/* Purchase Card */
.purchase-modal .purchase-info {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14px;
  padding: 1rem;
  margin-top: 1rem;
}

.purchase-modal .purchase-class-title {
  font-size: 0.95rem;
  color: #cbd5f5;
  margin-bottom: 0.5rem;
}

.purchase-modal .price-display {
  font-size: 2rem;
  font-weight: 700;
  color: #4ade80;
}

/* Buttons */
.purchase-modal .purchase-actions {
  display: flex;
  gap: 12px;
  margin-top: 1.5rem;
}

.purchase-modal .btn {
  flex: 1;
  border-radius: 999px;
  font-weight: 600;
}

.purchase-modal .btn-outline-light {
  border: 1px solid rgba(255,255,255,0.2);
  color: #cbd5f5;
}

.purchase-modal .btn-orange {
  background: linear-gradient(135deg, #f97316, #ea580c);
  border: none;
  box-shadow: 0 8px 25px rgba(249,115,22,0.4);
}
      `}</style>
    </>
  )
}

export default StudentDashboard