import { useEffect, useState } from 'react'
import { Button, Card, CardBody, CardHeader, Col, Row } from 'react-bootstrap'
import { FaBan, FaMapMarkerAlt, FaRegEnvelope, FaSearch } from 'react-icons/fa'
import ChoicesFormInput from '@/components/form/ChoicesFormInput'
import PageMetaData from '@/components/PageMetaData'
import { Modal, Form } from 'react-bootstrap'
import StarRating from './components/StarRating'
import Avatar from 'react-avatar'

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
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const [students, setStudents] = useState<Student[]>([])
  const [showModal, setShowModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackRating, setFeedbackRating] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOption, setSortOption] = useState<string>('')

  const studentsPerPage = 5
  let sortedStudents = [...students]
  if (sortOption === 'college') {
    sortedStudents.sort((a, b) => {
      const collegeA = a.college?.toLowerCase() || ''
      const collegeB = b.college?.toLowerCase() || ''
      return collegeA.localeCompare(collegeB)
    })
  }

 const filteredStudents = sortedStudents.filter((student) => {
  const name = student.fullName?.toLowerCase() || ''
  const email = student.email?.toLowerCase() || ''
  const location = student.location?.toLowerCase() || ''
  const college = student.college?.toLowerCase() || ''

  const term = searchTerm.toLowerCase()
  return (
    name.includes(term) ||
    email.includes(term) ||
    location.includes(term) ||
    college.includes(term)
  )
})

  const indexOfLastStudent = currentPage * studentsPerPage
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent)
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage)

  console.log('students', students)

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await fetch(`${baseURL}/adminProfiles`)
        if (!response.ok) {
          throw new Error('Failed to fetch students')
        }
        const data: Student[] = await response.json()
        setStudents(data)
      } catch (error) {
        console.error('Error fetching students:', error)
      }
    }

    fetchStudents()
  }, [])

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
                  aria-label="Search"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1) // reset to page 1 on search
                  }}
                />
                <button
                  className="bg-transparent p-2 position-absolute top-50 end-0 translate-middle-y border-0 text-primary-hover text-reset"
                  type="submit"
                  onClick={(e) => e.preventDefault()}>
                  <FaSearch className="fas fa-search fs-6" />
                </button>
              </form>
            </Col>
            <Col md={3}>
              <form>
                <ChoicesFormInput
                  className="form-select js-choice border-0 z-index-9 bg-transparent"
                  aria-label=".form-select-sm"
                  onChange={(value: string) => setSortOption(value)}>
                  <option value="">Sort by</option>
                  <option value="free">Free</option>
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="college">College</option>
                </ChoicesFormInput>
              </form>
            </Col>
          </Row>

          <div className="table-responsive border-0">
            <table className="table table-dark-gray align-middle p-4 mb-0 table-hover">
              <thead>
                <tr>
                  <th>Student name</th>
                  <th>College</th>
                  <th>Phone Number</th>
                  <th>Email</th>
                  <th>Feedback</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center">
                      No students found.
                    </td>
                  </tr>
                ) : (
                  currentStudents.map((student) => (
                    <tr key={student._id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="avatar avatar-md">
                            <img
                              src={`${baseURL}${student.profileImage}`}
                              alt="avatar"
                              className="rounded"
                              onError={(e) => {
                                // fallback to DiceBear avatar when local image fails
                                e.currentTarget.onerror = null // prevent infinite loop
                                e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(student.fullName || 'User')}`
                              }}
                            />
                            {/* <img src={`http://localhost:3000${student.profileImage}`} className="rounded" alt="avatar" /> */}
                          </div>
                          <div className="ms-2">
                            <h6 className="mb-0">{student.fullName}</h6>
                            <span className="text-body small">
                              <FaMapMarkerAlt className="me-1" />
                              {student.location}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        {student.college}
                       {/*  <h6 className="mb-0">{student.progress}%</h6>
                        <div className="progress progress-sm bg-primary bg-opacity-10">
                          <div
                            className="progress-bar bg-primary"
                            role="progressbar"
                            style={{ width: `${student.progress}%` }}
                            aria-valuenow={student.progress}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          />
                        </div> */}
                      </td>
                      <td>{student.phoneNo}</td>
                      <td>{student.email}</td>
                      <td>
                        <Button
                          variant="success-soft"
                          className="btn-round me-2 mb-0"
                          title="Message"
                          onClick={() => {
                            setSelectedStudent(student)
                            setShowModal(true)
                          }}>
                          <FaRegEnvelope />
                        </Button>
                        {/* <Button variant="danger-soft" className="btn-round mb-0" title="Block">
                          <FaBan />
                        </Button> */}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="d-flex justify-content-between align-items-center mt-4">
              <Button variant="outline-primary" disabled={currentPage === 1} onClick={() => setCurrentPage((prev) => prev - 1)}>
                Previous
              </Button>

              <div>
                Page {currentPage} of {totalPages}
              </div>

              <Button variant="outline-primary" disabled={currentPage === totalPages} onClick={() => setCurrentPage((prev) => prev + 1)}>
                Next
              </Button>
            </div>

            <Modal show={showModal} onHide={() => setShowModal(false)}>
              <Modal.Header closeButton>
                <Modal.Title>Send Feedback to {selectedStudent?.fullName}</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Form
                  onSubmit={async (e) => {
                    e.preventDefault()
                    if (!selectedStudent) return

                    try {
                      const response = await fetch(`${baseURL}/adminProfiles/${selectedStudent._id}/feedback`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          feedback: feedbackText,
                          rating: feedbackRating,
                        }),
                      })

                      if (!response.ok) throw new Error('Failed to submit feedback')

                      alert('Feedback sent successfully!')
                      setFeedbackText('')
                      setFeedbackRating(0)
                      setShowModal(false)
                    } catch (err) {
                      console.error(err)
                      alert('Error sending feedback.')
                    }
                  }}>
                  <Form.Group className="mb-3">
                    <Form.Label>Feedback</Form.Label>
                    <Form.Control as="textarea" rows={3} value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} required />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Rating</Form.Label>
                    <StarRating rating={feedbackRating} setRating={setFeedbackRating} />
                  </Form.Group>

                  <div className="d-flex justify-content-end">
                    <Button variant="secondary" onClick={() => setShowModal(false)} className="me-2">
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary">
                      Send
                    </Button>
                  </div>
                </Form>
              </Modal.Body>
            </Modal>
          </div>
        </CardBody>
      </Card>
    </>
  )
}

export default StudentListPage
