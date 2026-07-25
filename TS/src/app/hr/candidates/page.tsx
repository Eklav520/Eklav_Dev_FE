import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  FiSearch, FiBell, FiPlus, FiCalendar, FiFilter, FiEye, FiMoreVertical,
  FiChevronRight, FiChevronsRight, FiChevronLeft, FiChevronsLeft, FiX, FiTrash2, FiCheckCircle,
  FiDownload, FiSliders, FiPhone, FiMail, FiAward, FiBookOpen, FiTrendingUp, FiMapPin,
  FiArrowUp, FiArrowDown, FiMessageSquare, FiCode, FiTarget, FiBarChart2, FiActivity,
} from 'react-icons/fi'
import { BsPeople, BsPersonPlus, BsPersonCheck, BsPersonX } from 'react-icons/bs'
import { HiOutlineBriefcase } from 'react-icons/hi'
import { useAuthContext } from '@/context/useAuthContext'

// ─── Palette ────────────────────────────────────────────────────────────────
const BLUE   = '#2563eb'
const ACCENT = '#f2622f' // coral — matches /hr/jobs: primary buttons, active tab/pagination, links
const GREEN  = '#10b981'
const ORANGE = '#f59e0b'
const RED    = '#ef4444'
const PURPLE = '#8b5cf6'
const TEAL_COLOR = '#0d9488'
const GRAY   = '#64748b'
const BORDER = '#e2e8f0'

const STATUSES = ['Applied', 'Under Review', 'Shortlisted', 'Interview', 'Hired', 'Rejected'] as const
type CandidateStatus = typeof STATUSES[number]

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  Applied:       { bg: '#eff6ff', color: '#2563eb' },
  'Under Review':{ bg: '#fff7ed', color: '#d97706' },
  Shortlisted:   { bg: '#ecfdf5', color: '#059669' },
  Interview:     { bg: '#eef2ff', color: '#4f46e5' },
  Hired:         { bg: '#ecfdf5', color: '#059669' },
  Rejected:      { bg: '#fef2f2', color: '#dc2626' },
}

const AVATAR_COLORS = [
  ['#4F46E5', '#EEF2FF'], ['#0891B2', '#ECFEFF'], ['#16A34A', '#F0FDF4'],
  ['#DC2626', '#FEF2F2'], ['#D97706', '#FFFBEB'], ['#7C3AED', '#F5F3FF'],
  ['#DB2777', '#FDF2F8'], ['#0D9488', '#F0FDFA'],
]
const avatarColor = (name: string) => AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length]
const initials = (name: string) => name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '?'

interface Candidate {
  _id: string
  jobId: string | null
  studentId?: string | null
  name: string
  email?: string
  phone?: string
  jobTitle?: string | null
  skills?: string[]
  experience?: string
  location?: string
  score?: number | null
  status: CandidateStatus | null
  source: 'Applied' | 'Referral' | null
  appliedOn: string | null
  createdAt: string | null
  hasApplied?: boolean
}

interface JobOption { _id: string; title: string }

interface MonthPoint { month: string; label: string; avgScore: number | null; attempts: number }
interface StudentReport {
  months: { month: string; label: string }[]
  series: {
    english: MonthPoint[]
    aiInterview: MonthPoint[]
    aptitude: MonthPoint[]
    codeChallenge: MonthPoint[]
    assessments: MonthPoint[]
  }
  courses: { overallCompletion: number | null; list: { courseId: string; title: string; progress: number }[] }
}

interface StudentProfile {
  fullName?: string
  email?: string
  phoneNo?: string
  profileImage?: string
  resume?: string
  college?: string
  department?: string
  joiningYear?: string
  batch?: string
  education?: string[]
  certifications?: string[]
  skills?: string[]
  completion?: number
  rank?: number | null
  rankTotal?: number | null
  overallRank?: number | null
  overallRankTotal?: number | null
  rankScore?: number | null
  assessmentScores?: {
    quizScore?: number
    codeChallengeScore?: number
    technicalRoundScore?: number
    hrRoundScore?: number
  }
}

const formatDate = (iso?: string) => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const scoreColor = (score?: number | null) => {
  if (score == null) return GRAY
  if (score >= 75) return '#059669'
  if (score >= 50) return '#d97706'
  return '#dc2626'
}

const emptyNewCandidate = { jobId: '', name: '', email: '', phone: '', skills: '', experience: '', location: '', status: '' }

type ChartMode = 'bar' | 'line'

