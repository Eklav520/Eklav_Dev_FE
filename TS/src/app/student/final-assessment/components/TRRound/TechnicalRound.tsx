import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ProgressBar, Spinner, Alert, Modal } from 'react-bootstrap'

// Proctoring
import { useProctorGuard } from '../../helper/useProctorGuard'
import ProctorLockModal from '../ProctorLockModal'

// ---- Types ----
type TRQuestion = { _id: string; topic: string; question: string }
type Props = {
  baseURL: string
  authToken: string | undefined
  onClose: () => void
  onSubmitted: () => void
}

export default function TechnicalRound({ baseURL, authToken, onClose, onSubmitted }: Props) {
  const [open, setOpen] = useState(true)

  // ===== TIMER STATE =====
  const [timeLeft, setTimeLeft] = useState(45 * 60) // 45 minutes in seconds
  const [timerActive, setTimerActive] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Topics
  const [allTopics, setAllTopics] = useState<string[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [loadErr, setLoadErr] = useState('')

  // Q&A
  const [loadingQs, setLoadingQs] = useState(false)
  const [qs, setQs] = useState<TRQuestion[]>([])
  const [idx, setIdx] = useState(0)
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({})
  const current = qs[idx]
  const progress = useMemo(() => (qs.length ? Math.round((idx / qs.length) * 100) : 0), [idx, qs.length])

  // Check if it's the last question (15th question)
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

  // Preview refs
  const screenVideoElRef = useRef<HTMLVideoElement | null>(null)
  const camVideoElRef = useRef<HTMLVideoElement | null>(null)

  // Welcome intro flag
  const welcomePlayedRef = useRef(false)

  // ===== Proctor hook =====
  const {
    locked,
    violationCount,
    isFullscreen,
    acknowledge,
    arm,
    disarm,
  } = useProctorGuard({
    maxViolations: 2,
    lockMessage: 'Tab switching is not allowed during the TR interview.',
  } as any)

  const proctorLocked = locked
  const VIOLATION_LIMIT = 2
  const remaining = Math.max(0, VIOLATION_LIMIT - violationCount)
  const lockMsg = 'Tab switching is not allowed during the TR interview.'

  // ===== TIMER FUNCTIONS =====
  const startTimer = () => {
    setTimerActive(true)
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time's up - auto submit
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
      const tryPlay = () => el.play().catch(() => {})
      el.onloadedmetadata = tryPlay
      tryPlay()
    } catch {}
  }

  /* ======================= Load topics ======================= */
  useEffect(() => {
    if (!authToken) return
    ;(async () => {
      try {
        const res = await fetch(`${baseURL}/api/tr/topics`, {
          headers: { Authorization: `Bearer ${authToken}` },
        })
        const data = await res.json()
        if (!data?.success) throw new Error(data?.error || 'Failed to load topics')
        setAllTopics(data.topics || [])
      } catch (e: any) {
        setLoadErr(e?.message || 'Failed to load topics')
      }
    })()
  }, [authToken, baseURL])

  const toggleTopic = (t: string) => setSelected((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))

  /* ======================= Fetch questions ======================= */
  const fetchQuestions = async () => {
    if (!authToken || selected.length === 0) return
    setLoadingQs(true)
    try {
      // CHANGED: Fetch only 15 questions instead of 25
      const params = new URLSearchParams({ topics: selected.join(','), count: '15' })
      const res = await fetch(`${baseURL}/api/tr/questions?${params}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      const data = await res.json()
      if (data?.success) {
        setQs(data.questions || [])
        setIdx(0)
        const init: Record<string, string> = {}
        ;(data.questions || []).forEach((q: TRQuestion) => (init[q._id] = ''))
        setTextAnswers(init)
        interimRef.current = {}
        welcomePlayedRef.current = false
        
        // Start the timer when questions are loaded
        startTimer()
      } else {
        setUiErr(data?.error || 'Failed to load questions')
      }
    } finally {
      setLoadingQs(false)
    }
  }

  /* ======================= TTS ======================= */
  const speak = (text: string): Promise<void> =>
    new Promise((resolve) => {
      try {
        const synth = window.speechSynthesis
        if (!synth) return resolve()
        try {
          if (synth.paused) synth.resume()
        } catch {}
        synth.cancel()
        const u = new SpeechSynthesisUtterance(text)
        u.rate = 1.0
        u.onend = () => resolve()
        u.onerror = () => resolve()
        setTimeout(() => {
          try {
            synth.speak(u)
          } catch {
            resolve()
          }
        }, 80)
      } catch {
        resolve()
      }
    })

  const playWelcomeIntro = async () => {
    if (welcomePlayedRef.current) return
    await speak("Hello. Welcome to TR Panel. Let's start the discussion.")
    welcomePlayedRef.current = true
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
    if (dictating || !current) return
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

      if (finalsToAppend) {
        setTextAnswers((prev) => ({ ...prev, [workingQid]: (prev[workingQid] ? prev[workingQid] + ' ' : '') + finalsToAppend }))
      }

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
    } catch {}
    recRef.current = null
    if (current) {
      interimRef.current[current._id] = ''
      tick((x) => x + 1)
    }
  }

  useEffect(() => {
    if (dictating) stopDictation()
  }, [idx])

  /* ============ Capture (screen + cam + mic) ============ */
  const chooseMime = () =>
    MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
        ? 'video/webm;codecs=vp8,opus'
        : 'video/webm'

  const enterFullscreenFromUserGesture = async (): Promise<boolean> => {
    const el: any = document.documentElement
    try {
      if (el.requestFullscreen) await el.requestFullscreen()
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen()
      else if (el.msRequestFullscreen) await el.msRequestFullscreen()
      else return false
      return true
    } catch {
      return false
    }
  }

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
      } catch {}
      try {
        display.getTracks().forEach((t) => t.stop())
      } catch {}
      try {
        camera!.getTracks().forEach((t) => t.stop())
      } catch {}
      try {
        mic!.getTracks().forEach((t) => t.stop())
      } catch {}

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
    arm() // start proctoring
    return true
  }

  const stopSession = () => {
    try {
      mediaRecorderRef.current?.stop()
    } catch {}
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

  /* ======================= Flow control ======================= */
  const handleStartInterview = async () => {
    try {
      const synth = window.speechSynthesis
      if (synth) {
        synth.cancel()
        synth.resume()
      }
    } catch {}
    // 1) Ask for screen share from user gesture
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
    // 2) Enter fullscreen from same gesture
    await enterFullscreenFromUserGesture()
    // 3) Start session with granted display
    const ok = await startSession(preDisplay!)
    if (!ok || !mediaRecorderRef.current) return
    await fetchQuestions()
  }

  const handleNext = () => setIdx((i) => Math.min(i + 1, qs.length - 1))
  const handlePrev = () => setIdx((i) => Math.max(i - 1, 0))

  const allAnswered = qs.length > 0 && qs.every((q) => (textAnswers[q._id] || '').trim().length > 0)

  const handleSubmit = async (opts?: { auto?: boolean; reason?: string }) => {
    const { auto = false, reason } = opts || {}
    if (!authToken || qs.length === 0 || (!allAnswered && !auto)) return
    
    // Stop timer when submitting
    stopTimer()
    
    setSubmitting(true)
    try {
      stopDictation()

      let blobToSend: Blob | null = null
      if (started && mediaRecorderRef.current) {
        blobToSend = await stopSessionAsync()
      } else {
        blobToSend = sessionBlob
      }

      const answers = qs.map((q) => ({
        qid: q._id,
        questionText: q.question,
        textAnswer: (textAnswers[q._id] || '').trim(),
      }))

      const form = new FormData()
      form.set('topics', JSON.stringify(selected))
      form.set('answers', JSON.stringify(answers))
      form.set(
        'proctorMeta',
        JSON.stringify({
          autoSubmitted: auto,
          violations: violationCount,
          reason: reason || null,
          timeLeft: timeLeft, // Include remaining time in submission
        }),
      )

      if (blobToSend && blobToSend.size > 0) {
        const fixedBlob = new Blob([blobToSend], { type: 'video/webm' })
        form.append('media_session', fixedBlob, `session_${Date.now()}.webm`)
      } else {
        console.warn('⚠️ No session blob to upload')
      }

      const res = await fetch(`${baseURL}/api/tr/submit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
        body: form,
      })
      const data = await res.json()
      if (data?.success) {
        setOpen(false)
        onSubmitted()
      } else {
        setUiErr(data?.error || 'Submit failed')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleAutoSubmit = async (why: string) => {
    await handleSubmit({ auto: true, reason: why })
  }

  // Auto-submit when violations reach limit
  useEffect(() => {
    const LIMIT = 2
    if (violationCount >= LIMIT) {
      handleAutoSubmit('Auto-submitted due to proctoring violations')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [violationCount])

  // Auto-submit when time expires
  useEffect(() => {
    if (timeLeft === 0 && timerActive) {
      handleAutoSubmit('Time expired - auto submitted')
    }
  }, [timeLeft, timerActive]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (current?.question) {
      const speakQuestion = async () => {
        if (idx === 0 && !welcomePlayedRef.current) {
          await playWelcomeIntro()
          await speak(current.question)
        } else {
          await speak(current.question)
        }
      }
      speakQuestion()
    }
  }, [current?._id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer() // Clean up timer
      try {
        recRef.current?.stop()
      } catch {}
      try {
        mediaRecorderRef.current?.stop()
      } catch {}
      try {
        combinedStreamRef.current?.getTracks().forEach((t) => t.stop())
      } catch {}
      try {
        displayStreamRef.current?.getTracks().forEach((t) => t.stop())
      } catch {}
      try {
        cameraStreamRef.current?.getTracks().forEach((t) => t.stop())
      } catch {}
      try {
        micStreamRef.current?.getTracks().forEach((t) => t.stop())
      } catch {}
      try {
        window.speechSynthesis?.cancel()
      } catch {}
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      disarm()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCloseModal = () => {
    stopTimer() // Stop timer when closing
    try {
      recRef.current?.stop()
    } catch {}
    try {
      mediaRecorderRef.current?.stop()
    } catch {}
    try {
      combinedStreamRef.current?.getTracks().forEach((t) => t.stop())
    } catch {}
    try {
      displayStreamRef.current?.getTracks().forEach((t) => t.stop())
    } catch {}
    try {
      cameraStreamRef.current?.getTracks().forEach((t) => t.stop())
    } catch {}
    try {
      micStreamRef.current?.getTracks().forEach((t) => t.stop())
    } catch {}
    setOpen(false)
    disarm()
    onClose()
  }

  const committedValue = (() => (!current ? '' : textAnswers[current._id] || ''))()
  const currentInterim = dictating && current ? interimRef.current[current._id] || '' : ''

  return (
    <>
      {/* Proctor lock screen */}
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
        dialogClassName="tr-glass-modal"
        contentClassName="tr-glass-content">
        <Modal.Header closeButton className="glass-header">
          <div className="header-content">
            <h1>Technical Interview (TR)</h1>
            <div className="contact-info">Contact us at Research.3</div>
            {/* Timer Display */}
            {timerActive && (
              <div className="timer-display">
                Time Remaining: <span className={timeLeft < 300 ? 'text-warning' : ''}>{formatTime(timeLeft)}</span>
              </div>
            )}
          </div>
        </Modal.Header>

        <Modal.Body className="tr-modal-body">
          {loadErr && (
            <Alert variant="danger" className="mt-1">
              {loadErr}
            </Alert>
          )}
          {uiErr && (
            <Alert variant="warning" className="mt-1">
              {uiErr}
            </Alert>
          )}
          {sessionErr && (
            <Alert variant="warning" className="mt-1">
              {sessionErr}
            </Alert>
          )}

          {/* Topic selection */}
          {!qs.length && !reviewing && (
            <div className="topic-selection-container">
              <div className="glass-card">
                <h3 className="hero-title">Select Your Technologies</h3>
                <p className="hero-sub">Screen share, camera and mic are required. 15 questions • 45 minutes</p>
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
                <button className="start-interview-btn" disabled={!selected.length || loadingQs || proctorLocked} onClick={handleStartInterview}>
                  {loadingQs ? <Spinner size="sm" /> : 'Start Interview'}
                </button>
              </div>
            </div>
          )}

          {/* Interview */}
          {!!qs.length && !reviewing && (
            <div className="split-screen-grid">
              <div className="left-panel">
                <div className="question-container">
                  <div className="question-header">
                    <div className="progress-section">
                      <span className="question-count">
                        Question {idx + 1} / {qs.length}
                      </span>
                      <ProgressBar now={progress} className="custom-progress" />
                    </div>
                    <div className="topics-tags">
                      {selected.map((s) => (
                        <span key={s} className="topic-tag">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="question-card glassy" aria-disabled={proctorLocked}>
                    <h3 className="question-text">{current?.question}</h3>

                    <div className="answer-section">
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
                        rows={8}
                        className="answer-textarea"
                        readOnly={proctorLocked}
                      />
                      {currentInterim && (
                        <div className="interim-line">
                          <em>
                            {committedValue ? ' ' : ''}
                            {currentInterim}
                          </em>
                        </div>
                      )}
                      <div className="helper">{dictating ? "Listening… you can pause; text won't reset." : 'Press Start to speak.'}</div>
                    </div>

                    <div className="audio-controls">
                      {!dictating ? (
                        <button className="record-btn" onClick={startDictation} disabled={proctorLocked}>
                          ▶︎ Start
                        </button>
                      ) : (
                        <button className="stop-record-btn" onClick={stopDictation} disabled={proctorLocked}>
                          ⏹ Stop
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="navigation-controls">
                    <button className="nav-btn prev-btn" onClick={handlePrev} disabled={idx === 0 || proctorLocked}>
                      ← Previous
                    </button>
                    <div className="nav-group">
                      {/* Show "Review Answers" on last question instead of "Next" */}
                      {!isLastQuestion ? (
                        <button className="nav-btn next-btn" onClick={handleNext} disabled={idx === qs.length - 1 || proctorLocked}>
                          Next →
                        </button>
                      ) : (
                        <button 
                          className="submit-btn" 
                          onClick={() => setReviewing(true)} 
                          disabled={proctorLocked}
                          title="Review your answers before final submission">
                          Review Answers
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right panel */}
              <div className="right-panel glassy">
                <div className="video-container">
                  <div className="video-section">
                    <h4>Screen (Recording)</h4>
                    <div className="video-preview">
                      <video ref={setScreenVideoRef} muted playsInline autoPlay className="screen-video" />
                      {!started && !sessionBlob && (
                        <div className="video-placeholder">
                          <div>Waiting for capture…</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="video-section">
                    <h4>Student Camera</h4>
                    <div className="video-preview" style={{ aspectRatio: '4/3' }}>
                      <video ref={setCamVideoRef} muted playsInline autoPlay className="student-video" />
                    </div>
                  </div>

                  <div className="sharing-info">
                    <span className="url-display">{started ? 'Screen, camera & mic are recording' : 'Recording stopped'}</span>
                    {/* Timer in right panel */}
                    {timerActive && (
                      <div className="timer-panel">
                        <strong>Time: {formatTime(timeLeft)}</strong>
                        {isLastQuestion && (
                          <div className="final-submit-note">
                            <small>This is the final question. Click "Review Answers" to submit.</small>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Review */}
          {!!qs.length && reviewing && (
            <div className="left-panel">
              <div className="question-container">
                <div className="question-header" style={{ marginBottom: '1rem' }}>
                  <h3>Review your answers</h3>
                  <p className="text-muted">Click any question to edit, then submit.</p>
                  {timerActive && (
                    <div className="timer-review">
                      <strong>Time Remaining: {formatTime(timeLeft)}</strong>
                    </div>
                  )}
                </div>
                <div className="question-card glassy" style={{ padding: '1rem' }}>
                  <ol style={{ paddingLeft: '1.25rem', margin: 0 }}>
                    {qs.map((q, i) => {
                      const ans = (textAnswers[q._id] || '').trim()
                      return (
                        <li key={q._id} style={{ marginBottom: '1rem' }}>
                          <div
                            style={{ fontWeight: 600, marginBottom: 6, cursor: 'pointer' }}
                            onClick={() => {
                              if (proctorLocked) return
                              setReviewing(false)
                              setIdx(i)
                            }}>
                            Q{i + 1}. {q.question}
                          </div>
                          <div
                            style={{ whiteSpace: 'pre-wrap', background: '#fff', border: '1px solid #e9ecef', borderRadius: 8, padding: '0.75rem' }}>
                            {ans || <span style={{ color: '#dc3545' }}>No answer provided</span>}
                          </div>
                        </li>
                      )
                    })}
                  </ol>
                </div>

                <div className="navigation-controls" style={{ marginTop: '1rem' }}>
                  <button className="nav-btn prev-btn" onClick={() => setReviewing(false)} disabled={proctorLocked}>
                    ← Back to questions
                  </button>
                  <div className="nav-group">
                    <button
                      className="submit-btn"
                      onClick={() => handleSubmit()}
                      disabled={(!allAnswered && !proctorLocked) || submitting}
                      title={allAnswered ? 'Submit all answers' : 'Answer all questions to enable submit'}>
                      {submitting ? <Spinner size="sm" /> : 'Final Submit'}
                    </button>
                  </div>
                </div>

                {sessionBlob && (
                  <div style={{ marginTop: '1rem' }}>
                    <h6>Recorded session</h6>
                    <video controls src={URL.createObjectURL(sessionBlob)} style={{ width: '100%', maxWidth: 720, borderRadius: 8 }} />
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Add timer styles */}
      <style>{`
        .timer-display {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255,255,255,0.9);
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-weight: bold;
          border: 2px solid #667eea;
        }
        
        .timer-panel {
          margin-top: 0.5rem;
          padding: 0.5rem;
          background: rgba(255,255,255,0.8);
          border-radius: 6px;
          text-align: center;
        }
        
        .timer-review {
          background: rgba(255,255,255,0.8);
          padding: 0.5rem 1rem;
          border-radius: 8px;
          border: 1px solid #667eea;
        }
        
        .final-submit-note {
          margin-top: 0.25rem;
          color: #28a745;
          font-weight: 600;
        }

        .text-warning {
          color: #dc3545 !important;
          font-weight: bold;
        }

        /* Your existing styles remain the same... */
        :root{
          --bg1: rgba(102,126,234,0.12);
          --bg2: rgba(118,75,162,0.12);
          --glass-bg: rgba(255,255,255,0.18);
          --glass-stroke: rgba(255,255,255,0.35);
          --shadow: 0 10px 30px rgba(0,0,0,0.15);
          --text-primary: #0f172a;
          --text-secondary: #475569;
          --brand1: #667eea;
          --brand2: #764ba2;
        }
        .tr-glass-modal .modal-dialog { margin: 0; max-width: 100%; height: 100%; }
        .tr-glass-content {
          min-height: 100vh;
          background:
            radial-gradient(600px 200px at 50% 90%, rgba(118,75,162,0.18), transparent 60%),
            radial-gradient(500px 200px at 20% 10%, rgba(102,126,234,0.18), transparent 60%),
            linear-gradient(135deg, var(--bg1) 0%, var(--bg2) 100%);
          backdrop-filter: blur(18px) saturate(170%);
          -webkit-backdrop-filter: blur(18px) saturate(170%);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: var(--text-primary);
        }
        .glass-header { 
          background: rgba(255,255,255,0.25); 
          backdrop-filter: blur(12px); 
          -webkit-backdrop-filter: blur(12px); 
          border-bottom: 1px solid rgba(255,255,255,0.35); 
          position: relative; /* Needed for absolute positioning of timer */
        }
        :root{
          --bg1: rgba(102,126,234,0.12);
          --bg2: rgba(118,75,162,0.12);
          --glass-bg: rgba(255,255,255,0.18);
          --glass-stroke: rgba(255,255,255,0.35);
          --shadow: 0 10px 30px rgba(0,0,0,0.15);
          --text-primary: #0f172a;
          --text-secondary: #475569;
          --brand1: #667eea;
          --brand2: #764ba2;
        }
        .tr-glass-modal .modal-dialog { margin: 0; max-width: 100%; height: 100%; }
        .tr-glass-content {
          min-height: 100vh;
          background:
            radial-gradient(600px 200px at 50% 90%, rgba(118,75,162,0.18), transparent 60%),
            radial-gradient(500px 200px at 20% 10%, rgba(102,126,234,0.18), transparent 60%),
            linear-gradient(135deg, var(--bg1) 0%, var(--bg2) 100%);
          backdrop-filter: blur(18px) saturate(170%);
          -webkit-backdrop-filter: blur(18px) saturate(170%);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: var(--text-primary);
        }
        .glass-header { background: rgba(255,255,255,0.25); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-bottom: 1px solid rgba(255,255,255,0.35); }
        .header-content { width: 100%; text-align: center; }
        .header-content h1 { margin: 0; font-size: clamp(1.6rem, 1rem + 1.2vw, 2.2rem); font-weight: 800; background: linear-gradient(135deg, var(--brand1) 0%, var(--brand2) 100%); -webkit-background-clip: text; }
        .contact-info { font-size: .95rem; color: #fff; margin-top: 0.25rem; }
        .tr-modal-body { padding: 0; height: calc(100vh - 80px); }
        .topic-selection-container { display: grid; place-items: center; height: 100%; padding: 2rem; }
        .glass-card { background: rgba(255,255,255,0.7); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.55); border-radius: 24px; padding: 2.25rem; text-align: center; box-shadow: var(--shadow); max-width: 860px; width: 100%; }
        .hero-title { font-size: clamp(1.4rem, 1rem + 0.8vw, 2rem); font-weight: 800; }
        .hero-sub { color: var(--text-secondary); margin: 0 0 1rem; font-size: 1rem; }
        .topics-grid { display: flex; flex-wrap: wrap; gap: 0.75rem; justify-content: center; margin: 1rem 0 1.25rem; }
        .topic-chip { padding: 0.65rem 1.2rem; border: 2px solid #e9ecef; border-radius: 999px; background: #fff; color: var(--text-primary); cursor: pointer; transition: all .2s ease; font-weight: 600; }
        .topic-chip.selected { background: linear-gradient(135deg, var(--brand1), var(--brand2)); color: white; border-color: transparent; transform: translateY(-1px); box-shadow: 0 6px 18px rgba(102, 126, 234, 0.35); }
        .start-interview-btn { background: linear-gradient(135deg, var(--brand1), var(--brand2)); color: white; border: none; padding: 0.8rem 1.3rem; border-radius: 999px; font-size: 1rem; font-weight: 700; cursor: pointer; box-shadow: 0 10px 20px rgba(118, 75, 162, 0.25); }
        .start-interview-btn:disabled { opacity: .6; cursor: not-allowed; }
        .split-screen-grid { display: grid; grid-template-columns: minmax(0, 1fr) clamp(300px, 25vw, 360px); gap: 1.25rem; height: 100%; padding: 1.25rem; }
        .left-panel { padding: 0.5rem 0.75rem 1rem 0.75rem; overflow-y: auto; }
        .right-panel { padding: 1rem; border-radius: 16px; background: var(--glass-bg); backdrop-filter: blur(16px) saturate(160%); -webkit-backdrop-filter: blur(16px) saturate(160%); border: 1px solid var(--glass-stroke); box-shadow: var(--shadow); overflow-y: auto; }
        .glassy { background: rgba(255,255,255,0.9); border: 1px solid rgba(255,255,255,0.65); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); box-shadow: var(--shadow); }
        .question-container { max-width: 1100px; margin: 0 auto; }
        .question-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; gap: 1rem; }
        .progress-section { flex: 1; }
        .question-count { font-size: 1rem; font-weight: 700; color: #fff; display: block; margin-bottom: 0.35rem; }
        .custom-progress { height: 6px; background: rgba(102,126,234,0.18); border-radius: 999px; overflow: hidden; }
        .custom-progress .progress-bar { background: linear-gradient(90deg, var(--brand1) 0%, var(--brand2) 100%); }
        .topics-tags { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .topic-tag { background: rgba(102,126,234,0.12); color: var(--brand1); padding: 0.25rem 0.6rem; border-radius: 999px; font-size: .8rem; font-weight: 600; border: 1px solid rgba(102,126,234,0.25); }
        .question-card { border-radius: 16px; padding: 1.25rem 1.25rem 1rem; margin-bottom: 1rem; }
        .question-text { color: var(--text-primary); font-size: clamp(1.1rem, 0.9rem + 0.8vw, 1.6rem); font-weight: 800; line-height: 1.45; margin-bottom: 0.9rem; }
        .answer-section label { display: block; margin-bottom: 0.5rem; font-weight: 700; color: var(--text-primary); }
        .answer-textarea { width: 100%; border: 2px solid #e9ecef; border-radius: 12px; padding: 1rem 1rem; background: #ffffff; color: #0f172a; line-height: 1.6; min-height: 220px; resize: vertical; }
        .interim-line { margin-top: 6px; font-size: 0.95rem; color: var(--text-secondary); opacity: 0.9; }
        .helper { margin-top: 6px; font-size: 12px; color: var(--text-secondary); }
        .audio-controls { display: flex; align-items: center; gap: 0.75rem; margin-top: 0.75rem; flex-wrap: wrap; }
        .record-btn, .stop-record-btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1.1rem; border: none; border-radius: 999px; font-weight: 700; cursor: pointer; }
        .record-btn { background: rgba(102,126,234,0.12); color: var(--brand1); border: 2px solid var(--brand1); }
        .stop-record-btn { background: rgba(220,53,69,0.10); color: #dc3545; border: 2px solid #dc3545; }
        .navigation-controls { display: flex; justify-content: space-between; align-items: center; margin-top: .5rem; }
        .nav-btn, .submit-btn { padding: 0.6rem 1.1rem; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; }
        .prev-btn, .next-btn { background: rgba(108,117,125,0.12); color: #495057; border: 2px solid #adb5bd; }
        .submit-btn { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; margin-left: 0.75rem; }
        .video-container { height: 100%; display: flex; flex-direction: column; gap: 1rem; }
        .video-section h4 { margin-bottom: 0.5rem; color: var(--text-primary); font-size: .98rem; font-weight: 800; }
        .video-preview { background: #000; border-radius: 12px; overflow: hidden; position: relative; aspect-ratio: 16/9; }
        .screen-video, .student-video { width: 100%; height: 100%; object-fit: cover; }
        .video-placeholder { position: absolute; inset: 0; display: grid; place-items: center; background: #0f172a; color: #cbd5e1; font-size: .9rem; }
        .sharing-info { background: rgba(255,255,255,0.7); padding: 0.8rem; border-radius: 10px; margin-top: auto; border: 1px solid rgba(255,255,255,0.6); }
        .url-display { font-size: 0.85rem; color: var(--text-secondary); display: block; margin-bottom: 0.5rem; }
        @media (max-width: 1024px) { .split-screen-grid { grid-template-columns: 1fr; } .right-panel { order: 2; margin-top: 0.5rem; } }
      `}</style>
    </>
  )
}