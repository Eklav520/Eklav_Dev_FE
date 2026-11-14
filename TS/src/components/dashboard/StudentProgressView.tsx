import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import ReactApexChart from 'react-apexcharts'
import type { ApexOptions } from 'apexcharts'
import type { IconType } from 'react-icons'
import {
  FaExclamationTriangle, FaCalendarAlt, FaClock, FaTrophy, FaFire, FaBookOpen,
  FaRobot, FaLanguage, FaClipboardCheck, FaCode, FaArrowUp, FaArrowDown, FaMinus, FaCheckCircle, FaBolt, FaBrain,
} from 'react-icons/fa'
import {
  ENGLISH_KEYS, STATUS_LABELS, activeDays, activitiesCompleted, formatDuration, monthRanges,
  rankText, reportMetrics, statusOf, type Report,
} from './studentReportData'
import { CountUp, useCountUp } from './CountUp'

/* Progress for one student, one row per section: an all-time report (since joining) for the totals
   and details, plus one report per calendar month for the trends. Used by the admin progress popup
   (dark) and the student's own dashboard (light). */

type MonthPoint = { label: string; report: Report | null; days: number }
type Range = 'joined' | '12' | '6' | '3'

const MAX_MONTHS = 24
const COLORS = { engagement: '#ff7a00', course: '#38bdf8', interview: '#a78bfa', english: '#34d399', aptitude: '#818cf8', assessment: '#f4b43f', code: '#f472b6' } as const
const APT_CAT_COLOR: Record<string, string> = { Aptitude: '#10b981', Reasoning: '#8b5cf6', Technical: '#3b82f6', Puzzle: '#f59e0b' }
type SectionKey = keyof typeof COLORS
const STATUS_TONE: Record<string, string> = { 'on-track': '#45dd75', 'needs-attention': '#f4b43f', 'at-risk': '#fb737a', 'not-started': '#9da2a8' }

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const daysBetween = (from: string, to: string) =>
  Math.max(1, Math.round((new Date(`${to}T00:00:00`).getTime() - new Date(`${from}T00:00:00`).getTime()) / 86400000) + 1)
const monthsBetween = (from: Date, to: Date) => (to.getFullYear() - from.getFullYear()) * 12 + to.getMonth() - from.getMonth() + 1
const shortMonth = (label: string) => label.replace(/ \d{2}(\d{2})$/, " '$1")
const fmtDate = (v?: string | Date | null) => {
  if (!v) return '—'
  const d = typeof v === 'string' ? new Date(v.length === 10 ? `${v}T00:00:00` : v) : v
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}
const pct = (v: number | null | undefined) => (v == null ? '—' : `${Math.round(v)}%`)

const Bar = ({ value, color }: { value: number; color: string }) => (
  <span className="spx-bar"><span style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }} /></span>
)

const Delta = ({ value }: { value: number | null }) => (
  <span className={`spx-delta ${value == null || value === 0 ? '' : value > 0 ? 'is-up' : 'is-down'}`} title="Change from the first to the latest month in range">
    {value == null ? 'No trend yet' : value === 0 ? <><FaMinus size={8} /> no change</> : value > 0 ? <><FaArrowUp size={8} /> {value} pts</> : <><FaArrowDown size={8} /> {Math.abs(value)} pts</>}
  </span>
)

/* Dark combo chart: count as columns (left axis), score % as a line (right axis) */
const comboOptions = (labels: string[], color: string, countLabel: string, scoreLabel = 'Score', dark = true): ApexOptions => ({
  chart: { toolbar: { show: false }, zoom: { enabled: false }, background: 'transparent', foreColor: dark ? '#9da2a8' : '#64748b', fontFamily: 'inherit', animations: { speed: 300 } },
  theme: { mode: dark ? 'dark' : 'light' },
  colors: [`${color}66`, color],
  stroke: { width: [0, 3], curve: 'smooth' },
  plotOptions: { bar: { columnWidth: '42%', borderRadius: 4 } },
  markers: { size: [0, 4] as any, strokeWidth: 0 },
  grid: { borderColor: dark ? '#202326' : '#eef2f6', strokeDashArray: 3, padding: { top: 14, left: 4, right: 8 } },
  xaxis: { categories: labels, axisBorder: { color: dark ? '#25282b' : '#e2e8f0' }, axisTicks: { color: dark ? '#25282b' : '#e2e8f0' }, labels: { style: { fontSize: '11px' }, hideOverlappingLabels: true }, tooltip: { enabled: false }, crosshairs: { stroke: { color: '#34383d' } } },
  yaxis: [
    { title: { text: countLabel, style: { color: '#6b7280', fontWeight: 500 } }, min: 0, forceNiceScale: true, labels: { formatter: (v: number) => `${Math.round(v)}` } },
    { opposite: true, title: { text: scoreLabel, style: { color: '#6b7280', fontWeight: 500 } }, min: 0, max: 100, tickAmount: 4, labels: { formatter: (v: number) => `${Math.round(v)}%` } },
  ],
  dataLabels: { enabled: false },
  legend: { position: 'top', horizontalAlign: 'left', fontSize: '12px', markers: { size: 5 } as any, itemMargin: { horizontal: 8 }, offsetY: -2 },
  tooltip: { theme: dark ? 'dark' : 'light', shared: true, intersect: false },
})

/* Last 26 weeks of daily activity, GitHub-style */
const ActivityCalendar = ({ days }: { days: { date: string; secs: number }[] }) => {
  const map = new Map(days.map((d) => [d.date, d.secs]))
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - (26 * 7 - 1) - end.getDay())
  const cells: { date: string; secs: number; future: boolean }[] = []
  for (let d = new Date(start); cells.length < 27 * 7; d.setDate(d.getDate() + 1)) {
    const key = iso(d)
    cells.push({ date: key, secs: map.get(key) || 0, future: d > end })
  }
  const level = (s: number) => (s <= 0 ? 0 : s < 900 ? 1 : s < 2700 ? 2 : s < 5400 ? 3 : 4)
  return (
    <div className="spx-cal-wrap">
      <div className="spx-cal">
        {cells.map((c) => (
          <span key={c.date} className={`l${c.future ? 'x' : level(c.secs)}`} title={c.future ? '' : `${fmtDate(c.date)} · ${c.secs ? formatDuration(c.secs) : 'no activity'}`} />
        ))}
      </div>
      <div className="spx-cal-legend">Less <span className="l0" /><span className="l1" /><span className="l2" /><span className="l3" /><span className="l4" /> More · last 6 months</div>
    </div>
  )
}

/* Fold-open on scroll. Opens when the row scrolls into view (scrolling down); folds again when
   it leaves through the bottom of the screen (scrolling back up), so it unfolds the next time you
   scroll down to it. Rows leaving through the top stay open. Reduced motion → always open. */
const prefersReducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const useInView = <T extends HTMLElement>() => {
  const ref = useRef<T>(null)
  const staticView = prefersReducedMotion() || typeof IntersectionObserver === 'undefined'
  const [inView, setInView] = useState(staticView)
  useEffect(() => {
    if (staticView || !ref.current) return
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setInView(true)
      // left through the bottom edge → user is scrolling up: fold it away
      else if (entry.boundingClientRect.top > (entry.rootBounds?.bottom ?? window.innerHeight) * 0.5) setInView(false)
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' })
    io.observe(ref.current)
    return () => io.disconnect()
  }, [staticView])
  return [ref, inView] as const
}

