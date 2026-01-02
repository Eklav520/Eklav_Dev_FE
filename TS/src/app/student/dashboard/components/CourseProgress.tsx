import { useState } from 'react'
import { Card, Badge, ProgressBar } from 'react-bootstrap'
import { FaGraduationCap } from 'react-icons/fa'

type CourseProgressItem = {
  id: string
  name: string
  progress: number
  status: string
  color: string
}

type Props = {
  courses: CourseProgressItem[]
}

const CourseProgress = ({ courses }: Props) => {
  const [activeCourseIndex, setActiveCourseIndex] = useState(0)

  if (!courses || courses.length === 0) {
    return (
      <Card className="border-0 shadow-sm h-100">
        <Card.Header
          className="border-0 text-white py-3"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}>
          <h5 className="mb-0 fw-bold">
            <FaGraduationCap className="me-2" />
            Course Progress
          </h5>
        </Card.Header>

        <Card.Body className="text-center text-muted">No enrolled courses yet</Card.Body>
      </Card>
    )
  }

  const activeCourse = courses[activeCourseIndex]

  return (
    <Card className="border-0 shadow-sm h-100">
      <Card.Header
        className="border-0 text-white py-3"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}>
        <h5 className="mb-0 fw-bold">
          <FaGraduationCap className="me-2" />
          Course Progress
        </h5>
      </Card.Header>

      <Card.Body className="p-3">
        {/* COURSE SWITCHER */}
        <div className="d-flex gap-2 mb-3 flex-wrap">
          {courses.map((course, index) => (
            <Badge
              key={course.id}
              bg={index === activeCourseIndex ? 'primary' : 'secondary'}
              pill
              style={{ cursor: 'pointer' }}
              onClick={() => setActiveCourseIndex(index)}>
              {course.name}
            </Badge>
          ))}
        </div>

        {/* ACTIVE COURSE */}
        <div className="text-center mb-4">
          <div className="rounded p-3 text-white" style={{ background: activeCourse.color }}>
            <h6 className="fw-bold mb-1">{activeCourse.name}</h6>
            <Badge
              pill
              className="px-3 py-1 fw-semibold"
              bg={activeCourse.status === 'Completed' ? 'success' : activeCourse.status === 'In Progress' ? 'warning' : 'secondary'}
              text={activeCourse.status === 'In Progress' ? 'dark' : 'light'}>
              {activeCourse.status}
            </Badge>
          </div>
        </div>

        {/* PROGRESS */}
        <div className="mb-2 d-flex justify-content-between">
          <small className="text-muted">Progress</small>
          <small className="fw-bold">{activeCourse.progress}%</small>
        </div>

        <ProgressBar
          now={activeCourse.progress}
          variant={activeCourse.progress === 100 ? 'success' : activeCourse.progress >= 50 ? 'info' : 'warning'}
          style={{ height: 8 }}
        />
      </Card.Body>
    </Card>
  )
}

export default CourseProgress
