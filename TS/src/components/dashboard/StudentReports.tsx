import { useState, useEffect, useRef } from 'react'
import { Modal } from 'react-bootstrap'
import {
  FaUserGraduate, FaSearch, FaFileDownload, FaUsers, FaChartLine, FaFilter,
  FaCalendarAlt, FaExclamationTriangle,
  FaBook, FaRobot,
  FaClipboardList, FaCheckCircle, FaStar,
  FaChevronLeft, FaChevronRight, FaChevronDown, FaTrophy, FaClock, FaMedal,
  FaSort, FaSortUp, FaSortDown,
  FaCode, FaEye, FaLanguage,
  FaIdCard, FaEnvelope, FaLayerGroup, FaTimes, FaExclamationCircle,
} from 'react-icons/fa'
import type { IconType } from 'react-icons'
import { useAuthContext } from '@/context/useAuthContext'
import './StudentReports.css'
import StudentReportDocument from './StudentReportDocument'
import StudentReportsSheet, { type SheetRow } from './StudentReportsSheet'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  type Student, type Report, type ReportMetric, type ReportStatus, type TrendPoint,
  sName, statusOf, STATUS_LABELS, rankText, profileImageUrl, reportMetrics, activitiesCompleted, monthRanges, formatDuration, activeDays,
} from './studentReportData'

/* ── Types ─────────────────────────────────────────────── */
type RowState = { loading: boolean }

/* ── Helpers ────────────────────────────────────────────── */
const scoreColor = (v: number)  => v >= 75 ? '#22c55e' : v >= 50 ? '#f59e0b' : v > 0 ? '#ef4444' : '#444'
const fmt        = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const PAGE_SIZE  = 10
const toDateInput = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const todayISO = () => toDateInput(new Date())
const METRIC_ICONS: Record<string, IconType> = {
  engagement: FaCalendarAlt, course: FaBook, interview: FaRobot,
  english: FaLanguage, assessment: FaClipboardList, code: FaCode,
}
const RADAR_LABELS: Record<string, string> = {
  engagement: 'Engagement', course: 'Course', interview: 'AI Interview',
  english: 'English', assessment: 'Assessments', code: 'Code',
}
const progressColor = (v: number) => v >= 80 ? '#31d866' : '#f5a524'

