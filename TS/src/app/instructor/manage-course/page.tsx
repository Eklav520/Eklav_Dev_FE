import ChoicesFormInput from '@/components/form/ChoicesFormInput'
import PageMetaData from '@/components/PageMetaData'
import { Button, Card, CardBody, CardHeader, Col, Form, Modal, Row } from 'react-bootstrap'
import { FaAngleRight, FaCheckCircle, FaPlus, FaRegEdit, FaSearch, FaTable, FaTimes } from 'react-icons/fa'
import { FaAngleLeft } from 'react-icons/fa6'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface Video {
  video: string
  description: string
}

interface FAQ {
  question: string
  answer: string
}

interface Course {
  _id: string
  title: string
  shortDescription?: string
  category: string
  level?: string
  language?: string
  isFeatured?: string
  duration?: string
  totalLectures?: string
  price?: string
  discountPrice?: string
  description?: string
  features?: string
  image?: string
  videoUrl?: string
  videos: Video[]
  addFAQ: FAQ[]
}

const ManageCoursePage = () => {
  const [courses, setCourses] = useState<Course[]>([])
  const [showModal, setShowModal] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const navigate = useNavigate()

  useEffect(() => {
    const fetchCourses = async () => {
      const res = await fetch(`${baseURL}/courses`)
      const data = await res.json()
      setCourses(data)
    }
    fetchCourses()
  }, [])

  const handleDelete = async (courseId: string) => {
    if (confirm('Are you sure you want to delete this course?')) {
      const res = await fetch(`${baseURL}/courses/${courseId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (res.ok) {
        alert(data.message)
        setCourses(courses.filter((c) => c._id !== courseId))
      } else {
        alert('Failed to delete: ' + data.message)
      }
    }
  }

  const handleEdit = (courseId: string) => {
    const course = courses.find((c) => c._id === courseId)
    if (course) {
      setSelectedCourse(course)
      setShowModal(true)
    }
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!selectedCourse) return
    const { name, value } = e.target
    setSelectedCourse({ ...selectedCourse, [name]: value })
  }

  const handleUpdate = async () => {
    if (!selectedCourse) return
    try {
      const res = await fetch(`${baseURL}/courses/${selectedCourse._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(selectedCourse),
      })
      const data = await res.json()
      if (res.ok) {
        alert(data.message || 'Course updated!')
        // Update course list in state
        setCourses((prevCourses) => prevCourses.map((c) => (c._id === selectedCourse._id ? selectedCourse : c)))
        setShowModal(false)
      } else {
        alert('Update failed: ' + data.message)
      }
    } catch (err) {
      console.error(err)
      alert('An error occurred while updating.')
    }
  }

  const EditModal = () => (
    <Modal show={showModal} onHide={() => setShowModal(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Edit Course</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group>
            <Form.Label>Title</Form.Label>
            <Form.Control type="text" name="title" value={selectedCourse?.title || ''} onChange={handleFormChange} />
          </Form.Group>
          <Form.Group>
            <Form.Label>Short Description</Form.Label>
            <Form.Control as="textarea" rows={2} name="shortDescription" value={selectedCourse?.shortDescription || ''} onChange={handleFormChange} />
          </Form.Group>
          <Form.Group>
            <Form.Label>Category</Form.Label>
            <Form.Control type="text" name="category" value={selectedCourse?.category || ''} onChange={handleFormChange} />
          </Form.Group>
          {/* Add more fields as needed */}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowModal(false)}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleUpdate}>
          Update Course
        </Button>
      </Modal.Footer>
    </Modal>
  )

  return (
    <>
      <PageMetaData title="Manage Course" />
      {showModal && <EditModal />}
      <Card className="border bg-transparent rounded-3">
        <CardHeader className="bg-transparent border-bottom d-flex justify-content-between align-items-center">
          <h3 className="mb-0 text-white fw-semibold">Courses Uploaded List</h3>

          <Button
            variant="primary"
            size="sm"
            className="d-flex align-items-center gap-2 shadow-sm px-3 py-2"
            onClick={() => window.open("/instructor/create-course", "_blank", "noopener,noreferrer")}>
            <FaPlus className="fs-5" />
            <span className="fw-semibold">Create Course</span>
          </Button>
        </CardHeader>

        <CardBody>
          <Row className="g-3 align-items-center justify-content-between mb-4">
            <Col md={8}>
              <form className="rounded position-relative">
                <input className="form-control pe-5 bg-transparent" type="search" placeholder="Search" aria-label="Search" />
                <button
                  className="bg-transparent p-2 position-absolute top-50 end-0 translate-middle-y border-0 text-primary-hover text-reset"
                  type="submit">
                  <FaSearch className="fas fa-search fs-6 " />
                </button>
              </form>
            </Col>
            <Col md={3}>
              <form>
                <ChoicesFormInput className="form-select js-choice border-0 z-index-9 bg-transparent" aria-label=".form-select-sm">
                  <option>Sort by</option>
                  <option>Free</option>
                  <option>Newest</option>
                  <option>Most popular</option>
                  <option>Most Viewed</option>
                </ChoicesFormInput>
              </form>
            </Col>
          </Row>
          <div className="table-responsive border-0">
            <table className="table table-dark-gray align-middle p-4 mb-0 table-hover">
              <thead>
                <tr>
                  <th scope="col" className="border-0 rounded-start">
                    Course Title
                  </th>
                  <th scope="col" className="border-0">
                    Number of Videos
                  </th>
                  <th scope="col" className="border-0 rounded-end">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course._id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="w-60px">
                          <img
                            src={`${baseURL}${course.image}`}
                            alt="avatar"
                            className="rounded"
                            onError={(e) => {
                              // fallback to DiceBear avatar when local image fails
                              e.currentTarget.onerror = null // prevent infinite loop
                              e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(course.title || 'Course')}`
                            }}
                          />
                        </div>
                        <div className="mb-0 ms-2">
                          <h6>{course.title}</h6>
                          <p className="small mb-0">
                            <FaTable className="text-orange me-2" />
                            {course.videos.length} lectures
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>{course.totalLectures || course.videos.length}</td>
                    <td>
                      <Button variant="success-soft" size="sm" className="btn-round me-1 mb-0" onClick={() => handleEdit(course._id)}>
                        <FaRegEdit />
                      </Button>
                      <button className="btn btn-sm btn-danger-soft btn-round mb-0" onClick={() => handleDelete(course._id)}>
                        <FaTimes />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="d-sm-flex justify-content-sm-between align-items-sm-center mt-4 mt-sm-3">
            <p className="mb-0 text-center text-sm-start">Showing 1 to 8 of 20 entries</p>
            <nav className="d-flex justify-content-center mb-0" aria-label="navigation">
              <ul className="pagination pagination-sm pagination-primary-soft d-inline-block d-md-flex rounded mb-0">
                <li className="page-item mb-0">
                  <a className="page-link" href="#" tabIndex={-1}>
                    <FaAngleLeft className="" />
                  </a>
                </li>
                <li className="page-item mb-0">
                  <a className="page-link" href="#">
                    1
                  </a>
                </li>
                <li className="page-item mb-0 active">
                  <a className="page-link" href="#">
                    2
                  </a>
                </li>
                <li className="page-item mb-0">
                  <a className="page-link" href="#">
                    3
                  </a>
                </li>
                <li className="page-item mb-0">
                  <a className="page-link" href="#">
                    <FaAngleRight className="" />
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </CardBody>
      </Card>
    </>
  )
}

export default ManageCoursePage
