'use client'
import { useEffect, useState } from 'react'
import { Col, Row, Spinner } from 'react-bootstrap'
import { FaCode, FaSearch, FaChartBar, FaUsers } from 'react-icons/fa'
import { useAuthContext } from '@/context/useAuthContext'

/* ─── Types ───────────────────────────────────────────────── */
type DiffBreakdown = { Easy: number; Medium: number; Hard: number }
type TrendPoint    = { date: string; count: number }
type TopProblem    = { problemId: string; title: string; count: number; difficulty: string }
type TotalProblems  = { Easy: number; Medium: number; Hard: number; total: number }
type OverviewData  = {
  totalCompleted: number; uniqueStudents: number; uniqueProblems: number
  totalProblems: TotalProblems
  diffBreakdown: DiffBreakdown; trend: TrendPoint[]; topProblems: TopProblem[]
}
type StudentRow = {
  studentId: string; name: string; email: string
  Easy: number; Medium: number; Hard: number; total: number; lastActivity: string | null
}

const DC: Record<string, string> = { Easy: '#22c55e', Medium: '#f59e0b', Hard: '#ef4444' }
const BG: Record<string, string> = {
  Easy: 'rgba(34,197,94,0.08)', Medium: 'rgba(245,158,11,0.08)', Hard: 'rgba(239,68,68,0.08)',
}
const card: React.CSSProperties = {
  background: '#141414', border: '1px solid #222', borderRadius: 14, padding: '1.25rem',
}

/* ─── Helpers ─────────────────────────────────────────────── */
const today = () => new Date().toISOString().slice(0, 10)
const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10) }

