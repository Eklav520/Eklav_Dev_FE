import React, { useState, useEffect } from 'react'
import { Container, Spinner, Modal } from 'react-bootstrap'
import { FaFeatherAlt, FaRedo, FaCheckCircle, FaPenAlt, FaEnvelope, FaFileAlt, FaLightbulb, FaClipboardList, FaSearch, FaBullseye, FaEdit, FaClock, FaBold, FaItalic, FaUnderline, FaListUl, FaListOl, FaAlignLeft, FaAlignCenter, FaAlignRight, FaLink, FaUndoAlt, FaRedoAlt } from 'react-icons/fa'
import { useAuthContext } from '@/context/useAuthContext'

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface WritingFeedbackResult {
  score: number
  corrections?: string
  idealAnswer?: string
  feedback?: FeedbackDetail
}

interface FeedbackDetail {
  overall?: string
  grammar?: string
  tone?: string
  suggestions?: string[]
}

interface WritingAttempt {
  _id?: string
  mode: string
  prompt: string
  score?: number
  createdAt?: string
}

interface WritingHistoryUI {
  monthlyLimit: number
  attemptsUsed: number
  remainingAttempts: number
  bestScore: number | null
}

type ModeType = 'essay' | 'email' | 'summary'

// ─── Static config ────────────────────────────────────────────────────────────

interface ModeConfig {
  label: string
  desc: string
  tags: string[]
  color: string
  bg: string
  Icon: React.ElementType
  statIcon: React.ElementType
}

const MODES: Record<ModeType, ModeConfig> = {
  essay: {
    label: 'Essay Writing',
    desc: 'Write structured essays on different topics.',
    tags: ['Opinion', 'Argumentative', 'Descriptive'],
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.1)',
    Icon: FaPenAlt,
    statIcon: FaEdit,
  },
  email: {
    label: 'Email Writing',
    desc: 'Learn professional email writing for any situation.',
    tags: ['Formal', 'Informal', 'Business'],
    color: '#10b981',
    bg: 'rgba(16,185,129,0.1)',
    Icon: FaEnvelope,
    statIcon: FaEnvelope,
  },
  summary: {
    label: 'Summary Writing',
    desc: 'Summarize long content into short and clear points.',
    tags: ['Article', 'Report', 'Text'],
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.1)',
    Icon: FaFileAlt,
    statIcon: FaClipboardList,
  },
}

interface TipConfig {
  Icon: React.ElementType
  iconColor: string
  iconBg: string
  title: string
  desc: string
}

const TIPS: TipConfig[] = [
  { Icon: FaLightbulb,     iconColor: '#f59e0b', iconBg: '#fffbeb', title: 'Plan Before You Write',  desc: 'Organize your ideas before starting to write.' },
  { Icon: FaClipboardList, iconColor: '#10b981', iconBg: '#f0fdf4', title: 'Use Clear Structure',    desc: 'Introduction, Body, and Conclusion.' },
  { Icon: FaSearch,        iconColor: '#3b82f6', iconBg: '#eff6ff', title: 'Review & Edit',          desc: 'Always proofread your writing.' },
  { Icon: FaBullseye,      iconColor: '#ef4444', iconBg: '#fff1f2', title: 'Practice Regularly',     desc: 'Write a little every day to see big improvements.' },
]

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAY_LABELS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

// ─── Calendar helpers ─────────────────────────────────────────────────────────

function buildCalendar(year: number, month: number, attempts: WritingAttempt[]) {
  const firstDay = new Date(year, month, 1).getDay()
  const startOffset = firstDay === 0 ? 6 : firstDay - 1
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const scoreMap: Record<number, number> = {}
  attempts.forEach(a => {
    if (!a.createdAt) return
    const d = new Date(a.createdAt)
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate()
      const raw = a.score ?? 0
      const score = raw <= 10 ? raw * 10 : raw
      if (!scoreMap[day] || score > scoreMap[day]) scoreMap[day] = score
    }
  })
  return { startOffset, daysInMonth, scoreMap }
}

function dotColor(score: number) {
  if (score >= 80) return '#16a34a'   // green  – good
  if (score >= 60) return '#f59e0b'   // yellow – average
  return '#f97316'                     // orange – attempted but low score
}

// ─── Component ────────────────────────────────────────────────────────────────