const MonthlyBarChart = ({ title, icon, color, data }: { title: string; icon: React.ReactNode; color: string; data: MonthPoint[] }) => {
  const [mode, setMode] = useState<ChartMode>('bar')
  const hasAnyData = data.some(d => d.attempts > 0)
  const H = 190
  const barZone = H - 20
  const n = data.length
  const linePoints = data
    .map((d, i) => (d.avgScore != null ? { x: (i + 0.5) / n * 100, y: 100 - Math.max(2, Math.min(100, d.avgScore)) } : null))
    .filter((p): p is { x: number; y: number } => p !== null)
  const showBars = mode === 'bar'
  const showLine = mode === 'line' || linePoints.length > 0

  const modeBtn = (m: ChartMode, Icon: typeof FiBarChart2, label: string) => (
    <button
      onClick={() => setMode(m)}
      title={label}
      style={{
        width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${mode === m ? color : BORDER}`, borderRadius: 6, cursor: 'pointer',
        background: mode === m ? color : '#fff', color: mode === m ? '#fff' : '#94a3b8',
      }}
    >
      <Icon size={12} />
    </button>
  )

  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>
          {icon} {title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {modeBtn('bar', FiBarChart2, 'Bar chart')}
          {modeBtn('line', FiActivity, 'Line chart')}
        </div>
      </div>
      {!hasAnyData ? (
        <div style={{ height: H, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', color: '#cbd5e1' }}>
          No activity recorded yet
        </div>
      ) : (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', gap: 8, height: H }}>
          {showLine && linePoints.length > 0 && (
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: barZone, pointerEvents: 'none', overflow: 'visible' }}
            >
              {linePoints.length > 1 && (
                <polyline
                  points={linePoints.map(p => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke={color}
                  strokeWidth={mode === 'line' ? 2.2 : 1.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  opacity={mode === 'line' ? 1 : 0.85}
                />
              )}
              {linePoints.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={mode === 'line' ? 3 : 2.4} fill="#fff" stroke={color} strokeWidth={1.6} vectorEffect="non-scaling-stroke" />
              ))}
            </svg>
          )}
          {data.map(d => (
            <div key={d.month} title={`${d.label}: ${d.avgScore != null ? `${d.avgScore}%` : 'No data'}${d.attempts ? ` (${d.attempts} attempt${d.attempts > 1 ? 's' : ''})` : ''}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
              <div style={{ width: '100%', maxWidth: 34, height: barZone, display: 'flex', alignItems: 'flex-end', background: '#f8fafc', borderRadius: 4, overflow: 'hidden' }}>
                {showBars && d.avgScore != null && (
                  <div style={{ width: '100%', height: `${Math.max(4, d.avgScore)}%`, background: color, opacity: mode === 'bar' ? 1 : 0.35, borderRadius: '3px 3px 0 0' }} />
                )}
              </div>
              <div style={{ fontSize: '0.65rem', color: GRAY, marginTop: 5, whiteSpace: 'nowrap' }}>{d.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const HRCandidatesPage = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()
  const token = (user as any)?.token as string | undefined

  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [jobs, setJobs] = useState<JobOption[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'All' | CandidateStatus>('All')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 8

  const [showFilters, setShowFilters] = useState(true)
  const [filterJob, setFilterJob] = useState('')
  const [filterLocation, setFilterLocation] = useState('')
  const [filterExperience, setFilterExperience] = useState('')
  const [filterSkill, setFilterSkill] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [minScore, setMinScore] = useState(0)
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [openMenu, setOpenMenu] = useState<{ id: string; rect: DOMRect } | null>(null)
  const [viewCandidate, setViewCandidate] = useState<Candidate | null>(null)
  const [viewProfile, setViewProfile] = useState<StudentProfile | null>(null)
  const [viewProfileLoading, setViewProfileLoading] = useState(false)
  const [viewReport, setViewReport] = useState<StudentReport | null>(null)
  const [viewReportLoading, setViewReportLoading] = useState(false)
  const [actionError, setActionError] = useState('')
  const [actioningId, setActioningId] = useState<string | null>(null)

  const [showAdd, setShowAdd] = useState(false)
  const [newCandidate, setNewCandidate] = useState(emptyNewCandidate)
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')

  const fetchAll = () => {
    if (!baseURL || !token) return
    setLoading(true)
    Promise.all([
      fetch(`${baseURL}/candidates`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${baseURL}/jobs`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ])
      .then(([candidateData, jobData]) => {
        setCandidates(Array.isArray(candidateData) ? candidateData : [])
        setJobs(Array.isArray(jobData) ? jobData.map((j: any) => ({ _id: j._id, title: j.title })) : [])
      })
      .catch(() => { setCandidates([]); setJobs([]) })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseURL, token])

  useEffect(() => {
    setPage(1)
    setSelectedIds(new Set())
  }, [activeTab, search, filterJob, filterLocation, filterExperience, filterSkill, filterStatus, minScore])

  useEffect(() => {
    setViewProfile(null)
    setViewReport(null)
    if (!viewCandidate?.studentId || !baseURL || !token) return
    setViewProfileLoading(true)
    fetch(`${baseURL}/students/${viewCandidate.studentId}/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => (r.ok ? r.json() : null))
      .then(data => setViewProfile(data))
      .catch(() => setViewProfile(null))
      .finally(() => setViewProfileLoading(false))

    setViewReportLoading(true)
    fetch(`${baseURL}/students/${viewCandidate.studentId}/report`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => (r.ok ? r.json() : null))
      .then(data => setViewReport(data))
      .catch(() => setViewReport(null))
      .finally(() => setViewReportLoading(false))
  }, [viewCandidate, baseURL, token])

  const total = candidates.length

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    STATUSES.forEach(s => { c[s] = 0 })
    candidates.forEach(cd => { if (cd.status && c[cd.status] !== undefined) c[cd.status]++ })
    return c
  }, [candidates])

  const appliedCount = useMemo(() => candidates.filter(cd => cd.hasApplied).length, [candidates])

  const newThisMonth = useMemo(() => {
    const now = new Date()
    return candidates.filter(cd => {
      if (!cd.appliedOn && !cd.createdAt) return false
      const d = new Date(cd.appliedOn || cd.createdAt || '')
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }).length
  }, [candidates])

  const inProcess = (counts.Applied || 0) + (counts['Under Review'] || 0)

  const TABS: { key: 'All' | CandidateStatus; label: string }[] = [
    { key: 'All', label: `All Candidates (${total})` },
    { key: 'Applied', label: `Applied (${appliedCount})` },
    { key: 'Shortlisted', label: `Shortlisted (${counts.Shortlisted || 0})` },
    { key: 'Interview', label: `Interview (${counts.Interview || 0})` },
    { key: 'Hired', label: `Hired (${counts.Hired || 0})` },
    { key: 'Rejected', label: `Rejected (${counts.Rejected || 0})` },
  ]

  const locationOptions = useMemo(() => Array.from(new Set(candidates.map(c => c.location).filter(Boolean))) as string[], [candidates])

  const filtered = useMemo(() => {
    return candidates.filter(cd => {
      if (activeTab === 'Applied' && !cd.hasApplied) return false
      if (activeTab !== 'All' && activeTab !== 'Applied' && cd.status !== activeTab) return false
      if (search) {
        const q = search.toLowerCase()
        if (!cd.name.toLowerCase().includes(q) && !(cd.jobTitle || '').toLowerCase().includes(q) && !(cd.skills || []).some(s => s.toLowerCase().includes(q))) return false
      }
      if (filterJob && cd.jobId !== filterJob) return false
      if (filterLocation && cd.location !== filterLocation) return false
      if (filterExperience && cd.experience !== filterExperience) return false
      if (filterSkill && !(cd.skills || []).some(s => s.toLowerCase().includes(filterSkill.toLowerCase()))) return false
      if (filterStatus && cd.status !== filterStatus) return false
      if (minScore > 0 && (cd.score == null || cd.score < minScore)) return false
      return true
    }).sort((a, b) => {
      if (sortBy === 'score') {
        const av = a.score ?? -1
        const bv = b.score ?? -1
        return sortDir === 'desc' ? bv - av : av - bv
      }
      const at = new Date(a.appliedOn || a.createdAt || 0).getTime()
      const bt = new Date(b.appliedOn || b.createdAt || 0).getTime()
      return sortDir === 'desc' ? bt - at : at - bt
    })
  }, [candidates, activeTab, search, filterJob, filterLocation, filterExperience, filterSkill, filterStatus, minScore, sortBy, sortDir])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const activeFilterCount = [filterJob, filterLocation, filterExperience, filterSkill, filterStatus].filter(Boolean).length + (minScore > 0 ? 1 : 0)

  const resetFilters = () => {
    setFilterJob(''); setFilterLocation(''); setFilterExperience(''); setFilterSkill(''); setFilterStatus(''); setMinScore(0)
  }

  const changeStatus = async (cd: Candidate, newStatus: CandidateStatus) => {
    setOpenMenu(null)
    setActionError('')
    setActioningId(cd._id)
    try {
      const res = await fetch(`${baseURL}/candidates/${cd._id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || 'Failed to update status')
      }
      setCandidates(prev => prev.map(c => c._id === cd._id ? { ...c, status: newStatus } : c))
    } catch (e: any) {
      setActionError(e?.message || 'Failed to update status')
    } finally {
      setActioningId(null)
    }
  }

  const deleteCandidate = async (cd: Candidate) => {
    setOpenMenu(null)
    if (!window.confirm(`Remove "${cd.name}" from the candidate list?`)) return
    setActionError('')
    setActioningId(cd._id)
    try {
      const res = await fetch(`${baseURL}/candidates/${cd._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || 'Failed to remove candidate')
      }
      setCandidates(prev => prev.filter(c => c._id !== cd._id))
    } catch (e: any) {
      setActionError(e?.message || 'Failed to remove candidate')
    } finally {
      setActioningId(null)
    }
  }

  // A talent-pool row (hasApplied === false) has no real Candidate document
  // yet — its _id is a synthetic `profile-...` id, not something PUT
  // /candidates/:id can update. Since the Candidate schema requires a jobId,
  // "shortlisting" someone from the pool means creating their first real
  // Candidate record, which needs HR to pick which job it's for — so this
  // pre-fills the existing Add Candidate modal with their pool info and the
  // status they clicked, rather than silently failing a PUT to a fake id.
  const shortlistFromPool = (cd: Candidate, status: CandidateStatus) => {
    setOpenMenu(null)
    setNewCandidate({
      jobId: '',
      name: cd.name,
      email: cd.email || '',
      phone: cd.phone || '',
      skills: (cd.skills || []).join(', '),
      experience: cd.experience || '',
      location: cd.location || '',
      status,
    })
    setShowAdd(true)
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const toggleSelectAllOnPage = () => {
    setSelectedIds(prev => {
      const allSelected = paged.length > 0 && paged.every(cd => prev.has(cd._id))
      const next = new Set(prev)
      paged.forEach(cd => { if (allSelected) next.delete(cd._id); else next.add(cd._id) })
      return next
    })
  }

  const bulkDeleteSelected = async () => {
    if (selectedIds.size === 0) return
    const allIds = Array.from(selectedIds)
    const removableIds = allIds.filter(id => !id.startsWith('profile-'))
    const skippedCount = allIds.length - removableIds.length
    if (removableIds.length === 0) {
      setActionError('None of the selected rows are real applicants — talent-pool entries have nothing to remove.')
      setSelectedIds(new Set())
      return
    }
    if (!window.confirm(`Remove ${removableIds.length} selected candidate(s)? This cannot be undone.${skippedCount ? ` (${skippedCount} talent-pool row${skippedCount > 1 ? 's' : ''} without an application will be skipped.)` : ''}`)) return
    setBulkDeleting(true)
    setActionError('')
    try {
      const results = await Promise.allSettled(removableIds.map(id =>
        fetch(`${baseURL}/candidates/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      ))
      const succeededIds = removableIds.filter((_, i) => results[i].status === 'fulfilled' && (results[i] as PromiseFulfilledResult<Response>).value.ok)
      setCandidates(prev => prev.filter(c => !succeededIds.includes(c._id)))
      setSelectedIds(new Set())
      if (succeededIds.length < removableIds.length) setActionError(`Removed ${succeededIds.length} of ${removableIds.length} candidates — some failed.`)
    } catch (e: any) {
      setActionError(e?.message || 'Failed to remove selected candidates')
    } finally {
      setBulkDeleting(false)
    }
  }

  const handleAddCandidate = async () => {
    if (!newCandidate.jobId || !newCandidate.name.trim()) {
      setAddError('Job and Candidate Name are required')
      return
    }
    setAdding(true)
    setAddError('')
    try {
      const res = await fetch(`${baseURL}/candidates`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(newCandidate),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || 'Failed to add candidate')
      }
      setShowAdd(false)
      setNewCandidate(emptyNewCandidate)
      fetchAll()
    } catch (e: any) {
      setAddError(e?.message || 'Failed to add candidate')
    } finally {
      setAdding(false)
    }
  }

  const exportCsv = () => {
    const header = ['Name', 'Phone', 'Email', 'Job Applied', 'Skills', 'Experience', 'Score', 'Status', 'Applied On']
    const rows = filtered.map(cd => [
      cd.name, cd.phone || '', cd.email || '', cd.jobTitle || '', (cd.skills || []).join('; '),
      cd.experience || '', cd.score != null ? String(cd.score) : '', cd.status || 'Not Applied', formatDate(cd.appliedOn || undefined),
    ])
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'candidates.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ minHeight: '100%' }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' }}>Candidates</h1>
          <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: GRAY }}>Search and manage candidates in your talent pool.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <FiSearch size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}/>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search candidates by name, skills, email..."
              style={{
                paddingLeft: 32, paddingRight: 12, height: 36, width: 280,
                border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: '0.8rem',
                color: '#334155', background: '#fff', outline: 'none', colorScheme: 'light',
              }}
            />
          </div>
          <button style={{ width: 36, height: 36, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' }}>
            <FiCalendar size={15}/>
          </button>
          <div style={{ position: 'relative' }}>
            <button style={{ width: 36, height: 36, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' }}>
              <FiBell size={15}/>
            </button>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, padding: '0 16px', height: 36, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
          >
            <FiPlus size={15}/> Add Candidate
          </button>
        </div>
      </div>

      {actionError && (
        <div style={{ background: '#fef2f2', color: '#dc2626', fontSize: '0.82rem', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>{actionError}</div>
      )}

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Candidates', value: total,             sub: 'All time',                                                             icon: <HiOutlineBriefcase size={20}/>, ic: ACCENT, bg: '#fef1ec' },
          { label: 'New This Month',   value: newThisMonth,      sub: total ? `${Math.round(newThisMonth / total * 100)}% from last month` : '0%', icon: <BsPersonPlus size={18}/>,        ic: GREEN,  bg: '#ecfdf5', subColor: GREEN },
          { label: 'In Process',       value: inProcess,         sub: total ? `${Math.round(inProcess / total * 100)}% of total` : '0%',           icon: <BsPeople size={18}/>,            ic: ORANGE, bg: '#fff7ed', subColor: ORANGE },
          { label: 'Shortlisted',      value: counts.Shortlisted || 0, sub: total ? `${Math.round((counts.Shortlisted || 0) / total * 100)}% of total` : '0%', icon: <FiCheckCircle size={18}/>, ic: BLUE, bg: '#eff6ff', subColor: BLUE },
          { label: 'Hired',            value: counts.Hired || 0, sub: total ? `${Math.round((counts.Hired || 0) / total * 100)}% of total` : '0%', icon: <BsPersonCheck size={18}/>,       ic: RED,    bg: '#fef2f2', subColor: '#059669' },
          { label: 'Rejected',         value: counts.Rejected || 0, sub: total ? `${Math.round((counts.Rejected || 0) / total * 100)}% of total` : '0%', icon: <BsPersonX size={18}/>,       ic: RED,    bg: '#fef2f2', subColor: RED },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.ic, flexShrink: 0 }}>
              {s.icon}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.7rem', color: GRAY, marginBottom: 2, whiteSpace: 'nowrap' }}>{s.label}</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>{s.value}</div>
              <div style={{ fontSize: '0.66rem', color: (s as any).subColor || GRAY, fontWeight: 500, marginTop: 2, whiteSpace: 'nowrap' }}>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main content: table + filters */}
      <div style={{ display: 'grid', gridTemplateColumns: showFilters ? '1fr 260px' : '1fr', gap: 16, alignItems: 'flex-start', minWidth: 0 }}>

        <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Tabs row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', gap: 0, flexWrap: 'wrap' }}>
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '14px 14px', fontSize: '0.8rem', fontWeight: activeTab === tab.key ? 600 : 400,
                    color: activeTab === tab.key ? ACCENT : GRAY,
                    borderBottom: activeTab === tab.key ? `2px solid ${ACCENT}` : '2px solid transparent',
                    marginBottom: -1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
              <button onClick={() => setShowFilters(p => !p)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: showFilters ? '#fef1ec' : '#f8fafc', border: `1px solid ${showFilters ? '#fbd0bb' : BORDER}`, borderRadius: 7, padding: '6px 12px', fontSize: '0.78rem', color: showFilters ? ACCENT : '#334155', cursor: 'pointer', fontWeight: 500 }}>
                <FiFilter size={13}/> Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
              </button>
              <button onClick={exportCsv} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', border: `1px solid ${BORDER}`, borderRadius: 7, padding: '6px 12px', fontSize: '0.78rem', color: '#334155', cursor: 'pointer', fontWeight: 500 }}>
                <FiDownload size={13}/> Export
              </button>
            </div>
          </div>

          {selectedIds.size > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', background: '#fef1ec', borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ fontSize: '0.82rem', color: ACCENT, fontWeight: 600 }}>{selectedIds.size} selected</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button onClick={() => setSelectedIds(new Set())} style={{ background: 'none', border: 'none', color: '#334155', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
                  Clear selection
                </button>
                <button
                  onClick={bulkDeleteSelected}
                  disabled={bulkDeleting}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #fecaca', borderRadius: 7, padding: '6px 12px', fontSize: '0.78rem', color: '#dc2626', cursor: bulkDeleting ? 'default' : 'pointer', fontWeight: 600, opacity: bulkDeleting ? 0.6 : 1 }}
                >
                  <FiTrash2 size={13}/> {bulkDeleting ? 'Removing…' : 'Remove Selected'}
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="hr-table-scroll" style={{ flex: 1, overflow: 'auto' }} onScroll={() => setOpenMenu(null)}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '11px 14px', borderBottom: `1px solid ${BORDER}`, width: 1 }}>
                    <input
                      type="checkbox"
                      checked={paged.length > 0 && paged.every(cd => selectedIds.has(cd._id))}
                      onChange={toggleSelectAllOnPage}
                      style={{ accentColor: ACCENT, colorScheme: 'light' }}
                    />
                  </th>
                  {['Candidate', 'Contact', 'Job Applied', 'Skills', 'Experience', 'Score', 'Status', 'Applied On', 'Actions'].map(h => (
                    h === 'Score' ? (
                      <th
                        key={h}
                        onClick={() => {
                          if (sortBy === 'score') setSortDir(d => d === 'desc' ? 'asc' : 'desc')
                          else { setSortBy('score'); setSortDir('desc') }
                        }}
                        style={{ padding: '11px 14px', fontSize: '0.74rem', fontWeight: 600, color: sortBy === 'score' ? ACCENT : GRAY, textAlign: 'left', borderBottom: `1px solid ${BORDER}`, whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          {h} {sortBy === 'score' ? (sortDir === 'desc' ? <FiArrowDown size={11}/> : <FiArrowUp size={11}/>) : <FiArrowDown size={11} color="#cbd5e1"/>}
                        </span>
                      </th>
                    ) : (
                      <th key={h} style={{ padding: '11px 14px', fontSize: '0.74rem', fontWeight: 600, color: GRAY, textAlign: 'left', borderBottom: `1px solid ${BORDER}`, whiteSpace: 'nowrap' }}>{h}</th>
                    )
                  ))}
                </tr>
              </thead>
              <tbody>
                {!loading && paged.length === 0 && (
                  <tr>
                    <td colSpan={10} style={{ padding: '40px 16px', textAlign: 'center', fontSize: '0.85rem', color: GRAY }}>
                      No candidates found.
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td colSpan={10} style={{ padding: '40px 16px', textAlign: 'center', fontSize: '0.85rem', color: GRAY }}>
                      Loading candidates…
                    </td>
                  </tr>
                )}
                {!loading && paged.map(cd => {
                  const st = cd.status ? STATUS_STYLE[cd.status] : null
                  const [fg, bg] = avatarColor(cd.name)
                  return (
                    <tr key={cd._id} style={{ borderBottom: '1px solid #f1f5f9' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#fafbfc'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                    >
                      <td style={{ padding: '14px' }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(cd._id)}
                          onChange={() => toggleSelect(cd._id)}
                          style={{ accentColor: ACCENT, colorScheme: 'light' }}
                        />
                      </td>
                      <td style={{ padding: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: bg, color: fg, fontSize: '0.72rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {initials(cd.name)}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>{cd.name}</span>
                            {cd.source === 'Referral' && <span title="Referral" style={{ fontSize: '0.6rem', background: '#fff7ed', color: '#d97706', fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>REF</span>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px', fontSize: '0.78rem', color: '#334155' }}>{cd.phone || cd.email || '—'}</td>
                      <td style={{ padding: '14px', fontSize: '0.8rem', color: '#334155' }}>{cd.jobTitle || '—'}</td>
                      <td style={{ padding: '14px' }}>
                        <div style={{ display: 'flex', flexWrap: 'nowrap', gap: 4, maxWidth: 180, overflow: 'hidden' }}>
                          {(cd.skills || []).slice(0, 3).map(s => (
                            <span key={s} style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.66rem', fontWeight: 600, padding: '2px 7px', borderRadius: 5, whiteSpace: 'nowrap', flexShrink: 0 }}>{s}</span>
                          ))}
                          {(cd.skills || []).length === 0 && <span style={{ color: '#cbd5e1', fontSize: '0.76rem' }}>—</span>}
                        </div>
                      </td>
                      <td style={{ padding: '14px', fontSize: '0.8rem', color: '#334155', whiteSpace: 'nowrap' }}>{cd.experience || '—'}</td>
                      <td style={{ padding: '14px', fontSize: '0.82rem', fontWeight: 700, color: scoreColor(cd.score) }}>{cd.score != null ? `${cd.score}%` : '—'}</td>
                      <td style={{ padding: '14px' }}>
                        {st ? (
                          <span style={{ background: st.bg, color: st.color, fontSize: '0.7rem', fontWeight: 600, padding: '3px 9px', borderRadius: 20, whiteSpace: 'nowrap' }}>{cd.status}</span>
                        ) : (
                          <span style={{ color: '#cbd5e1', fontSize: '0.78rem' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '14px', fontSize: '0.76rem', color: GRAY, whiteSpace: 'nowrap' }}>{formatDate(cd.appliedOn || undefined)}</td>
                      <td style={{ padding: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
                          <button onClick={() => setViewCandidate(cd)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 3, display: 'flex', alignItems: 'center' }} title="View">
                            <FiEye size={15}/>
                          </button>
                          <button
                            onClick={e => {
                              const rect = e.currentTarget.getBoundingClientRect()
                              setOpenMenu(prev => prev?.id === cd._id ? null : { id: cd._id, rect })
                            }}
                            disabled={actioningId === cd._id}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 3, display: 'flex', alignItems: 'center', opacity: actioningId === cd._id ? 0.5 : 1 }}
                            title="More"
                          >
                            <FiMoreVertical size={15}/>
                          </button>

                          {openMenu?.id === cd._id && createPortal(
                            <>
                              <div onClick={() => setOpenMenu(null)} style={{ position: 'fixed', inset: 0, zIndex: 199 }} />
                              <div style={{
                                position: 'fixed', top: openMenu.rect.bottom + 4, left: openMenu.rect.right - 180, minWidth: 180,
                                background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 10,
                                boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 200, overflow: 'hidden',
                              }}>
                                {cd.hasApplied ? (
                                  <>
                                    <div style={{ padding: '8px 12px', fontSize: '0.68rem', color: GRAY, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Set status</div>
                                    {STATUSES.filter(s => s !== cd.status).map(s => (
                                      <button
                                        key={s}
                                        onClick={() => changeStatus(cd, s)}
                                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'none', border: 'none', color: '#334155', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', textAlign: 'left' }}
                                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f8fafc' }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
                                      >
                                        <FiCheckCircle size={13} color={STATUS_STYLE[s].color} /> Mark as {s}
                                      </button>
                                    ))}
                                    <div style={{ borderTop: `1px solid ${BORDER}` }} />
                                    <button
                                      onClick={() => deleteCandidate(cd)}
                                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: 'none', border: 'none', color: '#ef4444', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#fef2f2' }}
                                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
                                    >
                                      <FiTrash2 size={13} /> Remove
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <div style={{ padding: '8px 12px', fontSize: '0.68rem', color: GRAY, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Not applied yet — shortlist for</div>
                                    {STATUSES.map(s => (
                                      <button
                                        key={s}
                                        onClick={() => shortlistFromPool(cd, s)}
                                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'none', border: 'none', color: '#334155', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', textAlign: 'left' }}
                                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f8fafc' }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
                                      >
                                        <FiCheckCircle size={13} color={STATUS_STYLE[s].color} /> Mark as {s}
                                      </button>
                                    ))}
                                  </>
                                )}
                              </div>
                            </>,
                            document.body
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
            <span style={{ fontSize: '0.78rem', color: GRAY }}>
              {filtered.length === 0 ? 'Showing 0 candidates' : `Showing ${(page - 1) * PAGE_SIZE + 1} to ${Math.min(page * PAGE_SIZE, filtered.length)} of ${filtered.length} candidates`}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button onClick={() => setPage(1)} disabled={page === 1} style={{ width: 30, height: 30, border: `1px solid ${BORDER}`, borderRadius: 6, background: '#fff', color: GRAY, cursor: page === 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: page === 1 ? 0.5 : 1 }}>
                <FiChevronsLeft size={13}/>
              </button>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ width: 30, height: 30, border: `1px solid ${BORDER}`, borderRadius: 6, background: '#fff', color: GRAY, cursor: page === 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: page === 1 ? 0.5 : 1 }}>
                <FiChevronLeft size={13}/>
              </button>
              {(() => {
                const pageBtn = (p: number) => {
                  const isActive = p === page
                  return (
                    <button key={p} onClick={() => setPage(p)} style={{
                      width: 30, height: 30, border: isActive ? 'none' : `1px solid ${BORDER}`,
                      borderRadius: 6, background: isActive ? ACCENT : '#fff',
                      color: isActive ? '#fff' : GRAY,
                      fontSize: '0.78rem', fontWeight: isActive ? 700 : 400,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      {p}
                    </button>
                  )
                }
                const leadCount = Math.min(4, pageCount)
                const leadPages = Array.from({ length: leadCount }, (_, i) => i + 1)
                const showMiddlePage = page > leadCount && page < pageCount
                const showTrailingEllipsis = pageCount > leadCount
                return (
                  <>
                    {leadPages.map(pageBtn)}
                    {showMiddlePage && (
                      <>
                        <span style={{ color: GRAY, fontSize: '0.78rem', padding: '0 4px' }}>…</span>
                        {pageBtn(page)}
                      </>
                    )}
                    {showTrailingEllipsis && <span style={{ color: GRAY, fontSize: '0.78rem', padding: '0 4px' }}>…</span>}
                    {pageCount > leadCount && pageBtn(pageCount)}
                  </>
                )
              })()}
              <button onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page === pageCount} style={{ width: 30, height: 30, border: `1px solid ${BORDER}`, borderRadius: 6, background: '#fff', color: GRAY, cursor: page === pageCount ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: page === pageCount ? 0.5 : 1 }}>
                <FiChevronRight size={13}/>
              </button>
              <button onClick={() => setPage(pageCount)} disabled={page === pageCount} style={{ width: 30, height: 30, border: `1px solid ${BORDER}`, borderRadius: 6, background: '#fff', color: GRAY, cursor: page === pageCount ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: page === pageCount ? 0.5 : 1 }}>
                <FiChevronsRight size={13}/>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Filters */}
        {showFilters && (
          <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>Filters</span>
              <span onClick={resetFilters} style={{ fontSize: '0.76rem', color: ACCENT, fontWeight: 600, cursor: 'pointer' }}>Clear all</span>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 600, color: '#334155', marginBottom: 6 }}>Job Title</div>
              <select value={filterJob} onChange={e => setFilterJob(e.target.value)} style={{ width: '100%', height: 36, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '0 10px', fontSize: '0.8rem', background: '#fff', color: '#0f172a', colorScheme: 'light' }}>
                <option value="">All Job Titles</option>
                {jobs.map(j => <option key={j._id} value={j._id}>{j.title}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 600, color: '#334155', marginBottom: 6 }}>Location</div>
              <select value={filterLocation} onChange={e => setFilterLocation(e.target.value)} style={{ width: '100%', height: 36, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '0 10px', fontSize: '0.8rem', background: '#fff', color: '#0f172a', colorScheme: 'light' }}>
                <option value="">All Locations</option>
                {locationOptions.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 600, color: '#334155', marginBottom: 6 }}>Experience</div>
              <select value={filterExperience} onChange={e => setFilterExperience(e.target.value)} style={{ width: '100%', height: 36, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '0 10px', fontSize: '0.8rem', background: '#fff', color: '#0f172a', colorScheme: 'light' }}>
                <option value="">All Experience</option>
                {Array.from(new Set(candidates.map(c => c.experience).filter(Boolean))).map(exp => <option key={exp} value={exp}>{exp}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 600, color: '#334155', marginBottom: 6 }}>Skills</div>
              <input value={filterSkill} onChange={e => setFilterSkill(e.target.value)} placeholder="Select or type skills"
                style={{ width: '100%', height: 36, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '0 10px', fontSize: '0.8rem', background: '#fff', color: '#0f172a', colorScheme: 'light', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 600, color: '#334155', marginBottom: 6 }}>Current Status</div>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: '100%', height: 36, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '0 10px', fontSize: '0.8rem', background: '#fff', color: '#0f172a', colorScheme: 'light' }}>
                <option value="">All Statuses</option>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 600, color: '#334155', marginBottom: 8 }}>Score Range</div>
              <input type="range" min={0} max={100} step={5} value={minScore} onChange={e => setMinScore(Number(e.target.value))} style={{ width: '100%', accentColor: ACCENT, colorScheme: 'light' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#94a3b8' }}>
                <span>{minScore}%</span><span>100%</span>
              </div>
            </div>

            <button onClick={() => setPage(1)} style={{ width: '100%', background: ACCENT, color: '#fff', border: 'none', borderRadius: 10, padding: '9px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
              <FiSliders size={13} /> Apply Filters
            </button>
            <button onClick={resetFilters} style={{ width: '100%', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 10, color: activeFilterCount > 0 ? ACCENT : GRAY, padding: '9px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
              Reset{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </button>
          </div>
        )}
      </div>

      {/* Add Candidate modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 14, width: 480, maxWidth: '100%', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: `1px solid ${BORDER}` }}>
              <div>
                <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>Add Candidate</span>
                <div style={{ fontSize: '0.76rem', color: GRAY, marginTop: 2 }}>For referrals or offline sourcing — not for platform applicants.</div>
              </div>
              <button onClick={() => { setShowAdd(false); setAddError('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
                <FiX size={18}/>
              </button>
            </div>

            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {addError && (
                <div style={{ background: '#fef2f2', color: '#dc2626', fontSize: '0.8rem', padding: '9px 12px', borderRadius: 8 }}>{addError}</div>
              )}

              {newCandidate.status && (
                <div style={{ background: '#fef1ec', color: ACCENT, fontSize: '0.8rem', fontWeight: 600, padding: '9px 12px', borderRadius: 8 }}>
                  Will be added with status "{newCandidate.status}" — just pick which job this is for below.
                </div>
              )}

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Job *</label>
                <select value={newCandidate.jobId} onChange={e => setNewCandidate(f => ({ ...f, jobId: e.target.value }))}
                  style={{ width: '100%', height: 38, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '0 10px', fontSize: '0.84rem', background: '#fff', color: '#0f172a', colorScheme: 'light' }}>
                  <option value="">Select a job</option>
                  {jobs.map(j => <option key={j._id} value={j._id}>{j.title}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Candidate Name *</label>
                <input value={newCandidate.name} onChange={e => setNewCandidate(f => ({ ...f, name: e.target.value }))}
                  style={{ width: '100%', height: 38, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '0 12px', fontSize: '0.84rem', background: '#fff', color: '#0f172a', colorScheme: 'light', boxSizing: 'border-box' }}
                  placeholder="e.g. Priya Singh" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Phone</label>
                  <input value={newCandidate.phone} onChange={e => setNewCandidate(f => ({ ...f, phone: e.target.value }))}
                    style={{ width: '100%', height: 38, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '0 12px', fontSize: '0.84rem', background: '#fff', color: '#0f172a', colorScheme: 'light', boxSizing: 'border-box' }}
                    placeholder="+91 98765 43210" />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Email</label>
                  <input value={newCandidate.email} onChange={e => setNewCandidate(f => ({ ...f, email: e.target.value }))}
                    style={{ width: '100%', height: 38, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '0 12px', fontSize: '0.84rem', background: '#fff', color: '#0f172a', colorScheme: 'light', boxSizing: 'border-box' }}
                    placeholder="name@email.com" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Experience</label>
                  <input value={newCandidate.experience} onChange={e => setNewCandidate(f => ({ ...f, experience: e.target.value }))}
                    style={{ width: '100%', height: 38, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '0 12px', fontSize: '0.84rem', background: '#fff', color: '#0f172a', colorScheme: 'light', boxSizing: 'border-box' }}
                    placeholder="e.g. 2.5 Yrs" />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Location</label>
                  <input value={newCandidate.location} onChange={e => setNewCandidate(f => ({ ...f, location: e.target.value }))}
                    style={{ width: '100%', height: 38, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '0 12px', fontSize: '0.84rem', background: '#fff', color: '#0f172a', colorScheme: 'light', boxSizing: 'border-box' }}
                    placeholder="e.g. Bangalore" />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Skills (comma separated)</label>
                <input value={newCandidate.skills} onChange={e => setNewCandidate(f => ({ ...f, skills: e.target.value }))}
                  style={{ width: '100%', height: 38, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '0 12px', fontSize: '0.84rem', background: '#fff', color: '#0f172a', colorScheme: 'light', boxSizing: 'border-box' }}
                  placeholder="React, Node.js, MongoDB" />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 22px', borderTop: `1px solid ${BORDER}` }}>
              <button onClick={() => { setShowAdd(false); setAddError('') }} style={{ height: 38, padding: '0 16px', borderRadius: 8, border: `1px solid ${BORDER}`, background: '#fff', color: '#334155', fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleAddCandidate} disabled={adding} style={{ height: 38, padding: '0 18px', borderRadius: 8, border: 'none', background: ACCENT, color: '#fff', fontSize: '0.84rem', fontWeight: 600, cursor: adding ? 'default' : 'pointer', opacity: adding ? 0.7 : 1 }}>
                {adding ? 'Adding…' : 'Add Candidate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Candidate modal */}
      {viewCandidate && (() => {
        const p = viewProfile
        const displayName = p?.fullName || viewCandidate.name
        const [avFg, avBg] = avatarColor(displayName)
        const mergedSkills = Array.from(new Set([...(p?.skills || []), ...(viewCandidate.skills || [])]))
        const resumeUrl = p?.resume || (viewCandidate as any).resumeUrl
        const hasAssessment = p?.assessmentScores && Object.values(p.assessmentScores).some(v => (v || 0) > 0)
        return createPortal(
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={{ background: '#fff', borderRadius: 14, width: '97vw', maxWidth: '97vw', height: '96vh', maxHeight: '96vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 60px rgba(0,0,0,0.35)' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '22px 24px', borderBottom: `1px solid ${BORDER}`, background: '#f8fafc', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  {p?.profileImage ? (
                    <img src={p.profileImage} alt={displayName} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: `1px solid ${BORDER}` }} />
                  ) : (
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: avBg, color: avFg, fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {initials(displayName)}
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>{displayName}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
                      {viewCandidate.status ? (
                        <span style={{ background: STATUS_STYLE[viewCandidate.status].bg, color: STATUS_STYLE[viewCandidate.status].color, fontSize: '0.72rem', fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>{viewCandidate.status}</span>
                      ) : (
                        <span style={{ background: '#f1f5f9', color: GRAY, fontSize: '0.72rem', fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>Not Applied</span>
                      )}
                      {viewCandidate.score != null && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', fontWeight: 700, color: scoreColor(viewCandidate.score) }}>
                          <FiTrendingUp size={12} /> {viewCandidate.score}% match
                        </span>
                      )}
                      {viewCandidate.source === 'Referral' && (
                        <span style={{ fontSize: '0.68rem', background: '#fff7ed', color: '#d97706', fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>REFERRAL</span>
                      )}
                    </div>
                  </div>
                </div>
                <button onClick={() => setViewCandidate(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
                  <FiX size={18}/>
                </button>
              </div>

              <div className="hr-modal-scroll" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto', flex: 1 }}>
                {/* Contact */}
                <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
                  {viewCandidate.phone && (
                    <a href={`tel:${viewCandidate.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.83rem', color: '#334155', textDecoration: 'none' }}><FiPhone size={13} color={ACCENT}/> {viewCandidate.phone}</a>
                  )}
                  {(p?.email || viewCandidate.email) && (
                    <a href={`mailto:${p?.email || viewCandidate.email}`} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.83rem', color: '#334155', textDecoration: 'none' }}><FiMail size={13} color={ACCENT}/> {p?.email || viewCandidate.email}</a>
                  )}
                  {viewCandidate.studentId && (
                    resumeUrl ? (
                      <a href={resumeUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.83rem', color: ACCENT, textDecoration: 'none', fontWeight: 600, marginLeft: 'auto' }}>
                        <FiDownload size={13}/> Resume Available
                      </a>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.83rem', color: '#94a3b8', fontWeight: 500, marginLeft: 'auto' }}>
                        <FiDownload size={13}/> Resume Not Available
                      </span>
                    )
                  )}
                </div>

                {/* Application + background */}
                <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
                    <HiOutlineBriefcase size={15} color={ACCENT} /> Application
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                    {[
                      ['Job Applied', viewCandidate.jobTitle],
                      ['Source', viewCandidate.source],
                      ['Applied On', viewCandidate.appliedOn ? formatDate(viewCandidate.appliedOn) : undefined],
                      ['Experience', p?.department ? undefined : viewCandidate.experience],
                      ['Department', p?.department],
                      ['Batch / Joining Year', p?.batch || p?.joiningYear],
                    ].filter(([, v]) => v !== undefined).map(([label, value]) => (
                      <div key={label as string}>
                        <div style={{ fontSize: '0.68rem', color: GRAY, marginBottom: 2 }}>{label}</div>
                        <div style={{ fontSize: '0.82rem', color: '#0f172a', fontWeight: 600 }}>{value || '—'}</div>
                      </div>
                    ))}
                  </div>
                  {(p?.college || viewCandidate.location) && (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${BORDER}` }}>
                      <div style={{ fontSize: '0.68rem', color: GRAY, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}><FiMapPin size={11}/> Location / College</div>
                      <div style={{ fontSize: '0.82rem', color: '#0f172a', fontWeight: 600 }}>{p?.college || viewCandidate.location}</div>
                    </div>
                  )}
                </div>

                {/* Skills */}
                {!!mergedSkills.length && (
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Skills</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {mergedSkills.map(s => (
                        <span key={s} style={{ background: '#eff6ff', color: BLUE, fontSize: '0.76rem', fontWeight: 600, padding: '4px 10px', borderRadius: 6 }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Platform performance (only for real applicants with a linked profile) */}
                {viewProfileLoading && (
                  <div style={{ fontSize: '0.8rem', color: GRAY, textAlign: 'center', padding: '10px 0' }}>Loading full profile…</div>
                )}

                {!viewProfileLoading && p && (
                  <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>
                      <FiAward size={15} color={ORANGE} /> Platform Performance
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: hasAssessment ? 16 : 0 }}>
                      <div>
                        <div style={{ fontSize: '0.68rem', color: GRAY, marginBottom: 2 }}>Institute Rank</div>
                        <div style={{ fontSize: '0.82rem', color: '#0f172a', fontWeight: 700 }}>{p.rank != null ? `#${p.rank}${p.rankTotal ? ` of ${p.rankTotal}` : ''}` : '—'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.68rem', color: GRAY, marginBottom: 2 }}>Overall Rank</div>
                        <div style={{ fontSize: '0.82rem', color: '#0f172a', fontWeight: 700 }}>{p.overallRank != null ? `#${p.overallRank}${p.overallRankTotal ? ` of ${p.overallRankTotal}` : ''}` : '—'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.68rem', color: GRAY, marginBottom: 2 }}>Profile Completion</div>
                        <div style={{ fontSize: '0.82rem', color: '#0f172a', fontWeight: 700 }}>{p.completion != null ? `${p.completion}%` : '—'}</div>
                      </div>
                    </div>
                    {hasAssessment && (
                      <div>
                        <div style={{ fontSize: '0.72rem', color: GRAY, marginBottom: 8 }}>Assessment Scores</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                          {[
                            ['Quiz', p.assessmentScores?.quizScore],
                            ['Code Challenge', p.assessmentScores?.codeChallengeScore],
                            ['Technical Round', p.assessmentScores?.technicalRoundScore],
                            ['HR Round', p.assessmentScores?.hrRoundScore],
                          ].map(([label, value]) => (
                            <div key={label as string} style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>{value ?? 0}</div>
                              <div style={{ fontSize: '0.64rem', color: GRAY, marginTop: 2 }}>{label}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!viewProfileLoading && !p && viewCandidate.studentId && (
                  <div style={{ fontSize: '0.78rem', color: GRAY, textAlign: 'center', padding: '4px 0' }}>Full platform profile unavailable for this candidate.</div>
                )}

                {/* Full progress report — month-by-month across every training section */}
                {viewCandidate.studentId && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
                      <FiTrendingUp size={15} color={PURPLE} /> Progress Report — Last 6 Months
                    </div>
                    {viewReportLoading && (
                      <div style={{ fontSize: '0.8rem', color: GRAY, textAlign: 'center', padding: '10px 0' }}>Loading progress report…</div>
                    )}
                    {!viewReportLoading && viewReport && (
                      <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 12 }}>
                          <MonthlyBarChart title="English Practice" icon={<FiMessageSquare size={13} color={BLUE} />} color={BLUE} data={viewReport.series.english} />
                          <MonthlyBarChart title="AI Interview" icon={<FiAward size={13} color={PURPLE} />} color={PURPLE} data={viewReport.series.aiInterview} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 12 }}>
                          <MonthlyBarChart title="Aptitude" icon={<FiTarget size={13} color={ORANGE} />} color={ORANGE} data={viewReport.series.aptitude} />
                          <MonthlyBarChart title="Code Challenges" icon={<FiCode size={13} color={GREEN} />} color={GREEN} data={viewReport.series.codeChallenge} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
                          <MonthlyBarChart title="Assessments" icon={<FiCheckCircle size={13} color={RED} />} color={RED} data={viewReport.series.assessments} />

                          {/* Courses — current completion snapshot (no month-by-month history exists for course progress) */}
                          <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column', minWidth: 0, height: 240, overflow: 'hidden' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexShrink: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>
                                <FiBookOpen size={13} color={TEAL_COLOR} /> Courses
                              </div>
                              {viewReport.courses.overallCompletion != null && (
                                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: TEAL_COLOR, flexShrink: 0 }}>{viewReport.courses.overallCompletion}% overall</span>
                              )}
                            </div>
                            {viewReport.courses.list.length === 0 ? (
                              <div style={{ fontSize: '0.72rem', color: '#cbd5e1', textAlign: 'center', padding: '10px 0' }}>No enrolled courses yet</div>
                            ) : (
                              <div className="hr-modal-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', paddingRight: 4, minWidth: 0 }}>
                                {viewReport.courses.list.map(c => (
                                  <div key={c.courseId} title={c.title} style={{ minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: '0.7rem', color: '#334155', marginBottom: 3, minWidth: 0 }}>
                                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{c.title}</span>
                                      <span style={{ fontWeight: 700, flexShrink: 0 }}>{c.progress}%</span>
                                    </div>
                                    <div style={{ height: 5, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                                      <div style={{ height: '100%', width: `${c.progress}%`, background: TEAL_COLOR, borderRadius: 4 }} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {!viewCandidate.studentId && (
                  <div style={{ fontSize: '0.78rem', color: GRAY, background: '#f8fafc', borderRadius: 8, padding: '10px 12px' }}>
                    This is a manually added referral candidate — there's no linked platform profile to show.
                  </div>
                )}

                {/* Education & Certifications */}
                {viewCandidate.studentId && (
                  <div style={{ display: 'grid', gridTemplateColumns: p?.education?.length ? '1fr 1fr' : '1fr', gap: 16 }}>
                    {!!p?.education?.length && (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                          <FiBookOpen size={13} /> Education
                        </div>
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                          {p!.education!.map((e, i) => <li key={i} style={{ fontSize: '0.78rem', color: '#334155', marginBottom: 4 }}>{e}</li>)}
                        </ul>
                      </div>
                    )}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                        <FiAward size={13} /> Certifications
                      </div>
                      {p?.certifications?.length ? (
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                          {p.certifications.map((c, i) => <li key={i} style={{ fontSize: '0.78rem', color: '#334155', marginBottom: 4 }}>{c}</li>)}
                        </ul>
                      ) : (
                        <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>No certifications uploaded</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
                <button onClick={() => setViewCandidate(null)} style={{ height: 38, padding: '0 18px', borderRadius: 8, border: `1px solid ${BORDER}`, background: '#fff', color: '#334155', fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer' }}>
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      })()}

      <style>{`
        .hr-modal-scroll::-webkit-scrollbar { width: 6px; }
        .hr-modal-scroll::-webkit-scrollbar-track { background: transparent; }
        .hr-modal-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
        .hr-modal-scroll::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
        .hr-modal-scroll { scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent; }

        .hr-table-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
        .hr-table-scroll::-webkit-scrollbar-track { background: transparent; }
        .hr-table-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
        .hr-table-scroll::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
        .hr-table-scroll { scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent; }
      `}</style>
    </div>
  )
}

export default HRCandidatesPage
