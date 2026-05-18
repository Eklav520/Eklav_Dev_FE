import { useCallback, useEffect, useRef, useState } from 'react'
import { Col, Row, Spinner } from 'react-bootstrap'
import {
  FaBookOpen, FaCheckCircle, FaDownload, FaSearch, FaTimesCircle, FaUserGraduate,
} from 'react-icons/fa'
import * as XLSX from 'xlsx'
import ReactApexChart from 'react-apexcharts'
import { useAuthContext } from '@/context/useAuthContext'

/* ─── Types ─────────────────────────────────────────────── */
type CourseStat = {
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

type CourseEntry = {
  courseId: string
  title: string
  progress: number
  status: 'Completed' | 'In Progress' | 'Not Started'
  lastActivity?: string | null
}

type StudentRow = {
  userId: string
  name: string
  email: string
  enrolledCount: number
  avgCompletion: number
  courses: CourseEntry[]
}

type Summary = { totalCourses: number; totalStudents: number; totalEnrollments: number; avgCompletion: number }
type Pagination = { total: number; page: number; limit: number; totalPages: number }

/* ─── Helpers ────────────────────────────────────────────── */
const truncate = (s: string, n = 40) => s.length > n ? s.slice(0, n) + '…' : s

const statusColor = (status: string) => {
  if (status === 'Completed')  return { bg: 'rgba(34,197,94,0.15)',  text: '#22c55e', border: '#22c55e33' }
  if (status === 'In Progress') return { bg: 'rgba(255,107,0,0.15)', text: '#ff6b00', border: '#ff6b0033' }
  return { bg: 'rgba(100,100,100,0.15)', text: '#666', border: '#66666633' }
}

/* ─── Styles ─────────────────────────────────────────────── */
const S = {
  statCard: (accent: string): React.CSSProperties => ({
    background: '#1a1a1a', border: '1px solid #2a2a2a',
    borderLeft: `4px solid ${accent}`, borderRadius: 14, padding: '1.25rem 1.5rem',
  }),
  iconBox: (accent: string): React.CSSProperties => ({
    background: `${accent}22`, borderRadius: 10, padding: 10, display: 'inline-flex',
  }),
  num: (accent: string): React.CSSProperties => ({
    fontSize: '1.8rem', fontWeight: 700, color: accent, lineHeight: 1, marginBottom: 2,
  }),
  label: { color: '#888', fontSize: '0.78rem' } as React.CSSProperties,
  card: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 14 } as React.CSSProperties,
  sectionLabel: {
    color: '#aaa', fontSize: '0.7rem', fontWeight: 600,
    letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '0.75rem',
  },
  tab: (active: boolean): React.CSSProperties => ({
    background: active ? '#ff6b00' : 'transparent',
    border: `1px solid ${active ? '#ff6b00' : '#2a2a2a'}`,
    color: active ? '#fff' : '#666',
    borderRadius: 8, padding: '5px 18px', fontSize: '0.82rem',
    fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
  }),
  th: {
    background: '#111', color: '#555', fontSize: '0.68rem', fontWeight: 600,
    letterSpacing: '0.08em', textTransform: 'uppercase' as const,
    padding: '0.75rem 1rem', textAlign: 'left' as const,
    borderBottom: '1px solid #2a2a2a', whiteSpace: 'nowrap' as const,
  },
  td: {
    padding: '0.75rem 1rem', borderBottom: '1px solid #1e1e1e',
    color: '#e0e0e0', fontSize: '0.83rem', whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,
  tdMuted: {
    padding: '0.75rem 1rem', borderBottom: '1px solid #1e1e1e',
    color: '#aaa', fontSize: '0.78rem', whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,
  select: {
    background: '#111', border: '1px solid #2a2a2a', color: '#fff',
    borderRadius: 8, padding: '6px 12px', fontSize: '0.82rem', cursor: 'pointer',
  } as React.CSSProperties,
  searchWrap: { position: 'relative' } as React.CSSProperties,
  searchInput: {
    background: '#111', border: '1px solid #2a2a2a', color: '#fff',
    borderRadius: 8, padding: '6px 12px 6px 28px', fontSize: '0.82rem', width: 220,
  } as React.CSSProperties,
  footer: {
    background: '#111', borderTop: '1px solid #2a2a2a', color: '#555',
    fontSize: '0.78rem', borderRadius: '0 0 14px 14px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    flexWrap: 'wrap' as const, gap: '0.5rem', padding: '0.75rem 1.25rem',
  } as React.CSSProperties,
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

/* ─── Progress Bar ───────────────────────────────────────── */
const ProgressBar = ({ pct }: { pct: number }) => {
  const color = pct >= 100 ? '#22c55e' : pct > 0 ? '#ff6b00' : '#2a2a2a'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, background: '#2a2a2a', borderRadius: 4, height: 6, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, background: color, height: '100%', borderRadius: 4, transition: 'width 0.3s' }} />
      </div>
      <span style={{ color: '#aaa', fontSize: '0.75rem', minWidth: 32 }}>{pct}%</span>
    </div>
  )
}

