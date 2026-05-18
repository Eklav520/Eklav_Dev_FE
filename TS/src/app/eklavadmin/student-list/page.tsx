import { useEffect, useState } from 'react'
import { Button, Card, CardBody, CardHeader, Col, Row, Modal, Form, Badge } from 'react-bootstrap'
import { FaMapMarkerAlt, FaRegEnvelope, FaSearch, FaDownload, FaPhone, FaGraduationCap, FaStar, FaFilter, FaEye, FaChevronLeft, FaChevronRight, FaSpinner, FaUserGraduate, FaBuilding, FaEnvelope, FaPhoneAlt, FaInfoCircle, FaCheckCircle, FaTimesCircle, FaAngleDoubleLeft, FaAngleDoubleRight, FaUserShield } from 'react-icons/fa'
import { MdVerified, MdPending, MdAssessment, MdDateRange } from 'react-icons/md'
import { BsThreeDotsVertical, BsSortDown, BsSortUp } from 'react-icons/bs'
import PageMetaData from '@/components/PageMetaData'
import { useAuthContext } from '@/context/useAuthContext'
import * as XLSX from 'xlsx'

interface Feedback {
  _id: string
  text: string
  rating: number
  date: string
}

interface AssessmentScores {
  quizScore: number
  codeChallengeScore: number
  technicalRoundScore: number
  hrRoundScore: number
}

interface Student {
  _id: string
  fullName: string
  profileImage?: string
  college?: string
  phoneNo: string
  email: string
  batch?: string
  department?: string
  joiningYear?: string
  status?: string
  role?: string
  about?: string
  skills?: string[]
  feedback?: Feedback[]
  assessmentScores?: AssessmentScores
  createdAt: string
  updatedAt: string
}

interface StudentDetailsModalProps {
  show: boolean
  onHide: () => void
  student: Student | null
}

// Professional Pagination Component
const ProfessionalPagination: React.FC<{
  currentPage: number
  totalPages: number
  totalStudents: number
  studentsPerPage: number
  onPageChange: (page: number) => void
}> = ({ currentPage, totalPages, totalStudents, studentsPerPage, onPageChange }) => {
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5
    
    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      }
    }
    return pages
  }

  return (
    <div className="professional-pagination">
      <div className="pagination-info">
        Page {currentPage} of {totalPages}
      </div>
      <div className="pagination-controls">
        <button
          className="pagination-btn"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
        >
          <FaAngleDoubleLeft />
        </button>
        <button
          className="pagination-btn"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <FaChevronLeft />
        </button>
        
        {getPageNumbers().map((page, index) => (
          page === '...' ? (
            <span key={`dots-${index}`} className="pagination-dots">...</span>
          ) : (
            <button
              key={page}
              className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
              onClick={() => onPageChange(page as number)}
            >
              {page}
            </button>
          )
        ))}
        
        <button
          className="pagination-btn"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <FaChevronRight />
        </button>
        <button
          className="pagination-btn"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
        >
          <FaAngleDoubleRight />
        </button>
      </div>
      <div className="pagination-stats">
        Showing {((currentPage - 1) * studentsPerPage) + 1}–{Math.min(currentPage * studentsPerPage, totalStudents)} of {totalStudents} students
      </div>
    </div>
  )
}

