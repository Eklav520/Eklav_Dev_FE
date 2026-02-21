import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Card, Button, Form, Row, Col, Table, Modal, Spinner, Alert, Badge } from 'react-bootstrap'
import { useAuthContext } from '@/context/useAuthContext'

type Coupon = {
  _id: string
  code: string
  college: string
  discountPercent: number
  startDate: string
  endDate: string
  maxUses: number | null
  usedCount: number
  isActive: boolean
}

type CouponForm = {
  code: string
  college: string
  discountPercent: string
  startDate: string
  endDate: string
  maxUses: string
  isActive: boolean
}

const emptyForm: CouponForm = {
  code: '',
  college: 'ALL',
  discountPercent: '',
  startDate: '',
  endDate: '',
  maxUses: '',
  isActive: true,
}

const CouponAdmin: React.FC = () => {
  const { user } = useAuthContext()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [form, setForm] = useState<CouponForm>({ ...emptyForm })
  const [editing, setEditing] = useState<Coupon | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const baseURL = import.meta.env.VITE_API_BASE_URL

  const authHeaders = {
    headers: { Authorization: `Bearer ${user?.token}` },
  }

  const fetchCoupons = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${baseURL}/api/coupons`, authHeaders)
      const data = Array.isArray(res.data) ? res.data : res.data.coupons || []
      setCoupons(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching coupons:', err)
      setError('Failed to fetch coupons. Please try again later.')
      setCoupons([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCoupons()
  }, [])

  const toDateInput = (dateStr: string) => {
    if (!dateStr) return ''
    return new Date(dateStr).toISOString().split('T')[0]
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)

      const payload = {
        code: form.code.toUpperCase(),
        college: form.college || 'ALL',
        discountPercent: Number(form.discountPercent),
        startDate: form.startDate,
        endDate: form.endDate,
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        isActive: form.isActive,
      }

      if (editing) {
        await axios.put(`${baseURL}/api/coupons/${editing._id}`, payload, authHeaders)
        setSuccess('Coupon updated successfully!')
      } else {
        await axios.post(`${baseURL}/api/coupons`, payload, authHeaders)
        setSuccess('Coupon created successfully!')
      }

      setForm({ ...emptyForm })
      setEditing(null)
      setShowModal(false)
      fetchCoupons()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      console.error('Error saving coupon:', err)
      const msg = err?.response?.data?.error || 'Failed to save coupon. Please check your input.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      setLoading(true)
      await axios.delete(`${baseURL}/api/coupons/${id}`, authHeaders)
      setSuccess('Coupon deleted successfully!')
      fetchCoupons()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error deleting coupon:', err)
      setError('Failed to delete coupon. Please try again later.')
    } finally {
      setLoading(false)
      setDeleteTarget(null)
    }
  }

  const handleEdit = (coupon: Coupon) => {
    setEditing(coupon)
    setForm({
      code: coupon.code,
      college: coupon.college,
      discountPercent: String(coupon.discountPercent),
      startDate: toDateInput(coupon.startDate),
      endDate: toDateInput(coupon.endDate),
      maxUses: coupon.maxUses !== null ? String(coupon.maxUses) : '',
      isActive: coupon.isActive,
    })
    setShowModal(true)
  }

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      await axios.put(`${baseURL}/api/coupons/${coupon._id}`, {
        isActive: !coupon.isActive,
      }, authHeaders)
      fetchCoupons()
    } catch (err) {
      console.error('Error toggling coupon:', err)
      setError('Failed to update coupon status.')
    }
  }

  const isExpired = (endDate: string) => new Date(endDate) < new Date()

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <Card className="p-4 shadow-sm border-0">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0 fw-semibold">🎟️ Coupon Management</h4>
        <Button
          variant="primary"
          onClick={() => {
            setEditing(null)
            setForm({ ...emptyForm })
            setError(null)
            setShowModal(true)
          }}>
          ➕ Add Coupon
        </Button>
      </div>

      {/* Loading & Messages */}
      {loading && (
        <div className="text-center my-3">
          <Spinner animation="border" variant="primary" />
        </div>
      )}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Table */}
      <Table bordered hover responsive className="align-middle mt-3">
        <thead className="table-light">
          <tr>
            <th>Code</th>
            <th>College</th>
            <th>Discount</th>
            <th>Valid Period</th>
            <th>Usage</th>
            <th>Status</th>
            <th className="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(coupons) && coupons.length > 0
            ? coupons.map((c) => (
                <tr key={c._id}>
                  <td>
                    <strong style={{ letterSpacing: '1px' }}>{c.code}</strong>
                  </td>
                  <td>
                    {c.college === 'ALL' ? (
                      <Badge bg="info" className="text-white">Universal</Badge>
                    ) : (
                      c.college
                    )}
                  </td>
                  <td>
                    <Badge bg="warning" text="dark">{c.discountPercent}% OFF</Badge>
                  </td>
                  <td>
                    <small>
                      {formatDate(c.startDate)} — {formatDate(c.endDate)}
                      {isExpired(c.endDate) && (
                        <Badge bg="danger" className="ms-2">Expired</Badge>
                      )}
                    </small>
                  </td>
                  <td>
                    {c.usedCount} / {c.maxUses ?? '∞'}
                  </td>
                  <td>
                    <Form.Check
                      type="switch"
                      checked={c.isActive}
                      onChange={() => handleToggleActive(c)}
                      label={c.isActive ? 'Active' : 'Inactive'}
                    />
                  </td>
                  <td className="text-center">
                    <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleEdit(c)}>
                      Edit
                    </Button>
                    <Button variant="outline-danger" size="sm" onClick={() => setDeleteTarget(c._id)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))
            : !loading && (
                <tr>
                  <td colSpan={7} className="text-center py-3 text-muted">
                    No coupons found.
                  </td>
                </tr>
              )}
        </tbody>
      </Table>

      {/* Modal for Add/Edit */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editing ? 'Edit Coupon' : 'Add Coupon'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row className="g-3">
              <Col md={6}>
                <Form.Label>Coupon Code <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  placeholder="e.g. EKLAV10"
                  required
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  style={{ textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}
                />
              </Col>
              <Col md={6}>
                <Form.Label>College</Form.Label>
                <Form.Control
                  placeholder='Enter college name or "ALL" for universal'
                  value={form.college}
                  onChange={(e) => setForm({ ...form, college: e.target.value })}
                />
                <Form.Text className="text-muted">Use "ALL" for a coupon valid for everyone</Form.Text>
              </Col>
              <Col md={4}>
                <Form.Label>Discount % <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="number"
                  placeholder="e.g. 10"
                  required
                  min={1}
                  max={100}
                  value={form.discountPercent}
                  onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
                />
              </Col>
              <Col md={4}>
                <Form.Label>Start Date <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="date"
                  required
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
              </Col>
              <Col md={4}>
                <Form.Label>End Date <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="date"
                  required
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </Col>
              <Col md={6}>
                <Form.Label>Max Uses</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Leave empty for unlimited"
                  min={1}
                  value={form.maxUses}
                  onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                />
                <Form.Text className="text-muted">Leave empty for unlimited usage</Form.Text>
              </Col>
              <Col md={6} className="d-flex align-items-end">
                <Form.Check
                  type="switch"
                  id="coupon-active-switch"
                  label="Active"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="mb-2"
                />
              </Col>
            </Row>
            <div className="text-end mt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowModal(false)
                  setEditing(null)
                  setForm({ ...emptyForm })
                }}
                className="me-2">
                Cancel
              </Button>
              <Button type="submit" variant="success" disabled={loading}>
                {editing ? 'Update Coupon' : 'Add Coupon'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={!!deleteTarget} onHide={() => setDeleteTarget(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete Coupon</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this coupon? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            disabled={loading}
            onClick={() => deleteTarget && handleDelete(deleteTarget)}
          >
            {loading ? <Spinner animation="border" size="sm" /> : 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  )
}

export default CouponAdmin
