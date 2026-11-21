'use client'
import { useEffect, useState } from 'react'
import { Spinner } from 'react-bootstrap'
import {
  FaCode, FaCheckCircle, FaUserGraduate, FaThumbsUp, FaLock, FaChartBar,
  FaSearch, FaFilter, FaDownload, FaFilePdf,
} from 'react-icons/fa'
import { exportBrandedPdf } from './moduleOverview/brandedPdf'
import ReactApexChart from 'react-apexcharts'
import * as XLSX from 'xlsx'
import { useAuthContext } from '@/context/useAuthContext'
import { ReportPagination, StatusPill, StudentCell } from './moduleOverview/ReportCells'
import { CohortFilters, withCohort } from './moduleOverview/cohort'
import { ReportRangeSelect, useReportRange } from './moduleOverview/range'

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
const card: React.CSSProperties = { background: '#0e1012', border: '1px solid #272a2e', borderRadius: 12 }

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

/* ─── Summary Cards ──────────────────────────────────────── */
function SummaryCards({ data }: { data: OverviewData }) {
  const tp   = data.totalProblems || EMPTY_TP
  const diff = data.diffBreakdown || EMPTY_DIFF
  const nf = (n: number) => n.toLocaleString('en-IN')
  const pct = (n: number, of: number) => (of ? Math.round((n / of) * 100) : 0)
  // Same cards as the Student Reports tab
  const cards = [
    { icon: <FaCode />, tone: 'purple', value: nf(tp.total), label: 'Total Programs', rule: 'available in the problem bank' },
    { icon: <FaCheckCircle />, tone: 'cyan', value: nf(data.totalCompleted ?? 0), label: 'Total Solved', rule: 'accepted solutions' },
    { icon: <FaUserGraduate />, tone: 'green', value: nf(data.uniqueStudents ?? 0), label: 'Active Students', rule: 'solved at least 1 problem' },
    { icon: <FaThumbsUp />, tone: 'green', value: nf(diff.Easy), outOf: nf(tp.Easy), label: 'Easy', rule: `${pct(diff.Easy, tp.Easy)}% of easy problems solved` },
    { icon: <FaLock />, tone: 'amber', value: nf(diff.Medium), outOf: nf(tp.Medium), label: 'Medium', rule: `${pct(diff.Medium, tp.Medium)}% of medium problems solved` },
    { icon: <FaChartBar />, tone: 'red', value: nf(diff.Hard), outOf: nf(tp.Hard), label: 'Hard', rule: `${pct(diff.Hard, tp.Hard)}% of hard problems solved` },
  ]
  return (
    <section className="sr-summary dr-summary">
      {cards.map((c) => (
        <article key={c.label} className={`sr-summary-card sr-card-${c.tone}`}>
          <span className={`sr-summary-icon sr-icon-${c.tone}`}>{c.icon}</span>
          <div>
            <strong>{c.value}{c.outOf && <small> / {c.outOf}</small>}</strong>
            <span>{c.label}</span>
            <em className="sr-summary-rule">{c.rule}</em>
          </div>
        </article>
      ))}
    </section>
  )
}

