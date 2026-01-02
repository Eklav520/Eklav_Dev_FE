import { Card, Row, Col, Badge, Button, ProgressBar } from 'react-bootstrap'
import { BsPatchCheckFill } from 'react-icons/bs'
import { FaUserCircle, FaChartLine } from 'react-icons/fa'

type Props = {
  student: {
    name: string
    completion: number
    subtitle?: string
  }
}

const HeroSection = ({ student }: Props) => (
  <Card
    className="border-0 shadow-lg mb-4"
    style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
    }}>
    <Card.Body className="p-3 p-md-4">
      <Row className="align-items-center">
        <Col xs="auto" className="mb-3 mb-md-0 d-flex justify-content-center justify-content-md-start">
          <div className="position-relative d-inline-block">
            <div
              className="avatar-wrapper"
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '36px',
                color: 'white',
              }}>
              JK
            </div>
            <Badge bg="success" className="position-absolute bottom-0 end-0" style={{ fontSize: '10px' }}>
              <BsPatchCheckFill /> Active
            </Badge>
          </div>
        </Col>
        <Col xs={12} md={6} className="mb-3 mb-md-0">
          <h4 className="fw-bold mb-1">{student.name}</h4>
          <small className="opacity-75">{student.subtitle || 'Student'}</small>
          <div className="mt-3">
            <div className="d-flex justify-content-between mb-1">
              <span>Profile Completion</span>
              <span>{student.completion}%</span>
            </div>
            <ProgressBar now={student.completion} style={{ height: '8px', borderRadius: '5px' }} variant="success" />
          </div>
        </Col>
        {/* <Col xs={12} md={4} className="text-md-end">
          <Button variant="light" className="fw-bold me-2 mb-2 mb-md-0">
            <FaUserCircle className="me-2" /> Edit Profile
          </Button>
          <Button variant="outline-light" className="fw-bold">
            <FaChartLine className="me-2" /> View Stats
          </Button>
        </Col> */}
      </Row>
    </Card.Body>
  </Card>
)

export default HeroSection
