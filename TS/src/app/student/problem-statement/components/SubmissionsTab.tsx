import { useEffect, useState, useMemo } from 'react'
import { Spinner } from 'react-bootstrap'
import { useAuthContext } from '@/context/useAuthContext'
import { FaStar, FaRegStar } from 'react-icons/fa'
import { FiCode, FiX, FiCopy, FiCheck } from 'react-icons/fi'

/* ── Types ── */
type Submission = {
  _id: string
  problemId: number
  problemTitle: string
  language: string
  verdict: 'ACCEPTED' | 'PARTIALLY_ACCEPTED' | 'REJECTED'
  summary: { totalTestCases: number; passed: number; failed: number; passPercentage: number }
  attemptNumber: number
  isBestSubmission: boolean
  timeComplexity: string
  spaceComplexity: string
  code: string
  createdAt: string
}

/* ── Helpers ── */
const PAGE_SIZE = 8

const LANG_COLOR: Record<string, string> = {
  javascript: '#f7df1e', typescript: '#3178c6', python: '#3572a5',
  java: '#b07219', cpp: '#f34b7d', c: '#888', csharp: '#178600',
  php: '#4f5b93', ruby: '#cc342d', go: '#00add8', rust: '#dea584',
}

const VERDICT_CFG = {
  ACCEPTED:           { label: 'Accepted',     color: '#16a34a', bg: '#f0fdf4' },
  PARTIALLY_ACCEPTED: { label: 'Partial',      color: '#f59e0b', bg: '#fffbeb' },
  REJECTED:           { label: 'Wrong Answer', color: '#dc2626', bg: '#fff1f2' },
}

const ALL_TAGS = ['Array','String','Hash Table','Two Pointers','Stack','Tree','BFS','DFS',
  'Dynamic Programming','Linked List','Graph','Recursion','Sliding Window','Binary Search',
  'Heap','Design','Backtracking','Greedy','Math','Queue']

const getTags = (id: number) => [ALL_TAGS[id % ALL_TAGS.length], ALL_TAGS[(id * 3 + 7) % ALL_TAGS.length]]

const stars = (pct: number) => pct >= 90 ? 5 : pct >= 75 ? 4 : pct >= 60 ? 3 : pct >= 40 ? 2 : pct > 0 ? 1 : 0

