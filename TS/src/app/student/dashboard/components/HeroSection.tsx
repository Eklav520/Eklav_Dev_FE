import { Card, Row, Col, ProgressBar } from 'react-bootstrap'
import { Link } from "react-router-dom";

type Props = {
  student: {
    name: string
    completion: number
    subtitle?: string
    avatar?: string
  }
}

const HeroSection = ({ student }: Props) => {
  const firstName = student.name.split(' ')[0]

  return (
    <Card
      className="border-0 mb-4"
      style={{
        background: 'linear-gradient(135deg, #ff7a00 0%, #ff9a3c 1%, #1e293b 100%)', // 🔥 Dark dashboard color
        color: 'white',
        borderRadius: '16px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
      }}
    >
      <Card.Body className="p-3 p-md-4">
        <Row className="align-items-center">

          {/* Greeting */}
          <Col xs={12} md={6} className="mb-3 mb-md-0">
            <div>
              <h3 className="fw-bold mb-1" style={{ fontSize: '1.6rem' }}>
                Hello, {firstName} !
              </h3>
              <p
                className="mb-0"
                style={{
                  color: 'rgba(255,255,255,0.85)',
                  fontSize: '0.95rem',
                }}
              >
                {student.subtitle || "Let's pick up where you left off"}
              </p>
            </div>
          </Col>

          {/* Completion */}
          <Col xs={12} md={6}>
            <div className="d-flex align-items-center justify-content-md-end gap-3">
              <div style={{ minWidth: '220px' }}>
                <div className="d-flex justify-content-between mb-2">
                  <span
                    style={{
                      color: 'rgba(255,255,255,0.85)',
                      fontSize: '0.9rem',
                    }}
                  >
                    Profile Completion
                  </span>
                  <span
                    className="fw-bold"
                    style={{ fontSize: '1.2rem' }}
                  >
                    {student.completion}%
                  </span>
                </div>

                <ProgressBar
                  now={student.completion}
                  style={{
                    height: '8px',
                    borderRadius: '20px',
                    background: 'rgba(255,255,255,0.3)',
                  }}
                />

              </div>

              <Link to="/student/edit-profile">
                <div
                  style={{
                    background: '#ffffff',
                    color: '#ff7a00',
                    padding: '10px 24px',
                    borderRadius: '10px',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 6px 18px rgba(0,0,0,0.15)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow =
                      '0 8px 22px rgba(0,0,0,0.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow =
                      '0 6px 18px rgba(0,0,0,0.15)'
                  }}
                >
                  Finish Setup
                </div>
              </Link>
            </div>
          </Col>
        </Row>
      </Card.Body>

      <style>{`
        .progress-bar {
          background: #ffffff !important;
          border-radius: 20px;
        }
      `}</style>
    </Card>
  )
}

export default HeroSection