import { useEffect, useState } from 'react'
import { Spinner } from 'react-bootstrap'
import { FaRobot, FaFileAlt, FaMicrophone } from 'react-icons/fa'
import { useAuthContext } from '@/context/useAuthContext'

/* ─── Types ─────────────────────────────────────────────── */
type TypeStats = { attempts: number; uniqueStudents: number; avgScore: number; utilizationPct: number }
type OverviewData = {
  totalStudents: number
  month:         number
  year:          number
  topicBased:    TypeStats
  resumeBased:   TypeStats
}

/* ─── Constants ─────────────────────────────────────────── */
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const TYPES = [
  { key: 'topicBased',  label: 'Topic Based',  icon: FaMicrophone, color: '#a855f7' },
  { key: 'resumeBased', label: 'Resume Based',  icon: FaFileAlt,    color: '#f59e0b' },
] as const

const S = {
  select: { background: '#111', border: '1px solid #2a2a2a', color: '#ccc', borderRadius: 7, padding: '5px 10px', fontSize: '0.78rem', cursor: 'pointer' } as React.CSSProperties,
  goBtn:  { background: '#ff6b00', border: 'none', color: '#fff', borderRadius: 7, padding: '5px 14px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' } as React.CSSProperties,
}

/* ─── Component ─────────────────────────────────────────── */
const AIInterviewWidget = ({ apiBase = '/api/institute' }: { apiBase?: string }) => {
  const { user } = useAuthContext()
  const baseURL  = import.meta.env.VITE_API_BASE_URL

  const now = new Date()
  const [selMonth, setSelMonth] = useState(now.getMonth() + 1)
  const [selYear,  setSelYear]  = useState(now.getFullYear())

  const [data, setData]       = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)

  const doFetch = (month: number, year: number) => {
    if (!user?.token) return
    setLoading(true)
    fetch(`${baseURL}${apiBase}/ai-interview-overview?month=${month}&year=${year}`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((r) => r.json())
      .then((d) => { if (d.success) setData(d) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!user?.token) return
    doFetch(now.getMonth() + 1, now.getFullYear())
  }, [user?.token]) // eslint-disable-line

  const handleGo = () => doFetch(selMonth, selYear)

  const monthLabel = data ? `${MONTH_NAMES[data.month - 1]} ${data.year}` : ''
  const yearRange  = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i)

  /* Top type = highest utilizationPct */
  const topKey = data
    ? (data.topicBased.utilizationPct >= data.resumeBased.utilizationPct ? 'topicBased' : 'resumeBased')
    : null

  return (
    <div style={{
      background: '#141414', border: '1px solid #222',
      borderRadius: 16, overflow: 'hidden', height: '100%',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* ── Header ── */}
      <div style={{
        padding: '0.85rem 1.25rem', borderBottom: '1px solid #1e1e1e',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap' as const, gap: '0.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ background: 'rgba(168,85,247,0.12)', borderRadius: 8, padding: '6px 8px', display: 'flex' }}>
            <FaRobot size={14} color="#a855f7" />
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>AI Based Interview</div>
            <div style={{ color: '#555', fontSize: '0.7rem' }}>
              {data
                ? `${data.totalStudents} students · ${monthLabel}`
                : 'Monthly interview utilization'}
            </div>
          </div>
        </div>

        {/* Month + Year + Go */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <select style={S.select} value={selMonth} onChange={(e) => setSelMonth(Number(e.target.value))}>
            {MONTH_NAMES.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
          <select style={S.select} value={selYear} onChange={(e) => setSelYear(Number(e.target.value))}>
            {yearRange.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button style={S.goBtn} onClick={handleGo}>Go</button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, padding: '2.5rem' }}>
          <Spinner animation="border" style={{ color: '#ff6b00', width: 22, height: 22 }} />
        </div>
      ) : !data ? (
        <div style={{ textAlign: 'center', color: '#444', padding: '3rem', fontSize: '0.82rem' }}>No data available</div>
      ) : (
        <div style={{ flex: 1, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>

          {/* Two donut rings side by side */}
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-start', padding: '0.5rem 0' }}>
            {TYPES.map(({ key, label, icon: Icon, color }) => {
              const stat  = data[key] as TypeStats
              const isTop = topKey === key && stat.uniqueStudents > 0
              const SIZE  = 90, STROKE = 8, R = (SIZE - STROKE) / 2
              const CIRC  = 2 * Math.PI * R
              const offset = CIRC * (1 - Math.min(stat.utilizationPct, 100) / 100)
              return (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.55rem' }}>
                  {/* Donut ring */}
                  <div style={{ position: 'relative', width: SIZE, height: SIZE }}>
                    <svg width={SIZE} height={SIZE} style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="#1e1e1e" strokeWidth={STROKE} />
                      <circle
                        cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none"
                        stroke={isTop ? color : `${color}66`}
                        strokeWidth={isTop ? STROKE + 2 : STROKE}
                        strokeDasharray={CIRC}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                      />
                    </svg>
                    <div style={{
                      position: 'absolute', inset: 0,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
                    }}>
                      <Icon size={14} color={isTop ? color : '#444'} />
                      <span style={{ color: isTop ? color : '#777', fontWeight: 800, fontSize: '0.85rem', lineHeight: 1 }}>
                        {stat.utilizationPct}%
                      </span>
                    </div>
                  </div>

                  {/* Label + stats */}
                  <div style={{ textAlign: 'center' as const }}>
                    <div style={{ color: isTop ? '#ddd' : '#aaa', fontSize: '0.76rem', fontWeight: isTop ? 700 : 500, marginBottom: 4 }}>
                      {label}
                    </div>
                    <div style={{ fontSize: '0.68rem', marginBottom: 2 }}>
                      <span style={{ color: isTop ? color : '#999', fontWeight: 700 }}>{stat.uniqueStudents}</span>
                      <span style={{ color: '#666' }}> / {data.totalStudents} students</span>
                    </div>
                    <div style={{ fontSize: '0.68rem' }}>
                      <span style={{ color: isTop ? color : '#888', fontWeight: 600 }}>{stat.attempts}</span>
                      <span style={{ color: '#666' }}> attempts</span>
                    </div>
                    {stat.avgScore > 0 && (
                      <div style={{ fontSize: '0.65rem', color: '#555', marginTop: 2 }}>
                        avg <span style={{ color: isTop ? color : '#666', fontWeight: 700 }}>{stat.avgScore}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Summary bar */}
          <div style={{
            background: '#0d0d0d', borderRadius: 10, padding: '0.65rem 1rem',
            display: 'flex', justifyContent: 'space-around', gap: '0.5rem',
          }}>
            <div style={{ textAlign: 'center' as const }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>
                {data.topicBased.attempts + data.resumeBased.attempts}
              </div>
              <div style={{ color: '#444', fontSize: '0.65rem' }}>Total Attempts</div>
            </div>
            <div style={{ width: 1, background: '#1e1e1e' }} />
            <div style={{ textAlign: 'center' as const }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>
                {new Set([data.topicBased.uniqueStudents, data.resumeBased.uniqueStudents]).size > 0
                  ? Math.max(data.topicBased.uniqueStudents, data.resumeBased.uniqueStudents)
                  : 0}
              </div>
              <div style={{ color: '#444', fontSize: '0.65rem' }}>Active Students</div>
            </div>
            <div style={{ width: 1, background: '#1e1e1e' }} />
            <div style={{ textAlign: 'center' as const }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>{data.totalStudents}</div>
              <div style={{ color: '#444', fontSize: '0.65rem' }}>Total Students</div>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}

export default AIInterviewWidget
