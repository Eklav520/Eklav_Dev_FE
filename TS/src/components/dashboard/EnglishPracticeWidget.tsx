import { useEffect, useState } from 'react'
import { Spinner } from 'react-bootstrap'
import { FaMicrophone, FaPencilAlt, FaBook, FaHeadphones, FaBolt, FaLanguage, FaTrophy } from 'react-icons/fa'
import { useAuthContext } from '@/context/useAuthContext'

/* ─── Types ─────────────────────────────────────────────── */
type SkillStat = { utilized: number; capacity: number; utilizationPct: number; avgScore: number }
type OverviewData = {
  totalStudents:   number
  approvedStudents: number
  monthlyCapacity: number
  monthKey:        string | null
  skills: { speaking: SkillStat; writing: SkillStat; reading: SkillStat; listening: SkillStat; jam: SkillStat }
}

/* ─── Constants ─────────────────────────────────────────── */
const SKILLS = [
  { key: 'speaking',  label: 'Speaking',     icon: FaMicrophone, color: '#3b82f6' },
  { key: 'writing',   label: 'Writing',       icon: FaPencilAlt,  color: '#f59e0b' },
  { key: 'reading',   label: 'Reading',       icon: FaBook,       color: '#22c55e' },
  { key: 'listening', label: 'Listening',     icon: FaHeadphones, color: '#a855f7' },
  { key: 'jam',       label: 'Just a Minute', icon: FaBolt,       color: '#ef4444' },
] as const

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const S = {
  select: { background: '#111', border: '1px solid #2a2a2a', color: '#ccc', borderRadius: 7, padding: '5px 10px', fontSize: '0.78rem', cursor: 'pointer' } as React.CSSProperties,
  goBtn:  { background: '#ff6b00', border: 'none', color: '#fff', borderRadius: 7, padding: '5px 14px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' } as React.CSSProperties,
}

/* ─── Component ─────────────────────────────────────────── */
const EnglishPracticeWidget = ({ apiBase = '/api/institute' }: { apiBase?: string }) => {
  const { user } = useAuthContext()
  const baseURL  = import.meta.env.VITE_API_BASE_URL

  const now = new Date()
  const [selMonth, setSelMonth]     = useState(now.getMonth() + 1)
  const [selYear,  setSelYear]      = useState(now.getFullYear())
  const [appliedKey, setAppliedKey] = useState('')

  const [data, setData]       = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)

  const doFetch = (monthKey: string) => {
    if (!user?.token) return
    setLoading(true)
    fetch(`${baseURL}${apiBase}/english-practice-overview?monthKey=${monthKey}`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((r) => r.json())
      .then((d) => { if (d.success) setData(d) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!user?.token) return
    const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    setAppliedKey(key)
    doFetch(key)
  }, [user?.token]) // eslint-disable-line

  const handleGo = () => {
    const key = `${selYear}-${String(selMonth).padStart(2, '0')}`
    setAppliedKey(key)
    doFetch(key)
  }

  const monthLabel = appliedKey
    ? `${MONTH_NAMES[parseInt(appliedKey.split('-')[1]) - 1]} ${appliedKey.split('-')[0]}`
    : ''

  /* Top utilized = highest utilizationPct */
  const topSkill = data
    ? [...SKILLS].sort((a, b) => (data.skills[b.key]?.utilizationPct ?? 0) - (data.skills[a.key]?.utilizationPct ?? 0))[0]
    : null

  const yearRange = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i)

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
          <div style={{ background: 'rgba(59,130,246,0.12)', borderRadius: 8, padding: '6px 8px', display: 'flex' }}>
            <FaLanguage size={14} color="#3b82f6" />
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>English Practice</div>
            <div style={{ color: '#555', fontSize: '0.7rem' }}>
              {data
                ? `${data.approvedStudents} approved · ${data.monthlyCapacity.toLocaleString()} attempts capacity · ${monthLabel}`
                : 'Monthly attempt utilization by skill'}
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
        <div style={{ flex: 1, padding: '0.9rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

          {/* Top utilized badge */}
          {topSkill && data.skills[topSkill.key].utilized > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: `${topSkill.color}10`, border: `1px solid ${topSkill.color}30`,
              borderRadius: 10, padding: '0.45rem 0.85rem',
            }}>
              <FaTrophy size={12} color="#FFD700" />
              <topSkill.icon size={11} color={topSkill.color} />
              <span style={{ color: topSkill.color, fontWeight: 700, fontSize: '0.78rem' }}>{topSkill.label}</span>
              <span style={{ color: '#555', fontSize: '0.72rem' }}>most utilized in {monthLabel}</span>
              <span style={{ marginLeft: 'auto', color: topSkill.color, fontWeight: 700, fontSize: '0.78rem' }}>
                {data.skills[topSkill.key].utilizationPct}%
              </span>
            </div>
          )}

          {/* Skill circles */}
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-start', padding: '0.25rem 0' }}>
            {SKILLS.map(({ key, label, icon: Icon, color }) => {
              const stat   = data.skills[key] as SkillStat
              const isTop  = topSkill?.key === key && stat.utilized > 0
              const SIZE   = 76, STROKE = 7, R = (SIZE - STROKE) / 2
              const CIRC   = 2 * Math.PI * R
              const offset = CIRC * (1 - Math.min(stat.utilizationPct, 100) / 100)
              return (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.45rem' }}>
                  {/* Donut ring */}
                  <div style={{ position: 'relative', width: SIZE, height: SIZE }}>
                    <svg width={SIZE} height={SIZE} style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="#1e1e1e" strokeWidth={STROKE} />
                      <circle
                        cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none"
                        stroke={isTop ? color : `${color}66`}
                        strokeWidth={isTop ? STROKE + 1.5 : STROKE}
                        strokeDasharray={CIRC}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                      />
                    </svg>
                    {/* Center: icon + pct */}
                    <div style={{
                      position: 'absolute', inset: 0,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                    }}>
                      <Icon size={12} color={isTop ? color : '#444'} />
                      <span style={{ color: isTop ? color : '#777', fontWeight: 800, fontSize: '0.75rem', lineHeight: 1 }}>
                        {stat.utilizationPct}%
                      </span>
                    </div>
                  </div>
                  {/* Label + count */}
                  <div style={{ textAlign: 'center' as const }}>
                    <div style={{ color: isTop ? '#ddd' : '#777', fontSize: '0.7rem', fontWeight: isTop ? 700 : 500, marginBottom: 2 }}>
                      {label}
                    </div>
                    <div style={{ fontSize: '0.62rem' }}>
                      <span style={{ color: isTop ? color : '#666', fontWeight: 700 }}>{stat.utilized}</span>
                      <span style={{ color: '#444' }}> / {stat.capacity.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

        </div>
      )}
    </div>
  )
}

export default EnglishPracticeWidget
