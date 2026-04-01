import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ProgressBar, Spinner, Alert, Modal, Button, Form } from 'react-bootstrap'
import {
  FaMicrophone,
  FaStop,
  FaArrowLeft,
  FaArrowRight,
  FaCheckCircle,
  FaClock,
  FaFileAlt,
  FaCode,
  FaVideo,
  FaExclamationTriangle,
  FaUserTie,
  FaBrain,
  FaUpload,
  FaSpinner,
  FaBook,
  FaQuestionCircle,
  FaList,
  FaPlay
} from 'react-icons/fa'
import { useAuthContext } from "@/context/useAuthContext"

// ---- Types ----
type HRQuestion = { _id: string; topic: string; question: string }
type Props = {
  examId: string
  duration?: number
  onSubmitted?: () => void
  baseURL?: string
}

export default function HRRound({ examId, duration = 30 * 60, onSubmitted, baseURL = import.meta.env.VITE_API_BASE_URL }: Props) {
  const { user } = useAuthContext()
  const token = user?.token
  const [open, setOpen] = useState(true)

  // ===== TIMER STATE =====
  const [timeLeft, setTimeLeft] = useState(duration)
  const [timerActive, setTimerActive] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Topics
  const [availableTopics, setAvailableTopics] = useState<string[]>([])
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [loadingTopics, setLoadingTopics] = useState(false)
  const [loadErr, setLoadErr] = useState('')

  // Q&A
  const [loadingQs, setLoadingQs] = useState(false)
  const [qs, setQs] = useState<HRQuestion[]>([])
  const [idx, setIdx] = useState(0)
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({})
  const current = qs[idx]
  const progress = useMemo(() => (qs.length ? Math.round((idx / qs.length) * 100) : 0), [idx, qs.length])

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

  // Camera Recording
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)

  const [startingInterview, setStartingInterview] = useState(false)
  const welcomePlayedRef = useRef(false)

  // ===== FETCH AVAILABLE TOPICS =====
  useEffect(() => {
    const fetchTopics = async () => {
      if (!token) return
      setLoadingTopics(true)
      try {
        const res = await fetch(`${baseURL}/api/hr/topics`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (data.success) {
          setAvailableTopics(data.topics || [])
        } else {
          setLoadErr(data?.error || 'Failed to load topics')
        }
      } catch (err) {
        console.error('Failed to fetch topics', err)
        setLoadErr('Failed to load topics')
      } finally {
        setLoadingTopics(false)
      }
    }
    fetchTopics()
  }, [token, baseURL])

  useEffect(() => {
    if (videoRef.current && cameraStream) {
      console.log("🎯 HR: Attaching stream to video")

      const video = videoRef.current
      video.srcObject = cameraStream
      video.muted = true
      video.playsInline = true

      video.play()
        .then(() => console.log("✅ HR Video playing"))
        .catch(() => {
          setTimeout(() => video.play().catch(() => { }), 500)
        })
    }
  }, [cameraStream, qs.length])

  // ===== CAMERA RECORDING =====
  const startCameraRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user"
        },
        audio: true,
      })

      setCameraStream(stream)
      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm'
      })
      mediaRecorderRef.current = recorder
      recordedChunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data)
        }
      }

      recorder.start(1000)
      setIsRecording(true)
      setCameraError(null)
    } catch (err) {
      console.error("Camera error", err)
      setCameraError("Unable to access camera. Please ensure camera permissions are granted.")
    }
  }

  const stopCameraRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop()
    }

    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }

    setIsRecording(false)
  }

  // ===== TIMER FUNCTIONS =====
  const startTimer = () => {
    setTimerActive(true)
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
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

  // ===== TOGGLE TOPIC =====
  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev =>
      prev.includes(topic)
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    )
  }

  /* ======================= Generate Questions ======================= */
  const generateQuestions = async () => {
    if (!token) return

    setLoadingQs(true)
    setUiErr('')

    try {
      const params = new URLSearchParams({
        topics: selectedTopics.join(','),
        count: '10'
      })
      const res = await fetch(`${baseURL}/api/hr/questions?${params}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()

      if (!data?.questions || !Array.isArray(data.questions)) {
        throw new Error(data.message || 'Failed to generate questions')
      }

      setQs(data.questions || [])
      setIdx(0)

      const init: Record<string, string> = {}
      data.questions.forEach((q: HRQuestion) => (init[q._id] = ''))
      setTextAnswers(init)

      startTimer()
    } catch (e: any) {
      setUiErr(e.message || 'Failed to generate questions')
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
    await speak("Hello. Welcome to HR Panel. Let's start the discussion.")
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

  /* ======================= Flow control ======================= */
  const handleStartInterview = async () => {
    if (selectedTopics.length === 0) {
      setUiErr('Please select at least one topic')
      return
    }

    setStartingInterview(true)

    try {
      const synth = window.speechSynthesis
      if (synth) {
        synth.cancel()
        synth.resume()
      }
    } catch { }

    await startCameraRecording()
    await generateQuestions()
    setStartingInterview(false)
  }

  const handleNext = () => setIdx((i) => Math.min(i + 1, qs.length - 1))
  const handlePrev = () => setIdx((i) => Math.max(i - 1, 0))

  const allAnswered = qs.length > 0 && qs.every((q) => (textAnswers[q._id] || '').trim().length > 0)

  const uploadRecordingToS3 = async (blob: Blob): Promise<string> => {
    if (!token) throw new Error('Auth required')

    const presignRes = await fetch(`${baseURL}/api/hr/presign/session`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: `hr_recording_${Date.now()}.webm`,
        fileType: blob.type || 'video/webm',
      }),
    })

    const presignData = await presignRes.json()
    if (!presignData.uploadUrl || !presignData.fileUrl) {
      throw new Error('Failed to get upload URL')
    }

    await fetch(presignData.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': blob.type || 'video/webm' },
      body: blob,
    })

    return presignData.fileUrl
  }

  const handleSubmit = async () => {
    if (!token || qs.length === 0) return

    stopTimer()
    setSubmitting(true)

    try {
      stopDictation()

      let recordingUrl = ''
      if (mediaRecorderRef.current && isRecording) {
        const blobPromise = new Promise<Blob>((resolve) => {
          if (mediaRecorderRef.current) {
            mediaRecorderRef.current.onstop = () => {
              const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' })
              resolve(blob)
            }
            mediaRecorderRef.current.stop()
          }
        })

        const blob = await blobPromise
        if (blob && blob.size > 0) {
          recordingUrl = await uploadRecordingToS3(blob)
        }
      }

      const answers = qs.map((q) => ({
        qid: q._id,
        questionText: q.question,
        textAnswer: (textAnswers[q._id] || '').trim(),
      }))

      const res = await fetch(`${baseURL}/api/hr/submit`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          examId,
          topics: selectedTopics,
          answers,
          recordingUrl,
          timeLeft,
        }),
      })

      const data = await res.json()
      if (data?.success) {
        stopCameraRecording()
        setOpen(false)
        onSubmitted?.()
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
    await handleSubmit()
  }

  useEffect(() => {
    if (timeLeft === 0 && timerActive) {
      handleAutoSubmit('Time expired - auto submitted')
    }
  }, [timeLeft, timerActive])

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
  }, [current?._id])

  useEffect(() => {
    return () => {
      stopTimer()
      try {
        recRef.current?.stop()
      } catch { }
      stopCameraRecording()
      try {
        window.speechSynthesis?.cancel()
      } catch { }
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const handleCloseModal = () => {
    stopTimer()
    try {
      recRef.current?.stop()
    } catch { }
    stopCameraRecording()
    setOpen(false)
    onSubmitted?.()
  }

  const committedValue = (() => (!current ? '' : textAnswers[current._id] || ''))()
  const currentInterim = dictating && current ? interimRef.current[current._id] || '' : ''

  // Topic Selection Component
  const TopicSelection = () => (
    <div className="topic-selection-section">
      <div className="topic-selection-header">
        <FaList className="topic-header-icon" />
        <div>
          <h4 className="topic-title">Select HR Topics</h4>
          <p className="topic-subtitle">Choose topics for your HR interview questions</p>
        </div>
      </div>

      <div className="topics-grid">
        {loadingTopics ? (
          <div className="topic-loading">
            <Spinner animation="border" size="sm" />
            <span>Loading topics...</span>
          </div>
        ) : (
          availableTopics.map((topic) => (
            <button
              key={topic}
              className={`topic-chip ${selectedTopics.includes(topic) ? 'selected' : ''}`}
              onClick={() => toggleTopic(topic)}
            >
              {topic}
            </button>
          ))
        )}
      </div>

      {selectedTopics.length > 0 && (
        <div className="selected-topics-summary">
          <FaCheckCircle className="summary-icon" />
          <span>{selectedTopics.length} topic{selectedTopics.length !== 1 ? 's' : ''} selected</span>
        </div>
      )}

      <button
        className="start-interview-btn-custom"
        disabled={selectedTopics.length === 0 || startingInterview}
        onClick={handleStartInterview}
      >
        {startingInterview ? (
          <>
            <FaSpinner className="spinner-icon" />
            Setting Up Interview...
          </>
        ) : (
          <>
            <FaPlay className="me-2" />
            Start Interview ({selectedTopics.length} topics)
          </>
        )}
      </button>
    </div>
  )

  return (
    <>
      {/* Camera Error Modal */}
      <Modal show={!!cameraError} centered backdrop="static" onHide={() => setCameraError(null)}>
        <Modal.Body style={{ background: "#111", color: "#fff", border: "1px solid #ff6b35" }} className="text-center">
          <h5 style={{ color: "#ff6b35" }}>📹 Camera Required</h5>
          <p>{cameraError}</p>
          <p className="text-warning small">Please allow camera access to continue with the interview.</p>
          <Button
            style={{ background: "#ff6b35", border: "none" }}
            onClick={() => {
              setCameraError(null)
              startCameraRecording()
            }}
          >
            Try Again
          </Button>
        </Modal.Body>
      </Modal>

      <Modal
        show={open}
        onHide={handleCloseModal}
        fullscreen
        backdrop="static"
        keyboard={false}
        className="hr-modal-custom"
        container={document.body}   // 🔥 FIX
        style={{ zIndex: 9999999 }} // 🔥 FIX
      >
        <Modal.Header closeButton className="modal-header-custom">
          <div className="header-content-custom">
            <div>
              <h1 className="modal-title-custom">HR Interview</h1>
              <p className="modal-subtitle">
                {selectedTopics.length > 0 ? `${selectedTopics.length} topics selected` : 'Select topics for your interview'}
              </p>
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

          {!qs.length && !startingInterview && <TopicSelection />}

          {startingInterview && !qs.length && (
            <div className="loading-section">
              <div className="loading-card">
                <h3 className="loading-title">Setting Up Interview</h3>
                <div className="loading-spinner-custom">
                  <FaSpinner className="spinner-large" />
                </div>
                <p className="loading-text">Please wait while we set up your interview session...</p>
                <div className="loading-steps-custom">
                  <div className="loading-step done">
                    <FaCheckCircle className="step-icon" />
                    <span>Topics Selected</span>
                  </div>
                  <div className={`loading-step ${isRecording ? 'done' : ''}`}>
                    <span className="step-icon">{isRecording ? '✓' : '...'}</span>
                    <span>Camera Setup</span>
                  </div>
                  <div className={`loading-step ${qs.length > 0 ? 'done' : ''}`}>
                    <span className="step-icon">{qs.length > 0 ? '✓' : '...'}</span>
                    <span>Generating Questions</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!!qs.length && !reviewing && !startingInterview && (
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
                    {selectedTopics.length > 0 && (
                      <div className="selected-topics-badge">
                        <FaList className="me-1" /> {selectedTopics.length} topics
                      </div>
                    )}
                  </div>

                  <div className="question-card-custom">
                    <div className="question-source">
                      <small>HR Interview Question</small>
                    </div>
                    <h3 className="question-text-custom">{current?.question}</h3>

                    <div className="answer-section-custom">
                      <label>Your Answer</label>
                      <textarea
                        placeholder="Speak (Start) or type freely…"
                        value={committedValue}
                        onChange={(e) => {
                          if (!current) return
                          interimRef.current[current._id] = ''
                          setTextAnswers((prev) => ({ ...prev, [current._id]: e.target.value }))
                          tick((x) => x + 1)
                        }}
                        rows={6}
                        className="answer-textarea-custom"
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
                        <button className="record-btn-custom" onClick={startDictation}>
                          <FaMicrophone className="me-2" /> Start
                        </button>
                      ) : (
                        <button className="stop-record-btn-custom" onClick={stopDictation}>
                          <FaStop className="me-2" /> Stop
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="nav-controls-custom">
                    <button className="nav-btn prev" onClick={handlePrev} disabled={idx === 0}>
                      <FaArrowLeft className="me-2" /> Previous
                    </button>
                    {!isLastQuestion ? (
                      <button className="nav-btn next" onClick={handleNext} disabled={idx === qs.length - 1}>
                        Next <FaArrowRight className="ms-2" />
                      </button>
                    ) : (
                      <button className="review-btn" onClick={() => setReviewing(true)}>
                        Review Answers
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="interview-right">
                <div className="video-panel">
                  <div className="video-section-custom">
                    <h4><FaVideo className="me-2" /> Camera Recording</h4>
                    <div className="video-preview-custom camera-preview">
                      <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="video-element"
                      />
                      {!isRecording && !cameraStream && (
                        <div className="video-placeholder-custom">
                          <div>Camera not started</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="recording-status">
                    <span className={`status-dot ${isRecording ? 'active' : ''}`}></span>
                    <span>{isRecording ? 'Camera is recording' : 'Recording stopped'}</span>
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

                  {selectedTopics.length > 0 && (
                    <div className="topics-summary-custom">
                      <h5><FaList className="me-2" /> Selected Topics</h5>
                      <div className="topics-tags-compact">
                        {selectedTopics.slice(0, 8).map((topic) => (
                          <span key={topic} className="topic-tag-compact">{topic}</span>
                        ))}
                        {selectedTopics.length > 8 && (
                          <span className="topic-tag-compact">+{selectedTopics.length - 8} more</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {!!qs.length && reviewing && !startingInterview && (
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
                            setReviewing(false)
                            setIdx(i)
                          }}
                        >
                          Q{i + 1}. {q.question}
                        </div>
                        <div className={`review-answer ${!ans ? 'empty' : ''}`}>
                          {ans || <span>No answer provided</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="review-actions">
                  <button className="back-btn" onClick={() => setReviewing(false)}>
                    <FaArrowLeft className="me-2" /> Back to questions
                  </button>
                  <button
                    className="final-submit-btn"
                    onClick={handleSubmit}
                    disabled={(!allAnswered) || submitting}
                  >
                    {submitting ? <FaSpinner className="spinner-icon" /> : <FaCheckCircle className="me-2" />}
                    {submitting ? 'Submitting...' : 'Final Submit'}
                  </button>
                </div>
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
          height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .modal-header-custom {
          background: linear-gradient(135deg, #0a0a0a 0%, #000000 100%);
          border-bottom: 1px solid #ff7a00;
          padding: 1.25rem 2rem;
          flex-shrink: 0;
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

        .modal-body-custom {
          padding: 2rem;
          overflow-y: auto;
          background: #000000;
          flex: 1;
        }

        /* Topic Selection Styles */
        .topic-selection-section {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
          background: #0a0a0a;
          border-radius: 16px;
          border: 1px solid #2c2c2c;
        }

        .topic-selection-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .topic-header-icon {
          font-size: 2rem;
          color: #ff7a00;
        }

        .topic-title {
          color: #ffffff;
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0;
        }

        .topic-subtitle {
          color: #8a8a8a;
          font-size: 0.8rem;
          margin: 0.25rem 0 0 0;
        }

        .topics-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
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

        .topic-loading {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #8a8a8a;
          padding: 1rem;
        }

        .selected-topics-summary {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background: rgba(40, 167, 69, 0.1);
          border-radius: 8px;
          color: #28a745;
          margin: 1rem 0;
        }

        .summary-icon {
          font-size: 1rem;
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

        /* Alert Styles */
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

        /* Loading Section */
        .loading-section {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 70vh;
        }

        .loading-card {
          background: #0a0a0a;
          border: 1px solid #1f1f1f;
          border-radius: 24px;
          padding: 2.5rem;
          text-align: center;
          max-width: 500px;
        }

        .loading-title {
          color: #ffffff;
          font-size: 1.25rem;
          margin-bottom: 1.5rem;
        }

        .loading-spinner-custom {
          margin: 2rem 0;
        }

        .spinner-large {
          font-size: 2.5rem;
          color: #ff7a00;
          animation: spin 1s linear infinite;
        }

        .loading-text {
          color: #8a8a8a;
          margin-bottom: 2rem;
        }

        .loading-steps-custom {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .loading-step {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: #000000;
          border-radius: 8px;
        }

        .loading-step.done {
          border-left: 3px solid #28a745;
        }

        .step-icon {
          width: 24px;
          text-align: center;
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

        .selected-topics-badge {
          background: rgba(255, 122, 0, 0.1);
          color: #ff7a00;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          display: flex;
          align-items: center;
        }

        .question-card-custom {
          background: #0a0a0a;
          border: 1px solid #1f1f1f;
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 1rem;
        }

        .question-source {
          margin-bottom: 0.5rem;
        }

        .question-source small {
          color: #8a8a8a;
          font-size: 0.7rem;
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

        .review-btn {
          padding: 0.5rem 1rem;
          border-radius: 8px;
          background: linear-gradient(135deg, #ff7a00 0%, #ff944d 100%);
          border: none;
          color: #000000;
          font-weight: 600;
        }

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
          aspect-ratio: 4/3;
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

        .recording-status {
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

        .topics-summary-custom {
          background: #000000;
          border-radius: 8px;
          padding: 0.75rem;
        }

        .topics-summary-custom h5 {
          color: #ff7a00;
          font-size: 0.8rem;
          margin-bottom: 0.5rem;
        }

        .topics-tags-compact {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
        }

        .topic-tag-compact {
          background: rgba(255, 122, 0, 0.1);
          color: #ff7a00;
          padding: 0.2rem 0.5rem;
          border-radius: 20px;
          font-size: 0.7rem;
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

        .review-answer {
          background: #000000;
          padding: 0.75rem;
          border-radius: 8px;
          color: #e5e5e5;
          white-space: pre-wrap;
        }

        .review-answer.empty {
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
          
          .topic-selection-section {
            padding: 1rem;
          }
          
          .nav-controls-custom {
            flex-direction: column;
          }
          
          .nav-btn, .review-btn {
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
        }
          /* 🔥 HR MODAL FIX */
.modal-backdrop {
  z-index: 9999998 !important;
}

.hr-modal-custom {
  z-index: 9999999 !important;
}

.hr-modal-custom .modal-dialog {
  max-width: 100% !important;
  margin: 0 !important;
}

.hr-modal-custom .modal-content {
  position: fixed !important;
  inset: 0 !important;
  z-index: 9999999 !important;
  display: flex;
  flex-direction: column;
}

.hr-modal-custom .modal-body {
  flex: 1;
  overflow-y: auto;
}

/* Prevent background scroll */
body.modal-open {
  overflow: hidden !important;
}
      `}</style>
    </>
  )
}