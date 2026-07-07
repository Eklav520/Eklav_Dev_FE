import React, { useEffect, useState, useCallback } from 'react'
import { useAuthContext } from '@/context/useAuthContext'
import PageMetaData from '@/components/PageMetaData'
import ReactApexChart from 'react-apexcharts'
import { Col, Modal, Row } from 'react-bootstrap'
import { FaBookOpen, FaChartBar, FaLanguage, FaRobot, FaClipboardList, FaFileAlt } from 'react-icons/fa'
import DailyTimePerformers from '@/components/dashboard/DailyTimePerformers'
import DailyEngagement from '@/components/dashboard/DailyEngagement'
import CourseEnrollmentTrend from '@/components/dashboard/CourseEnrollmentTrend'
import CourseEnrollmentFull from '@/components/dashboard/CourseEnrollmentFull'
import EnglishPracticeWidget from '@/components/dashboard/EnglishPracticeWidget'
import EnglishPracticeFull from '@/components/dashboard/EnglishPracticeFull'
import AIInterviewWidget from '@/components/dashboard/AIInterviewWidget'
import AIInterviewFull from '@/components/dashboard/AIInterviewFull'
import AssessmentWidget from '@/components/dashboard/AssessmentWidget'
import AssessmentFull from '@/components/dashboard/AssessmentFull'
import StudentReports from '@/components/dashboard/StudentReports'

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
  assignedTo?: { id: string; name: string } | null
  assessmentScores?: {
    quizScore: number
    codeChallengeScore: number
    technicalRoundScore: number
    hrRoundScore: number
  }
}

