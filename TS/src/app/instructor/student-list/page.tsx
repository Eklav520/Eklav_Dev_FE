import { useEffect, useState } from 'react'
import { Button, Card, CardBody, CardHeader, Col, Row } from 'react-bootstrap'
import { FaMapMarkerAlt, FaRegEnvelope, FaSearch } from 'react-icons/fa'
import ChoicesFormInput from '@/components/form/ChoicesFormInput'
import PageMetaData from '@/components/PageMetaData'
import { Modal, Form } from 'react-bootstrap'
import StarRating from './components/StarRating'
import { useAuthContext } from '@/context/useAuthContext'

interface Student {
  _id: string
  fullName: string
  profileImage?: string
  location: string
  progress: number
  phoneNo: string
  email: string
  college?: string
}

const StudentListPage: React.FC = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()

  const [students, setStudents] = useState<Student[]>([])
  const [showModal, setShowModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackRating, setFeedbackRating] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOption, setSortOption] = useState<string>('')

  const [college, setCollege] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)

  const studentsPerPage = 5

  /* ============================
     FETCH PROFILE (college)
  ============================ */
  const fetchProfile = async () => {
    try {
      const res = await fetch(`${baseURL}/profile`, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      })

      if (!res.ok) throw new Error('Failed to fetch profile')

      const data = await res.json()
      setCollege(data.college || null)
      setRole(data.role || null)
    } catch (err) {
      console.error('Failed to load profile', err)
    }
  }

  /* ============================
     FETCH STUDENTS (by college)
  ============================ */
  const fetchStudents = async (collegeName: string) => {
    try {
      const res = await fetch(
        `${baseURL}/adminProfiles?college=${encodeURIComponent(collegeName)}`,
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        }
      )

      if (!res.ok) throw new Error('Failed to fetch students')

      const data: Student[] = await res.json()
      setStudents(data)
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }

  /* ============================
     INITIAL LOAD
  ============================ */
  useEffect(() => {
    if (user?.token) {
      fetchProfile()
    }
  }, [user?.token])

  useEffect(() => {
    if (college) {
      fetchStudents(college)
    }
  }, [college])

  /* ============================
     SORT + FILTER + PAGINATION
  ============================ */
  let sortedStudents = [...students]
  if (sortOption === 'college') {
    sortedStudents.sort((a, b) =>
      (a.college || '').localeCompare(b.college || '')
    )
  }

  const filteredStudents = sortedStudents.filter(student => {
    const term = searchTerm.toLowerCase()
    return (
      student.fullName?.toLowerCase().includes(term) ||
      student.email?.toLowerCase().includes(term) ||
      student.location?.toLowerCase().includes(term) ||
      student.college?.toLowerCase().includes(term)
    )
  })

  const indexOfLastStudent = currentPage * studentsPerPage
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage
  const currentStudents = filteredStudents.slice(
    indexOfFirstStudent,
    indexOfLastStudent
  )
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage)

  return (
    <>
      <PageMetaData title="Student List" />

      <Card className="border bg-transparent rounded-3">
        <CardHeader className="bg-transparent border-bottom">
          <h3 className="mb-0">My Students List</h3>
        </CardHeader>

        <CardBody>
          <Row className="g-3 align-items-center justify-content-between mb-4">
            <Col md={8}>
              <form className="rounded position-relative">
                <input
                  className="form-control pe-5 bg-transparent"
                  type="search"
                  placeholder="Search by name, email or location"
                  value={searchTerm}
                  onChange={e => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                />
                <button
                  className="bg-transparent p-2 position-absolute top-50 end-0 translate-middle-y border-0"
                  onClick={e => e.preventDefault()}
                >
                  <FaSearch />
                </button>
              </form>
            </Col>

            <Col md={3}>
              <ChoicesFormInput
                className="form-select bg-transparent"
                onChange={(value: string) => setSortOption(value)}
              >
                <option value="">Sort by</option>
                <option value="college">College</option>
              </ChoicesFormInput>
            </Col>
          </Row>

          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Student name</th>
                  <th>College</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Feedback</th>
                </tr>
              </thead>
              <tbody>
                {currentStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center">
                      No students found
                    </td>
                  </tr>
                ) : (
                  currentStudents.map(student => (
                    <tr key={student._id}>
                      <td>
                        <strong>{student.fullName}</strong>
                        <div className="small text-muted">
                          <FaMapMarkerAlt /> {student.location}
                        </div>
                      </td>
                      <td>{student.college}</td>
                      <td>{student.phoneNo}</td>
                      <td>{student.email}</td>
                      <td>
                        <Button
                          variant="success-soft"
                          onClick={() => {
                            setSelectedStudent(student)
                            setShowModal(true)
                          }}
                        >
                          <FaRegEnvelope />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div className="d-flex justify-content-between mt-3">
              <Button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                Previous
              </Button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <Button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>

          {/* FEEDBACK MODAL */}
          <Modal show={showModal} onHide={() => setShowModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>
                Send Feedback to {selectedStudent?.fullName}
              </Modal.Title>
            </Modal.Header>

            <Modal.Body>
              <Form
                onSubmit={async e => {
                  e.preventDefault()
                  if (!selectedStudent) return

                  await fetch(
                    `${baseURL}/adminProfiles/${selectedStudent._id}/feedback`,
                    {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        feedback: feedbackText,
                        rating: feedbackRating,
                      }),
                    }
                  )

                  setFeedbackText('')
                  setFeedbackRating(0)
                  setShowModal(false)
                }}
              >
                <Form.Group className="mb-3">
                  <Form.Label>Feedback</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={feedbackText}
                    onChange={e => setFeedbackText(e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Rating</Form.Label>
                  <StarRating
                    rating={feedbackRating}
                    setRating={setFeedbackRating}
                  />
                </Form.Group>

                <div className="text-end">
                  <Button variant="secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="ms-2">
                    Send
                  </Button>
                </div>
              </Form>
            </Modal.Body>
          </Modal>
        </CardBody>
      </Card>
    </>
  )
}

export default StudentListPage
