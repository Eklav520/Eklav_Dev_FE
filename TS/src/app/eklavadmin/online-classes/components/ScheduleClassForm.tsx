import React, { useEffect, useState } from 'react'
import { Form, Button, Container, Row, Col, Table } from 'react-bootstrap'

interface ScheduleClassFormProps {
  adminId: string
}

interface Course {
  _id: string
  title: string
}

interface ClassSession {
  _id: string
  title: string
  courseId: string
  date: string
  startTime: string
  endTime: string
  meetingLink: string
}

const ScheduleClassForm: React.FC<ScheduleClassFormProps> = ({ adminId }) => {
  const [formData, setFormData] = useState<Omit<ClassSession, '_id'>>({
    title: '',
    courseId: '',
    date: '',
    startTime: '',
    endTime: '',
    meetingLink: '',
  })
  const [courses, setCourses] = useState<Course[]>([])
  const [classList, setClassList] = useState<ClassSession[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const baseURL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    fetchCourses()
    fetchClassList()
  }, [])

  const fetchCourses = async () => {
    try {
      const res = await fetch(`${baseURL}/courses`)
      const data = await res.json()
      setCourses(data)
    } catch (err) {
      console.error('Error fetching courses:', err)
    }
  }

  const fetchClassList = async () => {
    try {
      const res = await fetch(`${baseURL}/admin/classes`)
      const data = await res.json()
      setClassList(data)
    } catch (err) {
      console.error('Error fetching classes:', err)
    }
  }

  const handleChange = (e: any) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const payload = {
      ...formData,
      createdBy: adminId,
    }

    try {
      const url = editingId ? `${baseURL}/admin/schedule-class/${editingId}` : `${baseURL}/admin/schedule-class`

      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        alert(editingId ? 'Class updated successfully!' : 'Class scheduled successfully!')
        setFormData({
          title: '',
          courseId: '',
          date: '',
          startTime: '',
          endTime: '',
          meetingLink: '',
        })
        setEditingId(null)
        fetchClassList()
      } else {
        const error = await res.json()
        alert(`Failed: ${error.message}`)
      }
    } catch (err) {
      console.error('Error:', err)
      alert('Something went wrong.')
    }
  }

  const handleEdit = (cls: ClassSession) => {
    setFormData({
      title: cls.title,
      courseId: cls.courseId,
      date: cls.date,
      startTime: cls.startTime,
      endTime: cls.endTime,
      meetingLink: cls.meetingLink,
    })
    setEditingId(cls._id)
  }

  const handleDelete = async (classId: string) => {
    if (!window.confirm('Are you sure you want to delete this class?')) return
    try {
      const res = await fetch(`${baseURL}/admin/schedule-class/${classId}`, {
        method: 'DELETE',
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
        <Row className="mb-3">
          <Col>
            <Form.Group controlId="formTitle">
              <Form.Label>Class Title</Form.Label>
              <Form.Control type="text" name="title" value={formData.title} onChange={handleChange} required />
            </Form.Group>
          </Col>
          <Col>
            <Form.Group controlId="formCourseId">
              <Form.Label>Select Course</Form.Label>
              <Form.Select name="courseId" value={formData.courseId} onChange={handleChange} required>
                <option value="">-- Select Course --</option>
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.title}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        <Row className="mb-3">
          <Col md={4}>
            <Form.Group controlId="formDate">
              <Form.Label>Date</Form.Label>
              <Form.Control type="date" name="date" value={formData.date} onChange={handleChange} required />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group controlId="formStartTime">
              <Form.Label>Start Time</Form.Label>
              <Form.Control type="time" name="startTime" value={formData.startTime} onChange={handleChange} required />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group controlId="formEndTime">
              <Form.Label>End Time</Form.Label>
              <Form.Control type="time" name="endTime" value={formData.endTime} onChange={handleChange} required />
            </Form.Group>
          </Col>
        </Row>

        <Form.Group className="mb-3" controlId="formMeetingLink">
          <Form.Label>Meeting Link</Form.Label>
          <Form.Control type="url" name="meetingLink" value={formData.meetingLink} onChange={handleChange} required />
        </Form.Group>

        <Button variant={editingId ? 'warning' : 'primary'} type="submit">
          {editingId ? 'Update Class' : 'Schedule Class'}
        </Button>
      </Form>

      <hr />
      <h3>📋 Scheduled Classes</h3>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Title</th>
            <th>Meeting Link</th>
            <th>Date</th>
            <th>Time</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {classList.map((cls) => (
            <tr key={cls._id}>
              <td>{cls.title}</td>
              <td>
                <a href={cls.meetingLink} target="_blank" rel="noopener noreferrer">
                  {new URL(cls.meetingLink).hostname}
                </a>
              </td>
              {/* <td>{courses.find(c => c._id === cls.courseId)?.title || 'N/A'}</td> */}
              <td>{new Date(cls.date).toLocaleDateString()}</td>
              <td>
                {cls.startTime} - {cls.endTime}
              </td>
              <td>
                <Button variant="secondary" size="sm" onClick={() => handleEdit(cls)} className="me-2">
                  Edit
                </Button>
                <Button variant="danger" size="sm" onClick={() => handleDelete(cls._id)}>
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
