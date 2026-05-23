import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Card, Button, Form, Table, Modal, Spinner, Alert } from 'react-bootstrap'
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
    branch: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showBulkUpload, setShowBulkUpload] = useState(false);

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
        branch: ''
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
                        <th style={{ width: '25%' }}>Student Name</th>
                        <th style={{ width: '25%' }}>Email Address</th>
                        <th style={{ width: '15%' }}>Roll Number</th>
                        <th style={{ width: '15%' }}>Branch</th>
                        <th style={{ width: '10%' }}>Phone</th>
                        <th style={{ width: '10%' }} className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((stu) => (
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

            <Form.Group className="form-group-custom mb-4">
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

            <Form.Group className="form-group-custom mb-4">
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

            <Form.Group className="form-group-custom mb-4">
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

            <Form.Group className="form-group-custom mb-4">
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
        }

        .table-responsive {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .students-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 0;
        }

        .students-table thead th {
          background: #000000;
          color: #ff7a00;
          padding: 1rem;
          text-align: left;
          font-weight: 600;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #ff7a00;
        }

        .students-table tbody tr {
          border-bottom: 1px solid #1f1f1f;
          transition: background 0.2s ease;
        }

        .students-table tbody tr:hover {
          background: #141414;
        }

        .students-table td {
          padding: 1rem;
          color: #e5e5e5;
          vertical-align: middle;
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
        }

        .email-icon, .phone-icon {
          color: #ff7a00;
          font-size: 0.9rem;
          flex-shrink: 0;
        }

        .student-email-cell span, .student-phone-cell span {
          word-break: break-word;
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
          max-width: 75vw !important;
          width: 75vw;
          margin: 0 auto;
        }

        .student-modal .modal-content {
          background: #0a0a0a;
          border: 1px solid #ff7a00;
          border-radius: 16px;
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