import React, { useState, useEffect, useCallback } from 'react'
import PageMetaData from '@/components/PageMetaData'
import CsvUploadForm from './components/BulkUpload'
import PuzzleUploadForm from './components/PuzzleUpload'
import { BsFiletypeCsv, BsPuzzle, BsCalendarCheck } from 'react-icons/bs'
import { useAuthContext } from '@/context/useAuthContext'

// ── Daily Exam Results component ──────────────────────────────────────────────

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

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

const DailyExamResults: React.FC = () => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const token = user?.token

  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [page, setPage] = useState(1)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchResults = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(
        `${baseURL}/api/admin/daily-aptitude/results?date=${date}&page=${page}&limit=20`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const json = await res.json()
      if (json.success) setData(json)
      else setError(json.message || 'Failed to load results')
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }, [baseURL, token, date, page])

  useEffect(() => { fetchResults() }, [fetchResults])

  const pct = (a: any) => a.percentage ?? 0
  const pctColor = (p: number) => p >= 70 ? '#34d399' : p >= 40 ? '#fbbf24' : '#f87171'

  return (
    <div style={{ padding: '1.5rem 1.25rem', maxWidth: 980, margin: '0 auto' }}>
      <style>{`
        .der-date::-webkit-calendar-picker-indicator { filter: brightness(0) invert(1); cursor: pointer; opacity: 0.8; }
        .der-row:hover td { background: rgba(255,122,0,0.04) !important; }
        .der-btn:hover:not(:disabled) { background: rgba(255,122,0,0.15) !important; border-color: #ff7a00 !important; color: #ff7a00 !important; }
      `}</style>

      {/* ── Header + controls ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 11, color: '#555', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600 }}>Select Date</div>
          <input
            type="date" value={date} max={today} className="der-date"
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
            boxShadow: '0 4px 14px rgba(255,122,0,0.3)',
          }}
        >↻ Refresh</button>
      </div>

      {/* ── Stat chips ── */}
      {data && !loading && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { label: 'Date', val: new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }), icon: '📅' },
            { label: 'Total Attempts', val: data.total, icon: '👥' },
            { label: 'Page', val: `${data.page} / ${Math.max(1, data.pages)}`, icon: '📄' },
          ].map(item => (
            <div key={item.label} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: '#0e0e1c', border: '1px solid #1e1e30',
              borderRadius: 12, padding: '10px 18px',
            }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: 0.7, fontWeight: 600 }}>{item.label}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#e0e0f0', marginTop: 1 }}>{item.val}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div style={{ width: 36, height: 36, border: '3px solid rgba(255,122,0,0.15)', borderTop: '3px solid #ff7a00', borderRadius: '50%', animation: 'da-spin 0.8s linear infinite' }} />
          <style>{`@keyframes da-spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 12, padding: '14px 18px', color: '#f87171', marginBottom: 16, fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}

      {/* ── Table ── */}
      {data && !loading && (
        data.attempts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#33334a', fontSize: 14 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            No students attempted the exam on {date}.
          </div>
        ) : (
          <>
            <div style={{ borderRadius: 14, border: '1px solid #1a1a2a', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#0a0a18' }}>
                    {['Rank', 'Student', 'Email', 'Category', 'Score', '%', 'Time', 'Submitted'].map(h => (
                      <th key={h} style={{
                        padding: '12px 16px', textAlign: 'left', fontWeight: 700,
                        color: '#444', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8,
                        borderBottom: '1px solid #1a1a2a', whiteSpace: 'nowrap',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.attempts.map((a: any, i: number) => {
                    const cat = CAT[a.category] ?? { color: '#888', bg: 'rgba(136,136,136,0.1)' }
                    const p = pct(a)
                    return (
                      <tr key={i} className="der-row" style={{ borderBottom: '1px solid #111120' }}>
                        <td style={{ padding: '13px 16px', fontWeight: 900, fontSize: 15 }}>
                          {MEDAL[a.rank]
                            ? <span>{MEDAL[a.rank]}</span>
                            : <span style={{ color: '#33334a' }}>#{a.rank}</span>
                          }
                        </td>
                        <td style={{ padding: '13px 16px', fontWeight: 700, color: '#e0e0f0' }}>{a.studentName}</td>
                        <td style={{ padding: '13px 16px', color: '#44445a', fontSize: 12 }}>{a.studentEmail}</td>
                        <td style={{ padding: '13px 16px' }}>
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                            background: cat.bg, color: cat.color, border: `1px solid ${cat.color}33`,
                          }}>{a.category}</span>
                        </td>
                        <td style={{ padding: '13px 16px', fontWeight: 800, color: '#e0e0f0' }}>{a.score}<span style={{ color: '#33334a', fontWeight: 400 }}>/{a.total}</span></td>
                        <td style={{ padding: '13px 16px', fontWeight: 800, color: pctColor(p) }}>{p}%</td>
                        <td style={{ padding: '13px 16px', fontFamily: 'monospace', fontSize: 12, color: '#6366f1', fontWeight: 700 }}>{formatSecs(a.timeTakenSeconds)}</td>
                        <td style={{ padding: '13px 16px', color: '#33334a', fontSize: 12 }}>
                          {new Date(a.submittedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data.pages > 1 && (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 18 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="der-btn"
                  style={{ padding: '7px 18px', borderRadius: 9, border: '1px solid #1e1e30', background: 'transparent', cursor: page === 1 ? 'not-allowed' : 'pointer', color: page === 1 ? '#2a2a3a' : '#666', fontWeight: 700, fontSize: 13, transition: 'all 0.15s' }}>
                  ‹ Prev
                </button>
                <span style={{ padding: '7px 14px', fontSize: 13, color: '#444', background: '#0a0a18', borderRadius: 9, border: '1px solid #1a1a28' }}>{page} / {data.pages}</span>
                <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page === data.pages} className="der-btn"
                  style={{ padding: '7px 18px', borderRadius: 9, border: '1px solid #1e1e30', background: 'transparent', cursor: page === data.pages ? 'not-allowed' : 'pointer', color: page === data.pages ? '#2a2a3a' : '#666', fontWeight: 700, fontSize: 13, transition: 'all 0.15s' }}>
                  Next ›
                </button>
              </div>
            )}
          </>
        )
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

const AptitudeQuestionsUpload = () => {
  const [activeTab, setActiveTab] = useState<'csv' | 'puzzle' | 'results'>('csv')

  const TABS = [
    { key: 'csv',     label: 'Text Questions',     icon: BsFiletypeCsv,    desc: 'CSV upload',     color: '#0d6efd' },
    { key: 'puzzle',  label: 'Puzzle Questions',    icon: BsPuzzle,         desc: 'ZIP + images',   color: '#d97706' },
    { key: 'results', label: 'Daily Exam Results',  icon: BsCalendarCheck,  desc: 'View attempts',  color: '#16a34a' },
  ] as const

  return (
    <>
      <PageMetaData title="Quiz Upload" />

      {/* Tab switcher */}
      <div style={{ maxWidth: 720, margin: '1.5rem auto 0', padding: '0 1rem' }}>
        <div style={{ display: 'flex', background: '#f1f3f5', borderRadius: 12, padding: 4, gap: 4 }}>
          {TABS.map(({ key, label, icon: Icon, desc, color }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                flex: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '10px 14px', border: 'none', borderRadius: 9, cursor: 'pointer',
                fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s',
                background: activeTab === key ? '#fff' : 'transparent',
                color: activeTab === key ? color : '#6b7280',
                boxShadow: activeTab === key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              <Icon size={16} />
              <span>{label}</span>
              <span style={{ fontSize: '0.7rem', fontWeight: 400, color: '#9ca3af' }}>({desc})</span>
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'csv'     && <CsvUploadForm />}
      {activeTab === 'puzzle'  && <PuzzleUploadForm />}
      {activeTab === 'results' && <DailyExamResults />}
    </>
  )
}

export default AptitudeQuestionsUpload
