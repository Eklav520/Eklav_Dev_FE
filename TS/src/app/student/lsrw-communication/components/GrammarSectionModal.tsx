import { useEffect, useMemo, useRef, useState } from 'react'
import {
  FaArrowLeft, FaArrowRight, FaTimes, FaBookmark, FaRegBookmark, FaClock,
  FaShieldAlt, FaExclamationTriangle, FaVideoSlash,
  FaCheckCircle, FaTimesCircle, FaGraduationCap,
} from 'react-icons/fa'
import { useGazeDetection } from '@/app/student/self-interview/components/useGazeDetection'
import GazeScanOverlay from '@/app/student/self-interview/components/GazeScanOverlay'
import { useProctorGuard } from '@/app/student/final-assessment/helper/useProctorGuard'
import { useAuthContext } from '@/context/useAuthContext'

const PAGE_BG     = 'var(--dash-page-bg, #f8fafc)'
const CARD_BG     = 'var(--dash-card-bg, #ffffff)'
const PAGE_BORDER = 'var(--dash-border, #e2e8f0)'
const PAGE_TEXT   = 'var(--dash-text, #0f172a)'
const PAGE_GRAY   = 'var(--dash-gray, #64748b)'

const ORANGE = '#ff7a00'
const DEFAULT_QUESTION_COUNT = 10
const DEFAULT_TIME_LIMIT_SEC = 30 // used only for placeholder slots with no admin-set time limit

type GrammarItem = { _id: string; category: string; type: 'mcq' | 'fill'; question: string; options?: string[]; marks: number; timeLimit?: number; correctAnswer?: string }

// Placeholder fallback — used only while no real admin-uploaded questions
// have loaded yet (fetched from /api/student/lsrw-grammar-content).
const placeholderQuestion = (i: number) => ({
  number: i + 1,
  itemId: undefined as string | undefined,
  category: 'Verbs/Tenses',
  type: 'mcq' as const,
  question: i === 0
    ? 'The doctor and the lawyer are ________, and they ________ golf in their free time.'
    : `Placeholder grammar question ${i + 1} — replace with a real question.`,
  options: ['Siblings, plays', 'Siblings, play', 'Sibling, plays', 'Sibling, play'],
  timeLimit: DEFAULT_TIME_LIMIT_SEC,
  correctAnswer: undefined as string | undefined,
})

const buildQuestions = (items: GrammarItem[]) => {
  const count = items.length || DEFAULT_QUESTION_COUNT
  return Array.from({ length: count }, (_, i) => {
    const real = items[i]
    if (!real) return placeholderQuestion(i)
    return {
      number: i + 1,
      itemId: real._id,
      category: real.category,
      type: real.type,
      question: real.question,
      options: real.options ?? [],
      timeLimit: real.timeLimit ?? DEFAULT_TIME_LIMIT_SEC,
      correctAnswer: real.correctAnswer,
    }
  })
}

const fmtClock = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

type Props = {
  show: boolean
  onClose: () => void
  onSubmitted?: (result?: { scoreAwarded: number; totalMarks: number; submissionId: string }) => void
  practiceMode?: boolean
}

