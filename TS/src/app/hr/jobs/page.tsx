import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { FiSearch, FiBell, FiPlus, FiCalendar, FiFilter, FiChevronDown, FiEye, FiMoreVertical, FiChevronRight, FiChevronsRight, FiChevronLeft, FiChevronsLeft, FiX, FiTrash2, FiCheckCircle, FiEdit2, FiTrendingUp } from 'react-icons/fi'
import { BsBriefcase } from 'react-icons/bs'
import { useAuthContext } from '@/context/useAuthContext'

// ─── Palette ────────────────────────────────────────────────────────────────
const BLUE   = '#2563eb'
const GREEN  = '#10b981'
const ORANGE = '#f59e0b'
const RED    = '#ef4444'
const PURPLE = '#8b5cf6'
const GRAY   = '#64748b'
const ACCENT = '#f2622f' // coral — Create Job button / active tab / active page

const LIGHT = {
  border: '#e2e8f0', cardBg: '#ffffff', headerBg: '#f8fafc', rowHover: '#fafbfc',
  text: '#0f172a', muted: '#64748b', subMuted: '#94a3b8', inputBg: '#ffffff',
  chipBg: '#f8fafc', track: '#f1f5f9', overlay: 'rgba(15,23,42,0.5)', shadow: '0 8px 24px rgba(0,0,0,0.12)',
}
const DARK = {
  border: '#334155', cardBg: '#1e293b', headerBg: '#0f172a', rowHover: '#26364a',
  text: '#f1f5f9', muted: '#94a3b8', subMuted: '#64748b', inputBg: '#0f172a',
  chipBg: '#0f172a', track: '#334155', overlay: 'rgba(0,0,0,0.65)', shadow: '0 8px 24px rgba(0,0,0,0.4)',
}

const STATUSES = ['Active', 'Draft', 'On Hold', 'Closed'] as const
type JobStatus = typeof STATUSES[number]

const STATUS_STYLE: Record<string, { bg: string; color: string; darkBg: string }> = {
  Active:  { bg: '#ecfdf5', color: '#059669', darkBg: 'rgba(16,185,129,0.16)' },
  Draft:   { bg: '#eff6ff', color: '#2563eb', darkBg: 'rgba(37,99,235,0.18)' },
  'On Hold': { bg: '#fff7ed', color: '#d97706', darkBg: 'rgba(217,119,6,0.18)' },
  Closed:  { bg: '#fef2f2', color: '#dc2626', darkBg: 'rgba(220,38,38,0.18)' },
}

const DEPT_COLORS = [PURPLE, BLUE, ORANGE, RED, GREEN]

interface Job {
  _id: string
  title: string
  company: string
  department?: string
  location?: string
  jobType: string
  domain: string
  status?: JobStatus
  expiryDate: string
  isExpired: boolean
  createdAt: string
  reportsTo?: string
  jobSummary?: string
  jobDescription?: string
  workMode?: string
  requiredSkills?: string[]
  preferredSkills?: string[]
  minQualification?: string
  preferredQualification?: string
  minExperience?: number
  maxExperience?: number
  salaryType?: string
  currency?: string
  minSalary?: number
  maxSalary?: number
  salaryPeriod?: string
  benefits?: string[]
  workLocation?: string
  employmentType?: string[]
  experienceLevel?: string[]
  noticePeriod?: string
  workShift?: string
  numberOfOpenings?: number
  applyMethod?: string
  requiredDocuments?: string[]
}

interface Candidate {
  _id: string
  jobId: string | null
  hasApplied?: boolean
  appliedOn?: string | null
  createdAt?: string | null
}

const jobDisplayId = (id: string) => `JD-${id.slice(-5).toUpperCase()}`

const formatDate = (iso?: string) => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const formatTime = (iso?: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

// ─── Donut Chart ─────────────────────────────────────────────────────────────
const DonutChart = ({ overview, total, size = 118, track }: { overview: { label: string; value: number; pct: string; color: string }[]; total: number; size?: number; track: string }) => {
  const cx = size / 2, cy = size / 2, r = size * 0.34, stroke = size * 0.135
  const circum = 2 * Math.PI * r
  let offset = 0
  const segs = overview.map(o => {
    const dash = total > 0 ? (o.value / total) * circum : 0
    const gap  = circum - dash
    const seg  = { ...o, dash, gap, offset: circum * 0.25 - offset }
    offset += dash
    return seg
  })
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <svg width={size} height={size}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={track} strokeWidth={stroke}/>
        {segs.map((s, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={s.color} strokeWidth={stroke}
            strokeDasharray={`${s.dash} ${s.gap}`}
            strokeDashoffset={s.offset}
            strokeLinecap="butt"
          />
        ))}
      </svg>
    </div>
  )
}

