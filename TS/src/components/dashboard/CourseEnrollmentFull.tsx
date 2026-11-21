import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Spinner } from 'react-bootstrap'
import {
  FaBookOpen, FaCalendarAlt, FaCheckCircle, FaDownload, FaGraduationCap,
  FaSearch, FaTrophy, FaUserGraduate, FaFilePdf, FaChevronLeft, FaChevronRight
} from 'react-icons/fa'
import ReactApexChart from 'react-apexcharts'
import * as XLSX from 'xlsx'
import { useAuthContext } from '@/context/useAuthContext'
import { exportBrandedPdf } from './moduleOverview/brandedPdf'
import { ScoreBar, StatusPill, StudentCell, ViewButton, ReportPagination } from './moduleOverview/ReportCells'
import { HeaderSelect, toOptions } from './StudentReports'
import { CohortFilters, withCohort } from './moduleOverview/cohort'
import ReportDrawer from './moduleOverview/ReportDrawer'
import { ReportRangeSelect, useReportRange } from './moduleOverview/range'

// Card footnote colour: grey stays the Student Reports rule grey, trend colours keep their meaning
const dimAccent = (c: string) => (/^#(888|999|666|555|aaa)$/i.test(c) ? '#8a9097' : c)

/* ─── Types ─────────────────────────────────────────────── */
type CourseOption = { courseId: string; title: string }

type Summary = {
  totalCourses: number
  totalStudents: number
  totalEnrollments: number
  avgCompletion: number
  studentsEnrolledCount: number
  completedThisMonth: number
  avgProgressTrendPct: number
}

type Distribution = { notStarted: number; inProgress: number; midProgress: number; completed: number }
type TopCourse = {
  courseId: string
  title: string
  image: string | null
  enrolledCount: number
  notEnrolledCount: number
  completedCount: number
  inProgressCount: number
  notStartedCount: number
  avgCompletion: number
}

type Row = {
  userId: string
  name: string
  email: string
  department: string
  courseId: string
  courseTitle: string
  courseImage: string | null
  enrolledOn: string | null
  lastAccess: string | null
  progress: number
  lessonsCompleted: number
  lessonsTotal: number
  quizScore: number | null
  status: 'Completed' | 'In Progress' | 'Not Started'
}

type SortBy = 'enrolledOn' | 'progress' | 'lastAccess' | 'quizScore' | 'lessonsCompleted' | 'name'
type SortOrder = 'asc' | 'desc'
type DateRangeMode = 'today' | '7d' | '30d' | 'custom'

type StudentGroup = {
  userId: string
  name: string
  email: string
  department: string
  courses: Row[]
  courseCount: number
  avgProgress: number
  lessonsCompleted: number
  lessonsTotal: number
  avgQuizScore: number | null
  lastAccess: string | null
  enrolledOn: string | null
  status: 'Completed' | 'In Progress' | 'Not Started'
}

const EMPTY_SUMMARY: Summary = {
  totalCourses: 0, totalStudents: 0, totalEnrollments: 0, avgCompletion: 0,
  studentsEnrolledCount: 0, completedThisMonth: 0, avgProgressTrendPct: 0,
}
const EMPTY_DIST: Distribution = { notStarted: 0, inProgress: 0, midProgress: 0, completed: 0 }

/* ─── Helpers ────────────────────────────────────────────── */
const truncate = (s: string, n = 40) => (s.length > n ? s.slice(0, n) + '…' : s)

const toDateStr = (d = new Date()) => d.toISOString().slice(0, 10)
const defaultEnd = () => toDateStr()
const defaultStart = () => {
  const d = new Date()
  d.setDate(d.getDate() - 6)
  return toDateStr(d)
}

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const fmtHeaderDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

const fmtDateTime = (d: string | null) =>
  d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'

const initials = (name: string) => name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || '?'

const statusStyle = (status: Row['status']) => {
  if (status === 'Completed') return { bg: 'rgba(34,197,94,0.15)', text: '#22c55e' }
  if (status === 'In Progress') return { bg: 'rgba(255,107,0,0.15)', text: '#ff6b00' }
  return { bg: 'rgba(100,100,100,0.15)', text: '#888' }
}

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
  filterLabel: { color: '#777', fontSize: '0.66rem', fontWeight: 600, whiteSpace: 'nowrap' as const },
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
  applyBtn: { background: '#ff6b00', border: 'none', color: '#fff', fontWeight: 600, borderRadius: '8px', padding: '6px 18px', fontSize: '0.82rem', cursor: 'pointer' } as React.CSSProperties,
  resetBtn: { background: 'transparent', border: '1px solid #2a2a2a', color: '#aaa', fontWeight: 600, borderRadius: '8px', padding: '6px 16px', fontSize: '0.82rem', cursor: 'pointer' } as React.CSSProperties,
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
  thSortable: { cursor: 'pointer', userSelect: 'none' as const },
  td: { padding: '0.55rem 0.5rem', borderBottom: '1px solid #202326', color: '#e0e0e0', fontSize: '0.78rem', whiteSpace: 'nowrap' as const } as React.CSSProperties,
  tdMuted: { padding: '0.55rem 0.5rem', borderBottom: '1px solid #202326', color: '#555', fontSize: '0.74rem', whiteSpace: 'nowrap' as const } as React.CSSProperties,
  footer: {
    background: '#111315', borderTop: '1px solid #25282b', color: '#858a90', fontSize: '0.72rem',
    borderRadius: '0 0 12px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    flexWrap: 'wrap' as const, gap: '0.5rem', padding: '0.75rem 1.25rem',
  } as React.CSSProperties,
}