// Student Details Modal Component
const StudentDetailsModal: React.FC<StudentDetailsModalProps> = ({ show, onHide, student }) => {
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackRating, setFeedbackRating] = useState<number>(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!student) return
    setIsSubmitting(true)

    try {
      await fetch(`${baseURL}/adminProfiles/admin/${student._id}/feedback`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          feedback: feedbackText,
          rating: feedbackRating,
        }),
      })
      setFeedbackText('')
      setFeedbackRating(0)
      alert('Feedback sent successfully!')
    } catch (error) {
      console.error('Error sending feedback:', error)
      alert('Failed to send feedback')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!student) return null

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge bg="success" className="px-3 py-2"><FaCheckCircle className="me-1" /> Approved</Badge>
      case 'pending':
        return <Badge bg="warning" className="px-3 py-2 text-dark"><MdPending className="me-1" /> Pending</Badge>
      case 'rejected':
        return <Badge bg="danger" className="px-3 py-2"><FaTimesCircle className="me-1" /> Rejected</Badge>
      default:
        return <Badge bg="secondary" className="px-3 py-2">{status}</Badge>
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getAverageRating = () => {
    if (!student.feedback || student.feedback.length === 0) return null
    const sum = student.feedback.reduce((acc, f) => acc + f.rating, 0)
    return (sum / student.feedback.length).toFixed(1)
  }

  const averageRating = getAverageRating()

  return (
    <Modal show={show} onHide={onHide} size="lg" centered className="student-details-modal">
      {/* Hero Header */}
      <div className="modal-hero-header position-relative overflow-hidden rounded-top-3">
        <div className="modal-hero-bg" />
        <div className="position-absolute top-0 end-0 p-3">
          <button
            type="button"
            className="btn-close btn-close-white opacity-75"
            onClick={onHide}
            aria-label="Close"
          />
        </div>
        <div className="d-flex align-items-center gap-4 p-4 position-relative">
          {student.profileImage ? (
            <img
              src={`${baseURL}${student.profileImage}`}
              alt={student.fullName}
              className="rounded-circle modal-avatar"
            />
          ) : (
            <div className="rounded-circle modal-avatar-initials d-flex align-items-center justify-content-center">
              {getInitials(student.fullName)}
            </div>
          )}
          <div className="flex-grow-1">
            <h4 className="text-white fw-bold mb-1">{student.fullName}</h4>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              {getStatusBadge(student.status || 'pending')}
              {student.batch && (
                <Badge bg="secondary" className="fw-normal">{student.batch}</Badge>
              )}
              {averageRating && (
                <span className="d-flex align-items-center gap-1 text-warning small">
                  <FaStar size={12} />
                  <span>{averageRating}</span>
                </span>
              )}
            </div>
            {student.college && (
              <p className="text-white-50 small mb-0 mt-2">
                <FaBuilding className="me-1" size={11} />
                {student.college}
              </p>
            )}
          </div>
        </div>
      </div>

      <Modal.Body className="modal-body-dark p-4">
        {/* Contact + Academic side by side */}
        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <div className="modal-info-card h-100">
              <div className="modal-info-card-title">
                <FaEnvelope size={13} className="me-2 text-orange" />
                Contact
              </div>
              <div className="modal-info-row">
                <span className="modal-info-label">Email</span>
                <a href={`mailto:${student.email}`} className="modal-info-value text-orange text-decoration-none text-truncate">
                  {student.email}
                </a>
              </div>
              <div className="modal-info-row">
                <span className="modal-info-label">Phone</span>
                <a href={`tel:${student.phoneNo}`} className="modal-info-value text-orange text-decoration-none">
                  {student.phoneNo}
                </a>
              </div>
              {student.joiningYear && (
                <div className="modal-info-row">
                  <span className="modal-info-label">Joined</span>
                  <span className="modal-info-value">{student.joiningYear}</span>
                </div>
              )}
            </div>
          </div>
          <div className="col-md-6">
            <div className="modal-info-card h-100">
              <div className="modal-info-card-title">
                <FaGraduationCap size={13} className="me-2 text-orange" />
                Academic
              </div>
              {student.department && (
                <div className="modal-info-row">
                  <span className="modal-info-label">Department</span>
                  <span className="modal-info-value">{student.department}</span>
                </div>
              )}
              {student.batch && (
                <div className="modal-info-row">
                  <span className="modal-info-label">Batch</span>
                  <span className="modal-info-value">{student.batch}</span>
                </div>
              )}
              {student.role && (
                <div className="modal-info-row">
                  <span className="modal-info-label">Role</span>
                  <span className="modal-info-value text-capitalize">{student.role}</span>
                </div>
              )}
              <div className="modal-info-row">
                <span className="modal-info-label">Registered</span>
                <span className="modal-info-value">
                  {new Date(student.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Assessment Scores */}
        {student.assessmentScores && (
          <div className="modal-info-card mb-3">
            <div className="modal-info-card-title">
              <MdAssessment size={14} className="me-2 text-orange" />
              Assessment Scores
            </div>
            <div className="row g-2 mt-1">
              {[
                { label: 'Quiz', value: student.assessmentScores.quizScore },
                { label: 'Code Challenge', value: student.assessmentScores.codeChallengeScore },
                { label: 'Technical', value: student.assessmentScores.technicalRoundScore },
                { label: 'HR Round', value: student.assessmentScores.hrRoundScore },
              ].map(({ label, value }) => (
                <div key={label} className="col-6 col-md-3">
                  <div className="score-tile text-center">
                    <div className="score-tile-value">{value ?? '—'}</div>
                    <div className="score-tile-label">{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {student.skills && student.skills.length > 0 && (
          <div className="modal-info-card mb-3">
            <div className="modal-info-card-title">Skills</div>
            <div className="d-flex flex-wrap gap-2 mt-2">
              {student.skills.map((skill, idx) => (
                <span key={idx} className="skill-chip">{skill}</span>
              ))}
            </div>
          </div>
        )}

        {/* About */}
        {student.about && (
          <div className="modal-info-card mb-3">
            <div className="modal-info-card-title">About</div>
            <p className="text-muted small mb-0 mt-2 lh-lg">{student.about}</p>
          </div>
        )}

        {/* Feedback History */}
        {student.feedback && student.feedback.length > 0 && (
          <div className="modal-info-card mb-3">
            <div className="d-flex align-items-center justify-content-between">
              <div className="modal-info-card-title mb-0">
                <FaStar size={13} className="me-2 text-orange" />
                Feedback History
              </div>
              {averageRating && (
                <span className="avg-rating-badge">
                  <FaStar size={11} className="text-warning me-1" />
                  {averageRating} avg
                </span>
              )}
            </div>
            <div className="feedback-scroll mt-3">
              {student.feedback.map((fb) => (
                <div key={fb._id} className="feedback-item">
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <div className="d-flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <FaStar key={i} size={11} color={i < fb.rating ? '#ffc107' : '#3a3a3a'} />
                      ))}
                    </div>
                    <small className="text-muted">{new Date(fb.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</small>
                  </div>
                  <p className="small mb-0 text-muted lh-base">{fb.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Send Feedback */}
        <div className="modal-info-card">
          <div className="modal-info-card-title mb-3">
            <FaStar size={13} className="me-2 text-orange" />
            Send Feedback
          </div>
          <Form onSubmit={handleSubmitFeedback}>
            <div className="mb-3">
              <div className="d-flex gap-2 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FaStar
                    key={star}
                    size={22}
                    color={star <= feedbackRating ? '#ff8c00' : '#3a3a3a'}
                    onClick={() => setFeedbackRating(star)}
                    style={{ cursor: 'pointer', transition: 'color 0.15s' }}
                  />
                ))}
                {feedbackRating > 0 && (
                  <span className="text-muted small ms-1 align-self-center">{feedbackRating}/5</span>
                )}
              </div>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Write your feedback..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                required
                className="modal-textarea"
              />
            </div>
            <div className="d-flex justify-content-end gap-2">
              <Button variant="outline-secondary" size="sm" onClick={onHide}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="btn-orange"
                disabled={isSubmitting || !feedbackText.trim() || feedbackRating === 0}
              >
                {isSubmitting ? <FaSpinner className="spinner me-1" size={12} /> : null}
                Submit Feedback
              </Button>
            </div>
          </Form>
        </div>
      </Modal.Body>
    </Modal>
  )
}

// Student Card Component for Grid View
const StudentCard: React.FC<{ student: Student; onViewDetails: (student: Student) => void; onContact: (student: Student) => void }> = ({ student, onViewDetails, onContact }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success'
      case 'pending': return 'warning'
      case 'rejected': return 'danger'
      default: return 'secondary'
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const baseURL = import.meta.env.VITE_API_BASE_URL

  return (
    <div className="student-card bg-dark-lighter rounded-3 p-3 border border-secondary hover-glow">
      <div className="d-flex align-items-start justify-content-between mb-3">
        <div className="d-flex align-items-center gap-3">
          {student.profileImage ? (
            <img 
              src={`${baseURL}${student.profileImage}`} 
              alt={student.fullName}
              className="rounded-circle"
              style={{ width: 56, height: 56, objectFit: 'cover' }}
            />
          ) : (
            <div className="rounded-circle bg-orange text-white d-flex align-items-center justify-content-center" style={{ width: 56, height: 56, fontSize: 20, fontWeight: 600 }}>
              {getInitials(student.fullName)}
            </div>
          )}
          <div>
            <h6 className="mb-0 text-white">{student.fullName}</h6>
            <small className="text-muted">{student.email}</small>
          </div>
        </div>
        <Badge bg={getStatusColor(student.status || 'pending')} className="px-2 py-1">
          {student.status || 'pending'}
        </Badge>
      </div>
      
      <div className="mb-2">
        <FaPhone className="text-muted me-2" size={12} />
        <small className="text-muted">{student.phoneNo}</small>
      </div>
      
      {student.college && (
        <div className="mb-3">
          <FaBuilding className="text-muted me-2" size={12} />
          <small className="text-muted">{student.college.length > 40 ? student.college.substring(0, 40) + '...' : student.college}</small>
        </div>
      )}
      
      <div className="d-flex gap-2 mt-2">
        <Button 
          variant="outline-orange" 
          size="sm" 
          className="flex-grow-1"
          onClick={() => onViewDetails(student)}
        >
          <FaEye className="me-1" /> View
        </Button>
        <Button 
          variant="orange" 
          size="sm" 
          className="flex-grow-1"
          onClick={() => onContact(student)}
        >
          <FaPhone className="me-1" /> Contact
        </Button>
      </div>
    </div>
  )
}

const StudentListPage: React.FC = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()

  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterBatch, setFilterBatch] = useState<string>('all')
  const [filterCollege, setFilterCollege] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')

  // Pending (unapplied) filter values — applied only when user clicks Apply
  const [pendingStatus, setPendingStatus] = useState<string>('all')
  const [pendingBatch, setPendingBatch] = useState<string>('all')
  const [pendingCollege, setPendingCollege] = useState<string>('all')
  const [pendingDateFrom, setPendingDateFrom] = useState<string>('')
  const [pendingDateTo, setPendingDateTo] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [currentPage, setCurrentPage] = useState(1)
  const [college, setCollege] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [contactMessage, setContactMessage] = useState('')
  const [isSendingContact, setIsSendingContact] = useState(false)

  // User audit: non-students + students without profile
  const [auditData, setAuditData] = useState<{
    nonStudents: { _id: string; name: string; email: string; role: string; status: string; createdAt: string }[]
    studentsWithoutProfile: { _id: string; name: string; email: string; status: string; createdAt: string }[]
  } | null>(null)
  const [auditLoading, setAuditLoading] = useState(false)
  const [showAudit, setShowAudit] = useState(false)

  const studentsPerPage = 50

  // Fetch profile
  const fetchProfile = async () => {
    try {
      const res = await fetch(`${baseURL}/profile`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch profile')
      const data = await res.json()
      setCollege(data.college || null)
      setRole(data.role || null)
    } catch (err) {
      console.error('Failed to load profile', err)
    }
  }

  // Fetch all students
  const fetchAllStudents = async () => {
    try {
      const res = await fetch(`${baseURL}/adminProfiles/admin`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch students')
      const data = await res.json()
      if (Array.isArray(data)) {
        setStudents(data)
      } else if (Array.isArray(data.students)) {
        setStudents(data.students)
      } else if (Array.isArray(data.data)) {
        setStudents(data.data)
      } else {
        setStudents([])
      }
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch students by college
  const fetchStudentsByCollege = async (collegeName: string) => {
    try {
      const res = await fetch(`${baseURL}/adminProfiles/admin?college=${encodeURIComponent(collegeName)}`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch students')
      const data: Student[] = await res.json()
      setStudents(data)
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.token) fetchProfile()
  }, [user?.token])

  useEffect(() => {
    if (!user?.token || !role) return
    if (role === 'college_admin' && college) {
      fetchStudentsByCollege(college)
    } else if (role === 'admin' || role === 'super_admin') {
      fetchAllStudents()
    }
  }, [role, college, user?.token])

  // Get unique values for filters
const batches = [...new Set(students.map(s => s.batch).filter((batch): batch is string => Boolean(batch)))]
const colleges = [...new Set(students.map(s => s.college).filter((college): college is string => Boolean(college)))]

  // Filter and sort students
  let filteredStudents = students.filter(student => {
    const matchesSearch = student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.phoneNo.includes(searchTerm) ||
      (student.college && student.college.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = filterStatus === 'all' || student.status === filterStatus
    const matchesBatch = filterBatch === 'all' || student.batch === filterBatch
    const matchesCollege = filterCollege === 'all' || student.college === filterCollege

    const registeredAt = new Date(student.createdAt)
    const matchesFrom = !dateFrom || registeredAt >= new Date(dateFrom)
    const matchesTo = !dateTo || registeredAt <= new Date(dateTo + 'T23:59:59')

    return matchesSearch && matchesStatus && matchesBatch && matchesCollege && matchesFrom && matchesTo
  })

  // Sort students
  filteredStudents.sort((a, b) => {
    let comparison = 0
    switch (sortBy) {
      case 'name':
        comparison = a.fullName.localeCompare(b.fullName)
        break
      case 'date':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        break
      case 'status':
        comparison = (a.status || '').localeCompare(b.status || '')
        break
      case 'batch':
        comparison = (a.batch || '').localeCompare(b.batch || '')
        break
      case 'college':
        comparison = (a.college || '').localeCompare(b.college || '')
        break
      default:
        comparison = 0
    }
    return sortOrder === 'asc' ? comparison : -comparison
  })

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage)
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * studentsPerPage,
    currentPage * studentsPerPage
  )

  // Fetch user audit data
  const fetchAuditData = async () => {
    if (auditData) { setShowAudit(s => !s); return }
    setAuditLoading(true)
    try {
      const res = await fetch(`${baseURL}/api/adminProfiles/user-audit`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      if (!res.ok) {
        console.error('Audit API error:', res.status, await res.text())
        return
      }
      const data = await res.json()
      if (data.success) {
        setAuditData(data)
        setShowAudit(true)
      } else {
        console.error('Audit response not successful:', data)
      }
    } catch (err) {
      console.error('Audit fetch error:', err)
    } finally {
      setAuditLoading(false)
    }
  }

  // Download Excel
  const handleDownloadExcel = () => {
    if (!filteredStudents.length) return
    const excelData = filteredStudents.map((student, index) => ({
      'S.No': index + 1,
      'Student Name': student.fullName,
      Email: student.email,
      Phone: student.phoneNo,
      College: student.college || '-',
      Batch: student.batch || '-',
      Status: student.status || '-',
      'Joining Year': student.joiningYear || '-',
    }))
    const worksheet = XLSX.utils.json_to_sheet(excelData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students')
    const fileName = role === 'college_admin' && college ? `Students_${college}.xlsx` : 'All_Students.xlsx'
    XLSX.writeFile(workbook, fileName)
  }

  // Send Contact Message
  const handleSendContact = async () => {
    if (!selectedStudent || !contactMessage.trim()) return
    setIsSendingContact(true)
    try {
      // Here you can integrate with your email/SMS service
      console.log(`Sending to ${selectedStudent.email}: ${contactMessage}`)
      alert(`Message sent to ${selectedStudent.fullName}`)
      setContactMessage('')
      setShowContactModal(false)
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    } finally {
      setIsSendingContact(false)
    }
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-50">
        <FaSpinner className="text-orange spinner-grow" size={40} />
      </div>
    )
  }

  const approvedCount = students.filter(s => s.status === 'approved').length
  const pendingCount = students.filter(s => s.status === 'pending').length
  const rejectedCount = students.filter(s => s.status === 'rejected').length
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const isNew = (createdAt: string) => new Date(createdAt) > sevenDaysAgo

  const handleSortColumn = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return <BsSortDown className="ms-1 text-secondary opacity-50" size={12} />
    return sortOrder === 'asc' ? <BsSortUp className="ms-1 text-orange" size={12} /> : <BsSortDown className="ms-1 text-orange" size={12} />
  }

  return (
    <>
      <PageMetaData title="Student Management | Admin Dashboard" />

      <div className="admin-dashboard">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
          <div>
            <h5 className="text-white mb-1 fw-semibold">Student Management</h5>
            <p className="text-muted mb-0 small">
              <FaUserGraduate className="me-1" />
              {filteredStudents.length !== students.length
                ? `Showing ${filteredStudents.length} of ${students.length} students`
                : `${students.length} total students`}
            </p>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
            >
              {viewMode === 'table' ? 'Grid View' : 'Table View'}
            </Button>
            <Button
              variant="outline-orange"
              size="sm"
              onClick={handleDownloadExcel}
              disabled={filteredStudents.length === 0}
            >
              <FaDownload className="me-2" />
              Export Excel
            </Button>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={fetchAuditData}
              disabled={auditLoading}
            >
              {auditLoading ? <FaSpinner className="me-1" size={12} /> : <FaUserShield className="me-1" size={12} />}
              User Audit
            </Button>
          </div>
        </div>

        {/* Stat Cards */}
        {/* Stat pills + Search on same row */}
        <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
          {[
            { label: 'Total', value: students.length, color: '#ff8c00', bg: 'rgba(255,140,0,0.08)', border: 'rgba(255,140,0,0.25)' },
            { label: 'Approved', value: approvedCount, color: '#198754', bg: 'rgba(25,135,84,0.08)', border: 'rgba(25,135,84,0.25)' },
            { label: 'Pending', value: pendingCount, color: '#ffc107', bg: 'rgba(255,193,7,0.08)', border: 'rgba(255,193,7,0.25)' },
            { label: 'Rejected', value: rejectedCount, color: '#dc3545', bg: 'rgba(220,53,69,0.08)', border: 'rgba(220,53,69,0.25)' },
          ].map(({ label, value, color, bg, border }) => (
            <div
              key={label}
              className="stat-card d-flex align-items-center gap-2 rounded-3 px-3 py-2 flex-shrink-0"
              style={{ background: bg, border: `1px solid ${border}` }}
            >
              <span className="fw-bold" style={{ color, fontSize: '1rem', lineHeight: 1 }}>{value}</span>
              <span className="text-muted" style={{ fontSize: '0.72rem' }}>{label}</span>
            </div>
          ))}
          <div className="position-relative flex-grow-1" style={{ minWidth: 180 }}>
            <FaSearch className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" size={12} />
            <input
              type="text"
              className="form-control bg-dark-lighter border-secondary text-white ps-5"
              style={{ height: 36, fontSize: '0.85rem' }}
              placeholder="Search name, email, phone, college..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }}
            />
          </div>
        </div>

        {/* Filter Toolbar — all on one line */}
        <Card className="bg-dark border-secondary mb-4">
          <CardBody className="py-2 px-3">
            <div className="d-flex align-items-center gap-2" style={{ flexWrap: 'nowrap', overflowX: 'auto' }}>
              <select
                className="form-select bg-dark-lighter border-secondary text-white flex-shrink-0"
                style={{ width: 'auto', minWidth: 130, height: 36, fontSize: '0.82rem' }}
                value={pendingStatus}
                onChange={(e) => setPendingStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
              <select
                className="form-select bg-dark-lighter border-secondary text-white flex-shrink-0"
                style={{ width: 'auto', minWidth: 130, height: 36, fontSize: '0.82rem' }}
                value={pendingBatch}
                onChange={(e) => setPendingBatch(e.target.value)}
              >
                <option value="all">All Batches</option>
                {batches.map(batch => (
                  <option key={batch} value={batch}>{batch}</option>
                ))}
              </select>
              <select
                className="form-select bg-dark-lighter border-secondary text-white flex-shrink-0"
                style={{ width: 'auto', minWidth: 160, maxWidth: 240, height: 36, fontSize: '0.82rem' }}
                value={pendingCollege}
                onChange={(e) => setPendingCollege(e.target.value)}
              >
                <option value="all">All Colleges</option>
                {colleges.map(col => (
                  <option key={col} value={col}>{col.length > 35 ? col.substring(0, 35) + '...' : col}</option>
                ))}
              </select>
              <div className="d-flex align-items-center gap-1 flex-shrink-0" style={{ background: '#2a2a2a', border: '1px solid #444', borderRadius: 8, padding: '4px 10px', height: 36 }}>
                <MdDateRange className="text-muted flex-shrink-0" size={14} />
                <input
                  type="date"
                  className="date-range-input"
                  title="From date"
                  value={pendingDateFrom}
                  max={pendingDateTo || undefined}
                  onChange={(e) => setPendingDateFrom(e.target.value)}
                />
                <span className="text-muted" style={{ fontSize: 11 }}>–</span>
                <input
                  type="date"
                  className="date-range-input"
                  title="To date"
                  value={pendingDateTo}
                  min={pendingDateFrom || undefined}
                  onChange={(e) => setPendingDateTo(e.target.value)}
                />
              </div>
              <Button
                size="sm"
                className="btn-orange flex-shrink-0"
                onClick={() => {
                  setFilterStatus(pendingStatus)
                  setFilterBatch(pendingBatch)
                  setFilterCollege(pendingCollege)
                  setDateFrom(pendingDateFrom)
                  setDateTo(pendingDateTo)
                  setCurrentPage(1)
                }}
              >
                Apply
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                className="flex-shrink-0"
                title="Reset all filters"
                onClick={() => {
                  setPendingStatus('all')
                  setPendingBatch('all')
                  setPendingCollege('all')
                  setPendingDateFrom('')
                  setPendingDateTo('')
                  setFilterStatus('all')
                  setFilterBatch('all')
                  setFilterCollege('all')
                  setDateFrom('')
                  setDateTo('')
                  setSearchTerm('')
                  setSortBy('date')
                  setSortOrder('desc')
                  setCurrentPage(1)
                }}
              >
                Reset
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* ── User Audit Section ── */}
        {showAudit && auditData && (
          <div className="audit-section mb-4">

            {/* Non-student users */}
            <div className="audit-card mb-3">
              <div className="audit-card-header">
                <div className="d-flex align-items-center gap-2">
                  <FaUserShield size={14} className="text-orange" />
                  <span>Non-Student Users</span>
                  <span className="audit-badge">{auditData.nonStudents.length}</span>
                </div>
                <span className="audit-sub">Admins, Tutors, Institute Admins, College Admins</span>
              </div>
              <div className="audit-table-wrap">
                <table className="audit-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditData.nonStudents.length === 0 ? (
                      <tr><td colSpan={6} className="text-center text-muted py-3">No records</td></tr>
                    ) : auditData.nonStudents.map((u, i) => (
                      <tr key={u._id}>
                        <td className="audit-num">{i + 1}</td>
                        <td>
                          <div className="audit-avatar-row">
                            <div className="audit-avatar">{(u.name || u.email || '?')[0].toUpperCase()}</div>
                            <span className="audit-name">{u.name || '—'}</span>
                          </div>
                        </td>
                        <td className="audit-email">{u.email}</td>
                        <td>
                          <span className={`audit-role-badge audit-role-${u.role}`}>
                            {u.role === 'admin' ? 'Admin'
                              : u.role === 'tutor' ? 'Tutor'
                              : u.role === 'instituteAdmin' ? 'Institute Admin'
                              : u.role === 'collegeAdmin' ? 'College Admin'
                              : u.role}
                          </span>
                        </td>
                        <td>
                          <span className={`audit-status ${u.status === 'approved' ? 'audit-approved' : 'audit-pending'}`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="audit-date">
                          {new Date(u.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Students without profile */}
            <div className="audit-card">
              <div className="audit-card-header">
                <div className="d-flex align-items-center gap-2">
                  <FaUserGraduate size={14} className="text-warning" />
                  <span>Students Without Profile</span>
                  <span className="audit-badge audit-badge-warn">{auditData.studentsWithoutProfile.length}</span>
                </div>
                <span className="audit-sub">Registered accounts with no profile record — count mismatch source</span>
              </div>
              <div className="audit-table-wrap">
                <table className="audit-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditData.studentsWithoutProfile.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-3" style={{ color: '#28a745' }}>✓ All students have a profile — no mismatch</td></tr>
                    ) : auditData.studentsWithoutProfile.map((u, i) => (
                      <tr key={u._id}>
                        <td className="audit-num">{i + 1}</td>
                        <td>
                          <div className="audit-avatar-row">
                            <div className="audit-avatar audit-avatar-warn">{(u.name || u.email || '?')[0].toUpperCase()}</div>
                            <span className="audit-name">{u.name || '—'}</span>
                          </div>
                        </td>
                        <td className="audit-email">{u.email}</td>
                        <td>
                          <span className={`audit-status ${u.status === 'approved' ? 'audit-approved' : 'audit-pending'}`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="audit-date">
                          {new Date(u.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* Students List */}
        {viewMode === 'table' ? (
          <Card className="bg-dark border-secondary">
            <div className="table-responsive">
              <table className="table table-dark table-hover mb-0 align-middle">
                <thead style={{ borderBottom: '2px solid #3a3a3a' }}>
                  <tr>
                    <th className="text-muted ps-3" style={{ width: 50 }}>#</th>
                    <th
                      className="text-muted sortable-th"
                      onClick={() => handleSortColumn('name')}
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                      Student <SortIcon column="name" />
                    </th>
                    <th
                      className="text-muted sortable-th"
                      onClick={() => handleSortColumn('college')}
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                      College <SortIcon column="college" />
                    </th>
                    <th
                      className="text-muted sortable-th"
                      onClick={() => handleSortColumn('batch')}
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                      Batch <SortIcon column="batch" />
                    </th>
                    <th className="text-muted">Contact</th>
                    <th
                      className="text-muted sortable-th"
                      onClick={() => handleSortColumn('status')}
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                      Status <SortIcon column="status" />
                    </th>
                    <th
                      className="text-muted sortable-th"
                      onClick={() => handleSortColumn('date')}
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                      Registered <SortIcon column="date" />
                    </th>
                    <th className="text-muted text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center text-muted py-5">
                        <FaUserGraduate size={32} className="mb-3 d-block mx-auto opacity-25" />
                        No students found matching your filters
                      </td>
                    </tr>
                  ) : (
                    paginatedStudents.map((student, idx) => (
                      <tr key={student._id} style={{ borderBottom: '1px solid #2a2a2a' }}>
                        <td className="text-muted ps-3 small">
                          {(currentPage - 1) * studentsPerPage + idx + 1}
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-3">
                            {student.profileImage ? (
                              <img
                                src={`${baseURL}${student.profileImage}`}
                                alt={student.fullName}
                                className="rounded-circle flex-shrink-0"
                                style={{ width: 38, height: 38, objectFit: 'cover' }}
                              />
                            ) : (
                              <div className="rounded-circle bg-orange text-white d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 38, height: 38, fontSize: 13, fontWeight: 600 }}>
                                {student.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                              </div>
                            )}
                            <div className="overflow-hidden">
                              <div className="d-flex align-items-center gap-2">
                                <span className="text-white fw-medium text-truncate">{student.fullName}</span>
                                {isNew(student.createdAt) && (
                                  <Badge bg="success" className="px-2 py-1 flex-shrink-0" style={{ fontSize: 10 }}>NEW</Badge>
                                )}
                              </div>
                              <div className="small text-muted text-truncate">{student.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="text-muted small" title={student.college || ''}>
                            {student.college ? (student.college.length > 30 ? student.college.substring(0, 30) + '…' : student.college) : '—'}
                          </div>
                        </td>
                        <td>
                          {student.batch
                            ? <Badge bg="secondary" className="fw-normal">{student.batch}</Badge>
                            : <span className="text-muted">—</span>}
                        </td>
                        <td>
                          <div className="text-white small">{student.phoneNo}</div>
                        </td>
                        <td>
                          <Badge
                            className="text-capitalize px-2 py-1"
                            bg={student.status === 'approved' ? 'success' : student.status === 'rejected' ? 'danger' : 'warning'}
                            text={student.status === 'pending' ? 'dark' : undefined}
                          >
                            {student.status || 'pending'}
                          </Badge>
                        </td>
                        <td>
                          <div className="text-muted small">
                            {new Date(student.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                        </td>
                        <td>
                          <div className="d-flex gap-2 justify-content-center">
                            <Button
                              variant="outline-orange"
                              size="sm"
                              title="View details"
                              onClick={() => { setSelectedStudent(student); setShowDetailsModal(true) }}
                            >
                              <FaEye />
                            </Button>
                            <Button
                              variant="orange"
                              size="sm"
                              title="Contact student"
                              onClick={() => { setSelectedStudent(student); setShowContactModal(true) }}
                            >
                              <FaPhone />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <Row className="g-3">
            {paginatedStudents.length === 0 ? (
              <Col xs={12}>
                <div className="text-center text-muted py-5 bg-dark rounded-3">
                  <FaUserGraduate size={32} className="mb-3 d-block mx-auto opacity-25" />
                  No students found matching your filters
                </div>
              </Col>
            ) : (
              paginatedStudents.map(student => (
                <Col key={student._id} lg={4} md={6}>
                  <StudentCard
                    student={student}
                    onViewDetails={(s) => { setSelectedStudent(s); setShowDetailsModal(true) }}
                    onContact={(s) => { setSelectedStudent(s); setShowContactModal(true) }}
                  />
                </Col>
              ))
            )}
          </Row>
        )}

        {/* Professional Pagination */}
        {totalPages > 1 && (
          <ProfessionalPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalStudents={filteredStudents.length}
            studentsPerPage={studentsPerPage}
            onPageChange={setCurrentPage}
          />
        )}

      </div>

      {/* Student Details Modal */}
      <StudentDetailsModal
        show={showDetailsModal}
        onHide={() => setShowDetailsModal(false)}
        student={selectedStudent}
      />

      {/* Contact Modal */}
      <Modal show={showContactModal} onHide={() => setShowContactModal(false)} centered size="sm" className="contact-modal">
        <div className="modal-hero-header position-relative overflow-hidden rounded-top-3" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)' }}>
          <div className="position-absolute top-0 end-0 p-3">
            <button type="button" className="btn-close btn-close-white opacity-75" onClick={() => setShowContactModal(false)} aria-label="Close" />
          </div>
          <div className="p-4 pb-3">
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-circle d-flex align-items-center justify-content-center bg-orange text-white fw-bold flex-shrink-0" style={{ width: 48, height: 48, fontSize: 16 }}>
                {selectedStudent?.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div>
                <h6 className="text-white fw-bold mb-0">{selectedStudent?.fullName}</h6>
                <small className="text-white-50">Send a message</small>
              </div>
            </div>
          </div>
        </div>
        <Modal.Body className="modal-body-dark p-4">
          <div className="d-flex gap-3 mb-4">
            <a
              href={`tel:${selectedStudent?.phoneNo}`}
              className="contact-quick-btn flex-grow-1"
            >
              <FaPhone size={14} className="me-2 text-orange" />
              {selectedStudent?.phoneNo}
            </a>
            <a
              href={`mailto:${selectedStudent?.email}`}
              className="contact-quick-btn flex-grow-1"
            >
              <FaEnvelope size={14} className="me-2 text-orange" />
              Email
            </a>
          </div>
          <Form.Control
            as="textarea"
            rows={4}
            placeholder="Type your message..."
            value={contactMessage}
            onChange={(e) => setContactMessage(e.target.value)}
            className="modal-textarea mb-3"
          />
          <div className="d-flex gap-2 justify-content-end">
            <Button variant="outline-secondary" size="sm" onClick={() => setShowContactModal(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="btn-orange"
              onClick={handleSendContact}
              disabled={isSendingContact || !contactMessage.trim()}
            >
              {isSendingContact ? <FaSpinner className="spinner me-1" size={12} /> : null}
              Send Message
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* Global Styles */}
      <style>{`
        .bg-dark-lighter {
          background-color: #2a2a2a;
        }
        .bg-orange {
          background-color: #ff8c00;
        }
        .text-orange {
          color: #ff8c00;
        }
        .border-orange {
          border-color: #ff8c00;
        }
        .btn-orange {
          background-color: #ff8c00;
          border-color: #ff8c00;
          color: white;
        }
        .btn-orange:hover {
          background-color: #e67e00;
          border-color: #e67e00;
          color: white;
        }
        .btn-outline-orange {
          border-color: #ff8c00;
          color: #ff8c00;
        }
        .btn-outline-orange:hover {
          background-color: #ff8c00;
          color: white;
        }
        .student-card {
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .student-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(255, 140, 0, 0.15);
        }
        .cursor-pointer {
          cursor: pointer;
        }
        .spinner {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        /* ── Modal Base ── */
        .modal-content {
          background-color: #141414;
          border: 1px solid rgba(255, 140, 0, 0.15);
          border-radius: 16px !important;
          overflow: hidden;
          box-shadow: 0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,140,0,0.08);
        }
        .modal-backdrop {
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          background-color: rgba(0, 0, 0, 0.65);
        }
        body.modal-open .admin-dashboard {
          filter: blur(4px);
          transition: filter 0.2s ease;
          pointer-events: none;
        }

        /* ── Modal Hero Header ── */
        .modal-hero-header {
          background: linear-gradient(135deg, #1c1c1c 0%, #252525 60%, #1a1a1a 100%);
          border-bottom: 1px solid rgba(255, 140, 0, 0.12);
        }
        .modal-hero-bg {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at top left, rgba(255,140,0,0.08) 0%, transparent 60%);
          pointer-events: none;
        }
        .modal-avatar {
          width: 72px;
          height: 72px;
          object-fit: cover;
          border: 3px solid rgba(255,140,0,0.4);
          box-shadow: 0 0 0 4px rgba(255,140,0,0.08);
        }
        .modal-avatar-initials {
          width: 72px;
          height: 72px;
          background: linear-gradient(135deg, #ff8c00, #e67e00);
          color: white;
          font-size: 22px;
          font-weight: 700;
          letter-spacing: 1px;
          border: 3px solid rgba(255,140,0,0.4);
          box-shadow: 0 0 0 4px rgba(255,140,0,0.08);
        }

        /* ── Modal Body ── */
        .modal-body-dark {
          background-color: #141414;
          color: #e0e0e0;
        }

        /* ── Info Cards ── */
        .modal-info-card {
          background: #1e1e1e;
          border: 1px solid #2a2a2a;
          border-radius: 12px;
          padding: 1rem 1.25rem;
        }
        .modal-info-card-title {
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          color: #6c757d;
          margin-bottom: 0.75rem;
          display: flex;
          align-items: center;
        }
        .modal-info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.45rem 0;
          border-bottom: 1px solid #252525;
        }
        .modal-info-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .modal-info-label {
          font-size: 0.8rem;
          color: #6c757d;
          flex-shrink: 0;
        }
        .modal-info-value {
          font-size: 0.85rem;
          color: #e0e0e0;
          font-weight: 500;
          text-align: right;
          max-width: 60%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* ── Score Tiles ── */
        .score-tile {
          background: #252525;
          border: 1px solid #333;
          border-radius: 10px;
          padding: 0.75rem 0.5rem;
        }
        .score-tile-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #ff8c00;
          line-height: 1;
        }
        .score-tile-label {
          font-size: 0.65rem;
          color: #6c757d;
          margin-top: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* ── Skill Chips ── */
        .skill-chip {
          background: rgba(255,140,0,0.08);
          border: 1px solid rgba(255,140,0,0.2);
          color: #ff8c00;
          border-radius: 20px;
          padding: 3px 12px;
          font-size: 0.78rem;
          font-weight: 500;
        }

        /* ── Feedback ── */
        .feedback-scroll {
          max-height: 180px;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: #333 transparent;
        }
        .feedback-item {
          background: #252525;
          border-radius: 8px;
          padding: 0.6rem 0.75rem;
          margin-bottom: 0.5rem;
        }
        .feedback-item:last-child { margin-bottom: 0; }
        .avg-rating-badge {
          background: rgba(255,193,7,0.1);
          border: 1px solid rgba(255,193,7,0.25);
          color: #ffc107;
          border-radius: 20px;
          padding: 2px 10px;
          font-size: 0.75rem;
          font-weight: 600;
          display: flex;
          align-items: center;
        }

        /* ── Modal Textarea ── */
        .modal-textarea {
          background: #252525 !important;
          border: 1px solid #333 !important;
          color: #e0e0e0 !important;
          border-radius: 10px !important;
          resize: none;
        }
        .modal-textarea:focus {
          border-color: rgba(255,140,0,0.5) !important;
          box-shadow: 0 0 0 3px rgba(255,140,0,0.1) !important;
          outline: none;
        }
        .modal-textarea::placeholder { color: #555 !important; }

        /* ── Contact Quick Buttons ── */
        .contact-quick-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #1e1e1e;
          border: 1px solid #2a2a2a;
          border-radius: 10px;
          padding: 0.6rem 1rem;
          font-size: 0.8rem;
          color: #e0e0e0;
          text-decoration: none;
          transition: border-color 0.2s, background 0.2s;
        }
        .contact-quick-btn:hover {
          border-color: rgba(255,140,0,0.4);
          background: rgba(255,140,0,0.05);
          color: #ff8c00;
        }
        .table-dark {
          background-color: #1a1a1a;
        }
        .sortable-th:hover {
          color: #ff8c00 !important;
          background: rgba(255,140,0,0.05);
        }
        .stat-card {
          transition: transform 0.2s;
        }
        .stat-card:hover {
          transform: translateY(-2px);
        }
        .date-range-input {
          background: transparent;
          border: none;
          color: #e0e0e0;
          font-size: 0.8rem;
          outline: none;
          width: 120px;
          color-scheme: dark;
        }
        .date-range-input::-webkit-calendar-picker-indicator {
          filter: invert(0.6);
          cursor: pointer;
        }
        .form-control:focus, .form-select:focus {
          border-color: #ff8c00;
          box-shadow: 0 0 0 0.2rem rgba(255, 140, 0, 0.25);
        }

        /* Professional Pagination Styles */
        .professional-pagination {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 2rem;
          padding: 1rem 1.5rem;
          background: linear-gradient(135deg, #1e1e1e 0%, #2a2a2a 100%);
          border-radius: 16px;
          border: 1px solid rgba(255, 140, 0, 0.2);
          flex-wrap: wrap;
          gap: 1rem;
        }

        .pagination-info {
          color: #6c757d;
          font-size: 0.875rem;
          font-weight: 500;
          letter-spacing: 0.3px;
        }

        .pagination-controls {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          flex-wrap: wrap;
        }

        .pagination-btn {
          min-width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #1a1a1a;
          border: 1px solid #3a3a3a;
          color: #e0e0e0;
          border-radius: 10px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 0 0.75rem;
        }

        .pagination-btn:hover:not(:disabled) {
          background: #ff8c00;
          border-color: #ff8c00;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 140, 0, 0.3);
        }

        .pagination-btn.active {
          background: #ff8c00;
          border-color: #ff8c00;
          color: white;
          box-shadow: 0 4px 12px rgba(255, 140, 0, 0.3);
        }

        .pagination-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .pagination-dots {
          color: #6c757d;
          padding: 0 0.5rem;
          font-weight: 600;
          letter-spacing: 2px;
        }

        .pagination-stats {
          color: #6c757d;
          font-size: 0.875rem;
          font-weight: 500;
          background: rgba(255, 140, 0, 0.1);
          padding: 0.5rem 1rem;
          border-radius: 20px;
          border: 1px solid rgba(255, 140, 0, 0.2);
        }

        @media (max-width: 768px) {
          .professional-pagination {
            flex-direction: column;
            align-items: center;
          }
          
          .pagination-btn {
            min-width: 36px;
            height: 36px;
            font-size: 0.75rem;
          }
          
          .pagination-stats {
            font-size: 0.75rem;
          }
        }

        /* ── User Audit ── */
        .audit-section { }
        .audit-card {
          background: #161616;
          border: 1px solid #252525;
          border-radius: 12px;
          overflow: hidden;
        }
        .audit-card-header {
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px;
          padding: 12px 18px;
          background: #1a1a1a;
          border-bottom: 1px solid #252525;
          font-size: 0.82rem; font-weight: 600; color: #e0e0e0;
        }
        .audit-sub { font-size: 0.72rem; color: #6c757d; font-weight: 400; }
        .audit-badge {
          background: rgba(255,140,0,0.15); color: #ff8c00;
          border: 1px solid rgba(255,140,0,0.3);
          border-radius: 20px; padding: 1px 8px; font-size: 0.7rem; font-weight: 700;
        }
        .audit-badge-warn {
          background: rgba(255,193,7,0.12); color: #ffc107;
          border-color: rgba(255,193,7,0.3);
        }
        .audit-table-wrap { overflow-x: auto; }
        .audit-table {
          width: 100%; border-collapse: collapse; font-size: 0.8rem;
        }
        .audit-table thead th {
          background: #0e0e0e; color: #6c757d;
          padding: 8px 14px; text-align: left;
          font-size: 0.68rem; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;
          border-bottom: 1px solid #252525;
          white-space: nowrap;
        }
        .audit-table tbody tr {
          border-bottom: 1px solid #1e1e1e;
          transition: background 0.12s;
        }
        .audit-table tbody tr:hover { background: #1e1e1e; }
        .audit-table tbody td { padding: 9px 14px; color: #ccc; vertical-align: middle; }
        .audit-num { color: #555; font-size: 0.72rem; width: 32px; }
        .audit-avatar-row { display: flex; align-items: center; gap: 9px; }
        .audit-avatar {
          width: 30px; height: 30px; border-radius: 50%;
          background: rgba(255,140,0,0.15); color: #ff8c00;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.72rem; font-weight: 700; flex-shrink: 0;
        }
        .audit-avatar-warn { background: rgba(255,193,7,0.12); color: #ffc107; }
        .audit-name { font-weight: 500; color: #e0e0e0; }
        .audit-email { color: #888; font-size: 0.78rem; }
        .audit-date { color: #666; font-size: 0.75rem; white-space: nowrap; }
        .audit-role-badge {
          border-radius: 20px; padding: 2px 10px; font-size: 0.68rem; font-weight: 600;
          border: 1px solid; white-space: nowrap;
        }
        .audit-role-admin { background: rgba(255,140,0,0.1); color: #ff8c00; border-color: rgba(255,140,0,0.3); }
        .audit-role-tutor { background: rgba(13,110,253,0.1); color: #6ea8fe; border-color: rgba(13,110,253,0.3); }
        .audit-role-instituteAdmin { background: rgba(111,66,193,0.1); color: #c29bf0; border-color: rgba(111,66,193,0.3); }
        .audit-role-collegeAdmin { background: rgba(32,201,151,0.1); color: #20c997; border-color: rgba(32,201,151,0.3); }
        .audit-status {
          border-radius: 20px; padding: 2px 8px; font-size: 0.67rem; font-weight: 600; text-transform: capitalize;
        }
        .audit-approved { background: rgba(40,167,69,0.12); color: #28a745; border: 1px solid rgba(40,167,69,0.25); }
        .audit-pending  { background: rgba(255,193,7,0.1);  color: #ffc107; border: 1px solid rgba(255,193,7,0.25); }
      `}</style>
    </>
  )
}

export default StudentListPage