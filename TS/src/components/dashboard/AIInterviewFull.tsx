import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Spinner } from 'react-bootstrap'
import {
  FaCalendarAlt, FaCheckCircle, FaDownload, FaFileAlt, FaMicrophone, FaRobot, FaSearch, FaUserGraduate,
} from 'react-icons/fa'
import ReactApexChart from 'react-apexcharts'
import * as XLSX from 'xlsx'
import { useAuthContext } from '@/context/useAuthContext'

/* ─── Types ─────────────────────────────────────────────── */
type TypeStats = { attempts: number; uniqueStudents: number; avgScore: number; utilizationPct: number }
type TrendPoint = { month: number; year: number; topicAttempts: number; resumeAttempts: number }
type BreakdownRow = {
  type: 'Topic Based' | 'Resume Based'
  name: string
  attempts: number
  students: number
  participationPct: number
  avgScore: number
  scoreIsPercent: boolean
  lastActivity: string | null
}
type PrevMonthComparison = { topicAttempts: number; resumeAttempts: number; totalAttempts: number; participationPct: number; label: string }
type RangePrevComparison = { topicAttempts: number; resumeAttempts: number; totalAttempts: number; participationPct: number }
type RangeStats = {
  startDate: string
  endDate: string
  totalStudents: number
  newStudentsThisMonth: number
  topicBased: TypeStats
  resumeBased: TypeStats
  totalAttempts: number
  participationPct: number
  prevComparison: RangePrevComparison
}

type OverviewData = {
  totalStudents: number
  newStudentsThisMonth: number
  month: number
  year: number
  topicBased: TypeStats
  resumeBased: TypeStats
  trend: TrendPoint[]
  breakdown: BreakdownRow[]
  prevMonthComparison: PrevMonthComparison
  rangeStats: RangeStats
}

type DateRangeMode = 'today' | '7d' | '30d' | 'custom'

type AttemptEntry = { date: string; score: number; topic?: string }
type InterviewEntry = {
  attempts: number
  attemptsList: AttemptEntry[]
  avgScore: number
  bestScore: number
  lastActivity: string | null
  violations?: number // topic-based only — resume-based attempts carry no proctoring data
} | null
type StudentRow = {
  userId: string
  name: string
  email: string
  topicBased: InterviewEntry
  resumeBased: InterviewEntry
}
type LatestAttempt = { type: 'Topic Based' | 'Resume Based'; name: string; studentName: string; date: string; score: number }

/* ─── Constants ─────────────────────────────────────────── */
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/* ─── Helpers ────────────────────────────────────────────── */
const toDateStr = (d = new Date()) => d.toISOString().slice(0, 10)
const defaultEnd = () => toDateStr()
const defaultStart = () => {
  const d = new Date()
  d.setDate(d.getDate() - 6)
  return toDateStr(d)
}
const addDaysStr = (dateStr: string, days: number) => {
  const d = new Date(dateStr + 'T00:00:00.000Z')
  d.setUTCDate(d.getUTCDate() + days)
  return toDateStr(d)
}
const fmtDateTime = (d: string | null) =>
  d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

// Score threshold — a new, explicit UI convention (not an existing business
// rule): ≥70 green, 40-69 orange, <40 red. Only applied to resume-based rows,
// whose scores are a verified 0-100 scale; topic-based scores show no dot.
const scoreDotColor = (score: number) => (score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444')

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
  card: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '14px' } as React.CSSProperties,
  cardHeader: {
    padding: '0.9rem 1.1rem', borderBottom: '1px solid #2a2a2a',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  } as React.CSSProperties,
  cardTitle: { color: '#fff', fontWeight: 700, fontSize: '0.85rem' } as React.CSSProperties,
  sectionLabel: {
    color: '#aaa', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em',
    textTransform: 'uppercase' as const, marginBottom: '0.75rem',
  },
  select: {
    background: '#111', border: '1px solid #2a2a2a', color: '#fff', borderRadius: '8px',
    padding: '6px 26px 6px 12px', fontSize: '0.82rem', cursor: 'pointer',
    appearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23888' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
  } as React.CSSProperties,
  searchWrap: { position: 'relative' } as React.CSSProperties,
  input: (extra?: React.CSSProperties): React.CSSProperties => ({
    background: '#111', border: '1px solid #2a2a2a', color: '#fff', borderRadius: '8px',
    padding: '6px 12px 6px 28px', fontSize: '0.82rem', width: 220, ...extra,
  }),
  headerBtn: (accent: string): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 6,
    background: `${accent}18`, border: `1px solid ${accent}44`,
    color: accent, borderRadius: 8, padding: '7px 14px',
    fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', flexShrink: 0,
  }),
  th: {
    background: '#111', color: '#666', fontSize: '0.62rem', fontWeight: 600,
    letterSpacing: '0.06em', textTransform: 'uppercase' as const, padding: '0.6rem 0.5rem',
    textAlign: 'left' as const, borderBottom: '1px solid #2a2a2a', whiteSpace: 'nowrap' as const,
  },
  td: { padding: '0.55rem 0.5rem', borderBottom: '1px solid #1e1e1e', color: '#e0e0e0', fontSize: '0.78rem', whiteSpace: 'nowrap' as const } as React.CSSProperties,
  tdMuted: { padding: '0.55rem 0.5rem', borderBottom: '1px solid #1e1e1e', color: '#555', fontSize: '0.74rem', whiteSpace: 'nowrap' as const } as React.CSSProperties,
  footer: {
    background: '#111', borderTop: '1px solid #2a2a2a', color: '#555', fontSize: '0.78rem',
    borderRadius: '0 0 14px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    flexWrap: 'wrap' as const, gap: '0.5rem', padding: '0.75rem 1.25rem',
  } as React.CSSProperties,
}