export const SectionRow = ({ icon: Icon, color, title, score = null, scoreNote, delta = null, stats, children, headline, action }: {
  icon: IconType; color: string; title: string; score?: number | null; scoreNote: string; delta?: number | null
  /** Shown instead of the % score and bar (rows that are counts, not scores) */
  headline?: ReactNode
  /** Link/button at the bottom of the side panel */
  action?: ReactNode
  stats: { label: string; value: ReactNode }[]; children: ReactNode
}) => {
  const [ref, inView] = useInView<HTMLDivElement>()
  return (
  <div ref={ref} className={`spx-row ${inView ? 'is-open' : 'is-folded'}`} style={{ ['--acc' as any]: color }}>
    <div className="spx-row-side">
      <div className="spx-row-title"><span className="spx-row-icon"><Icon /></span><h4>{title}</h4></div>
      {headline ?? (
        <>
          <div className="spx-row-score"><b>{score == null ? '—' : inView ? <CountUp text={`${Math.round(score)}%`} duration={1800} delay={600} /> : '0%'}</b><Delta value={delta} /></div>
          <Bar value={score || 0} color={color} />
        </>
      )}
      <small className="spx-row-note">{scoreNote}</small>
      <dl className="spx-stats">
        {stats.map((s) => <div key={s.label}><dt>{s.label}</dt><dd>{s.value}</dd></div>)}
      </dl>
      {action && <div className="spx-row-action">{action}</div>}
    </div>
    <div className="spx-row-main">{children}</div>
  </div>
  )
}

const RANGES: { value: Range; label: string }[] = [
  { value: 'joined', label: 'Since joining' }, { value: '12', label: '12 months' }, { value: '6', label: '6 months' }, { value: '3', label: '3 months' },
]

