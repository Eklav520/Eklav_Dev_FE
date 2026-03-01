import React, { useEffect, useState } from 'react'
import { Form, Button, Container, Row, Col, Table } from 'react-bootstrap'
import ReactQuill from 'react-quill-new'
import 'quill/dist/quill.snow.css'

interface ScheduleClassFormProps {
  adminId: string
}

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

const ScheduleClassForm: React.FC<ScheduleClassFormProps> = ({ adminId }) => {
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [formData, setFormData] = useState<Omit<ClassSession, '_id'>>({
    title: '',
    courseName: '',
    cost: 0,
    totalSeats: 20,
    startDate: '',
    days: [],
    startTime: '',
    endTime: '',
    meetingLink: '',
    tags: [],
    description: ''
  })

  const [classList, setClassList] = useState<ClassSession[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    fetchClassList()
  }, [])

  const fetchClassList = async () => {
    try {
      const res = await fetch(`${baseURL}/admin/classes`)
      const data = await res.json()
      setClassList(data)
    } catch (err) {
      console.error('Error fetching classes:', err)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      courseName: '',
      cost: 0,
      totalSeats: 20,
      startDate: '',
      days: [],
      startTime: '',
      endTime: '',
      meetingLink: '',
      tags: [],
      description: ''
    })
  }

  const handleChange = (e: any) => {
    const { name, value } = e.target

    if (name === 'cost' || name === 'totalSeats') {
      setFormData(prev => ({ ...prev, [name]: Number(value) }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const payload = {
      ...formData,
      createdBy: adminId
    }

    try {
      const url = editingId
        ? `${baseURL}/admin/schedule-class/${editingId}`
        : `${baseURL}/admin/schedule-class`

      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        alert(editingId ? 'Class updated successfully!' : 'Class scheduled successfully!')
        resetForm()
        setEditingId(null)
        fetchClassList()
      } else {
        const error = await res.json()
        alert(`Failed: ${error.error}`)
      }
    } catch (err) {
      console.error('Error:', err)
      alert('Something went wrong.')
    }
  }

  const handleEdit = (cls: ClassSession) => {
    setFormData({
      title: cls.title,
      courseName: cls.courseName,
      cost: cls.cost,
      totalSeats: cls.totalSeats,
      startDate: cls.startDate?.split('T')[0],
      days: cls.days || [],
      startTime: cls.startTime,
      endTime: cls.endTime,
      meetingLink: cls.meetingLink,
      tags: cls.tags || [],
      description: cls.description || ''
    })
    setEditingId(cls._id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (classId: string) => {
    if (!window.confirm('Are you sure you want to delete this class?')) return

    try {
      const res = await fetch(`${baseURL}/admin/schedule-class/${classId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        alert('Class deleted')
        fetchClassList()
      } else {
        alert('Delete failed')
      }
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  return (
    <Container className="py-4">
      <h2>{editingId ? '✏️ Update Class' : '🗓️ Schedule New Class'}</h2>

      <Form onSubmit={handleSubmit}>
        {/* Title + Course Name */}
        <Row className="mb-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label>Class Title</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </Form.Group>
          </Col>

          <Col md={6}>
            <Form.Group>
              <Form.Label>Course Name</Form.Label>
              <Form.Control
                type="text"
                name="courseName"
                value={formData.courseName}
                onChange={handleChange}
                placeholder="Eg: React Beginner Batch"
                required
              />
            </Form.Group>
          </Col>
        </Row>

        {/* Tags */}
        <Form.Group className="mb-3">
          <Form.Label>Technologies</Form.Label>
          <Form.Control
            type="text"
            placeholder="Type and press Enter (Eg: React.js)"
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
          <ReactQuill
            theme="snow"
            value={formData.description}
            onChange={(value) =>
              setFormData(prev => ({
                ...prev,
                description: value
              }))
            }
            style={{ height: '300px', marginBottom: '50px' }}
          />
        </Form.Group>

        {/* Cost & Slots */}
        <Row className="mb-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label>Course Cost (₹)</Form.Label>
              <Form.Control
                type="number"
                name="cost"
                value={formData.cost}
                onChange={handleChange}
                min="0"
                required
              />
            </Form.Group>
          </Col>

          <Col md={6}>
            <Form.Group>
              <Form.Label>Max Slots</Form.Label>
              <Form.Select
                name="totalSeats"
                value={formData.totalSeats}
                onChange={handleChange}
                required
              >
                <option value={10}>10 Members</option>
                <option value={15}>15 Members</option>
                <option value={20}>20 Members</option>
                <option value={30}>30 Members</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        {/* Start Date & Days */}
        <Row className="mb-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label>Start Date</Form.Label>
              <Form.Control
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
              />
            </Form.Group>
          </Col>

          <Col md={6}>
            <Form.Group>
              <Form.Label>Teaching Days</Form.Label>
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                <Form.Check
                  key={day}
                  type="checkbox"
                  label={day}
                  value={day}
                  checked={formData.days.includes(day)}
                  onChange={(e) => {
                    const value = e.target.value
                    setFormData(prev => ({
                      ...prev,
                      days: e.target.checked
                        ? [...prev.days, value]
                        : prev.days.filter(d => d !== value)
                    }))
                  }}
                />
              ))}
            </Form.Group>
          </Col>
        </Row>

        {/* Time */}
        <Row className="mb-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label>Start Time</Form.Label>
              <Form.Control
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                required
              />
            </Form.Group>
          </Col>

          <Col md={6}>
            <Form.Group>
              <Form.Label>End Time</Form.Label>
              <Form.Control
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                required
              />
            </Form.Group>
          </Col>
        </Row>

        <Form.Group className="mb-3">
          <Form.Label>Meeting Link</Form.Label>
          <Form.Control
            type="url"
            name="meetingLink"
            value={formData.meetingLink}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Button variant={editingId ? 'warning' : 'primary'} type="submit">
          {editingId ? 'Update Class' : 'Schedule Class'}
        </Button>
      </Form>

      <hr />
      <h3>📋 Scheduled Classes</h3>

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Title</th>
            <th>Course</th>
            <th>Description</th>
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

              <td style={{ maxWidth: '250px' }}>
                <div
                  dangerouslySetInnerHTML={{
                    __html: cls.description?.slice(0, 120) + '...'
                  }}
                />
              </td>

              <td>₹{cls.cost}</td>
              <td>
                {cls.availableSeats} / {cls.totalSeats}
              </td>
              <td>{new Date(cls.startDate).toLocaleDateString()}</td>
              <td>{cls.days?.join(', ')}</td>
              <td>{cls.startTime} - {cls.endTime}</td>

              <td>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleEdit(cls)}
                  className="me-2"
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(cls._id)}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  )
}

export default ScheduleClassForm