import { useEffect, useMemo, useState } from 'react'
import { FiSearch, FiCalendar, FiBell, FiEye, FiRotateCcw, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { useAuthContext } from '@/context/useAuthContext'

const BLUE   = '#2563eb'
const GREEN  = '#10b981'
const GRAY   = '#64748b'
const BORDER = '#e2e8f0'

const AVATAR_COLORS = [
  ['#4F46E5', '#EEF2FF'], ['#0891B2', '#ECFEFF'], ['#16A34A', '#F0FDF4'],
  ['#DC2626', '#FEF2F2'], ['#D97706', '#FFFBEB'], ['#7C3AED', '#F5F3FF'],
]
const avatarColor = (name: string) => AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length]
const initials = (name: string) => (name || '?').split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '?'

const RECOMMENDATION_COLOR: Record<string, string> = { Shortlist: GREEN, Hire: GREEN, Hold: '#f59e0b', 'Needs Improvement': '#f59e0b', 'Not Selected': '#ef4444' }
const APPROVAL_BADGE: Record<string, { label: string; color: string }> = {
  Approved: { label: 'Approved', color: GREEN },
  Rejected: { label: 'Rejected', color: '#ef4444' },
  Hold: { label: 'On Hold', color: '#f59e0b' },
  Pending: { label: 'Pending Approval', color: '#f59e0b' },
}

type StageTab = 'TechnicalCleared' | 'HRCleared' | 'Offered' | 'Joined' | 'Rejected'
const STAGE_TABS: { key: StageTab; label: string }[] = [
  { key: 'TechnicalCleared', label: 'Technical Cleared' },
  { key: 'HRCleared', label: 'HR Cleared' },
  { key: 'Offered', label: 'Offered' },
  { key: 'Joined', label: 'Joined' },
  { key: 'Rejected', label: 'Rejected' },
]

interface CandidateRow {
  _id: string
  name: string
  jobId: string
  jobTitle: string
  experience: string
  score: number | null
  appliedOn: string
  technicalRecommendation: string | null
  technicalApprovalStatus: string | null
  technicalComments: string
  hrRecommendation: string | null
  hrApprovalStatus: string | null
  hrComments: string
}

const PAGE_SIZE = 5
const EXPERIENCE_BUCKETS = ['All', '0-2 Yrs', '2-5 Yrs', '5+ Yrs']
const DATE_RANGES = ['All Time', 'Last 7 Days', 'Last 30 Days']

const experienceYears = (exp: string) => {
  const match = (exp || '').match(/(\d+(\.\d+)?)/)
  return match ? parseFloat(match[1]) : null
}

