import { useCallback, useEffect, useRef, useState } from 'react'
import { Spinner } from 'react-bootstrap'
import {
  FaCalendarAlt, FaCheckCircle, FaClock, FaDownload, FaFilePdf, FaLaptop, FaMedal, FaRedo,
  FaSearch, FaSyncAlt, FaTimesCircle, FaTrophy, FaUserGraduate,
} from 'react-icons/fa'
import ReactApexChart from 'react-apexcharts'
import { useAuthContext } from '@/context/useAuthContext'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

/* ─── Types ─────────────────────────────────────────────── */
type DayData = { minutes: number; isActive: boolean; loginAt: string | null }

type Student = {
  userId: string
  name: string
  email: string
  branch: string
  isActiveToday: boolean
  totalMinutes: number
  todayMinutes: number
  daily: Record<string, DayData>
}

type SortBy = 'totalMinutes' | 'name' | 'todayMinutes'
type SortOrder = 'asc' | 'desc'

type TrendPoint = { date: string; active: number; inactive: number; totalMinutes: number }
type HeatmapCell = { date: string; weekday: string; weekIndex: number; active: number }
type TopLearner = { userId: string; name: string; minutes: number }

type Summary = { totalStudents: number; activeToday: number; inactiveToday: number }

type ExtraStats = {
  avgStudyMinutes: number
  totalSessions: number
  avgLoginTime: string | null
  avgLogoutTime: string | null
  topLearners: TopLearner[]
  peakUsageHour: string | null
  lowestUsageHour: string | null
  departments: string[]
  newStudentsThisMonth: number
  avgStudyMinutesTrendPct: number
  totalSessionsTrendPct: number
}

type Pagination = { total: number; page: number; limit: number; totalPages: number }

type DateRangeMode = 'today' | '7d' | '30d' | 'custom'

const EMPTY_EXTRA: ExtraStats = {
  avgStudyMinutes: 0, totalSessions: 0, avgLoginTime: null, avgLogoutTime: null,
  topLearners: [], peakUsageHour: null, lowestUsageHour: null, departments: [],
  newStudentsThisMonth: 0, avgStudyMinutesTrendPct: 0, totalSessionsTrendPct: 0,
}

/* ─── Helpers ────────────────────────────────────────────── */
const toDateStr = (d = new Date()) => d.toISOString().slice(0, 10)

const defaultEnd = () => toDateStr()
const defaultStart = () => {
  const d = new Date()
  d.setDate(d.getDate() - 6)
  return toDateStr(d)
}

