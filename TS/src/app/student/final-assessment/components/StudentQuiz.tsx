// StudentQuiz.tsx — refactored to use shared proctoring hook + modal
import React, { useEffect, useRef, useState } from 'react'
import { Modal, Button, Spinner, ProgressBar, Alert, Card } from 'react-bootstrap'
import { useAuthContext } from '@/context/useAuthContext'
import { useProctorGuard } from '../helper/useProctorGuard'
import ProctorLockModal from '../components/ProctorLockModal'
import { FaClock, FaCheckCircle, FaExclamationTriangle, FaVideo, FaDesktop, FaShieldAlt, FaArrowLeft, FaArrowRight } from 'react-icons/fa'

const baseURL = import.meta.env.VITE_API_BASE_URL || ''

// ==== Types ====
type Option = { id?: string; key: string; text: string }
type QuizQuestion = { id?: string; _id?: string; question: string; options: Option[] }

type Props = {
  examId: string
  questionCount?: number
  stream?: MediaStream
  onClose?: () => void
}

type SubmissionStatus = 'not_submitted' | 'submitting' | 'submitted_pending' | 'evaluated'

type ServerSubmission = null | {
  _id: string
  status: 'pending' | 'passed' | 'failed' | 'evaluated' | string
  score?: number | null
  remarks?: string | null 
  submittedAt?: string
  evaluatedAt?: string | null
}

const alpha = (i: number) => String.fromCharCode(65 + i)

// ==== Proctoring config ====
const MAX_VIOLATIONS = 2
const PROCTOR_LOCK_MESSAGE = 'Tab switching is not allowed during the quiz.'

function normalizeOptions(rawOptions: any[]): Option[] {
  if (!Array.isArray(rawOptions)) return []
  const asObjects = rawOptions.map((o) => {
    if (o == null) return { id: undefined, key: '', text: '' }
    if (typeof o === 'string') return { id: undefined, key: '', text: o }
    const id = o._id || o.id || undefined
    const text = String(o.text ?? o.label ?? o.option ?? '')
    const keyRaw = o.key ? String(o.key).toUpperCase() : ''
    return { id, key: keyRaw, text }
  })
  let nextIndex = 0
  return asObjects.map((o) => {
    if (o.key && o.key.trim() !== '') return o
    const k = String.fromCharCode(65 + nextIndex)
    nextIndex++
    return { ...o, key: k }
  })
}

