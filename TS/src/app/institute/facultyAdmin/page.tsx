import React, { useEffect, useState, useCallback } from 'react'
import { useAuthContext } from '@/context/useAuthContext'
import PageMetaData from '@/components/PageMetaData'

/* ─── Types ──────────────────────────────────────────────── */
interface FacultyAdmin {
  _id: string
  name: string
  email: string
  status: string
  assignedStudentIds: string[]
  assignedCount: number
  createdAt: string
}

interface StudentProfile {
  _id: string
  fullName: string
  email: string
  department: string | null
  joiningYear: string | null
  branch: string | null
  profileImage?: string
  assessmentScores?: {
    quizScore: number
    codeChallengeScore: number
    technicalRoundScore: number
    hrRoundScore: number
  }
}

/* ─── Dept options matching backend enum ─────────────────── */
const DEPARTMENTS = [
  'Computer Science and Engineering',
  'Electronics and Communication Engineering',
  'Electrical and Electronics Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Information Technology',
  'Artificial Intelligence and Machine Learning',
  'Data Science',
  'Internet of Things',
  'Biomedical Engineering',
  'Chemical Engineering',
  'Master of Computer Applications',
  'Bachelor of Technology',
]

const YEARS = ['2020', '2021', '2022', '2023', '2024', '2025', '2026', '2027']

