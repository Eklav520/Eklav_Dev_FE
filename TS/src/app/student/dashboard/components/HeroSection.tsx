import { Card, Row, Col, Button, ProgressBar } from 'react-bootstrap'
import avatarFallback from '@/assets/images/avatar/09.jpg'
import { Link } from "react-router-dom";
/* ================= TYPES ================= */

type Props = {
  student: {
    name: string
    completion: number
    subtitle?: string
    avatar?: string
  }
}

/* ================= COMPONENT ================= */

const HeroSection = ({ student }: Props) => {
  const firstName = student.name.split(' ')[0]
  
  return (
    <Card
      className="border-0 mb-4"
      style={{
        background: '#1e293b',
        color: 'white',
        borderRadius: '12px',
      }}
    >
      <Card.Body className="p-3 p-md-4">
        <Row className="align-items-center">
          {/* Avatar & Greeting */}
          <Col xs={12} md={6} className="mb-3 mb-md-0">
            <div className="d-flex align-items-center">
              
              <div>
                <h3 className="fw-bold mb-1" style={{ fontSize: '1.5rem' }}>
                  Hello, {firstName} !
                </h3>
                <p className="mb-0" style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                  {student.subtitle || "Let's pick up where you left off"}
                </p>
              </div>
            </div>
          </Col>

          {/* Profile Completion & Button */}
          <Col xs={12} md={6}>
            <div className="d-flex align-items-center justify-content-md-end gap-3">
              <div style={{ minWidth: '200px' }}>
                <div className="d-flex justify-content-between mb-2">
                  <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                    Profile Completion
                  </span>
                  <span className="fw-bold" style={{ fontSize: '1.1rem' }}>
                    {student.completion}%
                  </span>
                </div>
                <ProgressBar
                  now={student.completion}
                  style={{ 
                    height: '8px', 
                    borderRadius: '10px',
                    background: '#334155'
                  }}
                  className="custom-progress"
                />
              </div>
              <Link to="/student/edit-profile"><div
                style={{
                  background: '#06b6d4',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  whiteSpace: 'nowrap',
                  color: 'white',
                }}
                className="hover-lift"
              >
                Finish Setup
              </div></Link>
              
            </div>
          </Col>
        </Row>
      </Card.Body>

      <style>{`
        .custom-progress .progress-bar {
          background: #6366f1 !important;
          border-radius: 10px;
        }
        
        .hover-lift {
          transition: all 0.2s ease;
        }
        
        .hover-lift:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(6, 182, 212, 0.4);
          background: #0891b2 !important;
        }
      `}</style>
    </Card>
  )
}

export default HeroSection
