import React, { useEffect, useState } from 'react'
import {
  Form,
  Button,
  Container,
  Row,
  Col,
  Table,
  Modal
} from 'react-bootstrap'
import ReactQuill from 'react-quill-new'
import 'quill/dist/quill.snow.css'
import { useAuthContext } from '@/context/useAuthContext'

interface ClassSession {
  _id: string
  title: string
  courseName: string
  cost: number
  totalSeats: number
  availableSeats?: number
  startDate: string
  days: string[]
  startTime: string
  endTime: string
  meetingLink: string
  tags: string[]
  description: string
}

const ScheduleClassForm: React.FC = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()
  console.log("user data", user)

  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [classList, setClassList] = useState<ClassSession[]>([])
  const [profileStatus, setProfileStatus] = useState<string | null>(null)

  const initialState = {
    title: '',
    courseName: '',
    cost: 0,
    totalSeats: 20,
    startDate: '',
    days: [] as string[],
    startTime: '',
    endTime: '',
    meetingLink: '',
    tags: [] as string[],
    description: ''
  }

  const [formData, setFormData] = useState(initialState)

  const fetchProfileStatus = async () => {
    try {
      const res = await fetch(`${baseURL}/profile`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      })
      const data = await res.json()
      setProfileStatus(data.status)
    } catch (err) {
      console.error("Error fetching profile status", err)
    }
  }

  useEffect(() => {
    fetchClassList()
    fetchProfileStatus()
  }, [])

  const fetchClassList = async () => {
    const res = await fetch(`${baseURL}/admin/classes`, {
      headers: { Authorization: `Bearer ${user?.token}` }
    })
    const data = await res.json()
    setClassList(data)
  }

  const handleClose = () => {
    setShowModal(false)
    setEditingId(null)
    setFormData(initialState)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const url = editingId
      ? `${baseURL}/admin/schedule-class/${editingId}`
      : `${baseURL}/admin/schedule-class`

    const method = editingId ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user?.token}`
      },
      body: JSON.stringify(formData)
    })

    if (res.ok) {
      fetchClassList()
      handleClose()
    } else {
      alert('Something went wrong')
    }
  }


  const handleEdit = (cls: ClassSession) => {
    setEditingId(cls._id)
    setFormData({
      ...cls,
      startDate: cls.startDate?.split('T')[0]
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this class?')) return

    await fetch(`${baseURL}/admin/schedule-class/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${user?.token}` }
    })

    fetchClassList()
  }

  return (
    <Container className="py-4">

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>📋 Scheduled Classes </h3>
        {profileStatus === "approved" ? (
          <Button onClick={() => setShowModal(true)}>
            + Schedule Class
          </Button>
        ) : (
          <Button disabled variant="secondary">
            Profile Under Review
          </Button>
        )}
      </div>

      {profileStatus !== "approved" && (
        <div className="alert alert-warning mb-3">
          Your profile is under review. You can schedule classes once approved by admin.
        </div>
      )}

      {/* Table */}
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Title</th>
            <th>Course</th>
            <th>Cost</th>
            <th>Slots</th>
            <th>Date</th>
            <th>Days</th>
            <th>Time</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {classList.map(cls => (
            <tr key={cls._id}>
              <td>{cls.title}</td>
              <td>
                <strong>{cls.courseName}</strong>
                <div className="mt-1">
                  {cls.tags?.map((tag, i) => (
                    <span key={i} className="badge bg-info me-1">
                      {tag}
                    </span>
                  ))}
                </div>
              </td>
              <td>₹{cls.cost}</td>
              <td>{cls.availableSeats} / {cls.totalSeats}</td>
              <td>{new Date(cls.startDate).toLocaleDateString()}</td>
              <td>{cls.days?.join(', ')}</td>
              <td>{cls.startTime} - {cls.endTime}</td>
              <td>
                <Button
                  size="sm"
                  variant="secondary"
                  className="me-2"
                  onClick={() => handleEdit(cls)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDelete(cls._id)}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Modal */}
      <Modal show={showModal} onHide={handleClose} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingId ? 'Update Class' : 'Schedule New Class'}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body style={{ maxHeight: '75vh', overflowY: 'auto' }}>
          <Form onSubmit={handleSubmit}>

            {/* Title + Course */}
            <Row className="mb-3">
              <Col md={6}>
                <Form.Label>Class Title</Form.Label>
                <Form.Control
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </Col>

              <Col md={6}>
                <Form.Label>Course Name</Form.Label>
                <Form.Control
                  value={formData.courseName}
                  onChange={e => setFormData({ ...formData, courseName: e.target.value })}
                  required
                />
              </Col>
            </Row>

            {/* Tags */}
            <Form.Group className="mb-3">
              <Form.Label>Technologies</Form.Label>
              <Form.Control
                placeholder="Type and press Enter"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    const value = (e.target as HTMLInputElement).value.trim()
                    if (value && !formData.tags.includes(value)) {
                      setFormData(prev => ({
                        ...prev,
                        tags: [...prev.tags, value]
                      }))
                    }
                    ; (e.target as HTMLInputElement).value = ''
                  }
                }}
              />
              <div className="mt-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="badge bg-primary me-2"
                    style={{ cursor: 'pointer' }}
                    onClick={() =>
                      setFormData(prev => ({
                        ...prev,
                        tags: prev.tags.filter(t => t !== tag)
                      }))
                    }
                  >
                    {tag} ✕
                  </span>
                ))}
              </div>
            </Form.Group>

            {/* Description */}
            <Form.Group className="mb-4">
              <Form.Label>Full Description</Form.Label>

              <div
                style={{
                  backgroundColor: '#1f1f2e',
                  border: '1px solid #444',
                  borderRadius: '6px',
                  minHeight: '250px'
                }}
              >
                <ReactQuill
                  theme="snow"
                  value={formData.description}
                  onChange={(value) =>
                    setFormData({ ...formData, description: value })
                  }
                  style={{
                    height: '200px'
                  }}
                />
              </div>
            </Form.Group>

            {/* Cost & Slots */}
            <Row className="mb-3">
              <Col md={6}>
                <Form.Label>Course Cost (₹)</Form.Label>
                <Form.Control
                  type="number"
                  value={formData.cost}
                  onChange={e => setFormData({ ...formData, cost: Number(e.target.value) })}
                  required
                />
              </Col>

              <Col md={6}>
                <Form.Label>Max Slots</Form.Label>
                <Form.Select
                  value={formData.totalSeats}
                  onChange={e => setFormData({ ...formData, totalSeats: Number(e.target.value) })}
                >
                  <option value={10}>10 Members</option>
                  <option value={15}>15 Members</option>
                  <option value={20}>20 Members</option>
                  <option value={30}>30 Members</option>
                </Form.Select>
              </Col>
            </Row>

            {/* Start Date + Days */}
            <Row className="mb-3">
              <Col md={6}>
                <Form.Label>Start Date</Form.Label>
                <Form.Control
                  type="date"
                  value={formData.startDate}
                  onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </Col>

              <Col md={6}>
                <Form.Label>Teaching Days</Form.Label>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                  <Form.Check
                    key={day}
                    type="checkbox"
                    label={day}
                    checked={formData.days.includes(day)}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        days: e.target.checked
                          ? [...prev.days, day]
                          : prev.days.filter(d => d !== day)
                      }))
                    }}
                  />
                ))}
              </Col>
            </Row>

            {/* Time */}
            <Row className="mb-3">
              <Col md={6}>
                <Form.Label>Start Time</Form.Label>
                <Form.Control
                  type="time"
                  value={formData.startTime}
                  onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                  required
                />
              </Col>

              <Col md={6}>
                <Form.Label>End Time</Form.Label>
                <Form.Control
                  type="time"
                  value={formData.endTime}
                  onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                  required
                />
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Meeting Link</Form.Label>
              <Form.Control
                type="url"
                value={formData.meetingLink}
                onChange={e => setFormData({ ...formData, meetingLink: e.target.value })}
                required
              />
            </Form.Group>

            <Button type="submit" className="w-100">
              {editingId ? 'Update Class' : 'Schedule Class'}
            </Button>

          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  )
}

export default ScheduleClassForm