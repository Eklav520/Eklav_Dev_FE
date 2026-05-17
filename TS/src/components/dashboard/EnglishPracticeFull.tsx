import { useCallback, useEffect, useRef, useState } from 'react'
import { Spinner } from 'react-bootstrap'
import {
  FaMicrophone, FaPencilAlt, FaBook, FaHeadphones, FaBolt,
  FaSearch, FaArrowUp, FaArrowDown, FaMinus,
} from 'react-icons/fa'
import { useAuthContext } from '@/context/useAuthContext'

/* ─── Types ─────────────────────────────────────────────── */
type SkillStat = { utilized: number; capacity: number; utilizationPct: number; avgScore: number }
type OverviewData = {
  totalStudents:    number
  approvedStudents: number
  monthlyCapacity:  number
  monthKey:         string | null
  skills: { speaking: SkillStat; writing: SkillStat; reading: SkillStat; listening: SkillStat; jam: SkillStat }
}

type SkillEntry = { bestScore: number; latestScore: number; trend: string | null; lastActivity: string | null; attemptCount?: number } | null

type StudentRow = {
  userId: string
  name: string
  email: string
  speaking:  SkillEntry
  writing:   SkillEntry
  reading:   SkillEntry
  listening: SkillEntry
  jam:       SkillEntry
}

type Pagination = { total: number; page: number; limit: number; totalPages: number }

/* ─── Constants ─────────────────────────────────────────── */
const SKILLS = [
  { key: 'speaking',  label: 'Speaking',     icon: FaMicrophone, color: '#3b82f6' },
  { key: 'writing',   label: 'Writing',       icon: FaPencilAlt,  color: '#f59e0b' },
  { key: 'reading',   label: 'Reading',       icon: FaBook,       color: '#22c55e' },
  { key: 'listening', label: 'Listening',     icon: FaHeadphones, color: '#a855f7' },
  { key: 'jam',       label: 'Just a Minute', icon: FaBolt,       color: '#ef4444' },
] as const

type SkillKey = (typeof SKILLS)[number]['key']

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/* ─── Styles ─────────────────────────────────────────────── */
const S = {
  card:  { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 14 } as React.CSSProperties,
  th:    { background: '#111', color: '#555', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, padding: '0.75rem 1rem', textAlign: 'left' as const, borderBottom: '1px solid #2a2a2a', whiteSpace: 'nowrap' as const },
  td:    { padding: '0.7rem 1rem', borderBottom: '1px solid #1e1e1e', color: '#e0e0e0', fontSize: '0.83rem', whiteSpace: 'nowrap' as const } as React.CSSProperties,
  tdMut: { padding: '0.7rem 1rem', borderBottom: '1px solid #1e1e1e', color: '#aaa', fontSize: '0.78rem', whiteSpace: 'nowrap' as const } as React.CSSProperties,
  select: { background: '#111', border: '1px solid #2a2a2a', color: '#fff', borderRadius: 8, padding: '6px 12px', fontSize: '0.82rem', cursor: 'pointer' } as React.CSSProperties,
  searchInput: { background: '#111', border: '1px solid #2a2a2a', color: '#fff', borderRadius: 8, padding: '6px 12px 6px 28px', fontSize: '0.82rem', width: 220 } as React.CSSProperties,
  footer: { background: '#111', borderTop: '1px solid #2a2a2a', color: '#555', fontSize: '0.78rem', borderRadius: '0 0 14px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: '0.5rem', padding: '0.75rem 1.25rem' } as React.CSSProperties,
  sectionLabel: { color: '#aaa', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '0.75rem' } as React.CSSProperties,
}

/* ─── Helpers ────────────────────────────────────────────── */
const scoreColor = (score: number | null | undefined) => {
  if (score == null) return '#333'
  if (score >= 80) return '#22c55e'
  if (score >= 50) return '#f59e0b'
  return '#ef4444'
}

const TrendIcon = ({ trend }: { trend: string | null }) => {
  if (trend === 'IMPROVED') return <FaArrowUp size={10} color="#22c55e" />
  if (trend === 'DROPPED')  return <FaArrowDown size={10} color="#ef4444" />
  return <FaMinus size={10} color="#555" />
}

/* ─── Pagination Button ──────────────────────────────────── */
const PagBtn = ({ children, onClick, disabled = false, active = false }: {
  children: React.ReactNode; onClick: () => void; disabled?: boolean; active?: boolean
}) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: active ? '#ff6b00' : '#1a1a1a', border: `1px solid ${active ? '#ff6b00' : '#2a2a2a'}`,
    color: active ? '#fff' : disabled ? '#333' : '#888', borderRadius: 6,
    padding: '4px 10px', fontSize: '0.78rem', fontWeight: active ? 600 : 400,
    cursor: disabled ? 'not-allowed' : 'pointer', minWidth: 32,
  }}>{children}</button>
)

