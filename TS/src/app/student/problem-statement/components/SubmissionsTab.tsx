import { useEffect, useState } from 'react'
import { Spinner } from 'react-bootstrap'
import { useAuthContext } from '@/context/useAuthContext'
import { FaStar, FaRegStar } from 'react-icons/fa'
import { FiCode, FiX, FiCopy, FiCheck } from 'react-icons/fi'

/* ── Types ─────────────────────────────────────────────────── */
type Submission = {
  _id: string
  problemId: number
  problemTitle: string
  language: string
  verdict: 'ACCEPTED' | 'PARTIALLY_ACCEPTED' | 'REJECTED'
  summary: { totalTestCases: number; passed: number; failed: number; passPercentage: number }
  attemptNumber: number
  isBestSubmission: boolean
  timeComplexity: string
  spaceComplexity: string
  code: string
  createdAt: string
}

/* ── Helpers ────────────────────────────────────────────────── */
const LANG_COLOR: Record<string, string> = {
  javascript: '#f7df1e', typescript: '#3178c6', python: '#3572a5',
  java: '#b07219', cpp: '#f34b7d', c: '#888', csharp: '#178600',
  php: '#4f5b93', ruby: '#cc342d', go: '#00add8', rust: '#dea584',
}

const VERDICT = {
  ACCEPTED:          { color: '#22c55e', bg: 'rgba(34,197,94,0.1)',  label: 'Accepted' },
  PARTIALLY_ACCEPTED:{ color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'Partial' },
  REJECTED:          { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  label: 'Rejected' },
}

const stars = (pct: number) =>
  pct >= 90 ? 5 : pct >= 75 ? 4 : pct >= 60 ? 3 : pct >= 40 ? 2 : pct > 0 ? 1 : 0

