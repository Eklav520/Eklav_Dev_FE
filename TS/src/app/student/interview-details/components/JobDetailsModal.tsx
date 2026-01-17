import React, { useEffect, useState } from 'react'
import { Modal, Badge, Button, Container, Row, Col, Card } from 'react-bootstrap'
import {
  FaBuilding,
  FaMapMarkerAlt,
  FaTools,
  FaClock,
  FaBriefcase,
  FaTimes,
  FaBullseye
} from 'react-icons/fa'
import { useAuthContext } from '@/context/useAuthContext'
import styles from './JobCard.module.css'

interface Job {
  _id: string
  title: string
  company: string
  experience: string
  salary: string
  location: string

  skills: string[]
  highlights: string[]

  jobType: 'Internship' | 'Fresher' | 'Experienced'
  domain: 'Tech' | 'Non-Tech'

  postedDate: string
  expiryDate: string
  isRead: boolean
  tag?: string
}

interface Props {
  show: boolean
  onHide: () => void
  job: Job | null
  onMarkedAsRead: (jobId: string) => void
}

const JobDetailsModal: React.FC<Props> = ({
  show,
  job,
  onHide,
  onMarkedAsRead
}) => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()
  const token = user?.token

  const [isRead, setIsRead] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (job) {
      setIsRead(job.isRead)
    }
  }, [job])

  if (!job) return null

  const getExpiryText = () => {
    const today = new Date()
    const exp = new Date(job.expiryDate)
    const diffDays = Math.ceil(
      (exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (diffDays <= 0) return 'Expired'
    if (diffDays === 1) return 'Expires today'
    return `Expires in ${diffDays} days`
  }

  const handleMarkAsRead = async () => {
    if (isRead || loading || !token) return

    try {
      setLoading(true)

      const res = await fetch(`${baseURL}/jobs/${job._id}/read`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!res.ok) {
        throw new Error('Failed to mark job as read')
      }

      setIsRead(true)
      onMarkedAsRead(job._id) // 🔁 sync parent list
    } catch (err) {
      console.error('❌ Mark as read failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      show={show}
      onHide={onHide}
      fullscreen="md-down"
      scrollable
      backdrop="static"
      centered
      dialogClassName="job-details-modal"
    >
      {/* ===== HEADER ===== */}
      <Modal.Header className="bg-dark text-white border-0 position-relative">
        <Container className="px-0">
          <Modal.Title className="fw-bold fs-5 fs-md-4">
            {job.title}
          </Modal.Title>

          <div className="d-flex flex-wrap gap-3 text-muted mt-2">
            <span className="d-flex align-items-center gap-1">
              <FaBuilding size={14} /> {job.company}
            </span>
            <span className="d-flex align-items-center gap-1">
              <FaMapMarkerAlt size={14} /> {job.location}
            </span>
          </div>

          <div className="d-flex flex-wrap gap-2 mt-3">
            <Badge bg="primary">{job.jobType}</Badge>
            <Badge bg="secondary">{job.domain}</Badge>
            {job.tag && <Badge bg="success">{job.tag}</Badge>}
            {isRead && <Badge bg="success">Read</Badge>}
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
        </Container>
      </Modal.Header>

      {/* ===== BODY ===== */}
      <Modal.Body className="bg-light">
        <Container>
          <Row className="g-4">
            {/* LEFT CONTENT */}
            <Col lg={8}>
              <Card className="shadow-sm border-0 mb-4">
                <Card.Body>
                  <h5 className="fw-bold mb-3 d-flex align-items-center">
                    <FaBullseye className="me-2" />
                    Key Highlights
                  </h5>
                  <div
                    className="job-description"
                    dangerouslySetInnerHTML={{
                      __html: job.highlights?.[0] || ''
                    }}
                  />

                </Card.Body>
              </Card>

              <Card className="shadow-sm border-0">
                <Card.Body>
                  <h5 className="fw-bold mb-3 d-flex align-items-center">
                    <FaTools className="me-2" />
                    Required Skills
                  </h5>

                  <div className="d-flex flex-wrap gap-2">
                    {job.skills.map((skill, idx) => (
                      <Badge bg="secondary" key={idx}>
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {/* RIGHT SIDEBAR */}
            <Col lg={4}>
              <Card
                className="shadow-sm border-0 sticky-md-top"
                style={{ top: '1rem' }}
              >
                <Card.Body>
                  <h6 className="fw-bold mb-3">Job Summary</h6>

                  <div className="mb-3">
                    <FaBriefcase className="me-2 text-muted" />
                    {job.experience || 'Any Experience'}
                  </div>

                  {job.salary && (
                    <div className="mb-3 fw-semibold">
                      Salary: ₹{Number(job.salary).toFixed(2)}
                    </div>
                  )}

                  <div className="mb-4 text-muted">
                    <FaClock className="me-2" />
                    Posted {new Date(job.postedDate).toLocaleDateString()}
                    <br />
                    <strong>{getExpiryText()}</strong>
                  </div>

                  <div className="d-grid gap-2">
                    {!isRead ? (
                      <Button
                        variant="primary"
                        size="lg"
                        onClick={handleMarkAsRead}
                        disabled={loading}
                      >
                        {loading ? 'Marking…' : 'Mark as Read'}
                      </Button>
                    ) : (
                      <Button variant="success" size="lg" disabled>
                        ✓ Marked as Read
                      </Button>
                    )}

                    <Button
                      variant="outline-secondary"
                      onClick={onHide}
                    >
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
