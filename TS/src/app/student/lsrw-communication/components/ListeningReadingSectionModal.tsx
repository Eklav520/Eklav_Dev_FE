import { useEffect, useMemo, useRef, useState } from 'react'
import {
  FaMicrophone, FaBook, FaHeadphones, FaPlay, FaPause, FaVolumeUp, FaArrowLeft, FaArrowRight,
  FaShieldAlt, FaPaperPlane, FaExclamationTriangle, FaVideoSlash, FaTimes, FaCheckCircle,
  FaTimesCircle, FaGraduationCap,
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
const BLUE   = '#2563eb'
// Fallback counts used only while no real admin-uploaded content has loaded
// yet — once /api/student/lsrw-content responds, the real (admin-configured)
// counts drive everything below instead.
const DEFAULT_READING_COUNT = 5
const DEFAULT_LISTENING_COUNT = 5
const DEFAULT_RECORD_SECONDS = 60 // used only for placeholder slots with no admin-set time limit

type ContentItem = { _id: string; type: 'reading' | 'listening'; sentence: string; audioUrl?: string; marks: number; timeLimit?: number }

// Placeholder fallback — used for any slot not covered by real admin-uploaded
// content yet (fetched from /api/student/lsrw-content). Placeholder slots have
// no real itemId, so they're excluded from grading on submit.
const placeholderQuestion = (i: number, readingCount: number) => {
  const isReading = i < readingCount
  return {
    number: i + 1,
    itemId: undefined as string | undefined,
    type: isReading ? 'reading' as const : 'listening' as const,
    sentence: isReading
      ? (i === 0 ? 'The quick brown fox jumps over the lazy dog near the riverbank.' : `Placeholder sentence ${i + 1} to read aloud — replace with real content.`)
      : undefined,
    audioUrl: undefined as string | undefined,
    audioLength: !isReading ? '00:1' + String(2 + (i % 5)) : undefined,
    timeLimit: DEFAULT_RECORD_SECONDS,
  }
}

const buildQuestions = (readingItems: ContentItem[], listeningItems: ContentItem[]) => {
  // Once real content has loaded, the question count is exactly what the
  // admin configured/uploaded (readingItems.length + listeningItems.length —
  // the student API already randomly draws the admin-configured N of each).
  const readingCount = readingItems.length || DEFAULT_READING_COUNT
  const listeningCount = listeningItems.length || DEFAULT_LISTENING_COUNT
  const totalQuestions = readingItems.length || listeningItems.length
    ? readingItems.length + listeningItems.length
    : DEFAULT_READING_COUNT + DEFAULT_LISTENING_COUNT

  return Array.from({ length: totalQuestions }, (_, i) => {
    const isReading = i < readingCount
    const real = isReading ? readingItems[i] : listeningItems[i - readingCount]
    if (!real) return placeholderQuestion(i, readingCount)
    return {
      number: i + 1,
      itemId: real._id,
      type: real.type,
      sentence: isReading ? real.sentence : undefined,
      audioUrl: !isReading ? real.audioUrl : undefined,
      audioLength: !isReading ? '00:XX' : undefined, // real duration unknown until the audio element loads
      timeLimit: real.timeLimit ?? DEFAULT_RECORD_SECONDS, // admin-set per-item recording time limit
    }
  })
}

const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

type Props = {
  show: boolean
  onClose: () => void
  onSubmitted?: (result?: { scoreAwarded: number; totalMarks: number; submissionId: string }) => void
  practiceMode?: boolean
}

type PracticeResultItem = {
  itemId: string
  type: 'reading' | 'listening'
  expectedSentence: string
  transcript: string
  marks: number
  scoreAwarded: number
  accuracyPercent: number
  audioUrl?: string | null
  aiAudioUrl?: string | null
  accentReview?: { score: number; points: string[] } | null
}

const ListeningReadingSectionModal = ({ show, onClose, onSubmitted, practiceMode }: Props) => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL

  // Playback for the Practice Results screen — lets the student compare
  // their own recorded voice against the AI's correctly-accented reading.
  const [resultSpeakingKey, setResultSpeakingKey] = useState<string | null>(null)
  const resultAudioRef = useRef<HTMLAudioElement | null>(null)
  const toggleResultSpeak = (key: string, audioUrl?: string | null) => {
    if (resultSpeakingKey === key) {
      resultAudioRef.current?.pause()
      resultAudioRef.current = null
      setResultSpeakingKey(null)
      return
    }
    resultAudioRef.current?.pause()
    resultAudioRef.current = null
    if (!audioUrl) return
    const audioEl = new Audio(audioUrl)
    resultAudioRef.current = audioEl
    audioEl.onended = () => setResultSpeakingKey(null)
    audioEl.onerror = () => setResultSpeakingKey(null)
    setResultSpeakingKey(key)
    audioEl.play().catch(() => setResultSpeakingKey(null))
  }

  const [current, setCurrent]     = useState(1)
  const [recordings, setRecordings] = useState<Record<number, number>>({}) // question -> seconds recorded
  // One recording attempt per question — once it ends (time runs out OR the
  // student manually stops), it's locked; no re-recording on the same question.
  const [lockedQuestions, setLockedQuestions] = useState<Record<number, boolean>>({})
  const [recording, setRecording] = useState(false)
  const [recordSeconds, setRecordSeconds] = useState(0)
  const [playing, setPlaying]     = useState(false)
  // Chrome's SpeechRecognition is a cloud service — it can silently produce
  // zero results (network hiccup, throttling) without ever throwing an error
  // we could catch. Since each question only gets one recording attempt,
  // surface it live (while there's still time to speak up/louder) rather
  // than the student only finding out after the fact.
  const [heardAnySpeech, setHeardAnySpeech] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [resultItems, setResultItems] = useState<PracticeResultItem[]>([])

  // Real admin-uploaded content, when any exists — falls back to placeholder
  // slots (see buildQuestions) for anything not yet uploaded.
  const [readingItems, setReadingItems]     = useState<ContentItem[]>([])
  const [listeningItems, setListeningItems] = useState<ContentItem[]>([])
  useEffect(() => {
    if (!show || !user?.token) return
    setShowResults(false)
    fetch(`${baseURL}/api/student/lsrw-content`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) return
        setReadingItems(data.items.filter((i: ContentItem) => i.type === 'reading'))
        setListeningItems(data.items.filter((i: ContentItem) => i.type === 'listening'))
      })
      .catch(() => {})
  }, [show, user?.token, baseURL])

  const QUESTIONS = useMemo(() => buildQuestions(readingItems, listeningItems), [readingItems, listeningItems])
  const TOTAL_QUESTIONS = QUESTIONS.length
  const READING_COUNT = readingItems.length || DEFAULT_READING_COUNT

  // Real speech-to-text per question — captured via the browser's Speech
  // Recognition API (same approach used elsewhere in this app, e.g.
  // EnglishVoicePractice.tsx) so the transcript can be word-diffed against
  // the expected sentence server-side on submit, for real marks/mistakes.
  const [transcripts, setTranscripts] = useState<Record<number, string>>({})
  const recognitionRef = useRef<any>(null)
  const transcriptAccumRef = useRef('')

  // Real recorded voice audio (not just the transcript) — captured via
  // MediaRecorder in parallel with SpeechRecognition, uploaded to S3 once a
  // question's attempt finishes, so the mistake-review screen can play back
  // what the student actually said instead of a text-to-speech reading.
  const micStreamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const [audioUrls, setAudioUrls] = useState<Record<number, string>>({})
  const [uploadingAudio, setUploadingAudio] = useState<Record<number, boolean>>({})
  // AI reference voice (for side-by-side comparison) and GPT-4o audio-based
  // accent/intonation review, both returned by upload-audio alongside the
  // Whisper transcript.
  const [aiAudioUrls, setAiAudioUrls] = useState<Record<number, string>>({})
  const [accentReviews, setAccentReviews] = useState<Record<number, { score: number; points: string[] }>>({})

  const audioElRef = useRef<HTMLAudioElement | null>(null)
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Chrome's SpeechRecognition frequently stops itself mid-recording (a
  // "no-speech" timeout after a couple seconds of silence, or just ending
  // unexpectedly even with continuous:true) — without a restart, everything
  // said after that point in the recording window is silently lost. This
  // flag distinguishes "it stopped but we're still recording" (restart it)
  // from "we intentionally stopped" (don't).
  const recognitionActiveRef = useRef(false)

  const stopRecognition = () => {
    recognitionActiveRef.current = false
    try { recognitionRef.current?.stop() } catch { /* no-op */ }
    // Deliberately NOT nulling recognitionRef here — creating a brand-new
    // SpeechRecognition() object for every question is unreliable in Chrome
    // (only the first instance in a session tends to actually produce
    // results); reusing one instance across the whole modal session is the
    // standard workaround.
  }

  // Reusing one SpeechRecognition instance still isn't enough on its own —
  // calling .start() right after .stop() on the SAME object throws
  // InvalidStateError if the browser hasn't finished winding down the
  // previous session yet (that gap is what silently killed the transcript
  // for every question after the first). Retrying briefly instead of giving
  // up on the first throw closes that race.
  const startRecognitionWithRetry = (rec: any, attempt = 0) => {
    if (!recognitionActiveRef.current) return // stopped (or superseded) before this retry fired
    try {
      rec.start()
    } catch {
      if (attempt < 8) setTimeout(() => startRecognitionWithRetry(rec, attempt + 1), 150)
    }
  }

  // Built lazily on first use, then reused for every remaining question.
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
      setHeardAnySpeech(true)
      let newFinal = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) newFinal += ' ' + e.results[i][0].transcript
      }
      if (newFinal.trim()) transcriptAccumRef.current = (transcriptAccumRef.current + ' ' + newFinal.trim()).trim()
    }
    rec.onerror = (e: any) => {
      // eslint-disable-next-line no-console
      console.warn('[LSRW speech recognition] error:', e?.error, '— recognitionActive:', recognitionActiveRef.current)
    }
    rec.onend = () => {
      // eslint-disable-next-line no-console
      console.warn('[LSRW speech recognition] ended — recognitionActive:', recognitionActiveRef.current)
      if (!recognitionActiveRef.current) return
      startRecognitionWithRetry(rec)
    }
    recognitionRef.current = rec
    return rec
  }

  // Live "is the mic actually picking anything up" indicator for real
  // (non-practice) attempts — reads volume off the SAME stream/track
  // MediaRecorder is using, via Web Audio's AnalyserNode. Deliberately NOT
  // a second SpeechRecognition instance: running SpeechRecognition and
  // MediaRecorder against the mic at the same time let them starve each
  // other on some browsers/drivers, which was silently producing empty
  // Whisper transcripts too (not just an empty live preview) — the actual
  // uploaded audio blob was affected, not just the client-side text.
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const volumeRafRef = useRef<number | null>(null)

  const startVolumeMeter = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      const ctx = new AudioCtx()
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 512
      source.connect(analyser)
      audioContextRef.current = ctx
      analyserRef.current = analyser
      const data = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        analyser.getByteTimeDomainData(data)
        let sumSquares = 0
        for (let i = 0; i < data.length; i++) {
          const centered = data[i] - 128
          sumSquares += centered * centered
        }
        const rms = Math.sqrt(sumSquares / data.length)
        if (rms > 4) setHeardAnySpeech(true)
        volumeRafRef.current = requestAnimationFrame(tick)
      }
      volumeRafRef.current = requestAnimationFrame(tick)
    } catch { /* AnalyserNode unavailable — live indicator just won't show, recording is unaffected */ }
  }

  const stopVolumeMeter = () => {
    if (volumeRafRef.current) cancelAnimationFrame(volumeRafRef.current)
    volumeRafRef.current = null
    try { audioContextRef.current?.close() } catch { /* no-op */ }
    audioContextRef.current = null
    analyserRef.current = null
  }

  const stopAndUploadAudio = (qNumber: number) => {
    const mr = mediaRecorderRef.current
    const stream = micStreamRef.current
    mediaRecorderRef.current = null
    micStreamRef.current = null
    if (!mr) return

    setUploadingAudio((prev) => ({ ...prev, [qNumber]: true }))
    mr.onstop = async () => {
      stream?.getTracks().forEach((t) => t.stop())
      const blob = new Blob(audioChunksRef.current, { type: mr.mimeType || 'audio/webm' })
      audioChunksRef.current = []
      if (blob.size === 0 || !user?.token) { setUploadingAudio((prev) => ({ ...prev, [qNumber]: false })); return }
      try {
        const form = new FormData()
        form.append('audio', blob, `q${qNumber}.webm`)
        const itemId = QUESTIONS[qNumber - 1]?.itemId
        if (itemId) form.append('itemId', itemId)
        if (practiceMode) form.append('practice', 'true')
        const res = await fetch(`${baseURL}/api/student/lsrw-content/upload-audio`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${user.token}` },
          body: form,
        })
        const data = await res.json()
        if (data.success) {
          setAudioUrls((prev) => ({ ...prev, [qNumber]: data.audioUrl }))
          if (data.aiAudioUrl) setAiAudioUrls((prev) => ({ ...prev, [qNumber]: data.aiAudioUrl }))
          if (data.accentReview) setAccentReviews((prev) => ({ ...prev, [qNumber]: data.accentReview }))
          // Server-side Whisper transcript is the source of truth — the
          // browser's live SpeechRecognition is unreliable and frequently
          // produces nothing. Prefer Whisper's result; only keep whatever
          // the client already captured if Whisper itself came back empty.
          const serverTranscript = (data.transcript || '').trim()
          if (serverTranscript) {
            setTranscripts((prev) => ({ ...prev, [qNumber]: serverTranscript }))
          }
        }
      } catch { /* non-fatal — submission still goes through, just without real audio playback */ }
      finally { setUploadingAudio((prev) => ({ ...prev, [qNumber]: false })) }
    }
    try { mr.stop() } catch { setUploadingAudio((prev) => ({ ...prev, [qNumber]: false })) }
  }

  const finishRecording = (qNumber: number, seconds: number) => {
    stopRecognition()
    stopVolumeMeter()
    stopAndUploadAudio(qNumber)
    setRecording(false)
    setRecordings((prev) => ({ ...prev, [qNumber]: seconds }))
    setTranscripts((prev) => ({ ...prev, [qNumber]: transcriptAccumRef.current.trim() }))
    setLockedQuestions((prev) => ({ ...prev, [qNumber]: true }))
  }

  const toggleRecording = () => {
    if (lockedQuestions[current]) return
    if (recording) {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current)
      if (recordSeconds > 0) finishRecording(current, recordSeconds)
      else { stopRecognition(); stopVolumeMeter(); setRecording(false) }
      return
    }
    setRecording(true)
    setRecordSeconds(0)
    setHeardAnySpeech(false)
    transcriptAccumRef.current = ''

    audioChunksRef.current = []

    // Always run the browser's own live SpeechRecognition, in both practice
    // and real attempts. Server-side Whisper (below) is still preferred when
    // it succeeds (see stopAndUploadAudio) — but if Whisper fails or is
    // misconfigured server-side, this client-side transcript is the
    // fallback that keeps the question from silently scoring zero.
    const rec = getRecognition()
    if (rec) {
      recognitionActiveRef.current = true
      startRecognitionWithRetry(rec)
    }

    // Also capture raw audio via MediaRecorder for Whisper transcription —
    // in both real and practice attempts, since the browser's own
    // SpeechRecognition alone is unreliable enough that practice attempts
    // were frequently coming back with no transcript at all.
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        micStreamRef.current = stream
        const mr = new MediaRecorder(stream)
        mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
        mediaRecorderRef.current = mr
        mr.start()
        startVolumeMeter(stream)
      })
      .catch(() => { /* mic unavailable for raw audio capture — playback falls back to text-to-speech */ })

    const maxSeconds = QUESTIONS[current - 1]?.timeLimit ?? DEFAULT_RECORD_SECONDS
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

  // Practice-only: lets the student re-record a question when nothing was
  // recognized, instead of being permanently locked out on a wasted attempt.
  // (Real, graded attempts stay one-take — this only clears state for the
  // "Try Again" button, which itself is only shown in practice mode.)
  const retryRecording = (qNumber: number) => {
    setLockedQuestions((prev) => { const next = { ...prev }; delete next[qNumber]; return next })
    setRecordings((prev) => { const next = { ...prev }; delete next[qNumber]; return next })
    setTranscripts((prev) => { const next = { ...prev }; delete next[qNumber]; return next })
    setAudioUrls((prev) => { const next = { ...prev }; delete next[qNumber]; return next })
    setAiAudioUrls((prev) => { const next = { ...prev }; delete next[qNumber]; return next })
    setAccentReviews((prev) => { const next = { ...prev }; delete next[qNumber]; return next })
    setRecordSeconds(0)
    setHeardAnySpeech(false)
  }

  useEffect(() => () => {
    if (recordTimerRef.current) clearInterval(recordTimerRef.current)
    stopRecognition()
    stopVolumeMeter()
    try { mediaRecorderRef.current?.stop() } catch { /* no-op */ }
    micStreamRef.current?.getTracks().forEach((t) => t.stop())
  }, [])

  // Shared by the normal "Submit Section" flow (last question, all answered)
  // and closing early via the X button (only whatever's answered so far) —
  // both persist live proctoring counts alongside the submission.
  const submitAttempt = async (exitedEarly: boolean) => {
    const answered = QUESTIONS.filter((q) => q.itemId && (exitedEarly ? recordings[q.number] !== undefined : true))
    const items = answered.map((q) => ({
      itemId: q.itemId,
      transcript: transcripts[q.number] || '',
      recordedSeconds: recordings[q.number] || 0,
      audioUrl: audioUrls[q.number] || null,
      aiAudioUrl: aiAudioUrls[q.number] || null,
      accentReview: accentReviews[q.number] || null,
    }))
    let result: { scoreAwarded: number; totalMarks: number; submissionId: string } | undefined
    let practiceItems: PracticeResultItem[] = []
    if (items.length > 0 && user?.token) {
      try {
        const res = await fetch(`${baseURL}/api/student/lsrw-content/submit`, {
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
          result = {
            scoreAwarded: data.submission.totalScoreAwarded,
            totalMarks: data.submission.totalMarks,
            submissionId: data.submission._id,
          }
          practiceItems = data.submission.items || []
        }
      } catch { /* still close even if the save fails — don't block the student */ }
    }
    return { result, attempted: items.length > 0, practiceItems }
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

  const q = QUESTIONS[current - 1]
  const accent = q.type === 'reading' ? ORANGE : BLUE

  const goTo = (n: number) => {
    if (n < 1 || n > TOTAL_QUESTIONS || recording) return
    setCurrent(n)
    setPlaying(false)
  }

  const saveAndNext = () => goTo(current + 1)

  const stateOf = (n: number): 'current' | 'answered' | 'notVisited' => {
    if (n === current) return 'current'
    if (recordings[n] !== undefined) return 'answered'
    return 'notVisited'
  }

  const paletteStyle: Record<string, { bg: string; color: string; border: string }> = {
    current:    { bg: accent,     color: '#fff', border: accent },
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
              <span style={{ fontSize: 19, fontWeight: 800, color: PAGE_TEXT }}>Practice Results — Listening &amp; Reading</span>
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
                <span style={{ fontWeight: 700, fontSize: 13, color: PAGE_TEXT }}>Question {idx + 1} — {item.type === 'reading' ? 'Reading' : 'Listening'}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: item.accuracyPercent >= 60 ? '#16a34a' : '#dc2626' }}>
                  {item.accuracyPercent >= 60 ? <FaCheckCircle size={12} /> : <FaTimesCircle size={12} />}
                  {item.scoreAwarded} / {item.marks} ({item.accuracyPercent}%)
                </span>
              </div>
              <div style={{ fontSize: 12.5, color: PAGE_TEXT, marginBottom: 6 }}>
                <strong>Expected:</strong> {item.expectedSentence}
              </div>
              <div style={{ fontSize: 12.5, color: PAGE_GRAY, marginBottom: (item.audioUrl || item.aiAudioUrl) ? 10 : 0 }}>
                <strong>You said:</strong> {item.transcript || <em>(nothing recognized)</em>}
              </div>
              {(item.audioUrl || item.aiAudioUrl) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {item.audioUrl && (
                    <button
                      onClick={() => toggleResultSpeak(`${idx}:student`, item.audioUrl)}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, background: resultSpeakingKey === `${idx}:student` ? ORANGE : '#fff7ed', border: `1px solid ${ORANGE}55`, color: resultSpeakingKey === `${idx}:student` ? '#fff' : ORANGE, borderRadius: 20, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                    >
                      {resultSpeakingKey === `${idx}:student` ? <FaPause size={9} /> : <FaPlay size={8} />}
                      Your Voice
                    </button>
                  )}
                  {item.aiAudioUrl && (
                    <button
                      onClick={() => toggleResultSpeak(`${idx}:ai`, item.aiAudioUrl)}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, background: resultSpeakingKey === `${idx}:ai` ? '#6c63ff' : '#f0efff', border: '1px solid #6c63ff55', color: resultSpeakingKey === `${idx}:ai` ? '#fff' : '#6c63ff', borderRadius: 20, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                    >
                      {resultSpeakingKey === `${idx}:ai` ? <FaPause size={9} /> : <FaPlay size={8} />}
                      AI Voice
                    </button>
                  )}
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
    // Full-page takeover — same pattern as the other LSRW sections and
    // Final Assessment's live exam rounds (a plain fixed div, not a
    // react-bootstrap Modal), so there's no backdrop/z-index stacking to fight.
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
      <div style={{ minHeight: '100vh', padding: '56px 24px 20px', display: 'flex', flexDirection: 'column' as const, fontFamily: '"Segoe UI", system-ui, sans-serif' }}>
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'stretch' }}>

          {/* ── Main Column ─────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column' as const }}>
            <div style={{ background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 14, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.03)', flex: 1, display: 'flex', flexDirection: 'column' as const }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: accent, fontWeight: 800, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {q.type === 'reading' ? <FaBook size={13} /> : <FaHeadphones size={13} />}
                  Question {current} / {TOTAL_QUESTIONS}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {practiceMode && (
                    <span style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #16a34a44', borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700 }}>
                      PRACTICE — not scored or saved
                    </span>
                  )}
                  <span style={{ background: q.type === 'reading' ? '#fff7ed' : '#eff6ff', color: accent, border: `1px solid ${accent}44`, borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700 }}>
                    {q.type === 'reading' ? 'Reading' : 'Listening'}
                  </span>
                </span>
              </div>
              <p style={{ color: PAGE_GRAY, fontSize: 13, margin: '0 0 12px' }}>
                {q.type === 'reading' ? 'Read the sentence below aloud, clearly and at a natural pace.' : 'Listen to the audio carefully, then repeat exactly what you heard.'}
              </p>

              {q.type === 'reading' ? (
                <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12, padding: '16px 18px', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FaBook size={13} color={ORANGE} />
                      <span style={{ fontWeight: 700, fontSize: 12.5, color: ORANGE }}>Sentence to Read</span>
                    </div>
                    {lockedQuestions[current] && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#f0fdf4', color: '#16a34a', border: '1px solid #16a34a44', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                        <FaCheckCircle size={10} /> Completed
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 15, color: '#1e293b', lineHeight: 1.6, fontWeight: 600 }}>{q.sentence}</div>
                </div>
              ) : (
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FaHeadphones size={13} color={BLUE} />
                      <span style={{ fontWeight: 700, fontSize: 12.5, color: BLUE }}>Audio Clip</span>
                    </div>
                    {lockedQuestions[current] && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#f0fdf4', color: '#16a34a', border: '1px solid #16a34a44', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                        <FaCheckCircle size={10} /> Completed
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 10, padding: '10px 14px' }}>
                    <button
                      onClick={() => {
                        if (q.audioUrl && audioElRef.current) {
                          if (playing) audioElRef.current.pause()
                          else audioElRef.current.play().catch(() => {})
                        }
                        setPlaying((p) => !p)
                      }}
                      style={{ width: 32, height: 32, borderRadius: '50%', background: BLUE, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                    >
                      {playing ? <FaPause size={11} color="#fff" /> : <FaPlay size={11} color="#fff" style={{ marginLeft: 2 }} />}
                    </button>
                    <div style={{ flex: 1, height: 5, borderRadius: 4, background: PAGE_BORDER, overflow: 'hidden' }}>
                      <div style={{ width: playing ? '40%' : '0%', height: '100%', background: BLUE, transition: 'width 0.3s' }} />
                    </div>
                    <span style={{ fontSize: 12, color: PAGE_GRAY, flexShrink: 0 }}>{q.audioUrl ? 'Listen' : `00:00 / ${q.audioLength}`}</span>
                    <FaVolumeUp size={13} color={PAGE_GRAY} style={{ flexShrink: 0 }} />
                    {q.audioUrl && (
                      <audio
                        ref={audioElRef}
                        src={q.audioUrl}
                        onEnded={() => setPlaying(false)}
                        style={{ display: 'none' }}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Recording Time */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 20, alignItems: 'stretch' }}>
                  {/* ── Left: recording controls ── */}
                  <div style={{ border: `1px solid ${PAGE_BORDER}`, borderRadius: 12, padding: '16px', display: 'flex', flexDirection: 'column' as const }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FaMicrophone size={12} color={accent} />
                        <span style={{ fontWeight: 700, fontSize: 13, color: PAGE_TEXT }}>{q.type === 'reading' ? 'Your Reading' : 'Your Repetition'}</span>
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
                                  cx={18} cy={18} r={radius} fill="none" stroke={low ? '#dc2626' : accent} strokeWidth={3}
                                  strokeDasharray={circumference} strokeDashoffset={circumference * progress}
                                  strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
                                />
                              </svg>
                              <span style={{ fontSize: 10.5, fontWeight: 700, color: low ? '#dc2626' : accent }}>{fmtTime(remaining)}</span>
                            </div>
                          )
                        })()
                      ) : (
                        <span style={{ fontSize: 11.5, color: PAGE_GRAY }}>Max Time <strong style={{ color: accent }}>{fmtTime(q.timeLimit)}</strong></span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: PAGE_GRAY, marginBottom: 10 }}>
                      {q.type === 'reading' ? 'Click the mic and read the sentence above aloud.' : 'Click the mic and repeat exactly what you just heard.'}
                    </div>

                    <div style={{ background: PAGE_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 10, padding: '20px 16px', marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 36, justifyContent: 'center' }}>
                        {Array.from({ length: 48 }, (_, i) => {
                          const active = recording && i < Math.round((recordSeconds / q.timeLimit) * 48)
                          const h = 8 + ((i * 37) % 26)
                          return <span key={i} style={{ width: 3, height: h, borderRadius: 2, background: active ? accent : PAGE_BORDER, flexShrink: 0 }} />
                        })}
                      </div>
                      <div style={{ textAlign: 'center' as const, fontSize: 11.5, color: PAGE_GRAY, marginTop: 8 }}>
                        {fmtTime(recordSeconds)} / {fmtTime(q.timeLimit)}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 8 }}>
                      <button
                        onClick={toggleRecording}
                        disabled={lockedQuestions[current]}
                        style={{
                          width: 56, height: 56, borderRadius: '50%', border: 'none',
                          cursor: lockedQuestions[current] ? 'not-allowed' : 'pointer',
                          background: lockedQuestions[current] ? PAGE_BORDER : recording ? '#dc2626' : accent,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: recording ? '0 0 0 6px rgba(220,38,38,0.15)' : 'none',
                        }}
                      >
                        <FaMicrophone size={20} color={lockedQuestions[current] ? PAGE_GRAY : '#fff'} />
                      </button>
                      <span style={{ fontSize: 11.5, color: PAGE_GRAY }}>
                        {recording
                          ? 'Recording… click to stop'
                          : lockedQuestions[current]
                            ? 'Attempt used — one recording per question'
                            : 'Click the mic to start recording'}
                      </span>

                      {/* Live heads-up — this is their ONE attempt, so if speech
                          recognition isn't picking anything up, better they find
                          out while there's still time left to speak louder/closer
                          to the mic than after the fact. */}
                      {recording && recordSeconds >= 3 && !heardAnySpeech && (
                        <div style={{ width: '100%', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <FaExclamationTriangle size={11} color="#92400e" />
                          <span style={{ fontSize: 11, color: '#92400e' }}>No speech detected yet — speak clearly and check your mic.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Divider ── */}
                  <div style={{ width: 1, background: PAGE_BORDER }} />

                  {/* ── Right: captured result ── */}
                  <div style={{ border: `1px solid ${PAGE_BORDER}`, borderRadius: 12, padding: '16px', display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' }}>
                    {/* Confirms the recording actually saved — shows what the
                        mic captured so the student isn't left wondering. While
                        the audio is still uploading/being transcribed server-
                        side, this stays neutral rather than flashing "failed"
                        with the (often still-empty) client transcript first. */}
                    {lockedQuestions[current] ? (
                      uploadingAudio[current] ? (
                        <div style={{ background: PAGE_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 13, height: 13, borderRadius: '50%', border: `2px solid ${PAGE_BORDER}`, borderTopColor: accent, animation: 'lsrw-spin 0.7s linear infinite' }} />
                          <span style={{ fontSize: 11.5, color: PAGE_GRAY }}>Processing your recording…</span>
                          <style>{`@keyframes lsrw-spin { to { transform: rotate(360deg); } }`}</style>
                        </div>
                      ) : (
                        <div style={{ background: transcripts[current] ? '#f0fdf4' : '#fef2f2', border: `1px solid ${transcripts[current] ? '#86efac' : '#fca5a5'}`, borderRadius: 10, padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <FaCheckCircle size={11} color={transcripts[current] ? '#16a34a' : '#dc2626'} />
                            <span style={{ fontSize: 11.5, fontWeight: 700, color: transcripts[current] ? '#16a34a' : '#dc2626' }}>
                              Captured — {fmtTime(recordings[current] || 0)} recorded
                            </span>
                          </div>
                          {transcripts[current] ? (
                            <div style={{ fontSize: 11, color: '#166534', lineHeight: 1.5 }}>
                              "{transcripts[current]}"
                            </div>
                          ) : (
                            <>
                              <div style={{ fontSize: 11, color: '#991b1b', lineHeight: 1.5 }}>
                                No speech was recognized in this recording{practiceMode ? '' : ' — this will likely score 0 on this question'}. Your raw audio is still saved.
                              </div>
                              {practiceMode && (
                                <button
                                  onClick={() => retryRecording(current)}
                                  style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, background: '#fff', border: '1px solid #fca5a5', borderRadius: 8, padding: '6px 12px', fontSize: 11.5, fontWeight: 700, color: '#991b1b', cursor: 'pointer' }}
                                >
                                  <FaMicrophone size={10} /> Try Again
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      )
                    ) : (
                      <div style={{ border: `1px dashed ${PAGE_BORDER}`, borderRadius: 10, padding: '20px 14px', textAlign: 'center' as const, color: PAGE_GRAY, fontSize: 11.5 }}>
                        Your captured recording and transcript will appear here.
                      </div>
                    )}
                  </div>
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
                  disabled={recording || !lockedQuestions[current] || uploadingAudio[current]}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: accent, border: 'none', borderRadius: 10, padding: '10px 22px', fontSize: 13, fontWeight: 700, color: '#fff', cursor: (recording || !lockedQuestions[current] || uploadingAudio[current]) ? 'not-allowed' : 'pointer', opacity: (recording || !lockedQuestions[current] || uploadingAudio[current]) ? 0.6 : 1 }}
                >
                  <FaPaperPlane size={12} /> {uploadingAudio[current] ? 'Saving audio…' : practiceMode ? 'See Results' : 'Submit Section'}
                </button>
              ) : (
                <button
                  onClick={saveAndNext}
                  disabled={recording || !lockedQuestions[current] || uploadingAudio[current]}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: accent, border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 700, color: '#fff', cursor: (recording || !lockedQuestions[current] || uploadingAudio[current]) ? 'not-allowed' : 'pointer', opacity: (recording || !lockedQuestions[current] || uploadingAudio[current]) ? 0.6 : 1 }}
                >
                  {uploadingAudio[current] ? 'Saving audio…' : <>Save & Next <FaArrowRight size={11} /></>}
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
                <FaHeadphones size={13} color={ORANGE} />
                <span style={{ fontWeight: 700, fontSize: 13.5, color: PAGE_TEXT }}>Listening & Reading Overview</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 14 }}>
                {QUESTIONS.map((qq) => {
                  const st = stateOf(qq.number)
                  const s = st === 'current' ? { bg: qq.type === 'reading' ? ORANGE : BLUE, color: '#fff', border: qq.type === 'reading' ? ORANGE : BLUE } : paletteStyle[st]
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
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: ORANGE, display: 'inline-block' }} /> Reading (1–{READING_COUNT})</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: BLUE, display: 'inline-block' }} /> Listening ({READING_COUNT + 1}–{TOTAL_QUESTIONS})</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: '#22c55e', display: 'inline-block' }} /> Answered</span>
              </div>
            </div>

            {/* Camera / face proctoring preview — identical wiring to the
                other LSRW sections. Pinned to the bottom of the stretched
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

export default ListeningReadingSectionModal
