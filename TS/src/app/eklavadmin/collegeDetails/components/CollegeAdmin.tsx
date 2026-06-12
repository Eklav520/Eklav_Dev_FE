import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Card, Button, Form, Row, Col, Image, Modal, Spinner, Badge } from 'react-bootstrap'
import { FaBuilding, FaMapMarkerAlt, FaMailBulk, FaEdit, FaTrash, FaPlus, FaSearch, FaUniversity, FaFileImage, FaTimes, FaCheck, FaSpinner, FaInfoCircle, FaFilter } from 'react-icons/fa'
import { MdLocationPin, MdPinDrop, MdVerified, MdPending } from 'react-icons/md'

type College = {
  _id: string
  name: string
  address: string
  pincode: string
  logo?: string
}

// Professional Pagination Component
const CollegePagination: React.FC<{
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}> = ({ currentPage, totalPages, onPageChange }) => {
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5
    
    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
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
    <div className="college-pagination">
      <div className="pagination-info">
        <FaInfoCircle className="me-1" /> Page {currentPage} of {totalPages}
      </div>
      <div className="pagination-controls">
        <button
          className="pagination-btn"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
        >
          «
        </button>
        <button
          className="pagination-btn"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          ‹
        </button>
        
        {getPageNumbers().map((page, index) => (
          page === '...' ? (
            <span key={`dots-${index}`} className="pagination-dots">...</span>
          ) : (
            <button
              key={page}
              className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
              onClick={() => onPageChange(page as number)}
            >
              {page}
            </button>
          )
        ))}
        
        <button
          className="pagination-btn"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          ›
        </button>
        <button
          className="pagination-btn"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
        >
          »
        </button>
      </div>
      <div className="pagination-stats">
        Showing {((currentPage - 1) * 10) + 1} - {Math.min(currentPage * 10, totalPages * 10)} of {totalPages * 10}+ Colleges
      </div>
    </div>
  )
}