/* ─── Main Component ─────────────────────────────────────── */
const CourseEnrollmentFull = ({ apiBase = '/api/institute' }: { apiBase?: string }) => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [tab, setTab] = useState<'courses' | 'students' | 'chart'>('courses')

  // Overview data
  const [summary, setSummary] = useState<Summary>({ totalCourses: 0, totalStudents: 0, totalEnrollments: 0, avgCompletion: 0 })
  const [courses, setCourses] = useState<CourseStat[]>([])
  const [overviewLoading, setOverviewLoading] = useState(true)

  // Courses tab pagination
  const [courseSearch, setCourseSearch] = useState('')
  const [coursePage, setCoursePage] = useState(1)
  const [courseLimit, setCourseLimit] = useState(20)
  const courseSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Students data
  const [students, setStudents] = useState<StudentRow[]>([])
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 1 })
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterCourse, setFilterCourse] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [modalStudent, setModalStudent] = useState<StudentRow | null>(null)

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch overview
  useEffect(() => {
    if (!user?.token) return
    setOverviewLoading(true)
    fetch(`${baseURL}${apiBase}/course-enrollment-overview`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) { setSummary(data.summary); setCourses(data.courses) }
      })
      .catch(console.error)
      .finally(() => setOverviewLoading(false))
  }, [user?.token, baseURL, apiBase])

  // Fetch students
  const fetchStudents = useCallback(async (opts: { page?: number; limit?: number; search?: string; courseId?: string } = {}) => {
    if (!user?.token) return
    setStudentsLoading(true)
    const params = new URLSearchParams({
      page:     String(opts.page     ?? 1),
      limit:    String(opts.limit    ?? 20),
      search:   opts.search   ?? '',
      courseId: opts.courseId ?? '',
    })
    try {
      const res  = await fetch(`${baseURL}${apiBase}/course-enrollment-students?${params}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      })
      const data = await res.json()
      if (data.success) { setStudents(data.students); setPagination(data.pagination) }
    } catch (err) { console.error(err) }
    finally { setStudentsLoading(false) }
  }, [user?.token, baseURL, apiBase])

  useEffect(() => {
    if (tab === 'students') fetchStudents({ page, limit, search, courseId: filterCourse })
  }, [tab, page, limit]) // eslint-disable-line

  const onSearch = (val: string) => {
    setSearch(val)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setPage(1)
      fetchStudents({ page: 1, limit, search: val, courseId: filterCourse })
    }, 400)
  }

  const onCourseFilter = (val: string) => {
    setFilterCourse(val)
    setPage(1)
    fetchStudents({ page: 1, limit, search, courseId: val })
  }

  const [exporting, setExporting] = useState(false)

  const handleExportExcel = async () => {
    if (!user?.token) return
    setExporting(true)
    try {
      const params = new URLSearchParams({ page: '1', limit: '9999', search, courseId: filterCourse })
      const res = await fetch(`${baseURL}${apiBase}/course-enrollment-students?${params}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      })
      const data = await res.json()
      if (!data.success) return
      const rows = data.students.map((s: StudentRow, i: number) => ({
        '#': i + 1,
        Name: s.name || '',
        Email: s.email || '',
        'Enrolled Courses': s.enrolledCount,
        'Avg Completion (%)': s.avgCompletion,
      }))
      const ws = XLSX.utils.json_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Course Enrollment')
      const courseTitle = filterCourse ? courses.find((c) => c.courseId === filterCourse)?.title || filterCourse : 'All'
      XLSX.writeFile(wb, `Course_Enrollment_${courseTitle.slice(0, 40).replace(/[/\\:*?"<>|]/g, '_')}.xlsx`)
    } catch (err) { console.error(err) }
    finally { setExporting(false) }
  }

  /* ── Chart options ─────────────────────────────────────── */
  const chartCourses = courses.slice(0, 12) // top 12 for readability

  // Color each bar by enrollment level: top third=green, middle=orange, bottom=red
  const sortedByEnrollment = [...chartCourses].sort((a, b) => b.enrolledCount - a.enrolledCount)
  const n = sortedByEnrollment.length
  const perBarColors = chartCourses.map((c) => {
    const rank = sortedByEnrollment.findIndex((s) => s.courseId === c.courseId)
    const pct = n <= 1 ? 0 : rank / (n - 1)
    if (pct < 0.34) return '#22c55e'
    if (pct < 0.67) return '#ff6b00'
    return '#ef4444'
  })

  const chartOptions: ApexCharts.ApexOptions = {
    chart: { type: 'bar', toolbar: { show: false }, background: 'transparent' },
    theme: { mode: 'dark' },
    colors: perBarColors,
    plotOptions: { bar: { horizontal: true, borderRadius: 4, distributed: true } },
    xaxis: {
      categories: chartCourses.map((c) => truncate(c.title, 32)),
      labels: { style: { colors: '#aaa', fontSize: '11px' } },
    },
    yaxis: { labels: { style: { colors: '#bbb', fontSize: '11px' } } },
    legend: { show: false },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => (val > 0 ? String(val) : ''),
      style: { fontSize: '11px', colors: ['#fff'] },
    },
    grid: { borderColor: '#1e1e1e', strokeDashArray: 3 },
    tooltip: { theme: 'dark', y: { formatter: (v: number) => `${v} students enrolled` } },
  }
  const chartSeries = [{ name: 'Enrolled Students', data: chartCourses.map((c) => c.enrolledCount) }]

  if (overviewLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <Spinner animation="border" style={{ color: '#ff6b00' }} />
      </div>
    )
  }

  return (
    <div>
      {/* ── Summary Cards ───────────────────────────── */}
      <div style={S.sectionLabel}>Overview</div>
      <Row className="g-3 mb-4">
        {[
          { label: 'Total Courses',     value: summary.totalCourses,     accent: '#ff6b00', icon: <FaBookOpen size={20} color="#ff6b00" /> },
          { label: 'Total Students',    value: summary.totalStudents,     accent: '#3b82f6', icon: <FaUserGraduate size={20} color="#3b82f6" /> },
          { label: 'Total Enrollments', value: summary.totalEnrollments,  accent: '#22c55e', icon: <FaCheckCircle size={20} color="#22c55e" /> },
          { label: 'Avg Completion',    value: `${summary.avgCompletion}%`, accent: '#a855f7', icon: <FaTimesCircle size={20} color="#a855f7" /> },
        ].map((s) => (
          <Col md={6} lg={3} key={s.label}>
            <div style={S.statCard(s.accent)}>
              <div className="d-flex align-items-center gap-3">
                <div style={S.iconBox(s.accent)}>{s.icon}</div>
                <div>
                  <div style={S.num(s.accent)}>{s.value}</div>
                  <div style={S.label}>{s.label}</div>
                </div>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* ── Tabs ────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {(['courses', 'students', 'chart'] as const).map((t) => (
          <button key={t} style={S.tab(tab === t)} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Courses Tab ─────────────────────────────── */}
      {tab === 'courses' && (() => {
        const filtered = courseSearch
          ? courses.filter((c) => c.title.toLowerCase().includes(courseSearch.toLowerCase()))
          : courses
        const totalPages = Math.max(1, Math.ceil(filtered.length / courseLimit))
        const safePage   = Math.min(coursePage, totalPages)
        const pageRows   = filtered.slice((safePage - 1) * courseLimit, safePage * courseLimit)
        return (
          <div style={S.card}>
            {/* Filter bar */}
            <div style={{
              padding: '0.9rem 1.25rem', borderBottom: '1px solid #2a2a2a',
              display: 'flex', flexWrap: 'wrap' as const, gap: '0.6rem', alignItems: 'center',
            }}>
              <select
                style={{ ...S.select, width: 110 }}
                value={courseLimit}
                onChange={(e) => { setCourseLimit(Number(e.target.value)); setCoursePage(1) }}
              >
                {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n} / page</option>)}
              </select>
              <div style={{ flex: 1 }} />
              <div style={S.searchWrap}>
                <FaSearch size={11} color="#444" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  style={S.searchInput}
                  placeholder="Search course name"
                  value={courseSearch}
                  onChange={(e) => {
                    const val = e.target.value
                    setCourseSearch(val)
                    if (courseSearchTimer.current) clearTimeout(courseSearchTimer.current)
                    courseSearchTimer.current = setTimeout(() => setCoursePage(1), 300)
                  }}
                />
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ ...S.th, minWidth: 40 }}>#</th>
                    <th style={{ ...S.th, minWidth: 220 }}>Course</th>
                    <th style={{ ...S.th, minWidth: 90, textAlign: 'center' }}>Enrolled</th>
                    <th style={{ ...S.th, minWidth: 110, textAlign: 'center' }}>Not Enrolled</th>
                    <th style={{ ...S.th, minWidth: 100, textAlign: 'center' }}>Completed</th>
                    <th style={{ ...S.th, minWidth: 110, textAlign: 'center' }}>In Progress</th>
                    <th style={{ ...S.th, minWidth: 110, textAlign: 'center' }}>Not Started</th>
                    <th style={{ ...S.th, minWidth: 160 }}>Avg Completion</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.length === 0 ? (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: '#444' }}>No courses found</td></tr>
                  ) : pageRows.map((c, i) => (
                    <tr key={c.courseId}>
                      <td style={S.tdMuted}>{(safePage - 1) * courseLimit + i + 1}</td>
                      <td style={{ ...S.td, minWidth: 220 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {c.image
                            ? <img src={c.image} alt="" style={{ width: 28, height: 28, borderRadius: 5, objectFit: 'cover', flexShrink: 0 }} />
                            : <div style={{ width: 28, height: 28, borderRadius: 5, background: '#2a2a2a', flexShrink: 0 }} />
                          }
                          <span style={{ fontWeight: 600, color: '#fff' }} title={c.title}>{truncate(c.title, 36)}</span>
                        </div>
                      </td>
                      <td style={{ ...S.td, textAlign: 'center', color: '#22c55e', fontWeight: 700 }}>{c.enrolledCount}</td>
                      <td style={{ ...S.td, textAlign: 'center', color: '#ef4444' }}>{c.notEnrolledCount}</td>
                      <td style={{ ...S.td, textAlign: 'center', color: '#22c55e' }}>{c.completedCount}</td>
                      <td style={{ ...S.td, textAlign: 'center', color: '#ff6b00' }}>{c.inProgressCount}</td>
                      <td style={{ ...S.td, textAlign: 'center', color: '#555' }}>{c.notStartedCount}</td>
                      <td style={{ ...S.td, minWidth: 160 }}><ProgressBar pct={c.avgCompletion} /></td>
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
                  {filtered.length === 0 ? 0 : (safePage - 1) * courseLimit + 1}–{Math.min(safePage * courseLimit, filtered.length)}
                </strong>
                {' '}of <strong style={{ color: '#aaa' }}>{filtered.length}</strong> courses
              </span>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <PagBtn disabled={safePage <= 1} onClick={() => setCoursePage(safePage - 1)}>‹ Prev</PagBtn>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                  .reduce<(number | '…')[]>((acc, p, idx, arr) => {
                    if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('…')
                    acc.push(p); return acc
                  }, [])
                  .map((p, idx) => p === '…'
                    ? <span key={`e-${idx}`} style={{ color: '#444', padding: '0 4px' }}>…</span>
                    : <PagBtn key={p} active={p === safePage} onClick={() => setCoursePage(p as number)}>{p}</PagBtn>
                  )}
                <PagBtn disabled={safePage >= totalPages} onClick={() => setCoursePage(safePage + 1)}>Next ›</PagBtn>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Students Tab ─────────────────────────────── */}
      {tab === 'students' && (
        <div style={S.card}>
          {/* Filters */}
          <div style={{
            padding: '0.9rem 1.25rem', borderBottom: '1px solid #2a2a2a',
            display: 'flex', flexWrap: 'wrap' as const, gap: '0.6rem', alignItems: 'center',
          }}>
            <select style={{ ...S.select, minWidth: 300, maxWidth: 420 }} value={filterCourse} onChange={(e) => onCourseFilter(e.target.value)}>
              <option value="">All Courses</option>
              {courses.map((c) => <option key={c.courseId} value={c.courseId}>{truncate(c.title, 52)}</option>)}
            </select>
            <select style={{ ...S.select, width: 110 }} value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1) }}>
              {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n} / page</option>)}
            </select>
            <div style={{ flex: 1 }} />
            <button
              onClick={handleExportExcel}
              disabled={exporting}
              style={{
                background: exporting ? '#333' : '#ff6b00', border: 'none',
                color: '#fff', borderRadius: 7, padding: '6px 14px',
                fontSize: '0.78rem', fontWeight: 700, cursor: exporting ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <FaDownload size={11} />
              {exporting ? 'Exporting…' : 'Export Excel'}
            </button>
            <div style={S.searchWrap}>
              <FaSearch size={11} color="#444" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)' }} />
              <input style={S.searchInput} placeholder="Search name / email" value={search} onChange={(e) => onSearch(e.target.value)} />
            </div>
          </div>

          {/* Table */}
          <div style={{ position: 'relative', overflowX: 'auto' }}>
            {studentsLoading && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                <Spinner animation="border" style={{ color: '#ff6b00', width: 24, height: 24 }} />
              </div>
            )}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...S.th, minWidth: 40 }}>#</th>
                  <th style={{ ...S.th, minWidth: 160 }}>Student</th>
                  <th style={{ ...S.th, minWidth: 180 }}>Email</th>
                  <th style={{ ...S.th, minWidth: 90, textAlign: 'center' }}>Enrolled</th>
                  <th style={{ ...S.th, minWidth: 160 }}>Avg Completion</th>
                  <th style={{ ...S.th, minWidth: 100, textAlign: 'center' }}>Progress</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: '#444' }}>No students found</td></tr>
                ) : students.map((s, i) => (
                  <tr key={s.userId}>
                    <td style={S.tdMuted}>{(pagination.page - 1) * pagination.limit + i + 1}</td>
                    <td style={{ ...S.td, fontWeight: 600, color: '#fff' }}>
                      {s.name || s.email?.split('@')[0] || '—'}
                    </td>
                    <td style={{ ...S.tdMuted, color: '#aaa' }}>{s.email}</td>
                    <td style={{ ...S.td, textAlign: 'center', color: '#22c55e', fontWeight: 700 }}>{s.enrolledCount}</td>
                    <td style={{ ...S.td, minWidth: 160 }}><ProgressBar pct={s.avgCompletion} /></td>
                    <td style={{ ...S.td, textAlign: 'center' }}>
                      <button
                        onClick={() => setModalStudent(s)}
                        style={{
                          background: 'rgba(255,107,0,0.12)', border: '1px solid rgba(255,107,0,0.3)',
                          color: '#ff6b00', borderRadius: 6, padding: '4px 12px',
                          fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={S.footer}>
            <span>
              Showing <strong style={{ color: '#aaa' }}>{(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)}</strong>
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

      {/* ── Student Progress Modal ───────────────────── */}
      {modalStudent && (() => {
        const completedCount = modalStudent.courses.filter((c) => c.status === 'Completed').length
        const inProgressCount = modalStudent.courses.filter((c) => c.status === 'In Progress').length
        const fmtDate = (d: string | null | undefined) => {
          if (!d) return null
          return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        }
        return (
          <div
            onClick={() => setModalStudent(null)}
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              background: 'rgba(0,0,0,0.75)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '1.5rem',
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#141414', border: '1px solid #252525',
                borderRadius: 20, width: '75vw', maxHeight: '90vh',
                overflow: 'hidden', display: 'flex', flexDirection: 'column',
                boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
              }}
            >
              {/* ── Header ── */}
              <div style={{
                background: '#1a1a1a', borderBottom: '1px solid #252525',
                padding: '1.5rem 2rem',
              }}>
                {/* Top row: avatar + name + close */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: 50, height: 50, borderRadius: '50%',
                      background: 'linear-gradient(135deg, rgba(255,107,0,0.25), rgba(255,107,0,0.08))',
                      border: '1.5px solid rgba(255,107,0,0.35)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#ff6b00', fontWeight: 800, fontSize: '1.2rem', flexShrink: 0,
                      letterSpacing: '-0.02em',
                    }}>
                      {(modalStudent.name || modalStudent.email || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem', marginBottom: 3 }}>
                        {modalStudent.name || modalStudent.email?.split('@')[0] || '—'}
                      </div>
                      <div style={{ color: '#555', fontSize: '0.78rem' }}>{modalStudent.email}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setModalStudent(null)}
                    style={{
                      background: '#222', border: '1px solid #333', color: '#777',
                      borderRadius: 10, width: 34, height: 34, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.2rem', lineHeight: 1, flexShrink: 0, transition: 'all 0.15s',
                    }}
                  >
                    ×
                  </button>
                </div>

                {/* Stats row */}
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {[
                    { label: 'Enrolled Courses', value: modalStudent.enrolledCount, color: '#3b82f6' },
                    { label: 'Avg Completion',   value: `${modalStudent.avgCompletion}%`, color: '#ff6b00' },
                    { label: 'Completed',         value: completedCount, color: '#22c55e' },
                    { label: 'In Progress',       value: inProgressCount, color: '#f59e0b' },
                    { label: 'Not Started',       value: modalStudent.enrolledCount - completedCount - inProgressCount, color: '#555' },
                  ].map((stat) => (
                    <div key={stat.label} style={{
                      flex: 1, background: '#111', borderRadius: 12, padding: '0.85rem 1rem',
                      border: '1px solid #222', borderTop: `2px solid ${stat.color}`,
                    }}>
                      <div style={{ color: stat.color, fontWeight: 800, fontSize: '1.3rem', lineHeight: 1, marginBottom: 5 }}>
                        {stat.value}
                      </div>
                      <div style={{ color: '#555', fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.04em' }}>
                        {stat.label.toUpperCase()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Body ── */}
              <div style={{ padding: '1.25rem 2rem 1.5rem', overflowY: 'auto', flex: 1 }}>
                <div style={{ color: '#444', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.85rem' }}>
                  Course Progress — {modalStudent.courses.length} {modalStudent.courses.length === 1 ? 'course' : 'courses'}
                </div>
                {modalStudent.courses.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#333', padding: '3rem', fontSize: '0.85rem' }}>
                    No course enrollments found
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '0.75rem' }}>
                    {modalStudent.courses.map((c, idx) => {
                      const col = statusColor(c.status)
                      const date = fmtDate(c.lastActivity)
                      return (
                        <div
                          key={c.courseId}
                          style={{
                            background: '#1a1a1a', borderRadius: 14, padding: '1.1rem 1.25rem',
                            border: '1px solid #252525',
                            borderLeft: `3px solid ${col.text}`,
                          }}
                        >
                          {/* Course number + title + badge */}
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.7rem', marginBottom: '0.85rem' }}>
                            <span style={{
                              flexShrink: 0, width: 24, height: 24, borderRadius: 6,
                              background: '#222', color: '#555', fontSize: '0.68rem', fontWeight: 700,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              {idx + 1}
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ color: '#e8e8e8', fontSize: '0.85rem', fontWeight: 600, lineHeight: 1.3, marginBottom: 4 }} title={c.title}>
                                {truncate(c.title, 56)}
                              </div>
                              <span style={{
                                display: 'inline-block',
                                background: col.bg, color: col.text, border: `1px solid ${col.border}`,
                                borderRadius: 5, padding: '1px 9px', fontSize: '0.68rem', fontWeight: 700,
                              }}>
                                {c.status}
                              </span>
                            </div>
                          </div>

                          {/* Progress bar + % */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: date ? 8 : 0 }}>
                            <div style={{ flex: 1, background: '#222', borderRadius: 8, height: 7, overflow: 'hidden' }}>
                              <div style={{
                                width: `${c.progress}%`,
                                background: c.progress >= 100
                                  ? 'linear-gradient(90deg, #16a34a, #22c55e)'
                                  : c.progress > 0
                                  ? 'linear-gradient(90deg, #ea580c, #ff6b00)'
                                  : '#2a2a2a',
                                height: '100%', borderRadius: 8, transition: 'width 0.5s ease',
                              }} />
                            </div>
                            <span style={{
                              color: c.progress >= 100 ? '#22c55e' : c.progress > 0 ? '#ff6b00' : '#444',
                              fontSize: '0.8rem', fontWeight: 700, minWidth: 36, textAlign: 'right',
                            }}>
                              {c.progress}%
                            </span>
                          </div>

                          {/* Last activity */}
                          {date && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#333', flexShrink: 0 }} />
                              <span style={{ color: '#444', fontSize: '0.7rem' }}>
                                Last activity&nbsp;
                                <span style={{ color: '#666' }}>{date}</span>
                              </span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Chart Tab ───────────────────────────────── */}
      {tab === 'chart' && (
        <div style={{ ...S.card, overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem 0.5rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>
                Enrollment by Course
              </div>
              <div style={{ color: '#555', fontSize: '0.78rem' }}>
                Showing top {Math.min(courses.length, 12)} courses · colored by enrollment level
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              {[{ color: '#22c55e', label: 'High' }, { color: '#ff6b00', label: 'Average' }, { color: '#ef4444', label: 'Low' }].map(({ color, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
                  <span style={{ color: '#aaa', fontSize: '0.75rem' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderBottom: '1px solid #1e1e1e', margin: '0.5rem 0 0' }} />
          <div style={{ padding: '0.5rem' }}>
            <ReactApexChart
              type="bar"
              height={Math.max(300, chartCourses.length * 44)}
              series={chartSeries}
              options={chartOptions}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default CourseEnrollmentFull
