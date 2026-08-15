'use client'
import { useEffect, useState } from 'react'
import { Spinner } from 'react-bootstrap'
import {
  FaCode, FaCheckCircle, FaUserGraduate, FaThumbsUp, FaLock, FaChartBar,
  FaSearch, FaFilter, FaDownload,
} from 'react-icons/fa'
import ReactApexChart from 'react-apexcharts'
import * as XLSX from 'xlsx'
import { useAuthContext } from '@/context/useAuthContext'

/* ─── Types ───────────────────────────────────────────────── */
type DiffBreakdown = { Easy: number; Medium: number; Hard: number }
type TrendPoint    = { date: string; count: number }
type TopProblem    = { problemId: string; title: string; count: number; difficulty: string }
type TotalProblems  = { Easy: number; Medium: number; Hard: number; total: number }
type OverviewData  = {
  totalCompleted: number; uniqueStudents: number; uniqueProblems: number
  totalProblems: TotalProblems
  diffBreakdown: DiffBreakdown; trend: TrendPoint[]; topProblems: TopProblem[]
}
type StudentRow = {
  studentId: string; name: string; email: string
  Easy: number; Medium: number; Hard: number; total: number; lastActivity: string | null
}

/* ─── Palette ─────────────────────────────────────────────── */
const DC: Record<string, string> = { Easy: '#22c55e', Medium: '#f59e0b', Hard: '#ef4444' }
const BG: Record<string, string> = {
  Easy: 'rgba(34,197,94,0.08)', Medium: 'rgba(245,158,11,0.08)', Hard: 'rgba(239,68,68,0.08)',
}
const card: React.CSSProperties = { background: '#141414', border: '1px solid #222', borderRadius: 14 }

/* ─── Helpers ─────────────────────────────────────────────── */
const today = () => new Date().toISOString().slice(0, 10)
const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10) }

const EMPTY_TP: TotalProblems = { Easy: 0, Medium: 0, Hard: 0, total: 0 }
const EMPTY_DIFF: DiffBreakdown = { Easy: 0, Medium: 0, Hard: 0 }

const iconCircle = (accent: string): React.CSSProperties => ({
  width: 34, height: 34, borderRadius: '50%', background: `${accent}22`,
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
})

// All three panels in the charts row are pinned to this one explicit
// height instead of stretching to match whichever sibling is tallest —
// sized to comfortably fit Most Solved Problems' 5 rows without excess,
// so none of the three ever has leftover dead space to fill.
const PANEL_HEIGHT = 236