const fmtMin = (mins: number) => {
  if (mins === 0) return '—'
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

const fmtColDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

const fmtHeaderDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

const AVATAR_COLORS = ['#ff6b00', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6', '#f59e0b', '#ef4444']
const avatarColor = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
const initials = (name: string) => name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || '?'

/* ─── Styles ─────────────────────────────────────────────── */
const S = {
  statGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
    gap: '0.6rem',
    marginBottom: '1rem',
  } as React.CSSProperties,
  statCard: {
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '10px',
    padding: '0.65rem 0.8rem',
  } as React.CSSProperties,
  iconCircle: (accent: string): React.CSSProperties => ({
    background: accent,
    borderRadius: '50%',
    width: 26, height: 26,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  }),
  numSm: {
    fontSize: '1.3rem',
    fontWeight: 800,
    color: '#fff',
    lineHeight: 1,
    marginBottom: 3,
  } as React.CSSProperties,
  labelSm: { color: '#999', fontSize: '0.72rem' } as React.CSSProperties,
  sub: (accent: string): React.CSSProperties => ({ color: accent, fontSize: '0.66rem', fontWeight: 600, display: 'block' }),
  sectionLabel: {
    color: '#aaa',
    fontSize: '0.7rem',
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    marginBottom: '0.75rem',
  },
  filterLabel: {
    color: '#777',
    fontSize: '0.66rem',
    fontWeight: 600,
    whiteSpace: 'nowrap' as const,
  },
  card: {
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '14px',
  } as React.CSSProperties,
  cardHeader: {
    padding: '0.9rem 1.1rem',
    borderBottom: '1px solid #2a2a2a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as React.CSSProperties,
  cardTitle: { color: '#fff', fontWeight: 700, fontSize: '0.85rem' } as React.CSSProperties,
  dateInput: {
    background: '#111',
    border: '1px solid #2a2a2a',
    color: '#fff',
    borderRadius: '8px',
    padding: '6px 12px',
    fontSize: '0.82rem',
    colorScheme: 'dark',
  } as React.CSSProperties,
  select: {
    background: '#111',
    border: '1px solid #2a2a2a',
    color: '#fff',
    borderRadius: '8px',
    padding: '6px 26px 6px 12px',
    fontSize: '0.82rem',
    cursor: 'pointer',
    appearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23888' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
  } as React.CSSProperties,
  searchWrap: { position: 'relative' } as React.CSSProperties,
  input: (extra?: React.CSSProperties): React.CSSProperties => ({
    background: '#111',
    border: '1px solid #2a2a2a',
    color: '#fff',
    borderRadius: '8px',
    padding: '6px 12px 6px 28px',
    fontSize: '0.82rem',
    width: 220,
    ...extra,
  }),
  applyBtn: {
    background: '#ff6b00',
    border: 'none',
    color: '#fff',
    fontWeight: 600,
    borderRadius: '8px',
    padding: '6px 18px',
    fontSize: '0.82rem',
    cursor: 'pointer',
  } as React.CSSProperties,
  resetBtn: {
    background: 'transparent',
    border: '1px solid #2a2a2a',
    color: '#aaa',
    fontWeight: 600,
    borderRadius: '8px',
    padding: '6px 16px',
    fontSize: '0.82rem',
    cursor: 'pointer',
  } as React.CSSProperties,
  headerBtn: (accent: string): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 6,
    background: `${accent}18`, border: `1px solid ${accent}44`,
    color: accent, borderRadius: 8, padding: '7px 14px',
    fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', flexShrink: 0,
  }),
  th: {
    background: '#111',
    color: '#666',
    fontSize: '0.62rem',
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
    padding: '0.6rem 0.5rem',
    textAlign: 'left' as const,
    borderBottom: '1px solid #2a2a2a',
    whiteSpace: 'nowrap' as const,
  },
  thSortable: {
    cursor: 'pointer',
    userSelect: 'none' as const,
  },
  td: {
    padding: '0.55rem 0.5rem',
    borderBottom: '1px solid #1e1e1e',
    color: '#e0e0e0',
    fontSize: '0.78rem',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,
  tdMuted: {
    padding: '0.55rem 0.5rem',
    borderBottom: '1px solid #1e1e1e',
    color: '#555',
    fontSize: '0.74rem',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,
  dayCell: (mins: number): React.CSSProperties => ({
    padding: '0.55rem 0.4rem',
    borderBottom: '1px solid #1e1e1e',
    color: mins > 0 ? '#ff6b00' : '#333',
    fontWeight: mins > 0 ? 600 : 400,
    fontSize: '0.76rem',
    textAlign: 'center' as const,
    whiteSpace: 'nowrap' as const,
    background: mins > 0 ? 'rgba(255,107,0,0.04)' : 'transparent',
  }),
  badge: (active: boolean): React.CSSProperties => ({
    background: active ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
    color: active ? '#22c55e' : '#ef4444',
    border: `1px solid ${active ? '#22c55e33' : '#ef444433'}`,
    borderRadius: '6px',
    padding: '2px 10px',
    fontSize: '0.7rem',
    fontWeight: 600,
  }),
  footer: {
    background: '#111',
    borderTop: '1px solid #2a2a2a',
    color: '#555',
    fontSize: '0.78rem',
    padding: '0.6rem 1.25rem',
    borderRadius: '0 0 14px 14px',
  } as React.CSSProperties,
  heatCell: (intensity: number): React.CSSProperties => ({
    width: '100%',
    height: 16,
    borderRadius: 3,
    background: intensity <= 0 ? '#232323' : `rgba(255,107,0,${0.15 + Math.min(intensity, 1) * 0.7})`,
  }),
}

// #, Student, Department, Status stay pinned via position:sticky while the
// date columns scroll horizontally underneath — fixed pixel widths (via
// colgroup + tableLayout:fixed) so each column's sticky `left` offset lines
// up exactly with where it actually renders.
const STICKY_COL = {
  numW: 36, studentW: 170, deptW: 90, statusW: 80,
  numLeft: 0, studentLeft: 36, deptLeft: 36 + 170, statusLeft: 36 + 170 + 90,
}

/* ─── Pagination button ──────────────────────────────────── */
const PagBtn = ({
  children, onClick, disabled = false, active = false,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  active?: boolean
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      background:   active ? '#ff6b00' : '#1a1a1a',
      border:       `1px solid ${active ? '#ff6b00' : '#2a2a2a'}`,
      color:        active ? '#fff' : disabled ? '#333' : '#888',
      borderRadius: '6px',
      padding:      '4px 10px',
      fontSize:     '0.78rem',
      fontWeight:   active ? 600 : 400,
      cursor:       disabled ? 'not-allowed' : 'pointer',
      minWidth:     32,
    }}
  >
    {children}
  </button>
)

/* ─── Sortable column header ────────────────────────────── */
const SortableTh = ({
  label, sortKey, sortBy, sortOrder, onClick, style,
}: {
  label: string
  sortKey: SortBy
  sortBy: SortBy
  sortOrder: SortOrder
  onClick: (key: SortBy) => void
  style?: React.CSSProperties
}) => (
  <th style={{ ...S.th, ...S.thSortable, ...style }} onClick={() => onClick(sortKey)}>
    {label} {sortBy === sortKey ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
  </th>
)

/* ─── Component ──────────────────────────────────────────── */
const DailyEngagement = ({ apiBase = '/api/institute' }: { apiBase?: string }) => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [startDate, setStartDate] = useState(defaultStart)
  const [endDate, setEndDate] = useState(defaultEnd)
  const [appliedStart, setAppliedStart] = useState(defaultStart)
  const [appliedEnd, setAppliedEnd] = useState(defaultEnd)
  const [dateRangeMode, setDateRangeMode] = useState<DateRangeMode>('7d')

  const [summary, setSummary] = useState<Summary>({ totalStudents: 0, activeToday: 0, inactiveToday: 0 })
  const [trend, setTrend] = useState<TrendPoint[]>([])
  const [heatmap, setHeatmap] = useState<HeatmapCell[]>([])
  const [extra, setExtra] = useState<ExtraStats>(EMPTY_EXTRA)
  const [dates, setDates] = useState<string[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [tableLoading, setTableLoading] = useState(false)

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [showAllLearners, setShowAllLearners] = useState(false)
  const [sortBy, setSortBy] = useState<SortBy>('totalMinutes')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  // Applied (live) filters
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [department, setDepartment] = useState('')
  const [minMinutes, setMinMinutes] = useState('')
  const [maxMinutes, setMaxMinutes] = useState('') // '' or '180' means unbounded

  // Draft filters — batched together, only take effect on "Apply Filters"
  const [draftFilter, setDraftFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [draftDepartment, setDraftDepartment] = useState('')
  const [draftDuration, setDraftDuration] = useState<[number, number]>([0, 180])

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  type FetchOpts = {
    page?: number; limit?: number; search?: string; filter?: string; department?: string
    sortBy?: SortBy; sortOrder?: SortOrder; minMinutes?: string; maxMinutes?: string
    fullReload?: boolean
  }

  const buildParams = (start: string, end: string, opts: FetchOpts) => {
    const params = new URLSearchParams({
      startDate: start,
      endDate:   end,
      page:      String(opts.page   ?? 1),
      limit:     String(opts.limit  ?? 20),
      search:    opts.search  ?? '',
      filter:    opts.filter  ?? 'all',
      sortBy:    opts.sortBy  ?? 'totalMinutes',
      order:     opts.sortOrder ?? 'desc',
    })
    if (opts.department) params.set('department', opts.department)
    if (opts.minMinutes) params.set('minMinutes', opts.minMinutes)
    if (opts.maxMinutes) params.set('maxMinutes', opts.maxMinutes)
    return params
  }

  const fetchData = useCallback(async (start: string, end: string, opts: FetchOpts = {}) => {
    if (!user?.token) return
    const isFullReload = opts.fullReload !== false && (!opts.page || opts.page === 1)
    isFullReload ? setLoading(true) : setTableLoading(true)
    try {
      const params = buildParams(start, end, opts)
      const res  = await fetch(`${baseURL}${apiBase}/daily-engagement?${params}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      })
      const data = await res.json()
      if (data.success) {
        if (isFullReload) {
          setSummary(data.summary)
          setTrend(data.trend || [])
          setHeatmap(data.heatmap || [])
          setExtra(data.extra || EMPTY_EXTRA)
          setDates(data.dates)
        }
        setStudents(data.students)
        setPagination(data.pagination)
      }
    } catch (err) {
      console.error('Daily engagement fetch error:', err)
    } finally {
      setLoading(false)
      setTableLoading(false)
    }
  }, [user?.token, baseURL, apiBase]) // eslint-disable-line

  const currentOpts = (): FetchOpts => ({
    page, limit, search, filter, department, sortBy, sortOrder, minMinutes, maxMinutes,
  })

  // Initial + date range load
  useEffect(() => {
    setPage(1)
    fetchData(appliedStart, appliedEnd, { ...currentOpts(), page: 1, fullReload: true })
  }, [appliedStart, appliedEnd])   // eslint-disable-line

  // Page / limit change
  useEffect(() => {
    fetchData(appliedStart, appliedEnd, { ...currentOpts(), fullReload: false })
  }, [page, limit])                // eslint-disable-line

  // Search with 400ms debounce
  const onSearchChange = (val: string) => {
    setSearch(val)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setPage(1)
      fetchData(appliedStart, appliedEnd, { ...currentOpts(), page: 1, search: val, fullReload: false })
    }, 400)
  }

  // Column-header sort (instant)
  const onSortChange = (nextSortBy: SortBy) => {
    const nextOrder: SortOrder = nextSortBy === sortBy ? (sortOrder === 'desc' ? 'asc' : 'desc') : 'desc'
    setSortBy(nextSortBy)
    setSortOrder(nextOrder)
    setPage(1)
    fetchData(appliedStart, appliedEnd, { ...currentOpts(), page: 1, sortBy: nextSortBy, sortOrder: nextOrder, fullReload: false })
  }

  // Batched filter apply — Status, Department, Duration all commit together
  const applyFilters = () => {
    const nextMin = String(draftDuration[0])
    const nextMax = draftDuration[1] >= 180 ? '' : String(draftDuration[1])
    setFilter(draftFilter)
    setDepartment(draftDepartment)
    setMinMinutes(nextMin)
    setMaxMinutes(nextMax)
    setPage(1)
    fetchData(appliedStart, appliedEnd, {
      ...currentOpts(), page: 1, filter: draftFilter, department: draftDepartment,
      minMinutes: nextMin, maxMinutes: nextMax, fullReload: false,
    })
  }

  const resetFilters = () => {
    setDraftFilter('all'); setFilter('all')
    setDraftDepartment(''); setDepartment('')
    setDraftDuration([0, 180]); setMinMinutes(''); setMaxMinutes('')
    setSearch('')
    setDateRangeMode('7d')
    const start = defaultStart(), end = defaultEnd()
    setStartDate(start); setEndDate(end)
    setAppliedStart(start); setAppliedEnd(end)
    setPage(1)
    fetchData(start, end, { page: 1, limit, search: '', filter: 'all', department: '', sortBy, sortOrder, minMinutes: '', maxMinutes: '', fullReload: true })
  }

  // Date range preset / custom
  const onDateRangeModeChange = (mode: DateRangeMode) => {
    setDateRangeMode(mode)
    if (mode === 'custom') return // wait for explicit Apply
    const daysBack = mode === 'today' ? 0 : mode === '30d' ? 29 : 6
    const end = defaultEnd()
    const d = new Date()
    d.setDate(d.getDate() - daysBack)
    const start = toDateStr(d)
    setStartDate(start)
    setEndDate(end)
    setAppliedStart(start)
    setAppliedEnd(end)
  }

  const applyCustomRange = () => {
    if (!startDate || !endDate || startDate > endDate) return
    setAppliedStart(startDate)
    setAppliedEnd(endDate)
  }

  const refresh = async () => {
    setRefreshing(true)
    await fetchData(appliedStart, appliedEnd, { ...currentOpts(), page: 1, fullReload: true })
    setPage(1)
    setRefreshing(false)
  }

  const fetchAllFiltered = async (): Promise<Student[]> => {
    if (!user?.token) return []
    const params = buildParams(appliedStart, appliedEnd, { ...currentOpts(), page: 1, limit: 9999 })
    const res = await fetch(`${baseURL}${apiBase}/daily-engagement?${params}`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
    const data = await res.json()
    return data.students || []
  }

  const handleExportExcel = async () => {
    if (!user?.token) return
    setExporting('excel')
    try {
      const rows = (await fetchAllFiltered()).map((s, i) => ({
        '#': i + 1,
        'Name': s.name,
        'Email': s.email,
        'Department': s.branch,
        'Status': s.isActiveToday ? 'Active' : 'Inactive',
        "Today's Time (min)": s.todayMinutes,
        'Total Time (min)': s.totalMinutes,
      }))
      const ws = XLSX.utils.json_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Daily Engagement')
      XLSX.writeFile(wb, `Daily_Engagement_${appliedStart}_${appliedEnd}.xlsx`)
    } catch (e) {
      console.error('Export error:', e)
    } finally {
      setExporting(null)
    }
  }

  const handleExportPdf = async () => {
    if (!user?.token) return
    setExporting('pdf')
    try {
      const rows = await fetchAllFiltered()
      const doc = new jsPDF()
      doc.setFontSize(14)
      doc.text('Daily Student Engagement', 14, 16)
      doc.setFontSize(9)
      doc.setTextColor(120)
      doc.text(`${fmtHeaderDate(appliedStart)} - ${fmtHeaderDate(appliedEnd)}`, 14, 22)
      autoTable(doc, {
        startY: 28,
        head: [['#', 'Name', 'Email', 'Department', 'Status', "Today (min)", 'Total (min)']],
        body: rows.map((s, i) => [
          i + 1, s.name, s.email, s.branch || '—', s.isActiveToday ? 'Active' : 'Inactive', s.todayMinutes, s.totalMinutes,
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [255, 107, 0] },
      })
      doc.save(`Daily_Engagement_${appliedStart}_${appliedEnd}.pdf`)
    } catch (e) {
      console.error('PDF export error:', e)
    } finally {
      setExporting(null)
    }
  }

  const activeRate = summary.totalStudents > 0
    ? Math.round((summary.activeToday / summary.totalStudents) * 100)
    : 0

  const topLearner = extra.topLearners[0] || null

  // Round the axis max up to a multiple of 4 hours so tickAmount:4 always
  // lands exactly on whole-hour marks (0h/Xh/2Xh/3Xh/4Xh) instead of
  // arbitrary fractions like 2.75h that round inconsistently at render time.
  const rawMaxMinutes = Math.max(1, ...trend.map((t) => t.totalMinutes))
  const lineChartMaxMinutes = Math.max(240, Math.ceil(rawMaxMinutes / 240) * 240)
  const fmtAxisTime = (mins: number) => (mins <= 0 ? '0h' : `${Math.round(mins / 60)}h`)
  const lineChartOptions: ApexCharts.ApexOptions = {
    chart: { type: 'area', toolbar: { show: false }, background: 'transparent', animations: { enabled: true, speed: 500 } },
    theme: { mode: 'dark' },
    stroke: { curve: 'smooth', width: 3 },
    colors: ['#ff6b00'],
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0, stops: [0, 90, 100] } },
    markers: { size: 4, colors: ['#ff6b00'], strokeColors: '#141414', strokeWidth: 2, hover: { size: 7 } },
    xaxis: {
      categories: trend.map((t) => fmtColDate(t.date)),
      labels: { style: { colors: '#444', fontSize: '10px' } },
      axisBorder: { show: false }, axisTicks: { show: false },
    },
    yaxis: { min: 0, max: lineChartMaxMinutes, tickAmount: 4, labels: { style: { colors: '#444', fontSize: '10px' }, formatter: (v) => fmtAxisTime(v) } },
    dataLabels: { enabled: false },
    grid: { borderColor: '#1e1e1e', strokeDashArray: 3, xaxis: { lines: { show: false } }, padding: { left: 6, right: 12 } },
    tooltip: { theme: 'dark', y: { formatter: (v: number) => fmtMin(v) } },
  }
  const lineChartSeries = [{ name: 'Total Time', data: trend.map((t) => t.totalMinutes) }]

  const donutOptions: ApexCharts.ApexOptions = {
    chart: { type: 'donut', background: 'transparent' },
    theme: { mode: 'dark' },
    labels: ['Active', 'Inactive'],
    colors: ['#22c55e', '#ef4444'],
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
            total: {
              show: true,
              label: 'Students',
              fontSize: '0.68rem',
              fontWeight: 500,
              color: '#999',
              formatter: () => String(summary.totalStudents),
            },
          },
        },
      },
    },
    tooltip: { theme: 'dark' },
  }
  const donutSeries = [summary.activeToday, summary.inactiveToday]

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <Spinner animation="border" style={{ color: '#ff6b00' }} />
      </div>
    )
  }

  return (
    <div>
      {/* ── Header ─────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem' }}>Daily Student Engagement</div>
          <div style={{ color: '#666', fontSize: '0.78rem', marginTop: 2 }}>Track and analyze how students spend their time on the Eklav platform</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' as const }}>
          <button style={S.headerBtn('#22c55e')} onClick={handleExportExcel} disabled={exporting !== null}>
            <FaDownload size={11} /> {exporting === 'excel' ? 'Exporting…' : 'Export Excel'}
          </button>
          <button style={S.headerBtn('#ef4444')} onClick={handleExportPdf} disabled={exporting !== null}>
            <FaFilePdf size={11} /> {exporting === 'pdf' ? 'Exporting…' : 'Export PDF'}
          </button>
          <button
            style={{ ...S.applyBtn, display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={refresh}
            disabled={refreshing}
          >
            <FaSyncAlt size={11} style={refreshing ? { animation: 'spin 0.8s linear infinite' } : undefined} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        .daily-eng-range {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          pointer-events: none;
        }
        .daily-eng-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          pointer-events: auto;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #ff6b00;
          border: 2px solid #141414;
          cursor: pointer;
          margin-top: -5px;
        }
        .daily-eng-range::-moz-range-thumb {
          pointer-events: auto;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #ff6b00;
          border: 2px solid #141414;
          cursor: pointer;
        }
        .daily-eng-range::-webkit-slider-runnable-track { background: transparent; }
        .daily-eng-range::-moz-range-track { background: transparent; }
      `}</style>

      {/* ── Stat Grid ──────────────────────────────────── */}
      <div style={S.statGrid}>
        <div style={S.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={S.iconCircle('#ff6b00')}><FaUserGraduate size={12} color="#fff" /></div>
            <span style={S.labelSm}>Total Students</span>
          </div>
          <div style={S.numSm}>{summary.totalStudents}</div>
          <span style={S.sub('#22c55e')}>↑ {extra.newStudentsThisMonth} this month</span>
        </div>
        <div style={S.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={S.iconCircle('#22c55e')}><FaCheckCircle size={12} color="#fff" /></div>
            <span style={S.labelSm}>Active Today</span>
          </div>
          <div style={S.numSm}>{summary.activeToday}</div>
          <span style={S.sub('#888')}>{activeRate}% of total students</span>
        </div>
        <div style={S.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={S.iconCircle('#ef4444')}><FaTimesCircle size={12} color="#fff" /></div>
            <span style={S.labelSm}>Inactive Today</span>
          </div>
          <div style={S.numSm}>{summary.inactiveToday}</div>
          <span style={S.sub('#ef4444')}>{100 - activeRate}% of total students</span>
        </div>
        <div style={S.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={S.iconCircle('#a855f7')}><FaClock size={12} color="#fff" /></div>
            <span style={S.labelSm}>Avg. Study Time</span>
          </div>
          <div style={S.numSm}>{fmtMin(extra.avgStudyMinutes)}</div>
          <span style={S.sub(extra.avgStudyMinutesTrendPct >= 0 ? '#22c55e' : '#ef4444')}>
            {extra.avgStudyMinutesTrendPct >= 0 ? '↑' : '↓'} {Math.abs(extra.avgStudyMinutesTrendPct)}% vs yesterday
          </span>
        </div>
        <div style={S.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={S.iconCircle('#3b82f6')}><FaLaptop size={12} color="#fff" /></div>
            <span style={S.labelSm}>Total Sessions</span>
          </div>
          <div style={S.numSm}>{extra.totalSessions}</div>
          <span style={S.sub(extra.totalSessionsTrendPct >= 0 ? '#22c55e' : '#ef4444')}>
            {extra.totalSessionsTrendPct >= 0 ? '↑' : '↓'} {Math.abs(extra.totalSessionsTrendPct)}% vs yesterday
          </span>
        </div>
        <div style={S.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={S.iconCircle('#eab308')}><FaTrophy size={12} color="#fff" /></div>
            <span style={S.labelSm}>Top Learner</span>
          </div>
          <div style={{ ...S.numSm, fontSize: '1.05rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{topLearner ? topLearner.name : '—'}</div>
          <span style={S.sub('#888')}>{topLearner ? `${fmtMin(topLearner.minutes)} today` : 'No activity yet'}</span>
        </div>
      </div>

      {/* ── Charts Row ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: '0.85rem', marginBottom: '1.25rem', alignItems: 'stretch', minWidth: 0 }}>
        {/* Daily Learning Time */}
        <div style={{ ...S.card, minWidth: 0 }}>
          <div style={S.cardHeader}>
            <span style={S.cardTitle}>Daily Learning Time <span style={{ color: '#666', fontWeight: 400 }}>(Last {dates.length} Days)</span></span>
            <span style={{ color: '#555', fontSize: '0.7rem' }}>{dates.length} Days ▾</span>
          </div>
          <div style={{ padding: '0.5rem 0.5rem 0' }}>
            <ReactApexChart type="area" height={190} series={lineChartSeries} options={lineChartOptions} />
          </div>
        </div>

        {/* Activity Distribution */}
        <div style={{ ...S.card, minWidth: 0 }}>
          <div style={S.cardHeader}><span style={S.cardTitle}>Activity Distribution (Today)</span></div>
          <div style={{ padding: '0.9rem 1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 120, flexShrink: 0 }}>
                <ReactApexChart type="donut" height={120} series={donutSeries} options={donutOptions} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.76rem' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ color: '#ccc' }}>Active {summary.activeToday} ({activeRate}%)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.76rem' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ color: '#ccc' }}>Inactive {summary.inactiveToday} ({100 - activeRate}%)</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <div style={{ flex: 1, background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: 8, padding: '0.5rem 0.6rem' }}>
                <div style={{ color: '#666', fontSize: '0.64rem' }}>Avg. Login Time</div>
                <div style={{ color: '#eee', fontSize: '0.82rem', fontWeight: 700, marginTop: 2 }}>{extra.avgLoginTime || '—'}</div>
              </div>
              <div style={{ flex: 1, background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: 8, padding: '0.5rem 0.6rem' }}>
                <div style={{ color: '#666', fontSize: '0.64rem' }}>Avg. Logout Time</div>
                <div style={{ color: '#eee', fontSize: '0.82rem', fontWeight: 700, marginTop: 2 }}>{extra.avgLogoutTime || '—'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Learners */}
        <div style={{ ...S.card, minWidth: 0 }}>
          <div style={S.cardHeader}><span style={S.cardTitle}>Top Learners (Today)</span></div>
          <div style={{ padding: '0.5rem 0.9rem' }}>
            {extra.topLearners.length === 0 ? (
              <div style={{ color: '#555', fontSize: '0.76rem', textAlign: 'center', padding: '1rem 0' }}>No activity yet today</div>
            ) : (
              <>
                {(showAllLearners ? extra.topLearners : extra.topLearners.slice(0, 5)).map((l, i) => (
                  <div key={l.userId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.5rem 0', borderBottom: '1px solid #232323' }}>
                    <FaMedal size={14} color={i === 0 ? '#eab308' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : '#3a3a3a'} />
                    <span style={{ color: '#ccc', fontSize: '0.8rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.name}</span>
                    <span style={{ color: '#ff6b00', fontSize: '0.76rem', fontWeight: 700 }}>{fmtMin(l.minutes)}</span>
                  </div>
                ))}
                {extra.topLearners.length > 5 && (
                  <button
                    onClick={() => setShowAllLearners((v) => !v)}
                    style={{ width: '100%', marginTop: 8, background: 'transparent', border: '1px solid #2a2a2a', color: '#ff6b00', borderRadius: 8, padding: '6px 0', fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    {showAllLearners ? 'Show Less ▲' : 'View All Leaderboard ▾'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Weekly Heatmap */}
        <div style={{ ...S.card, minWidth: 0 }}>
          <div style={S.cardHeader}><span style={S.cardTitle}>Weekly Heatmap</span></div>
          <div style={{ padding: '0.9rem 1rem', overflowX: 'auto' }}>
            {heatmap.length === 0 ? (
              <div style={{ color: '#555', fontSize: '0.76rem', textAlign: 'center', padding: '1rem 0' }}>No data</div>
            ) : (() => {
              const weekIndices = Array.from(new Set(heatmap.map((c) => c.weekIndex))).sort((a, b) => a - b)
              const cellByWeekAndDay: Record<string, HeatmapCell> = {}
              heatmap.forEach((c) => { cellByWeekAndDay[`${c.weekIndex}_${c.weekday}`] = c })
              const maxActive = Math.max(1, ...heatmap.map((c) => c.active))
              // Column header shows each week's Monday date
              const weekLabel = (wi: number) => {
                const cell = heatmap.find((c) => c.weekIndex === wi && c.weekday === 'Mon')
                  || heatmap.find((c) => c.weekIndex === wi)
                return cell ? new Date(cell.date).getDate() : ''
              }
              return (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: `34px repeat(${weekIndices.length}, 1fr)`, gap: 3, marginBottom: 4 }}>
                    <div />
                    {weekIndices.map((wi) => (
                      <div key={wi} style={{ color: '#555', fontSize: '0.6rem', textAlign: 'center' as const }}>
                        {weekLabel(wi)}
                      </div>
                    ))}
                  </div>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((wd) => (
                    <div key={wd} style={{ display: 'grid', gridTemplateColumns: `34px repeat(${weekIndices.length}, 1fr)`, gap: 3, marginBottom: 3, alignItems: 'center' }}>
                      <div style={{ color: '#666', fontSize: '0.66rem' }}>{wd}</div>
                      {weekIndices.map((wi) => {
                        const c = cellByWeekAndDay[`${wi}_${wd}`]
                        return (
                          <div
                            key={wi}
                            title={c ? `${fmtHeaderDate(c.date)}: ${c.active} active` : ''}
                            style={S.heatCell(c ? c.active / maxActive : 0)}
                          />
                        )
                      })}
                    </div>
                  ))}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginTop: 8, fontSize: '0.62rem', color: '#555' }}>
                    Less Time
                    <div style={{ width: 56, height: 6, borderRadius: 3, background: 'linear-gradient(90deg, #2a2a2a, #ff6b00)' }} />
                    More Time
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      </div>

      {/* Filters — its own full-width card, spanning the entire row above table + sidebar */}
      <div style={{ ...S.card, marginBottom: '0.85rem' }}>
        <div style={{ padding: '0.9rem 1.1rem', display: 'flex', flexWrap: 'nowrap' as const, gap: '1rem', alignItems: 'flex-end', overflowX: 'auto' }}>
              {/* Date Range */}
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4, flex: dateRangeMode === 'custom' ? '0 0 auto' : '1 1 0', minWidth: 150 }}>
                <span style={S.filterLabel}>Date Range</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ position: 'relative', flex: dateRangeMode === 'custom' ? '0 0 150px' : 1 }}>
                    <FaCalendarAlt size={11} color="#666" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 1, width: 11, height: 11 }} />
                    <select
                      style={{ ...S.select, width: '100%', paddingLeft: 28 }}
                      value={dateRangeMode}
                      onChange={(e) => onDateRangeModeChange(e.target.value as DateRangeMode)}
                    >
                      <option value="today">Today ({fmtHeaderDate(toDateStr())})</option>
                      <option value="7d">Last 7 Days</option>
                      <option value="30d">Last 30 Days</option>
                      <option value="custom">Custom Range</option>
                    </select>
                  </div>
                  {dateRangeMode === 'custom' && (
                    <>
                      <input type="date" style={{ ...S.dateInput, flexShrink: 0 }} value={startDate} max={endDate} onChange={(e) => setStartDate(e.target.value)} />
                      <span style={{ color: '#555', flexShrink: 0 }}>–</span>
                      <input type="date" style={{ ...S.dateInput, flexShrink: 0 }} value={endDate} min={startDate} max={toDateStr()} onChange={(e) => setEndDate(e.target.value)} />
                      <button style={{ ...S.applyBtn, flexShrink: 0 }} onClick={applyCustomRange}>Apply</button>
                    </>
                  )}
                </div>
              </div>

              {/* Department */}
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4, flex: '1 1 0', minWidth: 130 }}>
                <span style={S.filterLabel}>Department</span>
                <select style={{ ...S.select, width: '100%' }} value={draftDepartment} onChange={(e) => setDraftDepartment(e.target.value)}>
                  <option value="">All Departments</option>
                  {extra.departments.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* Status */}
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4, flex: '1 1 0', minWidth: 120 }}>
                <span style={S.filterLabel}>Status</span>
                <select
                  style={{ ...S.select, width: '100%' }}
                  value={draftFilter}
                  onChange={(e) => setDraftFilter(e.target.value as 'all' | 'active' | 'inactive')}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Today</option>
                  <option value="inactive">Inactive Today</option>
                </select>
              </div>

              {/* Duration */}
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4, flex: '1 1 0', minWidth: 140 }}>
                <span style={S.filterLabel}>Duration: {draftDuration[0]} – {draftDuration[1] >= 180 ? '180+' : draftDuration[1]} min</span>
                <div style={{ position: 'relative', width: '100%', height: 28, display: 'flex', alignItems: 'center' }}>
                  <div style={{ position: 'absolute', left: 0, right: 0, height: 4, background: '#2a2a2a', borderRadius: 2 }} />
                  <div
                    style={{
                      position: 'absolute', height: 4, background: '#ff6b00', borderRadius: 2,
                      left: `${(draftDuration[0] / 180) * 100}%`,
                      right: `${100 - (draftDuration[1] / 180) * 100}%`,
                    }}
                  />
                  <input
                    type="range" min={0} max={180} step={5} value={draftDuration[0]}
                    onChange={(e) => setDraftDuration([Math.min(Number(e.target.value), draftDuration[1]), draftDuration[1]])}
                    style={{ position: 'absolute', width: '100%', margin: 0, background: 'transparent' }}
                    className="daily-eng-range"
                  />
                  <input
                    type="range" min={0} max={180} step={5} value={draftDuration[1]}
                    onChange={(e) => setDraftDuration([draftDuration[0], Math.max(Number(e.target.value), draftDuration[0])])}
                    style={{ position: 'absolute', width: '100%', margin: 0, background: 'transparent' }}
                    className="daily-eng-range"
                  />
                </div>
              </div>

              {/* Search */}
              <div style={{ ...S.searchWrap, flex: '1 1 0', minWidth: 160 }}>
                <FaSearch size={11} color="#444" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)' }} />
                <input style={S.input({ width: '100%' })} placeholder="Search by name or email" value={search} onChange={(e) => onSearchChange(e.target.value)} />
              </div>

              <button style={{ ...S.applyBtn, flexShrink: 0 }} onClick={applyFilters}>Apply Filters</button>
              <button style={{ ...S.resetBtn, flexShrink: 0 }} onClick={resetFilters}><FaRedo size={10} style={{ marginRight: 6 }} />Reset</button>
            </div>
      </div>

      {/* ── Table — full width, no sidebar ────────────── */}
      <div style={{ minWidth: 0 }}>
          <div style={S.card}>
            <div style={{ position: 'relative', overflowX: 'auto' }}>
              {tableLoading && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                  <Spinner animation="border" style={{ color: '#ff6b00', width: 24, height: 24 }} />
                </div>
              )}
              <table style={{ width: 'max-content', minWidth: '100%', borderCollapse: 'separate', borderSpacing: 0, tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: STICKY_COL.numW }} />
                  <col style={{ width: STICKY_COL.studentW }} />
                  <col style={{ width: STICKY_COL.deptW }} />
                  <col style={{ width: STICKY_COL.statusW }} />
                  <col style={{ width: 56 }} />
                  {dates.map((d) => <col key={d} style={{ width: 52 }} />)}
                  <col style={{ width: 60 }} />
                  <col style={{ width: 56 }} />
                </colgroup>
                <thead>
                  <tr>
                    <th style={{ ...S.th, position: 'sticky', left: STICKY_COL.numLeft, zIndex: 2 }}>#</th>
                    <th style={{ ...S.th, position: 'sticky', left: STICKY_COL.studentLeft, zIndex: 2 }}>Student</th>
                    <th style={{ ...S.th, position: 'sticky', left: STICKY_COL.deptLeft, zIndex: 2 }}>Department</th>
                    <th style={{ ...S.th, textAlign: 'center', position: 'sticky', left: STICKY_COL.statusLeft, zIndex: 2, boxShadow: '2px 0 0 #2a2a2a' }}>Status</th>
                    <SortableTh label="Today" sortKey="todayMinutes" sortBy={sortBy} sortOrder={sortOrder} onClick={onSortChange} style={{ textAlign: 'center' }} />
                    {dates.map((d) => (
                      <th key={d} style={{ ...S.th, textAlign: 'center' }}>{fmtColDate(d)}</th>
                    ))}
                    <SortableTh label="Total" sortKey="totalMinutes" sortBy={sortBy} sortOrder={sortOrder} onClick={onSortChange} style={{ textAlign: 'center', color: '#ff6b00' }} />
                    <th style={{ ...S.th, textAlign: 'center' }}>Avg/Day</th>
                  </tr>
                </thead>
                <tbody>
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan={7 + dates.length} style={{ textAlign: 'center', padding: '2.5rem', color: '#444' }}>No students found</td>
                    </tr>
                  ) : (
                    students.map((s, i) => (
                      <tr key={s.userId}>
                        <td style={{ ...S.tdMuted, position: 'sticky', left: STICKY_COL.numLeft, zIndex: 1, background: '#1a1a1a' }}>{(pagination.page - 1) * pagination.limit + i + 1}</td>
                        <td style={{ ...S.td, position: 'sticky', left: STICKY_COL.studentLeft, zIndex: 1, background: '#1a1a1a' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 22, height: 22, borderRadius: '50%', background: avatarColor(s.name), color: '#fff', fontSize: '0.56rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {initials(s.name)}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.76rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{s.name}</div>
                              <div style={{ color: '#555', fontSize: '0.64rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{s.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ ...S.tdMuted, position: 'sticky', left: STICKY_COL.deptLeft, zIndex: 1, background: '#1a1a1a' }}>{s.branch || '—'}</td>
                        <td style={{ ...S.td, textAlign: 'center', position: 'sticky', left: STICKY_COL.statusLeft, zIndex: 1, background: '#1a1a1a', boxShadow: '2px 0 0 #2a2a2a' }}>
                          <span style={S.badge(s.isActiveToday)}>{s.isActiveToday ? 'Active' : 'Away'}</span>
                        </td>
                        <td style={{ ...S.td, textAlign: 'center', color: s.todayMinutes > 0 ? '#ff6b00' : '#333', fontWeight: 600 }}>{fmtMin(s.todayMinutes)}</td>
                        {dates.map((d) => {
                          const day = s.daily[d]
                          return <td key={d} style={S.dayCell(day?.minutes ?? 0)}>{fmtMin(day?.minutes ?? 0)}</td>
                        })}
                        <td style={{ ...S.td, textAlign: 'center', color: '#ff6b00', fontWeight: 700 }}>{fmtMin(s.totalMinutes)}</td>
                        <td style={{ ...S.tdMuted, textAlign: 'center' }}>{fmtMin(dates.length ? Math.round(s.totalMinutes / dates.length) : 0)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* ── Pagination ─────────────────────────────── */}
            <div style={{ ...S.footer, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: '0.5rem', padding: '0.75rem 1.25rem' }}>
              <span>
                Showing{' '}
                <strong style={{ color: '#aaa' }}>
                  {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)}
                </strong>
                {' '}of <strong style={{ color: '#aaa' }}>{pagination.total}</strong> students
              </span>

              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                <select style={{ ...S.select, width: 100 }} value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1) }}>
                  {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n} / page</option>)}
                </select>

                <PagBtn disabled={pagination.page <= 1} onClick={() => setPage(pagination.page - 1)}>‹ Prev</PagBtn>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 1)
                  .reduce<(number | '…')[]>((acc, p, idx, arr) => {
                    if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('…')
                    acc.push(p)
                    return acc
                  }, [])
                  .map((p, idx) =>
                    p === '…' ? (
                      <span key={`ellipsis-${idx}`} style={{ color: '#444', padding: '0 4px' }}>…</span>
                    ) : (
                      <PagBtn key={p} active={p === pagination.page} onClick={() => setPage(p as number)}>{p}</PagBtn>
                    )
                  )}
                <PagBtn disabled={pagination.page >= pagination.totalPages} onClick={() => setPage(pagination.page + 1)}>Next ›</PagBtn>
              </div>
            </div>
          </div>
        </div>
      </div>
  )
}

export default DailyEngagement
