import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Spinner } from 'react-bootstrap'
import {
  FaCalendarAlt, FaCheckCircle, FaDownload, FaFileAlt, FaMicrophone, FaRobot, FaSearch, FaUserGraduate, FaFilePdf
} from 'react-icons/fa'
import ReactApexChart from 'react-apexcharts'
import * as XLSX from 'xlsx'
import { useAuthContext } from '@/context/useAuthContext'
import { exportBrandedPdf } from './moduleOverview/brandedPdf'
import { ReportPagination, ScoreBar, StatusPill, StudentCell, ViewButton } from './moduleOverview/ReportCells'
import { HeaderSelect } from './StudentReports'
import { CohortFilters, withCohort } from './moduleOverview/cohort'
import ReportDrawer from './moduleOverview/ReportDrawer'
import { ReportRangeSelect, useReportRange } from './moduleOverview/range'

// Card footnote colour: grey stays the Student Reports rule grey, trend colours keep their meaning
const dimAccent = (c: string) => (/^#(888|999|666|555|aaa)$/i.test(c) ? '#8a9097' : c)

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

type AttemptEntry = { date: string; score: number; topic?: string; attemptId?: string }
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

/* ─── Per-attempt drill-down ─────────────────────────────── */
type Monitoring = {
  eyeViolations: number; headViolations: number; maskViolations: number; noFaceViolations: number
  faceDetected: boolean; lightingOk: boolean; lightingLabel: string; recordingActive: boolean
} | null
type TopicResponse = {
  question: string; answer: string
  rating: { accuracy: number; clarity: number; completeness: number; total: number }
  feedback: string; idealAnswer: string; followUpQuestion: string; improvementTips: string[]
  videoPath: string | null
}
type TopicAttemptDetail = {
  attemptId: string; studentName: string; studentEmail: string; topic: string; attemptNumber: number
  startedAt: string; completedAt: string | null; totalScore: number | null
  monitoring: Monitoring; responses: TopicResponse[]
}
type ResumeAttemptDetail = {
  attemptId: string; studentName: string; studentEmail: string; attemptNumber: number
  createdAt: string; totalScore: number | null; isScored: boolean
  monitoring: Monitoring; questions: string[]; scores: { question: string; score: number }[]
}
type AttemptDetail =
  | { success: true; type: 'topic'; attempt: TopicAttemptDetail }
  | { success: true; type: 'resume'; attempt: ResumeAttemptDetail }

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
  statCard: { background: '#111315', border: '1px solid #272a2e', borderRadius: '11px', padding: '0.65rem 0.8rem' } as React.CSSProperties,
  iconCircle: (accent: string): React.CSSProperties => ({
    background: accent, borderRadius: '50%', width: 26, height: 26,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  }),
  numSm: { fontSize: '1.3rem', fontWeight: 800, color: '#fff', lineHeight: 1, marginBottom: 3 } as React.CSSProperties,
  labelSm: { color: '#999', fontSize: '0.72rem' } as React.CSSProperties,
  sub: (accent: string): React.CSSProperties => ({ color: accent, fontSize: '0.66rem', fontWeight: 600, display: 'block' }),
  card: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '14px' } as React.CSSProperties,
  cardHeader: {
    padding: '0.9rem 1.1rem', borderBottom: '1px solid #202326',
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
    textAlign: 'left' as const, borderBottom: '1px solid #202326', whiteSpace: 'nowrap' as const,
  },
  td: { padding: '0.55rem 0.5rem', borderBottom: '1px solid #202326', color: '#e0e0e0', fontSize: '0.78rem', whiteSpace: 'nowrap' as const } as React.CSSProperties,
  tdMuted: { padding: '0.55rem 0.5rem', borderBottom: '1px solid #202326', color: '#555', fontSize: '0.74rem', whiteSpace: 'nowrap' as const } as React.CSSProperties,
  footer: {
    background: '#111', borderTop: '1px solid #25282b', color: '#555', fontSize: '0.78rem',
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
  // Date range shared by every report tab (default: till now)
  const range = useReportRange()
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
  const [startDate, setStartDate] = useState(range.from)
  const [endDate, setEndDate] = useState(range.to)
  const [appliedStart, setAppliedStart] = useState(range.from)
  const [appliedEnd, setAppliedEnd] = useState(range.to)

  const [exporting, setExporting] = useState(false)

  // Students Attended — per-student rows, tabbed by interview type (month/year scoped)
  const [allStudents, setAllStudents] = useState<StudentRow[]>([])
  const [studentsLoading, setStudentsLoading] = useState(true)
  const [attendedTab, setAttendedTab] = useState<'topicBased' | 'resumeBased'>('topicBased')
  const [attendFilter, setAttendFilter] = useState<'all' | 'attended' | 'not-attended'>('all')
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
  const attendedLimit = 10 // rows per page, same as every dashboard table

  // Interview Details (Latest) — date-range scoped, independent of month/year
  const [rangeStudents, setRangeStudents] = useState<StudentRow[]>([])

  // Per-attempt drill-down — full question-by-question report behind each
  // score cell in the pivot table modal above.
  const [attemptDetail, setAttemptDetail] = useState<AttemptDetail | null>(null)
  const [attemptDetailLoading, setAttemptDetailLoading] = useState(false)
  const [attemptDetailError, setAttemptDetailError] = useState('')

  const openAttemptDetail = async (attemptId: string, type: 'topic' | 'resume') => {
    if (!user?.token) return
    setAttemptDetail(null)
    setAttemptDetailError('')
    setAttemptDetailLoading(true)
    try {
      const params = new URLSearchParams({ attemptId, type })
      const res = await fetch(`${baseURL}${apiBase}/ai-interview-attempt?${params}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      })
      const data = await res.json()
      if (data.success) setAttemptDetail(data)
      else setAttemptDetailError(data.message || 'Failed to load attempt')
    } catch (err) {
      console.error(err)
      setAttemptDetailError('Network error')
    } finally {
      setAttemptDetailLoading(false)
    }
  }

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
    fetch(`${baseURL}${apiBase}/ai-interview-students?${withCohort(`startDate=${range.from}&endDate=${range.to}&page=1&limit=5000&includeAll=1`)}`, {
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
    fetch(`${baseURL}${apiBase}/ai-interview-students?${withCohort(params)}`, {
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

  const handleExportExcel = async (format: 'excel' | 'pdf' = 'excel') => {
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
      if (format === 'pdf') {
        await exportBrandedPdf({ title: 'AI Based Interview', subtitle: `${range.label} · by topic and resume`, rows: exportRows, fileName: `AI_Interview_${MONTH_SHORT[month - 1]}_${year}` })
        return
      }
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
  // Every student in scope: those who took this interview type first, the rest marked "Not attended"
  const hasAttended = (s: StudentRow) => Boolean(s[attendedTab]?.attempts)
  const attendedCount = allStudents.filter(hasAttended).length
  const attendedStudents = allStudents
    .filter((s) => {
      if (attendFilter === 'attended' && !hasAttended(s)) return false
      if (attendFilter === 'not-attended' && hasAttended(s)) return false
      if (attendedSearch && !s.name.toLowerCase().includes(attendedSearch.toLowerCase()) && !s.email.toLowerCase().includes(attendedSearch.toLowerCase())) return false
      return true
    })
    .sort((a, b) => Number(hasAttended(b)) - Number(hasAttended(a)))
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
        <div className="sr-heading">
          <span className="sr-heading-icon"><FaRobot /></span>
          <div>
            <h2>AI Based Interview</h2>
            <p>Track and analyze AI interview activity and student participation</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' as const, alignItems: 'center' }}>
          <ReportRangeSelect />
          <button type="button" className="sr-export-button" onClick={() => handleExportExcel('pdf')} disabled={exporting}>
            <FaFilePdf /> {exporting ? 'Preparing PDF…' : 'Export PDF'}
          </button>
        </div>
      </div>

      {/* ── Stat Cards — scoped to the Date Range control above, independent
           of the Monthly Utilization section's Month/Year picker ─────── */}
      <section className="sr-summary dr-summary">
        <article className="sr-summary-card sr-card-orange">
          <span className="sr-summary-icon sr-icon-orange"><FaUserGraduate /></span>
          <div>
            <strong>{overview.rangeStats.totalStudents}</strong>
            <span>Total Students</span>
            <em className="sr-summary-rule" style={{ color: dimAccent('#22c55e') }}>↑ {overview.rangeStats.newStudentsThisMonth} this month</em>
          </div>
        </article>

        <article className="sr-summary-card sr-card-purple">
          <span className="sr-summary-icon sr-icon-purple"><FaMicrophone /></span>
          <div>
            <strong>{overview.rangeStats.topicBased.attempts}</strong>
            <span>Topic Attempts</span>
            <em className="sr-summary-rule" style={{ color: dimAccent(overview.rangeStats.prevComparison.topicAttempts >= 0 ? '#22c55e' : '#ef4444') }}>{overview.rangeStats.prevComparison.topicAttempts >= 0 ? '↑' : '↓'} {Math.abs(overview.rangeStats.prevComparison.topicAttempts)} vs previous period</em>
          </div>
        </article>

        <article className="sr-summary-card sr-card-amber">
          <span className="sr-summary-icon sr-icon-amber"><FaFileAlt /></span>
          <div>
            <strong>{overview.rangeStats.resumeBased.attempts}</strong>
            <span>Resume Attempts</span>
            <em className="sr-summary-rule" style={{ color: dimAccent(overview.rangeStats.prevComparison.resumeAttempts >= 0 ? '#22c55e' : '#ef4444') }}>{overview.rangeStats.prevComparison.resumeAttempts >= 0 ? '↑' : '↓'} {Math.abs(overview.rangeStats.prevComparison.resumeAttempts)} vs previous period</em>
          </div>
        </article>

        <article className="sr-summary-card sr-card-blue">
          <span className="sr-summary-icon sr-icon-blue"><FaCheckCircle /></span>
          <div>
            <strong>{overview.rangeStats.totalAttempts}</strong>
            <span>Total Attempts</span>
            <em className="sr-summary-rule" style={{ color: dimAccent(overview.rangeStats.prevComparison.totalAttempts >= 0 ? '#22c55e' : '#ef4444') }}>{overview.rangeStats.prevComparison.totalAttempts >= 0 ? '↑' : '↓'} {Math.abs(overview.rangeStats.prevComparison.totalAttempts)} vs previous period</em>
          </div>
        </article>

        <article className="sr-summary-card sr-card-green">
          <span className="sr-summary-icon sr-icon-green"><FaCheckCircle /></span>
          <div>
            <strong>{overview.rangeStats.participationPct}%</strong>
            <span>Participation Rate</span>
            <em className="sr-summary-rule" style={{ color: dimAccent(overview.rangeStats.prevComparison.participationPct >= 0 ? '#22c55e' : '#ef4444') }}>{overview.rangeStats.prevComparison.participationPct >= 0 ? '↑' : '↓'} {Math.abs(overview.rangeStats.prevComparison.participationPct)}% vs previous period</em>
          </div>
        </article>
      </section>

      {/* ── Interview types · Monthly trend · Latest interviews (Student Reports panels) ── */}
      <div className="dr-three-col">
        <section className="sr-table-panel dr-panel">
          <div className="dr-panel-head">
            <div><h3>Interview Types</h3><p>{range.label} · share of students who practised</p></div>
          </div>
          <div className="dr-panel-body dr-types">
            {([
              { key: 'topicBased', label: 'Topic Based', about: 'Questions on a chosen subject', icon: FaMicrophone, color: '#a855f7' },
              { key: 'resumeBased', label: 'Resume Based', about: 'Questions from the student’s resume', icon: FaFileAlt, color: '#f59e0b' },
            ] as const).map(({ key, label, about, icon: Icon, color }) => {
              const t = (overview.rangeStats ?? overview)[key]
              return (
                <div key={key} className="dr-type" style={{ ['--c' as string]: color }}>
                  <div className="dr-type-head">
                    <span className="dr-type-icon"><Icon /></span>
                    <div><strong>{label}</strong><small>{about}</small></div>
                    <em>{t.utilizationPct}%</em>
                  </div>
                  <div className="dr-band-bar"><i style={{ width: `${Math.min(100, t.utilizationPct)}%` }} /></div>
                  <div className="dr-type-stats">
                    <span><b>{t.attempts}</b> attempts</span>
                    <span><b>{t.uniqueStudents}</b> students</span>
                    {t.avgScore > 0 && <span>avg <b>{t.avgScore}</b></span>}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="sr-table-panel dr-panel">
          <div className="dr-panel-head">
            <div><h3>Monthly Trend</h3><p>Interviews taken over the last 6 months</p></div>
          </div>
          <div className="dr-panel-body" style={{ padding: '0.5rem 0.5rem 0', minHeight: 260 }}>
            <ReactApexChart type="line" height="100%" width="100%" series={trendSeries} options={trendOptions} />
          </div>
        </section>

        <section className="sr-table-panel dr-panel">
          <div className="dr-panel-head">
            <div><h3>Latest Interviews</h3><p>Most recent attempts in the selected range</p></div>
          </div>
          {latestAttempts.length === 0 ? (
            <div className="sr-empty"><FaRobot /><span>No interviews in this range yet</span></div>
          ) : (
            <div className="dr-mini-table dr-latest">
              <div className="dr-mini-head"><span>Student</span><span>Type</span><span>Score</span></div>
              {latestAttempts.map((a, i) => {
                const isTopic = a.type === 'Topic Based'
                const pct = isTopic ? (a.score / 10) * 100 : a.score
                return (
                  <div key={i} className="dr-mini-row">
                    <span className="dr-latest-who"><strong title={a.studentName}>{a.studentName}</strong><small>{fmtDateTime(a.date)}</small></span>
                    <span><StatusPill tone={isTopic ? 'pending' : 'mid'}>{isTopic ? 'Topic' : 'Resume'}</StatusPill></span>
                    <span><ScoreBar pct={pct} label={isTopic ? `${a.score} / 10` : `${a.score}%`} /></span>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>

      {/* ── Students attended (Student Reports table) ── */}
      <section className="sr-table-panel" aria-label="Students who attended AI interviews">
        <div className="sr-toolbar">
          <div className="sr-search">
            <FaSearch aria-hidden="true" />
            <input aria-label="Search students" value={attendedSearch} onChange={(e) => { setAttendedSearch(e.target.value); setAttendedPage(1) }} placeholder="Search by name or email" />
          </div>
          <div className="sr-filters sr-report-filters">
            <CohortFilters />
            <HeaderSelect label="Interview type" prefix="Interview:" value={attendedTab}
              options={[{ value: 'topicBased', label: 'Topic Based' }, { value: 'resumeBased', label: 'Resume Based' }]}
              onChange={(t) => { setAttendedTab(t as 'topicBased' | 'resumeBased'); setAttendedPage(1) }} />
            <HeaderSelect label="Attendance" prefix="Show:" value={attendFilter}
              options={[{ value: 'all', label: 'All students' }, { value: 'attended', label: 'Attended' }, { value: 'not-attended', label: 'Not attended' }]}
              onChange={(v) => { setAttendFilter(v as 'all' | 'attended' | 'not-attended'); setAttendedPage(1) }} />
            <span className="sr-result-count">{attendedCount} of {allStudents.length} attended</span>
          </div>
        </div>

        <div className="sr-table-scroll" style={{ position: 'relative', overflowX: 'auto' }}>
          {studentsLoading && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
              <Spinner animation="border" style={{ color: '#ff6b00', width: 24, height: 24 }} />
            </div>
          )}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...S.th, width: 40 }}>#</th>
                <th style={{ ...S.th, minWidth: 220 }}>Student</th>
                <th style={{ ...S.th, minWidth: 90 }}>Attempts</th>
                {attendedTab === 'topicBased' && <th style={{ ...S.th, minWidth: 110 }}>Proctoring</th>}
                <th style={{ ...S.th, minWidth: 150 }}>Last Attempt</th>
                <th style={{ ...S.th, minWidth: 130 }}>Last Score</th>
                <th className="dr-actions" style={{ ...S.th, minWidth: 90 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {attendedPageRows.length === 0 ? (
                <tr><td colSpan={7}><div className="sr-empty"><FaRobot /><span>No students match these filters.</span></div></td></tr>
              ) : attendedPageRows.map((s, i) => {
                const entry = s[attendedTab]
                if (!entry || !entry.attempts) {
                  return (
                    <tr key={s.userId} className="dr-row-muted">
                      <td style={S.tdMuted}>{(attendedSafePage - 1) * attendedLimit + i + 1}</td>
                      <td style={S.td}><StudentCell name={s.name} email={s.email} /></td>
                      <td style={S.tdMuted}>0</td>
                      {attendedTab === 'topicBased' && <td style={S.tdMuted}>—</td>}
                      <td style={S.tdMuted}>—</td>
                      <td style={S.td}><StatusPill tone="none">Not attended</StatusPill></td>
                      <td className="dr-actions" style={S.tdMuted}>—</td>
                    </tr>
                  )
                }
                const lastScore = entry.attemptsList[0]?.score
                const v = entry.violations
                return (
                  <tr key={s.userId}>
                    <td style={S.tdMuted}>{(attendedSafePage - 1) * attendedLimit + i + 1}</td>
                    <td style={S.td}><StudentCell name={s.name} email={s.email} /></td>
                    <td style={S.td}><strong>{entry.attempts}</strong></td>
                    {attendedTab === 'topicBased' && (
                      <td style={S.td}>
                        {typeof v === 'number'
                          ? <StatusPill tone={v === 0 ? 'good' : v <= 3 ? 'mid' : 'low'}>{v === 0 ? 'Clean' : `${v} violation${v === 1 ? '' : 's'}`}</StatusPill>
                          : '—'}
                      </td>
                    )}
                    <td style={S.tdMuted}>{fmtDateTime(entry.lastActivity)}</td>
                    <td style={S.td}>
                      {typeof lastScore !== 'number' ? '—'
                        : attendedTab === 'resumeBased'
                          ? <ScoreBar pct={lastScore} />
                          : <ScoreBar pct={lastScore * 10} label={`${lastScore} / 10`} />}
                    </td>
                    <td className="dr-actions" style={S.td}>
                      <ViewButton onClick={() => { setViewStudent(s); setModalStartDate(''); setModalEndDate(''); setModalAppliedStart(''); setModalAppliedEnd(''); setModalRangeEntry(null); setModalRangeError('') }} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <ReportPagination page={attendedSafePage} pageSize={attendedLimit} total={attendedStudents.length} onPage={setAttendedPage} />
      </section>

      {/* ── Student attempts (drawer, like Student Reports) ── */}
      {viewStudent && (() => {
          const entry = modalRangeEntry ? modalRangeEntry[attendedTab] : viewStudent[attendedTab]
          const isTopic = attendedTab === 'topicBased'

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
              const res = await fetch(`${baseURL}${apiBase}/ai-interview-students?${withCohort(params)}`, {
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
          const clearRange = () => { setModalStartDate(''); setModalEndDate(''); setModalAppliedStart(''); setModalAppliedEnd(''); setModalRangeEntry(null); setModalRangeError('') }

          // Attempts in the applied range, newest first
          const attempts = !entry ? [] : entry.attemptsList
            .filter((a) => {
              const d = toDateStr(new Date(a.date))
              if (modalAppliedStart && d < modalAppliedStart) return false
              if (modalAppliedEnd && d > modalAppliedEnd) return false
              return true
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          const pctOf = (score: number) => (isTopic ? score * 10 : score)
          const fmtScore = (score: number) => (isTopic ? `${score} / 10` : `${score}%`)
          const colorOf = (p: number) => (p >= 75 ? '#22c55e' : p >= 50 ? '#f59e0b' : p > 0 ? '#ef4444' : '#3a3e43')
          const best = attempts.length ? Math.max(...attempts.map((a) => a.score)) : null
          const avg = attempts.length ? Math.round((attempts.reduce((t, a) => t + a.score, 0) / attempts.length) * 10) / 10 : null
          const topics = new Set(attempts.map((a) => a.topic || '')).size

          return (
            <ReportDrawer
              name={viewStudent.name}
              email={viewStudent.email}
              badge={<StatusPill tone={isTopic ? 'pending' : 'mid'}>{isTopic ? 'Topic based' : 'Resume based'}</StatusPill>}
              onClose={() => setViewStudent(null)}
              stats={[
                { label: 'Attempts', value: attempts.length, hint: isTopic ? `${topics} topic${topics === 1 ? '' : 's'}` : 'resume interviews', tone: 'orange' },
                { label: 'Best score', value: best !== null ? fmtScore(best) : '—', tone: best !== null ? (pctOf(best) >= 75 ? 'green' : pctOf(best) >= 50 ? 'amber' : 'red') : 'plain' },
                { label: 'Average', value: avg !== null ? fmtScore(avg) : '—', tone: 'purple' },
                { label: 'Last attempt', value: attempts[0] ? new Date(attempts[0].date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—', hint: attempts[0] ? new Date(attempts[0].date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : undefined },
              ]}
              toolbar={<>
                <label>Date range</label>
                <input type="date" value={modalStartDate} max={modalEndDate || undefined} onChange={(e) => { setModalStartDate(e.target.value); setModalRangeError('') }} />
                <span className="rd-sep">–</span>
                <input type="date" value={modalEndDate} min={modalStartDate || undefined} max={modalStartDate ? addDaysStr(modalStartDate, 30) : undefined} onChange={(e) => { setModalEndDate(e.target.value); setModalRangeError('') }} />
                <button type="button" className="rd-btn is-primary" onClick={applyModalRange} disabled={modalRangeLoading}>{modalRangeLoading ? 'Applying…' : 'Apply'}</button>
                {(modalStartDate || modalEndDate || modalAppliedStart || modalAppliedEnd) && <button type="button" className="rd-btn" onClick={clearRange}>Clear</button>}
                {modalRangeError && <span className="rd-error">{modalRangeError}</span>}
              </>}
            >
              <h4 className="rd-section-title">{isTopic ? 'Interview attempts' : 'Resume interview attempts'}</h4>
              {attempts.length === 0 ? (
                <div className="rd-empty"><FaRobot /><span>No attempts in this range</span></div>
              ) : (
                <div className="rd-list">
                  {attempts.map((a, i) => {
                    const p = pctOf(a.score)
                    const d = new Date(a.date)
                    return (
                      <div key={a.attemptId || i} className="rd-item rd-attempt">
                        <div className="rd-item-top">
                          <span className="rd-thumb is-text">{isTopic ? <FaMicrophone /> : <FaFileAlt />}</span>
                          <div className="rd-item-title">
                            <strong title={a.topic}>{a.topic || (isTopic ? 'Untitled topic' : 'Resume interview')}</strong>
                            <small>Attempt {attempts.length - i}</small>
                          </div>
                        </div>
                        <div className="rd-when"><b>{d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</b>{d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                        <div className="rd-score"><b>{fmtScore(a.score)}</b><span><i style={{ width: `${Math.min(100, p)}%`, background: colorOf(p) }} /></span></div>
                        <button type="button" className="rd-btn" disabled={!a.attemptId} onClick={() => a.attemptId && openAttemptDetail(a.attemptId, isTopic ? 'topic' : 'resume')}>Open report</button>
                      </div>
                    )
                  })}
                </div>
              )}
            </ReportDrawer>
          )
      })()}

      {/* ── Per-Attempt Report ──────────────────────────── */}
      {(attemptDetailLoading || attemptDetail || attemptDetailError) && createPortal(
        (() => {
          const closeDetail = () => { setAttemptDetail(null); setAttemptDetailError('') }
          const scoreColor = (s: number) => (s >= 70 ? '#22c55e' : s >= 40 ? '#f59e0b' : '#ef4444')
          return (
            <div className="rd-stacked"
              onClick={closeDetail}
              style={{
                position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.8)',
                backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: '#141414', border: '1px solid #252525', borderRadius: 16,
                  width: 'min(760px, 96vw)', maxHeight: '88vh', overflow: 'hidden',
                  display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
                }}
              >
                <div style={{ padding: '1.1rem 1.4rem', borderBottom: '1px solid #252525', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>
                      {attemptDetail?.type === 'topic' ? attemptDetail.attempt.topic : 'Resume Interview'} — Full Report
                    </div>
                    <div style={{ color: '#555', fontSize: '0.72rem', marginTop: 2 }}>
                      {attemptDetail ? `${attemptDetail.attempt.studentName} · ${attemptDetail.attempt.studentEmail}` : ''}
                    </div>
                  </div>
                  <button
                    onClick={closeDetail}
                    style={{ background: '#222', border: '1px solid #333', color: '#777', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', fontSize: '1rem', lineHeight: 1, flexShrink: 0 }}
                  >
                    ×
                  </button>
                </div>

                <div style={{ overflowY: 'auto', padding: '1.1rem 1.4rem' }}>
                  {attemptDetailLoading && (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '2.5rem 0' }}>
                      <Spinner animation="border" style={{ color: '#ff6b00' }} />
                    </div>
                  )}
                  {attemptDetailError && (
                    <div style={{ color: '#ef4444', textAlign: 'center', padding: '2rem 0', fontSize: '0.85rem' }}>{attemptDetailError}</div>
                  )}

                  {attemptDetail && !attemptDetailLoading && (
                    <>
                      {/* Summary row */}
                      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '0.6rem', marginBottom: '1.1rem' }}>
                        <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10, padding: '0.6rem 0.9rem' }}>
                          <div style={{ color: '#555', fontSize: '0.62rem', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Score</div>
                          <div style={{ color: '#ff6b00', fontWeight: 800, fontSize: '1.1rem' }}>
                            {attemptDetail.type === 'topic'
                              ? `${attemptDetail.attempt.totalScore ?? '—'} / 10`
                              : `${attemptDetail.attempt.totalScore ?? '—'}%`}
                          </div>
                        </div>
                        <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10, padding: '0.6rem 0.9rem' }}>
                          <div style={{ color: '#555', fontSize: '0.62rem', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Attempt #</div>
                          <div style={{ color: '#ddd', fontWeight: 700, fontSize: '1.1rem' }}>{attemptDetail.attempt.attemptNumber}</div>
                        </div>
                        <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10, padding: '0.6rem 0.9rem' }}>
                          <div style={{ color: '#555', fontSize: '0.62rem', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Date</div>
                          <div style={{ color: '#ddd', fontWeight: 700, fontSize: '0.82rem' }}>
                            {fmtDateTime(attemptDetail.type === 'topic' ? attemptDetail.attempt.startedAt : attemptDetail.attempt.createdAt)}
                          </div>
                        </div>
                        {attemptDetail.attempt.monitoring && (
                          <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10, padding: '0.6rem 0.9rem' }}>
                            <div style={{ color: '#555', fontSize: '0.62rem', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Violations</div>
                            {(() => {
                              const m = attemptDetail.attempt.monitoring!
                              const total = m.eyeViolations + m.headViolations + m.maskViolations + m.noFaceViolations
                              return <div style={{ color: total === 0 ? '#22c55e' : total <= 3 ? '#f59e0b' : '#ef4444', fontWeight: 800, fontSize: '1.1rem' }}>{total}</div>
                            })()}
                          </div>
                        )}
                      </div>

                      {attemptDetail.attempt.monitoring && (
                        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '0.5rem', marginBottom: '1.4rem', fontSize: '0.72rem', color: '#888' }}>
                          <span>👁 Eye: <strong style={{ color: '#ddd' }}>{attemptDetail.attempt.monitoring.eyeViolations}</strong></span>
                          <span>·</span>
                          <span>Head: <strong style={{ color: '#ddd' }}>{attemptDetail.attempt.monitoring.headViolations}</strong></span>
                          <span>·</span>
                          <span>Mask: <strong style={{ color: '#ddd' }}>{attemptDetail.attempt.monitoring.maskViolations}</strong></span>
                          <span>·</span>
                          <span>No-face: <strong style={{ color: '#ddd' }}>{attemptDetail.attempt.monitoring.noFaceViolations}</strong></span>
                          <span>·</span>
                          <span>Lighting: <strong style={{ color: attemptDetail.attempt.monitoring.lightingOk ? '#22c55e' : '#ef4444' }}>{attemptDetail.attempt.monitoring.lightingLabel || (attemptDetail.attempt.monitoring.lightingOk ? 'OK' : 'Poor')}</strong></span>
                        </div>
                      )}

                      {/* Topic-based: full per-question breakdown */}
                      {attemptDetail.type === 'topic' && (
                        attemptDetail.attempt.responses.length === 0 ? (
                          <div style={{ color: '#444', textAlign: 'center', padding: '1.5rem 0', fontSize: '0.85rem' }}>No responses recorded</div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {attemptDetail.attempt.responses.map((r, i) => (
                              <div key={i} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 12, padding: '0.9rem 1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                                  <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.82rem' }}>Q{i + 1}. {r.question}</div>
                                  <span style={{
                                    background: `${scoreColor(r.rating?.total * 10)}18`, color: scoreColor(r.rating?.total * 10),
                                    border: `1px solid ${scoreColor(r.rating?.total * 10)}33`, borderRadius: 6,
                                    padding: '2px 9px', fontSize: '0.72rem', fontWeight: 700, flexShrink: 0,
                                  }}>
                                    {r.rating?.total ?? 0}/10
                                  </span>
                                </div>
                                {r.answer && <div style={{ color: '#aaa', fontSize: '0.78rem', marginBottom: 8, whiteSpace: 'pre-wrap' as const }}>{r.answer}</div>}
                                {r.feedback && (
                                  <div style={{ fontSize: '0.76rem', color: '#888', marginBottom: 4 }}>
                                    <span style={{ color: '#ff6b00', fontWeight: 600 }}>Feedback: </span>{r.feedback}
                                  </div>
                                )}
                                {r.idealAnswer && (
                                  <div style={{ fontSize: '0.76rem', color: '#888', marginBottom: 4 }}>
                                    <span style={{ color: '#22c55e', fontWeight: 600 }}>Ideal answer: </span>{r.idealAnswer}
                                  </div>
                                )}
                                {r.improvementTips?.length > 0 && (
                                  <div style={{ fontSize: '0.76rem', color: '#888' }}>
                                    <span style={{ color: '#818cf8', fontWeight: 600 }}>Tips: </span>{r.improvementTips.join(' · ')}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )
                      )}

                      {/* Resume-based: question + score list */}
                      {attemptDetail.type === 'resume' && (
                        attemptDetail.attempt.scores.length === 0 ? (
                          <div style={{ color: '#444', textAlign: 'center', padding: '1.5rem 0', fontSize: '0.85rem' }}>Not yet scored</div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            {attemptDetail.attempt.scores.map((s, i) => (
                              <div key={i} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10, padding: '0.7rem 0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                                <div style={{ color: '#ddd', fontSize: '0.8rem' }}>Q{i + 1}. {s.question}</div>
                                <span style={{
                                  background: `${scoreColor(s.score * 10)}18`, color: scoreColor(s.score * 10),
                                  border: `1px solid ${scoreColor(s.score * 10)}33`, borderRadius: 6,
                                  padding: '2px 9px', fontSize: '0.72rem', fontWeight: 700, flexShrink: 0,
                                }}>
                                  {s.score}/10
                                </span>
                              </div>
                            ))}
                          </div>
                        )
                      )}
                    </>
                  )}
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
