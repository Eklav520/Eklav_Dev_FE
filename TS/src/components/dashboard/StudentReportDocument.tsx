import {
  FaFileAlt, FaCalendarAlt, FaUniversity, FaUsers, FaCheckCircle, FaExclamationCircle, FaTrophy,
  FaLayerGroup, FaClock, FaChartBar, FaArrowUp, FaArrowDown, FaBook, FaRobot, FaLanguage,
  FaClipboardList, FaCode, FaMicrophone, FaHeadphones, FaPen, FaBullhorn, FaFlask, FaBriefcase,
  FaLightbulb, FaBullseye, FaGlobe, FaSpellCheck, FaMedal,
} from 'react-icons/fa'
import type { IconType } from 'react-icons'
import logo from '@/assets/images/logo_black.png'
import {
  type Report, type ReportMetric, type ReportStatus, type TrendPoint,
  statusOf, rankText, profileImageUrl, activitiesCompleted, ENGLISH_KEYS, formatDuration, activeDays,
} from './studentReportData'

/* Light, print-ready (A4) performance report. Styles are embedded so they travel
   with the markup when it is copied into the print window. */

const METRIC_ICONS: Record<string, IconType> = {
  engagement: FaCalendarAlt, course: FaBook, interview: FaRobot,
  english: FaLanguage, assessment: FaClipboardList, code: FaCode,
}
const RADAR_LABELS: Record<string, [string, string?]> = {
  engagement: ['Daily', 'Engagement'], course: ['Course', 'Progress'], interview: ['AI Interview'],
  english: ['English', 'Practice'], assessment: ['Assessments'], code: ['Code', 'Challenge'],
}
const STATUS_TEXT: Record<ReportStatus, { title: string; sub: string }> = {
  'on-track': { title: 'On Track', sub: 'Good Progress' },
  'needs-attention': { title: 'Needs Attention', sub: 'Keep Practising' },
  'at-risk': { title: 'At Risk', sub: 'Needs Support' },
  'not-started': { title: 'Not Started', sub: 'No activity yet' },
}
const RECOMMENDATIONS: Record<string, string> = {
  engagement: 'Log in daily and complete at least one activity',
  course: 'Complete the pending course lessons',
  interview: 'Take 2–3 mock interviews this week',
  english: 'Practise speaking and writing modules regularly',
  assessment: 'Attempt more practice assessments',
  code: 'Practice more coding problems',
}
const ENGLISH_ROWS: { key: (typeof ENGLISH_KEYS)[number]; label: string; icon: IconType }[] = [
  { key: 'speaking', label: 'Speaking', icon: FaMicrophone },
  { key: 'listening', label: 'Listening', icon: FaHeadphones },
  { key: 'reading', label: 'Reading', icon: FaBook },
  { key: 'writing', label: 'Writing', icon: FaPen },
  { key: 'jam', label: 'JAM', icon: FaBullhorn },
]

const clamp = (v: number) => Math.min(100, Math.max(0, v))
const barColor = (v: number) => v >= 80 ? 'linear-gradient(90deg,#16a34a,#22c55e)' : v >= 70 ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : 'linear-gradient(90deg,#ea580c,#fb923c)'
const moduleStatus = (score: number) =>
  score >= 75 ? { label: 'On Track', tone: 'good' } : score >= 50 ? { label: 'Practice More', tone: 'warn' } : { label: 'Improvement Needed', tone: 'bad' }
const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const SectionTitle = ({ children }: { children: string }) => (
  <h2 className="srd-section-title"><span>{children}</span></h2>
)

