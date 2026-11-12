import React, { useEffect, useState, useCallback } from 'react'
import { useAuthContext } from '@/context/useAuthContext'
import PageMetaData from '@/components/PageMetaData'
import ReactApexChart from 'react-apexcharts'
import { Col, Modal, Row } from 'react-bootstrap'
import {
  FaBookOpen, FaChartBar, FaLanguage, FaRobot, FaClipboardList, FaFileAlt, FaChalkboardTeacher, FaUserTie,
  FaCheckCircle, FaUsers, FaPlus, FaExclamationTriangle, FaTimes, FaSpinner, FaSearch, FaUserPlus, FaEye,
  FaEyeSlash, FaTrash,
} from 'react-icons/fa'
import { AdminPage, PageHeader, StatCards, SearchInput, AdminSelect, EmptyState, initialsOf, toOptions } from '@/components/admin-ui'
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
const scoreTone = (total: number) => (total >= 280 ? 'aui-badge-green' : total >= 120 ? 'aui-badge-amber' : 'aui-badge-red')
const fmtAdded = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

function InstituteAdminManagement({ user, baseURL }: { user: any; baseURL: string }) {
  const [admins, setAdmins] = useState<FacultyAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Create form state
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', phoneNo: '' })
  const [formError, setFormError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Modal state
  const [assignModal, setAssignModal] = useState<FacultyAdmin | null>(null)
  const [viewModal, setViewModal] = useState<FacultyAdmin | null>(null)
  const [toDelete, setToDelete] = useState<FacultyAdmin | null>(null)
  const [deleting, setDeleting] = useState(false)

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

  const flash = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 4000) }

  const closeCreate = () => {
    setShowCreateForm(false); setFormError(''); setShowPassword(false)
    setForm({ name: '', email: '', password: '', phoneNo: '' })
  }

  const handleCreate = async (e?: React.FormEvent) => {
    e?.preventDefault()
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
      closeCreate()
      flash(`Faculty admin "${data.name}" created successfully.`)
      fetchAdmins()
    } catch (err: any) {
      setFormError(err.message)
    } finally {
      setCreating(false)
    }
  }

  // Confirmed from the in-app dialog (replaces the browser confirm box)
  const handleDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      const res = await fetch(`${baseURL}/faculty-admin/${toDelete._id}`, {
        method: 'DELETE',
        headers: authHeaders,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to delete')
      flash(`"${toDelete.name}" deleted.`)
      setToDelete(null)
      fetchAdmins()
    } catch (err: any) {
      setError(err.message)
      setToDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  const totalAssigned = admins.reduce((sum, a) => sum + (a.assignedCount || 0), 0)
  const approvedCount = admins.filter(a => a.status === 'approved').length
  const statuses = [...new Set(admins.map(a => a.status).filter(Boolean))]

  const visible = admins.filter(a => {
    const q = search.trim().toLowerCase()
    return (!q || a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q)) && (!statusFilter || a.status === statusFilter)
  })

  return (
    <AdminPage>
      <PageMetaData title="Faculty Admin Management" />

      <PageHeader
        icon={FaChalkboardTeacher}
        title="Faculty Admins"
        stats={
          <StatCards
            inline
            loading={loading}
            items={[
              { label: 'Faculty Admins', value: admins.length, icon: FaUserTie, tone: 'orange' },
              { label: 'Active', value: approvedCount, icon: FaCheckCircle, tone: 'green' },
              { label: 'Students Assigned', value: totalAssigned, icon: FaUsers, tone: 'blue' },
              { label: 'Avg per Faculty', value: admins.length ? Math.round(totalAssigned / admins.length) : 0, icon: FaChartBar, tone: 'purple' },
            ]}
          />
        }
        actions={
          <button type="button" className="aui-btn aui-btn-primary" onClick={() => { setFormError(''); setShowCreateForm(true) }}>
            <FaPlus size={11} /> Add Faculty Admin
          </button>
        }
      />

      {error && (
        <div className="aui-alert"><FaExclamationTriangle /> <span>{error}</span>
          <button type="button" className="aui-alert-close" onClick={() => setError('')} aria-label="Dismiss"><FaTimes size={11} /></button>
        </div>
      )}
      {success && <div className="aui-alert aui-alert-success"><FaCheckCircle /> <span>{success}</span></div>}

      <div className="aui-card">
        <div className="aui-toolbar">
          <div className="aui-toolbar-title">
            <h3>Faculty admins</h3>
            <p>Assign students to each faculty admin and track their progress</p>
          </div>
          <div className="aui-toolbar-filters">
            <SearchInput value={search} onChange={setSearch} placeholder="Search name or email…" />
            {statuses.length > 1 && (
              <AdminSelect label="Status" value={statusFilter} options={[{ value: '', label: 'All statuses' }, ...statuses.map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))]} onChange={setStatusFilter} />
            )}
          </div>
        </div>

        {loading ? (
          <div className="aui-empty"><FaSpinner className="aui-spin" size={22} /> Loading faculty admins…</div>
        ) : admins.length === 0 ? (
          <EmptyState
            icon={FaChalkboardTeacher}
            title="No faculty admins yet"
            text="Create a faculty admin, then assign students so they can track their progress."
            action={<button type="button" className="aui-btn aui-btn-primary" onClick={() => setShowCreateForm(true)}><FaPlus size={11} /> Add Faculty Admin</button>}
          />
        ) : visible.length === 0 ? (
          <EmptyState icon={FaSearch} title="No faculty admins match" text="Try a different name or status." action={<button type="button" className="aui-btn aui-btn-sm" onClick={() => { setSearch(''); setStatusFilter('') }}>Clear filters</button>} />
        ) : (
          <div className="aui-table-scroll">
            <table className="aui-table">
              <thead>
                <tr>
                  <th style={{ width: 48 }}>#</th>
                  <th>Faculty Admin</th>
                  <th style={{ width: 150 }}>Students</th>
                  <th style={{ width: 120 }}>Status</th>
                  <th style={{ width: 130 }}>Added</th>
                  <th style={{ width: 300 }} className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((admin, i) => (
                  <tr key={admin._id}>
                    <td className="aui-num">{i + 1}</td>
                    <td>
                      <div className="aui-person">
                        <span className="aui-avatar">{initialsOf(admin.name)}</span>
                        <div className="aui-stack">
                          <strong>{admin.name}</strong>
                          <small>{admin.email}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`aui-badge ${admin.assignedCount ? 'aui-badge-blue' : 'aui-badge-muted'}`}>
                        <FaUsers size={9} /> {admin.assignedCount} student{admin.assignedCount !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td>
                      <span className={`aui-badge aui-badge-dot ${admin.status === 'approved' ? 'aui-badge-green' : 'aui-badge-amber'}`}>
                        {admin.status === 'approved' ? 'Active' : admin.status.charAt(0).toUpperCase() + admin.status.slice(1)}
                      </span>
                    </td>
                    <td className="aui-num">{fmtAdded(admin.createdAt)}</td>
                    <td className="text-end">
                      <div className="fam-actions">
                        <button type="button" className="aui-btn aui-btn-sm aui-btn-soft" onClick={() => setAssignModal(admin)}><FaUserPlus size={11} /> Assign Students</button>
                        <button type="button" className="aui-btn aui-btn-sm" onClick={() => setViewModal(admin)}><FaEye size={11} /> View</button>
                        <button type="button" className="aui-icon-btn fam-delete" onClick={() => setToDelete(admin)} title="Delete faculty admin" aria-label={`Delete ${admin.name}`}><FaTrash size={11} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && admins.length > 0 && (
        <FacultyProgressCharts baseURL={baseURL} authHeaders={authHeaders} refreshKey={admins.length} />
      )}

      {/* ── Create ── */}
      <Modal show={showCreateForm} onHide={() => !creating && closeCreate()} centered contentClassName="aui-modal" backdropClassName="aui-backdrop">
        <form className="aui-page" onSubmit={handleCreate} noValidate>
          <div className="aui-modal-head">
            <span className="aui-heading-icon"><FaUserPlus /></span>
            <div>
              <h3>New Faculty Admin</h3>
              <p>They sign in with this email and password</p>
            </div>
            <button type="button" className="aui-icon-btn" onClick={closeCreate} disabled={creating} aria-label="Close"><FaTimes size={12} /></button>
          </div>
          <div className="aui-modal-body">
            {formError && <div className="aui-alert"><FaExclamationTriangle /> <span>{formError}</span></div>}
            <div className="aui-field">
              <label className="aui-label" htmlFor="fa-name">Full name</label>
              <input id="fa-name" className={`aui-input${formError && !form.name.trim() ? ' is-invalid' : ''}`} placeholder="Dr. Jane Smith" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} autoFocus />
            </div>
            <div className="aui-field">
              <label className="aui-label" htmlFor="fa-email">Email address</label>
              <input id="fa-email" type="email" className={`aui-input${formError && !form.email.trim() ? ' is-invalid' : ''}`} placeholder="jane@college.edu" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="aui-field-row">
              <div className="aui-field">
                <label className="aui-label" htmlFor="fa-pass">Password</label>
                <div className="aui-input-group">
                  <input id="fa-pass" type={showPassword ? 'text' : 'password'} className={`aui-input fam-pass${formError && !form.password.trim() ? ' is-invalid' : ''}`} placeholder="Min 8 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} autoComplete="new-password" />
                  <button type="button" className="fam-eye" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              <div className="aui-field">
                <label className="aui-label" htmlFor="fa-phone">Phone <span className="aui-optional">Optional</span></label>
                <input id="fa-phone" className="aui-input" placeholder="+91 98765 43210" value={form.phoneNo} onChange={e => setForm({ ...form, phoneNo: e.target.value })} />
              </div>
            </div>
          </div>
          <div className="aui-modal-foot">
            <button type="button" className="aui-btn" onClick={closeCreate} disabled={creating}>Cancel</button>
            <button type="submit" className="aui-btn aui-btn-primary" disabled={creating}>
              {creating ? <><FaSpinner className="aui-spin" style={{ color: '#fff' }} /> Creating…</> : <><FaPlus size={11} /> Create Faculty Admin</>}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Delete confirm ── */}
      <Modal show={!!toDelete} onHide={() => !deleting && setToDelete(null)} centered contentClassName="aui-modal" backdropClassName="aui-backdrop">
        <div className="aui-page">
          <div className="aui-modal-body fam-confirm">
            <span className="fam-confirm-icon"><FaTrash /></span>
            <h3>Delete this faculty admin?</h3>
            <p><b>{toDelete?.name}</b> will lose access to the portal. This can’t be undone.</p>
          </div>
          <div className="aui-modal-foot">
            <button type="button" className="aui-btn" onClick={() => setToDelete(null)} disabled={deleting}>Cancel</button>
            <button type="button" className="aui-btn aui-btn-danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? <><FaSpinner className="aui-spin" /> Deleting…</> : <><FaTrash size={11} /> Delete</>}
            </button>
          </div>
        </div>
      </Modal>

      {assignModal && (
        <AssignStudentsModal
          admin={assignModal}
          baseURL={baseURL}
          authHeaders={authHeaders}
          onClose={() => setAssignModal(null)}
          onSaved={(count) => { fetchAdmins(); setAssignModal(null); flash(`${count} student${count !== 1 ? 's' : ''} assigned to ${assignModal.name}.`) }}
        />
      )}

      {viewModal && (
        <ViewStudentsModal
          admin={viewModal}
          baseURL={baseURL}
          authHeaders={authHeaders}
          onClose={() => setViewModal(null)}
        />
      )}

      <style>{FAM_CSS}</style>
    </AdminPage>
  )
}

