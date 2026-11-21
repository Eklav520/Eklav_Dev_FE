import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Spinner } from 'react-bootstrap'
import {
  FaMicrophone, FaPencilAlt, FaBook, FaHeadphones, FaBolt, FaLanguage,
  FaSearch, FaArrowUp, FaArrowDown, FaMinus, FaDownload, FaUserGraduate, FaCheckCircle,
  FaBookOpen, FaRandom, FaTheaterMasks, FaSpellCheck, FaLayerGroup, FaFilePdf
} from 'react-icons/fa'
import * as XLSX from 'xlsx'
import { useAuthContext } from '@/context/useAuthContext'
import { exportBrandedPdf } from './moduleOverview/brandedPdf'
import { ReportPagination, ScoreBar, StatusPill, StudentCell, ViewButton } from './moduleOverview/ReportCells'
import { HeaderSelect } from './StudentReports'
import { CohortFilters, withCohort } from './moduleOverview/cohort'
import { ReportRangeSelect, useReportRange } from './moduleOverview/range'
import ReportDrawer from './moduleOverview/ReportDrawer'

// Card footnote colour: grey stays the Student Reports rule grey, trend colours keep their meaning
const dimAccent = (c: string) => (/^#(888|999|666|555|aaa)$/i.test(c) ? '#8a9097' : c)

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

/* ─── LSRW Practice types — separate structured/pattern-based exam flow
   (student/lsrw-communication), distinct from the simple tools above ──── */
type LSRWSectionStat = { key: string; label: string; attempts: number; avgScore: number; studentsUsed: number }
type LSRWOverview = {
  totalAttempts: number
  completedAttempts: number
  uniqueStudents: number
  patternBreakdown: { 1: number; 2: number }
  sections: LSRWSectionStat[]
}
type LSRWSectionEntry = { scoreAwarded: number; marks: number; status: string } | undefined
type LSRWStudentRow = {
  userId: string
  name: string
  email: string
  sections: Record<string, LSRWSectionEntry>
  patterns: number[]
  attempts: number
  overallAvg: number | null
  lastActivity: string | null
}

/* ─── LSRW per-student attempt drill-down (the "View" modal) ────────── */
type LSRWAttemptSection = { sectionKey: string; label: string; marks: number; scoreAwarded: number | null; status: string; completedAt: string | null }
type LSRWAttempt = {
  attemptId: string
  patternKey: number
  status: string
  startedAt: string
  completedAt: string | null
  totalScoreAwarded: number
  totalMarks: number
  sections: LSRWAttemptSection[]
}
type LSRWAttemptsResponse = { student: { userId: string; name: string; email: string }; attempts: LSRWAttempt[] }

/* ─── Constants ─────────────────────────────────────────── */
const SKILLS = [
  { key: 'speaking',  label: 'Speaking',     icon: FaMicrophone, color: '#3b82f6' },
  { key: 'writing',   label: 'Writing',       icon: FaPencilAlt,  color: '#f59e0b' },
  { key: 'reading',   label: 'Reading',       icon: FaBook,       color: '#22c55e' },
  { key: 'listening', label: 'Listening',     icon: FaHeadphones, color: '#a855f7' },
  { key: 'jam',       label: 'Just a Minute', icon: FaBolt,       color: '#ef4444' },
] as const

type SkillKey = (typeof SKILLS)[number]['key']

const LSRW_SECTIONS = [
  { key: 'listeningReading', label: 'Listening + Reading', icon: FaHeadphones,    color: '#3b82f6' },
  { key: 'speaking',         label: 'Speaking',            icon: FaMicrophone,    color: '#a855f7' },
  { key: 'passages',         label: 'Reading Passages',    icon: FaBookOpen,      color: '#22c55e' },
  { key: 'jumbled',          label: 'Jumbled Sentences',   icon: FaRandom,        color: '#f59e0b' },
  { key: 'storytelling',     label: 'Story Telling',       icon: FaTheaterMasks,  color: '#ec4899' },
  { key: 'grammar',          label: 'Grammar',             icon: FaSpellCheck,    color: '#ef4444' },
] as const

// Pattern 1 and Pattern 2 are NOT the same 6 sections — each pattern is its
// own fixed 4-section sequence (student/lsrw-communication/sectionsConfig.ts,
// PATTERN_SECTIONS — kept in sync with the backend's lsrwPatternConfig.js).
// Showing all 6 rows under both patterns would misleadingly show dashes for
// sections that pattern never even includes.
const LSRW_PATTERN_SECTION_KEYS: Record<1 | 2, string[]> = {
  1: ['listeningReading', 'speaking', 'grammar', 'passages'],
  2: ['listeningReading', 'jumbled', 'grammar', 'storytelling'],
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

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
  card:  { background: '#0e1012', border: '1px solid #272a2e', borderRadius: 12 } as React.CSSProperties,
  th:    { background: '#111', color: '#555', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, padding: '0.7rem 0.9rem', textAlign: 'left' as const, borderBottom: '1px solid #202326', whiteSpace: 'nowrap' as const },
  td:    { padding: '0.65rem 0.9rem', borderBottom: '1px solid #202326', color: '#e0e0e0', fontSize: '0.8rem', whiteSpace: 'nowrap' as const } as React.CSSProperties,
  tdMut: { padding: '0.65rem 0.9rem', borderBottom: '1px solid #202326', color: '#aaa', fontSize: '0.76rem', whiteSpace: 'nowrap' as const } as React.CSSProperties,
  select: {
    background: '#111', border: '1px solid #2a2a2a', color: '#fff', borderRadius: 8, padding: '6px 26px 6px 12px', fontSize: '0.82rem', cursor: 'pointer',
    appearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23888' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
  } as React.CSSProperties,
  searchInput: { background: '#111', border: '1px solid #2a2a2a', color: '#fff', borderRadius: 8, padding: '6px 12px 6px 28px', fontSize: '0.82rem', width: 200 } as React.CSSProperties,
  footer: { background: '#111', borderTop: '1px solid #25282b', color: '#555', fontSize: '0.78rem', borderRadius: '0 0 14px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: '0.5rem', padding: '0.75rem 1.25rem' } as React.CSSProperties,
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
const EnglishPracticeFull = ({ apiBase = '/api/institute', view = 'practice' }: { apiBase?: string; view?: 'practice' | 'lsrw' }) => {
  const { user } = useAuthContext()
  // Date range shared by every report tab (default: till now)
  const range = useReportRange()
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
  const [appliedStart, setAppliedStart] = useState(range.from)
  const [appliedEnd, setAppliedEnd]     = useState(range.to)
  const isCustom = true // the shared date range always supplies start / end dates

  const applyCustomRange = () => {
    setAppliedStart(customStart)
    setAppliedEnd(customEnd)
  }

  const rangeParams = (): Record<string, string> =>
    isCustom ? { startDate: appliedStart, endDate: appliedEnd } : { monthKey }

  const [students, setStudents]   = useState<StudentRow[]>([])
  const [pagination, setPag]      = useState<Pagination>({ total: 0, page: 1, limit: 10, totalPages: 1 })
  const [studLoading, setStudLoad] = useState(false)

  // English Practice and LSRW Practice are separate dashboard tabs; this component renders one of them
  const tab: 'students' | 'lsrw' = view === 'lsrw' ? 'lsrw' : 'students'
  const [search, setSearch]     = useState('')
  const [skill, setSkill]       = useState<SkillKey | ''>('')
  const [page, setPage]         = useState(1)
  const [limit, setLimit]       = useState(10)

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
      limit: String(opts.limit ?? 10),
      search: opts.search ?? '',
      skill:  opts.skill  ?? '',
      ...rangeParams(),
    })
    try {
      const res  = await fetch(`${baseURL}${apiBase}/english-practice-students?${withCohort(params)}`, {
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

  /* ── LSRW Practice tab — separate data source (LSRWPatternAttempt), only
     fetched once that tab is opened ─────────────────────────────────── */
  const [lsrwOverview, setLsrwOverview]   = useState<LSRWOverview | null>(null)
  const [lsrwOvLoading, setLsrwOvLoading] = useState(false)
  const [lsrwStudents, setLsrwStudents]   = useState<LSRWStudentRow[]>([])
  const [lsrwPag, setLsrwPag]             = useState<Pagination>({ total: 0, page: 1, limit: 10, totalPages: 1 })
  const [lsrwStudLoading, setLsrwStudLoad] = useState(false)
  const [lsrwSearch, setLsrwSearch]       = useState('')
  const [lsrwPage, setLsrwPage]           = useState(1)
  const lsrwSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchLsrwOverview = useCallback(async () => {
    if (!user?.token) return
    if (rangeMode === 'custom' && !isCustom) return
    setLsrwOvLoading(true)
    const params = new URLSearchParams(rangeParams())
    try {
      const res = await fetch(`${baseURL}${apiBase}/lsrw-overview?${params}`, { headers: { Authorization: `Bearer ${user.token}` } })
      const data = await res.json()
      if (data.success) setLsrwOverview(data)
    } catch (err) { console.error(err) }
    finally { setLsrwOvLoading(false) }
  }, [user?.token, baseURL, apiBase, monthKey, isCustom, appliedStart, appliedEnd, rangeMode])

  const fetchLsrwStudents = useCallback(async (opts: { page?: number; search?: string } = {}) => {
    if (!user?.token) return
    if (rangeMode === 'custom' && !isCustom) return
    setLsrwStudLoad(true)
    const params = new URLSearchParams({ page: String(opts.page ?? 1), limit: '10', search: opts.search ?? '', includeAll: '1', ...rangeParams() })
    try {
      const res = await fetch(`${baseURL}${apiBase}/lsrw-students?${withCohort(params)}`, { headers: { Authorization: `Bearer ${user.token}` } })
      const data = await res.json()
      if (data.success) {
        setLsrwStudents(data.students)
        setLsrwPag({ total: data.total, page: data.page, limit: data.limit, totalPages: Math.max(1, Math.ceil(data.total / data.limit)) })
      }
    } catch (err) { console.error(err) }
    finally { setLsrwStudLoad(false) }
  }, [user?.token, baseURL, apiBase, monthKey, isCustom, appliedStart, appliedEnd, rangeMode])

  useEffect(() => {
    if (tab === 'lsrw') { fetchLsrwOverview(); fetchLsrwStudents({ page: lsrwPage, search: lsrwSearch }) }
  }, [tab, lsrwPage, monthKey, isCustom, appliedStart, appliedEnd, rangeMode]) // eslint-disable-line

  const onLsrwSearch = (val: string) => {
    setLsrwSearch(val)
    if (lsrwSearchTimer.current) clearTimeout(lsrwSearchTimer.current)
    lsrwSearchTimer.current = setTimeout(() => {
      setLsrwPage(1)
      fetchLsrwStudents({ page: 1, search: val })
    }, 400)
  }

  /* ── LSRW per-student attempt drill-down — the "View" modal, showing
     every attempt (not just each section's best score) ────────────── */
  const [lsrwAttemptsData, setLsrwAttemptsData] = useState<LSRWAttemptsResponse | null>(null)
  const [lsrwAttemptsLoading, setLsrwAttemptsLoading] = useState(false)
  const [lsrwAttemptsError, setLsrwAttemptsError] = useState('')
  const [lsrwModalStudentId, setLsrwModalStudentId] = useState('')
  // Independent of the page's Month/Year — starts out matching it, but the
  // modal has its own Date Range + Apply so admin can look further back
  // without changing what the rest of the tab is scoped to.
  const [lsrwModalStart, setLsrwModalStart] = useState('')
  const [lsrwModalEnd, setLsrwModalEnd] = useState('')
  const [lsrwModalAppliedStart, setLsrwModalAppliedStart] = useState('')
  const [lsrwModalAppliedEnd, setLsrwModalAppliedEnd] = useState('')
  const [lsrwModalPatternTab, setLsrwModalPatternTab] = useState<1 | 2>(1)

  const fetchLsrwAttempts = async (studentId: string, rangeOverride?: Record<string, string>) => {
    if (!user?.token) return
    setLsrwAttemptsError('')
    setLsrwAttemptsLoading(true)
    try {
      const params = new URLSearchParams({ studentId, ...(rangeOverride ?? rangeParams()) })
      const res = await fetch(`${baseURL}${apiBase}/lsrw-student-attempts?${params}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      })
      const data = await res.json()
      if (data.success) setLsrwAttemptsData(data)
      else setLsrwAttemptsError(data.message || 'Failed to load attempts')
    } catch (err) {
      console.error(err)
      setLsrwAttemptsError('Network error')
    } finally {
      setLsrwAttemptsLoading(false)
    }
  }

  const openLsrwAttempts = (studentId: string) => {
    setLsrwModalStudentId(studentId)
    setLsrwAttemptsData(null)
    setLsrwModalStart('')
    setLsrwModalEnd('')
    setLsrwModalAppliedStart('')
    setLsrwModalAppliedEnd('')
    setLsrwModalPatternTab(1)
    fetchLsrwAttempts(studentId)
  }
  const applyLsrwModalRange = () => {
    setLsrwModalAppliedStart(lsrwModalStart)
    setLsrwModalAppliedEnd(lsrwModalEnd)
    if (!lsrwModalStart || !lsrwModalEnd) return
    fetchLsrwAttempts(lsrwModalStudentId, { startDate: lsrwModalStart, endDate: lsrwModalEnd })
  }
  const clearLsrwModalRange = () => {
    setLsrwModalStart(''); setLsrwModalEnd(''); setLsrwModalAppliedStart(''); setLsrwModalAppliedEnd('')
    fetchLsrwAttempts(lsrwModalStudentId)
  }
  const closeLsrwAttempts = () => { setLsrwAttemptsData(null); setLsrwAttemptsError(''); setLsrwModalStudentId('') }

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

  const handleExportExcel = async (format: 'excel' | 'pdf' = 'excel') => {
    if (!user?.token) return
    setExporting(true)
    try {
      const params = new URLSearchParams({ page: '1', limit: '9999', search, skill, ...rangeParams() })
      const res = await fetch(`${baseURL}${apiBase}/english-practice-students?${withCohort(params)}`, {
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
      if (format === 'pdf') {
        await exportBrandedPdf({ title: 'English Practice', subtitle: isCustom ? `${appliedStart} to ${appliedEnd}` : String(monthKey), rows, fileName: `English_Practice_${isCustom ? `${appliedStart}_to_${appliedEnd}` : monthKey}` })
        return
      }
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
        <div className="sr-heading">
          <span className="sr-heading-icon"><FaLanguage /></span>
          <div>
            <h2>{view === 'lsrw' ? 'LSRW Practice' : 'English Practice'}</h2>
            <p>{view === 'lsrw' ? 'Structured listening, speaking, reading and writing tests, by student and section' : 'Track students’ English skills practice and performance'}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' as const, alignItems: 'center' }}>
          <ReportRangeSelect />

          {view !== 'lsrw' && (
            <>
              <button type="button" className="sr-export-button" onClick={() => handleExportExcel('pdf')} disabled={exporting}>
                <FaFilePdf /> {exporting ? 'Preparing PDF…' : 'Export PDF'}
              </button>
            </>
          )}
        </div>
      </div>

      {view !== 'lsrw' && (
        <>
      {/* ── Stat Cards ─────────────────────────────────── */}
      <section className="sr-summary dr-summary">
        <article className="sr-summary-card sr-card-orange">
          <span className="sr-summary-icon sr-icon-orange"><FaUserGraduate /></span>
          <div>
            <strong>{overview.totalStudents}</strong>
            <span>Total Students</span>
            <em className="sr-summary-rule" style={{ color: dimAccent('#22c55e') }}>↑ {overview.newStudentsThisMonth} this month</em>
          </div>
        </article>

        <article className="sr-summary-card sr-card-blue">
          <span className="sr-summary-icon sr-icon-blue"><FaCheckCircle /></span>
          <div>
            <strong>{overview.activeStudents}</strong>
            <span>Active Students</span>
            <em className="sr-summary-rule" style={{ color: dimAccent(cmp.activeStudents >= 0 ? '#22c55e' : '#ef4444') }}>{cmp.activeStudents >= 0 ? '↑' : '↓'} {Math.abs(cmp.activeStudents)} vs {cmp.label}</em>
          </div>
        </article>

        <article className="sr-summary-card sr-card-purple">
          <span className="sr-summary-icon sr-icon-purple"><FaHeadphones /></span>
          <div>
            <strong>{overview.totalAttempts.toLocaleString()}</strong>
            <span>Total Attempts</span>
            <em className="sr-summary-rule" style={{ color: dimAccent(cmp.totalAttempts >= 0 ? '#22c55e' : '#ef4444') }}>{cmp.totalAttempts >= 0 ? '↑' : '↓'} {Math.abs(cmp.totalAttempts)} vs {cmp.label}</em>
          </div>
        </article>

        <article className="sr-summary-card sr-card-amber">
          <span className="sr-summary-icon sr-icon-amber"><FaBook /></span>
          <div>
            <strong>{overview.monthlyCapacity.toLocaleString()}</strong>
            <span>Monthly Capacity</span>
            <em className="sr-summary-rule" style={{ color: dimAccent('#999') }}>{overview.approvedStudents} students × 30</em>
          </div>
        </article>

        <article className="sr-summary-card sr-card-green">
          <span className="sr-summary-icon sr-icon-green"><FaCheckCircle /></span>
          <div>
            <strong>{overview.overallUtilizationPct}%</strong>
            <span>Overall Utilization</span>
            <em className="sr-summary-rule" style={{ color: dimAccent(cmp.overallUtilizationPct >= 0 ? '#22c55e' : '#ef4444') }}>{cmp.overallUtilizationPct >= 0 ? '↑' : '↓'} {Math.abs(cmp.overallUtilizationPct)}% vs {cmp.label}</em>
          </div>
        </article>
      </section>

      {/* ── Skill utilization (Student Reports panel) ── */}
      {(() => {
        const ranked = [...SKILLS].sort((a, b) => overview.skills[b.key].utilizationPct - overview.skills[a.key].utilizationPct)
        const topKey = overview.skills[ranked[0].key].utilized > 0 ? ranked[0].key : null
        return (
          <section className="sr-table-panel dr-panel" style={{ marginBottom: '1.1rem' }}>
            <div className="dr-panel-head">
              <div><h3>Skill Utilization</h3><p>{range.label} · practice sessions used of the allowance in this period</p></div>
            </div>
            <div className="dr-panel-body dr-skill-grid">
              {SKILLS.map(({ key, label, icon: Icon, color }) => {
                const st = overview.skills[key]
                return (
                  <div key={key} className="dr-type" style={{ ['--c' as string]: color }}>
                    <div className="dr-type-head">
                      <span className="dr-type-icon"><Icon /></span>
                      <div><strong>{label}</strong><small>{st.studentsUsed ?? 0} student{(st.studentsUsed ?? 0) === 1 ? '' : 's'} practised</small></div>
                      {topKey === key && <span className="sr-status-pill sr-status-on-track">Most used</span>}
                    </div>
                    <div className="dr-skill-num"><b>{st.utilized.toLocaleString()}</b><span>of {st.capacity.toLocaleString()} sessions</span></div>
                    <div className="dr-band-bar"><i style={{ width: `${Math.min(100, st.utilizationPct)}%` }} /></div>
                    <div className="dr-type-stats">
                      <span><b>{st.utilizationPct}%</b> used</span>
                      <span>avg score <b style={{ color: st.avgScore > 0 ? scoreColor(st.avgScore) : undefined }}>{st.avgScore > 0 ? st.avgScore : '—'}</b></span>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )
      })()}

        </>
      )}

      {/* ── Students Performance (Student Reports table) ── */}
      {tab === 'students' && (
        <section className="sr-table-panel" aria-label="English practice by student">
          <div className="sr-toolbar">
            <div className="sr-search">
              <FaSearch aria-hidden="true" />
              <input aria-label="Search students" value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Search by name or email" />
            </div>
            <div className="sr-filters sr-report-filters">
              <CohortFilters />
              <HeaderSelect label="Filter by skill" prefix="Skill:" value={skill}
                options={[{ value: '', label: 'All' }, ...SKILLS.map((s) => ({ value: s.key, label: s.label }))]}
                onChange={onSkillFilter} />
              <span className="sr-result-count">{pagination.total} student{pagination.total === 1 ? '' : 's'} · {range.label}</span>
            </div>
          </div>

          <div className="sr-table-scroll" style={{ position: 'relative', overflowX: 'auto' }}>
            {studLoading && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                <Spinner animation="border" style={{ color: '#ff6b00', width: 24, height: 24 }} />
              </div>
            )}
            {/* Fixed layout: the five skills and Overall get equal columns */}
            <table style={{ width: '100%', minWidth: 1000, borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: 48 }} />
                <col style={{ width: '24%' }} />
                {SKILLS.map(({ key }) => <col key={key} />)}
                <col />
              </colgroup>
              <thead>
                <tr>
                  <th style={{ ...S.th, width: 40 }}>#</th>
                  <th style={{ ...S.th, minWidth: 220 }}>Student</th>
                  {SKILLS.map(({ key, label }) => <th key={key} style={{ ...S.th, minWidth: 110 }}>{label}</th>)}
                  <th style={{ ...S.th, minWidth: 110 }}>Overall</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr><td colSpan={8}>{!studLoading && <div className="sr-empty"><FaLanguage /><span>No students match these filters.</span></div>}</td></tr>
                ) : students.map((s, i) => {
                  const avg = overallAvg(s)
                  return (
                    <tr key={s.userId}>
                      <td style={S.tdMut}>{(pagination.page - 1) * pagination.limit + i + 1}</td>
                      <td style={S.td}><StudentCell name={s.name || s.email?.split('@')[0] || 'Student'} email={s.email} /></td>
                      {SKILLS.map(({ key }) => {
                        const e = s[key]
                        return (
                          <td key={key} style={S.td}>
                            {e ? <ScoreBar pct={e.bestScore} label={<>{e.bestScore}%<TrendIcon trend={e.trend} /></>} /> : <span className="dr-dot">·</span>}
                          </td>
                        )
                      })}
                      <td style={S.td}>{avg !== null ? <ScoreBar pct={avg} /> : <span className="dr-dot">·</span>}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <ReportPagination page={pagination.page} pageSize={pagination.limit} total={pagination.total} onPage={setPage} />
        </section>
      )}

      {/* ── LSRW Practice Tab — the separate structured/pattern-based exam
           flow (student/lsrw-communication), distinct from the simple
           practice tools tracked in the other two tabs ─────────────── */}
      {tab === 'lsrw' && (
        lsrwOvLoading || !lsrwOverview ? (
          <div className="d-flex justify-content-center align-items-center py-5">
            <Spinner animation="border" style={{ color: '#ff6b00' }} />
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <section className="sr-summary dr-summary">
              <article className="sr-summary-card sr-card-orange">
                <span className="sr-summary-icon sr-icon-orange"><FaCheckCircle /></span>
                <div>
                  <strong>{lsrwOverview.totalAttempts.toLocaleString()}</strong>
                  <span>Total Attempts</span>
                  <em className="sr-summary-rule" style={{ color: dimAccent('#999') }}>{lsrwOverview.completedAttempts} completed</em>
                </div>
              </article>
              <article className="sr-summary-card sr-card-blue">
                <span className="sr-summary-icon sr-icon-blue"><FaUserGraduate /></span>
                <div>
                  <strong>{lsrwOverview.uniqueStudents}</strong>
                  <span>Students Practiced</span>
                  <em className="sr-summary-rule" style={{ color: dimAccent('#999') }}>attempted ≥ 1 section</em>
                </div>
              </article>
              <article className="sr-summary-card sr-card-purple">
                <span className="sr-summary-icon sr-icon-purple"><FaLayerGroup /></span>
                <div>
                  <strong>{lsrwOverview.patternBreakdown[1] ?? 0}</strong>
                  <span>Pattern 1</span>
                  <em className="sr-summary-rule" style={{ color: dimAccent('#999') }}>attempts</em>
                </div>
              </article>
              <article className="sr-summary-card sr-card-green">
                <span className="sr-summary-icon sr-icon-green"><FaLayerGroup /></span>
                <div>
                  <strong>{lsrwOverview.patternBreakdown[2] ?? 0}</strong>
                  <span>Pattern 2</span>
                  <em className="sr-summary-rule" style={{ color: dimAccent('#999') }}>attempts</em>
                </div>
              </article>
            </section>

            {/* Section usage (Student Reports panel) */}
            <section className="sr-table-panel dr-panel" style={{ marginBottom: '1.1rem' }}>
              <div className="dr-panel-head">
                <div><h3>LSRW Sections</h3><p>{range.label} · attempts, students and average score per section</p></div>
              </div>
              <div className="dr-panel-body dr-lsrw-grid">
                {LSRW_SECTIONS.map(({ key, label, icon: Icon, color }) => {
                  const st = lsrwOverview.sections.find((x) => x.key === key)
                  const avg = st?.avgScore ?? 0
                  return (
                    <div key={key} className="dr-type" style={{ ['--c' as string]: color }}>
                      <div className="dr-type-head">
                        <span className="dr-type-icon"><Icon /></span>
                        <div><strong>{label}</strong><small>{st?.studentsUsed ?? 0} student{(st?.studentsUsed ?? 0) === 1 ? '' : 's'}</small></div>
                      </div>
                      <div className="dr-skill-num"><b>{(st?.attempts ?? 0).toLocaleString()}</b><span>attempt{(st?.attempts ?? 0) === 1 ? '' : 's'}</span></div>
                      <div className="dr-band-bar"><i style={{ width: `${Math.min(100, avg)}%`, background: avg > 0 ? scoreColor(avg) : undefined }} /></div>
                      <div className="dr-type-stats"><span>avg score <b style={{ color: avg > 0 ? scoreColor(avg) : undefined }}>{avg > 0 ? avg : '—'}</b></span></div>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* Students (Student Reports table) */}
            <section className="sr-table-panel" aria-label="LSRW results by student">
              <div className="sr-toolbar">
                <div className="sr-search">
                  <FaSearch aria-hidden="true" />
                  <input aria-label="Search students" value={lsrwSearch} onChange={(e) => onLsrwSearch(e.target.value)} placeholder="Search by name or email" />
                </div>
                <div className="sr-filters sr-report-filters">
                  <CohortFilters />
                  <span className="sr-result-count">{lsrwOverview.uniqueStudents} of {lsrwPag.total} attempted</span>
                </div>
              </div>

              <div className="sr-table-scroll" style={{ position: 'relative', overflowX: 'auto' }}>
                {lsrwStudLoading && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                    <Spinner animation="border" style={{ color: '#ff6b00', width: 24, height: 24 }} />
                  </div>
                )}
                <table style={{ width: '100%', minWidth: 1200, borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: 48 }} />
                    <col style={{ width: '20%' }} />
                    {LSRW_SECTIONS.map(({ key }) => <col key={key} />)}
                    <col />
                    <col style={{ width: 84 }} />
                    <col style={{ width: 120 }} />
                    <col style={{ width: 96 }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th style={S.th}>#</th>
                      <th style={S.th}>Student</th>
                      {LSRW_SECTIONS.map(({ key, label }) => <th key={key} style={S.th} title={label}>{label}</th>)}
                      <th style={S.th}>Overall</th>
                      <th style={S.th}>Attempts</th>
                      <th style={S.th}>Last Activity</th>
                      <th className="dr-actions" style={S.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lsrwStudents.length === 0 ? (
                      <tr><td colSpan={LSRW_SECTIONS.length + 6}>{!lsrwStudLoading && <div className="sr-empty"><FaHeadphones /><span>No students match these filters.</span></div>}</td></tr>
                    ) : lsrwStudents.map((s, i) => (
                      <tr key={s.userId} className={s.attempts ? undefined : 'dr-row-muted'}>
                        <td style={S.tdMut}>{(lsrwPag.page - 1) * lsrwPag.limit + i + 1}</td>
                        <td style={S.td}><StudentCell name={s.name || s.email?.split('@')[0] || 'Student'} email={s.email} minWidth={0} /></td>
                        {LSRW_SECTIONS.map(({ key }) => {
                          const e = s.sections[key]
                          return (
                            <td key={key} style={S.td}>
                              {e ? <ScoreBar pct={e.marks ? (e.scoreAwarded / e.marks) * 100 : 0} label={`${e.scoreAwarded}/${e.marks}`} /> : <span className="dr-dot">·</span>}
                            </td>
                          )
                        })}
                        <td style={S.td}>{!s.attempts ? <StatusPill tone="none">Not attended</StatusPill> : s.overallAvg !== null ? <ScoreBar pct={s.overallAvg} label={String(s.overallAvg)} /> : <span className="dr-dot">·</span>}</td>
                        <td style={S.td}><strong>{s.attempts}</strong></td>
                        <td style={S.tdMut}>{s.lastActivity ? new Date(s.lastActivity).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                        <td className="dr-actions" style={s.attempts ? S.td : S.tdMut}>{s.attempts ? <ViewButton onClick={() => openLsrwAttempts(s.userId)} /> : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ReportPagination page={lsrwPag.page} pageSize={lsrwPag.limit} total={lsrwPag.total} onPage={setLsrwPage} />
            </section>
          </>
        )
      )}

      {/* ── LSRW attempts for one student (side panel, like Student Reports) ── */}
      {(lsrwAttemptsLoading || lsrwAttemptsData || lsrwAttemptsError) && (() => {
        const row = lsrwStudents.find((x) => x.userId === lsrwModalStudentId)
        const who = lsrwAttemptsData?.student || { name: row?.name || 'Student', email: row?.email || '' }
        const all = lsrwAttemptsData?.attempts || []
        const p1 = all.filter((a) => a.patternKey === 1)
        const p2 = all.filter((a) => a.patternKey === 2)
        const pct = (a: { totalScoreAwarded: number; totalMarks: number }) => (a.totalMarks ? Math.round((a.totalScoreAwarded / a.totalMarks) * 100) : 0)
        const best = all.length ? Math.max(...all.map(pct)) : null
        const active = [...(lsrwModalPatternTab === 1 ? p1 : p2)].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
        const sectionMeta = (key: string) => LSRW_SECTIONS.find((x) => x.key === key)
        const colorOf = (p: number) => (p >= 75 ? '#22c55e' : p >= 50 ? '#f59e0b' : p > 0 ? '#ef4444' : '#3a3e43')
        return (
          <ReportDrawer
            name={who.name}
            email={who.email}
            badge={<StatusPill tone="pending">LSRW</StatusPill>}
            onClose={closeLsrwAttempts}
            stats={lsrwAttemptsData ? [
              { label: 'Attempts', value: all.length, tone: 'orange' },
              { label: 'Completed', value: all.filter((a) => a.status === 'completed').length, tone: 'green' },
              { label: 'Pattern 1', value: p1.length, tone: 'purple' },
              { label: 'Pattern 2', value: p2.length, tone: 'blue' },
              { label: 'Best score', value: best !== null ? `${best}%` : '—', tone: best === null ? 'plain' : best >= 75 ? 'green' : best >= 50 ? 'amber' : 'red' },
            ] : undefined}
            toolbar={<>
              <label>Date range</label>
              <input type="date" value={lsrwModalStart} max={lsrwModalEnd || undefined} onChange={(e) => setLsrwModalStart(e.target.value)} />
              <span className="rd-sep">–</span>
              <input type="date" value={lsrwModalEnd} min={lsrwModalStart || undefined} onChange={(e) => setLsrwModalEnd(e.target.value)} />
              <button type="button" className="rd-btn is-primary" onClick={applyLsrwModalRange} disabled={!lsrwModalStart || !lsrwModalEnd}>Apply</button>
              {(lsrwModalStart || lsrwModalEnd || lsrwModalAppliedStart || lsrwModalAppliedEnd) && <button type="button" className="rd-btn" onClick={clearLsrwModalRange}>Clear</button>}
            </>}
          >
            {lsrwAttemptsLoading && <div className="rd-empty"><Spinner animation="border" style={{ color: '#ff6b00', width: 22, height: 22 }} /><span>Loading attempts…</span></div>}
            {lsrwAttemptsError && <div className="rd-empty" style={{ color: '#fb737a' }}>{lsrwAttemptsError}</div>}
            {lsrwAttemptsData && !lsrwAttemptsLoading && (
              all.length === 0 ? (
                <div className="rd-empty"><FaHeadphones /><span>No LSRW attempts in this range</span></div>
              ) : (
                <>
                  <div className="dr-tabs" role="tablist">
                    {([1, 2] as const).map((p) => (
                      <button key={p} type="button" role="tab" aria-selected={lsrwModalPatternTab === p} className={lsrwModalPatternTab === p ? 'is-on' : ''} onClick={() => setLsrwModalPatternTab(p)}>
                        Pattern {p} <span style={{ opacity: 0.7 }}>· {(p === 1 ? p1 : p2).length}</span>
                      </button>
                    ))}
                  </div>
                  {active.length === 0 ? (
                    <div className="rd-empty"><FaHeadphones /><span>No Pattern {lsrwModalPatternTab} attempts in this range</span></div>
                  ) : (
                    <div className="rd-list">
                      {active.map((a, i) => {
                        const total = pct(a)
                        const started = new Date(a.startedAt)
                        return (
                          <div key={a.attemptId} className="rd-item rd-attempt-card">
                            {(() => {
                              const scored = a.sections.filter((x) => x.status !== 'pending' && x.scoreAwarded !== null)
                              const ringColor = colorOf(total)
                              return (
                                <>
                                  {/* Summary: score ring · when · status */}
                                  <div className="rd-attempt-head">
                                    <div className="rd-ring" style={{ background: `conic-gradient(${ringColor} ${total * 3.6}deg, #25282b 0deg)` }}>
                                      <span><b>{total}%</b></span>
                                    </div>
                                    <div className="rd-attempt-main">
                                      <div className="rd-attempt-line">
                                        <strong>Attempt {active.length - i}</strong>
                                        <StatusPill tone={a.status === 'completed' ? 'good' : 'mid'}>{a.status === 'completed' ? 'Completed' : 'In progress'}</StatusPill>
                                      </div>
                                      <small>
                                        {started.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} · {started.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                        {' · '}Pattern {a.patternKey}
                                      </small>
                                      <div className="rd-attempt-facts">
                                        <span><b>{a.totalScoreAwarded}</b> of {a.totalMarks} marks</span>
                                        <span><b>{scored.length}</b> of {a.sections.length} sections scored</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Section results, in the order the test runs */}
                                  <div className="rd-sec-table">
                                    <div className="rd-sec-head"><span>Section</span><span>Score</span><span>Marks</span></div>
                                    {a.sections.map((sec, n) => {
                                      const meta = sectionMeta(sec.sectionKey)
                                      const done = sec.status !== 'pending' && sec.scoreAwarded !== null
                                      const p = done && sec.marks ? Math.round(((sec.scoreAwarded as number) / sec.marks) * 100) : 0
                                      return (
                                        <div key={sec.sectionKey} className="rd-sec-row" style={{ ['--c' as string]: meta?.color || '#9da2a8' }}>
                                          <span className="rd-sec-name"><em>{n + 1}</em>{meta?.label || sec.label}</span>
                                          {done ? (
                                            <>
                                              <span className="rd-sec-bar"><span className="rd-sec-track"><i style={{ width: `${p}%`, background: colorOf(p) }} /></span><b style={{ color: colorOf(p) }}>{p}%</b></span>
                                              <span className="rd-sec-marks"><b>{sec.scoreAwarded}</b> / {sec.marks}</span>
                                            </>
                                          ) : (
                                            <>
                                              <span className="rd-sec-bar is-pending"><StatusPill tone="pending">Pending</StatusPill></span>
                                              <span className="rd-sec-marks">— / {sec.marks}</span>
                                            </>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                </>
                              )
                            })()}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              )
            )}
          </ReportDrawer>
        )
      })()}
    </div>
  )
}

export default EnglishPracticeFull
