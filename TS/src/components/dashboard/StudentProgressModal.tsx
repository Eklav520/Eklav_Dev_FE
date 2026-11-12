import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Modal } from 'react-bootstrap'
import ReactApexChart from 'react-apexcharts'
import type { ApexOptions } from 'apexcharts'
import type { IconType } from 'react-icons'
import {
  FaTimes, FaExclamationTriangle, FaCalendarAlt, FaClock, FaTrophy, FaFire, FaBookOpen,
  FaRobot, FaLanguage, FaClipboardCheck, FaCode, FaArrowUp, FaArrowDown, FaMinus, FaCheckCircle, FaBolt,
} from 'react-icons/fa'
import { Tabs } from '@/components/admin-ui'
import {
  ENGLISH_KEYS, STATUS_LABELS, activeDays, activitiesCompleted, formatDuration, monthRanges, profileImageUrl,
  rankText, reportMetrics, sName, statusOf, type Report, type Student,
} from './studentReportData'

/* Full progress view for one student: an all-time report (since joining) for the totals and
   details, plus one report per calendar month for the trends. One row per section. */

type MonthPoint = { label: string; report: Report | null; days: number }
type Range = 'joined' | '12' | '6' | '3'

const MAX_MONTHS = 24
const COLORS = { engagement: '#ff7a00', course: '#38bdf8', interview: '#a78bfa', english: '#34d399', assessment: '#f4b43f', code: '#f472b6' } as const
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
const comboOptions = (labels: string[], color: string, countLabel: string, scoreLabel = 'Score'): ApexOptions => ({
  chart: { toolbar: { show: false }, zoom: { enabled: false }, background: 'transparent', foreColor: '#9da2a8', fontFamily: 'inherit', animations: { speed: 300 } },
  theme: { mode: 'dark' },
  colors: [`${color}66`, color],
  stroke: { width: [0, 3], curve: 'smooth' },
  plotOptions: { bar: { columnWidth: '42%', borderRadius: 4 } },
  markers: { size: [0, 4] as any, strokeWidth: 0 },
  grid: { borderColor: '#202326', strokeDashArray: 3, padding: { left: 4, right: 8 } },
  xaxis: { categories: labels, axisBorder: { color: '#25282b' }, axisTicks: { color: '#25282b' }, labels: { style: { fontSize: '11px' }, hideOverlappingLabels: true }, tooltip: { enabled: false }, crosshairs: { stroke: { color: '#34383d' } } },
  yaxis: [
    { title: { text: countLabel, style: { color: '#6b7280', fontWeight: 500 } }, min: 0, forceNiceScale: true, labels: { formatter: (v: number) => `${Math.round(v)}` } },
    { opposite: true, title: { text: scoreLabel, style: { color: '#6b7280', fontWeight: 500 } }, min: 0, max: 100, tickAmount: 4, labels: { formatter: (v: number) => `${Math.round(v)}%` } },
  ],
  dataLabels: { enabled: false },
  legend: { position: 'top', horizontalAlign: 'left', fontSize: '12px', markers: { size: 5 } as any, itemMargin: { horizontal: 8 } },
  tooltip: { theme: 'dark', shared: true, intersect: false },
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

const SectionRow = ({ icon: Icon, color, title, score, scoreNote, delta, stats, children }: {
  icon: IconType; color: string; title: string; score: number | null; scoreNote: string; delta: number | null
  stats: { label: string; value: ReactNode }[]; children: ReactNode
}) => (
  <div className="spx-row" style={{ ['--acc' as any]: color }}>
    <div className="spx-row-side">
      <div className="spx-row-title"><span className="spx-row-icon"><Icon /></span><h4>{title}</h4></div>
      <div className="spx-row-score"><b>{pct(score)}</b><Delta value={delta} /></div>
      <Bar value={score || 0} color={color} />
      <small className="spx-row-note">{scoreNote}</small>
      <dl className="spx-stats">
        {stats.map((s) => <div key={s.label}><dt>{s.label}</dt><dd>{s.value}</dd></div>)}
      </dl>
    </div>
    <div className="spx-row-main">{children}</div>
  </div>
)

const StudentProgressModal = ({ student, show, onHide, fetchReport }: {
  student: Student | null
  show: boolean
  onHide: () => void
  fetchReport: (studentId: string, from?: string, to?: string) => Promise<Report | null>
}) => {
  const [range, setRange] = useState<Range>('joined')
  const [overall, setOverall] = useState<Report | null>(null)
  const [overallReady, setOverallReady] = useState(false)
  const [points, setPoints] = useState<MonthPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 1) All-time report: the till-date totals, and the joining date (its period starts at onboarding)
  useEffect(() => {
    if (!show || !student) return
    let cancelled = false
    setOverall(null)
    setOverallReady(false)
    setPoints([])
    setRange('joined')
    setError('')
    setLoading(true)
    fetchReport(student._id)
      .then((all) => { if (!cancelled) setOverall(all) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setOverallReady(true) })
    return () => { cancelled = true }
  }, [show, student?._id]) // eslint-disable-line

  const joinedAt = useMemo(() => {
    if (!overall?.periodDays) return null
    const d = new Date()
    d.setDate(d.getDate() - (overall.periodDays - 1))
    return d
  }, [overall?.periodDays])

  // 2) One report per calendar month in the chosen range (since joining by default)
  useEffect(() => {
    if (!show || !student || !overallReady) return
    let cancelled = false
    setLoading(true)
    const count = range === 'joined'
      ? (joinedAt ? Math.min(MAX_MONTHS, Math.max(1, monthsBetween(joinedAt, new Date()))) : 6)
      : Number(range)
    Promise.all(monthRanges(iso(new Date()), count).map(async (r) => {
      try {
        const rep = await fetchReport(student._id, r.from, r.to)
        return { label: shortMonth(r.label), report: rep, days: rep?.periodDays ?? daysBetween(r.from, r.to) }
      } catch {
        return { label: shortMonth(r.label), report: null, days: daysBetween(r.from, r.to) }
      }
    }))
      .then((result) => {
        if (cancelled) return
        setPoints(result)
        setError(!overall && result.every((p) => !p.report) ? 'Could not load reports for this student.' : '')
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
  const combo = (key: SectionKey, countName: string, counts: (number | null)[], scoreName = 'Score') => (
    <ReactApexChart
      type="line"
      height={230}
      options={comboOptions(labels, COLORS[key], countName, scoreName)}
      series={[{ name: countName, type: 'column', data: counts }, { name: scoreName, type: 'line', data: scoreSeries(key) }] as any}
    />
  )

  const r = overall
  const d = r?.detail || null
  const metrics = r ? reportMetrics(r, r.periodDays || 30) : []
  const m = (key: SectionKey) => metrics.find((x) => x.key === key)
  const st = r ? statusOf(r) : null
  const rank = r ? rankText(r) : null
  const avatar = r?.student.profileImage ? profileImageUrl(r.student.profileImage) : ''
  const name = r?.student.name || (student ? sName(student) : 'Student')
  const totalDays = r?.periodDays || 0
  const englishCount = (rep: Report) => ENGLISH_KEYS.reduce((s, k) => s + (rep.sections[k]?.attemptsUsed || 0), 0)
  const codeTotal = r ? r.codeStats.available.easy + r.codeStats.available.medium + r.codeStats.available.hard : 0

  const overviewOptions: ApexOptions = {
    chart: { toolbar: { show: false }, zoom: { enabled: false }, background: 'transparent', foreColor: '#9da2a8', fontFamily: 'inherit' },
    theme: { mode: 'dark' },
    colors: ['#ffffff', COLORS.engagement, COLORS.interview, COLORS.english, COLORS.assessment, COLORS.code],
    stroke: { curve: 'smooth', width: [3.5, 2, 2, 2, 2, 2] },
    markers: { size: 3, strokeWidth: 0 },
    grid: { borderColor: '#202326', strokeDashArray: 3 },
    xaxis: { categories: labels, axisBorder: { color: '#25282b' }, axisTicks: { color: '#25282b' }, labels: { hideOverlappingLabels: true }, tooltip: { enabled: false } },
    yaxis: { min: 0, max: 100, tickAmount: 4, labels: { formatter: (v: number) => `${Math.round(v)}%` } },
    legend: { position: 'top', horizontalAlign: 'left', fontSize: '12px', markers: { size: 5 } as any, itemMargin: { horizontal: 8 } },
    dataLabels: { enabled: false },
    tooltip: { theme: 'dark', shared: true, intersect: false, y: { formatter: (v: number) => (v == null ? '—' : `${v}%`) } },
  }
  const overviewSeries = [
    { name: 'Overall', data: points.map((p) => (p.report ? Math.round(p.report.overallScore) : null)) },
    { name: 'Daily Engagement', data: scoreSeries('engagement') },
    { name: 'AI Interview', data: scoreSeries('interview') },
    { name: 'English Practice', data: scoreSeries('english') },
    { name: 'Assessments', data: scoreSeries('assessment') },
    { name: 'Code Challenge', data: scoreSeries('code') },
  ]

  return (
    <Modal show={show} onHide={onHide} fullscreen contentClassName="aui-modal spx-modal" backdropClassName="aui-backdrop">
      <div className="aui-modal-head spx-head">
        <span className="spx-avatar">{avatar ? <img src={avatar} alt="" onError={(e) => { e.currentTarget.style.display = 'none' }} /> : null}<b>{name.split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase()}</b></span>
        <div>
          <h3>{name} <span className="spx-head-sub">· Progress report</span></h3>
          <p>{[r?.student.email || student?.email, r?.student.rollNumber || student?.rollNumber, r?.student.branch || student?.branch].filter(Boolean).join(' · ')}</p>
          {r?.student.college && <p className="spx-college" title={r.student.college}>{r.student.college.split(',')[0].trim()}</p>}
        </div>
        <div className="aui-page spx-range">
          <span className="spx-range-label">Charts:</span>
          <Tabs<Range>
            small
            value={range}
            onChange={setRange}
            label="Chart range"
            items={[{ value: 'joined', label: 'Since joining' }, { value: '12', label: '12 months' }, { value: '6', label: '6 months' }, { value: '3', label: '3 months' }]}
          />
          {loading && points.length > 0 && <span className="sr-button-loader" />}
        </div>
        <button type="button" className="aui-icon-btn" onClick={onHide} aria-label="Close"><FaTimes size={12} /></button>
      </div>

      <div className="aui-modal-body spx-body">
        {loading && !points.length ? (
          <div className="spx-loading"><span className="sr-loader" /> Building {name.split(' ')[0]}’s progress report…</div>
        ) : error ? (
          <div className="aui-alert"><FaExclamationTriangle /> <span>{error}</span></div>
        ) : r && (
          <div className="spx-wrap">
            {/* ── Till-date summary ── */}
            <div className="spx-hero">
              <div className="spx-score" style={{ ['--tone' as any]: STATUS_TONE[st || 'not-started'] }}>
                <div className="spx-ring" style={{ background: `conic-gradient(var(--tone) ${Math.round(r.overallScore) * 3.6}deg, #1d2023 0deg)` }}>
                  <div><b>{Math.round(r.overallScore)}%</b><small>overall</small></div>
                </div>
                <div className="spx-score-text">
                  <span className="spx-status" style={{ color: STATUS_TONE[st || 'not-started'] }}>● {st ? STATUS_LABELS[st] : '—'}</span>
                  <strong>Progress till date</strong>
                  <small>{joinedAt ? <>Joined {fmtDate(joinedAt)} · {totalDays} day{totalDays === 1 ? '' : 's'} on Eklav</> : 'All-time report'}</small>
                </div>
              </div>
              <div className="spx-kpis">
                <div><span><FaTrophy /></span><b>{rank ? rank.label : '—'}</b><small>{rank ? `Rank ${rank.total}` : 'Rank'}</small></div>
                <div><span><FaCalendarAlt /></span><b>{activeDays(r)}<em>/{totalDays || '—'}</em></b><small>Active days</small></div>
                <div><span><FaClock /></span><b>{formatDuration(r.timeSpent.totalSecs)}</b><small>Time spent</small></div>
                <div><span><FaBolt /></span><b>{d?.longestStreak ?? '—'}</b><small>Best streak (days)</small></div>
                <div><span><FaCheckCircle /></span><b>{activitiesCompleted(r)}</b><small>Activities done</small></div>
                <div><span><FaFire /></span><b className="spx-kpi-date" title={fmtDate(d?.lastActiveDate)}>{d?.lastActiveDate ? new Date(`${d.lastActiveDate}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}</b><small>Last active</small></div>
              </div>
            </div>

            {/* ── All sections over time ── */}
            {points.length > 0 && (
              <div className="spx-card">
                <div className="spx-card-head"><h4>All sections, month by month</h4><small>Overall score in white. Course progress isn't dated, so it's shown as its current value below.</small></div>
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
                <ul className="spx-courses" data-top="1">
                  {[...r.courses].sort((a, b) => b.progress - a.progress).map((c) => (
                    <li key={c.courseId}>
                      <span className="spx-course-name" title={c.title}>{c.title}</span>
                      <Bar value={c.progress} color={c.progress >= 100 ? '#45dd75' : COLORS.course} />
                      <b>{Math.round(c.progress)}%</b>
                      <span className={`spx-tag ${c.progress >= 100 ? 'is-done' : c.progress > 0 ? 'is-on' : ''}`}>{c.progress >= 100 ? 'Completed' : c.progress > 0 ? 'In progress' : 'Not started'}</span>
                    </li>
                  ))}
                </ul>
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

            <p className="spx-note">
              Till-date figures cover the whole period since joining. Charts use one report per calendar month{range === 'joined' && points.length >= MAX_MONTHS ? ` (latest ${MAX_MONTHS} months)` : ''}; the current month runs to today.
              {!d && ' Restart the backend to see topic, recent-attempt and daily-activity details.'}
            </p>
          </div>
        )}
      </div>

      <style>{`
        .spx-modal { border: 0 !important; border-radius: 0 !important; background: #08090a !important; }
        .spx-head { position: sticky; top: 0; z-index: 3; flex-wrap: wrap; padding: 0.85rem 1.5rem !important; }
        .spx-head h3 { font-size: 1.1rem !important; }
        .spx-head > div:nth-child(2) { flex: 1 1 320px; min-width: 0; }
        .spx-head > .aui-icon-btn { margin-left: 4px; }
        .spx-head-sub { color: #6b7280; font-weight: 500; }
        .spx-head .spx-college { margin-top: 1px !important; color: #ffb15e !important; font-size: 0.74rem !important; font-weight: 600; }
        .spx-avatar { position: relative; display: grid; place-items: center; width: 46px; height: 46px; flex: 0 0 46px; overflow: hidden; border: 1px solid rgba(255,122,0,0.35); border-radius: 50%; background: rgba(255,122,0,0.12); color: #ffb15e; font-size: 0.85rem; }
        .spx-avatar img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
        .spx-range { display: flex; align-items: center; gap: 8px; flex: 0 0 auto; margin-left: auto; }
        .spx-range-label { color: #6b7280; font-size: 0.74rem; }
        .spx-body { padding: 1.25rem 1.5rem 2rem !important; background: #08090a; }
        .spx-wrap { display: flex; flex-direction: column; gap: 1rem; max-width: 1500px; margin: 0 auto; }
        .spx-loading { display: flex; align-items: center; justify-content: center; gap: 10px; min-height: 60vh; color: #9da2a8; font-size: 0.9rem; }

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
        .spx-main-grid { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(300px, 1fr); gap: 1.5rem; align-items: center; min-height: 100%; }
        .spx-main-grid > div:first-child { padding-top: 0.75rem; }
        .spx-sub h5 { margin: 0.25rem 0 0.6rem; color: #9da2a8; font-size: 0.68rem; font-weight: 750; letter-spacing: 0.06em; text-transform: uppercase; }

        .spx-bar { display: block; height: 6px; overflow: hidden; border-radius: 99px; background: #1d2023; }
        .spx-bar > span { display: block; height: 100%; border-radius: 99px; }
        .spx-delta { display: inline-flex; align-items: center; gap: 4px; padding: 3px 9px; border-radius: 99px; background: #17191c; color: #858a90; font-size: 0.7rem; font-weight: 700; white-space: nowrap; }
        .spx-delta.is-up { background: rgba(49,216,102,0.1); color: #45dd75; }
        .spx-delta.is-down { background: rgba(251,95,103,0.1); color: #fb737a; }

        .spx-row-main:has(> .spx-courses) { justify-content: flex-start; padding-top: 1.25rem; }
        .spx-courses { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 2rem; max-height: 290px; margin: 0.25rem 0 0.5rem; padding: 0 4px 0 0; overflow-y: auto; list-style: none; color-scheme: dark; }
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

        .spx-modal .apexcharts-tooltip { border: 1px solid #34383d !important; background: #17191c !important; }
        .spx-modal .apexcharts-tooltip-title { border-bottom-color: #25282b !important; background: #111315 !important; }

        @media (max-width: 1399.98px) { .spx-kpis { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
        @media (max-width: 1199.98px) {
          .spx-hero, .spx-main-grid { grid-template-columns: 1fr; }
          .spx-courses { grid-template-columns: 1fr; }
        }
        @media (max-width: 991.98px) {
          .spx-row { grid-template-columns: 1fr; }
          .spx-row-side { border-right: 0; border-bottom: 1px solid #1d2023; }
        }
      `}</style>
    </Modal>
  )
}

export default StudentProgressModal