const StudentDetailPanel = ({ student, report, metrics, periodDays, onDownload, onClose, loading }: {
  student: Student
  report: Report
  metrics: ReportMetric[]
  periodDays: number
  onDownload: () => void
  onClose: () => void
  loading: boolean
}) => {
  const ranked = [...metrics].sort((a, b) => b.score - a.score)
  const strong = ranked.slice(0, 2).filter(metric => metric.score > 0)
  const weak = [...ranked].reverse().slice(0, 2)
  const status = statusOf(report)
  const rank = rankText(report)
  const [avatarFailed, setAvatarFailed] = useState(false)
  const listLabels = (items: ReportMetric[]) =>
    items.map(metric => `${metric.label} (${metric.score}%)`).join(' and ')

  /* Radar geometry */
  const cx = 100, cy = 82, maxR = 50
  const clamp = (v: number) => Math.min(100, Math.max(0, v))
  const point = (index: number, radius: number) => {
    const angle = (Math.PI * 2 * index) / metrics.length - Math.PI / 2
    return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius }
  }
  const polygon = (radiusOf: (index: number) => number) =>
    metrics.map((_, index) => { const { x, y } = point(index, radiusOf(index)); return `${x},${y}` }).join(' ')

  return (
    <>
      <div className="sr-detail-header">
        <div className="sr-detail-student">
          {report.student.profileImage && !avatarFailed
            ? <img src={profileImageUrl(report.student.profileImage)} alt="" onError={() => setAvatarFailed(true)} />
            : <span className="sr-avatar sr-detail-avatar">{sName(student).split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase()}</span>}
          <div>
            <div className="sr-detail-name">
              <strong>{sName(student)}</strong>
              <span className={`sr-status-pill sr-status-${status}`}>
                {status === 'on-track' ? <FaCheckCircle /> : status === 'not-started' ? <FaClock /> : <FaExclamationTriangle />} {STATUS_LABELS[status]}
              </span>
            </div>
            <small>
              <FaIdCard />
              {[student.rollNumber || report.student.rollNumber, student.branch || report.student.branch, report.student.batch || report.student.joiningYear].filter(Boolean).join('  |  ')}
            </small>
            <small><FaEnvelope /> {student.email}</small>
          </div>
        </div>
        <div className="sr-detail-kpis">
          <div><span><FaTrophy /></span><strong>{report.overallScore}%</strong><small>Overall Score</small></div>
          <div><span><FaMedal /></span><strong>{rank ? `${rank.label} ${rank.total}` : '—'}</strong><small>Institute Rank</small></div>
          <div><span><FaLayerGroup /></span><strong>{activitiesCompleted(report)}</strong><small>Activities Completed</small></div>
          <div><span><FaClock /></span><strong>{formatDuration(report.timeSpent.totalSecs)}</strong><small>Learning Time</small></div>
          <div><span><FaCalendarAlt /></span><strong>{activeDays(report)} / {periodDays}</strong><small>Active Days</small></div>
        </div>
        <button type="button" className="sr-export-button sr-detail-download" onClick={onDownload} disabled={loading}>
          {loading ? <span className="sr-button-loader" /> : <FaFileDownload />} Download Report (PDF)
        </button>
        <button type="button" className="sr-detail-close" onClick={onClose} aria-label="Close student details">
          <FaTimes />
        </button>
      </div>

      <div className="sr-detail-grid">
        <section className="sr-detail-card sr-skill-card">
          <h3>Skill Performance</h3>
          <svg className="sr-radar-chart" viewBox="0 0 200 165" role="img" aria-label="Student scores by module">
            {[1, 2, 3, 4].map(ring => (
              <polygon key={ring} points={polygon(() => maxR * ring / 4)} fill="none" stroke="#3a3027" strokeWidth="0.7" />
            ))}
            {metrics.map((metric, index) => {
              const { x, y } = point(index, maxR)
              return <line key={metric.key} x1={cx} y1={cy} x2={x} y2={y} stroke="#3a3027" strokeWidth="0.7" />
            })}
            <g className="sr-radar-shape" style={{ transformOrigin: `${cx}px ${cy}px` }}>
              <polygon points={polygon(index => maxR * clamp(metrics[index].score) / 100)} fill="rgba(255,122,0,0.45)" stroke="#ff8a19" strokeWidth="1.6" strokeLinejoin="round" />
              {metrics.map((metric, index) => {
                const { x, y } = point(index, maxR * clamp(metric.score) / 100)
                return <circle key={metric.key} cx={x} cy={y} r="2.8" fill="#ffb15e" stroke="#ff7a00" strokeWidth="1" />
              })}
            </g>
            {metrics.map((metric, index) => {
              const { x, y } = point(index, maxR + 14)
              const anchor = Math.abs(x - cx) < 4 ? 'middle' : x > cx ? 'start' : 'end'
              const top = y < cy - 4, bottom = y > cy + 4
              const baseY = top ? y - 9 : bottom && anchor === 'middle' ? y + 2 : y - 3
              return (
                <text key={metric.key} y={baseY} textAnchor={anchor} fill="#d5d8db" fontSize="7.5">
                  <tspan x={x}>{RADAR_LABELS[metric.key] ?? metric.label}</tspan>
                  <tspan x={x} dy="9" fill="#9aa0a6">({metric.score}%)</tspan>
                </text>
              )
            })}
          </svg>
        </section>

        <section className="sr-detail-card sr-progress-card">
          <h3>Section-wise Progress</h3>
          <div className="sr-detail-progress-list">
            {metrics.map(metric => {
              const Icon = METRIC_ICONS[metric.key] ?? FaChartLine
              return (
                <div className="sr-detail-progress-row" key={metric.key}>
                  <Icon className="sr-progress-icon" />
                  <span>{metric.label}</span>
                  <div><i style={{ width: `${clamp(metric.score)}%`, background: progressColor(metric.score) }} /></div>
                  <strong>{metric.score}%</strong>
                  <small>{metric.detail}</small>
                </div>
              )
            })}
          </div>
        </section>

        <section className="sr-detail-card sr-insights-card">
          <h3><FaStar /> EKLAV Insights</h3>
          <div className="sr-insight-item sr-insight-strong">
            <span><FaCheckCircle /></span>
            <p>
              <strong>Strong Areas: </strong>
              {strong.length ? listLabels(strong) : 'No module has activity in this period yet.'}
            </p>
          </div>
          <div className="sr-insight-item sr-insight-improve">
            <span><FaExclamationCircle /></span>
            <p><strong>Improvement Needed: </strong>{listLabels(weak)}</p>
          </div>
          <div className="sr-insight-item sr-insight-recommend">
            <span><FaChartLine /></span>
            <p>
              <strong>Recommendation: </strong>
              {report.overallScore >= 75
                ? 'Keep up the strong performance across modules.'
                : `Focus on ${weak.map(metric => metric.label.toLowerCase()).join(' and ')} this week to lift the overall score.`}
            </p>
          </div>
        </section>
      </div>
    </>
  )
}

/* ── Header filters ─────────────────────────────────────── */
const useDismiss = (open: boolean, close: () => void) => {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onPointer = (event: MouseEvent) => { if (!ref.current?.contains(event.target as Node)) close() }
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') close() }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onPointer); document.removeEventListener('keydown', onKey) }
  }, [open]) // eslint-disable-line
  return ref
}

const fmtRangeDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

