import React, { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import CryptoJS from 'crypto-js'
import { Modal, Form, Spinner, Alert } from 'react-bootstrap'
import { useAuthContext } from '@/context/useAuthContext'
import {
  FaBriefcase, FaPlus, FaSearch, FaUser, FaEnvelope, FaLock,
  FaPhone, FaBuilding, FaTrashAlt, FaUserTie,
} from 'react-icons/fa'

const SECRET_KEY = 'EKLAV@2025'

type HRUser = {
  _id: string
  name?: string
  email: string
  status: string
  createdAt?: string
  profile?: {
    fullName?: string
    phoneNo?: string
    companyName?: string
    designation?: string
  }
}

const EMPTY_FORM = {
  fullName: '', email: '', password: '', phoneNumber: '', companyName: '', designation: '',
}

const HRManager: React.FC = () => {
  const { user } = useAuthContext()
  const token = user?.token
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [hrUsers, setHrUsers] = useState<HRUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(false)

  const [showAddModal, setShowAddModal] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [submitting, setSubmitting] = useState(false)
  const [addError, setAddError] = useState('')
  const [addSuccess, setAddSuccess] = useState('')

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchHRUsers = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const r = await axios.get(`${baseURL}/api/eklavadmin/hr-users`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit: 15, search },
      })
      setHrUsers(r.data.users || [])
      setTotal(r.data.total || 0)
      setTotalPages(r.data.totalPages || 1)
    } catch {
      setHrUsers([])
    } finally {
      setLoading(false)
    }
  }, [token, page, search, baseURL])

  useEffect(() => { fetchHRUsers() }, [fetchHRUsers])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setAddError('')
    setAddSuccess('')
    try {
      const encryptedPassword = CryptoJS.AES.encrypt(form.password, SECRET_KEY).toString()
      await axios.post(
        `${baseURL}/api/eklavadmin/hr-users/create`,
        { ...form, password: encryptedPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setAddSuccess('HR user created successfully.')
      setForm({ ...EMPTY_FORM })
      fetchHRUsers()
      setTimeout(() => { setShowAddModal(false); setAddSuccess('') }, 1200)
    } catch (err: any) {
      setAddError(err?.response?.data?.message || 'Failed to create HR user')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await axios.delete(`${baseURL}/api/eklavadmin/hr-users/${deleteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setDeleteId(null)
      fetchHRUsers()
    } catch {
      // silent — could add toast
    } finally {
      setDeleting(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    background: '#0d0d0d', border: '1px solid #2a2a2a', borderRadius: 8,
    padding: '9px 12px', color: '#fff', fontSize: '0.83rem', outline: 'none', width: '100%',
  }

  const getDisplayName = (u: HRUser) => u.profile?.fullName || u.name || u.email

  return (
    <div style={{ padding: '24px', minHeight: '80vh', background: '#0a0a0a', color: '#fff' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 10, padding: '10px 12px' }}>
            <FaBriefcase style={{ color: '#f97316', fontSize: 22 }} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontWeight: 800, color: '#fff', fontSize: '1.3rem' }}>HR Management</h3>
            <p style={{ margin: 0, color: '#666', fontSize: '0.82rem' }}>
              Create and manage HR recruiter logins — {total} HR user{total !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <button
          onClick={() => { setShowAddModal(true); setAddError(''); setAddSuccess('') }}
          style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', border: 'none', color: '#fff', padding: '9px 18px', borderRadius: 8, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}
        >
          <FaPlus /> Create HR User
        </button>
      </div>

      {/* Search bar */}
      <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 12, padding: '14px 20px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <FaSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#555', fontSize: 13 }} />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { setSearch(searchInput); setPage(1) } }}
            placeholder="Search by name or email..."
            style={{ ...inputStyle, paddingLeft: 34 }}
          />
        </div>
        <button onClick={() => { setSearch(searchInput); setPage(1) }} style={{ background: '#f97316', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
          Search
        </button>
        {search && (
          <button onClick={() => { setSearch(''); setSearchInput(''); setPage(1) }} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#888', padding: '8px 12px', borderRadius: 8, fontSize: '0.8rem', cursor: 'pointer' }}>
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#555' }}>
            <Spinner animation="border" size="sm" style={{ color: '#f97316', marginRight: 8 }} />
            Loading HR users...
          </div>
        ) : hrUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#444' }}>
            <FaUserTie style={{ fontSize: 44, marginBottom: 14, color: '#1e3a5f' }} />
            <p style={{ color: '#555' }}>{search ? 'No HR users match your search' : 'No HR users created yet'}</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: '#0d0d0d', borderBottom: '1px solid #1e1e1e' }}>
                    {['#', 'Name', 'Email', 'Company', 'Designation', 'Phone', 'Status', 'Created', 'Action'].map(h => (
                      <th key={h} style={{ padding: '11px 14px', color: '#666', fontWeight: 700, textAlign: 'left', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hrUsers.map((u, idx) => (
                    <tr key={u._id} style={{ borderBottom: '1px solid #161616' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#0f0f0f')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '11px 14px', color: '#555' }}>{(page - 1) * 15 + idx + 1}</td>
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #f97316, #ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0, color: '#fff' }}>
                            {getDisplayName(u).charAt(0).toUpperCase()}
                          </div>
                          <span style={{ color: '#e0e0e0', fontWeight: 600 }}>{getDisplayName(u)}</span>
                        </div>
                      </td>
                      <td style={{ padding: '11px 14px', color: '#888' }}>{u.email}</td>
                      <td style={{ padding: '11px 14px', color: '#aaa' }}>{u.profile?.companyName || '—'}</td>
                      <td style={{ padding: '11px 14px', color: '#aaa' }}>{u.profile?.designation || '—'}</td>
                      <td style={{ padding: '11px 14px', color: '#aaa' }}>{u.profile?.phoneNo || '—'}</td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ background: u.status === 'approved' ? 'rgba(34,197,94,0.12)' : 'rgba(234,179,8,0.12)', color: u.status === 'approved' ? '#22c55e' : '#eab308', border: `1px solid ${u.status === 'approved' ? '#22c55e44' : '#eab30844'}`, borderRadius: 20, padding: '2px 9px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'capitalize' }}>
                          {u.status || 'pending'}
                        </span>
                      </td>
                      <td style={{ padding: '11px 14px', color: '#666', whiteSpace: 'nowrap' }}>
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <button
                          onClick={() => setDeleteId(u._id)}
                          title="Delete HR user"
                          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', borderRadius: 6, padding: '5px 9px', cursor: 'pointer', fontSize: '0.75rem' }}
                        >
                          <FaTrashAlt />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <span style={{ color: '#555', fontSize: '0.78rem' }}>
                Showing {(page - 1) * 15 + 1}–{Math.min(page * 15, total)} of {total} HR users
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ background: '#111', border: '1px solid #222', color: page === 1 ? '#333' : '#888', padding: '5px 10px', borderRadius: 6, cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: '0.8rem' }}>‹</button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const pg = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page - 3 + i
                  return pg > 0 && pg <= totalPages ? (
                    <button key={pg} onClick={() => setPage(pg)} style={{ background: pg === page ? '#f97316' : '#111', border: `1px solid ${pg === page ? '#f97316' : '#222'}`, color: pg === page ? '#fff' : '#888', padding: '5px 10px', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem', fontWeight: pg === page ? 700 : 400 }}>{pg}</button>
                  ) : null
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ background: '#111', border: '1px solid #222', color: page === totalPages ? '#333' : '#888', padding: '5px 10px', borderRadius: 6, cursor: page === totalPages ? 'not-allowed' : 'pointer', fontSize: '0.8rem' }}>›</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Create HR User Modal ── */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered size="lg" className="student-modal">
        <Modal.Header closeButton className="modal-header-custom">
          <Modal.Title style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FaUserTie /> Create HR User
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-body-custom">
          {addError && <Alert variant="danger" style={{ fontSize: '0.82rem', marginBottom: 14 }}>{addError}</Alert>}
          {addSuccess && <Alert variant="success" style={{ fontSize: '0.82rem', marginBottom: 14 }}>{addSuccess}</Alert>}
          <Form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { key: 'fullName',     label: 'Full Name',    icon: <FaUser />,     type: 'text',     placeholder: "HR's full name",       required: true  },
                { key: 'email',        label: 'Email',        icon: <FaEnvelope />, type: 'email',    placeholder: 'hr@company.com',        required: true  },
                { key: 'password',     label: 'Password',     icon: <FaLock />,     type: 'password', placeholder: 'Min 6 characters',      required: true  },
                { key: 'phoneNumber',  label: 'Phone Number', icon: <FaPhone />,    type: 'tel',      placeholder: '10-digit number',       required: false },
                { key: 'companyName',  label: 'Company Name', icon: <FaBuilding />, type: 'text',     placeholder: 'e.g. Infosys, TCS',     required: false },
                { key: 'designation',  label: 'Designation',  icon: <FaUserTie />,  type: 'text',     placeholder: 'e.g. HR Recruiter',     required: false },
              ].map(({ key, label, icon, type, placeholder, required }) => (
                <Form.Group key={key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: '0.75rem', color: '#888', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                    {icon} {label}{required && <span style={{ color: '#ef4444' }}>*</span>}
                  </label>
                  <input
                    type={type}
                    placeholder={placeholder}
                    required={required}
                    value={(form as any)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    style={inputStyle}
                  />
                </Form.Group>
              ))}
            </div>

            <div style={{ marginTop: 8, padding: '10px 12px', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 8, fontSize: '0.75rem', color: '#94a3b8' }}>
              This HR user will be created in the global Eklav database with role <strong style={{ color: '#f97316' }}>hrAdmin</strong> and can log in at <strong style={{ color: '#f97316' }}>/hr/dashboard</strong>.
            </div>

            <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" onClick={() => setShowAddModal(false)} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#888', padding: '9px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button type="submit" disabled={submitting} style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', border: 'none', color: '#fff', padding: '9px 22px', borderRadius: 8, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                {submitting ? <><Spinner animation="border" size="sm" /> Creating...</> : <><FaPlus /> Create HR User</>}
              </button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* ── Delete Confirm Modal ── */}
      <Modal show={!!deleteId} onHide={() => setDeleteId(null)} centered className="student-modal" size="sm">
        <Modal.Header closeButton className="modal-header-custom">
          <Modal.Title style={{ fontSize: '1rem' }}>Delete HR User?</Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-body-custom">
          <p style={{ color: '#aaa', fontSize: '0.83rem', marginBottom: 20 }}>
            This will permanently delete the HR user and their profile. This action cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => setDeleteId(null)} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#888', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>Cancel</button>
            <button onClick={handleDelete} disabled={deleting} style={{ background: '#ef4444', border: 'none', color: '#fff', padding: '8px 18px', borderRadius: 8, fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 7 }}>
              {deleting ? <Spinner animation="border" size="sm" /> : <FaTrashAlt />} Delete
            </button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  )
}

export default HRManager
