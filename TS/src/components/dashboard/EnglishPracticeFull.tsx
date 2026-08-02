import { useCallback, useEffect, useRef, useState } from 'react'
import { Spinner } from 'react-bootstrap'
import {
  FaMicrophone, FaPencilAlt, FaBook, FaHeadphones, FaBolt, FaLanguage,
  FaSearch, FaArrowUp, FaArrowDown, FaMinus, FaDownload, FaUserGraduate, FaCheckCircle,
} from 'react-icons/fa'
import * as XLSX from 'xlsx'
import { useAuthContext } from '@/context/useAuthContext'

/* ─── Types ─────────────────────────────────────────────── */
type SkillStat = { utilized: number; capacity: number; utilizationPct: number; avgScore: number; studentsUsed?: number }
type PrevMonthComparison = { activeStudents: number; totalAttempts: number; overallUtilizationPct: number; label: string }
type OverviewData = {
  totalStudents:    number
  approvedStudents: number
  activeStudents:   number
  newStudentsThisMonth: number
  monthlyCapacity:  number
  totalAttempts:    number
  overallUtilizationPct: number
  monthKey:         string | null
  skills: { speaking: SkillStat; writing: SkillStat; reading: SkillStat; listening: SkillStat; jam: SkillStat }
  prevMonthComparison: PrevMonthComparison
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

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/* ─── Styles ─────────────────────────────────────────────── */
const S = {
  statGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.6rem', marginBottom: '1rem' } as React.CSSProperties,
  statCard: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '10px', padding: '0.65rem 0.8rem' } as React.CSSProperties,
  iconCircle: (accent: string): React.CSSProperties => ({
    background: accent, borderRadius: '50%', width: 26, height: 26,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  }),
  numSm: { fontSize: '1.3rem', fontWeight: 800, color: '#fff', lineHeight: 1, marginBottom: 3 } as React.CSSProperties,
  labelSm: { color: '#999', fontSize: '0.72rem' } as React.CSSProperties,
  sub: (accent: string): React.CSSProperties => ({ color: accent, fontSize: '0.66rem', fontWeight: 600, display: 'block' }),
  card:  { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 14 } as React.CSSProperties,
  th:    { background: '#111', color: '#555', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, padding: '0.7rem 0.9rem', textAlign: 'left' as const, borderBottom: '1px solid #2a2a2a', whiteSpace: 'nowrap' as const },
  td:    { padding: '0.65rem 0.9rem', borderBottom: '1px solid #1e1e1e', color: '#e0e0e0', fontSize: '0.8rem', whiteSpace: 'nowrap' as const } as React.CSSProperties,
  tdMut: { padding: '0.65rem 0.9rem', borderBottom: '1px solid #1e1e1e', color: '#aaa', fontSize: '0.76rem', whiteSpace: 'nowrap' as const } as React.CSSProperties,
  select: {
    background: '#111', border: '1px solid #2a2a2a', color: '#fff', borderRadius: 8, padding: '6px 26px 6px 12px', fontSize: '0.82rem', cursor: 'pointer',
    appearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23888' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
  } as React.CSSProperties,
  searchInput: { background: '#111', border: '1px solid #2a2a2a', color: '#fff', borderRadius: 8, padding: '6px 12px 6px 28px', fontSize: '0.82rem', width: 200 } as React.CSSProperties,
  footer: { background: '#111', borderTop: '1px solid #2a2a2a', color: '#555', fontSize: '0.78rem', borderRadius: '0 0 14px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: '0.5rem', padding: '0.75rem 1.25rem' } as React.CSSProperties,
  sectionLabel: { color: '#aaa', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '0.75rem' } as React.CSSProperties,
  headerBtn: (accent: string): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 6,
    background: `${accent}18`, border: `1px solid ${accent}44`,
    color: accent, borderRadius: 8, padding: '7px 14px',
    fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', flexShrink: 0,
  }),
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

