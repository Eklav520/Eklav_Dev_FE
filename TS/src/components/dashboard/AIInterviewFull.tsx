import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Spinner } from 'react-bootstrap'
import { FaRobot, FaMicrophone, FaFileAlt, FaSearch, FaDownload } from 'react-icons/fa'
import { useAuthContext } from '@/context/useAuthContext'
import * as XLSX from 'xlsx'

/* ─── Types ─────────────────────────────────────────────── */
type TypeStats = { attempts: number; uniqueStudents: number; avgScore: number; utilizationPct: number }
type OverviewData = {
  totalStudents: number
  month:         number
  year:          number
  topicBased:    TypeStats
  resumeBased:   TypeStats
}

type AttemptEntry   = { date: string; score: number; topic?: string }
type InterviewEntry = {
  attempts:     number
  attemptsList: AttemptEntry[]
  avgScore:     number
  bestScore:    number
  lastActivity: string | null
} | null
type StudentRow = {
  userId:      string
  name:        string
  email:       string
  topicBased:  InterviewEntry
  resumeBased: InterviewEntry
}
type Pagination = { total: number; page: number; limit: number; totalPages: number }

/* ─── Constants ─────────────────────────────────────────── */
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const TYPES = [
  { key: 'topicBased',  label: 'Topic Based',  icon: FaMicrophone, color: '#a855f7' },
  { key: 'resumeBased', label: 'Resume Based',  icon: FaFileAlt,    color: '#f59e0b' },
] as const

/* ─── Styles ─────────────────────────────────────────────── */
const S = {
  card:   { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 14 } as React.CSSProperties,
  th:     { background: '#111', color: '#555', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, padding: '0.75rem 1rem', textAlign: 'left' as const, borderBottom: '1px solid #2a2a2a', whiteSpace: 'nowrap' as const },
  td:     { padding: '0.7rem 1rem', borderBottom: '1px solid #1e1e1e', color: '#e0e0e0', fontSize: '0.83rem', whiteSpace: 'nowrap' as const } as React.CSSProperties,
  tdMut:  { padding: '0.7rem 1rem', borderBottom: '1px solid #1e1e1e', color: '#aaa', fontSize: '0.78rem', whiteSpace: 'nowrap' as const } as React.CSSProperties,
  select: { background: '#111', border: '1px solid #2a2a2a', color: '#fff', borderRadius: 8, padding: '6px 12px', fontSize: '0.82rem', cursor: 'pointer' } as React.CSSProperties,
  searchInput: { background: '#111', border: '1px solid #2a2a2a', color: '#fff', borderRadius: 8, padding: '6px 12px 6px 28px', fontSize: '0.82rem', width: 220 } as React.CSSProperties,
  footer: { background: '#111', borderTop: '1px solid #2a2a2a', color: '#555', fontSize: '0.78rem', borderRadius: '0 0 14px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: '0.5rem', padding: '0.75rem 1.25rem' } as React.CSSProperties,
  sectionLabel: { color: '#aaa', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '0.75rem' } as React.CSSProperties,
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
const ScoreCell = ({ entry, color }: { entry: InterviewEntry; color: string }) => {
  if (!entry || !entry.attempts) return <span style={{ color: '#333', fontSize: '0.75rem' }}>—</span>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
      <span style={{
        background: `${color}18`, color, border: `1px solid ${color}33`,
        borderRadius: 6, padding: '2px 9px', fontSize: '0.75rem', fontWeight: 700,
      }}>
        {entry.attempts} {entry.attempts === 1 ? 'attempt' : 'attempts'}
      </span>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ color, fontWeight: 700, fontSize: '0.7rem' }}>best {entry.bestScore}</span>
        {entry.avgScore !== entry.bestScore && (
          <span style={{ color: '#555', fontSize: '0.65rem' }}>· avg {entry.avgScore}</span>
        )}
      </div>
    </div>
  )
}

