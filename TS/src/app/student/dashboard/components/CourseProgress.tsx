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
      className="border-0 shadow-lg h-100"
      style={{
        borderRadius: '16px',
        background: 'linear-gradient(135deg, #ff7a00 0%, #2a2a2a 60%, #121212 100%)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ flexShrink: 0 }}>
        <Card.Header
          className="border-0 text-white px-3 px-md-4 py-4"
          style={{
            background: 'rgba(255,255,255,0.1)',
            borderBottom: '1px solid rgba(255,255,255,0.2)',
            minHeight: 'auto', // Remove fixed min-height
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header section with icon and title */}
          <div className="d-flex align-items-start mb-3">
            <div
              className="p-2 rounded-circle me-3 flex-shrink-0"
              style={{ background: 'rgba(255, 255, 255, 0.2)' }}
            >
              <FaGraduationCap className="fs-5" />
            </div>
            <div>
              <h1 className="mb-0 fw-bold" style={{ fontSize: 'clamp(1.5rem, 5vw, 1.75rem)' }}>
                Course Progress
              </h1>
              <small className="opacity-75 mt-1 d-block" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>
                Track your learning journey
              </small>
            </div>
          </div>

          {/* STAT BOXES - Stack vertically on mobile */}
          <div className="d-flex flex-column flex-sm-row justify-content-start gap-2 gap-sm-3">
            {/* Avg Progress */}
            <div
              className="d-flex align-items-center p-3 rounded-3 w-100 w-sm-auto"
              style={{
                background: 'rgba(255,122,0,0.15)',
                border: '1px solid rgba(255,122,0,0.4)',
                minWidth: 'auto',
                width: '100%',
                maxWidth: '100%',
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
                <div className="text-white-75 small mb-1" style={{ fontSize: 'clamp(0.7rem, 2.5vw, 0.875rem)' }}>
                  Avg Progress
                </div>
                <div className="fw-bold text-white" style={{ fontSize: 'clamp(1.2rem, 4vw, 1.5rem)' }}>
                  {avgProgress}%
                </div>
              </div>
            </div>

            {/* Completed */}
            <div
              className="d-flex align-items-center p-3 rounded-3 w-100 w-sm-auto"
              style={{
                background: 'rgba(255,122,0,0.15)',
                border: '1px solid rgba(255,122,0,0.4)',
                minWidth: 'auto',
                width: '100%',
                maxWidth: '100%',
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
                <div className="text-white-75 small mb-1" style={{ fontSize: 'clamp(0.7rem, 2.5vw, 0.875rem)' }}>
                  Completed
                </div>
                <div className="fw-bold text-white" style={{ fontSize: 'clamp(1.2rem, 4vw, 1.5rem)' }}>
                  {completedCourses}/{totalCourses}
                </div>
              </div>
            </div>
          </div>
        </Card.Header>
      </div>

      <Card.Body
        className="p-3 p-md-4"
        style={{
          background: '#1e293b',
          flex: 1,
          overflowY: 'auto',
        }}
      >
        <h2 className="text-white fw-bold mb-3 mb-md-4" style={{ fontSize: 'clamp(1.1rem, 4vw, 1.25rem)' }}>
          Enrolled Courses
        </h2>

        {enrolledCourses.map(course => (
          <div
            key={course.id}
            className="mb-3 mb-md-4 pb-2 pb-md-3"
            style={{
              borderBottom: '1px solid rgba(255,122,0,0.2)',
            }}
          >
            <div className="d-flex flex-wrap justify-content-between align-items-start mb-2 mb-md-3">
              <div className="d-flex align-items-center mb-2 mb-sm-0">
                <div className="me-2 me-md-3">
                  <div
                    className="rounded-circle p-2"
                    style={{
                      background: 'rgba(255,122,0,0.15)',
                      width: '36px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FaBookOpen className="fs-6" style={{ color: '#ff7a00' }} />
                  </div>
                </div>
                <div>
                  <div className="fw-bold text-white mb-1" style={{ fontSize: 'clamp(0.9rem, 3vw, 1rem)' }}>
                    {course.name}
                  </div>
                  <span className="text-white-50 small d-flex align-items-center">
                    <FaClock size={10} className="me-1" />
                    <span style={{ fontSize: 'clamp(0.7rem, 2.5vw, 0.8rem)' }}>
                      {course.status}
                    </span>
                  </span>
                </div>
              </div>
              <div className="text-end ms-auto ms-sm-0">
                <div className="fw-bold text-white" style={{ fontSize: 'clamp(0.9rem, 3vw, 1rem)' }}>
                  {course.progress}%
                </div>
                <small className="text-white-50" style={{ fontSize: 'clamp(0.6rem, 2vw, 0.75rem)' }}>
                  Progress
                </small>
              </div>
            </div>

            <ProgressBar
              now={course.progress}
              style={{
                height: '6px',
                borderRadius: '4px',
                backgroundColor: 'rgba(255,255,255,0.1)',
              }}
            />
          </div>
        ))}

        <h2
          className="text-white fw-bold mt-3 mt-md-4 mb-3"
          style={{ fontSize: 'clamp(1.1rem, 4vw, 1.25rem)' }}
        >
          Remaining Courses
        </h2>

        {remainingCourses.map(course => (
          <div
            key={course.id}
            className="d-flex flex-wrap justify-content-between align-items-center mb-2 mb-md-3 p-2 p-md-3"
            style={{
              border: '1px dashed rgba(255,122,0,0.4)',
              borderRadius: '10px',
              background: 'rgba(255,122,0,0.05)',
            }}
          >
            <div
              className="text-white fw-semibold me-2"
              style={{
                fontSize: 'clamp(0.85rem, 3vw, 1rem)',
                wordBreak: 'break-word',
                flex: '1 1 auto'
              }}
            >
              {course.name}
            </div>
            <small
              className="text-white-50"
              style={{
                fontSize: 'clamp(0.7rem, 2.5vw, 0.875rem)',
                whiteSpace: 'nowrap'
              }}
            >
              Not Enrolled
            </small>
          </div>
        ))}
      </Card.Body>

      <style>{`
        .progress-bar {
          background-color: #ff7a00 !important;
        }
        
        /* Custom responsive utilities */
        @media (min-width: 576px) {
          .w-sm-auto {
            width: auto !important;
            max-width: 180px !important;
          }
        }
        
        /* Ensure proper spacing on very small screens */
        @media (max-width: 360px) {
          .card-header .d-flex.flex-column {
            gap: 0.5rem;
          }
          
          .rounded-circle {
            width: 32px !important;
            height: 32px !important;
          }
        }
        
        /* Touch-friendly targets */
        .card-body {
          -webkit-overflow-scrolling: touch;
        }
        
        /* Smooth transitions */
        .progress-bar {
          transition: width 0.3s ease;
        }
      `}</style>
    </Card>
  )
}

export default CourseProgress