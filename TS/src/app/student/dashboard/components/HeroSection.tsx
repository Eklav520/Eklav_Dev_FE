import { Card, Row, Col, Badge, ProgressBar } from 'react-bootstrap'
import { BsPatchCheckFill } from 'react-icons/bs'

/* ================= TYPES ================= */

type Props = {
  student: {
    name: string
    completion: number
    subtitle?: string
  }
}

/* ================= UTILS ================= */

// Get initials from name (Jagadeesh Kumar → JK)
const getInitials = (name?: string) => {
  if (!name) return 'U'

  const words = name.trim().split(/\s+/)

  if (words.length >= 2) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase()
  }

  return words[0][0].toUpperCase()
}

// Generate consistent avatar color from name
const getAvatarGradient = (name?: string) => {
  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
  ]

  if (!name) return gradients[0]

  const index = name.charCodeAt(0) % gradients.length
  return gradients[index]
}

/* ================= COMPONENT ================= */

const HeroSection = ({ student }: Props) => (
  <Card
    className="border-0 shadow-lg mb-4"
    style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
    }}
  >
    <Card.Body className="p-3 p-md-4">
      <Row className="align-items-center">
        {/* Avatar */}
        <Col
          xs="auto"
          className="mb-3 mb-md-0 d-flex justify-content-center justify-content-md-start"
        >
          <div className="position-relative d-inline-block">
            <div
              className="avatar-wrapper"
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: getAvatarGradient(student?.name),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '36px',
                fontWeight: 600,
                color: 'white',
                userSelect: 'none',
              }}
            >
              {getInitials(student?.name)}
            </div>

            <Badge
              bg="success"
              className="position-absolute bottom-0 end-0"
              style={{ fontSize: '10px' }}
            >
              <BsPatchCheckFill /> Active
            </Badge>
          </div>
        </Col>

        {/* User Info */}
        <Col xs={12} md={6} className="mb-3 mb-md-0">
          <h4 className="fw-bold mb-1">{student.name}</h4>
          <small className="opacity-75">
            {student.subtitle || 'Student'}
          </small>

          <div className="mt-3">
            <div className="d-flex justify-content-between mb-1">
              <span>Profile Completion</span>
              <span>{student.completion}%</span>
            </div>

            <ProgressBar
              now={student.completion}
              style={{ height: '8px', borderRadius: '5px' }}
              variant="success"
            />
          </div>
        </Col>
      </Row>
    </Card.Body>
  </Card>
)

export default HeroSection