/* ── Charts ─────────────────────────────────────────────── */
const Radar = ({ metrics }: { metrics: ReportMetric[] }) => {
  const cx = 150, cy = 128, maxR = 70
  const point = (index: number, radius: number) => {
    const angle = (Math.PI * 2 * index) / metrics.length - Math.PI / 2
    return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius }
  }
  const polygon = (radiusOf: (index: number) => number) =>
    metrics.map((_, index) => { const { x, y } = point(index, radiusOf(index)); return `${x},${y}` }).join(' ')

  return (
    <svg className="srd-radar" viewBox="0 0 300 258" role="img" aria-label="Performance radar">
      {[1, 2, 3, 4].map(ring => (
        <polygon key={ring} points={polygon(() => maxR * ring / 4)} fill="none" stroke="#e6e1db" strokeWidth="1" />
      ))}
      {metrics.map((metric, index) => {
        const { x, y } = point(index, maxR)
        return <line key={metric.key} x1={cx} y1={cy} x2={x} y2={y} stroke="#e6e1db" strokeWidth="1" />
      })}
      <g className="srd-anim-grow" style={{ transformOrigin: `${cx}px ${cy}px` }}>
        <polygon points={polygon(index => maxR * clamp(metrics[index].score) / 100)} fill="rgba(249,115,22,0.35)" stroke="#f97316" strokeWidth="2.2" strokeLinejoin="round" />
        {metrics.map((metric, index) => {
          const { x, y } = point(index, maxR * clamp(metric.score) / 100)
          return <circle key={metric.key} cx={x} cy={y} r="4" fill="#fff" stroke="#f97316" strokeWidth="2" />
        })}
      </g>
      {metrics.map((metric, index) => {
        const { x, y } = point(index, maxR + 18)
        const anchor = Math.abs(x - cx) < 4 ? 'middle' : x > cx ? 'start' : 'end'
        const lines = [...(RADAR_LABELS[metric.key] ?? [metric.label]).filter(Boolean), `(${metric.score}%)`] as string[]
        const startY = y < cy - 4 ? y - (lines.length - 1) * 10 - 2 : y > cy + 4 ? y + 6 : y - (lines.length - 1) * 5 + 3
        return (
          <text key={metric.key} y={startY} textAnchor={anchor} fontSize="9.5" fill="#2b2f3a">
            {lines.map((line, i) => <tspan key={i} x={x} dy={i === 0 ? 0 : 10}>{line}</tspan>)}
          </text>
        )
      })}
    </svg>
  )
}

const TrendChart = ({ trend }: { trend: TrendPoint[] }) => {
  const left = 40, right = 290, top = 18, bottom = 150
  const known = trend.filter((point): point is { label: string; score: number } => point.score != null)
  if (known.length === 0) return <p className="srd-empty">Trend data is not available for this period.</p>

  const x = (index: number) => trend.length === 1 ? (left + right) / 2 : left + 30 + index * ((right - left - 60) / (trend.length - 1))
  const y = (score: number) => bottom - (clamp(score) / 100) * (bottom - top)
  const points = trend.map((point, index) => point.score == null ? null : { x: x(index), y: y(point.score), score: point.score })
  const drawn = points.filter((p): p is { x: number; y: number; score: number } => !!p)
  const line = drawn.map(p => `${p.x},${p.y}`).join(' ')
  const area = `${drawn[0].x},${bottom} ${line} ${drawn[drawn.length - 1].x},${bottom}`
  const lastIndex = points.length - 1 - [...points].reverse().findIndex(p => !!p)

  return (
    <svg className="srd-trend" viewBox="0 0 300 185" role="img" aria-label="Overall performance trend">
      <defs>
        <linearGradient id="srdTrendFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#fb923c" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#fb923c" stopOpacity="0.04" />
        </linearGradient>
      </defs>
      {[0, 20, 40, 60, 80, 100].map(tick => (
        <g key={tick}>
          <line x1={left} x2={right} y1={y(tick)} y2={y(tick)} stroke="#eceae7" strokeWidth="1" />
          <text x={left - 6} y={y(tick) + 3} textAnchor="end" fontSize="8.5" fill="#6b7280">{tick}%</text>
        </g>
      ))}
      <polygon points={area} fill="url(#srdTrendFill)" />
      <polyline points={line} fill="none" stroke="#f97316" strokeWidth="2.4" strokeLinejoin="round" />
      {points.map((p, index) => p && (
        <g key={index}>
          <circle cx={p.x} cy={p.y} r="4.5" fill="#fff" stroke="#f97316" strokeWidth="2.2" />
          {index === lastIndex ? (
            <g>
              <rect x={p.x - 17} y={p.y - 25} width="34" height="16" rx="3" fill="#f97316" />
              <text x={p.x} y={p.y - 13.5} textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff">{p.score}%</text>
            </g>
          ) : (
            <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#1f2430">{p.score}%</text>
          )}
        </g>
      ))}
      {trend.map((point, index) => (
        <text key={point.label} x={x(index)} y={bottom + 15} textAnchor="middle" fontSize="9" fill="#374151">{point.label}</text>
      ))}
      <line x1="105" x2="125" y1="175" y2="175" stroke="#f97316" strokeWidth="2.2" />
      <circle cx="115" cy="175" r="3" fill="#f97316" />
      <text x="131" y="178" fontSize="9" fill="#374151">Overall Performance</text>
    </svg>
  )
}