/* ─── Summary Cards ──────────────────────────────────────── */
function SummaryCards({ data }: { data: OverviewData }) {
  const tp = data.totalProblems
  const stats = [
    { label: 'Total Programs',   value: tp.total,                  color: '#6366f1', sub: 'available in system' },
    { label: 'Total Solved',     value: data.totalCompleted,        color: '#818cf8', sub: 'accepted by all students' },
    { label: 'Active Students',  value: data.uniqueStudents,        color: '#22c55e', sub: 'solved ≥ 1 problem' },
    { label: 'Easy',             value: data.diffBreakdown.Easy,    color: '#22c55e', sub: `out of ${tp.Easy} problems`, outOf: tp.Easy },
    { label: 'Medium',           value: data.diffBreakdown.Medium,  color: '#f59e0b', sub: `out of ${tp.Medium} problems`, outOf: tp.Medium },
    { label: 'Hard',             value: data.diffBreakdown.Hard,    color: '#ef4444', sub: `out of ${tp.Hard} problems`, outOf: tp.Hard },
  ]
  return (
    <Row className="g-3 mb-4">
      {stats.map(s => {
        const pct = 'outOf' in s && s.outOf ? Math.round((s.value / s.outOf) * 100) : null
        return (
          <Col key={s.label} xs={6} md={4} lg={2}>
            <div style={{ background: '#141414', border: '1px solid #222', borderTop: `3px solid ${s.color}`, borderRadius: 12, padding: '1rem', textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 3 }}>
                <span style={{ fontSize: '1.9rem', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</span>
                {'outOf' in s && <span style={{ fontSize: '0.85rem', color: '#333', fontWeight: 700 }}>/{s.outOf}</span>}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#fff', fontWeight: 600, marginTop: 4 }}>{s.label}</div>
              <div style={{ fontSize: '0.65rem', color: '#444', marginTop: 2 }}>{s.sub}</div>
              {pct !== null && (
                <div style={{ marginTop: 6, height: 4, background: '#111', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: s.color, borderRadius: 2 }} />
                </div>
              )}
            </div>
          </Col>
        )
      })}
    </Row>
  )
}

/* ─── Difficulty Chart ───────────────────────────────────── */
function DifficultyChart({ data }: { data: OverviewData }) {
  const tp = data.totalProblems
  return (
    <div style={{ ...card, height: '100%' }}>
      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff', marginBottom: '0.25rem' }}>Difficulty Distribution</div>
      <div style={{ fontSize: '0.72rem', color: '#444', marginBottom: '1rem' }}>
        Total programs: <span style={{ color: '#818cf8', fontWeight: 700 }}>{tp.total}</span>
      </div>
      {(['Easy', 'Medium', 'Hard'] as const).map(d => {
        const solved   = data.diffBreakdown[d]
        const avail    = tp[d] || 1
        const pct      = Math.round((solved / avail) * 100)
        return (
          <div key={d} style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: DC[d] }}>{d}</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>
                  {solved}<span style={{ color: '#333', fontWeight: 400 }}>/{tp[d]}</span>
                </span>
                <span style={{ fontSize: '0.7rem', background: BG[d], color: DC[d], border: `1px solid ${DC[d]}44`, borderRadius: 20, padding: '1px 8px', fontWeight: 700 }}>{pct}%</span>
              </div>
            </div>
            <div style={{ height: 10, background: '#111', borderRadius: 5, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: DC[d], borderRadius: 5, transition: 'width 0.7s ease' }} />
            </div>
          </div>
        )
      })}
      {/* Stacked split bar */}
      <div style={{ marginTop: '1.25rem' }}>
        <div style={{ fontSize: '0.72rem', color: '#444', marginBottom: 5 }}>Overall Split</div>
        <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden' }}>
          {(['Easy', 'Medium', 'Hard'] as const).map(d => (
            <div key={d} style={{ flex: data.diffBreakdown[d] || 0.01, background: DC[d] }} title={`${d}: ${data.diffBreakdown[d]}`} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
          {(['Easy', 'Medium', 'Hard'] as const).map(d => (
            <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: DC[d] }} />
              <span style={{ fontSize: '0.68rem', color: '#888' }}>{d}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Trend Chart ────────────────────────────────────────── */
function TrendChart({ trend }: { trend: TrendPoint[] }) {
  const max   = Math.max(...trend.map(t => t.count), 1)
  const total = trend.reduce((s, t) => s + t.count, 0)
  return (
    <div style={{ ...card, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>14-Day Completion Trend</div>
          <div style={{ fontSize: '0.72rem', color: '#555', marginTop: 2 }}>{total} problems solved in last 14 days</div>
        </div>
        <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#6366f1', lineHeight: 1 }}>{total}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80 }}>
        {trend.map((t, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'flex-end', height: '100%' }}>
            <div style={{ width: '100%', borderRadius: '3px 3px 0 0', minHeight: t.count > 0 ? 4 : 2, height: `${Math.max((t.count / max) * 100, t.count > 0 ? 8 : 2)}%`, background: t.count > 0 ? 'linear-gradient(180deg,#818cf8,#6366f1)' : '#1a1a1a', transition: 'height 0.5s ease' }} title={`${t.date}: ${t.count}`} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
        <span style={{ fontSize: '0.62rem', color: '#333' }}>{trend[0]?.date?.slice(5)}</span>
        <span style={{ fontSize: '0.62rem', color: '#333' }}>{trend[trend.length - 1]?.date?.slice(5)}</span>
      </div>
    </div>
  )
}

/* ─── Top Problems ───────────────────────────────────────── */
function TopProblems({ problems }: { problems: TopProblem[] }) {
  return (
    <div style={{ ...card, height: '100%' }}>
      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff', marginBottom: '1rem' }}>Most Solved Problems</div>
      {problems.length === 0 && <div style={{ color: '#555', fontSize: '0.82rem' }}>No data yet</div>}
      {problems.map((p, i) => (
        <div key={p.problemId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.6rem 0', borderBottom: '1px solid #1a1a1a' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#333', width: 16, flexShrink: 0 }}>#{i + 1}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.82rem', color: '#ddd', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</div>
            <span style={{ fontSize: '0.65rem', color: DC[p.difficulty], fontWeight: 700 }}>{p.difficulty}</span>
          </div>
          <div style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 20, padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700, flexShrink: 0 }}>
            {p.count} solved
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Student Table ──────────────────────────────────────── */
function StudentTable({ apiBase }: { apiBase: string }) {
  const { user } = useAuthContext() as any
  const baseURL   = import.meta.env.VITE_API_BASE_URL

  const [rows, setRows]         = useState<StudentRow[]>([])
  const [total, setTotal]       = useState(0)
  const [tp, setTp]             = useState<{ Easy: number; Medium: number; Hard: number; total: number }>({ Easy: 0, Medium: 0, Hard: 0, total: 0 })
  const [page, setPage]         = useState(1)
  const [search, setSearch]     = useState('')
  const [query, setQuery]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [dateFrom, setDateFrom] = useState(daysAgo(30))
  const [dateTo, setDateTo]     = useState(today())
  const [appliedFrom, setAppliedFrom] = useState(daysAgo(30))
  const [appliedTo, setAppliedTo]     = useState(today())
  const limit = 20

  const doFetch = (pg: number, q: string, from: string, to: string) => {
    if (!user?.token) return
    setLoading(true)
    const params = new URLSearchParams({ page: String(pg), limit: String(limit), search: q, from, to })
    fetch(`${baseURL}${apiBase}/code-challenge-students?${params}`, {
      headers: { Authorization: `Bearer ${user.token}` },
      cache: 'no-store',
    })
      .then(r => r.json())
      .then(d => { if (d.success) { setRows(d.students); setTotal(d.total); if (d.totalProblems) setTp(d.totalProblems) } })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { doFetch(page, query, appliedFrom, appliedTo) }, [apiBase, user?.token, page, query, appliedFrom, appliedTo])

  const pages = Math.ceil(total / limit)

  const th: React.CSSProperties = { padding: '0.65rem 0.9rem', fontSize: '0.72rem', color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #1e1e1e', whiteSpace: 'nowrap' }
  const td: React.CSSProperties = { padding: '0.7rem 0.9rem', fontSize: '0.82rem', color: '#ccc', borderBottom: '1px solid #141414', verticalAlign: 'middle' }
  const inp: React.CSSProperties = { background: '#111', border: '1px solid #2a2a2a', borderRadius: 8, color: '#ccc', fontSize: '0.78rem', padding: '5px 10px', outline: 'none' }

  return (
    <div style={{ background: '#141414', border: '1px solid #222', borderRadius: 14, overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #1e1e1e', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>Student-wise Performance</div>
          <div style={{ fontSize: '0.72rem', color: '#444', marginTop: 2 }}>{total} students</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Date range */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#0d0d0d', border: '1px solid #2a2a2a', borderRadius: 8, padding: '5px 10px' }}>
            <span style={{ fontSize: '0.72rem', color: '#555' }}>From</span>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ ...inp, border: 'none', padding: 0, background: 'none' }} />
            <span style={{ fontSize: '0.72rem', color: '#555' }}>To</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ ...inp, border: 'none', padding: 0, background: 'none' }} />
          </div>
          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', background: '#111', border: '1px solid #2a2a2a', borderRadius: 8, padding: '5px 10px', gap: 6 }}>
            <FaSearch size={11} color="#444" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { setQuery(search); setPage(1) } }}
              placeholder="Search student…"
              style={{ background: 'none', border: 'none', outline: 'none', color: '#ccc', fontSize: '0.8rem', width: 150 }} />
          </div>
          <button onClick={() => { setQuery(search); setAppliedFrom(dateFrom); setAppliedTo(dateTo); setPage(1) }}
            style={{ background: '#6366f1', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 16px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
            Apply
          </button>
          <button onClick={() => { setSearch(''); setQuery(''); setDateFrom(daysAgo(30)); setDateTo(today()); setAppliedFrom(daysAgo(30)); setAppliedTo(today()); setPage(1) }}
            style={{ background: '#1a1a1a', border: '1px solid #333', color: '#888', borderRadius: 8, padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer' }}>
            Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#0d0d0d' }}>
            <tr>
              <th style={th}>#</th>
              <th style={th}>Student</th>
              <th style={{ ...th, color: '#22c55e' }}>Easy {tp.Easy > 0 && <span style={{ color: '#2a4a2a', fontWeight: 400 }}>/{tp.Easy}</span>}</th>
              <th style={{ ...th, color: '#f59e0b' }}>Medium {tp.Medium > 0 && <span style={{ color: '#4a3a1a', fontWeight: 400 }}>/{tp.Medium}</span>}</th>
              <th style={{ ...th, color: '#ef4444' }}>Hard {tp.Hard > 0 && <span style={{ color: '#4a1a1a', fontWeight: 400 }}>/{tp.Hard}</span>}</th>
              <th style={{ ...th, color: '#818cf8' }}>Progress {tp.total > 0 && <span style={{ color: '#2a2a4a', fontWeight: 400 }}>/{tp.total}</span>}</th>
              <th style={th}>Grade</th>
              <th style={th}>Last Active</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={8} style={{ ...td, textAlign: 'center', padding: '2.5rem' }}>
                <Spinner animation="border" size="sm" style={{ color: '#6366f1' }} />
              </td></tr>
            )}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={8} style={{ ...td, textAlign: 'center', color: '#444', padding: '2.5rem' }}>No students found</td></tr>
            )}
            {!loading && rows.map((r, i) => {
              const rank        = (page - 1) * limit + i + 1
              const weightedPts = r.Easy + r.Medium * 2 + r.Hard * 3
              const hasStarted  = r.total > 0
              const grade       = !hasStarted ? '—' : weightedPts >= 30 ? 'A+' : weightedPts >= 20 ? 'A' : weightedPts >= 10 ? 'B' : weightedPts >= 4 ? 'C' : 'D'
              const gc          = !hasStarted ? '#333' : grade.startsWith('A') ? '#22c55e' : grade === 'B' ? '#6366f1' : grade === 'C' ? '#f59e0b' : '#ef4444'
              // Progress bar: stacked Easy/Medium/Hard out of total solved
              const barTotal = r.Easy + r.Medium + r.Hard || 1
              return (
                <tr key={r.studentId} onMouseEnter={e => (e.currentTarget.style.background = '#1a1a1a')} onMouseLeave={e => (e.currentTarget.style.background = '')}>
                  <td style={{ ...td, color: '#444', fontWeight: 700 }}>{rank}</td>
                  <td style={td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: hasStarted ? 'rgba(99,102,241,0.12)' : '#111', border: `1px solid ${hasStarted ? 'rgba(99,102,241,0.25)' : '#222'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: hasStarted ? '#818cf8' : '#333', fontWeight: 800, fontSize: '0.75rem' }}>
                        {r.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: hasStarted ? '#eee' : '#555', fontSize: '0.85rem' }}>{r.name}</div>
                        <div style={{ fontSize: '0.7rem', color: '#3a3a3a' }}>{r.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={td}>
                    <span style={{ background: r.Easy > 0 ? 'rgba(34,197,94,0.1)' : 'transparent', color: r.Easy > 0 ? '#22c55e' : '#333', border: `1px solid ${r.Easy > 0 ? 'rgba(34,197,94,0.2)' : '#1e1e1e'}`, borderRadius: 6, padding: '2px 10px', fontSize: '0.78rem', fontWeight: 700 }}>{r.Easy}</span>
                  </td>
                  <td style={td}>
                    <span style={{ background: r.Medium > 0 ? 'rgba(245,158,11,0.1)' : 'transparent', color: r.Medium > 0 ? '#f59e0b' : '#333', border: `1px solid ${r.Medium > 0 ? 'rgba(245,158,11,0.2)' : '#1e1e1e'}`, borderRadius: 6, padding: '2px 10px', fontSize: '0.78rem', fontWeight: 700 }}>{r.Medium}</span>
                  </td>
                  <td style={td}>
                    <span style={{ background: r.Hard > 0 ? 'rgba(239,68,68,0.1)' : 'transparent', color: r.Hard > 0 ? '#ef4444' : '#333', border: `1px solid ${r.Hard > 0 ? 'rgba(239,68,68,0.2)' : '#1e1e1e'}`, borderRadius: 6, padding: '2px 10px', fontSize: '0.78rem', fontWeight: 700 }}>{r.Hard}</span>
                  </td>
                  <td style={td}>
                    <div style={{ minWidth: 130 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                        <span style={{ fontWeight: 800, color: hasStarted ? '#818cf8' : '#333', fontSize: '0.9rem' }}>
                          {r.total}
                          {tp.total > 0 && <span style={{ fontSize: '0.72rem', color: '#333', fontWeight: 400 }}>/{tp.total}</span>}
                        </span>
                        {tp.total > 0 && (
                          <span style={{ fontSize: '0.68rem', color: hasStarted ? '#818cf8' : '#2a2a2a', fontWeight: 700 }}>
                            {Math.round((r.total / tp.total) * 100)}%
                          </span>
                        )}
                      </div>
                      {/* Stacked progress bar — width relative to total programs */}
                      <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', background: '#111' }}>
                        {tp.total > 0 ? (
                          <>
                            <div style={{ width: `${(r.Easy   / tp.total) * 100}%`, background: '#22c55e' }} title={`Easy: ${r.Easy}`} />
                            <div style={{ width: `${(r.Medium / tp.total) * 100}%`, background: '#f59e0b' }} title={`Medium: ${r.Medium}`} />
                            <div style={{ width: `${(r.Hard   / tp.total) * 100}%`, background: '#ef4444' }} title={`Hard: ${r.Hard}`} />
                          </>
                        ) : (
                          <div style={{ width: `${(r.total / barTotal) * 100}%`, background: '#6366f1' }} />
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={td}>
                    <span style={{ background: hasStarted ? `${gc}18` : '#111', color: gc, border: `1px solid ${hasStarted ? gc + '33' : '#1e1e1e'}`, borderRadius: 6, padding: '2px 10px', fontSize: '0.75rem', fontWeight: 800 }}>{grade}</span>
                  </td>
                  <td style={{ ...td, color: '#555', fontSize: '0.75rem' }}>
                    {r.lastActivity
                      ? new Date(r.lastActivity).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                      : <span style={{ color: '#2a2a2a' }}>Not started</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid #1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.75rem', color: '#555' }}>Page {page} of {pages} · {total} students</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #222', background: '#111', color: page === 1 ? '#333' : '#aaa', fontSize: '0.75rem', cursor: page === 1 ? 'default' : 'pointer' }}>‹</button>
            {Array.from({ length: Math.min(pages, 8) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                style={{ width: 30, height: 30, borderRadius: 6, border: p === page ? '1px solid #6366f1' : '1px solid #222', background: p === page ? '#6366f1' : '#111', color: p === page ? '#fff' : '#555', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                {p}
              </button>
            ))}
            {pages > 8 && <span style={{ color: '#333', alignSelf: 'center', fontSize: '0.75rem' }}>…{pages}</span>}
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
              style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #222', background: '#111', color: page === pages ? '#333' : '#aaa', fontSize: '0.75rem', cursor: page === pages ? 'default' : 'pointer' }}>›</button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Main component ──────────────────────────────────────── */
const CodeChallengeFull = ({ apiBase = '/api/adminDashboardCharts' }: { apiBase?: string }) => {
  const { user }  = useAuthContext() as any
  const baseURL   = import.meta.env.VITE_API_BASE_URL
  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [activeTab, setActiveTab] = useState<'charts' | 'students'>('charts')

  useEffect(() => {
    if (!user?.token) return
    fetch(`${baseURL}${apiBase}/code-challenge-overview`, {
      headers: { Authorization: `Bearer ${user.token}` },
      cache: 'no-store',
    })
      .then(r => r.json())
      .then(d => { if (d.success) setOverview(d); else setError(d.message || 'Failed') })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false))
  }, [apiBase, user?.token])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
      <Spinner animation="border" style={{ color: '#6366f1' }} />
    </div>
  )
  if (error || !overview) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: '#555' }}>
      {error || 'No data'}
    </div>
  )

  return (
    <div>
      {/* Summary stat cards */}
      <SummaryCards data={overview} />

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #1e1e1e', marginBottom: '1.5rem' }}>
        {([
          { key: 'charts',   icon: <FaChartBar size={13} />, label: 'Charts & Overview' },
          { key: 'students', icon: <FaUsers size={13} />,    label: 'Students' },
        ] as const).map(t => {
          const active = activeTab === t.key
          return (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              style={{ position: 'relative', background: 'none', border: 'none', padding: '0.65rem 1.25rem 0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: active ? 700 : 500, color: active ? '#fff' : '#555', transition: 'color 0.15s' }}>
              <span style={{ color: active ? '#6366f1' : '#3a3a3a' }}>{t.icon}</span>
              {t.label}
              {active && <div style={{ position: 'absolute', bottom: 0, left: '10%', width: '80%', height: 2.5, background: '#6366f1', borderRadius: 2 }} />}
            </button>
          )
        })}
      </div>

      {/* Charts Tab */}
      {activeTab === 'charts' && (
        <Row className="g-3">
          <Col md={12} lg={4}><DifficultyChart data={overview} /></Col>
          <Col md={12} lg={5}><TrendChart trend={overview.trend} /></Col>
          <Col md={12} lg={3}><TopProblems problems={overview.topProblems} /></Col>
        </Row>
      )}

      {/* Students Tab */}
      {activeTab === 'students' && (
        <StudentTable apiBase={apiBase} />
      )}
    </div>
  )
}

export default CodeChallengeFull
