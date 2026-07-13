import React, { useEffect, useMemo, useState } from 'react'
import { Spinner } from 'react-bootstrap'
import JobDetailsModal from './JobDetailsModal'
import ExternalJobBoard from './ExternalJobBoard'
import { useAuthContext } from '@/context/useAuthContext'
import {
  FiSearch, FiMapPin, FiBookmark, FiBriefcase, FiClock,
  FiChevronLeft, FiChevronRight, FiList, FiGrid, FiSliders,
  FiX, FiChevronDown, FiTool,
} from 'react-icons/fi'
import { FaLock, FaStar } from 'react-icons/fa'

export interface Job {
  _id: string
  title: string
  company: string
  experience: string
  salary: string
  location: string
  skills: string[]
  highlights: string[]
  jobType: 'Internship' | 'Fresher' | 'Experienced'
  domain: 'Tech' | 'Non-Tech'
  logo: string
  postedDate: string
  expiryDate: string
  isExpired: boolean
  isRead: boolean
  tag?: string
  attachments?: Array<{ fileName?: string; fileUrl?: string; mimeType?: string; size?: number }>
}

// ── helpers ──────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10

const AVATAR_COLORS = [
  ['#4F46E5', '#EEF2FF'], ['#0891B2', '#ECFEFF'], ['#16A34A', '#F0FDF4'],
  ['#DC2626', '#FEF2F2'], ['#D97706', '#FFFBEB'], ['#7C3AED', '#F5F3FF'],
  ['#DB2777', '#FDF2F8'], ['#0D9488', '#F0FDFA'],
]

const avatarColor = (name: string) => {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}

const initials = (name: string) =>
  name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')

const timeAgo = (dateStr: string) => {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
  return `${Math.floor(d / 30)}mo ago`
}

// ── sub-components ────────────────────────────────────────────────────────────

const JobRow = ({
  job, onSelect, saved, onToggleSave, canView,
}: {
  job: Job; onSelect: (j: Job) => void; saved: boolean
  onToggleSave: (id: string) => void; canView: boolean
}) => {
  const [fg, bg] = avatarColor(job.company)
  const badge = job.tag
  const badgeColor = badge === 'New' ? '#16a34a' : badge === 'Hot' ? '#dc2626' : '#ff7a00'

  return (
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
      padding: '22px 24px', display: 'flex', alignItems: 'flex-start',
      gap: 16, cursor: 'pointer', transition: 'box-shadow 0.15s',
    }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
      onClick={() => canView && onSelect(job)}
    >
      {/* Avatar */}
      <div style={{
        width: 46, height: 46, borderRadius: 10, flexShrink: 0,
        background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.85rem', fontWeight: 800, color: fg,
      }}>
        {initials(job.company)}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Row 1: title + badge + time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>{job.title}</span>
          {badge && (
            <span style={{
              background: `${badgeColor}18`, color: badgeColor, border: `1px solid ${badgeColor}44`,
              borderRadius: 6, padding: '1px 7px', fontSize: '0.65rem', fontWeight: 700,
            }}>{badge}</span>
          )}
          <span style={{ marginLeft: 'auto', fontSize: '0.68rem', color: '#94a3b8', whiteSpace: 'nowrap', flexShrink: 0 }}>
            <FiClock size={10} style={{ marginRight: 3 }} />{timeAgo(job.postedDate)}
          </span>
        </div>

        {/* Row 2: company + meta */}
        <div style={{ fontSize: '0.75rem', color: '#475569', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600 }}>{job.company}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><FiMapPin size={11} />{job.location}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><FiBriefcase size={11} />{job.jobType}</span>
          {job.experience && <span>&#x23F1; {job.experience}</span>}
        </div>

        {/* Skills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {job.skills.slice(0, 5).map(s => (
            <span key={s} style={{
              background: 'rgba(255,122,0,0.06)', border: '1px solid rgba(255,122,0,0.2)',
              color: '#c05c00', borderRadius: 20, padding: '2px 9px',
              fontSize: '0.65rem', fontWeight: 600,
            }}>{s}</span>
          ))}
        </div>
      </div>

      {/* Right: bookmark + apply */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, flexShrink: 0 }}>
        <button
          onClick={e => { e.stopPropagation(); onToggleSave(job._id) }}
          style={{
            background: saved ? 'rgba(255,122,0,0.1)' : 'none',
            border: '1px solid #e2e8f0', borderRadius: 8,
            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: saved ? '#ff7a00' : '#94a3b8',
          }}
        >
          <FiBookmark size={14} fill={saved ? '#ff7a00' : 'none'} />
        </button>
        <button
          onClick={e => { e.stopPropagation(); if (canView) onSelect(job) }}
          style={{
            background: canView ? '#ff7a00' : '#94a3b8',
            border: 'none', borderRadius: 8, color: '#fff',
            padding: '7px 16px', fontSize: '0.75rem', fontWeight: 700,
            cursor: canView ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap',
          }}
        >
          {canView ? 'View Details' : <><FaLock size={10} style={{ marginRight: 4 }} />Locked</>}
        </button>
      </div>
    </div>
  )
}