/* ── Document ───────────────────────────────────────────── */
const StudentReportDocument = ({ report, metrics, periodDays, trend }: {
  report: Report
  metrics: ReportMetric[]
  periodDays: number
  trend: TrendPoint[]
}) => {
  const st = report.student
  const sec = report.sections
  const status = statusOf(report)
  const rank = rankText(report)
  const logoUrl = new URL(logo, window.location.href).href
  const initials = (st.name || st.email).split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase()
  const generatedOn = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
  const metric = (key: string) => metrics.find(m => m.key === key)?.score ?? 0

  const knownTrend = trend.filter(point => point.score != null) as { label: string; score: number }[]
  const delta = knownTrend.length >= 2 ? knownTrend[knownTrend.length - 1].score - knownTrend[knownTrend.length - 2].score : null
  const modulesEvaluated = metrics.filter(m => m.score > 0).length

  const codeAvailable = report.codeStats.available.easy + report.codeStats.available.medium + report.codeStats.available.hard
  const codeRate = codeAvailable > 0 ? Math.round((report.codeStats.solved / codeAvailable) * 100) : 0
  const interviewSessions = sec.selfInterview.sessions + sec.resumeInterview.sessions
  const bestEnglish = ENGLISH_ROWS
    .map(row => ({ ...row, score: Math.round(sec[row.key]?.avgScore || 0) }))
    .sort((a, b) => b.score - a.score)[0]
  const coursesDone = report.courses.filter(course => course.progress >= 100).length
  const freelanceRate = report.activity.freelanceAssigned > 0
    ? Math.round((report.activity.freelanceCompleted / report.activity.freelanceAssigned) * 100) : 0

  const highlights: Record<string, string> = {
    engagement: `Active for ${activeDays(report)} of ${periodDays} days (${metric('engagement')}%)`,
    course: `${coursesDone} of ${report.courses.length} courses completed (${metric('course')}%)`,
    interview: `${interviewSessions} interviews attempted, Avg. Score: ${metric('interview')}%`,
    english: `LSRW Avg. Score: ${metric('english')}%${bestEnglish?.score ? ` (${bestEnglish.label}: ${bestEnglish.score}%)` : ''}`,
    assessment: `${sec.assessment.sessions} tests taken, ${sec.assessment.passed} passed, Avg. Score: ${metric('assessment')}%`,
    code: `${report.codeStats.solved} of ${codeAvailable} problems solved (${codeRate}%)`,
  }

  const ranked = [...metrics].sort((a, b) => b.score - a.score)
  const strengths = ranked.filter(m => m.score >= 75).slice(0, 3)
  const improve = [...ranked].reverse().filter(m => m.score < 75).slice(0, 3)
  const recommendations = improve.length
    ? improve.slice(0, 3).map(m => RECOMMENDATIONS[m.key] ?? `Focus on ${m.label.toLowerCase()}`)
    : ['Keep up the consistent effort across all modules']

  const statCards = [
    { icon: FaLayerGroup, value: activitiesCompleted(report), label: 'Activities Completed', tone: 'purple' },
    { icon: FaClock, value: formatDuration(report.timeSpent.totalSecs), label: 'Total Learning Time', tone: 'blue' },
    { icon: FaCalendarAlt, value: `${activeDays(report)} / ${periodDays}`, label: `Active Days (${metric('engagement')}%)`, tone: 'green' },
    { icon: FaChartBar, value: modulesEvaluated, label: 'Modules Evaluated', tone: 'pink' },
  ]

  return (
    <div className="srd">
      <style>{REPORT_CSS}</style>

      <header className="srd-top">
        <div className="srd-brand">
          <img src={logoUrl} alt="EKLAV" />
          <span>AI-Powered Learning &amp; Placement Platform</span>
        </div>
        <div className="srd-title">
          <FaFileAlt className="srd-title-icon" />
          <div>
            <h1>Student Performance Report</h1>
            <p><FaCalendarAlt /> Generated on: {generatedOn}</p>
          </div>
        </div>
      </header>

      <section className="srd-card srd-profile">
        {st.profileImage
          ? <img className="srd-avatar" src={profileImageUrl(st.profileImage)} alt="" />
          : <span className="srd-avatar srd-avatar-initials">{initials}</span>}
        <div className="srd-profile-main">
          <h3>{st.name}</h3>
          <p><b>Roll No:</b> {st.rollNumber || '—'}<i>|</i><b>Branch:</b> {st.branch || '—'}</p>
          <p><b>Email:</b> {st.email}</p>
        </div>
        <div className="srd-profile-meta">
          <p><FaCalendarAlt /><b>Report Period:</b> {report.period.from || report.period.to ? `${fmtDate(report.period.from)} – ${fmtDate(report.period.to)}` : `All time (since onboarding) – ${fmtDate(new Date().toISOString())}`}</p>
          <p><FaUniversity /><b>Institute:</b> {st.college || '—'}</p>
          <p><FaUsers /><b>Batch:</b> {st.batch || st.joiningYear || '—'}<i>|</i><b>Department:</b> {st.department || st.branch || '—'}</p>
        </div>
        <div className={`srd-status srd-status-${status}`}>
          {status === 'on-track' ? <FaCheckCircle /> : <FaExclamationCircle />}
          <div><strong>{STATUS_TEXT[status].title}</strong><span>{STATUS_TEXT[status].sub}</span></div>
        </div>
      </section>

      <section className="srd-kpis">
        <div className="srd-overall">
          <FaTrophy className="srd-overall-icon" />
          <div>
            <strong>{report.overallScore}%</strong>
            <span>Overall Performance</span>
            {rank && <em className="srd-rank"><FaMedal /> Rank {rank.label} {rank.total} in institute</em>}
            {delta != null && (
              <small className={delta >= 0 ? 'is-up' : 'is-down'}>
                {delta >= 0 ? <FaArrowUp /> : <FaArrowDown />} {delta >= 0 ? '+' : ''}{delta}% vs previous month
              </small>
            )}
          </div>
        </div>
        {statCards.map(({ icon: Icon, value, label, tone }) => (
          <div key={label} className={`srd-stat srd-tone-${tone}`}>
            <Icon className="srd-stat-icon" />
            <div><strong>{value}</strong><span>{label}</span></div>
          </div>
        ))}
      </section>

      <div className="srd-row srd-row-even">
        <section className="srd-panel">
          <SectionTitle>Section-wise Performance</SectionTitle>
          <div className="srd-bars">
            {metrics.map(m => {
              const Icon = METRIC_ICONS[m.key] ?? FaChartBar
              return (
                <div className="srd-bar-row" key={m.key}>
                  <Icon className="srd-bar-icon" />
                  <span>{m.label}</span>
                  <div className="srd-bar"><i style={{ width: `${clamp(m.score)}%`, background: barColor(m.score) }} /></div>
                  <strong>{m.score}%</strong>
                </div>
              )
            })}
          </div>
        </section>
        <section className="srd-panel">
          <SectionTitle>Performance Radar</SectionTitle>
          <Radar metrics={metrics} />
        </section>
      </div>

      <div className="srd-row srd-row-wide">
        <section className="srd-panel">
          <SectionTitle>Module-wise Insights</SectionTitle>
          <table className="srd-table">
            <thead><tr><th>Module</th><th>Key Highlights</th><th>Status</th></tr></thead>
            <tbody>
              {metrics.map(m => {
                const Icon = METRIC_ICONS[m.key] ?? FaChartBar
                const ms = moduleStatus(m.score)
                return (
                  <tr key={m.key}>
                    <td><Icon className="srd-bar-icon" /> {m.label}</td>
                    <td>{highlights[m.key]}</td>
                    <td className={`srd-tone-text-${ms.tone}`}>
                      {ms.tone === 'good' ? <FaCheckCircle /> : <FaExclamationCircle />} {ms.label}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
        <section className="srd-panel">
          <SectionTitle>Progress Trend (Last 3 Months)</SectionTitle>
          <TrendChart trend={trend} />
        </section>
      </div>

      <section className="srd-panel">
        <SectionTitle>Detailed Module Performance</SectionTitle>
        <div className="srd-modules">
          <div className="srd-module srd-tone-green">
            <h4><span className="srd-module-icon"><FaLanguage /></span> English Practice</h4>
            <div className="srd-module-split">
              <div className="srd-module-hero">
                <strong>{metric('english')}%</strong>
                <span>LSRW Average</span>
              </div>
              <ul className="srd-module-list">
                {ENGLISH_ROWS.map(({ key, label, icon: Icon }) => (
                  <li key={key}><Icon /> {label}<b>{Math.round(sec[key]?.avgScore || 0)}%</b></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="srd-module srd-tone-purple">
            <h4><span className="srd-module-icon"><FaSpellCheck /></span> Vocabulary Practice</h4>
            <div className="srd-module-stats">
              <div><strong>{sec.vocabulary?.currentLevel || '—'}</strong><span>Current Level</span></div>
              <div><strong>{sec.vocabulary?.totalWordsLearned ?? 0}</strong><span>Words Learned</span></div>
              <div><strong>{sec.vocabulary?.wordsMastered ?? 0}</strong><span>Words Mastered</span></div>
            </div>
          </div>
          <div className="srd-module srd-tone-orange">
            <h4><span className="srd-module-icon"><FaRobot /></span> AI Based Interview</h4>
            <div className="srd-module-stats">
              <div><strong>{interviewSessions}</strong><span>Attempted</span></div>
              <div><strong>{metric('interview')}%</strong><span>Avg. Score</span></div>
              <div><strong>{sec.selfInterview.topicsAttempted?.length ?? 0}</strong><span>Topics Evaluated</span></div>
            </div>
          </div>
          <div className="srd-module srd-tone-blue">
            <h4><span className="srd-module-icon"><FaCode /></span> Code Challenge</h4>
            <div className="srd-module-stats srd-module-stats-2">
              <div><strong>{report.codeStats.solved} / {codeAvailable}</strong><span>Problems Solved</span></div>
              <div><strong>{codeRate}%</strong><span>Completion</span></div>
            </div>
            <div className="srd-difficulty">
              <span><i className="is-easy" /> Easy <b>{report.codeStats.available.easy}</b></span>
              <span><i className="is-medium" /> Medium <b>{report.codeStats.available.medium}</b></span>
              <span><i className="is-hard" /> Hard <b>{report.codeStats.available.hard}</b></span>
            </div>
            <small className="srd-note">Problems available by difficulty</small>
          </div>
          <div className="srd-module srd-tone-green">
            <h4><span className="srd-module-icon"><FaFlask /></span> College Labs</h4>
            <div className="srd-module-stats srd-module-stats-2">
              <div><strong>{report.activity.labsAvailable}</strong><span>Total Labs</span></div>
              <div><strong>{report.activity.labsCompleted}</strong><span>Labs Completed</span></div>
            </div>
          </div>
          <div className="srd-module srd-tone-pink">
            <h4><span className="srd-module-icon"><FaBriefcase /></span> Freelance Tasks</h4>
            <div className="srd-module-stats">
              <div><strong>{report.activity.freelanceAssigned}</strong><span>Assigned</span></div>
              <div><strong>{report.activity.freelanceCompleted}</strong><span>Completed</span></div>
              <div><strong>{freelanceRate}%</strong><span>Completion Rate</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="srd-panel">
        <SectionTitle>EKLAV Insights &amp; Recommendations</SectionTitle>
        <div className="srd-insights">
          <div className="srd-insight srd-tone-green">
            <h4><FaCheckCircle /> Strengths</h4>
            <ul>
              {strengths.length
                ? strengths.map(m => <li key={m.key}>Strong {m.label.toLowerCase()} ({m.score}%)</li>)
                : <li>No module has reached 75% yet in this period</li>}
            </ul>
          </div>
          <div className="srd-insight srd-tone-orange">
            <h4><FaLightbulb /> Areas to Improve</h4>
            <ul>
              {improve.length
                ? improve.map(m => <li key={m.key}>{m.label} ({m.score}%)</li>)
                : <li>All modules are on track</li>}
            </ul>
          </div>
          <div className="srd-insight srd-tone-blue">
            <h4><FaBullseye /> Recommendations</h4>
            <ul>{recommendations.map(text => <li key={text}>{text}</li>)}</ul>
          </div>
        </div>
      </section>

      <footer className="srd-footer">
        <div className="srd-brand">
          <img src={logoUrl} alt="EKLAV" />
          <span>AI-Powered Learning &amp; Placement Platform</span>
        </div>
        <p><FaGlobe /> www.eklav.in</p>
        <p className="srd-footer-id">Report ID: {st.reportId || '—'}</p>
      </footer>
    </div>
  )
}

const REPORT_CSS = `
.srd {
  --srd-orange: #f97316;
  --srd-purple: #7c3aed;
  --srd-text: #1f2430;
  --srd-muted: #5b6270;
  --srd-line: #ece7e1;
  position: relative;
  width: 100%;
  max-width: 820px;
  margin: 0 auto;
  padding: 0 0 6px;
  overflow: hidden;
  background: #fff;
  color: var(--srd-text);
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  font-size: 11px;
  line-height: 1.4;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.srd *, .srd *::before, .srd *::after { box-sizing: border-box; }
.srd h1, .srd h2, .srd h3, .srd h4, .srd p, .srd ul { margin: 0; padding: 0; }
.srd ul { list-style: none; }
.srd section { padding: 0; }

/* Top banner */
.srd-top { display: flex; align-items: stretch; justify-content: space-between; background: #fff; }
.srd-brand { display: flex; flex-direction: column; justify-content: center; gap: 2px; padding: 14px 20px; }
.srd-brand img { height: 34px; width: auto; align-self: flex-start; }
.srd-brand span { color: var(--srd-text); font-size: 10px; font-weight: 600; }
.srd-title {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 22px 14px 70px;
  background: linear-gradient(100deg, #ff9a3c 0%, #f97316 40%, #c2410c 72%, #6d28d9 100%);
  clip-path: polygon(48px 0, 100% 0, 100% 100%, 0 100%);
  color: #fff;
}
.srd-title-icon { font-size: 30px; opacity: 0.95; }
.srd-title h1 { font-size: 21px; font-weight: 800; letter-spacing: 0.2px; color: #fff; }
.srd-title p { display: flex; align-items: center; gap: 6px; margin-top: 3px; font-size: 10px; opacity: 0.95; }

/* Profile */
.srd-card { margin: 12px 16px 0; border: 1px solid #e5e7eb; border-radius: 12px; background: #fff; box-shadow: 0 2px 8px rgba(17,24,39,0.05); }
.srd-profile { display: flex; align-items: center; gap: 14px; padding: 12px 14px; }
.srd-avatar { width: 66px; height: 66px; flex: 0 0 66px; border: 3px solid #fdba74; border-radius: 50%; object-fit: cover; }
.srd-avatar-initials { display: grid; place-items: center; background: #fff7ed; color: var(--srd-orange); font-size: 22px; font-weight: 800; }
.srd-profile-main { flex: 1 1 auto; min-width: 0; padding-right: 12px; border-right: 1px solid #e5e7eb; }
.srd-profile-main h3 { margin-bottom: 4px; font-size: 18px; font-weight: 800; color: #111827; }
.srd-profile-main p, .srd-profile-meta p { color: #374151; font-size: 10.5px; }
.srd-profile-main p + p, .srd-profile-meta p + p { margin-top: 3px; }
.srd-profile b { font-weight: 700; color: #111827; margin-right: 3px; }
.srd-profile i { margin: 0 6px; color: #9ca3af; font-style: normal; }
.srd-profile-meta { flex: 1 1 auto; min-width: 0; }
.srd-profile-meta p { display: flex; align-items: center; flex-wrap: wrap; }
.srd-profile-meta svg { margin-right: 6px; color: var(--srd-orange); }
.srd-status { display: flex; align-items: center; gap: 8px; flex: 0 0 auto; padding: 8px 12px; border-radius: 10px; border: 1.5px solid; }
.srd-status > svg { font-size: 26px; }
.srd-status strong { display: block; font-size: 15px; font-weight: 800; }
.srd-status span { font-size: 10px; color: #374151; }
.srd-status-on-track { border-color: #86efac; background: #f0fdf4; color: #16a34a; }
.srd-status-needs-attention { border-color: #fcd34d; background: #fffbeb; color: #d97706; }
.srd-status-at-risk { border-color: #fca5a5; background: #fef2f2; color: #dc2626; }
.srd-status-not-started { border-color: #cbd5e1; background: #f8fafc; color: #64748b; }

/* KPIs */
.srd-kpis { display: grid; grid-template-columns: 1.55fr repeat(4, 1fr); gap: 8px; margin: 12px 16px 0; }
.srd-overall { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border: 1px solid #fed7aa; border-radius: 12px; background: linear-gradient(135deg, #fff7ed, #ffedd5); }
.srd-overall-icon { font-size: 34px; color: #f59e0b; flex: 0 0 auto; }
.srd-overall strong { display: block; font-size: 28px; font-weight: 900; line-height: 1; color: var(--srd-orange); }
.srd-overall span { display: block; margin-top: 2px; font-size: 12px; font-weight: 700; color: #111827; }
.srd-rank { display: flex; align-items: center; gap: 4px; margin-top: 3px; font-size: 10px; font-style: normal; font-weight: 700; color: #7c3aed; }
.srd-overall small { display: flex; align-items: center; gap: 4px; margin-top: 3px; font-size: 10px; font-weight: 700; }
.srd-overall small.is-up { color: #16a34a; }
.srd-overall small.is-down { color: #dc2626; }
.srd-stat { display: flex; align-items: center; gap: 8px; padding: 10px; border-radius: 12px; }
.srd-stat-icon { font-size: 22px; flex: 0 0 auto; }
.srd-stat strong { display: block; font-size: 16px; font-weight: 800; color: #111827; line-height: 1.1; }
.srd-stat span { display: block; margin-top: 2px; font-size: 9.5px; color: #374151; }

/* Tones */
.srd-tone-purple { background: #f5f3ff; border: 1px solid #ddd6fe; }
.srd-tone-purple .srd-stat-icon, .srd-tone-purple h4 svg { color: #7c3aed; }
.srd-tone-blue { background: #eff6ff; border: 1px solid #bfdbfe; }
.srd-tone-blue .srd-stat-icon, .srd-tone-blue h4 svg { color: #2563eb; }
.srd-tone-green { background: #f0fdf4; border: 1px solid #bbf7d0; }
.srd-tone-green .srd-stat-icon, .srd-tone-green h4 svg { color: #16a34a; }
.srd-tone-pink { background: #fdf4ff; border: 1px solid #f5d0fe; }
.srd-tone-pink .srd-stat-icon, .srd-tone-pink h4 svg { color: #c026d3; }
.srd-tone-orange { background: #fff7ed; border: 1px solid #fed7aa; }
.srd-tone-orange .srd-stat-icon, .srd-tone-orange h4 svg { color: #ea580c; }

/* Panels */
.srd-row { display: grid; gap: 10px; margin: 12px 16px 0; }
.srd-row-even { grid-template-columns: 1fr 1fr; }
.srd-row-wide { grid-template-columns: 1.45fr 1fr; }
.srd-row > .srd-panel { display: flex; flex-direction: column; margin: 0; }
.srd-row > .srd-panel > :last-child { flex: 1; }
.srd-panel { margin: 12px 16px 0; padding: 0 0 10px; overflow: hidden; border: 1px solid #f3e1d0; border-radius: 12px; background: #fff; break-inside: avoid; page-break-inside: avoid; }
/* flex + explicit size so the app's global h2 font-size can't add a tall line box above the banner */
.srd .srd-section-title { display: flex; margin: 0 0 8px; font-size: 14px; line-height: 1.2; }
.srd-section-title span {
  display: inline-block; min-width: 72%; padding: 6px 40px 6px 14px;
  background: linear-gradient(90deg, #f97316 0%, #fb923c 45%, #a855f7 100%);
  clip-path: polygon(0 0, calc(100% - 18px) 0, 100% 100%, 0 100%);
  border-top-left-radius: 11px;
  color: #fff; font-size: 14px; font-weight: 800; letter-spacing: 0.2px;
}

/* Bars */
.srd-bars { display: flex; flex-direction: column; justify-content: space-around; padding: 0 14px; }
.srd-bar-row { display: grid; grid-template-columns: 18px 1fr 1.25fr 38px; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid #f3f0ec; }
.srd-bar-row:last-child { border-bottom: 0; }
.srd-bar-icon { color: var(--srd-orange); font-size: 13px; vertical-align: -2px; }
.srd-bar-row span { font-size: 11px; font-weight: 700; color: #111827; }
.srd-bar { height: 9px; border-radius: 99px; background: #e5e7eb; overflow: hidden; }
.srd-bar i { display: block; height: 100%; border-radius: inherit; animation: srd-bar-fill 1s cubic-bezier(0.22, 1, 0.36, 1) both; }
.srd-bar-row:nth-child(2) .srd-bar i { animation-delay: 0.07s; }
.srd-bar-row:nth-child(3) .srd-bar i { animation-delay: 0.14s; }
.srd-bar-row:nth-child(4) .srd-bar i { animation-delay: 0.21s; }
.srd-bar-row:nth-child(5) .srd-bar i { animation-delay: 0.28s; }
.srd-bar-row:nth-child(6) .srd-bar i { animation-delay: 0.35s; }
.srd-anim-grow { transform-box: view-box; animation: srd-grow 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.15s both; }
@keyframes srd-bar-fill { from { width: 0; } }
@keyframes srd-grow { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .srd-bar i, .srd-anim-grow { animation: none; } }
.srd-bar-row strong { text-align: right; font-size: 12px; font-weight: 800; color: #111827; }
.srd-radar { display: block; width: 100%; max-width: 300px; height: auto; margin: 0 auto; }
.srd-trend { display: block; width: 100%; height: auto; padding: 0 8px; }
.srd-empty { padding: 30px 14px; text-align: center; color: var(--srd-muted); }

/* Table */
.srd-table { width: calc(100% - 20px); margin: 0 10px; border-collapse: collapse; font-size: 10px; }
.srd-table th { padding: 5px 6px; background: #fdf3ea; text-align: left; font-weight: 800; color: #111827; }
.srd-table td { padding: 5px 6px; border-bottom: 1px solid #f1ede8; color: #1f2937; }
.srd-table td:first-child { font-weight: 700; white-space: nowrap; }
.srd-table td:last-child { font-weight: 700; white-space: nowrap; }
.srd-table td svg { vertical-align: -2px; }
.srd .srd-table td.srd-tone-text-good { color: #16a34a; }
.srd .srd-table td.srd-tone-text-warn { color: #ea580c; }
.srd .srd-table td.srd-tone-text-bad { color: #dc2626; }

/* Detailed modules — three per row */
.srd-modules { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; padding: 0 12px; }
.srd-module { display: flex; flex-direction: column; gap: 8px; padding: 10px 12px; border-radius: 12px; }
.srd-module h4 { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 800; color: #111827; }
.srd-module-icon { display: grid; place-items: center; width: 26px; height: 26px; flex: 0 0 26px; border-radius: 8px; background: rgba(255,255,255,0.85); box-shadow: 0 1px 2px rgba(17,24,39,0.08); }
.srd-module h4 svg { font-size: 13px; }
.srd-module-stats { display: grid; grid-template-columns: repeat(3, 1fr); padding: 8px 0; border-radius: 9px; background: rgba(255,255,255,0.7); }
.srd-module-stats-2 { grid-template-columns: repeat(2, 1fr); }
.srd-module-stats > div { padding: 0 6px; text-align: center; }
.srd-module-stats > div + div { border-left: 1px solid rgba(17,24,39,0.08); }
.srd-module-stats strong { display: block; font-size: 15px; font-weight: 900; color: #111827; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.srd-module-stats span { display: block; margin-top: 2px; font-size: 9px; color: #4b5563; }
.srd-tone-green .srd-module-stats strong, .srd-module-hero strong { color: #15803d; }
.srd-tone-purple .srd-module-stats strong { color: #6d28d9; }
.srd-tone-orange .srd-module-stats strong { color: #ea580c; }
.srd-tone-blue .srd-module-stats strong { color: #1d4ed8; }
.srd-tone-pink .srd-module-stats strong { color: #a21caf; }
.srd-module-split { display: grid; grid-template-columns: 84px 1fr; gap: 10px; align-items: center; }
.srd-module-hero { padding: 10px 4px; border-radius: 9px; background: rgba(255,255,255,0.7); text-align: center; }
.srd-module-hero strong { display: block; font-size: 22px; font-weight: 900; line-height: 1; }
.srd-module-hero span { display: block; margin-top: 4px; font-size: 9px; color: #4b5563; }
.srd-module-list li { display: flex; align-items: center; gap: 6px; padding: 1.5px 0; font-size: 9.5px; color: #1f2937; }
.srd-module-list li svg { color: #16a34a; font-size: 10px; }
.srd-module-list li b { margin-left: auto; font-weight: 800; }
.srd-difficulty { display: flex; flex-wrap: wrap; gap: 6px; }
.srd-difficulty span { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 99px; background: rgba(255,255,255,0.75); font-size: 9.5px; color: #1f2937; }
.srd-difficulty b { font-weight: 800; }
.srd-difficulty i { display: inline-block; width: 7px; height: 7px; border-radius: 50%; }
.srd-difficulty .is-easy { background: #22c55e; }
.srd-difficulty .is-medium { background: #f59e0b; }
.srd-difficulty .is-hard { background: #ef4444; }
.srd-note { font-size: 8px; color: var(--srd-muted); }

/* Insights */
.srd-insights { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; padding: 0 12px; }
.srd-insight { padding: 10px 12px; border-radius: 10px; }
.srd-insight h4 { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; font-size: 13px; font-weight: 800; }
.srd-insight h4 svg { font-size: 20px; }
.srd-tone-green h4 { color: #15803d; }
.srd-tone-orange h4 { color: #c2410c; }
.srd-tone-blue h4 { color: #1d4ed8; }
.srd-insight ul { padding-left: 16px; list-style: disc; }
.srd-insight li { padding: 1px 0; font-size: 10.5px; color: #1f2937; }

/* Footer */
.srd-footer {
  display: flex; align-items: center; gap: 18px; margin-top: 14px; padding: 6px 16px;
  background: linear-gradient(90deg, #fff 0%, #fff 55%, #ffedd5 80%, #fdba74 100%);
  border-top: 1px solid #fde4cc;
}
.srd-footer .srd-brand { padding: 4px 16px 4px 0; border-right: 1px solid #e5e7eb; }
.srd-footer .srd-brand img { height: 26px; }
.srd-footer p { display: flex; align-items: center; gap: 6px; font-size: 10.5px; color: #1f2937; }
.srd-footer-id { margin-left: auto !important; color: var(--srd-muted) !important; }

/* Scale the 820px layout to fit a single A4 page */
@page { size: A4 portrait; margin: 6mm; }
@media print {
  .srd { zoom: 0.72; }
  .srd-bar i, .srd-anim-grow { animation: none !important; }
}
`

export default StudentReportDocument
