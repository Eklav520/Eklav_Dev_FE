'use client'
import { useEffect, useState } from 'react'
import { Spinner } from 'react-bootstrap'
import { FaCode } from 'react-icons/fa'
import { useAuthContext } from '@/context/useAuthContext'

type DiffBreakdown = { Easy: number; Medium: number; Hard: number }
type TrendPoint    = { date: string; count: number }
type TopProblem    = { problemId: string; title: string; count: number; difficulty: string }

type TotalProblems = { Easy: number; Medium: number; Hard: number; total: number }
type OverviewData = {
  totalCompleted:  number
  uniqueStudents:  number
  uniqueProblems:  number
  totalProblems:   TotalProblems
  diffBreakdown:   DiffBreakdown
  trend:           TrendPoint[]
  topProblems:     TopProblem[]
}

const DIFF_COLOR: Record<string, string> = {
  Easy:   '#22c55e',
  Medium: '#f59e0b',
  Hard:   '#ef4444',
}

const CodeChallengeWidget = ({ apiBase = '/api/adminDashboardCharts' }: { apiBase?: string }) => {
  const { user } = useAuthContext() as any
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const [data, setData]     = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')

  useEffect(() => {
    if (!user?.token) return
    setLoading(true)
    fetch(`${baseURL}${apiBase}/code-challenge-overview`, {
      headers: { Authorization: `Bearer ${user.token}` },
      cache: 'no-store',
    })
      .then(r => r.json())
      .then(d => { if (d.success) setData(d); else setError(d.message || 'Failed') })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false))
  }, [apiBase, user?.token])

  const card: React.CSSProperties = {
    background: '#141414', border: '1px solid #222', borderRadius: 14, padding: '1.25rem', height: '100%',
  }
  const statBox: React.CSSProperties = {
    background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 10,
    padding: '0.9rem 1rem', textAlign: 'center',
  }

  if (loading) return (
    <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320 }}>
      <Spinner animation="border" size="sm" style={{ color: '#ff6b00' }} />
    </div>
  )
  if (error || !data) return (
    <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320, color: '#555', fontSize: '0.85rem' }}>
      {error || 'No data'}
    </div>
  )

  const total = (data.diffBreakdown.Easy + data.diffBreakdown.Medium + data.diffBreakdown.Hard) || 1

  return (
    <div style={card}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.25rem' }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FaCode size={17} color="#6366f1" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>Code Challenge</div>
          <div style={{ fontSize: '0.72rem', color: '#555' }}>Easy · Medium · Hard</div>
        </div>
      </div>

      {/* 3 stat boxes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: '1.25rem' }}>
        {[
          { label: 'Total Programs', value: data.totalProblems?.total ?? 0, color: '#6366f1' },
          { label: 'Total Solved',   value: data.totalCompleted,             color: '#818cf8' },
          { label: 'Students',       value: data.uniqueStudents,             color: '#22c55e' },
        ].map(s => (
          <div key={s.label} style={statBox}>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: '0.68rem', color: '#555', marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Difficulty bars */}
      <div>
        <div style={{ fontSize: '0.72rem', color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
          Difficulty Breakdown
        </div>
        {(['Easy', 'Medium', 'Hard'] as const).map(d => {
          const avail = data.totalProblems?.[d] || 1
          const solved = data.diffBreakdown[d]
          const pct = Math.round((solved / avail) * 100)
          return (
            <div key={d} style={{ marginBottom: 7 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: '0.75rem', color: DIFF_COLOR[d], fontWeight: 600 }}>{d}</span>
                <span style={{ fontSize: '0.75rem', color: '#666' }}>
                  {solved}<span style={{ color: '#333' }}>/{data.totalProblems?.[d] ?? '?'}</span>
                  <span style={{ color: '#444', marginLeft: 4 }}>({pct}%)</span>
                </span>
              </div>
              <div style={{ height: 6, background: '#111', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: DIFF_COLOR[d], borderRadius: 3, transition: 'width 0.6s ease' }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default CodeChallengeWidget
