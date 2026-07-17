import { useEffect, useMemo, useState } from 'react'
import { useAuthContext } from '@/context/useAuthContext'
import { Problem } from './problems.data'
import { LockFill, BookmarkFill, Bookmark } from 'react-bootstrap-icons'

const FREE_PROBLEMS_LIMIT = 5

type StatusFilter = 'all' | 'solved' | 'attempted' | 'not-attempted'

type Submission = {
  _id: string
  problemId: number
  problemTitle: string
  language: string
  verdict: 'ACCEPTED' | 'PARTIALLY_ACCEPTED' | 'REJECTED'
  summary: { passPercentage: number; passed: number; totalTestCases: number }
  createdAt: string
  isBestSubmission: boolean
}

const DIFF_COLOR: Record<string, string> = { Easy: '#16a34a', Medium: '#f59e0b', Hard: '#dc2626' }
const DIFF_BG: Record<string, string>    = { Easy: '#f0fdf4', Medium: '#fffbeb', Hard: '#fff1f2' }

const VERDICT = {
  ACCEPTED:           { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   label: 'Accepted',             icon: '✓', iconBg: '#22c55e' },
  PARTIALLY_ACCEPTED: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Partially Accepted',    icon: '~', iconBg: '#f59e0b' },
  REJECTED:           { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  label: 'Wrong Answer',          icon: '✕', iconBg: '#ef4444' },
}

const LANG_COLOR: Record<string, string> = {
  javascript: '#f7df1e', typescript: '#3178c6', python: '#3572a5',
  java: '#b07219', cpp: '#f34b7d', c: '#888', csharp: '#178600',
  php: '#4f5b93', ruby: '#cc342d', go: '#00add8', rust: '#dea584',
}

const ALL_TAGS = [
  'Array', 'String', 'Hash Table', 'Two Pointers', 'Stack', 'Tree', 'BFS', 'DFS',
  'Dynamic Programming', 'Linked List', 'Graph', 'Recursion', 'Sliding Window',
  'Binary Search', 'Heap', 'Design', 'Backtracking', 'Greedy', 'Math', 'Queue',
]
const getProblemTags = (id: number): [string, string] => [
  ALL_TAGS[id % ALL_TAGS.length],
  ALL_TAGS[(id * 3 + 7) % ALL_TAGS.length],
]

