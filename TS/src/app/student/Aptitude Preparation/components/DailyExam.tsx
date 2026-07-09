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

  // ─── Derived data ────────────────────────────────────────────────────────────
  const stats = calendarData?.stats
  const bestScore = calendarData
    ? Math.max(0, ...calendarData.days.filter(d => d.attended && d.score != null && d.total).map(d => Math.round((d.score! / d.total!) * 100)))
    : 0

  const ROTATION_ORDER = ['Aptitude', 'Reasoning', 'Technical', 'Puzzle'] as const
  const todayCatIdx = ROTATION_ORDER.indexOf((todayData?.category ?? '') as any)
  const upcomingRotation = todayCatIdx >= 0
    ? [1, 2, 3, 4].map((offset, i) => ({
        label: i === 0 ? 'Tomorrow' : i === 1 ? 'Day After Tomorrow' : `In ${i + 1} Days`,
        cat: ROTATION_ORDER[(todayCatIdx + offset) % ROTATION_ORDER.length],
      }))
    : []

  const CAT_THEME: Record<string, { bg: string; color: string; icon: string; desc: string }> = {
    Aptitude:  { bg: '#fef3c7', color: '#d97706', icon: '🧮', desc: 'Quantitative ability and DI questions' },
    Reasoning: { bg: '#dcfce7', color: '#16a34a', icon: '🧩', desc: 'Logic, puzzles, seating arrangement & more' },
    Technical: { bg: '#dbeafe', color: '#2563eb', icon: '💻', desc: 'Programming, DBMS, OS, Computer Networks' },
    Puzzle:    { bg: '#fee2e2', color: '#dc2626', icon: '🔮', desc: 'Puzzles, patterns, series & more' },
  }

  const CATEGORY_DESC: Record<string, string> = {
    Aptitude:  'Quantitative ability questions on numbers, ratios, percentages, profit & loss and more.',
    Reasoning: 'Logical reasoning, syllogisms, blood relations, seating arrangement & more.',
    Technical: 'Programming, DBMS, OS, Computer Networks and core CS concepts.',
    Puzzle:    'Puzzles, patterns, number series & more.',
  }

  function getCellStyle(day: CalendarDay): { bg: string; pctColor: string; scoreColor: string } {
    if (day.isFuture) return { bg: '#ffffff', pctColor: '#cbd5e1', scoreColor: '#cbd5e1' }
    if (!day.attended) return { bg: '#f8fafc', pctColor: '#94a3b8', scoreColor: '#94a3b8' }
    const pct = day.score != null && day.total ? (day.score / day.total) * 100 : 0
    if (pct >= 60) return { bg: '#f0fdf4', pctColor: '#16a34a', scoreColor: '#16a34a' }
    if (pct >= 30) return { bg: '#fefce8', pctColor: '#ca8a04', scoreColor: '#ca8a04' }
    return { bg: '#fff1f2', pctColor: '#dc2626', scoreColor: '#dc2626' }
  }

  const today = new Date()
  const weekLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Today']
  const weeklyScores = Array.from({ length: 7 }, (_, i) => {
    if (i === 6) {
      const d = calendarData?.days.find(day => day.isToday)
      return d?.attended && d.score != null && d.total ? Math.round((d.score / d.total) * 100) : 0
    }
    const dt = new Date(today)
    dt.setDate(today.getDate() - 6 + i)
    const iso = dt.toISOString().split('T')[0]
    const d = calendarData?.days.find(day => day.date === iso)
    return d?.attended && d.score != null && d.total ? Math.round((d.score / d.total) * 100) : 0
  })

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ color: '#0f172a' }}>
      <style>{`
        @keyframes da-spin  { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        @keyframes da-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .da-opt-btn { transition: all 0.15s ease; }
        .da-opt-btn:hover { background: rgba(255,122,0,0.12) !important; border-color: #ff7a00 !important; }
      `}</style>

      {/* ── Top stat bar ── */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 22, alignItems: 'stretch' }}>
        {/* How it works */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.78rem' }}>How it works?</div>
            <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: 1 }}>One category every day on rotation</div>
          </div>
        </div>
        {/* Tests Attempted */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
          </div>
          <div>
            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.05rem', lineHeight: 1 }}>{stats?.totalAttended ?? 0}</div>
            <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: 2 }}>Tests Attempted</div>
          </div>
        </div>
        {/* Average Score */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="16 12 12 8 8 12"/><line x1="12" y1="16" x2="12" y2="8"/></svg>
          </div>
          <div>
            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.05rem', lineHeight: 1 }}>{stats?.avgScore ?? 0}%</div>
            <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: 2 }}>Average Score</div>
          </div>
        </div>
        {/* Best Score */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(251,191,36,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          </div>
          <div>
            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.05rem', lineHeight: 1 }}>{bestScore}%</div>
            <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: 2 }}>Best Score</div>
          </div>
        </div>
        {/* Day Streak */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(249,115,22,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          </div>
          <div>
            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.05rem', lineHeight: 1 }}>{stats?.streak ?? 0}</div>
            <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: 2 }}>Day Streak</div>
          </div>
        </div>
      </div>

      {/* ── Main 2-column layout ── */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'stretch', marginBottom: 20 }}>

        {/* ── LEFT: Today's exam + Upcoming rotation ── */}
        <div style={{ width: 440, flexShrink: 0 }}>

          {/* Today's Exam card */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <div style={{ padding: '14px 18px 10px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>Today's Exam</div>
              <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: 2 }}>Category rotates daily</div>
            </div>

            <div style={{ padding: '16px 18px' }}>
              {loadingToday ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '30px 0' }}>
                  <div style={{ width: 28, height: 28, border: '3px solid rgba(99,102,241,0.2)', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'da-spin 1s linear infinite' }} />
                </div>
              ) : !todayData ? (
                <p style={{ color: '#94a3b8', textAlign: 'center', fontSize: '0.8rem', margin: '20px 0' }}>Failed to load today's exam.</p>
              ) : (
                <>
                  {/* Category badge row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: CAT_THEME[todayData.category]?.bg ?? 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                        {CATEGORY_ICONS[todayData.category] ?? '📝'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem' }}>{todayData.category}</div>
                        <div style={{ fontSize: '0.62rem', color: '#94a3b8', marginTop: 1 }}>
                          {new Date(todayData.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: 'rgba(255,122,0,0.1)', color: '#ff7a00', border: '1px solid rgba(255,122,0,0.2)' }}>
                      Today's Category
                    </span>
                  </div>

                  {/* Description */}
                  <div style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1.5, marginBottom: 14 }}>
                    {CATEGORY_DESC[todayData.category] ?? 'Practice questions for today\'s daily exam.'}
                  </div>

                  {/* Exam stats */}
                  <div style={{ display: 'flex', background: '#1a1760', borderRadius: 10, padding: '11px 4px', marginBottom: 14 }}>
                    {[
                      { label: 'Questions', val: todayData.totalQuestions },
                      { label: 'Duration', val: '30 Min' },
                      { label: 'Total Marks', val: todayData.totalQuestions * 1 },
                      { label: 'For Correct', val: '+1' },
                    ].map((item) => (
                      <div key={item.label} style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '0.88rem', lineHeight: 1.1 }}>{item.val}</div>
                        <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.5)', marginTop: 3, lineHeight: 1.2 }}>{item.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Action */}
                  {todayData.alreadyAttempted && todayData.attempt ? (
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 700, marginBottom: 4 }}>✅ Completed Today!</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#16a34a', lineHeight: 1 }}>
                          {todayData.attempt.score}<span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>/{todayData.attempt.total}</span>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ height: 6, borderRadius: 20, background: '#dcfce7', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Math.round((todayData.attempt.score / todayData.attempt.total) * 100)}%`, background: '#16a34a', borderRadius: 20 }} />
                          </div>
                          <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: 3 }}>
                            {Math.round((todayData.attempt.score / todayData.attempt.total) * 100)}% accuracy
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : todayData.error ? (
                    <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 10, padding: '10px 14px', fontSize: '0.72rem', color: '#dc2626' }}>
                      ⚠️ {todayData.error}
                    </div>
                  ) : (
                    <button onClick={openQuiz} style={{
                      width: '100%', padding: '12px', borderRadius: 10, border: 'none',
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      color: '#fff', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      Start Exam
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Upcoming Rotation */}
          {upcomingRotation.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
              <div style={{ padding: '14px 18px 10px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>Upcoming Rotation</div>
              </div>
              <div style={{ padding: '8px 0' }}>
                {upcomingRotation.map(({ label, cat }) => {
                  const theme = CAT_THEME[cat]
                  return (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 18px', borderBottom: '1px solid #f8fafc' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: theme?.bg ?? '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                        {CATEGORY_ICONS[cat] ?? theme?.icon ?? '📝'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.82rem' }}>{cat}</div>
                        <div style={{ fontSize: '0.62rem', color: '#94a3b8', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{theme?.desc}</div>
                      </div>
                      <div style={{
                        fontSize: '0.6rem', fontWeight: 700,
                        color: theme?.color ?? '#64748b',
                        background: theme?.bg ?? '#f1f5f9',
                        padding: '4px 10px', borderRadius: 20, flexShrink: 0, whiteSpace: 'nowrap',
                        border: `1px solid ${theme?.color ?? '#e2e8f0'}33`,
                      }}>
                        {label}
                      </div>
                    </div>
                  )
                })}
                <div style={{ padding: '10px 18px' }}>
                  <button style={{ background: 'none', border: 'none', color: '#6366f1', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, padding: 0 }}>
                    View Rotation Schedule
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Progress Calendar ── */}
        <div style={{ flex: 1, minWidth: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
          {/* Calendar header */}
          <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>Your Progress Calendar</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button onClick={() => setCalendarMonth(p => { const m = p.month === 1 ? 12 : p.month - 1; const y = p.month === 1 ? p.year - 1 : p.year; return { year: y, month: m } })}
                style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: 14 }}>‹</button>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', minWidth: 80, textAlign: 'center' }}>{monthName(calendarMonth.month)} {calendarMonth.year}</span>
              <button onClick={() => setCalendarMonth(p => { const m = p.month === 12 ? 1 : p.month + 1; const y = p.month === 12 ? p.year + 1 : p.year; return { year: y, month: m } })}
                style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: 14 }}>›</button>
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, padding: '7px 18px', borderBottom: '1px solid #f1f5f9', flexWrap: 'nowrap', alignItems: 'center' }}>
            {[
              { color: '#16a34a', bg: '#f0fdf4', label: 'Attempted (≥60%)' },
              { color: '#ca8a04', bg: '#fefce8', label: 'Attempted (<60%)' },
              { color: '#dc2626', bg: '#fff1f2', label: 'Attempted (Poor)' },
              { color: '#94a3b8', bg: '#f8fafc', label: 'Absent' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                <div style={{ width: 11, height: 11, borderRadius: 2, background: item.bg, border: `1.5px solid ${item.color}`, flexShrink: 0 }} />
                <span style={{ fontSize: '0.62rem', color: '#475569', whiteSpace: 'nowrap' }}>{item.label}</span>
              </div>
            ))}
          </div>

          {/* Unified calendar grid — day names + cells in one grid, single gap colour, no double borders */}
          <div style={{ flex: 1, overflow: 'hidden', padding: '10px 16px 16px' }}>
          {loadingCalendar ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 40 }}>
              <div style={{ width: 24, height: 24, border: '3px solid rgba(99,102,241,0.2)', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'da-spin 1s linear infinite' }} />
            </div>
          ) : calendarData ? (
            (() => {
              const firstDay = new Date(calendarMonth.year, calendarMonth.month - 1, 1).getDay()
              const prevMonthLast = new Date(calendarMonth.year, calendarMonth.month - 1, 0).getDate()
              const daysInMonth = calendarData.days.length
              const cells: (CalendarDay | null)[] = Array(firstDay).fill(null).concat(calendarData.days)
              while (cells.length % 7 !== 0) cells.push(null)
              const numWeeks = cells.length / 7
              return (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gridTemplateRows: `32px repeat(${numWeeks}, 80px)`,
                  gap: 6,
                  background: '#f1f5f9',
                  border: '6px solid #f1f5f9',
                  borderRadius: 12,
                  overflow: 'hidden',
                }}>
                  {/* Day name header row */}
                  {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                    <div key={d} style={{ background: '#fff', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.05em' }}>
                      {d}
                    </div>
                  ))}
                  {/* Calendar day cells */}
                  {cells.map((day, ci) => {
                    if (!day) {
                      const outDate = ci < firstDay
                        ? prevMonthLast - firstDay + ci + 1
                        : ci - firstDay - daysInMonth + 1
                      return (
                        <div key={`n${ci}`} style={{ background: '#fff', borderRadius: 6, padding: '8px 10px' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#d1d5db' }}>{outDate}</span>
                        </div>
                      )
                    }
                    const dateNum = parseInt(day.date.split('-')[2])
                    const cs = getCellStyle(day)
                    const pct = day.attended && day.score != null && day.total ? Math.round((day.score / day.total) * 100) : null
                    return (
                      <div key={`d${ci}`} style={{
                        padding: '7px 9px',
                        background: day.isToday ? '#ede9fe' : cs.bg,
                        borderRadius: 6,
                        outline: day.isToday ? '2px solid #7c3aed' : 'none',
                        outlineOffset: '-2px',
                        cursor: day.attended ? 'pointer' : 'default',
                        overflow: 'hidden',
                      }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: day.isToday ? '#7c3aed' : day.isFuture ? '#d1d5db' : '#374151', lineHeight: 1, marginBottom: 5 }}>
                          {dateNum}
                        </div>
                        {pct != null ? (
                          <>
                            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: cs.pctColor, lineHeight: 1 }}>{pct}%</div>
                            <div style={{ fontSize: '0.62rem', color: cs.scoreColor, marginTop: 3, lineHeight: 1 }}>{day.score}/{day.total}</div>
                          </>
                        ) : day.isToday ? (
                          <>
                            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#7c3aed', lineHeight: 1 }}>Today</div>
                            {day.category && <div style={{ fontSize: '0.6rem', color: '#7c3aed', marginTop: 3, lineHeight: 1 }}>{day.category}</div>}
                          </>
                        ) : !day.isFuture ? (
                          <div style={{ fontSize: '0.62rem', color: '#94a3b8', lineHeight: 1 }}>Absent</div>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              )
            })()
          ) : null}
          </div>
        </div>
      </div>

      {/* ── Bottom info section ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 16 }}>

        {/* Why Daily Practice */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.82rem' }}>Why Daily Practice?</div>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b', lineHeight: 1.5, marginBottom: 10 }}>Consistent practice improves accuracy, speed and confidence.</div>
          {['Build consistency', 'Track progress', 'Improve every day'].map(t => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              <span style={{ fontSize: '0.72rem', color: '#475569' }}>{t}</span>
            </div>
          ))}
        </div>

        {/* Tips to Score Better */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.82rem' }}>Tips to Score Better</div>
          </div>
          {['Attempt daily tests', 'Analyze your mistakes', 'Focus on weak areas', 'Stay consistent'].map(t => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              <span style={{ fontSize: '0.72rem', color: '#475569' }}>{t}</span>
            </div>
          ))}
        </div>

        {/* Performance This Week */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            </div>
            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.82rem' }}>Performance This Week</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 72 }}>
            {weeklyScores.map((score, i) => {
              const h = Math.max(4, (score / 100) * 60)
              const isToday = i === 6
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  {score > 0 && <div style={{ fontSize: '0.52rem', fontWeight: 700, color: isToday ? '#6366f1' : '#94a3b8' }}>{score}%</div>}
                  <div style={{ width: '100%', height: h, borderRadius: 4, background: isToday ? '#6366f1' : score >= 60 ? '#22c55e' : score > 0 ? '#fbbf24' : '#f1f5f9', transition: 'height 0.3s' }} />
                  <div style={{ fontSize: '0.52rem', color: '#94a3b8', fontWeight: 600 }}>{weekLabels[i]}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Overall Progress */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 150 }}>
          <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.82rem', marginBottom: 12 }}>Overall Progress</div>
          {(() => {
            const avg = stats?.avgScore ?? 0
            const r = 36, sw = 7, circ = 2 * Math.PI * r, dash = (avg / 100) * circ
            return (
              <div style={{ position: 'relative', width: 90, height: 90 }}>
                <svg width={90} height={90} viewBox="0 0 90 90">
                  <circle cx={45} cy={45} r={r} fill="none" stroke="#f1f5f9" strokeWidth={sw} />
                  <circle cx={45} cy={45} r={r} fill="none" stroke="#6366f1" strokeWidth={sw}
                    strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                    transform="rotate(-90 45 45)" style={{ transition: 'stroke-dasharray 0.5s ease' }} />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{avg}%</div>
                  <div style={{ fontSize: '0.5rem', color: '#94a3b8', marginTop: 2, textAlign: 'center', lineHeight: 1.3 }}>Average Score</div>
                </div>
              </div>
            )
          })()}
          <div style={{ fontSize: '0.62rem', color: '#64748b', marginTop: 10, textAlign: 'center', lineHeight: 1.4 }}>Keep it up! You are doing great.</div>
        </div>
      </div>

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
