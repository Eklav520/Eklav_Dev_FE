import { useEffect, useState } from 'react'
import { Spinner } from 'react-bootstrap'
import { FaClipboardList, FaTrophy, FaArrowDown } from 'react-icons/fa'
import { useAuthContext } from '@/context/useAuthContext'

/* ─── Types ─────────────────────────────────────────────── */
type Scorer = { name: string; email: string; percentage: number; score: number; resultStatus: string }
type AssessmentItem = {
  examId: string; title: string; createdAt: string
  total: number; passed: number; failed: number; avgPercentage: number
  topScorers: Scorer[]; lowScorers: Scorer[]
}

/* ─── Component ─────────────────────────────────────────── */
const AssessmentWidget = ({ apiBase = '/api/institute' }: { apiBase?: string }) => {
  const { user } = useAuthContext()
  const baseURL  = import.meta.env.VITE_API_BASE_URL

  const [data, setData]       = useState<AssessmentItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.token) return
    fetch(`${baseURL}${apiBase}/assessment-overview`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((r) => r.json())
      .then((d) => { if (d.success) setData(d.assessments) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user?.token]) // eslint-disable-line

  /* Use only the latest assessment */
  const latest = data[0] ?? null

  return (
    <div style={{
      background: '#141414', border: '1px solid #222',
      borderRadius: 16, overflow: 'hidden', height: '100%',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* ── Header ── */}
      <div style={{
        padding: '0.85rem 1.25rem', borderBottom: '1px solid #1e1e1e',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ background: 'rgba(6,182,212,0.12)', borderRadius: 8, padding: '6px 8px', display: 'flex' }}>
            <FaClipboardList size={14} color="#ff6b00" />
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>Latest Assessment</div>
            <div style={{ color: '#555', fontSize: '0.7rem' }}>
              {latest ? latest.title : 'Top & Low scorers'}
            </div>
          </div>
        </div>
        {latest && (
          <div style={{ color: '#444', fontSize: '0.68rem', whiteSpace: 'nowrap' as const }}>
            {new Date(latest.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, padding: '2.5rem' }}>
          <Spinner animation="border" style={{ color: '#ff6b00', width: 22, height: 22 }} />
        </div>
      ) : !latest ? (
        <div style={{ textAlign: 'center', color: '#444', padding: '3rem', fontSize: '0.82rem' }}>No assessments found</div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem 1.25rem', gap: '1rem' }}>

          {/* ── Stats strip ── */}
          <div style={{
            background: '#0d0d0d', borderRadius: 10,
            display: 'flex', justifyContent: 'space-around', padding: '0.65rem 0.5rem',
          }}>
            {[
              { label: 'Attended', value: latest.total,          color: '#888'    },
              { label: 'Passed',   value: latest.passed,         color: '#22c55e' },
              { label: 'Failed',   value: latest.failed,         color: '#ef4444' },
              { label: 'Avg Score',value: `${latest.avgPercentage}%`, color: '#ff6b00' },
            ].map((s, i, arr) => (
              <div key={s.label} style={{ textAlign: 'center' as const, display: 'flex', alignItems: 'center', gap: 0 }}>
                <div>
                  <div style={{ color: s.color, fontWeight: 800, fontSize: '1rem', lineHeight: 1 }}>{s.value}</div>
                  <div style={{ color: '#444', fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.05em', marginTop: 3 }}>
                    {s.label.toUpperCase()}
                  </div>
                </div>
                {i < arr.length - 1 && <div style={{ width: 1, background: '#1e1e1e', height: 28, marginLeft: '0.75rem' }} />}
              </div>
            ))}
          </div>

          {/* ── Scorers (side by side) ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', flex: 1 }}>

            {/* Top Scorers */}
            <div style={{
              background: '#0a1a0a', border: '1px solid #1a3a1a',
              borderRadius: 12, padding: '0.85rem',
              borderTop: '3px solid #22c55e',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.75rem' }}>
                <FaTrophy size={11} color="#22c55e" />
                <span style={{ color: '#22c55e', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
                  Top Scorers
                </span>
              </div>

              {latest.topScorers.length === 0 ? (
                <div style={{ color: '#2a2a2a', fontSize: '0.72rem', textAlign: 'center' as const, paddingTop: '0.5rem' }}>No data</div>
              ) : latest.topScorers.map((s, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.38rem 0',
                  borderBottom: i < latest.topScorers.length - 1 ? '1px solid #0f2a0f' : 'none',
                }}>
                  {/* Rank badge */}
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                    background: i === 0 ? '#FFD70020' : i === 1 ? '#C0C0C020' : i === 2 ? '#CD7F3220' : '#22c55e10',
                    border: `1px solid ${i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : '#22c55e33'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.55rem', fontWeight: 800,
                    color: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : '#22c55e',
                  }}>
                    {i + 1}
                  </div>
                  {/* Name */}
                  <span style={{
                    flex: 1, color: i < 3 ? '#ddd' : '#999', fontSize: '0.73rem', fontWeight: i < 3 ? 600 : 400,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
                  }}>
                    {s.name}
                  </span>
                  {/* Score */}
                  <span style={{
                    color: '#22c55e', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0,
                  }}>
                    {s.percentage}%
                  </span>
                </div>
              ))}
            </div>

            {/* Low Scorers */}
            <div style={{
              background: '#1a0a0a', border: '1px solid #3a1a1a',
              borderRadius: 12, padding: '0.85rem',
              borderTop: '3px solid #ef4444',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.75rem' }}>
                <FaArrowDown size={11} color="#ef4444" />
                <span style={{ color: '#ef4444', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
                  Need Improvement
                </span>
              </div>

              {latest.lowScorers.length === 0 ? (
                <div style={{ color: '#2a2a2a', fontSize: '0.72rem', textAlign: 'center' as const, paddingTop: '0.5rem' }}>No data</div>
              ) : latest.lowScorers.map((s, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.38rem 0',
                  borderBottom: i < latest.lowScorers.length - 1 ? '1px solid #2a0f0f' : 'none',
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                    background: '#ef444410', border: '1px solid #ef444433',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.55rem', fontWeight: 800, color: '#ef4444',
                  }}>
                    {i + 1}
                  </div>
                  <span style={{
                    flex: 1, color: '#888', fontSize: '0.73rem',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
                  }}>
                    {s.name}
                  </span>
                  <span style={{ color: '#ef4444', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>
                    {s.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}

export default AssessmentWidget
