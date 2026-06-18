import React, { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import PageMetaData from '@/components/PageMetaData'
import { useAuthContext } from '@/context/useAuthContext'

function formatSecs(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, '0')
  const sec = (s % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
}

const CAT: Record<string, { color: string; bg: string }> = {
  Aptitude:  { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  Reasoning: { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  Technical: { color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  Puzzle:    { color: '#fb923c', bg: 'rgba(251,146,60,0.12)' },
}

const CAT_ICON: Record<string, string> = {
  Aptitude: '🧮', Reasoning: '🧩', Technical: '💻', Puzzle: '🔮',
}

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }
const pctColor = (p: number) => p >= 70 ? '#34d399' : p >= 40 ? '#fbbf24' : '#f87171'
const pctLabel = (p: number) => p >= 70 ? 'Excellent' : p >= 40 ? 'Average' : 'Needs Improvement'

// ── Student Detail Modal ──────────────────────────────────────────────────────
const StudentModal: React.FC<{ attempt: any; onClose: () => void }> = ({ attempt, onClose }) => {
  const cat = CAT[attempt.category] ?? { color: '#888', bg: 'rgba(136,136,136,0.1)' }
  const p = attempt.percentage ?? 0
  const circumference = 2 * Math.PI * 54

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 720,
          background: '#0e0e1c',
          border: '1px solid #1e1e30',
          borderRadius: 20,
          boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,122,0,0.08)',
          overflow: 'hidden',
          animation: 'ia-modal-in 0.22s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        <style>{`
          @keyframes ia-modal-in { from { opacity:0; transform:scale(0.92) translateY(12px); } to { opacity:1; transform:scale(1) translateY(0); } }
        `}</style>

        {/* Header */}
        <div style={{
          padding: '22px 28px',
          background: `linear-gradient(135deg, ${cat.bg}, rgba(14,14,28,0))`,
          borderBottom: '1px solid #1a1a2a',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 50, height: 50, borderRadius: 14, fontSize: 24,
              background: cat.bg, border: `1.5px solid ${cat.color}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {CAT_ICON[attempt.category] ?? '📝'}
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 18, color: '#e0e0f0' }}>{attempt.studentName}</div>
              <div style={{ fontSize: 12, color: '#44445a', marginTop: 2 }}>{attempt.studentEmail}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 34, height: 34, borderRadius: 10, border: '1px solid #2a2a3a',
              background: 'transparent', color: '#555', fontSize: 18, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              lineHeight: 1,
            }}
          >✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '28px 28px 32px' }}>

          {/* Score ring + stats */}
          <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 28, flexWrap: 'wrap' }}>

            {/* Circular progress */}
            <div style={{ flexShrink: 0, position: 'relative', width: 130, height: 130 }}>
              <svg width="130" height="130" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="65" cy="65" r="54" fill="none" stroke="#161626" strokeWidth="10" />
                <circle cx="65" cy="65" r="54" fill="none"
                  stroke={pctColor(p)} strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - p / 100)}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                />
              </svg>
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: pctColor(p), lineHeight: 1 }}>{p}%</div>
                <div style={{ fontSize: 10, color: '#44445a', marginTop: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Score</div>
              </div>
            </div>

            {/* Right stats grid */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Marks Scored', val: `${attempt.score} / ${attempt.total}`, color: pctColor(p), icon: '📝' },
                { label: 'Rank', val: MEDAL[attempt.rank] ? `${MEDAL[attempt.rank]} #${attempt.rank}` : `#${attempt.rank}`, color: attempt.rank <= 3 ? '#fbbf24' : '#e0e0f0', icon: '🏆' },
                { label: 'Time Taken', val: formatSecs(attempt.timeTakenSeconds), color: '#6366f1', icon: '⏱️', mono: true },
                { label: 'Performance', val: pctLabel(p), color: pctColor(p), icon: '📊' },
              ].map(item => (
                <div key={item.label} style={{
                  background: '#12121e', border: '1px solid #1a1a2a',
                  borderRadius: 12, padding: '14px 16px',
                }}>
                  <div style={{ fontSize: 10, color: '#44445a', textTransform: 'uppercase', letterSpacing: 0.7, fontWeight: 600, marginBottom: 6 }}>
                    {item.icon} {item.label}
                  </div>
                  <div style={{
                    fontSize: 18, fontWeight: 900, color: item.color,
                    fontFamily: (item as any).mono ? 'monospace' : 'inherit',
                  }}>{item.val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: '#44445a', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600 }}>Score Breakdown</span>
              <span style={{ fontSize: 12, color: '#44445a' }}>{attempt.score} correct · {attempt.total - attempt.score} wrong · {attempt.total} total</span>
            </div>
            <div style={{ height: 10, borderRadius: 20, background: '#161626', overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: `${p}%`, background: `linear-gradient(90deg, ${pctColor(p)}, ${pctColor(p)}cc)`, borderRadius: 20, transition: 'width 0.8s ease' }} />
            </div>
          </div>

          {/* Details row */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 180px', background: '#12121e', border: '1px solid #1a1a2a', borderRadius: 12, padding: '12px 16px' }}>
              <div style={{ fontSize: 10, color: '#44445a', textTransform: 'uppercase', letterSpacing: 0.7, fontWeight: 600, marginBottom: 4 }}>Category</div>
              <span style={{
                fontSize: 13, fontWeight: 700, padding: '4px 12px', borderRadius: 20,
                background: cat.bg, color: cat.color, border: `1px solid ${cat.color}33`,
              }}>{attempt.category}</span>
            </div>
            <div style={{ flex: '1 1 180px', background: '#12121e', border: '1px solid #1a1a2a', borderRadius: 12, padding: '12px 16px' }}>
              <div style={{ fontSize: 10, color: '#44445a', textTransform: 'uppercase', letterSpacing: 0.7, fontWeight: 600, marginBottom: 4 }}>Submitted At</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#e0e0f0' }}>
                {new Date(attempt.submittedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <div style={{ flex: '1 1 180px', background: '#12121e', border: '1px solid #1a1a2a', borderRadius: 12, padding: '12px 16px' }}>
              <div style={{ fontSize: 10, color: '#44445a', textTransform: 'uppercase', letterSpacing: 0.7, fontWeight: 600, marginBottom: 4 }}>Correct Answers</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#34d399' }}>
                {attempt.score}<span style={{ fontSize: 13, color: '#44445a', fontWeight: 400 }}> / {attempt.total}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
const AptitudeAssessments: React.FC = () => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const token = user?.token

  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [page, setPage] = useState(1)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<any>(null)

  const fetchResults = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(
        `${baseURL}/api/institute/daily-aptitude/results?date=${date}&page=${page}&limit=20`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const json = await res.json()
      if (json.success) setData(json)
      else setError(json.message || 'Failed to load results')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [baseURL, token, date, page])

  useEffect(() => { fetchResults() }, [fetchResults])

  return (
    <>
      <PageMetaData title="Aptitude Assessments" />
      <style>{`
        @keyframes ia-spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        .ia-date::-webkit-calendar-picker-indicator { filter: brightness(0) invert(1); cursor: pointer; opacity: 0.8; }
        .ia-row { cursor: pointer; transition: background 0.15s; }
        .ia-row:hover td { background: rgba(255,122,0,0.06) !important; }
        .ia-row:hover .ia-view-btn { opacity: 1 !important; }
        .ia-page-btn:hover:not(:disabled) { border-color: #ff7a00 !important; color: #ff7a00 !important; }
      `}</style>

      {/* ── Page header ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'rgba(255,122,0,0.12)', border: '1px solid rgba(255,122,0,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
          }}>🧮</div>
          <div>
            <h4 style={{ fontWeight: 800, fontSize: 20, margin: 0, color: '#e0e0f0' }}>Aptitude Assessments</h4>
            <p style={{ color: '#44445a', fontSize: 12, margin: 0 }}>Daily aptitude exam results for your institute's students</p>
          </div>
        </div>
      </div>

      {/* ── Controls ── */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 10, color: '#555', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600 }}>Select Date</div>
          <input
            type="date" value={date} max={today} className="ia-date"
            onChange={e => { setDate(e.target.value); setPage(1) }}
            style={{
              padding: '9px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600,
              border: '1.5px solid #2a2a3a', background: '#12121e', color: '#e0e0f0',
              outline: 'none', cursor: 'pointer',
            }}
          />
        </div>
        <button
          onClick={fetchResults}
          style={{
            padding: '9px 22px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg,#ff7a00,#ff9a3c)',
            color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(255,122,0,0.25)',
          }}
        >↻ Refresh</button>
      </div>

      {/* ── Stat chips ── */}
      {data && !loading && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Date', val: new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }), icon: '📅', accent: '#ff7a00' },
            { label: 'Total Attempts', val: data.total, icon: '👥', accent: '#6366f1' },
            { label: 'Category', val: data.attempts?.[0]?.category || '—', icon: '📚', accent: '#34d399' },
          ].map(item => (
            <div key={item.label} style={{
              flex: '1 1 180px',
              background: '#0e0e1c', border: '1px solid #1a1a2a',
              borderRadius: 14, padding: '14px 18px',
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: `${item.accent}15`, border: `1px solid ${item.accent}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
              }}>{item.icon}</div>
              <div>
                <div style={{ fontSize: 10, color: '#44445a', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, marginBottom: 3 }}>{item.label}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#e0e0f0' }}>{item.val}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div style={{ width: 36, height: 36, border: '3px solid rgba(255,122,0,0.15)', borderTop: '3px solid #ff7a00', borderRadius: '50%', animation: 'ia-spin 0.8s linear infinite' }} />
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 12, padding: '14px 18px', color: '#f87171', marginBottom: 20, fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}

      {/* ── Table / Empty ── */}
      {data && !loading && (
        data.attempts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '70px 0', color: '#33334a' }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>📭</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#44445a' }}>No students from your institute attempted the exam on {date}.</div>
          </div>
        ) : (
          <>
            <div style={{ borderRadius: 14, border: '1px solid #1a1a2a', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#0a0a18' }}>
                    {['Rank', 'Student', 'Email', 'Category', 'Score', '%', 'Time', 'Submitted', ''].map(h => (
                      <th key={h} style={{
                        padding: '12px 16px', textAlign: 'left', fontWeight: 700,
                        color: '#44445a', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8,
                        borderBottom: '1px solid #1a1a2a', whiteSpace: 'nowrap',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.attempts.map((a: any, i: number) => {
                    const cat = CAT[a.category] ?? { color: '#888', bg: 'rgba(136,136,136,0.1)' }
                    const p = a.percentage ?? 0
                    return (
                      <tr key={i} className="ia-row" onClick={() => setSelected(a)} style={{ borderBottom: '1px solid #111120' }}>
                        <td style={{ padding: '13px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {MEDAL[a.rank] && <span style={{ fontSize: 16 }}>{MEDAL[a.rank]}</span>}
                            <span style={{ fontWeight: 800, fontSize: 14, color: a.rank <= 3 ? '#fbbf24' : '#44445a' }}>#{a.rank}</span>
                          </div>
                        </td>
                        <td style={{ padding: '13px 16px', fontWeight: 700, color: '#e0e0f0' }}>{a.studentName}</td>
                        <td style={{ padding: '13px 16px', color: '#44445a', fontSize: 12 }}>{a.studentEmail}</td>
                        <td style={{ padding: '13px 16px' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: cat.bg, color: cat.color, border: `1px solid ${cat.color}33` }}>
                            {a.category}
                          </span>
                        </td>
                        <td style={{ padding: '13px 16px', fontWeight: 800, color: '#e0e0f0' }}>
                          {a.score}<span style={{ color: '#33334a', fontWeight: 400 }}>/{a.total}</span>
                        </td>
                        <td style={{ padding: '13px 16px', fontWeight: 800, color: pctColor(p) }}>{p}%</td>
                        <td style={{ padding: '13px 16px', fontFamily: 'monospace', fontSize: 12, color: '#6366f1', fontWeight: 700 }}>
                          {formatSecs(a.timeTakenSeconds)}
                        </td>
                        <td style={{ padding: '13px 16px', color: '#33334a', fontSize: 12 }}>
                          {new Date(a.submittedAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                        </td>
                        <td style={{ padding: '13px 16px' }}>
                          <span className="ia-view-btn" style={{
                            opacity: 0, fontSize: 11, fontWeight: 700,
                            padding: '4px 12px', borderRadius: 8,
                            background: 'rgba(255,122,0,0.12)', color: '#ff7a00',
                            border: '1px solid rgba(255,122,0,0.25)',
                            transition: 'opacity 0.15s', whiteSpace: 'nowrap',
                          }}>View →</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data.pages > 1 && (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="ia-page-btn"
                  style={{ padding: '7px 18px', borderRadius: 9, border: '1px solid #1e1e30', background: 'transparent', cursor: page === 1 ? 'not-allowed' : 'pointer', color: page === 1 ? '#2a2a3a' : '#666', fontWeight: 700, fontSize: 13, transition: 'all 0.15s' }}>
                  ‹ Prev
                </button>
                <span style={{ padding: '7px 14px', fontSize: 13, color: '#444', background: '#0a0a18', borderRadius: 9, border: '1px solid #1a1a28' }}>
                  {page} / {data.pages}
                </span>
                <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page === data.pages} className="ia-page-btn"
                  style={{ padding: '7px 18px', borderRadius: 9, border: '1px solid #1e1e30', background: 'transparent', cursor: page === data.pages ? 'not-allowed' : 'pointer', color: page === data.pages ? '#2a2a3a' : '#666', fontWeight: 700, fontSize: 13, transition: 'all 0.15s' }}>
                  Next ›
                </button>
              </div>
            )}
          </>
        )
      )}

      {/* ── Student detail modal ── */}
      {selected && <StudentModal attempt={selected} onClose={() => setSelected(null)} />}
    </>
  )
}

export default AptitudeAssessments
