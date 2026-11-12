import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Button, Form, Modal, Spinner } from 'react-bootstrap'
import { useAuthContext } from '@/context/useAuthContext'
import { FaUserGraduate, FaPlus, FaEnvelope, FaPhone, FaLock, FaUser, FaBuilding, FaSpinner, FaUniversity, FaSearch, FaFilter, FaUsers, FaCodeBranch, FaCalendarAlt, FaTimes, FaExclamationTriangle } from 'react-icons/fa'
import { AdminPage, PageHeader, StatCards, SearchInput, AdminSelect, TableFooter, EmptyState, toOptions, initialsOf } from '@/components/admin-ui'
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
  const [searchQuery, setSearchQuery] = useState('')
  const [filterBranch, setFilterBranch] = useState('')
  const [filterYear, setFilterYear] = useState('')

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

  const totalStudents = students.length

  const allBranches = useMemo(() => [...new Set(students.map(s => s.branch).filter(Boolean))].sort(), [students])
  const allYears = useMemo(() => [...new Set(students.map(s => s.joiningYear).filter(Boolean))].sort(), [students])

  const filteredStudents = useMemo(() => students.filter(s => {
    const q = searchQuery.toLowerCase()
    const matchSearch = !q ||
      (s.fullname || s.name || '').toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      (s.rollNumber || '').toLowerCase().includes(q) ||
      (s.branch || '').toLowerCase().includes(q)
    const matchBranch = !filterBranch || s.branch === filterBranch
    const matchYear = !filterYear || s.joiningYear === filterYear
    return matchSearch && matchBranch && matchYear
  }), [students, searchQuery, filterBranch, filterYear])

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / rowsPerPage))
  const currentStart = (currentPage - 1) * rowsPerPage
  const currentEnd = Math.min(currentStart + rowsPerPage, filteredStudents.length)
  const paginatedStudents = filteredStudents.slice(currentStart, currentEnd)

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const changePage = (page: number) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
  }

  return (
    <AdminPage>
      <PageHeader
        icon={FaUserGraduate}
        title="Student Management"
        badge={<span className="aui-badge aui-badge-orange">{totalStudents} Students</span>}
        subtitle="Manage students enrolled in your institute"
        stats={
          <StatCards
            inline
            loading={loading}
            items={[
              { label: 'Total Students', value: totalStudents, icon: FaUsers, tone: 'orange' },
              { label: 'Branches', value: allBranches.length, icon: FaCodeBranch, tone: 'blue' },
              { label: 'Joining Years', value: allYears.length, icon: FaCalendarAlt, tone: 'purple' },
              { label: 'Showing Now', value: filteredStudents.length, icon: FaFilter, tone: 'green' },
            ]}
          />
        }
      />

      {error && <div className="aui-alert"><FaExclamationTriangle /> {error}</div>}

      <div className="aui-card">
        <div className="aui-toolbar">
          <SearchInput
            value={searchQuery}
            onChange={value => { setSearchQuery(value); setCurrentPage(1) }}
            placeholder="Search by name, email, roll number or branch"
          />
          <div className="aui-toolbar-filters">
            <AdminSelect label="Filter by branch" prefix="Branch:" value={filterBranch} options={toOptions('All', allBranches as string[])} onChange={value => { setFilterBranch(value); setCurrentPage(1) }} />
            <AdminSelect label="Filter by joining year" prefix="Year:" value={filterYear} options={toOptions('All', allYears as string[])} onChange={value => { setFilterYear(value); setCurrentPage(1) }} />
            {(searchQuery || filterBranch || filterYear) && (
              <button type="button" className="aui-btn aui-btn-danger" onClick={() => { setSearchQuery(''); setFilterBranch(''); setFilterYear(''); setCurrentPage(1) }}>
                <FaTimes size={11} /> Clear
              </button>
            )}
            <span className="aui-count">{filteredStudents.length} of {totalStudents}</span>
          </div>
        </div>

        {loading ? (
          <div className="aui-empty">
            <FaSpinner className="aui-spin" />
            <span>Loading students…</span>
          </div>
        ) : filteredStudents.length === 0 ? (
          <EmptyState
            icon={students.length === 0 ? FaUserGraduate : FaSearch}
            title={students.length === 0 ? 'No students yet' : 'No students match your filters'}
            text={students.length === 0 ? 'Students enrolled in your institute will appear here.' : 'Try a different search term or clear the filters.'}
          />
        ) : (
          <>
            <div className="aui-table-scroll">
              <table className="aui-table">
                <thead>
                  <tr>
                    <th style={{ width: 48 }}>#</th>
                    <th>Student</th>
                    <th>Roll / Branch</th>
                    <th>Joining Year</th>
                    <th>Gender</th>
                    <th>Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedStudents.map((stu, idx) => {
                    const displayName = stu.fullname || stu.name || stu.email
                    return (
                      <tr key={stu._id}>
                        <td className="aui-num">{currentStart + idx + 1}</td>
                        <td>
                          <div className="aui-person">
                            <span className="aui-avatar">{initialsOf(displayName)}</span>
                            <div className="aui-stack">
                              <strong>{displayName}</strong>
                              <small>{stu.email}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="aui-stack">
                            <strong>{stu.rollNumber || '—'}</strong>
                            <small>{stu.branch || 'Branch not set'}</small>
                          </div>
                        </td>
                        <td>{stu.joiningYear ? <span className="aui-badge aui-badge-muted">{stu.joiningYear}</span> : '—'}</td>
                        <td>{stu.gender || '—'}</td>
                        <td>
                          {stu.phoneNumber
                            ? <span className="aui-inline-icon"><FaPhone /> {stu.phoneNumber}</span>
                            : <span className="aui-num">Not provided</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <TableFooter
              page={currentPage}
              pageSize={rowsPerPage}
              total={filteredStudents.length}
              onPageChange={changePage}
              pageSizeOptions={[5, 10, 15, 20]}
              onPageSizeChange={size => { setRowsPerPage(size); setCurrentPage(1) }}
              noun="students"
            />
          </>
        )}
      </div>

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
        /* Sits directly in the layout's content card (same layering as the dashboard) */
        .institute-admin-container {
          background: transparent;
        }

        /* Card Styles */
        .students-management-card {
          background: transparent;
          border: 0;
          border-radius: 0;
        }

        .card-header-custom {
          background: transparent;
          border-bottom: 1px solid #1e1e1e;
          padding: 0 0 1.25rem;
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
          padding: 1.25rem 0 0;
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
          overflow: hidden;
          background: #111111;
          border: 1px solid #1f1f1f;
          border-radius: 14px;
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
          background: transparent;
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
          padding: 0.85rem 1rem;
          border-top: 1px solid #1f1f1f;
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
    </AdminPage>
  )
}

export default InstituteAdmin