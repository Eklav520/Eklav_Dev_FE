import React from 'react'
import { Modal, Badge, Button, Container, Row, Col, Card } from 'react-bootstrap'
import {
  FaBuilding,
  FaMapMarkerAlt,
  FaTools,
  FaClock,
  FaBriefcase,
  FaTimes
} from 'react-icons/fa'

interface Job {
  title: string
  company: string
  experience: string
  salary: string
  location: string
  description: string
  skills: string[]
  postedDate: string
}

interface Props {
  show: boolean
  onHide: () => void
  job: Job | null
}

const JobDetailsModal: React.FC<Props> = ({ show, job, onHide }) => {
  if (!job) return null

  return (
    <Modal
      show={show}
      onHide={onHide}
      fullscreen="md-down"
      size="lg"
      scrollable
      backdrop="static"
      centered
    >
      {/* ================= HEADER / HERO ================= */}
      <Modal.Header className="bg-dark text-white border-0 position-relative">
        <Container className="px-0">
          <div className="d-flex justify-content-between align-items-start mb-2">
            <div className="me-3">
              <Modal.Title className="fw-bold text-white mb-1 fs-5 fs-md-4">
                {job.title}
              </Modal.Title>
              <div className="text-muted d-flex flex-wrap align-items-center gap-2 gap-md-3 fs-6">
                <span className="d-flex align-items-center gap-1">
                  <FaBuilding size={14} />
                  {job.company}
                </span>
                <span className="d-flex align-items-center gap-1">
                  <FaMapMarkerAlt size={14} />
                  {job.location}
                </span>
              </div>
            </div>

            <Button
              variant="outline-light"
              onClick={onHide}
              className="rounded-circle p-1 position-absolute"
              style={{ top: '1rem', right: '1rem' }}
              size="sm"
            >
              <FaTimes size={16} />
            </Button>
          </div>

          <div className="d-flex flex-wrap gap-2 mt-2">
            <Badge bg="secondary" className="d-flex align-items-center gap-1 px-2 py-1">
              <FaBriefcase size={12} />
              {job.experience}
            </Badge>
            <Badge bg="info" className="px-2 py-1">{job.salary}</Badge>
            <Badge bg="dark" className="border px-2 py-1 d-flex align-items-center gap-1">
              <FaClock size={12} />
              Posted {new Date(job.postedDate).toLocaleDateString()}
            </Badge>
          </div>
        </Container>
      </Modal.Header>

      {/* ================= BODY ================= */}
      <Modal.Body className="bg-light p-0">
        <Container className="py-3 py-md-4">
          <Row className="g-3 g-md-4">
            {/* LEFT CONTENT */}
            <Col lg={8}>
              <Card className="shadow-sm border-0 mb-3 mb-md-4">
                <Card.Body className="p-3 p-md-4">
                  <h5 className="fw-bold mb-3">Job Description</h5>
                  <div
                    className="text-muted"
                    style={{
                      whiteSpace: 'pre-line',
                      lineHeight: '1.7',
                      fontSize: '0.95rem',
                    }}
                  >
                    {job.description}
                  </div>

                </Card.Body>
              </Card>

              <Card className="shadow-sm border-0">
                <Card.Body className="p-3 p-md-4">
                  <h5 className="fw-bold mb-3 d-flex align-items-center">
                    <FaTools className="me-2" />
                    Required Skills
                  </h5>

                  <div className="d-flex flex-wrap gap-2">
                    {job.skills.map((skill, idx) => (
                      <Badge bg="secondary" key={idx} className="px-2 py-1">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {/* RIGHT SIDEBAR */}
            <Col lg={4}>
              <Card className="shadow-sm border-0 sticky-md-top" style={{ top: '1rem' }}>
                <Card.Body className="p-3 p-md-4">
                  <h6 className="fw-bold mb-3">Quick Summary</h6>

                  <div className="mb-3">
                    <div className="fw-semibold mb-1">Company:</div>
                    <div className="text-muted">{job.company}</div>
                  </div>

                  <div className="mb-3">
                    <div className="fw-semibold mb-1">Location:</div>
                    <div className="text-muted">{job.location}</div>
                  </div>

                  <div className="mb-4">
                    <div className="fw-semibold mb-1">Experience:</div>
                    <div className="text-muted">{job.experience}</div>
                  </div>

                  <div className="d-grid gap-2">
                    <Button variant="primary" size="lg" className="w-100">
                      Marked Read
                    </Button>
                    <Button variant="outline-secondary" onClick={onHide} className="w-100">
                      Close
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </Modal.Body>
    </Modal>
  )
}

export default JobDetailsModal