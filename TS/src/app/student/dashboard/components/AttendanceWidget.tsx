import React, { useEffect, useState, useMemo } from 'react'
import { useAuthContext } from '@/context/useAuthContext'

interface DayRecord {
  date: string
  isPresent: boolean
  totalSeconds: number
  hours: number
  loginAt: string | null
  logoutAt: string | null
  isActive: boolean
}

const fmtHours = (h: number) => {
  if (h === 0) return null
  const hrs = Math.floor(h)
  const min = Math.round((h - hrs) * 60)
  if (hrs === 0) return `${min}m`
  if (min === 0) return `${hrs}h`
  return `${hrs}h ${min}m`
}

const fmtTime = (iso: string | null) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAY_LABELS  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

/* ── Col 1: Line Graph ── */
const LineGraph: React.FC<{ data: DayRecord[] }> = ({ data }) => {
  const today = new Date().toISOString().slice(0, 10)
  const last7 = [...data]
    .filter(d => d.date <= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7)
  const rawMax = Math.max(...last7.map(d => d.hours), 0.1)
  // Snap to a clean ceiling: 1, 2, 4, 6, 8, 10, 12...
  const niceMax = rawMax <= 1 ? 1
    : rawMax <= 2 ? 2
    : rawMax <= 4 ? Math.ceil(rawMax)
    : rawMax <= 8 ? Math.ceil(rawMax / 2) * 2
    : Math.ceil(rawMax / 4) * 4
  const maxH = niceMax
  const W = 100, H = 90, PAD = 12

  const points = last7.map((d, i) => ({
    x: PAD + (i / Math.max(last7.length - 1, 1)) * (W - PAD * 2),
    y: PAD + (1 - d.hours / maxH) * (H - PAD * 2),
    d,
  }))

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')
  const areaPath = `${linePath} L ${(points[points.length - 1]?.x ?? W).toFixed(2)} ${H} L ${(points[0]?.x ?? 0).toFixed(2)} ${H} Z`

  const hasData = last7.some(d => d.hours > 0)

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 6, display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>Weekly Activity</span>
        <span style={{ color: '#6b7280', fontSize: '0.65rem' }}>Last 7 days · hrs/day</span>
      </div>

      {!hasData ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#4b5563', fontSize: '0.78rem', textAlign: 'center' }}>
          📊 No activity<br/>this week yet
        </div>
      ) : (
        <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
          <svg viewBox={`0 0 ${W} ${H + 10}`} preserveAspectRatio="none"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', display: 'block' }}>
            <defs>
              <linearGradient id="areaGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff7a00" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#ff7a00" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* grid lines + y-labels */}
            {[0.25, 0.5, 0.75, 1].map(t => {
              const yPos = PAD + (1 - t) * (H - PAD * 2)
              const raw = maxH * t
              const hVal = Number.isInteger(raw) ? `${raw}` : raw < 1 ? raw.toFixed(1) : raw % 1 === 0.5 ? raw.toFixed(1) : Math.round(raw).toString()
              return (
                <g key={t}>
                  <line x1={PAD} y1={yPos} x2={W - PAD} y2={yPos}
                    stroke="rgba(255,255,255,0.07)" strokeWidth={0.5} strokeDasharray="2,2" />
                  <text x={PAD - 1} y={yPos + 1.5} textAnchor="end" fill="#4b5563" fontSize={4}>{hVal}h</text>
                </g>
              )
            })}

            {/* area + line */}
            {points.length > 1 && <path d={areaPath} fill="url(#areaGrad2)" />}
            {points.length > 1 && (
              <path d={linePath} fill="none" stroke="#ff7a00" strokeWidth={1.5}
                strokeLinecap="round" strokeLinejoin="round" />
            )}

            {/* dots + value labels */}
            {points.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r={2.5} fill="#ff7a00" stroke="#111" strokeWidth={1} />
                {p.d.hours > 0 && (
                  <text x={p.x} y={p.y - 4} textAnchor="middle" fill="#ffa040" fontSize={4} fontWeight="bold">
                    {fmtHours(p.d.hours)}
                  </text>
                )}
                <title>{p.d.date}: {fmtHours(p.d.hours) ?? '0m'}</title>
              </g>
            ))}

            {/* x-axis labels */}
            {points.map((p, i) => {
              const label = new Date(p.d.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 3)
              return (
                <text key={i} x={p.x} y={H + 8} textAnchor="middle" fill="#6b7280" fontSize={5}>{label}</text>
              )
            })}
          </svg>
        </div>
      )}
    </div>
  )
}

