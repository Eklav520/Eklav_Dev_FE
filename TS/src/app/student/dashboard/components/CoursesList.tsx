import { useAuthContext } from '@/context/useAuthContext'
import React, { useEffect, useState } from 'react'
import { Button, Card, CardBody, CardHeader, Col, Row } from 'react-bootstrap'
import { FaSearch } from 'react-icons/fa'

interface Course {
  image: any
  totalLectures: number
  _id: string
  title: string
  description: string
  videos: { url: string; description: string }[]
}

const CoursesList = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const [courses, setCourses] = useState<Course[]>([])
  const [enrolledCourses, setEnrolledCourses] = useState<string[]>([])
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([])
  const { user } = useAuthContext()
  const token = user?.token

  console.log("userssssss",user,token)

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch(`${baseURL}/courses`)
        const data = await response.json()
        setCourses(data)
      } catch (error) {
        console.error('Error fetching courses:', error)
      }
    }
    fetchCourses()
  }, [])

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
      console.log("data",data)

      const enrichedCourses = data.map((enroll: any) => ({
        _id: enroll.courseId._id,
        title: enroll.courseId.title,
        image: enroll.courseId.image,
        totalLectures: enroll.courseId.totalLectures,
        videos: enroll.courseId.videos,
      }))

      setEnrolledCourses(enrichedCourses)
      const ids = data.map((enroll: any) => enroll.courseId._id)
      setEnrolledCourseIds(ids)
    } catch (err) {
      console.error('Failed to fetch enrolled courses', err)
      setEnrolledCourses([])
      setEnrolledCourseIds([])
    }
  }

  fetchEnrolledCourses()
}, [user]) // 👈 include `user` here


 const handleEnroll = async (courseId: string) => {
  if (!token) return alert('Please log in to enroll.')

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
      // ✅ Update both states immediately
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


  return (
    <Card className="bg-transparent border rounded-3">
      <CardHeader className="bg-transparent border-bottom">
        <h3 className="mb-0">Available Courses</h3>
      </CardHeader>
      <CardBody>
        <Row className="g-3 align-items-center justify-content-between mb-4">
          <Col md={8}>
            <form className="rounded position-relative">
              <input className="form-control pe-5 bg-transparent" type="search" placeholder="Search" />
              <button
                className="bg-transparent p-2 position-absolute top-50 end-0 translate-middle-y border-0 text-primary-hover text-reset"
                type="submit">
                <FaSearch />
              </button>
            </form>
          </Col>
        </Row>

        <div className="table-responsive border-0">
          <table className="table table-dark-gray align-middle p-4 mb-0 table-hover">
            <thead>
              <tr>
                <th>Course Title</th>
                <th>Videos</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course._id}>
                  <td style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img
                      src={`${baseURL}/uploads/${course.image}`}
                      alt="course image"
                      style={{ width: '60px', height: 'auto', borderRadius: '4px' }}
                    />
                    <strong>{course.title}</strong>
                  </td>
                  <td>{course.videos.length}</td>
                  <td>
                    <Button variant="success" size="sm" onClick={() => handleEnroll(course._id)} disabled={enrolledCourseIds.includes(course._id)}>
                      {enrolledCourseIds.includes(course._id) ? 'Enrolled' : 'Enroll'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  )
}

export default CoursesList
