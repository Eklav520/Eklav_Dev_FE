import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FiBell, FiCalendar, FiCheckCircle, FiClock, FiStar,
  FiFileText, FiChevronDown,
} from 'react-icons/fi'
import { useMyInterviews } from './useMyInterviews'
import MiniCalendar from './MiniCalendar'

const BLUE   = '#2563eb'
const GREEN  = '#10b981'
const ORANGE = '#f59e0b'
const PURPLE = '#8b5cf6'
const RED    = '#ef4444'
const GRAY   = '#64748b'
const BORDER = '#e2e8f0'

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  Scheduled:    { bg: '#eff6ff', color: '#2563eb' },
  'In Progress':{ bg: '#fff7ed', color: '#d97706' },
  Completed:    { bg: '#ecfdf5', color: '#059669' },
  Cancelled:    { bg: '#fef2f2', color: '#dc2626' },
}
// Today's Schedule widget uses friendlier labels than the raw status enum.
const SCHEDULE_STATUS: Record<string, { label: string; bg: string; color: string }> = {
  Scheduled:    { label: 'Upcoming',  bg: '#eff6ff', color: '#2563eb' },
  'In Progress':{ label: 'Ongoing',   bg: '#fff7ed', color: '#d97706' },
  Completed:    { label: 'Completed', bg: '#ecfdf5', color: '#059669' },
  Cancelled:    { label: 'Cancelled', bg: '#fef2f2', color: '#dc2626' },
}

const AVATAR_COLORS = [
  ['#4F46E5', '#EEF2FF'], ['#0891B2', '#ECFEFF'], ['#16A34A', '#F0FDF4'],
  ['#DC2626', '#FEF2F2'], ['#D97706', '#FFFBEB'], ['#7C3AED', '#F5F3FF'],
]
const avatarColor = (name: string) => AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length]
const initials = (name: string) => name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '?'

const timeOf = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

// A pseudo-dropdown — display-only, matches the period selector chip in the
// Figma spec without wiring up filtering that wasn't asked for.
const PeriodChip = ({ label }: { label: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 28, padding: '0 10px', border: `1px solid ${BORDER}`, borderRadius: 7, fontSize: '0.72rem', fontWeight: 600, color: '#334155', flexShrink: 0 }}>
    {label} <FiChevronDown size={12} color={GRAY} />
  </div>
)

