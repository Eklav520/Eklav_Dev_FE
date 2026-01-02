import React, { useEffect, useState } from 'react'
import ChoicesFormInput from '@/components/form/ChoicesFormInput'
import PageMetaData from '@/components/PageMetaData'
import { Button, Card, CardBody, CardHeader, Col, Row } from 'react-bootstrap'
import { BsPlayCircle } from 'react-icons/bs'
import { FaAngleLeft, FaAngleRight, FaSearch, FaStar, FaRegStar, FaUsers } from 'react-icons/fa'
import { useAuthContext } from '@/context/useAuthContext'

type CourseRating = {
  averageRating: number
  totalRatings: number
}

type EnrolledCourse = {
  name: string
  image: string
  totalLectures: number
  completedLectures: number
  _id: string
  userRating?: number
  courseRating?: CourseRating
}

type CourseType = {
  _id: string
  completedLectures: number
  image: string
  name: string
  totalLectures: number
  userRating?: number
  courseRating?: CourseRating
}

// Rating Component
type RatingProps = {
  rating: number
  onRatingChange?: (rating: number) => void
  readonly?: boolean
  size?: number
  showNumber?: boolean
}

const Rating = ({ rating, onRatingChange, readonly = false, size = 16, showNumber = false }: RatingProps) => {
  const handleRatingClick = (newRating: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(newRating)
    }
  }

  return (
    <div className="d-flex align-items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onClick={() => handleRatingClick(star)}
          style={{
            cursor: readonly ? 'default' : 'pointer',
            fontSize: `${size}px`,
            color: '#ffc107',
          }}
          className={!readonly ? 'hover-scale' : ''}>
          {star <= rating ? <FaStar /> : <FaRegStar />}
        </span>
      ))}
      {showNumber && rating > 0 && <span className="ms-2 text-muted small">({rating.toFixed(1)})</span>}
    </div>
  )
}

// Average Rating Display Component
const AverageRating = ({ courseRating }: { courseRating?: CourseRating }) => {
  if (!courseRating || courseRating.totalRatings === 0) {
    return <div className="text-muted small">No ratings yet</div>
  }

  return (
    <div className="d-flex align-items-center">
      <Rating rating={courseRating.averageRating} readonly size={12} showNumber />
      <div className="ms-2 d-flex align-items-center text-muted small">
        <FaUsers className="me-1" size={10} />
        <span>({courseRating.totalRatings})</span>
      </div>
    </div>
  )
}