/* ── Col 2: Stats ── */
const StatsPanel: React.FC<{
  presentCount: number
  absentCount: number
  totalHours: number
  avgPerDay: string
}> = ({ presentCount, absentCount, totalHours, avgPerDay }) => {
  const stats = [
    { label: 'Days Present',  value: presentCount,      color: '#10b981', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.25)',  icon: '✅' },
    { label: 'Days Absent',   value: absentCount,       color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.25)',   icon: '❌' },
    { label: 'Total Hours',   value: `${totalHours}h`,  color: '#ff7a00', bg: 'rgba(255,122,0,0.08)',   border: 'rgba(255,122,0,0.25)',   icon: '⏱️' },
    { label: 'Avg / Day',     value: avgPerDay,         color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)',  border: 'rgba(139,92,246,0.25)',  icon: '📈' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, height: '100%' }}>
      <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.82rem', marginBottom: 0 }}>Monthly Stats</div>
      {stats.map(({ label, value, color, bg, border, icon }) => (
        <div key={label} style={{
          background: bg,
          border: `1px solid ${border}`,
          borderRadius: 8,
          padding: '5px 8px',
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 6,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11 }}>{icon}</span>
            <span style={{ color: '#9ca3af', fontSize: '0.62rem' }}>{label}</span>
          </div>
          <div style={{ color, fontWeight: 800, fontSize: '1.05rem', lineHeight: 1, flexShrink: 0 }}>{value}</div>
        </div>
      ))}
    </div>
  )
}