const WritingPractice: React.FC = () => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const token = user?.token
  const status = user?.status?.toLowerCase()

  const TRIAL_LIMIT = 5
  const PREMIUM_DEFAULT = 30
  const isTrial = status === 'pending'

  const [started, setStarted] = useState(false)
  const [mode, setMode] = useState<ModeType>('essay')
  const [prompt, setPrompt] = useState('')
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<WritingFeedbackResult | null>(null)
  const [fetchingPrompt, setFetchingPrompt] = useState(false)
  const [history, setHistory] = useState<WritingHistoryUI | null>(null)
  const [rawAttempts, setRawAttempts] = useState<WritingAttempt[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30 * 60)
  const [idealExpanded, setIdealExpanded] = useState(false)
  const [feedbackTab, setFeedbackTab] = useState<'model' | 'mistakes' | 'overall'>('model')

  const editorRef = React.useRef<HTMLDivElement>(null)

  const now = new Date()
  const [calYear, setCalYear] = useState(now.getFullYear())
  const [calMonth, setCalMonth] = useState(now.getMonth())

  // ─── API functions ────────────────────────────────────────────────────────

  const startWriting = async (selectedMode?: ModeType) => {
    const m = selectedMode ?? mode
    setMode(m)
    setStarted(true)
    setFeedback(null)
    setText('')
    setPrompt('')
    setFetchingPrompt(true)
    try {
      const res = await fetch(`${baseURL}/writing/prompt/${m}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setPrompt(data?.prompt || 'Write about a topic of your choice.')
    } catch {
      setPrompt('Write about a topic of your choice.')
    } finally {
      setFetchingPrompt(false)
    }
  }

  const fetchWritingHistory = async () => {
    if (!token || !user?.id) return
    try {
      setLoadingHistory(true)
      const res = await fetch(`${baseURL}/writing/history/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch writing history')
      const data = await res.json()

      if (!Array.isArray(data) || data.length === 0) {
        setHistory({ attemptsUsed: 0, monthlyLimit: isTrial ? TRIAL_LIMIT : PREMIUM_DEFAULT, remainingAttempts: isTrial ? TRIAL_LIMIT : PREMIUM_DEFAULT, bestScore: null })
        setRawAttempts([])
        return
      }

      const latest = data[0]
      const attempts: WritingAttempt[] = latest.attempts || []
      const backendLimit = latest.monthlyLimit ?? PREMIUM_DEFAULT
      const monthlyLimit = isTrial ? TRIAL_LIMIT : backendLimit
      const attemptsUsed = attempts.length
      const remainingAttempts = Math.max(monthlyLimit - attemptsUsed, 0)
      const bestScore = latest.summary?.bestScore ?? (attempts.length > 0 ? Math.max(...attempts.map((a: any) => a.score ?? 0)) : null)

      setHistory({ attemptsUsed, monthlyLimit, remainingAttempts, bestScore })
      setRawAttempts(attempts)
    } catch (err) {
      console.error('Writing history error:', err)
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    if (token && user?.id) fetchWritingHistory()
  }, [token, user?.id])

  useEffect(() => {
    if (!started) return
    setTimeLeft(30 * 60)
    setIdealExpanded(false)
    setFeedbackTab('model')
    const id = setInterval(() => setTimeLeft(t => Math.max(t - 1, 0)), 1000)
    return () => clearInterval(id)
  }, [started])

  const maxAllowedAttempts = isTrial ? TRIAL_LIMIT : history?.monthlyLimit ?? PREMIUM_DEFAULT
  const isLimitReached = !!history && history.attemptsUsed >= maxAllowedAttempts

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')} : ${String(s % 60).padStart(2, '0')}`
  const wordCount = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0
  const charCount = text.length
  const WORD_LIMITS: Record<ModeType, number> = { essay: 300, email: 200, summary: 150 }
  const wordLimit = WORD_LIMITS[mode]
  const modeCfg = MODES[mode]

  const applyFmt = (cmd: string, val?: string) => {
    editorRef.current?.focus()
    document.execCommand(cmd, false, val)
    setText(editorRef.current?.innerText ?? '')
  }

  const toolbarBtnStyle: React.CSSProperties = {
    width: 26, height: 26, borderRadius: 5, border: '1px solid transparent',
    background: 'transparent', cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center', color: '#475569',
  }

  const handleSubmit = async () => {
    if (!text.trim()) return alert('Please write your response first!')
    setLoading(true)
    try {
      const res = await fetch(`${baseURL}/writing/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ studentId: user?.id, mode, prompt, text }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setFeedback({
        score: data.score,
        corrections: data.feedback?.corrections,
        idealAnswer: data.feedback?.idealAnswer,
        feedback: data.feedback?.feedback,
      })
    } catch (err) {
      console.error('Error submitting writing:', err)
    } finally {
      setLoading(false)
    }
  }

  const restartPractice = () => {
    setStarted(false)
    setFeedback(null)
    setPrompt('')
    setText('')
    if (editorRef.current) editorRef.current.innerHTML = ''
  }

  const fetchNewTopic = async () => {
    setFeedback(null)
    setText('')
    setPrompt('')
    setFetchingPrompt(true)
    try {
      const res = await fetch(`${baseURL}/writing/prompt/${mode}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setPrompt(data?.prompt || 'Write about a topic of your choice.')
    } catch {
      setPrompt('Write about a topic of your choice.')
    } finally {
      setFetchingPrompt(false)
    }
  }

  const getScoreVariant = (score: number) => score >= 80 ? 'success' : score >= 60 ? 'warning' : 'danger'

  const getScoreFeedback = (score: number) => {
    if (score >= 90) return 'Excellent!'
    if (score >= 80) return 'Very Good!'
    if (score >= 70) return 'Good!'
    if (score >= 60) return 'Fair'
    return 'Needs Improvement'
  }

  const formatParagraphs = (t?: string) => {
    if (!t) return null
    return t.split(/\n+/).filter(p => p.trim()).map((p, i) => <p key={i} className="mb-2">{p}</p>)
  }

  const renderStructured = (text: string) => {
    if (!text) return null
    return text.split(/\n\n+/).filter(b => b.trim()).map((block, i) => {
      const trimmed = block.trim()
      if (trimmed.toLowerCase().startsWith('subject:')) {
        const [, rest] = trimmed.split(/:\s*/)
        return (
          <div key={i} style={{ marginBottom: 14, padding: '8px 12px', background: '#f0eeff', borderRadius: 8, border: '1px solid #e0d9ff' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6c63ff', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Subject</span>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', marginTop: 2 }}>{rest}</div>
          </div>
        )
      }
      const lines = trimmed.split('\n')
      return (
        <p key={i} style={{ marginBottom: 12, lineHeight: 1.75, color: '#374151', fontSize: '0.85rem' }}>
          {lines.map((line, j) => (
            <React.Fragment key={j}>{line}{j < lines.length - 1 && <br />}</React.Fragment>
          ))}
        </p>
      )
    })
  }

  // ─── Derived values ───────────────────────────────────────────────────────

  const essayCount = rawAttempts.filter(a => a.mode === 'essay').length
  const emailCount = rawAttempts.filter(a => a.mode === 'email').length
  const summaryCount = rawAttempts.filter(a => a.mode === 'summary').length
  const recentAttempts = [...rawAttempts].reverse().slice(0, 5)

  const { startOffset, daysInMonth, scoreMap } = buildCalendar(calYear, calMonth, rawAttempts)
  const isCurrentMonth = calYear === now.getFullYear() && calMonth === now.getMonth()
  const cells: (number | null)[] = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const navBtnStyle: React.CSSProperties = {
    width: 26, height: 26, borderRadius: '50%', border: '1px solid #e2e8f0',
    background: '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: '1rem', color: '#374151', fontWeight: 700,
    lineHeight: 1, padding: 0,
  }

  // ─── JSX ──────────────────────────────────────────────────────────────────

  return (
    <Container fluid style={{ padding: '20px 24px', background: '#f8fafc', minHeight: '100vh' }}>

      {/* ════ START SCREEN ════ */}
      <div style={{ display: 'flex', gap: 20 }}>

        {/* LEFT COLUMN */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Hero Card */}
          <div style={{ background: 'linear-gradient(to right, #fffbeb 0%, #fde68a 60%, #fbbf24 100%)', border: '1px solid #fcd34d', borderRadius: 16, padding: '40px 28px', minHeight: 240, display: 'flex', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden' }}>
            <div>
              <h2 style={{ fontWeight: 800, fontSize: '1.5rem', color: '#0f172a', marginBottom: 8 }}>Improve Your Writing Skills</h2>
              <p style={{ color: '#64748b', fontSize: '0.86rem', marginBottom: 22, lineHeight: 1.6 }}>
                Practice different types of writing, get AI feedback,<br />and improve your communication.
              </p>
              <div style={{ display: 'flex', gap: 28 }}>
                {([
                  { Icon: MODES.essay.statIcon,   count: essayCount,   label: 'Essays Written',     color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
                  { Icon: MODES.email.statIcon,   count: emailCount,   label: 'Emails Written',     color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
                  { Icon: MODES.summary.statIcon, count: summaryCount, label: 'Summaries Written',  color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
                ] as { Icon: React.ElementType; count: number; label: string; color: string; bg: string }[]).map(s => (
                  <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <s.Icon style={{ fontSize: '0.95rem', color: s.color }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a', lineHeight: 1 }}>{s.count}</div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: 2 }}>{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Illustration */}
            <div style={{ flexShrink: 0, position: 'relative', width: 220, height: 170, userSelect: 'none' }}>
              {/* Notebook body */}
              <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 110, height: 148, background: 'linear-gradient(145deg, #5a52d5, #3730a3)', borderRadius: 12, boxShadow: '5px 6px 28px rgba(99,88,255,0.35)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 18px', gap: 8 }}>
                {[100, 80, 65, 50].map((w, i) => (
                  <div key={i} style={{ height: 3.5, background: 'rgba(255,255,255,0.45)', borderRadius: 2, width: `${w}%` }} />
                ))}
                {/* Spine */}
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 14, background: 'rgba(0,0,0,0.18)', borderRadius: '12px 0 0 12px' }} />
              </div>
              {/* Pen */}
              <div style={{ position: 'absolute', right: 90, top: 4, transform: 'rotate(-38deg)', transformOrigin: 'bottom center' }}>
                <FaPenAlt style={{ fontSize: '2.6rem', color: '#0f172a', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
              </div>
              {/* Floating envelope bubble */}
              <div style={{ position: 'absolute', left: 4, top: 8, width: 34, height: 34, borderRadius: '50%', background: '#fff', boxShadow: '0 3px 10px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FaEnvelope style={{ fontSize: '0.9rem', color: '#ff7a00' }} />
              </div>
              {/* Floating edit bubble */}
              <div style={{ position: 'absolute', left: 18, bottom: 8, width: 30, height: 30, borderRadius: '50%', background: '#fff', boxShadow: '0 3px 10px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FaEdit style={{ fontSize: '0.8rem', color: '#10b981' }} />
              </div>
            </div>
          </div>

          {/* Choose a Writing Type */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>Choose a Writing Type</span>
              <span style={{ fontSize: '0.8rem', color: '#ff7a00', fontWeight: 600, cursor: 'pointer' }}>View All →</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              {(Object.entries(MODES) as [ModeType, typeof MODES.essay][]).map(([key, cfg]) => (
                <div key={key} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <cfg.Icon style={{ fontSize: '1.3rem', color: cfg.color }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', marginBottom: 4 }}>{cfg.label}</div>
                    <div style={{ fontSize: '0.77rem', color: '#64748b', lineHeight: 1.55 }}>{cfg.desc}</div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {cfg.tags.map(t => (
                      <span key={t} style={{ fontSize: '0.68rem', fontWeight: 600, color: cfg.color, background: cfg.bg, borderRadius: 20, padding: '2px 8px' }}>{t}</span>
                    ))}
                  </div>
                  <button
                    disabled={isLimitReached}
                    onClick={() => startWriting(key)}
                    style={{ marginTop: 6, width: '100%', padding: '10px 0', borderRadius: 10, border: 'none', background: cfg.color, color: '#fff', fontSize: '0.82rem', fontWeight: 700, cursor: isLimitReached ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: isLimitReached ? 0.5 : 1, transition: 'opacity 0.15s, box-shadow 0.15s', letterSpacing: '0.01em' }}
                  >
                    Start Practice &nbsp;→
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Writing Practice */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid #edf2f7' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>Recent Writing Practice</span>
              <span style={{ fontSize: '0.8rem', color: '#ff7a00', fontWeight: 600, cursor: 'pointer' }}>View All →</span>
            </div>
            {recentAttempts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: '#94a3b8', fontSize: '0.82rem' }}>
                No writing practice yet. Start your first session!
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Type', 'Topic / Title', 'Score', 'Date', 'Action'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', fontSize: '0.73rem', fontWeight: 700, color: '#64748b', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentAttempts.map((a, i) => {
                    const cfg = MODES[a.mode as ModeType] ?? MODES.essay
                    const rawScore = a.score
                    const score = rawScore !== undefined ? (rawScore <= 10 ? rawScore * 10 : rawScore) : null
                    const sColor = score !== null ? (score >= 80 ? '#16a34a' : score >= 60 ? '#f59e0b' : '#dc2626') : '#94a3b8'
                    const dt = a.createdAt ? new Date(a.createdAt) : null
                    const dateStr = dt ? dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
                    const timeStr = dt ? dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''
                    const title = a.prompt?.length > 55 ? a.prompt.slice(0, 55) + '…' : (a.prompt || '—')
                    return (
                      <tr key={a._id ?? i} style={{ borderTop: '1px solid #edf2f7' }}>
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 28, height: 28, borderRadius: 8, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><cfg.Icon style={{ fontSize: '0.8rem', color: cfg.color }} /></span>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a' }}>{cfg.label}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', maxWidth: 220 }}>
                          <div style={{ fontSize: '0.8rem', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
                        </td>
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.88rem', color: sColor }}>{score !== null ? `${score}/100` : '—'}</span>
                        </td>
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                          <div style={{ fontSize: '0.78rem', color: '#374151' }}>{dateStr}</div>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{timeStr}</div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <button style={{ padding: '5px 12px', borderRadius: 7, border: 'none', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>View Report</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ width: 310, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Writing Calendar */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #edf2f7' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <span style={{ fontSize: '0.9rem' }}>📅</span>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>Your Writing Calendar</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button
                  style={navBtnStyle}
                  onClick={() => { const d = new Date(calYear, calMonth - 1); setCalYear(d.getFullYear()); setCalMonth(d.getMonth()) }}
                >‹</button>
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#374151' }}>{MONTH_NAMES[calMonth]} {calYear}</span>
                <button
                  style={navBtnStyle}
                  onClick={() => { const d = new Date(calYear, calMonth + 1); setCalYear(d.getFullYear()); setCalMonth(d.getMonth()) }}
                >›</button>
              </div>
            </div>
            <div style={{ padding: '8px 12px 0' }}>
              {/* Day headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 2 }}>
                {DAY_LABELS.map(d => (
                  <div key={d} style={{ textAlign: 'center', fontSize: '0.62rem', fontWeight: 700, color: '#94a3b8', padding: '2px 0' }}>{d}</div>
                ))}
              </div>
              {/* Day cells */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, paddingBottom: 10 }}>
                {cells.map((day, idx) => {
                  if (!day) return <div key={idx} />
                  const isToday = isCurrentMonth && day === now.getDate()
                  const score = scoreMap[day]
                  const dc = score !== undefined ? dotColor(score) : undefined
                  const isPastDay = isCurrentMonth
                    ? day < now.getDate()
                    : calYear < now.getFullYear() || (calYear === now.getFullYear() && calMonth < now.getMonth())
                  const isMissed = isPastDay && !isToday && score === undefined
                  const bgColor = isToday ? '#6c63ff' : dc ?? (isMissed ? '#dc2626' : 'transparent')
                  const textColor = (isToday || dc || isMissed) ? '#fff' : '#374151'
                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2px 0' }}>
                      <span style={{
                        width: 26, height: 26, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.68rem', fontWeight: (isToday || dc || isMissed) ? 700 : 500,
                        color: textColor,
                        background: bgColor,
                      }}>{day}</span>
                    </div>
                  )
                })}
              </div>
            </div>
            {/* Legend */}
            <div style={{ padding: '8px 14px 12px', borderTop: '1px solid #edf2f7', display: 'flex', flexWrap: 'wrap', gap: '5px 12px' }}>
              {[
                { color: '#16a34a', label: 'Good (≥80)' },
                { color: '#f59e0b', label: 'Average (≥60)' },
                { color: '#f97316', label: 'Low Score' },
                { color: '#dc2626', label: 'Missed' },
                { color: '#6c63ff', label: 'Today' },
              ].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 14, height: 14, borderRadius: '50%', background: l.color, display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.6rem', color: '#64748b' }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Writing Tips */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px 12px', borderBottom: '1px solid #edf2f7' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>Writing Tips</span>
              <span style={{ fontSize: '0.8rem', color: '#ff7a00', fontWeight: 600, cursor: 'pointer' }}>View All →</span>
            </div>
            <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {TIPS.map(t => (
                <div key={t.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: t.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <t.Icon style={{ fontSize: '0.95rem', color: t.iconColor }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a', marginBottom: 2 }}>{t.title}</div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b', lineHeight: 1.4 }}>{t.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Usage card */}
          {history && (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '14px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a', marginBottom: 8 }}>
                {isTrial ? 'Trial Usage' : 'Monthly Usage'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.78rem', color: '#64748b' }}>
                <span>{Math.min(history.attemptsUsed, maxAllowedAttempts)} of {maxAllowedAttempts} used</span>
                <span style={{ fontWeight: 700, color: '#ff7a00' }}>
                  Best: {history.bestScore !== null ? `${history.bestScore! <= 10 ? history.bestScore! * 10 : history.bestScore}/100` : '—'}
                </span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: '#f1f5f9', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 3, background: isLimitReached ? '#dc2626' : '#ff7a00', width: `${Math.min((history.attemptsUsed / maxAllowedAttempts) * 100, 100)}%`, transition: 'width 0.3s' }} />
              </div>
              {isTrial && isLimitReached && (
                <div style={{ marginTop: 10, fontSize: '0.74rem', color: '#dc2626', background: '#fff1f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                  🔒 Trial limit reached. Upgrade to continue.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ════ WRITING PRACTICE MODAL ════ */}
      <Modal show={started} fullscreen onHide={restartPractice} className="writing-practice-modal">

        {/* ── Header ── */}
        <Modal.Header closeButton style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '10px 20px', minHeight: 58 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: modeCfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <modeCfg.Icon style={{ fontSize: '1rem', color: modeCfg.color }} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a', lineHeight: 1.2 }}>{modeCfg.label}</div>
                <div style={{ fontSize: '0.71rem', color: '#64748b' }}>{modeCfg.desc}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <div style={{ fontSize: '0.64rem', color: '#64748b', lineHeight: 1, marginBottom: 2 }}>Time Left</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FaClock style={{ fontSize: '1rem', color: timeLeft < 300 ? '#dc2626' : '#6c63ff' }} />
                  <div style={{ fontWeight: 800, fontSize: '1.25rem', color: timeLeft < 300 ? '#dc2626' : '#6c63ff', lineHeight: 1, letterSpacing: 2, fontVariantNumeric: 'tabular-nums' }}>
                    {formatTime(timeLeft)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal.Header>

        {/* ── Body: Two Columns ── */}
        <Modal.Body style={{ padding: 0, display: 'flex', overflow: 'hidden', height: 'calc(100vh - 58px)' }}>

          {/* ── LEFT: Writing Panel ── */}
          <div style={{ width: '54%', overflowY: 'auto', borderRight: '1px solid #e2e8f0', padding: '20px 22px', background: '#fff', display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Topic Card */}
            <div style={{ background: '#f8fafc', borderRadius: 14, padding: '14px 16px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6c63ff', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Today's Topic</div>
                  {fetchingPrompt ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6c63ff', fontSize: '0.85rem' }}>
                      <Spinner animation="border" size="sm" /> Generating your topic…
                    </div>
                  ) : (
                    <>
                      <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a', lineHeight: 1.35, marginBottom: 6 }}>
                        {prompt.split(/[.!?\n]/)[0]?.trim() || prompt}
                      </div>
                      {prompt.includes('.') && (
                        <div style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.6 }}>
                          {prompt.replace(/^[^.!?\n]+[.!?\n]\s*/, '').slice(0, 220)}
                          {prompt.length > 220 ? '…' : ''}
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div style={{ flexShrink: 0, width: 56, height: 56, borderRadius: 14, background: modeCfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <modeCfg.Icon style={{ fontSize: '1.5rem', color: modeCfg.color }} />
                </div>
              </div>
              {/* Info pills */}
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 12 }}>
                {[`Word Limit: ${wordLimit - 50}–${wordLimit} words`, 'Time: 30 Minutes', 'Focus: Ideas, Structure, Language, Coherence'].map(p => (
                  <span key={p} style={{ fontSize: '0.7rem', fontWeight: 600, color: '#475569', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: '4px 11px' }}>{p}</span>
                ))}
              </div>
            </div>

            {/* Answer Section */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>Your Answer</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', color: '#16a34a' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
                  Auto-saving...
                </span>
              </div>

              {/* Toolbar */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px 10px 0 0', padding: '5px 8px', display: 'flex', alignItems: 'center', gap: 1, background: '#f8fafc', flexWrap: 'wrap' }}>
                {([{ I: FaUndoAlt, c: 'undo', t: 'Undo' }, { I: FaRedoAlt, c: 'redo', t: 'Redo' }] as {I: React.ElementType; c: string; t: string}[]).map(({ I, c, t }) => (
                  <button key={c} title={t} onClick={() => applyFmt(c)} style={toolbarBtnStyle}><I style={{ fontSize: '0.65rem' }} /></button>
                ))}
                <div style={{ width: 1, height: 16, background: '#e2e8f0', margin: '0 4px' }} />
                <select style={{ height: 24, border: '1px solid #e2e8f0', borderRadius: 6, padding: '0 5px', fontSize: '0.7rem', color: '#475569', background: '#fff', cursor: 'pointer' }}>
                  <option>Paragraph</option><option>Heading 1</option><option>Heading 2</option>
                </select>
                <div style={{ width: 1, height: 16, background: '#e2e8f0', margin: '0 4px' }} />
                {([{ I: FaBold, c: 'bold' }, { I: FaItalic, c: 'italic' }, { I: FaUnderline, c: 'underline' }] as {I: React.ElementType; c: string}[]).map(({ I, c }) => (
                  <button key={c} onClick={() => applyFmt(c)} style={toolbarBtnStyle}><I style={{ fontSize: '0.65rem' }} /></button>
                ))}
                <div style={{ width: 1, height: 16, background: '#e2e8f0', margin: '0 4px' }} />
                {([{ I: FaListUl, c: 'insertUnorderedList' }, { I: FaListOl, c: 'insertOrderedList' }] as {I: React.ElementType; c: string}[]).map(({ I, c }) => (
                  <button key={c} onClick={() => applyFmt(c)} style={toolbarBtnStyle}><I style={{ fontSize: '0.65rem' }} /></button>
                ))}
                <div style={{ width: 1, height: 16, background: '#e2e8f0', margin: '0 4px' }} />
                {([{ I: FaAlignLeft, c: 'justifyLeft' }, { I: FaAlignCenter, c: 'justifyCenter' }, { I: FaAlignRight, c: 'justifyRight' }] as {I: React.ElementType; c: string}[]).map(({ I, c }) => (
                  <button key={c} onClick={() => applyFmt(c)} style={toolbarBtnStyle}><I style={{ fontSize: '0.65rem' }} /></button>
                ))}
                <div style={{ width: 1, height: 16, background: '#e2e8f0', margin: '0 4px' }} />
                <button onClick={() => { const u = window.prompt('URL'); if (u) applyFmt('createLink', u) }} style={toolbarBtnStyle}><FaLink style={{ fontSize: '0.65rem' }} /></button>
              </div>

              {/* Content-editable Editor */}
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={() => setText(editorRef.current?.innerText ?? '')}
                onPaste={e => e.preventDefault()}
                onCopy={e => e.preventDefault()}
                onCut={e => e.preventDefault()}
                onContextMenu={e => e.preventDefault()}
                data-placeholder={`Start writing your ${mode} here… Express your thoughts clearly and creatively.`}
                style={{ minHeight: 280, border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '14px 16px', fontSize: '0.9rem', lineHeight: 1.78, color: '#1e293b', outline: 'none', overflowY: 'auto', userSelect: 'none' }}
              />

              {/* Word count footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: '0.73rem', color: '#64748b' }}>
                <span>Words: {wordCount} | Characters: {charCount}</span>
                <span style={{ fontWeight: 600, color: wordCount > wordLimit ? '#dc2626' : '#64748b' }}>
                  {wordCount} / {wordLimit} Words
                </span>
              </div>
            </div>

            {/* Tip */}
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 13px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <FaLightbulb style={{ color: '#f59e0b', fontSize: '0.82rem', marginTop: 2, flexShrink: 0 }} />
              <span style={{ fontSize: '0.76rem', color: '#64748b', lineHeight: 1.55 }}>
                {mode === 'essay'
                  ? 'Tip: A good essay has a clear introduction, body and conclusion. Make sure your ideas are well-organised and supported with examples.'
                  : mode === 'email'
                  ? 'Tip: Keep your email concise and professional. Start with a clear subject and end with a call to action.'
                  : 'Tip: Focus on the main points only. Use your own words and keep it shorter than the original text.'}
              </span>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                disabled={loading || !text.trim() || isLimitReached}
                onClick={handleSubmit}
                style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #ff6a00, #ff9a3c)', color: '#fff', fontSize: '0.85rem', fontWeight: 700, cursor: loading || !text.trim() || isLimitReached ? 'not-allowed' : 'pointer', opacity: loading || !text.trim() || isLimitReached ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
              >
                {loading ? <><Spinner animation="border" size="sm" /> Evaluating…</> : <><FaCheckCircle /> Submit Essay</>}
              </button>
              <button
                onClick={fetchNewTopic}
                disabled={fetchingPrompt}
                style={{ padding: '10px 18px', borderRadius: 10, border: '1.5px solid #e2e8f0', color: '#475569', background: '#f8fafc', fontSize: '0.85rem', fontWeight: 600, cursor: fetchingPrompt ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {fetchingPrompt ? <Spinner animation="border" size="sm" /> : <FaRedo />} New Topic
              </button>
            </div>
          </div>

          {/* ── RIGHT: AI Feedback Panel ── */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', background: '#f8fafc' }}>
            {loading ? (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #6c63ff, #9b93ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(108,99,255,0.3)' }}>
                  <FaFeatherAlt style={{ color: '#fff', fontSize: '1.2rem' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>Analyzing Your Writing</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 5 }}>Our AI is evaluating your grammar, tone, and structure…</div>
                </div>
                <Spinner animation="border" style={{ color: '#6c63ff' }} />
              </div>
            ) : feedback ? (
              <>
                {/* Header with inline score */}
                {(() => {
                  const s = feedback.score <= 10 ? feedback.score * 10 : feedback.score
                  return (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <FaLightbulb style={{ color: '#6c63ff', fontSize: '1rem' }} />
                        <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>AI Feedback</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.62rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1, marginBottom: 2 }}>Overall Score</div>
                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: 2 }}>
                          <span style={{ fontSize: '1.8rem', fontWeight: 900, color: s >= 80 ? '#ff7a00' : s >= 60 ? '#f59e0b' : '#dc2626', lineHeight: 1 }}>{s}</span>
                          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>/100</span>
                        </div>
                        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: s >= 70 ? '#16a34a' : '#dc2626', marginTop: 2 }}>
                          {s >= 70 ? '👍' : '💪'} {getScoreFeedback(s)}
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {/* ── Tabs ── */}
                <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                  {/* Tab bar */}
                  <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
                    {([
                      { key: 'model',    label: 'Model Answer' },
                      { key: 'mistakes', label: 'Mistakes & Improvements' },
                      { key: 'overall',  label: 'Overall Feedback' },
                    ] as { key: typeof feedbackTab; label: string }[]).map(t => (
                      <button
                        key={t.key}
                        onClick={() => setFeedbackTab(t.key)}
                        style={{
                          flex: 1, padding: '11px 6px', border: 'none', background: 'none',
                          fontSize: '0.76rem', fontWeight: feedbackTab === t.key ? 700 : 500,
                          color: feedbackTab === t.key ? '#6c63ff' : '#64748b',
                          borderBottom: feedbackTab === t.key ? '2.5px solid #6c63ff' : '2.5px solid transparent',
                          cursor: 'pointer', transition: 'color 0.15s',
                        }}
                      >{t.label}</button>
                    ))}
                  </div>

                  {/* Tab content */}
                  <div style={{ padding: '16px 18px' }}>

                    {/* Model Answer */}
                    {feedbackTab === 'model' && (
                      <div>
                        {feedback.idealAnswer
                          ? <div style={{ background: '#faf7ff', borderRadius: 10, padding: '14px 16px', border: '1px solid #e9d8fd' }}>
                              {renderStructured(feedback.idealAnswer)}
                            </div>
                          : <div style={{ color: '#94a3b8', fontSize: '0.82rem', textAlign: 'center', padding: '24px 0' }}>No model answer available.</div>
                        }
                      </div>
                    )}

                    {/* Mistakes & Improvements */}
                    {feedbackTab === 'mistakes' && (
                      <div>
                        {feedback.corrections
                          ? <div style={{ background: '#f9fbff', borderRadius: 10, padding: '14px 16px', border: '1px solid #dbeafe' }}>
                              {renderStructured(feedback.corrections)}
                            </div>
                          : <div style={{ color: '#94a3b8', fontSize: '0.82rem', textAlign: 'center', padding: '24px 0' }}>No corrections available.</div>
                        }
                      </div>
                    )}

                    {/* Overall Feedback */}
                    {feedbackTab === 'overall' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {/* Overall */}
                        {feedback.feedback?.overall && (
                          <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#0f172a', marginBottom: 6 }}>Summary</div>
                            <div style={{ fontSize: '0.81rem', color: '#374151', lineHeight: 1.65 }}>{feedback.feedback.overall}</div>
                          </div>
                        )}
                        {/* Grammar + Tone */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          {feedback.feedback?.grammar && (
                            <div style={{ background: '#eff6ff', borderRadius: 10, padding: '12px 14px', border: '1px solid #dbeafe' }}>
                              <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginBottom: 6 }}>
                                <FaEdit style={{ fontSize: '0.65rem', color: '#3b82f6' }} />
                                <span style={{ fontWeight: 700, fontSize: '0.76rem', color: '#1e40af' }}>Grammar</span>
                              </div>
                              <div style={{ fontSize: '0.76rem', color: '#374151', lineHeight: 1.55 }}>{feedback.feedback.grammar}</div>
                            </div>
                          )}
                          {feedback.feedback?.tone && (
                            <div style={{ background: '#fdf2f8', borderRadius: 10, padding: '12px 14px', border: '1px solid #fce7f3' }}>
                              <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginBottom: 6 }}>
                                <FaBullseye style={{ fontSize: '0.65rem', color: '#ec4899' }} />
                                <span style={{ fontWeight: 700, fontSize: '0.76rem', color: '#9d174d' }}>Tone & Structure</span>
                              </div>
                              <div style={{ fontSize: '0.76rem', color: '#374151', lineHeight: 1.55 }}>{feedback.feedback.tone}</div>
                            </div>
                          )}
                        </div>
                        {/* Suggestions */}
                        {feedback.feedback?.suggestions?.length ? (
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#0f172a', marginBottom: 8 }}>Suggestions to Improve</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                              {feedback.feedback.suggestions.slice(0, 4).map((s, i) => {
                                const meta = [
                                  { bg: '#eff6ff', Icon: FaEdit,        ic: '#3b82f6' },
                                  { bg: '#f0fdf4', Icon: FaCheckCircle, ic: '#10b981' },
                                  { bg: '#fffbeb', Icon: FaLightbulb,   ic: '#f59e0b' },
                                  { bg: '#fff1f2', Icon: FaBullseye,    ic: '#ef4444' },
                                ][i % 4]
                                return (
                                  <div key={i} style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 12px', border: '1px solid #e2e8f0', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                    <div style={{ width: 24, height: 24, borderRadius: 7, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                      <meta.Icon style={{ fontSize: '0.58rem', color: meta.ic }} />
                                    </div>
                                    <div style={{ fontSize: '0.74rem', color: '#374151', lineHeight: 1.5 }}>{s}</div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, textAlign: 'center', padding: '2rem' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(108,99,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FaLightbulb style={{ fontSize: '1.6rem', color: '#6c63ff' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a', marginBottom: 6 }}>AI Feedback</div>
                  <div style={{ fontSize: '0.81rem', color: '#64748b', lineHeight: 1.65, maxWidth: 240 }}>
                    Complete your writing and click Submit to receive detailed AI analysis, corrections and improvement suggestions.
                  </div>
                </div>
              </div>
            )}
          </div>
        </Modal.Body>
      </Modal>

      <style>{`
        .writing-practice-modal .modal-header .btn-close {
          filter: brightness(0) saturate(100%) invert(49%) sepia(83%) saturate(1200%) hue-rotate(5deg) brightness(105%);
          opacity: 0.85;
        }
        .writing-practice-modal .modal-header .btn-close:hover { opacity: 1; }
        .writing-practice-modal .modal-dialog { margin: 0; }
        .writing-practice-modal .modal-body > div::-webkit-scrollbar { display: none; }
        .writing-practice-modal .modal-body > div { scrollbar-width: none; -ms-overflow-style: none; }
        [contenteditable]:empty::before {
          content: attr(data-placeholder);
          color: #94a3b8;
          pointer-events: none;
        }
      `}</style>
    </Container>
  )
}

export default WritingPractice
