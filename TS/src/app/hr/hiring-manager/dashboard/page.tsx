import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiSearch, FiCalendar, FiBell, FiBriefcase, FiUserCheck, FiClock, FiDollarSign, FiAward, FiTrendingUp } from 'react-icons/fi'
import { useAuthContext } from '@/context/useAuthContext'

const GRAY   = '#64748b'
const BLUE   = '#2563eb'
const GREEN  = '#10b981'
const ORANGE = '#f59e0b'
const PURPLE = '#8b5cf6'
const BORDER = '#e2e8f0'

const FUNNEL_COLORS = ['#2563eb', '#3b82f6', '#22c55e', '#16a34a', '#f59e0b', '#ef4444', '#dc2626', '#b91c1c']

interface DashboardStats {
  openPositions: number
  candidatesAwaitingReview: number
  technicalApprovalsPending: number
  hrApprovalsPending: number
  offersAwaitingApproval: number
  positionsFilled: number
  avgTimeToHireDays: number | null
  funnel: { name: string; count: number }[]
}

interface OpenPositionRow {
  _id: string
  title: string
  openings: number
  applied: number
  inProgress: number
}

const EMPTY_STATS: DashboardStats = {
  openPositions: 0, candidatesAwaitingReview: 0, technicalApprovalsPending: 0,
  hrApprovalsPending: 0, offersAwaitingApproval: 0, positionsFilled: 0, avgTimeToHireDays: null, funnel: [],
}

