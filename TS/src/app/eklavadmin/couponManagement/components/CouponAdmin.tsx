import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Card, Button, Form, Row, Col, Table, Modal, Spinner, Alert, Badge } from 'react-bootstrap'
import { useAuthContext } from '@/context/useAuthContext'
import CollegeSearch from '@/app/(other)/auth/sign-up/components/CollegeSearch'
import {
  FaTicketAlt,
  FaPlus,
  FaEdit,
  FaTrash,
  FaCopy,
  FaCheck,
  FaTimes,
  FaSpinner,
  FaFilter,
  FaSearch,
  FaCalendarAlt,
  FaPercentage,
  FaUniversity,
  FaInfinity,
  FaToggleOn,
  FaToggleOff,
  FaDownload,
  FaEye,
  FaEyeSlash,
} from 'react-icons/fa'
import { MdDateRange, MdDiscount, MdCode, MdLocationOn, MdVerified, MdPending } from 'react-icons/md'

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
  createdAt?: string
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

// Professional Pagination Component
const CouponPagination: React.FC<{
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}> = ({ currentPage, totalPages, onPageChange }) => {
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5
    
    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      }
    }
    return pages
  }

  return (
    <div className="coupon-pagination">
      <div className="pagination-info">
        Page {currentPage} of {totalPages}
      </div>
      <div className="pagination-controls">
        <button className="pagination-btn" onClick={() => onPageChange(1)} disabled={currentPage === 1}>«</button>
        <button className="pagination-btn" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>‹</button>
        {getPageNumbers().map((page, idx) => (
          page === '...' ? <span key={`dots-${idx}`} className="pagination-dots">...</span> :
          <button key={idx} className={`pagination-btn ${currentPage === page ? 'active' : ''}`} onClick={() => onPageChange(page as number)}>{page}</button>
        ))}
        <button className="pagination-btn" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>›</button>
        <button className="pagination-btn" onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages}>»</button>
      </div>
      <div className="pagination-stats">
        Showing {((currentPage - 1) * 10) + 1} - {Math.min(currentPage * 10, totalPages * 10)} of {totalPages * 10}+ Coupons
      </div>
    </div>
  )
}