const FAM_CSS = `
  .fam-actions { display: inline-flex; gap: 6px; }
  .fam-delete:hover { border-color: rgba(251,95,103,0.55) !important; color: #fb737a !important; }
  .fam-pass { padding-right: 2.5rem; }
  .fam-eye { position: absolute; right: 6px; padding: 6px 8px; border: 0; background: none; color: #858a90; }
  .fam-eye:hover { color: #fff; }
  .fam-confirm { padding: 1.5rem 1.5rem 1.1rem; text-align: center; }
  .fam-confirm-icon { display: inline-grid; place-items: center; width: 48px; height: 48px; margin-bottom: 0.75rem; border: 1px solid rgba(251,95,103,0.3); border-radius: 14px; background: rgba(251,95,103,0.12); color: #fb737a; font-size: 1.05rem; }
  .fam-confirm h3 { margin: 0 0 0.4rem; color: #fff; font-size: 1.05rem; font-weight: 750; }
  .fam-confirm p { margin: 0; color: #9aa0a6; font-size: 0.82rem; line-height: 1.5; }
  .fam-confirm p b { color: #e5e7eb; }

  .fam-dialog { max-width: 1080px; }
  .fam-modal { display: flex; flex-direction: column; min-height: 0; max-height: calc(100vh - 3.5rem); }
  .fam-modal .aui-modal-body { padding: 0; display: flex; flex-direction: column; }
  .fam-modal .aui-toolbar { border-radius: 0; }
  .fam-modal-scroll { flex: 1; min-height: 0; overflow-y: auto; }
  .fam-modal-scroll .aui-table thead th { position: sticky; top: 0; z-index: 1; background: #17191b; }
  .fam-modal .aui-alert { margin: 0.85rem 0.85rem 0; }
  .fam-score { text-align: center !important; }
  .fam-check { width: 15px; height: 15px; accent-color: #ff7a00; color-scheme: dark; cursor: pointer; vertical-align: middle; }
  .fam-row-pick { cursor: pointer; }
  .fam-modal .aui-table tbody tr.is-selected { background: rgba(255,122,0,0.06); }
  .fam-elsewhere { display: inline-flex; align-items: center; gap: 4px; margin-top: 2px; color: #f4b43f; font-size: 0.68rem; font-weight: 600; }
  .fam-conflict { margin: 0.85rem; padding: 0.9rem 1rem; border: 1px solid rgba(246,170,36,0.35); border-radius: 10px; background: rgba(246,170,36,0.08); }
  .fam-conflict h4 { display: flex; align-items: center; gap: 8px; margin: 0 0 0.4rem; color: #f4b43f; font-size: 0.86rem; font-weight: 750; }
  .fam-conflict p { margin: 0 0 0.5rem; color: #d6c08a; font-size: 0.8rem; line-height: 1.5; }
  .fam-conflict ul { margin: 0 0 0.75rem; padding-left: 1.1rem; color: #b4b9be; font-size: 0.78rem; }
  .fam-conflict ul b { color: #f4b43f; }
  .fam-conflict-actions { display: flex; gap: 8px; }
  .fam-foot-note { margin-right: auto; color: #a6abb0; font-size: 0.8rem; }
  .fam-foot-note b { color: #ffb15e; }

  .fam-progress .aui-toolbar-filters .aui-dropdown-trigger { min-width: 220px; }
  .fam-chart { padding: 0.75rem 0.85rem 0.25rem; }
  .fam-chart + .fam-chart { border-top: 1px solid #202326; }
  .fam-chart-title { margin: 0.35rem 0 0.25rem; color: #9da2a8; font-size: 0.68rem; font-weight: 750; letter-spacing: 0.06em; text-transform: uppercase; }
  .fam-chips { display: flex; flex-wrap: wrap; gap: 8px; margin: 0.5rem 0 0.25rem; }
  .fam-chip { display: flex; flex-direction: column; min-width: 92px; padding: 0.5rem 0.8rem; border: 1px solid #25282b; border-radius: 10px; background: #111315; }
  .fam-chip strong { font-size: 1rem; font-weight: 800; line-height: 1.1; }
  .fam-chip small { margin-top: 3px; color: #858a90; font-size: 0.68rem; }
`

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
    <Modal show onHide={onClose} centered dialogClassName="fam-dialog" contentClassName="aui-modal" backdropClassName="aui-backdrop">
      <div className="aui-page fam-modal">
        <div className="aui-modal-head">
          <span className="aui-avatar">{initialsOf(admin.name)}</span>
          <div>
            <h3>Assigned Students</h3>
            <p>{admin.name} · {students.length} student{students.length !== 1 ? 's' : ''}</p>
          </div>
          <button type="button" className="aui-icon-btn" onClick={onClose} aria-label="Close"><FaTimes size={12} /></button>
        </div>

        <div className="aui-modal-body">
          <div className="aui-toolbar">
            <SearchInput value={search} onChange={setSearch} placeholder="Search name or email…" />
            <span className="aui-count">{filtered.length} of {students.length} shown · scores out of 100 each</span>
          </div>
          <div className="fam-modal-scroll">
            {loading ? (
              <div className="aui-empty"><FaSpinner className="aui-spin" size={22} /> Loading students…</div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={FaUsers}
                title={students.length === 0 ? 'No students assigned yet' : 'No students match'}
                text={students.length === 0 ? 'Use Assign Students to add students to this faculty admin.' : 'Try a different name or email.'}
              />
            ) : (
              <table className="aui-table">
                <thead>
                  <tr>
                    <th style={{ width: 44 }}>#</th>
                    <th>Student</th>
                    <th>Branch</th>
                    <th>Year</th>
                    <th className="fam-score">Quiz</th>
                    <th className="fam-score">Code</th>
                    <th className="fam-score">TR</th>
                    <th className="fam-score">HR</th>
                    <th className="fam-score">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s, idx) => {
                    const sc = s.assessmentScores
                    const total = totalScore(sc)
                    return (
                      <tr key={s._id}>
                        <td className="aui-num">{idx + 1}</td>
                        <td>
                          <div className="aui-person">
                            <span className="aui-avatar">{initialsOf(s.fullName)}</span>
                            <div className="aui-stack"><strong>{s.fullName}</strong><small>{s.email}</small></div>
                          </div>
                        </td>
                        <td>{s.branch ?? s.department ?? '—'}</td>
                        <td>{s.joiningYear ? <span className="aui-badge aui-badge-muted">{s.joiningYear}</span> : '—'}</td>
                        <td className="fam-score">{sc?.quizScore ?? 0}</td>
                        <td className="fam-score">{sc?.codeChallengeScore ?? 0}</td>
                        <td className="fam-score">{sc?.technicalRoundScore ?? 0}</td>
                        <td className="fam-score">{sc?.hrRoundScore ?? 0}</td>
                        <td className="fam-score"><span className={`aui-badge ${scoreTone(total)}`}>{total}<span style={{ opacity: 0.6 }}>/400</span></span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="aui-modal-foot">
          <button type="button" className="aui-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </Modal>
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
  onSaved: (count: number) => void
}) {
  const [students, setStudents] = useState<StudentProfile[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set(admin.assignedStudentIds || []))
  const [filterDept, setFilterDept] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [search, setSearch] = useState('')
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [saving, setSaving] = useState(false)
  const [fetchError, setFetchError] = useState('')
  const [saveError, setSaveError] = useState('')
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

  // Students reload whenever the branch / year filter changes (no separate "Load" step)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setFetchError('')
      setLoadingStudents(true)
      try {
        const params = new URLSearchParams()
        if (filterDept) params.set('department', filterDept)
        if (filterYear) params.set('year', filterYear)
        const res = await fetch(`${baseURL}/faculty-admin/students/list?${params.toString()}`, { headers: authHeaders })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Failed to load students')
        if (!cancelled) setStudents(data)
      } catch (err: any) {
        if (!cancelled) setFetchError(err.message)
      } finally {
        if (!cancelled) setLoadingStudents(false)
      }
    })()
    return () => { cancelled = true }
  }, [filterDept, filterYear])

  const q = search.trim().toLowerCase()
  const shown = students.filter(s => !q || s.fullName.toLowerCase().includes(q) || s.email.toLowerCase().includes(q))

  const toggleStudent = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allShownSelected = shown.length > 0 && shown.every((s) => selected.has(s._id))
  const toggleAll = () => {
    if (shown.length === 0) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (allShownSelected) shown.forEach((s) => next.delete(s._id))
      else shown.forEach((s) => next.add(s._id))
      return next
    })
  }

  const doSave = async (force = false) => {
    setSaving(true)
    setSaveError('')
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
      onSaved(data.count ?? selected.size)
    } catch (err: any) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleForceConfirm = () => { setConflicts([]); doSave(true) }

  return (
    <Modal show onHide={() => !saving && onClose()} centered dialogClassName="fam-dialog" contentClassName="aui-modal" backdropClassName="aui-backdrop">
      <div className="aui-page fam-modal">
        <div className="aui-modal-head">
          <span className="aui-heading-icon"><FaUserPlus /></span>
          <div>
            <h3>Assign Students</h3>
            <p>to {admin.name} · tick students to assign, untick to remove</p>
          </div>
          <button type="button" className="aui-icon-btn" onClick={onClose} disabled={saving} aria-label="Close"><FaTimes size={12} /></button>
        </div>

        <div className="aui-modal-body">
          <div className="aui-toolbar">
            <SearchInput value={search} onChange={setSearch} placeholder="Search name or email…" />
            <div className="aui-toolbar-filters">
              <AdminSelect label="Branch" value={filterDept} options={toOptions('All branches', departments)} onChange={setFilterDept} />
              <AdminSelect label="Joining year" value={filterYear} options={toOptions('All years', years)} onChange={setFilterYear} />
            </div>
          </div>

          {fetchError && <div className="aui-alert"><FaExclamationTriangle /> <span>{fetchError}</span></div>}
          {saveError && <div className="aui-alert"><FaExclamationTriangle /> <span>{saveError}</span></div>}

          {conflicts.length > 0 && (
            <div className="fam-conflict">
              <h4><FaExclamationTriangle /> Some students already have a faculty admin</h4>
              <p>Confirming moves them to <b>{admin.name}</b>:</p>
              <ul>
                {conflicts.map((c) => (
                  <li key={c.facultyAdminId}>{c.studentIds.length} student{c.studentIds.length !== 1 ? 's' : ''} currently with <b>{c.facultyAdminName}</b></li>
                ))}
              </ul>
              <div className="fam-conflict-actions">
                <button type="button" className="aui-btn aui-btn-sm aui-btn-primary" onClick={handleForceConfirm} disabled={saving}>
                  {saving ? 'Moving…' : `Move to ${admin.name}`}
                </button>
                <button type="button" className="aui-btn aui-btn-sm" onClick={() => setConflicts([])}>Cancel</button>
              </div>
            </div>
          )}

          <div className="fam-modal-scroll">
            {loadingStudents ? (
              <div className="aui-empty"><FaSpinner className="aui-spin" size={22} /> Loading students…</div>
            ) : shown.length === 0 ? (
              <EmptyState icon={FaUsers} title="No students found" text={students.length ? 'Try a different name or email.' : 'No students match this branch and year.'} />
            ) : (
              <table className="aui-table">
                <thead>
                  <tr>
                    <th style={{ width: 44 }}>
                      <input type="checkbox" className="fam-check" checked={allShownSelected} onChange={toggleAll} aria-label="Select all shown" />
                    </th>
                    <th>Student</th>
                    <th>Branch</th>
                    <th>Year</th>
                    <th className="fam-score">Quiz</th>
                    <th className="fam-score">Code</th>
                    <th className="fam-score">TR</th>
                    <th className="fam-score">HR</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((student) => {
                    const sc = student.assessmentScores
                    const isSelected = selected.has(student._id)
                    const elsewhere = student.assignedTo && student.assignedTo.id !== admin._id
                    return (
                      <tr key={student._id} className={`fam-row-pick${isSelected ? ' is-selected' : ''}`} onClick={() => toggleStudent(student._id)}>
                        <td>
                          <input type="checkbox" className="fam-check" checked={isSelected} onChange={() => toggleStudent(student._id)} onClick={(e) => e.stopPropagation()} aria-label={`Select ${student.fullName}`} />
                        </td>
                        <td>
                          <div className="aui-person">
                            <span className="aui-avatar">{initialsOf(student.fullName)}</span>
                            <div className="aui-stack">
                              <strong>{student.fullName}</strong>
                              <small>{student.email}</small>
                              {elsewhere && <span className="fam-elsewhere"><FaExclamationTriangle size={9} /> With {student.assignedTo!.name}</span>}
                            </div>
                          </div>
                        </td>
                        <td>{student.branch ?? student.department ?? '—'}</td>
                        <td>{student.joiningYear ? <span className="aui-badge aui-badge-muted">{student.joiningYear}</span> : '—'}</td>
                        <td className="fam-score aui-num">{sc?.quizScore ?? 0}</td>
                        <td className="fam-score aui-num">{sc?.codeChallengeScore ?? 0}</td>
                        <td className="fam-score aui-num">{sc?.technicalRoundScore ?? 0}</td>
                        <td className="fam-score aui-num">{sc?.hrRoundScore ?? 0}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="aui-modal-foot">
          <span className="fam-foot-note"><b>{selected.size}</b> student{selected.size !== 1 ? 's' : ''} selected · {shown.length} shown</span>
          <button type="button" className="aui-btn" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="button" className="aui-btn aui-btn-primary" onClick={() => doSave(false)} disabled={saving || selected.size === 0}>
            {saving ? <><FaSpinner className="aui-spin" style={{ color: '#fff' }} /> Saving…</> : <><FaCheckCircle size={11} /> Save Assignments</>}
          </button>
        </div>
      </div>
    </Modal>
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

const CHART_TEXT = '#9aa0a6'
const CHART_GRID = '#202326'
const SECTION_COLORS = ['#38bdf8', '#c4a5ff', '#45dd75', '#f4b43f']

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
  const [selectedId, setSelectedId] = useState('')

  useEffect(() => {
    setLoading(true)
    fetch(`${baseURL}/faculty-admin/progress-overview`, { headers: authHeaders })
      .then(r => r.json())
      .then(d => {
        const list: FacultyProgress[] = Array.isArray(d) ? d : []
        setData(list)
        // Preselect the faculty with the most students so the breakdown is never empty
        const busiest = [...list].sort((a, b) => b.studentCount - a.studentCount)[0]
        setSelectedId(busiest?.id || '')
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [refreshKey])

  const selected = data.find(d => d.id === selectedId) || null
  const names = data.map(d => d.name)

  const groupedOptions: ApexCharts.ApexOptions = {
    chart: { type: 'bar', background: 'transparent', toolbar: { show: false }, foreColor: CHART_TEXT, fontFamily: 'inherit' },
    plotOptions: { bar: { horizontal: false, columnWidth: '52%', borderRadius: 4, borderRadiusApplication: 'end' } },
    colors: SECTION_COLORS,
    dataLabels: { enabled: false },
    xaxis: { categories: names, labels: { style: { colors: CHART_TEXT, fontSize: '12px' } }, axisBorder: { color: CHART_GRID }, axisTicks: { color: CHART_GRID } },
    yaxis: { max: 100, labels: { style: { colors: CHART_TEXT } }, title: { text: 'Avg score (out of 100)', style: { color: '#6b7280', fontWeight: 500 } } },
    legend: { position: 'top', horizontalAlign: 'right', labels: { colors: '#d1d5db' }, markers: { size: 6 } as any },
    grid: { borderColor: CHART_GRID, strokeDashArray: 3 },
    tooltip: { theme: 'dark' },
  }

  const groupedSeries = [
    { name: 'Quiz', data: data.map(d => d.avgQuiz) },
    { name: 'Code', data: data.map(d => d.avgCode) },
    { name: 'Technical', data: data.map(d => d.avgTR) },
    { name: 'HR', data: data.map(d => d.avgHR) },
  ]

  const studentOptions: ApexCharts.ApexOptions = selected ? {
    chart: { type: 'bar', background: 'transparent', toolbar: { show: false }, foreColor: CHART_TEXT, fontFamily: 'inherit' },
    plotOptions: { bar: { horizontal: true, barHeight: '62%', borderRadius: 4, borderRadiusApplication: 'end', dataLabels: { position: 'top' } } },
    colors: ['#ff7a00'],
    dataLabels: { enabled: true, offsetX: 22, style: { fontSize: '11px', colors: ['#e5e7eb'] }, formatter: (v: number) => (v > 0 ? String(v) : '') },
    xaxis: { categories: selected.students.map(s => s.name), max: 400, labels: { style: { colors: CHART_TEXT, fontSize: '11px' } }, axisBorder: { color: CHART_GRID } },
    yaxis: { labels: { style: { colors: '#d1d5db', fontSize: '12px' }, maxWidth: 160 } },
    grid: { borderColor: CHART_GRID, strokeDashArray: 3 },
    tooltip: { theme: 'dark', y: { formatter: (v: number) => `${v} / 400` } },
  } : {}

  return (
    <div className="aui-card fam-progress">
      <div className="aui-toolbar">
        <div className="aui-toolbar-title">
          <h3>Student Progress Overview</h3>
          <p>Average assessment scores for each faculty admin’s students</p>
        </div>
        {data.length > 0 && (
          <div className="aui-toolbar-filters">
            <AdminSelect
              label="Faculty admin"
              prefix="Faculty:"
              value={selectedId}
              options={data.map(fa => ({ value: fa.id, label: `${fa.name} (${fa.studentCount})` }))}
              onChange={setSelectedId}
            />
          </div>
        )}
      </div>

      {loading ? (
        <div className="aui-empty"><FaSpinner className="aui-spin" size={22} /> Loading progress…</div>
      ) : data.length === 0 ? (
        <EmptyState icon={FaChartBar} title="No progress data yet" text="Scores appear once assigned students complete assessments." />
      ) : (
        <>
          <div className="fam-chart">
            <div className="fam-chart-title">Average score by section · all faculty groups</div>
            <ReactApexChart options={groupedOptions} series={groupedSeries} type="bar" height={270} />
          </div>

          <div className="fam-chart">
            <div className="fam-chart-title">{selected ? `${selected.name} · individual student totals` : 'Individual student totals'}</div>
            {!selected || selected.students.length === 0 ? (
              <EmptyState icon={FaUsers} title="No students assigned" text={selected ? `${selected.name} has no students yet.` : 'Choose a faculty admin above.'} />
            ) : (
              <>
                <div className="fam-chips">
                  {[
                    { label: 'Students', value: selected.studentCount, color: '#eceef0' },
                    { label: 'Avg total / 400', value: selected.avgTotal, color: '#ff9a3c' },
                    { label: 'Avg quiz', value: selected.avgQuiz, color: SECTION_COLORS[0] },
                    { label: 'Avg code', value: selected.avgCode, color: SECTION_COLORS[1] },
                    { label: 'Avg technical', value: selected.avgTR, color: SECTION_COLORS[2] },
                    { label: 'Avg HR', value: selected.avgHR, color: SECTION_COLORS[3] },
                  ].map(chip => (
                    <div key={chip.label} className="fam-chip">
                      <strong style={{ color: chip.color }}>{chip.value}</strong>
                      <small>{chip.label}</small>
                    </div>
                  ))}
                </div>
                <ReactApexChart
                  options={studentOptions}
                  series={[{ name: 'Total score', data: selected.students.map(s => s.total) }]}
                  type="bar"
                  height={Math.max(180, selected.students.length * 38 + 40)}
                />
              </>
            )}
          </div>
        </>
      )}
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