interface ConflictInfo {
  facultyAdminId: string
  facultyAdminName: string
  studentIds: string[]
}


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
    background: 'rgba(0,0,0,0.85)',
    display: 'flex',
    alignItems: 'stretch',
    justifyContent: 'center',
    zIndex: 9999,
    padding: 0,
  },
  modal: {
    background: '#0f0f0f',
    border: 'none',
    borderRadius: 0,
    width: '100%',
    maxWidth: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  modalHeader: {
    padding: '1rem 1.5rem',
    borderBottom: '1px solid #1a1a1a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#141414',
    flexShrink: 0,
  },
  modalBody: {
    padding: '1.25rem 1.5rem',
    overflowY: 'auto',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  modalFooter: {
    padding: '1rem 1.5rem',
    borderTop: '1px solid #1a1a1a',
    background: '#141414',
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '0.75rem',
    flexShrink: 0,
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
  const [viewModal, setViewModal] = useState<FacultyAdmin | null>(null)

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
          <p style={S.subtitle}>Create and manage faculty admins. Assign students and track their progress.</p>
        </div>
        <button
          style={S.accentBtn}
          onClick={() => { setShowCreateForm((v) => !v); setFormError('') }}
        >
          {showCreateForm ? '✕ Cancel' : '+ Add Faculty Admin'}
        </button>
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

      {/* Admins count */}
      <div style={{ marginBottom: '0.75rem' }}>
        <span style={{ color: '#555', fontSize: '0.82rem' }}>{admins.length} faculty admin{admins.length !== 1 ? 's' : ''}</span>
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
              onView={() => setViewModal(admin)}
            />
          ))}
        </div>
      )}

      {/* Progress Overview Charts */}
      {!loading && admins.length > 0 && (
        <FacultyProgressCharts baseURL={baseURL} authHeaders={authHeaders} refreshKey={admins.length} />
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

      {/* View Students Modal */}
      {viewModal && (
        <ViewStudentsModal
          admin={viewModal}
          baseURL={baseURL}
          authHeaders={authHeaders}
          onClose={() => setViewModal(null)}
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
  onView,
}: {
  admin: FacultyAdmin
  onDelete: () => void
  onAssign: () => void
  onView: () => void
}) {
  return (
    <div style={S.adminCard}>
      {/* Top row: avatar + info */}
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

      {/* Badges */}
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

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
        <button style={{ ...S.accentBtn, flex: 1, fontSize: '0.8rem', padding: '0.45rem 0.75rem' }} onClick={onAssign}>
          Assign Students
        </button>
        <button
          style={{
            background: 'rgba(59,130,246,0.12)',
            border: '1px solid rgba(59,130,246,0.35)',
            color: '#60a5fa',
            borderRadius: '8px',
            padding: '0.45rem 0.9rem',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s',
            whiteSpace: 'nowrap' as const,
          }}
          onClick={onView}
        >
          View
        </button>
        <button
          style={{
            background: 'rgba(220,53,69,0.1)',
            border: '1px solid rgba(220,53,69,0.35)',
            color: '#f87171',
            borderRadius: '8px',
            padding: '0.45rem 0.75rem',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onClick={onDelete}
          title="Delete faculty admin"
        >
          Delete
        </button>
      </div>
    </div>
  )
}

/* ─── View Assigned Students Modal ───────────────────────── */
function ViewStudentsModal({
  admin,
  baseURL,
  authHeaders,
  onClose,
}: {
  admin: FacultyAdmin
  baseURL: string
  authHeaders: Record<string, string>
  onClose: () => void
}) {
  const [students, setStudents] = useState<StudentProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch(`${baseURL}/faculty-admin/${admin._id}/students`, { headers: authHeaders })
        const data = await res.json()
        setStudents(Array.isArray(data) ? data : [])
      } catch { }
      finally { setLoading(false) }
    })()
  }, [admin._id])

  const filtered = students.filter(s =>
    s.fullName.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={S.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={S.modal}>
        {/* Header */}
        <div style={S.modalHeader}>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>
              Assigned Students
            </div>
            <div style={{ color: '#555', fontSize: '0.78rem', marginTop: '0.2rem' }}>
              <span style={{ color: '#ff7a00' }}>{admin.name}</span> · {students.length} student{students.length !== 1 ? 's' : ''}
            </div>
          </div>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Search */}
        <div style={{ padding: '0.85rem 1.5rem', borderBottom: '1px solid #1a1a1a', background: '#111' }}>
          <input
            style={{ ...S.input, maxWidth: '320px', fontSize: '0.82rem', padding: '0.5rem 0.85rem' }}
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {loading ? (
            <div style={{ ...S.emptyState, color: '#555' }}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div style={S.emptyState}>
              <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>👥</div>
              <div style={{ fontSize: '0.85rem' }}>
                {students.length === 0 ? 'No students assigned yet.' : 'No students match your search.'}
              </div>
            </div>
          ) : (
            <table style={{ ...S.table }}>
              <thead>
                <tr>
                  <th style={S.th}>#</th>
                  <th style={S.th}>Student</th>
                  <th style={S.th}>Email</th>
                  <th style={S.th}>Branch</th>
                  <th style={S.th}>Joined Year</th>
                  <th style={{ ...S.th, textAlign: 'center' as const }}>Quiz</th>
                  <th style={{ ...S.th, textAlign: 'center' as const }}>Code</th>
                  <th style={{ ...S.th, textAlign: 'center' as const }}>TR</th>
                  <th style={{ ...S.th, textAlign: 'center' as const }}>HR</th>
                  <th style={{ ...S.th, textAlign: 'center' as const, color: '#ff7a00' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, idx) => {
                  const sc = s.assessmentScores
                  const total = (sc?.quizScore ?? 0) + (sc?.codeChallengeScore ?? 0) + (sc?.technicalRoundScore ?? 0) + (sc?.hrRoundScore ?? 0)
                  return (
                    <tr
                      key={s._id}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#181818')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ ...S.td, color: '#444', fontSize: '0.75rem' }}>{idx + 1}</td>
                      <td style={S.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div style={{ ...S.avatar, width: '32px', height: '32px', fontSize: '0.75rem', flexShrink: 0 }}>
                            {initials(s.fullName)}
                          </div>
                          <span style={{ color: '#ddd', fontWeight: 500, fontSize: '0.84rem' }}>{s.fullName}</span>
                        </div>
                      </td>
                      <td style={{ ...S.td, color: '#666', fontSize: '0.8rem' }}>{s.email}</td>
                      <td style={{ ...S.td, color: '#888', fontSize: '0.8rem' }}>{s.branch ?? s.department ?? '—'}</td>
                      <td style={{ ...S.td, color: '#888', fontSize: '0.8rem' }}>{s.joiningYear ?? '—'}</td>
                      <td style={{ ...S.td, textAlign: 'center' as const }}>{sc?.quizScore ?? 0}</td>
                      <td style={{ ...S.td, textAlign: 'center' as const }}>{sc?.codeChallengeScore ?? 0}</td>
                      <td style={{ ...S.td, textAlign: 'center' as const }}>{sc?.technicalRoundScore ?? 0}</td>
                      <td style={{ ...S.td, textAlign: 'center' as const }}>{sc?.hrRoundScore ?? 0}</td>
                      <td style={{ ...S.td, textAlign: 'center' as const }}>
                        <span style={{
                          fontWeight: 700,
                          color: total >= 280 ? '#27ae60' : total >= 120 ? '#ff7a00' : '#e74c3c',
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
          )}
        </div>

        {/* Footer */}
        <div style={{ ...S.modalFooter, justifyContent: 'flex-start' }}>
          <span style={{ color: '#555', fontSize: '0.82rem' }}>
            {filtered.length} of {students.length} students shown
          </span>
          <button style={{ ...S.outlineBtn, marginLeft: 'auto' }} onClick={onClose}>Close</button>
        </div>
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
  const [conflicts, setConflicts] = useState<ConflictInfo[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [years, setYears] = useState<string[]>([])

  // Load filter options from DB on mount
  useEffect(() => {
    fetch(`${baseURL}/faculty-admin/students/meta`, { headers: authHeaders })
      .then((r) => r.json())
      .then((data) => {
        if (data.departments) setDepartments(data.departments)
        if (data.years) setYears(data.years)
      })
      .catch(() => {})
  }, [])

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

  const doSave = async (force = false) => {
    setSaving(true)
    setSaveMsg('')
    try {
      const res = await fetch(`${baseURL}/faculty-admin/${admin._id}/assign-students`, {
        method: 'PUT',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentProfileIds: Array.from(selected), force }),
      })
      const data = await res.json()
      if (res.status === 409 && data.conflicts) {
        setConflicts(data.conflicts)
        return
      }
      if (!res.ok) throw new Error(data.message || 'Failed to save')
      setSaveMsg(`Saved — ${data.count} student${data.count !== 1 ? 's' : ''} assigned.`)
      setTimeout(() => { onSaved() }, 1200)
    } catch (err: any) {
      setSaveMsg(`Error: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleSave = () => doSave(false)
  const handleForceConfirm = () => { setConflicts([]); doSave(true) }

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
              <label style={{ ...S.label, display: 'block', marginBottom: '0.3rem' }}>Branch / Department</label>
              <select style={S.select} value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
                <option value="">All Branches</option>
                {departments.map((d: string) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={{ ...S.label, display: 'block', marginBottom: '0.3rem' }}>Joining Year</label>
              <select style={S.select} value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
                <option value="">All Years</option>
                {years.map((y: string) => <option key={y} value={y}>{y}</option>)}
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

          {/* Conflict confirmation dialog */}
          {conflicts.length > 0 && (
            <div style={{
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.4)',
              borderRadius: '10px',
              padding: '1rem 1.1rem',
            }}>
              <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.6rem' }}>
                ⚠ Student Assignment Conflict
              </div>
              <div style={{ color: '#d1a634', fontSize: '0.82rem', marginBottom: '0.75rem', lineHeight: 1.6 }}>
                The following students are already assigned to another faculty admin. Confirming will move them to <strong>{admin.name}</strong>:
              </div>
              {conflicts.map((c) => (
                <div key={c.facultyAdminId} style={{ marginBottom: '0.4rem' }}>
                  <span style={{ color: '#888', fontSize: '0.78rem' }}>
                    Currently with <strong style={{ color: '#f59e0b' }}>{c.facultyAdminName}</strong>: {c.studentIds.length} student{c.studentIds.length !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
              <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.85rem' }}>
                <button
                  style={{
                    background: '#f59e0b', border: 'none', color: '#000',
                    fontWeight: 700, borderRadius: '7px', padding: '0.45rem 1rem',
                    fontSize: '0.82rem', cursor: 'pointer',
                  }}
                  onClick={handleForceConfirm}
                  disabled={saving}
                >
                  {saving ? 'Moving…' : 'Yes, Move to Me'}
                </button>
                <button
                  style={{ ...S.outlineBtn, fontSize: '0.82rem', padding: '0.45rem 0.9rem' }}
                  onClick={() => setConflicts([])}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Selected count */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ color: '#666', fontSize: '0.8rem' }}>
              {students.length > 0 ? `${students.length} student${students.length !== 1 ? 's' : ''} shown` : 'No students loaded yet'}
            </span>
            <span style={S.badge}>{selected.size} selected</span>
          </div>

          {/* Student table */}
          {loadingStudents ? (
            <div style={{ color: '#555', textAlign: 'center', padding: '3rem' }}>Loading students…</div>
          ) : students.length > 0 ? (
            <div style={{ flex: 1, border: '1px solid #1f1f1f', borderRadius: '10px', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              {/* Table header with Select All */}
              <table style={{ ...S.table, display: 'table' }}>
                <thead>
                  <tr style={{ background: '#1a1a1a' }}>
                    <th style={{ ...S.th, width: '40px' }}>
                      <input
                        type="checkbox"
                        style={S.checkbox}
                        checked={allCurrentSelected}
                        onChange={toggleAll}
                      />
                    </th>
                    <th style={S.th}>Student</th>
                    <th style={S.th}>Email</th>
                    <th style={S.th}>Branch</th>
                    <th style={S.th}>Joined Year</th>
                    <th style={{ ...S.th, textAlign: 'center' as const }}>Quiz</th>
                    <th style={{ ...S.th, textAlign: 'center' as const }}>Code</th>
                    <th style={{ ...S.th, textAlign: 'center' as const }}>TR</th>
                    <th style={{ ...S.th, textAlign: 'center' as const }}>HR</th>
                  </tr>
                </thead>
              </table>
              {/* Scrollable body */}
              <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                <table style={{ ...S.table }}>
                  <tbody>
                    {students.map((student) => {
                      const sc = student.assessmentScores
                      const isSelected = selected.has(student._id)
                      return (
                        <tr
                          key={student._id}
                          style={{ background: isSelected ? 'rgba(255,122,0,0.07)' : 'transparent', cursor: 'pointer', transition: 'background 0.1s' }}
                          onClick={() => toggleStudent(student._id)}
                          onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#181818' }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = isSelected ? 'rgba(255,122,0,0.07)' : 'transparent' }}
                        >
                          <td style={{ ...S.td, width: '40px' }}>
                            <input
                              type="checkbox"
                              style={S.checkbox}
                              checked={isSelected}
                              onChange={() => toggleStudent(student._id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td style={S.td}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              <div style={{ ...S.avatar, width: '32px', height: '32px', fontSize: '0.75rem', flexShrink: 0 }}>
                                {initials(student.fullName)}
                              </div>
                              <div>
                                <span style={{ color: '#ddd', fontWeight: 500, fontSize: '0.85rem' }}>{student.fullName}</span>
                                {student.assignedTo && student.assignedTo.id !== admin._id && (
                                  <div style={{ fontSize: '0.68rem', color: '#f59e0b', marginTop: '2px' }}>
                                    ⚠ Assigned to {student.assignedTo.name}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td style={{ ...S.td, color: '#666', fontSize: '0.8rem' }}>{student.email}</td>
                          <td style={{ ...S.td, color: '#888', fontSize: '0.8rem' }}>{student.branch ?? student.department ?? '—'}</td>
                          <td style={{ ...S.td, color: '#888', fontSize: '0.8rem' }}>{student.joiningYear ?? '—'}</td>
                          <td style={{ ...S.td, textAlign: 'center' as const, color: '#666' }}>{sc?.quizScore ?? 0}</td>
                          <td style={{ ...S.td, textAlign: 'center' as const, color: '#666' }}>{sc?.codeChallengeScore ?? 0}</td>
                          <td style={{ ...S.td, textAlign: 'center' as const, color: '#666' }}>{sc?.technicalRoundScore ?? 0}</td>
                          <td style={{ ...S.td, textAlign: 'center' as const, color: '#666' }}>{sc?.hrRoundScore ?? 0}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div style={{ ...S.emptyState, flex: 1 }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>👥</div>
              <div style={{ fontSize: '0.85rem' }}>Select filters and click "Load Students"</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={S.modalFooter}>
          <span style={{ color: '#555', fontSize: '0.82rem', marginRight: 'auto' }}>
            {selected.size > 0 ? `${selected.size} student${selected.size !== 1 ? 's' : ''} selected` : 'No students selected'}
          </span>
          <button style={S.outlineBtn} onClick={onClose}>Cancel</button>
          <button style={S.accentBtn} onClick={handleSave} disabled={saving || selected.size === 0}>
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

const FACULTY_TABS = [
  { key: 'daily-engagement',  label: 'Daily Engagement',   icon: FaChartBar,      color: '#f59e0b' },
  { key: 'course-enrollment', label: 'Course Progress',    icon: FaBookOpen,      color: '#3b82f6' },
  { key: 'ai-interview',      label: 'AI Based Interview', icon: FaRobot,         color: '#a855f7' },
  { key: 'english-practice',  label: 'English Practice',   icon: FaLanguage,      color: '#22c55e' },
  { key: 'assessments',       label: 'Assessments',        icon: FaClipboardList, color: '#06b6d4' },
  { key: 'student-reports',   label: 'Student Reports',    icon: FaFileAlt,       color: '#ef4444' },
] as const

type FacultyTabKey   = (typeof FACULTY_TABS)[number]['key']
type FacultyModalKey = 'daily-engagement' | 'course-enrollment' | 'english-practice' | 'ai-interview' | 'assessments' | null

const DS = {
  page: {
    background: '#0d0d0d',
    minHeight: '100vh',
    color: '#fff',
    padding: '2rem 1.5rem',
  } as React.CSSProperties,
  tabStrip: {
    display: 'flex',
    marginTop: '1.75rem',
    borderBottom: '1px solid #1e1e1e',
    overflowX: 'auto' as const,
    gap: 0,
    scrollbarWidth: 'none' as const,
  } as React.CSSProperties,
  tabBtn: (active: boolean): React.CSSProperties => ({
    position: 'relative',
    background: 'none',
    border: 'none',
    padding: '0.7rem 0.5rem 0.85rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.45rem',
    flex: 1,
    fontSize: '0.83rem',
    fontWeight: active ? 700 : 500,
    color: active ? '#fff' : '#555',
    transition: 'color 0.18s',
  }),
  tabIndicator: (color: string): React.CSSProperties => ({
    position: 'absolute',
    bottom: 0,
    left: '10%',
    width: '80%',
    height: 2.5,
    borderRadius: 2,
    background: color,
  }),
  tabDot: (color: string): React.CSSProperties => ({
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: color,
    flexShrink: 0,
  }),
  content: {
    paddingTop: '1.75rem',
    minHeight: 380,
  } as React.CSSProperties,
  infoCard: {
    background: '#141414',
    border: '1px solid #222',
    borderRadius: 14,
    padding: '1.5rem',
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
  } as React.CSSProperties,
  iconBox: {
    width: 46, height: 46, borderRadius: 12,
    background: 'rgba(255,107,0,0.12)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: '1rem', flexShrink: 0,
  } as React.CSSProperties,
  infoTitle: { color: '#fff', fontWeight: 700, fontSize: '1rem', marginBottom: 2 } as React.CSSProperties,
  infoSub: { color: '#555', fontSize: '0.76rem', marginBottom: '1rem' } as React.CSSProperties,
  infoDesc: { color: '#888', fontSize: '0.81rem', lineHeight: 1.65, flex: 1, marginBottom: '1.25rem' } as React.CSSProperties,
  btn: {
    background: '#ff6b00', border: 'none', color: '#fff',
    fontWeight: 600, borderRadius: 8,
    padding: '9px 0', width: '100%', fontSize: '0.85rem', cursor: 'pointer',
  } as React.CSSProperties,
  modalHeader: {
    background: '#111', borderBottom: '1px solid #2a2a2a',
    color: '#fff', padding: '1.25rem 1.75rem',
  } as React.CSSProperties,
  modalBody: {
    background: '#0d0d0d', padding: '1.75rem',
  } as React.CSSProperties,
}

/* ─── Faculty Progress Charts ────────────────────────────── */
interface FacultyProgress {
  id: string
  name: string
  studentCount: number
  avgQuiz: number
  avgCode: number
  avgTR: number
  avgHR: number
  avgTotal: number
  students: { name: string; quiz: number; code: number; tr: number; hr: number; total: number }[]
}

function FacultyProgressCharts({
  baseURL,
  authHeaders,
  refreshKey,
}: {
  baseURL: string
  authHeaders: Record<string, string>
  refreshKey: number
}) {
  const [data, setData] = useState<FacultyProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<FacultyProgress | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`${baseURL}/faculty-admin/progress-overview`, { headers: authHeaders })
      .then(r => r.json())
      .then(d => { setData(Array.isArray(d) ? d : []); setSelected(null) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [refreshKey])

  if (loading) return (
    <div style={{ marginTop: '2rem', background: '#111', border: '1px solid #1a1a1a', borderRadius: '14px', padding: '2rem', textAlign: 'center', color: '#444' }}>
      Loading progress charts…
    </div>
  )

  const names = data.map(d => d.name)

  // Grouped bar chart: Quiz, Code, TR, HR averages per faculty admin
  const groupedOptions: ApexCharts.ApexOptions = {
    chart: { type: 'bar', background: 'transparent', toolbar: { show: false }, foreColor: '#666' },
    plotOptions: { bar: { horizontal: false, columnWidth: '55%', borderRadius: 4, borderRadiusApplication: 'end' } },
    colors: ['#3b82f6', '#a855f7', '#22c55e', '#f59e0b'],
    dataLabels: { enabled: false },
    xaxis: { categories: names, labels: { style: { colors: '#666', fontSize: '0.78rem' } } },
    yaxis: { labels: { style: { colors: '#555' } }, title: { text: 'Avg Score', style: { color: '#555' } } },
    legend: { position: 'top', labels: { colors: '#aaa' } },
    grid: { borderColor: '#1a1a1a' },
    tooltip: { theme: 'dark' },
  }

  const groupedSeries = [
    { name: 'Quiz', data: data.map(d => d.avgQuiz) },
    { name: 'Code', data: data.map(d => d.avgCode) },
    { name: 'TR', data: data.map(d => d.avgTR) },
    { name: 'HR', data: data.map(d => d.avgHR) },
  ]

  // Total avg radar/bar for selected faculty
  const selectedStudentOptions: ApexCharts.ApexOptions = selected ? {
    chart: { type: 'bar', background: 'transparent', toolbar: { show: false }, foreColor: '#666' },
    plotOptions: { bar: { horizontal: true, borderRadius: 4, borderRadiusApplication: 'end', dataLabels: { position: 'top' } } },
    colors: ['#ff7a00'],
    dataLabels: { enabled: true, style: { fontSize: '0.75rem', colors: ['#fff'] }, formatter: (v: number) => v > 0 ? String(v) : '' },
    xaxis: { categories: selected.students.map(s => s.name.split(' ')[0]), labels: { style: { colors: '#666', fontSize: '0.75rem' } }, max: 400 },
    yaxis: { labels: { style: { colors: '#777', fontSize: '0.75rem' }, maxWidth: 120 } },
    grid: { borderColor: '#1a1a1a' },
    tooltip: { theme: 'dark', y: { formatter: (v: number) => `${v} / 400` } },
  } : {}

  const selectedStudentSeries = selected ? [{ name: 'Total Score', data: selected.students.map(s => s.total) }] : []

  return (
    <div style={{ marginTop: '2rem' }}>
      <hr style={{ border: 'none', borderTop: '1px solid #1a1a1a', margin: '0 0 1.5rem' }} />
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}>📊 Student Progress Overview</div>
        <div style={{ color: '#555', fontSize: '0.8rem', marginTop: '0.2rem' }}>Average assessment scores per faculty admin group</div>
      </div>

      {/* Grouped Bar — all faculty admins comparison */}
      <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '14px', padding: '1.25rem', marginBottom: '1.25rem' }}>
        <div style={{ color: '#aaa', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.75rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Avg Score by Section — All Faculty Groups
        </div>
        <ReactApexChart options={groupedOptions} series={groupedSeries} type="bar" height={260} />
      </div>

      {/* Faculty selector + student breakdown */}
      <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '14px', padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div style={{ color: '#aaa', fontSize: '0.82rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Individual Student Scores
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {data.map(fa => (
              <button
                key={fa.id}
                onClick={() => setSelected(selected?.id === fa.id ? null : fa)}
                style={{
                  background: selected?.id === fa.id ? '#ff7a00' : '#1a1a1a',
                  border: `1px solid ${selected?.id === fa.id ? '#ff7a00' : '#2a2a2a'}`,
                  color: selected?.id === fa.id ? '#fff' : '#888',
                  borderRadius: '20px',
                  padding: '0.3rem 0.85rem',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {fa.name} ({fa.studentCount})
              </button>
            ))}
          </div>
        </div>

        {!selected ? (
          <div style={{ color: '#333', textAlign: 'center', padding: '2.5rem', fontSize: '0.85rem' }}>
            Select a faculty admin above to see their students&apos; individual scores
          </div>
        ) : selected.students.length === 0 ? (
          <div style={{ color: '#333', textAlign: 'center', padding: '2.5rem', fontSize: '0.85rem' }}>
            No students assigned to {selected.name} yet
          </div>
        ) : (
          <>
            {/* Summary chips */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              {[
                { label: 'Students', value: selected.studentCount, color: '#3b82f6' },
                { label: 'Avg Total', value: `${selected.avgTotal}/400`, color: '#ff7a00' },
                { label: 'Avg Quiz', value: selected.avgQuiz, color: '#a855f7' },
                { label: 'Avg Code', value: selected.avgCode, color: '#22c55e' },
                { label: 'Avg TR', value: selected.avgTR, color: '#f59e0b' },
                { label: 'Avg HR', value: selected.avgHR, color: '#ef4444' },
              ].map(chip => (
                <div key={chip.label} style={{ background: '#1a1a1a', border: '1px solid #222', borderRadius: '8px', padding: '0.5rem 0.9rem' }}>
                  <div style={{ color: chip.color, fontWeight: 700, fontSize: '1rem', lineHeight: 1 }}>{chip.value}</div>
                  <div style={{ color: '#555', fontSize: '0.68rem', marginTop: '3px' }}>{chip.label}</div>
                </div>
              ))}
            </div>
            {/* Horizontal bar per student */}
            <ReactApexChart
              options={selectedStudentOptions}
              series={selectedStudentSeries}
              type="bar"
              height={Math.max(180, selected.students.length * 42)}
            />
          </>
        )}
      </div>
    </div>
  )
}

const API_BASE = '/api/faculty-dashboard'

function FacultyAdminDashboard({ user: _user }: { user: any; baseURL: string }) {
  const [activeTab, setActiveTab] = useState<FacultyTabKey>('daily-engagement')
  const [openModal, setOpenModal] = useState<FacultyModalKey>(null)

  return (
    <>
      <PageMetaData title="My Students — Progress Dashboard" />

      <div style={DS.page}>
        <div className="container-lg">
          <div style={{ marginBottom: '1rem' }}>
            <h1 style={{ color: '#fff', fontWeight: 700, fontSize: '1.5rem', margin: 0 }}>
              My Students — Progress Dashboard
            </h1>
            <p style={{ color: '#555', fontSize: '0.83rem', marginTop: '0.3rem' }}>
              Activity and progress data scoped to your assigned students.
            </p>
          </div>

          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #1e1e1e', marginTop: '1.75rem', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {FACULTY_TABS.map(({ key, label, icon: Icon, color }) => {
              const active = activeTab === key
              return (
                <button key={key} onClick={() => setActiveTab(key)} style={{ position: 'relative', background: 'none', border: 'none', padding: '0.65rem 1.25rem 0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.83rem', fontWeight: active ? 700 : 500, color: active ? '#fff' : '#555', transition: 'color 0.15s', whiteSpace: 'nowrap' }}>
                  <Icon size={13} color={active ? color : '#3a3a3a'} />
                  {label}
                  {active && <div style={{ position: 'absolute', bottom: 0, left: '10%', width: '80%', height: 2.5, background: color, borderRadius: 2 }} />}
                </button>
              )
            })}
          </div>

          {/* Tab content */}
          <div style={DS.content}>

            {activeTab === 'daily-engagement' && (
              <Row className="g-3">
                <Col md={12} lg={8}>
                  <DailyTimePerformers apiBase={API_BASE} />
                </Col>
                <Col md={12} lg={4}>
                  <div style={DS.infoCard}>
                    <div style={DS.iconBox}><FaChartBar size={20} color="#ff6b00" /></div>
                    <div style={DS.infoTitle}>Daily Engagement</div>
                    <div style={DS.infoSub}>Student activity tracking</div>
                    <p style={DS.infoDesc}>
                      Track how many of your assigned students are active today, who hasn't logged in, and view a 7-day activity trend.
                    </p>
                    <button style={DS.btn} onClick={() => setOpenModal('daily-engagement')}>Full Details</button>
                  </div>
                </Col>
              </Row>
            )}

            {activeTab === 'course-enrollment' && (
              <Row className="g-3">
                <Col md={12}>
                  <CourseEnrollmentTrend
                    apiBase={API_BASE}
                    onFullDetails={() => setOpenModal('course-enrollment')}
                  />
                </Col>
              </Row>
            )}

            {activeTab === 'ai-interview' && (
              <Row className="g-3">
                <Col md={12} lg={8}>
                  <AIInterviewWidget apiBase={API_BASE} />
                </Col>
                <Col md={12} lg={4}>
                  <div style={DS.infoCard}>
                    <div style={DS.iconBox}><FaRobot size={20} color="#ff6b00" /></div>
                    <div style={DS.infoTitle}>AI Based Interview</div>
                    <div style={DS.infoSub}>Topic Based · Resume Based</div>
                    <p style={DS.infoDesc}>
                      Track participation in AI-powered mock interviews for your assigned students. See attempt counts and scores.
                    </p>
                    <button style={DS.btn} onClick={() => setOpenModal('ai-interview')}>Full Details</button>
                  </div>
                </Col>
              </Row>
            )}

            {activeTab === 'english-practice' && (
              <Row className="g-3">
                <Col md={12} lg={8}>
                  <EnglishPracticeWidget apiBase={API_BASE} />
                </Col>
                <Col md={12} lg={4}>
                  <div style={DS.infoCard}>
                    <div style={DS.iconBox}><FaLanguage size={20} color="#ff6b00" /></div>
                    <div style={DS.infoTitle}>English Practice</div>
                    <div style={DS.infoSub}>Speaking · Writing · Reading · Listening · JAM</div>
                    <p style={DS.infoDesc}>
                      Track English skill participation across your assigned students — best scores and skill engagement levels.
                    </p>
                    <button style={DS.btn} onClick={() => setOpenModal('english-practice')}>Full Details</button>
                  </div>
                </Col>
              </Row>
            )}

            {activeTab === 'assessments' && (
              <Row className="g-3">
                <Col md={12} lg={8}>
                  <AssessmentWidget apiBase={API_BASE} />
                </Col>
                <Col md={12} lg={4}>
                  <div style={DS.infoCard}>
                    <div style={DS.iconBox}><FaClipboardList size={20} color="#ff6b00" /></div>
                    <div style={DS.infoTitle}>Assessments</div>
                    <div style={DS.infoSub}>MCQ · Coding · TR · HR</div>
                    <p style={DS.infoDesc}>
                      Track your assigned students' performance across assessment rounds. See top and low scorers, pass rates, and round-wise scores.
                    </p>
                    <button style={DS.btn} onClick={() => setOpenModal('assessments')}>Full Details</button>
                  </div>
                </Col>
              </Row>
            )}

            {activeTab === 'student-reports' && (
              <StudentReports apiBase={API_BASE} />
            )}

          </div>
        </div>
      </div>

      {/* Daily Engagement Modal */}
      <Modal show={openModal === 'daily-engagement'} onHide={() => setOpenModal(null)} fullscreen>
        <Modal.Header closeButton style={DS.modalHeader}>
          <div className="d-flex align-items-center gap-2">
            <FaChartBar size={18} color="#ff6b00" />
            <Modal.Title style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 700 }}>Daily Engagement</Modal.Title>
          </div>
        </Modal.Header>
        <Modal.Body style={DS.modalBody}>
          <DailyEngagement apiBase={API_BASE} />
        </Modal.Body>
      </Modal>

      {/* Course Enrollment Modal */}
      <Modal show={openModal === 'course-enrollment'} onHide={() => setOpenModal(null)} fullscreen>
        <Modal.Header closeButton style={DS.modalHeader}>
          <div className="d-flex align-items-center gap-2">
            <FaBookOpen size={18} color="#ff6b00" />
            <Modal.Title style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 700 }}>Course Enrollment</Modal.Title>
          </div>
        </Modal.Header>
        <Modal.Body style={DS.modalBody}>
          <CourseEnrollmentFull apiBase={API_BASE} />
        </Modal.Body>
      </Modal>

      {/* English Practice Modal */}
      <Modal show={openModal === 'english-practice'} onHide={() => setOpenModal(null)} fullscreen>
        <Modal.Header closeButton style={DS.modalHeader}>
          <div className="d-flex align-items-center gap-2">
            <FaLanguage size={18} color="#ff6b00" />
            <Modal.Title style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 700 }}>English Practice</Modal.Title>
          </div>
        </Modal.Header>
        <Modal.Body style={DS.modalBody}>
          <EnglishPracticeFull apiBase={API_BASE} />
        </Modal.Body>
      </Modal>

      {/* AI Interview Modal */}
      <Modal show={openModal === 'ai-interview'} onHide={() => setOpenModal(null)} fullscreen>
        <Modal.Header closeButton style={DS.modalHeader}>
          <div className="d-flex align-items-center gap-2">
            <FaRobot size={18} color="#ff6b00" />
            <Modal.Title style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 700 }}>AI Based Interview</Modal.Title>
          </div>
        </Modal.Header>
        <Modal.Body style={DS.modalBody}>
          <AIInterviewFull apiBase={API_BASE} />
        </Modal.Body>
      </Modal>

      {/* Assessments Modal */}
      <Modal show={openModal === 'assessments'} onHide={() => setOpenModal(null)} fullscreen>
        <Modal.Header closeButton style={DS.modalHeader}>
          <div className="d-flex align-items-center gap-2">
            <FaClipboardList size={18} color="#ff6b00" />
            <Modal.Title style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 700 }}>Assessments</Modal.Title>
          </div>
        </Modal.Header>
        <Modal.Body style={DS.modalBody}>
          <AssessmentFull apiBase={API_BASE} />
        </Modal.Body>
      </Modal>

    </>
  )
}
