import {
  FaUsers, FaCheckCircle, FaExclamationCircle, FaExclamationTriangle, FaRegClock, FaTrophy, FaCalendarAlt,
  FaUniversity, FaBook, FaRobot, FaLanguage, FaClipboardList, FaCode, FaMedal,
} from 'react-icons/fa'
import type { IconType } from 'react-icons'
import logo from '@/assets/images/logo_black.png'
import {
  type Student, type Report, type ReportMetric, type ReportStatus,
  sName, statusOf, STATUS_LABELS,
} from './studentReportData'

/* "Export PDF": consolidated landscape report of every student in the current filter.
   Same visual language as the per-student StudentReportDocument; styles are embedded
   so they travel with the markup into the print window. */

export type SheetRow = {
  student: Student
  report?: Report
  metrics?: ReportMetric[]
  rank?: { position: number; total: number } | null
}

const MODULES: { key: string; label: string; short: [string, string?]; icon: IconType }[] = [
  { key: 'engagement', label: 'Daily Engagement', short: ['Daily', 'Engagement'], icon: FaCalendarAlt },
  { key: 'course', label: 'Course Progress', short: ['Course', 'Progress'], icon: FaBook },
  { key: 'interview', label: 'AI Based Interview', short: ['AI', 'Interview'], icon: FaRobot },
  { key: 'english', label: 'English Practice', short: ['English', 'Practice'], icon: FaLanguage },
  { key: 'assessment', label: 'Assessments', short: ['Assessments'], icon: FaClipboardList },
  { key: 'code', label: 'Code Challenge', short: ['Code', 'Challenge'], icon: FaCode },
]

/* Colours follow the report's status thresholds: ≥ 75 on track, 50–74 needs attention, < 50 at risk */
const clamp = (v: number) => Math.min(100, Math.max(0, v))
const barColor = (v: number) => v >= 75 ? 'linear-gradient(90deg,#16a34a,#22c55e)' : v >= 50 ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : v > 0 ? 'linear-gradient(90deg,#ea580c,#fb923c)' : '#e5e7eb'
const fmtDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
const pct = (n: number, total: number) => total ? Math.round((n / total) * 100) : 0

const STATUS_ICON: Record<ReportStatus, IconType> = {
  'on-track': FaCheckCircle,
  'needs-attention': FaExclamationCircle,
  'at-risk': FaExclamationTriangle,
  'not-started': FaRegClock,
}

/* Overall-score distribution bands for the doughnut */
const BANDS = [
  { label: 'Excellent (80–100%)', color: '#16a34a', test: (v: number) => v >= 80 },
  { label: 'Good (60–79%)', color: '#3b82f6', test: (v: number) => v >= 60 && v < 80 },
  { label: 'Needs Improvement (40–59%)', color: '#f59e0b', test: (v: number) => v >= 40 && v < 60 },
  { label: 'At Risk (Below 40%)', color: '#ef4444', test: (v: number) => v < 40 },
]

const Donut = ({ values, total }: { values: { color: string; count: number }[]; total: number }) => {
  const r = 46, c = 2 * Math.PI * r
  let offset = 0
  return (
    <svg viewBox="0 0 120 120" className="srs-donut" role="img" aria-label="Performance distribution">
      <circle cx="60" cy="60" r={r} fill="none" stroke="#f1f5f9" strokeWidth="20" />
      {total > 0 && values.map((v, i) => {
        const len = (v.count / total) * c
        const el = (
          <circle key={i} cx="60" cy="60" r={r} fill="none" stroke={v.color} strokeWidth="20"
            strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset} transform="rotate(-90 60 60)" />
        )
        offset += len
        return el
      })}
      <text x="60" y="58" textAnchor="middle" fontSize="20" fontWeight="800" fill="#111827">{total}</text>
      <text x="60" y="73" textAnchor="middle" fontSize="9" fill="#4b5563">Students</text>
    </svg>
  )
}