// CourseData Component
const CourseData = ({
  completedLectures,
  image,
  name,
  totalLectures,
  _id,
  userRating,
  courseRating,
  onRateCourse,
}: CourseType & { onRateCourse: (course: CourseType) => void }) => {
  let status = 'Not Started'
  if (completedLectures > 0 && completedLectures < 99) status = 'In Progress'
  else if (completedLectures === 100) status = 'Completed'

  const progressPercent = Math.round(completedLectures)

  return (
    <tr>
      <td>
        <div className="d-flex align-items-center">
          <div className="w-100px">
            <img
              src={image}
              alt="course image"
              className="rounded"
              style={{ width: '60px', height: 'auto', borderRadius: '4px' }}
              onError={(e) => {
                e.currentTarget.onerror = null
                e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'User')}`
              }}
            />
          </div>
          <div className="mb-0 ms-2">
            <h6>
              <a href="#">{name}</a>
            </h6>
            {/* Display average rating below course name */}
            <AverageRating courseRating={courseRating} />
          </div>
        </div>
      </td>

      <td>{totalLectures}</td>
      <td>
        <div className="mb-1">{progressPercent}%</div>
        <div className="progress" style={{ height: '8px' }}>
          <div
            className={`progress-bar ${progressPercent === 100 ? 'bg-success' : progressPercent >= 50 ? 'bg-info' : 'bg-warning'}`}
            role="progressbar"
            style={{ width: `${progressPercent}%` }}
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}></div>
        </div>
      </td>

      <td>{status}</td>

      {/* Your Rating Column */}
      <td>
        {userRating && userRating > 0 ? (
          <div className="d-flex align-items-center">
            <Rating rating={userRating} readonly size={14} />
            <span className="ms-2 text-muted small">({userRating}.0)</span>
            <Button
              variant="outline-secondary"
              size="sm"
              className="ms-2"
              onClick={() => onRateCourse({ _id, name, image, totalLectures, completedLectures, userRating, courseRating })}>
              Edit
            </Button>
          </div>
        ) : (
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => onRateCourse({ _id, name, image, totalLectures, completedLectures, userRating, courseRating })}>
            Rate Course
          </Button>
        )}
      </td>

      <td>
        <a href={`/pages/course/detail-adv/${_id}`} target="_blank" rel="noopener noreferrer">
          <Button variant="primary-soft" size="sm" className="me-1 mb-1 mb-md-0 icons-center">
            <BsPlayCircle className="me-1" /> Play
          </Button>
        </a>
      </td>
    </tr>
  )
}

// Rating Modal Component
const RatingModal = ({
  show,
  course,
  onClose,
  onSubmit,
}: {
  show: boolean
  course: CourseType | null
  onClose: () => void
  onSubmit: (courseId: string, rating: number, feedback: string) => void
}) => {
  const [currentRating, setCurrentRating] = useState(0)
  const [feedback, setFeedback] = useState('')

  // Reset form when course changes or modal opens
  useEffect(() => {
    if (course) {
      setCurrentRating(course.userRating || 0)
      setFeedback('')
    }
  }, [course])

  const handleSubmit = () => {
    if (course && currentRating > 0) {
      onSubmit(course._id, currentRating, feedback)
      onClose()
    }
  }

  if (!show || !course) return null

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Rate this Course</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="text-center mb-3">
              <h6>{course.name}</h6>

              {/* Show current average rating if available */}
              {course.courseRating && course.courseRating.totalRatings > 0 && (
                <div className="mb-3 p-2 bg-light rounded">
                  <div className="small text-muted">Current Course Rating</div>
                  <div className="d-flex align-items-center justify-content-center">
                    <Rating rating={course.courseRating.averageRating} readonly size={18} showNumber />
                    <span className="ms-2 small text-muted">
                      ({course.courseRating.totalRatings} rating{course.courseRating.totalRatings !== 1 ? 's' : ''})
                    </span>
                  </div>
                </div>
              )}

              <p>How would you rate this course?</p>
              <Rating rating={currentRating} onRatingChange={setCurrentRating} size={24} />
              {currentRating > 0 && (
                <p className="mt-2 text-muted">
                  You selected: {currentRating} star{currentRating !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            <div className="mt-3">
              <label htmlFor="feedback" className="form-label">
                Optional Feedback <span className="text-muted">(max 500 characters)</span>
              </label>
              <textarea
                id="feedback"
                className="form-control"
                rows={3}
                placeholder="Share your experience with this course..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                maxLength={500}
              />
              <div className="form-text text-end">{feedback.length}/500 characters</div>
            </div>
          </div>
          <div className="modal-footer">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={currentRating === 0}>
              {currentRating > 0 ? 'Update Rating' : 'Submit Rating'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

const CourseListPage = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [ratingModal, setRatingModal] = useState<{
    show: boolean
    course: CourseType | null
  }>({
    show: false,
    course: null,
  })

  const itemsPerPage = 5

  const { user } = useAuthContext()
  const token = user?.token

  const filteredCourses = enrolledCourses.filter((course) => course.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage)
  const currentCourses = filteredCourses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Handle opening rating modal
  const handleRateCourse = (course: CourseType) => {
    setRatingModal({
      show: true,
      course,
    })
  }

  // Handle closing rating modal
  const handleCloseRatingModal = () => {
    setRatingModal({
      show: false,
      course: null,
    })
  }

  // Handle rating submission
  const handleRatingSubmit = async (courseId: string, rating: number, feedback: string) => {
    try {
      const response = await fetch(`${baseURL}/courses/${courseId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating: rating,
          feedback: feedback,
        }),
      })

      if (response.ok) {
        const result = await response.json()

        // Refresh the course data to get updated average ratings
        await fetchEnrolledCourses()

        console.log('Rating submitted successfully')
      } else {
        const error = await response.json()
        console.error('Failed to submit rating:', error.message)
        alert(`Failed to submit rating: ${error.message}`)
      }
    } catch (error) {
      console.error('Error submitting rating:', error)
      alert('Error submitting rating. Please try again.')
    }
  }

  const fetchEnrolledCourses = async () => {
    try {
      const [enrollRes, ratingsRes] = await Promise.all([
        fetch(`${baseURL}/enrollments/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${baseURL}/courses/ratings/my-ratings`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      if (!enrollRes.ok) throw new Error('Failed to fetch enrollments')
      if (!ratingsRes.ok) throw new Error('Failed to fetch ratings')

      const enrolledData = await enrollRes.json()
      const ratingsData = await ratingsRes.json()

      console.log('📊 Raw API Response:', enrolledData) // Debug log

      // Create a quick lookup for user's own ratings
      const ratingsMap: Record<string, number> = {}
      ratingsData.forEach((rating: any) => {
        ratingsMap[rating.courseId] = rating.rating
      })

      // ✅ Use backend-provided courseProgress (already percentage)
      const formatted = enrolledData
        .filter((enroll: any) => enroll.courseId)
        .map((enroll: any) => {
          const courseId = enroll.courseId._id
          const totalLectures = Number(enroll.courseId.totalLectures || 0)

          // ✅ Use the courseProgress from backend which is already calculated correctly
          const courseProgress = Number(enroll.courseProgress || 0)
          const userRating = ratingsMap[courseId]

          const courseImage = enroll.courseId.image?.startsWith('http') ? enroll.courseId.image : `${baseURL}/uploads/${enroll.courseId.image}`

          console.log(`🎯 Course: ${enroll.courseId.title}, Progress: ${courseProgress}%`) // Debug log

          return {
            _id: courseId,
            name: enroll.courseId.title,
            image: courseImage,
            totalLectures,
            completedLectures: courseProgress, // Use the backend-calculated progress
            userRating,
            courseRating: enroll.courseRating || {
              averageRating: 0,
              totalRatings: 0,
            },
          }
        })

      console.log('📝 Formatted Courses:', formatted) // Debug log
      setEnrolledCourses(formatted)
    } catch (error) {
      console.error('Failed to fetch data:', error)
      setError('Failed to fetch data. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      fetchEnrolledCourses()
    }
  }, [token, baseURL])

  if (loading) return <p>Loading enrolled courses...</p>
  if (error) return <p>Error: {error}</p>
  if (enrolledCourses.length === 0) return <p>No enrolled courses found.</p>

  return (
    <>
      <PageMetaData title="Course List Student" />

      {/* Rating Modal */}
      <RatingModal show={ratingModal.show} course={ratingModal.course} onClose={handleCloseRatingModal} onSubmit={handleRatingSubmit} />

      <Card className="bg-transparent border rounded-3">
        <CardHeader className="bg-transparent border-bottom">
          <Row className="align-items-center">
            <Col md={6}>
              <h3 className="mb-0">Enrolled Courses</h3>
            </Col>
            <Col md={6}>
              <form
                className="rounded position-relative"
                onSubmit={(e) => {
                  e.preventDefault()
                }}>
                <input
                  className="form-control pe-5 bg-transparent"
                  type="search"
                  placeholder="Search"
                  aria-label="Search"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                />
                <button
                  className="bg-transparent p-2 position-absolute top-50 end-0 translate-middle-y border-0 text-primary-hover text-reset"
                  type="submit">
                  <FaSearch className="fs-6" />
                </button>
              </form>
            </Col>
          </Row>
        </CardHeader>
        <CardBody>
          <Row className="g-3 align-items-center justify-content-between mb-4">
            <Col md={8}></Col>
          </Row>

          <div className="table-responsive border-0">
            <table className="table table-dark-gray align-middle p-4 mb-0 table-hover">
              <thead>
                <tr>
                  <th scope="col" className="border-0 rounded-start">
                    Course Title
                  </th>
                  <th scope="col" className="border-0">
                    Total Lectures
                  </th>
                  <th scope="col" className="border-0">
                    Total Progress
                  </th>
                  <th scope="col" className="border-0">
                    Status
                  </th>
                  <th scope="col" className="border-0">
                    Your Rating
                  </th>
                  <th scope="col" className="border-0 rounded-end">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentCourses.map((item, idx) => (
                  <CourseData key={idx} {...item} onRateCourse={handleRateCourse} />
                ))}
              </tbody>
            </table>
          </div>

          <div className="d-sm-flex justify-content-sm-between align-items-sm-center mt-4 mt-sm-3">
            <p className="mb-0 text-center text-sm-start">Showing {filteredCourses.length} entries</p>
            <nav aria-label="Page navigation">
              <ul className="pagination pagination-sm pagination-primary-soft d-inline-block d-md-flex rounded mb-0">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
                    <FaAngleLeft className="icons-center" />
                  </button>
                </li>

                {[...Array(totalPages)].map((_, idx) => (
                  <li key={idx} className={`page-item ${currentPage === idx + 1 ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => setCurrentPage(idx + 1)}>
                      {idx + 1}
                    </button>
                  </li>
                ))}

                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>
                    <FaAngleRight className="icons-center" />
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </CardBody>
      </Card>
    </>
  )
}

export default CourseListPage
