import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { FiSearch, FiBell, FiPlus, FiCalendar, FiFilter, FiChevronDown, FiEye, FiMoreVertical, FiChevronRight, FiChevronsRight, FiChevronLeft, FiChevronsLeft, FiX, FiTrash2, FiCheckCircle, FiEdit2 } from 'react-icons/fi'
import { BsBriefcase } from 'react-icons/bs'
import { MdOutlinePause, MdOutlineCheckCircle } from 'react-icons/md'
import { AiOutlineClockCircle } from 'react-icons/ai'
import { useAuthContext } from '@/context/useAuthContext'

// ─── Palette ────────────────────────────────────────────────────────────────
const BLUE   = '#2563eb'
const GREEN  = '#10b981'
const ORANGE = '#f59e0b'
const RED    = '#ef4444'
const PURPLE = '#8b5cf6'
const GRAY   = '#64748b'
const BORDER = '#e2e8f0'

const STATUSES = ['Active', 'Draft', 'On Hold', 'Closed'] as const
type JobStatus = typeof STATUSES[number]

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  Active:  { bg: '#ecfdf5', color: '#059669' },
  Draft:   { bg: '#eff6ff', color: '#2563eb' },
  'On Hold': { bg: '#fff7ed', color: '#d97706' },
  Closed:  { bg: '#fef2f2', color: '#dc2626' },
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
const DonutChart = ({ overview, total }: { overview: { label: string; value: number; pct: string; color: string }[]; total: number }) => {
  const size = 118, cx = 59, cy = 59, r = 40, stroke = 16
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <svg width={size} height={size}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={BORDER} strokeWidth={stroke}/>
          {segs.map((s, i) => (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={s.color} strokeWidth={stroke}
              strokeDasharray={`${s.dash} ${s.gap}`}
              strokeDashoffset={s.offset}
              strokeLinecap="butt"
            />
          ))}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{total}</span>
          <span style={{ fontSize: '0.56rem', color: GRAY, lineHeight: 1.5, textAlign: 'center' }}>Total<br/>Jobs</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {overview.map(o => (
          <div key={o.label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: o.color, flexShrink: 0 }}/>
            <span style={{ fontSize: '0.76rem', color: GRAY, width: 48 }}>{o.label}</span>
            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#0f172a' }}>{o.value} ({o.pct})</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────
const HRJobsPage = () => {
  const navigate = useNavigate()
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()
  const token = (user as any)?.token as string | undefined

  const [jobs, setJobs] = useState<Job[]>([])
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

  const DEPARTMENTS = useMemo(() => {
    const map: Record<string, number> = {}
    jobs.forEach(j => { const d = j.department?.trim() || 'Unassigned'; map[d] = (map[d] || 0) + 1 })
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1])
    const top = sorted.slice(0, 4).map(([label, count], i) => ({ label, count, color: DEPT_COLORS[i % DEPT_COLORS.length] }))
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

  return (
    <div style={{ minHeight: '100%' }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' }}>Jobs</h1>
          <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: GRAY }}>Manage and track all your job postings.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <FiSearch size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}/>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search jobs by title, department..."
              style={{
                paddingLeft: 32, paddingRight: 12, height: 36, width: 260,
                border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: '0.8rem',
                color: '#334155', background: '#fff', outline: 'none',
              }}
            />
          </div>
          {/* Calendar */}
          <button style={{ width: 36, height: 36, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' }}>
            <FiCalendar size={15}/>
          </button>
          {/* Bell */}
          <div style={{ position: 'relative' }}>
            <button style={{ width: 36, height: 36, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' }}>
              <FiBell size={15}/>
            </button>
          </div>
          {/* Create Job */}
          <button
            onClick={() => navigate('/hr/jobs/create')}
            style={{ display: 'flex', alignItems: 'center', gap: 7, background: BLUE, color: '#fff', border: 'none', borderRadius: 8, padding: '0 16px', height: 36, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
          >
            <FiPlus size={15}/> Create Job
          </button>
        </div>
      </div>

      {actionError && (
        <div style={{ background: '#fef2f2', color: '#dc2626', fontSize: '0.82rem', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>{actionError}</div>
      )}

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Jobs',   value: total,             sub: 'All time',                                                     icon: <BsBriefcase size={20}/>,          ic: BLUE,   bg: '#eff6ff' },
          { label: 'Active Jobs',  value: counts.Active,     sub: OVERVIEW[0].pct + ' of total',                                  icon: <MdOutlineCheckCircle size={20}/>, ic: GREEN,  bg: '#ecfdf5', subColor: GREEN  },
          { label: 'Draft Jobs',   value: counts.Draft,      sub: OVERVIEW[1].pct + ' of total',                                  icon: <AiOutlineClockCircle size={20}/>, ic: ORANGE, bg: '#fff7ed', subColor: ORANGE },
          { label: 'On Hold',      value: counts['On Hold'], sub: OVERVIEW[2].pct + ' of total',                                  icon: <MdOutlinePause size={20}/>,       ic: RED,    bg: '#fef2f2', subColor: RED    },
          { label: 'Closed Jobs',  value: counts.Closed,     sub: OVERVIEW[3].pct + ' of total',                                  icon: <MdOutlineCheckCircle size={20}/>, ic: BLUE,   bg: '#eff6ff', subColor: BLUE   },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.ic, flexShrink: 0 }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: GRAY, marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>{s.value}</div>
              <div style={{ fontSize: '0.72rem', color: (s as any).subColor || GRAY, fontWeight: 500, marginTop: 2 }}>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main content: table + sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'stretch' }}>

        {/* Left: tabs + table */}
        <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Tabs row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: 0 }}>
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '14px 16px', fontSize: '0.82rem', fontWeight: activeTab === tab.key ? 600 : 400,
                    color: activeTab === tab.key ? BLUE : GRAY,
                    borderBottom: activeTab === tab.key ? `2px solid ${BLUE}` : '2px solid transparent',
                    marginBottom: -1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={e => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  setFilterPanelAnchor(prev => prev ? null : rect)
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: activeFilterCount > 0 ? '#eff6ff' : '#f8fafc', border: `1px solid ${activeFilterCount > 0 ? '#bfdbfe' : BORDER}`, borderRadius: 7, padding: '6px 12px', fontSize: '0.78rem', color: activeFilterCount > 0 ? BLUE : '#334155', cursor: 'pointer', fontWeight: 500 }}
              >
                <FiFilter size={13}/> Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
              </button>
              <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', border: `1px solid ${BORDER}`, borderRadius: 7, padding: '6px 12px', fontSize: '0.78rem', color: '#334155', cursor: 'pointer', fontWeight: 500 }}>
                Sort by: Created On <FiChevronDown size={12}/>
              </button>
            </div>
          </div>

          {filterPanelAnchor && createPortal(
            <>
              <div onClick={() => setFilterPanelAnchor(null)} style={{ position: 'fixed', inset: 0, zIndex: 199 }} />
              <div style={{
                position: 'fixed', top: filterPanelAnchor.bottom + 6, left: filterPanelAnchor.left, width: 260,
                background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12,
                boxShadow: '0 12px 32px rgba(0,0,0,0.14)', zIndex: 200, padding: 16,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>Filters</span>
                  <span onClick={resetFilters} style={{ fontSize: '0.74rem', color: BLUE, fontWeight: 600, cursor: 'pointer' }}>Clear all</span>
                </div>
                {[
                  { label: 'Department', value: filterDepartment, set: setFilterDepartment, options: departmentOptions, placeholder: 'All Departments' },
                  { label: 'Location', value: filterLocation, set: setFilterLocation, options: locationOptions, placeholder: 'All Locations' },
                  { label: 'Job Type', value: filterJobType, set: setFilterJobType, options: jobTypeOptions, placeholder: 'All Job Types' },
                  { label: 'Work Mode', value: filterWorkMode, set: setFilterWorkMode, options: workModeOptions, placeholder: 'All Work Modes' },
                ].map(f => (
                  <div key={f.label} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 600, color: '#334155', marginBottom: 6 }}>{f.label}</div>
                    <select
                      value={f.value}
                      onChange={e => f.set(e.target.value)}
                      style={{ width: '100%', height: 34, border: `1px solid ${BORDER}`, borderRadius: 7, padding: '0 8px', fontSize: '0.78rem', background: '#fff', color: '#0f172a', colorScheme: 'light' }}
                    >
                      <option value="">{f.placeholder}</option>
                      {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
                <button
                  onClick={() => setFilterPanelAnchor(null)}
                  style={{ width: '100%', background: BLUE, color: '#fff', border: 'none', borderRadius: 8, padding: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', marginTop: 4 }}
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
                <tr style={{ background: '#f8fafc' }}>
                  {['Job Title', 'Job ID', 'Department', 'Location', 'Applications', 'Status', 'Created On', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '11px 16px', fontSize: '0.74rem', fontWeight: 600, color: GRAY, textAlign: 'left', borderBottom: `1px solid ${BORDER}`, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!loading && pagedJobs.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ padding: '40px 16px', textAlign: 'center', fontSize: '0.85rem', color: GRAY }}>
                      No jobs found.
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td colSpan={8} style={{ padding: '40px 16px', textAlign: 'center', fontSize: '0.85rem', color: GRAY }}>
                      Loading jobs…
                    </td>
                  </tr>
                )}
                {!loading && pagedJobs.map((job) => {
                  const st = STATUS_STYLE[job.status || 'Active']
                  return (
                    <tr key={job._id} style={{ borderBottom: `1px solid #f1f5f9` }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#fafbfc'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                    >
                      <td style={{ padding: '16px 16px', fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>{job.title}</td>
                      <td style={{ padding: '16px 16px', fontSize: '0.8rem', color: GRAY }}>{jobDisplayId(job._id)}</td>
                      <td style={{ padding: '16px 16px', fontSize: '0.8rem', color: '#334155' }}>{job.department || '—'}</td>
                      <td style={{ padding: '16px 16px', fontSize: '0.8rem', color: '#334155' }}>{job.location || '—'}</td>
                      <td style={{ padding: '16px 16px', fontSize: '0.82rem', fontWeight: 500, color: '#0f172a' }}>0</td>
                      <td style={{ padding: '16px 16px' }}>
                        <span style={{ background: st.bg, color: st.color, fontSize: '0.72rem', fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>{job.status || 'Active'}</span>
                      </td>
                      <td style={{ padding: '16px 16px', fontSize: '0.78rem', color: GRAY }}>{formatDate(job.createdAt)}</td>
                      <td style={{ padding: '16px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
                          <button onClick={() => setViewJob(job)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 3, display: 'flex', alignItems: 'center' }} title="View">
                            <FiEye size={15}/>
                          </button>
                          <button
                            onClick={e => {
                              const rect = e.currentTarget.getBoundingClientRect()
                              setOpenMenu(prev => prev?.id === job._id ? null : { id: job._id, rect })
                            }}
                            disabled={actioningId === job._id}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 3, display: 'flex', alignItems: 'center', opacity: actioningId === job._id ? 0.5 : 1 }}
                            title="More"
                          >
                            <FiMoreVertical size={15}/>
                          </button>

                          {openMenu?.id === job._id && createPortal(
                            <>
                              <div onClick={() => setOpenMenu(null)} style={{ position: 'fixed', inset: 0, zIndex: 199 }} />
                              <div style={{
                                position: 'fixed', top: openMenu.rect.bottom + 4, left: openMenu.rect.right - 170, minWidth: 170,
                                background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 10,
                                boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 200, overflow: 'hidden',
                              }}>
                                <button
                                  onClick={() => { setOpenMenu(null); navigate(`/hr/jobs/create?id=${job._id}`) }}
                                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: 'none', border: 'none', color: '#334155', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f8fafc' }}
                                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
                                >
                                  <FiEdit2 size={13} /> Edit Job
                                </button>
                                <div style={{ borderTop: `1px solid ${BORDER}` }} />
                                <div style={{ padding: '8px 12px', fontSize: '0.68rem', color: GRAY, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Set status</div>
                                {STATUSES.filter(s => s !== (job.status || 'Active')).map(s => (
                                  <button
                                    key={s}
                                    onClick={() => changeStatus(job, s)}
                                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'none', border: 'none', color: '#334155', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', textAlign: 'left' }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f8fafc' }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
                                  >
                                    <FiCheckCircle size={13} color={STATUS_STYLE[s].color} /> Mark as {s}
                                  </button>
                                ))}
                                <div style={{ borderTop: `1px solid ${BORDER}` }} />
                                <button
                                  onClick={() => deleteJob(job)}
                                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: 'none', border: 'none', color: '#ef4444', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#fef2f2' }}
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
            <span style={{ fontSize: '0.78rem', color: GRAY }}>
              {filteredJobs.length === 0 ? 'Showing 0 jobs' : `Showing ${(page - 1) * PAGE_SIZE + 1} to ${Math.min(page * PAGE_SIZE, filteredJobs.length)} of ${filteredJobs.length} jobs`}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button onClick={() => setPage(1)} disabled={page === 1} style={{ width: 30, height: 30, border: `1px solid ${BORDER}`, borderRadius: 6, background: '#fff', color: GRAY, cursor: page === 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: page === 1 ? 0.5 : 1 }}>
                <FiChevronsLeft size={13}/>
              </button>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ width: 30, height: 30, border: `1px solid ${BORDER}`, borderRadius: 6, background: '#fff', color: GRAY, cursor: page === 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: page === 1 ? 0.5 : 1 }}>
                <FiChevronLeft size={13}/>
              </button>
              {Array.from({ length: pageCount }).slice(0, 3).map((_, i) => {
                const p = i + 1
                const isActive = p === page
                return (
                  <button key={p} onClick={() => setPage(p)} style={{
                    width: 30, height: 30, border: isActive ? 'none' : `1px solid ${BORDER}`,
                    borderRadius: 6, background: isActive ? BLUE : '#fff',
                    color: isActive ? '#fff' : GRAY,
                    fontSize: '0.78rem', fontWeight: isActive ? 700 : 400,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {p}
                  </button>
                )
              })}
              <button onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page === pageCount} style={{ width: 30, height: 30, border: `1px solid ${BORDER}`, borderRadius: 6, background: '#fff', color: GRAY, cursor: page === pageCount ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: page === pageCount ? 0.5 : 1 }}>
                <FiChevronRight size={13}/>
              </button>
              <button onClick={() => setPage(pageCount)} disabled={page === pageCount} style={{ width: 30, height: 30, border: `1px solid ${BORDER}`, borderRadius: 6, background: '#fff', color: GRAY, cursor: page === pageCount ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: page === pageCount ? 0.5 : 1 }}>
                <FiChevronsRight size={13}/>
              </button>
            </div>
          </div>
        </div>

        {/* Right: sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, height: '100%' }}>

          {/* Job Overview */}
          <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>Job Overview</span>
              <button style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f8fafc', border: `1px solid ${BORDER}`, borderRadius: 6, padding: '4px 10px', fontSize: '0.74rem', color: '#334155', cursor: 'pointer' }}>
                This Month <FiChevronDown size={11}/>
              </button>
            </div>
            <DonutChart overview={OVERVIEW} total={total}/>
          </div>

          {/* Top Departments */}
          <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, padding: 18 }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: 14 }}>Top Departments</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {DEPARTMENTS.list.length === 0 && (
                <span style={{ fontSize: '0.78rem', color: GRAY }}>No jobs yet.</span>
              )}
              {DEPARTMENTS.list.map(d => (
                <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '0.76rem', color: '#334155', width: 76, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.label}</span>
                  <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 4 }}>
                    <div style={{ height: '100%', width: `${(d.count / DEPARTMENTS.maxCount) * 100}%`, background: d.color, borderRadius: 4 }}/>
                  </div>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#0f172a', width: 18, textAlign: 'right', flexShrink: 0 }}>{d.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Job Activity */}
          <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, padding: 18, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>Recent Job Activity</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {RECENT_ACTIVITY.length === 0 && (
                <span style={{ fontSize: '0.78rem', color: GRAY }}>No activity yet.</span>
              )}
              {RECENT_ACTIVITY.map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.color, marginTop: 4, flexShrink: 0 }}/>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0f172a' }}>{a.label}</div>
                    <div style={{ fontSize: '0.7rem', color: GRAY }}>{a.sub}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '0.68rem', color: '#334155', fontWeight: 500 }}>{a.date}</div>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* View Details modal */}
      {viewJob && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 14, width: 640, maxWidth: '100%', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 50px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '18px 22px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: '#eff6ff', color: BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <BsBriefcase size={19}/>
                </div>
                <div>
                  <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>{viewJob.title}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    <span style={{ background: STATUS_STYLE[viewJob.status || 'Active'].bg, color: STATUS_STYLE[viewJob.status || 'Active'].color, fontSize: '0.72rem', fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>{viewJob.status || 'Active'}</span>
                    <span style={{ fontSize: '0.78rem', color: GRAY }}>{jobDisplayId(viewJob._id)}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setViewJob(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
                <FiX size={18}/>
              </button>
            </div>

            <div className="hr-modal-scroll" style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', flex: 1 }}>
              <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Job Details</div>
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
                      <div style={{ fontSize: '0.68rem', color: GRAY, marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: '0.82rem', color: '#0f172a', fontWeight: 600 }}>{value || '—'}</div>
                    </div>
                  ))}
                </div>
              </div>

              {(viewJob.jobSummary || viewJob.jobDescription) && (
                <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16 }}>
                  {viewJob.jobSummary && (
                    <div style={{ marginBottom: viewJob.jobDescription ? 16 : 0 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Job Summary</div>
                      <div style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: viewJob.jobSummary }} />
                    </div>
                  )}
                  {viewJob.jobDescription && (
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Job Description</div>
                      <div style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: viewJob.jobDescription }} />
                    </div>
                  )}
                </div>
              )}

              {!!viewJob.requiredSkills?.length && (
                <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>Required Skills</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {viewJob.requiredSkills.map(s => (
                      <span key={s} style={{ background: '#eff6ff', color: BLUE, fontSize: '0.76rem', fontWeight: 600, padding: '4px 10px', borderRadius: 6 }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {((viewJob.salaryType && viewJob.salaryType !== 'Not Disclosed' && viewJob.minSalary && viewJob.maxSalary) || !!viewJob.benefits?.length) && (
                <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16 }}>
                  {viewJob.salaryType && viewJob.salaryType !== 'Not Disclosed' && viewJob.minSalary && viewJob.maxSalary && (
                    <div style={{ marginBottom: viewJob.benefits?.length ? 14 : 0 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Compensation</div>
                      <div style={{ fontSize: '0.82rem', color: '#334155' }}>
                        {viewJob.currency || 'INR'} {viewJob.minSalary?.toLocaleString()} - {viewJob.maxSalary?.toLocaleString()} ({viewJob.salaryPeriod || 'Per Year'})
                      </div>
                    </div>
                  )}
                  {!!viewJob.benefits?.length && (
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Benefits</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {viewJob.benefits.map(b => (
                          <span key={b} style={{ background: '#ecfdf5', color: '#059669', fontSize: '0.76rem', fontWeight: 600, padding: '4px 10px', borderRadius: 6 }}>{b}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 22px', borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
              <button onClick={() => setViewJob(null)} style={{ height: 38, padding: '0 18px', borderRadius: 8, border: `1px solid ${BORDER}`, background: '#fff', color: '#334155', fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .hr-modal-scroll::-webkit-scrollbar { width: 6px; }
        .hr-modal-scroll::-webkit-scrollbar-track { background: transparent; }
        .hr-modal-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
        .hr-modal-scroll::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
        .hr-modal-scroll { scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent; }
      `}</style>
    </div>
  )
}

export default HRJobsPage