const StudentProgressView = ({ studentId, name = 'Student', fetchReport, theme = 'dark', showHero = true, title, subtitle, onLoaded, heroAside, heroTarget, aptitudeLink }: {
  studentId: string | null
  name?: string
  fetchReport: (studentId: string, from?: string, to?: string) => Promise<Report | null>
  theme?: 'dark' | 'light'
  showHero?: boolean
  title?: string
  subtitle?: string
  onLoaded?: (report: Report | null) => void
  /** Shown beside the score ring instead of the built-in KPI tiles */
  heroAside?: ReactNode
  /** Render the score summary into this element (e.g. the top of the dashboard) instead of above the rows */
  heroTarget?: HTMLElement | null
  /** Where "Start" on today's aptitude quiz goes (student dashboard only) */
  aptitudeLink?: string
}) => {
  const dark = theme === 'dark'
  const [range, setRange] = useState<Range>('joined')
  const [overall, setOverall] = useState<Report | null>(null)
  const [overallReady, setOverallReady] = useState(false)
  const [points, setPoints] = useState<MonthPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 1) All-time report: the till-date totals, and the joining date (its period starts at onboarding)
  useEffect(() => {
    if (!studentId) return
    let cancelled = false
    setOverall(null)
    setOverallReady(false)
    setPoints([])
    setRange('joined')
    setError('')
    setLoading(true)
    fetchReport(studentId)
      .then((all) => { if (!cancelled) { setOverall(all); onLoaded?.(all) } })
      .catch(() => {})
      .finally(() => { if (!cancelled) setOverallReady(true) })
    return () => { cancelled = true }
  }, [studentId]) // eslint-disable-line

  const joinedAt = useMemo(() => {
    if (!overall?.periodDays) return null
    const d = new Date()
    d.setDate(d.getDate() - (overall.periodDays - 1))
    return d
  }, [overall?.periodDays])

  // 2) One report per calendar month in the chosen range (since joining by default)
  useEffect(() => {
    if (!studentId || !overallReady) return
    let cancelled = false
    setLoading(true)
    const count = range === 'joined'
      ? (joinedAt ? Math.min(MAX_MONTHS, Math.max(1, monthsBetween(joinedAt, new Date()))) : 6)
      : Number(range)
    Promise.all(monthRanges(iso(new Date()), count).map(async (r) => {
      try {
        const rep = await fetchReport(studentId, r.from, r.to)
        return { label: shortMonth(r.label), report: rep, days: rep?.periodDays ?? daysBetween(r.from, r.to) }
      } catch {
        return { label: shortMonth(r.label), report: null, days: daysBetween(r.from, r.to) }
      }
    }))
      .then((result) => {
        if (cancelled) return
        setPoints(result)
        setError(!overall && result.every((p) => !p.report) ? 'Could not load the progress report.' : '')
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [overallReady, range]) // eslint-disable-line

  const labels = points.map((p) => p.label)
  const monthMetrics = useMemo(() => points.map((p) => (p.report ? reportMetrics(p.report, p.days) : null)), [points])
  const scoreSeries = (key: SectionKey) => monthMetrics.map((m) => (m ? m.find((x) => x.key === key)?.score ?? 0 : null))
  const countSeries = (fn: (r: Report) => number) => points.map((p) => (p.report ? fn(p.report) : null))
  const deltaOf = (key: SectionKey) => {
    const s = scoreSeries(key).filter((v): v is number => v != null)
    return s.length >= 2 ? s[s.length - 1] - s[0] : null
  }
  const combo = (key: SectionKey, countName: string, counts: (number | null)[], scoreName = 'Score', scores?: (number | null)[]) => (
    <ReactApexChart
      type="line"
      height={230}
      options={comboOptions(labels, COLORS[key], countName, scoreName, dark)}
      series={[{ name: countName, type: 'column', data: counts }, { name: scoreName, type: 'line', data: scores ?? scoreSeries(key) }] as any}
    />
  )

  const r = overall
  const d = r?.detail || null
  const metrics = r ? reportMetrics(r, r.periodDays || 30) : []
  const m = (key: SectionKey) => metrics.find((x) => x.key === key)
  const st = r ? statusOf(r) : null
  const rank = r ? rankText(r) : null
  const totalDays = r?.periodDays || 0
  const englishCount = (rep: Report) => ENGLISH_KEYS.reduce((s, k) => s + (rep.sections[k]?.attemptsUsed || 0), 0)
  const codeTotal = r ? r.codeStats.available.easy + r.codeStats.available.medium + r.codeStats.available.hard : 0

  const overviewOptions: ApexOptions = {
    chart: { toolbar: { show: false }, zoom: { enabled: false }, background: 'transparent', foreColor: dark ? '#9da2a8' : '#64748b', fontFamily: 'inherit' },
    theme: { mode: dark ? 'dark' : 'light' },
    colors: [dark ? '#ffffff' : (typeof document !== 'undefined' && getComputedStyle(document.documentElement).getPropertyValue('--dash-text').trim()) || '#0f172a', COLORS.engagement, COLORS.interview, COLORS.english, COLORS.aptitude, COLORS.assessment, COLORS.code],
    stroke: { curve: 'smooth', width: [3.5, 2, 2, 2, 2, 2, 2] },
    markers: { size: 3, strokeWidth: 0 },
    grid: { borderColor: dark ? '#202326' : '#eef2f6', strokeDashArray: 3 },
    xaxis: { categories: labels, axisBorder: { color: dark ? '#25282b' : '#e2e8f0' }, axisTicks: { color: dark ? '#25282b' : '#e2e8f0' }, labels: { hideOverlappingLabels: true }, tooltip: { enabled: false } },
    yaxis: { min: 0, max: 100, tickAmount: 4, labels: { formatter: (v: number) => `${Math.round(v)}%` } },
    legend: { position: 'top', horizontalAlign: 'left', fontSize: '12px', markers: { size: 5 } as any, itemMargin: { horizontal: 8 } },
    dataLabels: { enabled: false },
    tooltip: { theme: dark ? 'dark' : 'light', shared: true, intersect: false, y: { formatter: (v: number) => (v == null ? '—' : `${v}%`) } },
  }
  const overviewSeries = [
    { name: 'Overall', data: points.map((p) => (p.report ? Math.round(p.report.overallScore) : null)) },
    { name: 'Daily Engagement', data: scoreSeries('engagement') },
    { name: 'AI Interview', data: scoreSeries('interview') },
    { name: 'English Practice', data: scoreSeries('english') },
    { name: 'Daily Aptitude', data: points.map((p) => (p.report ? p.report.aptitude?.avgScore ?? 0 : null)) },
    { name: 'Assessments', data: scoreSeries('assessment') },
    { name: 'Code Challenge', data: scoreSeries('code') },
  ]

  // Daily aptitude: attempts and average score per month
  const aptCounts = countSeries((rep) => rep.aptitude?.attempts ?? 0)
  const aptScores = points.map((p) => (p.report ? p.report.aptitude?.avgScore ?? 0 : null))
  const aptDelta = (() => { const v = aptScores.filter((x): x is number => x != null); return v.length >= 2 ? v[v.length - 1] - v[0] : null })()
  const apt = r?.aptitude || null
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    const key = iso(d)
    const hit = apt?.recent.find((a) => a.date === key)
    return { key, day: d.getDate(), hit, today: i === 6 }
  })

  const MAX_COURSES = 8
  const time = (v?: string | null) => (v ? new Date(v).getTime() || 0 : 0)
  const shownCourses = r ? [
    ...r.courses.filter((c) => c.progress > 0).sort((a, b) => b.progress - a.progress || time(b.lastAccessedAt) - time(a.lastAccessedAt)),
    ...r.courses.filter((c) => c.progress <= 0).sort((a, b) => time(b.enrolledAt) - time(a.enrolledAt)),
  ].slice(0, MAX_COURSES) : []

  const ringValue = useCountUp(Math.round(r?.overallScore || 0), 1600)

  const renderHero = () => (
    <div className="spx-hero">
      <div className="spx-score" style={{ ['--tone' as any]: STATUS_TONE[st || 'not-started'] }}>
        <div className="spx-ring" style={{ background: `conic-gradient(var(--tone) ${ringValue * 3.6}deg, var(--spx-track, #1d2023) 0deg)` }}>
          <div><b>{r ? `${Math.round(ringValue)}%` : '—'}</b><small>overall</small></div>
        </div>
        <div className="spx-score-text">
          <span className="spx-status" style={{ color: STATUS_TONE[st || 'not-started'] }}>● {st ? STATUS_LABELS[st] : '—'}</span>
          <strong>Progress till date</strong>
          <small>{!r ? (loading ? 'Loading your progress…' : 'Progress not available yet') : joinedAt ? <>Joined {fmtDate(joinedAt)} · {totalDays} day{totalDays === 1 ? '' : 's'} on Eklav</> : 'All-time report'}</small>
        </div>
      </div>
      {heroAside ? <div className="spx-hero-aside">{heroAside}</div> : r && (
        <div className="spx-kpis">
          <div><span><FaTrophy /></span><b>{rank ? rank.label : '—'}</b><small>{rank ? `Rank ${rank.total}` : 'Rank'}</small></div>
          <div><span><FaCalendarAlt /></span><b>{activeDays(r)}<em>/{totalDays || '—'}</em></b><small>Active days</small></div>
          <div><span><FaClock /></span><b>{formatDuration(r.timeSpent.totalSecs)}</b><small>Time spent</small></div>
          <div><span><FaBolt /></span><b>{d?.longestStreak ?? '—'}</b><small>Best streak (days)</small></div>
          <div><span><FaCheckCircle /></span><b>{activitiesCompleted(r)}</b><small>Activities done</small></div>
          <div><span><FaFire /></span><b className="spx-kpi-date" title={fmtDate(d?.lastActiveDate)}>{d?.lastActiveDate ? new Date(`${d.lastActiveDate}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}</b><small>Last active</small></div>
        </div>
      )}
    </div>
  )

  const rootClass = `spx-root${dark ? '' : ' is-light'}`

  return (
    <div className={rootClass}>
      {showHero && heroTarget && createPortal(<div className={rootClass}>{renderHero()}</div>, heroTarget)}
      <div className="spx-wrap">
        <div className="spx-toolbar">
          <div>
            {title && <h3>{title}</h3>}
            {subtitle && <p>{subtitle}</p>}
          </div>
          <div className="spx-tabs-wrap">
            <span>Charts:</span>
            <div className="spx-tabs" role="tablist" aria-label="Chart range">
              {RANGES.map((o) => (
                <button key={o.value} type="button" role="tab" aria-selected={range === o.value} className={range === o.value ? 'is-on' : ''} onClick={() => setRange(o.value)}>{o.label}</button>
              ))}
            </div>
            {loading && points.length > 0 && <span className="spx-spin" />}
          </div>
        </div>

        {loading && !points.length ? (
          <div className="spx-loading"><span className="spx-spin" /> Building {name.split(' ')[0]}’s progress report…</div>
        ) : error ? (
          <div className="aui-alert"><FaExclamationTriangle /> <span>{error}</span></div>
        ) : r && (
          <>
          {showHero && !heroTarget && renderHero()}

      {/* ── All sections over time ── */}
          {points.length > 0 && (
            <div className="spx-card">
              <div className="spx-card-head"><h4>All sections, month by month</h4><small>Overall score is the bold line. Course progress isn't dated, so it's shown as its current value below.</small></div>
              <ReactApexChart type="line" height={260} options={overviewOptions} series={overviewSeries as any} />
            </div>
          )}

          {/* ── 1. Daily engagement ── */}
          <SectionRow
            icon={FaFire} color={COLORS.engagement} title="Daily Engagement"
            score={m('engagement')?.score ?? null} scoreNote={`Active on ${activeDays(r)} of ${totalDays} days since joining`} delta={deltaOf('engagement')}
            stats={[
              { label: 'Active days', value: `${activeDays(r)} / ${totalDays}` },
              { label: 'Time spent', value: formatDuration(r.timeSpent.totalSecs) },
              { label: 'Avg per active day', value: `${Math.round(r.timeSpent.avgMinPerDay || 0)} min` },
              { label: 'Longest streak', value: d ? `${d.longestStreak} day${d.longestStreak === 1 ? '' : 's'}` : '—' },
              { label: 'Last active', value: fmtDate(d?.lastActiveDate) },
            ]}
          >
            <div className="spx-main-grid">
              <div>{combo('engagement', 'Active days', countSeries(activeDays), 'Engagement')}</div>
              {d?.dailyActivity && <div className="spx-sub"><h5>Daily activity</h5><ActivityCalendar days={d.dailyActivity} /></div>}
            </div>
          </SectionRow>

          {/* ── 2. Course progress ── */}
          <SectionRow
            icon={FaBookOpen} color={COLORS.course} title="Course Progress"
            score={m('course')?.score ?? null} scoreNote="Average progress across enrolled courses (current)" delta={null}
            stats={[
              { label: 'Enrolled', value: r.courses.length },
              { label: 'Completed', value: r.courses.filter((c) => c.progress >= 100).length },
              { label: 'In progress', value: r.courses.filter((c) => c.progress > 0 && c.progress < 100).length },
              { label: 'Not started', value: r.courses.filter((c) => c.progress <= 0).length },
              { label: 'Courses available', value: r.totalCoursesAvailable || '—' },
            ]}
          >
            {r.courses.length ? (
              <>
              <ul className="spx-courses" data-top="1">
                {shownCourses.map((c) => (
                  <li key={c.courseId}>
                    <span className="spx-course-name" title={c.title}>{c.title}</span>
                    <Bar value={c.progress} color={c.progress >= 100 ? '#45dd75' : COLORS.course} />
                    <b>{Math.round(c.progress)}%</b>
                    <span className={`spx-tag ${c.progress >= 100 ? 'is-done' : c.progress > 0 ? 'is-on' : ''}`}>{c.progress >= 100 ? 'Completed' : c.progress > 0 ? 'In progress' : 'Not started'}</span>
                  </li>
                ))}
              </ul>
              {r.courses.length > shownCourses.length && (
                <p className="spx-courses-more">Showing {shownCourses.length} of {r.courses.length} courses · courses in progress first, then the latest enrolled</p>
              )}
              </>
            ) : <p className="spx-empty">Not enrolled in any course yet.</p>}
          </SectionRow>

          {/* ── 3. AI interview ── */}
          <SectionRow
            icon={FaRobot} color={COLORS.interview} title="AI Interview"
            score={m('interview')?.score ?? null} scoreNote="Average of self and resume interview scores" delta={deltaOf('interview')}
            stats={[
              { label: 'Self interviews', value: `${r.sections.selfInterview.sessions} · avg ${pct(r.sections.selfInterview.avgScore)}` },
              { label: 'Resume interviews', value: `${r.sections.resumeInterview.sessions} · avg ${pct(r.sections.resumeInterview.avgScore)}` },
              { label: 'Topics practised', value: d?.interviewTopics.length ?? '—' },
            ]}
          >
            <div className="spx-main-grid">
              <div>{combo('interview', 'Sessions', countSeries((rep) => rep.sections.selfInterview.sessions + rep.sections.resumeInterview.sessions))}</div>
              {d && (
                <div className="spx-sub">
                  <h5>Top {Math.min(5, d.interviewTopics.length)} topics{d.interviewTopics.length > 5 ? ` of ${d.interviewTopics.length}` : ''}</h5>
                  {d.interviewTopics.length ? (
                    <table className="spx-table">
                      <thead><tr><th>Topic</th><th>Sessions</th><th>Avg</th><th>Best</th><th>Last</th></tr></thead>
                      <tbody>{d.interviewTopics.slice(0, 5).map((t) => (
                        <tr key={t.topic}><td className="spx-ellipsis" title={t.topic}>{t.topic}</td><td>{t.sessions}</td><td>{pct(t.avgScore)}</td><td>{pct(t.bestScore)}</td><td>{fmtDate(t.lastAt)}</td></tr>
                      ))}</tbody>
                    </table>
                  ) : <p className="spx-empty">No self interviews yet.</p>}
                </div>
              )}
            </div>
          </SectionRow>

          {/* ── 4. English practice ── */}
          <SectionRow
            icon={FaLanguage} color={COLORS.english} title="English Practice"
            score={m('english')?.score ?? null} scoreNote="Average of the best score in each practised module" delta={deltaOf('english')}
            stats={[
              { label: 'Modules practised', value: `${ENGLISH_KEYS.filter((k) => r.sections[k]?.attemptsUsed > 0).length} / 5` },
              { label: 'Total attempts', value: englishCount(r) },
              ...(r.sections.vocabulary ? [{ label: 'Words learned', value: `${r.sections.vocabulary.totalWordsLearned ?? 0} · ${r.sections.vocabulary.wordsMastered ?? 0} mastered` }] : []),
            ]}
          >
            <div className="spx-main-grid">
              <div>{combo('english', 'Attempts', countSeries(englishCount))}</div>
              <div className="spx-sub">
                <h5>By module</h5>
                <table className="spx-table">
                  <thead><tr><th>Module</th><th>Attempts</th><th>Best</th><th>Average</th></tr></thead>
                  <tbody>{ENGLISH_KEYS.map((k) => {
                    const e = r.sections[k]
                    return <tr key={k}><td className="spx-cap">{k === 'jam' ? 'JAM' : k}</td><td>{e?.attemptsUsed ?? 0}</td><td>{e?.bestScore == null ? '—' : pct(e.bestScore)}</td><td>{e?.attemptsUsed ? pct(e.avgScore) : '—'}</td></tr>
                  })}</tbody>
                </table>
              </div>
            </div>
          </SectionRow>

          {/* ── Daily aptitude ── */}
          <SectionRow
            icon={FaBrain} color={COLORS.aptitude} title="Daily Aptitude"
            score={apt?.avgScore ?? null} scoreNote={apt?.attempts ? `Average score across ${apt.attempts} daily quiz${apt.attempts === 1 ? '' : 'zes'}` : 'No daily quiz taken yet'} delta={aptDelta}
            stats={[
              { label: 'Quizzes attempted', value: apt?.attempts ?? 0 },
              { label: 'Attendance', value: apt && totalDays ? `${apt.attempts} / ${totalDays} days · ${pct((apt.attempts / totalDays) * 100)}` : '—' },
              { label: 'Best score', value: pct(apt?.bestScore) },
              { label: 'Current streak', value: apt ? `${apt.streak} day${apt.streak === 1 ? '' : 's'}` : '—' },
              { label: 'Time spent', value: apt?.totalTimeSecs ? formatDuration(apt.totalTimeSecs) : '—' },
            ]}
          >
            <div className="spx-main-grid">
              <div>
                {combo('aptitude', 'Quizzes', aptCounts, 'Avg score', aptScores)}
                {apt?.today && aptitudeLink && (
                  <div className="spx-today" style={{ ['--cat' as any]: APT_CAT_COLOR[apt.today.category] || COLORS.aptitude }}>
                    <div><small>Today's quiz</small><b>{apt.today.category}</b></div>
                    {apt.today.attended
                      ? <span className="spx-tag is-done">Completed</span>
                      : <Link to={aptitudeLink} className="spx-today-btn">Start →</Link>}
                  </div>
                )}
              </div>
              <div className="spx-sub spx-sub-col">
                <h5>By category</h5>
                <table className="spx-table">
                  <thead><tr><th>Category</th><th>Quizzes</th><th>Avg</th><th>Best</th></tr></thead>
                  <tbody>{(apt?.byCategory || []).map((c) => (
                    <tr key={c.category}><td><span className="spx-dot" style={{ background: APT_CAT_COLOR[c.category] || COLORS.aptitude }} />{c.category}</td><td>{c.attempts}</td><td>{pct(c.avgScore)}</td><td>{pct(c.bestScore)}</td></tr>
                  ))}</tbody>
                </table>
                {/* pinned to the bottom so it lines up with Today's quiz under the chart */}
                <div className="spx-week-block">
                <h5>Last 7 days</h5>
                <div className="spx-week">
                  {last7.map((d) => (
                    <div key={d.key} className={`spx-week-day${d.hit ? ' is-done' : d.today ? ' is-today' : ''}`} title={`${fmtDate(d.key)} · ${d.hit ? `${d.hit.category} · ${d.hit.score}/${d.hit.total}` : d.today ? 'Today' : 'Missed'}`}>
                      <span>{d.hit ? `${d.hit.pct}%` : d.today ? '•' : '–'}</span>
                      <small>{d.day}</small>
                    </div>
                  ))}
                </div>
                </div>
              </div>
            </div>
          </SectionRow>

          {/* ── 5. Assessments ── */}
          <SectionRow
            icon={FaClipboardCheck} color={COLORS.assessment} title="Assessments"
            score={m('assessment')?.score ?? null} scoreNote="Average final percentage across attempts" delta={deltaOf('assessment')}
            stats={[
              { label: 'Attempts', value: r.sections.assessment.sessions },
              { label: 'Passed', value: `${r.sections.assessment.passed} / ${r.sections.assessment.sessions}` },
              { label: 'Pass rate', value: r.sections.assessment.sessions ? pct((r.sections.assessment.passed / r.sections.assessment.sessions) * 100) : '—' },
            ]}
          >
            <div className="spx-main-grid">
              <div>{combo('assessment', 'Attempts', countSeries((rep) => rep.sections.assessment.sessions))}</div>
              {d && (
                <div className="spx-sub">
                  <h5>Latest {Math.min(5, d.recentAssessments.length)} attempts</h5>
                  {d.recentAssessments.length ? (
                    <table className="spx-table">
                      <thead><tr><th>Date</th><th>Score</th><th>Result</th></tr></thead>
                      <tbody>{d.recentAssessments.slice(0, 5).map((a, i) => (
                        <tr key={i}><td>{fmtDate(a.date)}</td><td>{pct(a.score)}</td><td><span className={`spx-tag ${a.result === 'pass' ? 'is-done' : a.result ? 'is-bad' : ''}`}>{a.result ? a.result.charAt(0).toUpperCase() + a.result.slice(1) : '—'}</span></td></tr>
                      ))}</tbody>
                    </table>
                  ) : <p className="spx-empty">No assessments taken yet.</p>}
                </div>
              )}
            </div>
          </SectionRow>

          {/* ── 6. Code challenge ── */}
          <SectionRow
            icon={FaCode} color={COLORS.code} title="Code Challenge"
            score={m('code')?.score ?? null} scoreNote={`${r.codeStats.solved} of ${codeTotal} problems solved`} delta={deltaOf('code')}
            stats={[
              { label: 'Solved', value: `${r.codeStats.solved} / ${codeTotal}` },
              ...(['easy', 'medium', 'hard'] as const).map((lvl) => ({
                label: lvl.charAt(0).toUpperCase() + lvl.slice(1),
                value: d ? `${d.code.solvedByDifficulty[lvl]} / ${r.codeStats.available[lvl]}` : `— / ${r.codeStats.available[lvl]}`,
              })),
            ]}
          >
            <div className="spx-main-grid">
              <div>{combo('code', 'Solved', countSeries((rep) => rep.codeStats.solved))}</div>
              {d && (
                <div className="spx-sub">
                  <h5>Latest {Math.min(5, d.code.recentSolved.length)} solved</h5>
                  {d.code.recentSolved.length ? (
                    <table className="spx-table">
                      <thead><tr><th>Problem</th><th>Level</th><th>Solved</th></tr></thead>
                      <tbody>{d.code.recentSolved.slice(0, 5).map((p, i) => (
                        <tr key={i}><td className="spx-ellipsis" title={p.title}>{p.title}</td><td><span className={`spx-tag lvl-${String(p.difficulty || '').toLowerCase()}`}>{p.difficulty || '—'}</span></td><td>{fmtDate(p.solvedAt)}</td></tr>
                      ))}</tbody>
                    </table>
                  ) : <p className="spx-empty">No problems solved yet.</p>}
                </div>
              )}
            </div>
          </SectionRow>

          </>
        )}
      </div>

      <style>{`
        .spx-wrap { display: flex; flex-direction: column; gap: 1rem; max-width: 1500px; margin: 0 auto; }
        .spx-loading { display: flex; align-items: center; justify-content: center; gap: 10px; min-height: 280px; color: #9da2a8; font-size: 0.9rem; }

        .spx-hero { display: grid; align-items: center; grid-template-columns: minmax(300px, 0.8fr) minmax(0, 2fr); gap: 1rem; padding: 1.1rem; border: 1px solid #25282b; border-radius: 14px; background: linear-gradient(135deg, rgba(255,122,0,0.07), #0e1012 55%); }
        .spx-score { display: flex; align-items: center; gap: 18px; }
        .spx-ring { display: grid; place-items: center; width: 112px; height: 112px; flex: 0 0 112px; border-radius: 50%; }
        .spx-ring > div { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 90px; height: 90px; border-radius: 50%; background: #0e1012; }
        .spx-ring b { color: #fff; font-size: 1.6rem; font-weight: 800; line-height: 1; }
        .spx-ring small { margin-top: 3px; color: #6b7280; font-size: 0.64rem; letter-spacing: 0.06em; text-transform: uppercase; }
        .spx-score-text { display: flex; flex-direction: column; gap: 3px; }
        .spx-status { font-size: 0.76rem; font-weight: 700; }
        .spx-score-text strong { color: #fff; font-size: 1.1rem; }
        .spx-score-text small { color: #858a90; font-size: 0.78rem; }
        .spx-kpis { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 10px; }
        .spx-kpis > div { display: grid; grid-template-columns: 38px minmax(0, 1fr); grid-template-rows: auto auto; align-items: center; column-gap: 10px; row-gap: 1px; padding: 0.6rem 0.8rem; border: 1px solid #25282b; border-radius: 10px; background: #111315; }
        .spx-kpis span { grid-row: 1 / span 2; display: grid; place-items: center; width: 38px; height: 38px; border-radius: 10px; background: rgba(255,122,0,0.12); color: #ff9a3c; font-size: 1.1rem; }
        .spx-kpis b { overflow: hidden; color: #fff; font-size: 1.15rem; font-weight: 800; line-height: 1.15; text-overflow: ellipsis; white-space: nowrap; }
        .spx-kpis b.spx-kpi-date { font-size: 0.95rem; }
        .spx-kpis em { color: #6b7280; font-size: 0.8rem; font-style: normal; font-weight: 600; }
        .spx-kpis small { overflow: hidden; color: #858a90; font-size: 0.7rem; text-overflow: ellipsis; white-space: nowrap; }

        .spx-card { padding: 0.9rem 1rem 0.4rem; border: 1px solid #25282b; border-radius: 14px; background: #0e1012; }
        .spx-card-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        .spx-card-head h4 { margin: 0; color: #eceef0; font-size: 0.95rem; font-weight: 750; }
        .spx-card-head small { color: #6b7280; font-size: 0.74rem; }

        .spx-row { display: grid; grid-template-columns: 290px minmax(0, 1fr); overflow: hidden; border: 1px solid #25282b; border-radius: 14px; background: #0e1012; }
        .spx-row-side { display: flex; flex-direction: column; gap: 10px; padding: 1.1rem; border-right: 1px solid #1d2023; background: linear-gradient(180deg, color-mix(in srgb, var(--acc) 7%, #0e1012), #0e1012 60%); box-shadow: inset 3px 0 0 var(--acc); }
        .spx-row-title { display: flex; align-items: center; gap: 10px; }
        .spx-row-title h4 { margin: 0; color: #fff; font-size: 1rem; font-weight: 750; }
        .spx-row-icon { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 10px; background: color-mix(in srgb, var(--acc) 15%, transparent); color: var(--acc); }
        .spx-row-score { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .spx-row-score b { color: var(--acc); font-size: 2rem; font-weight: 800; line-height: 1; }
        .spx-row-note { color: #858a90; font-size: 0.74rem; line-height: 1.4; }
        .spx-stats { display: flex; flex-direction: column; gap: 7px; margin: 4px 0 0; padding-top: 10px; border-top: 1px solid #1d2023; }
        .spx-stats div { display: flex; justify-content: space-between; gap: 10px; }
        .spx-stats dt { color: #6b7280; font-size: 0.76rem; font-weight: 600; }
        .spx-stats dd { margin: 0; color: #e5e7eb; font-size: 0.78rem; font-weight: 650; text-align: right; }
        .spx-row-main { display: flex; flex-direction: column; justify-content: center; min-width: 0; padding: 1rem 1.25rem 0.75rem; }
        .spx-main-grid { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(300px, 1fr); gap: 1.75rem; align-items: start; }
        .spx-main-grid > div:first-child { padding-top: 0.25rem; }
        /* Daily activity: heading stays level with the chart legend, the calendar sits centred beside the chart */
        .spx-main-grid > .spx-sub:has(> .spx-cal-wrap) { display: flex; flex-direction: column; }
        .spx-sub > .spx-cal-wrap { margin: auto 0; padding-bottom: 1.5rem; }
        .spx-main-grid > .spx-sub { align-self: stretch; padding: 0.35rem 0 0 1.5rem; border-left: 1px solid #1d2023; }
        .spx-sub h5 { margin: 0 0 0.85rem; color: #9da2a8; font-size: 0.68rem; font-weight: 750; letter-spacing: 0.06em; text-transform: uppercase; }

        .spx-bar { display: block; height: 6px; overflow: hidden; border-radius: 99px; background: #1d2023; }
        .spx-bar > span { display: block; height: 100%; border-radius: 99px; animation: spx-grow 1.4s cubic-bezier(.16,1,.3,1) both; }
        .spx-row.is-folded .spx-bar > span { animation: none; width: 0 !important; }
        .spx-row.is-open .spx-bar > span { animation-duration: 1.8s; animation-delay: 0.6s; }
        @keyframes spx-grow { from { width: 0; } }
        .spx-card, .spx-hero { animation: spx-rise 0.5s ease-out both; }

        /* Fold-open: the side panel rises in, then the main panel swings open to the right
           from its left edge (like a folded mat), with a shadow that fades as it flattens */
        .spx-row { perspective: 1800px; }
        .spx-row-side, .spx-row-main { backface-visibility: hidden; }
        .spx-row.is-folded { opacity: 0; transform: translateY(18px); }
        .spx-row.is-folded .spx-row-side { opacity: 0; transform: translateY(10px); }
        .spx-row.is-folded .spx-row-main { opacity: 0; transform: rotateY(-82deg); }
        .spx-row-main { position: relative; transform-origin: left center; }
        .spx-row-main::after { content: ''; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(90deg, rgba(0,0,0,0.22), rgba(0,0,0,0) 70%); opacity: 0; }
        .spx-row.is-folded .spx-row-main::after { opacity: 1; }
        .spx-row.is-folded { transition: opacity 0.6s ease-in 0.3s, transform 0.7s ease-in 0.3s; }
        .spx-row.is-folded .spx-row-main { transition: transform 0.9s cubic-bezier(.6,0,.8,.3), opacity 0.6s ease-in 0.3s; }
        .spx-row.is-folded .spx-row-side { transition: opacity 0.5s ease-in 0.4s, transform 0.6s ease-in 0.4s; }
        .spx-row.is-folded .spx-row-main::after { transition: opacity 0.6s ease-in; }
        .spx-row.is-open { opacity: 1; transform: none; transition: opacity 0.6s ease-out, transform 0.8s ease-out; }
        .spx-row.is-open .spx-row-side { transition: opacity 0.7s ease-out 0.1s, transform 0.9s ease-out 0.1s; }
        .spx-row.is-open .spx-row-main { transition: transform 1.6s cubic-bezier(.22,.9,.25,1) 0.4s, opacity 0.8s ease-out 0.4s; }
        .spx-row.is-open .spx-row-main::after { transition: opacity 1.5s ease-out 0.6s; }
        @media (max-width: 991.98px) {
          .spx-row-main { transform-origin: center top; }
          .spx-row.is-folded .spx-row-main { transform: rotateX(-70deg); }
        }
        @keyframes spx-rise { from { opacity: 0; transform: translateY(8px); } }
        @media (prefers-reduced-motion: reduce) {
          .spx-bar > span, .spx-card, .spx-hero { animation: none; }
          .spx-row, .spx-row-side, .spx-row-main, .spx-row-main::after { opacity: 1 !important; transform: none !important; transition: none !important; }
        }
        .spx-delta { display: inline-flex; align-items: center; gap: 4px; padding: 3px 9px; border-radius: 99px; background: #17191c; color: #858a90; font-size: 0.7rem; font-weight: 700; white-space: nowrap; }
        .spx-delta.is-up { background: rgba(49,216,102,0.1); color: #45dd75; }
        .spx-delta.is-down { background: rgba(251,95,103,0.1); color: #fb737a; }

        .spx-row-main:has(> .spx-courses) { justify-content: flex-start; padding-top: 1rem; padding-bottom: 1rem; }
        /* course rows spread over the full row height so there is no empty block under them */
        .spx-row-main > .spx-courses { flex: 1; align-content: center; }
        .spx-row-main > .spx-courses:has(li:nth-child(5)) { align-content: space-evenly; }
        .spx-courses { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 2rem; margin: 0.25rem 0 0.5rem; padding: 0; list-style: none; }
        .spx-courses-more { margin: 0.25rem 0 0.5rem; color: #6b7280; font-size: 0.72rem; }
        .spx-root.is-light .spx-courses-more { color: var(--dash-gray, #64748b); }
        .spx-courses li { display: grid; grid-template-columns: minmax(0, 1fr) 110px 42px 86px; align-items: center; gap: 10px; padding: 6px 0; border-bottom: 1px solid #17191c; }
        .spx-course-name { overflow: hidden; color: #d1d5db; font-size: 0.82rem; text-overflow: ellipsis; white-space: nowrap; }
        .spx-courses b { color: #e5e7eb; font-size: 0.8rem; text-align: right; }
        .spx-tag { display: inline-block; padding: 2px 8px; border: 1px solid #2c3034; border-radius: 99px; background: #141618; color: #858a90; font-size: 0.66rem; font-weight: 700; text-align: center; white-space: nowrap; }
        .spx-tag.is-on { border-color: rgba(56,189,248,0.3); color: #7dd3fc; }
        .spx-tag.is-done { border-color: rgba(49,216,102,0.35); background: rgba(49,216,102,0.08); color: #45dd75; }
        .spx-tag.is-bad { border-color: rgba(251,95,103,0.35); background: rgba(251,95,103,0.08); color: #fb737a; }
        .spx-tag.lvl-easy { color: #45dd75; } .spx-tag.lvl-medium { color: #f4b43f; } .spx-tag.lvl-hard { color: #fb737a; }
        .spx-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; table-layout: fixed; }
        .spx-table th { padding: 0 6px 6px 0; color: #6b7280; font-size: 0.64rem; font-weight: 700; letter-spacing: 0.05em; text-align: left; text-transform: uppercase; }
        .spx-table td { padding: 6px 6px 6px 0; border-top: 1px solid #1a1c1f; color: #d1d5db; white-space: nowrap; }
        .spx-table th:first-child, .spx-table td:first-child { width: 40%; }
        .spx-dot { display: inline-block; width: 8px; height: 8px; margin-right: 8px; border-radius: 50%; vertical-align: middle; }
        .spx-sub-gap { margin-top: 1rem !important; }
        .spx-main-grid > .spx-sub-col { display: flex; flex-direction: column; }
        .spx-week-block { margin-top: auto; padding-top: 1rem; }
        .spx-week { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 6px; }
        .spx-week-day { display: flex; flex-direction: column; align-items: center; gap: 3px; }
        .spx-week-day span { display: grid; place-items: center; width: 100%; height: 30px; border: 1px solid rgba(251,113,133,0.35); border-radius: 8px; background: rgba(251,113,133,0.08); color: #fb7185; font-size: 0.68rem; font-weight: 700; }
        .spx-week-day.is-done span { border-color: rgba(52,211,153,0.4); background: rgba(52,211,153,0.1); color: #10b981; }
        .spx-week-day.is-today span { border-color: rgba(129,140,248,0.5); background: rgba(129,140,248,0.12); color: #818cf8; }
        .spx-week-day small { color: #6b7280; font-size: 0.64rem; }
        .spx-today { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 0.25rem; padding: 0.6rem 0.8rem; border: 1px solid color-mix(in srgb, var(--cat) 35%, transparent); border-radius: 10px; background: color-mix(in srgb, var(--cat) 8%, transparent); }
        .spx-today small { display: block; color: #6b7280; font-size: 0.68rem; }
        .spx-today b { color: var(--cat); font-size: 0.88rem; }
        .spx-today-btn { padding: 6px 14px; border-radius: 8px; background: var(--cat); color: #fff !important; font-size: 0.78rem; font-weight: 700; text-decoration: none; white-space: nowrap; }
        .spx-today-btn:hover { filter: brightness(1.08); }
        .spx-root.is-light .spx-week-day small, .spx-root.is-light .spx-today small { color: var(--dash-gray, #64748b); }
        .spx-row-action { margin-top: auto; padding-top: 6px; }
        .spx-row-action a { display: inline-flex; align-items: center; gap: 6px; color: var(--acc); font-size: 0.8rem; font-weight: 700; text-decoration: none; }
        .spx-row-action a:hover { text-decoration: underline; }
        .spx-headline { display: flex; align-items: baseline; gap: 8px; }
        .spx-headline b { color: var(--acc); font-size: 2rem; font-weight: 800; line-height: 1; }
        .spx-headline span { color: #858a90; font-size: 0.8rem; font-weight: 600; }
        .spx-root.is-light .spx-headline span { color: var(--dash-gray, #64748b); }
        .spx-ellipsis { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .spx-cap { text-transform: capitalize; }
        .spx-empty { margin: 0.5rem 0; color: #6b7280; font-size: 0.8rem; }
        .spx-note { margin: 0; color: #6b7280; font-size: 0.72rem; }

        .spx-cal-wrap { overflow-x: auto; }
        .spx-cal { display: grid; grid-auto-flow: column; grid-template-rows: repeat(7, 1fr); grid-auto-columns: minmax(10px, 1fr); gap: 3px; width: 100%; max-width: 560px; }
        .spx-cal span { aspect-ratio: 1; border-radius: 3px; background: #17191c; }
        .spx-cal-legend span { width: 11px; height: 11px; border-radius: 2px; background: #17191c; }
        .spx-cal .l1, .spx-cal-legend .l1 { background: rgba(255,122,0,0.3); }
        .spx-cal .l2, .spx-cal-legend .l2 { background: rgba(255,122,0,0.55); }
        .spx-cal .l3, .spx-cal-legend .l3 { background: rgba(255,122,0,0.8); }
        .spx-cal .l4, .spx-cal-legend .l4 { background: #ff7a00; }
        .spx-cal .lx { background: transparent; }
        .spx-cal-legend { display: flex; align-items: center; gap: 3px; margin-top: 8px; color: #6b7280; font-size: 0.68rem; }
        .spx-cal-legend span { display: inline-block; }


        /* Toolbar (title + chart range) */
        .spx-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        .spx-toolbar h3 { margin: 0; color: #fff; font-size: 1.05rem; font-weight: 750; }
        .spx-toolbar p { margin: 2px 0 0; color: #6b7280; font-size: 0.76rem; }
        .spx-tabs-wrap { display: flex; align-items: center; gap: 8px; margin-left: auto; }
        .spx-tabs-wrap > span:first-child { color: #6b7280; font-size: 0.74rem; }
        .spx-tabs { display: inline-flex; align-items: center; gap: 2px; padding: 3px; border: 1px solid #25282b; border-radius: 10px; background: #0e1012; }
        .spx-tabs button { padding: 5px 11px; border: 0; border-radius: 7px; background: transparent; color: #9da2a8; font-size: 0.76rem; font-weight: 650; cursor: pointer; white-space: nowrap; }
        .spx-tabs button.is-on { background: rgba(255,122,0,0.14); color: #ffb15e; }
        .spx-spin { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,122,0,0.25); border-top-color: #ff7a00; border-radius: 50%; animation: spx-rot 0.8s linear infinite; }
        @keyframes spx-rot { to { transform: rotate(360deg); } }
        .spx-root .apexcharts-tooltip { border: 1px solid #34383d !important; background: #17191c !important; }
        .spx-root .apexcharts-tooltip-title { border-bottom-color: #25282b !important; background: #111315 !important; }

        /* Light theme (student dashboard) */
        .spx-root.is-light .spx-toolbar h3, .spx-root.is-light .spx-row-title h4, .spx-root.is-light .spx-card-head h4,
        .spx-root.is-light .spx-score-text strong, .spx-root.is-light .spx-kpis b { color: var(--dash-text, #0f172a); }
        .spx-root.is-light .spx-tabs { border-color: var(--dash-border, #e2e8f0); background: var(--dash-card-bg, #fff); }
        .spx-root.is-light .spx-tabs button { color: var(--dash-gray, #64748b); }
        .spx-root.is-light .spx-tabs button.is-on { background: rgba(255,122,0,0.12); color: #ea580c; }
        .spx-root.is-light .spx-row, .spx-root.is-light .spx-card, .spx-root.is-light .spx-hero { border-color: var(--dash-border, #e2e8f0); background: var(--dash-card-bg, #fff); box-shadow: 0 1px 3px rgba(15,23,42,0.05); }
        .spx-root.is-light .spx-row-side { border-right-color: var(--dash-border, #eef2f6); background: linear-gradient(180deg, color-mix(in srgb, var(--acc) 8%, var(--dash-card-bg, #fff)), var(--dash-card-bg, #fff) 60%); }
        .spx-root.is-light .spx-row-note, .spx-root.is-light .spx-card-head small, .spx-root.is-light .spx-note, .spx-root.is-light .spx-empty { color: var(--dash-gray, #64748b); }
        /* Hover tooltip follows the dashboard theme (light or dark) */
        .spx-root.is-light .apexcharts-tooltip { color: var(--dash-text, #0f172a) !important; box-shadow: 0 8px 24px rgba(0,0,0,0.18) !important; }
        .spx-root.is-light .apexcharts-tooltip-title { color: var(--dash-text, #0f172a) !important; font-weight: 700; }
        .spx-root.is-light .apexcharts-tooltip-text, .spx-root.is-light .apexcharts-tooltip-text-y-label { color: var(--dash-gray, #64748b) !important; }
        .spx-root.is-light .apexcharts-tooltip-text-y-value { color: var(--dash-text, #0f172a) !important; font-weight: 700; }
        .spx-root.is-light .apexcharts-xaxistooltip { display: none; }
        .spx-root.is-light .apexcharts-legend-text { color: var(--dash-gray, #64748b) !important; }
        .spx-root.is-light .apexcharts-xaxis-label, .spx-root.is-light .apexcharts-yaxis-label, .spx-root.is-light .apexcharts-yaxis-title-text { fill: var(--dash-gray, #64748b) !important; }
        .spx-root.is-light .apexcharts-gridline { stroke: var(--dash-border, #eef2f6) !important; }
        .spx-root.is-light .spx-main-grid > .spx-sub { border-left-color: var(--dash-border, #eef2f6); }
        .spx-root.is-light .spx-stats { border-top-color: var(--dash-border, #eef2f6); }
        .spx-root.is-light .spx-stats dt { color: var(--dash-gray, #64748b); }
        .spx-root.is-light .spx-stats dd, .spx-root.is-light .spx-courses b { color: var(--dash-text, #0f172a); }
        .spx-root.is-light .spx-bar { background: var(--dash-border, #eef2f6); }
        .spx-root.is-light .spx-delta { background: color-mix(in srgb, var(--dash-gray, #64748b) 12%, transparent); color: var(--dash-gray, #64748b); }
        .spx-root.is-light .spx-delta.is-up { background: rgba(22,163,74,0.12); color: #16a34a; }
        .spx-root.is-light .spx-delta.is-down { background: rgba(220,38,38,0.12); color: #dc2626; }
        .spx-root.is-light .spx-sub h5, .spx-root.is-light .spx-table th { color: var(--dash-gray, #64748b); }
        .spx-root.is-light .spx-table td { border-top-color: var(--dash-border, #f1f5f9); color: var(--dash-text, #334155); }
        .spx-root.is-light .spx-course-name { color: var(--dash-text, #334155); }
        .spx-root.is-light .spx-courses li { border-bottom-color: var(--dash-border, #f1f5f9); }
        .spx-root.is-light .spx-tag { border-color: var(--dash-border, #e2e8f0); background: transparent; color: var(--dash-gray, #64748b); }
        .spx-root.is-light .spx-tag.is-on { border-color: rgba(2,132,199,0.35); background: rgba(2,132,199,0.1); color: #0284c7; }
        .spx-root.is-light .spx-tag.is-done { border-color: rgba(22,163,74,0.35); background: rgba(22,163,74,0.1); color: #16a34a; }
        .spx-root.is-light .spx-tag.is-bad { border-color: rgba(220,38,38,0.35); background: rgba(220,38,38,0.1); color: #dc2626; }
        .spx-root.is-light .spx-tag.lvl-easy { color: #16a34a; }
        .spx-root.is-light .spx-tag.lvl-medium { color: #d97706; }
        .spx-root.is-light .spx-tag.lvl-hard { color: #dc2626; }
        .spx-root.is-light .spx-cal span, .spx-root.is-light .spx-cal-legend span { background: var(--dash-border, #eef2f6); }
        .spx-root.is-light .spx-cal .l1, .spx-root.is-light .spx-cal-legend .l1 { background: rgba(255,122,0,0.3); }
        .spx-root.is-light .spx-cal .l2, .spx-root.is-light .spx-cal-legend .l2 { background: rgba(255,122,0,0.55); }
        .spx-root.is-light .spx-cal .l3, .spx-root.is-light .spx-cal-legend .l3 { background: rgba(255,122,0,0.8); }
        .spx-root.is-light .spx-cal .l4, .spx-root.is-light .spx-cal-legend .l4 { background: #ff7a00; }
        .spx-root.is-light .spx-cal .lx { background: transparent; }
        .spx-root.is-light .spx-cal-legend, .spx-root.is-light .spx-loading { color: var(--dash-gray, #64748b); }
        .spx-root.is-light { --spx-track: var(--dash-border, #eef2f6); }
        .spx-root.is-light .spx-wrap { max-width: none; }
        .spx-root.is-light .spx-hero { background: linear-gradient(135deg, color-mix(in srgb, #ff7a00 7%, var(--dash-card-bg, #fff)), var(--dash-card-bg, #fff) 55%); }
        .spx-root.is-light .spx-ring > div { background: var(--dash-card-bg, #fff); }
        .spx-root.is-light .spx-ring b { color: var(--dash-text, #0f172a); }
        .spx-root.is-light .spx-score-text small, .spx-root.is-light .spx-kpis small, .spx-root.is-light .spx-ring small { color: var(--dash-gray, #64748b); }
        .spx-root.is-light .spx-kpis > div { border-color: var(--dash-border, #e2e8f0); background: var(--dash-card-bg, #fff); }
        .spx-root.is-light .spx-kpis em { color: #94a3b8; }
        .spx-root.is-light .apexcharts-tooltip { border: 1px solid var(--dash-border, #e2e8f0) !important; background: var(--dash-card-bg, #fff) !important; }
        .spx-root.is-light .apexcharts-tooltip-title { border-bottom-color: var(--dash-border, #eef2f6) !important; background: var(--dash-page-bg, #f8fafc) !important; }

        /* Hero with the dashboard's own stat cards beside the ring */
        .spx-hero:has(> .spx-hero-aside) { grid-template-columns: auto minmax(0, 1fr); gap: 1.25rem; }
        .spx-hero-aside { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; align-items: stretch; }
        /* Dashboard stat cards inside the hero: icon + label on one line, value and note below.
           The text wrapper is flattened (display: contents) so its children join the card's grid. */
        .spx-hero-aside > div { display: grid !important; grid-template-columns: 32px minmax(0, 1fr); grid-auto-rows: auto; align-items: center !important; align-content: center; column-gap: 10px !important; row-gap: 6px !important; padding: 12px 14px !important; }
        .spx-hero-aside > div > div:first-child { grid-column: 1; grid-row: 1; width: 32px !important; height: 32px !important; border-radius: 9px !important; }
        .spx-hero-aside > div > div:first-child svg { width: 18px; height: 18px; }
        .spx-hero-aside > div > div:last-child { display: contents; }
        .spx-hero-aside > div > div:last-child > div:first-child { grid-column: 2; grid-row: 1; margin: 0 !important; white-space: normal !important; overflow: visible !important; font-size: 0.76rem !important; font-weight: 600 !important; line-height: 1.2; }
        .spx-hero-aside > div > div:last-child > div:not(:first-child) { grid-column: 1 / -1; }
        .spx-hero-aside > div > div:last-child > div:nth-child(2) { margin-bottom: 0 !important; font-size: 1.55rem !important; line-height: 1.1 !important; }
        .spx-hero-aside > div > div:last-child > div:last-child:not(:nth-child(2)) { line-height: 1.35; }
        .spx-hero-aside > div > div:last-child > div:last-child span { white-space: normal; }
        .spx-hero:has(> .spx-hero-aside) { align-items: stretch; }
        .spx-hero:has(> .spx-hero-aside) .spx-score { gap: 14px; padding-right: 0.25rem; }
        .spx-hero:has(> .spx-hero-aside) .spx-ring { width: 100px; height: 100px; flex-basis: 100px; align-self: center; }
        .spx-hero:has(> .spx-hero-aside) .spx-ring > div { width: 80px; height: 80px; }
        .spx-hero:has(> .spx-hero-aside) .spx-ring b { font-size: 1.4rem; }
        .spx-hero:has(> .spx-hero-aside) .spx-score-text strong { font-size: 1.02rem; }
        .spx-hero:has(> .spx-hero-aside) .spx-score-text small { max-width: 190px; font-size: 0.74rem; line-height: 1.4; }
        @media (max-width: 1399.98px) { .spx-hero-aside { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
        @media (max-width: 1199.98px) { .spx-hero:has(> .spx-hero-aside) { grid-template-columns: 1fr; } }
        @media (max-width: 767.98px) { .spx-hero-aside { grid-template-columns: repeat(2, minmax(0, 1fr)); } }

        @media (max-width: 1399.98px) { .spx-kpis { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
        @media (max-width: 1199.98px) {
          .spx-hero, .spx-main-grid { grid-template-columns: 1fr; }
          .spx-main-grid > .spx-sub { padding: 1rem 0 0; border-left: 0; border-top: 1px solid #1d2023; }
          .spx-courses { grid-template-columns: 1fr; }
        }
        @media (max-width: 991.98px) {
          .spx-row { grid-template-columns: 1fr; }
          .spx-row-side { border-right: 0; border-bottom: 1px solid #1d2023; }
        }
      `}</style>
    </div>
  )
}

export default StudentProgressView