/* ─── Summary Cards ──────────────────────────────────────── */
function SummaryCards({ data }: { data: OverviewData }) {
  const tp   = data.totalProblems || EMPTY_TP
  const diff = data.diffBreakdown || EMPTY_DIFF
  const nf = (n: number) => n.toLocaleString('en-IN')
  const cards = [
    { icon: <FaCode size={17} />,        accent: '#6366f1', value: nf(tp.total),        label: 'Total Programs',  sub: 'available in system' },
    { icon: <FaCheckCircle size={17} />, accent: '#14b8a6', value: nf(data.totalCompleted ?? 0), label: 'Total Solved', sub: 'accepted by all students' },
    { icon: <FaUserGraduate size={17} />,accent: '#22c55e', value: nf(data.uniqueStudents ?? 0), label: 'Active Students', sub: 'solved ≥ 1 problem' },
    { icon: <FaThumbsUp size={17} />,    accent: '#f59e0b', value: nf(diff.Easy),   outOf: nf(tp.Easy),   label: 'Easy',   pct: tp.Easy   ? Math.round((diff.Easy   / tp.Easy)   * 100) : 0 },
    { icon: <FaLock size={17} />,        accent: '#c2410c', value: nf(diff.Medium), outOf: nf(tp.Medium), label: 'Medium', pct: tp.Medium ? Math.round((diff.Medium / tp.Medium) * 100) : 0 },
    { icon: <FaChartBar size={17} />,    accent: '#ef4444', value: nf(diff.Hard),   outOf: nf(tp.Hard),   label: 'Hard',   pct: tp.Hard   ? Math.round((diff.Hard   / tp.Hard)   * 100) : 0 },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.65rem', marginBottom: '1.1rem' }}>
      {cards.map((c) => (
        <div key={c.label} style={{ ...card, borderTop: `3px solid ${c.accent}`, padding: '0.65rem 0.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ ...iconCircle(c.accent), width: 38, height: 38, flexShrink: 0 }}><span style={{ color: c.accent }}>{c.icon}</span></div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                <span style={{ fontSize: '1.15rem', fontWeight: 800, color: c.accent, lineHeight: 1 }}>{c.value}</span>
                {'outOf' in c && <span style={{ fontSize: '0.72rem', color: '#444', fontWeight: 700 }}>/{c.outOf}</span>}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#fff', fontWeight: 600, marginTop: 3 }}>{c.label}</div>
              <div style={{ fontSize: '0.64rem', color: '#555', marginTop: 1 }}>
                {'sub' in c ? c.sub : `${c.pct}% success rate`}
              </div>
            </div>
          </div>
          {'pct' in c && (
            <div style={{ marginTop: 8, height: 3, background: '#0d0d0d', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: `${c.pct}%`, height: '100%', background: c.accent, borderRadius: 2 }} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

/* ─── Difficulty Distribution (donut) ───────────────────── */
function DifficultyDonut({ data }: { data: OverviewData }) {
  const tp   = data.totalProblems || EMPTY_TP
  const diff = data.diffBreakdown || EMPTY_DIFF
  const solvedTotal = diff.Easy + diff.Medium + diff.Hard
  const unsolved = Math.max(0, tp.total - solvedTotal)
  const successRate = tp.total > 0 ? Math.round((solvedTotal / tp.total) * 1000) / 10 : 0

  const donutSeries = [diff.Easy, diff.Medium, diff.Hard, unsolved]
  const donutOptions: ApexCharts.ApexOptions = {
    chart: { type: 'donut', background: 'transparent' },
    theme: { mode: 'dark' },
    labels: ['Easy', 'Medium', 'Hard', 'Unsolved'],
    colors: [DC.Easy, DC.Medium, DC.Hard, '#333'],
    stroke: { show: false },
    dataLabels: { enabled: false },
    legend: { show: false },
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            show: true,
            name: { show: false },
            value: { show: true, fontSize: '0.92rem', fontWeight: 800, color: '#fff', offsetY: 5, formatter: () => tp.total.toLocaleString('en-IN') },
            total: { show: true, label: 'Total', fontSize: '0.56rem', fontWeight: 500, color: '#888', formatter: () => tp.total.toLocaleString('en-IN') },
          },
        },
      },
    },
    tooltip: { theme: 'dark' },
  }

  // Percentages are each row's share of TOTAL programs (not of that
  // difficulty's own subtotal) — so Easy/Medium/Hard/Unsolved sum to ~100%,
  // matching the donut's four slices one-to-one.
  const pctOfTotal = (n: number) => (tp.total > 0 ? Math.round((n / tp.total) * 1000) / 10 : 0)
  const rows = [
    ...(['Easy', 'Medium', 'Hard'] as const).map((d) => ({ key: d, label: d, count: diff[d], color: DC[d], pct: pctOfTotal(diff[d]) })),
    { key: 'Unsolved', label: 'Unsolved', count: unsolved, color: '#555', pct: pctOfTotal(unsolved) },
  ]

  // Header stays pinned at top, success-rate bar pinned at bottom, and the
  // donut+list block in between is vertically centered in whatever extra
  // height the grid row's stretch gives this card — so it reads as
  // deliberately centered rather than stuck at the top with a gap below.
  return (
    <div style={{ ...card, height: PANEL_HEIGHT, padding: '0.75rem 0.9rem', display: 'flex', flexDirection: 'column' }}>
      <div>
        <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#fff', marginBottom: 2 }}>Difficulty Distribution</div>
        <div style={{ fontSize: '0.65rem', color: '#555' }}>
          Total programs: <span style={{ color: '#818cf8', fontWeight: 700 }}>{tp.total.toLocaleString('en-IN')}</span>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', width: '100%' }}>
          <div style={{ width: 112, flexShrink: 0 }}>
            <ReactApexChart type="donut" height={112} series={donutSeries} options={donutOptions} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1, minWidth: 0 }}>
            {rows.map((r) => (
              <div key={r.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, fontSize: '0.7rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                  <span style={{ color: '#ccc' }}>{r.label}</span>
                </div>
                <span style={{ color: '#888', flexShrink: 0 }}>{r.count.toLocaleString('en-IN')} <span style={{ color: '#444' }}>({r.pct}%)</span></span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: '#555', marginBottom: 3 }}>
          <span>Overall Success Rate</span>
          <span style={{ color: '#22c55e', fontWeight: 700 }}>{successRate}%</span>
        </div>
        <div style={{ height: 4, background: '#0d0d0d', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${successRate}%`, height: '100%', background: '#22c55e', borderRadius: 3 }} />
        </div>
      </div>
    </div>
  )
}

/* ─── Trend Chart ────────────────────────────────────────── */
function TrendChart({ trend }: { trend: TrendPoint[] }) {
  const safeT = trend || []
  const total = safeT.reduce((s, t) => s + t.count, 0)

  const options: ApexCharts.ApexOptions = {
    chart: { type: 'area', toolbar: { show: false }, background: 'transparent', animations: { enabled: true, speed: 500 } },
    theme: { mode: 'dark' },
    stroke: { curve: 'smooth', width: 3 },
    colors: ['#6366f1'],
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0, stops: [0, 90, 100] } },
    markers: { size: 3, colors: ['#6366f1'], strokeColors: '#141414', strokeWidth: 2, hover: { size: 6 } },
    xaxis: {
      categories: safeT.map((t) => t.date.slice(5)),
      labels: { style: { colors: '#444', fontSize: '10px' } },
      axisBorder: { show: false }, axisTicks: { show: false },
    },
    yaxis: { min: 0, labels: { style: { colors: '#444', fontSize: '10px' } } },
    dataLabels: { enabled: false },
    grid: { borderColor: '#1e1e1e', strokeDashArray: 3, xaxis: { lines: { show: false } }, padding: { left: 6, right: 12 } },
    tooltip: { theme: 'dark' },
  }
  const series = [{ name: 'Solved', data: safeT.map((t) => t.count) }]

  // Row stretches this card to match its taller siblings — the chart
  // itself fills that height (flex:1 + height:100%) instead of a fixed
  // pixel value, so any extra room becomes real chart, not a blank gap.
  return (
    <div style={{ ...card, height: PANEL_HEIGHT, display: 'flex', flexDirection: 'column', padding: '0.75rem 0.9rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#fff' }}>14-Day Completion Trend</div>
          <div style={{ fontSize: '0.65rem', color: '#555', marginTop: 2 }}>{total} problems solved in last 14 days</div>
        </div>
        <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#6366f1', lineHeight: 1 }}>{total}</div>
      </div>
      <div style={{ flex: 1, minHeight: 0, marginTop: '0.3rem' }}>
        <ReactApexChart type="area" height="100%" width="100%" series={series} options={options} />
      </div>
    </div>
  )
}

/* ─── Top Problems ───────────────────────────────────────── */
function TopProblems({ problems }: { problems: TopProblem[] }) {
  const safeP = problems || []
  return (
    <div style={{ ...card, height: PANEL_HEIGHT, padding: '0.75rem 0.9rem', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span style={{ fontWeight: 700, fontSize: '0.78rem', color: '#fff' }}>Most Solved Problems</span>
        <button
          onClick={() => document.getElementById('code-challenge-student-table')?.scrollIntoView({ behavior: 'smooth' })}
          style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: '0.66rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
        >
          View All
        </button>
      </div>
      {safeP.length === 0 && <div style={{ color: '#555', fontSize: '0.78rem' }}>No data yet</div>}
      {safeP.map((p, i) => (
        <div key={p.problemId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.4rem 0', borderBottom: i < safeP.length - 1 ? '1px solid #1a1a1a' : 'none' }}>
          <span style={{ fontSize: '0.66rem', fontWeight: 800, color: '#333', width: 14, flexShrink: 0 }}>#{i + 1}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.76rem', color: '#ddd', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</div>
            <span style={{ fontSize: '0.6rem', color: DC[p.difficulty], fontWeight: 700 }}>{p.difficulty}</span>
          </div>
          <div style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 20, padding: '1px 8px', fontSize: '0.66rem', fontWeight: 700, flexShrink: 0 }}>
            {p.count} solved
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Student Performance table ──────────────────────────── */
function StudentTable({ apiBase, totalProblemsFallback }: { apiBase: string; totalProblemsFallback: TotalProblems }) {
  const { user } = useAuthContext() as any
  const baseURL   = import.meta.env.VITE_API_BASE_URL

  const [rows, setRows]         = useState<StudentRow[]>([])
  const [total, setTotal]       = useState(0)
  const [tp, setTp]             = useState<TotalProblems>(totalProblemsFallback)
  const [page, setPage]         = useState(1)
  const [search, setSearch]     = useState('')
  const [query, setQuery]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [exporting, setExporting] = useState(false)
  const [showFilter, setShowFilter] = useState(false)
  const [dateFrom, setDateFrom] = useState(daysAgo(30))
  const [dateTo, setDateTo]     = useState(today())
  const [appliedFrom, setAppliedFrom] = useState(daysAgo(30))
  const [appliedTo, setAppliedTo]     = useState(today())
  const [sortBy, setSortBy]     = useState<'name' | 'Easy' | 'Medium' | 'Hard' | 'total' | 'lastActivity'>('total')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const limit = 20

  const doFetch = (pg: number, q: string, from: string, to: string, sb: string, so: string) => {
    if (!user?.token) return
    setLoading(true)
    const params = new URLSearchParams({ page: String(pg), limit: String(limit), search: q, from, to, sortBy: sb, sortOrder: so })
    fetch(`${baseURL}${apiBase}/code-challenge-students?${params}`, {
      headers: { Authorization: `Bearer ${user.token}` },
      cache: 'no-store',
    })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setRows(Array.isArray(d.students) ? d.students : [])
          setTotal(d.total ?? 0)
          if (d.totalProblems) setTp(d.totalProblems)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { doFetch(page, query, appliedFrom, appliedTo, sortBy, sortOrder) }, [apiBase, user?.token, page, query, appliedFrom, appliedTo, sortBy, sortOrder])

  // Clicking a header sorts desc first (most students expect "biggest
  // first" on the initial click), then toggles asc/desc on repeat clicks
  // of the same column; switching to a different column resets to desc.
  const handleSort = (col: typeof sortBy) => {
    if (sortBy === col) { setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc')) }
    else { setSortBy(col); setSortOrder('desc') }
    setPage(1)
  }

  const handleExport = async () => {
    if (!user?.token) return
    setExporting(true)
    try {
      const params = new URLSearchParams({ page: '1', limit: '5000', search: query, from: appliedFrom, to: appliedTo, sortBy, sortOrder })
      const res = await fetch(`${baseURL}${apiBase}/code-challenge-students?${params}`, {
        headers: { Authorization: `Bearer ${user.token}` }, cache: 'no-store',
      })
      const d = await res.json()
      const exportRows = (d.students || []).map((r: StudentRow, i: number) => ({
        '#': i + 1, Student: r.name, Email: r.email,
        Easy: r.Easy, Medium: r.Medium, Hard: r.Hard, Total: r.total,
        'Last Active': r.lastActivity ? new Date(r.lastActivity).toLocaleDateString('en-IN') : 'Not started',
      }))
      const ws = XLSX.utils.json_to_sheet(exportRows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Code Challenge')
      XLSX.writeFile(wb, `Code_Challenge_Students.xlsx`)
    } catch (err) { console.error(err) }
    finally { setExporting(false) }
  }

  const pages = Math.ceil(total / limit)

  const th: React.CSSProperties = { padding: '0.65rem 0.9rem', fontSize: '0.72rem', color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #1e1e1e', whiteSpace: 'nowrap' }
  const SortTh = ({ col, color, children }: { col: typeof sortBy; color?: string; children: React.ReactNode }) => (
    <th
      onClick={() => handleSort(col)}
      style={{ ...th, ...(color ? { color } : {}), cursor: 'pointer', userSelect: 'none' }}
      title="Click to sort"
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {children}
        <span style={{ color: sortBy === col ? (color || '#818cf8') : '#333', fontSize: '0.8em' }}>
          {sortBy === col ? (sortOrder === 'desc' ? '▼' : '▲') : '↕'}
        </span>
      </span>
    </th>
  )
  const td: React.CSSProperties = { padding: '0.7rem 0.9rem', fontSize: '0.82rem', color: '#ccc', borderBottom: '1px solid #141414', verticalAlign: 'middle' }
  const inp: React.CSSProperties = { background: '#111', border: '1px solid #2a2a2a', borderRadius: 8, color: '#ccc', fontSize: '0.78rem', padding: '5px 10px', outline: 'none' }

  return (
    <div id="code-challenge-student-table" style={{ ...card, overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #1e1e1e', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>Student Performance</div>
          <div style={{ fontSize: '0.72rem', color: '#444', marginTop: 2 }}>{total} students</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#111', border: '1px solid #2a2a2a', borderRadius: 8, padding: '5px 10px', gap: 6 }}>
            <FaSearch size={11} color="#444" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { setQuery(search); setPage(1) } }}
              placeholder="Search students…"
              style={{ background: 'none', border: 'none', outline: 'none', color: '#ccc', fontSize: '0.8rem', width: 150 }} />
          </div>
          <button onClick={() => setShowFilter((v) => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: showFilter ? '#1a1a1a' : '#111', border: '1px solid #2a2a2a', color: '#aaa', borderRadius: 8, padding: '6px 12px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
            <FaFilter size={11} /> Filter
          </button>
          <button onClick={handleExport} disabled={exporting}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.4)', color: '#22c55e', borderRadius: 8, padding: '6px 12px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
            <FaDownload size={11} /> {exporting ? 'Exporting…' : 'Export'}
          </button>

          {showFilter && (
            <div style={{ position: 'absolute', top: '110%', right: 0, zIndex: 20, background: '#141414', border: '1px solid #2a2a2a', borderRadius: 10, padding: '0.9rem', display: 'flex', flexDirection: 'column', gap: 8, boxShadow: '0 12px 32px rgba(0,0,0,0.5)', minWidth: 230 }}>
              <span style={{ fontSize: '0.72rem', color: '#888', fontWeight: 600 }}>Date Range</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ ...inp, flex: 1 }} />
                <span style={{ color: '#555' }}>–</span>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ ...inp, flex: 1 }} />
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                <button onClick={() => { setAppliedFrom(dateFrom); setAppliedTo(dateTo); setPage(1); setShowFilter(false) }}
                  style={{ flex: 1, background: '#6366f1', border: 'none', color: '#fff', borderRadius: 6, padding: '6px 0', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer' }}>
                  Apply
                </button>
                <button onClick={() => { setDateFrom(daysAgo(30)); setDateTo(today()); setAppliedFrom(daysAgo(30)); setAppliedTo(today()); setPage(1) }}
                  style={{ flex: 1, background: '#1a1a1a', border: '1px solid #333', color: '#888', borderRadius: 6, padding: '6px 0', fontSize: '0.76rem', cursor: 'pointer' }}>
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#0d0d0d' }}>
            <tr>
              <th style={th}>#</th>
              <SortTh col="name">Student</SortTh>
              <SortTh col="Easy" color={DC.Easy}>Easy {tp.Easy > 0 && <span style={{ color: '#2a4a2a', fontWeight: 400 }}>({tp.Easy})</span>}</SortTh>
              <SortTh col="Medium" color={DC.Medium}>Medium {tp.Medium > 0 && <span style={{ color: '#4a3a1a', fontWeight: 400 }}>({tp.Medium})</span>}</SortTh>
              <SortTh col="Hard" color={DC.Hard}>Hard {tp.Hard > 0 && <span style={{ color: '#4a1a1a', fontWeight: 400 }}>({tp.Hard})</span>}</SortTh>
              <SortTh col="total" color="#818cf8">Progress {tp.total > 0 && <span style={{ color: '#2a2a4a', fontWeight: 400 }}>/{tp.total}</span>}</SortTh>
              <th style={th}>Grade</th>
              <SortTh col="lastActivity">Last Active</SortTh>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={8} style={{ ...td, textAlign: 'center', padding: '2.5rem' }}>
                <Spinner animation="border" size="sm" style={{ color: '#6366f1' }} />
              </td></tr>
            )}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={8} style={{ ...td, textAlign: 'center', color: '#444', padding: '2.5rem' }}>No students found</td></tr>
            )}
            {!loading && rows.map((r, i) => {
              const rank        = (page - 1) * limit + i + 1
              const weightedPts = r.Easy + r.Medium * 2 + r.Hard * 3
              const hasStarted  = r.total > 0
              const grade       = !hasStarted ? '—' : weightedPts >= 30 ? 'A+' : weightedPts >= 20 ? 'A' : weightedPts >= 10 ? 'B' : weightedPts >= 4 ? 'C' : 'D'
              const gc          = !hasStarted ? '#333' : grade.startsWith('A') ? '#22c55e' : grade === 'B' ? '#6366f1' : grade === 'C' ? '#f59e0b' : '#ef4444'
              const pct         = tp.total > 0 ? Math.round((r.total / tp.total) * 100) : 0
              return (
                <tr key={r.studentId} onMouseEnter={e => (e.currentTarget.style.background = '#1a1a1a')} onMouseLeave={e => (e.currentTarget.style.background = '')}>
                  <td style={{ ...td, color: '#444', fontWeight: 700 }}>{rank}</td>
                  <td style={td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: hasStarted ? 'rgba(99,102,241,0.12)' : '#111', border: `1px solid ${hasStarted ? 'rgba(99,102,241,0.25)' : '#222'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: hasStarted ? '#818cf8' : '#333', fontWeight: 800, fontSize: '0.75rem' }}>
                        {r.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: hasStarted ? '#eee' : '#555', fontSize: '0.85rem' }}>{r.name}</div>
                        <div style={{ fontSize: '0.7rem', color: '#3a3a3a' }}>{r.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={td}>
                    <span style={{ background: r.Easy > 0 ? BG.Easy : 'transparent', color: r.Easy > 0 ? DC.Easy : '#333', border: `1px solid ${r.Easy > 0 ? 'rgba(34,197,94,0.2)' : '#1e1e1e'}`, borderRadius: 6, padding: '2px 10px', fontSize: '0.78rem', fontWeight: 700 }}>{r.Easy}</span>
                  </td>
                  <td style={td}>
                    <span style={{ background: r.Medium > 0 ? BG.Medium : 'transparent', color: r.Medium > 0 ? DC.Medium : '#333', border: `1px solid ${r.Medium > 0 ? 'rgba(245,158,11,0.2)' : '#1e1e1e'}`, borderRadius: 6, padding: '2px 10px', fontSize: '0.78rem', fontWeight: 700 }}>{r.Medium}</span>
                  </td>
                  <td style={td}>
                    <span style={{ background: r.Hard > 0 ? BG.Hard : 'transparent', color: r.Hard > 0 ? DC.Hard : '#333', border: `1px solid ${r.Hard > 0 ? 'rgba(239,68,68,0.2)' : '#1e1e1e'}`, borderRadius: 6, padding: '2px 10px', fontSize: '0.78rem', fontWeight: 700 }}>{r.Hard}</span>
                  </td>
                  <td style={td}>
                    <div style={{ minWidth: 130 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                        <span style={{ fontWeight: 800, color: hasStarted ? '#818cf8' : '#333', fontSize: '0.9rem' }}>
                          {r.total}
                          {tp.total > 0 && <span style={{ fontSize: '0.72rem', color: '#333', fontWeight: 400 }}>/{tp.total}</span>}
                        </span>
                        {tp.total > 0 && <span style={{ fontSize: '0.68rem', color: hasStarted ? '#818cf8' : '#2a2a2a', fontWeight: 700 }}>{pct}%</span>}
                      </div>
                      <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', background: '#111' }}>
                        {tp.total > 0 && (
                          <>
                            <div style={{ width: `${(r.Easy   / tp.total) * 100}%`, background: DC.Easy }} title={`Easy: ${r.Easy}`} />
                            <div style={{ width: `${(r.Medium / tp.total) * 100}%`, background: DC.Medium }} title={`Medium: ${r.Medium}`} />
                            <div style={{ width: `${(r.Hard   / tp.total) * 100}%`, background: DC.Hard }} title={`Hard: ${r.Hard}`} />
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={td}>
                    <span style={{ background: hasStarted ? `${gc}18` : '#111', color: gc, border: `1px solid ${hasStarted ? gc + '33' : '#1e1e1e'}`, borderRadius: 6, padding: '2px 10px', fontSize: '0.75rem', fontWeight: 800 }}>{grade}</span>
                  </td>
                  <td style={{ ...td, color: '#555', fontSize: '0.75rem' }}>
                    {r.lastActivity
                      ? new Date(r.lastActivity).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                      : <span style={{ color: '#2a2a2a' }}>Not started</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid #1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.75rem', color: '#555' }}>Page {page} of {pages} · {total} students</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #222', background: '#111', color: page === 1 ? '#333' : '#aaa', fontSize: '0.75rem', cursor: page === 1 ? 'default' : 'pointer' }}>‹</button>
            {Array.from({ length: Math.min(pages, 8) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                style={{ width: 30, height: 30, borderRadius: 6, border: p === page ? '1px solid #6366f1' : '1px solid #222', background: p === page ? '#6366f1' : '#111', color: p === page ? '#fff' : '#555', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                {p}
              </button>
            ))}
            {pages > 8 && <span style={{ color: '#333', alignSelf: 'center', fontSize: '0.75rem' }}>…{pages}</span>}
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
              style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #222', background: '#111', color: page === pages ? '#333' : '#aaa', fontSize: '0.75rem', cursor: page === pages ? 'default' : 'pointer' }}>›</button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Main component ──────────────────────────────────────── */
const CodeChallengeFull = ({ apiBase = '/api/adminDashboardCharts' }: { apiBase?: string }) => {
  const { user }  = useAuthContext() as any
  const baseURL   = import.meta.env.VITE_API_BASE_URL
  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  useEffect(() => {
    if (!user?.token) return
    fetch(`${baseURL}${apiBase}/code-challenge-overview`, {
      headers: { Authorization: `Bearer ${user.token}` },
      cache: 'no-store',
    })
      .then(r => r.json())
      .then(d => { if (d.success) setOverview(d); else setError(d.message || 'Failed') })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false))
  }, [apiBase, user?.token])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
      <Spinner animation="border" style={{ color: '#6366f1' }} />
    </div>
  )
  if (error || !overview) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: '#555' }}>
      {error || 'No data'}
    </div>
  )

  return (
    <div>
      <SummaryCards data={overview} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: '0.85rem', marginBottom: '1.25rem', alignItems: 'stretch', minWidth: 0 }}>
        <DifficultyDonut data={overview} />
        <TrendChart trend={overview.trend} />
        <TopProblems problems={overview.topProblems} />
      </div>

      <StudentTable apiBase={apiBase} totalProblemsFallback={overview.totalProblems} />
    </div>
  )
}

export default CodeChallengeFull