/* ─── Insight panels (Student Reports panel style) ───────── */
function DifficultyPanel({ data }: { data: OverviewData }) {
  const tp   = data.totalProblems || EMPTY_TP
  const diff = data.diffBreakdown || EMPTY_DIFF
  const solvedTotal = diff.Easy + diff.Medium + diff.Hard
  const successRate = tp.total > 0 ? Math.round((solvedTotal / tp.total) * 1000) / 10 : 0
  return (
    <section className="sr-table-panel dr-panel">
      <div className="dr-panel-head">
        <div><h3>By Difficulty</h3><p>{tp.total.toLocaleString('en-IN')} problems · {successRate}% of the bank solved at least once</p></div>
      </div>
      <div className="dr-panel-body dr-types">
        {(['Easy', 'Medium', 'Hard'] as const).map((d) => {
          const pct = tp[d] ? Math.round((diff[d] / tp[d]) * 100) : 0
          return (
            <div key={d} className="dr-type" style={{ ['--c' as string]: DC[d] }}>
              <div className="dr-type-head">
                <span className="dr-type-icon">{d === 'Easy' ? <FaThumbsUp /> : d === 'Medium' ? <FaLock /> : <FaChartBar />}</span>
                <div><strong>{d}</strong><small>{tp[d].toLocaleString('en-IN')} problems available</small></div>
                <em>{pct}%</em>
              </div>
              <div className="dr-band-bar"><i style={{ width: `${Math.min(100, pct)}%` }} /></div>
              <div className="dr-type-stats"><span><b>{diff[d].toLocaleString('en-IN')}</b> solved</span><span><b>{Math.max(0, tp[d] - diff[d]).toLocaleString('en-IN')}</b> not yet solved</span></div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function TrendPanel({ trend }: { trend: TrendPoint[] }) {
  const safeT = trend || []
  const total = safeT.reduce((s, t) => s + t.count, 0)
  const options: ApexCharts.ApexOptions = {
    chart: { type: 'area', toolbar: { show: false }, background: 'transparent', animations: { enabled: true, speed: 500 } },
    theme: { mode: 'dark' },
    stroke: { curve: 'smooth', width: 3 },
    colors: ['#ff7a00'],
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0, stops: [0, 90, 100] } },
    markers: { size: 3, colors: ['#ff7a00'], strokeColors: '#0e1012', strokeWidth: 2, hover: { size: 6 } },
    xaxis: {
      categories: safeT.map((t) => new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })),
      labels: { style: { colors: '#6f757c', fontSize: '10px' }, rotate: 0, hideOverlappingLabels: true },
      axisBorder: { show: false }, axisTicks: { show: false }, tickAmount: 7,
    },
    yaxis: { min: 0, forceNiceScale: true, labels: { style: { colors: '#6f757c', fontSize: '10px' }, formatter: (v) => String(Math.round(v)) } },
    dataLabels: { enabled: false },
    grid: { borderColor: '#1d2023', strokeDashArray: 3, xaxis: { lines: { show: false } }, padding: { left: 6, right: 12 } },
    tooltip: { theme: 'dark', y: { formatter: (v: number) => `${v} solved` } },
  }
  return (
    <section className="sr-table-panel dr-panel">
      <div className="dr-panel-head">
        <div><h3>Last 14 Days</h3><p>Problems solved per day</p></div>
        <span className="dr-head-num">{total}<small> solved</small></span>
      </div>
      <div className="dr-panel-body" style={{ padding: '0.4rem 0.5rem 0', minHeight: 250 }}>
        {total === 0
          ? <div className="sr-empty"><FaCode /><span>No problems solved in the last 14 days</span></div>
          : <ReactApexChart type="area" height="100%" width="100%" series={[{ name: 'Solved', data: safeT.map((t) => t.count) }]} options={options} />}
      </div>
    </section>
  )
}

function TopProblemsPanel({ problems }: { problems: TopProblem[] }) {
  const list = (problems || []).slice(0, 6)
  const max = Math.max(1, ...list.map((p) => p.count))
  return (
    <section className="sr-table-panel dr-panel">
      <div className="dr-panel-head">
        <div><h3>Most Solved Problems</h3><p>Problems solved by the most students</p></div>
      </div>
      {list.length === 0 ? (
        <div className="sr-empty"><FaCode /><span>No solutions yet</span></div>
      ) : (
        <div className="dr-mini-table dr-problems">
          <div className="dr-mini-head"><span>#</span><span>Problem</span><span>Solved by</span></div>
          {list.map((p, i) => (
            <div key={p.problemId} className="dr-mini-row">
              <span>{i < 3 ? <b className={`dr-medal m${i + 1}`}>{i + 1}</b> : i + 1}</span>
              <span className="dr-problem">
                <strong title={p.title}>{p.title}</strong>
                <em style={{ ['--c' as string]: DC[p.difficulty] || '#9da2a8' }}>{p.difficulty}</em>
              </span>
              <span className="dr-enrolled"><strong>{p.count}</strong><i><u style={{ width: `${(p.count / max) * 100}%` }} /></i></span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

/* ─── Student Performance table ──────────────────────────── */
function StudentTable({ apiBase, totalProblemsFallback }: { apiBase: string; totalProblemsFallback: TotalProblems }) {
  const { user } = useAuthContext() as any
  const baseURL   = import.meta.env.VITE_API_BASE_URL
  // Date range shared by every report tab (default: till now)
  const range = useReportRange()

  const [rows, setRows]         = useState<StudentRow[]>([])
  const [total, setTotal]       = useState(0)
  const [tp, setTp]             = useState<TotalProblems>(totalProblemsFallback)
  const [page, setPage]         = useState(1)
  const [search, setSearch]     = useState('')
  const [query, setQuery]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [exporting, setExporting] = useState(false)
  const [showFilter, setShowFilter] = useState(false)
  const [dateFrom, setDateFrom] = useState(range.from)
  const [dateTo, setDateTo]     = useState(range.to)
  const [appliedFrom, setAppliedFrom] = useState(range.from)
  const [appliedTo, setAppliedTo]     = useState(range.to)
  const [sortBy, setSortBy]     = useState<'name' | 'Easy' | 'Medium' | 'Hard' | 'total' | 'lastActivity'>('total')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const limit = 10

  const doFetch = (pg: number, q: string, from: string, to: string, sb: string, so: string) => {
    if (!user?.token) return
    setLoading(true)
    const params = new URLSearchParams({ page: String(pg), limit: String(limit), search: q, from, to, sortBy: sb, sortOrder: so })
    fetch(`${baseURL}${apiBase}/code-challenge-students?${withCohort(params)}`, {
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

  const handleExport = async (format: 'excel' | 'pdf' = 'excel') => {
    if (!user?.token) return
    setExporting(true)
    try {
      const params = new URLSearchParams({ page: '1', limit: '5000', search: query, from: appliedFrom, to: appliedTo, sortBy, sortOrder })
      const res = await fetch(`${baseURL}${apiBase}/code-challenge-students?${withCohort(params)}`, {
        headers: { Authorization: `Bearer ${user.token}` }, cache: 'no-store',
      })
      const d = await res.json()
      const exportRows = (d.students || []).map((r: StudentRow, i: number) => ({
        '#': i + 1, Student: r.name, Email: r.email,
        Easy: r.Easy, Medium: r.Medium, Hard: r.Hard, Total: r.total,
        'Last Active': r.lastActivity ? new Date(r.lastActivity).toLocaleDateString('en-IN') : 'Not started',
      }))
      if (format === 'pdf') {
        await exportBrandedPdf({ title: 'Code Challenge', subtitle: `${appliedFrom} to ${appliedTo} · problems solved by difficulty`, rows: exportRows, fileName: 'Code_Challenge_Students' })
        return
      }
      const ws = XLSX.utils.json_to_sheet(exportRows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Code Challenge')
      XLSX.writeFile(wb, `Code_Challenge_Students.xlsx`)
    } catch (err) { console.error(err) }
    finally { setExporting(false) }
  }

  const pages = Math.ceil(total / limit)

  const SortTh = ({ col, children, width }: { col: typeof sortBy; children: React.ReactNode; width?: number }) => (
    <th onClick={() => handleSort(col)} style={{ cursor: 'pointer', userSelect: 'none', minWidth: width }} title="Click to sort" aria-sort={sortBy === col ? (sortOrder === 'desc' ? 'descending' : 'ascending') : 'none'}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: sortBy === col ? '#ffb15e' : undefined }}>
        {children}<span style={{ fontSize: '0.8em', opacity: sortBy === col ? 1 : 0.4 }}>{sortBy === col ? (sortOrder === 'desc' ? '▼' : '▲') : '↕'}</span>
      </span>
    </th>
  )
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const rangeLabel = `${new Date(appliedFrom).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} – ${new Date(appliedTo).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`

  return (
    <section id="code-challenge-student-table" className="sr-table-panel" aria-label="Code challenge by student">
      <div className="sr-toolbar">
        <div className="sr-search">
          <FaSearch aria-hidden="true" />
          <input aria-label="Search students" value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setQuery(search); setPage(1) } }}
            onBlur={() => { if (search !== query) { setQuery(search); setPage(1) } }}
            placeholder="Search by name or email (press Enter)" />
        </div>
        <div className="sr-filters sr-report-filters" style={{ position: 'relative' }}>
          <CohortFilters />
          <button type="button" className="sr-export-button" onClick={() => handleExport('pdf')} disabled={exporting}><FaFilePdf /> {exporting ? 'Preparing PDF…' : 'Export PDF'}</button>

        </div>
      </div>

      <div className="sr-table-scroll" style={{ position: 'relative', overflowX: 'auto' }}>
        {loading && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
            <Spinner animation="border" style={{ color: '#ff6b00', width: 24, height: 24 }} />
          </div>
        )}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ width: 40 }}>#</th>
              <SortTh col="name" width={220}>Student</SortTh>
              <SortTh col="Easy" width={90}>Easy</SortTh>
              <SortTh col="Medium" width={90}>Medium</SortTh>
              <SortTh col="Hard" width={90}>Hard</SortTh>
              <SortTh col="total" width={170}>Progress</SortTh>
              <th style={{ minWidth: 80 }}>Grade</th>
              <SortTh col="lastActivity" width={120}>Last Active</SortTh>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={8}>{!loading && <div className="sr-empty"><FaCode /><span>No students match these filters.</span></div>}</td></tr>
            ) : rows.map((r, i) => {
              const weightedPts = r.Easy + r.Medium * 2 + r.Hard * 3
              const hasStarted  = r.total > 0
              const grade       = !hasStarted ? '—' : weightedPts >= 30 ? 'A+' : weightedPts >= 20 ? 'A' : weightedPts >= 10 ? 'B' : weightedPts >= 4 ? 'C' : 'D'
              const pct         = tp.total > 0 ? Math.round((r.total / tp.total) * 100) : 0
              const count = (n: number, d: 'Easy' | 'Medium' | 'Hard') => (n > 0 ? <span className="dr-count" style={{ ['--c' as string]: DC[d] }}>{n}</span> : <span className="dr-dot">·</span>)
              return (
                <tr key={r.studentId}>
                  <td style={{ color: '#858a90' }}>{(page - 1) * limit + i + 1}</td>
                  <td><StudentCell name={r.name} email={r.email} /></td>
                  <td>{count(r.Easy, 'Easy')}</td>
                  <td>{count(r.Medium, 'Medium')}</td>
                  <td>{count(r.Hard, 'Hard')}</td>
                  <td>
                    {hasStarted ? (
                      <div className="sr-score-cell" style={{ minWidth: 140 }}>
                        <strong>{r.total} <span className="dr-sub">/ {tp.total} · {pct}%</span></strong>
                        <span style={{ display: 'flex' }}>
                          {tp.total > 0 && (['Easy', 'Medium', 'Hard'] as const).map((d) => <i key={d} style={{ width: `${(r[d] / tp.total) * 100}%`, background: DC[d], borderRadius: 0 }} title={`${d}: ${r[d]}`} />)}
                        </span>
                      </div>
                    ) : <StatusPill tone="none">Not started</StatusPill>}
                  </td>
                  <td>{hasStarted ? <StatusPill tone={grade.startsWith('A') ? 'good' : grade === 'B' ? 'pending' : grade === 'C' ? 'mid' : 'low'}>{grade}</StatusPill> : <span className="dr-dot">·</span>}</td>
                  <td style={{ color: '#858a90' }}>{r.lastActivity ? new Date(r.lastActivity).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <ReportPagination page={page} pageSize={limit} total={total} onPage={setPage} />
    </section>
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

      <div className="dr-three-col">
        <DifficultyPanel data={overview} />
        <TrendPanel trend={overview.trend} />
        <TopProblemsPanel problems={overview.topProblems} />
      </div>

      <StudentTable apiBase={apiBase} totalProblemsFallback={overview.totalProblems} />
    </div>
  )
}

export default CodeChallengeFull