// Logo Upload Component
const LogoUpload: React.FC<{
  currentLogo?: string
  onFileSelect: (file: File | null) => void
}> = ({ currentLogo, onFileSelect }) => {
  const [preview, setPreview] = useState<string | null>(currentLogo || null)
  const [dragActive, setDragActive] = useState(false)

  const handleFileChange = (file: File | null) => {
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      onFileSelect(file)
    } else {
      setPreview(null)
      onFileSelect(null)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      handleFileChange(file)
    }
  }

  return (
    <div className="logo-upload">
      <div
        className={`upload-area ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById('logo-input')?.click()}
      >
        {preview ? (
          <div className="preview-container">
            <Image src={preview} className="preview-image" />
            <button
              type="button"
              className="remove-image"
              onClick={(e) => {
                e.stopPropagation()
                handleFileChange(null)
              }}
            >
              <FaTimes />
            </button>
          </div>
        ) : (
          <div className="upload-placeholder">
            <FaFileImage className="upload-icon" />
            <p>Click or drag to upload logo</p>
            <small>PNG, JPG, JPEG (Max 2MB)</small>
          </div>
        )}
      </div>
      <input
        id="logo-input"
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0]
          handleFileChange(file || null)
        }}
      />
    </div>
  )
}

const CollegeAdmin: React.FC = () => {
  const [colleges, setColleges] = useState<College[]>([])
  const [filteredColleges, setFilteredColleges] = useState<College[]>([])
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
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<College | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const baseURL = import.meta.env.VITE_API_BASE_URL
  const collegesPerPage = 10

  // Fetch all colleges
  const fetchColleges = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${baseURL}/api/colleges`)
      const data = Array.isArray(res.data) ? res.data : res.data.colleges || []
      setColleges(data)
      setFilteredColleges(data)
      setError(null)
    } catch (err) {
      console.error('❌ Error fetching colleges:', err)
      setError('Failed to fetch college list. Please try again later.')
      setColleges([])
      setFilteredColleges([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchColleges()
  }, [])

  // Filter colleges based on search
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredColleges(colleges)
    } else {
      const filtered = colleges.filter(college =>
        college.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        college.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        college.pincode.includes(searchTerm)
      )
      setFilteredColleges(filtered)
    }
    setCurrentPage(1)
  }, [searchTerm, colleges])

  // Add or update college
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      const data = new FormData()
      data.append('name', form.name)
      data.append('address', form.address)
      data.append('pincode', form.pincode)
      if (form.logo) data.append('logo', form.logo)

      if (editing) {
        await axios.put(`${baseURL}/api/colleges/${editing._id}`, data)
        setSuccessMessage('College updated successfully!')
      } else {
        await axios.post(`${baseURL}/api/colleges`, data)
        setSuccessMessage('College added successfully!')
      }

      setForm({ name: '', address: '', pincode: '', logo: null })
      setEditing(null)
      setShowModal(false)
      fetchColleges()
      
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      console.error('❌ Error saving college:', err)
      setError('Failed to save college. Please check your input or try again.')
      setTimeout(() => setError(null), 3000)
    } finally {
      setLoading(false)
    }
  }

  // Delete college
  const handleDelete = async (id: string) => {
    try {
      setLoading(true)
      await axios.delete(`${baseURL}/api/colleges/${id}`)
      setSuccessMessage('College deleted successfully!')
      setShowDeleteConfirm(null)
      fetchColleges()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      console.error('❌ Error deleting college:', err)
      setError('Failed to delete college. Please try again later.')
      setTimeout(() => setError(null), 3000)
    } finally {
      setLoading(false)
    }
  }

  // Open edit modal
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

  // Pagination
  const totalPages = Math.ceil(filteredColleges.length / collegesPerPage)
  const paginatedColleges = filteredColleges.slice(
    (currentPage - 1) * collegesPerPage,
    currentPage * collegesPerPage
  )

  return (
    <>
      <div className="college-admin-dashboard">

        {/* ── Compact top bar ── */}
        <div className="ca-topbar">
          <div className="ca-topbar-left">
            <div className="ca-topbar-icon"><FaUniversity size={15} /></div>
            <span className="ca-topbar-title">College Management</span>
            <div className="ca-pill"><FaUniversity size={10} /><b>{colleges.length}</b><span>Total</span></div>
            <div className="ca-pill succ"><MdVerified size={10} /><b>{colleges.filter(c => c.name).length}</b><span>Active</span></div>
          </div>

          {/* Inline search */}
          <div className="ca-search-wrap">
            <FaSearch size={11} className="ca-search-icon" />
            <input
              className="ca-search"
              placeholder="Search name, address or pincode…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="ca-search-clear" onClick={() => setSearchTerm('')}><FaTimes size={10} /></button>
            )}
            {searchTerm && <span className="ca-pill info" style={{ marginLeft: 6 }}>{filteredColleges.length} results</span>}
          </div>

          <button
            className="ca-add-btn"
            onClick={() => { setEditing(null); setForm({ name: '', address: '', pincode: '', logo: null }); setShowModal(true); }}
          >
            <FaPlus size={11} /> Add New College
          </button>
        </div>

        {/* Toast messages */}
        {successMessage && (
          <div className="ca-toast ca-toast-success"><FaCheck className="me-2" />{successMessage}</div>
        )}
        {error && (
          <div className="ca-toast ca-toast-error"><FaTimes className="me-2" />{error}</div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="loading-container">
            <Spinner animation="border" variant="orange" />
            <p className="mt-2 text-muted">Loading colleges...</p>
          </div>
        )}

        {/* Colleges Table */}
        {!loading && (
          <Card className="bg-dark border-secondary">
            <div className="table-responsive">
              <table className="college-table">
                <thead>
                  <tr>
                    <th>Logo</th>
                    <th>College Name</th>
                    <th>Address</th>
                    <th>Pincode</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedColleges.length > 0 ? (
                    paginatedColleges.map((college) => (
                      <tr key={college._id}>
                        <td>
                          {college.logo ? (
                            <Image src={college.logo} className="college-logo" roundedCircle />
                          ) : (
                            <div className="logo-placeholder">
                              <FaUniversity />
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="college-name">{college.name}</div>
                        </td>
                        <td>
                          <div className="college-address">
                            <FaMapMarkerAlt className="text-orange me-1" size={12} />
                            {college.address}
                          </div>
                        </td>
                        <td>
                          <Badge bg="dark" className="pincode-badge">
                            <MdPinDrop className="me-1" />
                            {college.pincode}
                          </Badge>
                        </td>
                        <td className="action-buttons">
                          <Button
                            variant="outline-orange"
                            size="sm"
                            onClick={() => handleEdit(college)}
                            title="Edit College"
                          >
                            <FaEdit />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => setShowDeleteConfirm(college)}
                            title="Delete College"
                          >
                            <FaTrash />
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="empty-state">
                        <div className="empty-state-content">
                          <FaUniversity size={48} className="text-muted mb-3" />
                          <h5>No Colleges Found</h5>
                          <p className="text-muted">Get started by adding your first college</p>
                          <Button
                            variant="orange"
                            onClick={() => {
                              setEditing(null)
                              setForm({ name: '', address: '', pincode: '', logo: null })
                              setShowModal(true)
                            }}
                          >
                            <FaPlus className="me-2" />
                            Add College
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
              <CollegePagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </Card>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg" className="college-modal">
        <Modal.Header closeButton className="bg-dark border-secondary">
          <Modal.Title className="text-white">
            <div className="d-flex align-items-center gap-2">
              {editing ? <FaEdit className="text-orange" /> : <FaPlus className="text-orange" />}
              <span>{editing ? 'Edit College' : 'Add New College'}</span>
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark">
          <Form onSubmit={handleSubmit}>
            <Row className="g-4">
              <Col md={12}>
                <Form.Label className="text-muted">College Name</Form.Label>
                <div className="input-with-icon">
                  <FaUniversity className="input-icon" />
                  <Form.Control
                    type="text"
                    placeholder="Enter college name"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="bg-dark-lighter border-secondary text-white"
                  />
                </div>
              </Col>
              <Col md={12}>
                <Form.Label className="text-muted">Address</Form.Label>
                <div className="input-with-icon">
                  <FaMapMarkerAlt className="input-icon" />
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="Enter complete address"
                    required
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="bg-dark-lighter border-secondary text-white"
                  />
                </div>
              </Col>
              <Col md={6}>
                <Form.Label className="text-muted">Pincode</Form.Label>
                <div className="input-with-icon">
                  <MdPinDrop className="input-icon" />
                  <Form.Control
                    type="text"
                    placeholder="Enter pincode"
                    required
                    value={form.pincode}
                    onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                    className="bg-dark-lighter border-secondary text-white"
                  />
                </div>
              </Col>
              <Col md={6}>
                <Form.Label className="text-muted">College Logo</Form.Label>
                <LogoUpload
                  currentLogo={editing?.logo}
                  onFileSelect={(file) => setForm({ ...form, logo: file })}
                />
              </Col>
            </Row>
            <div className="modal-actions mt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowModal(false)
                  setEditing(null)
                  setForm({ name: '', address: '', pincode: '', logo: null })
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="orange" disabled={loading}>
                {loading ? <FaSpinner className="spinning" /> : (editing ? 'Update College' : 'Add College')}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={!!showDeleteConfirm} onHide={() => setShowDeleteConfirm(null)} centered className="delete-modal">
        <Modal.Header closeButton className="bg-dark border-secondary">
          <Modal.Title className="text-white">Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark text-white">
          <div className="text-center py-3">
            <FaTrash size={48} className="text-danger mb-3" />
            <h5>Are you sure?</h5>
            <p className="text-muted">
              You are about to delete <strong>{showDeleteConfirm?.name}</strong>. This action cannot be undone.
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer className="bg-dark border-secondary">
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm._id)}>
            Delete College
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Global Styles */}
      <style>{`
        .college-admin-dashboard { padding: 0; display: flex; flex-direction: column; gap: 10px; }

        /* ── Compact top bar ── */
        .ca-topbar {
          display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
          background: #141414; border: 1px solid #222; border-radius: 12px;
          padding: 8px 14px;
        }
        .ca-topbar-left { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .ca-topbar-icon {
          width: 30px; height: 30px; border-radius: 8px;
          background: rgba(255,140,0,.12); display: flex; align-items: center;
          justify-content: center; color: #ff8c00;
        }
        .ca-topbar-title { color: #fff; font-weight: 700; font-size: .9rem; white-space: nowrap; }
        .ca-pill {
          display: flex; align-items: center; gap: 4px;
          background: #1e1e1e; border: 1px solid #2a2a2a; border-radius: 20px;
          padding: 3px 10px; font-size: .72rem; color: #888; white-space: nowrap;
        }
        .ca-pill b { color: #ccc; }
        .ca-pill.succ { border-color: #22c55e33; } .ca-pill.succ b { color: #22c55e; }
        .ca-pill.info { border-color: #38bdf833; } .ca-pill.info b { color: #38bdf8; }

        /* Inline search */
        .ca-search-wrap {
          flex: 1; min-width: 200px; position: relative;
          display: flex; align-items: center; gap: 6px;
        }
        .ca-search-icon { position: absolute; left: 10px; color: #555; pointer-events: none; }
        .ca-search {
          width: 100%; background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 8px;
          color: #ccc; font-size: .8rem; padding: 6px 30px 6px 28px; outline: none;
          transition: border-color .15s;
        }
        .ca-search:focus { border-color: #ff8c00; }
        .ca-search-clear {
          position: absolute; right: 8px;
          background: none; border: none; color: #555; cursor: pointer; padding: 0;
        }
        .ca-search-clear:hover { color: #ff8c00; }

        .ca-add-btn {
          background: #ff8c00; border: none; color: #fff; border-radius: 8px;
          padding: 6px 14px; font-size: .8rem; font-weight: 600; cursor: pointer;
          display: flex; align-items: center; gap: 6px; white-space: nowrap;
          transition: background .15s; flex-shrink: 0;
        }
        .ca-add-btn:hover { background: #e67e00; }

        /* Toast */
        .ca-toast {
          padding: 8px 16px; border-radius: 8px; font-size: .82rem;
          display: flex; align-items: center;
        }
        .ca-toast-success { background: rgba(34,197,94,.1); border: 1px solid rgba(34,197,94,.25); color: #22c55e; }
        .ca-toast-error   { background: rgba(239,68,68,.1);  border: 1px solid rgba(239,68,68,.25);  color: #ef4444; }

        .college-table {
          width: 100%;
          border-collapse: collapse;
        }

        .college-table thead th {
          padding: 1rem;
          text-align: left;
          color: #6c757d;
          font-weight: 500;
          border-bottom: 1px solid #3a3a3a;
        }

        .college-table tbody tr {
          border-bottom: 1px solid #2a2a2a;
          transition: background 0.2s;
        }

        .college-table tbody tr:hover {
          background: rgba(255, 140, 0, 0.05);
        }

        .college-table td {
          padding: 1rem;
        }

        .college-logo {
          width: 48px;
          height: 48px;
          object-fit: cover;
        }

        .logo-placeholder {
          width: 48px;
          height: 48px;
          background: #2a2a2a;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ff8c00;
          font-size: 20px;
        }

        .college-name {
          font-weight: 500;
          color: white;
        }

        .college-address {
          font-size: 0.875rem;
          color: #adb5bd;
          max-width: 300px;
        }

        .pincode-badge {
          background: #2a2a2a !important;
          color: #ff8c00 !important;
          padding: 0.5rem 1rem;
          font-weight: 500;
        }

        .action-buttons {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
        }

        .action-buttons button {
          width: 32px;
          height: 32px;
          padding: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .empty-state {
          text-align: center;
          padding: 3rem !important;
        }

        .empty-state-content {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .input-with-icon {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #6c757d;
        }

        .input-with-icon input,
        .input-with-icon textarea {
          padding-left: 2.5rem;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #3a3a3a;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .loading-container {
          text-align: center;
          padding: 3rem;
        }

        .college-pagination {
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

        .pagination-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .pagination-dots {
          color: #6c757d;
          padding: 0 0.5rem;
        }

        .custom-alert {
          border-radius: 12px;
          border: none;
        }

        /* Logo Upload Styles */
        .logo-upload {
          width: 100%;
        }

        .upload-area {
          border: 2px dashed #3a3a3a;
          border-radius: 12px;
          padding: 1rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          background: #2a2a2a;
        }

        .upload-area:hover, .upload-area.drag-active {
          border-color: #ff8c00;
          background: rgba(255, 140, 0, 0.05);
        }

        .preview-container {
          position: relative;
          display: inline-block;
        }

        .preview-image {
          max-width: 100px;
          max-height: 100px;
          object-fit: contain;
        }

        .remove-image {
          position: absolute;
          top: -8px;
          right: -8px;
          background: #dc3545;
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          cursor: pointer;
        }

        .upload-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .upload-icon {
          font-size: 32px;
          color: #6c757d;
        }

        .upload-placeholder p {
          margin: 0;
          color: #adb5bd;
        }

        .upload-placeholder small {
          color: #6c757d;
        }
      `}</style>
    </>
  )
}

export default CollegeAdmin