import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ProgressBar, Spinner, Alert, Modal } from 'react-bootstrap'
import { 
  FaMicrophone, 
  FaStop, 
  FaArrowLeft, 
  FaArrowRight, 
  FaCheckCircle, 
  FaClock, 
  FaList, 
  FaVideo, 
  FaDesktop,
  FaExclamationTriangle,
  FaUserTie,
  FaBrain,
  FaSpinner,
  FaPlay,
  FaCheck
} from 'react-icons/fa'

import { useProctorGuard } from '../helper/useProctorGuard'
import ProctorLockModal from '../components/ProctorLockModal'

type HRQuestion = { _id: string; topic: string; question: string }

type Props = {
  baseURL: string
  authToken: string | undefined
  onClose: () => void
  onSubmitted: () => void
}

export default function HRRound({ baseURL, authToken, onClose, onSubmitted }: Props) {
  const [open, setOpen] = useState(true)

  // ===== TIMER STATE =====
  const [timeLeft, setTimeLeft] = useState(30 * 60) // 30 minutes in seconds
  const [timerActive, setTimerActive] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Topics
  const [allTopics, setAllTopics] = useState<string[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [loadErr, setLoadErr] = useState('')

  // Q&A
  const [loadingQs, setLoadingQs] = useState(false)
  const [qs, setQs] = useState<HRQuestion[]>([])
  const [idx, setIdx] = useState(0)
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({})
  const current = qs[idx]
  const progress = useMemo(() => (qs.length ? Math.round((idx / qs.length) * 100) : 0), [idx, qs.length])

  // Check if it's the last question
  const isLastQuestion = qs.length > 0 && idx === qs.length - 1

  // Dictation
  const [dictating, setDictating] = useState(false)
  const recRef = useRef<any | null>(null)
  const sttQidRef = useRef<string | null>(null)
  const interimRef = useRef<Record<string, string>>({})
  const [, tick] = useState(0)
  const rafRef = useRef<number | null>(null)
  const lastInterimPaintRef = useRef<string>('')

  // UI
  const [reviewing, setReviewing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uiErr, setUiErr] = useState('')

  // Recording
  const [started, setStarted] = useState(false)
  const [sessionErr, setSessionErr] = useState('')
  const [sessionBlob, setSessionBlob] = useState<Blob | null>(null)

  const displayStreamRef = useRef<MediaStream | null>(null)
  const cameraStreamRef = useRef<MediaStream | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)
  const combinedStreamRef = useRef<MediaStream | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<BlobPart[]>([])
  const stopResolveRef = useRef<(b: Blob | null) => void>()

  // Previews
  const screenVideoElRef = useRef<HTMLVideoElement | null>(null)
  const camVideoElRef = useRef<HTMLVideoElement | null>(null)

  // TTS voices
  const suppressSpeakRef = useRef(false)
  const selectedVoiceRef = useRef<SpeechSynthesisVoice | null>(null)

  /* ---------- Proctoring ---------- */
  const VIOLATION_LIMIT = 2
  const { locked: proctorLocked, violationCount, isFullscreen, acknowledge, arm, disarm } = useProctorGuard({ maxViolations: VIOLATION_LIMIT })
  const remaining = Math.max(0, VIOLATION_LIMIT - violationCount)
  const lockMsg = 'Tab switching is not allowed during the HR interview.'

  // ===== TIMER FUNCTIONS =====
  const startTimer = () => {
    setTimerActive(true)
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleAutoSubmit('Time expired - auto submitted')
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setTimerActive(false)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  /* ---------- helpers ---------- */
  const setScreenVideoRef = (el: HTMLVideoElement | null) => {
    screenVideoElRef.current = el
    if (el && displayStreamRef.current && !el.srcObject) attachStream(el, displayStreamRef.current)
  }
  const setCamVideoRef = (el: HTMLVideoElement | null) => {
    camVideoElRef.current = el
    if (el && cameraStreamRef.current && !el.srcObject) attachStream(el, cameraStreamRef.current)
  }
  const attachStream = (el: HTMLVideoElement, stream: MediaStream) => {
    try {
      if (el.srcObject === stream) return
      el.srcObject = stream
      el.muted = true
      el.playsInline = true
      const tryPlay = () => el.play().catch(() => { })
      el.onloadedmetadata = tryPlay
      tryPlay()
    } catch { }
  }

  const enterFullscreenFromUserGesture = async (): Promise<boolean> => {
    const el: any = document.documentElement
    try {
      if (document.fullscreenElement) return true
      if (el.requestFullscreen) await el.requestFullscreen()
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen()
      else if (el.msRequestFullscreen) await el.msRequestFullscreen()
      else return false
      return true
    } catch {
      return false
    }
  }

  // voice helpers
  const pickFemaleEnglishVoice = (voices: SpeechSynthesisVoice[]) => {
    if (!voices?.length) return null
    const lname = (s: string) => s.toLowerCase()
    const isEn = (v: SpeechSynthesisVoice) => lname(v.lang || '').startsWith('en')
    return (
      voices.find((v) => /female/i.test(v.name)) ||
      voices.find(
        (v) =>
          isEn(v) &&
          ['aria', 'zira', 'samantha', 'victoria', 'karen', 'tessa', 'moira', 'serena', 'emma', 'joanna', 'kendra', 'kimberly', 'salli'].some((n) =>
            lname(v.name).includes(n),
          ),
      ) ||
      voices.find((v) => lname(v.name).includes('google uk english female')) ||
      voices.find(isEn) ||
      voices[0]
    )
  }

  const ensureVoices = (): Promise<void> =>
    new Promise((resolve) => {
      const synth = window.speechSynthesis
      if (!synth) return resolve()
      const load = () => {
        const voices = synth.getVoices()
        if (voices && voices.length) {
          selectedVoiceRef.current = pickFemaleEnglishVoice(voices)
          resolve()
        }
      }
      load()
      synth.onvoiceschanged = load
      setTimeout(load, 600)
    })

  const speak = async (text: string) => {
    try {
      const synth = window.speechSynthesis
      if (!synth) return
      await ensureVoices()
      synth.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.voice = selectedVoiceRef.current || null
      u.rate = 1.0
      u.pitch = 1.0
      u.volume = 1.0
      setTimeout(() => {
        try {
          synth.speak(u)
        } catch { }
      }, 60)
    } catch { }
  }

  const speakSequence = async (texts: string[]) => {
    const synth = window.speechSynthesis
    if (!synth || !texts.length) return
    await ensureVoices()
    synth.cancel()
    let i = 0
    const playNext = () => {
      if (i >= texts.length) return
      const u = new SpeechSynthesisUtterance(texts[i++])
      u.voice = selectedVoiceRef.current || null
      u.rate = 1.0
      u.pitch = 1.0
      u.volume = 1.0
      u.onend = playNext
      try {
        synth.speak(u)
      } catch { }
    }
    playNext()
  }

  /* ======================= Load topics ======================= */
  useEffect(() => {
    if (!authToken) return
      ; (async () => {
        try {
          const res = await fetch(`${baseURL}/api/hr/topics`, { headers: { Authorization: `Bearer ${authToken}` } })
          const data = await res.json()
          if (!data?.success) throw new Error(data?.error || 'Failed to load HR topics')
          setAllTopics(data.topics || [])
        } catch (e: any) {
          setLoadErr(e?.message || 'Failed to load HR topics')
        }
      })()
  }, [authToken, baseURL])

  const toggleTopic = (t: string) => setSelected((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))

  /* ======================= Fetch questions ======================= */
  const fetchQuestions = async (): Promise<HRQuestion[] | null> => {
    if (!authToken || selected.length === 0) return null
    setLoadingQs(true)
    try {
      const params = new URLSearchParams({ topics: selected.join(','), count: '10' })
      const res = await fetch(`${baseURL}/api/hr/questions?${params}`, { headers: { Authorization: `Bearer ${authToken}` } })
      const data = await res.json()
      if (data?.success) {
        const arr: HRQuestion[] = data.questions || []
        setQs(arr)
        setIdx(0)
        const init: Record<string, string> = {}
        arr.forEach((q) => (init[q._id] = ''))
        setTextAnswers(init)
        interimRef.current = {}
        startTimer()
        return arr
      } else {
        setUiErr(data?.error || 'Failed to load HR questions')
        return null
      }
    } finally {
      setLoadingQs(false)
    }
  }

  /* ======================= Dictation ======================= */
  function getSpeechRecognition(): any | null {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return null
    const rec = new SR()
    rec.lang = 'en-US'
    rec.continuous = true
    rec.interimResults = true
    return rec
  }

  const startDictation = () => {
    if (dictating || !current || proctorLocked) return
    const rec = getSpeechRecognition()
    if (!rec) {
      setUiErr('Speech recognition not supported. Use Chrome/Edge on https or localhost.')
      return
    }
    const qid = current._id
    sttQidRef.current = qid
    interimRef.current[qid] = ''
    rec.onresult = (evt: any) => {
      const workingQid = sttQidRef.current
      if (!workingQid) return
      let finalsToAppend = ''
      let interim = ''
      for (let i = evt.resultIndex; i < evt.results.length; i++) {
        const r = evt.results[i]
        const t = r[0]?.transcript?.trim() || ''
        if (!t) continue
        if (r.isFinal) finalsToAppend += (finalsToAppend ? ' ' : '') + t
        else interim = t
      }
      if (finalsToAppend) setTextAnswers((prev) => ({ ...prev, [workingQid]: (prev[workingQid] ? prev[workingQid] + ' ' : '') + finalsToAppend }))
      interimRef.current[workingQid] = interim
      if (rafRef.current == null) {
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = null
          if (lastInterimPaintRef.current !== interim) {
            lastInterimPaintRef.current = interim
            tick((x) => x + 1)
          }
        })
      }
    }
    rec.onerror = () => setDictating(false)
    rec.onend = () => {
      if (dictating && sttQidRef.current === current?._id) {
        try {
          setTimeout(() => rec.start(), 100)
        } catch {
          setDictating(false)
        }
      }
    }
    try {
      rec.start()
      setDictating(true)
    } catch {
      setUiErr('Failed to start speech recognition. Please try again.')
    }
    recRef.current = rec
  }

  const stopDictation = () => {
    setDictating(false)
    try {
      if (recRef.current) {
        recRef.current.onend = null
        recRef.current.stop()
      }
    } catch { }
    recRef.current = null
    if (current) {
      interimRef.current[current._id] = ''
      tick((x) => x + 1)
    }
  }

  useEffect(() => {
    if (dictating) stopDictation()
  }, [idx])

  /* ======================= Recording ======================= */
  const chooseMime = () =>
    MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
        ? 'video/webm;codecs=vp8,opus'
        : 'video/webm'

  const startSession = async (preDisplay?: MediaStream) => {
    setSessionErr('')
    setStarted(false)
    setSessionBlob(null)
    recordedChunksRef.current = []

    let display: MediaStream
    if (preDisplay) {
      display = preDisplay
    } else {
      try {
        display = await (navigator.mediaDevices as any).getDisplayMedia({
          video: { cursor: 'always', frameRate: { ideal: 30 }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        })
      } catch {
        setSessionErr('Screen sharing is required to start the interview.')
        return false
      }
    }

    let camera: MediaStream | null = null
    let mic: MediaStream | null = null
    try {
      camera = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      })
      mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false })
    } catch {
      display.getTracks().forEach((t) => t.stop())
      setSessionErr('Camera & microphone permissions are required.')
      return false
    }

    displayStreamRef.current = display
    cameraStreamRef.current = camera!
    micStreamRef.current = mic!
    if (screenVideoElRef.current) attachStream(screenVideoElRef.current, display)
    if (camVideoElRef.current) attachStream(camVideoElRef.current, camera!)

    const combined = new MediaStream([...display.getVideoTracks(), ...camera!.getVideoTracks(), ...mic!.getAudioTracks()])
    combinedStreamRef.current = combined

    const mimeType = chooseMime()
    const mr = new MediaRecorder(combined, { mimeType })
    mediaRecorderRef.current = mr

    mr.ondataavailable = (e) => e.data && e.data.size && recordedChunksRef.current.push(e.data)
    mr.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: mimeType })
      setSessionBlob(blob)
      try {
        combined.getTracks().forEach((t) => t.stop())
      } catch { }
      try {
        display.getTracks().forEach((t) => t.stop())
      } catch { }
      try {
        camera!.getTracks().forEach((t) => t.stop())
      } catch { }
      try {
        mic!.getTracks().forEach((t) => t.stop())
      } catch { }
      combinedStreamRef.current = null
      displayStreamRef.current = null
      cameraStreamRef.current = null
      micStreamRef.current = null
      if (stopResolveRef.current) {
        stopResolveRef.current(blob)
        stopResolveRef.current = undefined
      }
    }

    display.getVideoTracks()[0].onended = () => stopSession()

    mr.start(1000)
    setStarted(true)
    arm()
    return true
  }

  const stopSession = () => {
    try {
      mediaRecorderRef.current?.stop()
    } catch { }
    setStarted(false)
    disarm()
  }
  const stopSessionAsync = (): Promise<Blob | null> => {
    if (!mediaRecorderRef.current || !started) return Promise.resolve(sessionBlob)
    return new Promise<Blob | null>((resolve) => {
      stopResolveRef.current = resolve
      try {
        mediaRecorderRef.current!.stop()
      } catch {
        resolve(null)
      }
      setStarted(false)
      disarm()
    })
  }

  /* ======================= Flow ======================= */
  const handleStartInterview = async () => {
    let preDisplay: MediaStream | null = null
    try {
      preDisplay = await (navigator.mediaDevices as any).getDisplayMedia({
        video: { cursor: 'always', frameRate: { ideal: 30 }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })
    } catch {
      setSessionErr('Screen sharing is required to start the interview.')
      return
    }

    await enterFullscreenFromUserGesture()

    try {
      const s = window.speechSynthesis
      if (s) {
        s.cancel()
        await ensureVoices()
        s.resume?.()
      }
    } catch { }

    const ok = await startSession(preDisplay!)
    if (!ok || !mediaRecorderRef.current) return

    const questions = await fetchQuestions()
    if (questions?.length) {
      suppressSpeakRef.current = true
      void speakSequence(["Welcome to HR Panel. Let's start the HR discussion.", questions[0].question])
    }
  }

  const handleNext = () => setIdx((i) => Math.min(i + 1, qs.length - 1))
  const handlePrev = () => setIdx((i) => Math.max(i - 1, 0))

  const allAnswered = qs.length > 0 && qs.every((q) => (textAnswers[q._id] || '').trim().length > 0)

  const uploadHRSessionToS3 = async (blob: Blob): Promise<string> => {
    if (!authToken) throw new Error('Auth required')

    const presignRes = await fetch(`${baseURL}/api/hr/presign/session`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: `session_${Date.now()}.webm`,
        fileType: blob.type || 'video/webm',
      }),
    })

    const { uploadUrl, fileUrl } = await presignRes.json()
    if (!uploadUrl || !fileUrl) throw new Error('Failed to get upload URL')

    await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': blob.type || 'video/webm' },
      body: blob,
    })

    return fileUrl
  }

  const handleSubmit = async (opts?: { auto?: boolean; reason?: string }) => {
    const { auto = false, reason } = opts || {}
    if (!authToken || qs.length === 0 || (!allAnswered && !auto)) return

    stopTimer()
    setSubmitting(true)

    try {
      stopDictation()

      let finalBlob: Blob | null = sessionBlob
      if (started && mediaRecorderRef.current) {
        finalBlob = await stopSessionAsync()
      }

      let sessionMediaUrl = ''
      if (finalBlob && finalBlob.size > 0) {
        sessionMediaUrl = await uploadHRSessionToS3(new Blob([finalBlob], { type: 'video/webm' }))
      }

      const answers = qs.map((q) => ({
        qid: q._id,
        questionText: q.question,
        textAnswer: (textAnswers[q._id] || '').trim(),
      }))

      const res = await fetch(`${baseURL}/api/hr/submit`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topics: selected,
          answers,
          sessionMediaUrl,
          proctorMeta: {
            autoSubmitted: auto,
            violations: violationCount,
            reason: reason || null,
            timeLeft,
          },
        }),
      })

      const data = await res.json()
      if (data?.success) {
        setOpen(false)
        onSubmitted()
      } else {
        setUiErr(data?.error || 'Submit failed')
      }
    } catch (e: any) {
      setUiErr(e.message || 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAutoSubmit = async (why: string) => {
    await handleSubmit({ auto: true, reason: why })
  }

  useEffect(() => {
    const LIMIT = 2
    if (violationCount >= LIMIT) {
      handleAutoSubmit('Auto-submitted due to proctoring violations')
    }
  }, [violationCount])

  useEffect(() => {
    if (timeLeft === 0 && timerActive) {
      handleAutoSubmit('Time expired - auto submitted')
    }
  }, [timeLeft, timerActive])

  useEffect(() => {
    if (current?.question) {
      if (suppressSpeakRef.current) {
        suppressSpeakRef.current = false
        return
      }
      void speak(current.question)
    }
  }, [current?._id])

  useEffect(() => {
    return () => {
      stopTimer()
      try {
        recRef.current?.stop()
      } catch { }
      try {
        mediaRecorderRef.current?.stop()
      } catch { }
      try {
        combinedStreamRef.current?.getTracks().forEach((t) => t.stop())
      } catch { }
      try {
        displayStreamRef.current?.getTracks().forEach((t) => t.stop())
      } catch { }
      try {
        cameraStreamRef.current?.getTracks().forEach((t) => t.stop())
      } catch { }
      try {
        micStreamRef.current?.getTracks().forEach((t) => t.stop())
      } catch { }
      try {
        window.speechSynthesis?.cancel()
      } catch { }
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      disarm()
    }
  }, [])

  const handleCloseModal = () => {
    stopTimer()
    try {
      recRef.current?.stop()
    } catch { }
    try {
      mediaRecorderRef.current?.stop()
    } catch { }
    try {
      combinedStreamRef.current?.getTracks().forEach((t) => t.stop())
    } catch { }
    try {
      displayStreamRef.current?.getTracks().forEach((t) => t.stop())
    } catch { }
    try {
      cameraStreamRef.current?.getTracks().forEach((t) => t.stop())
    } catch { }
    try {
      micStreamRef.current?.getTracks().forEach((t) => t.stop())
    } catch { }
    setOpen(false)
    disarm()
    onClose()
  }

  const committedValue = current ? textAnswers[current._id] || '' : ''
  const currentInterim = dictating && current ? interimRef.current[current._id] || '' : ''

  return (
    <>
      <ProctorLockModal
        show={proctorLocked && open}
        isFullscreen={isFullscreen}
        title="⚠️ Proctoring Violation Detected"
        message={lockMsg}
        remaining={remaining}
        onReenterFullscreen={() => {
          void enterFullscreenFromUserGesture()
        }}
        onAcknowledge={acknowledge}
      />

      <Modal
        show={open}
        onHide={handleCloseModal}
        fullscreen
        backdrop="static"
        keyboard={false}
        className="hr-modal-custom"
      >
        <Modal.Header closeButton className="modal-header-custom">
          <div className="header-content-custom">
            <div>
              <h1 className="modal-title-custom">HR Interview</h1>
              <p className="modal-subtitle">Prepare for your HR round with personalized questions</p>
            </div>
            {timerActive && (
              <div className="timer-display-custom">
                <FaClock className="timer-icon" />
                <span className={timeLeft < 300 ? 'time-warning' : ''}>{formatTime(timeLeft)}</span>
              </div>
            )}
          </div>
        </Modal.Header>

        <Modal.Body className="modal-body-custom">
          {loadErr && (
            <Alert variant="danger" className="alert-custom alert-danger">
              <FaExclamationTriangle className="alert-icon" />
              <span>{loadErr}</span>
            </Alert>
          )}
          {uiErr && (
            <Alert variant="warning" className="alert-custom alert-warning">
              <FaExclamationTriangle className="alert-icon" />
              <span>{uiErr}</span>
            </Alert>
          )}
          {sessionErr && (
            <Alert variant="warning" className="alert-custom alert-warning">
              <FaExclamationTriangle className="alert-icon" />
              <span>{sessionErr}</span>
            </Alert>
          )}

          {/* Topic selection */}
          {!qs.length && !reviewing && (
            <div className="topic-selection-container">
              <div className="topic-card">
                <div className="topic-icon-wrapper">
                  <FaUserTie className="topic-icon" />
                </div>
                <h3 className="topic-title">Select HR Topics</h3>
                <p className="topic-subtitle">Screen share, camera and mic are required. 10 questions • 30 minutes</p>
                
                <div className="topics-grid">
                  {allTopics.map((t) => (
                    <button
                      key={t}
                      className={`topic-chip ${selected.includes(t) ? 'selected' : ''}`}
                      onClick={() => toggleTopic(t)}
                      disabled={proctorLocked}>
                      {t}
                    </button>
                  ))}
                </div>
                
                <button 
                  className="start-interview-btn-custom" 
                  disabled={!selected.length || loadingQs || proctorLocked} 
                  onClick={handleStartInterview}
                >
                  {loadingQs ? (
                    <>
                      <FaSpinner className="spinner-icon" />
                      Loading Questions...
                    </>
                  ) : (
                    <>
                      <FaPlay className="me-2" />
                      Start Interview
                    </>
                  )}
                </button>

                {(started || sessionBlob) && (
                  <div className="preview-section">
                    <div className="preview-item">
                      <h6><FaDesktop className="me-2" /> Screen (live)</h6>
                      <div className="video-preview-custom">
                        <video ref={setScreenVideoRef} muted playsInline autoPlay className="video-element" />
                      </div>
                    </div>
                    <div className="preview-item">
                      <h6><FaVideo className="me-2" /> Camera (live)</h6>
                      <div className="video-preview-custom camera-preview">
                        <video ref={setCamVideoRef} muted playsInline autoPlay className="video-element" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Interview */}
          {!!qs.length && !reviewing && (
            <div className="interview-grid">
              <div className="interview-left">
                <div className="question-container-custom">
                  <div className="question-header-custom">
                    <div className="progress-area">
                      <span className="question-count">
                        Question {idx + 1} / {qs.length}
                      </span>
                      <ProgressBar now={progress} className="progress-bar-custom" />
                    </div>
                    <div className="selected-topics">
                      {selected.map((s) => (
                        <span key={s} className="topic-tag-custom">{s}</span>
                      ))}
                    </div>
                  </div>

                  <div className="question-card-custom">
                    <h3 className="question-text-custom">{current?.question}</h3>

                    <div className="answer-section-custom">
                      <label>Your Answer</label>
                      <textarea
                        placeholder="Speak (Start) or type freely…"
                        value={committedValue}
                        onChange={(e) => {
                          if (!current || proctorLocked) return
                          interimRef.current[current._id] = ''
                          setTextAnswers((prev) => ({ ...prev, [current._id]: e.target.value }))
                          tick((x) => x + 1)
                        }}
                        rows={6}
                        className="answer-textarea-custom"
                        readOnly={proctorLocked}
                      />
                      {currentInterim && (
                        <div className="interim-line-custom">
                          <em>{currentInterim}</em>
                        </div>
                      )}
                      <div className="helper-text">{dictating ? "Listening… you can pause; text won't reset." : 'Press Start to speak.'}</div>
                    </div>

                    <div className="audio-controls-custom">
                      {!dictating ? (
                        <button className="record-btn-custom" onClick={startDictation} disabled={proctorLocked}>
                          <FaMicrophone className="me-2" /> Start
                        </button>
                      ) : (
                        <button className="stop-record-btn-custom" onClick={stopDictation} disabled={proctorLocked}>
                          <FaStop className="me-2" /> Stop
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="nav-controls-custom">
                    <button className="nav-btn prev" onClick={handlePrev} disabled={idx === 0 || proctorLocked}>
                      <FaArrowLeft className="me-2" /> Previous
                    </button>
                    {!isLastQuestion ? (
                      <button className="nav-btn next" onClick={handleNext} disabled={idx === qs.length - 1 || proctorLocked}>
                        Next <FaArrowRight className="ms-2" />
                      </button>
                    ) : (
                      <button
                        className="review-btn-custom"
                        onClick={() => setReviewing(true)}
                        disabled={proctorLocked}
                      >
                        <FaCheck className="me-2" /> Review Answers
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="interview-right">
                <div className="video-panel">
                  <div className="video-section-custom">
                    <h4><FaDesktop className="me-2" /> Screen Recording</h4>
                    <div className="video-preview-custom">
                      <video ref={setScreenVideoRef} muted playsInline autoPlay className="video-element" />
                      {!started && !sessionBlob && (
                        <div className="video-placeholder-custom">
                          <div>Waiting for capture…</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="video-section-custom">
                    <h4><FaVideo className="me-2" /> Student Camera</h4>
                    <div className="video-preview-custom camera-preview">
                      <video ref={setCamVideoRef} muted playsInline autoPlay className="video-element" />
                    </div>
                  </div>

                  <div className="recording-status-custom">
                    <span className={`status-dot ${started ? 'active' : ''}`}></span>
                    <span>{started ? 'Screen, camera & mic are recording' : 'Recording stopped'}</span>
                  </div>

                  {timerActive && (
                    <div className="timer-panel-custom">
                      <FaClock className="timer-icon" />
                      <strong>Time: {formatTime(timeLeft)}</strong>
                      {isLastQuestion && (
                        <div className="final-note">This is the final question. Click "Review Answers" to submit.</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Review */}
          {!!qs.length && reviewing && (
            <div className="review-section">
              <div className="review-container">
                <div className="review-header">
                  <h3>Review your answers</h3>
                  <p>Click any question to edit, then submit.</p>
                  {timerActive && (
                    <div className="timer-review-custom">
                      <FaClock className="timer-icon" />
                      <strong>Time Remaining: {formatTime(timeLeft)}</strong>
                    </div>
                  )}
                </div>

                <div className="review-list">
                  {qs.map((q, i) => {
                    const ans = (textAnswers[q._id] || '').trim()
                    return (
                      <div key={q._id} className="review-item">
                        <div
                          className="review-question"
                          onClick={() => {
                            if (proctorLocked) return
                            setReviewing(false)
                            setIdx(i)
                          }}
                        >
                          Q{i + 1}. {q.question}
                        </div>
                        <div className={`review-answer-custom ${!ans ? 'empty' : ''}`}>
                          {ans || <span>No answer provided</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="review-actions">
                  <button className="back-btn" onClick={() => setReviewing(false)} disabled={proctorLocked}>
                    <FaArrowLeft className="me-2" /> Back to questions
                  </button>
                  <button
                    className="final-submit-btn"
                    onClick={() => handleSubmit()}
                    disabled={(!allAnswered && !proctorLocked) || submitting}
                  >
                    {submitting ? <FaSpinner className="spinner-icon" /> : <FaCheckCircle className="me-2" />}
                    {submitting ? 'Submitting...' : 'Final Submit'}
                  </button>
                </div>

                {sessionBlob && (
                  <div className="recording-preview-custom">
                    <h6>Recorded session</h6>
                    <video controls src={URL.createObjectURL(sessionBlob)} className="session-video" />
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>

      <style>{`
        .hr-modal-custom .modal-content {
          background: #000000;
          border: none;
          border-radius: 0;
        }

        /* Header */
        .modal-header-custom {
          background: linear-gradient(135deg, #0a0a0a 0%, #000000 100%);
          border-bottom: 1px solid #ff7a00;
          padding: 1.25rem 2rem;
        }

        .header-content-custom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .modal-title-custom {
          color: #ffffff;
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
        }

        .modal-subtitle {
          color: #8a8a8a;
          font-size: 0.85rem;
          margin: 0.25rem 0 0 0;
        }

        .timer-display-custom {
          background: rgba(255, 122, 0, 0.2);
          border: 1px solid #ff7a00;
          border-radius: 8px;
          padding: 0.5rem 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .timer-icon {
          color: #ff7a00;
        }

        .timer-display-custom span {
          color: #ffffff;
          font-weight: 600;
          font-size: 1.25rem;
        }

        .time-warning {
          color: #ff6b6b !important;
        }

        /* Body */
        .modal-body-custom {
          padding: 2rem;
          overflow-y: auto;
          background: #000000;
        }

        /* Alerts */
        .alert-custom {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
        }

        .alert-danger {
          background: rgba(220, 53, 69, 0.1);
          border: 1px solid #dc3545;
          color: #ff6b6b;
        }

        .alert-warning {
          background: rgba(255, 122, 0, 0.1);
          border: 1px solid #ff7a00;
          color: #ff7a00;
        }

        .alert-icon {
          font-size: 1.25rem;
        }

        /* Topic Selection */
        .topic-selection-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 70vh;
        }

        .topic-card {
          background: #0a0a0a;
          border: 1px solid #1f1f1f;
          border-radius: 24px;
          padding: 2.5rem;
          max-width: 700px;
          width: 100%;
          text-align: center;
        }

        .topic-icon-wrapper {
          width: 80px;
          height: 80px;
          background: rgba(255, 122, 0, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
        }

        .topic-icon {
          font-size: 2.5rem;
          color: #ff7a00;
        }

        .topic-title {
          color: #ffffff;
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .topic-subtitle {
          color: #8a8a8a;
          margin-bottom: 1.5rem;
        }

        .topics-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          justify-content: center;
          margin: 1.5rem 0;
        }

        .topic-chip {
          padding: 0.6rem 1.2rem;
          border-radius: 999px;
          border: 1px solid #2c2c2c;
          background: #000000;
          color: #e5e5e5;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 500;
        }

        .topic-chip:hover {
          border-color: #ff7a00;
          background: rgba(255, 122, 0, 0.1);
          color: #ff7a00;
        }

        .topic-chip.selected {
          background: linear-gradient(135deg, #ff7a00 0%, #ff944d 100%);
          border-color: transparent;
          color: #000000;
        }

        .start-interview-btn-custom {
          background: linear-gradient(135deg, #ff7a00 0%, #ff944d 100%);
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          color: #000000;
          font-weight: 600;
          width: 100%;
          transition: all 0.2s ease;
        }

        .start-interview-btn-custom:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 122, 0, 0.4);
        }

        .start-interview-btn-custom:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .preview-section {
          margin-top: 1.5rem;
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .preview-item {
          flex: 1;
          min-width: 200px;
        }

        .preview-item h6 {
          color: #ff7a00;
          font-size: 0.8rem;
          margin-bottom: 0.5rem;
        }

        /* Interview Grid */
        .interview-grid {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 1.5rem;
          height: calc(100vh - 140px);
        }

        .interview-left {
          overflow-y: auto;
        }

        .interview-right {
          background: #0a0a0a;
          border: 1px solid #1f1f1f;
          border-radius: 16px;
          padding: 1rem;
          overflow-y: auto;
        }

        /* Question Container */
        .question-container-custom {
          max-width: 900px;
          margin: 0 auto;
        }

        .question-header-custom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .progress-area {
          flex: 1;
        }

        .question-count {
          color: #ff7a00;
          font-size: 0.85rem;
          display: block;
          margin-bottom: 0.25rem;
        }

        .progress-bar-custom {
          height: 6px;
          background: #2c2c2c;
        }

        .progress-bar-custom .progress-bar {
          background: linear-gradient(90deg, #ff7a00 0%, #ff944d 100%);
        }

        .selected-topics {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .topic-tag-custom {
          background: rgba(255, 122, 0, 0.1);
          color: #ff7a00;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
        }

        /* Question Card */
        .question-card-custom {
          background: #0a0a0a;
          border: 1px solid #1f1f1f;
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 1rem;
        }

        .question-text-custom {
          color: #ffffff;
          font-size: 1.25rem;
          font-weight: 600;
          line-height: 1.5;
          margin-bottom: 1.5rem;
        }

        .answer-section-custom label {
          color: #ff7a00;
          font-weight: 500;
          margin-bottom: 0.5rem;
          display: block;
        }

        .answer-textarea-custom {
          width: 100%;
          background: #000000;
          border: 1px solid #2c2c2c;
          border-radius: 8px;
          padding: 1rem;
          color: #e5e5e5;
          resize: vertical;
        }

        .answer-textarea-custom:focus {
          outline: none;
          border-color: #ff7a00;
        }

        .interim-line-custom {
          margin-top: 0.5rem;
          color: #8a8a8a;
          font-size: 0.85rem;
        }

        .helper-text {
          margin-top: 0.5rem;
          font-size: 0.7rem;
          color: #8a8a8a;
        }

        .audio-controls-custom {
          margin-top: 1rem;
        }

        .record-btn-custom, .stop-record-btn-custom {
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          transition: all 0.2s ease;
        }

        .record-btn-custom {
          background: rgba(255, 122, 0, 0.2);
          border: 1px solid #ff7a00;
          color: #ff7a00;
        }

        .record-btn-custom:hover:not(:disabled) {
          background: #ff7a00;
          color: #000000;
        }

        .stop-record-btn-custom {
          background: rgba(220, 53, 69, 0.2);
          border: 1px solid #dc3545;
          color: #dc3545;
        }

        .stop-record-btn-custom:hover:not(:disabled) {
          background: #dc3545;
          color: #ffffff;
        }

        /* Navigation Controls */
        .nav-controls-custom {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          margin-top: 1rem;
        }

        .nav-btn {
          padding: 0.5rem 1rem;
          border-radius: 8px;
          background: #2c2c2c;
          border: none;
          color: #e5e5e5;
          display: inline-flex;
          align-items: center;
          transition: all 0.2s ease;
        }

        .nav-btn:hover:not(:disabled) {
          background: #3a3a3a;
        }

        .nav-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .review-btn-custom {
          padding: 0.5rem 1rem;
          border-radius: 8px;
          background: linear-gradient(135deg, #ff7a00 0%, #ff944d 100%);
          border: none;
          color: #000000;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
        }

        /* Video Panel */
        .video-panel {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .video-section-custom h4 {
          color: #ff7a00;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
        }

        .video-preview-custom {
          background: #000000;
          border-radius: 8px;
          overflow: hidden;
          aspect-ratio: 16/9;
          position: relative;
        }

        .video-element {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .video-placeholder-custom {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0a0a0a;
          color: #8a8a8a;
        }

        .camera-preview {
          aspect-ratio: 4/3;
        }

        .recording-status-custom {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          background: #000000;
          border-radius: 8px;
          font-size: 0.8rem;
          color: #8a8a8a;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #dc3545;
        }

        .status-dot.active {
          background: #28a745;
          animation: pulse 1.5s infinite;
        }

        .timer-panel-custom {
          background: #000000;
          border: 1px solid #ff7a00;
          border-radius: 8px;
          padding: 0.75rem;
          text-align: center;
        }

        .final-note {
          color: #ff7a00;
          font-size: 0.7rem;
          margin-top: 0.25rem;
        }

        /* Review Section */
        .review-section {
          height: 100%;
          overflow-y: auto;
        }

        .review-container {
          max-width: 900px;
          margin: 0 auto;
        }

        .review-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .review-header h3 {
          color: #ffffff;
          margin-bottom: 0.5rem;
        }

        .review-header p {
          color: #8a8a8a;
        }

        .timer-review-custom {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: #0a0a0a;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          margin-top: 1rem;
        }

        .review-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .review-item {
          background: #0a0a0a;
          border: 1px solid #1f1f1f;
          border-radius: 12px;
          padding: 1rem;
        }

        .review-question {
          font-weight: 600;
          color: #ff7a00;
          margin-bottom: 0.5rem;
          cursor: pointer;
        }

        .review-question:hover {
          text-decoration: underline;
        }

        .review-answer-custom {
          background: #000000;
          padding: 0.75rem;
          border-radius: 8px;
          color: #e5e5e5;
          white-space: pre-wrap;
        }

        .review-answer-custom.empty {
          color: #dc3545;
        }

        .review-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        .back-btn {
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          background: #2c2c2c;
          border: none;
          color: #e5e5e5;
          display: inline-flex;
          align-items: center;
        }

        .final-submit-btn {
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          background: linear-gradient(135deg, #ff7a00 0%, #ff944d 100%);
          border: none;
          color: #000000;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
        }

        .final-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .recording-preview-custom {
          margin-top: 2rem;
        }

        .session-video {
          width: 100%;
          border-radius: 8px;
          margin-top: 0.5rem;
        }

        .spinner-icon {
          animation: spin 1s linear infinite;
          margin-right: 0.5rem;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .interview-grid {
            grid-template-columns: 1fr;
          }
          
          .interview-right {
            order: 2;
          }
        }

        @media (max-width: 768px) {
          .modal-header-custom {
            padding: 1rem;
          }
          
          .header-content-custom {
            flex-direction: column;
            text-align: center;
          }
          
          .modal-body-custom {
            padding: 1rem;
          }
          
          .topic-card {
            padding: 1.5rem;
          }
          
          .nav-controls-custom {
            flex-direction: column;
          }
          
          .nav-btn, .review-btn-custom {
            width: 100%;
            justify-content: center;
          }
          
          .review-actions {
            flex-direction: column;
          }
          
          .back-btn, .final-submit-btn {
            width: 100%;
            justify-content: center;
          }
          
          .preview-section {
            flex-direction: column;
          }
        }
      `}</style>
    </>
  )
}