// Multi-series line chart, stretched to fill its container via viewBox +
// preserveAspectRatio="none" — small internal-tool chart, not pixel-precise.
const LineChartSVG = ({ series, labels, height = 160 }: { series: { color: string; values: number[] }[]; labels: string[]; height?: number }) => {
  const W = 600, H = height
  const max = Math.max(1, ...series.flatMap(s => s.values))
  const stepX = labels.length > 1 ? W / (labels.length - 1) : W
  const toY = (v: number) => H - 10 - (v / max) * (H - 24)
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height, display: 'block' }} preserveAspectRatio="none">
        {series.map((s, si) => (
          <g key={si}>
            <polyline fill="none" stroke={s.color} strokeWidth={2.5} points={s.values.map((v, i) => `${i * stepX},${toY(v)}`).join(' ')} />
            {s.values.map((v, i) => <circle key={i} cx={i * stepX} cy={toY(v)} r={3.5} fill={s.color} />)}
          </g>
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        {labels.map(l => <span key={l} style={{ fontSize: '0.62rem', color: GRAY }}>{l}</span>)}
      </div>
    </div>
  )
}

const MiniDonut = ({ total, segments }: { total: number; segments: { label: string; value: number; color: string }[] }) => {
  const size = 96, cx = 48, cy = 48, r = 34, stroke = 12
  const circum = 2 * Math.PI * r
  let offset = 0
  const segs = segments.map(s => {
    const dash = total > 0 ? (s.value / total) * circum : 0
    const seg = { ...s, dash, gap: circum - dash, offset: circum * 0.25 - offset }
    offset += dash
    return seg
  })
  return (
    <div style={{ position: 'relative', flexShrink: 0, width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={BORDER} strokeWidth={stroke} />
        {segs.map((s, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth={stroke}
            strokeDasharray={`${s.dash} ${s.gap}`} strokeDashoffset={s.offset} strokeLinecap="butt" />
        ))}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{total}</span>
        <span style={{ fontSize: '0.56rem', color: GRAY }}>Total</span>
      </div>
    </div>
  )
}

const HRDashboardPage = () => {
  const {
    interviews, memberName, loading, loadError, actionError,
    today, upcoming, completed, cancelled, completedThisMonth, feedbackGivenThisMonth,
  } = useMyInterviews()

  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15000)
    return () => clearInterval(t)
  }, [])

  const greeting = now.getHours() < 12 ? 'Good Morning' : now.getHours() < 17 ? 'Good Afternoon' : 'Good Evening'
  const firstName = memberName.split(' ')[0] || 'there'

  const interviewDates = useMemo(() => new Set(interviews.map(iv => new Date(iv.scheduledAt).toDateString())), [interviews])


  const isSameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

  const last7Days = useMemo(() => {
    const days: Date[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i)
      days.push(d)
    }
    return days
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviews])

  // Progress Overview — running totals across the last 7 days, split by status.
  const progressOverview = useMemo(() => {
    let schedCum = 0, compCum = 0, cancCum = 0
    const scheduled: number[] = [], completedSeries: number[] = [], cancelledSeries: number[] = []
    last7Days.forEach(day => {
      const dayIvs = interviews.filter(iv => isSameDay(new Date(iv.scheduledAt), day))
      schedCum += dayIvs.filter(iv => iv.status === 'Scheduled').length
      compCum += dayIvs.filter(iv => iv.status === 'Completed').length
      cancCum += dayIvs.filter(iv => iv.status === 'Cancelled').length
      scheduled.push(schedCum); completedSeries.push(compCum); cancelledSeries.push(cancCum)
    })
    const windowIvs = interviews.filter(iv => last7Days.some(d => isSameDay(new Date(iv.scheduledAt), d)))
    return {
      scheduled, completedSeries, cancelledSeries,
      total: windowIvs.length,
      completedCount: windowIvs.filter(iv => iv.status === 'Completed').length,
      scheduledCount: windowIvs.filter(iv => iv.status === 'Scheduled').length,
      cancelledCount: windowIvs.filter(iv => iv.status === 'Cancelled').length,
    }
  }, [interviews, last7Days])
  const progressLabels = useMemo(() => last7Days.map(d => d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' })), [last7Days])

  // Round-wise Performance — average feedback score (0-5) per interview round actually used.
  const roundPerformance = useMemo(() => {
    const byType = new Map<string, number[]>()
    interviews.forEach(iv => {
      if (typeof iv.feedbackScore === 'number') {
        if (!byType.has(iv.interviewType)) byType.set(iv.interviewType, [])
        byType.get(iv.interviewType)!.push(iv.feedbackScore)
      }
    })
    return [...byType.entries()].map(([type, scores]) => ({
      type, avg: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
    }))
  }, [interviews])

  // Fallback for Round-wise Performance when there's no rated feedback yet —
  // how many rounds are actually happening each day, last 7 days.
  const dailyRoundCounts = useMemo(() => last7Days.map(day => ({
    label: day.toLocaleDateString('en-US', { weekday: 'short' }),
    count: interviews.filter(iv => isSameDay(new Date(iv.scheduledAt), day)).length,
  })), [interviews, last7Days])
  const maxDailyRoundCount = Math.max(1, ...dailyRoundCounts.map(d => d.count))

  // Interviews by round type — donut breakdown of everything assigned to you.
  const typeBreakdown = useMemo(() => {
    const palette = [BLUE, GREEN, ORANGE, PURPLE, '#0891b2', '#db2777']
    const counts = new Map<string, number>()
    interviews.forEach(iv => counts.set(iv.interviewType, (counts.get(iv.interviewType) || 0) + 1))
    return [...counts.entries()].map(([label, value], i) => ({ label, value, color: palette[i % palette.length] }))
  }, [interviews])

  const maxRoundAvg = Math.max(1, ...roundPerformance.map(r => r.avg))

  return (
    <div style={{ minHeight: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' }}>{greeting}, {firstName} 👋</h1>
          <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: GRAY }}>Here's what's happening with your interviews today.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button style={{ width: 36, height: 36, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569', position: 'relative' }}>
            <FiBell size={15}/>
          </button>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a' }}>{now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', weekday: 'long' })}</div>
            <div style={{ fontSize: '0.72rem', color: GRAY }}>{now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </div>
      </div>

      {loadError && <div style={{ background: '#fef2f2', color: '#dc2626', fontSize: '0.82rem', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>{loadError}</div>}
      {actionError && <div style={{ background: '#fef2f2', color: '#dc2626', fontSize: '0.82rem', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>{actionError}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 16, alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { label: "Today's Interviews", value: today.length, sub: 'Scheduled for today', icon: <FiCalendar size={17}/>, ic: PURPLE, bg: '#f5f3ff' },
            { label: 'Upcoming', value: upcoming.length, sub: 'Next 7 days', icon: <FiFileText size={17}/>, ic: BLUE, bg: '#eff6ff' },
            { label: 'Completed', value: completedThisMonth.length, sub: 'This month', icon: <FiCheckCircle size={17}/>, ic: GREEN, bg: '#ecfdf5' },
            { label: 'Feedback Given', value: feedbackGivenThisMonth.length, sub: 'This month', icon: <FiStar size={17}/>, ic: ORANGE, bg: '#fff7ed' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.ic, flexShrink: 0 }}>{s.icon}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.7rem', color: GRAY, marginBottom: 2, whiteSpace: 'nowrap' }}>{s.label}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>{s.value}</div>
                <div style={{ fontSize: '0.66rem', color: GRAY, fontWeight: 500, marginTop: 2 }}>{s.sub}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#0f172a' }}>Interview Progress Overview</div>
            <PeriodChip label="Last 7 Days" />
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
                {[['Scheduled', STATUS_STYLE.Scheduled.color], ['Completed', STATUS_STYLE.Completed.color], ['Cancelled', STATUS_STYLE.Cancelled.color]].map(([label, color]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.7rem', color: '#334155' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: color as string }} /> {label}
                  </div>
                ))}
              </div>
              <LineChartSVG
                labels={progressLabels}
                series={[
                  { color: STATUS_STYLE.Scheduled.color, values: progressOverview.scheduled },
                  { color: STATUS_STYLE.Completed.color, values: progressOverview.completedSeries },
                  { color: STATUS_STYLE.Cancelled.color, values: progressOverview.cancelledSeries },
                ]}
              />
            </div>
            <div style={{ width: 150, flexShrink: 0, borderLeft: `1px solid ${BORDER}`, paddingLeft: 18 }}>
              <div style={{ fontSize: '0.66rem', color: GRAY, marginBottom: 2 }}>Total</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginBottom: 14 }}>{progressOverview.total}</div>
              {[
                ['Completed', progressOverview.completedCount, STATUS_STYLE.Completed.color],
                ['Scheduled', progressOverview.scheduledCount, STATUS_STYLE.Scheduled.color],
                ['Cancelled', progressOverview.cancelledCount, STATUS_STYLE.Cancelled.color],
              ].map(([label, value, color]) => (
                <div key={label as string} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: '#334155', marginBottom: 8 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: color as string, flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{label}</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{value}{progressOverview.total ? ` (${Math.round((value as number) / progressOverview.total * 100)}%)` : ''}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#0f172a' }}>
                {roundPerformance.length === 0 ? 'Daily HR Rounds' : 'Round-wise Performance (Avg Rating)'}
              </div>
              <PeriodChip label={roundPerformance.length === 0 ? 'Last 7 Days' : 'All Rounds'} />
            </div>
            {roundPerformance.length === 0 ? (
              dailyRoundCounts.every(d => d.count === 0) ? (
                <div style={{ fontSize: '0.78rem', color: GRAY, textAlign: 'center', padding: '30px 0' }}>No rounds scheduled this week yet.</div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', gap: 10, height: 140 }}>
                  {dailyRoundCounts.map(d => (
                    <div key={d.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0f172a' }}>{d.count > 0 ? d.count : ''}</span>
                      <div style={{ width: '100%', maxWidth: 34, borderRadius: '6px 6px 0 0', background: d.count > 0 ? '#6366f1' : '#eef2f7', height: `${Math.max(6, (d.count / maxDailyRoundCount) * 100)}%`, transition: 'height 0.2s' }} />
                      <span style={{ fontSize: '0.64rem', color: GRAY, fontWeight: 500 }}>{d.label}</span>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', gap: 10, height: 140 }}>
                {roundPerformance.map(r => (
                  <div key={r.type} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0f172a' }}>{r.avg}</span>
                    <div style={{ width: '100%', maxWidth: 40, borderRadius: '6px 6px 0 0', background: '#6366f1', height: `${Math.max(6, (r.avg / maxRoundAvg) * 100)}%`, transition: 'height 0.2s' }} />
                    <span style={{ fontSize: '0.64rem', color: GRAY, fontWeight: 500, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 70 }}>{r.type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, padding: 20 }}>
            <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Interviews by Round Type</div>
            {typeBreakdown.length === 0 ? (
              <div style={{ fontSize: '0.78rem', color: GRAY, textAlign: 'center', padding: '30px 0' }}>Nothing assigned yet.</div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <MiniDonut total={interviews.length} segments={typeBreakdown} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0, flex: 1 }}>
                  {typeBreakdown.map(t => (
                    <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem' }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                      <span style={{ color: '#334155', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.label}</span>
                      <span style={{ fontWeight: 700, color: '#0f172a', flexShrink: 0 }}>{t.value} ({interviews.length ? Math.round(t.value / interviews.length * 100) : 0}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, padding: 16 }}>
            <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Interview Calendar</div>
            <MiniCalendar interviewDates={interviewDates} />
          </div>

          <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a' }}>Today's Schedule</span>
              <Link to="/hr/my-interviews/schedule" style={{ fontSize: '0.72rem', color: BLUE, fontWeight: 600, textDecoration: 'none' }}>View all</Link>
            </div>
            {today.length === 0 ? (
              <div style={{ fontSize: '0.76rem', color: GRAY }}>Nothing scheduled today.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {today.map(iv => {
                  const [fg, bg] = avatarColor(iv.candidateName)
                  const meta = SCHEDULE_STATUS[iv.status] || SCHEDULE_STATUS.Scheduled
                  return (
                    <div key={iv._id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f8f9ff', borderRadius: 10, padding: '10px 12px' }}>
                      <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#0f172a', flexShrink: 0, width: 56 }}>{timeOf(iv.scheduledAt)}</div>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: bg, color: fg, fontSize: '0.62rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{initials(iv.candidateName)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{iv.candidateName}</div>
                        <div style={{ fontSize: '0.68rem', color: GRAY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{iv.interviewType}</div>
                      </div>
                      <span style={{ background: meta.bg, color: meta.color, fontSize: '0.64rem', fontWeight: 700, padding: '3px 9px', borderRadius: 20, flexShrink: 0, whiteSpace: 'nowrap' }}>{meta.label}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Bottom row */}
      <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, padding: 18 }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Interview Guidelines</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
          {[
            'Ensure a stable internet connection and a quiet environment.',
            'Start the interview on time and introduce yourself to the candidate.',
            'Ask role-specific technical questions and evaluate problem-solving skills.',
            'Provide constructive feedback and be fair in evaluation.',
          ].map((tip, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.8rem', color: '#334155' }}>
              <FiCheckCircle size={14} color={GREEN} style={{ flexShrink: 0, marginTop: 2 }} />
              {tip}
            </div>
          ))}
        </div>
        <Link to="/hr/my-interviews/documents" style={{ fontSize: '0.78rem', color: BLUE, fontWeight: 600, textDecoration: 'none' }}>View Detailed Guidelines →</Link>
      </div>
    </div>
  )
}

export default HRDashboardPage