/* ── Col 3: Calendar ── */
const CalendarGrid: React.FC<{ records: DayRecord[]; month: number; year: number }> = ({ records, month, year }) => {
  const byDate = useMemo(() => {
    const m: Record<string, DayRecord> = {}
    records.forEach(r => { m[r.date] = r })
    return m
  }, [records])

  const today       = new Date().toISOString().slice(0, 10)
  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDow    = new Date(year, month - 1, 1).getDay()

  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.88rem', marginRight: 4 }}>Calendar</span>
        {[
          { color: '#10b981', bg: 'rgba(16,185,129,0.15)', label: 'Present' },
          { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   label: 'Absent'  },
          { color: '#ff7a00', bg: 'transparent',           label: 'Today'   },
        ].map(({ color, bg, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 9, height: 9, borderRadius: 3, background: bg, border: `1.5px solid ${color}` }} />
            <span style={{ color: '#9ca3af', fontSize: '0.68rem' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3, marginBottom: 3 }}>
        {DAY_LABELS.map(d => (
          <div key={d} style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.62rem', fontWeight: 600, paddingBottom: 2 }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3, flex: 1 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`blank-${i}`} />

          const dateStr  = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`
          const rec      = byDate[dateStr]
          const isToday  = dateStr === today
          const isFuture = dateStr > today
          const present  = rec?.isPresent ?? false
          const hLabel   = fmtHours(rec?.hours ?? 0)

          let bg     = '#111'
          let color  = '#4b5563'
          let border = '1px solid #1e1e1e'

          if (!isFuture) {
            if (present) { bg = 'rgba(16,185,129,0.13)'; color = '#10b981'; border = '1px solid rgba(16,185,129,0.3)' }
            else         { bg = 'rgba(239,68,68,0.08)';  color = '#ef4444'; border = '1px solid rgba(239,68,68,0.2)' }
          }
          if (isToday) { border = '1.5px solid #ff7a00'; color = '#ff7a00' }

          return (
            <div
              key={dateStr}
              title={`${dateStr}${hLabel ? ` · ${hLabel}` : ''}\nLogin: ${fmtTime(rec?.loginAt ?? null)}\nLogout: ${fmtTime(rec?.logoutAt ?? null)}`}
              style={{
                background: bg, border, borderRadius: 6,
                padding: '4px 2px', textAlign: 'center', cursor: 'default',
                transition: 'transform 0.12s',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                minHeight: 32,
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.zIndex = '2' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.zIndex = '1' }}
            >
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color, lineHeight: 1 }}>{day}</div>
              {!isFuture && (
                <div style={{ fontSize: '0.52rem', color: present ? '#6ee7b7' : '#fca5a5', marginTop: 2, lineHeight: 1 }}>
                  {hLabel ?? (present ? '—' : 'abs')}
                </div>
              )}
              {rec?.isActive && (
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#ff7a00',
                  marginTop: 2, boxShadow: '0 0 4px #ff7a00' }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Main Widget ── */
const AttendanceWidget: React.FC = () => {
  const { user } = useAuthContext()
  const baseURL  = import.meta.env.VITE_API_BASE_URL

  const now  = new Date()
  const [month,   setMonth]   = useState(now.getMonth() + 1)
  const [year,    setYear]    = useState(now.getFullYear())
  const [records, setRecords] = useState<DayRecord[]>([])
  const [loading, setLoading] = useState(true)

  const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i)

  useEffect(() => {
    if (!user?.token) return
    setLoading(true)
    fetch(`${baseURL}/api/session/timesheet?month=${month}&year=${year}`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then(r => r.json())
      .then(data => setRecords(Array.isArray(data) ? data : []))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false))
  }, [user?.token, month, year])

  const presentCount = records.filter(r => r.isPresent).length
  const daysInMonth  = new Date(year, month, 0).getDate()
  const absentCount  = daysInMonth - presentCount
  const totalHours   = +(records.reduce((s, r) => s + r.hours, 0)).toFixed(1)
  const avgPerDay    = presentCount > 0 ? `${(totalHours / presentCount).toFixed(1)}h` : '—'

  return (
    <div style={{
      background: '#000',
      border: '1px solid #1a1a1a',
      borderRadius: 16,
      overflow: 'hidden',
      fontFamily: '"Segoe UI", sans-serif',
    }}>
      {/* Header */}
      <div style={{
        background: '#0a0a0a',
        borderBottom: '2px solid #ff7a00',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, background: 'rgba(255,122,0,0.15)',
            borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
          }}>📅</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>Attendance Timesheet</div>
            <div style={{ color: '#8a8a8a', fontSize: '0.68rem' }}>{MONTH_NAMES[month - 1]} {year}</div>
          </div>
        </div>

        {/* Month / Year selectors */}
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            value={month}
            onChange={e => setMonth(Number(e.target.value))}
            style={{
              width: 130, background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#fff',
              borderRadius: 8, padding: '5px 10px', fontSize: '0.78rem', cursor: 'pointer',
            }}
          >
            {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            style={{
              width: 80, background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#fff',
              borderRadius: 8, padding: '5px 10px', fontSize: '0.78rem', cursor: 'pointer',
            }}
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Body — 3 columns */}
      <div style={{ padding: '10px 14px 14px', background: '#000' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 32, color: '#8a8a8a', fontSize: '0.85rem' }}>
            Loading...
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 16, alignItems: 'stretch', height: 340 }}>

            {/* Col 1: Graph */}
            <div style={{
              flex: '2 1 0',
              background: '#0a0a0a',
              border: '1px solid #1a1a1a',
              borderRadius: 12,
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
            }}>
              <LineGraph data={records} />
            </div>

            {/* Col 2: Stats */}
            <div style={{
              flex: '0 0 160px',
              background: '#0a0a0a',
              border: '1px solid #1a1a1a',
              borderRadius: 12,
              padding: '14px 16px',
            }}>
              <StatsPanel
                presentCount={presentCount}
                absentCount={absentCount}
                totalHours={totalHours}
                avgPerDay={avgPerDay}
              />
            </div>

            {/* Col 3: Calendar */}
            <div style={{
              flex: '2 1 0',
              background: '#0a0a0a',
              border: '1px solid #1a1a1a',
              borderRadius: 12,
              padding: '14px 16px',
            }}>
              <CalendarGrid records={records} month={month} year={year} />
            </div>

          </div>
        )}
      </div>
    </div>
  )
}

export default AttendanceWidget