const fmtDate = (iso: string) => {
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ', ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

const known = (v: string) => v && v !== 'Not calculated' && v !== 'N/A'

const pct = (n: number, total: number) => total > 0 ? `${((n / total) * 100).toFixed(2)}%` : '0.00%'

/* ── Icons ── */
const IconSearch    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
const IconCalendar  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
const IconReset     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4"/></svg>
const IconChevDown  = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
const IconChevLeft  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
const IconChevRight = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
const IconDots      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
const IconSubmit    = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
const IconCheck     = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
const IconWrong     = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
const IconClock     = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
const IconCode2     = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>

/* ── Filter Select ── */
const FilterSelect = ({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) => (
  <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ appearance: 'none', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 32px 7px 12px', fontSize: '0.8rem', color: '#374151', fontWeight: 500, cursor: 'pointer', outline: 'none', minWidth: 130 }}>
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
    <span style={{ position: 'absolute', right: 10, pointerEvents: 'none', color: '#64748b' }}><IconChevDown /></span>
  </div>
)

/* ── Code Modal ── */
function CodeModal({ s, onClose }: { s: Submission; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const v = VERDICT_CFG[s.verdict] ?? VERDICT_CFG.REJECTED
  const copy = () => { navigator.clipboard.writeText(s.code); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1060, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#111', border: '1px solid #222', borderRadius: 14, width: '100%', maxWidth: 720, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,0.7)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderBottom: '1px solid #1e1e1e', flexShrink: 0 }}>
          <FiCode size={15} color="#ff7a00" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f3f4f6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>#{s.problemId} — {s.problemTitle}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.68rem', color: '#6b7280', textTransform: 'capitalize' }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: LANG_COLOR[s.language] ?? '#888', display: 'inline-block', marginRight: 4 }} />{s.language}</span>
              <span style={{ fontSize: '0.68rem', color: v.color, background: v.bg, borderRadius: 4, padding: '0 6px', fontWeight: 700 }}>{v.label}</span>
              <span style={{ fontSize: '0.68rem', color: '#6b7280' }}>Attempt #{s.attemptNumber}</span>
              {s.isBestSubmission && <span style={{ fontSize: '0.68rem', color: '#facc15', background: 'rgba(250,204,21,0.1)', borderRadius: 4, padding: '0 6px', fontWeight: 700 }}>⭐ Best</span>}
            </div>
          </div>
          <button onClick={copy} style={{ background: copied ? 'rgba(34,197,94,0.12)' : '#1a1a1a', border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : '#2a2a2a'}`, borderRadius: 7, color: copied ? '#22c55e' : '#9ca3af', padding: '5px 12px', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
            {copied ? <FiCheck size={12} /> : <FiCopy size={12} />}{copied ? 'Copied!' : 'Copy'}
          </button>
          <button onClick={onClose} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 7, color: '#9ca3af', padding: '5px 8px', cursor: 'pointer', flexShrink: 0 }}><FiX size={15} /></button>
        </div>
        {(known(s.timeComplexity) || known(s.spaceComplexity)) && (
          <div style={{ display: 'flex', gap: 20, padding: '8px 18px', background: '#0d0d0d', borderBottom: '1px solid #1a1a1a', flexShrink: 0 }}>
            {known(s.timeComplexity) && <span style={{ fontSize: '0.73rem', color: '#6b7280' }}>⏱ Time: <span style={{ color: '#d1d5db' }}>{s.timeComplexity}</span></span>}
            {known(s.spaceComplexity) && <span style={{ fontSize: '0.73rem', color: '#6b7280' }}>💾 Space: <span style={{ color: '#d1d5db' }}>{s.spaceComplexity}</span></span>}
          </div>
        )}
        <pre style={{ margin: 0, padding: '18px 20px', color: '#e2e8f0', fontSize: '0.83rem', fontFamily: '"Fira Code","Cascadia Code","Consolas",monospace', overflowY: 'auto', overflowX: 'auto', lineHeight: 1.65, flex: 1, background: '#0a0a0a' }}>{s.code}</pre>
        <div style={{ padding: '10px 18px', borderTop: '1px solid #1a1a1a', fontSize: '0.68rem', color: '#444', flexShrink: 0 }}>Submitted {fmtDate(s.createdAt)}</div>
      </div>
    </div>
  )
}

/* ── Main ── */
const SubmissionsTab = () => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [data, setData]           = useState<Submission[]>([])
  const [loading, setLoading]     = useState(true)
  const [codeModal, setCodeModal] = useState<Submission | null>(null)
  const [search, setSearch]       = useState('')
  const [filterLang, setFilterLang]     = useState('All Languages')
  const [filterStatus, setFilterStatus] = useState('All Status')
  const [page, setPage]           = useState(1)

  useEffect(() => {
    fetch(`${baseURL}/api/ai/me`, { headers: { Authorization: `Bearer ${user?.token}` } })
      .then(r => r.json())
      .then(j => setData(j.data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  /* Stats */
  const total    = data.length
  const accepted = data.filter(s => s.verdict === 'ACCEPTED').length
  const wrong    = data.filter(s => s.verdict === 'REJECTED').length
  const partial  = data.filter(s => s.verdict === 'PARTIALLY_ACCEPTED').length

  const statCards = [
    { icon: <IconSubmit />, iconColor: '#6366f1', iconBg: '#eef2ff', value: total,    label: 'Total Submissions', sub: 'Across all problems' },
    { icon: <IconCheck />,  iconColor: '#16a34a', iconBg: '#f0fdf4', value: accepted, label: 'Accepted',           sub: `${pct(accepted, total)} Acceptance Rate` },
    { icon: <IconWrong />,  iconColor: '#f59e0b', iconBg: '#fffbeb', value: wrong,    label: 'Wrong Answer',       sub: `${pct(wrong, total)} of total` },
    { icon: <IconClock />,  iconColor: '#ef4444', iconBg: '#fff1f2', value: partial,  label: 'Partially Accepted', sub: `${pct(partial, total)} of total` },
    { icon: <IconCode2 />,  iconColor: '#7c3aed', iconBg: '#f5f3ff', value: 0,        label: 'Compilation Error',  sub: `0.00% of total` },
  ]

  /* Filter options */
  const langOptions   = ['All Languages', ...Array.from(new Set(data.map(s => s.language)))]
  const statusOptions = ['All Status', 'Accepted', 'Wrong Answer', 'Partially Accepted']

  /* Filtered */
  const filtered = useMemo(() => data.filter(s => {
    if (search && !s.problemTitle.toLowerCase().includes(search.toLowerCase())) return false
    if (filterLang !== 'All Languages' && s.language !== filterLang) return false
    if (filterStatus !== 'All Status') {
      const vLabel = VERDICT_CFG[s.verdict]?.label
      if (filterStatus === 'Accepted' && vLabel !== 'Accepted') return false
      if (filterStatus === 'Wrong Answer' && vLabel !== 'Wrong Answer') return false
      if (filterStatus === 'Partially Accepted' && vLabel !== 'Partial') return false
    }
    return true
  }), [data, search, filterLang, filterStatus])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageData   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const resetFilters = () => { setSearch(''); setFilterLang('All Languages'); setFilterStatus('All Status'); setPage(1) }

  const pageRange = () => {
    const pages: (number | '...')[] = []
    if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); return pages }
    pages.push(1)
    if (page > 3) pages.push('...')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
    if (page < totalPages - 2) pages.push('...')
    pages.push(totalPages)
    return pages
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
      <Spinner animation="border" style={{ color: '#ff7a00' }} />
    </div>
  )

  return (
    <div style={{ padding: '20px 4px' }}>

      {/* ── Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 20 }}>
        {statCards.map(c => (
          <div key={c.label} style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.iconColor, flexShrink: 0 }}>{c.icon}</div>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>{c.value}</div>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#374151', marginTop: 2 }}>{c.label}</div>
              <div style={{ fontSize: '0.63rem', color: '#94a3b8', marginTop: 1 }}>{c.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Table Card ── */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}><IconSearch /></span>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search by problem title..."
              style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 12px 7px 32px', fontSize: '0.8rem', color: '#374151', outline: 'none', background: '#fff', width: 200 }} />
          </div>

          <FilterSelect value={filterLang}   onChange={v => { setFilterLang(v);   setPage(1) }} options={langOptions} />
          <FilterSelect value={filterStatus} onChange={v => { setFilterStatus(v); setPage(1) }} options={statusOptions} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 14px', fontSize: '0.8rem', color: '#94a3b8', cursor: 'pointer', background: '#fff' }}>
            <IconCalendar /><span>Select Date Range</span>
          </div>

          <div style={{ flex: 1 }} />

          <button onClick={resetFilters} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer' }}>
            <IconReset /> Reset Filters
          </button>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
            {data.length === 0 ? '🚀 No submissions yet — start solving!' : 'No submissions match your filters.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  {['Problem', 'Language', 'Status', 'Pass Rate', 'Time Complexity', 'Space', 'Submitted On', 'Action'].map(h => (
                    <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.78rem', whiteSpace: 'nowrap', background: '#fff' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageData.map(s => {
                  const v      = VERDICT_CFG[s.verdict] ?? VERDICT_CFG.REJECTED
                  const lColor = LANG_COLOR[s.language] ?? '#888'
                  const tags   = getTags(s.problemId)
                  const starCount = stars(s.summary.passPercentage)

                  return (
                    <tr key={s._id} style={{ borderBottom: '1px solid #f8fafc' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

                      {/* Problem */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                          <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>#{s.problemId}</span>
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>{s.problemTitle}</span>
                          {s.isBestSubmission && (
                            <span style={{ fontSize: '0.58rem', fontWeight: 700, color: '#facc15', background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.3)', borderRadius: 4, padding: '1px 5px' }}>BEST</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
                          {tags.map(t => (
                            <span key={t} style={{ fontSize: '0.6rem', background: '#f1f5f9', color: '#64748b', borderRadius: 4, padding: '1px 7px', fontWeight: 500 }}>{t}</span>
                          ))}
                          <div style={{ display: 'flex', gap: 2, marginLeft: 4 }}>
                            {Array.from({ length: 5 }).map((_, i) =>
                              i < starCount ? <FaStar key={i} size={9} color="#facc15" /> : <FaRegStar key={i} size={9} color="#cbd5e1" />
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Language */}
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: lColor, display: 'inline-block', flexShrink: 0 }} />
                          <span style={{ color: '#374151', fontWeight: 500, textTransform: 'capitalize' }}>{s.language}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', fontWeight: 600, color: v.color, background: v.bg, borderRadius: 6, padding: '3px 10px' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: v.color }} />
                          {v.label}
                        </span>
                      </td>

                      {/* Pass Rate */}
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: v.color }}>{s.summary.passPercentage}%</div>
                        <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: 2 }}>{s.summary.passed}/{s.summary.totalTestCases} tests</div>
                      </td>

                      {/* Time Complexity */}
                      <td style={{ padding: '12px 16px', color: known(s.timeComplexity) ? '#374151' : '#cbd5e1', whiteSpace: 'nowrap', fontSize: '0.78rem' }}>
                        {known(s.timeComplexity) ? s.timeComplexity : '—'}
                      </td>

                      {/* Space */}
                      <td style={{ padding: '12px 16px', color: known(s.spaceComplexity) ? '#374151' : '#cbd5e1', whiteSpace: 'nowrap', fontSize: '0.78rem' }}>
                        {known(s.spaceComplexity) ? s.spaceComplexity : '—'}
                      </td>

                      {/* Submitted On */}
                      <td style={{ padding: '12px 16px', color: '#64748b', whiteSpace: 'nowrap', fontSize: '0.73rem' }}>
                        <div>Attempt #{s.attemptNumber}</div>
                        <div style={{ marginTop: 2 }}>{fmtDate(s.createdAt)}</div>
                      </td>

                      {/* Action */}
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button onClick={() => setCodeModal(s)}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.73rem', fontWeight: 600, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                            <FiCode size={12} /> View Code
                          </button>
                          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2 }}><IconDots /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid #f1f5f9' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} submissions
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ width: 32, height: 32, borderRadius: 7, border: '1px solid #e2e8f0', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', color: page === 1 ? '#cbd5e1' : '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconChevLeft />
            </button>
            {pageRange().map((p, i) =>
              p === '...' ? (
                <span key={`e${i}`} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>···</span>
              ) : (
                <button key={p} onClick={() => setPage(p as number)}
                  style={{ width: 32, height: 32, borderRadius: 7, border: page === p ? 'none' : '1px solid #e2e8f0', background: page === p ? '#ff7a00' : '#fff', color: page === p ? '#fff' : '#374151', fontWeight: page === p ? 700 : 400, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: page === p ? '0 2px 8px rgba(255,122,0,0.3)' : 'none' }}>
                  {p}
                </button>
              )
            )}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ width: 32, height: 32, borderRadius: 7, border: '1px solid #e2e8f0', background: '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer', color: page === totalPages ? '#cbd5e1' : '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconChevRight />
            </button>
          </div>
        </div>
      </div>

      {codeModal && <CodeModal s={codeModal} onClose={() => setCodeModal(null)} />}
    </div>
  )
}

export default SubmissionsTab