const fmtDate = (iso: string) => {
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

const known = (v: string) => v && v !== 'Not calculated' && v !== 'N/A'

/* ── Code Modal ─────────────────────────────────────────────── */
function CodeModal({ s, onClose }: { s: Submission; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const v = VERDICT[s.verdict] ?? VERDICT.REJECTED

  const copy = () => {
    navigator.clipboard.writeText(s.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1060,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#111', border: '1px solid #222', borderRadius: 14,
          width: '100%', maxWidth: 720, maxHeight: '85vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
        }}
      >
        {/* Modal header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 18px', borderBottom: '1px solid #1e1e1e', flexShrink: 0,
        }}>
          <FiCode size={15} color="#ff7a00" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f3f4f6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              #{s.problemId} — {s.problemTitle}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.68rem', color: '#6b7280', textTransform: 'capitalize' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: LANG_COLOR[s.language] ?? '#888', display: 'inline-block', marginRight: 4 }} />
                {s.language}
              </span>
              <span style={{ fontSize: '0.68rem', color: v.color, background: v.bg, borderRadius: 4, padding: '0 6px', fontWeight: 700 }}>
                {v.label}
              </span>
              <span style={{ fontSize: '0.68rem', color: '#6b7280' }}>Attempt #{s.attemptNumber}</span>
              {s.isBestSubmission && (
                <span style={{ fontSize: '0.68rem', color: '#facc15', background: 'rgba(250,204,21,0.1)', borderRadius: 4, padding: '0 6px', fontWeight: 700 }}>⭐ Best</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <button onClick={copy} style={{
            background: copied ? 'rgba(34,197,94,0.12)' : '#1a1a1a',
            border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : '#2a2a2a'}`,
            borderRadius: 7, color: copied ? '#22c55e' : '#9ca3af',
            padding: '5px 12px', fontSize: '0.75rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
            transition: 'all 0.2s',
          }}>
            {copied ? <FiCheck size={12} /> : <FiCopy size={12} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>

          <button onClick={onClose} style={{
            background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 7,
            color: '#9ca3af', padding: '5px 8px', cursor: 'pointer', flexShrink: 0,
          }}>
            <FiX size={15} />
          </button>
        </div>

        {/* Complexity strip */}
        {(known(s.timeComplexity) || known(s.spaceComplexity)) && (
          <div style={{
            display: 'flex', gap: 20, padding: '8px 18px',
            background: '#0d0d0d', borderBottom: '1px solid #1a1a1a', flexShrink: 0,
          }}>
            {known(s.timeComplexity) && (
              <span style={{ fontSize: '0.73rem', color: '#6b7280' }}>⏱ Time: <span style={{ color: '#d1d5db' }}>{s.timeComplexity}</span></span>
            )}
            {known(s.spaceComplexity) && (
              <span style={{ fontSize: '0.73rem', color: '#6b7280' }}>💾 Space: <span style={{ color: '#d1d5db' }}>{s.spaceComplexity}</span></span>
            )}
          </div>
        )}

        {/* Code */}
        <pre style={{
          margin: 0, padding: '18px 20px',
          color: '#e2e8f0', fontSize: '0.83rem',
          fontFamily: '"Fira Code","Cascadia Code","Consolas",monospace',
          overflowY: 'auto', overflowX: 'auto',
          lineHeight: 1.65, flex: 1,
          background: '#0a0a0a',
        }}>
          {s.code}
        </pre>

        {/* Footer */}
        <div style={{
          padding: '10px 18px', borderTop: '1px solid #1a1a1a',
          fontSize: '0.68rem', color: '#444', flexShrink: 0,
        }}>
          Submitted {fmtDate(s.createdAt)}
        </div>
      </div>
    </div>
  )
}

/* ── Card ───────────────────────────────────────────────────── */
function SubmissionCard({ s, onViewCode }: { s: Submission; onViewCode: () => void }) {
  const v = VERDICT[s.verdict] ?? VERDICT.REJECTED
  const starCount = stars(s.summary.passPercentage)
  const langColor = LANG_COLOR[s.language] ?? '#888'

  return (
    <div style={{
      background: '#111', border: '1px solid #1e1e1e',
      borderLeft: `3px solid ${v.color}`,
      borderRadius: 10, overflow: 'hidden',
    }}>
      <div style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>

          {/* Left */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Title row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
              <span style={{ fontSize: '0.7rem', color: '#555', fontWeight: 600, flexShrink: 0 }}>#{s.problemId}</span>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f3f4f6' }}>{s.problemTitle}</span>
              {s.isBestSubmission && (
                <span style={{
                  fontSize: '0.6rem', fontWeight: 700, background: 'rgba(250,204,21,0.15)',
                  color: '#facc15', border: '1px solid rgba(250,204,21,0.3)',
                  borderRadius: 4, padding: '1px 6px', letterSpacing: '0.5px',
                }}>BEST</span>
              )}
            </div>

            {/* Meta row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: langColor, display: 'inline-block' }} />
                <span style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'capitalize' }}>{s.language}</span>
              </div>
              <span style={{
                fontSize: '0.7rem', fontWeight: 700, color: v.color,
                background: v.bg, borderRadius: 5, padding: '2px 8px',
              }}>{v.label}</span>
              <span style={{ fontSize: '0.75rem', color: v.color, fontWeight: 600 }}>
                {s.summary.passPercentage}% · {s.summary.passed}/{s.summary.totalTestCases} tests
              </span>
              {known(s.timeComplexity) && (
                <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>⏱ {s.timeComplexity}</span>
              )}
              {known(s.spaceComplexity) && (
                <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>💾 {s.spaceComplexity}</span>
              )}
            </div>

            {/* Stars */}
            <div style={{ display: 'flex', gap: 2, marginTop: 8 }}>
              {Array.from({ length: 5 }).map((_, i) =>
                i < starCount
                  ? <FaStar key={i} size={11} color="#facc15" />
                  : <FaRegStar key={i} size={11} color="#374151" />
              )}
            </div>
          </div>

          {/* Right */}
          <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <div>
              <div style={{ fontSize: '0.68rem', color: '#555', marginBottom: 2 }}>Attempt #{s.attemptNumber}</div>
              <div style={{ fontSize: '0.68rem', color: '#6b7280' }}>{fmtDate(s.createdAt)}</div>
            </div>
            <button
              onClick={onViewCode}
              style={{
                background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 7,
                color: '#9ca3af', padding: '4px 12px', fontSize: '0.72rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ff7a00'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,122,0,0.4)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#9ca3af'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#2a2a2a' }}
            >
              <FiCode size={11} /> View Code
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: 10, height: 3, background: '#1e1e1e', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            width: `${s.summary.passPercentage}%`, height: '100%',
            background: v.color, borderRadius: 2, transition: 'width 0.6s ease',
          }} />
        </div>
      </div>
    </div>
  )
}

/* ── Main ───────────────────────────────────────────────────── */
const SubmissionsTab = () => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const [data, setData] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [codeModal, setCodeModal] = useState<Submission | null>(null)

  useEffect(() => {
    fetch(`${baseURL}/api/ai/me`, {
      headers: { Authorization: `Bearer ${user?.token}` },
    })
      .then(r => r.json())
      .then(j => setData(j.data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      <Spinner animation="border" style={{ color: '#ff7a00' }} />
    </div>
  )

  if (!data.length) return (
    <div style={{
      textAlign: 'center', padding: '60px 20px', color: '#444',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
    }}>
      <span style={{ fontSize: '2.5rem' }}>🚀</span>
      <span style={{ fontSize: '0.9rem' }}>No submissions yet — start solving!</span>
    </div>
  )

  const accepted = data.filter(s => s.verdict === 'ACCEPTED').length

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {/* Summary strip */}
        <div style={{
          display: 'flex', gap: 20, padding: '10px 4px 16px',
          borderBottom: '1px solid #1a1a1a', marginBottom: 14,
        }}>
          {[
            { label: 'Total', value: data.length, color: '#9ca3af' },
            { label: 'Accepted', value: accepted, color: '#22c55e' },
            { label: 'Best Rate', value: `${Math.max(...data.map(s => s.summary.passPercentage))}%`, color: '#f59e0b' },
          ].map(item => (
            <div key={item.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: item.color }}>{item.value}</div>
              <div style={{ fontSize: '0.65rem', color: '#555', marginTop: 1 }}>{item.label}</div>
            </div>
          ))}
        </div>

        {/* Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.map(s => (
            <SubmissionCard key={s._id} s={s} onViewCode={() => setCodeModal(s)} />
          ))}
        </div>
      </div>

      {/* Code modal */}
      {codeModal && <CodeModal s={codeModal} onClose={() => setCodeModal(null)} />}
    </>
  )
}

export default SubmissionsTab
