import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react'
import {
  FiSearch, FiBell, FiPlus, FiCalendar, FiEye, FiX,
  FiClock, FiCheckCircle, FiStar, FiUser, FiVideo, FiCopy,
} from 'react-icons/fi'
import { useAuthContext } from '@/context/useAuthContext'

// ─── Palette ────────────────────────────────────────────────────────────────
const BLUE   = '#2563eb'
const GREEN  = '#10b981'
const ORANGE = '#f59e0b'
const RED    = '#ef4444'
const PURPLE = '#8b5cf6'
const GRAY   = '#64748b'
const BORDER = '#e2e8f0'
const ACCENT = '#f2622f' // coral — matches /hr/jobs, /hr/candidates & /hr/pipeline: primary buttons, active states, links

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  Active:           { label: 'In Progress',     bg: '#eff6ff', color: BLUE },
  AwaitingApproval: { label: 'Awaiting Approval', bg: '#fff7ed', color: ORANGE },
  Offered:          { label: 'Offer',            bg: '#f5f3ff', color: PURPLE },
  Joined:           { label: 'Joined',           bg: '#ecfdf5', color: GREEN },
  Rejected:         { label: 'Rejected',         bg: '#fef2f2', color: RED },
}
const INTERVIEW_STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  Scheduled:    { bg: '#fff7ed', color: '#d97706' },
  'In Progress':{ bg: '#eff6ff', color: '#2563eb' },
  Completed:    { bg: '#ecfdf5', color: '#059669' },
  Cancelled:    { bg: '#fef2f2', color: '#dc2626' },
}
// Sub-label under Current Stage — colored by what it actually says, not by
// the row's overall status bucket (a "Scheduled" round is orange whether the
// candidate is Active or Awaiting Approval overall).
const subLabelColor = (label: string) => {
  if (INTERVIEW_STATUS_STYLE[label]) return INTERVIEW_STATUS_STYLE[label].color
  if (/pending/i.test(label)) return PURPLE
  return GRAY
}
const TYPES = ['Technical Interview', 'HR Interview', 'Case Study', 'Screening', 'Managerial Round'] as const
type InterviewType = typeof TYPES[number]

const AVATAR_COLORS = [
  ['#4F46E5', '#EEF2FF'], ['#0891B2', '#ECFEFF'], ['#16A34A', '#F0FDF4'],
  ['#DC2626', '#FEF2F2'], ['#D97706', '#FFFBEB'], ['#7C3AED', '#F5F3FF'],
  ['#DB2777', '#FDF2F8'], ['#0D9488', '#F0FDFA'],
]
const avatarColor = (name: string) => AVATAR_COLORS[((name || '?').charCodeAt(0) || 0) % AVATAR_COLORS.length]
const initials = (name: string) => (name || '?').split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '?'
const formatDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')
const formatDateTime = (iso?: string | null) => {
  if (!iso) return { date: '—', time: '' }
  const d = new Date(iso)
  return { date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }
}

type TabKey = 'All' | 'Active' | 'AwaitingApproval' | 'Offered' | 'Joined' | 'Rejected'

interface OverviewRow {
  _id: string
  name: string
  email: string
  jobId: string | null
  jobTitle: string
  currentStage: string
  currentStageIndex: number
  totalStages: number
  currentOwnerName: string
  subLabel: string
  statusCategory: Exclude<TabKey, 'All'>
}

interface PipelineStep { name: string; state: 'completed' | 'current' | 'upcoming' }
interface CurrentRound {
  interviewType: string; status: string; scheduledAt: string; durationMinutes?: number
  meetingLink?: string; interviewerName: string
}
interface InterviewHistoryRow {
  _id: string; interviewType: string; status: string; scheduledAt: string
  durationMinutes?: number; interviewerNames: string[]; feedbackScore: number | null; recommendation: string | null
}
interface FeedbackRow {
  _id: string; interviewType: string; interviewerName: string
  criteria: { key: string; label: string; rating: number | null }[]
  overallRating: number | null; recommendation: string | null
  strengths: string[]; areasToImprove: string[]; additionalComments: string
  approvalStatus: string; submittedAt: string
}
interface TimelineEvent { label: string; actor: string; timestamp: string; upcoming?: boolean }
interface CandidateDetail {
  _id: string; name: string; email: string; phone?: string; jobId?: string | null; jobTitle: string; department?: string
  appliedOn: string; resumeUrl?: string; score: number | null; pipelineStage: string; status: string
  statusCategory: Exclude<TabKey, 'All'>
}
interface TimelineResponse {
  candidate: CandidateDetail
  pipelineSteps: PipelineStep[]
  currentRound: CurrentRound | null
  interviewHistory: InterviewHistoryRow[]
  feedbackList: FeedbackRow[]
  timeline: TimelineEvent[]
}

interface CandidateOption { _id: string; name: string; email?: string; jobId?: string | null; jobTitle?: string | null; pipelineStage?: string | null }
interface InterviewerRecord { _id: string; name: string; email?: string; department?: string; role?: string; status?: string }

