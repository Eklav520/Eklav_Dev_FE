import { useCallback, useEffect, useRef, useState } from 'react'
import { Spinner } from 'react-bootstrap'
import { FaCheckCircle, FaSearch, FaTimesCircle, FaUserGraduate } from 'react-icons/fa'
import ReactApexChart from 'react-apexcharts'
import { useAuthContext } from '@/context/useAuthContext'

/* ─── Types ─────────────────────────────────────────────── */
type DayData = { minutes: number; isActive: boolean; loginAt: string | null }

type Student = {
  userId: string
  name: string
  email: string
  isActiveToday: boolean
  totalMinutes: number
  todayMinutes: number
  daily: Record<string, DayData>
}

type SortBy = 'totalMinutes' | 'name' | 'todayMinutes'
type SortOrder = 'asc' | 'desc'

type TrendPoint = { date: string; active: number; inactive: number }

type Summary = { totalStudents: number; activeToday: number; inactiveToday: number }

type Pagination = { total: number; page: number; limit: number; totalPages: number }

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

/* ─── Styles ─────────────────────────────────────────────── */
const S = {
  statStrip: {
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '14px',
    padding: '0.75rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    marginBottom: '1.25rem',
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,
  statStripItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  } as React.CSSProperties,
  statStripDivider: {
    width: 1,
    height: 24,
    background: '#2a2a2a',
  } as React.CSSProperties,
  iconBoxSm: (accent: string): React.CSSProperties => ({
    background: `${accent}22`,
    borderRadius: '8px',
    padding: '6px',
    display: 'inline-flex',
  }),
  numSm: (accent: string): React.CSSProperties => ({
    fontSize: '1.15rem',
    fontWeight: 700,
    color: accent,
    lineHeight: 1,
  }),
  labelSm: { color: '#888', fontSize: '0.78rem' } as React.CSSProperties,
  sub: (accent: string): React.CSSProperties => ({ color: accent, fontSize: '0.72rem', fontWeight: 600, marginLeft: 2 }),
  sectionLabel: {
    color: '#aaa',
    fontSize: '0.7rem',
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    marginBottom: '0.75rem',
  },
  card: {
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '14px',
  } as React.CSSProperties,
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
    padding: '6px 12px',
    fontSize: '0.82rem',
    cursor: 'pointer',
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
  presetBtn: (active: boolean): React.CSSProperties => ({
    background: active ? '#ff6b0022' : '#111',
    border: `1px solid ${active ? '#ff6b00' : '#2a2a2a'}`,
    color: active ? '#ff6b00' : '#aaa',
    fontWeight: active ? 700 : 500,
    borderRadius: '8px',
    padding: '6px 14px',
    fontSize: '0.78rem',
    cursor: 'pointer',
  }),
  sortOrderBtn: {
    background: '#111',
    border: '1px solid #2a2a2a',
    color: '#ff6b00',
    borderRadius: '8px',
    padding: '6px 10px',
    fontSize: '0.85rem',
    fontWeight: 700,
    cursor: 'pointer',
    lineHeight: 1,
  } as React.CSSProperties,
  th: {
    background: '#111',
    color: '#666',
    fontSize: '0.68rem',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    padding: '0.75rem 1rem',
    textAlign: 'left' as const,
    borderBottom: '1px solid #2a2a2a',
    whiteSpace: 'nowrap' as const,
  },
  td: {
    padding: '0.75rem 1rem',
    borderBottom: '1px solid #1e1e1e',
    color: '#e0e0e0',
    fontSize: '0.83rem',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,
  tdMuted: {
    padding: '0.75rem 1rem',
    borderBottom: '1px solid #1e1e1e',
    color: '#555',
    fontSize: '0.78rem',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,
  dayCell: (mins: number): React.CSSProperties => ({
    padding: '0.75rem 1rem',
    borderBottom: '1px solid #1e1e1e',
    color: mins > 0 ? '#ff6b00' : '#333',
    fontWeight: mins > 0 ? 600 : 400,
    fontSize: '0.82rem',
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

/* ─── Component ──────────────────────────────────────────── */
const DailyEngagement = () => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [startDate, setStartDate] = useState(defaultStart)
  const [endDate, setEndDate] = useState(defaultEnd)
  const [appliedStart, setAppliedStart] = useState(defaultStart)
  const [appliedEnd, setAppliedEnd] = useState(defaultEnd)

  const [summary, setSummary] = useState<Summary>({ totalStudents: 0, activeToday: 0, inactiveToday: 0 })
  const [trend, setTrend] = useState<TrendPoint[]>([])
  const [dates, setDates] = useState<string[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [tableLoading, setTableLoading] = useState(false)

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [sortBy, setSortBy] = useState<SortBy>('totalMinutes')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [minMinutes, setMinMinutes] = useState('')
  const [maxMinutes, setMaxMinutes] = useState('')
  const [appliedMinMinutes, setAppliedMinMinutes] = useState('')
  const [appliedMaxMinutes, setAppliedMaxMinutes] = useState('')

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchData = useCallback(async (
    start: string, end: string,
    opts: {
      page?: number; limit?: number; search?: string; filter?: string
      sortBy?: SortBy; sortOrder?: SortOrder; minMinutes?: string; maxMinutes?: string
      fullReload?: boolean
    } = {}
  ) => {
    if (!user?.token) return
    const isFullReload = opts.fullReload !== false && (!opts.page || opts.page === 1)
    isFullReload ? setLoading(true) : setTableLoading(true)
    try {
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
      if (opts.minMinutes) params.set('minMinutes', opts.minMinutes)
      if (opts.maxMinutes) params.set('maxMinutes', opts.maxMinutes)
      const res  = await fetch(`${baseURL}/api/institute/daily-engagement?${params}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      })
      const data = await res.json()
      if (data.success) {
        if (isFullReload) {
          setSummary(data.summary)
          setTrend(data.trend)
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
  }, [user?.token, baseURL])

  // Initial + date range load
  useEffect(() => {
    setPage(1)
    fetchData(appliedStart, appliedEnd, { page: 1, limit, search, filter, sortBy, sortOrder, minMinutes: appliedMinMinutes, maxMinutes: appliedMaxMinutes, fullReload: true })
  }, [appliedStart, appliedEnd])   // eslint-disable-line

  // Page / limit change
  useEffect(() => {
    fetchData(appliedStart, appliedEnd, { page, limit, search, filter, sortBy, sortOrder, minMinutes: appliedMinMinutes, maxMinutes: appliedMaxMinutes, fullReload: false })
  }, [page, limit])                // eslint-disable-line

  // Search with 400ms debounce
  const onSearchChange = (val: string) => {
    setSearch(val)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setPage(1)
      fetchData(appliedStart, appliedEnd, { page: 1, limit, search: val, filter, sortBy, sortOrder, minMinutes: appliedMinMinutes, maxMinutes: appliedMaxMinutes, fullReload: false })
    }, 400)
  }

  // Sort change
  const onSortChange = (nextSortBy: SortBy, nextOrder: SortOrder) => {
    setSortBy(nextSortBy)
    setSortOrder(nextOrder)
    setPage(1)
    fetchData(appliedStart, appliedEnd, { page: 1, limit, search, filter, sortBy: nextSortBy, sortOrder: nextOrder, minMinutes: appliedMinMinutes, maxMinutes: appliedMaxMinutes, fullReload: false })
  }

  // Engagement (min/max minutes) range apply
  const applyMinutesRange = () => {
    setAppliedMinMinutes(minMinutes)
    setAppliedMaxMinutes(maxMinutes)
    setPage(1)
    fetchData(appliedStart, appliedEnd, { page: 1, limit, search, filter, sortBy, sortOrder, minMinutes, maxMinutes, fullReload: false })
  }

  // Quick date range presets
  const applyPreset = (daysBack: number) => {
    const end = defaultEnd()
    const d = new Date()
    d.setDate(d.getDate() - daysBack)
    const start = toDateStr(d)
    setStartDate(start)
    setEndDate(end)
    setAppliedStart(start)
    setAppliedEnd(end)
  }

  // Filter change
  const onFilterChange = (val: 'all' | 'active' | 'inactive') => {
    setFilter(val)
    setPage(1)
    fetchData(appliedStart, appliedEnd, { page: 1, limit, search, filter: val, sortBy, sortOrder, minMinutes: appliedMinMinutes, maxMinutes: appliedMaxMinutes, fullReload: false })
  }

  const applyRange = () => {
    if (!startDate || !endDate || startDate > endDate) return
    setAppliedStart(startDate)
    setAppliedEnd(endDate)
  }

  const activeRate = summary.totalStudents > 0
    ? Math.round((summary.activeToday / summary.totalStudents) * 100)
    : 0

  const peakActive = trend.reduce((max, t) => Math.max(max, t.active), 0)
  const avgActive = trend.length
    ? Math.round(trend.reduce((s, t) => s + t.active, 0) / trend.length)
    : 0

  const chartOptions: ApexCharts.ApexOptions = {
    chart: {
      type: 'area',
      toolbar: { show: false },
      background: 'transparent',
      animations: { enabled: true, speed: 800 },
      dropShadow: { enabled: true, color: '#ff6b00', top: 12, blur: 14, opacity: 0.15 },
    },
    theme: { mode: 'dark' },
    stroke: { curve: 'smooth', width: [3, 2] },
    fill: {
      type: 'gradient',
      gradient: {
        type: 'vertical',
        colorStops: [
          [
            { offset: 0,   color: '#ff6b00', opacity: 0.35 },
            { offset: 100, color: '#ff6b00', opacity: 0.01 },
          ],
          [
            { offset: 0,   color: '#ef4444', opacity: 0.18 },
            { offset: 100, color: '#ef4444', opacity: 0.01 },
          ],
        ],
      },
    },
    colors: ['#ff6b00', '#ef4444'],
    markers: {
      size: 5,
      colors: ['#ff6b00', '#ef4444'],
      strokeColors: '#141414',
      strokeWidth: 2,
      hover: { size: 8 },
    },
    xaxis: {
      categories: trend.map((t) => fmtColDate(t.date)),
      labels: { style: { colors: '#444', fontSize: '11px' }, offsetY: 2 },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      min: 0,
      max: summary.totalStudents > 0 ? Math.ceil(summary.totalStudents * 1.15) : 10,
      labels: {
        style: { colors: '#444', fontSize: '11px' },
        formatter: (v: number) => String(Math.round(v)),
      },
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      labels: { colors: '#666' },
      markers: { width: 10, height: 10 },
    },
    dataLabels: { enabled: false },
    grid: {
      borderColor: '#1e1e1e',
      strokeDashArray: 3,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
      padding: { top: 10, right: 20, bottom: 0, left: 10 },
    },
    tooltip: {
      theme: 'dark',
      style: { fontSize: '12px' },
      y: { formatter: (v: number) => `${v} students` },
    },
  }

  const chartSeries = [
    { name: 'Active', data: trend.map((t) => t.active) },
    { name: 'Inactive', data: trend.map((t) => t.inactive) },
  ]

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <Spinner animation="border" style={{ color: '#ff6b00' }} />
      </div>
    )
  }

  return (
    <div>

      {/* ── Summary Strip ─────────────────────────────── */}
      <div style={S.sectionLabel}>Overview</div>
      <div style={S.statStrip}>
        <div style={S.statStripItem}>
          <div style={S.iconBoxSm('#ff6b00')}><FaUserGraduate size={15} color="#ff6b00" /></div>
          <div style={S.numSm('#ff6b00')}>{summary.totalStudents}</div>
          <div style={S.labelSm}>Total Students</div>
        </div>
        <div style={S.statStripDivider} />
        <div style={S.statStripItem}>
          <div style={S.iconBoxSm('#22c55e')}><FaCheckCircle size={15} color="#22c55e" /></div>
          <div style={S.numSm('#22c55e')}>{summary.activeToday}</div>
          <div style={S.labelSm}>Active Today</div>
          <span style={S.sub('#22c55e')}>{activeRate}%</span>
        </div>
        <div style={S.statStripDivider} />
        <div style={S.statStripItem}>
          <div style={S.iconBoxSm('#ef4444')}><FaTimesCircle size={15} color="#ef4444" /></div>
          <div style={S.numSm('#ef4444')}>{summary.inactiveToday}</div>
          <div style={S.labelSm}>Not Active Today</div>
          <span style={S.sub('#ef4444')}>{100 - activeRate}%</span>
        </div>
      </div>

      {/* ── Table Filters ─────────────────────────────── */}
      <div style={S.sectionLabel}>Student Daily Breakdown</div>
      <div style={S.card}>
        <div
          style={{
            padding: '0.9rem 1.25rem',
            borderBottom: '1px solid #2a2a2a',
            display: 'flex',
            flexWrap: 'wrap' as const,
            gap: '0.6rem',
            alignItems: 'center',
          }}
        >
          {/* Quick date presets */}
          {[
            { label: 'Today', days: 0 },
            { label: '7 Days', days: 6 },
            { label: '30 Days', days: 29 },
          ].map((p) => {
            const daysSpan = Math.round((new Date(appliedEnd).getTime() - new Date(appliedStart).getTime()) / 86400000)
            const isActivePreset = appliedEnd === defaultEnd() && daysSpan === p.days
            return (
              <button
                key={p.label}
                style={S.presetBtn(isActivePreset)}
                onClick={() => applyPreset(p.days)}
              >
                {p.label}
              </button>
            )
          })}

          <div style={{ width: 1, height: 22, background: '#2a2a2a', margin: '0 2px' }} />

          {/* Date range */}
          <label style={{ color: '#666', fontSize: '0.78rem', marginRight: 2 }}>From</label>
          <input
            type="date"
            style={S.dateInput}
            value={startDate}
            max={endDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <label style={{ color: '#666', fontSize: '0.78rem', marginRight: 2 }}>To</label>
          <input
            type="date"
            style={S.dateInput}
            value={endDate}
            min={startDate}
            max={toDateStr()}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <button style={S.applyBtn} onClick={applyRange}>Apply</button>
        </div>

        <div
          style={{
            padding: '0.9rem 1.25rem',
            borderBottom: '1px solid #2a2a2a',
            display: 'flex',
            flexWrap: 'wrap' as const,
            gap: '0.6rem',
            alignItems: 'center',
          }}
        >
          {/* Status filter */}
          <select
            style={{ ...S.select, width: 140 }}
            value={filter}
            onChange={(e) => onFilterChange(e.target.value as 'all' | 'active' | 'inactive')}
          >
            <option value="all">All Students</option>
            <option value="active">Active Today</option>
            <option value="inactive">Inactive Today</option>
          </select>

          {/* Sort by */}
          <select
            style={{ ...S.select, width: 150 }}
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortBy, sortOrder)}
          >
            <option value="totalMinutes">Sort: Total Time</option>
            <option value="todayMinutes">Sort: Today's Time</option>
            <option value="name">Sort: Name</option>
          </select>
          <button
            style={S.sortOrderBtn}
            title={sortOrder === 'desc' ? 'Descending' : 'Ascending'}
            onClick={() => onSortChange(sortBy, sortOrder === 'desc' ? 'asc' : 'desc')}
          >
            {sortOrder === 'desc' ? '↓' : '↑'}
          </button>

          {/* Engagement range (total minutes) */}
          <label style={{ color: '#666', fontSize: '0.78rem', marginLeft: 4 }}>Min (m)</label>
          <input
            type="number"
            min={0}
            style={{ ...S.input(), width: 80, paddingLeft: 12 }}
            placeholder="0"
            value={minMinutes}
            onChange={(e) => setMinMinutes(e.target.value)}
          />
          <label style={{ color: '#666', fontSize: '0.78rem' }}>Max (m)</label>
          <input
            type="number"
            min={0}
            style={{ ...S.input(), width: 80, paddingLeft: 12 }}
            placeholder="∞"
            value={maxMinutes}
            onChange={(e) => setMaxMinutes(e.target.value)}
          />
          <button style={S.applyBtn} onClick={applyMinutesRange}>Apply</button>

          <div style={{ flex: 1 }} />

          {/* Rows per page */}
          <select
            style={{ ...S.select, width: 110 }}
            value={limit}
            onChange={(e) => { setLimit(Number(e.target.value)); setPage(1) }}
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>{n} / page</option>
            ))}
          </select>

          {/* Search */}
          <div style={S.searchWrap}>
            <FaSearch
              size={11}
              color="#444"
              style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              style={S.input()}
              placeholder="Search name / email"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        {/* ── Table ─────────────────────────────────── */}
        <div style={{ position: 'relative', overflowX: 'auto' }}>
          {tableLoading && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
            }}>
              <Spinner animation="border" style={{ color: '#ff6b00', width: 24, height: 24 }} />
            </div>
          )}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...S.th, minWidth: 40 }}>#</th>
                <th style={{ ...S.th, minWidth: 160 }}>Name</th>
                <th style={{ ...S.th, minWidth: 180 }}>Email</th>
                <th style={{ ...S.th, minWidth: 100, textAlign: 'center' }}>Today</th>
                {dates.map((d) => (
                  <th key={d} style={{ ...S.th, minWidth: 90, textAlign: 'center' }}>
                    {fmtColDate(d)}
                  </th>
                ))}
                <th style={{ ...S.th, minWidth: 90, textAlign: 'center', color: '#ff6b00' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={5 + dates.length} style={{ textAlign: 'center', padding: '2.5rem', color: '#444' }}>
                    No students found
                  </td>
                </tr>
              ) : (
                students.map((s, i) => (
                  <tr key={s.userId}>
                    <td style={S.tdMuted}>{(pagination.page - 1) * pagination.limit + i + 1}</td>
                    <td style={{ ...S.td, fontWeight: 600, color: '#fff' }}>{s.name}</td>
                    <td style={S.tdMuted}>{s.email}</td>
                    <td style={{ ...S.td, textAlign: 'center' }}>
                      <span style={S.badge(s.isActiveToday)}>
                        {s.isActiveToday ? 'Active' : 'Away'}
                      </span>
                    </td>
                    {dates.map((d) => {
                      const day = s.daily[d]
                      return (
                        <td key={d} style={S.dayCell(day?.minutes ?? 0)}>
                          {fmtMin(day?.minutes ?? 0)}
                        </td>
                      )
                    })}
                    <td style={{ ...S.td, textAlign: 'center', color: '#ff6b00', fontWeight: 700 }}>
                      {fmtMin(s.totalMinutes)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ─────────────────────────────── */}
        <div style={{
          ...S.footer,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap' as const,
          gap: '0.5rem',
          padding: '0.75rem 1.25rem',
        }}>
          <span>
            Showing{' '}
            <strong style={{ color: '#aaa' }}>
              {(pagination.page - 1) * pagination.limit + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </strong>
            {' '}of <strong style={{ color: '#aaa' }}>{pagination.total}</strong> students
          </span>

          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            {/* Prev */}
            <PagBtn disabled={pagination.page <= 1} onClick={() => setPage(pagination.page - 1)}>
              ‹ Prev
            </PagBtn>

            {/* Page numbers */}
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter((p) =>
                p === 1 || p === pagination.totalPages ||
                Math.abs(p - pagination.page) <= 1
              )
              .reduce<(number | '…')[]>((acc, p, idx, arr) => {
                if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('…')
                acc.push(p)
                return acc
              }, [])
              .map((p, idx) =>
                p === '…' ? (
                  <span key={`ellipsis-${idx}`} style={{ color: '#444', padding: '0 4px' }}>…</span>
                ) : (
                  <PagBtn
                    key={p}
                    active={p === pagination.page}
                    onClick={() => setPage(p as number)}
                  >
                    {p}
                  </PagBtn>
                )
              )}

            {/* Next */}
            <PagBtn disabled={pagination.page >= pagination.totalPages} onClick={() => setPage(pagination.page + 1)}>
              Next ›
            </PagBtn>
          </div>
        </div>
      </div>

      {/* ── Professional Trend Chart ──────────────────── */}
      <div style={{ ...S.sectionLabel, marginTop: '1.75rem' }}>Activity Trend</div>
      <div style={{ ...S.card, overflow: 'hidden' }}>

        {/* Chart header */}
        <div
          style={{
            padding: '1.25rem 1.5rem 0.5rem',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap' as const,
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>
              Active vs Inactive Students
            </div>
            <div style={{ color: '#555', fontSize: '0.78rem' }}>
              {appliedStart} — {appliedEnd}
            </div>
          </div>

          {/* Mini KPIs */}
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <div style={{ textAlign: 'right' as const }}>
              <div style={{ color: '#ff6b00', fontWeight: 700, fontSize: '1.3rem', lineHeight: 1 }}>
                {peakActive}
              </div>
              <div style={{ color: '#555', fontSize: '0.7rem', marginTop: 3 }}>Peak Active</div>
            </div>
            <div style={{ textAlign: 'right' as const }}>
              <div style={{ color: '#aaa', fontWeight: 700, fontSize: '1.3rem', lineHeight: 1 }}>
                {avgActive}
              </div>
              <div style={{ color: '#555', fontSize: '0.7rem', marginTop: 3 }}>Avg Active / Day</div>
            </div>
            <div style={{ textAlign: 'right' as const }}>
              <div style={{ color: '#22c55e', fontWeight: 700, fontSize: '1.3rem', lineHeight: 1 }}>
                {summary.totalStudents}
              </div>
              <div style={{ color: '#555', fontSize: '0.7rem', marginTop: 3 }}>Total Students</div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderBottom: '1px solid #1e1e1e', margin: '0.75rem 0 0' }} />

        <div style={{ padding: '0.5rem 0.5rem 0' }}>
          <ReactApexChart type="area" height={300} series={chartSeries} options={chartOptions} />
        </div>
      </div>
    </div>
  )
}

export default DailyEngagement