// ─── Sparkline (Applications Overview) ───────────────────────────────────────
const Sparkline = ({ data, color }: { data: number[]; color: string }) => {
  const w = 240, h = 64, pad = 4
  const max = Math.max(1, ...data)
  const step = data.length > 1 ? (w - pad * 2) / (data.length - 1) : 0
  const pts = data.map((v, i) => {
    const x = pad + i * step
    const y = h - pad - (v / max) * (h - pad * 2)
    return [x, y]
  })
  const line = pts.map(p => p.join(',')).join(' ')
  const area = `${pad},${h - pad} ${line} ${w - pad},${h - pad}`
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <polygon points={area} fill={color} opacity={0.12} />
      <polyline points={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={2.4} fill={color} />
      ))}
    </svg>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────
const HRJobsPage = () => {
  const navigate = useNavigate()
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()
  const token = (user as any)?.token as string | undefined

  // HR pages don't have a real light/dark toggle (no `data-bs-theme`
  // attribute is ever set here, unlike the student area), so the previous
  // OS-preference fallback silently switched this page to the dark palette
  // whenever the browser/OS was set to dark mode — while the surrounding HR
  // layout stayed light, producing dark cards on a white page. HR is
  // light-only for now, so just force it.
  const isDarkMode = false
  const T = LIGHT

  const [jobs, setJobs] = useState<Job[]>([])
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'All' | JobStatus>('All')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 8

  const [openMenu, setOpenMenu] = useState<{ id: string; rect: DOMRect } | null>(null)
  const [viewJob, setViewJob] = useState<Job | null>(null)
  const [actionError, setActionError] = useState('')
  const [actioningId, setActioningId] = useState<string | null>(null)

  const [filterPanelAnchor, setFilterPanelAnchor] = useState<DOMRect | null>(null)
  const [filterDepartment, setFilterDepartment] = useState('')
  const [filterLocation, setFilterLocation] = useState('')
  const [filterJobType, setFilterJobType] = useState('')
  const [filterWorkMode, setFilterWorkMode] = useState('')

  const fetchJobs = () => {
    if (!baseURL || !token) return
    setLoading(true)
    fetch(`${baseURL}/jobs`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then((data: Job[]) => setJobs(Array.isArray(data) ? data : []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchJobs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseURL, token])

  useEffect(() => {
    if (!baseURL || !token) return
    fetch(`${baseURL}/candidates`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then((data: Candidate[]) => setCandidates(Array.isArray(data) ? data.filter(c => c.hasApplied && c.jobId) : []))
      .catch(() => setCandidates([]))
  }, [baseURL, token])

  useEffect(() => { setPage(1) }, [activeTab, search, filterDepartment, filterLocation, filterJobType, filterWorkMode])

  const changeStatus = async (job: Job, newStatus: JobStatus) => {
    setOpenMenu(null)
    setActionError('')
    setActioningId(job._id)
    try {
      const payload = new FormData()
      payload.append('status', newStatus)
      const res = await fetch(`${baseURL}/jobs/${job._id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: payload,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || 'Failed to update status')
      }
      setJobs(prev => prev.map(j => j._id === job._id ? { ...j, status: newStatus } : j))
    } catch (e: any) {
      setActionError(e?.message || 'Failed to update status')
    } finally {
      setActioningId(null)
    }
  }

  const deleteJob = async (job: Job) => {
    setOpenMenu(null)
    if (!window.confirm(`Delete "${job.title}"? This cannot be undone.`)) return
    setActionError('')
    setActioningId(job._id)
    try {
      const res = await fetch(`${baseURL}/jobs/${job._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || 'Failed to delete job')
      }
      setJobs(prev => prev.filter(j => j._id !== job._id))
    } catch (e: any) {
      setActionError(e?.message || 'Failed to delete job')
    } finally {
      setActioningId(null)
    }
  }

  const counts = useMemo(() => {
    const c: Record<JobStatus, number> = { Active: 0, Draft: 0, 'On Hold': 0, Closed: 0 }
    jobs.forEach(j => { const s = (j.status || 'Active') as JobStatus; if (c[s] !== undefined) c[s]++ })
    return c
  }, [jobs])

  const total = jobs.length

  const OVERVIEW = useMemo(() => ([
    { label: 'Active',  value: counts.Active,    pct: total ? `${Math.round(counts.Active / total * 100)}%` : '0%',    color: GREEN  },
    { label: 'Draft',   value: counts.Draft,     pct: total ? `${Math.round(counts.Draft / total * 100)}%` : '0%',     color: BLUE   },
    { label: 'On Hold', value: counts['On Hold'],pct: total ? `${Math.round(counts['On Hold'] / total * 100)}%` : '0%',color: ORANGE },
    { label: 'Closed',  value: counts.Closed,    pct: total ? `${Math.round(counts.Closed / total * 100)}%` : '0%',    color: RED    },
  ]), [counts, total])

  const jobIdSet = useMemo(() => new Set(jobs.map(j => j._id)), [jobs])

  const applicationsByJob = useMemo(() => {
    const m: Record<string, number> = {}
    candidates.forEach(c => {
      const id = String(c.jobId)
      if (!jobIdSet.has(id)) return
      m[id] = (m[id] || 0) + 1
    })
    return m
  }, [candidates, jobIdSet])

  const scopedApplications = useMemo(() => candidates.filter(c => jobIdSet.has(String(c.jobId))), [candidates, jobIdSet])
  const totalApplications = scopedApplications.length

  const applicationsTrend = useMemo(() => {
    const now = new Date()
    const months = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      return { key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString('en-US', { month: 'short' }), count: 0 }
    })
    scopedApplications.forEach(c => {
      const d = new Date(c.appliedOn || c.createdAt || '')
      if (Number.isNaN(d.getTime())) return
      const k = `${d.getFullYear()}-${d.getMonth()}`
      const m = months.find(m => m.key === k)
      if (m) m.count++
    })
    return months
  }, [scopedApplications])

  const applicationsGrowthPct = useMemo(() => {
    const len = applicationsTrend.length
    if (len < 2) return null
    const last = applicationsTrend[len - 1].count
    const prev = applicationsTrend[len - 2].count
    if (prev === 0) return last > 0 ? 100 : 0
    return Math.round(((last - prev) / prev) * 100)
  }, [applicationsTrend])

  const DEPARTMENTS = useMemo(() => {
    const map: Record<string, number> = {}
    jobs.forEach(j => { const d = j.department?.trim() || 'Unassigned'; map[d] = (map[d] || 0) + 1 })
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1])
    const top = sorted.slice(0, 4).map(([label, count], i) => ({ label, count, color: DEPT_COLORS[i % DEPT_COLORS.length] }))
    const maxCount = top.reduce((m, d) => Math.max(m, d.count), 1)
    return { list: top, maxCount }
  }, [jobs])

  const LOCATIONS = useMemo(() => {
    const map: Record<string, number> = {}
    jobs.forEach(j => { const l = j.location?.trim() || 'Unspecified'; map[l] = (map[l] || 0) + 1 })
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1])
    const top = sorted.slice(0, 5).map(([label, count]) => ({ label, count }))
    const maxCount = top.reduce((m, d) => Math.max(m, d.count), 1)
    return { list: top, maxCount }
  }, [jobs])

  const RECENT_ACTIVITY = useMemo(() => {
    return [...jobs]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 4)
      .map(j => ({
        label: j.title,
        sub: (j.status || 'Active') === 'Active' ? 'Published' : (j.status || 'Active'),
        date: formatDate(j.createdAt),
        time: formatTime(j.createdAt),
        color: STATUS_STYLE[j.status || 'Active']?.color || GRAY,
      }))
  }, [jobs])

  const TABS: { key: 'All' | JobStatus; label: string }[] = [
    { key: 'All', label: `All Jobs (${total})` },
    { key: 'Active', label: `Active (${counts.Active})` },
    { key: 'Draft', label: `Draft (${counts.Draft})` },
    { key: 'On Hold', label: `On Hold (${counts['On Hold']})` },
    { key: 'Closed', label: `Closed (${counts.Closed})` },
  ]

  const departmentOptions = useMemo(() => Array.from(new Set(jobs.map(j => j.department).filter(Boolean))) as string[], [jobs])
  const locationOptions = useMemo(() => Array.from(new Set(jobs.map(j => j.location).filter(Boolean))) as string[], [jobs])
  const jobTypeOptions = useMemo(() => Array.from(new Set(jobs.flatMap(j => j.employmentType || []).filter(Boolean))), [jobs])
  const workModeOptions = useMemo(() => Array.from(new Set(jobs.map(j => j.workMode).filter(Boolean))) as string[], [jobs])

  const activeFilterCount = [filterDepartment, filterLocation, filterJobType, filterWorkMode].filter(Boolean).length

  const resetFilters = () => {
    setFilterDepartment(''); setFilterLocation(''); setFilterJobType(''); setFilterWorkMode('')
  }

  const filteredJobs = useMemo(() => {
    return jobs.filter(j => {
      if (activeTab !== 'All' && (j.status || 'Active') !== activeTab) return false
      if (search) {
        const q = search.toLowerCase()
        if (!j.title.toLowerCase().includes(q) && !(j.department || '').toLowerCase().includes(q)) return false
      }
      if (filterDepartment && j.department !== filterDepartment) return false
      if (filterLocation && j.location !== filterLocation) return false
      if (filterJobType && !(j.employmentType || []).includes(filterJobType)) return false
      if (filterWorkMode && j.workMode !== filterWorkMode) return false
      return true
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [jobs, activeTab, search, filterDepartment, filterLocation, filterJobType, filterWorkMode])

  const pageCount = Math.max(1, Math.ceil(filteredJobs.length / PAGE_SIZE))
  const pagedJobs = filteredJobs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const cardStyle: React.CSSProperties = { background: T.cardBg, borderRadius: 12, border: `1px solid ${T.border}` }

  return (
    <div style={{ minHeight: '100%' }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: T.text }}>Jobs</h1>
          <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: T.muted }}>Manage and track all your job postings.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <FiSearch size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.subMuted }}/>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search jobs by title, department..."
              style={{
                paddingLeft: 32, paddingRight: 12, height: 36, width: 260,
                border: `1px solid ${T.border}`, borderRadius: 8, fontSize: '0.8rem',
                color: T.text, background: T.inputBg, outline: 'none',
              }}
            />
          </div>
          {/* Calendar */}
          <button style={{ width: 36, height: 36, background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: T.muted }}>
            <FiCalendar size={15}/>
          </button>
          {/* Bell */}
          <div style={{ position: 'relative' }}>
            <button style={{ width: 36, height: 36, background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: T.muted }}>
              <FiBell size={15}/>
            </button>
          </div>
          {/* Create Job */}
          <button
            onClick={() => navigate('/hr/jobs/create')}
            style={{ display: 'flex', alignItems: 'center', gap: 7, background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, padding: '0 16px', height: 36, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
          >
            <FiPlus size={15}/> Create Job
          </button>
        </div>
      </div>

      {actionError && (
        <div style={{ background: isDarkMode ? 'rgba(220,38,38,0.15)' : '#fef2f2', color: isDarkMode ? '#fca5a5' : '#dc2626', fontSize: '0.82rem', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>{actionError}</div>
      )}

      {/* Status tabs — standalone full-width bar above the content, matching
          the tab treatment on /hr/settings (Team Access & Permissions etc.)
          instead of being squeezed inside the table card's own header row. */}
      <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${T.border}`, marginBottom: 16, flexWrap: 'wrap' }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '10px 16px', fontSize: '0.82rem', fontWeight: activeTab === tab.key ? 600 : 400,
              color: activeTab === tab.key ? ACCENT : T.muted,
              borderBottom: activeTab === tab.key ? `2px solid ${ACCENT}` : '2px solid transparent',
              marginBottom: -1,
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main content: table + sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'stretch' }}>

        {/* Left: table */}
        <div style={{ ...cardStyle, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Toolbar row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '12px 20px', borderBottom: `1px solid ${T.border}`, flexShrink: 0, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={e => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  setFilterPanelAnchor(prev => prev ? null : rect)
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: activeFilterCount > 0 ? (isDarkMode ? 'rgba(37,99,235,0.18)' : '#eff6ff') : T.chipBg, border: `1px solid ${activeFilterCount > 0 ? '#bfdbfe' : T.border}`, borderRadius: 7, padding: '6px 12px', fontSize: '0.78rem', color: activeFilterCount > 0 ? BLUE : T.text, cursor: 'pointer', fontWeight: 500 }}
              >
                <FiFilter size={13}/> Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
              </button>
            </div>
          </div>

          {filterPanelAnchor && createPortal(
            <>
              <div onClick={() => setFilterPanelAnchor(null)} style={{ position: 'fixed', inset: 0, zIndex: 199 }} />
              <div style={{
                position: 'fixed', top: filterPanelAnchor.bottom + 6, left: filterPanelAnchor.left, width: 260,
                background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 12,
                boxShadow: T.shadow, zIndex: 200, padding: 16,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: T.text }}>Filters</span>
                  <span onClick={resetFilters} style={{ fontSize: '0.74rem', color: BLUE, fontWeight: 600, cursor: 'pointer' }}>Clear all</span>
                </div>
                {[
                  { label: 'Department', value: filterDepartment, set: setFilterDepartment, options: departmentOptions, placeholder: 'All Departments' },
                  { label: 'Location', value: filterLocation, set: setFilterLocation, options: locationOptions, placeholder: 'All Locations' },
                  { label: 'Job Type', value: filterJobType, set: setFilterJobType, options: jobTypeOptions, placeholder: 'All Job Types' },
                  { label: 'Work Mode', value: filterWorkMode, set: setFilterWorkMode, options: workModeOptions, placeholder: 'All Work Modes' },
                ].map(f => (
                  <div key={f.label} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 600, color: T.text, marginBottom: 6 }}>{f.label}</div>
                    <select
                      value={f.value}
                      onChange={e => f.set(e.target.value)}
                      style={{ width: '100%', height: 34, border: `1px solid ${T.border}`, borderRadius: 7, padding: '0 8px', fontSize: '0.78rem', background: T.inputBg, color: T.text, colorScheme: isDarkMode ? 'dark' : 'light' }}
                    >
                      <option value="">{f.placeholder}</option>
                      {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
                <button
                  onClick={() => setFilterPanelAnchor(null)}
                  style={{ width: '100%', background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, padding: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', marginTop: 4 }}
                >
                  Apply
                </button>
              </div>
            </>,
            document.body
          )}

          {/* Table */}
          <div style={{ flex: 1, overflow: 'auto' }} onScroll={() => setOpenMenu(null)}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.headerBg }}>
                  {['Job Title', 'Job ID', 'Department', 'Location', 'Applications', 'Status', 'Created On', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '11px 16px', fontSize: '0.74rem', fontWeight: 600, color: T.muted, textAlign: 'left', borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!loading && pagedJobs.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ padding: '40px 16px', textAlign: 'center', fontSize: '0.85rem', color: T.muted }}>
                      No jobs found.
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td colSpan={8} style={{ padding: '40px 16px', textAlign: 'center', fontSize: '0.85rem', color: T.muted }}>
                      Loading jobs…
                    </td>
                  </tr>
                )}
                {!loading && pagedJobs.map((job) => {
                  const st = STATUS_STYLE[job.status || 'Active']
                  return (
                    <tr key={job._id} style={{ borderBottom: `1px solid ${T.border}` }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = T.rowHover}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                    >
                      <td style={{ padding: '16px 16px', fontSize: '0.82rem', fontWeight: 600, color: T.text }}>{job.title}</td>
                      <td style={{ padding: '16px 16px', fontSize: '0.8rem', color: T.muted }}>{jobDisplayId(job._id)}</td>
                      <td style={{ padding: '16px 16px', fontSize: '0.8rem', color: T.text }}>{job.department || '—'}</td>
                      <td style={{ padding: '16px 16px', fontSize: '0.8rem', color: T.text }}>{job.location || '—'}</td>
                      <td style={{ padding: '16px 16px', fontSize: '0.82rem', fontWeight: 500, color: T.text }}>{applicationsByJob[job._id] || 0}</td>
                      <td style={{ padding: '16px 16px' }}>
                        <span style={{ background: isDarkMode ? st.darkBg : st.bg, color: st.color, fontSize: '0.72rem', fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>{job.status || 'Active'}</span>
                      </td>
                      <td style={{ padding: '16px 16px', fontSize: '0.78rem', color: T.muted }}>{formatDate(job.createdAt)}</td>
                      <td style={{ padding: '16px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
                          <button onClick={() => setViewJob(job)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.subMuted, padding: 3, display: 'flex', alignItems: 'center' }} title="View">
                            <FiEye size={15}/>
                          </button>
                          <button
                            onClick={e => {
                              const rect = e.currentTarget.getBoundingClientRect()
                              setOpenMenu(prev => prev?.id === job._id ? null : { id: job._id, rect })
                            }}
                            disabled={actioningId === job._id}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.subMuted, padding: 3, display: 'flex', alignItems: 'center', opacity: actioningId === job._id ? 0.5 : 1 }}
                            title="More"
                          >
                            <FiMoreVertical size={15}/>
                          </button>

                          {openMenu?.id === job._id && createPortal(
                            <>
                              <div onClick={() => setOpenMenu(null)} style={{ position: 'fixed', inset: 0, zIndex: 199 }} />
                              <div style={{
                                position: 'fixed', top: openMenu.rect.bottom + 4, left: openMenu.rect.right - 170, minWidth: 170,
                                background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 10,
                                boxShadow: T.shadow, zIndex: 200, overflow: 'hidden',
                              }}>
                                <button
                                  onClick={() => { setOpenMenu(null); navigate(`/hr/jobs/create?id=${job._id}`) }}
                                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: 'none', border: 'none', color: T.text, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = T.rowHover }}
                                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
                                >
                                  <FiEdit2 size={13} /> Edit Job
                                </button>
                                <div style={{ borderTop: `1px solid ${T.border}` }} />
                                <div style={{ padding: '8px 12px', fontSize: '0.68rem', color: T.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Set status</div>
                                {STATUSES.filter(s => s !== (job.status || 'Active')).map(s => (
                                  <button
                                    key={s}
                                    onClick={() => changeStatus(job, s)}
                                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'none', border: 'none', color: T.text, fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', textAlign: 'left' }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = T.rowHover }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
                                  >
                                    <FiCheckCircle size={13} color={STATUS_STYLE[s].color} /> Mark as {s}
                                  </button>
                                ))}
                                <div style={{ borderTop: `1px solid ${T.border}` }} />
                                <button
                                  onClick={() => deleteJob(job)}
                                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: 'none', border: 'none', color: '#ef4444', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = isDarkMode ? 'rgba(239,68,68,0.14)' : '#fef2f2' }}
                                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
                                >
                                  <FiTrash2 size={13} /> Delete
                                </button>
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: `1px solid ${T.border}`, flexShrink: 0, flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: '0.78rem', color: T.muted }}>
              {filteredJobs.length === 0 ? 'Showing 0 jobs' : `Showing ${(page - 1) * PAGE_SIZE + 1} to ${Math.min(page * PAGE_SIZE, filteredJobs.length)} of ${filteredJobs.length} jobs`}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button onClick={() => setPage(1)} disabled={page === 1} style={{ width: 30, height: 30, border: `1px solid ${T.border}`, borderRadius: 6, background: T.cardBg, color: T.muted, cursor: page === 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: page === 1 ? 0.5 : 1 }}>
                <FiChevronsLeft size={13}/>
              </button>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ width: 30, height: 30, border: `1px solid ${T.border}`, borderRadius: 6, background: T.cardBg, color: T.muted, cursor: page === 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: page === 1 ? 0.5 : 1 }}>
                <FiChevronLeft size={13}/>
              </button>
              {Array.from({ length: pageCount }).slice(0, 3).map((_, i) => {
                const p = i + 1
                const isActive = p === page
                return (
                  <button key={p} onClick={() => setPage(p)} style={{
                    width: 30, height: 30, border: isActive ? 'none' : `1px solid ${T.border}`,
                    borderRadius: 6, background: isActive ? ACCENT : T.cardBg,
                    color: isActive ? '#fff' : T.muted,
                    fontSize: '0.78rem', fontWeight: isActive ? 700 : 400,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {p}
                  </button>
                )
              })}
              <button onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page === pageCount} style={{ width: 30, height: 30, border: `1px solid ${T.border}`, borderRadius: 6, background: T.cardBg, color: T.muted, cursor: page === pageCount ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: page === pageCount ? 0.5 : 1 }}>
                <FiChevronRight size={13}/>
              </button>
              <button onClick={() => setPage(pageCount)} disabled={page === pageCount} style={{ width: 30, height: 30, border: `1px solid ${T.border}`, borderRadius: 6, background: T.cardBg, color: T.muted, cursor: page === pageCount ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: page === pageCount ? 0.5 : 1 }}>
                <FiChevronsRight size={13}/>
              </button>
            </div>
          </div>
        </div>

        {/* Right: sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Job Overview */}
          <div style={{ ...cardStyle, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: T.text }}>Job Overview</span>
              <button style={{ display: 'flex', alignItems: 'center', gap: 4, background: T.chipBg, border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 10px', fontSize: '0.74rem', color: T.text, cursor: 'pointer' }}>
                This Month <FiChevronDown size={11}/>
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ position: 'relative' }}>
                <DonutChart overview={OVERVIEW} total={total} track={T.track}/>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '1.15rem', fontWeight: 800, color: T.text, lineHeight: 1 }}>{total}</span>
                  <span style={{ fontSize: '0.56rem', color: T.muted, lineHeight: 1.5, textAlign: 'center' }}>Total<br/>Jobs</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {OVERVIEW.map(o => (
                  <div key={o.label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: o.color, flexShrink: 0 }}/>
                    <span style={{ fontSize: '0.76rem', color: T.muted, width: 48 }}>{o.label}</span>
                    <span style={{ fontSize: '0.76rem', fontWeight: 700, color: T.text }}>{o.value} ({o.pct})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Applications Overview */}
          <div style={{ ...cardStyle, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: T.text }}>Applications Overview</span>
              <button style={{ display: 'flex', alignItems: 'center', gap: 4, background: T.chipBg, border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 10px', fontSize: '0.74rem', color: T.text, cursor: 'pointer' }}>
                This Month <FiChevronDown size={11}/>
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: T.text }}>{totalApplications}</span>
              <span style={{ fontSize: '0.76rem', color: T.muted }}>Total Applications</span>
            </div>
            {applicationsGrowthPct !== null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 10, fontSize: '0.72rem', fontWeight: 600, color: applicationsGrowthPct >= 0 ? GREEN : RED }}>
                <FiTrendingUp size={12} style={{ transform: applicationsGrowthPct >= 0 ? 'none' : 'scaleY(-1)' }}/>
                {applicationsGrowthPct >= 0 ? '+' : ''}{applicationsGrowthPct}% vs last month
              </div>
            )}
            <Sparkline data={applicationsTrend.map(m => m.count)} color={ACCENT}/>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              {applicationsTrend.map(m => (
                <span key={m.key} style={{ fontSize: '0.62rem', color: T.subMuted }}>{m.label}</span>
              ))}
            </div>
          </div>

          {/* Top Departments */}
          <div style={{ ...cardStyle, padding: 18 }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: T.text, display: 'block', marginBottom: 14 }}>Top Departments</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {DEPARTMENTS.list.length === 0 && (
                <span style={{ fontSize: '0.78rem', color: T.muted }}>No jobs yet.</span>
              )}
              {DEPARTMENTS.list.map(d => (
                <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '0.76rem', color: T.text, width: 76, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.label}</span>
                  <div style={{ flex: 1, height: 6, background: T.track, borderRadius: 4 }}>
                    <div style={{ height: '100%', width: `${(d.count / DEPARTMENTS.maxCount) * 100}%`, background: d.color, borderRadius: 4 }}/>
                  </div>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: T.text, width: 18, textAlign: 'right', flexShrink: 0 }}>{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row: Recent Job Activity + Jobs by Location + Status Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16, marginTop: 16 }}>
        {/* Recent Job Activity */}
        <div style={{ ...cardStyle, padding: 18 }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: T.text, display: 'block', marginBottom: 14 }}>Recent Job Activity</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {RECENT_ACTIVITY.length === 0 && (
              <span style={{ fontSize: '0.78rem', color: T.muted }}>No activity yet.</span>
            )}
            {RECENT_ACTIVITY.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.color, marginTop: 4, flexShrink: 0 }}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.label}</div>
                  <div style={{ fontSize: '0.7rem', color: T.muted }}>{a.sub}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '0.68rem', color: T.text, fontWeight: 500 }}>{a.date}</div>
                  <div style={{ fontSize: '0.65rem', color: T.subMuted }}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Jobs by Location */}
        <div style={{ ...cardStyle, padding: 18 }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: T.text, display: 'block', marginBottom: 14 }}>Jobs by Location</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {LOCATIONS.list.length === 0 && (
              <span style={{ fontSize: '0.78rem', color: T.muted }}>No jobs yet.</span>
            )}
            {LOCATIONS.list.map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '0.76rem', color: T.text, width: 90, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.label}</span>
                <div style={{ flex: 1, height: 6, background: T.track, borderRadius: 4 }}>
                  <div style={{ height: '100%', width: `${(l.count / LOCATIONS.maxCount) * 100}%`, background: ACCENT, borderRadius: 4 }}/>
                </div>
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: T.text, width: 18, textAlign: 'right', flexShrink: 0 }}>{l.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status Distribution */}
        <div style={{ ...cardStyle, padding: 18 }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: T.text, display: 'block', marginBottom: 14 }}>Status Distribution</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ position: 'relative' }}>
              <DonutChart overview={OVERVIEW} total={total} size={92} track={T.track}/>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: T.text, lineHeight: 1 }}>{total}</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {OVERVIEW.map(o => (
                <div key={o.label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: o.color, flexShrink: 0 }}/>
                  <span style={{ fontSize: '0.72rem', color: T.muted }}>{o.label} ({o.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* View Details modal */}
      {viewJob && (
        <div style={{ position: 'fixed', inset: 0, background: T.overlay, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: T.cardBg, borderRadius: 14, width: 640, maxWidth: '100%', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 50px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '18px 22px', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: isDarkMode ? 'rgba(242,98,47,0.16)' : '#fef1ec', color: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <BsBriefcase size={19}/>
                </div>
                <div>
                  <span style={{ fontSize: '1.05rem', fontWeight: 700, color: T.text }}>{viewJob.title}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    <span style={{ background: isDarkMode ? STATUS_STYLE[viewJob.status || 'Active'].darkBg : STATUS_STYLE[viewJob.status || 'Active'].bg, color: STATUS_STYLE[viewJob.status || 'Active'].color, fontSize: '0.72rem', fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>{viewJob.status || 'Active'}</span>
                    <span style={{ fontSize: '0.78rem', color: T.muted }}>{jobDisplayId(viewJob._id)}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setViewJob(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.subMuted, display: 'flex' }}>
                <FiX size={18}/>
              </button>
            </div>

            <div className="hr-modal-scroll" style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', flex: 1 }}>
              <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: T.text, marginBottom: 12 }}>Job Details</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                  {[
                    ['Department', viewJob.department],
                    ['Location', viewJob.location],
                    ['Company', viewJob.company],
                    ['Job Type', viewJob.employmentType?.[0]],
                    ['Work Mode', viewJob.workMode],
                    ['Experience Level', viewJob.experienceLevel?.[0]],
                    ['Reports To', viewJob.reportsTo],
                    ['Created On', formatDate(viewJob.createdAt)],
                    ['Openings', viewJob.numberOfOpenings],
                  ].map(([label, value]) => (
                    <div key={label as string}>
                      <div style={{ fontSize: '0.68rem', color: T.muted, marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: '0.82rem', color: T.text, fontWeight: 600 }}>{value || '—'}</div>
                    </div>
                  ))}
                </div>
              </div>

              {(viewJob.jobSummary || viewJob.jobDescription) && (
                <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
                  {viewJob.jobSummary && (
                    <div style={{ marginBottom: viewJob.jobDescription ? 16 : 0 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: T.text, marginBottom: 6 }}>Job Summary</div>
                      <div style={{ fontSize: '0.82rem', color: T.text, lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: viewJob.jobSummary }} />
                    </div>
                  )}
                  {viewJob.jobDescription && (
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: T.text, marginBottom: 6 }}>Job Description</div>
                      <div style={{ fontSize: '0.82rem', color: T.text, lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: viewJob.jobDescription }} />
                    </div>
                  )}
                </div>
              )}

              {!!viewJob.requiredSkills?.length && (
                <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: T.text, marginBottom: 10 }}>Required Skills</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {viewJob.requiredSkills.map(s => (
                      <span key={s} style={{ background: isDarkMode ? 'rgba(37,99,235,0.18)' : '#eff6ff', color: BLUE, fontSize: '0.76rem', fontWeight: 600, padding: '4px 10px', borderRadius: 6 }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {((viewJob.salaryType && viewJob.salaryType !== 'Not Disclosed' && viewJob.minSalary && viewJob.maxSalary) || !!viewJob.benefits?.length) && (
                <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
                  {viewJob.salaryType && viewJob.salaryType !== 'Not Disclosed' && viewJob.minSalary && viewJob.maxSalary && (
                    <div style={{ marginBottom: viewJob.benefits?.length ? 14 : 0 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: T.text, marginBottom: 6 }}>Compensation</div>
                      <div style={{ fontSize: '0.82rem', color: T.text }}>
                        {viewJob.currency || 'INR'} {viewJob.minSalary?.toLocaleString()} - {viewJob.maxSalary?.toLocaleString()} ({viewJob.salaryPeriod || 'Per Year'})
                      </div>
                    </div>
                  )}
                  {!!viewJob.benefits?.length && (
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: T.text, marginBottom: 6 }}>Benefits</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {viewJob.benefits.map(b => (
                          <span key={b} style={{ background: isDarkMode ? 'rgba(16,185,129,0.16)' : '#ecfdf5', color: '#059669', fontSize: '0.76rem', fontWeight: 600, padding: '4px 10px', borderRadius: 6 }}>{b}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 22px', borderTop: `1px solid ${T.border}`, flexShrink: 0 }}>
              <button onClick={() => setViewJob(null)} style={{ height: 38, padding: '0 18px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.cardBg, color: T.text, fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .hr-modal-scroll::-webkit-scrollbar { width: 6px; }
        .hr-modal-scroll::-webkit-scrollbar-track { background: transparent; }
        .hr-modal-scroll::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 4px; }
        .hr-modal-scroll::-webkit-scrollbar-thumb:hover { background: ${T.subMuted}; }
        .hr-modal-scroll { scrollbar-width: thin; scrollbar-color: ${T.border} transparent; }
      `}</style>
    </div>
  )
}

export default HRJobsPage