const fmtDate = (iso: string) => {
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ', ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

const PAGE_SIZE = 20

// Reads the same --dash-* CSS vars StudentLayout sets for dark mode
// (light-mode values as fallback), so this list re-themes with the portal.
const PAGE_BG     = 'var(--dash-page-bg, #f8fafc)'
const CARD_BG     = 'var(--dash-card-bg, #ffffff)'
const PAGE_BORDER = 'var(--dash-border, #e2e8f0)'
const PAGE_TEXT   = 'var(--dash-text, #0f172a)'
const PAGE_GRAY   = 'var(--dash-gray, #64748b)'

type Props = {
  problems: Problem[]
  selectedId?: number
  completedIds: number[]
  onSelect: (p: Problem) => void
  isPending?: boolean
}

const ProblemsList = ({ problems, selectedId, completedIds, onSelect, isPending = false }: Props) => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [submissions, setSubmissions]   = useState<Submission[]>([])
  const [loadingSubs, setLoadingSubs]   = useState(true)
  const [bookmarked, setBookmarked]     = useState<Set<number>>(new Set())
  const [page, setPage]                 = useState(1)
  const [search, setSearch]             = useState('')
  const [diffFilter, setDiffFilter]     = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  useEffect(() => {
    if (!user?.token) return
    fetch(`${baseURL}/api/ai/me`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then(r => r.json())
      .then(j => setSubmissions(j.data || []))
      .catch(console.error)
      .finally(() => setLoadingSubs(false))
  }, [user?.token])

  const attemptedIds = useMemo(() => {
    const s = new Set<number>()
    submissions.forEach(sub => { if (sub.verdict !== 'ACCEPTED') s.add(sub.problemId) })
    return s
  }, [submissions])

  const easyCnt = useMemo(() => problems.filter(p => p.difficulty === 'Easy').length,   [problems])
  const medCnt  = useMemo(() => problems.filter(p => p.difficulty === 'Medium').length, [problems])
  const hardCnt = useMemo(() => problems.filter(p => p.difficulty === 'Hard').length,   [problems])

  const filtered = useMemo(() => {
    return problems.filter(p => {
      if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false
      if (diffFilter !== 'All' && p.difficulty !== diffFilter) return false
      if (statusFilter === 'solved'        && !completedIds.includes(p.id)) return false
      if (statusFilter === 'attempted'     && (!attemptedIds.has(p.id) || completedIds.includes(p.id))) return false
      if (statusFilter === 'not-attempted' && (completedIds.includes(p.id) || attemptedIds.has(p.id))) return false
      return true
    })
  }, [problems, search, diffFilter, statusFilter, completedIds, attemptedIds])

  useEffect(() => { setPage(1) }, [search, diffFilter, statusFilter])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const start      = (page - 1) * PAGE_SIZE
  const visible    = filtered.slice(start, start + PAGE_SIZE)
  const recentSubs = submissions.slice(0, 8)

  const getStatus = (id: number) => {
    if (completedIds.includes(id)) return 'solved'
    if (attemptedIds.has(id))      return 'attempted'
    return 'not-attempted'
  }

  const resetFilters = () => { setSearch(''); setDiffFilter('All'); setStatusFilter('all'); setPage(1) }

  return (
    <div style={{ display: 'flex', gap: 0, alignItems: 'flex-start', background: PAGE_BG, borderRadius: 16, padding: '20px 20px 20px 20px', margin: '0 -8px' }}>

      {/* ── LEFT: FILTER SIDEBAR ── */}
      <div style={{ width: 270, flexShrink: 0, paddingRight: 18 }}>
        <div style={{ background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.07)' }}>

          {/* Filter by Level */}
          <div style={{ padding: '14px 18px 12px' }}>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: PAGE_TEXT, marginBottom: 12 }}>Filter by Level</div>
            {([['Easy', easyCnt, '#16a34a'], ['Medium', medCnt, '#f59e0b'], ['Hard', hardCnt, '#dc2626']] as [string, number, string][]).map(([diff, count, color]) => (
              <div
                key={diff}
                onClick={() => setDiffFilter(diffFilter === diff as any ? 'All' : diff as any)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 9, padding: '6px 8px', borderRadius: 8,
                  cursor: 'pointer', marginBottom: 2,
                  background: diffFilter === diff ? `${color}12` : 'transparent',
                }}
              >
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: color, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: '0.82rem', color: color, fontWeight: diffFilter === diff ? 700 : 500 }}>{diff}</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: PAGE_GRAY }}>{count.toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div style={{ height: 1, background: PAGE_BORDER }} />

          {/* Search Problem */}
          <div style={{ padding: '16px 18px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: PAGE_GRAY, marginBottom: 10 }}>Search Problem</div>
            <div style={{ position: 'relative' }}>
              <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: PAGE_GRAY }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                placeholder="Search problems..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', height: 36, border: `1px solid ${PAGE_BORDER}`, borderRadius: 8, paddingLeft: 32, paddingRight: 10, fontSize: '0.8rem', color: PAGE_TEXT, outline: 'none', background: PAGE_BG }}
              />
            </div>
          </div>

          <div style={{ height: 1, background: PAGE_BORDER }} />

          {/* Status */}
          <div style={{ padding: '16px 18px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: PAGE_GRAY, marginBottom: 12 }}>Status</div>
            {([
              { val: 'not-attempted', label: 'Not Attempted', color: '#94a3b8' },
              { val: 'attempted',     label: 'Attempted',     color: '#f59e0b' },
              { val: 'solved',        label: 'Solved',        color: '#22c55e' },
            ] as { val: StatusFilter; label: string; color: string }[]).map(({ val, label, color }) => {
              const checked = statusFilter === val
              return (
                <div key={val} onClick={() => setStatusFilter(checked ? 'all' : val)}
                  style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10, cursor: 'pointer' }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                    border: checked ? `2px solid ${color}` : '2px solid #d1d5db',
                    background: checked ? color : CARD_BG,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}>
                    {checked && (
                      <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                        <path d="M1 3.5l2.5 2.5L8 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span style={{ fontSize: '0.82rem', color: PAGE_TEXT }}>{label}</span>
                </div>
              )
            })}
          </div>

          <div style={{ height: 1, background: PAGE_BORDER }} />

          {/* Reset */}
          <div style={{ padding: '12px 18px' }}>
            <button
              onClick={resetFilters}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: PAGE_GRAY, fontSize: '0.78rem', cursor: 'pointer', padding: 0, fontWeight: 500 }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4"/></svg>
              Reset Filters
            </button>
          </div>

        </div>
      </div>

      {/* ── MIDDLE: PROBLEMS TABLE ── */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {isPending && (
          <div style={{ background: 'rgba(255,122,0,0.06)', border: '1px solid rgba(255,122,0,0.2)', borderRadius: 10, padding: '8px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.76rem', color: '#475569' }}>
            <LockFill style={{ color: '#ff7a00', flexShrink: 0 }} />
            <span><strong style={{ color: '#ff7a00' }}>Trial:</strong> First {FREE_PROBLEMS_LIMIT} problems are free. Enroll to unlock all.</span>
          </div>
        )}

        {/* Table */}
        <div style={{ background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.07)' }}>

          {/* Table title + sort — aligned with sidebar "Filter by Level" and panel "My Submissions" */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 12px', borderBottom: `1px solid ${PAGE_BORDER}` }}>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: PAGE_TEXT }}>
              All Problems <span style={{ color: PAGE_GRAY, fontWeight: 500, fontSize: '0.82rem' }}>({filtered.length.toLocaleString()})</span>
            </div>
            <select style={{ height: 30, border: `1px solid ${PAGE_BORDER}`, borderRadius: 7, padding: '0 10px', fontSize: '0.72rem', color: PAGE_TEXT, background: PAGE_BG, outline: 'none', cursor: 'pointer' }}>
              <option>Sort by: Newest First</option>
              <option>Sort by: Difficulty</option>
            </select>
          </div>

          {/* Column headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '32px minmax(0,1fr) 80px 95px 75px 110px 110px', padding: '8px 16px', background: PAGE_BG, borderBottom: `1px solid ${PAGE_BORDER}`, alignItems: 'center' }}>
            <div />
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: PAGE_GRAY, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Problem</div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: PAGE_GRAY, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Level</div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: PAGE_GRAY, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Acceptance</div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: PAGE_GRAY, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Solves</div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: PAGE_GRAY, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Status</div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: PAGE_GRAY, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Action</div>
          </div>

          {visible.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 0', color: PAGE_GRAY, fontSize: '0.82rem' }}>No problems found</div>
          ) : visible.map((p, idx) => {
            const globalIdx  = start + idx
            const isLocked   = isPending && globalIdx >= FREE_PROBLEMS_LIMIT
            const isActive   = p.id === selectedId
            const status     = getStatus(p.id)
            const isBookmark = bookmarked.has(p.id)

            const actionBtn = status === 'solved'
              ? { label: 'Solve Again', bg: CARD_BG,   color: '#ff7a00', border: '1.5px solid #ff7a00' }
              : status === 'attempted'
              ? { label: 'Continue',    bg: '#ff7a00', color: '#fff',    border: '1.5px solid #ff7a00' }
              : { label: 'Solve Now',   bg: '#ff7a00', color: '#fff',    border: '1.5px solid #ff7a00' }

            // Generate deterministic acceptance/solves/tags from problem id
            const acceptance = (((p.id * 37 + 13) % 60) + 30).toFixed(2) + '%'
            const solvesRaw  = ((p.id * 53 + 7) % 80) + 10
            const solves     = `${solvesRaw}.${(p.id % 9)}K`
            const [tag1, tag2] = getProblemTags(p.id)

            return (
              <div
                key={p._id}
                style={{
                  display: 'grid', gridTemplateColumns: '32px minmax(0,1fr) 80px 95px 75px 110px 110px',
                  padding: '10px 16px', borderBottom: `1px solid ${PAGE_BORDER}`, alignItems: 'center',
                  background: isActive ? 'rgba(255,122,0,0.03)' : CARD_BG,
                  opacity: isLocked ? 0.4 : 1,
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => { if (!isLocked) e.currentTarget.style.background = PAGE_BG }}
                onMouseLeave={e => { e.currentTarget.style.background = isActive ? 'rgba(255,122,0,0.03)' : CARD_BG }}
              >
                {/* Bookmark */}
                <div
                  onClick={e => { e.stopPropagation(); setBookmarked(prev => { const n = new Set(prev); n.has(p.id) ? n.delete(p.id) : n.add(p.id); return n }) }}
                  style={{ cursor: 'pointer', color: isBookmark ? '#f59e0b' : PAGE_GRAY, display: 'flex', alignItems: 'center' }}
                >
                  {isBookmark ? <BookmarkFill size={12} /> : <Bookmark size={12} />}
                </div>

                {/* Problem title + tags */}
                <div onClick={() => !isLocked && onSelect(p)} style={{ cursor: isLocked ? 'not-allowed' : 'pointer', paddingRight: 8 }}>
                  {isLocked && <LockFill size={10} style={{ color: PAGE_GRAY, marginRight: 5 }} />}
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: PAGE_TEXT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <span style={{ color: PAGE_GRAY, fontWeight: 400, marginRight: 4 }}>{p.id}.</span>
                    {p.title}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 3 }}>
                    <span style={{ fontSize: '0.62rem', color: PAGE_GRAY, fontWeight: 500 }}>{tag1}</span>
                    <span style={{ fontSize: '0.62rem', color: PAGE_GRAY }}>•</span>
                    <span style={{ fontSize: '0.62rem', color: PAGE_GRAY, fontWeight: 500 }}>{tag2}</span>
                  </div>
                </div>

                {/* Level badge */}
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: DIFF_COLOR[p.difficulty], background: DIFF_BG[p.difficulty], padding: '3px 10px', borderRadius: 20 }}>
                    {p.difficulty}
                  </span>
                </div>

                {/* Acceptance */}
                <div style={{ textAlign: 'center', fontSize: '0.75rem', color: PAGE_GRAY }}>{acceptance}</div>

                {/* Solves */}
                <div style={{ textAlign: 'center', fontSize: '0.75rem', color: PAGE_GRAY }}>{solves}</div>

                {/* Status */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: '0.72rem', color: status === 'solved' ? '#22c55e' : status === 'attempted' ? '#f59e0b' : PAGE_GRAY }}>
                  {status === 'solved' ? (
                    <span style={{ width: 16, height: 16, borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5l2.5 2.5L8 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </span>
                  ) : status === 'attempted' ? (
                    <span style={{ width: 16, height: 16, borderRadius: '50%', background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="7" height="7" viewBox="0 0 7 7" fill="none"><circle cx="3.5" cy="3.5" r="2" fill="#fff"/></svg>
                    </span>
                  ) : (
                    <span style={{ width: 16, height: 16, borderRadius: '50%', border: `1.5px solid ${PAGE_BORDER}`, background: 'transparent', flexShrink: 0 }} />
                  )}
                  {status === 'solved' ? 'Solved' : status === 'attempted' ? 'Attempted' : 'Not Attempted'}
                </div>

                {/* Action */}
                <div style={{ textAlign: 'center' }}>
                  {!isLocked && (
                    <button
                      onClick={() => onSelect(p)}
                      style={{ fontSize: '0.68rem', fontWeight: 700, padding: '4px 12px', borderRadius: 7, cursor: 'pointer', background: actionBtn.bg, color: actionBtn.color, border: actionBtn.border, whiteSpace: 'nowrap' }}
                    >{actionBtn.label}</button>
                  )}
                </div>
              </div>
            )
          })}

        {/* Pagination — inside the table card so the top border connects cleanly */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 3, padding: '14px 0', background: CARD_BG, borderTop: `1px solid ${PAGE_BORDER}` }}>

            {/* Prev */}
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 34, height: 34, borderRadius: 8,
                border: `1px solid ${PAGE_BORDER}`, background: page === 1 ? PAGE_BG : CARD_BG,
                color: page === 1 ? PAGE_GRAY : PAGE_TEXT,
                cursor: page === 1 ? 'default' : 'pointer', transition: 'all 0.15s',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>

            {/* Page numbers */}
            {(() => {
              const range: number[] = []
              if (totalPages <= 7) {
                for (let i = 1; i <= totalPages; i++) range.push(i)
              } else {
                range.push(1, 2, 3)
                if (page > 4) range.push(-1)
                if (page > 3 && page < totalPages - 2) range.push(page)
                if (page < totalPages - 3) range.push(-2)
                range.push(totalPages - 2, totalPages - 1, totalPages)
              }
              return [...new Set(range)].map((pg, i) => pg < 0 ? (
                <span key={`ellipsis-${i}`} style={{
                  width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.82rem', color: PAGE_GRAY, letterSpacing: '0.1em', userSelect: 'none',
                }}>···</span>
              ) : (
                <button
                  key={pg}
                  onClick={() => setPage(pg)}
                  style={{
                    width: 34, height: 34, borderRadius: 8, cursor: 'pointer',
                    border: page === pg ? 'none' : `1px solid ${PAGE_BORDER}`,
                    background: page === pg ? '#ff7a00' : CARD_BG,
                    color: page === pg ? '#fff' : PAGE_TEXT,
                    fontWeight: page === pg ? 700 : 400,
                    fontSize: '0.82rem',
                    boxShadow: page === pg ? '0 2px 8px rgba(255,122,0,0.3)' : 'none',
                    transition: 'all 0.15s',
                  }}
                >{pg}</button>
              ))
            })()}

            {/* Next */}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 34, height: 34, borderRadius: 8,
                border: `1px solid ${PAGE_BORDER}`, background: page === totalPages ? PAGE_BG : CARD_BG,
                color: page === totalPages ? PAGE_GRAY : PAGE_TEXT,
                cursor: page === totalPages ? 'default' : 'pointer', transition: 'all 0.15s',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>

          </div>
        )}
        </div>
      </div>


    </div>
  )
}

export default ProblemsList