/* ─── Main Component ─────────────────────────────────────── */
const AIInterviewFull = ({ apiBase = '/api/institute' }: { apiBase?: string }) => {
  const { user } = useAuthContext()
  const baseURL  = import.meta.env.VITE_API_BASE_URL

  const now = new Date()

  /* Overview state */
  const [overview, setOverview]   = useState<OverviewData | null>(null)
  const [ovLoading, setOvLoading] = useState(true)
  const [ovMonth, setOvMonth]     = useState(now.getMonth() + 1)
  const [ovYear,  setOvYear]      = useState(now.getFullYear())
  const [appliedOv, setAppliedOv] = useState({ month: now.getMonth() + 1, year: now.getFullYear() })

  /* Students state */
  const [students, setStudents]   = useState<StudentRow[]>([])
  const [pagination, setPag]      = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 1 })
  const [stuLoading, setStuLoad]  = useState(false)

  const [tab, setTab]             = useState<'overview' | 'students'>('overview')
  const [viewStudent, setViewStudent] = useState<StudentRow | null>(null)
  const [search, setSearch]       = useState('')
  const [page, setPage]           = useState(1)
  const [limit, setLimit]         = useState(20)

  const [stuMonth, setStuMonth]     = useState(now.getMonth() + 1)
  const [stuYear,  setStuYear]      = useState(now.getFullYear())
  const [stuMonthKey, setStuMonthKey] = useState('')

  const yearRange   = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i)
  const [exporting, setExporting] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleExportExcel = async () => {
    if (!user?.token) return
    setExporting(true)
    try {
      const [y, m] = stuMonthKey ? stuMonthKey.split('-').map(Number) : [undefined, undefined]
      const params = new URLSearchParams({ page: '1', limit: '9999', search })
      if (m) params.set('month', String(m))
      if (y) params.set('year', String(y))
      const res = await fetch(`${baseURL}${apiBase}/ai-interview-students?${params}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      })
      const data = await res.json()
      const rows = (data.students || []).map((s: StudentRow, i: number) => ({
        '#': i + 1,
        'Name': s.name,
        'Email': s.email,
        'Topic Based Attempts': s.topicBased?.length ?? 0,
        'Resume Based Attempts': s.resumeBased?.length ?? 0,
      }))
      const ws = XLSX.utils.json_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'AI Interview')
      XLSX.writeFile(wb, `AI_Interview_${stuMonthKey || 'All'}.xlsx`)
    } catch (e) { console.error('Export error:', e) }
    finally { setExporting(false) }
  }

  /* ── Fetch overview ─────────────────────────────────────── */
  const fetchOverview = useCallback((month: number, year: number) => {
    if (!user?.token) return
    setOvLoading(true)
    fetch(`${baseURL}${apiBase}/ai-interview-overview?month=${month}&year=${year}`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((r) => r.json())
      .then((d) => { if (d.success) setOverview(d) })
      .catch(console.error)
      .finally(() => setOvLoading(false))
  }, [user?.token, baseURL, apiBase])

  /* ── Fetch students ─────────────────────────────────────── */
  const fetchStudents = useCallback(async (opts: { page?: number; limit?: number; search?: string; month?: number; year?: number } = {}) => {
    if (!user?.token) return
    setStuLoad(true)
    const params = new URLSearchParams({
      page:  String(opts.page  ?? 1),
      limit: String(opts.limit ?? 20),
      search: opts.search ?? '',
    })
    if (opts.month && opts.year) { params.set('month', String(opts.month)); params.set('year', String(opts.year)) }
    try {
      const res  = await fetch(`${baseURL}${apiBase}/ai-interview-students?${params}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      })
      const data = await res.json()
      if (data.success) { setStudents(data.students); setPag(data.pagination) }
    } catch (err) { console.error(err) }
    finally { setStuLoad(false) }
  }, [user?.token, baseURL, apiBase])

  useEffect(() => {
    if (!user?.token) return
    fetchOverview(now.getMonth() + 1, now.getFullYear())
  }, [user?.token]) // eslint-disable-line

  useEffect(() => {
    if (tab === 'students') {
      const [y, m] = stuMonthKey ? stuMonthKey.split('-').map(Number) : [undefined, undefined]
      fetchStudents({ page, limit, search, month: m, year: y })
    }
  }, [tab, page, limit]) // eslint-disable-line

  const onSearch = (val: string) => {
    setSearch(val)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setPage(1)
      const [y, m] = stuMonthKey ? stuMonthKey.split('-').map(Number) : [undefined, undefined]
      fetchStudents({ page: 1, limit, search: val, month: m, year: y })
    }, 400)
  }

  const handleOvGo = () => {
    setAppliedOv({ month: ovMonth, year: ovYear })
    fetchOverview(ovMonth, ovYear)
  }

  const handleStuGo = () => {
    const key = `${stuYear}-${String(stuMonth).padStart(2, '0')}`
    setStuMonthKey(key)
    setPage(1)
    fetchStudents({ page: 1, limit, search, month: stuMonth, year: stuYear })
  }

  const clearStuMonth = () => {
    setStuMonthKey('')
    setPage(1)
    fetchStudents({ page: 1, limit, search })
  }

  const ovMonthLabel = `${MONTH_NAMES[appliedOv.month - 1]} ${appliedOv.year}`

  if (ovLoading && tab === 'overview') {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <Spinner animation="border" style={{ color: '#ff6b00' }} />
      </div>
    )
  }

  return (
    <div>
      {/* ── Tabs ──────────────────────────────────────────────── */}
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
          {/* Info strip + month filter */}
          <div style={{
            background: '#111', border: '1px solid #1e1e1e', borderRadius: 10,
            padding: '0.6rem 1.1rem', marginBottom: '1.25rem',
            display: 'flex', flexWrap: 'wrap' as const, gap: '1.25rem', alignItems: 'center',
          }}>
            {[
              { label: 'Total Students',  value: overview.totalStudents,                              color: '#888' },
              { label: 'Topic Attempts',  value: overview.topicBased.attempts,                        color: '#a855f7' },
              { label: 'Resume Attempts', value: overview.resumeBased.attempts,                       color: '#f59e0b' },
              { label: 'Total Attempts',  value: overview.topicBased.attempts + overview.resumeBased.attempts, color: '#22c55e' },
            ].map((s) => (
              <div key={s.label}>
                <div style={{ color: s.color, fontWeight: 700, fontSize: '1rem' }}>{s.value}</div>
                <div style={{ color: '#444', fontSize: '0.65rem', letterSpacing: '0.06em' }}>{s.label.toUpperCase()}</div>
              </div>
            ))}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <select style={S.select} value={ovMonth} onChange={(e) => setOvMonth(Number(e.target.value))}>
                {MONTH_NAMES.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
              </select>
              <select style={S.select} value={ovYear} onChange={(e) => setOvYear(Number(e.target.value))}>
                {yearRange.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              <button onClick={handleOvGo} style={{ background: '#ff6b00', border: 'none', color: '#fff', borderRadius: 7, padding: '6px 14px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                Go
              </button>
            </div>
          </div>

          {/* ── Type Cards (2 columns, no empty space) ── */}
          <div style={S.sectionLabel}>AI Interview — Monthly Utilization · {ovMonthLabel}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem', marginBottom: '2rem' }}>
            {TYPES.map(({ key, label, icon: Icon, color }) => {
              const stat = overview[key] as TypeStats
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

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ color, fontWeight: 800, fontSize: '1.6rem', lineHeight: 1 }}>{stat.attempts}</div>
                      <div style={{ color: '#555', fontSize: '0.65rem', fontWeight: 500, letterSpacing: '0.06em', marginTop: 2 }}>ATTEMPTS</div>
                    </div>
                    <div>
                      <div style={{ color, fontWeight: 800, fontSize: '1.6rem', lineHeight: 1 }}>{stat.uniqueStudents}</div>
                      <div style={{ color: '#555', fontSize: '0.65rem', fontWeight: 500, letterSpacing: '0.06em', marginTop: 2 }}>STUDENTS</div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ background: '#111', borderRadius: 4, height: 6, overflow: 'hidden', marginBottom: '0.55rem' }}>
                    <div style={{ width: `${stat.utilizationPct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.4s' }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color, fontWeight: 700, fontSize: '0.82rem' }}>
                      {stat.utilizationPct}% of students
                    </span>
                    {stat.avgScore > 0 && (
                      <span style={{
                        background: '#22c55e18', color: '#22c55e',
                        border: '1px solid #22c55e33',
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

          {/* ── Comparison Bar ── */}
          <div style={S.sectionLabel}>Interview Type Comparison</div>
          <div style={{ ...S.card, padding: '1.25rem 1.5rem' }}>
            {[...TYPES]
              .map(({ key, label, icon: Icon, color }) => ({ key, label, Icon, color, stat: overview[key] as TypeStats }))
              .sort((a, b) => b.stat.utilizationPct - a.stat.utilizationPct)
              .map(({ key, label, Icon, color, stat }, idx) => (
                <div key={key} style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  padding: '0.6rem 0',
                  borderBottom: idx === 0 ? '1px solid #1e1e1e' : 'none',
                }}>
                  {/* Rank */}
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                    background: idx === 0 ? '#FFD70022' : '#1a1a1a',
                    border: `1px solid ${idx === 0 ? '#FFD700' : '#2a2a2a'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.68rem', fontWeight: 700,
                    color: idx === 0 ? '#FFD700' : '#444',
                  }}>
                    {idx + 1}
                  </div>

                  {/* Type */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 140 }}>
                    <Icon size={13} color={color} />
                    <span style={{ color: '#ccc', fontWeight: 600, fontSize: '0.85rem' }}>{label}</span>
                  </div>

                  {/* Bar */}
                  <div style={{ flex: 1, background: '#111', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                    <div style={{ width: `${stat.utilizationPct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.4s' }} />
                  </div>

                  {/* Stats */}
                  <div style={{ display: 'flex', gap: '0.75rem', minWidth: 240, justifyContent: 'flex-end' as const }}>
                    <span style={{ color, fontWeight: 700, fontSize: '0.78rem' }}>{stat.attempts} attempts</span>
                    <span style={{ color: '#555', fontSize: '0.78rem' }}>{stat.uniqueStudents} students</span>
                    <span style={{ color, fontWeight: 800, fontSize: '0.78rem', minWidth: 38, textAlign: 'right' as const }}>
                      {stat.utilizationPct}%
                    </span>
                    {stat.avgScore > 0 && (
                      <span style={{ color: '#22c55e', fontSize: '0.75rem', fontWeight: 600, minWidth: 44, textAlign: 'right' as const }}>
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
            <select style={{ ...S.select, width: 110 }} value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1) }}>
              {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n} / page</option>)}
            </select>
            <div style={{ flex: 1 }} />
            <button
              onClick={handleExportExcel}
              disabled={exporting}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'rgba(255,107,0,0.12)', border: '1px solid rgba(255,107,0,0.3)',
                color: '#ff6b00', borderRadius: 7, padding: '5px 12px',
                fontSize: '0.78rem', fontWeight: 600,
                cursor: exporting ? 'not-allowed' : 'pointer',
                opacity: exporting ? 0.5 : 1, flexShrink: 0,
              }}
            >
              <FaDownload size={11} />
              {exporting ? 'Exporting…' : 'Export Excel'}
            </button>
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
            <select style={S.select} value={stuMonth} onChange={(e) => setStuMonth(Number(e.target.value))}>
              {MONTH_NAMES.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
            <select style={S.select} value={stuYear} onChange={(e) => setStuYear(Number(e.target.value))}>
              {yearRange.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <button onClick={handleStuGo} style={{ background: '#ff6b00', border: 'none', color: '#fff', borderRadius: 7, padding: '5px 14px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
              Go
            </button>
            {stuMonthKey && (
              <>
                <span style={{ color: '#ff6b00', fontSize: '0.75rem', fontWeight: 600 }}>
                  Showing: {MONTH_NAMES[parseInt(stuMonthKey.split('-')[1]) - 1]} {stuMonthKey.split('-')[0]}
                </span>
                <button onClick={clearStuMonth} style={{ background: 'transparent', border: '1px solid #2a2a2a', color: '#666', borderRadius: 6, padding: '3px 10px', fontSize: '0.73rem', cursor: 'pointer' }}>
                  Clear
                </button>
              </>
            )}
          </div>

          {/* Table */}
          <div style={{ position: 'relative', overflowX: 'auto' }}>
            {stuLoading && (
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
                  <th style={{ ...S.th, minWidth: 130, textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <span style={{ color: '#a855f7' }}>Topic Based</span>
                      {stuMonthKey && <span style={{ color: '#444', fontSize: '0.6rem', fontWeight: 400, letterSpacing: '0.04em' }}>attempts this month</span>}
                    </div>
                  </th>
                  <th style={{ ...S.th, minWidth: 130, textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <span style={{ color: '#f59e0b' }}>Resume Based</span>
                      {stuMonthKey && <span style={{ color: '#444', fontSize: '0.6rem', fontWeight: 400, letterSpacing: '0.04em' }}>attempts this month</span>}
                    </div>
                  </th>
                  <th style={{ ...S.th, width: 70, textAlign: 'center' as const }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: '#444' }}>
                      {stuLoading ? '' : 'No students found'}
                    </td>
                  </tr>
                ) : students.map((s, i) => (
                  <tr key={s.userId}>
                    <td style={S.tdMut}>{(pagination.page - 1) * pagination.limit + i + 1}</td>
                    <td style={{ ...S.td, fontWeight: 600, color: '#fff' }}>
                      {s.name || s.email?.split('@')[0] || '—'}
                    </td>
                    <td style={S.tdMut}>{s.email}</td>
                    <td style={{ ...S.td, textAlign: 'center' }}>
                      <ScoreCell entry={s.topicBased}  color="#a855f7" />
                    </td>
                    <td style={{ ...S.td, textAlign: 'center' }}>
                      <ScoreCell entry={s.resumeBased} color="#f59e0b" />
                    </td>
                    <td style={{ ...S.td, textAlign: 'center' }}>
                      {(s.topicBased || s.resumeBased) && (
                        <button onClick={() => setViewStudent(s)} style={{
                          background: '#1a1a1a', border: '1px solid #2a2a2a',
                          color: '#888', borderRadius: 6, padding: '3px 12px',
                          fontSize: '0.73rem', cursor: 'pointer',
                        }}>View</button>
                      )}
                    </td>
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

      {/* ── Student Detail Modal (portal → renders on document.body, escapes Bootstrap) ── */}
      {viewStudent && createPortal((() => {
        const totalAttempts = (viewStudent.topicBased?.attempts || 0) + (viewStudent.resumeBased?.attempts || 0)
        const initials      = (viewStudent.name || '?').trim().split(/\s+/).map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
        const allBests      = ([viewStudent.topicBased?.bestScore, viewStudent.resumeBased?.bestScore] as (number | undefined)[]).filter((s): s is number => typeof s === 'number' && s > 0)
        const overallBest   = allBests.length ? Math.max(...allBests) : 0

        return (
          <div
            onClick={() => setViewStudent(null)}
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '75vw', maxHeight: '75vh',
                background: '#0f0f0f', border: '1px solid #252525',
                borderRadius: 20, overflowY: 'auto',
                boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
              }}
            >
              {/* ── Header (sticky, stays at top while body scrolls) ── */}
              <div style={{
                background: '#141414', borderBottom: '1px solid #1e1e1e',
                padding: '1.1rem 2rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
                position: 'sticky', top: 0, zIndex: 10,
                boxSizing: 'border-box' as const,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#a855f7', fontWeight: 800, fontSize: '1rem',
                  }}>
                    {initials}
                  </div>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem' }}>
                      {viewStudent.name || viewStudent.email?.split('@')[0]}
                    </div>
                    <div style={{ color: '#555', fontSize: '0.74rem', marginTop: 2 }}>{viewStudent.email}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                  {[
                    { label: 'Total Attempts', value: totalAttempts,                           color: '#888'    },
                    { label: 'Topic',           value: viewStudent.topicBased?.attempts  || 0, color: '#a855f7' },
                    { label: 'Resume',          value: viewStudent.resumeBased?.attempts || 0, color: '#f59e0b' },
                    { label: 'Overall Best',    value: overallBest,                            color: '#22c55e' },
                  ].map((stat) => (
                    <div key={stat.label} style={{
                      background: '#1a1a1a', border: '1px solid #252525',
                      borderRadius: 10, padding: '0.4rem 0.85rem', textAlign: 'center' as const, minWidth: 68,
                    }}>
                      <div style={{ color: stat.color, fontWeight: 800, fontSize: '1rem', lineHeight: 1 }}>{stat.value}</div>
                      <div style={{ color: '#444', fontSize: '0.57rem', fontWeight: 600, letterSpacing: '0.06em', marginTop: 3, textTransform: 'uppercase' as const, whiteSpace: 'nowrap' as const }}>
                        {stat.label}
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setViewStudent(null)} style={{
                    background: '#1a1a1a', border: '1px solid #252525', color: '#555',
                    borderRadius: 10, width: 36, height: 36, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.85rem', marginLeft: '0.35rem', flexShrink: 0,
                  }}>✕</button>
                </div>
              </div>

              {/* ── Body: card itself scrolls, no height constraint here ── */}
              <div style={{
                padding: '1.5rem 2rem',
                display: 'flex', flexDirection: 'column', gap: '1.25rem',
              }}>
                {TYPES.map(({ key, label, icon: Icon, color }) => {
                  const entry    = viewStudent[key as keyof StudentRow] as InterviewEntry
                  const maxScore = entry ? Math.max(...entry.attemptsList.map((a) => a.score), 1) : 1

                  return (
                    <div key={key} style={{
                      background: '#141414', border: '1px solid #1e1e1e',
                      borderRadius: 14, overflow: 'hidden', borderTop: `3px solid ${color}`,
                    }}>
                      {/* Section header */}
                      <div style={{
                        padding: '0.9rem 1.5rem', display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between', borderBottom: entry ? '1px solid #1e1e1e' : 'none',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div style={{ background: `${color}18`, borderRadius: 7, padding: '6px', display: 'inline-flex' }}>
                            <Icon size={13} color={color} />
                          </div>
                          <span style={{ color: '#ddd', fontWeight: 700, fontSize: '0.9rem' }}>{label}</span>
                        </div>
                        {entry ? (
                          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                            {[
                              { label: 'Attempts',   value: entry.attempts,  color: '#888' },
                              { label: 'Best Score', value: entry.bestScore, color         },
                              { label: 'Avg Score',  value: entry.avgScore,  color: '#888' },
                            ].map((s) => (
                              <div key={s.label} style={{ textAlign: 'center' as const }}>
                                <div style={{ color: s.color, fontWeight: 800, fontSize: '1rem', lineHeight: 1 }}>{s.value}</div>
                                <div style={{ color: '#444', fontSize: '0.58rem', fontWeight: 600, letterSpacing: '0.05em', marginTop: 3, textTransform: 'uppercase' as const }}>
                                  {s.label}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: '#333', fontSize: '0.78rem' }}>No attempts this period</span>
                        )}
                      </div>

                      {/* Attempts table */}
                      {entry && (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr>
                              <th style={{ ...S.th, width: 44 }}>#</th>
                              {key === 'topicBased' && <th style={S.th}>Topic Name</th>}
                              <th style={S.th}>Date & Time</th>
                              <th style={{ ...S.th, width: '40%' }}>Score</th>
                            </tr>
                          </thead>
                          <tbody>
                            {entry.attemptsList.map((a, i) => (
                              <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : '#0d0d0d' }}>
                                <td style={S.tdMut}>{i + 1}</td>
                                {key === 'topicBased' && (
                                  <td style={{ ...S.td, color: '#a855f7', fontWeight: 600, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {a.topic || '—'}
                                  </td>
                                )}
                                <td style={S.td}>
                                  {new Date(a.date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td style={{ ...S.td }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                    <div style={{ flex: 1, background: '#1a1a1a', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                                      <div style={{
                                        width: `${Math.round((a.score / maxScore) * 100)}%`,
                                        height: '100%', background: color, borderRadius: 4, transition: 'width 0.3s',
                                      }} />
                                    </div>
                                    <span style={{ color: a.score > 0 ? color : '#444', fontWeight: 700, fontSize: '0.82rem', minWidth: 32, textAlign: 'right' as const }}>
                                      {a.score}
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })(), document.body)}
    </div>
  )
}

export default AIInterviewFull