/* ─── Styles ─────────────────────────────────────────────── */
const S: Record<string, React.CSSProperties> = {
  page: {
    background: '#0d0d0d',
    minHeight: '100vh',
    color: '#e8e8e8',
    padding: '2rem 1.5rem',
    fontFamily: 'inherit',
  },
  header: {
    marginBottom: '2rem',
  },
  title: {
    fontSize: '1.6rem',
    fontWeight: 700,
    color: '#fff',
    margin: 0,
  },
  subtitle: {
    color: '#666',
    fontSize: '0.85rem',
    marginTop: '0.3rem',
  },
  accentBtn: {
    background: '#ff7a00',
    border: 'none',
    color: '#fff',
    fontWeight: 600,
    borderRadius: '8px',
    padding: '0.55rem 1.2rem',
    fontSize: '0.85rem',
    cursor: 'pointer',
    transition: 'opacity 0.15s',
  },
  outlineBtn: {
    background: 'transparent',
    border: '1px solid #333',
    color: '#bbb',
    fontWeight: 500,
    borderRadius: '8px',
    padding: '0.5rem 1rem',
    fontSize: '0.82rem',
    cursor: 'pointer',
  },
  dangerBtn: {
    background: 'transparent',
    border: '1px solid #c0392b',
    color: '#e74c3c',
    fontWeight: 500,
    borderRadius: '8px',
    padding: '0.4rem 0.8rem',
    fontSize: '0.8rem',
    cursor: 'pointer',
  },
  card: {
    background: '#141414',
    border: '1px solid #1f1f1f',
    borderRadius: '14px',
    padding: '1.4rem',
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1.2rem',
    marginTop: '1.5rem',
  },
  adminCard: {
    background: '#141414',
    border: '1px solid #1f1f1f',
    borderRadius: '14px',
    padding: '1.4rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.8rem',
  },
  avatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #ff7a00, #ff4500)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '1.1rem',
    color: '#fff',
    flexShrink: 0,
  },
  badge: {
    display: 'inline-block',
    background: 'rgba(255,122,0,0.15)',
    color: '#ff7a00',
    border: '1px solid rgba(255,122,0,0.3)',
    borderRadius: '20px',
    padding: '0.2rem 0.65rem',
    fontSize: '0.75rem',
    fontWeight: 600,
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
    marginBottom: '1rem',
  },
  label: {
    fontSize: '0.8rem',
    color: '#888',
    fontWeight: 500,
  },
  input: {
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '8px',
    color: '#e8e8e8',
    padding: '0.6rem 0.9rem',
    fontSize: '0.85rem',
    width: '100%',
    outline: 'none',
  },
  select: {
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '8px',
    color: '#e8e8e8',
    padding: '0.6rem 0.9rem',
    fontSize: '0.85rem',
    width: '100%',
    outline: 'none',
  },
  divider: {
    border: 'none',
    borderTop: '1px solid #1f1f1f',
    margin: '1.5rem 0',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '1rem',
  },
  modal: {
    background: '#141414',
    border: '1px solid #2a2a2a',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '680px',
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  modalHeader: {
    padding: '1.25rem 1.5rem',
    borderBottom: '1px solid #1f1f1f',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalBody: {
    padding: '1.25rem 1.5rem',
    overflowY: 'auto',
    flex: 1,
  },
  modalFooter: {
    padding: '1rem 1.5rem',
    borderTop: '1px solid #1f1f1f',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  statCard: {
    background: '#141414',
    border: '1px solid #1f1f1f',
    borderRadius: '12px',
    padding: '1.2rem 1.4rem',
  },
  statValue: {
    fontSize: '2rem',
    fontWeight: 700,
    color: '#ff7a00',
    lineHeight: 1,
  },
  statLabel: {
    fontSize: '0.78rem',
    color: '#666',
    marginTop: '0.4rem',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '0.83rem',
  },
  th: {
    background: '#1a1a1a',
    color: '#666',
    fontWeight: 600,
    padding: '0.65rem 0.9rem',
    textAlign: 'left' as const,
    borderBottom: '1px solid #1f1f1f',
    whiteSpace: 'nowrap' as const,
  },
  td: {
    padding: '0.75rem 0.9rem',
    borderBottom: '1px solid #1a1a1a',
    color: '#ccc',
    verticalAlign: 'middle' as const,
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '3rem 1rem',
    color: '#444',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
    accentColor: '#ff7a00',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#666',
    cursor: 'pointer',
    fontSize: '1.3rem',
    lineHeight: 1,
    padding: '0.2rem',
  },
  errorMsg: {
    background: 'rgba(231,76,60,0.1)',
    border: '1px solid rgba(231,76,60,0.3)',
    color: '#e74c3c',
    borderRadius: '8px',
    padding: '0.7rem 1rem',
    fontSize: '0.82rem',
    marginBottom: '1rem',
  },
  successMsg: {
    background: 'rgba(39,174,96,0.1)',
    border: '1px solid rgba(39,174,96,0.3)',
    color: '#27ae60',
    borderRadius: '8px',
    padding: '0.7rem 1rem',
    fontSize: '0.82rem',
    marginBottom: '1rem',
  },
}

/* ─── Helper: initials ───────────────────────────────────── */
function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

/* ─── Score helper ───────────────────────────────────────── */
function totalScore(s?: StudentProfile['assessmentScores']): number {
  if (!s) return 0
  return (s.quizScore ?? 0) + (s.codeChallengeScore ?? 0) + (s.technicalRoundScore ?? 0) + (s.hrRoundScore ?? 0)
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
═══════════════════════════════════════════════════════════ */
export default function FacultyAdminPage() {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL

  if (!user) return null

  if (user.role === 'facultyAdmin') {
    return <FacultyAdminDashboard user={user} baseURL={baseURL} />
  }

  return <InstituteAdminManagement user={user} baseURL={baseURL} />
}

/* ═══════════════════════════════════════════════════════════
   INSTITUTE ADMIN — MANAGEMENT VIEW
═══════════════════════════════════════════════════════════ */
function InstituteAdminManagement({ user, baseURL }: { user: any; baseURL: string }) {
  const [admins, setAdmins] = useState<FacultyAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Create form state
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', phoneNo: '' })
  const [formError, setFormError] = useState('')

  // Assign modal state
  const [assignModal, setAssignModal] = useState<FacultyAdmin | null>(null)

  const authHeaders = { Authorization: `Bearer ${user?.token}` }

  const fetchAdmins = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${baseURL}/faculty-admin`, { headers: authHeaders })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to load')
      setAdmins(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [baseURL, user?.token])

  useEffect(() => {
    if (user?.token) fetchAdmins()
  }, [fetchAdmins])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setFormError('Name, email and password are required.')
      return
    }
    setCreating(true)
    try {
      const res = await fetch(`${baseURL}/faculty-admin/create`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to create')
      setSuccess(`Faculty admin "${data.name}" created successfully.`)
      setForm({ name: '', email: '', password: '', phoneNo: '' })
      setShowCreateForm(false)
      fetchAdmins()
      setTimeout(() => setSuccess(''), 4000)
    } catch (err: any) {
      setFormError(err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (admin: FacultyAdmin) => {
    if (!window.confirm(`Delete faculty admin "${admin.name}"? This cannot be undone.`)) return
    try {
      const res = await fetch(`${baseURL}/faculty-admin/${admin._id}`, {
        method: 'DELETE',
        headers: authHeaders,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to delete')
      setSuccess(`"${admin.name}" deleted.`)
      fetchAdmins()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message)
      setTimeout(() => setError(''), 3000)
    }
  }

  return (
    <div style={S.page}>
      <PageMetaData title="Faculty Admin Management" />

      {/* Header */}
      <div style={{ ...S.header, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={S.title}>Faculty Admin Management</h1>
          <p style={S.subtitle}>Create and manage faculty admins — up to 5 per institute. Assign students for tracking.</p>
        </div>
        {admins.length < 5 && (
          <button
            style={S.accentBtn}
            onClick={() => { setShowCreateForm((v) => !v); setFormError('') }}
          >
            {showCreateForm ? '✕ Cancel' : '+ Add Faculty Admin'}
          </button>
        )}
      </div>

      {/* Global messages */}
      {error && <div style={S.errorMsg}>{error}</div>}
      {success && <div style={S.successMsg}>{success}</div>}

      {/* Create Form */}
      {showCreateForm && (
        <div style={{ ...S.card, marginBottom: '1.5rem' }}>
          <h3 style={{ color: '#fff', fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem' }}>
            New Faculty Admin
          </h3>
          {formError && <div style={S.errorMsg}>{formError}</div>}
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={S.inputGroup}>
                <label style={S.label}>Full Name *</label>
                <input
                  style={S.input}
                  type="text"
                  placeholder="Dr. Jane Smith"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div style={S.inputGroup}>
                <label style={S.label}>Email Address *</label>
                <input
                  style={S.input}
                  type="email"
                  placeholder="jane@college.edu"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div style={S.inputGroup}>
                <label style={S.label}>Password *</label>
                <input
                  style={S.input}
                  type="password"
                  placeholder="Min 8 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
              <div style={S.inputGroup}>
                <label style={S.label}>Phone Number</label>
                <input
                  style={S.input}
                  type="text"
                  placeholder="+91 9876543210"
                  value={form.phoneNo}
                  onChange={(e) => setForm({ ...form, phoneNo: e.target.value })}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="submit" style={S.accentBtn} disabled={creating}>
                {creating ? 'Creating…' : 'Create Faculty Admin'}
              </button>
              <button
                type="button"
                style={S.outlineBtn}
                onClick={() => { setShowCreateForm(false); setFormError('') }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Admins count badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
        <span style={{ color: '#666', fontSize: '0.82rem' }}>
          {admins.length} / 5 faculty admins
        </span>
        <div style={{ flex: 1, height: '4px', borderRadius: '4px', background: '#1f1f1f', overflow: 'hidden' }}>
          <div style={{ width: `${(admins.length / 5) * 100}%`, height: '100%', background: '#ff7a00', borderRadius: '4px', transition: 'width 0.3s' }} />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ ...S.emptyState }}>
          <div style={{ color: '#444', fontSize: '0.9rem' }}>Loading…</div>
        </div>
      )}

      {/* Empty state */}
      {!loading && admins.length === 0 && (
        <div style={S.emptyState}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>👨‍🏫</div>
          <div style={{ color: '#555', fontSize: '0.9rem' }}>No faculty admins yet. Create the first one above.</div>
        </div>
      )}

      {/* Admin Cards Grid */}
      {!loading && admins.length > 0 && (
        <div style={S.cardGrid}>
          {admins.map((admin) => (
            <AdminCard
              key={admin._id}
              admin={admin}
              onDelete={() => handleDelete(admin)}
              onAssign={() => setAssignModal(admin)}
            />
          ))}
        </div>
      )}

      {/* Assign Modal */}
      {assignModal && (
        <AssignStudentsModal
          admin={assignModal}
          baseURL={baseURL}
          authHeaders={authHeaders}
          onClose={() => setAssignModal(null)}
          onSaved={() => { fetchAdmins(); setAssignModal(null) }}
        />
      )}
    </div>
  )
}

/* ─── Admin Card ─────────────────────────────────────────── */
function AdminCard({
  admin,
  onDelete,
  onAssign,
}: {
  admin: FacultyAdmin
  onDelete: () => void
  onAssign: () => void
}) {
  return (
    <div style={S.adminCard}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <div style={S.avatar}>{initials(admin.name)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {admin.name}
          </div>
          <div style={{ color: '#666', fontSize: '0.77rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {admin.email}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
        <span style={S.badge}>{admin.assignedCount} student{admin.assignedCount !== 1 ? 's' : ''}</span>
        <span style={{
          ...S.badge,
          background: admin.status === 'approved' ? 'rgba(39,174,96,0.12)' : 'rgba(255,193,7,0.12)',
          color: admin.status === 'approved' ? '#27ae60' : '#f39c12',
          border: `1px solid ${admin.status === 'approved' ? 'rgba(39,174,96,0.3)' : 'rgba(255,193,7,0.3)'}`,
        }}>
          {admin.status}
        </span>
      </div>

      <div style={{ color: '#444', fontSize: '0.74rem' }}>
        Added {new Date(admin.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
      </div>

      <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.25rem' }}>
        <button style={{ ...S.accentBtn, flex: 1 }} onClick={onAssign}>
          Assign Students
        </button>
        <button style={S.dangerBtn} onClick={onDelete} title="Delete faculty admin">
          🗑
        </button>
      </div>
    </div>
  )
}

/* ─── Assign Students Modal ──────────────────────────────── */
function AssignStudentsModal({
  admin,
  baseURL,
  authHeaders,
  onClose,
  onSaved,
}: {
  admin: FacultyAdmin
  baseURL: string
  authHeaders: Record<string, string>
  onClose: () => void
  onSaved: () => void
}) {
  const [students, setStudents] = useState<StudentProfile[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set(admin.assignedStudentIds || []))
  const [filterDept, setFilterDept] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [saving, setSaving] = useState(false)
  const [fetchError, setFetchError] = useState('')
  const [saveMsg, setSaveMsg] = useState('')

  const loadStudents = async () => {
    setFetchError('')
    setLoadingStudents(true)
    try {
      const params = new URLSearchParams()
      if (filterDept) params.set('department', filterDept)
      if (filterYear) params.set('year', filterYear)
      const res = await fetch(`${baseURL}/faculty-admin/students/list?${params.toString()}`, { headers: authHeaders })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to load students')
      setStudents(data)
    } catch (err: any) {
      setFetchError(err.message)
    } finally {
      setLoadingStudents(false)
    }
  }

  const toggleStudent = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (students.length === 0) return
    const allIds = students.map((s) => s._id)
    const allSelected = allIds.every((id) => selected.has(id))
    setSelected((prev) => {
      const next = new Set(prev)
      if (allSelected) allIds.forEach((id) => next.delete(id))
      else allIds.forEach((id) => next.add(id))
      return next
    })
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveMsg('')
    try {
      const res = await fetch(`${baseURL}/faculty-admin/${admin._id}/assign-students`, {
        method: 'PUT',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentProfileIds: Array.from(selected) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to save')
      setSaveMsg(`Saved — ${data.count} student${data.count !== 1 ? 's' : ''} assigned.`)
      setTimeout(() => { onSaved() }, 1200)
    } catch (err: any) {
      setSaveMsg(`Error: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const allCurrentSelected = students.length > 0 && students.every((s) => selected.has(s._id))

  return (
    <div style={S.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={S.modal}>
        {/* Header */}
        <div style={S.modalHeader}>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>Assign Students</div>
            <div style={{ color: '#555', fontSize: '0.78rem', marginTop: '0.2rem' }}>
              to <span style={{ color: '#ff7a00' }}>{admin.name}</span>
            </div>
          </div>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <div style={S.modalBody}>
          {/* Filters */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.75rem', marginBottom: '1rem', alignItems: 'flex-end' }}>
            <div>
              <label style={{ ...S.label, display: 'block', marginBottom: '0.3rem' }}>Department</label>
              <select style={S.select} value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
                <option value="">All Departments</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={{ ...S.label, display: 'block', marginBottom: '0.3rem' }}>Joining Year</label>
              <select style={S.select} value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
                <option value="">All Years</option>
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <button style={{ ...S.accentBtn, whiteSpace: 'nowrap' }} onClick={loadStudents}>
              Load Students
            </button>
          </div>

          {fetchError && <div style={S.errorMsg}>{fetchError}</div>}
          {saveMsg && (
            <div style={saveMsg.startsWith('Error') ? S.errorMsg : S.successMsg}>{saveMsg}</div>
          )}

          {/* Selected count */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ color: '#666', fontSize: '0.8rem' }}>
              {students.length > 0 ? `${students.length} student${students.length !== 1 ? 's' : ''} shown` : 'No students loaded yet'}
            </span>
            <span style={S.badge}>{selected.size} selected</span>
          </div>

          {/* Student list */}
          {loadingStudents ? (
            <div style={{ color: '#444', textAlign: 'center', padding: '2rem' }}>Loading students…</div>
          ) : students.length > 0 ? (
            <div style={{ border: '1px solid #1f1f1f', borderRadius: '8px', overflow: 'hidden' }}>
              {/* Select All row */}
              <div
                style={{ background: '#1a1a1a', padding: '0.6rem 0.9rem', display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', borderBottom: '1px solid #1f1f1f' }}
                onClick={toggleAll}
              >
                <input
                  type="checkbox"
                  style={S.checkbox}
                  checked={allCurrentSelected}
                  onChange={toggleAll}
                  onClick={(e) => e.stopPropagation()}
                />
                <span style={{ color: '#888', fontSize: '0.78rem', fontWeight: 600 }}>Select All ({students.length})</span>
              </div>

              {/* Rows */}
              <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                {students.map((student) => (
                  <div
                    key={student._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.7rem 0.9rem',
                      borderBottom: '1px solid #1a1a1a',
                      cursor: 'pointer',
                      background: selected.has(student._id) ? 'rgba(255,122,0,0.05)' : 'transparent',
                      transition: 'background 0.1s',
                    }}
                    onClick={() => toggleStudent(student._id)}
                  >
                    <input
                      type="checkbox"
                      style={S.checkbox}
                      checked={selected.has(student._id)}
                      onChange={() => toggleStudent(student._id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: '#ddd', fontSize: '0.85rem', fontWeight: 500 }}>{student.fullName}</div>
                      <div style={{ color: '#555', fontSize: '0.75rem' }}>{student.email}</div>
                    </div>
                    <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
                      <div style={{ color: '#666', fontSize: '0.74rem' }}>{student.department?.split(' ')[0] ?? '—'}</div>
                      <div style={{ color: '#444', fontSize: '0.72rem' }}>{student.joiningYear ?? '—'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ ...S.emptyState, padding: '1.5rem' }}>
              <div style={{ fontSize: '0.82rem' }}>Use filters above and click "Load Students" to see available students.</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={S.modalFooter}>
          <button style={S.outlineBtn} onClick={onClose}>Cancel</button>
          <button style={S.accentBtn} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : `Save Assignments (${selected.size})`}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   FACULTY ADMIN — DASHBOARD VIEW
═══════════════════════════════════════════════════════════ */
function FacultyAdminDashboard({ user, baseURL }: { user: any; baseURL: string }) {
  const [students, setStudents] = useState<StudentProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const authHeaders = { Authorization: `Bearer ${user?.token}` }

  useEffect(() => {
    if (!user?.token) return
    ;(async () => {
      try {
        const res = await fetch(`${baseURL}/faculty-admin/my-students`, { headers: authHeaders })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Failed to load students')
        setStudents(Array.isArray(data) ? data : [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [user?.token])

  const filtered = students.filter(
    (s) =>
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      (s.department ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const avgScore =
    students.length > 0
      ? Math.round(students.reduce((acc, s) => acc + totalScore(s.assessmentScores), 0) / students.length)
      : 0

  const maxScore = 400 // quiz(100) + code(100) + tr(100) + hr(100)

  return (
    <div style={S.page}>
      <PageMetaData title="My Assigned Students" />

      {/* Header */}
      <div style={{ ...S.header }}>
        <h1 style={S.title}>My Assigned Students</h1>
        <p style={S.subtitle}>Track the assessment progress of students assigned to you.</p>
      </div>

      {error && <div style={S.errorMsg}>{error}</div>}

      {/* Stats */}
      <div style={S.statsRow}>
        <div style={S.statCard}>
          <div style={S.statValue}>{students.length}</div>
          <div style={S.statLabel}>Total Students</div>
        </div>
        <div style={S.statCard}>
          <div style={S.statValue}>{avgScore}</div>
          <div style={S.statLabel}>Avg Total Score</div>
        </div>
        <div style={S.statCard}>
          <div style={{ ...S.statValue, color: '#27ae60' }}>
            {students.filter((s) => totalScore(s.assessmentScores) > 0).length}
          </div>
          <div style={S.statLabel}>Attempted Assessment</div>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '1rem' }}>
        <input
          style={{ ...S.input, maxWidth: '340px' }}
          type="text"
          placeholder="Search by name, email, or department…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div style={S.emptyState}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={S.emptyState}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
          <div>{students.length === 0 ? 'No students have been assigned to you yet.' : 'No students match your search.'}</div>
        </div>
      ) : (
        <div style={{ ...S.card, padding: 0, overflowX: 'auto' }}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>#</th>
                <th style={S.th}>Student</th>
                <th style={S.th}>Department</th>
                <th style={S.th}>Year</th>
                <th style={{ ...S.th, textAlign: 'center' as const }}>Quiz</th>
                <th style={{ ...S.th, textAlign: 'center' as const }}>Code</th>
                <th style={{ ...S.th, textAlign: 'center' as const }}>TR</th>
                <th style={{ ...S.th, textAlign: 'center' as const }}>HR</th>
                <th style={{ ...S.th, textAlign: 'center' as const, color: '#ff7a00' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((student, idx) => {
                const sc = student.assessmentScores
                const total = totalScore(sc)
                return (
                  <tr key={student._id} style={{ transition: 'background 0.1s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#181818')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ ...S.td, color: '#444', fontSize: '0.75rem' }}>{idx + 1}</td>
                    <td style={S.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{ ...S.avatar, width: '32px', height: '32px', fontSize: '0.75rem' }}>
                          {initials(student.fullName)}
                        </div>
                        <div>
                          <div style={{ color: '#ddd', fontWeight: 500, fontSize: '0.84rem' }}>{student.fullName}</div>
                          <div style={{ color: '#555', fontSize: '0.73rem' }}>{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ ...S.td, fontSize: '0.78rem', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {student.department ?? '—'}
                    </td>
                    <td style={S.td}>{student.joiningYear ?? '—'}</td>
                    <td style={{ ...S.td, textAlign: 'center' as const }}>{sc?.quizScore ?? 0}</td>
                    <td style={{ ...S.td, textAlign: 'center' as const }}>{sc?.codeChallengeScore ?? 0}</td>
                    <td style={{ ...S.td, textAlign: 'center' as const }}>{sc?.technicalRoundScore ?? 0}</td>
                    <td style={{ ...S.td, textAlign: 'center' as const }}>{sc?.hrRoundScore ?? 0}</td>
                    <td style={{ ...S.td, textAlign: 'center' as const }}>
                      <span style={{
                        fontWeight: 700,
                        color: total >= maxScore * 0.7 ? '#27ae60' : total >= maxScore * 0.4 ? '#ff7a00' : '#e74c3c',
                        fontSize: '0.9rem',
                      }}>
                        {total}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
