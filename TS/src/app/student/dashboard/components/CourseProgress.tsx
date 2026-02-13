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
        background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
        height: '600px',
        display: 'flex',
        flexDirection: 'column',
      }}
    > 
      {/* ================= HEADER (UNCHANGED) ================= */}
      <div style={{ flexShrink: 0 }}>
        <Card.Header
          className="border-0 text-white px-4 py-4"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
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
              <h1
                className="mb-0 fw-bold"
                style={{ fontSize: '1.75rem', lineHeight: '1.2' }}
              >
                <span className="d-block">Course Progress</span>
              </h1>
              <small className="opacity-75 mt-1 d-block">
                Track your learning journey
              </small>
            </div>
          </div>

          <div className="d-flex justify-content-start gap-3">
            <div
              className="d-flex align-items-center p-3 rounded-3"
              style={{
                background: 'rgba(37, 99, 235, 0.15)',
                border: '1px solid rgba(37, 99, 235, 0.3)',
                minWidth: '150px',
              }}
            >
              <div
                className="rounded-circle p-2 flex-shrink-0 me-3"
                style={{
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
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

            <div
              className="d-flex align-items-center p-3 rounded-3"
              style={{
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                minWidth: '150px',
              }}
            >
              <div
                className="rounded-circle p-2 flex-shrink-0 me-3"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
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

      {/* ================= BODY ================= */}
      <Card.Body
        className="p-4"
        style={{
          background: '#1e293b',
          flex: 1,
          overflowY: 'auto',
        }}
      >
        {/* ================= ENROLLED COURSES ================= */}
        <h2 className="text-white fw-bold mb-4" style={{ fontSize: '1.25rem' }}>
          Enrolled Courses
        </h2>

        {enrolledCourses.length === 0 && (
          <small className="text-white-50">No enrolled courses</small>
        )}

        {enrolledCourses.map(course => (
          <div
            key={course.id}
            className="mb-4 pb-3"
            style={{
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* EXISTING COURSE UI — UNCHANGED */}
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div className="d-flex align-items-center">
                <div className="me-3">
                  <div
                    className="rounded-circle p-2"
                    style={{
                      background: course.color + '20',
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FaBookOpen className="fs-5" style={{ color: course.color }} />
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
              variant="info"
            />
          </div>
        ))}

        {/* ================= REMAINING COURSES ================= */}
        <h2
          className="text-white fw-bold mt-4 mb-3"
          style={{ fontSize: '1.25rem' }}
        >
          Remaining Courses
        </h2>

        {remainingCourses.length === 0 && (
          <small className="text-white-50">No remaining courses</small>
        )}

        {remainingCourses.map(course => (
          <div
            key={course.id}
            className="d-flex justify-content-between align-items-center mb-3 p-3"
            style={{
              border: '1px dashed rgba(255,255,255,0.2)',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.05)',
            }}
          >
            <div className="text-white fw-semibold">
              {course.name}
            </div>
            <small className="text-white-50">Not Enrolled</small>
          </div>
        ))}
      </Card.Body>
    </Card>
  )
}

export default CourseProgress
