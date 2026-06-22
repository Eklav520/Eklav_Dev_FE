import React, { useEffect, useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useAuthContext } from '@/context/useAuthContext'
import { useProctorGuard } from '@/app/student/final-assessment/helper/useProctorGuard'
import ViolationAlert from '@/app/student/final-assessment/components/ViolationAlert'

// ─── Types ───────────────────────────────────────────────────────────────────

type Question = {
  _id: string
  question: string
  questionType?: 'text' | 'image'
  questionImageUrl?: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  topic?: string
  // Only present after submission
  correctOptionKey?: string
  explanation?: string
}

type TodayData = {
  category: string
  categoryDbTitle?: string
  date: string
  totalQuestions: number
  questions: Question[]
  alreadyAttempted: boolean
  attempt: { score: number; total: number; submittedAt: string } | null
  error?: string
}

type CalendarDay = {
  date: string
  category: string
  attended: boolean
  score: number | null
  total: number | null
  isFuture: boolean
  isToday: boolean
}

type CalendarData = {
  days: CalendarDay[]
  stats: { totalAttended: number; streak: number; avgScore: number }
}

type ResultItem = {
  questionId: string
  correct: boolean
  correctKey: string | null
  selectedKey: string
  explanation?: string | null
  question: string
  optionA: string; optionB: string; optionC: string; optionD: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, { bg: string; border: string; badge: string }> = {
  Aptitude:  { bg: 'rgba(59,130,246,0.12)',  border: '#3b82f6', badge: '#3b82f6' },
  Reasoning: { bg: 'rgba(139,92,246,0.12)', border: '#8b5cf6', badge: '#8b5cf6' },
  Technical: { bg: 'rgba(34,197,94,0.12)',  border: '#22c55e', badge: '#22c55e' },
  Puzzle:    { bg: 'rgba(249,115,22,0.12)', border: '#f97316', badge: '#f97316' },
}
const CATEGORY_ICONS: Record<string, string> = {
  Aptitude: '🧮', Reasoning: '🧩', Technical: '💻', Puzzle: '🔮',
}
const EXAM_DURATION_SECONDS = 15 * 60 // 15 minutes

function getCategoryStyle(cat: string) {
  return CATEGORY_COLORS[cat] ?? { bg: 'rgba(255,122,0,0.1)', border: '#ff7a00', badge: '#ff7a00' }
}

function formatTime(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0')
  const s = (secs % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function monthName(month: number) {
  return new Date(2000, month - 1, 1).toLocaleString('default', { month: 'long' })
}

// ─── Main component ───────────────────────────────────────────────────────────

const DailyExam: React.FC = () => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const token = user?.token

  // Today's exam state
  const [todayData, setTodayData] = useState<TodayData | null>(null)
  const [loadingToday, setLoadingToday] = useState(true)

  // Quiz modal state
  const [quizOpen, setQuizOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({})  // questionId → selectedKey
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [results, setResults] = useState<ResultItem[]>([])
  const [finalScore, setFinalScore] = useState<{
    score: number; total: number;
    rank?: number; totalAttempts?: number; timeTakenSeconds?: number
  } | null>(null)
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION_SECONDS)
  const [startTime, setStartTime] = useState<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [showViolationAlert, setShowViolationAlert] = useState(false)

  const proctor = useProctorGuard(
    { maxViolations: 3, enabled: quizOpen && !submitted, captureFullscreenExit: true, autoReenterFullscreen: false, preventEscFullscreen: true },
    {
      onMaxReached: () => {
        setShowViolationAlert(true)
        setTimeout(() => doSubmit(userAnswers), 3000)
      },
    }
  )

  // Show alert whenever proctor raises a lock (reliable — avoids calling setState inside setState updater)
  useEffect(() => {
    if (proctor.locked && quizOpen && !submitted) {
      setShowViolationAlert(true)
    }
  }, [proctor.locked, quizOpen, submitted])

  // When window regains focus after Alt+Tab, immediately show violation popup
  useEffect(() => {
    if (!quizOpen || submitted) return
    const handleFocus = () => {
      if (proctor.violationCount > 0) setShowViolationAlert(true)
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [quizOpen, submitted, proctor.violationCount])

  // Calendar state
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null)
  const [calendarMonth, setCalendarMonth] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 })
  const [loadingCalendar, setLoadingCalendar] = useState(false)
  const [activeTab, setActiveTab] = useState<'today' | 'calendar'>('today')

  // ── Fetch today ────────────────────────────────────────────────────────────
  const fetchToday = useCallback(async () => {
    if (!token) return
    setLoadingToday(true)
    try {
      const res = await fetch(`${baseURL}/api/student/daily-aptitude/today`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) setTodayData(data)
    } catch (e) {
      console.error('daily exam fetch error', e)
    } finally {
      setLoadingToday(false)
    }
  }, [baseURL, token])

  useEffect(() => { fetchToday() }, [fetchToday])

  // ── Fetch calendar ─────────────────────────────────────────────────────────
  const fetchCalendar = useCallback(async () => {
    if (!token) return
    setLoadingCalendar(true)
    try {
      const res = await fetch(
        `${baseURL}/api/student/daily-aptitude/calendar?year=${calendarMonth.year}&month=${calendarMonth.month}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const data = await res.json()
      if (data.success) setCalendarData(data)
    } catch (e) {
      console.error('calendar fetch error', e)
    } finally {
      setLoadingCalendar(false)
    }
  }, [baseURL, token, calendarMonth])

  useEffect(() => { fetchCalendar() }, [fetchCalendar])

  // ── Timer ──────────────────────────────────────────────────────────────────
  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }

  const startTimer = () => {
    stopTimer()
    setTimeLeft(EXAM_DURATION_SECONDS)
    setStartTime(Date.now())
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { stopTimer(); handleAutoSubmit(); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  useEffect(() => () => stopTimer(), [])


  // ── Open / close quiz ──────────────────────────────────────────────────────
  const openQuiz = async () => {
    // Enter fullscreen first — must be synchronous with the user click gesture
    await proctor.enterFullscreen()
    setCurrentIndex(0)
    setUserAnswers({})
    setSubmitted(false)
    setResults([])
    setFinalScore(null)
    setShowViolationAlert(false)
    setQuizOpen(true)
    startTimer()
    proctor.arm()
  }

  const closeQuiz = () => {
    stopTimer()
    proctor.disarm()
    proctor.reset()
    setShowViolationAlert(false)
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    setQuizOpen(false)
    if (submitted) fetchToday()
  }

  // ── Answer ─────────────────────────────────────────────────────────────────
  const selectAnswer = (questionId: string, key: string) => {
    if (submitted) return
    setUserAnswers(prev => ({ ...prev, [questionId]: key }))
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  const doSubmit = async (answers: Record<string, string>) => {
    if (!todayData || submitting) return
    stopTimer()
    proctor.disarm()
    setSubmitting(true)
    const timeTaken = Math.round((Date.now() - startTime) / 1000)
    try {
      const payload = {
        answers: todayData.questions.map(q => ({
          questionId: q._id,
          selectedKey: answers[q._id] || '',
        })),
        timeTakenSeconds: timeTaken,
      }
      const res = await fetch(`${baseURL}/api/student/daily-aptitude/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        setResults(data.results || [])
        setFinalScore({
          score: data.score,
          total: data.total,
          rank: data.rank,
          totalAttempts: data.totalAttempts,
          timeTakenSeconds: data.timeTakenSeconds,
        })
        setSubmitted(true)
        fetchCalendar()
      }
    } catch (e) {
      console.error('submit error', e)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = () => doSubmit(userAnswers)
  const handleAutoSubmit = () => doSubmit(userAnswers)

  const answeredCount = todayData ? Object.keys(userAnswers).length : 0
  const questions = todayData?.questions || []
  const catStyle = getCategoryStyle(todayData?.category || '')
  const timerWarning = timeLeft <= 60

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ color: '#f0f0f0', minHeight: 400 }}>
      <style>{`
        @keyframes da-spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        @keyframes da-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .da-opt-btn { transition: all 0.15s ease; }
        .da-opt-btn:hover { background: rgba(255,122,0,0.12) !important; border-color: #ff7a00 !important; }
      `}</style>

      {/* ── Top Tabs ── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #1e1e28', paddingBottom: 0 }}>
        {([
          { key: 'today',    label: "Today's Exam",
            icon: (active: boolean) => (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={active ? '#ff7a00' : '#555'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            ),
          },
          { key: 'calendar', label: 'Progress Calendar',
            icon: (active: boolean) => (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={active ? '#ff7a00' : '#555'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
            ),
          },
        ] as const).map(({ key, label, icon }) => {
          const active = activeTab === key
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                background: 'none', border: 'none',
                padding: '10px 20px',
                fontWeight: 700, fontSize: 13,
                cursor: 'pointer',
                color: active ? '#ff7a00' : '#555',
                borderBottom: active ? '2px solid #ff7a00' : '2px solid transparent',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: 7,
              }}
            >
              {icon(active)}
              {label}
            </button>
          )
        })}
      </div>

      {/* ════════════ TODAY TAB ════════════ */}
      {activeTab === 'today' && (
        <div>
          {loadingToday ? (
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
              <div style={{ width: 36, height: 36, border: '3px solid rgba(255,122,0,0.2)', borderTop: '3px solid #ff7a00', borderRadius: '50%', animation: 'da-spin 1s linear infinite' }} />
            </div>
          ) : !todayData ? (
            <p style={{ color: '#666', textAlign: 'center', paddingTop: 40 }}>Failed to load today's exam.</p>
          ) : (
            <div style={{ maxWidth: 640, margin: '0 auto' }}>

              {/* Category hero card */}
              <div style={{
                background: catStyle.bg, border: `1.5px solid ${catStyle.border}`,
                borderRadius: 16, padding: '28px 28px 24px', marginBottom: 20,
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', top: -20, right: -20, fontSize: 80, opacity: 0.07, userSelect: 'none' }}>
                  {CATEGORY_ICONS[todayData.category] ?? '📝'}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 28 }}>{CATEGORY_ICONS[todayData.category] ?? '📝'}</span>
                  <div>
                    <div style={{ fontSize: 11, color: '#888', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 1 }}>Today's Category</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>{todayData.category}</div>
                  </div>
                  <div style={{ marginLeft: 'auto' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                      background: `${catStyle.badge}22`, color: catStyle.badge, border: `1px solid ${catStyle.badge}44`,
                    }}>
                      {new Date(todayData.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                  {[
                    { label: 'Questions', val: todayData.totalQuestions },
                    { label: 'Duration', val: '15 min' },
                    { label: 'Status', val: todayData.alreadyAttempted ? '✅ Done' : '⏳ Pending' },
                  ].map(item => (
                    <div key={item.label} style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: '8px 14px', flex: 1, textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{item.label}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{item.val}</div>
                    </div>
                  ))}
                </div>

                {todayData.alreadyAttempted && todayData.attempt ? (
                  <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: '16px 20px' }}>
                    <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>Today's Result</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ fontSize: 36, fontWeight: 900, color: catStyle.badge }}>
                        {todayData.attempt.score}
                        <span style={{ fontSize: 16, color: '#666', fontWeight: 400 }}>/{todayData.attempt.total}</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ height: 8, borderRadius: 20, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.round((todayData.attempt.score / todayData.attempt.total) * 100)}%`, background: catStyle.badge, borderRadius: 20, transition: 'none' }} />
                        </div>
                        <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                          {Math.round((todayData.attempt.score / todayData.attempt.total) * 100)}% correct
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: '#555', marginTop: 8 }}>
                      Come back tomorrow for the next exam!
                    </div>
                  </div>
                ) : todayData.error ? (
                  <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '12px 16px' }}>
                    <div style={{ color: '#ef4444', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>⚠️ Questions not available</div>
                    <div style={{ color: '#888', fontSize: 11, lineHeight: 1.6, wordBreak: 'break-word' }}>{todayData.error}</div>
                  </div>
                ) : (
                  <button
                    onClick={openQuiz}
                    style={{
                      width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                      background: `linear-gradient(135deg, #ff7a00, #ff9a3c)`,
                      color: '#fff', fontWeight: 800, fontSize: 16, cursor: 'pointer',
                      boxShadow: '0 6px 20px rgba(255,122,0,0.35)',
                    }}
                  >
                    Start Today's Exam →
                  </button>
                )}
              </div>

              {/* Rotation legend */}
              <div style={{ background: '#0e0e14', border: '1px solid #1e1e28', borderRadius: 12, padding: '14px 18px' }}>
                <div style={{ fontSize: 11, color: '#555', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8 }}>Daily Rotation</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(['Aptitude', 'Reasoning', 'Technical', 'Puzzle'] as const).map(cat => {
                    const s = getCategoryStyle(cat)
                    const isToday = cat === todayData.category
                    return (
                      <span key={cat} style={{
                        fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20,
                        background: isToday ? `${s.badge}22` : 'rgba(255,255,255,0.04)',
                        color: isToday ? s.badge : '#555',
                        border: isToday ? `1.5px solid ${s.badge}55` : '1.5px solid #1e1e28',
                      }}>
                        {CATEGORY_ICONS[cat]} {cat}
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════ CALENDAR TAB ════════════ */}
      {activeTab === 'calendar' && (
        <div style={{ maxWidth: 680, margin: '0 auto' }}>

          {/* Stats row */}
          {calendarData?.stats && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              {/* Total Attended */}
              <div style={{ flex: 1, background: '#0e0e14', border: '1px solid #1e1e28', borderRadius: 14, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#22c55e', lineHeight: 1 }}>{calendarData.stats.totalAttended}</div>
                  <div style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: 0.7, fontWeight: 600, marginTop: 4 }}>Total Attended</div>
                </div>
              </div>

              {/* Current Streak */}
              <div style={{ flex: 1, background: '#0e0e14', border: '1px solid #1e1e28', borderRadius: 14, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#fb923c', lineHeight: 1 }}>{calendarData.stats.streak} <span style={{ fontSize: 13, fontWeight: 600 }}>days</span></div>
                  <div style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: 0.7, fontWeight: 600, marginTop: 4 }}>Current Streak</div>
                </div>
              </div>

              {/* Avg Score */}
              <div style={{ flex: 1, background: '#0e0e14', border: '1px solid #1e1e28', borderRadius: 14, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#6366f1', lineHeight: 1 }}>{calendarData.stats.avgScore}<span style={{ fontSize: 13, fontWeight: 600 }}>%</span></div>
                  <div style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: 0.7, fontWeight: 600, marginTop: 4 }}>Avg Score</div>
                </div>
              </div>
            </div>
          )}

          {/* Month navigator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <button
              onClick={() => setCalendarMonth(p => {
                const m = p.month === 1 ? 12 : p.month - 1
                const y = p.month === 1 ? p.year - 1 : p.year
                return { year: y, month: m }
              })}
              style={{ background: '#1a1a24', border: '1px solid #2a2a38', borderRadius: 8, color: '#aaa', padding: '6px 14px', cursor: 'pointer', fontSize: 16 }}
            >‹</button>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#f0f0f0' }}>
              {monthName(calendarMonth.month)} {calendarMonth.year}
            </span>
            <button
              onClick={() => setCalendarMonth(p => {
                const m = p.month === 12 ? 1 : p.month + 1
                const y = p.month === 12 ? p.year + 1 : p.year
                return { year: y, month: m }
              })}
              style={{ background: '#1a1a24', border: '1px solid #2a2a38', borderRadius: 8, color: '#aaa', padding: '6px 14px', cursor: 'pointer', fontSize: 16 }}
            >›</button>
          </div>

          {loadingCalendar ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
              <div style={{ width: 28, height: 28, border: '3px solid rgba(255,122,0,0.2)', borderTop: '3px solid #ff7a00', borderRadius: '50%', animation: 'da-spin 1s linear infinite' }} />
            </div>
          ) : calendarData ? (
            <div style={{ background: '#0e0e14', border: '1px solid #1e1e28', borderRadius: 14, overflow: 'hidden' }}>
              {/* Day headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: '#0a0a10', borderBottom: '1px solid #1a1a24' }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} style={{ textAlign: 'center', padding: '8px 4px', fontSize: 10, fontWeight: 700, color: '#444', textTransform: 'uppercase', letterSpacing: 0.5 }}>{d}</div>
                ))}
              </div>

              {/* Calendar grid */}
              {(() => {
                const firstDay = new Date(calendarMonth.year, calendarMonth.month - 1, 1).getDay()
                const cells: (CalendarDay | null)[] = Array(firstDay).fill(null).concat(calendarData.days)
                while (cells.length % 7 !== 0) cells.push(null)
                const weeks = []
                for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

                return weeks.map((week, wi) => (
                  <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: wi < weeks.length - 1 ? '1px solid #1a1a24' : 'none' }}>
                    {week.map((day, di) => {
                      if (!day) return <div key={di} style={{ padding: '10px 4px', minHeight: 60 }} />
                      const cs = getCategoryStyle(day.category)
                      // Two-state dot: green = attended, red = not attended (past only)
                      const dotColor = day.isFuture
                        ? 'transparent'
                        : day.attended ? '#22c55e' : '#ef4444'
                      const showDot = !day.isFuture
                      const dateNum = parseInt(day.date.split('-')[2])
                      return (
                        <div
                          key={di}
                          title={day.attended ? `${day.category}: ${day.score}/${day.total}` : day.isFuture ? 'Upcoming' : day.isToday ? 'Today — not attempted' : 'Not attended'}
                          style={{
                            padding: '8px 6px', minHeight: 60,
                            background: day.isToday ? 'rgba(255,122,0,0.08)' : 'transparent',
                            borderLeft: di > 0 ? '1px solid #1a1a24' : 'none',
                            position: 'relative',
                            cursor: day.attended ? 'pointer' : 'default',
                            outline: day.isToday ? '1.5px solid rgba(255,122,0,0.35)' : 'none',
                            outlineOffset: '-1px',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                            <span style={{
                              fontSize: 12, fontWeight: day.isToday ? 800 : 600,
                              color: day.isToday ? '#ff7a00' : day.isFuture ? '#333' : '#888',
                            }}>{dateNum}</span>
                            {showDot && (
                              <span style={{
                                width: 10, height: 10, borderRadius: '50%',
                                background: dotColor,
                                display: 'inline-block',
                                flexShrink: 0,
                                boxShadow: day.attended
                                  ? '0 0 6px 2px rgba(34,197,94,0.6)'
                                  : '0 0 6px 2px rgba(239,68,68,0.6)',
                              }} />
                            )}
                          </div>
                          <div style={{ fontSize: 8, color: day.isFuture ? '#2a2a38' : cs.badge, fontWeight: 700, marginBottom: 2, lineHeight: 1.2 }}>
                            {day.category.slice(0, 3).toUpperCase()}
                          </div>
                          {day.attended && day.score !== null && (
                            <div style={{ fontSize: 9, color: '#22c55e', fontWeight: 700 }}>{day.score}/{day.total}</div>
                          )}
                          {day.isToday && !day.attended && (
                            <div style={{ fontSize: 8, color: '#ff7a00', animation: 'da-pulse 1.5s ease infinite' }}>TODAY</div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))
              })()}

              {/* Legend */}
              <div style={{ display: 'flex', gap: 20, padding: '10px 16px', borderTop: '1px solid #1a1a24', background: '#0a0a10' }}>
                {[
                  { color: '#22c55e', label: 'Attended' },
                  { color: '#ef4444', label: 'Not Attended' },
                  { isToday: true, label: 'Today' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {item.isToday ? (
                      <span style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(255,122,0,0.2)', border: '1.5px solid rgba(255,122,0,0.5)', display: 'inline-block' }} />
                    ) : (
                      <span style={{
                        width: 10, height: 10, borderRadius: '50%',
                        background: (item as any).color, display: 'inline-block',
                        boxShadow: (item as any).color === '#22c55e'
                          ? '0 0 6px 2px rgba(34,197,94,0.6)'
                          : '0 0 6px 2px rgba(239,68,68,0.6)',
                      }} />
                    )}
                    <span style={{ fontSize: 10, color: '#555' }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ════════════ QUIZ — portalled to document.body so it's above all parent stacking contexts ════════════ */}
      {quizOpen && todayData && createPortal(
        <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', background: '#07070f', zIndex: 999999, overflow: 'hidden' }}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#07070f', color: '#f0f0f0', fontFamily: 'inherit', position: 'relative' }}>
          <style>{`
            @keyframes exam-pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
            .exam-opt:hover { border-color: #ff7a00 !important; background: rgba(255,122,0,0.08) !important; }
            .exam-qnum:hover { opacity: 0.85; }
          `}</style>

          {/* ══ TOP BAR ══ */}
          <div style={{
            height: 58, flexShrink: 0,
            display: 'flex', alignItems: 'center', gap: 16,
            padding: '0 28px',
            background: '#0c0c18',
            borderBottom: '2px solid #1a1a28',
          }}>
            {/* Brand + exam title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                background: `${catStyle.badge}22`,
                border: `1px solid ${catStyle.badge}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16,
              }}>{CATEGORY_ICONS[todayData.category]}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#f0f0f0', lineHeight: 1.2 }}>
                  {todayData.category} — Daily Exam
                </div>
                <div style={{ fontSize: 11, color: '#444' }}>
                  {new Date(todayData.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
            </div>

            {/* Progress bar + count */}
            {!submitted && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 140, height: 5, borderRadius: 10, background: '#1a1a28', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(answeredCount / questions.length) * 100}%`, background: '#22c55e', borderRadius: 10, transition: 'none' }} />
                </div>
                <span style={{ fontSize: 12, color: '#555', whiteSpace: 'nowrap', fontWeight: 600 }}>
                  {answeredCount}/{questions.length}
                </span>
              </div>
            )}

            {/* Violation indicator */}
            {!submitted && proctor.violationCount > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(239,68,68,0.12)', border: '1.5px solid rgba(239,68,68,0.35)',
                borderRadius: 10, padding: '6px 14px', fontSize: 12, fontWeight: 700,
                color: '#ef4444', cursor: 'pointer',
              }} onClick={() => setShowViolationAlert(true)}>
                ⚠️ {proctor.violationCount}/{proctor.maxViolations} violations
              </div>
            )}

            {/* Timer */}
            {!submitted && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 7,
                background: timerWarning ? 'rgba(239,68,68,0.12)' : '#111120',
                border: `1.5px solid ${timerWarning ? '#ef4444' : '#252535'}`,
                borderRadius: 10, padding: '7px 16px',
                fontFamily: 'monospace', fontSize: 17, fontWeight: 900,
                color: timerWarning ? '#ef4444' : '#f0f0f0',
                animation: timerWarning ? 'exam-pulse 0.9s ease infinite' : 'none',
                letterSpacing: 1,
              }}>
                ⏱ {formatTime(timeLeft)}
              </div>
            )}
          </div>

          {/* ══ BODY ══ */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: '#07070f' }}>

            {/* ── Results view ── */}
            {submitted && finalScore ? (
              <div style={{ flex: 1, overflowY: 'auto', background: '#07070f' }}>
                <div style={{ maxWidth: 760, margin: '0 auto', padding: '36px 28px' }}>
                {/* Score hero */}
                <div style={{
                  textAlign: 'center', background: '#0c0c18',
                  border: `1.5px solid ${catStyle.border}35`,
                  borderRadius: 18, padding: '40px 32px', marginBottom: 28,
                }}>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, color: '#33334a', marginBottom: 16 }}>Exam Completed</div>
                  <div style={{ fontSize: 84, fontWeight: 900, color: catStyle.badge, lineHeight: 1, marginBottom: 8 }}>
                    {finalScore.score}
                    <span style={{ fontSize: 40, color: '#252535', fontWeight: 500 }}>/{finalScore.total}</span>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
                    {Math.round((finalScore.score / finalScore.total) * 100)}% Score
                  </div>
                  <div style={{ fontSize: 13, color: '#44445a', marginBottom: 24 }}>
                    {finalScore.score >= Math.ceil(finalScore.total * 0.7) ? '🎉 Excellent! You\'re on fire.' : finalScore.score >= Math.ceil(finalScore.total * 0.4) ? '👍 Good effort. Review your mistakes.' : '💪 Keep practising — you\'ll get there!'}
                  </div>
                  <div style={{ height: 8, borderRadius: 20, background: '#141424', overflow: 'hidden', marginBottom: 24, maxWidth: 380, margin: '0 auto 24px' }}>
                    <div style={{ height: '100%', width: `${Math.round((finalScore.score / finalScore.total) * 100)}%`, background: catStyle.badge, borderRadius: 20, transition: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 40, flexWrap: 'wrap' }}>
                    {[
                      { label: 'Correct', val: finalScore.score, color: '#22c55e' },
                      { label: 'Wrong', val: finalScore.total - finalScore.score, color: '#ef4444' },
                      { label: 'Total', val: finalScore.total, color: '#555' },
                    ].map(s => (
                      <div key={s.label} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 30, fontWeight: 900, color: s.color }}>{s.val}</div>
                        <div style={{ fontSize: 10, color: '#33334a', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 3 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Rank + time taken row */}
                  <div style={{ display: 'flex', gap: 12, marginTop: 28, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {finalScore.rank !== undefined && (
                      <div style={{
                        flex: '1 1 140px', maxWidth: 180,
                        background: 'rgba(255,122,0,0.08)', border: '1.5px solid rgba(255,122,0,0.25)',
                        borderRadius: 14, padding: '16px 20px', textAlign: 'center',
                      }}>
                        <div style={{ fontSize: 32, marginBottom: 4 }}>🏆</div>
                        <div style={{ fontSize: 28, fontWeight: 900, color: '#ff7a00', lineHeight: 1 }}>
                          #{finalScore.rank}
                        </div>
                        <div style={{ fontSize: 10, color: '#554433', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 4 }}>
                          Your Rank
                        </div>
                        {finalScore.totalAttempts !== undefined && (
                          <div style={{ fontSize: 11, color: '#554433', marginTop: 3 }}>
                            out of {finalScore.totalAttempts} students
                          </div>
                        )}
                      </div>
                    )}
                    {finalScore.timeTakenSeconds !== undefined && (
                      <div style={{
                        flex: '1 1 140px', maxWidth: 180,
                        background: 'rgba(99,102,241,0.08)', border: '1.5px solid rgba(99,102,241,0.25)',
                        borderRadius: 14, padding: '16px 20px', textAlign: 'center',
                      }}>
                        <div style={{ fontSize: 32, marginBottom: 4 }}>⏱️</div>
                        <div style={{ fontSize: 28, fontWeight: 900, color: '#6366f1', lineHeight: 1, fontFamily: 'monospace' }}>
                          {formatTime(finalScore.timeTakenSeconds)}
                        </div>
                        <div style={{ fontSize: 10, color: '#333355', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 4 }}>
                          Time Taken
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Answer review */}
                <div style={{ fontSize: 10, color: '#33334a', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12, fontWeight: 700 }}>Answer Review</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {results.map((r, i) => (
                    <div key={r.questionId} style={{
                      background: '#0c0c18',
                      borderLeft: `4px solid ${r.correct ? '#22c55e' : '#ef4444'}`,
                      borderRadius: 10, padding: '14px 18px',
                    }}>
                      <div style={{ display: 'flex', gap: 10, marginBottom: 6, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#33334a', flexShrink: 0, paddingTop: 3, minWidth: 24 }}>Q{i + 1}</span>
                        <div style={{ fontSize: 13, color: '#ccc', lineHeight: 1.6 }}>{r.question}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 20, paddingLeft: 34, fontSize: 12, flexWrap: 'wrap' }}>
                        <span style={{ color: r.correct ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                          Your: {r.selectedKey ? `Option ${r.selectedKey}` : 'Skipped'}
                        </span>
                        {!r.correct && r.correctKey && (
                          <span style={{ color: '#22c55e', fontWeight: 600 }}>Correct: Option {r.correctKey}</span>
                        )}
                      </div>
                      {r.explanation && (
                        <div style={{ fontSize: 11, color: '#44445a', marginTop: 8, paddingLeft: 34, lineHeight: 1.7, borderTop: '1px solid #141424', paddingTop: 8 }}>
                          💡 {r.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  onClick={closeQuiz}
                  style={{ marginTop: 28, width: '100%', padding: 15, borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#ff7a00,#ff9a3c)', color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer', boxShadow: '0 6px 24px rgba(255,122,0,0.3)' }}
                >
                  Done — View Progress Calendar →
                </button>
                </div>
              </div>

            ) : (
              /* ══ TWO-PANEL EXAM VIEW ══ */
              <>
                {/* ── LEFT SIDEBAR ── */}
                <div style={{
                  width: 240, flexShrink: 0,
                  background: '#0a0a15',
                  borderRight: '1px solid #141422',
                  display: 'flex', flexDirection: 'column',
                }}>
                  <div style={{ padding: '20px 18px 14px', borderBottom: '1px solid #141422' }}>
                    <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, color: '#33334a', marginBottom: 14, fontWeight: 700 }}>
                      Question Palette
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[
                        { color: '#ff7a00', label: 'Current' },
                        { color: '#22c55e', label: 'Answered' },
                        { color: '#141424', label: 'Not visited', border: '#252535' },
                      ].map(item => (
                        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 12, height: 12, borderRadius: 4, background: item.color, border: (item as any).border ? `1px solid ${(item as any).border}` : 'none', flexShrink: 0 }} />
                          <span style={{ fontSize: 11, color: '#44445a' }}>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Number grid */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                      {questions.map((q, idx) => {
                        const answered = !!userAnswers[q._id]
                        const isCurrent = idx === currentIndex
                        return (
                          <button
                            key={q._id}
                            onClick={() => setCurrentIndex(idx)}
                            style={{
                              aspectRatio: '1', borderRadius: 8, border: 'none',
                              background: isCurrent ? '#ff7a00' : answered ? '#22c55e' : '#141424',
                              color: isCurrent || answered ? '#fff' : '#44445a',
                              fontSize: 12, fontWeight: 700, cursor: 'pointer',
                              boxShadow: isCurrent ? '0 0 0 3px rgba(255,122,0,0.3)' : 'none',
                            }}
                          >{idx + 1}</button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Answered summary */}
                  <div style={{ padding: '16px 18px 20px', borderTop: '1px solid #141422' }}>
                    <div style={{
                      background: '#0e0e1c', borderRadius: 10, padding: '12px 14px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <div>
                        <div style={{ fontSize: 10, color: '#33334a', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 }}>Answered</div>
                        <div style={{ fontSize: 20, fontWeight: 900, color: '#22c55e' }}>
                          {answeredCount}<span style={{ color: '#33334a', fontWeight: 500, fontSize: 13 }}>/{questions.length}</span>
                        </div>
                      </div>
                      <svg viewBox="0 0 40 40" style={{ transform: 'rotate(-90deg)', width: 40, height: 40 }}>
                        <circle cx="20" cy="20" r="16" fill="none" stroke="#161626" strokeWidth="4" />
                        <circle cx="20" cy="20" r="16" fill="none" stroke="#22c55e" strokeWidth="4"
                          strokeDasharray={`${2 * Math.PI * 16}`}
                          strokeDashoffset={`${2 * Math.PI * 16 * (1 - answeredCount / questions.length)}`}
                          style={{ transition: 'none' }}
                        />
                      </svg>
                    </div>
                    {answeredCount < questions.length && (
                      <div style={{ fontSize: 10, color: '#33334a', textAlign: 'center', marginTop: 8 }}>
                        {questions.length - answeredCount} question{questions.length - answeredCount > 1 ? 's' : ''} remaining
                      </div>
                    )}
                  </div>
                </div>

                {/* ── RIGHT CONTENT PANEL ── */}
                <div style={{ flex: 1, background: '#07070f', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  {(() => {
                    const q = questions[currentIndex]
                    if (!q) return null
                    const selected = userAnswers[q._id] || ''
                    return (
                      <>
                        {/* Question meta bar */}
                        <div style={{
                          padding: '16px 36px', borderBottom: '1px solid #141422',
                          background: '#0a0a15', flexShrink: 0,
                          display: 'flex', alignItems: 'center', gap: 12,
                        }}>
                          <span style={{
                            fontSize: 12, fontWeight: 800, padding: '4px 14px', borderRadius: 6,
                            background: `${catStyle.badge}18`, color: catStyle.badge,
                            border: `1px solid ${catStyle.badge}30`,
                          }}>
                            Q {currentIndex + 1} / {questions.length}
                          </span>
                          {q.topic && (
                            <>
                              <span style={{ color: '#252535' }}>•</span>
                              <span style={{ fontSize: 11, color: '#33334a', textTransform: 'uppercase', letterSpacing: 1 }}>{q.topic}</span>
                            </>
                          )}
                        </div>

                        {/* Scrollable question area */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '40px 40px 24px' }}>
                          <div style={{ fontSize: 18, color: '#f0f0f0', fontWeight: 600, lineHeight: 1.8, marginBottom: 36, maxWidth: 680 }}>
                            {q.questionType === 'image' && q.questionImageUrl
                              ? <img src={q.questionImageUrl} alt="Question" style={{ maxWidth: '100%', borderRadius: 10, marginBottom: 16 }} />
                              : q.question
                            }
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 640 }}>
                            {(['A', 'B', 'C', 'D'] as const).map(key => {
                              const text = q[`option${key}` as keyof Question] as string
                              if (!text) return null
                              const isSelected = selected === key
                              return (
                                <button
                                  key={key}
                                  className="exam-opt"
                                  onClick={() => selectAnswer(q._id, key)}
                                  style={{
                                    textAlign: 'left', padding: '16px 20px', borderRadius: 12,
                                    border: `1.5px solid ${isSelected ? '#ff7a00' : '#1a1a28'}`,
                                    background: isSelected ? 'rgba(255,122,0,0.1)' : '#0c0c18',
                                    color: isSelected ? '#ffb067' : '#aaa',
                                    fontWeight: isSelected ? 600 : 400, fontSize: 15, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 16,
                                    boxShadow: isSelected ? '0 0 0 1px rgba(255,122,0,0.2)' : 'none',
                                  }}
                                >
                                  <span style={{
                                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                                    background: isSelected ? '#ff7a00' : '#141424',
                                    border: `1.5px solid ${isSelected ? '#ff7a00' : '#252535'}`,
                                    color: isSelected ? '#fff' : '#44445a',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 12, fontWeight: 800,
                                  }}>{key}</span>
                                  {text}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {/* Bottom nav */}
                        <div style={{
                          padding: '14px 40px', borderTop: '1px solid #141422',
                          background: '#0a0a15', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}>
                          <button
                            onClick={() => setCurrentIndex(i => Math.max(i - 1, 0))}
                            disabled={currentIndex === 0}
                            style={{
                              padding: '11px 28px', borderRadius: 10,
                              border: '1.5px solid #1a1a28', background: 'transparent',
                              color: currentIndex === 0 ? '#1a1a28' : '#666',
                              cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
                              fontWeight: 700, fontSize: 13,
                            }}
                          >← Previous</button>

                          <span style={{ fontSize: 11, color: '#252535' }}>{currentIndex + 1} of {questions.length}</span>

                          {currentIndex < questions.length - 1 ? (
                            <button
                              onClick={() => setCurrentIndex(i => i + 1)}
                              style={{
                                padding: '11px 32px', borderRadius: 10,
                                border: 'none', background: '#141424',
                                color: '#e0e0f0', cursor: 'pointer', fontWeight: 700, fontSize: 13,
                              }}
                            >Next →</button>
                          ) : (
                            <button
                              onClick={handleSubmit}
                              disabled={submitting}
                              style={{
                                padding: '11px 32px', borderRadius: 10, border: 'none',
                                background: 'linear-gradient(135deg,#ff7a00,#ff9a3c)',
                                color: '#fff', cursor: submitting ? 'not-allowed' : 'pointer',
                                fontWeight: 800, fontSize: 13,
                                boxShadow: '0 4px 16px rgba(255,122,0,0.3)',
                              }}
                            >
                              {submitting ? 'Submitting…' : 'Submit Exam →'}
                            </button>
                          )}
                        </div>
                      </>
                    )
                  })()}
                </div>
              </>
            )}
          </div>
        </div>
        </div>,
        document.body
      )}

      {quizOpen && createPortal(
        <>
          <style>{`.violation-alert.modal { z-index: 1000000 !important; }`}</style>
          <ViolationAlert
            show={showViolationAlert}
            count={proctor.violationCount}
            maxViolations={proctor.maxViolations}
            onClose={() => {
              setShowViolationAlert(false)
              proctor.acknowledge()
              proctor.enterFullscreen()
            }}
          />
        </>,
        document.body
      )}

    </div>
  )
}

export default DailyExam