const HMCandidatesPage = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()
  const token = (user as any)?.token as string | undefined

  const [rows, setRows] = useState<CandidateRow[]>([])
  const [jobs, setJobs] = useState<{ _id: string; title: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [activeTab, setActiveTab] = useState<StageTab>('TechnicalCleared')
  const [jobFilter, setJobFilter] = useState('All')
  const [experienceFilter, setExperienceFilter] = useState('All')
  const [dateFilter, setDateFilter] = useState('All Time')
  const [page, setPage] = useState(1)
  const [viewRow, setViewRow] = useState<CandidateRow | null>(null)

  const memberName = (user as any)?.fullName || (user as any)?.name || 'Hiring Manager'
  const [pfg, pbg] = avatarColor(memberName)

  useEffect(() => {
    if (!baseURL || !token) return
    setLoading(true)
    fetch(`${baseURL}/hiring-manager/candidate-review?tab=${activeTab}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('Failed to load candidates'))))
      .then(data => { setRows(Array.isArray(data.rows) ? data.rows : []); setJobs(Array.isArray(data.jobs) ? data.jobs : []); setLoadError('') })
      .catch(e => setLoadError(e.message || 'Failed to load candidates'))
      .finally(() => setLoading(false))
  }, [baseURL, token, activeTab])

  useEffect(() => { setPage(1) }, [activeTab, jobFilter, experienceFilter, dateFilter])

  const filtered = useMemo(() => {
    const now = Date.now()
    return rows.filter(r => {
      if (jobFilter !== 'All' && r.jobId !== jobFilter) return false
      if (experienceFilter !== 'All') {
        const yrs = experienceYears(r.experience)
        if (yrs == null) return false
        if (experienceFilter === '0-2 Yrs' && !(yrs >= 0 && yrs <= 2)) return false
        if (experienceFilter === '2-5 Yrs' && !(yrs > 2 && yrs <= 5)) return false
        if (experienceFilter === '5+ Yrs' && !(yrs > 5)) return false
      }
      if (dateFilter !== 'All Time' && r.appliedOn) {
        const days = (now - new Date(r.appliedOn).getTime()) / (1000 * 60 * 60 * 24)
        if (dateFilter === 'Last 7 Days' && days > 7) return false
        if (dateFilter === 'Last 30 Days' && days > 30) return false
      }
      return true
    })
  }, [rows, jobFilter, experienceFilter, dateFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const resetFilters = () => { setJobFilter('All'); setExperienceFilter('All'); setDateFilter('All Time') }

  const inputBase = { border: `1px solid ${BORDER}`, borderRadius: 8, background: '#fff', color: '#334155', colorScheme: 'light' as const }
  const selectStyle = { ...inputBase, height: 34, width: '100%', fontSize: '0.78rem', padding: '0 8px' }

  return (
    <div style={{ minHeight: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' }}>Candidate Review</h1>
          <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: GRAY }}>Track candidates through technical, HR, offer and joining stages.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <FiSearch size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}/>
            <input placeholder="Search…" style={{ ...inputBase, paddingLeft: 32, paddingRight: 12, height: 36, width: 200, fontSize: '0.8rem', outline: 'none' }} />
          </div>
          <button style={{ width: 36, height: 36, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' }}>
            <FiCalendar size={15}/>
          </button>
          <button style={{ width: 36, height: 36, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' }}>
            <FiBell size={15}/>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px 5px 5px', borderRadius: 40, border: `1px solid ${BORDER}`, background: '#fff' }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: pbg, color: pfg, fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{initials(memberName)}</div>
          </div>
        </div>
      </div>

      {loadError && <div style={{ background: '#fef2f2', color: '#dc2626', fontSize: '0.82rem', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>{loadError}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '220px minmax(0, 1fr)', gap: 16, alignItems: 'flex-start' }}>
        {/* Filters sidebar */}
        <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, padding: 16 }}>
          <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Filter By</div>

          <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: GRAY, marginBottom: 5 }}>Job</label>
          <select value={jobFilter} onChange={e => setJobFilter(e.target.value)} style={{ ...selectStyle, marginBottom: 14 }}>
            <option value="All">All Jobs</option>
            {jobs.map(j => <option key={j._id} value={j._id}>{j.title}</option>)}
          </select>

          <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: GRAY, marginBottom: 5 }}>Stage</label>
          <select value={activeTab} onChange={e => setActiveTab(e.target.value as StageTab)} style={{ ...selectStyle, marginBottom: 14 }}>
            {STAGE_TABS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>

          <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: GRAY, marginBottom: 5 }}>Experience</label>
          <select value={experienceFilter} onChange={e => setExperienceFilter(e.target.value)} style={{ ...selectStyle, marginBottom: 14 }}>
            {EXPERIENCE_BUCKETS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>

          <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: GRAY, marginBottom: 5 }}>Date</label>
          <select value={dateFilter} onChange={e => setDateFilter(e.target.value)} style={{ ...selectStyle, marginBottom: 16 }}>
            {DATE_RANGES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          <button onClick={resetFilters} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, height: 32, borderRadius: 7, border: `1px solid ${BORDER}`, background: '#f8fafc', color: '#334155', fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer' }}>
            <FiRotateCcw size={12}/> Reset
          </button>
        </div>

        {/* Main content */}
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {STAGE_TABS.map(t => {
              const active = activeTab === t.key
              return (
                <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                  height: 34, padding: '0 14px', borderRadius: 8, border: `1px solid ${active ? BLUE : BORDER}`,
                  background: active ? BLUE : '#fff', color: active ? '#fff' : '#334155', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                }}>
                  {t.label}
                </button>
              )
            })}
          </div>

          <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '22%' }} />
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '6%' }} />
                </colgroup>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Candidate', 'Job Title', 'Experience', 'Assessment Score', 'Tech Interview', 'HR Interview', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '10px', fontSize: '0.7rem', fontWeight: 600, color: GRAY, textAlign: 'left', borderBottom: `1px solid ${BORDER}`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {!loading && pageRows.length === 0 && (
                    <tr><td colSpan={7} style={{ padding: '40px 16px', textAlign: 'center', fontSize: '0.85rem', color: GRAY }}>No candidates here.</td></tr>
                  )}
                  {loading && (
                    <tr><td colSpan={7} style={{ padding: '40px 16px', textAlign: 'center', fontSize: '0.85rem', color: GRAY }}>Loading…</td></tr>
                  )}
                  {!loading && pageRows.map(row => {
                    const [fg, bg] = avatarColor(row.name)
                    return (
                      <tr key={row._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px', overflow: 'hidden' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                            <div style={{ width: 26, height: 26, borderRadius: '50%', background: bg, color: fg, fontSize: '0.6rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{initials(row.name)}</div>
                            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.name}</div>
                          </div>
                        </td>
                        <td style={{ padding: '10px', fontSize: '0.78rem', color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.jobTitle || '—'}</td>
                        <td style={{ padding: '10px', fontSize: '0.78rem', color: '#334155' }}>{row.experience || '—'}</td>
                        <td style={{ padding: '10px', fontSize: '0.78rem', color: '#334155' }}>{typeof row.score === 'number' ? `${row.score}%` : '—'}</td>
                        <td style={{ padding: '10px', overflow: 'hidden' }}>
                          {row.technicalRecommendation ? (() => {
                            const badge = row.technicalApprovalStatus ? APPROVAL_BADGE[row.technicalApprovalStatus] : null
                            const label = badge ? badge.label : (['Shortlist', 'Hire'].includes(row.technicalRecommendation) ? 'Recommended' : row.technicalRecommendation)
                            const color = badge ? badge.color : (RECOMMENDATION_COLOR[row.technicalRecommendation] || GRAY)
                            return <span style={{ background: `${color}1a`, color, fontSize: '0.66rem', fontWeight: 700, padding: '3px 8px', borderRadius: 20, whiteSpace: 'nowrap' }}>{label}</span>
                          })() : <span style={{ color: '#cbd5e1', fontSize: '0.78rem' }}>—</span>}
                        </td>
                        <td style={{ padding: '10px', overflow: 'hidden' }}>
                          {row.hrRecommendation ? (() => {
                            const badge = row.hrApprovalStatus ? APPROVAL_BADGE[row.hrApprovalStatus] : null
                            const label = badge ? badge.label : (['Shortlist', 'Hire'].includes(row.hrRecommendation) ? 'Recommended' : row.hrRecommendation)
                            const color = badge ? badge.color : (RECOMMENDATION_COLOR[row.hrRecommendation] || GRAY)
                            return <span style={{ background: `${color}1a`, color, fontSize: '0.66rem', fontWeight: 700, padding: '3px 8px', borderRadius: 20, whiteSpace: 'nowrap' }}>{label}</span>
                          })() : <span style={{ color: '#cbd5e1', fontSize: '0.78rem' }}>—</span>}
                        </td>
                        <td style={{ padding: '10px' }}>
                          <button onClick={() => setViewRow(row)} style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${BORDER}`, background: '#fff', color: BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <FiEye size={13} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: `1px solid ${BORDER}` }}>
              <span style={{ fontSize: '0.76rem', color: GRAY }}>
                {filtered.length === 0 ? 'Showing 0 entries' : `Showing ${(page - 1) * PAGE_SIZE + 1} to ${Math.min(page * PAGE_SIZE, filtered.length)} of ${filtered.length} entries`}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${BORDER}`, background: '#fff', color: page === 1 ? '#cbd5e1' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: page === 1 ? 'default' : 'pointer' }}>
                  <FiChevronLeft size={14} />
                </button>
                <span style={{ width: 28, height: 28, borderRadius: 7, background: BLUE, color: '#fff', fontSize: '0.76rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{page}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${BORDER}`, background: '#fff', color: page === totalPages ? '#cbd5e1' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: page === totalPages ? 'default' : 'pointer' }}>
                  <FiChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {viewRow && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }} onClick={() => setViewRow(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, padding: 22, width: 440, maxWidth: '90vw', maxHeight: '80vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>{viewRow.name}</h3>
            <p style={{ margin: '0 0 16px', fontSize: '0.8rem', color: GRAY }}>{viewRow.jobTitle} · {viewRow.experience || '—'} experience</p>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Technical Interview</div>
              <div style={{ fontSize: '0.78rem', color: '#334155' }}>
                {viewRow.technicalRecommendation || 'No feedback yet'}
                {viewRow.technicalApprovalStatus && APPROVAL_BADGE[viewRow.technicalApprovalStatus] && (
                  <span style={{ marginLeft: 8, color: APPROVAL_BADGE[viewRow.technicalApprovalStatus].color, fontWeight: 700 }}>
                    ({APPROVAL_BADGE[viewRow.technicalApprovalStatus].label})
                  </span>
                )}
              </div>
              {viewRow.technicalComments && <div style={{ fontSize: '0.76rem', color: GRAY, marginTop: 4 }}>{viewRow.technicalComments}</div>}
            </div>

            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>HR Interview</div>
              <div style={{ fontSize: '0.78rem', color: '#334155' }}>
                {viewRow.hrRecommendation || 'No feedback yet'}
                {viewRow.hrApprovalStatus && APPROVAL_BADGE[viewRow.hrApprovalStatus] && (
                  <span style={{ marginLeft: 8, color: APPROVAL_BADGE[viewRow.hrApprovalStatus].color, fontWeight: 700 }}>
                    ({APPROVAL_BADGE[viewRow.hrApprovalStatus].label})
                  </span>
                )}
              </div>
              {viewRow.hrComments && <div style={{ fontSize: '0.76rem', color: GRAY, marginTop: 4 }}>{viewRow.hrComments}</div>}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
              <button onClick={() => setViewRow(null)} style={{ height: 34, padding: '0 14px', borderRadius: 8, border: `1px solid ${BORDER}`, background: '#fff', color: '#334155', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HMCandidatesPage