const StudentQuiz: React.FC<Props> = ({ examId, questionCount = 20, onClose, stream }) => {
  const { user } = useAuthContext()
  const token = user?.token

  const [show, setShow] = useState(false)
  const [statusChecked, setStatusChecked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'stopping' | 'uploaded'>('idle')
  const [mediaError, setMediaError] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [durationSeconds, setDurationSeconds] = useState<number | null>(null)
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>('not_submitted')
  const [submissionResponse, setSubmissionResponse] = useState<any | null>(null)
  const [altTabViolation, setAltTabViolation] = useState(false)
  const [altTabViolationCount, setAltTabViolationCount] = useState(0)

  const [latestSubmission, setLatestSubmission] = useState<ServerSubmission>(null)
  const statusPollRef = useRef<number | null>(null)
  const [examStatus, setExamStatus] = useState("upcoming");

  // media refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const combinedStreamRef = useRef<MediaStream | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const timerIntervalRef = useRef<number | null>(null)
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null)
  const displayStreamRef = useRef<MediaStream | null>(null)

  // Keep answers fresh for autosubmit
  const answersRef = useRef<Record<number, string>>({})

  // 🔐 submit lock + idempotency key
  const submitLockRef = useRef(false)
  const submissionNonceRef = useRef<string>((globalThis as any).crypto?.randomUUID?.() || Math.random().toString(36).slice(2))

  // Pre-captured display stream (to keep fullscreen stable)
  const preDisplayStreamRef = useRef<MediaStream | null>(null)
  const submissionIdRef = useRef(
    crypto.randomUUID?.() || Math.random().toString(36).slice(2)
  )

  // Custom violation handler - now accepts number or string
  const handleViolation = (violationType: number | string) => {
    const typeStr = typeof violationType === 'number' ? `violation_${violationType}` : violationType
    console.log(`Violation detected: ${typeStr}`)
    
    if (typeStr === 'visibility_change' || typeStr === 'focus_loss' || typeStr === 'violation_1' || typeStr === 'violation_2') {
      setAltTabViolation(true)
      setAltTabViolationCount(prev => {
        const newCount = prev + 1
        
        // Show alert popup for Alt+Tab
        alert(`⚠️ PROCTORING VIOLATION: Alt+Tab or window switching is not allowed!\n\nViolation ${newCount} of ${MAX_VIOLATIONS}. Further violations may result in auto-submission.`)
        
        // Check if max violations reached
        if (newCount >= MAX_VIOLATIONS && !submitLockRef.current && submissionStatus === 'not_submitted') {
          setTimeout(() => {
            submitQuiz(true, `Auto-submitted due to proctoring violations (${newCount}): ${typeStr}`)
          }, 500)
        }
        
        return newCount
      })
      
      // Auto-hide the violation message after 3 seconds
      setTimeout(() => {
        setAltTabViolation(false)
      }, 3000)
    }
  }

  // ===== Shared Proctor Guard =====
  const guard = useProctorGuard(
    {
      maxViolations: MAX_VIOLATIONS,
      lockMessage: PROCTOR_LOCK_MESSAGE,
      enabled: show && submissionStatus === 'not_submitted',
      captureFullscreenExit: true,
    },
    {
      onViolation: (count: number, reason: string) => {
        console.log(`Violation detected: Count ${count}, Reason: ${reason}`);
        handleViolation(reason);
      },
      onMaxReached: async (count: number, reason?: string) => {
        console.log(`Max violations reached: ${count}, Reason: ${reason}`);
        if (!submitLockRef.current && submissionStatus === 'not_submitted') {
          await submitQuiz(true, `Auto-submitted due to proctoring violations (${count}): ${reason || 'Max violations reached'}`)
        }
      },
    }
  )

  // ===== Disable ESC key to prevent exiting fullscreen =====
  useEffect(() => {
    const disableEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        if (show && submissionStatus === 'not_submitted') {
          e.preventDefault()
          e.stopPropagation()
          
          // Show violation alert
          alert('⚠️ PROCTORING VIOLATION: ESC key is disabled during the quiz!\n\nExiting fullscreen is not allowed.')
          
          // Trigger violation
          handleViolation('fullscreen_exit')
          
          // Re-enter fullscreen immediately
          if (!document.fullscreenElement) {
            guard.enterFullscreen()
          }
          
          return false
        }
      }
    }
    
    // ===== Detect Alt+Tab and window switching =====
    const handleVisibilityChange = () => {
      if (show && submissionStatus === 'not_submitted' && document.hidden) {
        console.log('Tab/window switching detected')
        
        // Show violation popup
        setAltTabViolation(true)
        setAltTabViolationCount(prev => {
          const newCount = prev + 1
          
          // Check if max violations reached
          if (newCount >= MAX_VIOLATIONS && !submitLockRef.current && submissionStatus === 'not_submitted') {
            setTimeout(() => {
              submitQuiz(true, 'Auto-submitted due to Alt+Tab violations')
            }, 500)
          }
          
          return newCount
        })
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
          setAltTabViolation(false)
        }, 3000)
      }
    }
    
    const handleWindowBlur = () => {
      if (show && submissionStatus === 'not_submitted') {
        console.log('Window focus lost - possible Alt+Tab')
        
        // Show violation popup
        setAltTabViolation(true)
        setAltTabViolationCount(prev => {
          const newCount = prev + 1
          
          // Check if max violations reached
          if (newCount >= MAX_VIOLATIONS && !submitLockRef.current && submissionStatus === 'not_submitted') {
            setTimeout(() => {
              submitQuiz(true, 'Auto-submitted due to Alt+Tab violations')
            }, 500)
          }
          
          return newCount
        })
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
          setAltTabViolation(false)
        }, 3000)
        
        // Focus back to window
        window.focus()
      }
    }
    
    document.addEventListener('keydown', disableEsc)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleWindowBlur)
    
    return () => {
      document.removeEventListener('keydown', disableEsc)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleWindowBlur)
    }
  }, [show, submissionStatus, guard, altTabViolationCount])

  // ===== Auto-start camera =====
  const autoStartCamera = async () => {
    try {
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' },
        audio: false,
      })
      
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = cameraStream
        cameraVideoRef.current.muted = true
        cameraVideoRef.current.playsInline = true
        cameraVideoRef.current.autoplay = true
        await cameraVideoRef.current.play().catch(() => {})
      }
      
      return cameraStream
    } catch (camErr) {
      console.warn('Camera access denied or failed', camErr)
      setMediaError((prev) =>
        prev ? prev + ' | Camera not available' : 'Camera not available'
      )
      return null
    }
  }

  useEffect(() => {
    if (stream) {
      open(stream);
    }
  }, [stream]);

  useEffect(() => {
    return () => cleanupRecording()
  }, [])


  const uploadQuizRecordingToS3 = async (blob: Blob, submissionId: string) => {
    const presignRes = await fetch(`${baseURL}/api/student/presign/quiz-recording`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        submissionId,
        fileName: `recording_${submissionId}.webm`,
        fileType: blob.type || 'video/webm',
      }),
    })

    if (!presignRes.ok) throw new Error('Presign failed')

    const { uploadUrl, key } = await presignRes.json()

    const putRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': blob.type || 'video/webm' },
      body: blob,
    })

    if (!putRes.ok) {
      throw new Error(`S3 upload failed: ${putRes.status}`)
    }

    return key
  }

  const open = (stream?: MediaStream) => {
    setShow(true)
    setError(null)
    setSubmissionStatus('not_submitted')
    setSubmissionResponse(null)
    setAnswers({})
    answersRef.current = {}
    submitLockRef.current = false
    guard.reset()
    setAltTabViolation(false)
    setAltTabViolationCount(0)

    initQuiz(stream)
  }

  const initQuiz = async (capturedStream?: MediaStream) => {
    setLoading(true)
    setError(null)
    try {
      if (!token) throw new Error('You must be logged in to start the quiz.')

      if (!examId) {
        throw new Error("Exam not loaded yet");
      }

      // Auto-start camera first
      const cameraStream = await autoStartCamera()
      
      const res = await fetch(`${baseURL}/api/assessment/round/${examId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.status === 401) throw new Error('Authentication required. Please log in again.')
      if (!res.ok) {
        const b = await res.json().catch(() => null)
        throw new Error(b?.message || `Failed to fetch quiz questions (${res.status})`)
      }
      const json = await res.json()
      const questionsData = json?.data || json?.questions || [];

      if (!Array.isArray(questionsData)) {
        throw new Error("Invalid response")
      }
      const pool: QuizQuestion[] = questionsData.map((q: any) => ({
        id: q._id,
        _id: q._id,
        question: q.text || q.question,
        options: normalizeOptions(q.options),
      }))

      if (pool.length === 0) {
        setQuestions([])
        setError('No questions returned from server for this template.')
        return
      }

      const chosen = shuffle(pool).slice(0, Math.min(questionCount, pool.length))
      setQuestions(chosen)
      setCurrent(0)
      setAnswers({})
      answersRef.current = {}

      const dur = json.timeLimit || json.timeSeconds || 1200;
      setDurationSeconds(dur)
      setTimeLeft(dur)

      // Start recording with the captured display stream and camera
      await startRecording(dur, capturedStream || undefined, cameraStream)
    } catch (err: any) {
      console.error('initQuiz error', err)
      setError(String(err?.message || err || 'Could not start quiz'))
    } finally {
      setLoading(false)
    }
  }

  function shuffle<T>(arr: T[]) {
    const a = arr.slice()
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  const attachStreamToVideo = (videoEl: HTMLVideoElement | null, stream: MediaStream | null) => {
    if (!videoEl) return
    try {
      ; (videoEl as any).srcObject = stream
      videoEl.muted = true
      videoEl.playsInline = true
      videoEl.autoplay = true
      videoEl.play().catch(() => { })
    } catch (e) {
      console.warn('attachStreamToVideo failed', e)
    }
  }

  const startRecording = async (initialDuration: number, preCapturedDisplay?: MediaStream, preCapturedCamera?: MediaStream | null) => {
    setMediaError(null)

    try {
      let cameraStream: MediaStream | null = preCapturedCamera || null

      // 🎥 Camera - if not already started, start now
      if (!cameraStream) {
        try {
          cameraStream = await navigator.mediaDevices.getUserMedia({
            video: { width: 320, height: 240, facingMode: 'user' },
            audio: false,
          })
          attachStreamToVideo(cameraVideoRef.current, cameraStream)
        } catch (camErr) {
          console.warn('Camera access denied or failed', camErr)
          setMediaError((prev) =>
            prev ? prev + ' | Camera not available' : 'Camera not available'
          )
          cameraStream = null
        }
      }

      // 🖥 Screen (must already exist)
      let displayStream: MediaStream | null = preCapturedDisplay ?? null

      if (!displayStream) {
        throw new Error("Screen stream not available. Please restart quiz.")
      }

      // 🎬 Combine streams
      const combined = new MediaStream()
      displayStream.getVideoTracks().forEach((t) => combined.addTrack(t))
      if (cameraStream) {
        cameraStream.getVideoTracks().forEach((t) => combined.addTrack(t))
      }

      combinedStreamRef.current = combined

      // 🎥 Recorder config
      const options: any = {}
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
        options.mimeType = 'video/webm;codecs=vp9'
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
        options.mimeType = 'video/webm;codecs=vp8'
      } else {
        options.mimeType = 'video/webm'
      }

      const mr = new MediaRecorder(combined, options)
      mediaRecorderRef.current = mr
      recordedChunksRef.current = []

      mr.ondataavailable = (ev: BlobEvent) => {
        if (ev.data && ev.data.size > 0) {
          recordedChunksRef.current.push(ev.data)
        }
      }

      // 🚀 START RECORDING
      mr.start(1000)
      setRecordingState('recording')
      startTimeRef.current = Date.now()

      // ✅ IMPORTANT: ARM PROCTOR IMMEDIATELY
      guard.arm()

      // 🔒 Ensure fullscreen is active and prevent ESC exit
      if (!document.fullscreenElement) {
        await guard.enterFullscreen()
      }

      // ⏱ Timer
      const quizStart = Date.now()
      const initial = initialDuration

      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current)
      }

      timerIntervalRef.current = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - quizStart) / 1000)
        const remaining = Math.max(0, initial - elapsed)

        setTimeLeft(remaining)

        if (remaining === 0) {
          if (timerIntervalRef.current) {
            window.clearInterval(timerIntervalRef.current)
            timerIntervalRef.current = null
          }
          handleAutoSubmit()
        }
      }, 250) as unknown as number

    } catch (err: any) {
      console.error('Recording failed', err)

      const msg = String(
        err?.message || err || 'Screen recording permission denied or not available.'
      )

      setMediaError(msg)
      setRecordingState('idle')

      throw err
    }
  }

  const cleanupRecording = () => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop()
        } catch { }
      }
      if (combinedStreamRef.current) {
        combinedStreamRef.current.getTracks().forEach((t) => {
          try { t.stop() } catch { }
        })
        combinedStreamRef.current = null
      }
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
    } catch (e) {
      console.warn('cleanupRecording failed', e)
    }
  }

  const handleAutoSubmit = async () => {
    if (submitLockRef.current) return
    if (submissionStatus === 'not_submitted') {
      await submitQuiz(true)
    }
  }

  const handleSelectOption = (index: number, key: string) => {
    if (guard.locked || submissionStatus !== 'not_submitted') return
    setAnswers((prev) => {
      const next = { ...prev, [index]: key }
      answersRef.current = next
      return next
    })
  }

  const goto = (i: number) => {
    if (guard.locked || submissionStatus !== 'not_submitted') return
    if (i < 0 || i >= questions.length) return
    setCurrent(i)
  }

  const handleSubmitClicked = async () => {
    if (guard.locked) return
    if (submitLockRef.current) return
    const ok = confirm('Submit quiz now? Recording and answers will be uploaded.')
    if (!ok) return
    await submitQuiz(false)
  }

  const getRecordingBlob = () => {
    const chunks = recordedChunksRef.current || []
    if (!chunks.length) return null
    return new Blob(chunks, { type: 'video/webm' })
  }

  async function submitQuiz(auto = false, reason?: string) {
    if (submitLockRef.current) return
    submitLockRef.current = true

    setSubmissionStatus('submitting')
    setRecordingState('stopping')

    guard.disarm()

    try {
      if (!token) throw new Error('Authentication required. Please log in and try again.')

      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }

      const mr = mediaRecorderRef.current
      if (mr && mr.state !== 'inactive') {
        await new Promise<void>((resolve) => {
          mr.onstop = () => resolve()
          try { mr.stop() } catch { resolve() }
        })
      }

      const currentAnswers = answersRef.current || {}

      const payloadAnswers = questions.map((q, idx) => {
        const key = currentAnswers[idx] ?? null
        const opts = q.options || []
        const picked = key ? opts.find((o) => o.key === key) : null
        const selectedIndex = picked ? opts.indexOf(picked) : null
        return {
          question: q._id || q.id || String(idx),
          questionId: q._id || q.id || String(idx),
          questionText: q.question,
          selectedOption: picked?.id ?? null,
          selectedKey: key,
          selectedText: picked?.text ?? null,
          selectedIndex,
        }
      })

      const timeTaken = startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : 0
      const uploadRes = await fetch(`${baseURL}/api/assessment/complete-round`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          examId,
          roundType: "mcq",
          clientSubmissionId: submissionIdRef.current,
          answers: payloadAnswers,
          timeTakenSeconds: timeTaken,
        })
      })

      if (uploadRes.status === 401) {
        const errorJson = await uploadRes.json().catch(() => ({}))
        throw new Error(errorJson?.message || 'Authentication required. Please log in again.')
      }
      if (!uploadRes.ok) {
        const txt = await uploadRes.text()
        let msg = `Upload failed (${uploadRes.status})`
        try { msg = JSON.parse(txt).message || msg } catch { msg = txt || msg }
        throw new Error(msg)
      }

      const jres = await uploadRes.json()
      setSubmissionResponse(jres)
      setSubmissionStatus('submitted_pending')

      try {
        const blob = getRecordingBlob()
        if (blob) {
          const mongoSubmissionId = jres.submissionId;

          const recordingUrl = await uploadQuizRecordingToS3(blob, mongoSubmissionId);
          await fetch(`${baseURL}/api/student/quiz-recording-linked`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              submissionId: mongoSubmissionId,
              s3Key: recordingUrl,
              roundType: "mcq",
            }),
          });
        }
      } catch (e) {
        console.warn('Recording upload error', e)
      }

      setLatestSubmission({
        _id: jres.submissionId,
        status: 'pending',
        score: null,
        remarks: null,
        submittedAt: new Date().toISOString(),
        evaluatedAt: null,
      })
    } catch (err: any) {
      console.error('submit error', err)
      setError(err.message || 'Submission failed')
      setSubmissionStatus('not_submitted')
      setRecordingState('idle')
      submitLockRef.current = false
    } finally {
      cleanupRecording()
    }
  }

  const formatTime = (secs: number | null) => {
    if (secs === null) return '--:--'
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const handleEnterFullscreen = async () => {
    try {
      const elem = document.documentElement
      if (elem.requestFullscreen) {
        await elem.requestFullscreen()
      } else if ((elem as any).webkitRequestFullscreen) {
        await (elem as any).webkitRequestFullscreen()
      }
    } catch (err) {
      console.warn('Fullscreen request failed', err)
    }
  }

  const handleCloseModal = () => {
    if (submissionStatus === 'submitted_pending' || submissionStatus === 'evaluated') {
      if (displayStreamRef.current) {
        displayStreamRef.current.getTracks().forEach(track => track.stop());
        displayStreamRef.current = null;
      }
      setShow(false)
      if (onClose) onClose()
    }
  }

  return (
    <>

      <ProctorLockModal
        show={guard.locked && show && submissionStatus === 'not_submitted'}
        message={guard.message}
        isFullscreen={guard.isFullscreen}
        remaining={Math.max(0, guard.maxViolations - guard.violationCount)}
        disabledAcknowledge={guard.violationCount >= guard.maxViolations}
        onReenterFullscreen={handleEnterFullscreen}
        onAcknowledge={guard.acknowledge}
      />

      {/* Alt+Tab Violation Popup */}
      <Modal show={altTabViolation} centered backdrop="static" keyboard={false} className="violation-modal">
        <Modal.Header className="violation-modal-header">
          <Modal.Title>
            <FaExclamationTriangle className="me-2" /> Proctoring Violation Detected
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="violation-modal-body">
          <div className="violation-content">
            <FaExclamationTriangle className="violation-icon" />
            <h5>Alt+Tab / Window Switching is NOT Allowed!</h5>
            <p>This action has been recorded as a violation.</p>
            <p className="violation-count">Violation {altTabViolationCount} / {MAX_VIOLATIONS}</p>
            {altTabViolationCount >= MAX_VIOLATIONS && (
              <p className="violation-warning-text">⚠️ Maximum violations reached. Quiz will auto-submit on next violation.</p>
            )}
            <Button 
              variant="danger" 
              onClick={() => setAltTabViolation(false)}
              className="mt-3"
            >
              I Understand
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      <Modal show={show} onHide={handleCloseModal} fullscreen backdrop="static" keyboard={false} className="quiz-modal">
        <Modal.Header className="quiz-modal-header">
          <div className="header-content">
            <div>
              <h4 className="quiz-title">Quiz Assessment</h4>
              <div className="fullscreen-status">
                {guard.isFullscreen ? (
                  <><FaDesktop className="me-1" /> Fullscreen Mode Active (ESC Disabled)</>
                ) : (
                  <><FaExclamationTriangle className="me-1" /> Fullscreen inactive — press button to re-enter</>
                )}
              </div>
            </div>
            <div className="timer-box">
              <div className="timer-value" style={{ color: timeLeft && timeLeft < 300 ? '#ff6b6b' : '#ff7a00' }}>
                {formatTime(timeLeft)}
              </div>
              <div className="timer-label">Time remaining</div>
            </div>
          </div>
        </Modal.Header>

        <Modal.Body className="quiz-modal-body">
          {guard.locked && submissionStatus === 'not_submitted' && (
            <div className="locked-overlay">
              <div className="locked-content">
                <FaExclamationTriangle className="locked-icon" />
                <h3>Quiz Locked</h3>
                <p>Please acknowledge the proctoring violation to continue</p>
                {!guard.isFullscreen && (
                  <Button variant="warning" onClick={guard.enterFullscreen}>
                    Re-enter Fullscreen
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="quiz-layout">
            <div className="quiz-main">
              {loading ? (
                <div className="loading-state">
                  <Spinner animation="border" variant="warning" />
                </div>
              ) : error ? (
                <Alert variant="danger" className="error-alert">{error}</Alert>
              ) : submissionStatus === 'submitted_pending' || latestSubmission?.status === 'pending' ? (
                <div className="submitted-state">
                  <FaCheckCircle className="submitted-icon" />
                  <h4>Quiz Submitted!</h4>
                  <p>Your quiz has been submitted and is pending evaluation.</p>
                  {latestSubmission?._id && (
                    <p><strong>Submission ID:</strong> {latestSubmission._id}</p>
                  )}
                  <p>This page will update automatically when your result is posted.</p>
                  <Button variant="primary" onClick={handleCloseModal}>Close</Button>
                </div>
              ) : submissionStatus === 'evaluated' || (latestSubmission && latestSubmission.status !== 'pending') ? (
                <div className="result-state">
                  <Alert variant={latestSubmission?.status === 'passed' ? 'success' : 'danger'} className="result-alert">
                    <h4>Result: {String(latestSubmission?.status).toUpperCase()}</h4>
                    {latestSubmission?.score != null && (
                      <p><strong>Score:</strong> {latestSubmission.score}</p>
                    )}
                    {latestSubmission?.remarks && (
                      <p><strong>Remarks:</strong> {latestSubmission.remarks}</p>
                    )}
                    <Button variant="primary" onClick={handleCloseModal}>Close</Button>
                  </Alert>
                </div>
              ) : (
                <>
                  {questions.length === 0 ? (
                    <div>No questions available</div>
                  ) : (
                    <>
                      {submissionStatus === 'submitting' && (
                        <Alert variant="info" className="submitting-alert">
                          <Spinner animation="border" size="sm" /> Submitting your quiz...
                        </Alert>
                      )}

                      <div className="question-header">
                        <div>Question {current + 1} / {questions.length}</div>
                        <div className="answered-count">{Object.keys(answers).length}/{questions.length} answered</div>
                      </div>

                      <div className="question-text">{questions[current].question}</div>

                      <div className="options-list">
                        {questions[current].options.map((opt) => {
                          const selected = answers[current] === opt.key
                          return (
                            <button
                              key={opt.key}
                              className={`option-btn ${selected ? 'selected' : ''}`}
                              onClick={() => handleSelectOption(current, opt.key)}
                              disabled={submissionStatus !== 'not_submitted' || guard.locked}>
                              <div className="option-content">
                                <div className="option-key">{opt.key}</div>
                                <div className="option-text">{opt.text}</div>
                              </div>
                            </button>
                          )
                        })}
                      </div>

                      <div className="navigation-buttons">
                        <Button
                          variant="outline-light"
                          onClick={() => goto(current - 1)}
                          disabled={current === 0 || submissionStatus !== 'not_submitted' || guard.locked}>
                          <FaArrowLeft className="me-2" /> Previous
                        </Button>
                        <Button
                          variant="outline-light"
                          onClick={() => goto(current + 1)}
                          disabled={current === questions.length - 1 || submissionStatus !== 'not_submitted' || guard.locked}>
                          Next <FaArrowRight className="ms-2" />
                        </Button>
                        <Button
                          variant="danger"
                          onClick={handleSubmitClicked}
                          disabled={submissionStatus !== 'not_submitted' || recordingState !== 'recording' || guard.locked}
                          className="submit-btn">
                          {submissionStatus === 'submitting' ? (
                            <><Spinner animation="border" size="sm" /> Submitting...</>
                          ) : (
                            'Submit Quiz'
                          )}
                        </Button>
                      </div>

                      <div className="jump-section">
                        <div className="jump-label">Jump to question</div>
                        <div className="jump-buttons">
                          {questions.map((_, i) => {
                            const answered = Boolean(answers[i])
                            return (
                              <button
                                key={i}
                                className={`jump-btn ${i === current ? 'current' : ''} ${answered ? 'answered' : ''}`}
                                onClick={() => goto(i)}
                                disabled={submissionStatus !== 'not_submitted' || guard.locked}>
                                {i + 1}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            <div className="quiz-sidebar">
              {!token && <Alert variant="warning">You are not logged in. Please log in to take the quiz.</Alert>}

              <div className="sidebar-section">
                <div className="sidebar-label">Submission Status</div>
                <div className="sidebar-value">
                  {latestSubmission
                    ? latestSubmission.status === 'pending' ? '✅ Pending Evaluation' : 'Evaluated'
                    : (submissionStatus === 'not_submitted' && 'Not Submitted') ||
                    (submissionStatus === 'submitting' && 'Submitting...') ||
                    (submissionStatus === 'submitted_pending' && '✅ Pending Evaluation') ||
                    (submissionStatus === 'evaluated' && 'Evaluated')}
                </div>
              </div>

              <div className="sidebar-section">
                <div className="sidebar-label">Recording</div>
                <div className="sidebar-value recording-status">
                  {recordingState === 'recording' ? '🔴 Recording...' : recordingState === 'uploaded' ? '✅ Uploaded' : '⏸️ Idle'}
                </div>
                {mediaError && <div className="media-error">{mediaError}</div>}
              </div>

              <div className="sidebar-section">
                <div className="sidebar-label">Webcam preview (Auto-started)</div>
                <video
                  ref={cameraVideoRef}
                  className="webcam-preview"
                  autoPlay
                  playsInline
                  muted
                />
              </div>

              <div className="sidebar-section">
                <div className="sidebar-label">Progress</div>
                <ProgressBar now={(Object.keys(answers).length / Math.max(questions.length, 1)) * 100} className="progress-bar-custom" />
                <div className="progress-count">{Object.keys(answers).length}/{questions.length} answered</div>
              </div>

              <div className="sidebar-section">
                <div className="sidebar-label">Proctoring Status</div>
                <div className={`proctor-status ${guard.violationCount > 0 ? 'warning' : 'good'}`}>
                  <FaShieldAlt className="me-2" />
                  <strong>Violations:</strong> {guard.violationCount} / {guard.maxViolations}
                  {guard.violationCount > 0 && (
                    <div className="violation-warning">
                      {guard.violationCount >= guard.maxViolations ? 'Maximum reached - Quiz will auto-submit' : 'Please avoid tab switching and Alt+Tab'}
                    </div>
                  )}
                </div>
              </div>

              <div className="sidebar-section">
                <div className="sidebar-label">Guidance</div>
                <ul className="guidance-list">
                  <li><FaVideo className="me-2" /> Screen + webcam recording is active</li>
                  <li><FaExclamationTriangle className="me-2" style={{ color: '#ff6b6b' }} /> Do not use Alt+Tab or switch windows - violations will be recorded</li>
                  <li><FaExclamationTriangle className="me-2" style={{ color: '#ff6b6b' }} /> ESC key is disabled - cannot exit fullscreen</li>
                  <li><FaClock className="me-2" /> Quiz auto-submits when timer ends or max violations reached</li>
                  <li>Modal cannot be closed until quiz is submitted</li>
                  {!guard.isFullscreen && (
                    <li>
                      <Button size="sm" variant="outline-light" onClick={handleEnterFullscreen} className="fullscreen-btn">
                        Enter Fullscreen (ESC Disabled)
                      </Button>
                    </li>
                  )}
                </ul>
              </div>

              <div className="sidebar-footer">
                <Button
                  variant="secondary"
                  onClick={handleCloseModal}
                  disabled={submissionStatus === 'submitting' || guard.locked || submissionStatus === 'not_submitted'}
                  className="close-btn">
                  Close
                </Button>
                <div className="status-badge">
                  {latestSubmission
                    ? latestSubmission.status === 'pending' ? 'Submitted - Pending Evaluation' : 'Result Ready'
                    : submissionStatus === 'submitted_pending' ? 'Submitted - Pending Evaluation' : 'Quiz Active - Do Not Close'}
                </div>
              </div>
            </div>
          </div>
        </Modal.Body>
      </Modal>

      <style>{`
        /* Container */
        .quiz-modal .modal-content {
          background: #000000;
          border: none;
          border-radius: 0;
          height: 100vh;
        }

        /* Header */
        .quiz-modal-header {
          background: linear-gradient(135deg, #0a0a0a 0%, #000000 100%);
          border-bottom: 1px solid #ff7a00;
          padding: 1rem 1.5rem !important;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .quiz-title {
          color: #ffffff;
          font-weight: 700;
          margin: 0;
        }

        .fullscreen-status {
          color: #ff7a00;
          font-size: 0.8rem;
          margin-top: 0.25rem;
        }

        .timer-box {
          text-align: right;
        }

        .timer-value {
          font-size: 2rem;
          font-weight: 700;
          line-height: 1;
        }

        .timer-label {
          color: #8a8a8a;
          font-size: 0.75rem;
        }

        /* Body */
        .quiz-modal-body {
          padding: 0 !important;
          height: calc(100vh - 80px);
          position: relative;
        }

        .quiz-layout {
          display: flex;
          height: 100%;
        }

        .quiz-main {
          flex: 1;
          padding: 2rem;
          overflow-y: auto;
        }

        .quiz-sidebar {
          width: 320px;
          background: #0a0a0a;
          border-left: 1px solid #1f1f1f;
          padding: 1.5rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        /* Locked Overlay */
        .locked-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.95);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 100;
        }

        .locked-content {
          text-align: center;
          color: #ffffff;
        }

        .locked-icon {
          font-size: 4rem;
          color: #ff6b6b;
          margin-bottom: 1rem;
        }

        /* Question Styles */
        .question-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1.5rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid #2c2c2c;
          color: #ff7a00;
        }

        .question-text {
          font-size: 1.25rem;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 1.5rem;
          line-height: 1.5;
        }

        .options-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .option-btn {
          width: 100%;
          text-align: left;
          padding: 1rem;
          border-radius: 12px;
          border: 1px solid #2c2c2c;
          background: #0a0a0a;
          color: #e5e5e5;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .option-btn:hover:not(:disabled) {
          border-color: #ff7a00;
          background: rgba(255, 122, 0, 0.1);
        }

        .option-btn.selected {
          border-color: #ff7a00;
          background: rgba(255, 122, 0, 0.15);
        }

        .option-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .option-content {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .option-key {
          width: 40px;
          height: 40px;
          background: #1a1a1a;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: #ff7a00;
        }

        .option-text {
          flex: 1;
        }

        /* Navigation */
        .navigation-buttons {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }

        .submit-btn {
          margin-left: auto;
        }

        /* Jump Section */
        .jump-section {
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid #2c2c2c;
        }

        .jump-label {
          color: #8a8a8a;
          margin-bottom: 0.75rem;
        }

        .jump-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .jump-btn {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          background: #0a0a0a;
          border: 1px solid #2c2c2c;
          color: #e5e5e5;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .jump-btn:hover:not(:disabled) {
          border-color: #ff7a00;
          background: rgba(255, 122, 0, 0.1);
        }

        .jump-btn.current {
          background: #ff7a00;
          border-color: #ff7a00;
          color: #000000;
        }

        .jump-btn.answered {
          border-color: #28a745;
          color: #28a745;
        }

        /* Sidebar */
        .sidebar-section {
          margin-bottom: 1rem;
        }

        .sidebar-label {
          color: #ff7a00;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 0.5rem;
        }

        .sidebar-value {
          color: #ffffff;
          font-weight: 500;
        }

        .recording-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .media-error {
          color: #ff6b6b;
          font-size: 0.75rem;
          margin-top: 0.25rem;
        }

        .webcam-preview {
          width: 100%;
          height: 120px;
          border-radius: 8px;
          background: #000000;
          border: 1px solid #2c2c2c;
          object-fit: cover;
        }

        .progress-bar-custom .progress-bar {
          background: #ff7a00;
        }

        .progress-count {
          color: #8a8a8a;
          font-size: 0.75rem;
          margin-top: 0.25rem;
          text-align: right;
        }

        .proctor-status {
          padding: 0.75rem;
          border-radius: 8px;
          background: #000000;
          border: 1px solid #2c2c2c;
        }

        .proctor-status.good {
          border-color: #28a745;
        }

        .proctor-status.warning {
          border-color: #ff6b6b;
          background: rgba(255, 107, 107, 0.1);
        }

        .violation-warning {
          font-size: 0.7rem;
          color: #ff6b6b;
          margin-top: 0.25rem;
        }

        .guidance-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .guidance-list li {
          color: #e5e5e5;
          font-size: 0.8rem;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
        }

        .fullscreen-btn {
          width: 100%;
          margin-top: 0.5rem;
        }

        .sidebar-footer {
          margin-top: auto;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .close-btn {
          width: 100%;
          background: #2c2c2c;
          border: none;
        }

        .status-badge {
          text-align: center;
          font-size: 0.75rem;
          color: #ff7a00;
          background: rgba(255, 122, 0, 0.1);
          padding: 0.5rem;
          border-radius: 6px;
        }

        /* States */
        .loading-state, .submitted-state, .result-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          text-align: center;
          padding: 2rem;
        }

        .submitted-icon {
          font-size: 4rem;
          color: #28a745;
          margin-bottom: 1rem;
        }

        .submitted-state h4, .result-state h4 {
          color: #ffffff;
          margin-bottom: 1rem;
        }

        .submitted-state p, .result-state p {
          color: #8a8a8a;
        }

        /* Start Button */
        .start-quiz-btn {
          background: linear-gradient(135deg, #ff7a00 0%, #ff944d 100%);
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          color: #000000;
          font-weight: 600;
        }

        /* Status Card */
        .submission-status-card {
          background: #0a0a0a;
          border: 1px solid #1f1f1f;
          border-radius: 12px;
          margin-bottom: 1rem;
        }

        .status-card-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .status-title {
          font-size: 1rem;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 0.25rem;
        }

        .status-details {
          color: #8a8a8a;
          font-size: 0.85rem;
        }

        /* Violation Modal */
        .violation-modal .modal-content {
          background: #1a1a2e;
          border: 2px solid #ff6b6b;
          border-radius: 12px;
        }

        .violation-modal-header {
          background: linear-gradient(135deg, #ff6b6b 0%, #dc3545 100%);
          border-bottom: none;
          color: #ffffff;
        }

        .violation-modal-header .modal-title {
          font-weight: 600;
          display: flex;
          align-items: center;
        }

        .violation-modal-body {
          background: #0a0a1a;
          padding: 2rem;
          text-align: center;
        }

        .violation-content {
          text-align: center;
        }

        .violation-icon {
          font-size: 4rem;
          color: #ff6b6b;
          margin-bottom: 1rem;
        }

        .violation-content h5 {
          color: #ffffff;
          margin-bottom: 1rem;
        }

        .violation-content p {
          color: #cccccc;
          margin-bottom: 0.5rem;
        }

        .violation-count {
          font-size: 1.2rem;
          font-weight: 600;
          color: #ff6b6b;
          margin-top: 0.5rem;
        }

        .violation-warning-text {
          color: #ffaa44;
          font-weight: 500;
          margin-top: 0.5rem;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .quiz-layout {
            flex-direction: column;
          }
          
          .quiz-sidebar {
            width: 100%;
            border-left: none;
            border-top: 1px solid #1f1f1f;
            max-height: 300px;
          }
          
          .quiz-main {
            padding: 1rem;
          }
          
          .header-content {
            flex-direction: column;
            text-align: center;
          }
          
          .timer-box {
            text-align: center;
          }
          
          .navigation-buttons {
            flex-direction: column;
          }
          
          .submit-btn {
            margin-left: 0;
          }
        }
      `}</style>
    </>
  )
}

export default StudentQuiz