import { useState } from 'react'
import { Alert, Button, Col, Form, Modal, Row } from 'react-bootstrap'
import { FaMinus, FaPlus } from 'react-icons/fa'
import axios from 'axios'
import { useAuthContext } from '@/context/useAuthContext'

interface Props {
  show: boolean
  onHide: () => void
  onCreated: (eligibleCount: number) => void
}

interface RoundInput {
  name: string
  order: number
}

const CreateDriveModal = ({ show, onHide, onCreated }: Props) => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [companyName, setCompanyName] = useState('')
  const [role, setRole] = useState('')
  const [pkg, setPkg] = useState('')
  const [location, setLocation] = useState('')
  const [driveDate, setDriveDate] = useState('')
  const [cutoffScore, setCutoffScore] = useState<number | ''>('')
  const [rounds, setRounds] = useState<RoundInput[]>([
    { name: 'Aptitude Test', order: 1 },
    { name: 'Technical Round', order: 2 },
    { name: 'HR Round', order: 3 },
  ])
  const [status, setStatus] = useState('upcoming')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const addRound = () => {
    setRounds((prev) => [
      ...prev,
      { name: '', order: prev.length + 1 },
    ])
  }

  const removeRound = (idx: number) => {
    setRounds((prev) =>
      prev.filter((_, i) => i !== idx).map((r, i) => ({ ...r, order: i + 1 }))
    )
  }

  const updateRoundName = (idx: number, name: string) => {
    setRounds((prev) => prev.map((r, i) => (i === idx ? { ...r, name } : r)))
  }

  const resetForm = () => {
    setCompanyName('')
    setRole('')
    setPkg('')
    setLocation('')
    setDriveDate('')
    setCutoffScore('')
    setRounds([
      { name: 'Aptitude Test', order: 1 },
      { name: 'Technical Round', order: 2 },
      { name: 'HR Round', order: 3 },
    ])
    setStatus('upcoming')
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyName.trim()) {
      setError('Company name is required')
      return
    }
    if (rounds.some((r) => !r.name.trim())) {
      setError('All round names must be filled')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await axios.post(
        `${baseURL}/api/placement-drives`,
        {
          companyName: companyName.trim(),
          role: role.trim(),
          package: pkg.trim(),
          location: location.trim(),
          driveDate: driveDate || null,
          cutoffScore: cutoffScore === '' ? 0 : cutoffScore,
          rounds,
          status,
        },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      )
      resetForm()
      onCreated(res.data.eligibleCount)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to create drive')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    resetForm()
    onHide()
  }

  return (
    <Modal
      show={show}
      onHide={handleClose}
      fullscreen
      contentClassName="bg-dark text-white"
    >
      <Modal.Header closeButton closeVariant="white" className="border-secondary">
        <Modal.Title>New Placement Drive</Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Company Name *</Form.Label>
                <Form.Control
                  className="bg-black text-white border-secondary"
                  placeholder="e.g. Infosys"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Role / Position</Form.Label>
                <Form.Control
                  className="bg-black text-white border-secondary"
                  placeholder="e.g. Software Engineer"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Package Offered</Form.Label>
                <Form.Control
                  className="bg-black text-white border-secondary"
                  placeholder="e.g. 6 LPA"
                  value={pkg}
                  onChange={(e) => setPkg(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Location</Form.Label>
                <Form.Control
                  className="bg-black text-white border-secondary"
                  placeholder="e.g. Bangalore"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Drive Date</Form.Label>
                <Form.Control
                  type="date"
                  className="bg-black text-white border-secondary"
                  value={driveDate}
                  onChange={(e) => setDriveDate(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>
                  Minimum CGPA / Score (Cutoff)
                  <span className="text-muted ms-1" style={{ fontSize: '0.8rem' }}>
                    — e.g. 7.5, 8.0, 9.2
                  </span>
                </Form.Label>
                <Form.Control
                  type="number"
                  min={0}
                  max={10}
                  step={0.1}
                  placeholder="e.g. 7.5"
                  className="bg-black text-white border-secondary"
                  value={cutoffScore}
                  onChange={(e) =>
                    setCutoffScore(e.target.value === '' ? '' : parseFloat(e.target.value))
                  }
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Initial Status</Form.Label>
                <Form.Select
                  className="bg-black text-white border-secondary"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <hr className="border-secondary my-4" />

          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="mb-0">Interview Rounds</h6>
            <Button
              size="sm"
              style={{ backgroundColor: '#ff7a00', borderColor: '#ff7a00', color: '#fff' }}
              onClick={addRound}
            >
              <FaPlus className="me-1" /> Add Round
            </Button>
          </div>

          {rounds.map((round, idx) => (
            <Row key={idx} className="g-2 mb-2 align-items-center">
              <Col xs="auto">
                <span
                  className="d-flex align-items-center justify-content-center rounded-circle bg-warning text-dark fw-bold"
                  style={{ width: 28, height: 28, fontSize: '0.8rem' }}
                >
                  {round.order}
                </span>
              </Col>
              <Col>
                <Form.Control
                  className="bg-black text-white border-secondary"
                  placeholder={`Round ${round.order} name`}
                  value={round.name}
                  onChange={(e) => updateRoundName(idx, e.target.value)}
                />
              </Col>
              {rounds.length > 1 && (
                <Col xs="auto">
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => removeRound(idx)}
                  >
                    <FaMinus />
                  </Button>
                </Col>
              )}
            </Row>
          ))}
        </Modal.Body>

        <Modal.Footer className="border-secondary">
          <Button variant="secondary" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            style={{ backgroundColor: '#ff7a00', borderColor: '#ff7a00', color: '#fff', fontWeight: 600 }}
          >
            {submitting ? 'Creating...' : 'Create Drive & Notify Students'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default CreateDriveModal
