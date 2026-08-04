import { useEffect, useMemo, useRef, useState } from 'react'
import {
  FaBook, FaVolumeUp, FaArrowLeft, FaArrowRight,
  FaShieldAlt, FaPaperPlane, FaExclamationTriangle, FaVideoSlash, FaTimes, FaClock,
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
const DEFAULT_TIME_LIMIT_SEC = 30

type PassageDbItem = {
  _id: string
  audioUrl?: string
  questions: { index: number; question: string; options: string[]; marks: number; timeLimit?: number; correctAnswer?: string }[]
}

// Placeholder fallback — used only while no real admin-uploaded passages
// have loaded yet (fetched from /api/student/lsrw-passage-content). No real
// audio placeholder exists, so this fallback skips the listen-gate.
const PLACEHOLDER_PASSAGE: PassageDbItem = {
  _id: '',
  audioUrl: undefined,
  questions: Array.from({ length: 10 }, (_, i) => ({
    index: i,
    question: i === 0
      ? 'What is the main idea of the passage?'
      : `Placeholder question ${i + 1} — replace with a real passage/question.`,
    options: i === 0
      ? ['Technology has completely replaced face-to-face communication.', 'Technology offers many benefits but should be used in balance.', 'Students prefer online education over traditional education.', 'Excessive use of technology has no negative effects.']
      : ['Option A', 'Option B', 'Option C', 'Option D'],
    marks: 1,
    timeLimit: DEFAULT_TIME_LIMIT_SEC,
  })),
}

// Flattens passages -> a single linear list of questions (global numbering,
// like every other section here) while remembering which passage/audio each
// question belongs to, so the listen-gate can apply per passage.
const buildFlat = (passages: PassageDbItem[]) => {
  const flat: { number: number; passageIdx: number; passageId: string; questionIndex: number; question: string; options: string[]; marks: number; timeLimit: number; correctAnswer?: string }[] = []
  passages.forEach((p, passageIdx) => {
    p.questions.forEach((q) => {
      flat.push({
        number: flat.length + 1,
        passageIdx,
        passageId: p._id,
        questionIndex: q.index,
        question: q.question,
        options: q.options,
        marks: q.marks,
        timeLimit: q.timeLimit ?? DEFAULT_TIME_LIMIT_SEC,
        correctAnswer: q.correctAnswer,
      })
    })
  })
  return flat
}

type Props = {
  show: boolean
  onClose: () => void
  onSubmitted?: (result?: { scoreAwarded: number; totalMarks: number; submissionId: string }) => void
  practiceMode?: boolean
}

const ReadingSectionModal = ({ show, onClose, onSubmitted, practiceMode }: Props) => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [current, setCurrent]   = useState(1)
  const [answers, setAnswers]   = useState<Record<number, number>>({})
  const [marked, setMarked]     = useState<Set<number>>(new Set())
  const [visited, setVisited]   = useState<Set<number>>(new Set([1]))
  const [listenedPassages, setListenedPassages] = useState<Set<number>>(new Set())
  const [showResults, setShowResults] = useState(false)

  // Real admin-uploaded passages, when any exist — falls back to a single
  // placeholder passage (see PLACEHOLDER_PASSAGE) for anything not yet uploaded.
  const [passages, setPassages] = useState<PassageDbItem[]>([])
  useEffect(() => {
    if (!show || !user?.token) return
    setShowResults(false)
    fetch(`${baseURL}/api/student/lsrw-passage-content${practiceMode ? '?practice=true' : ''}`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then((r) => r.json())
      .then((data) => { if (data.success) setPassages(data.items) })
      .catch(() => {})
  }, [show, user?.token, baseURL, practiceMode])

  const effectivePassages = passages.length ? passages : [PLACEHOLDER_PASSAGE]
  const FLAT = useMemo(() => buildFlat(effectivePassages), [effectivePassages])
  const TOTAL_QUESTIONS = FLAT.length

  const q = FLAT[current - 1]
  const passage = effectivePassages[q?.passageIdx ?? 0]
  const gateNeeded = !!passage?.audioUrl && !listenedPassages.has(q?.passageIdx ?? -1)

  // ── Per-question countdown — only runs once the passage's audio has been
  // listened to. Reaching zero auto-advances to the next question. ──
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

    const items = FLAT.map((qq) => ({
      passageId: qq.passageId,
      questionIndex: qq.questionIndex,
      answer: answers[qq.number] !== undefined ? qq.options[answers[qq.number]] : '',
    }))

    let result: { scoreAwarded: number; totalMarks: number; submissionId: string } | undefined
    if (items.length > 0 && user?.token) {
      try {
        const res = await fetch(`${baseURL}/api/student/lsrw-passage-content/submit`, {
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
    if (timerRef.current) clearInterval(timerRef.current)
    if (!show || !q || gateNeeded) return
    setSecondsLeft(q.timeLimit)
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          if (current < TOTAL_QUESTIONS) goTo(current + 1)
          else handleSubmit()
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, current, gateNeeded, q?.timeLimit])

  // ── Camera + face/gaze proctoring — identical setup to the Listening and
  // Speaking sections (same reused hooks; real, live detection, not
  // fabricated; no backend persistence yet for this round).
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
    setVisited((prev) => new Set(prev).add(n))
    setCurrent(n)
  }

  const selectOption = (idx: number) => {
    setAnswers((prev) => ({ ...prev, [current]: idx }))
  }

  const toggleMark = () => {
    setMarked((prev) => {
      const next = new Set(prev)
      if (next.has(current)) next.delete(current)
      else next.add(current)
      return next
    })
  }

  const saveAndNext = () => goTo(current + 1)

  const stateOf = (n: number): 'current' | 'answered' | 'notVisited' => {
    if (n === current) return 'current'
    if (answers[n] !== undefined) return 'answered'
    return 'notVisited'
  }

  const paletteStyle: Record<string, { bg: string; color: string; border: string }> = {
    current:    { bg: ORANGE,     color: '#fff', border: ORANGE },
    answered:   { bg: '#22c55e',  color: '#fff', border: '#22c55e' },
    notVisited: { bg: CARD_BG,    color: PAGE_TEXT, border: PAGE_BORDER },
  }

  const isLastQuestion = current === TOTAL_QUESTIONS
  const timeCritical = secondsLeft <= 10

  if (!show || !q) return null

  if (showResults) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 999999, background: PAGE_BG, overflowY: 'auto' }}>
        <div style={{ minHeight: '100vh', padding: '40px 24px', maxWidth: 820, margin: '0 auto', fontFamily: '"Segoe UI", system-ui, sans-serif' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FaGraduationCap size={20} color={ORANGE} />
              <span style={{ fontSize: 19, fontWeight: 800, color: PAGE_TEXT }}>Practice Results — Passages</span>
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
          {FLAT.map((question, idx) => {
            const selectedIdx = answers[question.number]
            const yourAnswer = selectedIdx !== undefined ? question.options[selectedIdx] : undefined
            const correct = !!question.correctAnswer && yourAnswer === question.correctAnswer
            return (
              <div key={question.number} style={{ background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 14, padding: '16px 20px', marginBottom: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: PAGE_TEXT }}>Question {idx + 1}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: correct ? '#16a34a' : '#dc2626' }}>
                    {correct ? <FaCheckCircle size={12} /> : <FaTimesCircle size={12} />}
                    {correct ? 'Correct' : 'Incorrect'}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: PAGE_TEXT, marginBottom: 8, fontWeight: 600 }}>{question.question}</div>
                <div style={{ fontSize: 12.5, color: PAGE_GRAY, marginBottom: 4 }}>
                  <strong>Your answer:</strong> {yourAnswer ?? <em>(not answered)</em>}
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
    // Full-page takeover — same pattern as Listening/Speaking sections and
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
      <div style={{ padding: '56px 24px 18px', fontFamily: '"Segoe UI", system-ui, sans-serif' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'stretch' }}>

          {/* ── Main Column ─────────────────────────────── */}
          <div>
            <div style={{ background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 14, padding: '14px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.03)', minHeight: gateNeeded ? 320 : undefined, display: 'flex', flexDirection: 'column' as const, justifyContent: gateNeeded ? 'center' : undefined }}>
              {gateNeeded ? (
                <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 18, padding: '30px 0' }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: PAGE_TEXT }}>Listen the passage and answer the questions later.</div>
                  <audio
                    controls
                    src={passage.audioUrl}
                    onEnded={() => setListenedPassages((prev) => new Set(prev).add(q.passageIdx))}
                    style={{ width: '100%', maxWidth: 420 }}
                  />
                  <span style={{ fontSize: 11.5, color: PAGE_GRAY, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FaVolumeUp size={12} /> Click play when you're ready. Questions will appear once the audio finishes playing.
                  </span>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: ORANGE, fontWeight: 800, fontSize: 15 }}>Question {current} / {TOTAL_QUESTIONS}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {practiceMode && (
                        <span style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #16a34a44', borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700 }}>
                          PRACTICE — not scored or saved
                        </span>
                      )}
                      <span style={{ background: '#fff7ed', color: ORANGE, border: '1px solid #fed7aa', borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700 }}>{q.marks} Mark</span>
                      <span style={{
                        display: 'flex', alignItems: 'center', gap: 6, borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 800,
                        background: timeCritical ? '#fef2f2' : '#fff7ed', color: timeCritical ? '#dc2626' : ORANGE,
                        border: `1px solid ${timeCritical ? '#fca5a5' : '#fed7aa'}`,
                      }}>
                        <FaClock size={11} /> {`${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`}
                      </span>
                    </div>
                  </div>
                  <p style={{ color: PAGE_GRAY, fontSize: 13, margin: '0 0 10px' }}>Answer the following question based on the passage you listened to. The audio can't be replayed.</p>

                  <div style={{ fontWeight: 700, fontSize: 14, color: PAGE_TEXT, marginBottom: 8 }}>{q.question}</div>

                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6, marginBottom: 8 }}>
                    {q.options.map((opt, idx) => {
                      const selected = answers[current] === idx
                      return (
                        <label
                          key={idx}
                          onClick={() => selectOption(idx)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12, padding: '8px 14px',
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
                          <span style={{ fontSize: 13.5, color: PAGE_TEXT }}>
                            <strong style={{ marginRight: 6 }}>{String.fromCharCode(65 + idx)}.</strong>{opt}
                          </span>
                        </label>
                      )
                    })}
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: PAGE_TEXT, cursor: 'pointer' }}>
                    <input type="checkbox" checked={marked.has(current)} onChange={toggleMark} style={{ accentColor: '#8b5cf6' }} />
                    Mark for Review
                  </label>
                </>
              )}
            </div>

            {/* Prev / Save & Next */}
            {!gateNeeded && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                <button
                  onClick={() => goTo(current - 1)}
                  disabled={current === 1}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 700, color: current === 1 ? '#94a3b8' : PAGE_TEXT, cursor: current === 1 ? 'not-allowed' : 'pointer' }}
                >
                  <FaArrowLeft size={11} /> Previous
                </button>
                {isLastQuestion ? (
                  <button
                    onClick={handleSubmit}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, background: ORANGE, border: 'none', borderRadius: 10, padding: '10px 22px', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer' }}
                  >
                    <FaPaperPlane size={12} /> {practiceMode ? 'See Results' : 'Submit Reading Section'}
                  </button>
                ) : (
                  <button
                    onClick={saveAndNext}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, background: ORANGE, border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer' }}
                  >
                    Save & Next <FaArrowRight size={11} />
                  </button>
                )}
              </div>
            )}

            {/* Live proctoring violations */}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <FaBook size={13} color={ORANGE} />
                <span style={{ fontWeight: 700, fontSize: 13.5, color: PAGE_TEXT }}>Reading Overview</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 14 }}>
                {FLAT.map((qq) => {
                  const st = stateOf(qq.number)
                  const s = paletteStyle[st]
                  return (
                    <button
                      key={qq.number}
                      onClick={() => goTo(qq.number)}
                      style={{
                        width: 32, height: 32, borderRadius: '50%', border: `1.5px solid ${s.border}`,
                        background: s.bg, color: s.color, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      }}
                    >
                      {qq.number}
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

            {/* Camera / face proctoring preview — identical wiring AND sizing
                to the Listening and Speaking sections. Pinned to the bottom
                of the stretched sidebar column (margin-top: auto) so its
                bottom edge lines up with the main column's Proctoring —
                Live Violations panel, whatever the question count. */}
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

export default ReadingSectionModal
