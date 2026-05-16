import { useEffect, useState } from 'react'
import { Spinner } from 'react-bootstrap'
import { FaBookOpen, FaTrophy, FaArrowDown } from 'react-icons/fa'
import { useAuthContext } from '@/context/useAuthContext'

type Course = {
  rank: number
  courseId: string
  title: string
  image: string | null
  count: number
}

const truncate = (str: string, max = 38) =>
  str.length > max ? str.slice(0, max) + '…' : str

const rankColor = (rank: number) => {
  if (rank === 1) return '#FFD700'
  if (rank === 2) return '#C0C0C0'
  if (rank === 3) return '#CD7F32'
  return '#444'
}

/* ─── Single course row ──────────────────────────────────── */
const CourseRow = ({ c, side }: { c: Course; side: 'top' | 'bottom' }) => {
  const isTop   = side === 'top'
  const accent  = isTop ? '#22c55e' : '#ef4444'
  const countBg = isTop ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.10)'

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
          background: c.rank <= 3 ? `${rankColor(c.rank)}22` : '#1a1a1a',
          border: `1px solid ${c.rank <= 3 ? rankColor(c.rank) : '#2a2a2a'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.68rem',
          fontWeight: 700,
          color: c.rank <= 3 ? rankColor(c.rank) : '#444',
          flexShrink: 0,
        }}
      >
        {c.rank}
      </div>

      {/* Course thumbnail */}
      {c.image ? (
        <img
          src={c.image}
          alt=""
          style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
        />
      ) : (
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            background: '#2a2a2a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <FaBookOpen size={12} color="#444" />
        </div>
      )}

      {/* Title */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          color: '#e0e0e0',
          fontWeight: 600,
          fontSize: '0.82rem',
        }}
        title={c.title}
      >
        {truncate(c.title)}
      </div>

      {/* Count badge */}
      <div
        style={{
          background: countBg,
          color: accent,
          border: `1px solid ${accent}22`,
          borderRadius: 6,
          padding: '2px 9px',
          fontSize: '0.72rem',
          fontWeight: 700,
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}
      >
        {c.count} enrolled
      </div>
    </div>
  )
}

/* ─── Main Component ─────────────────────────────────────── */
const CourseEnrollmentTrend = ({
  apiBase = '/api/institute',
  onFullDetails,
}: {
  apiBase?: string
  onFullDetails?: () => void
}) => {
  const { user } = useAuthContext()
  const baseURL  = import.meta.env.VITE_API_BASE_URL

  const [top, setTop]           = useState<Course[]>([])
  const [bottom, setBottom]     = useState<Course[]>([])
  const [totalCourses, setTotal] = useState(0)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!user?.token) return
    setLoading(true)
    fetch(`${baseURL}${apiBase}/trend/course-enrollment?top=10`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setTop(data.topCourses)
          setBottom(data.bottomCourses)
          setTotal(data.totalCourses)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user?.token, baseURL, apiBase])

  return (
    <div
      style={{
        background: '#141414',
        border: '1px solid #222',
        borderRadius: 16,
        overflow: 'hidden',
        height: '100%',
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
            <FaBookOpen size={14} color="#ff6b00" />
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>
              Course Enrollment
            </div>
            <div style={{ color: '#555', fontSize: '0.7rem' }}>
              Trending &amp; low enrolled · {totalCourses} course{totalCourses !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {onFullDetails && (
          <button
            onClick={onFullDetails}
            style={{
              background: '#ff6b00',
              border: 'none',
              color: '#fff',
              borderRadius: 8,
              padding: '5px 16px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Full Details
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Spinner animation="border" style={{ color: '#ff6b00', width: 22, height: 22 }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>

          {/* Top enrolled */}
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
              <FaTrophy size={12} color="#22c55e" />
              <span style={{ color: '#22c55e', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
                Trending Enrolled
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
              {top.map((c) => (
                <CourseRow key={c.courseId} c={c} side="top" />
              ))}
            </div>
          </div>

          {/* Lowest enrolled */}
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
                Low Enrolled
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
              {bottom.map((c) => (
                <CourseRow key={c.courseId} c={c} side="bottom" />
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}

export default CourseEnrollmentTrend