/* ─── Score Cell ─────────────────────────────────────────── */
const ScoreCell = ({ entry, color, showAttempts = false }: { entry: SkillEntry; color: string; showAttempts?: boolean }) => {
  if (!entry || (showAttempts && !entry.attemptCount)) {
    return <span style={{ color: '#444', fontSize: '0.75rem' }}>—</span>
  }
  if (showAttempts) {
    return (
      <div style={{ textAlign: 'center' as const }}>
        <div style={{ color, fontWeight: 700, fontSize: '0.9rem' }}>{entry.attemptCount}</div>
        <div style={{ color: '#555', fontSize: '0.62rem', letterSpacing: '0.04em' }}>attempts</div>
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{
        background: `${scoreColor(entry.bestScore)}18`,
        color: scoreColor(entry.bestScore),
        border: `1px solid ${scoreColor(entry.bestScore)}33`,
        borderRadius: 6, padding: '2px 9px', fontSize: '0.75rem', fontWeight: 700,
      }}>
        {entry.bestScore}
      </span>
      <TrendIcon trend={entry.trend} />
    </div>
  )
}

/* ─── Main Component ─────────────────────────────────────── */
const EnglishPracticeFull = ({ apiBase = '/api/institute' }: { apiBase?: string }) => {
  const { user } = useAuthContext()
  const baseURL  = import.meta.env.VITE_API_BASE_URL

  const now = new Date()

  const [overview, setOverview]         = useState<OverviewData | null>(null)
  const [overviewLoading, setOvLoading] = useState(true)

  const [students, setStudents]   = useState<StudentRow[]>([])
  const [pagination, setPag]      = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 1 })
  const [studLoading, setStudLoad] = useState(false)

  const [tab, setTab]           = useState<'overview' | 'students'>('overview')
  const [search, setSearch]     = useState('')
  const [skill, setSkill]       = useState<SkillKey | ''>('')
  const [page, setPage]         = useState(1)
  const [limit, setLimit]       = useState(20)

  // Monthly filter for students tab
  const [studMonth, setStudMonth]       = useState(now.getMonth() + 1)
  const [studYear, setStudYear]         = useState(now.getFullYear())
  const [studMonthKey, setStudMonthKey] = useState('')
  const yearRange = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i)

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* ── Fetch overview ─────────────────────────────────────── */
  useEffect(() => {
    if (!user?.token) return
    setOvLoading(true)
    fetch(`${baseURL}${apiBase}/english-practice-overview`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((r) => r.json())
      .then((d) => { if (d.success) setOverview(d) })
      .catch(console.error)
      .finally(() => setOvLoading(false))
  }, [user?.token, baseURL, apiBase])

  /* ── Fetch students ─────────────────────────────────────── */
  const fetchStudents = useCallback(async (opts: { page?: number; limit?: number; search?: string; skill?: string; monthKey?: string } = {}) => {
    if (!user?.token) return
    setStudLoad(true)
    const params = new URLSearchParams({
      page:     String(opts.page  ?? 1),
      limit:    String(opts.limit ?? 20),
      search:   opts.search   ?? '',
      skill:    opts.skill    ?? '',
      monthKey: opts.monthKey ?? '',
    })
    try {
      const res  = await fetch(`${baseURL}${apiBase}/english-practice-students?${params}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      })
      const data = await res.json()
      if (data.success) { setStudents(data.students); setPag(data.pagination) }
    } catch (err) { console.error(err) }
    finally { setStudLoad(false) }
  }, [user?.token, baseURL, apiBase])

  useEffect(() => {
    if (tab === 'students') fetchStudents({ page, limit, search, skill, monthKey: studMonthKey })
  }, [tab, page, limit]) // eslint-disable-line

  const onSearch = (val: string) => {
    setSearch(val)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setPage(1)
      fetchStudents({ page: 1, limit, search: val, skill, monthKey: studMonthKey })
    }, 400)
  }

  const onSkillFilter = (val: string) => {
    setSkill(val as SkillKey | '')
    setPage(1)
    fetchStudents({ page: 1, limit, search, skill: val, monthKey: studMonthKey })
  }

  const handleStudMonthGo = () => {
    const key = `${studYear}-${String(studMonth).padStart(2, '0')}`
    setStudMonthKey(key)
    setPage(1)
    fetchStudents({ page: 1, limit, search, skill, monthKey: key })
  }

  const clearStudMonth = () => {
    setStudMonthKey('')
    setPage(1)
    fetchStudents({ page: 1, limit, search, skill, monthKey: '' })
  }

  if (overviewLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <Spinner animation="border" style={{ color: '#ff6b00' }} />
      </div>
    )
  }

  return (
    <div>
      {/* ── Tabs ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {(['overview', 'students'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: tab === t ? '#ff6b00' : 'transparent',
            border: `1px solid ${tab === t ? '#ff6b00' : '#2a2a2a'}`,
            color: tab === t ? '#fff' : '#666',
            borderRadius: 8, padding: '5px 18px', fontSize: '0.82rem',
            fontWeight: 600, cursor: 'pointer',
          }}>
            {t === 'overview' ? 'Overview' : 'Students'}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ─────────────────────────────────────── */}
      {tab === 'overview' && overview && (
        <div>
          {/* Capacity info strip */}
          <div style={{
            background: '#111', border: '1px solid #1e1e1e', borderRadius: 10,
            padding: '0.6rem 1.1rem', marginBottom: '1.25rem',
            display: 'flex', flexWrap: 'wrap' as const, gap: '1.5rem', alignItems: 'center',
          }}>
            {[
              { label: 'Total Students',    value: overview.totalStudents,                  color: '#888' },
              { label: 'Approved Students', value: overview.approvedStudents,               color: '#22c55e' },
              { label: 'Monthly Capacity',  value: `${overview.monthlyCapacity.toLocaleString()} attempts`, color: '#3b82f6' },
              { label: 'Per Skill',         value: `${overview.approvedStudents} × 30`,     color: '#f59e0b' },
            ].map((s) => (
              <div key={s.label}>
                <div style={{ color: s.color, fontWeight: 700, fontSize: '1rem' }}>{s.value}</div>
                <div style={{ color: '#444', fontSize: '0.65rem', letterSpacing: '0.06em' }}>{s.label.toUpperCase()}</div>
              </div>
            ))}
          </div>

          {/* ── Skill Cards ── */}
          <div style={S.sectionLabel}>English Skills — Monthly Attempt Utilization</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.9rem', marginBottom: '2rem' }}>
            {SKILLS.map(({ key, label, icon: Icon, color }) => {
              const stat = overview.skills[key]
              return (
                <div key={key} style={{
                  background: '#1a1a1a', border: '1px solid #252525',
                  borderRadius: 16, padding: '1.25rem', borderTop: `3px solid ${color}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.9rem' }}>
                    <div style={{ background: `${color}18`, borderRadius: 8, padding: '7px', display: 'inline-flex' }}>
                      <Icon size={15} color={color} />
                    </div>
                    <span style={{ color: '#ddd', fontWeight: 700, fontSize: '0.88rem' }}>{label}</span>
                  </div>

                  {/* Attempts vs Capacity */}
                  <div style={{ marginBottom: '0.65rem' }}>
                    <div style={{ color: color, fontWeight: 800, fontSize: '1.5rem', lineHeight: 1 }}>
                      {stat.utilized}
                    </div>
                    <div style={{ color: '#555', fontSize: '0.65rem', fontWeight: 500, letterSpacing: '0.06em', marginTop: 2 }}>
                      ATTEMPTS USED
                    </div>
                  </div>
                  <div style={{ color: '#444', fontSize: '0.72rem', marginBottom: '0.6rem' }}>
                    of <span style={{ color: '#666' }}>{stat.capacity.toLocaleString()}</span> capacity
                  </div>

                  {/* Utilization bar */}
                  <div style={{ background: '#111', borderRadius: 4, height: 6, overflow: 'hidden', marginBottom: '0.6rem' }}>
                    <div style={{ width: `${stat.utilizationPct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.4s' }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: color, fontWeight: 700, fontSize: '0.82rem' }}>{stat.utilizationPct}% utilized</span>
                    {stat.avgScore > 0 && (
                      <span style={{
                        background: `${scoreColor(stat.avgScore)}18`, color: scoreColor(stat.avgScore),
                        border: `1px solid ${scoreColor(stat.avgScore)}33`,
                        borderRadius: 5, padding: '1px 8px', fontSize: '0.7rem', fontWeight: 700,
                      }}>
                        avg {stat.avgScore}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Top Utilized Ranking ── */}
          <div style={S.sectionLabel}>Top Utilized — Skill Ranking</div>
          <div style={{ ...S.card, padding: '1.25rem 1.5rem' }}>
            {[...SKILLS]
              .map(({ key, label, icon: Icon, color }) => ({ key, label, Icon, color, stat: overview.skills[key] }))
              .sort((a, b) => b.stat.utilizationPct - a.stat.utilizationPct)
              .map(({ key, label, Icon, color, stat }, idx) => (
                <div key={key} style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  padding: '0.6rem 0',
                  borderBottom: idx < SKILLS.length - 1 ? '1px solid #1e1e1e' : 'none',
                }}>
                  {/* Rank */}
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                    background: idx === 0 ? '#FFD70022' : idx === 1 ? '#C0C0C022' : idx === 2 ? '#CD7F3222' : '#1a1a1a',
                    border: `1px solid ${idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : '#2a2a2a'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.68rem', fontWeight: 700,
                    color: idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : '#444',
                  }}>
                    {idx + 1}
                  </div>

                  {/* Skill */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 130 }}>
                    <Icon size={13} color={color} />
                    <span style={{ color: '#ccc', fontWeight: 600, fontSize: '0.85rem' }}>{label}</span>
                  </div>

                  {/* Bar */}
                  <div style={{ flex: 1, background: '#111', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                    <div style={{ width: `${stat.utilizationPct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.4s' }} />
                  </div>

                  {/* Stats */}
                  <div style={{ display: 'flex', gap: '0.75rem', minWidth: 230, justifyContent: 'flex-end' as const }}>
                    <span style={{ color: color, fontWeight: 700, fontSize: '0.78rem' }}>{stat.utilized} attempts</span>
                    <span style={{ color: '#444', fontSize: '0.78rem' }}>/ {stat.capacity.toLocaleString()}</span>
                    <span style={{ color: color, fontWeight: 800, fontSize: '0.78rem', minWidth: 38, textAlign: 'right' as const }}>
                      {stat.utilizationPct}%
                    </span>
                    {stat.avgScore > 0 && (
                      <span style={{ color: scoreColor(stat.avgScore), fontSize: '0.75rem', fontWeight: 600, minWidth: 44, textAlign: 'right' as const }}>
                        avg {stat.avgScore}
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── Students Tab ─────────────────────────────────────── */}
      {tab === 'students' && (
        <div style={S.card}>
          {/* Filter bar — row 1 */}
          <div style={{
            padding: '0.9rem 1.25rem 0.5rem', borderBottom: '1px solid #1e1e1e',
            display: 'flex', flexWrap: 'wrap' as const, gap: '0.6rem', alignItems: 'center',
          }}>
            <select style={{ ...S.select, minWidth: 160 }} value={skill} onChange={(e) => onSkillFilter(e.target.value)}>
              <option value="">All Skills</option>
              {SKILLS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
            <select style={{ ...S.select, width: 110 }} value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1) }}>
              {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n} / page</option>)}
            </select>
            <div style={{ flex: 1 }} />
            <div style={{ position: 'relative' }}>
              <FaSearch size={11} color="#444" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                style={S.searchInput}
                placeholder="Search name / email"
                value={search}
                onChange={(e) => onSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Filter bar — row 2: monthly performance */}
          <div style={{
            padding: '0.5rem 1.25rem 0.75rem', borderBottom: '1px solid #2a2a2a',
            display: 'flex', flexWrap: 'wrap' as const, gap: '0.5rem', alignItems: 'center',
          }}>
            <span style={{ color: '#555', fontSize: '0.73rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>
              Monthly performance
            </span>
            <select style={S.select} value={studMonth} onChange={(e) => setStudMonth(Number(e.target.value))}>
              {MONTH_NAMES.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
            <select style={S.select} value={studYear} onChange={(e) => setStudYear(Number(e.target.value))}>
              {yearRange.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <button onClick={handleStudMonthGo} style={{ background: '#ff6b00', border: 'none', color: '#fff', borderRadius: 7, padding: '5px 14px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
              Go
            </button>
            {studMonthKey && (
              <>
                <span style={{ color: '#ff6b00', fontSize: '0.75rem', fontWeight: 600 }}>
                  Showing: {MONTH_NAMES[parseInt(studMonthKey.split('-')[1]) - 1]} {studMonthKey.split('-')[0]}
                </span>
                <button onClick={clearStudMonth} style={{ background: 'transparent', border: '1px solid #2a2a2a', color: '#666', borderRadius: 6, padding: '3px 10px', fontSize: '0.73rem', cursor: 'pointer' }}>
                  Clear
                </button>
              </>
            )}
          </div>

          {/* Table */}
          <div style={{ position: 'relative', overflowX: 'auto' }}>
            {studLoading && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                <Spinner animation="border" style={{ color: '#ff6b00', width: 24, height: 24 }} />
              </div>
            )}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...S.th, minWidth: 40 }}>#</th>
                  <th style={{ ...S.th, minWidth: 150 }}>Student</th>
                  <th style={{ ...S.th, minWidth: 180 }}>Email</th>
                  {SKILLS.map(({ key, label, color }) => (
                    <th key={key} style={{ ...S.th, minWidth: 110, textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <span style={{ color }}>{label}</span>
                        {studMonthKey && <span style={{ color: '#444', fontSize: '0.6rem', fontWeight: 400, letterSpacing: '0.04em' }}>attempts</span>}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: '#444' }}>
                      {studLoading ? '' : 'No students found'}
                    </td>
                  </tr>
                ) : students.map((s, i) => (
                  <tr key={s.userId}>
                    <td style={S.tdMut}>{(pagination.page - 1) * pagination.limit + i + 1}</td>
                    <td style={{ ...S.td, fontWeight: 600, color: '#fff' }}>
                      {s.name || s.email?.split('@')[0] || '—'}
                    </td>
                    <td style={S.tdMut}>{s.email}</td>
                    {SKILLS.map(({ key, color }) => (
                      <td key={key} style={{ ...S.td, textAlign: 'center' }}>
                        <ScoreCell entry={s[key]} color={color} showAttempts={!!studMonthKey} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          <div style={S.footer}>
            <span>
              Showing{' '}
              <strong style={{ color: '#aaa' }}>
                {pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)}
              </strong>
              {' '}of <strong style={{ color: '#aaa' }}>{pagination.total}</strong> students
            </span>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <PagBtn disabled={pagination.page <= 1} onClick={() => setPage(pagination.page - 1)}>‹ Prev</PagBtn>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 1)
                .reduce<(number | '…')[]>((acc, p, idx, arr) => {
                  if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('…')
                  acc.push(p); return acc
                }, [])
                .map((p, idx) => p === '…'
                  ? <span key={`e-${idx}`} style={{ color: '#444', padding: '0 4px' }}>…</span>
                  : <PagBtn key={p} active={p === pagination.page} onClick={() => setPage(p as number)}>{p}</PagBtn>
                )}
              <PagBtn disabled={pagination.page >= pagination.totalPages} onClick={() => setPage(pagination.page + 1)}>Next ›</PagBtn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EnglishPracticeFull
