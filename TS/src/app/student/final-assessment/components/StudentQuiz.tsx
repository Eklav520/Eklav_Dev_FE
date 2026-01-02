// StudentQuiz.tsx — refactored to use shared proctoring hook + modal
import React, { useEffect, useRef, useState } from 'react'
import { Modal, Button, Spinner, ProgressBar, Alert, Card } from 'react-bootstrap'
import { useAuthContext } from '@/context/useAuthContext'
import { useProctorGuard } from '../helper/useProctorGuard'
import ProctorLockModal from '../components/ProctorLockModal'

const baseURL = import.meta.env.VITE_API_BASE_URL || ''

// ==== Types ====
type Option = { id?: string; key: string; text: string }
type QuizQuestion = { id?: string; _id?: string; question: string; options: Option[] }

type Props = {
  templateId?: string
  questionCount?: number
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

const StudentQuiz: React.FC<Props> = ({ templateId, questionCount = 20, onClose }) => {
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

  const [serverTemplateId, setServerTemplateId] = useState<string | null>(null)

  const [latestSubmission, setLatestSubmission] = useState<ServerSubmission>(null)
  const statusPollRef = useRef<number | null>(null)

  // media refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const combinedStreamRef = useRef<MediaStream | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const timerIntervalRef = useRef<number | null>(null)
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null)

  // Keep answers fresh for autosubmit
  const answersRef = useRef<Record<number, string>>({})

  // 🔐 submit lock + idempotency key
  const submitLockRef = useRef(false)
  const submissionNonceRef = useRef<string>((globalThis as any).crypto?.randomUUID?.() || Math.random().toString(36).slice(2))

  // Pre-captured display stream (to keep fullscreen stable)
  const preDisplayStreamRef = useRef<MediaStream | null>(null)

  // ===== Shared Proctor Guard =====
  const guard = useProctorGuard(
    {
      maxViolations: MAX_VIOLATIONS,
      lockMessage: PROCTOR_LOCK_MESSAGE,
      enabled: show && submissionStatus === 'not_submitted',
      captureFullscreenExit: true,
    },
    {
      onViolation: () => {},
      onMaxReached: async (count: any, reason: any) => {
        if (!submitLockRef.current && submissionStatus === 'not_submitted') {
          await submitQuiz(true, `Auto-submitted due to proctoring violations (${count}): ${reason}`)
        }
      },
    }
  )

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        if (!token || !templateId) return
        const res = await fetch(`${baseURL}/api/student/submission-status/${templateId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        const data = await res.json()
        if (data?.success && data.hasSubmission && data.submission) {
          setLatestSubmission(data.submission)
          if (data.submission.status === 'pending') {
            setSubmissionStatus('submitted_pending')
            startStatusPolling(data.submission.templateId || (templateId as string), token)
          } else {
            setSubmissionStatus('evaluated')
          }
        }
      } finally {
        setStatusChecked(true)
      }
    }
    fetchStatus()
    return () => stopStatusPolling()
  }, [templateId, token])

  useEffect(() => {
    return () => cleanupRecording()
  }, [])

  const startStatusPolling = (tplId: string, tok: string) => {
    stopStatusPolling()
    statusPollRef.current = window.setInterval(async () => {
      try {
        const r = await fetch(`${baseURL}/api/student/submission-status/${tplId}`, {
          headers: { Authorization: `Bearer ${tok}` },
        })
        if (!r.ok) return
        const d = await r.json()
        if (d?.success && d.hasSubmission && d.submission) {
          setLatestSubmission(d.submission)
          if (d.submission.status !== 'pending') {
            setSubmissionStatus('evaluated')
            stopStatusPolling()
          }
        }
      } catch {}
    }, 15000) as unknown as number
  }
  const stopStatusPolling = () => {
    if (statusPollRef.current) {
      window.clearInterval(statusPollRef.current)
      statusPollRef.current = null
    }
  }

  const open = () => {
    setShow(true)
    setError(null)
    setSubmissionStatus('not_submitted')
    setSubmissionResponse(null)
    setServerTemplateId(null)
    setAnswers({})
    answersRef.current = {}
    submitLockRef.current = false
    guard.reset() // resets violations + disarms
    initQuiz()
  }

  const initQuiz = async () => {
    setLoading(true)
    setError(null)
    try {
      if (!token) throw new Error('You must be logged in to start the quiz.')

      const res = await fetch(`${baseURL}/api/student/quiz-template/${templateId || 'default'}`, {
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      })
      if (res.status === 401) throw new Error('Authentication required. Please log in again.')
      if (!res.ok) {
        const b = await res.json().catch(() => null)
        throw new Error(b?.message || `Failed to fetch quiz questions (${res.status})`)
      }
      const json = await res.json()
      if (!json?.templateId || !Array.isArray(json?.questions)) {
        throw new Error('Invalid quiz template response from server')
      }

      setServerTemplateId(String(json.templateId))
      const pool: QuizQuestion[] = json.questions.map((q: any) => ({
        id: q?._id || q?.id,
        _id: q?._id || q?.id,
        question: String(q?.question ?? '').trim() || '(no question text)',
        options: normalizeOptions(q?.options || []),
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

      const urlDur = Number(new URLSearchParams(location.search).get('dur'))
      const dur = Number.isFinite(urlDur) && urlDur > 0 ? urlDur : Number(json?.durationSeconds ?? 20 * 60)
      setDurationSeconds(dur)
      setTimeLeft(dur)

      await startRecording(dur, preDisplayStreamRef.current || undefined)
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
      ;(videoEl as any).srcObject = stream
      videoEl.muted = true
      videoEl.playsInline = true
      videoEl.autoplay = true
      videoEl.play().catch(() => {})
    } catch (e) {
      console.warn('attachStreamToVideo failed', e)
    }
  }

  const startRecording = async (initialDuration: number, preCapturedDisplay?: MediaStream) => {
    setMediaError(null)
    try {
      let cameraStream: MediaStream | null = null
      try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: 'user' },
          audio: false,
        })
        attachStreamToVideo(cameraVideoRef.current, cameraStream)
      } catch (camErr) {
        console.warn('Camera access denied or failed', camErr)
        setMediaError((prev) => (prev ? prev + ' | Camera not available' : 'Camera not available'))
        cameraStream = null
      }

      const displayStream =
        preCapturedDisplay || (await (navigator.mediaDevices as any).getDisplayMedia({ video: { cursor: 'always' }, audio: false }))

      const combined = new MediaStream()
      displayStream.getVideoTracks().forEach((t: MediaStreamTrack) => combined.addTrack(t))
      if (cameraStream) cameraStream.getVideoTracks().forEach((t) => combined.addTrack(t))

      combinedStreamRef.current = combined

      const options: any = {}
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) options.mimeType = 'video/webm;codecs=vp9'
      else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) options.mimeType = 'video/webm;codecs=vp8'
      else options.mimeType = 'video/webm'

      const mr = new MediaRecorder(combined, options)
      mediaRecorderRef.current = mr
      recordedChunksRef.current = []

      mr.ondataavailable = (ev: BlobEvent) => {
        if (ev.data && ev.data.size > 0) recordedChunksRef.current.push(ev.data)
      }

      mr.start(1000)
      setRecordingState('recording')
      startTimeRef.current = Date.now()

      const quizStart = Date.now()
      const initial = initialDuration
      if (timerIntervalRef.current) window.clearInterval(timerIntervalRef.current)
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

      // Arm the proctor after a small grace period
      setTimeout(() => guard.arm(), 1500)
    } catch (err: any) {
      console.error('Recording failed', err)
      const msg = String(err?.message || err || 'Screen recording permission denied or not available.')
      setMediaError(msg)
      setRecordingState('idle')
    }
  }

  const cleanupRecording = () => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop()
        } catch {}
      }
      if (combinedStreamRef.current) {
        combinedStreamRef.current.getTracks().forEach((t) => {
          try { t.stop() } catch {}
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

  // ⏱ auto-submit when time is over
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

    // disarm proctor during submission/cleanup
    guard.disarm()

    try {
      if (!token) throw new Error('Authentication required. Please log in and try again.')
      if (!serverTemplateId) {
        setError('Template not ready yet. Please wait a moment and try again.')
        setSubmissionStatus('not_submitted')
        setRecordingState('recording')
        submitLockRef.current = false
        return
      }

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

      const payload = {
        templateId: serverTemplateId,
        clientSubmissionId: submissionNonceRef.current,
        answers: payloadAnswers,
        timeTakenSeconds: timeTaken,
        durationSeconds: durationSeconds ?? 0,
        meta: {
          clientRecordedAt: new Date().toISOString(),
          autoSubmitted: !!auto,
          proctorReason: reason || null,
          proctorViolations: guard.violationCount,
        },
      }

      const uploadRes = await fetch(`${baseURL}/api/student/submit-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
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
          const fd = new FormData()
          fd.append('submissionId', jres.submissionId)
          fd.append('recording', blob, `recording_${jres.submissionId}.webm`)
          await fetch(`${baseURL}/api/student/upload-recording`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: fd,
          })
            .then((r) => {
              if (!r.ok) throw new Error('Recording upload failed')
              setRecordingState('uploaded')
            })
            .catch((e) => console.warn('Recording upload failed:', e))
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
      startStatusPolling(serverTemplateId, token)
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

  const handleCloseModal = () => {
    if (submissionStatus === 'submitted_pending' || submissionStatus === 'evaluated') {
      setShow(false)
      if (onClose) onClose()
    }
  }

  // 👉 Start handler (pre-capture display → fullscreen → open)
  const handleStart = async () => {
    try {
      preDisplayStreamRef.current = await (navigator.mediaDevices as any).getDisplayMedia({
        video: { cursor: 'always' },
        audio: false,
      })

      await guard.enterFullscreenFromUserGesture()

      open()
    } catch (e) {
      console.warn('Start cancelled or failed:', e)
      preDisplayStreamRef.current = null
    }
  }

  const startButton = (
    <div style={{ padding: 8 }}>
      <Button onClick={handleStart} disabled={show || loading} variant="primary">
        Start Quiz (Enter Fullscreen)
      </Button>
    </div>
  )

  const statusCard = latestSubmission && (
    <Card style={{ background: '#0b1114', color: '#e8f8f2', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 12 }}>
      <Card.Body>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Your latest submission</div>
            <div>
              <strong>Status:</strong> {latestSubmission.status === 'pending' ? 'Pending evaluation' : latestSubmission.status}
              {latestSubmission.score != null && (
                <>
                  {' '}· <strong>Score:</strong> {latestSubmission.score}
                </>
              )}
              {latestSubmission.remarks && (
                <>
                  {' '}· <strong>Remarks:</strong> {latestSubmission.remarks}
                </>
              )}
            </div>
          </div>
          <div>
            <Button variant="outline-light" onClick={() => setShow(true)}>
              View Details
            </Button>
          </div>
        </div>
      </Card.Body>
    </Card>
  )

  return (
    <>
      {latestSubmission ? statusCard : !show && startButton}

      <ProctorLockModal
        show={guard.locked && show && submissionStatus === 'not_submitted'}
        message={guard.message}
        isFullscreen={guard.isFullscreen}
        remaining={Math.max(0, guard.maxViolations - guard.violationCount)}
        disabledAcknowledge={guard.violationCount >= guard.maxViolations}
        onReenterFullscreen={guard.enterFullscreenFromUserGesture}
        onAcknowledge={guard.acknowledge}
      />

      {/* Quiz modal */}
      <Modal show={show} onHide={handleCloseModal} fullscreen backdrop="static" keyboard={false} dialogClassName="quiz-modal">
        <style>{`
          .quiz-modal .modal-content { 
            background: rgba(6,8,10,0.98); 
            color: #e8f8f2; 
            height: 100vh; 
            border-radius: 0; 
            border: none;
          }
          .quiz-modal .modal-header { 
            border-bottom: 2px solid rgba(255,255,255,0.1);
            background: rgba(0,0,0,0.3);
          }
          .quiz-left { width: 72%; padding: 28px; overflow-y: auto; float:left; }
          .quiz-right { width: 28%; padding: 28px; float:right; background: rgba(0,0,0,0.2); height: 100%; border-left: 1px solid rgba(255,255,255,0.1); }
          .option-btn { display:block; width:100%; text-align:left; padding:12px; margin-bottom:10px; border-radius:8px; border:1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); transition: all 0.2s; }
          .option-btn:hover:not(:disabled) { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); }
          .option-btn.selected { border-color: rgba(13,110,253,0.9); background: rgba(13,110,253,0.15); }
          .submission-status { padding: 12px; border-radius: 6px; margin-bottom: 16px; }
          .status-pending { background: rgba(255,193,7,0.15); border: 1px solid rgba(255,193,7,0.3); }
          .disabled-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.7); pointer-events: all; z-index: 1000; }
          body.quiz-active { overflow: hidden; }
        `}</style>

        <Modal.Header style={{ border: 'none', padding: '16px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div>
              <h4 style={{ margin: 0, color: '#fff' }}>Quiz - {templateId ?? 'General'}</h4>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
                {guard.isFullscreen ? 'Fullscreen Mode Active' : 'Fullscreen inactive — press the top-right button to re-enter'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, fontSize: '24px', color: timeLeft && timeLeft < 300 ? '#ff6b6b' : '#4dabf7' }}>
                {formatTime(timeLeft)}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.65)' }}>Time remaining</div>
            </div>
          </div>
        </Modal.Header>

        <Modal.Body style={{ padding: 0, height: 'calc(100vh - 80px)' }}>
          {guard.locked && submissionStatus === 'not_submitted' && (
            <div
              className="disabled-overlay"
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: 'rgba(0,0,0,0.9)',
              }}>
              <div style={{ textAlign: 'center', color: '#fff' }}>
                <h3 style={{ color: '#ff6b6b' }}>Quiz Locked</h3>
                <p>Please acknowledge the proctoring violation to continue</p>
                {!guard.isFullscreen && (
                  <div style={{ marginTop: 10 }}>
                    <Button size="sm" variant="warning" onClick={guard.enterFullscreenFromUserGesture}>
                      Re-enter Fullscreen
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', height: '100%' }}>
            <div className="quiz-left">
              {loading ? (
                <div style={{ padding: 40, textAlign: 'center' }}>
                  <Spinner animation="border" />
                </div>
              ) : error ? (
                <div style={{ padding: 12 }}>
                  <Alert variant="danger">{error}</Alert>
                </div>
              ) : submissionStatus === 'submitted_pending' || latestSubmission?.status === 'pending' ? (
                <div style={{ padding: 40, textAlign: 'center' }}>
                  <Alert variant="warning" className="submission-status status-pending">
                    <h4>✅ Quiz Submitted!</h4>
                    <p>Your quiz has been submitted and is pending evaluation.</p>
                    {latestSubmission?._id && (
                      <p>
                        <strong>Submission ID:</strong> {latestSubmission._id}
                      </p>
                    )}
                    <p>This page will update automatically when your result is posted.</p>
                  </Alert>
                  <Button variant="primary" onClick={handleCloseModal}>
                    Close
                  </Button>
                </div>
              ) : submissionStatus === 'evaluated' || (latestSubmission && latestSubmission.status !== 'pending') ? (
                <div style={{ padding: 40 }}>
                  <Alert variant={latestSubmission?.status === 'passed' ? 'success' : 'danger'}>
                    <h4>Result: {String(latestSubmission?.status).toUpperCase()}</h4>
                    {latestSubmission?.score != null && (
                      <p>
                        <strong>Score:</strong> {latestSubmission.score}
                      </p>
                    )}
                    {latestSubmission?.remarks && (
                      <p>
                        <strong>Remarks:</strong> {latestSubmission.remarks}
                      </p>
                    )}
                    <Button variant="primary" onClick={handleCloseModal}>
                      Close
                    </Button>
                  </Alert>
                </div>
              ) : (
                <>
                  {questions.length === 0 ? (
                    <div style={{ padding: 20 }}>No questions available</div>
                  ) : (
                    <>
                      {submissionStatus === 'submitting' && (
                        <Alert variant="info" style={{ marginBottom: 16 }}>
                          <Spinner animation="border" size="sm" /> Submitting your quiz...
                        </Alert>
                      )}

                      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          Question {current + 1} / {questions.length}
                        </div>
                        <div>
                          {Object.keys(answers).length}/{questions.length} answered
                        </div>
                      </div>

                      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>{questions[current].question}</div>

                      {questions[current].options.map((opt) => {
                        const selected = answers[current] === opt.key
                        return (
                          <button
                            key={opt.key}
                            className={`option-btn ${selected ? 'selected' : ''}`}
                            onClick={() => handleSelectOption(current, opt.key)}
                            disabled={submissionStatus !== 'not_submitted' || guard.locked}>
                            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                              <div
                                style={{
                                  width: 44,
                                  height: 44,
                                  borderRadius: 8,
                                  background: 'rgba(255,255,255,0.03)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 700,
                                }}>
                                {opt.key}
                              </div>
                              <div style={{ flex: 1 }}>{opt.text}</div>
                            </div>
                          </button>
                        )
                      })}

                      <div style={{ marginTop: 18, display: 'flex', gap: 8 }}>
                        <Button
                          variant="outline-light"
                          onClick={() => goto(current - 1)}
                          disabled={current === 0 || submissionStatus !== 'not_submitted' || guard.locked}>
                          Previous
                        </Button>
                        <Button
                          variant="outline-light"
                          onClick={() => goto(current + 1)}
                          disabled={current === questions.length - 1 || submissionStatus !== 'not_submitted' || guard.locked}>
                          Next
                        </Button>
                        <div style={{ marginLeft: 'auto' }}>
                          <Button
                            variant="danger"
                            onClick={handleSubmitClicked}
                            disabled={submissionStatus !== 'not_submitted' || recordingState !== 'recording' || guard.locked}>
                            {submissionStatus === 'submitting' ? (
                              <>
                                <Spinner animation="border" size="sm" /> Submitting...
                              </>
                            ) : (
                              'Submit Quiz'
                            )}
                          </Button>
                        </div>
                      </div>

                      <div style={{ marginTop: 20 }}>
                        <div style={{ marginBottom: 6, color: 'rgba(255,255,255,0.7)' }}>Jump to</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {questions.map((_, i) => {
                            const answered = Boolean(answers[i])
                            const cls =
                              i === current
                                ? 'btn btn-primary btn-sm'
                                : answered
                                  ? 'btn btn-outline-success btn-sm'
                                  : 'btn btn-outline-secondary btn-sm'
                            return (
                              <button
                                key={i}
                                className={cls}
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

            <div className="quiz-right">
              {!token && <Alert variant="warning">You are not logged in. Please log in to take the quiz.</Alert>}

              <div style={{ marginBottom: 18 }}>
                <div style={{ color: 'rgba(255,255,255,0.65)' }}>Submission Status</div>
                <div style={{ fontWeight: 700 }}>
                  {latestSubmission
                    ? latestSubmission.status === 'pending'
                      ? '✅ Pending Evaluation'
                      : 'Evaluated'
                    : (submissionStatus === 'not_submitted' && 'Not Submitted') ||
                      (submissionStatus === 'submitting' && 'Submitting...') ||
                      (submissionStatus === 'submitted_pending' && '✅ Pending Evaluation') ||
                      (submissionStatus === 'evaluated' && 'Evaluated')}
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <div style={{ color: 'rgba(255,255,255,0.65)' }}>Recording</div>
                <div style={{ fontWeight: 700 }}>
                  {recordingState === 'recording' ? '🔴 Recording...' : recordingState === 'uploaded' ? '✅ Uploaded' : '⏸️ Idle'}
                </div>
                {mediaError && <div style={{ marginTop: 8, color: '#ffb3b3' }}>{mediaError}</div>}
              </div>

              <div style={{ marginTop: 8, marginBottom: 18 }}>
                <div style={{ color: 'rgba(255,255,255,0.65)', marginBottom: 6 }}>Webcam preview</div>
                <video
                  ref={cameraVideoRef}
                  width={160}
                  height={120}
                  style={{ borderRadius: 6, background: '#000', border: '2px solid rgba(255,255,255,0.1)' }}
                  autoPlay
                  playsInline
                  muted
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <div style={{ color: 'rgba(255,255,255,0.65)' }}>Progress</div>
                <div style={{ marginTop: 8 }}>
                  <ProgressBar now={(Object.keys(answers).length / Math.max(questions.length, 1)) * 100} />
                  <div style={{ marginTop: 6, color: 'rgba(255,255,255,0.7)' }}>
                    {Object.keys(answers).length}/{questions.length} answered
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <div style={{ color: 'rgba(255,255,255,0.65)', marginBottom: 8 }}>Proctoring Status</div>
                <div
                  style={{
                    padding: '8px',
                    borderRadius: '4px',
                    background: guard.violationCount > 0 ? 'rgba(255,77,79,0.2)' : 'rgba(76,175,80,0.2)',
                    border: `1px solid ${guard.violationCount > 0 ? 'rgba(255,77,79,0.5)' : 'rgba(76,175,80,0.5)'}`,
                  }}>
                  <strong>Violations:</strong> {guard.violationCount} / {guard.maxViolations}
                  {guard.violationCount > 0 && (
                    <div style={{ fontSize: '12px', color: '#ff6b6b', marginTop: '4px' }}>
                      {guard.violationCount >= guard.maxViolations ? 'Maximum reached - Quiz will auto-submit' : 'Please avoid tab switching'}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ color: 'rgba(255,255,255,0.65)', marginBottom: 8 }}>Guidance</div>
                <ul style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px', paddingLeft: '20px' }}>
                  <li>Screen + webcam recording is active</li>
                  <li>
                    <strong style={{ color: '#ff6b6b' }}>Do not switch tabs/windows</strong> - violations will be recorded
                  </li>
                  <li>Quiz auto-submits when timer ends or max violations reached</li>
                  <li>Modal cannot be closed until quiz is submitted</li>
                  {!guard.isFullscreen && (
                    <li>
                      <Button size="sm" variant="outline-light" onClick={guard.enterFullscreenFromUserGesture}>
                        Enter Fullscreen
                      </Button>
                    </li>
                  )}
                </ul>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                <Button
                  variant="secondary"
                  onClick={handleCloseModal}
                  disabled={submissionStatus === 'submitting' || guard.locked || submissionStatus === 'not_submitted'}
                  title={submissionStatus === 'not_submitted' ? 'Cannot close during active quiz' : 'Close quiz'}>
                  Close
                </Button>
                <div style={{ marginLeft: 'auto', alignSelf: 'center' }}>
                  <Button variant="outline-light" disabled>
                    {latestSubmission
                      ? latestSubmission.status === 'pending'
                        ? 'Submitted - Pending Evaluation'
                        : 'Result Ready'
                      : submissionStatus === 'submitted_pending'
                        ? 'Submitted - Pending Evaluation'
                        : submissionStatus === 'submitting'
                          ? 'Submitting...'
                          : 'Quiz Active - Do Not Close'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </>
  )
}

export default StudentQuiz
