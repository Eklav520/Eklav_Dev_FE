import React, { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { Modal, Form, Table, Spinner, Pagination, Alert, Badge } from 'react-bootstrap'
import { useAuthContext } from '@/context/useAuthContext'
import { FaUserGraduate, FaPlus, FaUpload, FaSearch, FaUniversity, FaEnvelope, FaPhone, FaUser, FaLock, FaBuilding } from 'react-icons/fa'
import * as XLSX from 'xlsx'

type Institute = { _id: string; name: string; address?: string }
type Student = {
  _id: string; name?: string; fullname?: string; email: string;
  rollNumber?: string; branch?: string; joiningYear?: string;
  gender?: string; phoneNumber?: string; status?: string; createdAt?: string;
}

const EMPTY_FORM = { fullname: '', email: '', phoneNumber: '', password: '', rollNumber: '', gender: 'Male', branch: '', joiningYear: '' }

const InstituteStudentManager: React.FC = () => {
  const { user } = useAuthContext()
  const token = user?.token
  const baseURL = import.meta.env.VITE_API_BASE_URL

  // ── Institute selector ──
  const [institutes, setInstitutes] = useState<Institute[]>([])
  const [selectedInstitute, setSelectedInstitute] = useState<Institute | null>(null)
  const [instituteSearch, setInstituteSearch] = useState('')

  // ── Students list ──
  const [students, setStudents] = useState<Student[]>([])
  const [totalStudents, setTotalStudents] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loadingStudents, setLoadingStudents] = useState(false)

  // ── Add Student modal ──
  const [showAddModal, setShowAddModal] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [submitting, setSubmitting] = useState(false)
  const [addError, setAddError] = useState('')

  // ── Bulk Upload modal ──
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkData, setBulkData] = useState<any[]>([])
  const [bulkUploading, setBulkUploading] = useState(false)
  const [bulkResult, setBulkResult] = useState<any>(null)
  const [bulkFileError, setBulkFileError] = useState('')

  // ── Fetch institutes ──
  useEffect(() => {
    if (!token) return
    axios.get(`${baseURL}/api/colleges`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setInstitutes(r.data?.colleges || r.data || []))
      .catch(() => {})
  }, [token])

  // ── Fetch students when institute or page/search changes ──
  const fetchStudents = useCallback(async () => {
    if (!selectedInstitute) return
    setLoadingStudents(true)
    try {
      const r = await axios.get(`${baseURL}/api/institute/${selectedInstitute._id}/students`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit: 10, search }
      })
      setStudents(r.data.students || [])
      setTotalStudents(r.data.total || 0)
      setTotalPages(r.data.totalPages || 1)
    } catch {
      setStudents([])
    } finally {
      setLoadingStudents(false)
    }
  }, [selectedInstitute, page, search, token])

  useEffect(() => { fetchStudents() }, [fetchStudents])

  // ── Add Student ──
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedInstitute) return
    setSubmitting(true)
    setAddError('')
    try {
      await axios.post(
        `${baseURL}/api/institute/${selectedInstitute._id}/createStudent`,
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setShowAddModal(false)
      setForm({ ...EMPTY_FORM })
      fetchStudents()
    } catch (err: any) {
      setAddError(err?.response?.data?.message || 'Failed to create student')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Bulk upload file parse ──
  const handleBulkFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBulkFileError('')
    setBulkResult(null)
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array' })
        const sheet = wb.Sheets[wb.SheetNames[0]]
        const rows: any[] = XLSX.utils.sheet_to_json(sheet)
        if (!rows.length) { setBulkFileError('File is empty'); return }
        const required = ['name', 'email', 'password', 'rollnumber']
        const headers = Object.keys(rows[0]).map(k => k.toLowerCase().trim())
        const missing = required.filter(r => !headers.includes(r))
        if (missing.length) { setBulkFileError(`Missing columns: ${missing.join(', ')}`); return }
        const mapped = rows.map((row: any) => {
          const norm: any = {}
          Object.keys(row).forEach(k => { norm[k.toLowerCase().trim()] = row[k] })
          return {
            name: norm.name, email: norm.email, password: String(norm.password),
            rollNumber: String(norm.rollnumber || norm.rollNumber || ''),
            gender: norm.gender || 'Male', branch: norm.branch || '',
            phone: String(norm.phone || norm.phonenumber || ''),
            joiningYear: norm.joiningyear || norm.joiningYear || ''
          }
        })
        setBulkData(mapped)
      } catch { setBulkFileError('Failed to parse file') }
    }
    reader.readAsArrayBuffer(file)
  }

  const handleBulkUpload = async () => {
    if (!selectedInstitute || !bulkData.length) return
    setBulkUploading(true)
    try {
      const r = await axios.post(
        `${baseURL}/api/institute/${selectedInstitute._id}/bulkUploadStudents`,
        { students: bulkData },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setBulkResult(r.data)
      fetchStudents()
    } catch (err: any) {
      setBulkFileError(err?.response?.data?.message || 'Bulk upload failed')
    } finally {
      setBulkUploading(false)
    }
  }

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{ name: 'John Doe', email: 'john@example.com', password: 'Pass@123', rollnumber: 'CS001', gender: 'Male', branch: 'CSE', phone: '9876543210', joiningYear: '2024' }])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Students')
    XLSX.writeFile(wb, 'student_upload_template.xlsx')
  }

  const filteredInstitutes = institutes.filter(i => i.name.toLowerCase().includes(instituteSearch.toLowerCase()))

  const getDisplayName = (s: Student) => s.fullname || s.name || s.email

  return (
    <div style={{ padding: '24px', minHeight: '80vh', background: '#0a0a0a', color: '#fff' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: 'rgba(255,107,53,0.15)', border: '1px solid rgba(255,107,53,0.3)', borderRadius: 10, padding: '10px 12px' }}>
            <FaUserGraduate style={{ color: '#ff6b35', fontSize: 22 }} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontWeight: 800, color: '#fff', fontSize: '1.3rem' }}>Institute Student Management</h3>
            <p style={{ margin: 0, color: '#666', fontSize: '0.82rem' }}>Manage students for any institute as super admin</p>
          </div>
        </div>
        {selectedInstitute && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => { setShowAddModal(true); setAddError('') }}
              style={{ background: 'linear-gradient(135deg, #ff6b35, #e55a2b)', border: 'none', color: '#fff', padding: '9px 18px', borderRadius: 8, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}
            >
              <FaPlus /> Add Student
            </button>
            <button
              onClick={() => { setShowBulkModal(true); setBulkData([]); setBulkResult(null); setBulkFileError('') }}
              style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#ccc', padding: '9px 18px', borderRadius: 8, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}
            >
              <FaUpload /> Bulk Upload
            </button>
          </div>
        )}
      </div>

      {/* ── Institute Selector ── */}
      <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ff6b35', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
          <FaUniversity style={{ marginRight: 6 }} /> Select Institute
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
            <FaSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#555', fontSize: 13 }} />
            <input
              value={instituteSearch}
              onChange={e => setInstituteSearch(e.target.value)}
              placeholder="Search institutes..."
              style={{ width: '100%', background: '#0d0d0d', border: '1px solid #2a2a2a', borderRadius: 8, padding: '9px 12px 9px 34px', color: '#fff', fontSize: '0.83rem', outline: 'none' }}
            />
          </div>
          <select
            value={selectedInstitute?._id || ''}
            onChange={e => {
              const inst = institutes.find(i => i._id === e.target.value) || null
              setSelectedInstitute(inst)
              setPage(1)
              setSearch('')
              setSearchInput('')
            }}
            style={{ background: '#0d0d0d', border: '1px solid #2a2a2a', borderRadius: 8, padding: '9px 14px', color: selectedInstitute ? '#fff' : '#555', fontSize: '0.83rem', minWidth: 280, outline: 'none', cursor: 'pointer' }}
          >
            <option value="">— Choose an institute —</option>
            {filteredInstitutes.map(i => (
              <option key={i._id} value={i._id}>{i.name}</option>
            ))}
          </select>
        </div>

        {selectedInstitute && (
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.25)', borderRadius: 20, padding: '3px 12px', fontSize: '0.78rem', color: '#ff6b35', fontWeight: 700 }}>
              {selectedInstitute.name}
            </span>
            <span style={{ color: '#555', fontSize: '0.78rem' }}>{totalStudents} student{totalStudents !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* ── Students Table ── */}
      {!selectedInstitute ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#444' }}>
          <FaUniversity style={{ fontSize: 48, marginBottom: 16, color: '#2a2a2a' }} />
          <p style={{ fontSize: '1rem', color: '#555' }}>Select an institute above to view and manage its students</p>
        </div>
      ) : (
        <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 12, overflow: 'hidden' }}>
          {/* Table search bar */}
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <FaSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#555', fontSize: 13 }} />
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { setSearch(searchInput); setPage(1) } }}
                placeholder="Search by name, email, roll number, branch..."
                style={{ width: '100%', background: '#0d0d0d', border: '1px solid #222', borderRadius: 8, padding: '8px 12px 8px 34px', color: '#fff', fontSize: '0.82rem', outline: 'none' }}
              />
            </div>
            <button onClick={() => { setSearch(searchInput); setPage(1) }} style={{ background: '#ff6b35', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>Search</button>
            {search && <button onClick={() => { setSearch(''); setSearchInput(''); setPage(1) }} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#888', padding: '8px 12px', borderRadius: 8, fontSize: '0.8rem', cursor: 'pointer' }}>Clear</button>}
          </div>

          {loadingStudents ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#555' }}>
              <Spinner animation="border" size="sm" style={{ color: '#ff6b35', marginRight: 8 }} />
              Loading students...
            </div>
          ) : students.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#444' }}>
              <FaUserGraduate style={{ fontSize: 40, marginBottom: 12, color: '#2a2a2a' }} />
              <p>{search ? 'No students match your search' : 'No students enrolled yet'}</p>
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: '#0d0d0d', borderBottom: '1px solid #1e1e1e' }}>
                      {['#', 'Name', 'Email', 'Roll No', 'Branch', 'Year', 'Gender', 'Phone', 'Status', 'Joined', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '11px 14px', color: '#666', fontWeight: 700, textAlign: 'left', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, idx) => (
                      <tr key={s._id} style={{ borderBottom: '1px solid #161616' }}>
                        <td style={{ padding: '11px 14px', color: '#555' }}>{(page - 1) * 10 + idx + 1}</td>
                        <td style={{ padding: '11px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                            <div style={{ width: 30, height: 30, borderRadius: '50%', background: `hsl(${getDisplayName(s).charCodeAt(0) * 7 % 360},50%,35%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>
                              {getDisplayName(s).charAt(0).toUpperCase()}
                            </div>
                            <span style={{ color: '#e0e0e0', fontWeight: 600 }}>{getDisplayName(s)}</span>
                          </div>
                        </td>
                        <td style={{ padding: '11px 14px', color: '#888' }}>{s.email}</td>
                        <td style={{ padding: '11px 14px', color: '#ff6b35', fontWeight: 700 }}>{s.rollNumber || '—'}</td>
                        <td style={{ padding: '11px 14px', color: '#aaa' }}>{s.branch || '—'}</td>
                        <td style={{ padding: '11px 14px', color: '#aaa' }}>{s.joiningYear || '—'}</td>
                        <td style={{ padding: '11px 14px', color: '#aaa' }}>{s.gender || '—'}</td>
                        <td style={{ padding: '11px 14px', color: '#aaa' }}>{s.phoneNumber || '—'}</td>
                        <td style={{ padding: '11px 14px' }}>
                          <span style={{ background: s.status === 'approved' ? 'rgba(34,197,94,0.12)' : 'rgba(234,179,8,0.12)', color: s.status === 'approved' ? '#22c55e' : '#eab308', border: `1px solid ${s.status === 'approved' ? '#22c55e44' : '#eab30844'}`, borderRadius: 20, padding: '2px 9px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'capitalize' }}>
                            {s.status || 'pending'}
                          </span>
                        </td>
                        <td style={{ padding: '11px 14px', color: '#666', whiteSpace: 'nowrap' }}>
                          {s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                        <td style={{ padding: '11px 14px' }}>
                          <span style={{ color: '#333', fontSize: '0.72rem' }}>—</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div style={{ padding: '12px 20px', borderTop: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <span style={{ color: '#555', fontSize: '0.78rem' }}>Showing {(page - 1) * 10 + 1}–{Math.min(page * 10, totalStudents)} of {totalStudents} students</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ background: '#111', border: '1px solid #222', color: page === 1 ? '#333' : '#888', padding: '5px 10px', borderRadius: 6, cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: '0.8rem' }}>‹</button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    const pg = totalPages <= 7 ? i + 1 : (page <= 4 ? i + 1 : page - 3 + i)
                    return pg > 0 && pg <= totalPages ? (
                      <button key={pg} onClick={() => setPage(pg)} style={{ background: pg === page ? '#ff6b35' : '#111', border: `1px solid ${pg === page ? '#ff6b35' : '#222'}`, color: pg === page ? '#fff' : '#888', padding: '5px 10px', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem', fontWeight: pg === page ? 700 : 400 }}>{pg}</button>
                    ) : null
                  })}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ background: '#111', border: '1px solid #222', color: page === totalPages ? '#333' : '#888', padding: '5px 10px', borderRadius: 6, cursor: page === totalPages ? 'not-allowed' : 'pointer', fontSize: '0.8rem' }}>›</button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Add Student Modal ── */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered dialogClassName="student-modal-dialog" className="student-modal">
        <Modal.Header closeButton className="modal-header-custom">
          <Modal.Title style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FaUserGraduate /> Add Student — {selectedInstitute?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-body-custom">
          {addError && <Alert variant="danger" style={{ fontSize: '0.82rem', marginBottom: 16 }}>{addError}</Alert>}
          <Form onSubmit={handleAddStudent}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { key: 'fullname', label: 'Full Name', icon: <FaUser />, type: 'text', placeholder: "Student's full name", required: true },
                { key: 'email', label: 'Email', icon: <FaEnvelope />, type: 'email', placeholder: 'student@example.com', required: true },
                { key: 'password', label: 'Password', icon: <FaLock />, type: 'password', placeholder: 'Min 6 characters', required: true },
                { key: 'phoneNumber', label: 'Phone Number', icon: <FaPhone />, type: 'tel', placeholder: '10-digit number', required: false },
                { key: 'rollNumber', label: 'Roll Number', icon: <FaBuilding />, type: 'text', placeholder: 'e.g. CS001', required: true },
                { key: 'branch', label: 'Branch', icon: <FaBuilding />, type: 'text', placeholder: 'e.g. CSE, ECE', required: true },
                { key: 'joiningYear', label: 'Joining Year', icon: <FaUser />, type: 'text', placeholder: 'e.g. 2024', required: false },
              ].map(({ key, label, icon, type, placeholder, required }) => (
                <Form.Group key={key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: '0.75rem', color: '#888', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>{icon} {label}{required && <span style={{ color: '#ef4444' }}>*</span>}</label>
                  <input
                    type={type} placeholder={placeholder} required={required}
                    value={(form as any)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    style={{ background: '#0d0d0d', border: '1px solid #2a2a2a', borderRadius: 8, padding: '9px 12px', color: '#fff', fontSize: '0.83rem', outline: 'none', width: '100%' }}
                  />
                </Form.Group>
              ))}
              <Form.Group style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: '0.75rem', color: '#888', fontWeight: 700 }}>Gender</label>
                <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))} style={{ background: '#0d0d0d', border: '1px solid #2a2a2a', borderRadius: 8, padding: '9px 12px', color: '#fff', fontSize: '0.83rem', outline: 'none' }}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </Form.Group>
            </div>
            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" onClick={() => setShowAddModal(false)} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#888', padding: '9px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button type="submit" disabled={submitting} style={{ background: 'linear-gradient(135deg, #ff6b35, #e55a2b)', border: 'none', color: '#fff', padding: '9px 22px', borderRadius: 8, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                {submitting ? <><Spinner animation="border" size="sm" /> Creating...</> : <><FaPlus /> Create Student</>}
              </button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* ── Bulk Upload Modal ── */}
      <Modal show={showBulkModal} onHide={() => setShowBulkModal(false)} centered size="lg" className="student-modal">
        <Modal.Header closeButton className="modal-header-custom">
          <Modal.Title style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FaUpload /> Bulk Upload Students — {selectedInstitute?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-body-custom">
          <div style={{ marginBottom: 16 }}>
            <button onClick={downloadTemplate} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#22c55e', padding: '7px 14px', borderRadius: 7, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              ⬇ Download Template
            </button>
            <span style={{ color: '#555', fontSize: '0.76rem', marginLeft: 12 }}>Required columns: name, email, password, rollnumber, gender, branch, phone, joiningYear</span>
          </div>

          <label style={{ display: 'block', background: '#0d0d0d', border: '2px dashed #2a2a2a', borderRadius: 10, padding: '24px', textAlign: 'center', cursor: 'pointer', marginBottom: 14 }}>
            <FaUpload style={{ fontSize: 28, color: '#444', marginBottom: 8 }} />
            <p style={{ color: '#666', fontSize: '0.83rem', margin: 0 }}>Click to upload Excel/CSV file</p>
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleBulkFile} style={{ display: 'none' }} />
          </label>

          {bulkFileError && <Alert variant="danger" style={{ fontSize: '0.82rem' }}>{bulkFileError}</Alert>}

          {bulkData.length > 0 && !bulkResult && (
            <div style={{ background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 8, padding: 14, marginBottom: 14 }}>
              <div style={{ color: '#22c55e', fontWeight: 700, fontSize: '0.85rem', marginBottom: 8 }}>✓ {bulkData.length} students parsed — preview</div>
              <div style={{ overflowX: 'auto', maxHeight: 200 }}>
                <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>{['Name', 'Email', 'Roll No', 'Branch', 'Gender'].map(h => <th key={h} style={{ padding: '5px 10px', color: '#666', textAlign: 'left', borderBottom: '1px solid #1e1e1e' }}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {bulkData.slice(0, 5).map((s, i) => (
                      <tr key={i}>
                        <td style={{ padding: '5px 10px', color: '#ddd' }}>{s.name}</td>
                        <td style={{ padding: '5px 10px', color: '#888' }}>{s.email}</td>
                        <td style={{ padding: '5px 10px', color: '#ff6b35' }}>{s.rollNumber}</td>
                        <td style={{ padding: '5px 10px', color: '#aaa' }}>{s.branch}</td>
                        <td style={{ padding: '5px 10px', color: '#aaa' }}>{s.gender}</td>
                      </tr>
                    ))}
                    {bulkData.length > 5 && <tr><td colSpan={5} style={{ padding: '5px 10px', color: '#555', fontStyle: 'italic' }}>...and {bulkData.length - 5} more</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {bulkResult && (
            <div style={{ background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 8, padding: 14 }}>
              <div style={{ display: 'flex', gap: 14, marginBottom: 10 }}>
                <span style={{ color: '#22c55e', fontWeight: 700 }}>✓ {bulkResult.summary.successful} created</span>
                {bulkResult.summary.failed > 0 && <span style={{ color: '#ef4444', fontWeight: 700 }}>✗ {bulkResult.summary.failed} failed</span>}
              </div>
              {bulkResult.results.failed.length > 0 && (
                <div style={{ maxHeight: 150, overflowY: 'auto' }}>
                  {bulkResult.results.failed.map((f: any, i: number) => (
                    <div key={i} style={{ fontSize: '0.75rem', color: '#ef4444', padding: '3px 0' }}>✗ {f.email} — {f.error}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!bulkResult && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <button onClick={() => setShowBulkModal(false)} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#888', padding: '9px 18px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button onClick={handleBulkUpload} disabled={!bulkData.length || bulkUploading} style={{ background: 'linear-gradient(135deg, #ff6b35, #e55a2b)', border: 'none', color: '#fff', padding: '9px 22px', borderRadius: 8, fontWeight: 700, cursor: (!bulkData.length || bulkUploading) ? 'not-allowed' : 'pointer', opacity: (!bulkData.length || bulkUploading) ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                {bulkUploading ? <><Spinner animation="border" size="sm" /> Uploading...</> : <><FaUpload /> Upload {bulkData.length > 0 ? `${bulkData.length} Students` : ''}</>}
              </button>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  )
}

export default InstituteStudentManager
