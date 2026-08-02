import { useEffect, useMemo, useRef, useState } from 'react'
import {
  FaMicrophone, FaCommentDots, FaArrowLeft, FaArrowRight,
  FaShieldAlt, FaPaperPlane, FaExclamationTriangle, FaVideoSlash, FaTimes, FaFont,
  FaGraduationCap, FaLightbulb,
} from 'react-icons/fa'
import { useGazeDetection } from '@/app/student/self-interview/components/useGazeDetection'
import GazeScanOverlay from '@/app/student/self-interview/components/GazeScanOverlay'
import { useProctorGuard } from '@/app/student/final-assessment/helper/useProctorGuard'
import { useAuthContext } from '@/context/useAuthContext'
import speakerImg from '@/assets/images/element/Listening.png'

const PAGE_BG     = 'var(--dash-page-bg, #f8fafc)'
const CARD_BG     = 'var(--dash-card-bg, #ffffff)'
const PAGE_BORDER = 'var(--dash-border, #e2e8f0)'
const PAGE_TEXT   = 'var(--dash-text, #0f172a)'
const PAGE_GRAY   = 'var(--dash-gray, #64748b)'

const ORANGE = '#ff7a00'
const DEFAULT_TOPIC_COUNT = 5
const DEFAULT_RECORD_SECONDS = 90 // used only for placeholder slots with no admin-set time limit

type TopicItem = { _id: string; topic: string; marks: number; timeLimit?: number }

// Placeholder fallback — used only while no real admin-uploaded topics have
// loaded yet (fetched from /api/student/lsrw-speaking-content).
const placeholderQuestion = (i: number) => ({
  number: i + 1,
  itemId: undefined as string | undefined,
  topic: i === 0
    ? 'Do you think social media has more advantages or disadvantages for students? Explain your views.'
    : `Placeholder speaking topic ${i + 1} — replace with a real prompt.`,
  timeLimit: DEFAULT_RECORD_SECONDS,
})

const buildQuestions = (topics: TopicItem[]) => {
  const count = topics.length || DEFAULT_TOPIC_COUNT
  return Array.from({ length: count }, (_, i) => {
    const real = topics[i]
    if (!real) return placeholderQuestion(i)
    return {
      number: i + 1,
      itemId: real._id,
      topic: real.topic,
      timeLimit: real.timeLimit ?? DEFAULT_RECORD_SECONDS,
    }
  })
}

const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

type Props = { show: boolean; onClose: () => void; onSubmitted?: (result?: { scoreAwarded: number; totalMarks: number; submissionId: string }) => void; practiceMode?: boolean }

type PracticeResultItem = {
  itemId: string
  topic: string
  transcript: string
  marks: number
  scoreAwarded: number
  feedback: string
  sampleAnswer: string
}

