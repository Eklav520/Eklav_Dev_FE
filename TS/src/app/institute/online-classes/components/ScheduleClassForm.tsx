import React, { useEffect, useState } from 'react'
import {
  Form,
  Button,
  Container,
  Row,
  Col,
  Table,
  Modal,
  Badge
} from 'react-bootstrap'
import ReactQuill from 'react-quill-new'
import 'quill/dist/quill.snow.css'
import { useAuthContext } from '@/context/useAuthContext'
import {
  FaCalendarAlt,
  FaClock,
  FaUsers,
  FaRupeeSign,
  FaTag,
  FaEdit,
  FaTrash,
  FaPlus,
  FaTimes,
  FaBook,
  FaVideo,
  FaChalkboardTeacher
} from 'react-icons/fa'

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

  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [classList, setClassList] = useState<ClassSession[]>([])
  const [profileStatus, setProfileStatus] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

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
    try {
      const res = await fetch(`${baseURL}/institute/classes`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      })
      const data = await res.json()
      setClassList(data.classes || [])
    } catch (err) {
      console.error("Failed to fetch classes", err)
      setClassList([])
    }
  }

  const handleClose = () => {
    setShowModal(false)
    setEditingId(null)
    setFormData(initialState)
    setSubmitting(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const url = editingId
      ? `${baseURL}/institute/schedule-class/${editingId}`
      : `${baseURL}/institute/schedule-class`

    const method = editingId ? 'PUT' : 'POST'

    try {
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
    } catch (err) {
      console.error(err)
      alert('Failed to save class')
    } finally {
      setSubmitting(false)
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
    if (!window.confirm('Are you sure you want to delete this class?')) return

    try {
      await fetch(`${baseURL}/institute/schedule-class/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user?.token}` }
      })
      fetchClassList()
    } catch (err) {
      console.error(err)
      alert('Failed to delete class')
    }
  }

  const totalClasses = classList.length
  const totalRevenue = classList.reduce((sum, cls) => sum + cls.cost, 0)

  return (
    <div className="schedule-class-container">
      <Container fluid className="py-4">
        {/* Header */}
        <div className="header-section">
          <div className="header-content">
            <div>
              <h3 className="header-title">
                <FaChalkboardTeacher className="header-icon" />
                Scheduled Classes
              </h3>
              <p className="header-subtitle">Manage your institute's upcoming classes and sessions</p>
            </div>
            {profileStatus === "approved" ? (
              <Button className="schedule-btn" onClick={() => setShowModal(true)}>
                <FaPlus className="me-2" />
                Schedule New Class
              </Button>
            ) : (
              <Button disabled className="disabled-btn" variant="secondary">
                Profile Under Review
              </Button>
            )}
          </div>
        </div>

        {/* Stats Summary */}
        <div className="stats-summary">
          <div className="stat-card">
            <div className="stat-icon classes-icon">
              <FaChalkboardTeacher />
            </div>
            <div className="stat-info">
              <span className="stat-label">Total Classes</span>
              <span className="stat-value">{totalClasses}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon revenue-icon">
              <FaRupeeSign />
            </div>
            <div className="stat-info">
              <span className="stat-label">Total Revenue</span>
              <span className="stat-value">₹ {totalRevenue.toLocaleString()}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon students-icon">
              <FaUsers />
            </div>
            <div className="stat-info">
              <span className="stat-label">Active Classes</span>
              <span className="stat-value">
                {classList.filter(c => c.availableSeats && c.availableSeats > 0).length}
              </span>
            </div>
          </div>
        </div>

        {profileStatus !== "approved" && (
          <div className="alert-warning-custom">
            <FaTag className="alert-icon" />
            Your profile is under review. You can schedule classes once approved by admin.
          </div>
        )}

        {/* Table */}
        <div className="table-container">
          <div className="table-responsive">
            <Table className="custom-table" hover>
              <thead>
                <tr>
                  <th style={{ width: '25%' }}>Class Details</th>
                  <th style={{ width: '10%' }}>Pricing</th>
                  <th style={{ width: '25%' }}>Schedule</th>
                  <th style={{ width: '15%' }}>Availability</th>
                  <th style={{ width: '10%' }}>Meeting</th>
                  <th style={{ width: '15%' }} className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(classList) && classList.length > 0 ? (
                  classList.map(cls => (
                    <tr key={cls._id}>
                      <td>
                        <div className="class-info">
                          <div className="class-title">{cls.title}</div>
                          <div className="class-course">
                            <FaBook className="me-1" />
                            {cls.courseName}
                          </div>
                          <div className="class-tags mt-2">
                            {cls.tags?.slice(0, 3).map((tag, i) => (
                              <span key={i} className="tag-badge">
                                {tag}
                              </span>
                            ))}
                            {cls.tags?.length > 3 && (
                              <span className="tag-badge">+{cls.tags.length - 3}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="price-info">
                          <FaRupeeSign className="price-icon" />
                          <span className="price-value">{cls.cost}</span>
                        </div>
                      </td>
                      <td>
                        <div className="schedule-info">
                          <div className="schedule-date">
                            <FaCalendarAlt className="schedule-icon" />
                            {new Date(cls.startDate).toLocaleDateString()}
                          </div>
                          <div className="schedule-days">
                            {cls.days?.slice(0, 3).join(', ')}
                            {cls.days?.length > 3 && '...'}
                          </div>
                          <div className="schedule-time">
                            <FaClock className="schedule-icon" />
                            {cls.startTime} - {cls.endTime}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="availability-info">
                          <FaUsers className="availability-icon" />
                          <span className={`availability-count ${cls.availableSeats === 0 ? 'sold-out' : ''}`}>
                            {cls.availableSeats} / {cls.totalSeats}
                          </span>
                          {cls.availableSeats === 0 && (
                            <span className="sold-out-badge">Full</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <a
                          href={cls.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="meeting-link"
                        >
                          <FaVideo />
                          <span>Join</span>
                        </a>
                      </td>
                      <td className="text-center">
                        <div className="action-buttons">
                          <Button
                            size="sm"
                            className="edit-btn"
                            onClick={() => handleEdit(cls)}
                          >
                            <FaEdit />
                          </Button>
                          <Button
                            size="sm"
                            className="delete-btn"
                            onClick={() => handleDelete(cls._id)}
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="empty-state">
                      <div className="empty-state-content">
                        <FaChalkboardTeacher className="empty-icon" />
                        <p>No classes scheduled yet</p>
                        <span>Click the "Schedule New Class" button to create your first class</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </div>

        {/* Modal */}
        <Modal
          show={showModal}
          onHide={handleClose}
          fullscreen
          className="class-modal"
        >
          <Modal.Header closeButton className="modal-header-custom">
            <Modal.Title>
              {editingId ? 'Update Class' : 'Schedule New Class'}
            </Modal.Title>
          </Modal.Header>

          <Modal.Body className="modal-body-custom">
            <Form onSubmit={handleSubmit}>
              {/* Title + Course */}
              <Row className="mb-4">
                <Col md={6}>
                  <Form.Label className="form-label-custom">Class Title</Form.Label>
                  <Form.Control
                    className="form-control-custom"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter class title"
                    required
                  />
                </Col>

                <Col md={6}>
                  <Form.Label className="form-label-custom">Course Name</Form.Label>
                  <Form.Control
                    className="form-control-custom"
                    value={formData.courseName}
                    onChange={e => setFormData({ ...formData, courseName: e.target.value })}
                    placeholder="Enter course name"
                    required
                  />
                </Col>
              </Row>

              {/* Tags */}
              <Form.Group className="mb-4">
                <Form.Label className="form-label-custom">Technologies</Form.Label>
                <Form.Control
                  className="form-control-custom"
                  placeholder="Type technology and press Enter"
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
                <div className="tags-container mt-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="tag-item"
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
                <Form.Label className="form-label-custom">Full Description</Form.Label>
                <div className="quill-container">
                  <ReactQuill
                    theme="snow"
                    value={formData.description}
                    onChange={(value) =>
                      setFormData({ ...formData, description: value })
                    }
                    className="custom-quill"
                  />
                </div>
              </Form.Group>

              {/* Cost & Slots */}
              <Row className="mb-4">
                <Col md={6}>
                  <Form.Label className="form-label-custom">Course Cost (₹)</Form.Label>
                  <Form.Control
                    type="number"
                    className="form-control-custom"
                    value={formData.cost}
                    onChange={e => setFormData({ ...formData, cost: Number(e.target.value) })}
                    required
                  />
                </Col>

                <Col md={6}>
                  <Form.Label className="form-label-custom">Max Slots</Form.Label>
                  <Form.Select
                    className="form-select-custom"
                    value={formData.totalSeats}
                    onChange={e => setFormData({ ...formData, totalSeats: Number(e.target.value) })}
                  >
                    <option value={10}>10 Members</option>
                    <option value={15}>15 Members</option>
                    <option value={20}>20 Members</option>
                    <option value={30}>30 Members</option>
                    <option value={40}>40 Members</option>
                    <option value={50}>50 Members</option>
                  </Form.Select>
                </Col>
              </Row>

              {/* Start Date + Days */}
              <Row className="mb-4">
                <Col md={6}>
                  <Form.Label className="form-label-custom">Start Date</Form.Label>
                  <Form.Control
                    type="date"
                    className="form-control-custom"
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </Col>

                <Col md={6}>
                  <Form.Label className="form-label-custom">Teaching Days</Form.Label>
                  <div className="days-checkbox-group">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                      <Form.Check
                        key={day}
                        type="checkbox"
                        label={day}
                        className="day-checkbox"
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
                  </div>
                </Col>
              </Row>

              {/* Time */}
              <Row className="mb-4">
                <Col md={6}>
                  <Form.Label className="form-label-custom">Start Time</Form.Label>
                  <Form.Control
                    type="time"
                    className="form-control-custom"
                    value={formData.startTime}
                    onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                    required
                  />
                </Col>

                <Col md={6}>
                  <Form.Label className="form-label-custom">End Time</Form.Label>
                  <Form.Control
                    type="time"
                    className="form-control-custom"
                    value={formData.endTime}
                    onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                    required
                  />
                </Col>
              </Row>

              <Form.Group className="mb-4">
                <Form.Label className="form-label-custom">Meeting Link</Form.Label>
                <Form.Control
                  type="url"
                  className="form-control-custom"
                  value={formData.meetingLink}
                  onChange={e => setFormData({ ...formData, meetingLink: e.target.value })}
                  placeholder="https://meet.google.com/..."
                  required
                />
              </Form.Group>

              <div className="form-actions">
                <Button
                  variant="secondary"
                  className="cancel-btn"
                  onClick={handleClose}
                  disabled={submitting}
                >
                  <FaTimes className="me-2" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="submit-btn"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-small"></span>
                      {editingId ? 'Updating...' : 'Scheduling...'}
                    </>
                  ) : (
                    <>
                      <FaPlus className="me-2" />
                      {editingId ? 'Update Class' : 'Schedule Class'}
                    </>
                  )}
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </Modal>
      </Container>

      <style>{`
        .schedule-class-container {
          background: #000000;
          min-height: 100vh;
          color: #ffffff;
        }

        /* Header Section */
        .header-section {
          background: linear-gradient(135deg, #0a0a0a 0%, #000000 100%);
          border-bottom: 1px solid #ff7a00;
          padding: 1.5rem;
          margin-bottom: 2rem;
          border-radius: 12px;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .header-title {
          color: #ffffff;
          font-size: 1.75rem;
          font-weight: 700;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .header-icon {
          color: #ff7a00;
          font-size: 1.5rem;
        }

        .header-subtitle {
          color: #8a8a8a;
          margin: 0.5rem 0 0 0;
          font-size: 0.9rem;
        }

        .schedule-btn {
          background: linear-gradient(135deg, #ff7a00 0%, #ff944d 100%);
          border: none;
          padding: 0.625rem 1.5rem;
          border-radius: 8px;
          color: #000000;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .schedule-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 122, 0, 0.4);
        }

        .disabled-btn {
          background: #2c2c2c;
          border: none;
          color: #8a8a8a;
          cursor: not-allowed;
        }

        /* Stats Summary */
        .stats-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: #0a0a0a;
          border: 1px solid #1f1f1f;
          border-radius: 12px;
          padding: 1.25rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          transition: all 0.2s ease;
        }

        .stat-card:hover {
          border-color: #ff7a00;
          transform: translateY(-2px);
        }

        .stat-icon {
          width: 52px;
          height: 52px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.75rem;
        }

        .classes-icon {
          background: rgba(255, 122, 0, 0.1);
          color: #ff7a00;
        }

        .revenue-icon {
          background: rgba(40, 167, 69, 0.1);
          color: #28a745;
        }

        .students-icon {
          background: rgba(23, 162, 184, 0.1);
          color: #17a2b8;
        }

        .stat-info {
          flex: 1;
        }

        .stat-label {
          display: block;
          color: #8a8a8a;
          font-size: 0.8rem;
          margin-bottom: 0.25rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-value {
          display: block;
          color: #ffffff;
          font-size: 1.25rem;
          font-weight: 600;
        }

        /* Alert */
        .alert-warning-custom {
          background: rgba(255, 122, 0, 0.1);
          border-left: 4px solid #ff7a00;
          padding: 1rem;
          margin-bottom: 1.5rem;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #ff7a00;
        }

        .alert-icon {
          font-size: 1.25rem;
        }

        /* Table */
        .table-container {
          background: #0a0a0a;
          border-radius: 12px;
          border: 1px solid #1f1f1f;
          overflow: hidden;
        }

        .custom-table {
          background: #0a0a0a;
          color: #e5e5e5;
          margin-bottom: 0;
        }

        .custom-table thead th {
          background: #000000;
          color: #ff7a00;
          padding: 1rem;
          font-weight: 600;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #ff7a00;
        }

        .custom-table tbody tr {
          border-bottom: 1px solid #1f1f1f;
          transition: background 0.2s ease;
        }

        .custom-table tbody tr:hover {
          background: #141414;
        }

        .custom-table td {
          padding: 1rem;
          vertical-align: middle;
        }

        /* Class Info */
        .class-title {
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 0.25rem;
        }

        .class-course {
          font-size: 0.85rem;
          color: #ff7a00;
          display: flex;
          align-items: center;
        }

        .tag-badge {
          background: #1f1f1f;
          color: #ff7a00;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.7rem;
          margin-right: 0.5rem;
          display: inline-block;
        }

        /* Price Info */
        .price-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .price-icon {
          color: #ff7a00;
          font-size: 1rem;
        }

        .price-value {
          font-size: 1.1rem;
          font-weight: 600;
          color: #ffffff;
        }

        /* Schedule Info */
        .schedule-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .schedule-date, .schedule-time {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
        }

        .schedule-days {
          font-size: 0.8rem;
          color: #8a8a8a;
        }

        .schedule-icon {
          color: #ff7a00;
          font-size: 0.75rem;
        }

        /* Availability */
        .availability-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .availability-icon {
          color: #ff7a00;
        }

        .availability-count {
          font-weight: 600;
          color: #ffffff;
        }

        .availability-count.sold-out {
          color: #ff6b6b;
        }

        .sold-out-badge {
          background: #ff6b6b;
          color: #000000;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 600;
        }

        /* Meeting Link */
        .meeting-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: #ff7a00;
          text-decoration: none;
          padding: 0.375rem 0.75rem;
          background: rgba(255, 122, 0, 0.1);
          border-radius: 6px;
          transition: all 0.2s ease;
        }

        .meeting-link:hover {
          background: #ff7a00;
          color: #000000;
        }

        /* Action Buttons */
        .action-buttons {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
        }

        .edit-btn, .delete-btn {
          padding: 0.375rem 0.75rem;
          border: none;
          transition: all 0.2s ease;
        }

        .edit-btn {
          background: #ff7a00;
          color: #000000;
        }

        .edit-btn:hover {
          background: #ff944d;
          transform: translateY(-1px);
        }

        .delete-btn {
          background: #dc3545;
          color: #ffffff;
        }

        .delete-btn:hover {
          background: #c82333;
          transform: translateY(-1px);
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 3rem;
        }

        .empty-state-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .empty-icon {
          font-size: 3rem;
          color: #ff7a00;
          opacity: 0.5;
        }

        .empty-state-content p {
          margin: 0;
          font-size: 1rem;
          color: #ffffff;
          font-weight: 500;
        }

        .empty-state-content span {
          font-size: 0.85rem;
          color: #8a8a8a;
        }

        /* Modal */
        .class-modal .modal-content {
          background: #0a0a0a;
          border: 1px solid #ff7a00;
          border-radius: 12px;
        }

        .modal-header-custom {
          border-bottom: 1px solid #1f1f1f;
          padding: 1rem 1.5rem;
        }

        .modal-header-custom .modal-title {
          color: #ff7a00;
          font-weight: 600;
        }

        .modal-body-custom {
          padding: 1.5rem;
        }

        .form-label-custom {
          color: #ff7a00;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }

        .form-control-custom, .form-select-custom {
          background: #000000;
          border: 1px solid #2c2c2c;
          color: #ffffff;
          padding: 0.625rem;
          border-radius: 8px;
        }

        .form-control-custom:focus, .form-select-custom:focus {
          background: #141414;
          border-color: #ff7a00;
          box-shadow: 0 0 0 0.2rem rgba(255, 122, 0, 0.25);
          color: #ffffff;
        }

        .tags-container {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .tag-item {
          background: #ff7a00;
          color: #000000;
          padding: 0.25rem 0.75rem;
          border-radius: 4px;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .tag-item:hover {
          background: #ff944d;
          transform: translateY(-1px);
        }

        .quill-container {
          background: #000000;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #2c2c2c;
        }

        .custom-quill .ql-toolbar {
          background: #1a1a1a;
          border: none;
          border-bottom: 1px solid #2c2c2c;
        }

        .custom-quill .ql-container {
          background: #000000;
          border: none;
          min-height: 300px;
          color: #ffffff;
        }

        .days-checkbox-group {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, auto));
          gap: 0.5rem;
          background: #000000;
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid #2c2c2c;
        }

        .day-checkbox {
          color: #e5e5e5;
        }

        .day-checkbox .form-check-input {
          background-color: #1a1a1a;
          border-color: #2c2c2c;
        }

        .day-checkbox .form-check-input:checked {
          background-color: #ff7a00;
          border-color: #ff7a00;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid #1f1f1f;
        }

        .cancel-btn {
          background: #2c2c2c;
          border: none;
          padding: 0.625rem 1.5rem;
          border-radius: 8px;
          color: #ffffff;
        }

        .cancel-btn:hover {
          background: #3a3a3a;
        }

        .submit-btn {
          background: linear-gradient(135deg, #ff7a00 0%, #ff944d 100%);
          border: none;
          padding: 0.625rem 1.5rem;
          border-radius: 8px;
          color: #000000;
          font-weight: 600;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 122, 0, 0.4);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner-small {
          display: inline-block;
          width: 1rem;
          height: 1rem;
          border: 2px solid #000000;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          margin-right: 0.5rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .header-content {
            flex-direction: column;
            align-items: flex-start;
          }

          .schedule-btn {
            width: 100%;
          }

          .stats-summary {
            grid-template-columns: 1fr;
          }

          .action-buttons {
            flex-direction: column;
          }

          .form-actions {
            flex-direction: column-reverse;
          }

          .cancel-btn, .submit-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}

export default ScheduleClassForm