const overallAvg = (s: StudentRow) => {
  const vals = SKILLS.map(({ key }) => s[key]?.bestScore).filter((v): v is number => typeof v === 'number' && v > 0)
  return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'center' }}>
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
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear]   = useState(now.getFullYear())
  const monthKey = `${year}-${String(month).padStart(2, '0')}`
  const yearRange = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i)

  /* ── Custom date range (alternative to Month/Year) ───────── */
  const toDateStr = (d: Date) => d.toISOString().slice(0, 10)
  const [rangeMode, setRangeMode]     = useState<'monthly' | 'custom'>('monthly')
  const [customStart, setCustomStart] = useState(toDateStr(new Date(now.getFullYear(), now.getMonth(), 1)))
  const [customEnd, setCustomEnd]     = useState(toDateStr(now))
  const [appliedStart, setAppliedStart] = useState('')
  const [appliedEnd, setAppliedEnd]     = useState('')
  const isCustom = rangeMode === 'custom' && Boolean(appliedStart && appliedEnd)

  const applyCustomRange = () => {
    setAppliedStart(customStart)
    setAppliedEnd(customEnd)
  }

  const rangeParams = (): Record<string, string> =>
    isCustom ? { startDate: appliedStart, endDate: appliedEnd } : { monthKey }

  const [students, setStudents]   = useState<StudentRow[]>([])
  const [pagination, setPag]      = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 1 })
  const [studLoading, setStudLoad] = useState(false)

  const [tab, setTab]           = useState<'students' | 'skills'>('students')
  const [search, setSearch]     = useState('')
  const [skill, setSkill]       = useState<SkillKey | ''>('')
  const [page, setPage]         = useState(1)
  const [limit, setLimit]       = useState(20)

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* ── Fetch overview (driven by the header Month/Year or Custom Range) ── */
  useEffect(() => {
    if (!user?.token) return
    if (rangeMode === 'custom' && !isCustom) return // waiting for Apply
    setOvLoading(true)
    const params = new URLSearchParams(rangeParams())
    fetch(`${baseURL}${apiBase}/english-practice-overview?${params}`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((r) => r.json())
      .then((d) => { if (d.success) setOverview(d) })
      .catch(console.error)
      .finally(() => setOvLoading(false))
  }, [user?.token, baseURL, apiBase, monthKey, isCustom, appliedStart, appliedEnd, rangeMode])

  /* ── Fetch students (same Month/Year or Custom Range as the header) ── */
  const fetchStudents = useCallback(async (opts: { page?: number; limit?: number; search?: string; skill?: string } = {}) => {
    if (!user?.token) return
    if (rangeMode === 'custom' && !isCustom) return
    setStudLoad(true)
    const params = new URLSearchParams({
      page:  String(opts.page  ?? 1),
      limit: String(opts.limit ?? 20),
      search: opts.search ?? '',
      skill:  opts.skill  ?? '',
      ...rangeParams(),
    })
    try {
      const res  = await fetch(`${baseURL}${apiBase}/english-practice-students?${params}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      })
      const data = await res.json()
      if (data.success) { setStudents(data.students); setPag(data.pagination) }
    } catch (err) { console.error(err) }
    finally { setStudLoad(false) }
  }, [user?.token, baseURL, apiBase, monthKey, isCustom, appliedStart, appliedEnd, rangeMode])

  useEffect(() => {
    if (tab === 'students') fetchStudents({ page, limit, search, skill })
  }, [tab, page, limit, monthKey, isCustom, appliedStart, appliedEnd, rangeMode]) // eslint-disable-line

  const onSearch = (val: string) => {
    setSearch(val)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setPage(1)
      fetchStudents({ page: 1, limit, search: val, skill })
    }, 400)
  }

  const onSkillFilter = (val: string) => {
    setSkill(val as SkillKey | '')
    setPage(1)
    fetchStudents({ page: 1, limit, search, skill: val })
  }

  const [exporting, setExporting] = useState(false)

  const handleExportExcel = async () => {
    if (!user?.token) return
    setExporting(true)
    try {
      const params = new URLSearchParams({ page: '1', limit: '9999', search, skill, ...rangeParams() })
      const res = await fetch(`${baseURL}${apiBase}/english-practice-students?${params}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      })
      const data = await res.json()
      if (!data.success) return
      const skillLabels: Record<string, string> = { speaking: 'Speaking', writing: 'Writing', reading: 'Reading', listening: 'Listening', jam: 'Just a Minute' }
      const rows = data.students.map((s: StudentRow, i: number) => {
        const row: Record<string, string | number> = { '#': i + 1, Name: s.name || '', Email: s.email || '' }
        SKILLS.forEach(({ key }) => {
          row[`${skillLabels[key]} Best Score`]  = s[key]?.bestScore  ?? '—'
          row[`${skillLabels[key]} Attempts`]     = s[key]?.attemptCount ?? 0
          row[`${skillLabels[key]} Trend`]        = s[key]?.trend ?? '—'
        })
        row['Overall Avg'] = overallAvg(s) ?? '—'
        return row
      })
      const ws = XLSX.utils.json_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'English Practice')
      XLSX.writeFile(wb, `English_Practice_${isCustom ? `${appliedStart}_to_${appliedEnd}` : monthKey}.xlsx`)
    } catch (err) { console.error(err) }
    finally { setExporting(false) }
  }

  if (overviewLoading || !overview) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <Spinner animation="border" style={{ color: '#ff6b00' }} />
      </div>
    )
  }

  const cmp = overview.prevMonthComparison

  return (
    <div>
      {/* ── Header ─────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FaLanguage size={18} color="#ff6b00" />
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem' }}>English Practice</span>
          </div>
          <div style={{ color: '#666', fontSize: '0.78rem', marginTop: 2 }}>Track students' English skills practice and performance.</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' as const, alignItems: 'center' }}>
          <select style={{ ...S.select, width: 130 }} value={rangeMode} onChange={(e) => setRangeMode(e.target.value as 'monthly' | 'custom')}>
            <option value="monthly">Monthly</option>
            <option value="custom">Custom Range</option>
          </select>

          {rangeMode === 'monthly' ? (
            <>
              <select style={{ ...S.select, width: 130 }} value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
              <select style={{ ...S.select, width: 90 }} value={year} onChange={(e) => setYear(Number(e.target.value))}>
                {yearRange.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </>
          ) : (
            <>
              <input type="date" style={{ ...S.select, width: 140 }} value={customStart} max={customEnd} onChange={(e) => setCustomStart(e.target.value)} />
              <input type="date" style={{ ...S.select, width: 140 }} value={customEnd} min={customStart} max={toDateStr(now)} onChange={(e) => setCustomEnd(e.target.value)} />
              <button style={S.headerBtn('#ff6b00')} onClick={applyCustomRange}>Apply</button>
            </>
          )}

          <button style={S.headerBtn('#22c55e')} onClick={handleExportExcel} disabled={exporting}>
            <FaDownload size={11} /> {exporting ? 'Exporting…' : 'Export Excel'}
          </button>
        </div>
      </div>

      {/* ── Stat Cards ─────────────────────────────────── */}
      <div style={S.statGrid}>
        <div style={S.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={S.iconCircle('#ff6b00')}><FaUserGraduate size={12} color="#fff" /></div>
            <span style={S.labelSm}>Total Students</span>
          </div>
          <div style={S.numSm}>{overview.totalStudents}</div>
          <span style={S.sub('#22c55e')}>↑ {overview.newStudentsThisMonth} this month</span>
        </div>

        <div style={S.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={S.iconCircle('#3b82f6')}><FaCheckCircle size={12} color="#fff" /></div>
            <span style={S.labelSm}>Active Students</span>
          </div>
          <div style={S.numSm}>{overview.activeStudents}</div>
          <span style={S.sub(cmp.activeStudents >= 0 ? '#22c55e' : '#ef4444')}>
            {cmp.activeStudents >= 0 ? '↑' : '↓'} {Math.abs(cmp.activeStudents)} vs {cmp.label}
          </span>
        </div>

        <div style={S.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={S.iconCircle('#a855f7')}><FaHeadphones size={12} color="#fff" /></div>
            <span style={S.labelSm}>Total Attempts</span>
          </div>
          <div style={S.numSm}>{overview.totalAttempts.toLocaleString()}</div>
          <span style={S.sub(cmp.totalAttempts >= 0 ? '#22c55e' : '#ef4444')}>
            {cmp.totalAttempts >= 0 ? '↑' : '↓'} {Math.abs(cmp.totalAttempts)} vs {cmp.label}
          </span>
        </div>

        <div style={S.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={S.iconCircle('#f59e0b')}><FaBook size={12} color="#fff" /></div>
            <span style={S.labelSm}>Monthly Capacity</span>
          </div>
          <div style={S.numSm}>{overview.monthlyCapacity.toLocaleString()}</div>
          <span style={S.sub('#999')}>{overview.approvedStudents} students × 30</span>
        </div>

        <div style={S.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={S.iconCircle('#22c55e')}><FaCheckCircle size={12} color="#fff" /></div>
            <span style={S.labelSm}>Overall Utilization</span>
          </div>
          <div style={S.numSm}>{overview.overallUtilizationPct}%</div>
          <span style={S.sub(cmp.overallUtilizationPct >= 0 ? '#22c55e' : '#ef4444')}>
            {cmp.overallUtilizationPct >= 0 ? '↑' : '↓'} {Math.abs(cmp.overallUtilizationPct)}% vs {cmp.label}
          </span>
        </div>
      </div>

      {/* ── Skill Cards ── */}
      <div style={S.sectionLabel}>English Skills – Monthly Attempt Utilization · {MONTH_SHORT[month - 1]} {year}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {SKILLS.map(({ key, label, icon: Icon, color }) => {
          const stat = overview.skills[key]
          return (
            <div key={key} style={{
              background: '#1a1a1a', border: '1px solid #252525',
              borderRadius: 14, padding: '1rem', borderTop: `3px solid ${color}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.75rem' }}>
                <div style={{ background: `${color}18`, borderRadius: 8, padding: '6px', display: 'inline-flex' }}>
                  <Icon size={13} color={color} />
                </div>
                <span style={{ color: '#ddd', fontWeight: 700, fontSize: '0.82rem' }}>{label}</span>
              </div>
              <div style={{ color, fontWeight: 800, fontSize: '1.35rem', lineHeight: 1 }}>{stat.utilized}</div>
              <div style={{ color: '#555', fontSize: '0.62rem', fontWeight: 500, letterSpacing: '0.05em', marginTop: 2, marginBottom: '0.5rem' }}>ATTEMPTS USED</div>
              <div style={{ color: '#444', fontSize: '0.68rem', marginBottom: '0.55rem' }}>
                of <span style={{ color: '#666' }}>{stat.capacity.toLocaleString()}</span> capacity
              </div>
              <div style={{ background: '#111', borderRadius: 4, height: 5, overflow: 'hidden', marginBottom: '0.5rem' }}>
                <div style={{ width: `${stat.utilizationPct}%`, height: '100%', background: color, borderRadius: 4 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color, fontWeight: 700, fontSize: '0.76rem' }}>{stat.utilizationPct}% utilized</span>
                {stat.avgScore > 0 && (
                  <span style={{
                    background: `${scoreColor(stat.avgScore)}18`, color: scoreColor(stat.avgScore),
                    border: `1px solid ${scoreColor(stat.avgScore)}33`,
                    borderRadius: 5, padding: '1px 7px', fontSize: '0.66rem', fontWeight: 700,
                  }}>
                    avg {stat.avgScore}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Tabs ───────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #1e1e1e', marginBottom: '1rem' }}>
        {([
          { key: 'students', label: 'Students Performance' },
          { key: 'skills',   label: 'Skill Wise Summary' },
        ] as const).map(({ key: t, label }) => (
          <button key={t} onClick={() => setTab(t)} style={{ position: 'relative', background: 'none', border: 'none', padding: '0.6rem 1.1rem 0.8rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: tab === t ? 700 : 500, color: tab === t ? '#fff' : '#555' }}>
            {label}
            {tab === t && <div style={{ position: 'absolute', bottom: 0, left: '10%', width: '80%', height: 2.5, background: '#ff6b00', borderRadius: 2 }} />}
          </button>
        ))}
      </div>

      {/* ── Students Performance Tab ─────────────────────── */}
      {tab === 'students' && (
        <div style={S.card}>
          <div style={{ padding: '0.9rem 1.25rem', borderBottom: '1px solid #1e1e1e', display: 'flex', flexWrap: 'wrap' as const, gap: '0.6rem', alignItems: 'center' }}>
            <select style={{ ...S.select, minWidth: 150 }} value={skill} onChange={(e) => onSkillFilter(e.target.value)}>
              <option value="">All Skills</option>
              {SKILLS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
            <select style={{ ...S.select, width: 100 }} value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1) }}>
              {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n} / page</option>)}
            </select>
            <span style={{ color: '#444', fontSize: '0.73rem' }}>Showing {MONTH_SHORT[month - 1]} {year} — change via the Month/Year selector above</span>
            <div style={{ flex: 1 }} />
            <div style={{ position: 'relative' }}>
              <FaSearch size={11} color="#444" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)' }} />
              <input style={S.searchInput} placeholder="Search by name or email" value={search} onChange={(e) => onSearch(e.target.value)} />
            </div>
          </div>

          <div style={{ position: 'relative', overflowX: 'auto' }}>
            {studLoading && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                <Spinner animation="border" style={{ color: '#ff6b00', width: 24, height: 24 }} />
              </div>
            )}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...S.th, minWidth: 28 }}>#</th>
                  <th style={{ ...S.th, minWidth: 140 }}>Student</th>
                  <th style={{ ...S.th, minWidth: 150 }}>Email</th>
                  {SKILLS.map(({ key, label, color }) => (
                    <th key={key} style={{ ...S.th, minWidth: 90, textAlign: 'center' }}>
                      <span style={{ color }}>{label}</span>
                    </th>
                  ))}
                  <th style={{ ...S.th, minWidth: 90, textAlign: 'center' }}>Overall Avg</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '2.5rem', color: '#444' }}>
                      {studLoading ? '' : 'No students found'}
                    </td>
                  </tr>
                ) : students.map((s, i) => {
                  const avg = overallAvg(s)
                  return (
                    <tr key={s.userId}>
                      <td style={S.tdMut}>{(pagination.page - 1) * pagination.limit + i + 1}</td>
                      <td style={{ ...S.td, fontWeight: 600, color: '#fff' }}>
                        {s.name || s.email?.split('@')[0] || '—'}
                      </td>
                      <td style={S.tdMut}>{s.email}</td>
                      {SKILLS.map(({ key, color }) => (
                        <td key={key} style={{ ...S.td, textAlign: 'center' }}>
                          <ScoreCell entry={s[key]} color={color} />
                        </td>
                      ))}
                      <td style={{ ...S.td, textAlign: 'center' }}>
                        {avg !== null ? (
                          <span style={{
                            background: `${scoreColor(avg)}18`, color: scoreColor(avg),
                            border: `1px solid ${scoreColor(avg)}33`,
                            borderRadius: 6, padding: '2px 9px', fontSize: '0.75rem', fontWeight: 700,
                          }}>
                            {avg}%
                          </span>
                        ) : <span style={{ color: '#444' }}>—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

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

      {/* ── Skill Wise Summary Tab ───────────────────────── */}
      {tab === 'skills' && (
        <div style={S.card}>
          <div style={{ padding: '0.9rem 1.25rem', borderBottom: '1px solid #1e1e1e' }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.88rem' }}>Skill Wise Summary — {MONTH_SHORT[month - 1]} {year}</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...S.th, minWidth: 40 }}>#</th>
                  <th style={{ ...S.th, minWidth: 160 }}>Skill</th>
                  <th style={{ ...S.th, minWidth: 110, textAlign: 'center' }}>Attempts Used</th>
                  <th style={{ ...S.th, minWidth: 110, textAlign: 'center' }}>Capacity</th>
                  <th style={{ ...S.th, minWidth: 120 }}>Utilization</th>
                  <th style={{ ...S.th, minWidth: 100, textAlign: 'center' }}>Avg Score</th>
                  <th style={{ ...S.th, minWidth: 130, textAlign: 'center' }}>Students Practiced</th>
                </tr>
              </thead>
              <tbody>
                {[...SKILLS]
                  .map(({ key, label, icon: Icon, color }) => ({ key, label, Icon, color, stat: overview.skills[key] }))
                  .sort((a, b) => b.stat.utilizationPct - a.stat.utilizationPct)
                  .map(({ key, label, Icon, color, stat }, i) => (
                    <tr key={key}>
                      <td style={S.tdMut}>{i + 1}</td>
                      <td style={S.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ background: `${color}18`, borderRadius: 6, padding: 5, display: 'inline-flex' }}>
                            <Icon size={11} color={color} />
                          </div>
                          <span style={{ color: '#fff', fontWeight: 600 }}>{label}</span>
                        </div>
                      </td>
                      <td style={{ ...S.td, textAlign: 'center', color, fontWeight: 700 }}>{stat.utilized}</td>
                      <td style={{ ...S.td, textAlign: 'center' }}>{stat.capacity.toLocaleString()}</td>
                      <td style={S.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 100 }}>
                          <div style={{ flex: 1, background: '#2a2a2a', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                            <div style={{ width: `${stat.utilizationPct}%`, background: color, height: '100%' }} />
                          </div>
                          <span style={{ color, fontSize: '0.74rem', fontWeight: 700, minWidth: 32 }}>{stat.utilizationPct}%</span>
                        </div>
                      </td>
                      <td style={{ ...S.td, textAlign: 'center' }}>
                        {stat.avgScore > 0 ? (
                          <span style={{ color: scoreColor(stat.avgScore), fontWeight: 700 }}>{stat.avgScore}</span>
                        ) : <span style={{ color: '#444' }}>—</span>}
                      </td>
                      <td style={{ ...S.td, textAlign: 'center' }}>{stat.studentsUsed ?? 0}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default EnglishPracticeFull
