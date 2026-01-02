import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ProgressBar, Spinner, Alert, Modal } from 'react-bootstrap'

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

  // Check if it's the last question (10th question)
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

  // Recording (screen+cam+mic)
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
      const tryPlay = () => el.play().catch(() => {})
      el.onloadedmetadata = tryPlay
      tryPlay()
    } catch {}
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
        } catch {}
      }, 60)
    } catch {}
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
      } catch {}
    }
    playNext()
  }

  /* ======================= Load topics ======================= */
  useEffect(() => {
    if (!authToken) return
    ;(async () => {
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
      // CHANGED: Fetch only 10 questions instead of more
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
        
        // Start timer when questions are loaded
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
    arm() // arm proctor when recording starts
    return true
  }

  const stopSession = () => {
    try {
      mediaRecorderRef.current?.stop()
    } catch {}
    setStarted(false)
    disarm() // disarm when recording ends
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
    // 1) Ask for screen share from the *same user gesture*
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

    // 2) Enter fullscreen from the *same* gesture before any other awaits
    await enterFullscreenFromUserGesture()

    // 3) (optional) TTS warmup
    try {
      const s = window.speechSynthesis
      if (s) {
        s.cancel()
        await ensureVoices()
        s.resume?.()
      }
    } catch {}

    // 4) Start session with granted display stream
    const ok = await startSession(preDisplay!)
    if (!ok || !mediaRecorderRef.current) return

    // 5) Load questions and speak
    const questions = await fetchQuestions()
    if (questions?.length) {
      suppressSpeakRef.current = true
      void speakSequence(["Welcome to HR Panel. Let's start the HR discussion.", questions[0].question])
    }
  }

  const handleNext = () => setIdx((i) => Math.min(i + 1, qs.length - 1))
  const handlePrev = () => setIdx((i) => Math.max(i - 1, 0))

  const allAnswered = qs.length > 0 && qs.every((q) => (textAnswers[q._id] || '').trim().length > 0)

  // Submit (supports auto-submit when violations cap reached)
  const handleSubmit = async (opts?: { auto?: boolean; reason?: string }) => {
    const { auto = false, reason } = opts || {}
    if (!authToken || qs.length === 0 || (!allAnswered && !auto)) return
    
    // Stop timer when submitting
    stopTimer()
    
    setSubmitting(true)
    try {
      stopDictation()
      let blobToSend: Blob | null = sessionBlob
      if (started && mediaRecorderRef.current) blobToSend = await stopSessionAsync()

      const answers = qs.map((q) => ({ qid: q._id, questionText: q.question, textAnswer: (textAnswers[q._id] || '').trim() }))

      const form = new FormData()
      form.append('topics', JSON.stringify(selected))
      form.append('answers', JSON.stringify(answers))
      form.append(
        'proctorMeta',
        JSON.stringify({
          autoSubmitted: auto,
          violations: violationCount,
          reason: reason || null,
          timeLeft: timeLeft, // Include remaining time in submission
        }),
      )
      if (blobToSend && blobToSend.size > 0) {
        // enforce correct mime type before sending
        const fixedBlob = new Blob([blobToSend], { type: 'video/webm' })
        form.append('media_session', fixedBlob, `session_${Date.now()}.webm`)
      } else {
        console.warn('⚠️ No session blob to upload')
      }

      const res = await fetch(`${baseURL}/api/hr/submit`, { method: 'POST', headers: { Authorization: `Bearer ${authToken}` }, body: form })
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
  }, [violationCount]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-submit when time expires
  useEffect(() => {
    if (timeLeft === 0 && timerActive) {
      handleAutoSubmit('Time expired - auto submitted')
    }
  }, [timeLeft, timerActive]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (current?.question) {
      if (suppressSpeakRef.current) {
        suppressSpeakRef.current = false
        return
      }
      void speak(current.question)
    }
  }, [current?._id])

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

  const committedValue = current ? textAnswers[current._id] || '' : ''
  const currentInterim = dictating && current ? interimRef.current[current._id] || '' : ''

  return (
    <>
      {/* Proctor lock modal */}
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
            <h1>HR Interview</h1>
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
                <h3 className="card-title">Select HR Topics</h3>
                <p className="card-sub">Screen share, camera and mic are required. 10 questions • 30 minutes</p>
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

                {(started || sessionBlob) && (
                  <div style={{ marginTop: '1rem', display: 'grid', gap: 12 }}>
                    <div>
                      <h6>Screen (live)</h6>
                      <div className="video-preview">
                        <video ref={setScreenVideoRef} muted playsInline autoPlay className="screen-video" />
                      </div>
                    </div>
                    <div>
                      <h6>Camera (live)</h6>
                      <div className="video-preview" style={{ aspectRatio: '4/3' }}>
                        <video ref={setCamVideoRef} muted playsInline autoPlay className="student-video" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Interview */}
          {!!qs.length && !reviewing && (
            <div className="split-screen-container">
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

                  <div className="question-card" aria-disabled={proctorLocked}>
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
                      <div className="muted-tip">{dictating ? 'Listening… you can pause; text won’t reset.' : 'Press Start to speak.'}</div>
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

              {/* Preview rail */}
              <div className="right-panel">
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
                <div className="question-card" style={{ padding: '1rem' }}>
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
                          <div className="review-answer">{ans || <span className="review-empty">No answer provided</span>}</div>
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
          color: #333;
        }
        
        .timer-panel {
          margin-top: 0.5rem;
          padding: 0.5rem;
          background: rgba(255,255,255,0.8);
          border-radius: 6px;
          text-align: center;
          color: #333;
        }
        
        .timer-review {
          background: rgba(255,255,255,0.8);
          padding: 0.5rem 1rem;
          border-radius: 8px;
          border: 1px solid #667eea;
          color: #333;
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

        .tr-glass-modal .modal-dialog { margin: 0; max-width: 100%; height: 100%; }
        .tr-glass-content {
          min-height: 100vh;
          background:
            radial-gradient(1200px 600px at 70% 10%, rgba(118,75,162,.16), transparent 60%),
            radial-gradient(1000px 600px at 20% 90%, rgba(102,126,234,.18), transparent 60%),
            linear-gradient(135deg, rgba(20,22,29,.75), rgba(20,22,29,.75));
          backdrop-filter: blur(24px) saturate(180%);
          -webkit-backdrop-filter: blur(24px) saturate(180%);
          border: 1px solid rgba(255,255,255,0.12);
          color: #e9ecef;
        }
        .glass-header { 
          background: rgba(255,255,255,0.06); 
          backdrop-filter: blur(14px); 
          border-bottom: 1px solid rgba(255,255,255,0.15); 
          position: relative; /* Needed for absolute positioning of timer */
        }
        .header-content { width: 100%; text-align: center; }
        .header-content h1 { margin: 0; font-size: 2rem; font-weight: 800; letter-spacing: .2px; background: linear-gradient(135deg,#a5b4fc 0%,#c084fc 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .contact-info { font-size: .95rem; color: var(--text-secondary); margin-top: 0.25rem; }
        .tr-modal-body { padding: 0; height: calc(100vh - 80px); }

        .topic-selection-container { display: flex; justify-content: center; align-items: center; height: 100%; padding: 2rem; }
        .glass-card { background: rgba(255,255,255,0.14); border: 1px solid rgba(255,255,255,0.18); backdrop-filter: blur(22px) saturate(160%); border-radius: 20px; padding: 2.5rem; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,.25); max-width: 820px; width: 100%; }
        .card-title { color: #fff; margin-bottom: .25rem; font-weight: 700; }
        .card-sub { color: rgba(255,255,255,.72); margin: 0 0 1rem; }
        .topics-grid { display: flex; flex-wrap: wrap; gap: .75rem; justify-content: center; margin: 1rem 0 1.25rem; }
        .topic-chip { padding: .7rem 1.2rem; border-radius: 999px; border: 1px solid rgba(255,255,255,.25); background: rgba(255,255,255,.18); color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,.25); cursor: pointer; transition: all .22s ease; font-weight: 600; backdrop-filter: blur(6px); }
        .topic-chip:hover { transform: translateY(-1px); }
        .topic-chip.selected { background: linear-gradient(135deg,#667eea 0%,#764ba2 100%); border-color: transparent; box-shadow: 0 6px 18px rgba(118,75,162,.35); }
        .start-interview-btn { background: linear-gradient(135deg,#667eea 0%,#764ba2 100%); color: white; border: none; padding: .8rem 1.4rem; border-radius: 999px; font-size: 1rem; font-weight: 700; cursor: pointer; transition: transform .2s ease, box-shadow .2s ease; }
        .start-interview-btn:disabled { opacity: .6; cursor: not-allowed; }

        .split-screen-container { display: grid; grid-template-columns: 1fr 360px; gap: 0; height: 100%; }
        .left-panel { padding: 2rem 2.25rem; overflow-y: auto; }
        .right-panel { background: rgba(255,255,255,0.06); backdrop-filter: blur(18px); border-left: 1px solid rgba(255,255,255,0.12); padding: 1.1rem; }

        .question-container { max-width: clamp(760px, 64vw, 1100px); margin: 0 auto; }
        .question-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 1.25rem; }
        .progress-section { flex: 1; }
        .question-count { font-size: 1.05rem; font-weight: 700; color: #fff; display: block; margin-bottom: .5rem; }
        .custom-progress { height: 6px; background: rgba(102,126,234,0.25); border-radius: 3px; overflow: hidden; }
        .custom-progress .progress-bar { background: linear-gradient(90deg,#667eea 0%,#764ba2 100%); }
        .topics-tags { display: flex; flex-wrap: wrap; gap: .5rem; }
        .topic-tag { background: rgba(255,255,255,.22); color: #fff; padding: .28rem .75rem; border-radius: 14px; font-size: .82rem; font-weight: 600; border: 1px solid rgba(255,255,255,.28); text-shadow: 0 1px 1px rgba(0,0,0,.25); }

        .question-card { background: rgba(255,255,255,.10); border: 1px solid rgba(255,255,255,.14); border-radius: 16px; padding: 1.35rem 1.5rem; box-shadow: 0 10px 28px rgba(0,0,0,.25); margin-bottom: 1.25rem; backdrop-filter: blur(18px); }
        .question-text { color: #fff; font-size: 1.35rem; font-weight: 700; line-height: 1.45; margin-bottom: .9rem; }

        .answer-section label { display: block; margin-bottom: .5rem; font-weight: 700; color: rgba(255,255,255,.9); }
        .answer-textarea { width: 100%; min-height: clamp(220px, 34vh, 460px); border: 2px solid rgba(255,255,255,.18); border-radius: 12px; padding: 1rem 1rem 1.25rem; font-size: 1.05rem; line-height: 1.55; resize: vertical; color: #111; background: rgba(255,255,255,.92); transition: border-color .2s ease, box-shadow .2s ease; }
        .answer-textarea:focus { outline: none; border-color: rgba(102,126,234,.9); box-shadow: 0 0 0 3px rgba(102,126,234,.25); }
        .interim-line { margin-top: 6px; font-size: .97rem; color: rgba(255,255,255,.85); opacity: .95; }
        .muted-tip { margin-top: 6px; font-size: 12px; color: rgba(255,255,255,.6); }

        .audio-controls { display: flex; align-items: center; gap: .75rem; margin-top: .85rem; flex-wrap: wrap; }
        .record-btn, .stop-record-btn { display: flex; align-items: center; gap: .5rem; padding: .6rem 1.25rem; border: none; border-radius: 999px; font-weight: 700; cursor: pointer; transition: transform .2s ease, box-shadow .2s ease; }
        .record-btn { background: rgba(102,126,234,.16); color: #cdd5ff; border: 1px solid rgba(102,126,234,.5); }
        .record-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 18px rgba(102,126,234,.35); }
        .stop-record-btn { background: rgba(220,53,69,.14); color: #ffb3bd; border: 1px solid rgba(220,53,69,.55); }

        .navigation-controls { display: flex; justify-content: space-between; align-items: center; }
        .nav-btn, .submit-btn { padding: .6rem 1.25rem; border: none; border-radius: 12px; font-weight: 700; cursor: pointer; transition: transform .2s ease, box-shadow .2s ease; }
        .prev-btn, .next-btn { background: rgba(108,117,125,.16); color: #d1d5db; border: 1px solid rgba(108,117,125,.45); }
        .prev-btn:hover:not(:disabled), .next-btn:hover:not(:disabled) { transform: translateY(-1px); }
        .submit-btn { background: linear-gradient(135deg,#28a745 0%,#20c997 100%); color: white; margin-left: .75rem; }

        .video-container { height: 100%; display: flex; flex-direction: column; gap: 1rem; }
        .video-section h4 { margin-bottom: .5rem; color: #fff; font-size: .95rem; font-weight: 700; }
        .video-preview { background: #000; border-radius: 10px; overflow: hidden; position: relative; aspect-ratio: 16/9; }
        .screen-video, .student-video { width: 100%; height: 100%; object-fit: cover; }
        .video-placeholder { position: absolute; inset: 0; display: grid; place-items: center; background: #1a1a1a; color: #ccc; font-size: .9rem; }
        .sharing-info { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,.14); padding: .8rem; border-radius: 10px; margin-top: auto; color: #e9ecef; }
        .url-display { font-size: .8rem; color: rgba(255,255,255,.75); display: block; margin-bottom: .5rem; }

        @media (max-width: 1024px) {
          .split-screen-container { grid-template-columns: 1fr; }
          .right-panel { width: 100%; }
        }

        .review-answer{ white-space: pre-wrap; background: rgba(255,255,255,.98); color: #111; border: 1px solid rgba(0,0,0,.08); border-radius: 10px; padding: .85rem 1rem; line-height: 1.6; font-size: 1rem; box-shadow: inset 0 0 0 1px rgba(255,255,255,.4); max-height: 260px; overflow: auto; }
        .review-empty{ color: #dc3545; }
      `}</style>
    </>
  )
}