import { Card, ProgressBar } from 'react-bootstrap'
import { FaGraduationCap, FaBookOpen, FaClock, FaCheckCircle } from 'react-icons/fa'

type CourseProgressItem = {
  id: string
  name: string
  progress: number
  status: string
  color: string
}

type Props = {
  enrolledCourses: CourseProgressItem[]
  remainingCourses: CourseProgressItem[]
}

const CourseProgress = ({ enrolledCourses, remainingCourses }: Props) => {
  const totalCourses = enrolledCourses.length + remainingCourses.length
  const completedCourses = enrolledCourses.filter(c => c.progress === 100).length

  const avgProgress =
    enrolledCourses.length > 0
      ? Math.round(
        enrolledCourses.reduce((sum, c) => sum + c.progress, 0) /
        enrolledCourses.length
      )
      : 0

  return (
    <Card
      className="border-0 shadow-lg overflow-hidden"
      style={{
        borderRadius: '16px',
        background: 'linear-gradient(135deg, #ff7a00 0%, #2a2a2a 60%, #121212 100%)', // 🔥 orange
        height: '600px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ flexShrink: 0 }}>
        <Card.Header
          className="border-0 text-white px-4 py-4"
          style={{
            background: 'rgba(255,255,255,0.1)',
            borderBottom: '1px solid rgba(255,255,255,0.2)',
            minHeight: '200px',   // 🔥 FORCE SAME HEIGHT
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >
          <div className="d-flex align-items-start mb-3">
            <div
              className="p-2 rounded-circle me-3"
              style={{ background: 'rgba(255, 255, 255, 0.2)' }}
            >
              <FaGraduationCap className="fs-5" />
            </div>
            <div>
              <h1 className="mb-0 fw-bold" style={{ fontSize: '1.75rem' }}>
                Course Progress
              </h1>
              <small className="opacity-75 mt-1 d-block">
                Track your learning journey
              </small>
            </div>
          </div>

          {/* STAT BOXES */}
          <div className="d-flex justify-content-start gap-3">
            {/* Avg Progress */}
            <div
              className="d-flex align-items-center p-3 rounded-3"
              style={{
                background: 'rgba(255,122,0,0.15)',
                border: '1px solid rgba(255,122,0,0.4)',
                width: '180px',
                height: '90px',
              }}
            >
              <div
                className="rounded-circle p-2 flex-shrink-0 me-3"
                style={{
                  background: 'linear-gradient(135deg, #ff7a00 0%, #e96d00 100%)',
                  width: '42px',
                  height: '42px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FaBookOpen className="text-white" size={18} />
              </div>
              <div>
                <div className="text-white-75 small mb-1">Avg Progress</div>
                <div className="fw-bold text-white fs-4">
                  {avgProgress}%
                </div>
              </div>
            </div>

            {/* Completed */}
            <div
              className="d-flex align-items-center p-3 rounded-3"
              style={{
                background: 'rgba(255,122,0,0.15)',
                border: '1px solid rgba(255,122,0,0.4)',
                width: '180px',
                height: '90px',
              }}
            >
              <div
                className="rounded-circle p-2 flex-shrink-0 me-3"
                style={{
                  background: 'linear-gradient(135deg, #ff7a00 0%, #e96d00 100%)',
                  width: '42px',
                  height: '42px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FaCheckCircle className="text-white" size={18} />
              </div>
              <div>
                <div className="text-white-75 small mb-1">Completed</div>
                <div className="fw-bold text-white fs-4">
                  {completedCourses}/{totalCourses}
                </div>
              </div>
            </div>
          </div>
        </Card.Header>
      </div>

      <Card.Body
        className="p-4"
        style={{
          background: '#1e293b',
          flex: 1,
          overflowY: 'auto',
        }}
      >
        <h2 className="text-white fw-bold mb-4" style={{ fontSize: '1.25rem' }}>
          Enrolled Courses
        </h2>

        {enrolledCourses.map(course => (
          <div
            key={course.id}
            className="mb-4 pb-3"
            style={{
              borderBottom: '1px solid rgba(255,122,0,0.2)',
            }}
          >
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div className="d-flex align-items-center">
                <div className="me-3">
                  <div
                    className="rounded-circle p-2"
                    style={{
                      background: 'rgba(255,122,0,0.15)',
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FaBookOpen className="fs-5" style={{ color: '#ff7a00' }} />
                  </div>
                </div>
                <div>
                  <div className="fw-bold text-white mb-1">
                    {course.name}
                  </div>
                  <span className="text-white-50 small">
                    <FaClock size={12} className="me-1" />
                    {course.status}
                  </span>
                </div>
              </div>
              <div className="text-end">
                <div className="fw-bold text-white">{course.progress}%</div>
                <small className="text-white-50">Progress</small>
              </div>
            </div>

            <ProgressBar
              now={course.progress}
              style={{
                height: '8px',
                borderRadius: '4px',
                backgroundColor: 'rgba(255,255,255,0.1)',
              }}
            />
          </div>
        ))}

        <h2
          className="text-white fw-bold mt-4 mb-3"
          style={{ fontSize: '1.25rem' }}
        >
          Remaining Courses
        </h2>

        {remainingCourses.map(course => (
          <div
            key={course.id}
            className="d-flex justify-content-between align-items-center mb-3 p-3"
            style={{
              border: '1px dashed rgba(255,122,0,0.4)',
              borderRadius: '10px',
              background: 'rgba(255,122,0,0.05)',
            }}
          >
            <div className="text-white fw-semibold">
              {course.name}
            </div>
            <small className="text-white-50">Not Enrolled</small>
          </div>
        ))}
      </Card.Body>

      <style>{`
        .progress-bar {
          background-color: #ff7a00 !important;
        }
      `}</style>
    </Card>
  )
}

export default CourseProgress