import React, { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import CryptoJS from 'crypto-js'
import { Modal } from 'react-bootstrap'
import { useAuthContext } from '@/context/useAuthContext'
import {
  FaBriefcase, FaPlus, FaTrashAlt, FaUserTie, FaSpinner, FaSyncAlt, FaTimes,
  FaCheckCircle, FaExclamationTriangle, FaEye, FaEyeSlash, FaInfoCircle,
} from 'react-icons/fa'
import { AdminPage, EmptyState, PageHeader, SearchInput, StatCards, TableFooter, initialsOf, type StatItem } from '@/components/admin-ui'

const SECRET_KEY = 'EKLAV@2025'
const PAGE_SIZE = 15

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

const FIELDS: { key: keyof typeof EMPTY_FORM; label: string; type: string; placeholder: string; required: boolean }[] = [
  { key: 'fullName',    label: 'Full name',    type: 'text',  placeholder: "HR's full name",    required: true },
  { key: 'email',       label: 'Email',        type: 'email', placeholder: 'hr@company.com',    required: true },
  { key: 'companyName', label: 'Company',      type: 'text',  placeholder: 'e.g. Infosys, TCS', required: false },
  { key: 'designation', label: 'Designation',  type: 'text',  placeholder: 'e.g. HR Recruiter', required: false },
  { key: 'phoneNumber', label: 'Phone number', type: 'tel',   placeholder: '10-digit number',   required: false },
]

const HRManager: React.FC = () => {
  const { user } = useAuthContext()
  const token = user?.token
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [hrUsers, setHrUsers] = useState<HRUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [listError, setListError] = useState('')
  const [notice, setNotice] = useState('')

  const [showAddModal, setShowAddModal] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [addError, setAddError] = useState('')

  const [deleteTarget, setDeleteTarget] = useState<HRUser | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchHRUsers = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setListError('')
    try {
      const r = await axios.get(`${baseURL}/api/eklavadmin/hr-users`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit: PAGE_SIZE, search },
      })
      setHrUsers(r.data.users || [])
      setTotal(r.data.total || 0)
    } catch {
      setHrUsers([])
      setListError('Could not load HR users.')
    } finally {
      setLoading(false)
    }
  }, [token, page, search, baseURL])

  useEffect(() => { fetchHRUsers() }, [fetchHRUsers])

  // Search as you type (debounced)
  useEffect(() => {
    const t = setTimeout(() => { if (searchInput.trim() !== search) { setSearch(searchInput.trim()); setPage(1) } }, 350)
    return () => clearTimeout(t)
  }, [searchInput]) // eslint-disable-line

  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(''), 4000)
    return () => clearTimeout(t)
  }, [notice])

  const openAdd = () => { setForm({ ...EMPTY_FORM }); setAddError(''); setShowPassword(false); setShowAddModal(true) }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password.length < 6) { setAddError('Password must be at least 6 characters.'); return }
    setSubmitting(true)
    setAddError('')
    try {
      const encryptedPassword = CryptoJS.AES.encrypt(form.password, SECRET_KEY).toString()
      await axios.post(
        `${baseURL}/api/eklavadmin/hr-users/create`,
        { ...form, password: encryptedPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setNotice(`HR user "${form.fullName}" was created.`)
      setForm({ ...EMPTY_FORM })
      setShowAddModal(false)
      fetchHRUsers()
    } catch (err: any) {
      setAddError(err?.response?.data?.message || 'Failed to create HR user')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await axios.delete(`${baseURL}/api/eklavadmin/hr-users/${deleteTarget._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setNotice(`"${getDisplayName(deleteTarget)}" was deleted.`)
      // Step back a page when the last row on this page was removed
      if (hrUsers.length === 1 && page > 1) setPage(page - 1)
      else fetchHRUsers()
    } catch (err: any) {
      setListError(err?.response?.data?.message || 'Failed to delete the HR user.')
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const getDisplayName = (u: HRUser) => u.profile?.fullName || u.name || u.email

  const pageApproved = hrUsers.filter((u) => u.status === 'approved').length
  const stats: StatItem[] = [
    { label: 'HR users', value: total, icon: FaUserTie, tone: 'orange' },
  ]

  return (
    <AdminPage>
      <PageHeader
        icon={FaBriefcase}
        title="HR Details"
        subtitle="Recruiter logins for the HR portal"
        stats={<StatCards inline items={stats} loading={loading && hrUsers.length === 0} />}
        actions={
          <>
            <button type="button" className="aui-btn" onClick={fetchHRUsers} disabled={loading}>
              <FaSyncAlt size={11} className={loading ? 'aui-spin' : ''} /> Refresh
            </button>
            <button type="button" className="aui-btn aui-btn-primary" onClick={openAdd}><FaPlus size={11} /> Create HR User</button>
          </>
        }
      />

      {notice && (
        <div className="aui-alert aui-alert-success"><FaCheckCircle /> <span>{notice}</span>
          <button type="button" className="aui-alert-close" onClick={() => setNotice('')} aria-label="Dismiss"><FaTimes size={11} /></button>
        </div>
      )}
      {listError && (
        <div className="aui-alert"><FaExclamationTriangle /> <span>{listError}</span>
          <button type="button" className="aui-alert-close" onClick={() => setListError('')} aria-label="Dismiss"><FaTimes size={11} /></button>
        </div>
      )}

      <div className="aui-card">
        <div className="aui-toolbar">
          <div className="aui-toolbar-title">
            <h3>All HR users</h3>
            <p>{hrUsers.length > 0 ? <><b>{pageApproved}</b> of <b>{hrUsers.length}</b> on this page approved</> : 'Search by name or email'}</p>
          </div>
          <div className="aui-toolbar-filters">
            <SearchInput value={searchInput} onChange={setSearchInput} placeholder="Search name or email…" />
            <span className="aui-count">{total} user{total === 1 ? '' : 's'}</span>
          </div>
        </div>

        {loading && hrUsers.length === 0 ? (
          <div className="aui-empty"><FaSpinner className="aui-spin" /><p>Loading HR users…</p></div>
        ) : hrUsers.length === 0 ? (
          <EmptyState
            icon={FaUserTie}
            title={search ? 'No HR users match' : 'No HR users yet'}
            text={search ? 'Try a different name or email.' : 'Create a login so a recruiter can use the HR portal.'}
            action={search
              ? <button type="button" className="aui-btn" onClick={() => setSearchInput('')}>Clear search</button>
              : <button type="button" className="aui-btn aui-btn-primary" onClick={openAdd}><FaPlus size={11} /> Create HR User</button>}
          />
        ) : (
          <>
            <div className={`aui-table-scroll${loading ? ' hr-refreshing' : ''}`}>
              <table className="aui-table">
                <thead>
                  <tr>
                    <th style={{ width: 52 }}>#</th>
                    <th>HR user</th>
                    <th>Company</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th className="text-end" style={{ width: 80 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {hrUsers.map((u, idx) => {
                    const approved = u.status === 'approved'
                    return (
                      <tr key={u._id}>
                        <td className="aui-num">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                        <td>
                          <div className="aui-person">
                            <span className="aui-avatar">{initialsOf(getDisplayName(u))}</span>
                            <div className="aui-stack">
                              <strong>{getDisplayName(u)}</strong>
                              <small>{u.email}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          {u.profile?.companyName || u.profile?.designation ? (
                            <div className="aui-stack">
                              <span className="hr-company">{u.profile?.companyName || '—'}</span>
                              {u.profile?.designation && <small className="hr-muted">{u.profile.designation}</small>}
                            </div>
                          ) : <span className="hr-dash">—</span>}
                        </td>
                        <td>{u.profile?.phoneNo || <span className="hr-dash">—</span>}</td>
                        <td>
                          <span className={`aui-badge aui-badge-dot ${approved ? 'aui-badge-green' : 'aui-badge-amber'} hr-status`}>{u.status || 'pending'}</span>
                        </td>
                        <td className="hr-muted">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                        <td className="text-end">
                          <button type="button" className="aui-icon-btn hr-del" title="Delete HR user" onClick={() => setDeleteTarget(u)}><FaTrashAlt size={11} /></button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <TableFooter page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} noun="HR users" />
          </>
        )}
      </div>

      {/* ── Create HR User ── */}
      <Modal show={showAddModal} onHide={() => !submitting && setShowAddModal(false)} centered size="lg" contentClassName="aui-modal" backdropClassName="aui-backdrop">
        <form onSubmit={handleCreate} className="aui-page">
          <div className="aui-modal-head">
            <span className="aui-heading-icon"><FaUserTie /></span>
            <div>
              <h3>Create HR user</h3>
              <p>A login for the HR portal</p>
            </div>
            <button type="button" className="aui-icon-btn" onClick={() => setShowAddModal(false)} disabled={submitting} aria-label="Close"><FaTimes size={12} /></button>
          </div>
          <div className="aui-modal-body">
            {addError && <div className="aui-alert"><FaExclamationTriangle /> <span>{addError}</span></div>}

            <div className="aui-section-label">Account</div>
            <div className="aui-field-row">
              {FIELDS.slice(0, 2).map((f) => (
                <div key={f.key} className="aui-field">
                  <label className="aui-label" htmlFor={`hr-${f.key}`}>{f.label} <span className="hr-req">*</span></label>
                  <input id={`hr-${f.key}`} className="aui-input" type={f.type} placeholder={f.placeholder} required value={form[f.key]} onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))} />
                </div>
              ))}
            </div>
            <div className="aui-field">
              <label className="aui-label" htmlFor="hr-password">Password <span className="hr-req">*</span></label>
              <div className="hr-pass">
                <input id="hr-password" className="aui-input" type={showPassword ? 'text' : 'password'} placeholder="At least 6 characters" required value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} autoComplete="new-password" />
                <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <FaEyeSlash /> : <FaEye />}</button>
              </div>
              <p className="aui-hint">Share it with the recruiter securely.</p>
            </div>

            <div className="aui-section-label">Profile <span className="aui-optional">Optional</span></div>
            <div className="aui-field-row">
              {FIELDS.slice(2).map((f) => (
                <div key={f.key} className="aui-field">
                  <label className="aui-label" htmlFor={`hr-${f.key}`}>{f.label}</label>
                  <input id={`hr-${f.key}`} className="aui-input" type={f.type} placeholder={f.placeholder} value={form[f.key]} onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))} />
                </div>
              ))}
            </div>

            <div className="aui-alert aui-alert-info hr-info">
              <FaInfoCircle />
              <span>Created in the global Eklav database with role <b>hrAdmin</b>. They sign in at <b>/hr/dashboard</b>.</span>
            </div>
          </div>
          <div className="aui-modal-foot">
            <button type="button" className="aui-btn" onClick={() => setShowAddModal(false)} disabled={submitting}>Cancel</button>
            <button type="submit" className="aui-btn aui-btn-primary" disabled={submitting}>
              {submitting ? <FaSpinner className="aui-spin" style={{ color: '#fff' }} /> : <FaPlus size={11} />} {submitting ? 'Creating…' : 'Create HR user'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Delete confirm ── */}
      <Modal show={!!deleteTarget} onHide={() => !deleting && setDeleteTarget(null)} centered contentClassName="aui-modal" backdropClassName="aui-backdrop">
        <div className="aui-modal-head">
          <span className="hr-del-icon"><FaTrashAlt /></span>
          <div>
            <h3>Delete HR user?</h3>
            <p>{deleteTarget ? `${getDisplayName(deleteTarget)} · ${deleteTarget.email}` : ''}</p>
          </div>
        </div>
        <div className="aui-modal-body"><p className="hr-modal-text">Their login and profile are deleted permanently and they can no longer sign in to the HR portal.</p></div>
        <div className="aui-modal-foot">
          <button type="button" className="aui-btn" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</button>
          <button type="button" className="aui-btn aui-btn-danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? <FaSpinner className="aui-spin" /> : <FaTrashAlt size={11} />} Delete
          </button>
        </div>
      </Modal>

      <style>{`
        .hr-refreshing { opacity: 0.55; transition: opacity 0.15s; }
        .hr-company { color: #e5e7eb; font-size: 0.82rem; font-weight: 600; }
        .hr-muted { color: #858a90 !important; font-size: 0.76rem; }
        .hr-dash { color: #4b5056; }
        .hr-status { text-transform: capitalize; }
        .hr-del:hover { border-color: rgba(251,95,103,0.55) !important; color: #fb737a !important; }
        .hr-req { color: #ff7a00; }
        .hr-pass { position: relative; }
        .hr-pass .aui-input { padding-right: 2.6rem; }
        .hr-pass button { position: absolute; top: 0; right: 0; display: grid; place-items: center; width: 40px; height: 40px; border: 0; background: none; color: #6b7280; cursor: pointer; }
        .hr-pass button:hover { color: #fff; }
        .hr-info { margin: 0.25rem 0 0 !important; font-size: 0.78rem; }
        .hr-del-icon { display: grid; place-items: center; width: 36px; height: 36px; flex: 0 0 36px; border: 1px solid rgba(251,95,103,0.3); border-radius: 10px; background: rgba(251,95,103,0.1); color: #fb737a; }
        .hr-modal-text { margin: 0; color: #a6abb0; font-size: 0.84rem; line-height: 1.6; }
      `}</style>
    </AdminPage>
  )
}

export default HRManager