// ── Recommended section ───────────────────────────────────────────────────────

const RecommendedSection = ({
  jobs, recPage, setRecPage, REC_PAGE_SIZE,
}: {
  jobs: Job[]; recPage: number; setRecPage: React.Dispatch<React.SetStateAction<number>>; REC_PAGE_SIZE: number
}) => {
  const recTotal = Math.ceil(jobs.length / REC_PAGE_SIZE)
  const recJobs = jobs.slice((recPage - 1) * REC_PAGE_SIZE, recPage * REC_PAGE_SIZE)
  return (
    <div style={{ marginTop: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>Recommended for You</span>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginLeft: 8 }}>Jobs matching your profile and interests</span>
        </div>
        {recTotal > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button onClick={() => setRecPage(p => Math.max(p - 1, 1))} disabled={recPage === 1}
              style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: recPage === 1 ? '#cbd5e1' : '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: recPage === 1 ? 'default' : 'pointer' }}>
              <FiChevronLeft size={12} />
            </button>
            {Array.from({ length: recTotal }, (_, i) => i + 1).map(n => (
              <button key={n} onClick={() => setRecPage(n)} style={{
                width: 26, height: 26, borderRadius: 6,
                border: `1px solid ${recPage === n ? '#ff7a00' : '#e2e8f0'}`,
                background: recPage === n ? '#ff7a00' : '#fff',
                color: recPage === n ? '#fff' : '#475569',
                fontSize: '0.72rem', fontWeight: recPage === n ? 700 : 400, cursor: 'pointer',
              }}>{n}</button>
            ))}
            <button onClick={() => setRecPage(p => Math.min(p + 1, recTotal))} disabled={recPage === recTotal}
              style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: recPage === recTotal ? '#cbd5e1' : '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: recPage === recTotal ? 'default' : 'pointer' }}>
              <FiChevronRight size={12} />
            </button>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {recJobs.map(job => {
          const [fg, bg] = avatarColor(job.company)
          const match = 80 + (job.company.charCodeAt(0) % 18)
          return (
            <div key={job._id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 14px 10px', minWidth: 160, width: 170, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: bg, color: fg, fontWeight: 800, fontSize: '0.72rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {initials(job.company)}
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>{job.title.length > 16 ? job.title.slice(0, 16) + '…' : job.title}</div>
                  <div style={{ fontSize: '0.62rem', color: '#64748b' }}>{job.company.split(' ')[0]}</div>
                </div>
              </div>
              <div style={{ fontSize: '0.62rem', color: '#64748b', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 3 }}>
                <FiMapPin size={9} />{job.location.split(',')[0]}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ flex: 1, height: 4, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${match}%`, height: '100%', background: '#ff7a00', borderRadius: 4 }} />
                </div>
                <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#ff7a00' }}>{match}% Match</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── main component ────────────────────────────────────────────────────────────

const InterviewDetailsPageView = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()
  const token = user?.token
  const normalizedStatus = (user?.status || '').trim().toLowerCase()
  const isApproved = normalizedStatus === 'approved'
  const isPending = normalizedStatus === 'pending'

  // data
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())

  // tabs
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'applied' | 'shortlisted' | 'interview' | 'offers' | 'saved' | 'live'>('all')

  // search / filters
  const [searchQ, setSearchQ] = useState('')
  const [locationQ, setLocationQ] = useState('')
  const [jobType, setJobType] = useState('')
  const [domain, setDomain] = useState('')
  const [skillFilter, setSkillFilter] = useState('')
  const [experienceFilter, setExperienceFilter] = useState('')
  const [salaryRange, setSalaryRange] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [sortBy, setSortBy] = useState('newest')

  // pagination
  const [page, setPage] = useState(1)
  const [recPage, setRecPage] = useState(1)
  const REC_PAGE_SIZE = 5

  useEffect(() => { if (token) fetchJobs() }, [token])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${baseURL}/jobs/student`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error('Failed to fetch jobs')
      const data = await res.json()
      const list = Array.isArray(data) ? data : data?.jobs ?? data?.data ?? data?.results ?? []
      setJobs(list)
    } catch (err: any) {
      setError(err.message)
      setJobs([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    setPage(1)
    let list = jobs
    if (activeSubTab === 'saved') list = list.filter(j => j.isRead)
    if (searchQ) list = list.filter(j =>
      j.title.toLowerCase().includes(searchQ.toLowerCase()) ||
      j.company.toLowerCase().includes(searchQ.toLowerCase()) ||
      j.skills.some(s => s.toLowerCase().includes(searchQ.toLowerCase()))
    )
    if (locationQ) list = list.filter(j => j.location.toLowerCase().includes(locationQ.toLowerCase()))
    if (jobType) list = list.filter(j => j.jobType === jobType)
    if (domain) list = list.filter(j => j.domain === domain)
    if (skillFilter) list = list.filter(j => j.skills.some(s => s.toLowerCase().includes(skillFilter.toLowerCase())))
    if (experienceFilter) list = list.filter(j => j.experience?.toLowerCase().includes(experienceFilter.toLowerCase()))
    if (salaryRange) list = list.filter(j => j.salary?.includes(salaryRange))

    if (sortBy === 'newest') list = [...list].sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime())
    return list
  }, [jobs, searchQ, locationQ, jobType, domain, skillFilter, experienceFilter, salaryRange, sortBy, activeSubTab, savedIds])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const toggleSave = (id: string) =>
    setSavedIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })

  const clearFilters = () => { setJobType(''); setDomain(''); setLocationQ(''); setSkillFilter(''); setExperienceFilter(''); setSalaryRange('') }
  const activeFilterCount = [jobType, domain, locationQ, skillFilter, experienceFilter, salaryRange].filter(Boolean).length

  // unique locations from data
  const locationOptions = useMemo(() => {
    const set = new Set(jobs.map(j => j.location.split(',')[0].trim()))
    return [...set].slice(0, 5)
  }, [jobs])

  const skillOptions = useMemo(() => {
    const set = new Set(jobs.flatMap(j => j.skills))
    return [...set].slice(0, 8)
  }, [jobs])

  const markedCount = useMemo(() => jobs.filter(j => j.isRead).length, [jobs])

  const UNDER_CONSTRUCTION_TABS = ['applied', 'shortlisted', 'interview', 'offers'] as const

  const SUB_TABS = [
    { key: 'all',         label: 'All Jobs',       count: jobs.length,  live: false },
    { key: 'live',        label: 'External Jobs',  count: 0,            live: true  },
    { key: 'applied',     label: 'Applied',         count: 0,            live: false },
    { key: 'shortlisted', label: 'Shortlisted',     count: 0,            live: false },
    { key: 'interview',   label: 'Interview',       count: 0,            live: false },
    { key: 'offers',      label: 'Offers',          count: 0,            live: false },
    { key: 'saved',       label: 'Saved',           count: markedCount,  live: false },
  ] as const

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>

      {/* ── Top bar ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div>
          <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.15rem', lineHeight: 1 }}>All Jobs</div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>Explore opportunities and find the right role for your career.</div>
        </div>

        {/* Search */}
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
          <div style={{ width: 320, position: 'relative' }}>
            <FiSearch size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              placeholder="Search by job title, company, skills..."
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              style={{ width: '100%', paddingLeft: 32, paddingRight: 12, height: 36, border: '1px solid #e2e8f0', borderRadius: 20, fontSize: '0.78rem', color: '#0f172a', outline: 'none', background: '#f8fafc', boxSizing: 'border-box' as const }}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <FiMapPin size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <select
              value={locationQ}
              onChange={e => setLocationQ(e.target.value)}
              style={{ paddingLeft: 28, paddingRight: 28, height: 36, border: '1px solid #e2e8f0', borderRadius: 20, fontSize: '0.78rem', color: '#0f172a', outline: 'none', background: '#f8fafc', appearance: 'none', cursor: 'pointer', minWidth: 130 }}
            >
              <option value="">All Locations</option>
              {locationOptions.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <FiChevronDown size={12} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
          </div>
        </div>
      </div>

      {/* ── Sub tabs ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 24px', display: 'flex', gap: 0, overflowX: 'auto' }}>
        {SUB_TABS.map(t => {
          const locked = t.live && isPending
          const active = activeSubTab === t.key
          return (
            <button
              key={t.key}
              onClick={() => !locked && setActiveSubTab(t.key as any)}
              title={locked ? 'Enroll to unlock live jobs' : undefined}
              style={{
                background: 'none', border: 'none',
                borderBottom: `2.5px solid ${active ? '#ff7a00' : 'transparent'}`,
                color: active ? '#ff7a00' : locked ? '#cbd5e1' : '#64748b',
                fontWeight: active ? 700 : 500,
                fontSize: '0.82rem', padding: '12px 16px',
                cursor: locked ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
              }}
            >
              {t.label}
              {t.live && !locked && (
                <span style={{ background: '#16a34a', color: '#fff', borderRadius: 4, padding: '1px 5px', fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.04em', animation: 'livePulse 2s ease-in-out infinite' }}>
                  LIVE
                </span>
              )}
              {t.live && locked && (
                <FaLock size={10} style={{ color: '#cbd5e1' }} />
              )}
              {!t.live && t.count > 0 && (
                <span style={{
                  background: active ? 'rgba(255,122,0,0.12)' : '#f1f5f9',
                  color: active ? '#ff7a00' : '#64748b',
                  borderRadius: 20, padding: '1px 7px', fontSize: '0.65rem', fontWeight: 700,
                }}>{t.count}</span>
              )}
            </button>
          )
        })}
      </div>
      <style>{`
        @keyframes livePulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
        .filter-sidebar-scroll { scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent; }
        .filter-sidebar-scroll::-webkit-scrollbar { width: 3px; }
        .filter-sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .filter-sidebar-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
      `}</style>

      {/* ── Live jobs (ExternalJobBoard) ── */}
      {activeSubTab === 'live' && (
        <div style={{ padding: '20px 24px' }}>
          <ExternalJobBoard />
        </div>
      )}

      {/* ── Under Construction tabs ── */}
      {(UNDER_CONSTRUCTION_TABS as readonly string[]).includes(activeSubTab) && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center' }}>
          <div style={{
            width: 90, height: 90, borderRadius: '50%',
            background: 'rgba(255,122,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 20,
          }}>
            <FiTool size={38} color="#ff7a00" />
          </div>
          <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.25rem', marginBottom: 8 }}>
            Under Construction
          </div>
          <div style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: 380, lineHeight: 1.6 }}>
            This section is currently being built. Check back soon — we're working hard to bring you this feature!
          </div>
          <div style={{
            marginTop: 28, display: 'flex', gap: 8, alignItems: 'center',
            background: 'rgba(255,122,0,0.06)', border: '1px solid rgba(255,122,0,0.2)',
            borderRadius: 10, padding: '10px 20px',
          }}>
            <span style={{ fontSize: '0.78rem', color: '#ff7a00', fontWeight: 600 }}>Coming Soon</span>
          </div>
        </div>
      )}

      {/* ── Campus jobs body ── */}
      {activeSubTab !== 'live' && !(UNDER_CONSTRUCTION_TABS as readonly string[]).includes(activeSubTab) && <div style={{ display: 'flex', gap: 20, padding: '20px 24px', alignItems: 'flex-start' }}>

        {/* ── Left: Job list ── */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Results bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: '0.82rem', color: '#ff7a00', fontWeight: 700 }}>
              {filtered.length} Jobs found
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Sort */}
              <div style={{ position: 'relative' }}>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '5px 28px 5px 10px', fontSize: '0.75rem', color: '#475569', background: '#fff', outline: 'none', cursor: 'pointer', appearance: 'none' }}
                >
                  <option value="newest">Sort by: Newest First</option>
                  <option value="oldest">Sort by: Oldest First</option>
                </select>
                <FiChevronDown size={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
              </div>
              {/* View toggle */}
              <div style={{ display: 'flex', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                {(['list', 'grid'] as const).map(m => (
                  <button key={m} onClick={() => setViewMode(m)} style={{
                    width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: viewMode === m ? '#ff7a00' : '#fff', border: 'none',
                    color: viewMode === m ? '#fff' : '#94a3b8', cursor: 'pointer',
                  }}>
                    {m === 'list' ? <FiList size={14} /> : <FiGrid size={14} />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <Spinner animation="border" style={{ color: '#ff7a00' }} />
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '16px 20px', color: '#dc2626', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          {/* Empty */}
          {!loading && !error && paginated.length === 0 && (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '48px 24px', textAlign: 'center' }}>
              <FiBriefcase size={40} style={{ color: '#cbd5e1', marginBottom: 12 }} />
              <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                {activeSubTab === 'saved' ? 'No marked jobs yet' : 'No jobs found'}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                {activeSubTab === 'saved'
                  ? 'Jobs you mark as read will appear here'
                  : 'Try adjusting your filters or search terms'}
              </div>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} style={{ marginTop: 14, background: '#ff7a00', border: 'none', borderRadius: 8, color: '#fff', padding: '8px 18px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {/* Job list */}
          {!loading && !error && paginated.length > 0 && (
            viewMode === 'grid' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                {paginated.map(job => {
                  const [fg, bg] = avatarColor(job.company)
                  return (
                    <div key={job._id} onClick={() => isApproved && setSelectedJob(job)}
                      style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, cursor: 'pointer', display: 'flex', flexDirection: 'column', minHeight: 200 }}>
                      {/* Header */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 9, background: bg, color: fg, fontWeight: 800, fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {initials(job.company)}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.title}</div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{job.company}</div>
                        </div>
                      </div>
                      {/* Meta */}
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><FiMapPin size={10} />{job.location}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><FiBriefcase size={10} />{job.jobType}</span>
                      </div>
                      {/* Skills */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, flex: 1 }}>
                        {job.skills.slice(0, 4).map(s => (
                          <span key={s} style={{ background: 'rgba(255,122,0,0.06)', border: '1px solid rgba(255,122,0,0.2)', color: '#c05c00', borderRadius: 20, padding: '2px 8px', fontSize: '0.62rem', fontWeight: 600, height: 'fit-content' }}>{s}</span>
                        ))}
                      </div>
                      {/* Apply button — always at bottom */}
                      <button
                        onClick={e => { e.stopPropagation(); if (isApproved) setSelectedJob(job) }}
                        style={{ marginTop: 14, width: '100%', background: isApproved ? '#ff7a00' : '#94a3b8', border: 'none', borderRadius: 8, color: '#fff', padding: '9px', fontSize: '0.78rem', fontWeight: 700, cursor: isApproved ? 'pointer' : 'not-allowed' }}>
                        {isApproved ? 'View Details' : 'Locked'}
                      </button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {paginated.map(job => (
                  <JobRow
                    key={job._id}
                    job={job}
                    onSelect={setSelectedJob}
                    saved={savedIds.has(job._id)}
                    onToggleSave={toggleSave}
                    canView={isApproved}
                  />
                ))}
              </div>
            )
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 20 }}>
              <button
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
                style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: page === 1 ? '#cbd5e1' : '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: page === 1 ? 'default' : 'pointer' }}
              >
                <FiChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let n = i + 1
                if (totalPages > 5) {
                  if (page <= 3) n = i + 1
                  else if (page >= totalPages - 2) n = totalPages - 4 + i
                  else n = page - 2 + i
                }
                return (
                  <button key={n} onClick={() => setPage(n)} style={{
                    width: 32, height: 32, borderRadius: 8,
                    border: `1px solid ${page === n ? '#ff7a00' : '#e2e8f0'}`,
                    background: page === n ? '#ff7a00' : '#fff',
                    color: page === n ? '#fff' : '#475569',
                    fontWeight: page === n ? 700 : 400, fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}>{n}</button>
                )
              })}
              {totalPages > 5 && page < totalPages - 2 && <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>...</span>}
              {totalPages > 5 && page < totalPages - 2 && (
                <button onClick={() => setPage(totalPages)} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: '0.82rem', cursor: 'pointer' }}>{totalPages}</button>
              )}
              <button
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: page === totalPages ? '#cbd5e1' : '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: page === totalPages ? 'default' : 'pointer' }}
              >
                <FiChevronRight size={14} />
              </button>
            </div>
          )}

          {/* Recommended */}
          {!loading && jobs.length > 0 && (
            <RecommendedSection
              jobs={jobs}
              recPage={recPage}
              setRecPage={setRecPage}
              REC_PAGE_SIZE={REC_PAGE_SIZE}
            />
          )}
        </div>

        {/* ── Right: Filters sidebar ── */}
        <div style={{ width: 260, flexShrink: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, position: 'sticky', top: 16, maxHeight: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Scrollable filter options */}
          <div className="filter-sidebar-scroll" style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 0' }}>

          {/* Job Type */}
          <FilterSection title="Job Type">
            {(['Internship', 'Fresher', 'Experienced'] as const).map(t => {
              const cnt = jobs.filter(j => j.jobType === t).length
              return <CheckRow key={t} label={t} count={cnt} checked={jobType === t} onChange={() => setJobType(jobType === t ? '' : t)} />
            })}
          </FilterSection>

          {/* Experience Level */}
          <FilterSection title="Experience Level">
            {[
              { label: 'Fresher (0-1 Yrs)', key: '0-1' },
              { label: '1-3 Years',         key: '1-3' },
              { label: '2-4 Years',         key: '2-4' },
              { label: '5+ Years',          key: '5'   },
            ].map(({ label, key }) => {
              const cnt = jobs.filter(j => j.experience?.includes(key)).length
              return <CheckRow key={key} label={label} count={cnt} checked={experienceFilter === key} onChange={() => setExperienceFilter(experienceFilter === key ? '' : key)} />
            })}
          </FilterSection>

          {/* Domain */}
          <FilterSection title="Domain">
            {(['Tech', 'Non-Tech'] as const).map(d => {
              const cnt = jobs.filter(j => j.domain === d).length
              return <CheckRow key={d} label={d} count={cnt} checked={domain === d} onChange={() => setDomain(domain === d ? '' : d)} />
            })}
          </FilterSection>

          {/* Location */}
          <FilterSection title="Location">
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <FiSearch size={11} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                placeholder="Search location"
                value={locationQ}
                onChange={e => setLocationQ(e.target.value)}
                style={{ width: '100%', paddingLeft: 26, height: 32, border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.75rem', color: '#0f172a', outline: 'none', background: '#fff' }}
              />
            </div>
            {locationOptions.map(l => {
              const cnt = jobs.filter(j => j.location.toLowerCase().includes(l.toLowerCase())).length
              return <CheckRow key={l} label={l} count={cnt} checked={locationQ === l} onChange={() => setLocationQ(locationQ === l ? '' : l)} />
            })}
          </FilterSection>

          {/* Skills */}
          <FilterSection title="Skills">
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <FiSearch size={11} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                placeholder="Search skills"
                value={skillFilter}
                onChange={e => setSkillFilter(e.target.value)}
                style={{ width: '100%', paddingLeft: 26, height: 32, border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.75rem', color: '#0f172a', outline: 'none', background: '#fff' }}
              />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {skillOptions.map(s => {
                const active = skillFilter === s
                return (
                  <button key={s} onClick={() => setSkillFilter(active ? '' : s)} style={{
                    background: active ? 'rgba(255,122,0,0.1)' : '#f8fafc',
                    border: `1px solid ${active ? '#ff7a00' : '#e2e8f0'}`,
                    color: active ? '#ff7a00' : '#475569',
                    borderRadius: 20, padding: '3px 10px', fontSize: '0.65rem', fontWeight: 600,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    {s}{active && <FiX size={10} />}
                  </button>
                )
              })}
            </div>
          </FilterSection>

          {/* Salary Range */}
          <FilterSection title="Salary Range">
            <div style={{ position: 'relative' }}>
              <select
                value={salaryRange}
                onChange={e => setSalaryRange(e.target.value)}
                style={{ width: '100%', height: 34, border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.75rem', color: salaryRange ? '#0f172a' : '#94a3b8', outline: 'none', background: '#fff', paddingLeft: 10, paddingRight: 28, appearance: 'none', cursor: 'pointer' }}
              >
                <option value="">Select Range</option>
                <option value="0-3">0 – 3 LPA</option>
                <option value="3-6">3 – 6 LPA</option>
                <option value="6-10">6 – 10 LPA</option>
                <option value="10-15">10 – 15 LPA</option>
                <option value="15">15+ LPA</option>
              </select>
              <FiChevronDown size={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
            </div>
          </FilterSection>

          </div>{/* end scrollable */}

          {/* Apply / Clear — pinned at bottom */}
          <div style={{ padding: '12px 16px 16px', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0, background: '#fff' }}>
            <button style={{ width: '100%', background: '#ff7a00', border: 'none', borderRadius: 10, color: '#fff', padding: '10px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <FiSliders size={13} /> Apply Filters
            </button>
            <button onClick={clearFilters} style={{ width: '100%', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, color: activeFilterCount > 0 ? '#ff7a00' : '#94a3b8', padding: '9px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
              Clear Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </button>
          </div>
        </div>
      </div>}

      <JobDetailsModal
        show={!!selectedJob}
        onHide={() => setSelectedJob(null)}
        job={selectedJob}
        onMarkedAsRead={(id) => setJobs(prev => prev.map(j => j._id === id ? { ...j, isRead: true } : j))}
        jobs={filtered}
        onSelectJob={setSelectedJob}
        savedIds={savedIds}
        onToggleSave={toggleSave}
      />
    </div>
  )
}

// ── tiny reusable sub-components ─────────────────────────────────────────────

const FilterSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 14, marginBottom: 14 }}>
    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.78rem', marginBottom: 10 }}>{title}</div>
    {children}
  </div>
)

const CheckRow = ({ label, count, checked, onChange }: { label: string; count: number; checked: boolean; onChange: () => void }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 7, userSelect: 'none' }}>
    <div
      onClick={onChange}
      style={{
        width: 16, height: 16, borderRadius: 4, flexShrink: 0, cursor: 'pointer',
        border: `1.5px solid ${checked ? '#ff7a00' : '#cbd5e1'}`,
        background: checked ? '#ff7a00' : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {checked && (
        <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
          <path d="M1 3.5L3.5 6L8 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
    <span style={{ fontSize: '0.75rem', color: '#334155', flex: 1 }}>{label}</span>
    <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600 }}>{count}</span>
  </label>
)

export default InterviewDetailsPageView
