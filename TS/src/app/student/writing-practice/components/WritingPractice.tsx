import React, { useState, useEffect } from 'react'
import { Container, Spinner, Modal } from 'react-bootstrap'
import { FaFeatherAlt, FaRedo, FaCheckCircle, FaPenAlt, FaEnvelope, FaFileAlt, FaLightbulb, FaClipboardList, FaSearch, FaBullseye, FaEdit, FaClock, FaBold, FaItalic, FaUnderline, FaListUl, FaListOl, FaAlignLeft, FaAlignCenter, FaAlignRight, FaLink, FaUndoAlt, FaRedoAlt, FaStar } from 'react-icons/fa'
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
  trend?: string
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

      setHistory({ attemptsUsed, monthlyLimit, remainingAttempts, bestScore, trend: latest.summary?.trend })
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

  const [historyFilter, setHistoryFilter] = useState<'all' | ModeType>('all')
  const [historyPage, setHistoryPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [goToPage, setGoToPage] = useState('')

  const allAttempts = [...rawAttempts].reverse()
  const filteredAttempts = historyFilter === 'all' ? allAttempts : allAttempts.filter(a => a.mode === historyFilter)
  const historyTotalPages = Math.max(1, Math.ceil(filteredAttempts.length / rowsPerPage))
  const pagedAttempts = filteredAttempts.slice((historyPage - 1) * rowsPerPage, historyPage * rowsPerPage)

  const recentAttempts = [...rawAttempts].reverse().slice(0, 5)

  const normalizeScore = (s: number) => s <= 10 ? s * 10 : s
  const bestScoreComputed = rawAttempts.length > 0
    ? Math.max(...rawAttempts.map(a => normalizeScore(a.score ?? 0)))
    : null
  const avgScore = rawAttempts.length
    ? Math.round(rawAttempts.reduce((sum, a) => sum + normalizeScore(a.score ?? 0), 0) / rawAttempts.length)
    : 0
  const modeAvg = (m: ModeType) => {
    const arr = rawAttempts.filter(a => a.mode === m)
    return arr.length ? Math.round(arr.reduce((s, a) => s + normalizeScore(a.score ?? 0), 0) / arr.length) : null
  }
  const essayAvg = modeAvg('essay')
  const emailAvg = modeAvg('email')
  const summaryAvg = modeAvg('summary')

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
          <div style={{ background: 'linear-gradient(120deg, #fff7f0 0%, #ffedd5 45%, #fed7aa 75%, #fb923c 100%)', border: '1px solid #fdba74', borderRadius: 16, padding: '40px 28px', minHeight: 240, display: 'flex', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden', position: 'relative' }}>

            {/* Watermark dot grid */}
            <div style={{ position: 'absolute', inset: 0, opacity: 0.12, backgroundImage: 'radial-gradient(circle, #c2410c 1.5px, transparent 1.5px)', backgroundSize: '20px 20px', pointerEvents: 'none' }} />

            {/* Watermark text */}
            <div style={{ position: 'absolute', right: 220, top: '50%', transform: 'translateY(-50%) rotate(-18deg)', fontSize: 96, fontWeight: 900, color: 'rgba(234,88,12,0.07)', letterSpacing: -4, pointerEvents: 'none', userSelect: 'none', lineHeight: 1 }}>WRITE</div>

            {/* Watermark rings */}
            <div style={{ position: 'absolute', right: 180, bottom: -40, width: 180, height: 180, borderRadius: '50%', border: '2px solid rgba(234,88,12,0.1)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', right: 200, bottom: -60, width: 240, height: 240, borderRadius: '50%', border: '2px solid rgba(234,88,12,0.06)', pointerEvents: 'none' }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <h2 style={{ fontWeight: 800, fontSize: '1.5rem', color: '#0f172a', marginBottom: 8 }}>Improve Your Writing Skills</h2>
              <p style={{ color: '#7c3d12', fontSize: '0.86rem', marginBottom: 22, lineHeight: 1.6 }}>
                Practice different types of writing, get AI feedback,<br />and improve your communication.
              </p>
              <div style={{ display: 'flex', gap: 28 }}>
                {([
                  { Icon: MODES.essay.statIcon,   count: essayCount,   label: 'Essays Written',     color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
                  { Icon: MODES.email.statIcon,   count: emailCount,   label: 'Emails Written',     color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
                  { Icon: MODES.summary.statIcon, count: summaryCount, label: 'Summaries Written',  color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
                ] as { Icon: React.ElementType; count: number; label: string; color: string; bg: string }[]).map(s => (
                  <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, backdropFilter: 'blur(4px)' }}>
                      <s.Icon style={{ fontSize: '0.95rem', color: s.color }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a', lineHeight: 1 }}>{s.count}</div>
                      <div style={{ fontSize: '0.68rem', color: '#7c3d12', marginTop: 2 }}>{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Illustration */}
            <div style={{ flexShrink: 0, position: 'relative', width: 220, height: 170, userSelect: 'none', zIndex: 1 }}>
              {/* Notebook body */}
              <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 110, height: 148, background: 'linear-gradient(145deg, #5a52d5, #3730a3)', borderRadius: 12, boxShadow: '5px 6px 28px rgba(99,88,255,0.35)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 18px', gap: 8 }}>
                {[100, 80, 65, 50].map((w, i) => (
                  <div key={i} style={{ height: 3.5, background: 'rgba(255,255,255,0.45)', borderRadius: 2, width: `${w}%` }} />
                ))}
                {/* Spine */}
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 14, background: 'rgba(0,0,0,0.18)', borderRadius: '12px 0 0 12px' }} />
                {/* Watermark "W" on notebook */}
                <div style={{ position: 'absolute', bottom: 8, right: 10, fontSize: 28, fontWeight: 900, color: 'rgba(255,255,255,0.08)', lineHeight: 1 }}>W</div>
              </div>
              {/* Pen */}
              <div style={{ position: 'absolute', right: 90, top: 4, transform: 'rotate(-38deg)', transformOrigin: 'bottom center' }}>
                <FaPenAlt style={{ fontSize: '2.6rem', color: '#0f172a', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
              </div>
              {/* Floating envelope bubble */}
              <div style={{ position: 'absolute', left: 4, top: 8, width: 34, height: 34, borderRadius: '50%', background: '#fff', boxShadow: '0 3px 10px rgba(234,88,12,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FaEnvelope style={{ fontSize: '0.9rem', color: '#ff6b00' }} />
              </div>
              {/* Floating edit bubble */}
              <div style={{ position: 'absolute', left: 18, bottom: 8, width: 30, height: 30, borderRadius: '50%', background: '#fff', boxShadow: '0 3px 10px rgba(234,88,12,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FaEdit style={{ fontSize: '0.8rem', color: '#ff6b00' }} />
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

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '16px 20px 12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
                  <span style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,122,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FaEdit style={{ color: '#ff7a00', fontSize: '0.85rem' }} />
                  </span>
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>Recent Writing Practice</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', paddingLeft: 42 }}>Track your latest writing practice and performance.</div>
              </div>
              <button style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid #ff7a00', background: 'transparent', color: '#ff7a00', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}>
                View All <span>→</span>
              </button>
            </div>

            {/* Filter tabs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 20px 12px' }}>
              {([
                { key: 'all',     label: 'All',             count: allAttempts.length },
                { key: 'essay',   label: 'Essay Writing',   count: essayCount },
                { key: 'email',   label: 'Email Writing',   count: emailCount },
                { key: 'summary', label: 'Summary Writing', count: summaryCount },
              ] as { key: 'all' | ModeType; label: string; count: number }[]).map(f => {
                const active = historyFilter === f.key
                return (
                  <button key={f.key} onClick={() => { setHistoryFilter(f.key); setHistoryPage(1) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${active ? '#ff7a00' : '#e2e8f0'}`, background: active ? 'rgba(255,122,0,0.07)' : '#fff', color: active ? '#ff7a00' : '#64748b', fontSize: '0.78rem', fontWeight: active ? 700 : 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {f.label}
                    <span style={{ background: active ? '#ff7a00' : '#f1f5f9', color: active ? '#fff' : '#94a3b8', borderRadius: 10, padding: '1px 7px', fontSize: '0.68rem', fontWeight: 700 }}>
                      {f.count}
                    </span>
                  </button>
                )
              })}
            </div>

            {pagedAttempts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: '#94a3b8', fontSize: '0.82rem' }}>
                {rawAttempts.length === 0 ? 'No writing practice yet. Start your first session!' : 'No entries for this filter.'}
              </div>
            ) : (
              <>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderTop: '1px solid #edf2f7', borderBottom: '1px solid #edf2f7' }}>
                      {['#', 'TYPE', 'TOPIC / TITLE', 'SCORE', 'DATE', 'ACTION'].map((h, hi) => (
                        <th key={h} style={{ padding: '10px 16px', fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textAlign: hi === 0 ? 'center' : 'left', whiteSpace: 'nowrap', letterSpacing: '0.04em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pagedAttempts.map((a, i) => {
                      const cfg = MODES[a.mode as ModeType] ?? MODES.essay
                      const rawScore = a.score
                      const score = rawScore !== undefined ? (rawScore <= 10 ? rawScore * 10 : rawScore) : null
                      const scoreBg = score !== null ? (score >= 80 ? 'rgba(22,163,74,0.1)' : score >= 60 ? 'rgba(245,158,11,0.1)' : 'rgba(220,38,38,0.1)') : '#f1f5f9'
                      const scoreColor = score !== null ? (score >= 80 ? '#16a34a' : score >= 60 ? '#d97706' : '#dc2626') : '#94a3b8'
                      const dt = a.createdAt ? new Date(a.createdAt) : null
                      const dateStr = dt ? dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
                      const timeStr = dt ? dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''
                      const title = a.prompt?.length > 52 ? a.prompt.slice(0, 52) + '…' : (a.prompt || '—')
                      const rowNum = (historyPage - 1) * rowsPerPage + i + 1
                      return (
                        <tr key={a._id ?? i} style={{ borderBottom: '1px solid #edf2f7', transition: 'background 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                          onMouseLeave={e => (e.currentTarget.style.background = '')}>
                          {/* # */}
                          <td style={{ padding: '14px 16px', textAlign: 'center', width: 48 }}>
                            <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>{rowNum}</span>
                          </td>
                          {/* TYPE */}
                          <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                              <span style={{ width: 32, height: 32, borderRadius: 8, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <cfg.Icon style={{ fontSize: '0.85rem', color: cfg.color }} />
                              </span>
                              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b' }}>{cfg.label}</span>
                            </div>
                          </td>
                          {/* TOPIC / TITLE */}
                          <td style={{ padding: '14px 16px', maxWidth: 260 }}>
                            <div style={{ fontSize: '0.82rem', color: '#1e293b', fontWeight: 500, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
                            <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 5, background: cfg.bg, color: cfg.color, fontSize: '0.68rem', fontWeight: 600 }}>{cfg.label}</span>
                          </td>
                          {/* SCORE */}
                          <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                            <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 7, background: scoreBg, color: scoreColor, fontWeight: 700, fontSize: '0.82rem' }}>
                              {score !== null ? `${score}/100` : '—'}
                            </span>
                          </td>
                          {/* DATE */}
                          <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                            <div style={{ fontSize: '0.8rem', color: '#374151', fontWeight: 500 }}>{dateStr}</div>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>{timeStr}</div>
                          </td>
                          {/* ACTION */}
                          <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <button style={{ padding: '0', border: 'none', background: 'none', color: '#3b82f6', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>View Report</button>
                              <button style={{ width: 28, height: 28, border: '1px solid #e2e8f0', borderRadius: 7, background: '#fff', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 700, lineHeight: 1 }}>⋮</button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                {/* Pagination */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid #edf2f7', background: '#fafafa', flexWrap: 'wrap', gap: 8 }}>
                  {/* Left: rows per page */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Rows per page:</span>
                    <select value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setHistoryPage(1) }}
                      style={{ border: '1px solid #e2e8f0', borderRadius: 7, padding: '3px 8px', fontSize: '0.78rem', color: '#374151', background: '#fff', cursor: 'pointer', outline: 'none' }}>
                      {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>

                  {/* Center: page buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button onClick={() => setHistoryPage(p => Math.max(1, p - 1))} disabled={historyPage === 1}
                      style={{ width: 30, height: 30, border: '1px solid #e2e8f0', borderRadius: 7, background: '#fff', color: historyPage === 1 ? '#cbd5e1' : '#475569', cursor: historyPage === 1 ? 'default' : 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
                    {Array.from({ length: historyTotalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === historyTotalPages || Math.abs(p - historyPage) <= 1)
                      .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                        if (idx > 0 && typeof arr[idx - 1] === 'number' && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...')
                        acc.push(p); return acc
                      }, [])
                      .map((p, idx) => p === '...'
                        ? <span key={`e${idx}`} style={{ padding: '0 4px', fontSize: '0.8rem', color: '#94a3b8' }}>...</span>
                        : <button key={p} onClick={() => setHistoryPage(p as number)}
                            style={{ width: 30, height: 30, border: `1px solid ${p === historyPage ? '#ff7a00' : '#e2e8f0'}`, borderRadius: 7, background: p === historyPage ? '#ff7a00' : '#fff', color: p === historyPage ? '#fff' : '#475569', cursor: 'pointer', fontSize: '0.75rem', fontWeight: p === historyPage ? 700 : 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{p}</button>
                      )}
                    <button onClick={() => setHistoryPage(p => Math.min(historyTotalPages, p + 1))} disabled={historyPage === historyTotalPages}
                      style={{ width: 30, height: 30, border: '1px solid #e2e8f0', borderRadius: 7, background: '#fff', color: historyPage === historyTotalPages ? '#cbd5e1' : '#475569', cursor: historyPage === historyTotalPages ? 'default' : 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
                  </div>

                  {/* Right: go to page */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <style>{`#wp-goto-input { width:52px!important; border:1.5px solid #cbd5e1!important; border-radius:7px!important; padding:4px 8px!important; font-size:0.78rem!important; color:#111827!important; background:#f8fafc!important; text-align:center!important; outline:none!important; box-sizing:border-box!important; } #wp-goto-input::-webkit-outer-spin-button, #wp-goto-input::-webkit-inner-spin-button { -webkit-appearance:none; margin:0; }`}</style>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Go to page:</span>
                    <input id="wp-goto-input" type="number" min={1} max={historyTotalPages} value={goToPage}
                      onChange={e => setGoToPage(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { const p = Math.min(historyTotalPages, Math.max(1, Number(goToPage))); if (!isNaN(p)) { setHistoryPage(p); setGoToPage('') } } }}
                    />
                  </div>
                </div>
              </>
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

          {/* Writing Progress Card */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '18px 18px 14px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>

            {/* Header */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>Your Writing Progress</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>
                This Month · {history?.attemptsUsed ?? 0} sessions
              </div>
            </div>

            {/* Attempts row */}
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <FaBullseye style={{ color: '#ff6b00', fontSize: '0.85rem' }} />
                  <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#0f172a' }}>Attempts This Month</span>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ff6b00', background: '#fff7f0', padding: '2px 8px', borderRadius: 20, border: '1px solid #fed7aa' }}>
                  {maxAllowedAttempts - Math.min(history?.attemptsUsed ?? 0, maxAllowedAttempts)} left
                </span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: '#e2e8f0', overflow: 'hidden', marginBottom: 4 }}>
                <div style={{ height: '100%', borderRadius: 3, background: isLimitReached ? '#dc2626' : '#ff6b00', width: `${history ? Math.min((history.attemptsUsed / maxAllowedAttempts) * 100, 100) : 0}%`, transition: 'width 0.5s' }} />
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.7rem', color: '#94a3b8' }}>
                {Math.min(history?.attemptsUsed ?? 0, maxAllowedAttempts)} / {maxAllowedAttempts} used
              </div>
            </div>

            {/* Avg Score + Trend */}
            {(history?.attemptsUsed ?? 0) > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                {/* Circular gauge */}
                <div style={{ position: 'relative', width: 88, height: 88, flexShrink: 0 }}>
                  <svg width="88" height="88" viewBox="0 0 88 88">
                    <circle cx="44" cy="44" r="36" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                    <circle cx="44" cy="44" r="36" fill="none" stroke="#ff6b00" strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 36}`}
                      strokeDashoffset={`${2 * Math.PI * 36 * (1 - avgScore / 100)}`}
                      transform="rotate(-90 44 44)"
                    />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{avgScore}%</div>
                    <div style={{ fontSize: '0.57rem', color: '#94a3b8', marginTop: 2 }}>Avg Score</div>
                  </div>
                </div>
                {/* Trend */}
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#ff6b00', marginBottom: 4 }}>
                    {avgScore >= 80 ? 'Excellent!' : avgScore >= 60 ? 'Good Work!' : avgScore >= 40 ? 'Keep Going!' : 'Keep Practicing!'}
                  </div>
                  <div style={{ fontSize: '0.73rem', color: '#64748b', lineHeight: 1.5 }}>
                    {history?.trend === 'IMPROVED' ? '↑ Improving this month'
                      : history?.trend === 'DROPPED' ? '↓ Needs more practice'
                      : history?.trend === 'FIRST'   ? '🎉 Great start!'
                      : history?.trend === 'SAME'    ? '→ Staying consistent'
                      : 'Keep practicing!'}
                  </div>
                  {isTrial && isLimitReached && (
                    <div style={{ marginTop: 8, fontSize: '0.7rem', color: '#dc2626', background: '#fff1f2', border: '1px solid #fecada', borderRadius: 8, padding: '5px 9px' }}>
                      🔒 Trial limit reached
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Score Bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
              {([
                { label: 'Best Score',      value: bestScoreComputed, color: '#8b5cf6', Icon: FaStar },
                { label: 'Essay Writing',   value: essayAvg,   color: MODES.essay.color,   Icon: MODES.essay.Icon   },
                { label: 'Email Writing',   value: emailAvg,   color: MODES.email.color,   Icon: MODES.email.Icon   },
                { label: 'Summary Writing', value: summaryAvg, color: MODES.summary.color, Icon: MODES.summary.Icon },
              ] as { label: string; value: number | null; color: string; Icon: React.ElementType }[]).map(({ label, value, color, Icon: BIcon }) => (
                <div key={label}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <div style={{ width: 22, height: 22, borderRadius: 6, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <BIcon style={{ fontSize: '0.62rem', color }} />
                      </div>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151' }}>{label}</span>
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: value !== null ? color : '#94a3b8' }}>
                      {value !== null ? `${value}%` : '—'}
                    </span>
                  </div>
                  <div style={{ height: 5, borderRadius: 3, background: '#f1f5f9', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 3, background: color, width: `${value ?? 0}%`, transition: 'width 0.5s' }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Footer button */}
            <button style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#374151', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              View Detailed Feedback <span style={{ fontSize: '0.9rem', marginLeft: 2 }}>›</span>
            </button>
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
