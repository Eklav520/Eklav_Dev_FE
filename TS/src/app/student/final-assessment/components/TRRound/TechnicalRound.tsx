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

  // Resume & Skills
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [resumeSkills, setResumeSkills] = useState<string[]>([])
  const [uploadingResume, setUploadingResume] = useState(false)
  const [resumeAnalysis, setResumeAnalysis] = useState<{
    skills: string[]
    summary: string
    extractedText: string
  } | null>(null)

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
  const [interviewId, setInterviewId] = useState<string | null>(null)

  // NEW: Loading state for interview panel setup
  const [startingInterview, setStartingInterview] = useState(false)

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
      const tryPlay = () => el.play().catch(() => { })
      el.onloadedmetadata = tryPlay
      tryPlay()
    } catch { }
  }

  /* ======================= Resume Upload & Analysis ======================= */
  const uploadResume = async () => {
    if (!authToken || !resumeFile) {
      setLoadErr('Please select a resume file')
      return
    }

    setUploadingResume(true)
    setLoadErr('')
    setResumeAnalysis(null)
    setResumeSkills([])

    try {
      const form = new FormData()
      form.append('resume', resumeFile)

      const res = await fetch(`${baseURL}/api/tr/resume/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: form,
      })

      const data = await res.json()

      if (!data?.interviewId) {
        throw new Error(data.message || 'Resume analysis failed')
      }
      setInterviewId(data.interviewId)

      // Store the analysis results
      setResumeAnalysis({
        skills: data.skills || [],
        summary: data.summary || '',
        extractedText: data.extractedText || ''
      })

      // Set the skills for question generation
      setResumeSkills(data.skills || [])

    } catch (e: any) {
      setLoadErr(e.message || 'Failed to analyze resume')
    } finally {
      setUploadingResume(false)
    }
  }

  /* ======================= Fetch Questions ======================= */
  const fetchQuestions = async () => {
    if (!authToken || !resumeFile) {
      setUiErr('Please upload and analyze resume first')
      return
    }

    if (resumeSkills.length === 0) {
      setUiErr('No skills extracted from resume. Please upload a different resume.')
      return
    }

    setLoadingQs(true)
    setUiErr('')

    try {
      const res = await fetch(`${baseURL}/api/tr/resume/start`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interviewId,
        }),
      })

      const data = await res.json()

      if (!data?.questions || !Array.isArray(data.questions)) {
        throw new Error(data.message || 'Failed to generate questions')
      }

      setQs(data.questions || [])
      setIdx(0)

      // Initialize answers object
      const init: Record<string, string> = {}
      data.questions.forEach((q: TRQuestion) => (init[q._id] = ''))
      setTextAnswers(init)

      // Start timer only when questions are loaded
      startTimer()
    } catch (e: any) {
      setUiErr(e.message || 'Failed to generate questions from resume')
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
        } catch { }
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
    arm() // start proctoring
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

  /* ======================= Flow control ======================= */
  const handleStartInterview = async () => {
    if (!resumeFile || resumeSkills.length === 0 || !interviewId) {
      setUiErr('Please upload and analyze resume first')
      return
    }

    setStartingInterview(true) // Start loading indicator

    try {
      const synth = window.speechSynthesis
      if (synth) {
        synth.cancel()
        synth.resume()
      }
    } catch { }

    try {
      // 1) Ask for screen share from user gesture
      let preDisplay: MediaStream | null = null
      try {
        preDisplay = await (navigator.mediaDevices as any).getDisplayMedia({
          video: { cursor: 'always', frameRate: { ideal: 30 }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        })
      } catch {
        setSessionErr('Screen sharing is required to start the interview.')
        setStartingInterview(false)
        return
      }

      // 2) Enter fullscreen from same gesture
      await enterFullscreenFromUserGesture()

      // 3) Start session with granted display
      const ok = await startSession(preDisplay!)
      if (!ok || !mediaRecorderRef.current) {
        setStartingInterview(false)
        return
      }

      // 4) Fetch questions based on resume
      await fetchQuestions()
    } catch (error: any) {
      setUiErr(error.message || 'Failed to start interview')
    } finally {
      setStartingInterview(false)
    }
  }

  const handleNext = () => setIdx((i) => Math.min(i + 1, qs.length - 1))
  const handlePrev = () => setIdx((i) => Math.max(i - 1, 0))

  const allAnswered = qs.length > 0 && qs.every((q) => (textAnswers[q._id] || '').trim().length > 0)

  const uploadSessionToS3 = async (blob: Blob): Promise<string> => {
    if (!authToken) throw new Error('Auth required')

    // 1️⃣ Get presigned URL
    const presignRes = await fetch(`${baseURL}/api/tr/presign/session`, {
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

    const presignData = await presignRes.json()
    if (!presignData.uploadUrl || !presignData.fileUrl) {
      throw new Error('Failed to get upload URL')
    }

    // 2️⃣ Upload directly to S3
    await fetch(presignData.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': blob.type || 'video/webm' },
      body: blob,
    })

    return presignData.fileUrl // ✅ final S3 URL
  }

  const handleSubmit = async (opts?: { auto?: boolean; reason?: string }) => {
    const { auto = false, reason } = opts || {}
    if (!authToken || qs.length === 0 || (!allAnswered && !auto)) return

    stopTimer()
    setSubmitting(true)

    try {
      stopDictation()

      let finalBlob: Blob | null = null
      if (started && mediaRecorderRef.current) {
        finalBlob = await stopSessionAsync()
      } else {
        finalBlob = sessionBlob
      }

      // 1️⃣ Upload session video to S3 (if exists)
      let sessionMediaUrl = ''
      if (finalBlob && finalBlob.size > 0) {
        sessionMediaUrl = await uploadSessionToS3(
          new Blob([finalBlob], { type: 'video/webm' })
        )
      }

      // 2️⃣ Prepare answers
      const answers = qs.map((q) => ({
        qid: q._id,
        questionText: q.question,
        textAnswer: (textAnswers[q._id] || '').trim(),
      }))

      // 3️⃣ Submit JSON ONLY (small payload)
      const res = await fetch(`${baseURL}/api/tr/submit`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interviewId,
          resumeSkills,
          resumeSummary: resumeAnalysis?.summary || '',
          answers,
          proctorMeta: {
            autoSubmitted: auto,
            violations: violationCount,
            reason: reason || null,
            timeLeft,
          },
          sessionMediaUrl, // ✅ S3 URL only
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
    console.log('Auto-submitting due to:', why)
    await handleSubmit({ auto: true, reason: why })
  }

  // FIXED: Auto-submit when violations reach limit - using useRef to prevent re-renders
  const autoSubmitTriggeredRef = useRef(false)

  useEffect(() => {
    const LIMIT = 2
    if (violationCount >= LIMIT && !autoSubmitTriggeredRef.current) {
      autoSubmitTriggeredRef.current = true
      console.log('Violation limit reached, triggering auto-submit')
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
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setResumeFile(file)
    // Reset states when new file is selected
    if (file) {
      setResumeAnalysis(null)
      setResumeSkills([])
      setLoadErr('')
      setInterviewId(null)
      autoSubmitTriggeredRef.current = false // Reset auto-submit flag
    }
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
            <div className="contact-info">Upload your resume to generate personalized questions</div>
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

          {/* Resume Upload Section */}
          {!qs.length && !reviewing && !startingInterview && (
            <div className="topic-selection-container">
              <div className="glass-card">
                <h3 className="hero-title">Upload Your Resume</h3>
                <p className="hero-sub">
                  Upload your resume (PDF, DOC, DOCX). We'll analyze it and generate personalized interview questions.
                </p>

                <div className="upload-container mb-4">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="form-control mb-3"
                    onChange={handleFileChange}
                    disabled={uploadingResume}
                  />

                  {resumeFile && (
                    <div className="file-info mb-3">
                      <strong>Selected file:</strong> {resumeFile.name}
                      <span className="ms-2">({(resumeFile.size / 1024).toFixed(1)} KB)</span>
                    </div>
                  )}

                  <button
                    className="analyze-btn mb-3"
                    onClick={uploadResume}
                    disabled={!resumeFile || uploadingResume || proctorLocked}
                  >
                    {uploadingResume ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        Analyzing Resume...
                      </>
                    ) : 'Analyze Resume'}
                  </button>
                </div>

                {/* Resume Analysis Results */}
                {resumeAnalysis && (
                  <div className="analysis-results mb-4">
                    <h4 style={{ color: '#0f172a', fontWeight: 800 }}>Resume Analysis Results</h4>

                    <div className="skills-section mb-3">
                      <h5>Extracted Skills:</h5>
                      <div className="topics-tags">
                        {resumeSkills.map((skill) => (
                          <span key={skill} className="topic-tag">{skill}</span>
                        ))}
                      </div>
                    </div>

                    {resumeAnalysis.summary && (
                      <div className="summary-section mb-3">
                        <h5>Resume Summary:</h5>
                        <div className="summary-text">{resumeAnalysis.summary}</div>
                      </div>
                    )}

                    <Alert variant="success" className="mb-3">
                      ✓ Resume analyzed successfully! {resumeSkills.length} skills detected.
                      {resumeSkills.length > 0 && (
                        <div className="mt-2">
                          <small>We'll generate questions based on: {resumeSkills.slice(0, 5).join(', ')}...</small>
                        </div>
                      )}
                    </Alert>
                  </div>
                )}

                {/* Start Interview Button - Only show when resume is analyzed */}
                {resumeSkills.length > 0 && (
                  <div className="start-section">
                    <button
                      className="start-interview-btn"
                      disabled={loadingQs || proctorLocked || startingInterview}
                      onClick={handleStartInterview}
                    >
                      {startingInterview ? (
                        <>
                          <Spinner size="sm" className="me-2" />
                          Setting Up Interview...
                        </>
                      ) : 'Start Interview'}
                    </button>
                    <p className="mt-2 mb-0 text-muted">
                      15 personalized questions will be generated based on your resume
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Loading State for Interview Setup */}
          {startingInterview && !qs.length && (
            <div className="topic-selection-container">
              <div className="glass-card text-center">
                <h3 className="hero-title">Setting Up Interview</h3>
                <div className="my-4">
                  <Spinner animation="border" variant="primary" size="sm" />
                </div>
                <p className="hero-sub">
                  Please wait while we set up your interview session...
                </p>
                <div className="loading-steps mt-3">
                  <div className="loading-step">
                    <span className="step-icon">✓</span>
                    <span>Resume Analyzed</span>
                  </div>
                  <div className="loading-step">
                    <span className="step-icon">
                      {sessionErr ? '✗' : started ? '✓' : '...'}
                    </span>
                    <span>Media Setup</span>
                  </div>
                  <div className="loading-step">
                    <span className="step-icon">
                      {loadingQs ? '...' : qs.length > 0 ? '✓' : '...'}
                    </span>
                    <span>Generating Questions</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Interview Section */}
          {!!qs.length && !reviewing && !startingInterview && (
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
                      {resumeSkills.length > 0 ? (
                        resumeSkills.map((skill) => (
                          <span key={skill} className="topic-tag">
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="topic-tag" style={{ opacity: 0.6 }}>
                          Resume-based questions
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="question-card glassy" aria-disabled={proctorLocked}>
                    <div className="question-source-badge">
                      <small className="text-muted">Generated from your resume</small>
                    </div>
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

                  {/* Resume Skills Summary */}
                  <div className="resume-skills-summary">
                    <h5>Resume Skills</h5>
                    <div className="skills-tags-small">
                      {resumeSkills.slice(0, 8).map((skill) => (
                        <span key={skill} className="skill-tag-small">{skill}</span>
                      ))}
                      {resumeSkills.length > 8 && (
                        <span className="skill-tag-small">+{resumeSkills.length - 8} more</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Review Section */}
          {!!qs.length && reviewing && !startingInterview && (
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

      {/* Add additional styles */}
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

        .analyze-btn {
          background: linear-gradient(135deg, #6c757d, #495057);
          color: white;
          border: none;
          padding: 0.6rem 1.2rem;
          border-radius: 999px;
          font-weight: 600;
          cursor: pointer;
          width: 100%;
        }

        .analyze-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .file-info {
          background: rgba(0,0,0,0.05);
          padding: 0.5rem;
          border-radius: 8px;
          font-size: 0.9rem;
        }

        .analysis-results {
          background: rgba(255,255,255,0.9);
          border-radius: 12px;
          padding: 1rem;
          border: 1px solid rgba(0,0,0,0.1);
        }

        .skills-section h5, .summary-section h5 {
          font-size: 0.9rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: #495057;
        }

        .summary-text {
          background: #f8f9fa;
          padding: 0.75rem;
          border-radius: 8px;
          font-size: 0.9rem;
          line-height: 1.5;
          border: 1px solid #dee2e6;
        }

        .question-source-badge {
          margin-bottom: 0.5rem;
        }

        .resume-skills-summary {
          margin-top: 1rem;
          padding: 0.75rem;
          background: rgba(102,126,234,0.1);
          border-radius: 8px;
        }

        .resume-skills-summary h5 {
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
          color: #495057;
        }

        .skills-tags-small {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
        }

        .skill-tag-small {
          background: rgba(255,255,255,0.9);
          color: #495057;
          padding: 0.2rem 0.5rem;
          border-radius: 999px;
          font-size: 0.7rem;
          border: 1px solid #dee2e6;
        }

        /* Loading steps styles */
        .loading-steps {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          max-width: 300px;
          margin: 0 auto;
        }

        .loading-step {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem;
          background: rgba(255,255,255,0.8);
          border-radius: 10px;
          border: 1px solid rgba(0,0,0,0.1);
        }

        .step-icon {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #667eea;
          color: white;
          font-weight: bold;
        }

        /* Your existing styles remain... */
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