const HMDashboardPage = () => {
  const navigate = useNavigate()
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()
  const token = (user as any)?.token as string | undefined

  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS)
  const [positions, setPositions] = useState<OpenPositionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const memberName = (user as any)?.fullName || (user as any)?.name || 'Hiring Manager'

  useEffect(() => {
    if (!baseURL || !token) return
    setLoading(true)
    Promise.all([
      fetch(`${baseURL}/hiring-manager/dashboard-stats`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
        .then(r => (r.ok ? r.json() : Promise.reject(new Error('Failed to load dashboard')))),
      fetch(`${baseURL}/hiring-manager/open-positions`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
        .then(r => (r.ok ? r.json() : [])),
    ])
      .then(([statsData, positionsData]) => {
        setStats({ ...EMPTY_STATS, ...statsData })
        setPositions(Array.isArray(positionsData) ? positionsData : [])
        setLoadError('')
      })
      .catch(e => setLoadError(e.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [baseURL, token])

  const inputBase = { border: `1px solid ${BORDER}`, borderRadius: 8, background: '#fff', color: '#334155', colorScheme: 'light' as const }

  const cards = [
    { label: 'Open Positions', value: stats.openPositions, icon: <FiBriefcase size={16}/>, ic: BLUE, bg: '#eff6ff', onClick: () => navigate('/hr/hiring-manager/jobs') },
    { label: 'Candidates Awaiting Review', value: stats.candidatesAwaitingReview, icon: <FiUserCheck size={16}/>, ic: PURPLE, bg: '#f5f3ff', onClick: () => navigate('/hr/hiring-manager/candidates') },
    { label: 'Technical Approvals Pending', value: stats.technicalApprovalsPending, icon: <FiClock size={16}/>, ic: ORANGE, bg: '#fff7ed', onClick: () => navigate('/hr/approvals') },
    { label: 'HR Approvals Pending', value: stats.hrApprovalsPending, icon: <FiClock size={16}/>, ic: ORANGE, bg: '#fff7ed', onClick: () => navigate('/hr/approvals') },
    { label: 'Offers Awaiting Approval', value: stats.offersAwaitingApproval, icon: <FiDollarSign size={16}/>, ic: '#0891B2', bg: '#ecfeff', onClick: () => navigate('/hr/approvals') },
    { label: 'Positions Filled', value: stats.positionsFilled, icon: <FiAward size={16}/>, ic: GREEN, bg: '#ecfdf5', onClick: () => navigate('/hr/hiring-manager/jobs') },
    { label: 'Average Time to Hire (Days)', value: stats.avgTimeToHireDays ?? '—', icon: <FiTrendingUp size={16}/>, ic: '#DC2626', bg: '#fef2f2', onClick: () => navigate('/hr/hiring-manager/reports') },
  ]

  const maxFunnelCount = Math.max(1, ...stats.funnel.map(f => f.count))

  return (
    <div style={{ minHeight: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' }}>Dashboard</h1>
          <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: GRAY }}>Hiring overview across every open position.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <FiSearch size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}/>
            <input placeholder="Search…" style={{ ...inputBase, paddingLeft: 32, paddingRight: 12, height: 36, width: 220, fontSize: '0.8rem', outline: 'none' }} />
          </div>
          <button style={{ width: 36, height: 36, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' }}>
            <FiCalendar size={15}/>
          </button>
          <button style={{ width: 36, height: 36, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' }}>
            <FiBell size={15}/>
          </button>
        </div>
      </div>

      {loadError && <div style={{ background: '#fef2f2', color: '#dc2626', fontSize: '0.82rem', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>{loadError}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 16 }}>
        {cards.map(c => (
          <div
            key={c.label}
            style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', border: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.ic, flexShrink: 0 }}>{c.icon}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>{loading ? '…' : c.value}</div>
                <div style={{ fontSize: '0.7rem', color: GRAY, marginTop: 2 }}>{c.label}</div>
              </div>
            </div>
            <button onClick={c.onClick} style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, color: BLUE, cursor: 'pointer', textDecoration: 'underline' }}>
              View all
            </button>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.2fr)', gap: 16, alignItems: 'flex-start' }}>
        {/* Hiring Funnel */}
        <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, padding: 20 }}>
          <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Hiring Funnel</div>
          {!loading && stats.funnel.length === 0 && (
            <div style={{ fontSize: '0.8rem', color: GRAY, textAlign: 'center', padding: '30px 0' }}>No pipeline stages configured yet.</div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {stats.funnel.map((stage, idx) => {
              const widthPct = Math.max(12, Math.round((stage.count / maxFunnelCount) * 100))
              return (
                <div key={stage.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                    <div style={{
                      width: `${widthPct}%`, minWidth: 60, height: 34, background: FUNNEL_COLORS[idx % FUNNEL_COLORS.length],
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.76rem', fontWeight: 700,
                      borderRadius: 4, transition: 'width 0.2s',
                    }}>
                      {stage.count}
                    </div>
                  </div>
                  <div style={{ width: 130, fontSize: '0.74rem', color: '#334155', fontWeight: 500, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stage.name}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* My Open Positions */}
        <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${BORDER}` }}>
            <span style={{ fontSize: '0.94rem', fontWeight: 700, color: '#0f172a' }}>My Open Positions</span>
            <button onClick={() => navigate('/hr/hiring-manager/jobs')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.76rem', fontWeight: 600, color: BLUE }}>View all jobs →</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '36%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '10%' }} />
              </colgroup>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Job Title', 'Openings', 'Applied', 'In Progress', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px', fontSize: '0.7rem', fontWeight: 600, color: GRAY, textAlign: 'left', borderBottom: `1px solid ${BORDER}`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!loading && positions.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: '32px 16px', textAlign: 'center', fontSize: '0.82rem', color: GRAY }}>No open positions.</td></tr>
                )}
                {loading && (
                  <tr><td colSpan={5} style={{ padding: '32px 16px', textAlign: 'center', fontSize: '0.82rem', color: GRAY }}>Loading…</td></tr>
                )}
                {!loading && positions.map(p => (
                  <tr key={p._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px', fontSize: '0.78rem', fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</td>
                    <td style={{ padding: '10px', fontSize: '0.78rem', color: '#334155' }}>{p.openings}</td>
                    <td style={{ padding: '10px', fontSize: '0.78rem', color: '#334155' }}>{p.applied}</td>
                    <td style={{ padding: '10px', fontSize: '0.78rem', color: '#334155' }}>{p.inProgress}</td>
                    <td style={{ padding: '10px' }}>
                      <button onClick={() => navigate('/hr/hiring-manager/jobs')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.76rem', fontWeight: 600, color: BLUE }}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HMDashboardPage
