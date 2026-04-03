import { useEffect, useState } from 'react'
import { Button, Card, CardBody, CardHeader, Col, Row, Modal, Form, Badge } from 'react-bootstrap'
import { FaMapMarkerAlt, FaRegEnvelope, FaSearch, FaDownload, FaPhone, FaGraduationCap, FaStar, FaFilter, FaEye, FaChevronLeft, FaChevronRight, FaSpinner, FaUserGraduate, FaBuilding, FaEnvelope, FaPhoneAlt, FaInfoCircle, FaCheckCircle, FaTimesCircle, FaAngleDoubleLeft, FaAngleDoubleRight } from 'react-icons/fa'
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
  onPageChange: (page: number) => void
}> = ({ currentPage, totalPages, onPageChange }) => {
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
        Showing {((currentPage - 1) * 10) + 1} - {Math.min(currentPage * 10, totalPages * 10)} of {totalPages * 10}+ entries
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
      <Modal.Header closeButton className="bg-dark border-secondary">
        <Modal.Title className="text-white">
          <div className="d-flex align-items-center gap-3">
            {student.profileImage ? (
              <img 
                src={`${baseURL}${student.profileImage}`} 
                alt={student.fullName}
                className="rounded-circle"
                style={{ width: 48, height: 48, objectFit: 'cover' }}
              />
            ) : (
              <div className="rounded-circle bg-orange text-white d-flex align-items-center justify-content-center" style={{ width: 48, height: 48, fontSize: 18, fontWeight: 600 }}>
                {getInitials(student.fullName)}
              </div>
            )}
            <div>
              <h4 className="mb-0 text-white">{student.fullName}</h4>
              <div className="mt-1">{getStatusBadge(student.status || 'pending')}</div>
            </div>
          </div>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="bg-dark text-white">
        <div className="row g-4">
          {/* Contact Information */}
          <div className="col-md-6">
            <div className="bg-dark-lighter p-3 rounded-3 border border-secondary">
              <h6 className="text-orange mb-3">
                <FaInfoCircle className="me-2" />
                Contact Information
              </h6>
              <div className="mb-2">
                <FaEnvelope className="text-muted me-2" />
                <span>{student.email}</span>
              </div>
              <div className="mb-2">
                <FaPhoneAlt className="text-muted me-2" />
                <span>{student.phoneNo}</span>
              </div>
              <div>
                <FaMapMarkerAlt className="text-muted me-2" />
                <span>{student.college || 'Not specified'}</span>
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div className="col-md-6">
            <div className="bg-dark-lighter p-3 rounded-3 border border-secondary">
              <h6 className="text-orange mb-3">
                <FaGraduationCap className="me-2" />
                Academic Information
              </h6>
              {student.batch && (
                <div className="mb-2">
                  <span className="text-muted">Batch:</span>
                  <span className="ms-2">{student.batch}</span>
                </div>
              )}
              {student.department && (
                <div className="mb-2">
                  <span className="text-muted">Department:</span>
                  <span className="ms-2">{student.department}</span>
                </div>
              )}
              {student.joiningYear && (
                <div>
                  <span className="text-muted">Joining Year:</span>
                  <span className="ms-2">{student.joiningYear}</span>
                </div>
              )}
            </div>
          </div>

          {/* Assessment Scores */}
          {student.assessmentScores && (
            <div className="col-12">
              <div className="bg-dark-lighter p-3 rounded-3 border border-secondary">
                <h6 className="text-orange mb-3">
                  <MdAssessment className="me-2" />
                  Assessment Scores
                </h6>
                <div className="row g-3">
                  <div className="col-3 text-center">
                    <div className="bg-dark rounded-3 p-2">
                      <div className="small text-muted">Quiz</div>
                      <div className="h4 mb-0 text-orange">{student.assessmentScores.quizScore}</div>
                    </div>
                  </div>
                  <div className="col-3 text-center">
                    <div className="bg-dark rounded-3 p-2">
                      <div className="small text-muted">Code</div>
                      <div className="h4 mb-0 text-orange">{student.assessmentScores.codeChallengeScore}</div>
                    </div>
                  </div>
                  <div className="col-3 text-center">
                    <div className="bg-dark rounded-3 p-2">
                      <div className="small text-muted">Technical</div>
                      <div className="h4 mb-0 text-orange">{student.assessmentScores.technicalRoundScore}</div>
                    </div>
                  </div>
                  <div className="col-3 text-center">
                    <div className="bg-dark rounded-3 p-2">
                      <div className="small text-muted">HR</div>
                      <div className="h4 mb-0 text-orange">{student.assessmentScores.hrRoundScore}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Skills */}
          {student.skills && student.skills.length > 0 && (
            <div className="col-12">
              <div className="bg-dark-lighter p-3 rounded-3 border border-secondary">
                <h6 className="text-orange mb-3">Skills</h6>
                <div className="d-flex flex-wrap gap-2">
                  {student.skills.map((skill, idx) => (
                    <Badge key={idx} bg="dark" className="border border-secondary px-3 py-2">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* About */}
          {student.about && (
            <div className="col-12">
              <div className="bg-dark-lighter p-3 rounded-3 border border-secondary">
                <h6 className="text-orange mb-3">About</h6>
                <p className="mb-0 text-muted">{student.about}</p>
              </div>
            </div>
          )}

          {/* Feedback History */}
          {student.feedback && student.feedback.length > 0 && (
            <div className="col-12">
              <div className="bg-dark-lighter p-3 rounded-3 border border-secondary">
                <h6 className="text-orange mb-3">
                  <FaStar className="me-2" />
                  Feedback History {averageRating && <Badge bg="warning" className="ms-2 text-dark">{averageRating} ★</Badge>}
                </h6>
                <div className="feedback-list" style={{ maxHeight: 200, overflowY: 'auto' }}>
                  {student.feedback.map((fb, idx) => (
                    <div key={fb._id} className="border-bottom border-secondary pb-2 mb-2">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          {[...Array(5)].map((_, i) => (
                            <FaStar key={i} className={i < fb.rating ? 'text-warning' : 'text-secondary'} size={12} />
                          ))}
                        </div>
                        <small className="text-muted">{new Date(fb.date).toLocaleDateString()}</small>
                      </div>
                      <p className="small mb-0 mt-1">{fb.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Feedback Form */}
        <div className="mt-4 pt-3 border-top border-secondary">
          <h6 className="text-orange mb-3">Send New Feedback</h6>
          <Form onSubmit={handleSubmitFeedback}>
            <Form.Group className="mb-3">
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Write your feedback here..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                required
                className="bg-dark text-white border-secondary"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="text-muted">Rating</Form.Label>
              <div className="d-flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FaStar
                    key={star}
                    className="cursor-pointer"
                    size={24}
                    color={star <= feedbackRating ? '#ff8c00' : '#6c757d'}
                    onClick={() => setFeedbackRating(star)}
                    style={{ cursor: 'pointer' }}
                  />
                ))}
              </div>
            </Form.Group>
            <div className="text-end">
              <Button variant="secondary" onClick={onHide} className="me-2">
                Cancel
              </Button>
              <Button type="submit" className="bg-orange border-orange" disabled={isSubmitting}>
                {isSubmitting ? <FaSpinner className="spinner" /> : 'Send Feedback'}
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
  const [sortBy, setSortBy] = useState<string>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [currentPage, setCurrentPage] = useState(1)
  const [college, setCollege] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [contactMessage, setContactMessage] = useState('')
  const [isSendingContact, setIsSendingContact] = useState(false)

  const studentsPerPage = 10

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
    
    return matchesSearch && matchesStatus && matchesBatch && matchesCollege
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

  return (
    <>
      <PageMetaData title="Student Management | Admin Dashboard" />

      <div className="admin-dashboard">
        {/* Header Section */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <h2 className="text-white mb-1">Student Management</h2>
            <p className="text-muted mb-0">
              <FaUserGraduate className="me-1" />
              Total Students: <span className="text-orange fw-bold">{students.length}</span>
              {filteredStudents.length !== students.length && ` (Filtered: ${filteredStudents.length})`}
            </p>
          </div>
          <div className="d-flex gap-2">
            <Button 
              variant="outline-orange" 
              onClick={handleDownloadExcel}
              disabled={filteredStudents.length === 0}
            >
              <FaDownload className="me-2" />
              Export Excel
            </Button>
            <Button 
              variant="orange" 
              onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
            >
              {viewMode === 'table' ? 'Grid View' : 'Table View'}
            </Button>
          </div>
        </div>

        {/* Filters Section */}
        <Card className="bg-dark border-secondary mb-4">
          <CardBody>
            <Row className="g-3 align-items-center">
              <Col md={3}>
                <div className="position-relative">
                  <FaSearch className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                  <input
                    type="text"
                    className="form-control bg-dark-lighter border-secondary text-white ps-5"
                    placeholder="Search by name, email, phone..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setCurrentPage(1)
                    }}
                  />
                </div>
              </Col>
              <Col md={2}>
                <select
                  className="form-select bg-dark-lighter border-secondary text-white"
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value)
                    setCurrentPage(1)
                  }}
                >
                  <option value="all">All Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </Col>
              <Col md={2}>
                <select
                  className="form-select bg-dark-lighter border-secondary text-white"
                  value={filterBatch}
                  onChange={(e) => {
                    setFilterBatch(e.target.value)
                    setCurrentPage(1)
                  }}
                >
                  <option value="all">All Batches</option>
                  {batches.map(batch => (
                    <option key={batch} value={batch}>{batch}</option>
                  ))}
                </select>
              </Col>
              <Col md={3}>
                <select
                  className="form-select bg-dark-lighter border-secondary text-white"
                  value={filterCollege}
                  onChange={(e) => {
                    setFilterCollege(e.target.value)
                    setCurrentPage(1)
                  }}
                >
                  <option value="all">All Colleges</option>
                  {colleges.map(col => (
                    <option key={col} value={col}>{col.length > 30 ? col.substring(0, 30) + '...' : col}</option>
                  ))}
                </select>
              </Col>
              <Col md={2}>
                <div className="d-flex gap-2">
                  <select
                    className="form-select bg-dark-lighter border-secondary text-white"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="name">Sort by Name</option>
                    <option value="date">Sort by Date</option>
                    <option value="status">Sort by Status</option>
                    <option value="batch">Sort by Batch</option>
                    <option value="college">Sort by College</option>
                  </select>
                  <Button
                    variant="outline-secondary"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="d-flex align-items-center"
                  >
                    {sortOrder === 'asc' ? <BsSortUp /> : <BsSortDown />}
                  </Button>
                </div>
              </Col>
            </Row>
            <Row className="mt-3">
              <Col>
                <div className="text-end">
                  <Button variant="outline-secondary" size="sm" onClick={() => {
                    setSearchTerm('')
                    setFilterStatus('all')
                    setFilterBatch('all')
                    setFilterCollege('all')
                    setSortBy('name')
                    setSortOrder('asc')
                    setCurrentPage(1)
                  }}>
                    <FaFilter className="me-1" /> Reset All Filters
                  </Button>
                </div>
              </Col>
            </Row>
          </CardBody>
        </Card>

        {/* Students List */}
        {viewMode === 'table' ? (
          <Card className="bg-dark border-secondary">
            <div className="table-responsive">
              <table className="table table-dark table-hover mb-0">
                <thead className="border-bottom border-secondary">
                  <tr>
                    <th className="text-muted">Student</th>
                    <th className="text-muted">College</th>
                    <th className="text-muted">Batch</th>
                    <th className="text-muted">Contact</th>
                    <th className="text-muted">Status</th>
                    <th className="text-muted">Joined</th>
                    <th className="text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center text-muted py-5">
                        No students found
                      </td>
                    </tr>
                  ) : (
                    paginatedStudents.map(student => (
                      <tr key={student._id} className="border-bottom border-secondary">
                        <td>
                          <div className="d-flex align-items-center gap-3">
                            {student.profileImage ? (
                              <img 
                                src={`${baseURL}${student.profileImage}`} 
                                alt={student.fullName}
                                className="rounded-circle"
                                style={{ width: 40, height: 40, objectFit: 'cover' }}
                              />
                            ) : (
                              <div className="rounded-circle bg-orange text-white d-flex align-items-center justify-content-center" style={{ width: 40, height: 40, fontSize: 14, fontWeight: 600 }}>
                                {student.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                              </div>
                            )}
                            <div>
                              <div className="text-white fw-medium">{student.fullName}</div>
                              <div className="small text-muted">{student.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="text-white small">{student.college ? (student.college.length > 35 ? student.college.substring(0, 35) + '...' : student.college) : '-'}</div>
                        </td>
                        <td>
                          {student.batch && <Badge bg="secondary">{student.batch}</Badge>}
                        </td>
                        <td>
                          <div className="text-white">{student.phoneNo}</div>
                        </td>
                        <td>
                          <Badge bg={student.status === 'approved' ? 'success' : student.status === 'pending' ? 'warning' : 'danger'}>
                            {student.status || 'pending'}
                          </Badge>
                        </td>
                        <td>
                          <small className="text-muted">
                            {new Date(student.createdAt).toLocaleDateString()}
                          </small>
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <Button
                              variant="outline-orange"
                              size="sm"
                              onClick={() => {
                                setSelectedStudent(student)
                                setShowDetailsModal(true)
                              }}
                            >
                              <FaEye />
                            </Button>
                            <Button
                              variant="orange"
                              size="sm"
                              onClick={() => {
                                setSelectedStudent(student)
                                setShowContactModal(true)
                              }}
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
                  No students found
                </div>
              </Col>
            ) : (
              paginatedStudents.map(student => (
                <Col key={student._id} lg={4} md={6}>
                  <StudentCard 
                    student={student}
                    onViewDetails={(s) => {
                      setSelectedStudent(s)
                      setShowDetailsModal(true)
                    }}
                    onContact={(s) => {
                      setSelectedStudent(s)
                      setShowContactModal(true)
                    }}
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
      <Modal show={showContactModal} onHide={() => setShowContactModal(false)} centered className="contact-modal">
        <Modal.Header closeButton className="bg-dark border-secondary">
          <Modal.Title className="text-white">
            <FaPhone className="text-orange me-2" />
            Contact {selectedStudent?.fullName}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark text-white">
          <div className="mb-3 p-3 bg-dark-lighter rounded-3">
            <div className="mb-2">
              <strong>Phone:</strong> <a href={`tel:${selectedStudent?.phoneNo}`} className="text-orange text-decoration-none">{selectedStudent?.phoneNo}</a>
            </div>
            <div>
              <strong>Email:</strong> <a href={`mailto:${selectedStudent?.email}`} className="text-orange text-decoration-none">{selectedStudent?.email}</a>
            </div>
          </div>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Message</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                placeholder="Type your message here..."
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                className="bg-dark-lighter text-white border-secondary"
              />
            </Form.Group>
            <div className="d-flex gap-2 justify-content-end">
              <Button variant="secondary" onClick={() => setShowContactModal(false)}>
                Cancel
              </Button>
              <Button 
                variant="orange" 
                onClick={handleSendContact}
                disabled={isSendingContact || !contactMessage.trim()}
              >
                {isSendingContact ? <FaSpinner className="spinner-grow spinner-grow-sm me-1" /> : null}
                Send Message
              </Button>
            </div>
          </Form>
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
        .modal-content {
          background-color: #1a1a1a;
        }
        .modal-header {
          border-bottom-color: #2a2a2a;
        }
        .modal-footer {
          border-top-color: #2a2a2a;
        }
        .table-dark {
          background-color: #1a1a1a;
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
      `}</style>
    </>
  )
}

export default StudentListPage