/* ─── Score ring — small circular progress indicator ───────
   pct is 0-100; label is the text shown in the center (kept
   separate from pct since topic scores display as "3.47" not
   "35%"). A plain bordered circle reads as a static badge, not
   progress — this actually fills proportionally. ───────────── */
const ScoreRing = ({ pct, label, color, size = 26 }: { pct: number; label: string; color: string; size?: number }) => {
  const strokeWidth = 2.5
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, pct))
  const offset = circumference * (1 - clamped / 100)
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#2a2a2a" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color, fontSize: size <= 26 ? '0.58rem' : '0.62rem', fontWeight: 700,
      }}>
        {label}
      </div>
    </div>
  )
}

/* ─── Pagination button ──────────────────────────────────── */
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

/* ─── Main Component ─────────────────────────────────────── */
const AIInterviewFull = ({ apiBase = '/api/institute' }: { apiBase?: string }) => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const now = new Date()

  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  // Date Range — independent of Month/Year, drives the top stat cards +
  // Interview Details (Latest) panel; Monthly Utilization/Trend and the
  // Students Attended table stay scoped to Month/Year.
  const [dateRangeMode, setDateRangeMode] = useState<DateRangeMode>('7d')
  const [startDate, setStartDate] = useState(defaultStart)
  const [endDate, setEndDate] = useState(defaultEnd)
  const [appliedStart, setAppliedStart] = useState(defaultStart)
  const [appliedEnd, setAppliedEnd] = useState(defaultEnd)

  const [exporting, setExporting] = useState(false)

  // Students Attended — per-student rows, tabbed by interview type (month/year scoped)
  const [allStudents, setAllStudents] = useState<StudentRow[]>([])
  const [studentsLoading, setStudentsLoading] = useState(true)
  const [attendedTab, setAttendedTab] = useState<'topicBased' | 'resumeBased'>('topicBased')
  const [attendedSearch, setAttendedSearch] = useState('')
  const [attendedPage, setAttendedPage] = useState(1)
  const [viewStudent, setViewStudent] = useState<StudentRow | null>(null)
  const [modalStartDate, setModalStartDate] = useState('')
  const [modalEndDate, setModalEndDate] = useState('')
  // Applied separately from the raw inputs above — the table only refilters
  // once "Apply" is clicked, not on every date pick.
  const [modalAppliedStart, setModalAppliedStart] = useState('')
  const [modalAppliedEnd, setModalAppliedEnd] = useState('')
  // viewStudent's attemptsList only ever contains data from the outer
  // Month/Year picker (e.g. August) — a modal range reaching into another
  // month (e.g. July) would silently show nothing without this: fetched
  // fresh on Apply, scoped to the picked range, independent of Month/Year.
  const [modalRangeEntry, setModalRangeEntry] = useState<{ topicBased: InterviewEntry; resumeBased: InterviewEntry } | null>(null)
  const [modalRangeLoading, setModalRangeLoading] = useState(false)
  const [modalRangeError, setModalRangeError] = useState('')
  const attendedLimit = 5

  // Interview Details (Latest) — date-range scoped, independent of month/year
  const [rangeStudents, setRangeStudents] = useState<StudentRow[]>([])

  const yearRange = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i)

  useEffect(() => {
    if (!user?.token) return
    setLoading(true)
    const params = new URLSearchParams({ month: String(month), year: String(year), rangeStartDate: appliedStart, rangeEndDate: appliedEnd })
    fetch(`${baseURL}${apiBase}/ai-interview-overview?${params}`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((r) => r.json())
      .then((d) => { if (d.success) setOverview(d) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user?.token, baseURL, apiBase, month, year, appliedStart, appliedEnd])

  // Fetch every scoped student once per month/year (small dataset — filtered
  // to actual attendees client-side, since the endpoint pages over ALL
  // students, not just those with attempts)
  useEffect(() => {
    if (!user?.token) return
    setStudentsLoading(true)
    fetch(`${baseURL}${apiBase}/ai-interview-students?month=${month}&year=${year}&page=1&limit=500`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((r) => r.json())
      .then((d) => { if (d.success) setAllStudents(d.students) })
      .catch(console.error)
      .finally(() => setStudentsLoading(false))
  }, [user?.token, baseURL, apiBase, month, year])

  // Fetch the same student data scoped to the Date Range (separate from the
  // month-scoped fetch above), purely to source the Interview Details
  // (Latest) panel's date filtering independently of the Month/Year picker.
  useEffect(() => {
    if (!user?.token) return
    const params = new URLSearchParams({ startDate: appliedStart, endDate: appliedEnd, page: '1', limit: '500' })
    fetch(`${baseURL}${apiBase}/ai-interview-students?${params}`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((r) => r.json())
      .then((d) => { if (d.success) setRangeStudents(d.students) })
      .catch(console.error)
  }, [user?.token, baseURL, apiBase, appliedStart, appliedEnd])

  const onDateRangeModeChange = (mode: DateRangeMode) => {
    setDateRangeMode(mode)
    if (mode === 'today') {
      const d = defaultEnd()
      setStartDate(d); setEndDate(d); setAppliedStart(d); setAppliedEnd(d)
    } else if (mode === '7d') {
      const s = defaultStart(); const e = defaultEnd()
      setStartDate(s); setEndDate(e); setAppliedStart(s); setAppliedEnd(e)
    } else if (mode === '30d') {
      const e = defaultEnd()
      const d = new Date(); d.setDate(d.getDate() - 29)
      const s = toDateStr(d)
      setStartDate(s); setEndDate(e); setAppliedStart(s); setAppliedEnd(e)
    }
    // 'custom' — leave startDate/endDate as-is until the user picks dates and hits Apply
  }

  const applyCustomRange = () => {
    setAppliedStart(startDate)
    setAppliedEnd(endDate)
  }

  const handleExportExcel = () => {
    if (!overview) return
    setExporting(true)
    try {
      const exportRows = overview.breakdown.map((r, i) => ({
        '#': i + 1,
        'Interview Type': r.type,
        'Topic / Resume': r.name,
        Attempts: r.attempts,
        Students: r.students,
        'Participation (%)': r.participationPct,
        'Avg Score': r.scoreIsPercent ? `${r.avgScore}%` : r.avgScore,
        'Last Activity': fmtDateTime(r.lastActivity),
      }))
      const ws = XLSX.utils.json_to_sheet(exportRows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'AI Interview')
      XLSX.writeFile(wb, `AI_Interview_${MONTH_SHORT[month - 1]}_${year}.xlsx`)
    } catch (err) { console.error(err) }
    finally { setExporting(false) }
  }

  if (loading || !overview) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <Spinner animation="border" style={{ color: '#ff6b00' }} />
      </div>
    )
  }


  /* ── Students Attended — filtered to actual attendees of the active tab ── */
  const attendedStudents = allStudents.filter((s) => {
    const entry = s[attendedTab]
    if (!entry || entry.attempts === 0) return false
    if (attendedSearch && !s.name.toLowerCase().includes(attendedSearch.toLowerCase()) && !s.email.toLowerCase().includes(attendedSearch.toLowerCase())) return false
    return true
  })
  const attendedTotalPages = Math.max(1, Math.ceil(attendedStudents.length / attendedLimit))
  const attendedSafePage = Math.min(attendedPage, attendedTotalPages)
  const attendedPageRows = attendedStudents.slice((attendedSafePage - 1) * attendedLimit, attendedSafePage * attendedLimit)

  /* ── Interview Details (Latest) — flattened individual attempts within the
     selected Date Range, newest first ── */
  const latestAttempts: LatestAttempt[] = rangeStudents
    .flatMap((s) => [
      ...(s.topicBased?.attemptsList || []).map((a) => ({ type: 'Topic Based' as const, name: a.topic || 'Untitled Topic', studentName: s.name, date: a.date, score: a.score })),
      ...(s.resumeBased?.attemptsList || []).map((a) => ({ type: 'Resume Based' as const, name: 'Resume Interview', studentName: s.name, date: a.date, score: a.score })),
    ])
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  /* ── Chart configs ──────────────────────────────────── */
  const trendOptions: ApexCharts.ApexOptions = {
    chart: { type: 'line', toolbar: { show: false }, background: 'transparent' },
    theme: { mode: 'dark' },
    stroke: { curve: 'smooth', width: 3 },
    colors: ['#a855f7', '#f59e0b'],
    markers: { size: 4, strokeColors: '#141414', strokeWidth: 2, hover: { size: 7 } },
    xaxis: {
      categories: overview.trend.map((t) => `${MONTH_SHORT[t.month - 1]}`),
      labels: { style: { colors: '#444', fontSize: '10px' } },
      axisBorder: { show: false }, axisTicks: { show: false },
    },
    yaxis: { min: 0, labels: { style: { colors: '#444', fontSize: '10px' } } },
    dataLabels: {
      enabled: true,
      offsetY: -6,
      style: { fontSize: '10px', colors: ['#ccc'] },
      background: { enabled: false },
      formatter: (val: number) => (val > 0 ? String(val) : ''),
    },
    legend: { show: true, labels: { colors: '#aaa' }, fontSize: '11px', markers: { size: 5 } },
    grid: { borderColor: '#1e1e1e', strokeDashArray: 3, xaxis: { lines: { show: false } }, padding: { left: 6, right: 12, top: 10 } },
    tooltip: { theme: 'dark' },
  }
  const trendSeries = [
    { name: 'Topic Based', data: overview.trend.map((t) => t.topicAttempts) },
    { name: 'Resume Based', data: overview.trend.map((t) => t.resumeAttempts) },
  ]

  return (
    <div>
      {/* ── Header ─────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FaRobot size={16} color="#ff6b00" />
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem' }}>AI Based Interview</span>
          </div>
          <div style={{ color: '#666', fontSize: '0.78rem', marginTop: 2 }}>Track and analyze AI interview activity and student participation</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' as const, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <FaCalendarAlt size={11} color="#666" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <select
              style={{ ...S.select, width: 190, paddingLeft: 28 }}
              value={dateRangeMode}
              onChange={(e) => onDateRangeModeChange(e.target.value as DateRangeMode)}
            >
              <option value="today">Today ({new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })})</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          {dateRangeMode === 'custom' && (
            <>
              <input type="date" style={S.select} value={startDate} max={endDate} onChange={(e) => setStartDate(e.target.value)} />
              <span style={{ color: '#555' }}>–</span>
              <input type="date" style={S.select} value={endDate} min={startDate} max={toDateStr()} onChange={(e) => setEndDate(e.target.value)} />
              <button style={S.headerBtn('#ff6b00')} onClick={applyCustomRange}>Apply</button>
            </>
          )}
          <select style={{ ...S.select, width: 110 }} value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select style={{ ...S.select, width: 90 }} value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {yearRange.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button style={S.headerBtn('#22c55e')} onClick={handleExportExcel} disabled={exporting}>
            <FaDownload size={11} /> {exporting ? 'Exporting…' : 'Export Report'}
          </button>
        </div>
      </div>

      {/* ── Stat Cards — scoped to the Date Range control above, independent
           of the Monthly Utilization section's Month/Year picker ─────── */}
      <div style={S.statGrid}>
        <div style={S.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={S.iconCircle('#ff6b00')}><FaUserGraduate size={12} color="#fff" /></div>
            <span style={S.labelSm}>Total Students</span>
          </div>
          <div style={S.numSm}>{overview.rangeStats.totalStudents}</div>
          <span style={S.sub('#22c55e')}>↑ {overview.rangeStats.newStudentsThisMonth} this month</span>
        </div>

        <div style={S.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={S.iconCircle('#a855f7')}><FaMicrophone size={12} color="#fff" /></div>
            <span style={S.labelSm}>Topic Attempts</span>
          </div>
          <div style={S.numSm}>{overview.rangeStats.topicBased.attempts}</div>
          <span style={S.sub(overview.rangeStats.prevComparison.topicAttempts >= 0 ? '#22c55e' : '#ef4444')}>
            {overview.rangeStats.prevComparison.topicAttempts >= 0 ? '↑' : '↓'} {Math.abs(overview.rangeStats.prevComparison.topicAttempts)} vs previous period
          </span>
        </div>

        <div style={S.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={S.iconCircle('#f59e0b')}><FaFileAlt size={12} color="#fff" /></div>
            <span style={S.labelSm}>Resume Attempts</span>
          </div>
          <div style={S.numSm}>{overview.rangeStats.resumeBased.attempts}</div>
          <span style={S.sub(overview.rangeStats.prevComparison.resumeAttempts >= 0 ? '#22c55e' : '#ef4444')}>
            {overview.rangeStats.prevComparison.resumeAttempts >= 0 ? '↑' : '↓'} {Math.abs(overview.rangeStats.prevComparison.resumeAttempts)} vs previous period
          </span>
        </div>

        <div style={S.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={S.iconCircle('#3b82f6')}><FaCheckCircle size={12} color="#fff" /></div>
            <span style={S.labelSm}>Total Attempts</span>
          </div>
          <div style={S.numSm}>{overview.rangeStats.totalAttempts}</div>
          <span style={S.sub(overview.rangeStats.prevComparison.totalAttempts >= 0 ? '#22c55e' : '#ef4444')}>
            {overview.rangeStats.prevComparison.totalAttempts >= 0 ? '↑' : '↓'} {Math.abs(overview.rangeStats.prevComparison.totalAttempts)} vs previous period
          </span>
        </div>

        <div style={S.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={S.iconCircle('#22c55e')}><FaCheckCircle size={12} color="#fff" /></div>
            <span style={S.labelSm}>Participation Rate</span>
          </div>
          <div style={S.numSm}>{overview.rangeStats.participationPct}%</div>
          <span style={S.sub(overview.rangeStats.prevComparison.participationPct >= 0 ? '#22c55e' : '#ef4444')}>
            {overview.rangeStats.prevComparison.participationPct >= 0 ? '↑' : '↓'} {Math.abs(overview.rangeStats.prevComparison.participationPct)}% vs previous period
          </span>
        </div>
      </div>

      {/* ── Monthly Utilization + Monthly Trend — one row ─ */}
      <div style={S.sectionLabel}>AI Interview – Monthly Utilization · {MONTH_SHORT[month - 1]} {year}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '0.65fr 1.35fr 1.3fr', gap: '0.85rem', marginBottom: '1.25rem', alignItems: 'stretch', minWidth: 0 }}>
        {/* Topic Based + Resume Based — stacked in one column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', minWidth: 0, height: 340 }}>
          <div style={{ background: '#1a1a1a', border: '1px solid rgba(168,85,247,0.4)', borderRadius: 14, padding: '1rem 1.25rem', minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ ...S.iconCircle('rgba(168,85,247,0.2)'), borderRadius: 8 }}><FaMicrophone size={12} color="#a855f7" /></div>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>Topic Based</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <div>
                <div style={{ color: '#a855f7', fontWeight: 800, fontSize: '1.5rem', lineHeight: 1 }}>{overview.topicBased.attempts}</div>
                <div style={{ color: '#666', fontSize: '0.68rem', marginTop: 4 }}>Attempts</div>
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.5rem', lineHeight: 1 }}>{overview.topicBased.uniqueStudents}</div>
                <div style={{ color: '#666', fontSize: '0.68rem', marginTop: 4 }}>Students</div>
              </div>
            </div>
            <div>
              <div style={{ background: '#2a2a2a', borderRadius: 4, height: 5, overflow: 'hidden', marginBottom: 8 }}>
                <div style={{ width: `${overview.topicBased.utilizationPct}%`, background: '#a855f7', height: '100%' }} />
              </div>
              <span style={{ color: '#a855f7', fontSize: '0.75rem', fontWeight: 600 }}>{overview.topicBased.utilizationPct}% of students</span>
            </div>
          </div>

          <div style={{ background: '#1a1a1a', border: '1px solid rgba(245,158,11,0.4)', borderRadius: 14, padding: '1rem 1.25rem', minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ ...S.iconCircle('rgba(245,158,11,0.2)'), borderRadius: 8 }}><FaFileAlt size={12} color="#f59e0b" /></div>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>Resume Based</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <div>
                <div style={{ color: '#f59e0b', fontWeight: 800, fontSize: '1.5rem', lineHeight: 1 }}>{overview.resumeBased.attempts}</div>
                <div style={{ color: '#666', fontSize: '0.68rem', marginTop: 4 }}>Attempts</div>
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.5rem', lineHeight: 1 }}>{overview.resumeBased.uniqueStudents}</div>
                <div style={{ color: '#666', fontSize: '0.68rem', marginTop: 4 }}>Students</div>
              </div>
            </div>
            <div>
              <div style={{ background: '#2a2a2a', borderRadius: 4, height: 5, overflow: 'hidden', marginBottom: 8 }}>
                <div style={{ width: `${overview.resumeBased.utilizationPct}%`, background: '#f59e0b', height: '100%' }} />
              </div>
              <span style={{ color: '#f59e0b', fontSize: '0.75rem', fontWeight: 600 }}>{overview.resumeBased.utilizationPct}% of students</span>
            </div>
          </div>
        </div>

        {/* Monthly Trend */}
        <div style={{ ...S.card, minWidth: 0, height: 340, display: 'flex', flexDirection: 'column' }}>
          <div style={S.cardHeader}>
            <span style={S.cardTitle}>Monthly Trend</span>
            <span style={{ color: '#555', fontSize: '0.7rem' }}>Last 6 Months</span>
          </div>
          <div style={{ padding: '0.5rem 0.5rem 0', flex: 1, minHeight: 0 }}>
            <ReactApexChart type="line" height="100%" width="100%" series={trendSeries} options={trendOptions} />
          </div>
        </div>

        {/* Interview Details (Latest) */}
        <div style={{ ...S.card, minWidth: 0, height: 340, display: 'flex', flexDirection: 'column' }}>
          <div style={S.cardHeader}><span style={S.cardTitle}>Interview Details (Latest)</span></div>
          <div style={{ padding: '0.3rem 0.9rem', flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: latestAttempts.length ? 'flex-start' : 'center', gap: 6 }}>
            {latestAttempts.length === 0 ? (
              <div style={{ color: '#555', fontSize: '0.76rem', textAlign: 'center', padding: '1rem 0' }}>No activity yet</div>
            ) : latestAttempts.map((a, i) => {
              const isTopic = a.type === 'Topic Based'
              const accent = isTopic ? '#a855f7' : '#f59e0b'
              const Icon = isTopic ? FaMicrophone : FaFileAlt
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.3rem 0', borderBottom: i < latestAttempts.length - 1 ? '1px solid #232323' : 'none' }}>
                  <div style={{ ...S.iconCircle(`${accent}22`), width: 22, height: 22, borderRadius: 7, flexShrink: 0 }}><Icon size={10} color={accent} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#fff', fontSize: '0.76rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.studentName}</div>
                    <div style={{ fontSize: '0.64rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span style={{ color: accent, fontWeight: 700 }}>{a.type}</span>
                      <span style={{ color: '#444' }}> · </span>
                      <span style={{ color: '#666' }}>{fmtDateTime(a.date)}</span>
                    </div>
                  </div>
                  <ScoreRing
                    pct={isTopic ? (a.score / 10) * 100 : a.score}
                    label={isTopic ? String(a.score) : `${a.score}%`}
                    color={isTopic ? '#a855f7' : scoreDotColor(a.score)}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Students Attended ──────────────────────────── */}
      <div style={{ minWidth: 0 }}>
        <div style={{ ...S.card, minWidth: 0 }}>
          <div style={{ padding: '0.9rem 1.1rem', borderBottom: '1px solid #2a2a2a' }}>
            <div style={{ marginBottom: '0.75rem' }}>
              <span style={S.cardTitle}>Students Attended</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '1.25rem' }}>
                {(['topicBased', 'resumeBased'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setAttendedTab(t); setAttendedPage(1) }}
                    style={{
                      background: 'none', border: 'none', padding: '0 0 6px', cursor: 'pointer',
                      color: attendedTab === t ? '#fff' : '#666', fontWeight: attendedTab === t ? 700 : 500, fontSize: '0.8rem',
                      borderBottom: attendedTab === t ? '2px solid #ff6b00' : '2px solid transparent',
                    }}
                  >
                    {t === 'topicBased' ? 'Topic Based' : 'Resume Based'}
                  </button>
                ))}
              </div>
              <div style={S.searchWrap}>
                <FaSearch size={11} color="#444" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)' }} />
                <input style={S.input({ width: 220 })} placeholder="Search by name or email" value={attendedSearch} onChange={(e) => { setAttendedSearch(e.target.value); setAttendedPage(1) }} />
              </div>
            </div>
          </div>

          <div style={{ position: 'relative', overflowX: 'auto' }}>
            {studentsLoading && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                <Spinner animation="border" style={{ color: '#ff6b00', width: 24, height: 24 }} />
              </div>
            )}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...S.th, minWidth: 28 }}>#</th>
                  <th style={{ ...S.th, minWidth: 140 }}>Student Name</th>
                  <th style={{ ...S.th, minWidth: 150 }}>Email</th>
                  <th style={{ ...S.th, minWidth: 90, textAlign: 'center' }}>Attempts</th>
                  <th style={{ ...S.th, minWidth: 90, textAlign: 'center' }}>Violations</th>
                  <th style={{ ...S.th, minWidth: 110 }}>Last Attempt</th>
                  <th style={{ ...S.th, minWidth: 80, textAlign: 'center' }}>Last Score</th>
                  <th style={{ ...S.th, minWidth: 60, textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {attendedPageRows.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: '#444' }}>No students found</td></tr>
                ) : attendedPageRows.map((s, i) => {
                  const entry = s[attendedTab]!
                  return (
                    <tr key={s.userId}>
                      <td style={S.tdMuted}>{(attendedSafePage - 1) * attendedLimit + i + 1}</td>
                      <td style={{ ...S.td, fontWeight: 600, color: '#fff' }}>{s.name}</td>
                      <td style={S.tdMuted}>{s.email}</td>
                      <td style={{ ...S.td, textAlign: 'center' }}>{entry.attempts}</td>
                      <td style={{ ...S.td, textAlign: 'center' }}>
                        {typeof entry.violations === 'number' ? (
                          <span style={{
                            color: entry.violations === 0 ? '#22c55e' : entry.violations <= 3 ? '#f59e0b' : '#ef4444',
                            fontWeight: 700,
                          }}>
                            {entry.violations}
                          </span>
                        ) : '—'}
                      </td>
                      <td style={S.tdMuted}>{fmtDateTime(entry.lastActivity)}</td>
                      <td style={{ ...S.td, textAlign: 'center' }}>
                        {(() => {
                          const lastScore = entry.attemptsList[0]?.score
                          if (typeof lastScore !== 'number') return '—'
                          return attendedTab === 'resumeBased'
                            ? <span style={{ color: scoreDotColor(lastScore), fontWeight: 700 }}>{lastScore}%</span>
                            : <span style={{ color: '#aaa', fontWeight: 700 }}>{lastScore} <span style={{ color: '#555', fontWeight: 400 }}>/ 10</span></span>
                        })()}
                      </td>
                      <td style={{ ...S.td, textAlign: 'center' }}>
                        <button
                          onClick={() => { setViewStudent(s); setModalStartDate(''); setModalEndDate(''); setModalAppliedStart(''); setModalAppliedEnd(''); setModalRangeEntry(null); setModalRangeError('') }}
                          style={{ background: 'transparent', border: '1px solid #2a2a2a', color: '#ff6b00', borderRadius: 6, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div style={S.footer}>
            <span>
              Showing <strong style={{ color: '#aaa' }}>{attendedStudents.length === 0 ? 0 : (attendedSafePage - 1) * attendedLimit + 1}–{Math.min(attendedSafePage * attendedLimit, attendedStudents.length)}</strong>
              {' '}of <strong style={{ color: '#aaa' }}>{attendedStudents.length}</strong> entries
            </span>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <PagBtn disabled={attendedSafePage <= 1} onClick={() => setAttendedPage(attendedSafePage - 1)}>‹ Prev</PagBtn>
              {Array.from({ length: attendedTotalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === attendedTotalPages || Math.abs(p - attendedSafePage) <= 1)
                .reduce<(number | '…')[]>((acc, p, idx, arr) => {
                  if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('…')
                  acc.push(p); return acc
                }, [])
                .map((p, idx) => p === '…'
                  ? <span key={`e-${idx}`} style={{ color: '#444', padding: '0 4px' }}>…</span>
                  : <PagBtn key={p} active={p === attendedSafePage} onClick={() => setAttendedPage(p as number)}>{p}</PagBtn>
                )}
              <PagBtn disabled={attendedSafePage >= attendedTotalPages} onClick={() => setAttendedPage(attendedSafePage + 1)}>Next ›</PagBtn>
            </div>
          </div>
        </div>
      </div>

      {/* ── Student Attempts Modal ─────────────────────── */}
      {viewStudent && createPortal(
        (() => {
          const entry = modalRangeEntry ? modalRangeEntry[attendedTab] : viewStudent[attendedTab]
          const isTopic = attendedTab === 'topicBased'
          const accent = isTopic ? '#a855f7' : '#f59e0b'

          const applyModalRange = async () => {
            if (modalStartDate && modalEndDate) {
              const spanDays = Math.round((new Date(modalEndDate).getTime() - new Date(modalStartDate).getTime()) / 86400000) + 1
              if (spanDays > 31) {
                setModalRangeError(`Date range can't exceed 31 days (currently ${spanDays} days)`)
                return
              }
            }
            setModalRangeError('')
            setModalAppliedStart(modalStartDate)
            setModalAppliedEnd(modalEndDate)
            if (!modalStartDate && !modalEndDate) { setModalRangeEntry(null); return }
            setModalRangeLoading(true)
            try {
              const params = new URLSearchParams({
                page: '1', limit: '500',
                startDate: modalStartDate || '2000-01-01',
                endDate: modalEndDate || toDateStr(),
              })
              const res = await fetch(`${baseURL}${apiBase}/ai-interview-students?${params}`, {
                headers: { Authorization: `Bearer ${user?.token}` },
              })
              const data = await res.json()
              const found = (data.students || []).find((s: StudentRow) => s.userId === viewStudent.userId)
              setModalRangeEntry(found ? { topicBased: found.topicBased, resumeBased: found.resumeBased } : { topicBased: null, resumeBased: null })
            } catch (err) {
              console.error('Modal range fetch failed', err)
            } finally {
              setModalRangeLoading(false)
            }
          }

          return (
            <div
              onClick={() => setViewStudent(null)}
              style={{
                position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.75)',
                backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: '#141414', border: '1px solid #252525', borderRadius: 16,
                  width: '94vw', maxHeight: '88vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
                  boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
                }}
              >
                <div style={{ padding: '1.1rem 1.4rem', borderBottom: '1px solid #252525', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' as const }}>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>{viewStudent.name}</div>
                    <div style={{ color: '#555', fontSize: '0.72rem', marginTop: 2 }}>{viewStudent.email} · {isTopic ? 'Topic Based' : 'Resume Based'}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#666', fontSize: '0.7rem', fontWeight: 600, flexShrink: 0 }}>Date Range</span>
                    <input
                      type="date" style={S.select} value={modalStartDate}
                      max={modalEndDate || undefined}
                      onChange={(e) => { setModalStartDate(e.target.value); setModalRangeError('') }}
                    />
                    <span style={{ color: '#555' }}>–</span>
                    <input
                      type="date" style={S.select} value={modalEndDate}
                      min={modalStartDate || undefined}
                      max={modalStartDate ? addDaysStr(modalStartDate, 30) : undefined}
                      onChange={(e) => { setModalEndDate(e.target.value); setModalRangeError('') }}
                    />
                    <button
                      onClick={applyModalRange}
                      disabled={modalRangeLoading}
                      style={{ background: 'rgba(255,107,0,0.12)', border: '1px solid rgba(255,107,0,0.4)', color: '#ff6b00', borderRadius: 6, padding: '4px 10px', fontSize: '0.72rem', fontWeight: 600, cursor: modalRangeLoading ? 'default' : 'pointer', opacity: modalRangeLoading ? 0.6 : 1 }}
                    >
                      {modalRangeLoading ? 'Applying…' : 'Apply'}
                    </button>
                    {(modalStartDate || modalEndDate || modalAppliedStart || modalAppliedEnd) && (
                      <button
                        onClick={() => { setModalStartDate(''); setModalEndDate(''); setModalAppliedStart(''); setModalAppliedEnd(''); setModalRangeEntry(null); setModalRangeError('') }}
                        style={{ background: 'transparent', border: '1px solid #2a2a2a', color: '#888', borderRadius: 6, padding: '4px 10px', fontSize: '0.72rem', cursor: 'pointer' }}
                      >
                        Clear
                      </button>
                    )}
                    <button
                      onClick={() => setViewStudent(null)}
                      style={{ background: '#222', border: '1px solid #333', color: '#777', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', fontSize: '1rem', lineHeight: 1, flexShrink: 0 }}
                    >
                      ×
                    </button>
                  </div>
                </div>
                {modalRangeError && (
                  <div style={{ padding: '0.5rem 1.4rem 0', color: '#ef4444', fontSize: '0.72rem', textAlign: 'right' }}>{modalRangeError}</div>
                )}
                <div style={{ overflowY: 'auto', padding: '0 1.4rem 1.1rem' }}>
                  {(() => {
                    const filtered = !entry ? [] : entry.attemptsList.filter((a) => {
                      const d = toDateStr(new Date(a.date))
                      if (modalAppliedStart && d < modalAppliedStart) return false
                      if (modalAppliedEnd && d > modalAppliedEnd) return false
                      return true
                    })
                    if (filtered.length === 0) {
                      return <div style={{ color: '#444', textAlign: 'center', padding: '2rem 0', fontSize: '0.85rem' }}>No attempts found</div>
                    }

                    // Pivot: one row per topic, one column per distinct date —
                    // same topic attempted on different dates lands in
                    // separate date columns instead of separate rows.
                    const dateSet = new Set(filtered.map((a) => toDateStr(new Date(a.date))))
                    const dates = [...dateSet].sort()
                    const topicOrder: string[] = []
                    const byTopic: Record<string, Record<string, { score: number; time: string; ms: number }>> = {}
                    filtered.forEach((a) => {
                      const topic = a.topic || (isTopic ? 'Untitled Topic' : 'Resume Interview')
                      const d = toDateStr(new Date(a.date))
                      if (!byTopic[topic]) { byTopic[topic] = {}; topicOrder.push(topic) }
                      // If the same topic has multiple attempts on the same date, keep the latest one
                      const ms = new Date(a.date).getTime()
                      const existing = byTopic[topic][d]
                      if (!existing || ms > existing.ms) {
                        const time = new Date(a.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                        byTopic[topic][d] = { score: a.score, time, ms }
                      }
                    })

                    // Fixed per-column widths (not %-based) let the table grow
                    // wider than the viewport and scroll horizontally, so
                    // date columns get real breathing room instead of being
                    // squeezed to fit — the Topic column stays pinned via
                    // position:sticky while the dates scroll underneath it.
                    const dateColWidth = 110
                    return (
                      <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: 'max-content', minWidth: '100%', borderCollapse: 'separate', borderSpacing: 0, tableLayout: 'fixed' }}>
                        <colgroup>
                          <col style={{ width: 170 }} />
                          {dates.map((d) => <col key={d} style={{ width: dateColWidth }} />)}
                        </colgroup>
                        <thead>
                          <tr>
                            <th style={{ ...S.th, minWidth: 0, position: 'sticky', left: 0, zIndex: 2, background: '#111', boxShadow: '1px 0 0 #2a2a2a' }}>{isTopic ? 'Topic' : 'Resume'}</th>
                            {dates.map((d) => (
                              <th key={d} style={{ ...S.th, minWidth: 0, textAlign: 'center', padding: '0.6rem 0.6rem' }}>
                                {new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {topicOrder.map((topic) => (
                            <tr key={topic}>
                              <td style={{ ...S.td, fontWeight: 700, color: '#ddd', whiteSpace: 'normal', verticalAlign: 'middle', position: 'sticky', left: 0, zIndex: 1, background: '#141414', boxShadow: '1px 0 0 #2a2a2a' }}>{topic}</td>
                              {dates.map((d) => {
                                const cell = byTopic[topic][d]
                                return (
                                  <td key={d} style={{ ...S.td, textAlign: 'center', padding: '0.6rem 0.6rem', verticalAlign: 'middle' }}>
                                    {cell ? (
                                      <div>
                                        <div style={{ color: accent, fontWeight: 700, fontSize: '0.78rem' }}>{isTopic ? `${cell.score} / 10` : `${cell.score}%`}</div>
                                        <div style={{ color: '#555', fontSize: '0.6rem', marginTop: 2 }}>{cell.time}</div>
                                      </div>
                                    ) : <span style={{ color: '#333' }}>—</span>}
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      </div>
                    )
                  })()}
                </div>
              </div>
            </div>
          )
        })(),
        document.body
      )}
    </div>
  )
}

export default AIInterviewFull
