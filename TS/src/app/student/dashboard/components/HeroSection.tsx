import { Card, Row, Col } from 'react-bootstrap'
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
        background: 'linear-gradient(135deg, #ff7a00 0%, #ff9a3c 1%, #1e293b 100%)',
        color: 'white',
        borderRadius: '16px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
      }}
    >
      <Card.Body className="p-3 p-md-4">
        <Row className="align-items-center g-3">
          {/* Greeting - Full width on mobile */}
          <Col xs={12} md={6}>
            <div className="text-center text-md-start">
              <h3 className="fw-bold mb-1" style={{ fontSize: 'clamp(1.4rem, 5vw, 1.8rem)' }}>
                Hello, {firstName} !
              </h3>
              <p
                className="mb-0"
                style={{
                  color: 'rgba(255,255,255,0.85)',
                  fontSize: 'clamp(0.85rem, 3vw, 0.95rem)',
                }}
              >
                {student.subtitle || "Let's pick up where you left off"}
              </p>
            </div>
          </Col>

          {/* Completion - Stack vertically on mobile */}
          <Col xs={12} md={6}>
            <div className="d-flex flex-column flex-sm-row align-items-center align-items-md-end justify-content-md-end gap-3">
              {/* Progress bar section - Full width on mobile */}
              <div className="w-100" style={{ maxWidth: '280px' }}>
                <div className="d-flex justify-content-between mb-2">
                  <span
                    style={{
                      color: 'rgba(255,255,255,0.85)',
                      fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                    }}
                  >
                    Profile Completion
                  </span>
                  <span
                    className="fw-bold"
                    style={{ fontSize: 'clamp(1rem, 4vw, 1.2rem)' }}
                  >
                    {student.completion}%
                  </span>
                </div>

                <div
                  className="mb-2 mb-sm-0"
                  style={{
                    height: '8px',
                    borderRadius: '20px',
                    background: 'rgba(255,255,255,0.3)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${student.completion}%`,
                      background: '#ffffff',
                      borderRadius: '20px',
                      transition: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Button - Full width on mobile */}
              <Link to="/student/edit-profile" className="w-100 w-sm-auto">
                <div
                  style={{
                    background: '#ffffff',
                    color: '#ff7a00',
                    padding: '12px 24px',
                    borderRadius: '10px',
                    fontWeight: 600,
                    fontSize: 'clamp(0.85rem, 3vw, 0.9rem)',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 6px 18px rgba(0,0,0,0.15)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'center',
                    width: '100%',
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
        /* Custom responsive utilities */
        @media (min-width: 576px) {
          .w-sm-auto {
            width: auto !important;
          }
        }
        
        /* Ensure button doesn't overflow on very small screens */
        @media (max-width: 360px) {
          .btn {
            white-space: normal !important;
            padding: 10px 16px !important;
          }
        }
      `}</style>
    </Card>
  )
}

export default HeroSection