import { useAuthContext } from '@/context/useAuthContext'
import React, { useEffect, useState } from 'react'
import { Button, Card, CardBody, CardHeader, Col, Form, Row } from 'react-bootstrap'
import { FaAngleLeft, FaAngleRight, FaSearch, FaStar } from 'react-icons/fa'
import CourseCard from './CourseCard'

interface Course {
  image: any
  totalLectures: number
  _id: string
  title: string
  description: string
  videos: { url: string; description: string }[]
  averageRating?: number
  totalRatings?: number
  shortDescription?: string
  category?: string[] | string
  level?: string
  language?: string
  duration?: string
  features?: string
  price?: string
  discountPrice?: string
  isFeatured?: string
  badge?: { text?: string; class?: string }
}

interface RatingResponse {
  ratings: any[]
  averageRating: number
  ratingCount: number
  total: number
  page: number
  totalPages: number
}

const CoursesList = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const [courses, setCourses] = useState<Course[]>([])
  const [enrolledCourses, setEnrolledCourses] = useState<string[]>([])
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([])
  const { user } = useAuthContext()
  const token = user?.token
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCoursesWithRatings = async () => {
      try {
        setLoading(true)
        // Fetch courses
        const coursesResponse = await fetch(`${baseURL}/courses`)
        const coursesData = await coursesResponse.json()

        // Fetch ratings for each course using the correct endpoint
        const coursesWithRatings = await Promise.all(
          coursesData.map(async (course: Course) => {
            try {
              const ratingsResponse = await fetch(`${baseURL}/courses/${course._id}/ratings`)
              if (ratingsResponse.ok) {
                const ratingData: RatingResponse = await ratingsResponse.json()
                
                return {
                  ...course,
                  averageRating: ratingData.averageRating,
                  totalRatings: ratingData.ratingCount
                }
              } else {
                console.warn(`Failed to fetch ratings for course ${course._id}`)
                return {
                  ...course,
                  averageRating: 0,
                  totalRatings: 0
                }
              }
            } catch (error) {
              console.error(`Error fetching ratings for course ${course._id}:`, error)
              return {
                ...course,
                averageRating: 0,
                totalRatings: 0
              }
            }
          })
        )

        setCourses(coursesWithRatings)
      } catch (error) {
        console.error('Error fetching courses or ratings:', error)
        // Fallback: fetch courses without ratings
        try {
          const coursesResponse = await fetch(`${baseURL}/courses`)
          const coursesData = await coursesResponse.json()
          const coursesWithDefaultRatings = coursesData.map((course: Course) => ({
            ...course,
            averageRating: 0,
            totalRatings: 0
          }))
          setCourses(coursesWithDefaultRatings)
        } catch (fallbackError) {
          console.error('Error fetching courses:', fallbackError)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchCoursesWithRatings()
  }, [baseURL])

  useEffect(() => {
    if (!token) {
      setEnrolledCourses([])
      setEnrolledCourseIds([])
      return
    }

    const fetchEnrolledCourses = async () => {
      try {
        const res = await fetch(`${baseURL}/enrollments/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const data = await res.json()

        const enrichedCourses = data
          .filter((enroll: any) => enroll.courseId !== null)
          .map((enroll: any) => ({
            _id: enroll.courseId._id,
            title: enroll.courseId.title,
            image: enroll.courseId.image,
            totalLectures: enroll.courseId.totalLectures,
            videos: enroll.courseId.videos,
          }))

        setEnrolledCourses(enrichedCourses)
        const ids = data.filter((enroll: any) => enroll.courseId !== null).map((enroll: any) => enroll.courseId._id)
        setEnrolledCourseIds(ids)
      } catch (err) {
        console.error('Failed to fetch enrolled courses', err)
        setEnrolledCourses([])
        setEnrolledCourseIds([])
      }
    }

    fetchEnrolledCourses()
  }, [user, baseURL, token])

  const handleEnroll = async (courseId: string) => {
    if (!token) return alert('Please log in to enroll.')

    if (enrolledCourseIds.length >= 5) {
      return alert('You can only enroll in up to 5 courses.')
    }

    try {
      const response = await fetch(`${baseURL}/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ courseId }),
      })

      const data = await response.json()

      if (response.ok) {
        alert('Enrolled successfully!')
        setEnrolledCourses((prev) => [...prev, courseId])
        setEnrolledCourseIds((prev) => [...prev, courseId])
      } else {
        alert('Enroll failed: ' + data.message)
      }
    } catch (error) {
      console.error(error)
      alert('Error enrolling')
    }
  }

  const filteredCourses = courses.filter((course) => course.title.toLowerCase().includes(searchTerm.toLowerCase()))

  const paginatedCourses = filteredCourses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage)

  if (loading) {
    return (
      <Card className="bg-transparent border rounded-3">
        <CardBody className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 mb-0">Loading courses...</p>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card className="bg-transparent border rounded-3">
      <CardHeader className="bg-transparent border-bottom">
        <Row className="align-items-center">
          <Col md={6}>
            <h3 className="mb-0">Available Courses</h3>
          </Col>
          <Col md={6}>
            <Form className="rounded position-relative" onSubmit={(e) => e.preventDefault()}>
              <input
                className="form-control pe-5 bg-transparent"
                type="search"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
              />
              <button
                className="bg-transparent p-2 position-absolute top-50 end-0 translate-middle-y border-0 text-primary-hover text-reset"
                type="submit">
                <FaSearch />
              </button>
            </Form>
          </Col>
        </Row>
      </CardHeader>
      <CardBody>
        <Row className="g-3">
          {paginatedCourses.map((course) => {
            const normalizedCourse = {
              ...course,
              totalLectures: course.totalLectures != null ? String(course.totalLectures) : String(course.videos?.length ?? 0),
              videos: (course.videos || []).map((v: any, idx: number) => ({
                _id: v?._id ?? String(idx),
                url: v?.url,
                video: v?.video,
                description: v?.description ?? '',
                progress: v?.progress,
              })),
              averageRating: course.averageRating,
              totalRatings: course.totalRatings,
            }
            return (
              <Col sm={6} lg={4} xl={3} key={course._id} className="d-flex">
                <div className="w-100">
                  <CourseCard course={normalizedCourse} />
                </div>
              </Col>
            )
          })}
        </Row>

        {paginatedCourses.length === 0 && !loading && (
          <div className="text-center py-5">
            <p className="text-muted">No courses found matching your search.</p>
          </div>
        )}

        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center mt-3 pt-2 border-top">
          <p className="mb-2 mb-sm-0 text-secondary small">
            Showing <strong>{filteredCourses.length}</strong> course{filteredCourses.length !== 1 ? 's' : ''}
          </p>

          <p className="mb-2 mb-sm-0 text-secondary small">
            You can enroll in <strong>{5 - enrolledCourseIds.length}</strong> more course
            {5 - enrolledCourseIds.length !== 1 ? 's' : ''}.
          </p>

          <nav aria-label="Page navigation">
            <ul className="pagination pagination-sm pagination-primary-soft mb-0">
              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <Button
                  className="page-link"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <FaAngleLeft />
                </Button>
              </li>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                  <Button
                    className="page-link"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                </li>
              ))}
              <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                <Button
                  className="page-link"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  <FaAngleRight />
                </Button>
              </li>
            </ul>
          </nav>
        </div>
      </CardBody>
    </Card>
  )
}

export default CoursesList