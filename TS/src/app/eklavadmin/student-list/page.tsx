import { useEffect, useState } from 'react'
import { Button, Card, CardBody, CardHeader, Col, Row, Modal, Form, Badge } from 'react-bootstrap'
import { FaMapMarkerAlt, FaRegEnvelope, FaSearch, FaDownload, FaPhone, FaGraduationCap, FaStar, FaFilter, FaEye, FaChevronLeft, FaChevronRight, FaSpinner, FaUserGraduate, FaBuilding, FaEnvelope, FaPhoneAlt, FaInfoCircle, FaCheckCircle, FaTimesCircle, FaAngleDoubleLeft, FaAngleDoubleRight, FaUserShield } from 'react-icons/fa'
import { MdVerified, MdPending, MdAssessment, MdDateRange } from 'react-icons/md'
import { BsThreeDotsVertical, BsSortDown, BsSortUp } from 'react-icons/bs'
import PageMetaData from '@/components/PageMetaData'
import { AdminPage, PageHeader, StatCards, SearchInput, AdminSelect, TableFooter, EmptyState, initialsOf } from '@/components/admin-ui'
import { FaSort, FaSortUp, FaSortDown, FaUsers, FaHourglassHalf, FaUserPlus, FaTimes, FaExclamationTriangle, FaClipboardList, FaCode, FaLaptopCode, FaUserTie, FaCalendarCheck, FaPaperPlane } from 'react-icons/fa'
import { useAuthContext } from '@/context/useAuthContext'
import * as XLSX from 'xlsx'
import GrantAccessModal from './GrantAccessModal'

interface Feedback {
  _id: string
  text: string
  rating: number
  date: string
}

interface AssessmentScores {
  quizScore: number
  codeChallengeScore: number
  technicalRoundScore: number
  hrRoundScore: number
}

interface Student {
  _id: string
  userId?: string
  fullName: string
  profileImage?: string
  college?: string
  phoneNo: string
  email: string
  batch?: string
  department?: string
  joiningYear?: string
  status?: string
  role?: string
  about?: string
  skills?: string[]
  feedback?: Feedback[]
  assessmentScores?: AssessmentScores
  createdAt: string
  updatedAt: string
  /* Access window from the student's account (subscription dates live on the User) */
  access?: {
    userStatus: string | null
    plan: string | null
    startDate: string | null
    endDate: string | null
    source?: string | null
    grantedAt?: string | null
    note?: string | null
    modules: { moduleKey: string; plan: string | null; source: string | null; endDate: string | null }[]
  } | null
}

type AccessKind = 'active' | 'expiring' | 'expired' | 'unlimited' | 'module' | 'none'
type AccessInfo = { kind: AccessKind; label: string; sub: string; tone: string; sortValue: number }

const DAY_MS = 86400000
const PLAN_LABEL: Record<string, string> = { '6months': '6-month plan', '12months': '12-month plan' }
const MODULE_LABEL: Record<string, string> = { lsrw: 'LSRW', companyInterview: 'Company Interviews', aptitude: 'Aptitude' }
const shortDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

/* How long a student can use the app. A paid plan ends on subscription.endDate; after that the
   backend moves them back to "pending". Approved with no end date (admin / institute) never expires. */
const accessInfo = (s: Student): AccessInfo => {
  const a = s.access
  if (a?.endDate) {
    const days = Math.ceil((new Date(a.endDate).getTime() - Date.now()) / DAY_MS)
    const plan = a.source === 'admin' ? `${a.plan ? PLAN_LABEL[a.plan] || a.plan : 'Custom'} · by admin` : a.plan ? PLAN_LABEL[a.plan] || a.plan : 'Paid plan'
    if (days < 0) return { kind: 'expired', label: 'Expired', sub: `${shortDate(a.endDate)} · moves to pending`, tone: 'red', sortValue: days }
    if (days <= 30) return { kind: 'expiring', label: days === 0 ? 'Ends today' : `${days} day${days === 1 ? '' : 's'} left`, sub: `Ends ${shortDate(a.endDate)} · ${plan}`, tone: 'amber', sortValue: days }
    return { kind: 'active', label: `${days} days left`, sub: `Ends ${shortDate(a.endDate)} · ${plan}`, tone: 'green', sortValue: days }
  }
  if ((s.status || a?.userStatus) === 'approved') return { kind: 'unlimited', label: 'No expiry', sub: a?.source === 'admin' ? 'Approved by admin · no end date' : 'Approved without an end date', tone: 'blue', sortValue: 1e6 }
  const mod = a?.modules?.[0]
  if (mod) {
    const names = a!.modules.map(m => MODULE_LABEL[m.moduleKey] || m.moduleKey).join(', ')
    if (!mod.endDate) return { kind: 'module', label: names, sub: 'Module access · no end date', tone: 'purple', sortValue: 1e6 - 1 }
    const days = Math.ceil((new Date(mod.endDate).getTime() - Date.now()) / DAY_MS)
    return { kind: 'module', label: names, sub: days < 0 ? `Module expired ${shortDate(mod.endDate)}` : `Module · ${days} days left`, tone: days < 0 ? 'red' : 'purple', sortValue: days }
  }
  return { kind: 'none', label: 'No plan', sub: 'Nothing purchased', tone: 'muted', sortValue: -1e6 }
}

const AccessCell = ({ student }: { student: Student }) => {
  const info = accessInfo(student)
  return (
    <div className={`sl-access is-${info.tone}`} title={info.sub}>
      <strong>{info.kind === 'expired' || info.kind === 'expiring' ? <span className="sl-access-dot" /> : null}{info.label}</strong>
      <small>{info.sub}</small>
    </div>
  )
}

interface StudentDetailsModalProps {
  show: boolean
  onHide: () => void
  student: Student | null
}

/* Photo when it loads, initials otherwise — a missing or broken image never leaves an empty slot */
const StudentAvatar = ({ name, image, baseURL }: { name: string; image?: string; baseURL: string }) => {
  const [failed, setFailed] = useState(false)
  useEffect(() => { setFailed(false) }, [image])
  const src = image ? (/^(https?:|data:)/.test(image) ? image : `${baseURL}${image}`) : ''
  return src && !failed
    ? <img className="aui-avatar sl-photo" src={src} alt="" onError={() => setFailed(true)} />
    : <span className="aui-avatar">{initialsOf(name)}</span>
}

// Student Details Modal Component
const RATING_WORDS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent']

