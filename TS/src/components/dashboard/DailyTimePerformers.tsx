import { useEffect, useState } from 'react'
import { Spinner } from 'react-bootstrap'
import { FaClock, FaMedal, FaArrowDown } from 'react-icons/fa'
import { useAuthContext } from '@/context/useAuthContext'

type Performer = {
  rank: number
  userId: string
  name: string
  email: string
  minutes: number
  loginAt: string | null
}

const toDateStr = (d = new Date()) => d.toISOString().slice(0, 10)

const fmtMin = (mins: number) => {
  if (mins === 0) return '0m'
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

const rankColor = (rank: number) => {
  if (rank === 1) return '#FFD700'
  if (rank === 2) return '#C0C0C0'
  if (rank === 3) return '#CD7F32'
  return '#444'
}

/* ─── Single performer row ───────────────────────────────── */
const Row = ({ p, side }: { p: Performer; side: 'top' | 'bottom' }) => {
  const isTop    = side === 'top'
  const accent   = isTop ? '#ff6b00' : '#ef4444'
  const timeBg   = isTop
    ? p.minutes > 0 ? 'rgba(255,107,0,0.12)' : 'rgba(255,255,255,0.04)'
    : 'rgba(239,68,68,0.10)'
  const timeColor = isTop
    ? p.minutes > 0 ? '#ff6b00' : '#444'
    : '#ef4444'

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        padding: '0.55rem 0.9rem',
        borderRadius: 8,
        background: 'transparent',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#1e1e1e')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Rank */}
      <div
        style={{
          minWidth: 26,
          height: 26,
          borderRadius: '50%',
          background: p.rank <= 3 ? `${rankColor(p.rank)}22` : '#1a1a1a',
          border: `1px solid ${p.rank <= 3 ? rankColor(p.rank) : '#2a2a2a'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.68rem',
          fontWeight: 700,
          color: p.rank <= 3 ? rankColor(p.rank) : '#444',
          flexShrink: 0,
        }}
      >
        {p.rank}
      </div>

      {/* Name + email */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            color: '#e0e0e0',
            fontWeight: 600,
            fontSize: '0.82rem',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {p.name}
        </div>
        <div
          style={{
            color: '#444',
            fontSize: '0.7rem',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {p.email}
        </div>
      </div>

      {/* Time badge */}
      <div
        style={{
          background: timeBg,
          color: timeColor,
          border: `1px solid ${accent}22`,
          borderRadius: 6,
          padding: '2px 9px',
          fontSize: '0.72rem',
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {fmtMin(p.minutes)}
      </div>
    </div>
  )
}

/* ─── Main Component ─────────────────────────────────────── */
const DailyTimePerformers = ({ apiBase = '/api/institute' }: { apiBase?: string }) => {
  const { user } = useAuthContext()
  const baseURL  = import.meta.env.VITE_API_BASE_URL

  const [date, setDate]               = useState(toDateStr())
  const [appliedDate, setAppliedDate] = useState(toDateStr())
  const [top, setTop]                 = useState<Performer[]>([])
  const [bottom, setBottom]           = useState<Performer[]>([])
  const [totalStudents, setTotal]     = useState(0)
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    if (!user?.token) return
    setLoading(true)
    fetch(`${baseURL}${apiBase}/trend/daily-time?date=${appliedDate}&top=10`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setTop(data.topPerformers)
          setBottom(data.bottomPerformers)
          setTotal(data.totalStudents)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user?.token, baseURL, apiBase, appliedDate])

  return (
    <div
      style={{
        background: '#141414',
        border: '1px solid #222',
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid #1e1e1e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap' as const,
          gap: '0.6rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div
            style={{
              background: 'rgba(255,107,0,0.12)',
              borderRadius: 8,
              padding: '6px 8px',
              display: 'flex',
            }}
          >
            <FaClock size={14} color="#ff6b00" />
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>
              Daily Time Spent
            </div>
            <div style={{ color: '#555', fontSize: '0.7rem' }}>
              Top &amp; bottom performers · {totalStudents} student{totalStudents !== 1 ? 's' : ''}
              {totalStudents < 40 && totalStudents > 0 && (
                <span style={{ color: '#3a3a3a', marginLeft: 6 }}>
                  (showing {Math.floor(totalStudents / 2)} each side)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Date picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="date"
            value={date}
            max={toDateStr()}
            onChange={(e) => setDate(e.target.value)}
            style={{
              background: '#1a1a1a',
              border: '1px solid #2a2a2a',
              color: '#fff',
              borderRadius: 8,
              padding: '4px 10px',
              fontSize: '0.78rem',
              colorScheme: 'dark',
            }}
          />
          <button
            onClick={() => setAppliedDate(date)}
            style={{
              background: '#ff6b00',
              border: 'none',
              color: '#fff',
              borderRadius: 8,
              padding: '4px 14px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Go
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Spinner animation="border" style={{ color: '#ff6b00', width: 22, height: 22 }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>

          {/* Top performers */}
          <div style={{ borderRight: '1px solid #1e1e1e' }}>
            <div
              style={{
                padding: '0.6rem 0.9rem',
                borderBottom: '1px solid #1e1e1e',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <FaMedal size={12} color="#ff6b00" />
              <span style={{ color: '#ff6b00', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
                Top Performers
              </span>
            </div>
            <div
              style={{
                height: 224,
                overflowY: 'auto',
                padding: '0.4rem 0',
                scrollbarWidth: 'thin',
                scrollbarColor: '#2a2a2a #141414',
              }}
            >
              {top.map((p) => (
                <Row key={p.userId} p={p} side="top" />
              ))}
            </div>
          </div>

          {/* Bottom performers */}
          <div>
            <div
              style={{
                padding: '0.6rem 0.9rem',
                borderBottom: '1px solid #1e1e1e',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <FaArrowDown size={12} color="#ef4444" />
              <span style={{ color: '#ef4444', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
                Lowest Activity
              </span>
            </div>
            <div
              style={{
                height: 224,
                overflowY: 'auto',
                padding: '0.4rem 0',
                scrollbarWidth: 'thin',
                scrollbarColor: '#2a2a2a #141414',
              }}
            >
              {bottom.map((p) => (
                <Row key={p.userId} p={p} side="bottom" />
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}

export default DailyTimePerformers