const emptyForm = {
  candidateId: '', candidateName: '', candidateEmail: '', jobId: '', jobTitle: '',
  interviewType: 'Technical Interview' as InterviewType, interviewerIds: [] as string[], date: '', time: '',
  durationMinutes: '30', meetingLink: '',
}

type DetailTab = 'Overview' | 'History' | 'Feedback' | 'Documents' | 'Notes'

// A labeled value with an icon chip — used in the current-round card, left
// column, matching the boxed-icon treatment in the Figma spec.
const IconField = ({ icon: Icon, label, value }: { icon: ComponentType<{ size?: number }>; label: string; value: ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
    <div style={{ width: 28, height: 28, borderRadius: 8, background: '#fef1ec', color: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={13} />
    </div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: '0.68rem', color: GRAY, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: '0.8rem', color: '#0f172a', fontWeight: 700 }}>{value}</div>
    </div>
  </div>
)

// A plain labeled value — right column, no icon chip.
const PlainField = ({ label, value }: { label: string; value: ReactNode }) => (
  <div>
    <div style={{ fontSize: '0.68rem', color: GRAY, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: '0.8rem', color: '#0f172a', fontWeight: 700 }}>{value}</div>
  </div>
)

const HRInterviewsPage = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()
  const token = (user as any)?.token as string | undefined

  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15000)
    return () => clearInterval(t)
  }, [])

  const [rows, setRows] = useState<OverviewRow[]>([])
  const [stats, setStats] = useState({ total: 0, active: 0, awaitingApproval: 0, offered: 0, joined: 0, rejected: 0 })
  const [totalFiltered, setTotalFiltered] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>('All')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<TimelineResponse | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailTab, setDetailTab] = useState<DetailTab>('Overview')

  const [candidateOptions, setCandidateOptions] = useState<CandidateOption[]>([])
  const [interviewerRecords, setInterviewerRecords] = useState<InterviewerRecord[]>([])
  const [showSchedule, setShowSchedule] = useState(false)
  const [editingInterviewId, setEditingInterviewId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [interviewerSearch, setInterviewerSearch] = useState('')
  const [loadError, setLoadError] = useState('')
  const [linkCopied, setLinkCopied] = useState(false)
  const [pipelineStageNames, setPipelineStageNames] = useState<string[]>([])

  useEffect(() => {
    if (!baseURL || !token) return
    fetch(`${baseURL}/pipeline-stages`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => (r.ok ? r.json() : []))
      .then(data => setPipelineStageNames(Array.isArray(data)
        ? [...data].sort((a: any, b: any) => a.order - b.order).map((s: any) => s.name)
        : []))
      .catch(() => setPipelineStageNames([]))
  }, [baseURL, token])

  const copyMeetingLink = (link: string) => {
    navigator.clipboard.writeText(link).then(() => {
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 1500)
    })
  }

  const loadOverview = () => {
    if (!baseURL || !token) return
    setLoading(true)
    const params = new URLSearchParams({ tab: activeTab, search, page: String(page), pageSize: String(pageSize) })
    fetch(`${baseURL}/hr/candidates-overview?${params}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(`Failed to load candidates (${r.status})`))))
      .then(data => {
        setRows(Array.isArray(data.rows) ? data.rows : [])
        setStats(data.stats || { total: 0, active: 0, awaitingApproval: 0, offered: 0, joined: 0, rejected: 0 })
        setTotalFiltered(data.total || 0)
        setLoadError('')
      })
      .catch(e => { setRows([]); setTotalFiltered(0); setLoadError(e?.message || 'Failed to load candidates') })
      .finally(() => setLoading(false))
  }

  useEffect(() => { setPage(1) }, [activeTab, search, pageSize])
  useEffect(loadOverview, [baseURL, token, activeTab, search, page, pageSize])

  useEffect(() => {
    if (!baseURL || !token) return
    Promise.all([
      fetch(`${baseURL}/candidates`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${baseURL}/team-members`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ])
      .then(([candidateData, teamMemberData]) => {
        const realApplicants = (Array.isArray(candidateData) ? candidateData : []).filter((c: any) => c.hasApplied)
        setCandidateOptions(realApplicants.map((c: any) => ({ _id: c._id, name: c.name, email: c.email, jobId: c.jobId, jobTitle: c.jobTitle, pipelineStage: c.pipelineStage })))
        const activeMembers = (Array.isArray(teamMemberData) ? teamMemberData : []).filter((m: any) => m.status === 'Active')
        setInterviewerRecords(activeMembers.map((m: any) => ({ _id: m._id, name: m.name, email: m.email, department: m.department, role: m.role, status: m.status })))
      })
      .catch(() => { setCandidateOptions([]); setInterviewerRecords([]) })
  }, [baseURL, token])

  const loadDetail = (id: string) => {
    if (!baseURL || !token) return
    setDetailLoading(true)
    setDetailTab('Overview')
    fetch(`${baseURL}/hr/candidates/${id}/timeline`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('Failed to load candidate'))))
      .then(data => setDetail(data))
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false))
  }

  const selectCandidate = (id: string) => {
    setSelectedId(id)
    loadDetail(id)
  }

  const pageCount = Math.max(1, Math.ceil(totalFiltered / pageSize))

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'All', label: `All Candidates (${stats.total})` },
    { key: 'Active', label: `Active (${stats.active})` },
    { key: 'AwaitingApproval', label: `Awaiting Approval (${stats.awaitingApproval})` },
    { key: 'Offered', label: `Offered (${stats.offered})` },
    { key: 'Joined', label: `Joined (${stats.joined})` },
    { key: 'Rejected', label: `Rejected (${stats.rejected})` },
  ]

  const handleCandidatePick = (id: string) => {
    const cd = candidateOptions.find(c => c._id === id)
    setForm(f => ({
      ...f, candidateId: id,
      candidateName: cd?.name || f.candidateName,
      candidateEmail: cd?.email || '',
      jobId: cd?.jobId || '', jobTitle: cd?.jobTitle || '',
    }))
  }

  const toggleInterviewer = (id: string) => {
    setForm(f => ({
      ...f,
      interviewerIds: f.interviewerIds.includes(id) ? f.interviewerIds.filter(x => x !== id) : [...f.interviewerIds, id],
    }))
  }

  const handleSchedule = async () => {
    if (!form.candidateName.trim() || !form.date || !form.time) {
      setSaveError('Candidate, date and time are required')
      return
    }
    setSaving(true)
    setSaveError('')
    try {
      const scheduledAt = new Date(`${form.date}T${form.time}`).toISOString()
      const isEdit = !!editingInterviewId
      const res = await fetch(`${baseURL}/interviews${isEdit ? `/${editingInterviewId}` : ''}`, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: form.candidateId || null,
          candidateName: form.candidateName,
          candidateEmail: form.candidateEmail,
          jobId: form.jobId || null,
          jobTitle: form.jobTitle,
          interviewType: form.interviewType,
          interviewerIds: form.interviewerIds,
          scheduledAt,
          durationMinutes: form.durationMinutes,
          meetingLink: form.meetingLink,
        }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || `Failed to ${isEdit ? 'reschedule' : 'schedule'} interview`)
      setShowSchedule(false)
      setEditingInterviewId(null)
      setForm(emptyForm)
      loadOverview()
      if (selectedId) loadDetail(selectedId)
    } catch (e: any) {
      setSaveError(e?.message || `Failed to ${editingInterviewId ? 'reschedule' : 'schedule'} interview`)
    } finally {
      setSaving(false)
    }
  }

  const openReschedule = () => {
    if (!detail?.currentRound) return
    const iv = detail.interviewHistory.find(h => h.interviewType === detail.currentRound?.interviewType)
    if (!iv) return
    const d = new Date(iv.scheduledAt)
    const pad = (n: number) => String(n).padStart(2, '0')
    setEditingInterviewId(iv._id)
    setForm({
      candidateId: detail.candidate._id, candidateName: detail.candidate.name, candidateEmail: detail.candidate.email,
      jobId: detail.candidate.jobId || '', jobTitle: detail.candidate.jobTitle,
      interviewType: iv.interviewType as InterviewType,
      interviewerIds: [],
      date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
      durationMinutes: String(iv.durationMinutes || 30),
      meetingLink: detail.currentRound.meetingLink || '',
    })
    setSaveError('')
    setShowSchedule(true)
  }

  const inputStyle = { width: '100%', height: 38, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '0 12px', fontSize: '0.84rem', background: '#fff', color: '#0f172a', colorScheme: 'light' as const, boxSizing: 'border-box' as const }

  return (
    <div style={{ minHeight: '100%' }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' }}>Interviews</h1>
          <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: GRAY }}>Track and manage candidates across all hiring stages.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <FiSearch size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}/>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search candidate, job or interview..."
              style={{ paddingLeft: 32, paddingRight: 12, height: 36, width: 260, border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: '0.8rem', color: '#334155', background: '#fff', outline: 'none', colorScheme: 'light' }}
            />
          </div>
          <button style={{ width: 36, height: 36, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' }}>
            <FiCalendar size={15}/>
          </button>
          <button style={{ width: 36, height: 36, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' }}>
            <FiBell size={15}/>
          </button>
          <button
            onClick={() => { setEditingInterviewId(null); setForm(emptyForm); setSaveError(''); setShowSchedule(true) }}
            style={{ display: 'flex', alignItems: 'center', gap: 7, background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, padding: '0 16px', height: 36, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
          >
            <FiPlus size={15}/> Schedule Interview
          </button>
        </div>
      </div>

      {loadError && <div style={{ background: '#fef2f2', color: '#dc2626', fontSize: '0.82rem', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>{loadError}</div>}

      {/* Candidate list — full width; clicking a row opens the detail drawer */}
      <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: 0, padding: '0 16px', borderBottom: `1px solid ${BORDER}`, overflowX: 'auto', overflowY: 'hidden' }}>
            {TABS.map((tab, i) => (
              <div key={tab.key} style={{ display: 'flex', alignItems: 'center' }}>
                {i > 0 && <span style={{ color: BORDER, fontSize: '0.8rem', margin: '0 8px -1px' }}>|</span>}
                <button onClick={() => setActiveTab(tab.key)} style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: '13px 6px', fontSize: '0.78rem',
                  fontWeight: activeTab === tab.key ? 600 : 400, color: activeTab === tab.key ? ACCENT : GRAY,
                  borderBottom: activeTab === tab.key ? `2px solid ${ACCENT}` : '2px solid transparent', marginBottom: -1, whiteSpace: 'nowrap',
                }}>
                  {tab.label}
                </button>
              </div>
            ))}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '17%' }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: '26%' }} />
                <col style={{ width: '9%' }} />
                <col style={{ width: '8%' }} />
              </colgroup>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Candidate', 'Job Title', 'Current Stage', 'Current Owner', 'Progress', 'Status', 'Action'].map(h => (
                    <th key={h} style={{ padding: '10px', fontSize: '0.7rem', fontWeight: 600, color: GRAY, textAlign: 'left', borderBottom: `1px solid ${BORDER}`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!loading && rows.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: '40px 16px', textAlign: 'center', fontSize: '0.85rem', color: GRAY }}>No candidates found.</td></tr>
                )}
                {loading && (
                  <tr><td colSpan={7} style={{ padding: '40px 16px', textAlign: 'center', fontSize: '0.85rem', color: GRAY }}>Loading…</td></tr>
                )}
                {!loading && rows.map(r => {
                  const [fg, bg] = avatarColor(r.name)
                  const meta = STATUS_META[r.statusCategory] || STATUS_META.Active
                  const [ofg, obg] = avatarColor(r.currentOwnerName)
                  const dotColor = r.subLabel ? subLabelColor(r.subLabel) : meta.color
                  const active = selectedId === r._id
                  const reqCode = r.jobId ? `REQ-${String(r.jobId).slice(-4).toUpperCase()}` : ''
                  return (
                    <tr
                      key={r._id}
                      onClick={() => selectCandidate(r._id)}
                      style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: active ? '#eff6ff' : 'transparent' }}
                    >
                      <td style={{ padding: '14px 10px', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: bg, color: fg, fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{initials(r.name)}</div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
                            <div style={{ fontSize: '0.68rem', color: GRAY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 10px', overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.8rem', color: '#334155', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.jobTitle || '—'}</div>
                        {reqCode && <div style={{ fontSize: '0.66rem', color: GRAY, marginTop: 2 }}>{reqCode}</div>}
                      </td>
                      <td style={{ padding: '14px 10px', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#334155', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
                          {r.currentStage}
                        </div>
                        {r.subLabel && <div style={{ fontSize: '0.68rem', color: dotColor, fontWeight: 600, marginTop: 2 }}>{r.subLabel}</div>}
                      </td>
                      <td style={{ padding: '14px 10px', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                          <div style={{ width: 30, height: 30, borderRadius: '50%', background: obg, color: ofg, fontSize: '0.62rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{initials(r.currentOwnerName)}</div>
                          <span style={{ fontSize: '0.78rem', color: '#334155', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.currentOwnerName}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {Array.from({ length: r.totalStages }, (_, i) => {
                            const stageNum = i + 1
                            const stageName = pipelineStageNames[i] || ''
                            const isDone = stageNum < r.currentStageIndex
                            const isCurrent = stageNum === r.currentStageIndex
                            return (
                              <div
                                key={i}
                                title={stageName || `Stage ${stageNum}`}
                                style={{
                                  position: 'relative', width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: '0.64rem', fontWeight: 700,
                                  background: isDone ? '#ecfdf5' : isCurrent ? '#fff' : '#f1f5f9',
                                  color: isDone ? GREEN : isCurrent ? ORANGE : '#94a3b8',
                                  border: `1.5px solid ${isDone ? GREEN : isCurrent ? ORANGE : '#e2e8f0'}`,
                                }}
                              >
                                {stageName.charAt(0).toUpperCase() || String(stageNum)}
                                {isDone && (
                                  <span style={{ position: 'absolute', top: -4, right: -4, width: 12, height: 12, borderRadius: '50%', background: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #fff' }}>
                                    <FiCheckCircle size={8} color="#fff" />
                                  </span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </td>
                      <td style={{ padding: '14px 10px' }}>
                        <span style={{ display: 'inline-block', background: meta.bg, color: meta.color, fontSize: '0.68rem', fontWeight: 700, padding: '4px 10px', borderRadius: 20, whiteSpace: 'nowrap' }}>{meta.label}</span>
                      </td>
                      <td style={{ padding: '14px 10px' }}>
                        <button onClick={e => { e.stopPropagation(); selectCandidate(r._id) }} style={{ width: 30, height: 30, borderRadius: 7, border: `1px solid ${BORDER}`, background: '#fff', color: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                          <FiEye size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: `1px solid ${BORDER}`, flexWrap: 'wrap', gap: 10 }}>
            <span style={{ fontSize: '0.74rem', color: GRAY }}>
              {totalFiltered === 0 ? 'Showing 0 candidates' : `Showing ${(page - 1) * pageSize + 1} to ${Math.min(page * pageSize, totalFiltered)} of ${totalFiltered} candidates`}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${BORDER}`, background: '#fff', color: page === 1 ? '#cbd5e1' : '#334155', cursor: page === 1 ? 'default' : 'pointer' }}>‹</button>
                {Array.from({ length: pageCount }, (_, i) => i + 1).slice(0, 3).map(p => (
                  <button key={p} onClick={() => setPage(p)} style={{
                    width: 28, height: 28, border: p === page ? 'none' : `1px solid ${BORDER}`, borderRadius: 7,
                    background: p === page ? ACCENT : '#fff', color: p === page ? '#fff' : '#334155',
                    fontSize: '0.76rem', fontWeight: p === page ? 700 : 400, cursor: 'pointer',
                  }}>{p}</button>
                ))}
                {pageCount > 3 && <span style={{ color: GRAY, fontSize: '0.78rem', padding: '0 2px' }}>…</span>}
                <button onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page === pageCount} style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${BORDER}`, background: '#fff', color: page === pageCount ? '#cbd5e1' : '#334155', cursor: page === pageCount ? 'default' : 'pointer' }}>›</button>
              </div>
              <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))} style={{ height: 30, border: `1px solid ${BORDER}`, borderRadius: 7, padding: '0 8px', fontSize: '0.76rem', background: '#fff', color: '#334155', colorScheme: 'light' }}>
                {[10, 20, 50].map(n => <option key={n} value={n}>{n}/page</option>)}
              </select>
            </div>
          </div>
      </div>

      {/* Detail drawer — slides in from the right when a candidate is selected */}
      {selectedId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 400 }}>
          <div onClick={() => setSelectedId(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.4)' }} />
          <div style={{
            position: 'absolute', top: 0, right: 0, bottom: 0, width: 560, maxWidth: '92vw', background: '#fff',
            boxShadow: '-8px 0 30px rgba(0,0,0,0.15)', overflowY: 'auto', animation: 'hr-drawer-in 0.18s ease-out',
          }}>
          {detailLoading || !detail ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, color: GRAY, fontSize: '0.85rem' }}>
              Loading…
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${BORDER}` }}>
                <span style={{ fontSize: '0.98rem', fontWeight: 700, color: '#0f172a' }}>Candidate Details</span>
                <button onClick={() => setSelectedId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', padding: 4 }}>
                  <FiX size={18} />
                </button>
              </div>

              <div style={{ padding: 20 }}>
              {/* Candidate header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 50, height: 50, borderRadius: '50%', background: avatarColor(detail.candidate.name)[1], color: avatarColor(detail.candidate.name)[0], fontSize: '0.9rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {initials(detail.candidate.name)}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '1.02rem', fontWeight: 700, color: '#0f172a' }}>{detail.candidate.name}</span>
                      {(() => { const m = STATUS_META[detail.candidate.statusCategory] || STATUS_META.Active; return (
                        <span style={{ background: m.bg, color: m.color, fontSize: '0.66rem', fontWeight: 700, padding: '2px 9px', borderRadius: 20 }}>{m.label}</span>
                      ) })()}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: GRAY }}>{detail.candidate.email}{detail.candidate.phone ? ` · ${detail.candidate.phone}` : ''}</div>
                    <div style={{ fontSize: '0.76rem', color: '#334155', fontWeight: 600, marginTop: 2 }}>
                      {detail.candidate.jobTitle}
                      {detail.candidate.jobId && ` · REQ-${String(detail.candidate.jobId).slice(-4).toUpperCase()}`}
                      {` · Applied on ${formatDate(detail.candidate.appliedOn)}`}
                    </div>
                  </div>
                </div>
              </div>

              {detail.candidate.resumeUrl && (
                <a href={detail.candidate.resumeUrl} target="_blank" rel="noreferrer" style={{ height: 32, padding: '0 12px', borderRadius: 7, border: `1px solid ${BORDER}`, background: '#fff', color: '#334155', fontSize: '0.76rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', textDecoration: 'none', marginBottom: 16 }}>
                  Resume
                </a>
              )}

              {/* Hiring Pipeline stepper */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>Hiring Pipeline</div>
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  {detail.pipelineSteps.map((step, idx) => {
                    const stepDate = step.name === 'Applied'
                      ? detail.candidate.appliedOn
                      : detail.interviewHistory.find(h => h.interviewType === step.name)?.scheduledAt
                    return (
                      <div key={step.name} style={{ display: 'flex', alignItems: 'flex-start', flex: idx < detail.pipelineSteps.length - 1 ? 1 : 'initial' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                          <div style={{
                            width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: step.state === 'completed' ? GREEN : step.state === 'current' ? ORANGE : '#f1f5f9',
                            color: step.state === 'upcoming' ? GRAY : '#fff', fontSize: '0.68rem', fontWeight: 700, flexShrink: 0,
                          }}>
                            {step.state === 'completed' ? <FiCheckCircle size={13} /> : idx + 1}
                          </div>
                          <span style={{ fontSize: '0.6rem', color: step.state === 'current' ? ORANGE : '#334155', fontWeight: step.state === 'current' ? 700 : 500, textAlign: 'center', maxWidth: 62, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{step.name}</span>
                          <span style={{ fontSize: '0.56rem', color: GRAY, textAlign: 'center' }}>{stepDate ? formatDate(stepDate).replace(/, \d{4}$/, '') : ''}</span>
                        </div>
                        {idx < detail.pipelineSteps.length - 1 && (
                          <div style={{ flex: 1, height: 2, background: step.state === 'completed' ? GREEN : '#f1f5f9', margin: '11px 2px 0' }} />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Current round card */}
              {detail.currentRound && (
                <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: 14, marginBottom: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: (INTERVIEW_STATUS_STYLE[detail.currentRound.status] || INTERVIEW_STATUS_STYLE.Scheduled).color, flexShrink: 0 }} />
                    {detail.currentRound.interviewType} ({detail.currentRound.status})
                  </div>
                  <div style={{ display: 'flex', gap: 20, marginBottom: 14 }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
                      <IconField icon={FiUser} label="Interviewer" value={detail.currentRound.interviewerName} />
                      <IconField icon={FiCalendar} label="Date & Time" value={`${formatDateTime(detail.currentRound.scheduledAt).date}, ${formatDateTime(detail.currentRound.scheduledAt).time}`} />
                      <IconField icon={FiVideo} label="Mode" value={detail.currentRound.meetingLink ? 'Online' : 'In-Person'} />
                      <IconField icon={FiClock} label="Duration" value={`${detail.currentRound.durationMinutes || 30} minutes`} />
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0, borderLeft: `1px solid ${BORDER}`, paddingLeft: 20 }}>
                      <PlainField label="Status" value={
                        <span style={{ display: 'inline-block', background: (INTERVIEW_STATUS_STYLE[detail.currentRound.status] || INTERVIEW_STATUS_STYLE.Scheduled).bg, color: (INTERVIEW_STATUS_STYLE[detail.currentRound.status] || INTERVIEW_STATUS_STYLE.Scheduled).color, fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>{detail.currentRound.status}</span>
                      } />
                      {detail.currentRound.meetingLink && (
                        <PlainField label="Meeting Link" value={
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                            <a href={detail.currentRound.meetingLink} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8rem', color: ACCENT, textDecoration: 'none', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{detail.currentRound.meetingLink}</span>
                            </a>
                            <button onClick={() => copyMeetingLink(detail.currentRound!.meetingLink!)} title={linkCopied ? 'Copied!' : 'Copy link'} style={{ background: 'none', border: 'none', cursor: 'pointer', color: linkCopied ? GREEN : GRAY, display: 'flex', padding: 2, flexShrink: 0 }}>
                              <FiCopy size={12} />
                            </button>
                          </div>
                        } />
                      )}
                      <PlainField label="Interview Type" value={<span style={{ color: ACCENT }}>{detail.currentRound.interviewType}</span>} />
                    </div>
                  </div>
                  {detail.currentRound.status === 'Scheduled' && (() => {
                    const isOverdue = new Date(detail.currentRound.scheduledAt).getTime() < now.getTime()
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button onClick={openReschedule} style={{ height: 32, padding: '0 14px', borderRadius: 7, border: `1px solid ${BORDER}`, background: '#fff', color: '#334155', fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer' }}>
                          Reschedule
                        </button>
                        {isOverdue && (
                          <span style={{ fontSize: '0.72rem', color: RED, fontWeight: 600 }}>Overdue — please reschedule</span>
                        )}
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* Tabs */}
              <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${BORDER}`, marginBottom: 14 }}>
                {(['Overview', 'History', 'Feedback', 'Documents', 'Notes'] as DetailTab[]).map(t => (
                  <button key={t} onClick={() => setDetailTab(t)} style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: '9px 10px', fontSize: '0.76rem',
                    fontWeight: detailTab === t ? 600 : 400, color: detailTab === t ? ACCENT : GRAY,
                    borderBottom: detailTab === t ? `2px solid ${ACCENT}` : '2px solid transparent', marginBottom: -1,
                  }}>
                    {t === 'History' ? 'Interview History' : t}
                  </button>
                ))}
              </div>

              {detailTab === 'Overview' && (
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>Activity Timeline</div>
                  {detail.timeline.length === 0 ? (
                    <div style={{ fontSize: '0.78rem', color: GRAY }}>No activity yet.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {detail.timeline.map((ev, i) => (
                        <div key={i} style={{ display: 'flex', gap: 10 }}>
                          <div style={{
                            width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: ev.upcoming ? '#fff7ed' : '#ecfdf5', color: ev.upcoming ? ORANGE : GREEN, flexShrink: 0,
                          }}>
                            {ev.upcoming ? <FiClock size={11} /> : <FiCheckCircle size={11} />}
                          </div>
                          <div style={{ minWidth: 0, flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0f172a' }}>{ev.label}</div>
                              {ev.actor && <div style={{ fontSize: '0.68rem', color: GRAY }}>by {ev.actor}</div>}
                            </div>
                            <span style={{ fontSize: '0.66rem', color: GRAY, flexShrink: 0, whiteSpace: 'nowrap' }}>{formatDateTime(ev.timestamp).date}, {formatDateTime(ev.timestamp).time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {detailTab === 'History' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {detail.interviewHistory.length === 0 ? (
                    <div style={{ fontSize: '0.78rem', color: GRAY }}>No interviews yet.</div>
                  ) : detail.interviewHistory.map(h => (
                    <div key={h._id} style={{ border: `1px solid ${BORDER}`, borderRadius: 8, padding: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>{h.interviewType}</span>
                        <span style={{ background: (INTERVIEW_STATUS_STYLE[h.status] || INTERVIEW_STATUS_STYLE.Scheduled).bg, color: (INTERVIEW_STATUS_STYLE[h.status] || INTERVIEW_STATUS_STYLE.Scheduled).color, fontSize: '0.66rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>{h.status}</span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: GRAY }}>{formatDateTime(h.scheduledAt).date}, {formatDateTime(h.scheduledAt).time} · {h.interviewerNames.join(', ') || '—'}</div>
                      {(h.feedbackScore != null || h.recommendation) && (
                        <div style={{ fontSize: '0.72rem', color: '#334155', marginTop: 4 }}>
                          {h.feedbackScore != null && <span>Score: {h.feedbackScore}/5 </span>}
                          {h.recommendation && <span>· {h.recommendation}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {detailTab === 'Feedback' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {detail.feedbackList.length === 0 ? (
                    <div style={{ fontSize: '0.78rem', color: GRAY }}>No feedback submitted yet.</div>
                  ) : detail.feedbackList.map(f => (
                    <div key={f._id} style={{ border: `1px solid ${BORDER}`, borderRadius: 8, padding: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>{f.interviewType} · {f.interviewerName}</span>
                        {typeof f.overallRating === 'number' && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.76rem', fontWeight: 700, color: GREEN }}><FiStar size={12}/> {f.overallRating}/5</span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: GRAY, marginBottom: 10 }}>{formatDateTime(f.submittedAt).date}, {formatDateTime(f.submittedAt).time}</div>

                      {f.criteria?.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10, paddingBottom: 10, borderBottom: `1px solid ${BORDER}` }}>
                          {f.criteria.map(c => (
                            <div key={c.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '0.76rem', color: '#334155' }}>{c.label}</span>
                              <div style={{ display: 'flex', gap: 1 }}>
                                {[1, 2, 3, 4, 5].map(n => (
                                  <FiStar key={n} size={12} color={c.rating != null && n <= c.rating ? '#f59e0b' : '#d1d5db'} fill={c.rating != null && n <= c.rating ? '#f59e0b' : 'none'} />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {f.recommendation && (
                        <div style={{ fontSize: '0.76rem', color: '#334155', marginBottom: 6 }}>
                          Recommendation: <b>{f.recommendation}</b>
                          {f.approvalStatus && f.approvalStatus !== 'Not Required' && (
                            <span style={{ marginLeft: 8, fontSize: '0.68rem', fontWeight: 700, color: f.approvalStatus === 'Approved' ? GREEN : f.approvalStatus === 'Rejected' ? RED : ORANGE }}>({f.approvalStatus})</span>
                          )}
                        </div>
                      )}
                      {f.strengths?.length > 0 && (
                        <div style={{ fontSize: '0.74rem', color: '#334155', marginBottom: 4 }}><span style={{ color: GRAY }}>Strengths: </span>{f.strengths.join(', ')}</div>
                      )}
                      {f.areasToImprove?.length > 0 && (
                        <div style={{ fontSize: '0.74rem', color: '#334155', marginBottom: 4 }}><span style={{ color: GRAY }}>Areas to Improve: </span>{f.areasToImprove.join(', ')}</div>
                      )}
                      {f.additionalComments && <div style={{ fontSize: '0.74rem', color: GRAY, marginTop: 4 }}>{f.additionalComments}</div>}
                    </div>
                  ))}
                </div>
              )}

              {detailTab === 'Documents' && (
                <div style={{ fontSize: '0.78rem', color: GRAY, textAlign: 'center', padding: '30px 0' }}>Documents aren't tracked yet.</div>
              )}
              {detailTab === 'Notes' && (
                <div style={{ fontSize: '0.78rem', color: GRAY, textAlign: 'center', padding: '30px 0' }}>Notes aren't tracked yet.</div>
              )}
              </div>
            </div>
          )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes hr-drawer-in { from { transform: translateX(100%); } to { transform: translateX(0); } }

        .hr-modal-scroll::-webkit-scrollbar { width: 6px; }
        .hr-modal-scroll::-webkit-scrollbar-track { background: transparent; }
        .hr-modal-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
        .hr-modal-scroll::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
        .hr-modal-scroll { scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent; }
      `}</style>

      {/* Schedule Interview modal */}
      {showSchedule && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 14, width: 680, maxWidth: '94vw', maxHeight: '88vh', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 26px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>{editingInterviewId ? 'Reschedule Interview' : 'Schedule Interview'}</span>
              <button onClick={() => { setShowSchedule(false); setEditingInterviewId(null); setSaveError('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
                <FiX size={20}/>
              </button>
            </div>

            <div className="hr-modal-scroll" style={{ padding: '24px 26px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', flex: 1, minHeight: 0 }}>
              {saveError && <div style={{ background: '#fef2f2', color: '#dc2626', fontSize: '0.8rem', padding: '9px 12px', borderRadius: 8 }}>{saveError}</div>}

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Candidate *</label>
                <select value={form.candidateId} onChange={e => handleCandidatePick(e.target.value)} style={inputStyle}>
                  <option value="">Select an applicant</option>
                  {candidateOptions.map(c => <option key={c._id} value={c._id}>{c.name}{c.jobTitle ? ` — ${c.jobTitle}` : ''}</option>)}
                </select>
                {!form.candidateId && (
                  <input value={form.candidateName} onChange={e => setForm(f => ({ ...f, candidateName: e.target.value }))} placeholder="Or type a candidate name" style={{ ...inputStyle, marginTop: 8 }} />
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Interview Type</label>
                  <select value={form.interviewType} onChange={e => setForm(f => ({ ...f, interviewType: e.target.value as InterviewType }))} style={inputStyle}>
                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Duration (minutes)</label>
                  <input type="number" min={5} value={form.durationMinutes} onChange={e => setForm(f => ({ ...f, durationMinutes: e.target.value }))} style={inputStyle} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Date *</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Time *</label>
                  <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} style={inputStyle} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Interviewers</label>

                <div style={{ position: 'relative', marginBottom: 8 }}>
                  <FiSearch size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}/>
                  <input
                    value={interviewerSearch}
                    onChange={e => setInterviewerSearch(e.target.value)}
                    placeholder="Search team member by name..."
                    style={{ ...inputStyle, height: 34, paddingLeft: 30 }}
                  />
                </div>

                {form.interviewerIds.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    {form.interviewerIds.map(id => {
                      const p = interviewerRecords.find(x => x._id === id)
                      if (!p) return null
                      return (
                        <span key={id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.74rem', fontWeight: 600, color: ACCENT, background: '#fef1ec', border: '1px solid #fbd0bb', borderRadius: 20, padding: '4px 8px 4px 10px' }}>
                          {p.name}
                          <FiX size={11} style={{ cursor: 'pointer' }} onClick={() => toggleInterviewer(id)} />
                        </span>
                      )
                    })}
                  </div>
                )}

                {interviewerRecords.length === 0 ? (
                  <div style={{ fontSize: '0.76rem', color: '#94a3b8', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '10px 12px' }}>No active team members yet — add and activate them on the Team Members page first.</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 8, maxHeight: 180, overflowY: 'auto' }}>
                    {interviewerRecords
                      .filter(p => !interviewerSearch || p.name.toLowerCase().includes(interviewerSearch.toLowerCase()))
                      .map(p => {
                        const checked = form.interviewerIds.includes(p._id)
                        return (
                          <label key={p._id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: '#334155', borderRadius: 6, padding: '8px 10px', cursor: 'pointer', background: checked ? '#fef1ec' : 'transparent', minWidth: 0 }}>
                            <input type="checkbox" checked={checked} onChange={() => toggleInterviewer(p._id)} style={{ accentColor: ACCENT, colorScheme: 'light', flexShrink: 0 }} />
                            <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                            {(p.role || p.department) && <span style={{ color: GRAY, fontSize: '0.72rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{[p.role, p.department].filter(Boolean).join(' · ')}</span>}
                          </label>
                        )
                      })}
                    {interviewerSearch && interviewerRecords.filter(p => p.name.toLowerCase().includes(interviewerSearch.toLowerCase())).length === 0 && (
                      <div style={{ gridColumn: '1 / -1', fontSize: '0.76rem', color: '#94a3b8', padding: '8px 6px' }}>No team member matches "{interviewerSearch}".</div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Meeting Link</label>
                <input value={form.meetingLink} onChange={e => setForm(f => ({ ...f, meetingLink: e.target.value }))} placeholder="https://meet.google.com/..." style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '18px 26px', borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
              <button onClick={() => { setShowSchedule(false); setEditingInterviewId(null); setSaveError('') }} style={{ height: 40, padding: '0 18px', borderRadius: 8, border: `1px solid ${BORDER}`, background: '#fff', color: '#334155', fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleSchedule} disabled={saving} style={{ height: 40, padding: '0 20px', borderRadius: 8, border: 'none', background: ACCENT, color: '#fff', fontSize: '0.84rem', fontWeight: 600, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? (editingInterviewId ? 'Saving…' : 'Scheduling…') : (editingInterviewId ? 'Save Changes' : 'Schedule Interview')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HRInterviewsPage