const StudentDetailsModal: React.FC<StudentDetailsModalProps> = ({ show, onHide, student }) => {
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackRating, setFeedbackRating] = useState<number>(0)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedbackResult, setFeedbackResult] = useState<{ ok: boolean; text: string } | null>(null)
  const [photoFailed, setPhotoFailed] = useState(false)
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()

  // Fresh state for each student opened
  useEffect(() => {
    setPhotoFailed(false)
    setFeedbackResult(null)
    setFeedbackText('')
    setFeedbackRating(0)
  }, [student?._id])

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!student) return
    setIsSubmitting(true)
    setFeedbackResult(null)

    try {
      const res = await fetch(`${baseURL}/adminProfiles/admin/${student._id}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          feedback: feedbackText,
          rating: feedbackRating,
        }),
      })
      if (!res.ok) throw new Error(`Feedback failed (${res.status})`)
      setFeedbackText('')
      setFeedbackRating(0)
      setFeedbackResult({ ok: true, text: `Feedback sent to ${student.fullName.split(' ')[0]}.` })
    } catch (error) {
      console.error('Error sending feedback:', error)
      setFeedbackResult({ ok: false, text: 'Could not send feedback. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!student) return null

  const status = student.status || 'pending'
  const statusBadge = (
    <span className={`aui-badge aui-badge-dot ${status === 'approved' ? 'aui-badge-green' : status === 'rejected' ? 'aui-badge-red' : 'aui-badge-amber'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )

  const averageRating = student.feedback?.length
    ? (student.feedback.reduce((acc, f) => acc + f.rating, 0) / student.feedback.length).toFixed(1)
    : null

  const photoUrl = student.profileImage
    ? (/^(https?:|data:)/.test(student.profileImage) ? student.profileImage : `${baseURL}${student.profileImage}`)
    : ''
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

  const scores = student.assessmentScores
  const scoreItems = scores ? [
    { label: 'Quiz', value: scores.quizScore, icon: FaClipboardList, tone: 'sdm-tone-orange' },
    { label: 'Code Challenge', value: scores.codeChallengeScore, icon: FaCode, tone: 'sdm-tone-purple' },
    { label: 'Technical', value: scores.technicalRoundScore, icon: FaLaptopCode, tone: 'sdm-tone-blue' },
    { label: 'HR Round', value: scores.hrRoundScore, icon: FaUserTie, tone: 'sdm-tone-green' },
  ] : []
  const scoreTotal = scoreItems.reduce((sum, s) => sum + (s.value || 0), 0)

  const details: { label: string; value: React.ReactNode; icon: React.ComponentType<{ size?: number }> }[] = [
    { label: 'Email', icon: FaEnvelope, value: <a href={`mailto:${student.email}`}>{student.email}</a> },
    { label: 'Phone', icon: FaPhoneAlt, value: student.phoneNo ? <a href={`tel:${student.phoneNo}`}>{student.phoneNo}</a> : '—' },
    { label: 'Department', icon: FaGraduationCap, value: student.department || '—' },
    { label: 'Batch', icon: FaUsers, value: student.batch || '—' },
    { label: 'Joining year', icon: MdDateRange, value: student.joiningYear || '—' },
    { label: 'Registered', icon: FaCalendarCheck, value: fmtDate(student.createdAt) },
    { label: 'Access', icon: FaHourglassHalf, value: <AccessCell student={student} /> },
  ]

  const shownRating = hoverRating || feedbackRating

  return (
    <Modal show={show} onHide={onHide} centered scrollable dialogClassName="sdm-dialog" contentClassName="aui-modal" backdropClassName="aui-backdrop">
      <div className="aui-page sdm">
        {/* Header */}
        <div className="sdm-head">
          <span className="sdm-avatar">
            {photoUrl && !photoFailed
              ? <img src={photoUrl} alt="" onError={() => setPhotoFailed(true)} />
              : initialsOf(student.fullName)}
          </span>
          <div className="sdm-identity">
            <h3>{student.fullName}</h3>
            <div className="sdm-badges">
              {statusBadge}
              {student.batch && <span className="aui-badge aui-badge-muted">{student.batch}</span>}
              {averageRating && <span className="aui-badge aui-badge-amber"><FaStar size={9} /> {averageRating}</span>}
              {student.role && <span className="aui-badge aui-badge-blue">{student.role.charAt(0).toUpperCase() + student.role.slice(1)}</span>}
            </div>
            {student.college && <p className="sdm-college"><FaBuilding size={11} /> <span>{student.college}</span></p>}
          </div>
          <button type="button" className="aui-icon-btn" onClick={onHide} aria-label="Close"><FaTimes size={12} /></button>
        </div>

        <div className="aui-modal-body sdm-body">
          {/* Details */}
          <div className="sdm-details">
            {details.map(({ label, value, icon: Icon }) => (
              <div key={label} className="sdm-detail">
                <span className="sdm-detail-icon"><Icon size={12} /></span>
                <div>
                  <small>{label}</small>
                  <strong>{value}</strong>
                </div>
              </div>
            ))}
          </div>

          {/* Assessment scores */}
          {scores && (
            <section className="sdm-section">
              <div className="sdm-section-head">
                <span className="aui-section-label">Assessment scores</span>
                <span className="sdm-total">Total <b>{scoreTotal}</b></span>
              </div>
              <div className="sdm-scores">
                {scoreItems.map(({ label, value, icon: Icon, tone }) => (
                  <div key={label} className="sdm-score">
                    <span className={`sdm-score-icon ${tone}`}><Icon size={13} /></span>
                    <div>
                      <strong>{value ?? '—'}</strong>
                      <small>{label}</small>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Skills */}
          {student.skills && student.skills.length > 0 && (
            <section className="sdm-section">
              <span className="aui-section-label">Skills</span>
              <div className="sdm-chips">
                {student.skills.map((skill, idx) => <span key={idx} className="sdm-chip">{skill}</span>)}
              </div>
            </section>
          )}

          {/* About */}
          {student.about && (
            <section className="sdm-section">
              <span className="aui-section-label">About</span>
              <p className="sdm-about">{student.about}</p>
            </section>
          )}

          {/* Feedback history */}
          {student.feedback && student.feedback.length > 0 && (
            <section className="sdm-section">
              <div className="sdm-section-head">
                <span className="aui-section-label">Feedback history · {student.feedback.length}</span>
                {averageRating && <span className="sdm-total"><FaStar className="sdm-star" /> <b>{averageRating}</b> average</span>}
              </div>
              <div className="sdm-feedback-list">
                {student.feedback.map((fb) => (
                  <div key={fb._id} className="sdm-feedback">
                    <div className="sdm-feedback-top">
                      <span className="sdm-stars">
                        {[...Array(5)].map((_, i) => <FaStar key={i} size={11} className={i < fb.rating ? 'is-on' : ''} />)}
                      </span>
                      <small>{fmtDate(fb.date)}</small>
                    </div>
                    <p>{fb.text}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Send feedback */}
          <section className="sdm-section sdm-send">
            <span className="aui-section-label">Send feedback</span>
            {feedbackResult && (
              <div className={`aui-alert ${feedbackResult.ok ? 'aui-alert-success' : ''}`}>
                {feedbackResult.ok ? <FaCheckCircle /> : <FaTimesCircle />} <span>{feedbackResult.text}</span>
              </div>
            )}
            <form onSubmit={handleSubmitFeedback}>
              <div className="sdm-rate" onMouseLeave={() => setHoverRating(0)}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={star <= shownRating ? 'is-on' : ''}
                    onMouseEnter={() => setHoverRating(star)}
                    onClick={() => setFeedbackRating(star)}
                    aria-label={`${star} star${star > 1 ? 's' : ''}`}
                  >
                    <FaStar />
                  </button>
                ))}
                <span>{shownRating ? `${RATING_WORDS[shownRating]} · ${shownRating}/5` : 'Choose a rating'}</span>
              </div>
              <textarea
                className="aui-input sdm-textarea"
                rows={3}
                placeholder={`Write feedback for ${student.fullName.split(' ')[0]}…`}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                required
              />
              <div className="sdm-send-actions">
                <span className="aui-hint">Pick a rating and write a short note.</span>
                <button type="submit" className="aui-btn aui-btn-primary" disabled={isSubmitting || !feedbackText.trim() || feedbackRating === 0}>
                  {isSubmitting ? <><FaSpinner className="aui-spin" style={{ color: '#fff' }} /> Sending…</> : <><FaPaperPlane size={11} /> Submit Feedback</>}
                </button>
              </div>
            </form>
          </section>
        </div>

        <div className="aui-modal-foot">
          <button type="button" className="aui-btn" onClick={onHide}>Close</button>
        </div>
      </div>

      <style>{`
        .sdm-dialog { max-width: 820px; }
        .sdm { display: flex; flex-direction: column; min-height: 0; max-height: calc(100vh - 3.5rem); }
        .sdm-head { position: relative; display: flex; align-items: flex-start; gap: 16px; padding: 1.25rem 1.4rem; border-bottom: 1px solid #25282b; background: radial-gradient(ellipse at 0% 0%, rgba(255,122,0,0.16), transparent 55%), #111315; }
        .sdm-avatar { display: grid; place-items: center; width: 64px; height: 64px; flex: 0 0 64px; overflow: hidden; border: 2px solid rgba(255,122,0,0.55); border-radius: 50%; background: #25201b; color: #ffb15e; font-size: 1.25rem; font-weight: 800; box-shadow: 0 0 0 4px rgba(255,122,0,0.1); }
        .sdm-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .sdm-identity { flex: 1; min-width: 0; }
        .sdm-identity h3 { margin: 2px 0 8px; color: #fff; font-size: 1.25rem; font-weight: 800; }
        .sdm-badges { display: flex; flex-wrap: wrap; gap: 6px; }
        .sdm-college { display: flex; align-items: flex-start; gap: 7px; margin: 10px 0 0; color: #a6abb0; font-size: 0.8rem; line-height: 1.45; }
        .sdm-college svg { flex: 0 0 auto; margin-top: 3px; color: #858a90; }

        .sdm-body { padding: 1.2rem 1.4rem; }
        .sdm-details { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); overflow: hidden; border: 1px solid #25282b; border-radius: 12px; }
        .sdm-detail { display: flex; align-items: flex-start; gap: 10px; min-width: 0; padding: 0.8rem 0.9rem; border-right: 1px solid #202326; border-bottom: 1px solid #202326; }
        .sdm-detail:nth-child(3n) { border-right: 0; }
        .sdm-detail:nth-last-child(-n+3) { border-bottom: 0; }
        .sdm-detail-icon { display: grid; place-items: center; width: 28px; height: 28px; flex: 0 0 28px; border-radius: 8px; background: rgba(255,122,0,0.1); color: #ff9a3c; }
        .sdm-detail > div { display: flex; min-width: 0; flex-direction: column; gap: 2px; }
        .sdm-detail small { color: #858a90; font-size: 0.66rem; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; }
        .sdm-detail strong { overflow: hidden; color: #eceef0; font-size: 0.82rem; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
        .sdm-detail a { color: #ffb15e; text-decoration: none; }
        .sdm-detail a:hover { text-decoration: underline; }

        .sdm-section { margin-top: 1.3rem; }
        .sdm-section .aui-section-label { display: block; margin: 0 0 0.6rem; }
        .sdm-section-head { display: flex; align-items: baseline; justify-content: space-between; gap: 0.75rem; }
        .sdm-section-head .aui-section-label { margin-bottom: 0.6rem; }
        .sdm-total { color: #858a90; font-size: 0.76rem; }
        .sdm-total b { color: #fff; }
        .sdm-star { color: #f4b43f; font-size: 0.7rem; }

        .sdm-scores { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
        .sdm-score { display: flex; align-items: center; gap: 10px; padding: 0.75rem 0.85rem; border: 1px solid #25282b; border-radius: 12px; background: linear-gradient(145deg, #151719, #101214); }
        .sdm-score > div { display: flex; flex-direction: column; }
        .sdm-score strong { color: #fff; font-size: 1.3rem; font-weight: 800; line-height: 1.1; }
        .sdm-score small { color: #858a90; font-size: 0.68rem; }
        .sdm-score-icon { display: grid; place-items: center; width: 32px; height: 32px; flex: 0 0 32px; border-radius: 9px; }
        .sdm-tone-orange { background: rgba(255,122,0,0.13); color: #ff9a3c; }
        .sdm-tone-purple { background: rgba(176,132,255,0.13); color: #c4a5ff; }
        .sdm-tone-blue { background: rgba(56,189,248,0.12); color: #38bdf8; }
        .sdm-tone-green { background: rgba(49,216,102,0.13); color: #45dd75; }

        .sdm-chips { display: flex; flex-wrap: wrap; gap: 6px; }
        .sdm-chip { padding: 4px 12px; border: 1px solid rgba(255,122,0,0.3); border-radius: 99px; background: rgba(255,122,0,0.08); color: #ffb15e; font-size: 0.76rem; font-weight: 600; }
        .sdm-about { margin: 0; color: #b4b9be; font-size: 0.84rem; line-height: 1.65; }

        .sdm-feedback-list { display: flex; max-height: 220px; flex-direction: column; gap: 8px; overflow-y: auto; }
        .sdm-feedback { padding: 0.7rem 0.85rem; border: 1px solid #25282b; border-radius: 10px; background: #111315; }
        .sdm-feedback-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
        .sdm-feedback-top small { color: #6b7280; font-size: 0.7rem; }
        .sdm-feedback p { margin: 0; color: #c3c7ca; font-size: 0.8rem; line-height: 1.55; }
        .sdm-stars { display: inline-flex; gap: 2px; color: #3a3e42; }
        .sdm-stars .is-on { color: #f4b43f; }

        .sdm-send { padding-top: 1.2rem; border-top: 1px dashed #2a2e33; }
        .sdm-send .aui-alert { margin-bottom: 0.75rem; }
        .sdm-rate { display: flex; align-items: center; gap: 4px; margin-bottom: 0.65rem; }
        .sdm-rate button { padding: 2px; border: 0; background: none; color: #3a3e42; font-size: 1.35rem; line-height: 1; transition: color 0.12s, transform 0.12s; }
        .sdm-rate button.is-on { color: #ffb020; }
        .sdm-rate button:hover { transform: scale(1.12); }
        .sdm-rate span { margin-left: 8px; color: #a6abb0; font-size: 0.78rem; }
        .sdm-textarea { height: auto; min-height: 90px; padding: 0.65rem 0.8rem; line-height: 1.5; resize: vertical; }
        .sdm-send-actions { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; margin-top: 0.7rem; }

        @media (max-width: 767.98px) {
          .sdm-details { grid-template-columns: 1fr 1fr; }
          .sdm-detail:nth-child(3n) { border-right: 1px solid #202326; }
          .sdm-detail:nth-child(2n) { border-right: 0; }
          .sdm-scores { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </Modal>
  )
}

const StudentListPage: React.FC = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()

  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterBatch, setFilterBatch] = useState<string>('all')
  const [filterCollege, setFilterCollege] = useState<string>('all')
  const [filterAccess, setFilterAccess] = useState<string>('all')
  const [grantTarget, setGrantTarget] = useState<Student | null>(null)
  const [grantNotice, setGrantNotice] = useState('')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')

  const [sortBy, setSortBy] = useState<string>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [college, setCollege] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [contactMessage, setContactMessage] = useState('')
  const [contactSubject, setContactSubject] = useState('Message from Eklav')
  const [contactChannels, setContactChannels] = useState<{ email: boolean; inApp: boolean }>({ email: true, inApp: true })
  const [contactError, setContactError] = useState('')
  const [contactSent, setContactSent] = useState(false)
  const [isSendingContact, setIsSendingContact] = useState(false)

  // Bulk promotional messaging (email / in-app / WhatsApp) ──────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [messageTargets, setMessageTargets] = useState<Student[]>([])
  const [messageSubject, setMessageSubject] = useState('')
  const [messageBody, setMessageBody] = useState('')
  const [messageType, setMessageType] = useState<'custom' | 'subscription' | 'job'>('custom')
  const [messageChannels, setMessageChannels] = useState<{ email: boolean; inApp: boolean }>({ email: true, inApp: true })
  const [subscriptionPlans, setSubscriptionPlans] = useState<{ key: string; label: string; priceRupees: number }[]>([])
  const [latestJobs, setLatestJobs] = useState<{ _id: string; title: string; company?: string; location?: string; salary?: string }[]>([])
  const [sendResult, setSendResult] = useState<{ emailSent: number; emailFailed: number } | null>(null)

  // User audit: non-students + students without profile
  const [auditData, setAuditData] = useState<{
    nonStudents: { _id: string; name: string; email: string; role: string; status: string; createdAt: string }[]
    studentsWithoutProfile: { _id: string; name: string; email: string; status: string; createdAt: string }[]
  } | null>(null)
  const [auditLoading, setAuditLoading] = useState(false)
  const [showAudit, setShowAudit] = useState(false)

  const [studentsPerPage, setStudentsPerPage] = useState(50)

  // Fetch profile
  const fetchProfile = async () => {
    try {
      const res = await fetch(`${baseURL}/profile`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch profile')
      const data = await res.json()
      setCollege(data.college || null)
      setRole(data.role || null)
    } catch (err) {
      console.error('Failed to load profile', err)
    }
  }

  // Fetch all students
  const fetchAllStudents = async () => {
    try {
      const res = await fetch(`${baseURL}/adminProfiles/admin`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch students')
      const data = await res.json()
      if (Array.isArray(data)) {
        setStudents(data)
      } else if (Array.isArray(data.students)) {
        setStudents(data.students)
      } else if (Array.isArray(data.data)) {
        setStudents(data.data)
      } else {
        setStudents([])
      }
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch students by college
  const fetchStudentsByCollege = async (collegeName: string) => {
    try {
      const res = await fetch(`${baseURL}/adminProfiles/admin?college=${encodeURIComponent(collegeName)}`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch students')
      const data: Student[] = await res.json()
      setStudents(data)
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.token) fetchProfile()
  }, [user?.token])

  useEffect(() => {
    if (!user?.token || !role) return
    if (role === 'college_admin' && college) {
      fetchStudentsByCollege(college)
    } else if (role === 'admin' || role === 'super_admin') {
      fetchAllStudents()
    }
  }, [role, college, user?.token])

  // Get unique values for filters
const batches = [...new Set(students.map(s => s.batch).filter((batch): batch is string => Boolean(batch)))]
const colleges = [...new Set(students.map(s => s.college).filter((college): college is string => Boolean(college)))]

  // Filter and sort students
  let filteredStudents = students.filter(student => {
    const matchesSearch = student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.phoneNo.includes(searchTerm) ||
      (student.college && student.college.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = filterStatus === 'all' || student.status === filterStatus
    const matchesBatch = filterBatch === 'all' || student.batch === filterBatch
    const matchesCollege = filterCollege === 'all' || student.college === filterCollege

    const registeredAt = new Date(student.createdAt)
    const matchesFrom = !dateFrom || registeredAt >= new Date(dateFrom)
    const matchesTo = !dateTo || registeredAt <= new Date(dateTo + 'T23:59:59')

    const matchesAccess = filterAccess === 'all' || accessInfo(student).kind === filterAccess

    return matchesSearch && matchesStatus && matchesBatch && matchesCollege && matchesFrom && matchesTo && matchesAccess
  })

  // Sort students
  filteredStudents.sort((a, b) => {
    let comparison = 0
    switch (sortBy) {
      case 'name':
        comparison = a.fullName.localeCompare(b.fullName)
        break
      case 'date':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        break
      case 'status':
        comparison = (a.status || '').localeCompare(b.status || '')
        break
      case 'batch':
        comparison = (a.batch || '').localeCompare(b.batch || '')
        break
      case 'college':
        comparison = (a.college || '').localeCompare(b.college || '')
        break
      case 'access':
        comparison = accessInfo(a).sortValue - accessInfo(b).sortValue
        break
      default:
        comparison = 0
    }
    return sortOrder === 'asc' ? comparison : -comparison
  })

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage)
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * studentsPerPage,
    currentPage * studentsPerPage
  )

  // Fetch user audit data
  const fetchAuditData = async () => {
    if (auditData) { setShowAudit(s => !s); return }
    setAuditLoading(true)
    try {
      const res = await fetch(`${baseURL}/api/adminProfiles/user-audit`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      if (!res.ok) {
        console.error('Audit API error:', res.status, await res.text())
        return
      }
      const data = await res.json()
      if (data.success) {
        setAuditData(data)
        setShowAudit(true)
      } else {
        console.error('Audit response not successful:', data)
      }
    } catch (err) {
      console.error('Audit fetch error:', err)
    } finally {
      setAuditLoading(false)
    }
  }

  // Download Excel
  const handleDownloadExcel = () => {
    if (!filteredStudents.length) return
    const excelData = filteredStudents.map((student, index) => ({
      'S.No': index + 1,
      'Student Name': student.fullName,
      Email: student.email,
      Phone: student.phoneNo,
      College: student.college || '-',
      Batch: student.batch || '-',
      Status: student.status || '-',
      Access: accessInfo(student).label,
      Plan: student.access?.plan ? PLAN_LABEL[student.access.plan] || student.access.plan : '-',
      'Access Ends': student.access?.endDate ? shortDate(student.access.endDate) : '-',
      'Joining Year': student.joiningYear || '-',
    }))
    const worksheet = XLSX.utils.json_to_sheet(excelData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students')
    const fileName = role === 'college_admin' && college ? `Students_${college}.xlsx` : 'All_Students.xlsx'
    XLSX.writeFile(workbook, fileName)
  }

  // Send Contact Message (kept for the single-student "phone icon" flow —
  // delegates to the same bulk-send endpoint with a single target)
  const openContactModal = (student: Student) => {
    setSelectedStudent(student)
    setContactMessage('')
    setContactSubject('Message from Eklav')
    setContactChannels({ email: true, inApp: true })
    setContactError('')
    setContactSent(false)
    setShowContactModal(true)
  }

  const handleSendContact = async () => {
    if (!selectedStudent || !contactMessage.trim()) return
    const channels = [contactChannels.email && 'email', contactChannels.inApp && 'in-app'].filter(Boolean)
    if (!channels.length) { setContactError('Choose at least one way to send it.'); return }
    setIsSendingContact(true)
    setContactError('')
    try {
      const res = await fetch(`${baseURL}/admin/student-messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token}` },
        body: JSON.stringify({
          studentIds: [selectedStudent.userId || selectedStudent._id],
          subject: contactSubject.trim() || 'Message from Eklav',
          body: contactMessage,
          channels,
          messageType: 'custom',
        }),
      })
      if (!res.ok) throw new Error('Failed to send message')
      setContactSent(true)
      setContactMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
      setContactError('The message could not be sent. Please try again.')
    } finally {
      setIsSendingContact(false)
    }
  }

  // ── Bulk promotional messaging ──────────────────────────────────────────
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const toggleSelectAllVisible = (visible: Student[]) => {
    setSelectedIds(prev => {
      const allSelected = visible.length > 0 && visible.every(s => prev.has(s._id))
      if (allSelected) {
        const next = new Set(prev)
        visible.forEach(s => next.delete(s._id))
        return next
      }
      const next = new Set(prev)
      visible.forEach(s => next.add(s._id))
      return next
    })
  }

  const fetchSubscriptionPlans = async () => {
    try {
      const res = await fetch(`${baseURL}/admin/promo/subscription-plans`, { headers: { Authorization: `Bearer ${user?.token}` } })
      const data = await res.json()
      if (data.success) setSubscriptionPlans(data.plans)
    } catch { /* silent — quick-fill just won't populate */ }
  }

  const fetchLatestJobs = async () => {
    try {
      const res = await fetch(`${baseURL}/jobs/student`, { headers: { Authorization: `Bearer ${user?.token}` } })
      const data = await res.json()
      if (data.success) setLatestJobs((data.data || []).slice(0, 8))
    } catch { /* silent */ }
  }

  const openMessageModal = (targets: Student[]) => {
    setMessageTargets(targets)
    setMessageType('custom')
    setMessageSubject('')
    setMessageBody('')
    setSendResult(null)
    setShowMessageModal(true)
    fetchSubscriptionPlans()
    fetchLatestJobs()
  }

  const applySubscriptionTemplate = (plan: { key: string; label: string; priceRupees: number }) => {
    setMessageType('subscription')
    setMessageSubject(`🎉 Special Offer: ${plan.label}`)
    setMessageBody(`We have an exciting offer on our ${plan.label} plan — just ₹${plan.priceRupees}!\n\nUpgrade now to unlock premium courses, mock interviews, and placement support.\n\nDon't miss out — subscribe today!`)
  }

  const applyJobTemplate = (job: { title: string; company?: string; location?: string; salary?: string }) => {
    setMessageType('job')
    setMessageSubject(`💼 New Job Opening: ${job.title}`)
    setMessageBody(`A new opportunity is live on Eklav!\n\n${job.title}${job.company ? ` at ${job.company}` : ''}${job.location ? `\nLocation: ${job.location}` : ''}${job.salary ? `\nSalary: ${job.salary}` : ''}\n\nApply now before it closes!`)
  }

  const handleSendBulkMessage = async () => {
    if (messageTargets.length === 0 || !messageSubject.trim() || !messageBody.trim()) return
    setIsSendingContact(true)
    setSendResult(null)
    try {
      const channels = [
        ...(messageChannels.email ? ['email'] : []),
        ...(messageChannels.inApp ? ['in-app'] : []),
      ]
      const res = await fetch(`${baseURL}/admin/student-messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token}` },
        body: JSON.stringify({
          studentIds: messageTargets.map(s => s.userId || s._id),
          subject: messageSubject,
          body: messageBody,
          channels,
          messageType,
        }),
      })
      if (!res.ok) throw new Error('Failed to send message')
      const data = await res.json()
      setSendResult({ emailSent: data.emailSent, emailFailed: data.emailFailed })
    } catch (error) {
      console.error('Error sending bulk message:', error)
      alert('Failed to send message')
    } finally {
      setIsSendingContact(false)
    }
  }

  // Normalizes whatever format phoneNo happens to be stored in (bare 10-digit,
  // leading-0 local format, already-prefixed with country code, etc.) into
  // the digits-only "<countrycode><number>" wa.me expects — a raw 10-digit
  // number without a country code silently opens the wrong/no chat.
  const normalizeWhatsAppNumber = (raw: string) => {
    let digits = (raw || '').replace(/[^0-9]/g, '')
    digits = digits.replace(/^0+/, '') // strip a locally-dialled leading 0
    if (digits.length === 10) digits = `91${digits}` // bare local number — assume India
    return digits
  }

  const openWhatsApp = (student: Student) => {
    const phone = normalizeWhatsAppNumber(student.phoneNo)
    if (!phone) { alert(`No phone number on file for ${student.fullName}`); return }
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(`${messageSubject}\n\n${messageBody}`)}`, '_blank')
  }

  if (loading) {
    return (
      <AdminPage>
        <div className="aui-empty"><FaSpinner className="aui-spin" size={22} /> Loading students…</div>
      </AdminPage>
    )
  }

  const approvedCount = students.filter(s => s.status === 'approved').length
  const pendingCount = students.filter(s => (s.status || 'pending') === 'pending').length
  const rejectedCount = students.filter(s => s.status === 'rejected').length
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const isNew = (createdAt: string) => new Date(createdAt) > sevenDaysAgo
  const newCount = students.filter(s => isNew(s.createdAt)).length
  const accessCounts = students.reduce<Record<string, number>>((acc, s) => { const k = accessInfo(s).kind; acc[k] = (acc[k] || 0) + 1; return acc }, {})

  const handleSortColumn = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
    setCurrentPage(1)
  }

  const SortHeader = ({ column, label }: { column: string; label: string }) => (
    <button type="button" className={`sl-sort${sortBy === column ? ' is-active' : ''}`} onClick={() => handleSortColumn(column)}>
      {label}
      {sortBy !== column ? <FaSort /> : sortOrder === 'asc' ? <FaSortUp /> : <FaSortDown />}
    </button>
  )

  const filtersActive = !!(searchTerm || filterStatus !== 'all' || filterBatch !== 'all' || filterCollege !== 'all' || filterAccess !== 'all' || dateFrom || dateTo)
  const resetFilters = () => {
    setSearchTerm(''); setFilterStatus('all'); setFilterBatch('all'); setFilterCollege('all'); setFilterAccess('all')
    setDateFrom(''); setDateTo(''); setCurrentPage(1)
  }
  const onFilter = <T,>(setter: (v: T) => void) => (value: T) => { setter(value); setCurrentPage(1) }

  const statusBadge = (status?: string) => {
    const s = status || 'pending'
    return <span className={`aui-badge aui-badge-dot ${s === 'approved' ? 'aui-badge-green' : s === 'rejected' ? 'aui-badge-red' : 'aui-badge-amber'}`}>{s.charAt(0).toUpperCase() + s.slice(1)}</span>
  }
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  const roleLabel = (r: string) => r === 'admin' ? 'Admin' : r === 'tutor' ? 'Tutor' : r === 'instituteAdmin' ? 'Institute Admin' : r === 'collegeAdmin' ? 'College Admin' : r
  const allOnPageSelected = paginatedStudents.length > 0 && paginatedStudents.every(s => selectedIds.has(s._id))

  return (
    <>
      <PageMetaData title="Student Management | Admin Dashboard" />

      <AdminPage>
        <PageHeader
          icon={FaUserGraduate}
          title="Students"
          stats={
            <StatCards
              inline
              items={[
                { label: 'Total', value: students.length, icon: FaUsers, tone: 'orange' },
                { label: 'Approved', value: approvedCount, icon: FaCheckCircle, tone: 'green' },
                { label: 'Pending', value: pendingCount, icon: FaHourglassHalf, tone: 'amber' },
                { label: 'Rejected', value: rejectedCount, icon: FaTimesCircle, tone: 'red' },
                { label: 'Expiring · 30 days', value: accessCounts.expiring || 0, icon: FaHourglassHalf, tone: 'red' },
                { label: 'New · 7 days', value: newCount, icon: FaUserPlus, tone: 'blue' },
              ]}
            />
          }
          actions={
            <>
              <button type="button" className="aui-btn" onClick={fetchAuditData} disabled={auditLoading}>
                {auditLoading ? <FaSpinner className="aui-spin" size={11} /> : <FaUserShield size={11} />} {showAudit ? 'Hide Audit' : 'User Audit'}
              </button>
              <button type="button" className="aui-btn aui-btn-primary" onClick={handleDownloadExcel} disabled={filteredStudents.length === 0}>
                <FaDownload size={11} /> Export Excel
              </button>
            </>
          }
        />

        {/* ── User audit ── */}
        {showAudit && auditData && (
          <div className="sl-audit">
            <div className="aui-card">
              <div className="aui-toolbar">
                <div className="aui-toolbar-title">
                  <h3><FaUserShield className="sl-title-icon" /> Non-Student Users <span className="aui-badge aui-badge-muted">{auditData.nonStudents.length}</span></h3>
                  <p>Admins, tutors, institute admins and college admins</p>
                </div>
              </div>
              <div className="aui-table-scroll sl-audit-scroll">
                <table className="aui-table">
                  <thead><tr><th style={{ width: 44 }}>#</th><th>User</th><th>Role</th><th>Status</th><th>Registered</th></tr></thead>
                  <tbody>
                    {auditData.nonStudents.length === 0 ? (
                      <tr><td colSpan={5}><span className="aui-num">No records</span></td></tr>
                    ) : auditData.nonStudents.map((u, i) => (
                      <tr key={u._id}>
                        <td className="aui-num">{i + 1}</td>
                        <td><div className="aui-person"><span className="aui-avatar">{initialsOf(u.name || u.email)}</span><div className="aui-stack"><strong>{u.name || '—'}</strong><small>{u.email}</small></div></div></td>
                        <td><span className="aui-badge aui-badge-purple">{roleLabel(u.role)}</span></td>
                        <td>{statusBadge(u.status)}</td>
                        <td className="aui-num">{fmtDate(u.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="aui-card">
              <div className="aui-toolbar">
                <div className="aui-toolbar-title">
                  <h3><FaExclamationTriangle className="sl-title-icon is-warn" /> Students Without Profile <span className={`aui-badge ${auditData.studentsWithoutProfile.length ? 'aui-badge-amber' : 'aui-badge-green'}`}>{auditData.studentsWithoutProfile.length}</span></h3>
                  <p>Registered accounts with no profile record — the source of count mismatches</p>
                </div>
              </div>
              {auditData.studentsWithoutProfile.length === 0 ? (
                <div className="sl-audit-ok"><FaCheckCircle /> Every student has a profile — no mismatch</div>
              ) : (
                <div className="aui-table-scroll sl-audit-scroll">
                  <table className="aui-table">
                    <thead><tr><th style={{ width: 44 }}>#</th><th>Student</th><th>Status</th><th>Registered</th></tr></thead>
                    <tbody>
                      {auditData.studentsWithoutProfile.map((u, i) => (
                        <tr key={u._id}>
                          <td className="aui-num">{i + 1}</td>
                          <td><div className="aui-person"><span className="aui-avatar">{initialsOf(u.name || u.email)}</span><div className="aui-stack"><strong>{u.name || '—'}</strong><small>{u.email}</small></div></div></td>
                          <td>{statusBadge(u.status)}</td>
                          <td className="aui-num">{fmtDate(u.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {grantNotice && (
          <div className="aui-alert aui-alert-success"><FaCheckCircle /> <span>{grantNotice}</span>
            <button type="button" className="aui-alert-close" onClick={() => setGrantNotice('')} aria-label="Dismiss"><FaTimes size={11} /></button>
          </div>
        )}

        {/* ── Students table ── */}
        <div className="aui-card">
          <div className="aui-toolbar">
            <SearchInput value={searchTerm} onChange={onFilter(setSearchTerm)} placeholder="Search name, email, phone or college…" />
            <div className="aui-toolbar-filters">
              <AdminSelect
                label="Status"
                prefix="Status:"
                value={filterStatus}
                options={[
                  { value: 'all', label: `All (${students.length})` },
                  { value: 'approved', label: `Approved (${approvedCount})` },
                  { value: 'pending', label: `Pending (${pendingCount})` },
                  { value: 'rejected', label: `Rejected (${rejectedCount})` },
                ]}
                onChange={onFilter(setFilterStatus)}
              />
              <AdminSelect
                label="Access"
                prefix="Access:"
                value={filterAccess}
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'expiring', label: `Ending in 30 days (${accessCounts.expiring || 0})` },
                  { value: 'expired', label: `Expired (${accessCounts.expired || 0})` },
                  { value: 'active', label: `Active plan (${accessCounts.active || 0})` },
                  { value: 'unlimited', label: `No expiry (${accessCounts.unlimited || 0})` },
                  { value: 'module', label: `Single module (${accessCounts.module || 0})` },
                  { value: 'none', label: `No plan (${accessCounts.none || 0})` },
                ]}
                onChange={onFilter(setFilterAccess)}
              />
              <div className="sl-dates" title="Registered between">
                <MdDateRange />
                <input type="date" className="aui-date" aria-label="Registered from" value={dateFrom} max={dateTo || undefined} onChange={e => { setDateFrom(e.target.value); setCurrentPage(1) }} />
                <span>–</span>
                <input type="date" className="aui-date" aria-label="Registered to" value={dateTo} min={dateFrom || undefined} onChange={e => { setDateTo(e.target.value); setCurrentPage(1) }} />
              </div>
              {filtersActive && (
                <button type="button" className="aui-btn" onClick={resetFilters}><FaTimes size={10} /> Reset</button>
              )}
            </div>
          </div>

          {selectedIds.size > 0 && (
            <div className="sl-bulk">
              <span><b>{selectedIds.size}</b> student{selectedIds.size === 1 ? '' : 's'} selected</span>
              <div>
                <button type="button" className="aui-btn aui-btn-sm" onClick={() => setSelectedIds(new Set())}>Clear selection</button>
                <button type="button" className="aui-btn aui-btn-sm aui-btn-primary" onClick={() => openMessageModal(students.filter(s => selectedIds.has(s._id)))}>
                  <FaRegEnvelope size={11} /> Message Selected
                </button>
              </div>
            </div>
          )}

          {paginatedStudents.length === 0 ? (
            <EmptyState
              icon={FaUserGraduate}
              title={students.length ? 'No students match' : 'No students yet'}
              text={students.length ? 'Try a different search or filter.' : 'Students appear here once they register.'}
              action={filtersActive ? <button type="button" className="aui-btn aui-btn-sm" onClick={resetFilters}>Clear filters</button> : undefined}
            />
          ) : (
            <>
              <div className="aui-table-scroll">
                <table className="aui-table sl-table">
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>
                        <input type="checkbox" className="sl-check" aria-label="Select all on this page" checked={allOnPageSelected} onChange={() => toggleSelectAllVisible(paginatedStudents)} />
                      </th>
                      <th style={{ width: 44 }}>#</th>
                      <th><SortHeader column="name" label="Student" /></th>
                      <th style={{ width: 130 }}>Phone</th>
                      <th style={{ width: 120 }}><SortHeader column="status" label="Status" /></th>
                      <th style={{ width: 190 }}><SortHeader column="access" label="Access" /></th>
                      <th style={{ width: 130 }}><SortHeader column="date" label="Registered" /></th>
                      <th style={{ width: 200 }} className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedStudents.map((student, idx) => {
                      const selected = selectedIds.has(student._id)
                      return (
                        <tr key={student._id} className={selected ? 'is-selected' : ''}>
                          <td><input type="checkbox" className="sl-check" aria-label={`Select ${student.fullName}`} checked={selected} onChange={() => toggleSelect(student._id)} /></td>
                          <td className="aui-num">{(currentPage - 1) * studentsPerPage + idx + 1}</td>
                          <td>
                            <div className="aui-person">
                              <StudentAvatar name={student.fullName} image={student.profileImage} baseURL={baseURL} />
                              <div className="aui-stack">
                                <strong>
                                  {student.fullName}
                                  {isNew(student.createdAt) && <span className="aui-badge aui-badge-blue sl-new">New</span>}
                                </strong>
                                <small>{student.email}</small>
                              </div>
                            </div>
                          </td>
                          <td>{student.phoneNo ? <span className="aui-inline-icon"><FaPhoneAlt /> {student.phoneNo}</span> : <span className="aui-num">—</span>}</td>
                          <td>{statusBadge(student.status)}</td>
                          <td><AccessCell student={student} /></td>
                          <td className="aui-num">{fmtDate(student.createdAt)}</td>
                          <td className="text-end">
                            <div className="sl-actions">
                              {(() => {
                                const kind = accessInfo(student).kind
                                if (student.status !== 'approved' || kind === 'expired') {
                                  return (
                                    <button type="button" className="aui-btn aui-btn-sm sl-approve" onClick={() => setGrantTarget(student)} title="Approve and set how long they can use the app">
                                      <FaCheckCircle size={10} /> Approve
                                    </button>
                                  )
                                }
                                if (kind === 'active' || kind === 'expiring') {
                                  return (
                                    <button type="button" className={`aui-icon-btn${kind === 'expiring' ? ' sl-extend-soon' : ''}`} onClick={() => setGrantTarget(student)} title="Extend access" aria-label={`Extend access for ${student.fullName}`}>
                                      <FaCalendarCheck size={11} />
                                    </button>
                                  )
                                }
                                return null
                              })()}
                              <button type="button" className="aui-btn aui-btn-sm" onClick={() => { setSelectedStudent(student); setShowDetailsModal(true) }}>
                                <FaEye size={11} /> View
                              </button>
                              <button type="button" className="aui-icon-btn" title="Message student" aria-label={`Message ${student.fullName}`} onClick={() => openContactModal(student)}>
                                <FaRegEnvelope size={11} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <TableFooter
                page={currentPage}
                pageSize={studentsPerPage}
                total={filteredStudents.length}
                onPageChange={setCurrentPage}
                pageSizeOptions={[25, 50, 100]}
                onPageSizeChange={size => { setStudentsPerPage(size); setCurrentPage(1) }}
                noun="students"
              />
            </>
          )}
        </div>

        <GrantAccessModal
          show={!!grantTarget}
          student={grantTarget}
          baseURL={baseURL}
          token={user?.token}
          onHide={() => setGrantTarget(null)}
          onDone={({ status, access }) => {
            const target = grantTarget
            setStudents(prev => prev.map(s => (s._id === target?._id ? { ...s, status, access } : s)))
            setGrantNotice(`${target?.fullName} approved${access?.endDate ? ` until ${shortDate(access.endDate)}` : ' with no end date'}.`)
            setGrantTarget(null)
          }}
        />

        <style>{`
          .aui-modal-head > .aui-avatar { width: 44px; height: 44px; flex: 0 0 44px; font-size: 0.9rem; }
          .cm-body { display: flex; flex-direction: column; gap: 0.95rem; }
          .cm-body .aui-field { margin-bottom: 0; }
          .cm-quick { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
          .cm-quick-btn { display: flex; align-items: center; gap: 10px; min-width: 0; padding: 0.6rem 0.8rem; border: 1px solid #25282b; border-radius: 10px; background: #111315; color: #e5e7eb; font-size: 0.82rem; text-decoration: none; transition: border-color 0.15s, background 0.15s; }
          .cm-quick-btn > svg { flex: 0 0 auto; color: #ff9a3c; }
          .cm-quick-btn > span { display: flex; flex-direction: column; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .cm-quick-btn small { color: #6b7280; font-size: 0.66rem; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; }
          a.cm-quick-btn:hover { border-color: rgba(255,122,0,0.5); background: rgba(255,122,0,0.05); color: #fff; }
          .cm-quick-btn.is-off { opacity: 0.55; }
          .cm-textarea { height: auto; min-height: 120px; padding: 0.65rem 0.8rem; line-height: 1.55; resize: vertical; }
          .cm-count { align-self: flex-end; color: #6b7280; font-size: 0.7rem; }
          .cm-channels { display: flex; flex-wrap: wrap; gap: 8px; }
          .cm-channel { display: inline-flex; align-items: center; gap: 8px; padding: 0.45rem 0.8rem; border: 1px solid #2c3034; border-radius: 99px; background: #141618; color: #9da2a8; font-size: 0.8rem; font-weight: 600; cursor: pointer; }
          .cm-channel.is-on { border-color: rgba(255,122,0,0.55); background: rgba(255,122,0,0.08); color: #ffb15e; }
          .cm-channel-box { display: grid; place-items: center; width: 16px; height: 16px; border: 1px solid #3a3f45; border-radius: 50%; }
          .cm-channel.is-on .cm-channel-box { border-color: transparent; color: #ff7a00; }
          .cm-sent { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 2rem 1.5rem !important; text-align: center; }
          .cm-sent-icon { display: grid; place-items: center; width: 56px; height: 56px; margin-bottom: 4px; border-radius: 50%; background: rgba(49,216,102,0.12); color: #45dd75; font-size: 1.6rem; }
          .cm-sent h4 { margin: 0; color: #fff; font-size: 1.05rem; }
          .cm-sent p { margin: 0 0 0.8rem; color: #9da2a8; font-size: 0.84rem; }
          .cm-sent-actions { display: flex; gap: 8px; }
          @media (max-width: 575.98px) { .cm-quick { grid-template-columns: 1fr; } }
          .sl-approve { border-color: rgba(49,216,102,0.45) !important; background: rgba(49,216,102,0.1) !important; color: #45dd75 !important; }
          .sl-approve:hover:not(:disabled) { border-color: rgba(49,216,102,0.7) !important; background: rgba(49,216,102,0.18) !important; }
          .sl-extend-soon { border-color: rgba(244,180,63,0.55) !important; color: #f4b43f !important; }
          .sl-access { display: flex; flex-direction: column; gap: 1px; min-width: 150px; }
          .sl-access strong { display: inline-flex; align-items: center; gap: 6px; font-size: 0.8rem; font-weight: 700; }
          .sl-access small { overflow: hidden; color: #6b7280 !important; font-size: 0.7rem !important; font-weight: 500 !important; letter-spacing: 0 !important; text-overflow: ellipsis; text-transform: none !important; white-space: nowrap; }
          .sl-access.is-green strong { color: #45dd75; }
          .sl-access.is-amber strong { color: #f4b43f; }
          .sl-access.is-red strong { color: #fb737a; }
          .sl-access.is-blue strong { color: #7dd3fc; }
          .sl-access.is-purple strong { color: #c4b5fd; }
          .sl-access.is-muted strong { color: #6b7280; font-weight: 600; }
          .sl-access-dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; box-shadow: 0 0 0 3px color-mix(in srgb, currentColor 25%, transparent); }
          .sl-audit { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
          .sl-audit .aui-card { margin-top: 1.25rem; }
          .sl-audit-scroll { max-height: 300px; overflow-y: auto; }
          .sl-audit-scroll thead th { position: sticky; top: 0; z-index: 1; background: #17191b; }
          .sl-audit-ok { display: flex; align-items: center; gap: 8px; padding: 1.4rem 1rem; color: #45dd75; font-size: 0.84rem; }
          .sl-title-icon { margin-right: 6px; color: #ff9a3c; font-size: 0.85rem; vertical-align: -1px; }
          .sl-title-icon.is-warn { color: #f4b43f; }
          .aui-toolbar-title h3 .aui-badge { margin-left: 6px; vertical-align: 2px; }

          .sl-college .aui-dropdown-value { max-width: 180px; overflow: hidden; text-overflow: ellipsis; }
          .sl-college .aui-dropdown-menu { min-width: 280px; max-width: 360px; }
          .sl-college .aui-dropdown-menu button { white-space: normal; }
          .sl-dates { display: inline-flex; align-items: center; gap: 6px; color: #858a90; font-size: 0.75rem; }
          .sl-dates > svg { color: #9aa0a6; }
          .sl-dates .aui-date { width: 132px; }

          .sl-bulk { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; flex-wrap: wrap; padding: 0.55rem 0.85rem; border-bottom: 1px solid #25282b; background: rgba(255, 122, 0, 0.07); color: #d1d5db; font-size: 0.8rem; }
          .sl-bulk b { color: #ffb15e; }
          .sl-bulk > div { display: flex; gap: 8px; }

          .sl-check { width: 15px; height: 15px; accent-color: #ff7a00; color-scheme: dark; cursor: pointer; vertical-align: middle; }
          .sl-table tbody tr.is-selected { background: rgba(255, 122, 0, 0.05); }
          .sl-photo { object-fit: cover; padding: 0; }
          .sl-new { margin-left: 8px; vertical-align: 1px; }
          .sl-college-text { display: block; max-width: 260px; overflow: hidden; color: #c3c7ca; font-size: 0.78rem; text-overflow: ellipsis; white-space: nowrap; }
          .sl-actions { display: inline-flex; gap: 6px; }

          .sl-sort { display: inline-flex; align-items: center; gap: 5px; padding: 0; border: 0; background: none; color: inherit; font: inherit; letter-spacing: inherit; text-transform: inherit; cursor: pointer; }
          .sl-sort svg { color: #5b616a; font-size: 0.6rem; }
          .sl-sort:hover, .sl-sort.is-active { color: #ff9a3c; }
          .sl-sort.is-active svg { color: #ff9a3c; }

          @media (max-width: 1199.98px) { .sl-audit { grid-template-columns: 1fr; } }
        `}</style>
      </AdminPage>


      {/* Student Details Modal */}
      <StudentDetailsModal
        show={showDetailsModal}
        onHide={() => setShowDetailsModal(false)}
        student={selectedStudent}
      />

      {/* Contact Modal */}
      <Modal show={showContactModal} onHide={() => !isSendingContact && setShowContactModal(false)} centered contentClassName="aui-modal" backdropClassName="aui-backdrop">
        {selectedStudent && (
          <div className="aui-page">
            <div className="aui-modal-head">
              <StudentAvatar name={selectedStudent.fullName} image={selectedStudent.profileImage} baseURL={baseURL} />
              <div>
                <h3>{selectedStudent.fullName}</h3>
                <p>Send a message · {selectedStudent.email}</p>
              </div>
              <button type="button" className="aui-icon-btn" onClick={() => setShowContactModal(false)} disabled={isSendingContact} aria-label="Close"><FaTimes size={12} /></button>
            </div>

            {contactSent ? (
              <div className="aui-modal-body cm-sent">
                <span className="cm-sent-icon"><FaCheckCircle /></span>
                <h4>Message sent</h4>
                <p>{selectedStudent.fullName.split(' ')[0]} will get it by {[contactChannels.email && 'email', contactChannels.inApp && 'in-app notification'].filter(Boolean).join(' and ')}.</p>
                <div className="cm-sent-actions">
                  <button type="button" className="aui-btn" onClick={() => setContactSent(false)}>Send another</button>
                  <button type="button" className="aui-btn aui-btn-primary" onClick={() => setShowContactModal(false)}>Done</button>
                </div>
              </div>
            ) : (
              <>
                <div className="aui-modal-body cm-body">
                  <div className="cm-quick">
                    {selectedStudent.phoneNo ? (
                      <a href={`tel:${selectedStudent.phoneNo}`} className="cm-quick-btn"><FaPhoneAlt /> <span><small>Call</small>{selectedStudent.phoneNo}</span></a>
                    ) : (
                      <span className="cm-quick-btn is-off"><FaPhoneAlt /> <span><small>Call</small>No phone number</span></span>
                    )}
                    <a href={`mailto:${selectedStudent.email}`} className="cm-quick-btn"><FaEnvelope /> <span><small>Open in mail app</small>{selectedStudent.email}</span></a>
                  </div>

                  {contactError && <div className="aui-alert"><FaExclamationTriangle /> <span>{contactError}</span></div>}

                  <div className="aui-field">
                    <label className="aui-label" htmlFor="cm-subject">Subject</label>
                    <input id="cm-subject" className="aui-input" value={contactSubject} maxLength={120} onChange={(e) => setContactSubject(e.target.value)} />
                  </div>
                  <div className="aui-field">
                    <label className="aui-label" htmlFor="cm-message">Message</label>
                    <textarea
                      id="cm-message"
                      className="aui-input cm-textarea"
                      rows={5}
                      maxLength={2000}
                      placeholder={`Hi ${selectedStudent.fullName.split(' ')[0]}, …`}
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSendContact() }}
                      autoFocus
                    />
                    <span className="cm-count">{contactMessage.length} / 2000 · Ctrl + Enter to send</span>
                  </div>

                  <div className="aui-field" style={{ marginBottom: 0 }}>
                    <span className="aui-label">Send by</span>
                    <div className="cm-channels">
                      {([['email', 'Email', FaEnvelope], ['inApp', 'In-app notification', FaRegEnvelope]] as const).map(([key, label, Icon]) => (
                        <button
                          key={key}
                          type="button"
                          className={`cm-channel${contactChannels[key] ? ' is-on' : ''}`}
                          aria-pressed={contactChannels[key]}
                          onClick={() => setContactChannels((c) => ({ ...c, [key]: !c[key] }))}
                        >
                          <span className="cm-channel-box">{contactChannels[key] && <FaCheckCircle size={11} />}</span>
                          <Icon size={12} /> {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="aui-modal-foot">
                  <button type="button" className="aui-btn" onClick={() => setShowContactModal(false)} disabled={isSendingContact}>Cancel</button>
                  <button type="button" className="aui-btn aui-btn-primary" onClick={handleSendContact} disabled={isSendingContact || !contactMessage.trim()}>
                    {isSendingContact ? <FaSpinner className="aui-spin" style={{ color: '#fff' }} /> : <FaPaperPlane size={11} />} Send message
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Bulk Promotional Message Modal */}
      <Modal show={showMessageModal} onHide={() => setShowMessageModal(false)} centered size="lg" className="contact-modal" backdropClassName="aui-backdrop">
        <div className="modal-hero-header position-relative overflow-hidden rounded-top-3" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)' }}>
          <div className="position-absolute top-0 end-0 p-3">
            <button type="button" className="btn-close btn-close-white opacity-75" onClick={() => setShowMessageModal(false)} aria-label="Close" />
          </div>
          <div className="p-4 pb-3">
            <h6 className="text-white fw-bold mb-0">Message {messageTargets.length} Student{messageTargets.length !== 1 ? 's' : ''}</h6>
            <small className="text-white-50">Promote a subscription offer, a new job, or send a custom message</small>
          </div>
        </div>
        <Modal.Body className="modal-body-dark p-4">
          {sendResult ? (
            <div className="text-center py-3">
              <FaCheckCircle size={36} className="text-success mb-3" />
              <h6 className="text-white">Message sent</h6>
              <p className="text-muted small mb-3">
                Email: {sendResult.emailSent} sent{sendResult.emailFailed > 0 ? `, ${sendResult.emailFailed} failed` : ''}. In-app notification delivered to all selected students.
              </p>
              <p className="text-muted small mb-4">
                For WhatsApp, use the per-student buttons below — each opens a pre-filled chat you send manually.
              </p>
              <div className="d-flex flex-wrap gap-2 justify-content-center mb-3">
                {messageTargets.filter(s => s.phoneNo).map(s => (
                  <Button key={s._id} size="sm" variant="outline-success" title={`+${normalizeWhatsAppNumber(s.phoneNo)}`} onClick={() => openWhatsApp(s)}>
                    WhatsApp {s.fullName.split(' ')[0]} ({s.phoneNo})
                  </Button>
                ))}
              </div>
              <Button size="sm" variant="outline-secondary" onClick={() => setShowMessageModal(false)}>Close</Button>
            </div>
          ) : (
            <>
              {/* Quick-fill templates */}
              <div className="mb-3">
                <div className="text-muted small fw-semibold mb-2">Quick fill</div>
                <div className="d-flex flex-wrap gap-2">
                  {subscriptionPlans.map(plan => (
                    <Button key={plan.key} size="sm" variant={messageType === 'subscription' ? 'orange' : 'outline-secondary'}
                      className={messageType === 'subscription' ? 'btn-orange' : ''}
                      onClick={() => applySubscriptionTemplate(plan)}>
                      🎉 {plan.label} — ₹{plan.priceRupees}
                    </Button>
                  ))}
                  {latestJobs.slice(0, 4).map(job => (
                    <Button key={job._id} size="sm" variant={messageType === 'job' ? 'orange' : 'outline-secondary'}
                      className={messageType === 'job' ? 'btn-orange' : ''}
                      onClick={() => applyJobTemplate(job)}>
                      💼 {job.title}
                    </Button>
                  ))}
                  <Button size="sm" variant={messageType === 'custom' ? 'orange' : 'outline-secondary'}
                    className={messageType === 'custom' ? 'btn-orange' : ''}
                    onClick={() => { setMessageType('custom'); setMessageSubject(''); setMessageBody('') }}>
                    ✏️ Custom
                  </Button>
                </div>
              </div>

              <Form.Control
                placeholder="Subject"
                value={messageSubject}
                onChange={e => setMessageSubject(e.target.value)}
                className="modal-textarea mb-2"
              />
              <Form.Control
                as="textarea"
                rows={5}
                placeholder="Type your message..."
                value={messageBody}
                onChange={e => setMessageBody(e.target.value)}
                className="modal-textarea mb-3"
              />

              <div className="d-flex align-items-center gap-4 mb-3">
                <Form.Check
                  type="checkbox"
                  label="Email"
                  checked={messageChannels.email}
                  onChange={e => setMessageChannels(c => ({ ...c, email: e.target.checked }))}
                  className="text-white"
                />
                <Form.Check
                  type="checkbox"
                  label="In-app notification"
                  checked={messageChannels.inApp}
                  onChange={e => setMessageChannels(c => ({ ...c, inApp: e.target.checked }))}
                  className="text-white"
                />
              </div>

              {messageTargets.some(s => s.phoneNo) && (
                <div className="mb-3">
                  <div className="text-muted small fw-semibold mb-2">WhatsApp (opens one chat per student, sent manually)</div>
                  <div className="d-flex flex-wrap gap-2">
                    {messageTargets.filter(s => s.phoneNo).map(s => (
                      <Button key={s._id} size="sm" variant="outline-success" disabled={!messageSubject.trim() && !messageBody.trim()} onClick={() => openWhatsApp(s)}>
                        WhatsApp {s.fullName.split(' ')[0]}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="d-flex gap-2 justify-content-end">
                <Button variant="outline-secondary" size="sm" onClick={() => setShowMessageModal(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="btn-orange"
                  onClick={handleSendBulkMessage}
                  disabled={isSendingContact || !messageSubject.trim() || !messageBody.trim() || (!messageChannels.email && !messageChannels.inApp)}
                >
                  {isSendingContact ? <FaSpinner className="spinner me-1" size={12} /> : null}
                  Send to {messageTargets.length} student{messageTargets.length !== 1 ? 's' : ''}
                </Button>
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>

      {/* Global Styles */}
      <style>{`
        .bg-dark-lighter {
          background-color: #2a2a2a;
        }
        .bg-orange {
          background-color: #ff8c00;
        }
        .text-orange {
          color: #ff8c00;
        }
        .border-orange {
          border-color: #ff8c00;
        }
        .btn-orange {
          background-color: #ff8c00;
          border-color: #ff8c00;
          color: white;
        }
        .btn-orange:hover {
          background-color: #e67e00;
          border-color: #e67e00;
          color: white;
        }
        .btn-outline-orange {
          border-color: #ff8c00;
          color: #ff8c00;
        }
        .btn-outline-orange:hover {
          background-color: #ff8c00;
          color: white;
        }
        .student-card {
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .student-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(255, 140, 0, 0.15);
        }
        .cursor-pointer {
          cursor: pointer;
        }
        .spinner {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        /* ── Modal Base ── */
        .modal-content {
          background-color: #141414;
          border: 1px solid rgba(255, 140, 0, 0.15);
          border-radius: 16px !important;
          overflow: hidden;
          box-shadow: 0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,140,0,0.08);
        }
        .modal-backdrop {
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          background-color: rgba(0, 0, 0, 0.65);
        }
        body.modal-open .admin-dashboard {
          filter: blur(4px);
          transition: filter 0.2s ease;
          pointer-events: none;
        }

        /* ── Modal Hero Header ── */
        .modal-hero-header {
          background: linear-gradient(135deg, #1c1c1c 0%, #252525 60%, #1a1a1a 100%);
          border-bottom: 1px solid rgba(255, 140, 0, 0.12);
        }
        .modal-hero-bg {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at top left, rgba(255,140,0,0.08) 0%, transparent 60%);
          pointer-events: none;
        }
        .modal-avatar {
          width: 72px;
          height: 72px;
          object-fit: cover;
          border: 3px solid rgba(255,140,0,0.4);
          box-shadow: 0 0 0 4px rgba(255,140,0,0.08);
        }
        .modal-avatar-initials {
          width: 72px;
          height: 72px;
          background: linear-gradient(135deg, #ff8c00, #e67e00);
          color: white;
          font-size: 22px;
          font-weight: 700;
          letter-spacing: 1px;
          border: 3px solid rgba(255,140,0,0.4);
          box-shadow: 0 0 0 4px rgba(255,140,0,0.08);
        }

        /* ── Modal Body ── */
        .modal-body-dark {
          background-color: #141414;
          color: #e0e0e0;
        }

        /* ── Info Cards ── */
        .modal-info-card {
          background: #1e1e1e;
          border: 1px solid #2a2a2a;
          border-radius: 12px;
          padding: 1rem 1.25rem;
        }
        .modal-info-card-title {
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          color: #6c757d;
          margin-bottom: 0.75rem;
          display: flex;
          align-items: center;
        }
        .modal-info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.45rem 0;
          border-bottom: 1px solid #252525;
        }
        .modal-info-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .modal-info-label {
          font-size: 0.8rem;
          color: #6c757d;
          flex-shrink: 0;
        }
        .modal-info-value {
          font-size: 0.85rem;
          color: #e0e0e0;
          font-weight: 500;
          text-align: right;
          max-width: 60%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* ── Score Tiles ── */
        .score-tile {
          background: #252525;
          border: 1px solid #333;
          border-radius: 10px;
          padding: 0.75rem 0.5rem;
        }
        .score-tile-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #ff8c00;
          line-height: 1;
        }
        .score-tile-label {
          font-size: 0.65rem;
          color: #6c757d;
          margin-top: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* ── Skill Chips ── */
        .skill-chip {
          background: rgba(255,140,0,0.08);
          border: 1px solid rgba(255,140,0,0.2);
          color: #ff8c00;
          border-radius: 20px;
          padding: 3px 12px;
          font-size: 0.78rem;
          font-weight: 500;
        }

        /* ── Feedback ── */
        .feedback-scroll {
          max-height: 180px;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: #333 transparent;
        }
        .feedback-item {
          background: #252525;
          border-radius: 8px;
          padding: 0.6rem 0.75rem;
          margin-bottom: 0.5rem;
        }
        .feedback-item:last-child { margin-bottom: 0; }
        .avg-rating-badge {
          background: rgba(255,193,7,0.1);
          border: 1px solid rgba(255,193,7,0.25);
          color: #ffc107;
          border-radius: 20px;
          padding: 2px 10px;
          font-size: 0.75rem;
          font-weight: 600;
          display: flex;
          align-items: center;
        }

        /* ── Modal Textarea ── */
        .modal-textarea {
          background: #252525 !important;
          border: 1px solid #333 !important;
          color: #e0e0e0 !important;
          border-radius: 10px !important;
          resize: none;
        }
        .modal-textarea:focus {
          border-color: rgba(255,140,0,0.5) !important;
          box-shadow: 0 0 0 3px rgba(255,140,0,0.1) !important;
          outline: none;
        }
        .modal-textarea::placeholder { color: #555 !important; }

        /* ── Contact Quick Buttons ── */
        .contact-quick-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #1e1e1e;
          border: 1px solid #2a2a2a;
          border-radius: 10px;
          padding: 0.6rem 1rem;
          font-size: 0.8rem;
          color: #e0e0e0;
          text-decoration: none;
          transition: border-color 0.2s, background 0.2s;
        }
        .contact-quick-btn:hover {
          border-color: rgba(255,140,0,0.4);
          background: rgba(255,140,0,0.05);
          color: #ff8c00;
        }
        .table-dark {
          background-color: #1a1a1a;
        }
        .sortable-th:hover {
          color: #ff8c00 !important;
          background: rgba(255,140,0,0.05);
        }
        .stat-card {
          transition: transform 0.2s;
        }
        .stat-card:hover {
          transform: translateY(-2px);
        }
        .date-range-input {
          background: transparent;
          border: none;
          color: #e0e0e0;
          font-size: 0.8rem;
          outline: none;
          width: 120px;
          color-scheme: dark;
        }
        .date-range-input::-webkit-calendar-picker-indicator {
          filter: invert(0.6);
          cursor: pointer;
        }
        .form-control:focus, .form-select:focus {
          border-color: #ff8c00;
          box-shadow: 0 0 0 0.2rem rgba(255, 140, 0, 0.25);
        }

        /* Professional Pagination Styles */
        .professional-pagination {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 2rem;
          padding: 1rem 1.5rem;
          background: linear-gradient(135deg, #1e1e1e 0%, #2a2a2a 100%);
          border-radius: 16px;
          border: 1px solid rgba(255, 140, 0, 0.2);
          flex-wrap: wrap;
          gap: 1rem;
        }

        .pagination-info {
          color: #6c757d;
          font-size: 0.875rem;
          font-weight: 500;
          letter-spacing: 0.3px;
        }

        .pagination-controls {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          flex-wrap: wrap;
        }

        .pagination-btn {
          min-width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #1a1a1a;
          border: 1px solid #3a3a3a;
          color: #e0e0e0;
          border-radius: 10px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 0 0.75rem;
        }

        .pagination-btn:hover:not(:disabled) {
          background: #ff8c00;
          border-color: #ff8c00;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 140, 0, 0.3);
        }

        .pagination-btn.active {
          background: #ff8c00;
          border-color: #ff8c00;
          color: white;
          box-shadow: 0 4px 12px rgba(255, 140, 0, 0.3);
        }

        .pagination-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .pagination-dots {
          color: #6c757d;
          padding: 0 0.5rem;
          font-weight: 600;
          letter-spacing: 2px;
        }

        .pagination-stats {
          color: #6c757d;
          font-size: 0.875rem;
          font-weight: 500;
          background: rgba(255, 140, 0, 0.1);
          padding: 0.5rem 1rem;
          border-radius: 20px;
          border: 1px solid rgba(255, 140, 0, 0.2);
        }

        @media (max-width: 768px) {
          .professional-pagination {
            flex-direction: column;
            align-items: center;
          }
          
          .pagination-btn {
            min-width: 36px;
            height: 36px;
            font-size: 0.75rem;
          }
          
          .pagination-stats {
            font-size: 0.75rem;
          }
        }

        /* ── User Audit ── */
        .audit-section { }
        .audit-card {
          background: #161616;
          border: 1px solid #252525;
          border-radius: 12px;
          overflow: hidden;
        }
        .audit-card-header {
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px;
          padding: 12px 18px;
          background: #1a1a1a;
          border-bottom: 1px solid #252525;
          font-size: 0.82rem; font-weight: 600; color: #e0e0e0;
        }
        .audit-sub { font-size: 0.72rem; color: #6c757d; font-weight: 400; }
        .audit-badge {
          background: rgba(255,140,0,0.15); color: #ff8c00;
          border: 1px solid rgba(255,140,0,0.3);
          border-radius: 20px; padding: 1px 8px; font-size: 0.7rem; font-weight: 700;
        }
        .audit-badge-warn {
          background: rgba(255,193,7,0.12); color: #ffc107;
          border-color: rgba(255,193,7,0.3);
        }
        .audit-table-wrap { overflow-x: auto; }
        .audit-table {
          width: 100%; border-collapse: collapse; font-size: 0.8rem;
        }
        .audit-table thead th {
          background: #0e0e0e; color: #6c757d;
          padding: 8px 14px; text-align: left;
          font-size: 0.68rem; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;
          border-bottom: 1px solid #252525;
          white-space: nowrap;
        }
        .audit-table tbody tr {
          border-bottom: 1px solid #1e1e1e;
          transition: background 0.12s;
        }
        .audit-table tbody tr:hover { background: #1e1e1e; }
        .audit-table tbody td { padding: 9px 14px; color: #ccc; vertical-align: middle; }
        .audit-num { color: #555; font-size: 0.72rem; width: 32px; }
        .audit-avatar-row { display: flex; align-items: center; gap: 9px; }
        .audit-avatar {
          width: 30px; height: 30px; border-radius: 50%;
          background: rgba(255,140,0,0.15); color: #ff8c00;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.72rem; font-weight: 700; flex-shrink: 0;
        }
        .audit-avatar-warn { background: rgba(255,193,7,0.12); color: #ffc107; }
        .audit-name { font-weight: 500; color: #e0e0e0; }
        .audit-email { color: #888; font-size: 0.78rem; }
        .audit-date { color: #666; font-size: 0.75rem; white-space: nowrap; }
        .audit-role-badge {
          border-radius: 20px; padding: 2px 10px; font-size: 0.68rem; font-weight: 600;
          border: 1px solid; white-space: nowrap;
        }
        .audit-role-admin { background: rgba(255,140,0,0.1); color: #ff8c00; border-color: rgba(255,140,0,0.3); }
        .audit-role-tutor { background: rgba(13,110,253,0.1); color: #6ea8fe; border-color: rgba(13,110,253,0.3); }
        .audit-role-instituteAdmin { background: rgba(111,66,193,0.1); color: #c29bf0; border-color: rgba(111,66,193,0.3); }
        .audit-role-collegeAdmin { background: rgba(32,201,151,0.1); color: #20c997; border-color: rgba(32,201,151,0.3); }
        .audit-status {
          border-radius: 20px; padding: 2px 8px; font-size: 0.67rem; font-weight: 600; text-transform: capitalize;
        }
        .audit-approved { background: rgba(40,167,69,0.12); color: #28a745; border: 1px solid rgba(40,167,69,0.25); }
        .audit-pending  { background: rgba(255,193,7,0.1);  color: #ffc107; border: 1px solid rgba(255,193,7,0.25); }
      `}</style>
    </>
  )
}

export default StudentListPage