import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Card, Button, Form, Row, Col, Table, Image, Modal, Spinner, Alert } from 'react-bootstrap'

type College = {
  _id: string
  name: string
  address: string
  pincode: string
  logo?: string
}

const CollegeAdmin: React.FC = () => {
  const [colleges, setColleges] = useState<College[]>([])
  const [form, setForm] = useState<{ name: string; address: string; pincode: string; logo: File | null }>({
    name: '',
    address: '',
    pincode: '',
    logo: null,
  })
  const [editing, setEditing] = useState<College | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ✅ Base URL from .env
  const baseURL = import.meta.env.VITE_API_BASE_URL

  // ✅ Fetch all colleges safely
  const fetchColleges = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${baseURL}/api/colleges`)
      const data = Array.isArray(res.data) ? res.data : res.data.colleges || []
      setColleges(data)
      setError(null)
    } catch (err) {
      console.error('❌ Error fetching colleges:', err)
      setError('Failed to fetch college list. Please try again later.')
      setColleges([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchColleges()
  }, [])

  // ✅ Add or update college
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      const data = new FormData()
      Object.entries(form).forEach(([key, value]) => {
        if (value) data.append(key, value)
      })

      if (editing) {
        await axios.put(`${baseURL}/api/colleges/${editing._id}`, data)
      } else {
        await axios.post(`${baseURL}/api/colleges`, data)
      }

      setForm({ name: '', address: '', pincode: '', logo: null })
      setEditing(null)
      setShowModal(false)
      fetchColleges()
    } catch (err) {
      console.error('❌ Error saving college:', err)
      alert('Failed to save college. Please check your input or try again.')
    } finally {
      setLoading(false)
    }
  }

  // ✅ Delete college
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this college?')) return
    try {
      setLoading(true)
      await axios.delete(`${baseURL}/api/colleges/${id}`)
      fetchColleges()
    } catch (err) {
      console.error('❌ Error deleting college:', err)
      alert('Failed to delete college. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  // ✅ Open edit modal
  const handleEdit = (college: College) => {
    setEditing(college)
    setForm({
      name: college.name,
      address: college.address,
      pincode: college.pincode,
      logo: null,
    })
    setShowModal(true)
  }

  return (
    <Card className="p-4 shadow-sm border-0">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0 fw-semibold">🎓 College Management</h4>
        <Button
          variant="primary"
          onClick={() => {
            setEditing(null) // ensure we're not in edit mode
            setForm({ name: '', address: '', pincode: '', logo: null }) // clear form
            setShowModal(true)
          }}>
          ➕ Add College
        </Button>
      </div>

      {/* Loading & Error Messages */}
      {loading && (
        <div className="text-center my-3">
          <Spinner animation="border" variant="primary" />
        </div>
      )}
      {error && (
        <Alert variant="danger" className="text-center">
          {error}
        </Alert>
      )}

      {/* Table */}
      <Table bordered hover responsive className="align-middle mt-3">
        <thead className="table-light">
          <tr>
            <th>Logo</th>
            <th>Name</th>
            <th>Address</th>
            <th>Pincode</th>
            <th className="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(colleges) && colleges.length > 0
            ? colleges.map((c) => (
                <tr key={c._id}>
                  <td>{c.logo ? <Image src={c.logo} height={50} rounded /> : <span className="text-muted">No Logo</span>}</td>
                  <td>{c.name}</td>
                  <td>{c.address}</td>
                  <td>{c.pincode}</td>
                  <td className="text-center">
                    <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleEdit(c)}>
                      Edit
                    </Button>
                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(c._id)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))
            : !loading && (
                <tr>
                  <td colSpan={5} className="text-center py-3 text-muted">
                    No colleges found.
                  </td>
                </tr>
              )}
        </tbody>
      </Table>

      {/* Modal for Add/Edit */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editing ? 'Edit College' : 'Add College'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row className="g-3">
              <Col md={12}>
                <Form.Label>College Name</Form.Label>
                <Form.Control placeholder="College Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Col>
              <Col md={12}>
                <Form.Label>Address</Form.Label>
                <Form.Control placeholder="Address" required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </Col>
              <Col md={6}>
                <Form.Label>Pincode</Form.Label>
                <Form.Control placeholder="Pincode" required value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
              </Col>
              <Col md={6}>
                <Form.Label>Logo</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const target = e.target as HTMLInputElement
                    const file = target.files?.[0] || null
                    setForm({ ...form, logo: file })
                  }}
                />
                {editing?.logo && (
                  <div className="mt-2 text-center">
                    <Image src={editing.logo} height={60} rounded />
                    <div className="small text-muted">Current Logo</div>
                  </div>
                )}
              </Col>
            </Row>
            <div className="text-end mt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowModal(false)
                  setEditing(null)
                  setForm({ name: '', address: '', pincode: '', logo: null })
                }}
                className="me-2">
                Cancel
              </Button>

              <Button type="submit" variant="success" disabled={loading}>
                {editing ? 'Update College' : 'Add College'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Card>
  )
}

export default CollegeAdmin