const CouponAdmin: React.FC = () => {
  const { user } = useAuthContext()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [filteredCoupons, setFilteredCoupons] = useState<Coupon[]>([])
  const [form, setForm] = useState<CouponForm>({ ...emptyForm })
  const [editing, setEditing] = useState<Coupon | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const baseURL = import.meta.env.VITE_API_BASE_URL
  const couponsPerPage = 10

  const authHeaders = {
    headers: { Authorization: `Bearer ${user?.token}` },
  }

  const fetchCoupons = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${baseURL}/api/coupons`, authHeaders)
      const data = Array.isArray(res.data) ? res.data : res.data.coupons || []
      setCoupons(data)
      setFilteredCoupons(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching coupons:', err)
      setError('Failed to fetch coupons. Please try again later.')
      setCoupons([])
      setFilteredCoupons([])
    } finally {
      setLoading(false)
    }
  }

  const handleCollegeSelect = (college: any | null) => {
    if (!college) {
      setForm({ ...form, college: '' })
      return
    }
    const fullValue = `${college.name}, ${college.address}, ${college.pincode}`
    setForm({ ...form, college: fullValue })
  }

  useEffect(() => {
    fetchCoupons()
  }, [])

  // Filter coupons
  useEffect(() => {
    let filtered = [...coupons]
    
    if (searchTerm) {
      filtered = filtered.filter(coupon =>
        coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (coupon.college && coupon.college.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }
    
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter(coupon => coupon.isActive)
      } else if (statusFilter === 'inactive') {
        filtered = filtered.filter(coupon => !coupon.isActive)
      } else if (statusFilter === 'expired') {
        filtered = filtered.filter(coupon => new Date(coupon.endDate) < new Date())
      } else if (statusFilter === 'universal') {
        filtered = filtered.filter(coupon => coupon.college === 'ALL')
      } else if (statusFilter === 'specific') {
        filtered = filtered.filter(coupon => coupon.college !== 'ALL')
      }
    }
    
    setFilteredCoupons(filtered)
    setCurrentPage(1)
  }, [searchTerm, statusFilter, coupons])

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
      setTimeout(() => setError(null), 3000)
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
      setTimeout(() => setError(null), 3000)
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
      setSuccess(`Coupon ${!coupon.isActive ? 'activated' : 'deactivated'} successfully!`)
      fetchCoupons()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error toggling coupon:', err)
      setError('Failed to update coupon status.')
      setTimeout(() => setError(null), 3000)
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const isExpired = (endDate: string) => new Date(endDate) < new Date()
  const isExpiringSoon = (endDate: string) => {
    const daysLeft = Math.ceil((new Date(endDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
    return daysLeft > 0 && daysLeft <= 7
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const getUsagePercentage = (usedCount: number, maxUses: number | null) => {
    if (!maxUses) return 0
    return (usedCount / maxUses) * 100
  }

  // Pagination
  const totalPages = Math.ceil(filteredCoupons.length / couponsPerPage)
  const paginatedCoupons = filteredCoupons.slice(
    (currentPage - 1) * couponsPerPage,
    currentPage * couponsPerPage
  )

  const totalDiscountGiven = coupons.reduce((acc, c) => acc + (c.usedCount * c.discountPercent), 0)
  const activeCoupons = coupons.filter(c => c.isActive && !isExpired(c.endDate)).length
  const universalCoupons = coupons.filter(c => c.college === 'ALL').length

  return (
    <>
      <div className="coupon-admin-dashboard">
        {/* Header Section */}
        <div className="dashboard-header mb-4">
          <div className="header-left">
            <div className="header-icon">
              <FaTicketAlt />
            </div>
            <div>
              <h2 className="text-white mb-1">Coupon Management</h2>
              <p className="text-muted mb-0">Create and manage discount coupons for students</p>
            </div>
          </div>
          <Button
            className="create-coupon-btn"
            onClick={() => {
              setEditing(null)
              setForm({ ...emptyForm })
              setError(null)
              setShowModal(true)
            }}
          >
            <FaPlus className="me-2" />
            Create Coupon
          </Button>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <Alert variant="success" className="custom-alert" onClose={() => setSuccess(null)} dismissible>
            <FaCheck className="me-2" /> {success}
          </Alert>
        )}
        {error && (
          <Alert variant="danger" className="custom-alert" onClose={() => setError(null)} dismissible>
            <FaTimes className="me-2" /> {error}
          </Alert>
        )}

        {/* Stats Cards */}
        <Row className="g-3 mb-4">
          <Col md={3}>
            <Card className="stat-card bg-dark-lighter border-secondary">
              <Card.Body className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="text-muted mb-1">Total Coupons</h6>
                  <h2 className="text-white mb-0">{coupons.length}</h2>
                </div>
                <div className="stat-icon bg-orange">
                  <FaTicketAlt size={24} />
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="stat-card bg-dark-lighter border-secondary">
              <Card.Body className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="text-muted mb-1">Active Coupons</h6>
                  <h2 className="text-white mb-0">{activeCoupons}</h2>
                </div>
                <div className="stat-icon bg-success">
                  <FaToggleOn size={24} />
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="stat-card bg-dark-lighter border-secondary">
              <Card.Body className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="text-muted mb-1">Universal Coupons</h6>
                  <h2 className="text-white mb-0">{universalCoupons}</h2>
                </div>
                <div className="stat-icon bg-info">
                  <FaUniversity size={24} />
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="stat-card bg-dark-lighter border-secondary">
              <Card.Body className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="text-muted mb-1">Total Discount</h6>
                  <h2 className="text-white mb-0">{totalDiscountGiven}%</h2>
                </div>
                <div className="stat-icon bg-warning">
                  <FaPercentage size={24} />
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Search and Filters */}
        <Card className="bg-dark border-secondary mb-4">
          <Card.Body>
            <Row className="g-3">
              <Col md={5}>
                <div className="search-wrapper">
                  <FaSearch className="search-icon" />
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search by coupon code or college..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button className="clear-search" onClick={() => setSearchTerm('')}>
                      <FaTimes />
                    </button>
                  )}
                </div>
              </Col>
              <Col md={4}>
                <select
                  className="form-select bg-dark-lighter border-secondary text-white"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Coupons</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                  <option value="expired">Expired</option>
                  <option value="universal">Universal Coupons</option>
                  <option value="specific">College Specific</option>
                </select>
              </Col>
              <Col md={3}>
                <div className="filter-info">
                  <Badge bg="secondary" className="me-2">
                    <FaFilter className="me-1" size={10} />
                    Total: {filteredCoupons.length}
                  </Badge>
                  {searchTerm && (
                    <Badge bg="orange">
                      Search: "{searchTerm}"
                    </Badge>
                  )}
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Loading State */}
        {loading && (
          <div className="loading-container">
            <Spinner animation="border" variant="orange" />
            <p className="mt-2 text-muted">Loading coupons...</p>
          </div>
        )}

        {/* Coupons Table */}
        {!loading && (
          <Card className="bg-dark border-secondary">
            <div className="table-responsive">
              <table className="coupon-table">
                <thead>
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
                  {paginatedCoupons.length > 0 ? (
                    paginatedCoupons.map((coupon) => {
                      const expired = isExpired(coupon.endDate)
                      const expiringSoon = isExpiringSoon(coupon.endDate)
                      const usagePercentage = getUsagePercentage(coupon.usedCount, coupon.maxUses)
                      
                      return (
                        <tr key={coupon._id}>
                          <td>
                            <div className="coupon-code-wrapper">
                              <strong className="coupon-code">{coupon.code}</strong>
                              <Button
                                variant="link"
                                size="sm"
                                className="copy-code-btn"
                                onClick={() => handleCopyCode(coupon.code)}
                                title="Copy code"
                              >
                                {copiedCode === coupon.code ? <FaCheck className="text-success" /> : <FaCopy />}
                              </Button>
                            </div>
                          </td>
                          <td>
                            {coupon.college === 'ALL' ? (
                              <Badge bg="info" className="universal-badge">
                                <FaUniversity className="me-1" size={10} />
                                Universal
                              </Badge>
                            ) : (
                              <div className="college-name" title={coupon.college}>
                                {coupon.college.length > 40 ? coupon.college.substring(0, 40) + '...' : coupon.college}
                              </div>
                            )}
                          </td>
                          <td>
                            <Badge bg="warning" className="discount-badge">
                              <FaPercentage className="me-1" size={10} />
                              {coupon.discountPercent}% OFF
                            </Badge>
                          </td>
                          <td>
                            <div className="date-info">
                              <div className="date-range">
                                <FaCalendarAlt className="text-muted me-1" size={10} />
                                <small>{formatDate(coupon.startDate)}</small>
                              </div>
                              <div className="date-range">
                                <MdDateRange className="text-muted me-1" size={10} />
                                <small>{formatDate(coupon.endDate)}</small>
                              </div>
                              {expired && (
                                <Badge bg="danger" className="mt-1">Expired</Badge>
                              )}
                              {expiringSoon && !expired && (
                                <Badge bg="warning" className="mt-1 text-dark">Expiring Soon</Badge>
                              )}
                            </div>
                           </td>
                          <td>
                            <div className="usage-info">
                              <div className="usage-stats">
                                <strong>{coupon.usedCount}</strong> / {coupon.maxUses ?? <FaInfinity className="text-muted" />}
                              </div>
                              {coupon.maxUses && (
                                <div className="usage-bar">
                                  <div 
                                    className="usage-progress" 
                                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                                  />
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="status-control">
                              <Form.Check
                                type="switch"
                                checked={coupon.isActive && !expired}
                                onChange={() => handleToggleActive(coupon)}
                                disabled={expired}
                                label={coupon.isActive && !expired ? 'Active' : 'Inactive'}
                                className="custom-switch"
                              />
                            </div>
                           </td>
                          <td className="action-buttons">
                            <Button
                              variant="outline-orange"
                              size="sm"
                              onClick={() => handleEdit(coupon)}
                              title="Edit Coupon"
                            >
                              <FaEdit />
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => setDeleteTarget(coupon)}
                              title="Delete Coupon"
                            >
                              <FaTrash />
                            </Button>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="empty-state">
                        <div className="empty-state-content">
                          <FaTicketAlt size={48} className="text-muted mb-3" />
                          <h5>No Coupons Found</h5>
                          <p className="text-muted">Get started by creating your first coupon</p>
                          <Button variant="orange" onClick={() => {
                            setEditing(null)
                            setForm({ ...emptyForm })
                            setShowModal(true)
                          }}>
                            <FaPlus className="me-2" />
                            Create Coupon
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <CouponPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </Card>
        )}
      </div>

      {/* Professional Add/Edit Modal */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        centered
        size="lg"
        backdrop="static"
        className="coupon-modal"
      >
        <Modal.Header closeButton className="bg-dark border-secondary">
          <Modal.Title className="text-white">
            <div className="d-flex align-items-center gap-2">
              {editing ? <FaEdit className="text-orange" /> : <FaPlus className="text-orange" />}
              <span>{editing ? 'Edit Coupon' : 'Create New Coupon'}</span>
            </div>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="bg-dark">
          <Form onSubmit={handleSubmit}>
            <Row className="g-4">
              {/* Coupon Code */}
              <Col md={6}>
                <Form.Label className="text-muted">
                  Coupon Code <span className="text-danger">*</span>
                </Form.Label>
                <div className="input-with-icon">
                  <MdCode className="input-icon" />
                  <Form.Control
                    required
                    placeholder="e.g., EKLAV10"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    className="bg-dark-lighter border-secondary text-white coupon-code-input"
                    style={{ textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'monospace' }}
                  />
                </div>
              </Col>

              {/* Discount */}
              <Col md={6}>
                <Form.Label className="text-muted">
                  Discount Percentage <span className="text-danger">*</span>
                </Form.Label>
                <div className="input-with-icon">
                  <MdDiscount className="input-icon" />
                  <Form.Control
                    type="number"
                    required
                    min={1}
                    max={100}
                    placeholder="e.g., 10"
                    value={form.discountPercent}
                    onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
                    className="bg-dark-lighter border-secondary text-white"
                  />
                </div>
              </Col>

              {/* College Section */}
              <Col md={12}>
                <Form.Label className="text-muted">Applicable College</Form.Label>
                <div className="college-type-selector mb-3">
                  <Form.Check
                    type="radio"
                    label="Universal (All Colleges)"
                    name="collegeType"
                    checked={form.college === 'ALL'}
                    onChange={() => setForm({ ...form, college: 'ALL' })}
                    className="text-white"
                  />
                  <Form.Check
                    type="radio"
                    label="Specific College"
                    name="collegeType"
                    checked={form.college !== 'ALL'}
                    onChange={() => setForm({ ...form, college: '' })}
                    className="text-white ms-4"
                  />
                </div>

                {form.college !== 'ALL' && (
                  <div className="college-search-wrapper">
                    <CollegeSearch
                      onSelect={handleCollegeSelect}
                      value={form.college}
                    />
                  </div>
                )}
              </Col>

              {/* Dates */}
              <Col md={6}>
                <Form.Label className="text-muted">
                  Start Date <span className="text-danger">*</span>
                </Form.Label>
                <div className="input-with-icon">
                  <FaCalendarAlt className="input-icon" />
                  <Form.Control
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="bg-dark-lighter border-secondary text-white"
                  />
                </div>
              </Col>

              <Col md={6}>
                <Form.Label className="text-muted">
                  End Date <span className="text-danger">*</span>
                </Form.Label>
                <div className="input-with-icon">
                  <MdDateRange className="input-icon" />
                  <Form.Control
                    type="date"
                    required
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="bg-dark-lighter border-secondary text-white"
                  />
                </div>
              </Col>

              {/* Max Uses */}
              <Col md={6}>
                <Form.Label className="text-muted">Max Uses</Form.Label>
                <div className="input-with-icon">
                  <FaInfinity className="input-icon" />
                  <Form.Control
                    type="number"
                    min={1}
                    placeholder="Leave empty for unlimited"
                    value={form.maxUses}
                    onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                    className="bg-dark-lighter border-secondary text-white"
                  />
                </div>
                <Form.Text className="text-muted">
                  Leave empty for unlimited usage
                </Form.Text>
              </Col>

              {/* Status */}
              <Col md={6} className="d-flex align-items-end">
                <div className="status-switch-wrapper">
                  <Form.Check
                    type="switch"
                    id="coupon-active-switch"
                    label={form.isActive ? 'Active' : 'Inactive'}
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="custom-switch-lg"
                  />
                </div>
              </Col>
            </Row>

            {/* Modal Actions */}
            <div className="modal-actions mt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowModal(false)
                  setEditing(null)
                  setForm({ ...emptyForm })
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="orange"
                disabled={loading}
              >
                {loading ? <FaSpinner className="spinning me-1" /> : (editing ? <FaEdit className="me-1" /> : <FaPlus className="me-1" />)}
                {loading ? 'Processing...' : (editing ? 'Update Coupon' : 'Create Coupon')}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={!!deleteTarget} onHide={() => setDeleteTarget(null)} centered className="delete-modal">
        <Modal.Header closeButton className="bg-dark border-secondary">
          <Modal.Title className="text-white">Delete Coupon</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark text-white">
          <div className="text-center py-3">
            <FaTrash size={48} className="text-danger mb-3" />
            <h5>Are you sure?</h5>
            <p className="text-muted">
              You are about to delete coupon <strong className="text-orange">{deleteTarget?.code}</strong>. This action cannot be undone.
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer className="bg-dark border-secondary">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => deleteTarget && handleDelete(deleteTarget._id)} disabled={loading}>
            {loading ? <Spinner animation="border" size="sm" /> : 'Delete Coupon'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Global Styles */}
      <style>{`
        .coupon-admin-dashboard { padding: 0; }
        
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
          padding: 1.5rem;
          border-radius: 16px;
          border: 1px solid rgba(255, 140, 0, 0.2);
        }
        
        .header-left { display: flex; align-items: center; gap: 1rem; }
        
        .header-icon {
          width: 48px;
          height: 48px;
          background: rgba(255, 140, 0, 0.1);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ff8c00;
          font-size: 24px;
        }
        
        .create-coupon-btn {
          background: #ff8c00;
          border: none;
          padding: 0.5rem 1.5rem;
          font-weight: 500;
          transition: all 0.3s ease;
        }
        .create-coupon-btn:hover {
          background: #e67e00;
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(255, 140, 0, 0.3);
        }
        
        .stat-card { transition: transform 0.2s, box-shadow 0.2s; }
        .stat-card:hover { transform: translateY(-4px); box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3); }
        
        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        
        .bg-orange { background-color: #ff8c00; }
        .bg-dark-lighter { background-color: #2a2a2a; }
        .text-orange { color: #ff8c00; }
        .btn-orange {
          background-color: #ff8c00;
          border-color: #ff8c00;
          color: white;
        }
        .btn-orange:hover { background-color: #e67e00; border-color: #e67e00; }
        .btn-outline-orange {
          border-color: #ff8c00;
          color: #ff8c00;
        }
        .btn-outline-orange:hover {
          background-color: #ff8c00;
          color: white;
        }
        
        .search-wrapper { position: relative; }
        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #6c757d;
        }
        .search-input {
          width: 100%;
          padding: 0.75rem 2.5rem 0.75rem 2.5rem;
          background: #2a2a2a;
          border: 1px solid #3a3a3a;
          border-radius: 12px;
          color: white;
          transition: all 0.2s;
        }
        .search-input:focus {
          outline: none;
          border-color: #ff8c00;
          box-shadow: 0 0 0 3px rgba(255, 140, 0, 0.1);
        }
        .clear-search {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #6c757d;
          cursor: pointer;
        }
        .clear-search:hover { color: #ff8c00; }
        
        .coupon-table {
          width: 100%;
          border-collapse: collapse;
        }
        .coupon-table thead th {
          padding: 1rem;
          text-align: left;
          color: #6c757d;
          font-weight: 500;
          border-bottom: 1px solid #3a3a3a;
        }
        .coupon-table tbody tr {
          border-bottom: 1px solid #2a2a2a;
          transition: background 0.2s;
        }
        .coupon-table tbody tr:hover { background: rgba(255, 140, 0, 0.05); }
        .coupon-table td { padding: 1rem; vertical-align: middle; }
        
        .coupon-code-wrapper {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .coupon-code {
          font-family: monospace;
          font-size: 1rem;
          letter-spacing: 1px;
          color: #ff8c00;
        }
        .copy-code-btn {
          padding: 0;
          color: #6c757d;
        }
        .copy-code-btn:hover { color: #ff8c00; }
        
        .universal-badge {
          background: linear-gradient(135deg, #0dcaf0, #0d8ce0);
          padding: 0.5rem 1rem;
          font-weight: 500;
        }
        
        .college-name {
          color: #adb5bd;
          font-size: 0.875rem;
          max-width: 250px;
        }
        
        .discount-badge {
          background: linear-gradient(135deg, #ffc107, #ff9800);
          color: #1a1a1a;
          padding: 0.5rem 1rem;
          font-weight: 600;
        }
        
        .date-info { font-size: 0.75rem; }
        .date-range { margin-bottom: 0.25rem; }
        
        .usage-info { min-width: 100px; }
        .usage-stats { margin-bottom: 0.25rem; font-size: 0.875rem; }
        .usage-bar {
          height: 4px;
          background: #3a3a3a;
          border-radius: 2px;
          overflow: hidden;
        }
        .usage-progress {
          height: 100%;
          background: linear-gradient(90deg, #ff8c00, #ffa040);
          border-radius: 2px;
          transition: width 0.3s ease;
        }
        
        .status-control { min-width: 100px; }
        .custom-switch .form-check-input {
          background-color: #3a3a3a;
          border-color: #4a4a4a;
        }
        .custom-switch .form-check-input:checked {
          background-color: #ff8c00;
          border-color: #ff8c00;
        }
        
        .action-buttons { display: flex; gap: 0.5rem; justify-content: center; }
        .action-buttons button { width: 32px; height: 32px; padding: 0; display: inline-flex; align-items: center; justify-content: center; }
        
        .empty-state { text-align: center; padding: 3rem !important; }
        .empty-state-content { display: flex; flex-direction: column; align-items: center; }
        
        .input-with-icon { position: relative; }
        .input-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #6c757d;
        }
        .input-with-icon input,
        .input-with-icon textarea { padding-left: 2.5rem; }
        
        .coupon-code-input { font-family: monospace; font-weight: 600; }
        
        .college-type-selector { display: flex; align-items: center; }
        .college-type-selector .form-check-label { color: #e0e0e0; }
        
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #3a3a3a;
        }
        
        .spinning { animation: spin 1s linear infinite; }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .loading-container { text-align: center; padding: 3rem; }
        
        .coupon-pagination {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          background: #1e1e1e;
          border-radius: 12px;
          border-top: 1px solid #3a3a3a;
          flex-wrap: wrap;
          gap: 1rem;
        }
        
        .pagination-btn {
          min-width: 36px;
          height: 36px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #2a2a2a;
          border: 1px solid #3a3a3a;
          color: #e0e0e0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .pagination-btn:hover:not(:disabled) {
          background: #ff8c00;
          border-color: #ff8c00;
          color: white;
        }
        .pagination-btn.active {
          background: #ff8c00;
          border-color: #ff8c00;
          color: white;
        }
        .pagination-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .pagination-dots { color: #6c757d; padding: 0 0.5rem; }
        
        .custom-alert { border-radius: 12px; border: none; }
        
        .modal-content { background-color: #1a1a1a; }
        .modal-header { border-bottom-color: #2a2a2a; }
        .modal-footer { border-top-color: #2a2a2a; }
        
        .form-control:focus, .form-select:focus {
          border-color: #ff8c00;
          box-shadow: 0 0 0 0.2rem rgba(255, 140, 0, 0.25);
        }
        
        .filter-info { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
        
        .status-switch-wrapper { width: 100%; }
        .custom-switch-lg .form-check-input {
          width: 3rem;
          height: 1.5rem;
        }
      `}</style>
    </>
  )
}

export default CouponAdmin