const SpeakingSectionModal = ({ show, onClose, onSubmitted, practiceMode }: Props) => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [current, setCurrent]     = useState(1)
  const [showResults, setShowResults] = useState(false)
  const [resultItems, setResultItems] = useState<PracticeResultItem[]>([])
  const [recordings, setRecordings] = useState<Record<number, number>>({}) // question -> seconds recorded
  // One recording attempt per question — once it ends, it's locked; no
  // re-recording on the same question (same rule as Listening & Reading).
  const [lockedQuestions, setLockedQuestions] = useState<Record<number, boolean>>({})
  const [recording, setRecording] = useState(false)
  const [recordSeconds, setRecordSeconds] = useState(0)

  // Live speech-to-text (visual only, same as the transcript preview in the
  // Listening & Reading section) — one persistent recognition instance
  // reused across questions, with a start-retry loop, since Chrome's
  // SpeechRecognition throws if restarted too soon after the previous stop.
  const [transcripts, setTranscripts] = useState<Record<number, string>>({})
  const recognitionRef = useRef<any>(null)
  const recognitionActiveRef = useRef(false)
  const transcriptAccumRef = useRef('')
  const currentRef = useRef(1)
  useEffect(() => { currentRef.current = current }, [current])

  const stopRecognition = () => {
    recognitionActiveRef.current = false
    try { recognitionRef.current?.stop() } catch { /* no-op */ }
  }

  const startRecognitionWithRetry = (rec: any, attempt = 0) => {
    if (!recognitionActiveRef.current) return
    try { rec.start() } catch {
      if (attempt < 8) setTimeout(() => startRecognitionWithRetry(rec, attempt + 1), 150)
    }
  }

  const getRecognition = () => {
    if (recognitionRef.current) return recognitionRef.current
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return null
    const rec = new SR()
    rec.lang = 'en-IN'
    rec.continuous = true
    rec.interimResults = true
    rec.maxAlternatives = 1
    rec.onresult = (e: any) => {
      let newFinal = ''
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) newFinal += ' ' + e.results[i][0].transcript
        else interim += ' ' + e.results[i][0].transcript
      }
      if (newFinal.trim()) transcriptAccumRef.current = (transcriptAccumRef.current + ' ' + newFinal.trim()).trim()
      // Live preview while still recording — committed text so far + the
      // current in-flight interim guess, updated as the student keeps talking.
      setTranscripts((prev) => ({ ...prev, [currentRef.current]: (transcriptAccumRef.current + ' ' + interim).trim() }))
    }
    rec.onerror = () => { /* swallow — onend below restarts unless we've intentionally stopped */ }
    rec.onend = () => { if (recognitionActiveRef.current) startRecognitionWithRetry(rec) }
    recognitionRef.current = rec
    return rec
  }

  // Real admin-uploaded topics, when any exist — falls back to a placeholder
  // slot (see buildQuestions) for anything not yet uploaded.
  const [topics, setTopics] = useState<TopicItem[]>([])
  useEffect(() => {
    if (!show || !user?.token) return
    setShowResults(false)
    fetch(`${baseURL}/api/student/lsrw-speaking-content`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then((r) => r.json())
      .then((data) => { if (data.success) setTopics(data.items) })
      .catch(() => {})
  }, [show, user?.token, baseURL])

  const QUESTIONS = useMemo(() => buildQuestions(topics), [topics])
  const TOTAL_QUESTIONS = QUESTIONS.length

  // Recording countdown — no real audio capture/upload wired up here (that's
  // Listening & Reading's scope), but live speech-to-text now runs alongside
  // it purely for the student's own visual feedback.
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const finishRecording = (qNumber: number, seconds: number) => {
    stopRecognition()
    setRecording(false)
    setRecordings((prev) => ({ ...prev, [qNumber]: seconds }))
    setTranscripts((prev) => ({ ...prev, [qNumber]: transcriptAccumRef.current.trim() }))
    setLockedQuestions((prev) => ({ ...prev, [qNumber]: true }))
  }

  const toggleRecording = () => {
    if (lockedQuestions[current]) return
    const maxSeconds = QUESTIONS[current - 1]?.timeLimit ?? DEFAULT_RECORD_SECONDS
    if (recording) {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current)
      if (recordSeconds > 0) finishRecording(current, recordSeconds)
      else { stopRecognition(); setRecording(false) }
      return
    }
    setRecording(true)
    setRecordSeconds(0)
    transcriptAccumRef.current = ''
    setTranscripts((prev) => ({ ...prev, [current]: '' }))

    const rec = getRecognition()
    if (rec) {
      recognitionActiveRef.current = true
      startRecognitionWithRetry(rec)
    }

    recordTimerRef.current = setInterval(() => {
      setRecordSeconds((s) => {
        if (s + 1 >= maxSeconds) {
          if (recordTimerRef.current) clearInterval(recordTimerRef.current)
          finishRecording(current, maxSeconds)
          return maxSeconds
        }
        return s + 1
      })
    }, 1000)
  }
  useEffect(() => () => { if (recordTimerRef.current) clearInterval(recordTimerRef.current); stopRecognition() }, [])

  // ── Camera + face/gaze proctoring — identical setup to the Listening
  // section (same reused hooks; real, live detection, not fabricated; no
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

  const q = QUESTIONS[current - 1]

  const goTo = (n: number) => {
    if (n < 1 || n > TOTAL_QUESTIONS || recording) return
    setCurrent(n)
  }

  const saveAndNext = () => goTo(current + 1)

  // Shared by "Submit Speaking Section" (last question, all answered) and
  // closing early via the X button (only whatever's answered so far) — both
  // persist live proctoring counts alongside the submission.
  // submittingRef is a single-flight guard: without it, a fast double-click
  // (or the X button firing right after Submit) could POST the same attempt
  // twice before the first response comes back and the modal closes.
  const submittingRef = useRef(false)
  const submitAttempt = async (exitedEarly: boolean) => {
    if (submittingRef.current) return { attempted: false, practiceItems: [] as PracticeResultItem[] }
    submittingRef.current = true
    try {
      const answered = QUESTIONS.filter((qq) => qq.itemId && (exitedEarly ? recordings[qq.number] !== undefined : true))
      const items = answered.map((qq) => ({
        itemId: qq.itemId,
        transcript: transcripts[qq.number] || '',
        recordedSeconds: recordings[qq.number] || 0,
      }))
      let result: { scoreAwarded: number; totalMarks: number; submissionId: string } | undefined
      let practiceItems: PracticeResultItem[] = []
      if (items.length > 0 && user?.token) {
        try {
          const res = await fetch(`${baseURL}/api/student/lsrw-speaking-content/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
            body: JSON.stringify({
              items,
              exitedEarly,
              practice: practiceMode,
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
            result = { scoreAwarded: data.submission.totalScoreAwarded, totalMarks: data.submission.totalMarks, submissionId: data.submission._id }
            practiceItems = data.submission.items || []
          }
        } catch { /* non-fatal — student's already moved past the modal */ }
      }
      return { result, attempted: items.length > 0, practiceItems }
    } finally {
      submittingRef.current = false
    }
  }

  const handleSubmitSection = async () => {
    const { result, practiceItems } = await submitAttempt(false)
    if (practiceMode) {
      setResultItems(practiceItems)
      setShowResults(true)
      return
    }
    onSubmitted?.(result)
    onClose()
  }

  // Closing mid-section (X button) counts as an attempt — whatever's been
  // answered so far is submitted, and the section is marked attempted so the
  // student can't just re-enter for a clean slate.
  const handleExit = async () => {
    const { result, attempted } = await submitAttempt(true)
    if (attempted) onSubmitted?.(result)
    onClose()
  }

  const stateOf = (n: number): 'current' | 'answered' | 'notVisited' => {
    if (n === current) return 'current'
    if (recordings[n] !== undefined) return 'answered'
    return 'notVisited'
  }

  const paletteStyle: Record<string, { bg: string; color: string; border: string }> = {
    current:    { bg: ORANGE,     color: '#fff', border: ORANGE },
    answered:   { bg: '#22c55e',  color: '#fff', border: '#22c55e' },
    notVisited: { bg: CARD_BG,    color: PAGE_TEXT, border: PAGE_BORDER },
  }

  const isLastQuestion = current === TOTAL_QUESTIONS

  if (!show) return null

  if (showResults) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 999999, background: PAGE_BG, overflowY: 'auto' }}>
        <div style={{ minHeight: '100vh', padding: '40px 24px', maxWidth: 820, margin: '0 auto', fontFamily: '"Segoe UI", system-ui, sans-serif' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FaGraduationCap size={20} color={ORANGE} />
              <span style={{ fontSize: 19, fontWeight: 800, color: PAGE_TEXT }}>Practice Feedback — Speaking</span>
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
          {resultItems.map((item, idx) => (
            <div key={item.itemId || idx} style={{ background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 14, padding: '16px 20px', marginBottom: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: PAGE_TEXT }}>Question {idx + 1}: {item.topic}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: ORANGE }}>{item.scoreAwarded} / {item.marks}</span>
              </div>
              <div style={{ fontSize: 12.5, color: PAGE_GRAY, marginBottom: 10 }}>
                <strong>You said:</strong> {item.transcript || <em>(no speech captured)</em>}
              </div>
              <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '10px 12px', marginBottom: 8 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: ORANGE, marginBottom: 4 }}>Feedback</div>
                <div style={{ fontSize: 12, color: '#7c2d12' }}>{item.feedback}</div>
              </div>
              {item.sampleAnswer && (
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '10px 12px', display: 'flex', gap: 8 }}>
                  <FaLightbulb size={13} color="#2563eb" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: '#2563eb', marginBottom: 4 }}>Sample Answer</div>
                    <div style={{ fontSize: 12, color: '#1e3a8a' }}>{item.sampleAnswer}</div>
                  </div>
                </div>
              )}
            </div>
          ))}
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
    // Full-page takeover — same pattern as the Listening section / Final
    // Assessment's live exam rounds (a plain fixed div, not a react-bootstrap
    // Modal), so there's no backdrop/z-index stacking to fight.
    <div style={{ position: 'fixed', inset: 0, zIndex: 999999, background: PAGE_BG, overflowY: 'auto' }}>
      <button
        onClick={handleExit}
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
            <div style={{ background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 14, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: ORANGE, fontWeight: 800, fontSize: 15 }}>Question {current} / {TOTAL_QUESTIONS}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {practiceMode && (
                    <span style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #16a34a44', borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700 }}>
                      PRACTICE — not scored or saved
                    </span>
                  )}
                  <span style={{ background: '#fff7ed', color: ORANGE, border: '1px solid #fed7aa', borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700 }}>1 Mark</span>
                </span>
              </div>
              <p style={{ color: PAGE_GRAY, fontSize: 13, margin: '0 0 12px' }}>Speak on the given topic.</p>

              {/* Topic card — illustration deliberately bleeds past the
                  card's bottom edge rather than being contained inside it. */}
              <div style={{ position: 'relative', minHeight: 128, background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12, padding: '20px 150px 20px 18px', marginBottom: 14, display: 'flex', flexDirection: 'column' as const }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <FaCommentDots size={13} color={ORANGE} />
                  <span style={{ fontWeight: 700, fontSize: 12.5, color: ORANGE }}>Topic</span>
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                  <div style={{ fontSize: 14, color: '#1e293b', lineHeight: 1.6, fontWeight: 600 }}>{q.topic}</div>
                </div>
                <img
                  src={speakerImg}
                  alt=""
                  style={{ position: 'absolute', bottom: 0, right: 20, height: 128, width: 'auto', objectFit: 'contain', pointerEvents: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'stretch' }}>
              {/* Recording Time */}
              <div style={{ border: `1px solid ${PAGE_BORDER}`, borderRadius: 12, padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FaMicrophone size={12} color={ORANGE} />
                    <span style={{ fontWeight: 700, fontSize: 13, color: PAGE_TEXT }}>Recording Time</span>
                  </div>
                  {recording ? (
                    (() => {
                      const remaining = Math.max(0, q.timeLimit - recordSeconds)
                      const radius = 15
                      const circumference = 2 * Math.PI * radius
                      const progress = Math.min(1, recordSeconds / q.timeLimit)
                      const low = remaining <= 5
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 2 }}>
                          <svg width={36} height={36} style={{ transform: 'rotate(-90deg)' }}>
                            <circle cx={18} cy={18} r={radius} fill="none" stroke={PAGE_BORDER} strokeWidth={3} />
                            <circle
                              cx={18} cy={18} r={radius} fill="none" stroke={low ? '#dc2626' : ORANGE} strokeWidth={3}
                              strokeDasharray={circumference} strokeDashoffset={circumference * progress}
                              strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
                            />
                          </svg>
                          <span style={{ fontSize: 10.5, fontWeight: 700, color: low ? '#dc2626' : ORANGE }}>{fmtTime(remaining)}</span>
                        </div>
                      )
                    })()
                  ) : (
                    <span style={{ fontSize: 11.5, color: PAGE_GRAY }}>Max Time <strong style={{ color: ORANGE }}>{fmtTime(q.timeLimit)}</strong></span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: PAGE_GRAY, marginBottom: 10 }}>You have {q.timeLimit} seconds to record your answer.</div>

                <div style={{ background: PAGE_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 10, padding: '10px 16px', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 22, justifyContent: 'center' }}>
                    {Array.from({ length: 48 }, (_, i) => {
                      const active = recording && i < Math.round((recordSeconds / q.timeLimit) * 48)
                      const h = 6 + ((i * 37) % 16)
                      return <span key={i} style={{ width: 3, height: h, borderRadius: 2, background: active ? ORANGE : PAGE_BORDER, flexShrink: 0 }} />
                    })}
                  </div>
                  <div style={{ textAlign: 'center' as const, fontSize: 11.5, color: PAGE_GRAY, marginTop: 4 }}>
                    {fmtTime(recordSeconds)} / {fmtTime(q.timeLimit)}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 4 }}>
                  <button
                    onClick={toggleRecording}
                    disabled={lockedQuestions[current]}
                    style={{
                      width: 44, height: 44, borderRadius: '50%', border: 'none',
                      cursor: lockedQuestions[current] ? 'not-allowed' : 'pointer',
                      background: lockedQuestions[current] ? PAGE_BORDER : recording ? '#dc2626' : ORANGE,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: recording ? '0 0 0 6px rgba(220,38,38,0.15)' : 'none',
                    }}
                  >
                    <FaMicrophone size={16} color={lockedQuestions[current] ? PAGE_GRAY : '#fff'} />
                  </button>
                  <span style={{ fontSize: 11.5, color: PAGE_GRAY }}>
                    {recording
                      ? 'Recording… click to stop'
                      : lockedQuestions[current]
                        ? 'Attempt used — one recording per question'
                        : 'Click the mic to start recording'}
                  </span>
                </div>
              </div>

              {/* Speech to Text — separate box from Recording Time, live
                  transcript while speaking (visual feedback only, same
                  browser SpeechRecognition approach as Listening & Reading). */}
              <div style={{ border: `1px solid ${PAGE_BORDER}`, borderRadius: 12, padding: '12px 16px', display: 'flex', flexDirection: 'column' as const }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <FaFont size={12} color={ORANGE} />
                  <span style={{ fontWeight: 700, fontSize: 13, color: PAGE_TEXT }}>Speech to Text</span>
                  {recording && (
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#dc2626', animation: 'lsrw-pulse 1s infinite' }} />
                  )}
                </div>
                <div style={{ flex: 1, background: PAGE_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 10, padding: '12px 14px', minHeight: 60, fontSize: 12.5, color: PAGE_TEXT, lineHeight: 1.6, overflowY: 'auto' as const }}>
                  {transcripts[current] ? (
                    `"${transcripts[current]}"`
                  ) : (
                    <span style={{ color: PAGE_GRAY, fontStyle: 'italic' as const }}>
                      {recording ? 'Listening…' : 'Your spoken answer will appear here as text once you start recording.'}
                    </span>
                  )}
                </div>
                <style>{`@keyframes lsrw-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
              </div>
              </div>
            </div>

            {/* Prev / Save & Next */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
              <button
                onClick={() => goTo(current - 1)}
                disabled={current === 1 || recording}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 700, color: (current === 1 || recording) ? '#94a3b8' : PAGE_TEXT, cursor: (current === 1 || recording) ? 'not-allowed' : 'pointer' }}
              >
                <FaArrowLeft size={11} /> Previous
              </button>
              {isLastQuestion ? (
                <button
                  onClick={handleSubmitSection}
                  disabled={recording || !lockedQuestions[current]}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: ORANGE, border: 'none', borderRadius: 10, padding: '10px 22px', fontSize: 13, fontWeight: 700, color: '#fff', cursor: (recording || !lockedQuestions[current]) ? 'not-allowed' : 'pointer', opacity: (recording || !lockedQuestions[current]) ? 0.6 : 1 }}
                >
                  <FaPaperPlane size={12} /> {practiceMode ? 'See Feedback' : 'Submit Speaking Section'}
                </button>
              ) : (
                <button
                  onClick={saveAndNext}
                  disabled={recording || !lockedQuestions[current]}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: ORANGE, border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 700, color: '#fff', cursor: (recording || !lockedQuestions[current]) ? 'not-allowed' : 'pointer', opacity: (recording || !lockedQuestions[current]) ? 0.6 : 1 }}
                >
                  Save & Next <FaArrowRight size={11} />
                </button>
              )}
            </div>

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
                <FaMicrophone size={13} color={ORANGE} />
                <span style={{ fontWeight: 700, fontSize: 13.5, color: PAGE_TEXT }}>Speaking Overview</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 14 }}>
                {QUESTIONS.map((qq) => {
                  const st = stateOf(qq.number)
                  const s = paletteStyle[st]
                  return (
                    <button
                      key={qq.number}
                      onClick={() => goTo(qq.number)}
                      style={{
                        width: 32, height: 32, borderRadius: '50%', border: `1.5px solid ${s.border}`,
                        background: s.bg, color: s.color, fontSize: 12, fontWeight: 700, cursor: recording ? 'not-allowed' : 'pointer',
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

            {/* Camera / face proctoring preview — identical wiring to the
                Listening section. Pinned to the bottom of the stretched
                sidebar column (margin-top: auto) so its bottom edge lines
                up with the main column's Proctoring — Live Violations panel. */}
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

export default SpeakingSectionModal
