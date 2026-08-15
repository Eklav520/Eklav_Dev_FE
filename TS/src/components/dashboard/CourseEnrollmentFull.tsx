import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Spinner } from 'react-bootstrap'
import {
  FaBookOpen, FaCalendarAlt, FaCheckCircle, FaDownload, FaGraduationCap,
  FaSearch, FaTrophy, FaUserGraduate,
} from 'react-icons/fa'
import ReactApexChart from 'react-apexcharts'
import * as XLSX from 'xlsx'
import { useAuthContext } from '@/context/useAuthContext'

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

const AVATAR_COLORS = ['#ff6b00', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6', '#f59e0b', '#ef4444']
const avatarColor = (name: string) => AVATAR_COLORS[(name || '?').charCodeAt(0) % AVATAR_COLORS.length]
const initials = (name: string) => name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || '?'

const statusStyle = (status: Row['status']) => {
  if (status === 'Completed') return { bg: 'rgba(34,197,94,0.15)', text: '#22c55e' }
  if (status === 'In Progress') return { bg: 'rgba(255,107,0,0.15)', text: '#ff6b00' }
  return { bg: 'rgba(100,100,100,0.15)', text: '#888' }
}

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
    textAlign: 'left' as const, borderBottom: '1px solid #2a2a2a', whiteSpace: 'nowrap' as const,
  },
  thSortable: { cursor: 'pointer', userSelect: 'none' as const },
  td: { padding: '0.55rem 0.5rem', borderBottom: '1px solid #1e1e1e', color: '#e0e0e0', fontSize: '0.78rem', whiteSpace: 'nowrap' as const } as React.CSSProperties,
  tdMuted: { padding: '0.55rem 0.5rem', borderBottom: '1px solid #1e1e1e', color: '#555', fontSize: '0.74rem', whiteSpace: 'nowrap' as const } as React.CSSProperties,
  footer: {
    background: '#111', borderTop: '1px solid #2a2a2a', color: '#555', fontSize: '0.78rem',
    borderRadius: '0 0 14px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
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
  const [startDate, setStartDate] = useState(defaultStart)
  const [endDate, setEndDate] = useState(defaultEnd)
  const [appliedStart, setAppliedStart] = useState(defaultStart)
  const [appliedEnd, setAppliedEnd] = useState(defaultEnd)

  // Table state
  const [rows, setRows] = useState<Row[]>([])
  const [tableLoading, setTableLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
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
    })
    try {
      const res = await fetch(`${baseURL}${apiBase}/course-enrollment-students?${params}`, { headers: { Authorization: `Bearer ${user.token}` } })
      const data = await res.json()
      if (data.success) {
        setRows(data.rows)
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

  const applyFilters = () => {
    setAppliedCourse(filterCourse)
    setAppliedDepartment(draftDepartment)
    setAppliedProgress(draftProgress)
    setPage(1)
    fetchRows({ courseId: filterCourse, department: draftDepartment, minProgress: draftProgress[0], maxProgress: draftProgress[1] })
  }

  const resetFilters = () => {
    setFilterCourse(''); setAppliedCourse('')
    setDraftDepartment(''); setAppliedDepartment('')
    setDraftProgress([0, 100]); setAppliedProgress([0, 100])
    setSearch('')
    setPage(1)
    fetchRows({ search: '', courseId: '', department: '', minProgress: 0, maxProgress: 100 })
  }

  const onSortChange = (key: SortBy) => {
    // Sorting happens entirely client-side over the already-grouped student
    // list — no need to refetch, since every row is already loaded.
    const nextOrder: SortOrder = sortBy === key && sortOrder === 'desc' ? 'asc' : 'desc'
    setSortBy(key); setSortOrder(nextOrder)
  }

  const handleExportExcel = async () => {
    if (!user?.token) return
    setExporting(true)
    try {
      const params = new URLSearchParams({
        page: '1', limit: '9999', search, courseId: appliedCourse, department: appliedDepartment,
        minProgress: String(appliedProgress[0]), maxProgress: String(appliedProgress[1]),
        sortBy, order: sortOrder,
      })
      const res = await fetch(`${baseURL}${apiBase}/course-enrollment-students?${params}`, { headers: { Authorization: `Bearer ${user.token}` } })
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

  const studentTotalPages = Math.max(1, Math.ceil(studentGroups.length / limit))
  const studentSafePage = Math.min(page, studentTotalPages)
  const pagedStudentGroups = studentGroups.slice((studentSafePage - 1) * limit, studentSafePage * limit)

  return (
    <div>
      {/* ── Header ─────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem' }}>Student Course Progress</div>
          <div style={{ color: '#666', fontSize: '0.78rem', marginTop: 2 }}>Track and monitor individual student progress across all enrolled courses</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' as const, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <FaCalendarAlt size={11} color="#666" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <select
              style={{ ...S.select, width: 170, paddingLeft: 28 }}
              value={dateRangeMode}
              onChange={(e) => onDateRangeModeChange(e.target.value as DateRangeMode)}
            >
              <option value="today">Today ({fmtHeaderDate(defaultEnd())})</option>
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
              <button style={S.applyBtn} onClick={applyCustomRange}>Apply</button>
            </>
          )}
          <button style={S.headerBtn('#22c55e')} onClick={handleExportExcel} disabled={exporting}>
            <FaDownload size={11} /> {exporting ? 'Exporting…' : 'Export Excel'}
          </button>
        </div>
      </div>

      <style>{`
        .course-prog-range { -webkit-appearance: none; appearance: none; background: transparent; pointer-events: none; }
        .course-prog-range::-webkit-slider-thumb { -webkit-appearance: none; pointer-events: auto; width: 14px; height: 14px; border-radius: 50%; background: #ff6b00; cursor: pointer; border: 2px solid #141414; }
        .course-prog-range::-moz-range-thumb { pointer-events: auto; width: 14px; height: 14px; border-radius: 50%; background: #ff6b00; cursor: pointer; border: 2px solid #141414; }
      `}</style>

      {/* ── Stat Cards ─────────────────────────────────── */}
      <div style={S.statGrid}>
        <div style={S.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={S.iconCircle('#ff6b00')}><FaUserGraduate size={12} color="#fff" /></div>
            <span style={S.labelSm}>Total Students</span>
          </div>
          <div style={S.numSm}>{summary.totalStudents}</div>
          <span style={S.sub('#22c55e')}>↑ {Math.max(0, summary.totalStudents)} enrolled overall</span>
        </div>

        <div style={S.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={S.iconCircle('#22c55e')}><FaBookOpen size={12} color="#fff" /></div>
            <span style={S.labelSm}>Total Courses</span>
          </div>
          <div style={S.numSm}>{summary.totalCourses}</div>
          <span style={S.sub('#22c55e')}>Active Courses</span>
        </div>

        <div style={S.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={S.iconCircle('#a855f7')}><FaGraduationCap size={12} color="#fff" /></div>
            <span style={S.labelSm}>Students Enrolled</span>
          </div>
          <div style={S.numSm}>{summary.studentsEnrolledCount}</div>
          <span style={S.sub('#999')}>{summary.totalStudents > 0 ? Math.round((summary.studentsEnrolledCount / summary.totalStudents) * 100) : 0}% of total students</span>
        </div>

        <div style={S.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={S.iconCircle('#3b82f6')}><FaCheckCircle size={12} color="#fff" /></div>
            <span style={S.labelSm}>Average Progress</span>
          </div>
          <div style={S.numSm}>{summary.avgCompletion}%</div>
          <span style={S.sub(summary.avgProgressTrendPct >= 0 ? '#22c55e' : '#ef4444')}>
            {summary.avgProgressTrendPct >= 0 ? '↑' : '↓'} {Math.abs(summary.avgProgressTrendPct)}% vs start of range
          </span>
        </div>

        <div style={S.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={S.iconCircle('#ef4444')}><FaTrophy size={12} color="#fff" /></div>
            <span style={S.labelSm}>Completed Courses</span>
          </div>
          <div style={S.numSm}>{summary.completedThisMonth}</div>
          <span style={S.sub('#999')}>This month</span>
        </div>
      </div>

      {/* ── Filters row ────────────────────────────────── */}
      <div style={{ ...S.card, marginBottom: '0.85rem' }}>
        <div style={{ padding: '0.9rem 1.1rem', display: 'flex', flexWrap: 'nowrap' as const, gap: '1rem', alignItems: 'flex-end', overflowX: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4, flex: '1 1 0', minWidth: 150 }}>
            <span style={S.filterLabel}>Course</span>
            <select style={{ ...S.select, width: '100%' }} value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)}>
              <option value="">All Courses</option>
              {courseOptions.map((c) => <option key={c.courseId} value={c.courseId}>{truncate(c.title, 40)}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4, flex: '1 1 0', minWidth: 150 }}>
            <span style={S.filterLabel}>Batch / Department</span>
            <select style={{ ...S.select, width: '100%' }} value={draftDepartment} onChange={(e) => setDraftDepartment(e.target.value)}>
              <option value="">All Departments</option>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4, flex: '1 1 0', minWidth: 160 }}>
            <span style={S.filterLabel}>Progress Range: {draftProgress[0]}% – {draftProgress[1]}%</span>
            <div style={{ position: 'relative', width: '100%', height: 28, display: 'flex', alignItems: 'center' }}>
              <div style={{ position: 'absolute', left: 0, right: 0, height: 4, background: '#2a2a2a', borderRadius: 2 }} />
              <div style={{
                position: 'absolute', height: 4, background: '#ff6b00', borderRadius: 2,
                left: `${draftProgress[0]}%`, right: `${100 - draftProgress[1]}%`,
              }} />
              <input
                type="range" min={0} max={100} step={5} value={draftProgress[0]}
                onChange={(e) => setDraftProgress([Math.min(Number(e.target.value), draftProgress[1]), draftProgress[1]])}
                style={{ position: 'absolute', width: '100%', margin: 0, background: 'transparent' }}
                className="course-prog-range"
              />
              <input
                type="range" min={0} max={100} step={5} value={draftProgress[1]}
                onChange={(e) => setDraftProgress([draftProgress[0], Math.max(Number(e.target.value), draftProgress[0])])}
                style={{ position: 'absolute', width: '100%', margin: 0, background: 'transparent' }}
                className="course-prog-range"
              />
            </div>
          </div>

          <div style={{ ...S.searchWrap, flex: '1 1 0', minWidth: 160 }}>
            <FaSearch size={11} color="#444" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)' }} />
            <input style={S.input({ width: '100%' })} placeholder="Search by name or email" value={search} onChange={(e) => onSearchChange(e.target.value)} />
          </div>

          <button style={{ ...S.applyBtn, flexShrink: 0 }} onClick={applyFilters}>Apply Filters</button>
          <button style={{ ...S.resetBtn, flexShrink: 0 }} onClick={resetFilters}>Reset</button>
        </div>
      </div>

      {/* ── Charts row ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '0.85rem', marginBottom: '1.25rem', alignItems: 'stretch', minWidth: 0 }}>
        {/* Overall Progress Distribution */}
        <div style={{ ...S.card, minWidth: 0 }}>
          <div style={S.cardHeader}><span style={S.cardTitle}>Overall Progress Distribution</span></div>
          <div style={{ padding: '0.9rem 1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 120, flexShrink: 0 }}>
                <ReactApexChart type="donut" height={120} series={donutSeries} options={donutOptions} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                {[
                  { label: 'Not Started', range: '0%', value: distribution.notStarted, color: '#555' },
                  { label: 'In Progress', range: '1% – 49%', value: distribution.inProgress, color: '#ff6b00' },
                  { label: 'Mid Progress', range: '50% – 79%', value: distribution.midProgress, color: '#3b82f6' },
                  { label: 'Completed', range: '80% – 100%', value: distribution.completed, color: '#22c55e' },
                ].map((d) => (
                  <div key={d.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, fontSize: '0.76rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: d.color, display: 'inline-block', flexShrink: 0 }} />
                      <span style={{ color: '#ccc' }}>{d.label} ({d.range})</span>
                    </div>
                    <span style={{ color: '#888', flexShrink: 0 }}>{d.value} ({Math.round((d.value / distTotal) * 100)}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Top Courses — enrollment-ranked, with each course's own avg
            completion. Replaces the old "Average Progress Over Time" line
            chart, which was structurally flat: it averaged each student's
            *current* progress and only shifted if new UserProgress records
            were created within the selected date window — with no daily
            snapshots in the DB, most ranges showed an identical value
            repeated every day. This shows real, immediately-true variation
            instead. */}
        <div style={{ ...S.card, minWidth: 0 }}>
          <div style={S.cardHeader}>
            <span style={S.cardTitle}>Top Courses</span>
            <span style={{ color: '#555', fontSize: '0.7rem' }}>By Enrollment</span>
          </div>
          <div style={{ padding: '0.9rem 1rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {topCoursesRanked.length === 0 ? (
              <div style={{ color: '#555', fontSize: '0.76rem', textAlign: 'center', padding: '1rem 0' }}>No courses yet</div>
            ) : topCoursesRanked.map((c, i) => {
              const barPct = Math.round((c.enrolledCount / maxEnrolled) * 100)
              const completionColor = c.avgCompletion >= 70 ? '#22c55e' : c.avgCompletion >= 40 ? '#f59e0b' : '#ef4444'
              return (
                <div key={c.courseId}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5, gap: 8 }}>
                    <span style={{ color: '#ddd', fontSize: '0.78rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {i + 1}. {truncate(c.title, 32)}
                    </span>
                    <span style={{ color: '#666', fontSize: '0.7rem', flexShrink: 0 }}>
                      {c.enrolledCount} enrolled · <span style={{ color: completionColor, fontWeight: 700 }}>{c.avgCompletion}%</span>
                    </span>
                  </div>
                  <div style={{ background: '#2a2a2a', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                    <div style={{ width: `${barPct}%`, background: '#ff6b00', height: '100%' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────── */}
      <div style={S.card}>
        <div style={{ padding: '0.9rem 1.1rem', borderBottom: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={S.cardTitle}>Students Progress Overview</span>
          <select style={{ ...S.select, width: 100 }} value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1) }}>
            {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n} / page</option>)}
          </select>
        </div>

        <div style={{ position: 'relative', overflowX: 'auto' }}>
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
                <th style={{ ...S.th, minWidth: 60, textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {pagedStudentGroups.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2.5rem', color: '#444' }}>No enrollments found</td></tr>
              ) : pagedStudentGroups.map((g, i) => {
                const st = statusStyle(g.status)
                return (
                  <tr key={g.userId}>
                    <td style={S.tdMuted}>{(studentSafePage - 1) * limit + i + 1}</td>
                    <td style={S.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: avatarColor(g.name), color: '#fff', fontSize: '0.56rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {initials(g.name)}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.76rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 }}>{g.name}</div>
                          <div style={{ color: '#555', fontSize: '0.64rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 }}>{g.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ ...S.td, textAlign: 'center' }}>{g.courseCount}</td>
                    <td style={S.tdMuted}>{fmtDate(g.enrolledOn)}</td>
                    <td style={S.tdMuted}>{fmtDateTime(g.lastAccess)}</td>
                    <td style={S.td}><ProgressCell pct={g.avgProgress} /></td>
                    <td style={{ ...S.td, textAlign: 'center' }}>{g.lessonsTotal > 0 ? `${g.lessonsCompleted}/${g.lessonsTotal}` : '—'}</td>
                    <td style={{ ...S.td, textAlign: 'center' }}>{g.avgQuizScore !== null ? `${g.avgQuizScore}%` : '—'}</td>
                    <td style={{ ...S.td, textAlign: 'center' }}>
                      <span style={{ background: st.bg, color: st.text, borderRadius: 6, padding: '2px 10px', fontSize: '0.7rem', fontWeight: 700 }}>{g.status}</span>
                    </td>
                    <td style={{ ...S.td, textAlign: 'center' }}>
                      <button
                        onClick={() => setViewStudent(g)}
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

        {/* Pagination */}
        <div style={S.footer}>
          <span>
            Showing <strong style={{ color: '#aaa' }}>{studentGroups.length === 0 ? 0 : (studentSafePage - 1) * limit + 1}–{Math.min(studentSafePage * limit, studentGroups.length)}</strong>
            {' '}of <strong style={{ color: '#aaa' }}>{studentGroups.length}</strong> students
          </span>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <PagBtn disabled={studentSafePage <= 1} onClick={() => setPage(studentSafePage - 1)}>‹ Prev</PagBtn>
            {Array.from({ length: studentTotalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === studentTotalPages || Math.abs(p - studentSafePage) <= 1)
              .reduce<(number | '…')[]>((acc, p, idx, arr) => {
                if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('…')
                acc.push(p); return acc
              }, [])
              .map((p, idx) => p === '…'
                ? <span key={`e-${idx}`} style={{ color: '#444', padding: '0 4px' }}>…</span>
                : <PagBtn key={p} active={p === studentSafePage} onClick={() => setPage(p as number)}>{p}</PagBtn>
              )}
            <PagBtn disabled={studentSafePage >= studentTotalPages} onClick={() => setPage(studentSafePage + 1)}>Next ›</PagBtn>
          </div>
        </div>
      </div>

      {/* ── Student Course Detail Modal ────────────────── */}
      {viewStudent && createPortal(
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
              width: '75vw', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
              boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
            }}
          >
            <div style={{ padding: '1.1rem 1.4rem', borderBottom: '1px solid #252525', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>{viewStudent.name}</div>
                <div style={{ color: '#555', fontSize: '0.72rem', marginTop: 2 }}>{viewStudent.email} · {viewStudent.courseCount} course{viewStudent.courseCount !== 1 ? 's' : ''} enrolled</div>
              </div>
              <button
                onClick={() => setViewStudent(null)}
                style={{ background: '#222', border: '1px solid #333', color: '#777', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: '1rem 1.4rem', overflowY: 'auto', overflowX: 'hidden', minWidth: 0 }}>
              {viewStudent.courses.length === 0 ? (
                <div style={{ color: '#444', textAlign: 'center', padding: '2rem 0', fontSize: '0.85rem' }}>No course enrollments found</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', minWidth: 0 }}>
                  {viewStudent.courses.map((c) => {
                    const cst = statusStyle(c.status)
                    return (
                      <div key={c.courseId} style={{ background: '#1a1a1a', border: '1px solid #232323', borderRadius: 10, padding: '0.75rem 0.85rem', minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          {c.courseImage
                            ? <img src={c.courseImage} alt="" style={{ width: 24, height: 24, borderRadius: 5, objectFit: 'cover', flexShrink: 0 }} />
                            : <div style={{ width: 24, height: 24, borderRadius: 5, background: '#2a2a2a', flexShrink: 0 }} />}
                          <span style={{ color: '#ddd', fontSize: '0.8rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }} title={c.courseTitle}>{c.courseTitle}</span>
                        </div>
                        <div style={{ marginBottom: 8 }}>
                          <ProgressCell pct={c.progress} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: '0.7rem', color: '#777', marginBottom: 8 }}>
                          <span>{c.lessonsTotal > 0 ? `${c.lessonsCompleted}/${c.lessonsTotal} lessons` : 'No lessons data'}</span>
                          <span>{c.quizScore !== null ? `${c.quizScore}% quiz avg` : 'No quiz attempts'}</span>
                          <span>Last access: {fmtDateTime(c.lastAccess)}</span>
                        </div>
                        <span style={{ background: cst.bg, color: cst.text, borderRadius: 6, padding: '2px 9px', fontSize: '0.66rem', fontWeight: 700 }}>{c.status}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default CourseEnrollmentFull
