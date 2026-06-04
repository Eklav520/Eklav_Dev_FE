import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Card, Button, Form, Table, Modal, Spinner, Alert, Pagination } from 'react-bootstrap'
import { useAuthContext } from '@/context/useAuthContext'
import { FaUserGraduate, FaPlus, FaTrash, FaEnvelope, FaPhone, FaLock, FaUser, FaBuilding, FaSpinner, FaUniversity, FaUpload } from 'react-icons/fa'
import BulkUploadStudents from './BulkUploadStudents'

type Student = {
  name: string
  _id: string
  fullname: string
  email: string
  phoneNumber?: string
  rollNumber?: string
  gender?: string
  branch?: string
  joiningYear?: string
}

type Profile = {
  fullName: string
  email: string
  role: string
  instituteId?: string
  instituteName?: string
  collegeName?: string
  status?: string
}

const InstituteAdmin: React.FC = () => {
  const { user } = useAuthContext()
  const token = user?.token
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [students, setStudents] = useState<Student[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    fullname: '',
    email: '',
    phoneNumber: '',
    password: '',
    rollNumber: '',
    gender: 'Male',
    branch: '',
    joiningYear: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showBulkUpload, setShowBulkUpload] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  /* ============================
     FETCH PROFILE (GET INSTITUTE)
  ============================ */
  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${baseURL}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setProfile(res.data)
    } catch (err) {
      console.error("Profile fetch failed", err)
    }
  }

  /* ============================
     FETCH STUDENTS
  ============================ */
  const fetchStudents = async () => {
    if (!token) return

    try {
      setLoading(true)
      const res = await axios.get(`${baseURL}/api/institute/students`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setStudents(res.data?.students || [])
      setError(null)
    } catch (err) {
      console.error(err)
      setError("Failed to fetch students")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      fetchProfile()
      fetchStudents()
    }
  }, [token])

  /* ============================
     CREATE STUDENT
  ============================ */
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      await axios.post(
        `${baseURL}/api/institute/createStudent`,
        {
          ...form,
          instituteId: profile?.instituteId
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      setForm({
        fullname: '',
        email: '',
        phoneNumber: '',
        password: '',
        rollNumber: '',
        gender: 'Male',
        branch: '',
        joiningYear: ''
      })

      setShowModal(false)
      fetchStudents()
    } catch (err: any) {
      console.error(err)
      alert(err?.response?.data?.message || "Failed to create student")
    } finally {
      setSubmitting(false)
    }
  }

  /* ============================
     DELETE STUDENT
  ============================ */
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this student?")) return

    try {
      await axios.delete(
        `${baseURL}/api/institute/deleteStudent/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      fetchStudents()
    } catch (err) {
      console.error(err)
      alert("Delete failed")
    }
  }

  const totalStudents = students.length
  const instituteName = profile?.instituteName || profile?.collegeName || 'Not Assigned'

  const totalPages = Math.max(1, Math.ceil(totalStudents / rowsPerPage))
  const currentStart = (currentPage - 1) * rowsPerPage
  const currentEnd = Math.min(currentStart + rowsPerPage, totalStudents)
  const paginatedStudents = students.slice(currentStart, currentEnd)

  const visiblePageNumbers = React.useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, idx) => idx + 1)
    }

    const pages: Array<number | 'start-ellipsis' | 'end-ellipsis'> = [1]
    if (currentPage > 3) {
      pages.push('start-ellipsis')
    }

    const middleStart = Math.max(2, currentPage - 1)
    const middleEnd = Math.min(totalPages - 1, currentPage + 1)
    for (let page = middleStart; page <= middleEnd; page += 1) {
      pages.push(page)
    }

    if (currentPage < totalPages - 2) {
      pages.push('end-ellipsis')
    }

    pages.push(totalPages)
    return pages
  }, [currentPage, totalPages])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const changePage = (page: number) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
  }

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(Number(event.target.value))
    setCurrentPage(1)
  }

  return (
    <div className="institute-admin-container">
      <Card className="students-management-card">
        <Card.Header className="card-header-custom">
          <div className="header-content">
            <div className="header-left">
              <FaUserGraduate className="header-icon" />
              <div>
                <h4 className="header-title">Student Management</h4>
                <p className="header-subtitle">Manage students enrolled in your institute</p>
              </div>
            </div>
            <div className="button-group">
              <Button className="add-student-btn" onClick={() => setShowModal(true)}>
                <FaPlus className="me-2" />
                Add Student
              </Button>
              <Button
                className="bulk-upload-btn"
                onClick={() => setShowBulkUpload(true)}
              >
                <FaUpload className="me-2" />
                Bulk Upload
              </Button>
            </div>
          </div>
        </Card.Header>

        <Card.Body className="card-body-custom">
          {/* Stats Summary */}
          <div className="stats-summary">
            <div className="stat-card">
              <div className="stat-icon">
                <FaUserGraduate />
              </div>
              <div className="stat-info">
                <span className="stat-label">Total Students</span>
                <span className="stat-value">{totalStudents}</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <FaUniversity />
              </div>
              <div className="stat-info">
                <span className="stat-label">Institute Name</span>
                <span className="stat-value">{instituteName}</span>
              </div>
            </div>
          </div>

          {/* Loading & Error States */}
          {loading && (
            <div className="loading-container">
              <FaSpinner className="spinner-icon" />
              <p>Loading students...</p>
            </div>
          )}

          {error && (
            <Alert variant="danger" className="custom-alert">
              {error}
            </Alert>
          )}

          {/* Students Table */}
          {!loading && !error && (
            <div className="table-wrapper">
              {students.length === 0 ? (
                <div className="empty-state">
                  <FaUserGraduate className="empty-icon" />
                  <h5>No students found</h5>
                  <p>Click the "Add Student" button to enroll your first student</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table className="students-table" hover>
                    <thead>
                      <tr>
                        <th style={{ width: '22%' }}>Student Name</th>
                        <th style={{ width: '22%' }}>Email Address</th>
                        <th style={{ width: '12%' }}>Roll Number</th>
                        <th style={{ width: '12%' }}>Branch</th>
                        <th style={{ width: '10%' }}>Joined Year</th>
                        <th style={{ width: '10%' }}>Phone</th>
                        <th style={{ width: '12%' }} className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedStudents.map((stu) => (
                        <tr key={stu._id}>
                          <td>
                            <div className="student-name-cell">
                              <div className="student-avatar">
                                {(stu.fullname || stu.name).charAt(0).toUpperCase()}
                              </div>
                              <span className="student-name">
                                {stu.fullname || stu.name}
                              </span>
                            </div>
                           </td>
                           <td>
                            <div className="student-email-cell">
                              <FaEnvelope className="email-icon" />
                              <span>{stu.email}</span>
                            </div>
                           </td>
                           <td>
                            <div className="student-roll-cell">
                              <span>{stu.rollNumber || '–'}</span>
                            </div>
                           </td>
                           <td>
                            <div className="student-branch-cell">
                              <span>{stu.branch || '–'}</span>
                            </div>
                           </td>
                           <td>
                            <span>{stu.joiningYear || '–'}</span>
                           </td>
                           <td>
                            <div className="student-phone-cell">
                              <FaPhone className="phone-icon" />
                              <span>{stu.phoneNumber || 'Not provided'}</span>
                            </div>
                           </td>
                          <td className="text-center">
                            <Button
                              size="sm"
                              className="delete-student-btn"
                              onClick={() => handleDelete(stu._id)}
                            >
                              <FaTrash />
                              <span className="ms-1">Delete</span>
                            </Button>
                           </td>
                         </tr>
                      ))}
                    </tbody>
                  </Table>
                  {students.length > 0 && (
                    <div className="table-footer">
                      <div className="footer-summary">
                        Showing <strong>{currentStart + 1}</strong> to <strong>{currentEnd}</strong> of <strong>{totalStudents}</strong> students
                      </div>
                      <div className="footer-actions">
                        <div className="rows-per-page">
                          <span>Rows per page</span>
                          <Form.Select size="sm" value={rowsPerPage} onChange={handleRowsPerPageChange} className="rows-per-page-select">
                            {[5, 10, 15, 20].map((size) => (
                              <option key={size} value={size}>{size}</option>
                            ))}
                          </Form.Select>
                        </div>
                        <Pagination className="table-pagination">
                          <Pagination.First onClick={() => changePage(1)} disabled={currentPage === 1} />
                          <Pagination.Prev onClick={() => changePage(currentPage - 1)} disabled={currentPage === 1} />
                          {visiblePageNumbers.map((page, index) => (
                            page === 'start-ellipsis' || page === 'end-ellipsis' ? (
                              <Pagination.Ellipsis key={`${page}-${index}`} disabled />
                            ) : (
                              <Pagination.Item key={page} active={page === currentPage} onClick={() => changePage(page)}>
                                {page}
                              </Pagination.Item>
                            )
                          ))}
                          <Pagination.Next onClick={() => changePage(currentPage + 1)} disabled={currentPage === totalPages} />
                          <Pagination.Last onClick={() => changePage(totalPages)} disabled={currentPage === totalPages} />
                        </Pagination>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Create Student Modal */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        centered
        dialogClassName="student-modal-dialog"
        className="student-modal"
      >
        <Modal.Header closeButton className="modal-header-custom">
          <Modal.Title>
            <FaUserGraduate className="modal-icon" />
            Create New Student
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="modal-body-custom">
          <Form onSubmit={handleCreateStudent}>
            <Form.Group className="form-group-custom mb-4">
              <Form.Label className="form-label-custom">
                <FaUser className="label-icon" />
                Full Name
              </Form.Label>
              <Form.Control
                required
                placeholder="Enter student's full name"
                value={form.fullname}
                onChange={(e) =>
                  setForm({ ...form, fullname: e.target.value })
                }
                className="form-control-custom"
              />
            </Form.Group>

            <Form.Group className="form-group-custom mb-4">
              <Form.Label className="form-label-custom">
                <FaEnvelope className="label-icon" />
                Email Address
              </Form.Label>
              <Form.Control
                required
                type="email"
                placeholder="student@example.com"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                className="form-control-custom"
              />
            </Form.Group>

            <div className="form-row">
              <Form.Group className="form-group-custom mb-4 form-col">
                <Form.Label className="form-label-custom">
                  <FaBuilding className="label-icon" />
                  Roll Number
                </Form.Label>
                <Form.Control
                  required
                  placeholder="Enter student's roll number"
                  value={form.rollNumber}
                  onChange={(e) =>
                    setForm({ ...form, rollNumber: e.target.value })
                  }
                  className="form-control-custom"
                />
              </Form.Group>

              <Form.Group className="form-group-custom mb-4 form-col">
                <Form.Label className="form-label-custom">
                  <FaUniversity className="label-icon" />
                  Branch
                </Form.Label>
                <Form.Control
                  required
                  placeholder="Enter student's branch"
                  value={form.branch}
                  onChange={(e) =>
                    setForm({ ...form, branch: e.target.value })
                  }
                  className="form-control-custom"
                />
              </Form.Group>
            </div>

            <div className="form-row">
              <Form.Group className="form-group-custom mb-4 form-col">
                <Form.Label className="form-label-custom">
                  <FaUser className="label-icon" />
                  Joining Year
                </Form.Label>
                <Form.Select
                  required
                  value={form.joiningYear}
                  onChange={(e) => setForm({ ...form, joiningYear: e.target.value })}
                  className="form-control-custom"
                >
                  <option value="">Select year</option>
                  {Array.from({ length: 10 }, (_, i) => {
                    const year = new Date().getFullYear() - i
                    return <option key={year} value={String(year)}>{year}</option>
                  })}
                </Form.Select>
              </Form.Group>
            </div>

            <div className="form-row">
              <Form.Group className="form-group-custom mb-4 form-col">
                <Form.Label className="form-label-custom">
                  <FaUser className="label-icon" />
                  Gender
                </Form.Label>
                <Form.Select
                  required
                  value={form.gender}
                  onChange={(e) =>
                    setForm({ ...form, gender: e.target.value })
                  }
                  className="form-control-custom"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="form-group-custom mb-4 form-col">
                <Form.Label className="form-label-custom">
                  <FaPhone className="label-icon" />
                  Phone Number
                </Form.Label>
                <Form.Control
                  placeholder="+91 1234567890"
                  value={form.phoneNumber}
                  onChange={(e) =>
                    setForm({ ...form, phoneNumber: e.target.value })
                  }
                  className="form-control-custom"
                />
              </Form.Group>
            </div>

            <Form.Group className="form-group-custom mb-4">
              <Form.Label className="form-label-custom">
                <FaLock className="label-icon" />
                Password
              </Form.Label>
              <Form.Control
                required
                type="password"
                placeholder="Create a strong password"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                className="form-control-custom"
              />
              <small className="form-text text-muted">
                Password must be at least 6 characters
              </small>
            </Form.Group>

            <div className="modal-actions">
              <Button
                variant="secondary"
                className="cancel-btn"
                onClick={() => setShowModal(false)}
                disabled={submitting}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                className="submit-btn"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <FaSpinner className="spinner-small" />
                    Creating...
                  </>
                ) : (
                  <>
                    <FaPlus className="me-2" />
                    Create Student
                  </>
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Bulk Upload Modal */}
      <BulkUploadStudents
        show={showBulkUpload}
        onHide={() => setShowBulkUpload(false)}
        onSuccess={() => {
          fetchStudents();
        }}
      />

      <style>{`
        .institute-admin-container {
          background: #000000;
          min-height: 100vh;
          padding: 1rem;
        }

        /* Card Styles */
        .students-management-card {
          background: #0a0a0a;
          border: 1px solid #1f1f1f;
          border-radius: 16px;
          overflow: hidden;
        }

        .card-header-custom {
          background: linear-gradient(135deg, #0a0a0a 0%, #000000 100%);
          border-bottom: 1px solid #ff7a00;
          padding: 1.5rem;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .header-icon {
          font-size: 2rem;
          color: #ff7a00;
        }

        .header-title {
          color: #ffffff;
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
        }

        .header-subtitle {
          color: #8a8a8a;
          font-size: 0.85rem;
          margin: 0.25rem 0 0 0;
        }

        .button-group {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .add-student-btn {
          background: linear-gradient(135deg, #ff7a00 0%, #ff944d 100%);
          border: none;
          padding: 0.625rem 1.5rem;
          border-radius: 8px;
          color: #000000;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .add-student-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 122, 0, 0.4);
          background: linear-gradient(135deg, #ff944d 0%, #ffaa66 100%);
        }

        .bulk-upload-btn {
          background: linear-gradient(135deg, #28a745 0%, #34ce57 100%);
          border: none;
          padding: 0.625rem 1.5rem;
          border-radius: 8px;
          color: #ffffff;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .bulk-upload-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
          background: linear-gradient(135deg, #34ce57 0%, #40e06d 100%);
        }

        .card-body-custom {
          padding: 1.5rem;
        }

        /* Stats Summary */
        .stats-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: #000000;
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
          background: rgba(255, 122, 0, 0.1);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ff7a00;
          font-size: 1.75rem;
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
          word-break: break-word;
        }

        /* Loading State */
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          color: #ff7a00;
        }

        .spinner-icon {
          font-size: 2rem;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Alert */
        .custom-alert {
          background: rgba(220, 53, 69, 0.1);
          border: 1px solid #dc3545;
          color: #ff6b6b;
        }

        /* Table Styles */
        .table-wrapper {
          overflow-x: auto;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 18px;
          padding: 0.75rem;
          box-shadow: 0 16px 45px rgba(0, 0, 0, 0.18);
        }

        .table-responsive {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .students-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          margin-bottom: 0;
          background: #080808;
          border-radius: 16px;
          overflow: hidden;
        }

        .students-table thead th {
          background: rgba(255, 122, 0, 0.08);
          color: #ffbf80;
          padding: 1rem 1rem;
          text-align: left;
          font-weight: 700;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid rgba(255, 122, 0, 0.25);
        }

        .students-table tbody tr {
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          transition: background 0.2s ease, transform 0.2s ease;
          background: rgba(255, 255, 255, 0.015);
        }

        .students-table tbody tr:nth-child(even) {
          background: rgba(255, 255, 255, 0.01);
        }

        .students-table tbody tr:hover {
          background: rgba(255, 122, 0, 0.12);
          transform: translateY(-1px);
        }

        .students-table td {
          padding: 1rem 0.95rem;
          color: #d8d8d8;
          vertical-align: middle;
          white-space: nowrap;
        }

        .student-name-cell {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .student-avatar {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #ff7a00 0%, #ff944d 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #000000;
          font-weight: 700;
          font-size: 1rem;
          flex-shrink: 0;
        }

        .student-name {
          font-weight: 600;
          color: #ffffff;
          word-break: break-word;
        }

        .student-email-cell, .student-phone-cell {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          white-space: nowrap;
        }

        .email-icon, .phone-icon {
          color: #ff7a00;
          font-size: 0.9rem;
          flex-shrink: 0;
        }

        .student-email-cell span, .student-phone-cell span {
          word-break: normal;
          overflow-wrap: normal;
          white-space: nowrap;
        }

        .delete-student-btn {
          background: #dc3545;
          border: none;
          padding: 0.375rem 1rem;
          border-radius: 6px;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
        }

        .delete-student-btn:hover {
          background: #c82333;
          transform: translateY(-1px);
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 3rem;
        }

        .table-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
          padding: 1rem 1rem 0.75rem;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          margin-top: 0.75rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
        }

        .footer-summary {
          color: #d7d7d7;
          font-size: 0.92rem;
          line-height: 1.6;
          white-space: nowrap;
        }

        .footer-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .rows-per-page {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          color: #e8e8e8;
          font-size: 0.88rem;
          white-space: nowrap;
          padding: 0.45rem 0.9rem;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.04);
          min-height: 2.7rem;
        }

        .rows-per-page span {
          color: #bdbdbd;
          line-height: 1.2;
        }

        .rows-per-page-select {
          min-width: 4.5rem;
          height: 2.1rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #0a0a0a;
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #ffffff;
          border-radius: 8px;
          padding: 0 0.75rem;
          line-height: 1.5;
        }

        .table-pagination {
          margin: 0;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
        }

        .table-pagination .page-item {
          margin: 0;
        }

        .table-pagination .page-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 2.3rem;
          height: 2.3rem;
          padding: 0 0.75rem;
          background: #0c0c0c;
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #f5f5f5;
          border-radius: 10px;
          transition: background 0.2s ease, color 0.2s ease;
          line-height: 1;
        }

        .table-pagination .page-item.active .page-link {
          background: #ff7a00;
          border-color: #ff7a00;
          color: #000000;
        }

        .table-pagination .page-link:hover {
          background: rgba(255, 122, 0, 0.15);
          color: #ffffff;
        }

        .table-pagination .page-item.disabled .page-link {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .empty-icon {
          font-size: 4rem;
          color: #ff7a00;
          opacity: 0.5;
          margin-bottom: 1rem;
        }

        .empty-state h5 {
          color: #ffffff;
          margin-bottom: 0.5rem;
        }

        .empty-state p {
          color: #8a8a8a;
          margin-bottom: 0;
        }

        /* Modal Styles */
        .student-modal .modal-dialog {
          max-width: 55vw !important;
          width: 55vw;
          margin: 0 auto;
        }

        .student-modal .modal-content {
          background: #0a0a0a;
          border: 1px solid #ff7a00;
          border-radius: 16px;
        }

        .form-row {
          display: flex;
          gap: 1.25rem;
          flex-wrap: wrap;
        }

        .form-col {
          flex: 1 1 240px;
          min-width: 240px;
        }

        .modal-header-custom {
          border-bottom: 1px solid #1f1f1f;
          padding: 1.25rem 1.5rem;
        }

        .modal-header-custom .modal-title {
          color: #ff7a00;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .modal-icon {
          font-size: 1.25rem;
        }

        .modal-body-custom {
          padding: 1.5rem;
        }

        .form-group-custom {
          margin-bottom: 1.5rem;
        }

        .form-label-custom {
          color: #ff7a00;
          font-weight: 500;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .label-icon {
          font-size: 0.9rem;
        }

        .form-control-custom {
          background: #000000;
          border: 1px solid #2c2c2c;
          color: #ffffff;
          padding: 0.75rem;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .form-control-custom:focus {
          background: #141414;
          border-color: #ff7a00;
          box-shadow: 0 0 0 0.2rem rgba(255, 122, 0, 0.25);
          color: #ffffff;
        }

        .form-control-custom::placeholder {
          color: #6c757d;
        }

        .form-text {
          color: #8a8a8a;
          font-size: 0.75rem;
          margin-top: 0.5rem;
          display: block;
        }

        .modal-actions {
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
          transition: all 0.2s ease;
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
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
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
          animation: spin 1s linear infinite;
          margin-right: 0.5rem;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .header-content {
            flex-direction: column;
            align-items: flex-start;
          }

          .button-group {
            width: 100%;
            flex-direction: column;
          }

          .add-student-btn, .bulk-upload-btn {
            width: 100%;
          }

          .stats-summary {
            grid-template-columns: 1fr;
          }

          .modal-actions {
            flex-direction: column-reverse;
          }

          .cancel-btn, .submit-btn {
            width: 100%;
          }

          .students-table thead th {
            font-size: 0.7rem;
            padding: 0.75rem;
          }

          .students-table td {
            padding: 0.75rem;
            font-size: 0.85rem;
          }

          .student-avatar {
            width: 32px;
            height: 32px;
            font-size: 0.85rem;
          }
        }
      `}</style>
    </div>
  )
}

export default InstituteAdmin