const rangePresets = (): { label: string; from: string; to: string }[] => {
  const now = new Date()
  const daysAgo = (n: number) => { const d = new Date(now); d.setDate(d.getDate() - n); return toDateInput(d) }
  const y = now.getFullYear(), m = now.getMonth()
  return [
    // Empty range = everything since each student was onboarded (the API treats no dates as all time)
    { label: 'All time',     from: '', to: '' },
    { label: 'Today',        from: todayISO(), to: todayISO() },
    { label: 'Last 7 days',  from: daysAgo(6),  to: todayISO() },
    { label: 'Last 30 days', from: daysAgo(29), to: todayISO() },
    { label: 'This month',   from: toDateInput(new Date(y, m, 1)), to: toDateInput(new Date(y, m + 1, 0)) },
    { label: 'Last month',   from: toDateInput(new Date(y, m - 1, 1)), to: toDateInput(new Date(y, m, 0)) },
  ]
}

const DateRangePicker = ({ from, to, onChange }: { from: string; to: string; onChange: (from: string, to: string) => void }) => {
  const [open, setOpen] = useState(false)
  const [draftFrom, setDraftFrom] = useState(from)
  const [draftTo, setDraftTo] = useState(to)
  const ref = useDismiss(open, () => setOpen(false))

  useEffect(() => { if (open) { setDraftFrom(from); setDraftTo(to) } }, [open]) // eslint-disable-line

  const apply = (nextFrom: string, nextTo: string) => { onChange(nextFrom, nextTo); setOpen(false) }

  return (
    <div className="sr-dropdown" ref={ref}>
      <button type="button" className={`sr-dropdown-trigger sr-range-trigger${open ? ' is-open' : ''}`} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(v => !v)}>
        <FaCalendarAlt className="sr-range-icon" aria-hidden="true" />
        <span>{from && to ? `${fmtRangeDate(from)} – ${fmtRangeDate(to)}` : 'All time · since onboarding'}</span>
        <FaChevronDown className="sr-dropdown-caret" aria-hidden="true" />
      </button>
      {open && (
        <div className="sr-dropdown-menu sr-range-menu" role="dialog" aria-label="Select report date range">
          <div className="sr-range-presets">
            {rangePresets().map(preset => (
              <button
                key={preset.label}
                type="button"
                className={preset.from === from && preset.to === to ? 'is-active' : ''}
                onClick={() => apply(preset.from, preset.to)}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="sr-range-custom">
            <span className="sr-range-title">Custom range</span>
            <label>
              <span>From</span>
              <input type="date" value={draftFrom} max={draftTo || undefined} onChange={event => setDraftFrom(event.target.value)} />
            </label>
            <label>
              <span>To</span>
              <input type="date" value={draftTo} min={draftFrom || undefined} onChange={event => setDraftTo(event.target.value)} />
            </label>
            <button type="button" className="sr-range-apply" disabled={!draftFrom || !draftTo || draftFrom > draftTo} onClick={() => apply(draftFrom, draftTo)}>
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

type SelectOption = { value: string; label: string }
const toOptions = (allLabel: string, values: string[]): SelectOption[] =>
  [{ value: '', label: allLabel }, ...values.map(value => ({ value, label: value }))]

const HeaderSelect = ({ label, prefix, value, options, onChange }: {
  label: string; prefix?: string; value: string; options: SelectOption[]; onChange: (value: string) => void
}) => {
  const [open, setOpen] = useState(false)
  const ref = useDismiss(open, () => setOpen(false))
  const choose = (next: string) => { onChange(next); setOpen(false) }
  const current = options.find(option => option.value === value) ?? options[0]

  return (
    <div className="sr-dropdown" ref={ref}>
      <button type="button" className={`sr-dropdown-trigger sr-select-trigger${open ? ' is-open' : ''}`} aria-label={label} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(v => !v)}>
        {prefix && <span className="sr-select-prefix">{prefix}</span>}
        <span>{current?.label}</span>
        <FaChevronDown className="sr-dropdown-caret" aria-hidden="true" />
      </button>
      {open && (
        <ul className="sr-dropdown-menu sr-select-menu" role="listbox" aria-label={label}>
          {options.map(option => (
            <li key={option.value || '__all'} role="option" aria-selected={option.value === value}>
              <button type="button" className={option.value === value ? 'is-active' : ''} onClick={() => choose(option.value)}>
                {option.label}
                {option.value === value && <FaCheckCircle aria-hidden="true" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'All' },
  { value: 'on-track', label: 'On Track' },
  { value: 'needs-attention', label: 'Needs Attention' },
  { value: 'at-risk', label: 'At Risk' },
  { value: 'not-started', label: 'Not Started' },
]
const PERFORMANCE_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'All' },
  { value: 'high', label: '80–100%' },
  { value: 'medium', label: '50–79%' },
  { value: 'low', label: 'Below 50%' },
]

/* ── Main Component ─────────────────────────────────────── */
const StudentReports = ({ apiBase = '/api/institute' }: { apiBase?: string }) => {
  const { user }   = useAuthContext()
  const baseURL    = import.meta.env.VITE_API_BASE_URL
  const printRef   = useRef<HTMLDivElement>(null)

  const [allStudents, setAllStudents] = useState<Student[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [searchTerm, setSearchTerm]   = useState('')
  const [branchFilter, setBranchFilter] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  // Default: all time, so each student's progress runs from their onboarding date to today
  const [periodFrom, setPeriodFrom] = useState('')
  const [periodTo, setPeriodTo] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [performanceFilter, setPerformanceFilter] = useState('all')
  const [page, setPage]               = useState(1)
  const [rowState, setRowState]       = useState<Record<string, RowState>>({})
  const [performanceReports, setPerformanceReports] = useState<Record<string, Report>>({})
  const [loadingReportIds, setLoadingReportIds] = useState<Set<string>>(() => new Set())
  const [reportLoadErrors, setReportLoadErrors] = useState<Record<string, string>>({})
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [detailClosed, setDetailClosed] = useState(false)
  const [report, setReport]           = useState<Report | null>(null)
  const [trend, setTrend]             = useState<TrendPoint[]>([])
  const [exportProgress, setExportProgress] = useState<{ done: number; total: number } | null>(null)
  const [liveRanks, setLiveRanks]     = useState<Record<string, { position: number; total: number }>>({})
  const [rankSort, setRankSort]       = useState<'none' | 'asc' | 'desc'>('none')
  const [showModal, setShowModal]     = useState(false)
  const [modalError, setModalError]   = useState('')

  useEffect(() => {
    if (!user?.token) return
    setLoadingList(true)
    fetch(`${baseURL}${apiBase}/students`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setAllStudents(d.students || []) })
      .catch(console.error)
      .finally(() => setLoadingList(false))
  }, [user?.token]) // eslint-disable-line

  const branches = Array.from(new Set(allStudents.map(student => student.branch?.trim()).filter((branch): branch is string => !!branch))).sort()
  const years = Array.from(new Set(allStudents.map(student => String(student.joiningYear ?? '').trim()).filter(Boolean))).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
  const filtered = allStudents.filter(student => {
    const query = searchTerm.trim().toLowerCase()
    const matchesSearch = !query ||
      sName(student).toLowerCase().includes(query) ||
      student.email?.toLowerCase().includes(query) ||
      (student.rollNumber || '').toLowerCase().includes(query)
    const matchesBranch = !branchFilter || student.branch === branchFilter
    const matchesYear = !yearFilter || String(student.joiningYear ?? '') === yearFilter
    return matchesSearch && matchesBranch && matchesYear
  })
  /* Rank sort spans every page: live ranks cover the whole institute.
     Students without a rank always go last. */
  if (rankSort !== 'none') {
    const rankOf = (student: Student) =>
      liveRanks[student._id]?.position ?? performanceReports[student._id]?.rank?.position ?? null
    filtered.sort((a, b) => {
      const ra = rankOf(a), rb = rankOf(b)
      if (ra == null || rb == null) return ra == null ? (rb == null ? 0 : 1) : -1
      return rankSort === 'asc' ? ra - rb : rb - ra
    })
  }
  const cycleRankSort = () => {
    setRankSort(current => current === 'none' ? 'asc' : current === 'asc' ? 'desc' : 'none')
    setPage(1)
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const pageKey = paginated.map(student => student._id).join(',')

  useEffect(() => {
    let cancelled = false
    const students = paginated
    if (!user?.token || students.length === 0) {
      setPerformanceReports({})
      setLoadingReportIds(new Set())
      setReportLoadErrors({})
      return
    }

    const ids = new Set(students.map(student => student._id))
    setPerformanceReports({})
    setLoadingReportIds(ids)
    setReportLoadErrors({})

    const loadPageReports = async () => {
      await Promise.all(students.map(async student => {
        try {
          const params = new URLSearchParams({ userId: student._id })
          if (periodFrom) params.set('from', periodFrom)
          if (periodTo) params.set('to', periodTo)
          const response = await fetch(`${baseURL}${apiBase}/student-report?${params}`, {
            headers: { Authorization: `Bearer ${user.token}` },
          })
          if (!response.ok) throw new Error(`Could not load report (${response.status})`)
          const data = await response.json()
          if (!data.success || !data.report) throw new Error(data.message || 'Report data unavailable')
          if (!cancelled) {
            setPerformanceReports(previous => ({ ...previous, [student._id]: data.report as Report }))
          }
        } catch (error) {
          console.error(`Failed to load report for student ${student._id}:`, error)
          if (!cancelled) {
            setReportLoadErrors(previous => ({ ...previous, [student._id]: 'Unavailable' }))
          }
        } finally {
          if (!cancelled) {
            setLoadingReportIds(previous => {
              const next = new Set(previous)
              next.delete(student._id)
              return next
            })
          }
        }
      }))
    }

    void loadPageReports()
    return () => { cancelled = true }
  }, [pageKey, periodFrom, periodTo, user?.token, baseURL, apiBase])

  const getRow = (id: string): RowState => rowState[id] ?? { loading: false }
  const setRow = (id: string, patch: Partial<RowState>) =>
    setRowState(prev => ({ ...prev, [id]: { ...getRow(id), ...patch } }))

  const periodDays = periodFrom && periodTo
    ? Math.max(1, Math.floor((new Date(`${periodTo}T00:00:00`).getTime() - new Date(`${periodFrom}T00:00:00`).getTime()) / 86400000) + 1)
    : 30
  /* Days a student's engagement is measured against — from the API (starts at onboarding), else the picked range */
  const daysOf = (studentReport?: Report) => studentReport?.periodDays ?? periodDays
  const currentPageReports = paginated
    .map(student => performanceReports[student._id])
    .filter((studentReport): studentReport is Report => !!studentReport)
  const statusCounts = currentPageReports.reduce((counts, studentReport) => {
    counts[statusOf(studentReport)] += 1
    return counts
  }, { 'on-track': 0, 'needs-attention': 0, 'at-risk': 0, 'not-started': 0 } as Record<ReportStatus, number>)
  const averagePerformance = currentPageReports.length
    ? Math.round(currentPageReports.reduce((total, studentReport) => total + studentReport.overallScore, 0) / currentPageReports.length)
    : 0
  const displayedStudents = paginated.filter(student => {
    const studentReport = performanceReports[student._id]
    if (!studentReport && (statusFilter !== 'all' || performanceFilter !== 'all')) return false
    if (!studentReport) return true
    const score = studentReport.overallScore
    const status = statusOf(studentReport)
    const matchesStatus = statusFilter === 'all' || status === statusFilter
    const matchesPerformance = performanceFilter === 'all' ||
      (performanceFilter === 'high' && score >= 80) ||
      (performanceFilter === 'medium' && score >= 50 && score < 80) ||
      (performanceFilter === 'low' && score < 50)
    return matchesStatus && matchesPerformance
  })
  const selectedStudent = paginated.find(student => student._id === selectedStudentId) ?? paginated[0] ?? null
  /* Live institute rank for the selected period; falls back to the nightly-job rank in the report */
  useEffect(() => {
    if (!user?.token) return
    let cancelled = false
    const params = new URLSearchParams()
    if (periodFrom) params.set('from', periodFrom)
    if (periodTo) params.set('to', periodTo)
    fetch(`${baseURL}${apiBase}/student-ranks?${params}`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (!cancelled) setLiveRanks(d?.success ? d.ranks : {}) })
      .catch(() => { if (!cancelled) setLiveRanks({}) })
    return () => { cancelled = true }
  }, [user?.token, baseURL, apiBase, periodFrom, periodTo])
  const withLiveRank = (studentReport: Report, studentId: string): Report =>
    liveRanks[studentId] ? { ...studentReport, rank: liveRanks[studentId] } : studentReport

  const selectedReport = selectedStudent && performanceReports[selectedStudent._id]
    ? withLiveRank(performanceReports[selectedStudent._id], selectedStudent._id)
    : undefined

  const fetchStudentReport = async (studentId: string, from?: string, to?: string): Promise<Report | null> => {
    const params = new URLSearchParams({ userId: studentId })
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    const r = await fetch(`${baseURL}${apiBase}/student-report?${params}`, {
      headers: { Authorization: `Bearer ${user?.token}` },
    })
    const d = await r.json()
    if (!d.success) throw new Error(d.message || 'Failed to generate')
    return d.report as Report
  }

  /* Overall score for each of the 3 months ending with the report period */
  const fetchTrend = (studentId: string) =>
    Promise.all(monthRanges(periodTo || todayISO(), 3).map(async month => {
      try {
        const monthReport = await fetchStudentReport(studentId, month.from, month.to)
        return { label: month.label, score: monthReport ? Math.round(monthReport.overallScore) : null }
      } catch {
        return { label: month.label, score: null }
      }
    }))

  const generateReport = async (student: Student, action: 'preview' | 'download') => {
    setRow(student._id, { loading: true })
    setModalError('')
    try {
      const [studentReport, trendPoints] = await Promise.all([
        performanceReports[student._id] ?? fetchStudentReport(student._id, periodFrom, periodTo),
        fetchTrend(student._id),
      ])
      if (!studentReport) return
      setReport(withLiveRank(studentReport, student._id))
      setTrend(trendPoints)
      setShowModal(true)
      if (action === 'download') setTimeout(() => triggerPrint(), 500)
    } catch (error) {
      setModalError(error instanceof Error ? error.message : 'Network error')
      setShowModal(true)
    }
    finally { setRow(student._id, { loading: false }) }
  }

  const triggerPrint = () => {
    if (!printRef.current) return
    const content = printRef.current.outerHTML
    const pw = window.open('', '_blank')
    if (!pw) return
    pw.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Student Performance Report</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; padding: 0; background: #ffffff; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #1f2430; }
    @media print {
      @page { margin: 6mm; size: A4 portrait; }
      body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>${content}</body>
</html>`)
    pw.document.close()
    pw.onload = () => { setTimeout(() => { pw.print(); pw.close() }, 300) }
  }

  /* Export: landscape PDF of every filtered student — all six sections, overall, rank and status */
  const exportStudents = async () => {
    if (exportProgress) return
    // Open the window synchronously (still inside the click) so pop-up blockers allow it
    const pw = window.open('', '_blank')
    if (!pw) { alert('Please allow pop-ups for this site to export the PDF.'); return }
    pw.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Preparing report…</title></head><body style="font-family:Segoe UI,system-ui,sans-serif;display:grid;place-items:center;height:100vh;margin:0;color:#374151">Preparing student performance summary…</body></html>')

    const students = [...filtered]
    const reports: Record<string, Report> = { ...performanceReports }
    const queue = students.filter(student => !reports[student._id])
    let done = students.length - queue.length
    setExportProgress({ done, total: students.length })

    const worker = async () => {
      while (queue.length) {
        const student = queue.shift()!
        try {
          const studentReport = await fetchStudentReport(student._id, periodFrom, periodTo)
          if (studentReport) reports[student._id] = studentReport
        } catch (error) {
          console.error(`Export: report failed for ${student._id}`, error)
        }
        done += 1
        setExportProgress({ done, total: students.length })
      }
    }

    try {
      await Promise.all(Array.from({ length: 6 }, worker))

      const rows: SheetRow[] = students.map(student => {
        const studentReport = reports[student._id]
        return {
          student,
          report: studentReport,
          metrics: studentReport ? reportMetrics(studentReport, daysOf(studentReport)) : undefined,
          rank: liveRanks[student._id] ?? studentReport?.rank ?? null,
        }
      })
      // Ranked students first (best rank on top), then by overall score
      rows.sort((x, y) => {
        const rx = x.rank?.position ?? Infinity, ry = y.rank?.position ?? Infinity
        if (rx !== ry) return rx - ry
        return (y.report?.overallScore ?? -1) - (x.report?.overallScore ?? -1)
      })

      const html = renderToStaticMarkup(
        <StudentReportsSheet rows={rows} periodFrom={periodFrom} periodTo={periodTo} branch={branchFilter} year={yearFilter} />
      )
      pw.document.open()
      pw.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Student Performance Summary · ${periodFrom && periodTo ? `${periodFrom} to ${periodTo}` : 'All time'}</title>
  <style>
    body { margin: 0; background: #ffffff; }
    @media print { body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }
  </style>
</head>
<body>${html}</body>
</html>`)
      pw.document.close()
      pw.onload = () => { setTimeout(() => { pw.focus(); pw.print() }, 300) }
    } catch (error) {
      console.error('Export failed', error)
      pw.close()
      alert('Could not prepare the export. Please try again.')
    } finally {
      setExportProgress(null)
    }
  }

  /* ── Table UI ── */
  return (
    <div className="student-reports-dashboard">
      <header className="sr-header">
        <div className="sr-heading">
          <span className="sr-heading-icon"><FaUserGraduate /></span>
          <div>
            <h2>Student Reports</h2>
            <p>Unified performance reports across all EKLAV modules</p>
          </div>
        </div>
        <div className="sr-header-controls">
          <DateRangePicker from={periodFrom} to={periodTo} onChange={(from, to) => { setPeriodFrom(from); setPeriodTo(to) }} />
          <HeaderSelect label="Filter by branch" value={branchFilter} options={toOptions('All Branches', branches)} onChange={branch => { setBranchFilter(branch); setPage(1) }} />
          <HeaderSelect label="Filter by joining year" value={yearFilter} options={toOptions('All Years', years)} onChange={year => { setYearFilter(year); setPage(1) }} />
          <button type="button" className="sr-export-button" onClick={exportStudents} disabled={loadingList || filtered.length === 0 || !!exportProgress} title="Download a PDF summary of every student in the current filter">
            {exportProgress
              ? <><span className="sr-button-loader" /> Preparing {exportProgress.done}/{exportProgress.total}</>
              : <><FaFileDownload /> Export PDF</>}
          </button>
        </div>
      </header>

      <section className="sr-summary" aria-label="Student report summary">
        <article className="sr-summary-card sr-card-orange">
          <span className="sr-summary-icon sr-icon-orange"><FaUsers /></span>
          <div><strong>{loadingList ? '—' : allStudents.length}</strong><span>Total Students</span></div>
        </article>
        <article className="sr-summary-card sr-card-green">
          <span className="sr-summary-icon sr-icon-green"><FaCheckCircle /></span>
          <div><strong>{statusCounts['on-track']} <small>({currentPageReports.length ? Math.round(statusCounts['on-track'] / currentPageReports.length * 100) : 0}%)</small></strong><span>On Track · This Page</span></div>
        </article>
        <article className="sr-summary-card sr-card-amber">
          <span className="sr-summary-icon sr-icon-amber"><FaExclamationTriangle /></span>
          <div><strong>{statusCounts['needs-attention']} <small>({currentPageReports.length ? Math.round(statusCounts['needs-attention'] / currentPageReports.length * 100) : 0}%)</small></strong><span>Needs Attention · This Page</span></div>
        </article>
        <article className="sr-summary-card sr-card-red sr-summary-note">
          <span className="sr-summary-icon sr-icon-red"><FaExclamationTriangle /></span>
          <div><strong>{statusCounts['at-risk']} <small>({currentPageReports.length ? Math.round(statusCounts['at-risk'] / currentPageReports.length * 100) : 0}%)</small></strong><span>At Risk · This Page</span></div>
        </article>
        <article className="sr-summary-card sr-card-green sr-average-card">
          <span className="sr-average-ring" style={{ background: `conic-gradient(#31d866 ${averagePerformance * 3.6}deg, #303438 0deg)` }}>
            <span>{currentPageReports.length ? `${averagePerformance}%` : '—'}</span>
          </span>
          <div><strong>Average Performance</strong><span>{currentPageReports.length} reports loaded on this page</span></div>
        </article>
      </section>

      <section className="sr-table-panel" aria-label="Student performance reports">
        <div className="sr-toolbar">
          <div className="sr-search">
            <FaSearch aria-hidden="true" />
            <input
              aria-label="Search students"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setPage(1) }}
              placeholder="Search by name, roll number or email"
            />
          </div>
          <div className="sr-filters sr-report-filters">
            <HeaderSelect label="Filter table by branch" prefix="Branch:" value={branchFilter} options={toOptions('All', branches)} onChange={branch => { setBranchFilter(branch); setPage(1) }} />
            <HeaderSelect label="Filter table by joining year" prefix="Year:" value={yearFilter} options={toOptions('All', years)} onChange={year => { setYearFilter(year); setPage(1) }} />
            <HeaderSelect label="Filter by report status" prefix="Status:" value={statusFilter} options={STATUS_OPTIONS} onChange={setStatusFilter} />
            <HeaderSelect label="Filter by performance" prefix="Performance:" value={performanceFilter} options={PERFORMANCE_OPTIONS} onChange={setPerformanceFilter} />
            <span className="sr-result-count">
              {filtered.length ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} of ${filtered.length}` : '0 students'}
            </span>
            {filtered.length > PAGE_SIZE && (
              <span className="sr-compact-pagination">
                <button type="button" onClick={() => setPage(current => Math.max(1, current - 1))} disabled={page === 1} aria-label="Previous page"><FaChevronLeft /></button>
                <button type="button" onClick={() => setPage(current => Math.min(totalPages, current + 1))} disabled={page === totalPages} aria-label="Next page"><FaChevronRight /></button>
              </span>
            )}
          </div>
        </div>

        <div className="sr-table-scroll">
          <div className="sr-table">
            <div className="sr-table-head">
              {['#', 'Student', 'Roll / Branch', 'Daily Engagement', 'Course Progress', 'AI Interview', 'English Practice', 'Assessments', 'Code Challenge', 'Overall', 'Rank', 'Status', 'Actions'].map(heading => heading === 'Rank' ? (
                <div key={heading} aria-sort={rankSort === 'asc' ? 'ascending' : rankSort === 'desc' ? 'descending' : 'none'}>
                  <button type="button" className={`sr-sort-button${rankSort !== 'none' ? ' is-active' : ''}`} onClick={cycleRankSort} title="Sort by rank">
                    Rank {rankSort === 'asc' ? <FaSortUp /> : rankSort === 'desc' ? <FaSortDown /> : <FaSort />}
                  </button>
                </div>
              ) : (
                <div key={heading}>{heading}</div>
              ))}
            </div>

            {loadingList && (
              <div className="sr-empty">
                <span className="sr-loader" />
                <span>Loading students…</span>
              </div>
            )}
            {!loadingList && filtered.length === 0 && (
              <div className="sr-empty">
                <FaUserGraduate />
                <span>No students match your filters.</span>
              </div>
            )}
            {!loadingList && filtered.length > 0 && displayedStudents.length === 0 && (
              <div className="sr-empty">
                <FaFilter />
                <span>No students on this page match the selected status or performance filter.</span>
              </div>
            )}

            {!loadingList && displayedStudents.map(student => {
              const row = getRow(student._id)
              const displayName = sName(student)
              const initials = displayName.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase()
              const studentReport = performanceReports[student._id]
              const metrics = studentReport ? reportMetrics(studentReport, daysOf(studentReport)) : []
              const score = studentReport?.overallScore
              const status = studentReport ? statusOf(studentReport) : null
              return (
                <div className="sr-table-row" key={student._id}>
                  <div className="sr-row-number">{filtered.indexOf(student) + 1}</div>
                  <div className="sr-student-cell">
                    <span className="sr-avatar">{initials}</span>
                    <button type="button" className={`sr-student-copy${selectedStudent?._id === student._id ? ' is-selected' : ''}`} onClick={() => { setSelectedStudentId(student._id); setDetailClosed(false) }}>
                      <strong>{displayName}</strong>
                      <small>{student.email}</small>
                    </button>
                  </div>
                  <div className="sr-branch-cell">
                    <strong>{student.rollNumber || '—'}</strong>
                    <small>{student.branch || 'Branch not set'}</small>
                  </div>
                  {metrics.length > 0
                    ? metrics.map(metric => (
                      <div className="sr-score-cell" key={metric.key} title={metric.detail}>
                        <strong>{metric.score}%</strong>
                        <span><i style={{ width: `${Math.min(100, Math.max(0, metric.score))}%`, background: scoreColor(metric.score) }} /></span>
                      </div>
                    ))
                    : (
                      <div className="sr-metric-placeholder" style={{ gridColumn: 'span 6' }}>
                        {loadingReportIds.has(student._id) ? 'Loading performance…' : reportLoadErrors[student._id] || 'No performance data'}
                      </div>
                    )}
                  <div className="sr-overall-score">
                    {score == null ? '—' : <span style={{ color: scoreColor(score) }}>{Math.round(score)}%</span>}
                  </div>
                  <div className="sr-rank-cell">
                    {(() => {
                      const rank = studentReport ? rankText(withLiveRank(studentReport, student._id)) : null
                      return rank ? <><strong>{rank.label}</strong><small>{rank.total}</small></> : <small>—</small>
                    })()}
                  </div>
                  <div className="sr-status-cell">
                    {status
                      ? <span className={`sr-status-pill sr-status-${status}`}>{STATUS_LABELS[status]}</span>
                      : <span className="sr-status-pill sr-status-pending">{loadingReportIds.has(student._id) ? 'Loading' : 'Unavailable'}</span>}
                  </div>
                  <div className="sr-actions">
                    <button type="button" className="sr-view-button" onClick={() => generateReport(student, 'preview')} disabled={row.loading}>
                      {row.loading ? <span className="sr-button-loader" /> : <FaEye />}
                      View
                    </button>
                    <button type="button" className="sr-pdf-button" onClick={() => generateReport(student, 'download')} disabled={row.loading}>
                      <FaFileDownload /> PDF
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {!loadingList && filtered.length > PAGE_SIZE && (
          <div className="sr-pagination">
            <span>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
            <div className="sr-pagination-controls">
              <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} aria-label="Previous page"><FaChevronLeft /></button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, k) => {
                const pageNumber = page <= 3 ? k + 1 : page - 2 + k
                if (pageNumber < 1 || pageNumber > totalPages) return null
                return <button type="button" key={pageNumber} className={pageNumber === page ? 'active' : ''} onClick={() => setPage(pageNumber)}>{pageNumber}</button>
              })}
              <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} aria-label="Next page"><FaChevronRight /></button>
            </div>
          </div>
        )}
      </section>

      {!detailClosed && <section className="sr-student-detail" aria-label="Selected student performance details">
        {!selectedStudent ? (
          <div className="sr-empty">Select a student to view the detailed report.</div>
        ) : !selectedReport ? (
          <div className="sr-detail-loading">
            {loadingReportIds.has(selectedStudent._id)
              ? <><span className="sr-loader" /> Loading {sName(selectedStudent)}’s performance report…</>
              : <><FaExclamationTriangle /> {reportLoadErrors[selectedStudent._id] || 'Performance report is not available for this student.'}</>}
          </div>
        ) : (
          <StudentDetailPanel
            key={selectedStudent._id}
            student={selectedStudent}
            report={selectedReport}
            metrics={reportMetrics(selectedReport, daysOf(selectedReport))}
            periodDays={daysOf(selectedReport)}
            onDownload={() => generateReport(selectedStudent, 'download')}
            onClose={() => setDetailClosed(true)}
            loading={getRow(selectedStudent._id).loading}
          />
        )}
      </section>}

      {/* Report Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} fullscreen>
        <Modal.Header closeButton style={{ background: '#0a0a0a', borderBottom: '1px solid #1a1a1a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FaUserGraduate size={16} color="#ff6b00" />
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>
                {report ? `${report.student.name} — Performance Report` : 'Performance Report'}
              </div>
              {report && (
                <div style={{ color: '#444', fontSize: '0.68rem' }}>
                  {report.period.from || report.period.to ? `${fmt(report.period.from)} → ${fmt(report.period.to)}` : 'All Time'}
                </div>
              )}
            </div>
          </div>
          {report && (
            <button onClick={triggerPrint}
              style={{ marginLeft: 'auto', marginRight: '2rem', display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#ff6b00', border: 'none', color: '#fff', fontWeight: 700, borderRadius: 8, padding: '8px 16px', fontSize: '0.82rem', cursor: 'pointer' }}>
              <FaFileDownload size={12} /> Download PDF
            </button>
          )}
        </Modal.Header>
        <Modal.Body style={{ background: '#2a2d31', padding: '1.5rem', overflowY: 'auto' as const }}>
          {modalError && (
            <div style={{ background: '#1a0a0a', border: '1px solid #5a1a1a', borderRadius: 8, padding: '10px 14px', color: '#ef4444', fontSize: '0.8rem', marginBottom: '1rem' }}>
              {modalError}
            </div>
          )}
          {report && (
            <div ref={printRef}>
              <StudentReportDocument
                report={report}
                metrics={reportMetrics(report, daysOf(report))}
                periodDays={daysOf(report)}
                trend={trend}
              />
            </div>
          )}
        </Modal.Body>
      </Modal>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default StudentReports