const GrammarSectionModal = ({ show, onClose, onSubmitted, practiceMode }: Props) => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [current, setCurrent]     = useState(1)
  const [mcqAnswers, setMcqAnswers] = useState<Record<number, number>>({})   // question number -> selected option index
  const [fillAnswers, setFillAnswers] = useState<Record<number, string>>({}) // question number -> typed answer
  const [marked, setMarked]     = useState<Set<number>>(new Set())
  const [showResults, setShowResults] = useState(false)

  // Real admin-uploaded questions — falls back to placeholder slots (see
  // buildQuestions) for anything not yet uploaded.
  const [items, setItems] = useState<GrammarItem[]>([])
  useEffect(() => {
    if (!show || !user?.token) return
    setShowResults(false)
    submittedRef.current = false
    fetch(`${baseURL}/api/student/lsrw-grammar-content${practiceMode ? '?practice=true' : ''}`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then((r) => r.json())
      .then((data) => { if (data.success) setItems(data.items) })
      .catch(() => {})
  }, [show, user?.token, baseURL, practiceMode])

  const QUESTIONS = useMemo(() => buildQuestions(items), [items])
  const TOTAL_QUESTIONS = QUESTIONS.length

  const q = QUESTIONS[current - 1]
  const key = current

  // ── Per-question countdown — each question carries its own admin-set time
  // limit (like Listening/Reading/Speaking/Jumbled), not one whole-section
  // timer. Reaching zero auto-advances to the next question.
  const [secondsLeft, setSecondsLeft] = useState(q?.timeLimit ?? DEFAULT_TIME_LIMIT_SEC)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const submittedRef = useRef(false)

  const handleSubmit = async () => {
    if (submittedRef.current) return
    submittedRef.current = true
    if (timerRef.current) clearInterval(timerRef.current)
    if (practiceMode) {
      setShowResults(true)
      return
    }

    const answered = QUESTIONS.filter((qq) => qq.itemId)
    const items = answered.map((qq) => ({
      itemId: qq.itemId,
      answer: qq.type === 'mcq'
        ? (mcqAnswers[qq.number] !== undefined ? qq.options[mcqAnswers[qq.number]] : '')
        : (fillAnswers[qq.number] || ''),
    }))

    let result: { scoreAwarded: number; totalMarks: number; submissionId: string } | undefined
    if (items.length > 0 && user?.token) {
      try {
        const res = await fetch(`${baseURL}/api/student/lsrw-grammar-content/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
          body: JSON.stringify({
            items,
            exitedEarly: false,
            violations: {
              tabSwitches: proctor.violationCount,
              lookingAway: gaze.violationCount,
              headTurned: gaze.headViolationCount,
              faceCovered: gaze.maskViolationCount,
              faceNotVisible: gaze.noFaceViolationCount,
            },
          }),
        })
        const data = await res.json()
        if (data.success) {
          result = {
            scoreAwarded: data.submission.totalScoreAwarded,
            totalMarks: data.submission.totalMarks,
            submissionId: data.submission._id,
          }
        }
      } catch { /* still close even if the save fails — don't block the student */ }
    }

    onSubmitted?.(result)
    onClose()
  }

  useEffect(() => {
    if (!show || !q) return
    if (timerRef.current) clearInterval(timerRef.current)
    setSecondsLeft(q.timeLimit)
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          if (current < TOTAL_QUESTIONS) setCurrent((c) => c + 1)
          else handleSubmit()
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, current, q?.timeLimit])

  // ── Camera + face/gaze proctoring — identical setup to the other LSRW
  // sections (same reused hooks; real, live detection, not fabricated; no
  // backend persistence yet for this round).
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)

  useEffect(() => {
    if (!show || practiceMode) {
      cameraStream?.getTracks().forEach((t) => t.stop())
      setCameraStream(null)
      setCameraError(null)
      return
    }
    let cancelled = false
    navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 320 }, height: { ideal: 240 }, facingMode: 'user' } })
      .then((stream) => {
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return }
        stream.getVideoTracks().forEach((track) => {
          track.onended = () => {
            setCameraStream(null)
            setCameraError('Camera was closed or disconnected. Proctoring has stopped.')
          }
        })
        setCameraStream(stream)
      })
      .catch(() => { if (!cancelled) setCameraError('Camera access denied or unavailable.') })
    return () => {
      cancelled = true
      cameraStream?.getTracks().forEach((t) => t.stop())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, practiceMode])

  useEffect(() => {
    if (videoEl && cameraStream) {
      videoEl.srcObject = cameraStream
      videoEl.play().catch(() => {})
    }
  }, [videoEl, cameraStream])

  const gaze = useGazeDetection(videoEl, !!cameraStream, false, { useExternalStream: true })
  const faceViolationCount = gaze.violationCount + gaze.headViolationCount + gaze.maskViolationCount + gaze.noFaceViolationCount

  const proctor = useProctorGuard(
    { maxViolations: 9999, enabled: show && !practiceMode, captureFullscreenExit: false, autoReenterFullscreen: false, preventEscFullscreen: false },
    {}
  )
  useEffect(() => {
    if (show && !practiceMode) proctor.arm()
    else proctor.disarm()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, practiceMode])

  const goTo = (n: number) => {
    if (n < 1 || n > TOTAL_QUESTIONS) return
    setCurrent(n)
  }

  const selectMcqOption = (idx: number) => setMcqAnswers((prev) => ({ ...prev, [key]: idx }))
  const setFillAnswer = (val: string) => setFillAnswers((prev) => ({ ...prev, [key]: val }))

  const toggleMark = () => {
    setMarked((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const saveAndNext = () => goTo(current + 1)

  const isAnswered = (n: number) => q?.type === 'fill' ? fillAnswers[n] !== undefined && fillAnswers[n].trim() !== '' : mcqAnswers[n] !== undefined

  const stateOf = (n: number): 'current' | 'marked' | 'answered' | 'notVisited' => {
    if (n === current) return 'current'
    if (marked.has(n)) return 'marked'
    if (isAnswered(n)) return 'answered'
    return 'notVisited'
  }

  const paletteStyle: Record<string, { bg: string; color: string; border: string }> = {
    current:    { bg: ORANGE,     color: '#fff', border: ORANGE },
    marked:     { bg: '#8b5cf6',  color: '#fff', border: '#8b5cf6' },
    answered:   { bg: '#22c55e',  color: '#fff', border: '#22c55e' },
    notVisited: { bg: CARD_BG,    color: PAGE_TEXT, border: PAGE_BORDER },
  }

  const isLastQuestion = current === TOTAL_QUESTIONS
  const timeCritical = secondsLeft <= 60

  const isCorrect = (n: number, question: typeof QUESTIONS[number]) => {
    if (!question.correctAnswer) return null
    if (question.type === 'mcq') {
      const idx = mcqAnswers[n]
      return idx !== undefined && question.options[idx] === question.correctAnswer
    }
    const typed = (fillAnswers[n] || '').trim().toLowerCase()
    return typed !== '' && typed === question.correctAnswer.trim().toLowerCase()
  }

  if (!show || !q) return null

  if (showResults) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 999999, background: PAGE_BG, overflowY: 'auto' }}>
        <div style={{ minHeight: '100vh', padding: '40px 24px', maxWidth: 820, margin: '0 auto', fontFamily: '"Segoe UI", system-ui, sans-serif' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FaGraduationCap size={20} color={ORANGE} />
              <span style={{ fontSize: 19, fontWeight: 800, color: PAGE_TEXT }}>Practice Results — Grammar</span>
            </div>
            <button
              onClick={onClose}
              style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${PAGE_BORDER}`, background: CARD_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <FaTimes size={13} color={PAGE_GRAY} />
            </button>
          </div>
          <p style={{ color: PAGE_GRAY, fontSize: 13, margin: '0 0 20px' }}>
            This was a practice attempt — nothing was saved or scored towards your real record.
          </p>
          {QUESTIONS.map((question, idx) => {
            const correct = isCorrect(question.number, question)
            const yourAnswer = question.type === 'mcq'
              ? (mcqAnswers[question.number] !== undefined ? question.options[mcqAnswers[question.number]] : undefined)
              : fillAnswers[question.number]
            return (
              <div key={question.number} style={{ background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 14, padding: '16px 20px', marginBottom: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: PAGE_TEXT }}>Question {idx + 1}</span>
                  {correct !== null && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: correct ? '#16a34a' : '#dc2626' }}>
                      {correct ? <FaCheckCircle size={12} /> : <FaTimesCircle size={12} />}
                      {correct ? 'Correct' : 'Incorrect'}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: PAGE_TEXT, marginBottom: 8, fontWeight: 600 }}>{question.question}</div>
                <div style={{ fontSize: 12.5, color: PAGE_GRAY, marginBottom: 4 }}>
                  <strong>Your answer:</strong> {yourAnswer || <em>(not answered)</em>}
                </div>
                {!correct && question.correctAnswer && (
                  <div style={{ fontSize: 12.5, color: '#16a34a' }}>
                    <strong>Correct answer:</strong> {question.correctAnswer}
                  </div>
                )}
              </div>
            )
          })}
          <button
            onClick={onClose}
            style={{ display: 'block', margin: '20px auto 0', background: ORANGE, border: 'none', borderRadius: 10, padding: '12px 30px', fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer' }}
          >
            Done
          </button>
        </div>
      </div>
    )
  }

  return (
    // Full-page takeover — same pattern as the other LSRW sections and
    // Final Assessment's live exam rounds (a plain fixed div, not a
    // react-bootstrap Modal), so there's no backdrop/z-index stacking to fight.
    <div style={{ position: 'fixed', inset: 0, zIndex: 999999, background: PAGE_BG, overflowY: 'auto' }}>
      <button
        onClick={onClose}
        aria-label="Close"
        style={{
          position: 'fixed', top: 14, right: 20, zIndex: 1,
          width: 32, height: 32, borderRadius: 8, border: `1px solid ${PAGE_BORDER}`, background: CARD_BG,
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}
      >
        <FaTimes size={13} color={PAGE_GRAY} />
      </button>
      <div style={{ padding: '56px 24px 20px', fontFamily: '"Segoe UI", system-ui, sans-serif' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'stretch' }}>

          {/* ── Main Column ─────────────────────────────── */}
          <div>
            {/* Section header */}
            <div style={{ background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 14, padding: '16px 20px', marginBottom: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: ORANGE, fontWeight: 800, fontSize: 16 }}>G</span>
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: PAGE_TEXT }}>Section: Grammar</div>
                    <div style={{ color: PAGE_GRAY, fontSize: 12.5 }}>MCQ + Fill in the Blanks — each question has its own time limit.</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {practiceMode && (
                    <span style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #16a34a44', borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700 }}>
                      PRACTICE — not scored or saved
                    </span>
                  )}
                  <span style={{ background: '#fff7ed', color: ORANGE, border: '1px solid #fed7aa', borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700 }}>{TOTAL_QUESTIONS} Questions</span>
                  <span style={{
                    display: 'flex', alignItems: 'center', gap: 6, borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 800,
                    background: timeCritical ? '#fef2f2' : '#fff7ed', color: timeCritical ? '#dc2626' : ORANGE,
                    border: `1px solid ${timeCritical ? '#fca5a5' : '#fed7aa'}`,
                  }}>
                    <FaClock size={11} /> {fmtClock(secondsLeft)}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 14, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: ORANGE, fontWeight: 800, fontSize: 15 }}>Question {current} / {TOTAL_QUESTIONS}</span>
                  <span style={{ background: PAGE_BG, border: `1px solid ${PAGE_BORDER}`, color: PAGE_GRAY, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>{q.category}</span>
                </div>
                <button
                  onClick={toggleMark}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: marked.has(key) ? '#8b5cf6' : PAGE_GRAY, fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
                >
                  {marked.has(key) ? <FaBookmark size={12} /> : <FaRegBookmark size={12} />} Mark for Review
                </button>
              </div>

              <p style={{ fontSize: 13.5, color: PAGE_TEXT, margin: '0 0 12px' }}>
                {q.type === 'mcq' ? 'Choose the most appropriate option.' : 'Type the word/phrase that correctly fills the blank.'}
              </p>
              <div style={{ fontWeight: 700, fontSize: 14.5, color: PAGE_TEXT, marginBottom: 16 }}>{q.question}</div>

              {q.type === 'mcq' ? (
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10, marginBottom: 16 }}>
                  {q.options.map((opt, idx) => {
                    const selected = mcqAnswers[key] === idx
                    return (
                      <label
                        key={idx}
                        onClick={() => selectMcqOption(idx)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                          border: `1.5px solid ${selected ? ORANGE : PAGE_BORDER}`, borderRadius: 10,
                          background: selected ? '#fff7ed' : CARD_BG, cursor: 'pointer',
                        }}
                      >
                        <span style={{
                          width: 18, height: 18, borderRadius: '50%', border: `2px solid ${selected ? ORANGE : PAGE_BORDER}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          {selected && <span style={{ width: 9, height: 9, borderRadius: '50%', background: ORANGE }} />}
                        </span>
                        <span style={{ fontSize: 13.5, color: PAGE_TEXT }}>{opt}</span>
                      </label>
                    )
                  })}
                </div>
              ) : (
                <input
                  value={fillAnswers[key] ?? ''}
                  onChange={(e) => setFillAnswer(e.target.value)}
                  placeholder="Type your answer…"
                  style={{ width: '100%', border: `1.5px solid ${PAGE_BORDER}`, borderRadius: 10, padding: '12px 14px', fontSize: 14, color: PAGE_TEXT, background: CARD_BG, marginBottom: 16, outline: 'none' }}
                />
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button
                  onClick={() => goTo(current - 1)}
                  disabled={current === 1}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 700, color: current === 1 ? '#94a3b8' : PAGE_TEXT, cursor: current === 1 ? 'not-allowed' : 'pointer' }}
                >
                  <FaArrowLeft size={11} /> Previous Question
                </button>
                {isLastQuestion ? (
                  <button
                    onClick={handleSubmit}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, background: ORANGE, border: 'none', borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer' }}
                  >
                    {practiceMode ? 'See Results' : 'Submit Section'} <FaArrowRight size={11} />
                  </button>
                ) : (
                  <button
                    onClick={saveAndNext}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, background: ORANGE, border: 'none', borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer' }}
                  >
                    Save & Next <FaArrowRight size={11} />
                  </button>
                )}
              </div>
            </div>

            {/* Live proctoring violations — same panel as the other LSRW sections */}
            {!practiceMode && (
              <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 14, padding: '12px 20px', marginTop: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <FaExclamationTriangle size={12} color="#dc2626" />
                  <span style={{ fontWeight: 700, fontSize: 12.5, color: '#dc2626' }}>Proctoring — Live Violations</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                  {[
                    ['Tab Switches', proctor.violationCount],
                    ['Looking Away', gaze.violationCount],
                    ['Head Turned', gaze.headViolationCount],
                    ['Face Covered', gaze.maskViolationCount],
                    ['Face Not Visible', gaze.noFaceViolationCount],
                  ].map(([label, count]) => (
                    <span key={label as string} style={{
                      background: (count as number) > 0 ? '#fee2e2' : CARD_BG,
                      border: `1px solid ${(count as number) > 0 ? '#fca5a5' : PAGE_BORDER}`,
                      color: (count as number) > 0 ? '#dc2626' : PAGE_GRAY,
                      borderRadius: 20, padding: '6px 10px', fontSize: 11.5, fontWeight: 700,
                      textAlign: 'center' as const,
                    }}>
                      {label}: {count}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Sidebar ────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 16 }}>
            <div style={{ background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 14, padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: PAGE_TEXT, marginBottom: 14 }}>Question Navigator</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 14 }}>
                {Array.from({ length: TOTAL_QUESTIONS }, (_, i) => i + 1).map((n) => {
                  const st = stateOf(n)
                  const s = paletteStyle[st]
                  return (
                    <button
                      key={n}
                      onClick={() => goTo(n)}
                      style={{
                        width: 32, height: 32, borderRadius: '50%', border: `1.5px solid ${s.border}`,
                        background: s.bg, color: s.color, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      }}
                    >
                      {n}
                    </button>
                  )
                })}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '4px 14px', fontSize: 11, color: PAGE_GRAY }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, display: 'inline-block' }} /> Not Visited</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: ORANGE, display: 'inline-block' }} /> In Progress</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: '#22c55e', display: 'inline-block' }} /> Answered</span>
              </div>
            </div>

            {/* Camera / face proctoring preview — identical wiring to the
                other LSRW sections. */}
            {!practiceMode && (
              <div style={{
                marginTop: 'auto', width: '100%',
                background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 14, padding: '12px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, padding: '0 4px' }}>
                  <FaShieldAlt size={13} color={ORANGE} />
                  <span style={{ fontWeight: 700, fontSize: 12.5, color: PAGE_TEXT }}>Proctoring Camera</span>
                </div>
                {cameraError ? (
                  <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 8, padding: '20px 8px', color: PAGE_GRAY, fontSize: 11.5, textAlign: 'center' as const }}>
                    <FaVideoSlash size={20} />
                    {cameraError}
                  </div>
                ) : (
                  <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', background: '#111' }}>
                    <video ref={setVideoEl} autoPlay muted playsInline style={{ width: '100%', display: 'block' }} />
                    {gaze.isReady && (
                      <GazeScanOverlay
                        landmarks={gaze.landmarks}
                        faceDetected={gaze.faceDetected}
                        direction={gaze.direction}
                        isLookingAway={gaze.isLookingAway}
                        violationCount={gaze.violationCount}
                        lookAwaySeconds={gaze.lookAwaySeconds}
                        headDirection={gaze.headDirection}
                        isHeadTurned={gaze.isHeadTurned}
                        headViolationCount={gaze.headViolationCount}
                        headAwaySeconds={gaze.headAwaySeconds}
                        maskDetected={gaze.maskDetected}
                        maskViolationCount={gaze.maskViolationCount}
                        maskAwaySeconds={gaze.maskAwaySeconds}
                        widen={1}
                      />
                    )}
                  </div>
                )}
                {!cameraError && (
                  <div style={{ fontSize: 10.5, color: PAGE_GRAY, marginTop: 8, textAlign: 'center' as const }}>
                    {faceViolationCount > 0 ? `${faceViolationCount} face violation(s) detected` : 'Face tracking active'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default GrammarSectionModal