const StudentReportsSheet = ({ rows, periodFrom, periodTo, branch, year }: {
  rows: SheetRow[]
  periodFrom: string
  periodTo: string
  branch: string
  year: string
}) => {
  const logoUrl = new URL(logo, window.location.href).href
  const generatedOn = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
  const withReport = rows.filter(r => r.report)
  const total = rows.length
  const institute = withReport.find(r => r.report?.student.college)?.report?.student.college || ''

  const counts: Record<ReportStatus, number> = { 'on-track': 0, 'needs-attention': 0, 'at-risk': 0, 'not-started': 0 }
  withReport.forEach(r => { counts[statusOf(r.report!)] += 1 })
  const avgOverall = withReport.length
    ? Math.round(withReport.reduce((t, r) => t + r.report!.overallScore, 0) / withReport.length)
    : 0
  const moduleAvg = (key: string) => {
    const scores = withReport.map(r => r.metrics?.find(m => m.key === key)?.score ?? 0)
    return scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
  }
  const bandCounts = BANDS.map(b => ({ ...b, count: withReport.filter(r => b.test(r.report!.overallScore)).length }))
  const topFive = [...withReport]
    .sort((a, b) => (a.rank?.position ?? Infinity) - (b.rank?.position ?? Infinity) || b.report!.overallScore - a.report!.overallScore)
    .slice(0, 5)

  const filterText = [branch && `Branch: ${branch}`, year && `Year: ${year}`].filter(Boolean).join(' · ')

  return (
    <div className="srs">
      <style>{SHEET_CSS}</style>

      {/* Header */}
      <header className="srs-top">
        <div className="srs-brand">
          <img src={logoUrl} alt="EKLAV" />
          <span>AI-Powered Learning &amp; Placement Platform</span>
        </div>
        <div className="srs-heading">
          <h1>Student Performance Report <span>(Consolidated)</span></h1>
          <p>Overall Progress &amp; Module-wise Performance – {total} Student{total !== 1 ? 's' : ''}{filterText ? ` · ${filterText}` : ''}</p>
        </div>
        <div className="srs-period">
          <p><FaCalendarAlt /><b>Report Period :</b> {periodFrom && periodTo ? `${fmtDate(periodFrom)} – ${fmtDate(periodTo)}` : `All time (since onboarding) – ${fmtDate(new Date().toLocaleDateString('en-CA'))}`}</p>
          <p><FaUniversity /><b>Institute :</b> {institute || '—'}</p>
          <p className="srs-generated">Generated on {generatedOn}</p>
        </div>
      </header>

      {/* KPIs */}
      <section className="srs-kpis">
        <div className="srs-kpi srs-tone-blue">
          <span className="srs-kpi-icon"><FaUsers /></span>
          <div><strong>{total}</strong><span>Total Students{counts['not-started'] ? ` · ${counts['not-started']} not started` : ''}</span></div>
        </div>
        <div className="srs-kpi srs-tone-green">
          <span className="srs-kpi-icon"><FaCheckCircle /></span>
          <div><strong>{counts['on-track']}</strong><span>On Track ({pct(counts['on-track'], total)}%)</span></div>
        </div>
        <div className="srs-kpi srs-tone-amber">
          <span className="srs-kpi-icon"><FaExclamationCircle /></span>
          <div><strong>{counts['needs-attention']}</strong><span>Needs Attention ({pct(counts['needs-attention'], total)}%)</span></div>
        </div>
        <div className="srs-kpi srs-tone-red">
          <span className="srs-kpi-icon"><FaExclamationTriangle /></span>
          <div><strong>{counts['at-risk']}</strong><span>At Risk ({pct(counts['at-risk'], total)}%)</span></div>
        </div>
        <div className="srs-kpi srs-tone-gold">
          <span className="srs-kpi-icon srs-kpi-trophy"><FaTrophy /></span>
          <div><strong>{avgOverall}%</strong><span>Avg. Performance</span></div>
        </div>
      </section>

      {/* Panels */}
      <section className="srs-panels">
        <div className="srs-panel">
          <h2 className="srs-section-title"><span>Module-wise Average Performance (Batch)</span></h2>
          <div className="srs-module-avgs">
            {MODULES.map(({ key, label, icon: Icon }) => {
              const v = moduleAvg(key)
              return (
                <div key={key} className="srs-module-row">
                  <Icon className="srs-module-icon" />
                  <span>{label}</span>
                  <span className="srs-bar"><i style={{ width: `${clamp(v)}%`, background: barColor(v) }} /></span>
                  <strong>{v}%</strong>
                </div>
              )
            })}
          </div>
        </div>

        <div className="srs-panel">
          <h2 className="srs-section-title"><span>Performance Distribution</span></h2>
          <div className="srs-dist">
            <Donut values={bandCounts} total={withReport.length} />
            <ul>
              {bandCounts.map(b => (
                <li key={b.label}>
                  <i style={{ background: b.color }} />
                  <span>{b.label}</span>
                  <strong>{b.count} <small>({pct(b.count, withReport.length)}%)</small></strong>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="srs-panel">
          <h2 className="srs-section-title"><span>Top Performers</span></h2>
          <ol className="srs-top-list">
            {topFive.length === 0 && <li className="srs-muted">No scored students in this period</li>}
            {topFive.map((r, i) => (
              <li key={r.student._id}>
                <span className={`srs-medal srs-medal-${i + 1}`}>{i < 3 ? <FaMedal /> : i + 1}</span>
                <div>
                  <strong>{sName(r.student)}</strong>
                  <small>{r.student.rollNumber || '—'} · {r.student.branch || '—'}</small>
                </div>
                <b>{r.report!.overallScore}%</b>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Student table */}
      <section className="srs-table-wrap">
        <div className="srs-table-title">
          <FaUsers />
          <span>Student-wise Performance Summary ({total} Student{total !== 1 ? 's' : ''})</span>
        </div>
        <table className="srs-table">
          <thead>
            <tr>
              <th style={{ width: 30 }}>S. No.</th>
              <th>Student Name</th>
              <th>Roll No.</th>
              <th>Branch</th>
              {MODULES.map(({ key, short, icon: Icon }) => (
                <th key={key} className="srs-module-th">
                  <span><Icon />{short[0]}{short[1] && <><br />{short[1]}</>}</span>
                </th>
              ))}
              <th className="srs-center">Overall<br />Score</th>
              <th className="srs-center">Rank</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const { student, report, metrics, rank } = row
              const status = report ? statusOf(report) : null
              const StatusIcon = status ? STATUS_ICON[status] : null
              return (
                <tr key={student._id}>
                  <td className="srs-center srs-muted">{idx + 1}</td>
                  <td>
                    <strong className="srs-name">{sName(student)}</strong>
                    <small>{student.email}</small>
                  </td>
                  <td>{student.rollNumber || '—'}</td>
                  <td>{student.branch || '—'}</td>
                  {MODULES.map(({ key }) => {
                    const v = metrics?.find(x => x.key === key)?.score
                    return (
                      <td key={key}>
                        {v == null ? <span className="srs-muted">—</span> : (
                          <div className="srs-cell">
                            <strong>{v}%</strong>
                            <span className="srs-bar"><i style={{ width: `${clamp(v)}%`, background: barColor(v) }} /></span>
                          </div>
                        )}
                      </td>
                    )
                  })}
                  <td className="srs-center">
                    {report ? <span className={`srs-overall srs-status-${status}`}>{report.overallScore}%</span> : <span className="srs-muted">—</span>}
                  </td>
                  <td className="srs-center">
                    {rank?.position ? (
                      <span className={`srs-rank${rank.position <= 3 ? ` srs-rank-${rank.position}` : ''}`}>
                        {rank.position <= 3 && <FaMedal />}#{rank.position}<small>/{rank.total}</small>
                      </span>
                    ) : <span className="srs-muted">—</span>}
                  </td>
                  <td>
                    {status && StatusIcon
                      ? <span className={`srs-status srs-status-text-${status}`}><StatusIcon /> {STATUS_LABELS[status]}</span>
                      : <span className="srs-muted">Report unavailable</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>

      {/* Footer */}
      <footer className="srs-footer">
        <div className="srs-brand">
          <img src={logoUrl} alt="EKLAV" />
          <span>AI-Powered Learning &amp; Placement Platform</span>
        </div>
        <p className="srs-footer-text">Report Generated by EKLAV</p>
        <p className="srs-footer-text">www.eklav.in</p>
        <div className="srs-legend">
          <span><i style={{ background: '#22c55e' }} /> On Track (≥ 75%)</span>
          <span><i style={{ background: '#fbbf24' }} /> Needs Attention (50% – 74%)</span>
          <span><i style={{ background: '#fb923c' }} /> At Risk (&lt; 50%)</span>
        </div>
        <div className="srs-footer-pill">{total} Student{total !== 1 ? 's' : ''}</div>
      </footer>
    </div>
  )
}

const SHEET_CSS = `
.srs {
  width: 100%;
  background: #fff;
  color: #1f2430;
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  font-size: 10px;
  line-height: 1.35;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.srs *, .srs *::before, .srs *::after { box-sizing: border-box; }
.srs h1, .srs h2, .srs p, .srs ul, .srs ol { margin: 0; padding: 0; }
.srs ul, .srs ol { list-style: none; }
.srs section { padding: 0; }

/* Header */
.srs-top { display: flex; align-items: stretch; gap: 18px; padding-left: 14px; }
.srs-brand { display: flex; flex-direction: column; justify-content: center; gap: 2px; padding-right: 18px; border-right: 1.5px solid #e5e7eb; }
.srs-top > .srs-brand { margin: 10px 0; }
.srs-brand img { height: 34px; width: auto; align-self: flex-start; }
.srs-brand span { font-size: 9px; font-weight: 600; color: #111827; white-space: nowrap; }
.srs-heading { display: flex; flex: 1 1 auto; flex-direction: column; justify-content: center; min-width: 0; padding: 10px 0; }
.srs-heading h1 { font-size: 18px; font-weight: 900; color: #111827; letter-spacing: 0.1px; }
.srs-heading h1 span { color: #4c1d95; }
.srs-heading p { margin-top: 3px; font-size: 11px; color: #374151; }
/* The orange block is the period box itself, so long institute names wrap inside it */
.srs-period {
  display: flex; flex: 0 1 auto; flex-direction: column; justify-content: center; gap: 4px;
  min-width: 240px; max-width: 36%; padding: 10px 16px 10px 46px;
  background: linear-gradient(100deg, #ffb26b 0%, #ff8a2a 35%, #f97316 62%, #a855f7 100%);
  clip-path: polygon(30px 0, 100% 0, 100% 100%, 0 100%);
  color: #fff;
}
.srs-period p { display: flex; align-items: flex-start; gap: 6px; font-size: 10px; line-height: 1.35; }
.srs-period p svg { flex: 0 0 auto; margin-top: 2px; }
.srs-period b { flex: 0 0 auto; }
.srs-period b { font-weight: 700; }
.srs-generated { opacity: 0.85; font-size: 8.5px !important; }

/* KPIs */
.srs-kpis { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin: 6px 14px 0; }
.srs-kpi { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border: 1px solid; border-radius: 12px; }
.srs-kpi-icon { display: grid; place-items: center; width: 40px; height: 40px; flex: 0 0 40px; border-radius: 50%; color: #fff; font-size: 17px; }
.srs-kpi strong { display: block; font-size: 22px; font-weight: 900; color: #111827; line-height: 1; }
.srs-kpi span:not(.srs-kpi-icon) { display: block; margin-top: 3px; font-size: 10px; color: #374151; }
.srs-tone-blue { background: #eef2ff; border-color: #c7d2fe; } .srs-tone-blue .srs-kpi-icon { background: linear-gradient(135deg,#6366f1,#4f46e5); }
.srs-tone-green { background: #f0fdf4; border-color: #bbf7d0; } .srs-tone-green .srs-kpi-icon { background: linear-gradient(135deg,#22c55e,#16a34a); }
.srs-tone-amber { background: #fffbeb; border-color: #fde68a; } .srs-tone-amber .srs-kpi-icon { background: linear-gradient(135deg,#fbbf24,#f59e0b); }
.srs-tone-red { background: #fef2f2; border-color: #fecaca; } .srs-tone-red .srs-kpi-icon { background: linear-gradient(135deg,#f87171,#dc2626); }
.srs-tone-gold { background: #fffaf0; border-color: #fde4cc; } .srs-kpi-trophy { background: none !important; color: #f59e0b !important; font-size: 30px !important; }

/* Panels */
.srs-panels { display: grid; grid-template-columns: 1.15fr 1fr 0.95fr; gap: 10px; margin: 10px 14px 0; }
.srs-panel { padding: 0 0 8px; overflow: hidden; border: 1px solid #f3e1d0; border-radius: 12px; background: #fff; break-inside: avoid; }
.srs-section-title { display: flex; margin: 0 0 6px; font-size: 12px; line-height: 1.2; }
.srs-section-title span {
  display: inline-block; min-width: 82%; padding: 6px 34px 6px 12px;
  background: linear-gradient(90deg, #f97316 0%, #fb923c 45%, #a855f7 100%);
  clip-path: polygon(0 0, calc(100% - 16px) 0, 100% 100%, 0 100%);
  color: #fff; font-weight: 800;
}
.srs-module-avgs { padding: 4px 14px 0; }
.srs-module-row { display: grid; grid-template-columns: 16px 1fr 1.2fr 34px; align-items: center; gap: 8px; padding: 4px 0; border-bottom: 1px solid #f3f0ec; }
.srs-module-row:last-child { border-bottom: 0; }
.srs-module-icon { color: #f97316; font-size: 11px; }
.srs-module-row > span:nth-child(2) { font-size: 9.5px; font-weight: 700; color: #111827; }
.srs-module-row strong { text-align: right; font-size: 10.5px; font-weight: 800; color: #111827; }
.srs-bar { display: block; height: 7px; overflow: hidden; border-radius: 99px; background: #e5e7eb; }
.srs-bar i { display: block; height: 100%; border-radius: inherit; }

.srs-dist { display: flex; align-items: center; gap: 14px; padding: 10px 14px 4px; }
.srs-donut { width: 112px; height: 112px; flex: 0 0 112px; }
.srs-dist ul { flex: 1; }
.srs-dist li { display: grid; grid-template-columns: 9px 1fr auto; align-items: center; gap: 7px; padding: 5px 0; border-bottom: 1px solid #f3f0ec; font-size: 9.5px; color: #1f2937; }
.srs-dist li:last-child { border-bottom: 0; }
.srs-dist li i { width: 9px; height: 9px; border-radius: 50%; }
.srs-dist li strong { font-size: 10.5px; font-weight: 800; color: #111827; }
.srs-dist li small { font-weight: 600; color: #6b7280; }

/* .srs prefix beats the generic .srs ol padding reset, which had removed the side padding */
.srs .srs-top-list { padding: 6px 14px 0; }
.srs-top-list li { display: grid; grid-template-columns: 22px 1fr auto; align-items: center; gap: 10px; padding: 6px 2px; border-bottom: 1px solid #f3f0ec; }
.srs-top-list li:last-child { border-bottom: 0; }
.srs-top-list strong { display: block; font-size: 10px; color: #111827; }
.srs-top-list small { display: block; font-size: 8.5px; color: #6b7280; }
.srs-top-list b { font-size: 11px; font-weight: 800; color: #16a34a; }
.srs-medal { display: grid; place-items: center; width: 22px; height: 22px; border-radius: 50%; background: #f3f4f6; color: #6b7280; font-size: 10px; font-weight: 800; }
.srs-medal-1 { background: #fef3c7; color: #d97706; }
.srs-medal-2 { background: #f1f5f9; color: #64748b; }
.srs-medal-3 { background: #ffedd5; color: #c2410c; }

/* Table */
.srs-table-wrap { margin: 12px 14px 0; overflow: hidden; border: 1px solid #e9d5ff; border-radius: 12px; }
.srs-table-title { display: flex; align-items: center; gap: 10px; padding: 8px 14px; background: linear-gradient(90deg, #f97316 0%, #fb923c 40%, #a855f7 100%); color: #fff; font-size: 14px; font-weight: 800; }
.srs-table-title svg { font-size: 16px; }
.srs-table { width: 100%; border-collapse: collapse; font-size: 9.5px; }
.srs-table thead { display: table-header-group; }
.srs-table th { padding: 6px 6px; background: #f5f3ff; color: #111827; font-weight: 800; text-align: left; font-size: 9px; vertical-align: middle; border-bottom: 1px solid #e9d5ff; }
.srs-module-th span { display: inline-flex; align-items: center; gap: 5px; line-height: 1.15; }
.srs-module-th svg { flex: 0 0 auto; color: #f97316; font-size: 12px; }
.srs-table td { padding: 5px 6px; border-bottom: 1px solid #f1f1f4; vertical-align: middle; color: #1f2937; }
.srs-table tbody tr:nth-child(even) td { background: #fcfcfd; }
.srs-table tr { break-inside: avoid; page-break-inside: avoid; }
.srs-name { display: block; max-width: 150px; overflow: hidden; color: #111827; font-weight: 800; text-overflow: ellipsis; white-space: nowrap; }
.srs-table td small { display: block; color: #6b7280; font-size: 8px; }
.srs-center { text-align: center !important; }
.srs-muted { color: #9ca3af; }
.srs-cell { display: flex; flex-direction: column; gap: 3px; min-width: 62px; }
.srs-cell strong { font-size: 9.5px; font-weight: 800; color: #111827; }
.srs-cell .srs-bar { height: 5px; }
.srs-overall { display: inline-block; min-width: 44px; padding: 3px 8px; border-radius: 99px; font-size: 10px; font-weight: 800; text-align: center; }
.srs-status-on-track { background: #dcfce7; color: #15803d; }
.srs-status-needs-attention { background: #fef3c7; color: #b45309; }
.srs-status-at-risk { background: #fee2e2; color: #b91c1c; }
.srs-status-not-started { background: #f1f5f9; color: #64748b; }
.srs-rank { display: inline-flex; align-items: center; gap: 3px; padding: 3px 8px; border: 1px solid #ddd6fe; border-radius: 99px; background: #f5f3ff; color: #5b21b6; font-size: 10px; font-weight: 800; white-space: nowrap; }
.srs-rank small { display: inline !important; color: #7c6fa8; font-size: 8px !important; font-weight: 600; }
.srs-rank svg { font-size: 9px; }
.srs-rank-1 { border-color: #fcd34d; background: #fef3c7; color: #b45309; }
.srs-rank-2 { border-color: #cbd5e1; background: #f1f5f9; color: #475569; }
.srs-rank-3 { border-color: #fdba74; background: #ffedd5; color: #c2410c; }
.srs-rank-1 small, .srs-rank-2 small, .srs-rank-3 small { color: inherit; opacity: 0.7; }
.srs-status { display: inline-flex; align-items: center; gap: 5px; font-weight: 700; white-space: nowrap; }
.srs-status svg { font-size: 12px; }
.srs-status-text-on-track { color: #16a34a; }
.srs-status-text-needs-attention { color: #d97706; }
.srs-status-text-at-risk { color: #dc2626; }
.srs-status-text-not-started { color: #64748b; }

/* Footer */
.srs-footer { display: flex; align-items: center; gap: 18px; margin-top: 14px; padding: 8px 14px; border-top: 1px solid #fde4cc; background: linear-gradient(90deg, #fff 0%, #fff 55%, #ffedd5 80%, #fdba74 100%); break-inside: avoid; }
.srs-footer .srs-brand img { height: 26px; }
.srs-footer-text { padding-right: 14px; border-right: 1px solid #e5e7eb; font-size: 10px; color: #1f2937; }
.srs-legend { display: flex; gap: 14px; font-size: 9.5px; color: #1f2937; }
.srs-legend span { display: inline-flex; align-items: center; gap: 5px; }
.srs-legend i { width: 18px; height: 6px; border-radius: 99px; }
.srs-footer-pill { margin-left: auto; padding: 6px 14px; border-radius: 10px; background: linear-gradient(135deg, #7c3aed, #a855f7); color: #fff; font-size: 10px; font-weight: 700; }

@page {
  size: A4 landscape;
  margin: 7mm 7mm 10mm;
  @bottom-right { content: "Page " counter(page) " of " counter(pages); font-family: 'Segoe UI', sans-serif; font-size: 8px; color: #6b7280; }
}
`

export default StudentReportsSheet