/* ─── Sortable header cell ───────────────────────────────── */
const SortableTh = ({ label, sortKey, sortBy, sortOrder, onClick, style }: {
  label: string; sortKey: SortBy; sortBy: SortBy; sortOrder: SortOrder
  onClick: (key: SortBy) => void; style?: React.CSSProperties
}) => (
  <th style={{ ...S.th, ...S.thSortable, ...style }} onClick={() => onClick(sortKey)}>
    {label} {sortBy === sortKey && (sortOrder === 'asc' ? '▲' : '▼')}
  </th>
)

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

/* ─── Progress bar cell ──────────────────────────────────── */
const ProgressCell = ({ pct }: { pct: number }) => {
  const color = pct >= 100 ? '#22c55e' : pct > 0 ? '#ff6b00' : '#333'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 100 }}>
      <div style={{ flex: 1, background: '#2a2a2a', borderRadius: 4, height: 6, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, background: color, height: '100%', borderRadius: 4 }} />
      </div>
      <span style={{ color, fontSize: '0.74rem', fontWeight: 700, minWidth: 30 }}>{pct}%</span>
    </div>
  )
}

/* ─── Main Component ─────────────────────────────────────── */
const CourseEnrollmentFull = ({ apiBase = '/api/institute' }: { apiBase?: string }) => {
  const { user } = useAuthContext()
  // Date range shared by every report tab (default: till now)
  const range = useReportRange()
  const baseURL = import.meta.env.VITE_API_BASE_URL

  // Overview
  const [summary, setSummary] = useState<Summary>(EMPTY_SUMMARY)
  const [courseOptions, setCourseOptions] = useState<CourseOption[]>([])
  const [distribution, setDistribution] = useState<Distribution>(EMPTY_DIST)
  const [topCourses, setTopCourses] = useState<TopCourse[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // Date range (drives the summary cards' "vs start of range" comparison)
  const [dateRangeMode, setDateRangeMode] = useState<DateRangeMode>('7d')
  const [startDate, setStartDate] = useState(range.from)
  const [endDate, setEndDate] = useState(range.to)
  const [appliedStart, setAppliedStart] = useState(range.from)
  const [appliedEnd, setAppliedEnd] = useState(range.to)

  // Table state
  const [rows, setRows] = useState<Row[]>([])
  // Students in scope with no enrolment yet (listed after the enrolled ones, as Not enrolled)
  const [notEnrolled, setNotEnrolled] = useState<{ userId: string; name: string; email: string; department: string }[]>([])
  const [tableLoading, setTableLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [sortBy, setSortBy] = useState<SortBy>('enrolledOn')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  // Live search
  const [search, setSearch] = useState('')
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Draft vs applied filters
  const [filterCourse, setFilterCourse] = useState('')
  const [appliedCourse, setAppliedCourse] = useState('')
  const [draftDepartment, setDraftDepartment] = useState('')
  const [appliedDepartment, setAppliedDepartment] = useState('')
  const [draftProgress, setDraftProgress] = useState<[number, number]>([0, 100])
  const [appliedProgress, setAppliedProgress] = useState<[number, number]>([0, 100])

  const [exporting, setExporting] = useState(false)
  const [viewStudent, setViewStudent] = useState<StudentGroup | null>(null)

  /* ── Fetch overview ─────────────────────────────────── */
  useEffect(() => {
    if (!user?.token) return
    setLoading(true)
    const params = new URLSearchParams({ startDate: appliedStart, endDate: appliedEnd })
    fetch(`${baseURL}${apiBase}/course-enrollment-overview?${params}`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setSummary(data.summary)
          setCourseOptions(data.courses.map((c: any) => ({ courseId: c.courseId, title: c.title })))
          setDistribution(data.distribution)
          setTopCourses(data.courses)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
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

  /* ── Fetch table rows ───────────────────────────────────────────
     Fetches ALL matching enrollment rows in one batch (not server-paginated)
     so they can be grouped into one row per student on the client — a
     student enrolled in many courses would otherwise show up as many
     duplicate rows under the old flat-per-enrollment table. Page/limit here
     apply only to the grouped student list, entirely client-side. ── */
  const FETCH_ALL_LIMIT = 5000
  const fetchRows = useCallback(async (opts: {
    search?: string; courseId?: string; department?: string
    minProgress?: number; maxProgress?: number; sortBy?: SortBy; order?: SortOrder
  } = {}) => {
    if (!user?.token) return
    setTableLoading(true)
    const params = new URLSearchParams({
      page: '1',
      limit: String(FETCH_ALL_LIMIT),
      search: opts.search ?? search,
      courseId: opts.courseId ?? appliedCourse,
      department: opts.department ?? appliedDepartment,
      minProgress: String(opts.minProgress ?? appliedProgress[0]),
      maxProgress: String(opts.maxProgress ?? appliedProgress[1]),
      sortBy: opts.sortBy ?? sortBy,
      order: opts.order ?? sortOrder,
      includeAll: '1',
    })
    try {
      const res = await fetch(`${baseURL}${apiBase}/course-enrollment-students?${withCohort(params)}`, { headers: { Authorization: `Bearer ${user.token}` } })
      const data = await res.json()
      if (data.success) {
        setRows(data.rows)
        setNotEnrolled(data.notEnrolled || [])
        if (data.departments) setDepartments(data.departments)
      }
    } catch (err) { console.error(err) }
    finally { setTableLoading(false) }
  }, [user?.token, baseURL, apiBase, search, appliedCourse, appliedDepartment, appliedProgress, sortBy, sortOrder]) // eslint-disable-line

  useEffect(() => {
    fetchRows()
  }, []) // eslint-disable-line

  const onSearchChange = (val: string) => {
    setSearch(val)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setPage(1)
      fetchRows({ search: val })
    }, 400)
  }

  const PROGRESS_BANDS: Record<string, [number, number]> = { '': [0, 100], 'not-started': [0, 0], low: [1, 49], mid: [50, 79], done: [80, 100] }
  const progressBand = Object.keys(PROGRESS_BANDS).find((k) => PROGRESS_BANDS[k][0] === appliedProgress[0] && PROGRESS_BANDS[k][1] === appliedProgress[1]) ?? ''
  const applyNow = (next: { course?: string; department?: string; band?: string }) => {
    const course = next.course ?? appliedCourse
    const department = next.department ?? appliedDepartment
    const range = next.band !== undefined ? PROGRESS_BANDS[next.band] : appliedProgress
    setFilterCourse(course); setAppliedCourse(course)
    setDraftDepartment(department); setAppliedDepartment(department)
    setDraftProgress(range); setAppliedProgress(range)
    setPage(1)
    fetchRows({ courseId: course, department, minProgress: range[0], maxProgress: range[1] })
  }

  const onSortChange = (key: SortBy) => {
    // Sorting happens entirely client-side over the already-grouped student
    // list — no need to refetch, since every row is already loaded.
    const nextOrder: SortOrder = sortBy === key && sortOrder === 'desc' ? 'asc' : 'desc'
    setSortBy(key); setSortOrder(nextOrder)
  }

  const handleExportExcel = async (format: 'excel' | 'pdf' = 'excel') => {
    if (!user?.token) return
    setExporting(true)
    try {
      const params = new URLSearchParams({
        page: '1', limit: '9999', search, courseId: appliedCourse, department: appliedDepartment,
        minProgress: String(appliedProgress[0]), maxProgress: String(appliedProgress[1]),
        sortBy, order: sortOrder,
      })
      const res = await fetch(`${baseURL}${apiBase}/course-enrollment-students?${withCohort(params)}`, { headers: { Authorization: `Bearer ${user.token}` } })
      const data = await res.json()
      if (!data.success) return
      const exportRows = data.rows.map((r: Row, i: number) => ({
        '#': i + 1,
        Student: r.name,
        Email: r.email,
        Department: r.department,
        Course: r.courseTitle,
        'Enrolled On': fmtDate(r.enrolledOn),
        'Last Access': fmtDateTime(r.lastAccess),
        'Progress (%)': r.progress,
        'Lessons Completed': `${r.lessonsCompleted}/${r.lessonsTotal}`,
        'Quiz Score (%)': r.quizScore ?? '—',
        Status: r.status,
      }))
      if (format === 'pdf') {
        await exportBrandedPdf({ title: 'Course Progress', subtitle: 'Student progress across enrolled courses', rows: exportRows, fileName: `Student_Course_Progress_${new Date().toISOString().slice(0, 10)}` })
        return
      }
      const ws = XLSX.utils.json_to_sheet(exportRows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Course Progress')
      XLSX.writeFile(wb, `Student_Course_Progress_${new Date().toISOString().slice(0, 10)}.xlsx`)
    } catch (err) { console.error(err) }
    finally { setExporting(false) }
  }

  /* ── Chart configs ──────────────────────────────────── */
  const rawDonutSeries = [distribution.notStarted, distribution.inProgress, distribution.midProgress, distribution.completed]
  const distTotal = Math.max(1, rawDonutSeries.reduce((a, b) => a + b, 0))
  const hasDistData = rawDonutSeries.reduce((a, b) => a + b, 0) > 0
  // With no real enrollment data yet, render a flat grey ring instead of an
  // invisible/empty ApexCharts donut (which draws nothing for an all-zero series).
  const donutSeries = hasDistData ? rawDonutSeries : [1]
  const donutOptions: ApexCharts.ApexOptions = {
    chart: { type: 'donut', background: 'transparent' },
    theme: { mode: 'dark' },
    labels: hasDistData ? ['Not Started', 'In Progress', 'Mid Progress', 'Completed'] : ['No Data'],
    colors: hasDistData ? ['#555', '#ff6b00', '#3b82f6', '#22c55e'] : ['#2a2a2a'],
    dataLabels: { enabled: false },
    legend: { show: false },
    stroke: { show: false },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            name: { show: true, fontSize: '0.68rem', color: '#999', offsetY: -4 },
            value: { show: true, fontSize: '1.1rem', fontWeight: 800, color: '#fff', offsetY: 4 },
            total: { show: true, label: 'Students', fontSize: '0.68rem', fontWeight: 500, color: '#999', formatter: () => String(summary.totalStudents) },
          },
        },
      },
    },
    tooltip: { theme: 'dark', enabled: hasDistData },
  }

  // Top Courses — already sorted by enrolledCount desc server-side
  const topCoursesRanked = topCourses.slice(0, 5)
  const maxEnrolled = Math.max(1, ...topCoursesRanked.map((c) => c.enrolledCount))

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <Spinner animation="border" style={{ color: '#ff6b00' }} />
      </div>
    )
  }

  /* ── Group flat enrollment rows into one row per student ──────────
     A student enrolled in many courses previously showed up as many
     duplicate rows; each student now appears once, with per-course detail
     available via the "View" popup. ── */
  const groupsByStudent = new Map<string, StudentGroup>()
  rows.forEach((r) => {
    let g = groupsByStudent.get(r.userId)
    if (!g) {
      g = {
        userId: r.userId, name: r.name, email: r.email, department: r.department,
        courses: [], courseCount: 0, avgProgress: 0, lessonsCompleted: 0, lessonsTotal: 0,
        avgQuizScore: null, lastAccess: null, enrolledOn: null, status: 'Not Started',
      }
      groupsByStudent.set(r.userId, g)
    }
    g.courses.push(r)
  })
  let studentGroups: StudentGroup[] = [...groupsByStudent.values()].map((g) => {
    const progressSum = g.courses.reduce((s, c) => s + c.progress, 0)
    const avgProgress = g.courses.length > 0 ? Math.round(progressSum / g.courses.length) : 0
    const lessonsCompleted = g.courses.reduce((s, c) => s + c.lessonsCompleted, 0)
    const lessonsTotal = g.courses.reduce((s, c) => s + c.lessonsTotal, 0)
    const scored = g.courses.filter((c) => c.quizScore !== null)
    const avgQuizScore = scored.length > 0 ? Math.round(scored.reduce((s, c) => s + (c.quizScore || 0), 0) / scored.length) : null
    const lastAccess = g.courses.reduce<string | null>((latest, c) => (c.lastAccess && (!latest || c.lastAccess > latest) ? c.lastAccess : latest), null)
    const enrolledOn = g.courses.reduce<string | null>((earliest, c) => (c.enrolledOn && (!earliest || c.enrolledOn < earliest) ? c.enrolledOn : earliest), null)
    const status: Row['status'] = avgProgress >= 100 ? 'Completed' : avgProgress > 0 ? 'In Progress' : 'Not Started'
    return { ...g, courseCount: g.courses.length, avgProgress, lessonsCompleted, lessonsTotal, avgQuizScore, lastAccess, enrolledOn, status }
  })

  studentGroups.sort((a, b) => {
    let av: number | string, bv: number | string
    switch (sortBy) {
      case 'progress': av = a.avgProgress; bv = b.avgProgress; break
      case 'lastAccess': av = a.lastAccess ? new Date(a.lastAccess).getTime() : 0; bv = b.lastAccess ? new Date(b.lastAccess).getTime() : 0; break
      case 'quizScore': av = a.avgQuizScore ?? -1; bv = b.avgQuizScore ?? -1; break
      case 'lessonsCompleted': av = a.lessonsCompleted; bv = b.lessonsCompleted; break
      case 'name': av = a.name.toLowerCase(); bv = b.name.toLowerCase(); break
      default: av = a.enrolledOn ? new Date(a.enrolledOn).getTime() : 0; bv = b.enrolledOn ? new Date(b.enrolledOn).getTime() : 0
    }
    if (av < bv) return sortOrder === 'asc' ? -1 : 1
    if (av > bv) return sortOrder === 'asc' ? 1 : -1
    return 0
  })

  // Every student appears: those with no enrolment follow the enrolled ones
  studentGroups = [...studentGroups, ...notEnrolled.map((n) => ({
    ...n, courses: [], courseCount: 0, avgProgress: 0, lessonsCompleted: 0, lessonsTotal: 0,
    avgQuizScore: null, lastAccess: null, enrolledOn: null, status: 'Not Started' as Row['status'],
  }))]

  const studentTotalPages = Math.max(1, Math.ceil(studentGroups.length / limit))
  const studentSafePage = Math.min(page, studentTotalPages)
  const pagedStudentGroups = studentGroups.slice((studentSafePage - 1) * limit, studentSafePage * limit)

  return (
    <div>
      {/* ── Header ─────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div className="sr-heading">
          <span className="sr-heading-icon"><FaBookOpen /></span>
          <div>
            <h2>Course Progress</h2>
            <p>Track and monitor individual student progress across all enrolled courses</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' as const, alignItems: 'center' }}>
          <ReportRangeSelect />
          <button type="button" className="sr-export-button" onClick={() => handleExportExcel('pdf')} disabled={exporting}>
            <FaFilePdf /> {exporting ? 'Preparing PDF…' : 'Export PDF'}
          </button>
        </div>
      </div>

      <style>{`
        .course-prog-range { -webkit-appearance: none; appearance: none; background: transparent; pointer-events: none; }
        .course-prog-range::-webkit-slider-thumb { -webkit-appearance: none; pointer-events: auto; width: 14px; height: 14px; border-radius: 50%; background: #ff6b00; cursor: pointer; border: 2px solid #141414; }
        .course-prog-range::-moz-range-thumb { pointer-events: auto; width: 14px; height: 14px; border-radius: 50%; background: #ff6b00; cursor: pointer; border: 2px solid #141414; }
      `}</style>

      {/* ── Stat Cards ─────────────────────────────────── */}
      <section className="sr-summary dr-summary">
        <article className="sr-summary-card sr-card-orange">
          <span className="sr-summary-icon sr-icon-orange"><FaUserGraduate /></span>
          <div>
            <strong>{summary.totalStudents}</strong>
            <span>Total Students</span>
            <em className="sr-summary-rule" style={{ color: dimAccent('#22c55e') }}>↑ {Math.max(0, summary.totalStudents)} enrolled overall</em>
          </div>
        </article>

        <article className="sr-summary-card sr-card-green">
          <span className="sr-summary-icon sr-icon-green"><FaBookOpen /></span>
          <div>
            <strong>{summary.totalCourses}</strong>
            <span>Total Courses</span>
            <em className="sr-summary-rule" style={{ color: dimAccent('#22c55e') }}>Active Courses</em>
          </div>
        </article>

        <article className="sr-summary-card sr-card-purple">
          <span className="sr-summary-icon sr-icon-purple"><FaGraduationCap /></span>
          <div>
            <strong>{summary.studentsEnrolledCount}</strong>
            <span>Students Enrolled</span>
            <em className="sr-summary-rule" style={{ color: dimAccent('#999') }}>{summary.totalStudents > 0 ? Math.round((summary.studentsEnrolledCount / summary.totalStudents) * 100) : 0}% of total students</em>
          </div>
        </article>

        <article className="sr-summary-card sr-card-blue">
          <span className="sr-summary-icon sr-icon-blue"><FaCheckCircle /></span>
          <div>
            <strong>{summary.avgCompletion}%</strong>
            <span>Average Progress</span>
            <em className="sr-summary-rule" style={{ color: dimAccent(summary.avgProgressTrendPct >= 0 ? '#22c55e' : '#ef4444') }}>{summary.avgProgressTrendPct >= 0 ? '↑' : '↓'} {Math.abs(summary.avgProgressTrendPct)}% vs start of range</em>
          </div>
        </article>

        <article className="sr-summary-card sr-card-red">
          <span className="sr-summary-icon sr-icon-red"><FaTrophy /></span>
          <div>
            <strong>{summary.completedThisMonth}</strong>
            <span>Completed Courses</span>
            <em className="sr-summary-rule" style={{ color: dimAccent('#999') }}>This month</em>
          </div>
        </article>
      </section>

      {/* ── Charts row: progress bands and top courses, in the Student Reports panel style ── */}
      <div className="dr-two-col">
        <section className="sr-table-panel dr-panel">
          <div className="dr-panel-head">
            <div><h3>Progress Distribution</h3><p>{distTotal} students by average course progress</p></div>
          </div>
          <div className="dr-panel-body">
            {(() => {
              const bands = [
                { key: 'ns', label: 'Not started', range: '0%', value: distribution.notStarted, color: '#8a94a6' },
                { key: 'ip', label: 'In progress', range: '1 – 49%', value: distribution.inProgress, color: '#ff7a00' },
                { key: 'mp', label: 'Mid progress', range: '50 – 79%', value: distribution.midProgress, color: '#3b82f6' },
                { key: 'cp', label: 'Completed', range: '80 – 100%', value: distribution.completed, color: '#22c55e' },
              ]
              const sum = bands.reduce((t, b) => t + b.value, 0) || 1
              return (
                <>
                  <div className="dr-barchart" role="img" aria-label="Students by progress band">
                    {bands.map((b) => {
                      const pct = Math.round((b.value / sum) * 100)
                      const max = Math.max(1, ...bands.map((x) => x.value))
                      return (
                        <div key={b.key} className="dr-barcol" style={{ ['--c' as string]: b.color }} title={`${b.label}: ${b.value} students (${pct}%)`}>
                          <div className="dr-barval"><strong>{b.value}</strong><small>{pct}%</small></div>
                          <div className="dr-bartrack"><i style={{ height: `${Math.max(b.value ? 4 : 0, (b.value / max) * 100)}%` }} /></div>
                          <div className="dr-barlabel"><span>{b.label}</span><em>{b.range}</em></div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )
            })()}
          </div>
        </section>

        <section className="sr-table-panel dr-panel">
          <div className="dr-panel-head">
            <div><h3>Top Courses</h3><p>Most enrolled courses and their average completion</p></div>
          </div>
          {topCoursesRanked.length === 0 ? (
            <div className="sr-empty"><FaBookOpen /><span>No courses yet</span></div>
          ) : (
            <div className="dr-mini-table">
              <div className="dr-mini-head"><span>#</span><span>Course</span><span>Enrolled</span><span>Avg completion</span></div>
              {topCoursesRanked.map((c, i) => (
                <div key={c.courseId} className="dr-mini-row">
                  <span>{i < 3 ? <b className={`dr-medal m${i + 1}`}>{i + 1}</b> : i + 1}</span>
                  <span className="dr-course">
                    {c.image ? <img src={c.image} alt="" /> : <em>{c.title.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase()}</em>}
                    <strong title={c.title}>{c.title}</strong>
                  </span>
                  <span className="dr-enrolled"><strong>{c.enrolledCount}</strong><i><u style={{ width: `${Math.round((c.enrolledCount / maxEnrolled) * 100)}%` }} /></i></span>
                  <span><ScoreBar pct={c.avgCompletion} /></span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── Table ──────────────────────────────────────── */}
      <section className="sr-table-panel" aria-label="Student course progress">
        <div className="sr-toolbar">
          <div className="sr-search">
            <FaSearch aria-hidden="true" />
            <input aria-label="Search students" value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Search by name or email" />
          </div>
          <div className="sr-filters sr-report-filters">
            <HeaderSelect label="Filter by course" prefix="Course:" value={appliedCourse}
              options={[{ value: '', label: 'All' }, ...courseOptions.map((c) => ({ value: c.courseId, label: truncate(c.title, 60) }))]}
              onChange={(course) => applyNow({ course })} />
            <CohortFilters />
            <HeaderSelect label="Filter by progress" prefix="Progress:" value={progressBand}
              options={[{ value: '', label: 'All' }, { value: 'not-started', label: 'Not started' }, { value: 'low', label: '1 – 49%' }, { value: 'mid', label: '50 – 79%' }, { value: 'done', label: '80 – 100%' }]}
              onChange={(band) => applyNow({ band })} />
            <span className="sr-result-count">
              {studentGroups.length ? `${(studentSafePage - 1) * limit + 1}–${Math.min(studentSafePage * limit, studentGroups.length)} of ${studentGroups.length}` : '0 students'}
            </span>
            {studentGroups.length > limit && (
              <span className="sr-compact-pagination">
                <button type="button" onClick={() => setPage(Math.max(1, studentSafePage - 1))} disabled={studentSafePage <= 1} aria-label="Previous page"><FaChevronLeft /></button>
                <button type="button" onClick={() => setPage(Math.min(studentTotalPages, studentSafePage + 1))} disabled={studentSafePage >= studentTotalPages} aria-label="Next page"><FaChevronRight /></button>
              </span>
            )}
          </div>
        </div>

        <div className="sr-table-scroll" style={{ position: 'relative', overflowX: 'auto' }}>
          {tableLoading && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
              <Spinner animation="border" style={{ color: '#ff6b00', width: 24, height: 24 }} />
            </div>
          )}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...S.th, minWidth: 28 }}>#</th>
                <SortableTh label="Student" sortKey="name" sortBy={sortBy} sortOrder={sortOrder} onClick={onSortChange} style={{ minWidth: 160 }} />
                <th style={{ ...S.th, minWidth: 130, textAlign: 'center' }}>Courses Enrolled</th>
                <SortableTh label="Enrolled On" sortKey="enrolledOn" sortBy={sortBy} sortOrder={sortOrder} onClick={onSortChange} style={{ minWidth: 100 }} />
                <SortableTh label="Last Access" sortKey="lastAccess" sortBy={sortBy} sortOrder={sortOrder} onClick={onSortChange} style={{ minWidth: 110 }} />
                <SortableTh label="Avg Progress" sortKey="progress" sortBy={sortBy} sortOrder={sortOrder} onClick={onSortChange} style={{ minWidth: 120 }} />
                <SortableTh label="Lessons Completed" sortKey="lessonsCompleted" sortBy={sortBy} sortOrder={sortOrder} onClick={onSortChange} style={{ minWidth: 100, textAlign: 'center' }} />
                <SortableTh label="Avg Quiz Score" sortKey="quizScore" sortBy={sortBy} sortOrder={sortOrder} onClick={onSortChange} style={{ minWidth: 80, textAlign: 'center' }} />
                <th style={{ ...S.th, minWidth: 90, textAlign: 'center' }}>Status</th>
                <th className="dr-actions" style={{ ...S.th, minWidth: 60, textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {pagedStudentGroups.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2.5rem', color: '#444' }}>No enrollments found</td></tr>
              ) : pagedStudentGroups.map((g, i) => {
                return (
                  <tr key={g.userId} className={g.courseCount ? undefined : 'dr-row-muted'}>
                    <td style={S.tdMuted}>{(studentSafePage - 1) * limit + i + 1}</td>
                    <td style={S.td}><StudentCell name={g.name} email={g.email} /></td>
                    <td style={{ ...S.td, textAlign: 'center' }}>{g.courseCount}</td>
                    <td style={S.tdMuted}>{fmtDate(g.enrolledOn)}</td>
                    <td style={S.tdMuted}>{fmtDateTime(g.lastAccess)}</td>
                    <td style={S.td}>{g.courseCount ? <ScoreBar pct={g.avgProgress} /> : <span className="dr-dot">·</span>}</td>
                    <td style={{ ...S.td, textAlign: 'center' }}>{g.lessonsTotal > 0 ? `${g.lessonsCompleted}/${g.lessonsTotal}` : '—'}</td>
                    <td style={{ ...S.td, textAlign: 'center' }}>{g.avgQuizScore !== null ? `${g.avgQuizScore}%` : '—'}</td>
                    <td style={{ ...S.td, textAlign: 'center' }}>
                      {g.courseCount
                        ? <StatusPill tone={g.status === 'Completed' ? 'good' : g.status === 'In Progress' ? 'mid' : 'none'}>{g.status}</StatusPill>
                        : <StatusPill tone="pending">Not enrolled</StatusPill>}
                    </td>
                    <td className="dr-actions" style={{ ...S.td, textAlign: 'center' }}>
                      {g.courseCount ? <ViewButton onClick={() => setViewStudent(g)} /> : <span className="dr-dot">—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <ReportPagination page={studentSafePage} pageSize={limit} total={studentGroups.length} onPage={setPage} />
      </section>

      {/* ── Student course detail (drawer, like Student Reports) ── */}
      {viewStudent && (() => {
        const v = viewStudent
        const quizzes = v.courses.filter((c) => c.quizScore !== null)
        const barColor = (p: number) => (p >= 80 ? '#22c55e' : p >= 50 ? '#3b82f6' : p > 0 ? '#ff7a00' : '#3a3e43')
        return (
          <ReportDrawer
            name={v.name}
            email={v.email}
            meta={v.department || undefined}
            badge={<StatusPill tone={v.status === 'Completed' ? 'good' : v.status === 'In Progress' ? 'mid' : 'none'}>{v.status}</StatusPill>}
            onClose={() => setViewStudent(null)}
            stats={[
              { label: 'Courses', value: v.courseCount, hint: 'enrolled', tone: 'orange' },
              { label: 'Avg progress', value: `${v.avgProgress}%`, hint: 'across all courses', tone: v.avgProgress >= 80 ? 'green' : v.avgProgress >= 50 ? 'blue' : v.avgProgress > 0 ? 'amber' : 'plain' },
              { label: 'Lessons done', value: v.lessonsTotal ? `${v.lessonsCompleted} / ${v.lessonsTotal}` : '—', hint: v.lessonsTotal ? `${Math.round((v.lessonsCompleted / v.lessonsTotal) * 100)}% complete` : 'no lesson data' },
              { label: 'Avg quiz', value: v.avgQuizScore !== null ? `${v.avgQuizScore}%` : '—', hint: quizzes.length ? `${quizzes.length} course${quizzes.length === 1 ? '' : 's'} with quizzes` : 'no quiz attempts', tone: v.avgQuizScore === null ? 'plain' : v.avgQuizScore >= 75 ? 'green' : v.avgQuizScore >= 50 ? 'amber' : 'red' },
            ]}
          >
            <h4 className="rd-section-title">Enrolled courses</h4>
            {v.courses.length === 0 ? (
              <div className="rd-empty"><FaBookOpen /><span>No course enrolments yet</span></div>
            ) : (
              <div className="rd-list">
                {[...v.courses].sort((a, b) => b.progress - a.progress).map((c) => (
                  <div key={c.courseId} className="rd-item">
                    <div className="rd-item-top">
                      {c.courseImage
                        ? <img className="rd-thumb" src={c.courseImage} alt="" />
                        : <span className="rd-thumb is-text">{c.courseTitle.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase()}</span>}
                      <div className="rd-item-title">
                        <strong title={c.courseTitle}>{c.courseTitle}</strong>
                        <small>Enrolled {fmtDate(c.enrolledOn)}</small>
                      </div>
                      <StatusPill tone={c.status === 'Completed' ? 'good' : c.status === 'In Progress' ? 'mid' : 'none'}>{c.status}</StatusPill>
                    </div>
                    <div className="rd-progress">
                      <span><i style={{ width: `${Math.min(100, c.progress)}%`, background: barColor(c.progress) }} /></span>
                      <b>{c.progress}%</b>
                    </div>
                    <div className="rd-meta">
                      <span><FaBookOpen /> <b>{c.lessonsTotal > 0 ? `${c.lessonsCompleted}/${c.lessonsTotal}` : '—'}</b> lessons</span>
                      <span><FaCheckCircle /> {c.quizScore !== null ? <><b>{c.quizScore}%</b> quiz avg</> : 'No quiz attempts'}</span>
                      <span><FaCalendarAlt /> Last access <b>{fmtDateTime(c.lastAccess)}</b></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ReportDrawer>
        )
      })()}
    </div>
  )
}

export default CourseEnrollmentFull
