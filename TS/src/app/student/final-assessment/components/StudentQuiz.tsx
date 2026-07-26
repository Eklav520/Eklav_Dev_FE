import React, { useEffect, useRef, useState } from "react"
import { Button, Card, ProgressBar, Spinner, Alert, Modal } from "react-bootstrap"
import { useAuthContext } from "@/context/useAuthContext"
import { useGazeDetection } from "@/app/student/self-interview/components/useGazeDetection"
import GazeScanOverlay from "@/app/student/self-interview/components/GazeScanOverlay"

type Props = {
  examId: string
  duration?: number
  onSubmit?: () => void
  forceSubmitRef?: React.MutableRefObject<() => void>
  // Tab-switch/window-blur/fullscreen-exit count from the page-level
  // useProctorGuard — folded into the submission so every violation type
  // ends up stored against this attempt, not just face/gaze ones.
  tabSwitchViolationCount?: number
}

type Option = {
  key: string
  text: string
}

type Question = {
  id: string
  text: string
  questionType: 'MCQ' | 'FILL'
  options: Option[]
  correctAnswer?: string
}

export default function StudentQuiz({ examId, duration = 600, onSubmit, forceSubmitRef, tabSwitchViolationCount = 0 }: Props) {
  const { user } = useAuthContext()
  const token = user?.token
  const API_BASE = import.meta.env.VITE_API_BASE_URL

  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState(duration)
  const [submitted, setSubmitted] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [showResumeBanner, setShowResumeBanner] = useState(false)

  const draftKey = `exam_draft_${user?.id}_${examId}`

  // Camera recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunks = useRef<Blob[]>([])
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  // State (not a plain ref) so the gaze-detection effect below — which
  // depends on this value — actually re-runs once the <video> node mounts.
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const answersRef = useRef(answers)
  const questionsRef = useRef(questions)
  const submittingRef = useRef(false)
  const [submitting, setSubmitting] = useState(false)

  // ── Gaze/head-pose proctoring (same detector as /student/self-interview) ──
  // Unlike tab-switch/window-blur (which shows a blocking modal and caps out
  // at 3 strikes with auto-submit), face-turn/eye-gaze violations are only
  // silently tallied here and sent up with the submission for admin review —
  // no popup, no cap, no effect on the exam flow itself.
  // Suspended while the student is typing a FILL answer — looking down at
  // the keyboard to type is expected, not a violation.
  // Reuses the visible recording preview's video element + stream (via
  // useExternalStream) rather than requesting a second independent camera
  // stream — mediapipe's Camera utility always does its own getUserMedia,
  // and most Windows webcams (Media Foundation) only allow one active
  // capture session, so a second concurrent request was silently failing
  // and gaze/head detection never started.
  const [isTypingAnswer, setIsTypingAnswer] = useState(false)
  const gaze = useGazeDetection(videoEl, !!cameraStream && !submitted, isTypingAnswer, { useExternalStream: true })
  const faceViolationCount = gaze.violationCount + gaze.headViolationCount + gaze.maskViolationCount + gaze.noFaceViolationCount
  // handleSubmit may run from a setInterval closure captured well before the
  // latest counts, so submission reads this ref instead of the values above.
  const violationCountsRef = useRef({
    eyeViolationCount: 0,
    headViolationCount: 0,
    maskViolationCount: 0,
    noFaceViolationCount: 0,
    tabSwitchViolationCount: 0,
    faceViolationCount: 0,
  })
  useEffect(() => {
    violationCountsRef.current = {
      eyeViolationCount: gaze.violationCount,
      headViolationCount: gaze.headViolationCount,
      maskViolationCount: gaze.maskViolationCount,
      noFaceViolationCount: gaze.noFaceViolationCount,
      tabSwitchViolationCount,
      faceViolationCount,
    }
  }, [gaze.violationCount, gaze.headViolationCount, gaze.maskViolationCount, gaze.noFaceViolationCount, tabSwitchViolationCount, faceViolationCount])

  useEffect(() => {
    questionsRef.current = questions
  }, [questions])


  useEffect(() => {
    answersRef.current = answers
  }, [answers])

  // Auto-save draft to localStorage on every answer change
  useEffect(() => {
    if (submitted || Object.keys(answers).length === 0) return
    localStorage.setItem(draftKey, JSON.stringify({ answers, current }))
  }, [answers, current])

  // Restore draft once questions are loaded
  useEffect(() => {
    if (questions.length === 0) return
    const saved = localStorage.getItem(draftKey)
    if (!saved) return
    try {
      const { answers: savedAnswers, current: savedCurrent } = JSON.parse(saved)
      if (savedAnswers && Object.keys(savedAnswers).length > 0) {
        setAnswers(savedAnswers)
        setCurrent(Math.min(savedCurrent ?? 0, questions.length - 1))
        setShowResumeBanner(true)
        setTimeout(() => setShowResumeBanner(false), 4000)
      }
    } catch {
      localStorage.removeItem(draftKey)
    }
  }, [questions])

  useEffect(() => {
    if (questions.length > 0 && !cameraStream) {
      startCameraRecording()
    }
  }, [questions])

  useEffect(() => {
    if (!loading && videoEl && cameraStream) {
      videoEl.srcObject = cameraStream

      videoEl.play().catch(() => {
        console.log("Autoplay blocked")
      })
    }
  }, [cameraStream, loading, videoEl])

  // ================= CAMERA RECORDING =================
  const startCameraRecording = async () => {
    console.log("🎥 Starting camera...")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 320 },
          height: { ideal: 240 },
          facingMode: "user"
        },
        audio: true,
      })
      console.log("✅ Camera stream:", stream)

      setCameraStream(stream)
      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm'
      })
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunks.current.push(e.data)
        }
      }

      recorder.onstop = () => {
        const blob = new Blob(recordedChunks.current, { type: 'video/webm' })
        console.log('Recording completed, size:', blob.size)
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
    }

    setIsRecording(false)
  }

  // ================= FETCH QUESTIONS =================
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/assessment/round/${examId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        const data = await res.json()

        const formatted = (data.data || []).map((q: any) => ({
          id: q._id,
          text: q.text || q.question,
          questionType: q.questionType === 'FILL' ? 'FILL' : 'MCQ',
          options: q.options || [],
          correctAnswer: q.correctAnswer || '',
        }))

        setQuestions(formatted)

        if (data.timeLimit) setTimeLeft(data.timeLimit)

        startCameraRecording()
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (token) fetchQuestions()

    return () => {
      stopCameraRecording()
    }
  }, [examId, token])

  // ================= TIMER =================
  useEffect(() => {
    if (submitted) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === 300) setShowWarning(true)

        if (prev <= 1) {
          clearInterval(timer)

          console.log("⏰ Timer ended - triggering auto submit")

          setTimeout(() => {
            console.log("⏳ Delayed submit after timer")
            handleSubmit(true)
          }, 300)

          return 0
        }

        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [submitted, questions])

  // ================= SELECT OPTION =================
  const selectOption = (key: string) => {
    if (submitted) return

    const q = questions[current]

    if (!q) {
      console.error("❌ Question not found at index:", current)
      return
    }

    console.log("🟢 Selecting Answer:", {
      questionId: q.id,
      selected: key,
      currentIndex: current
    })

    setAnswers(prev => {
      const updated = {
        ...prev,
        [q.id]: key
      }

      console.log("🧠 Updated Answers State:", updated)
      return updated
    })
  }

  // ================= SUBMIT =================
  const handleSubmit = async (auto = false, isViolation = false) => {
    if (submitted || submittingRef.current) return

    submittingRef.current = true
    setSubmitting(true)

    console.log("🚀 Submit triggered | auto:", auto)

    console.log("📊 Questions at submit:", questions)
    console.log("🧠 Answers state:", answersRef.current)

    const latestQuestions = questionsRef.current

    // 🚫 Important fix: release lock if blocked here
    if (!latestQuestions || latestQuestions.length === 0) {
      console.error("❌ No questions available. Skipping submit.")
      submittingRef.current = false
      setSubmitting(false)
      return
    }

    stopCameraRecording()

    try {
      let recordingUrl = ""

      /* =========================
         1. UPLOAD VIDEO (S3)
      ========================= */
      if (recordedChunks.current.length > 0) {
        console.log("📹 Uploading recorded video...")

        const blob = new Blob(recordedChunks.current, { type: "video/webm" })
        const fileName = `quiz_${Date.now()}.webm`

        const presignRes = await fetch(`${API_BASE}/api/assessment/presign/session`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            fileName,
            fileType: "video/webm",
          }),
        })

        if (!presignRes.ok) {
          throw new Error("Failed to get upload URL")
        }

        const presignData = await presignRes.json()

        if (!presignData?.uploadUrl || !presignData?.fileUrl) {
          throw new Error("Invalid presign response")
        }

        const uploadRes = await fetch(presignData.uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": "video/webm",
          },
          body: blob,
        })

        if (!uploadRes.ok) {
          throw new Error("Video upload failed")
        }

        recordingUrl = presignData.fileUrl
        console.log("✅ Video uploaded:", recordingUrl)
      }

      /* =========================
         2. FORMAT ANSWERS
      ========================= */

      const latestAnswers = { ...answersRef.current }

      const formattedAnswers = latestQuestions.map((q) => ({
        qid: q.id,
        questionText: q.text,
        textAnswer: latestAnswers[q.id] || "",
        mediaPath: "",
        mediaType: "none",
        rating: 0,
        feedback: ""
      }))

      console.log("📦 Final Answers Payload:", formattedAnswers)

      // 🚫 Prevent empty submit
      if (formattedAnswers.length === 0) {
        console.error("❌ No answers found. Blocking API call.")
        submittingRef.current = false
        setSubmitting(false)
        alert("No answers captured. Please try again.")
        return
      }

      /* =========================
         3. SUBMIT ROUND
      ========================= */

      console.log("📡 Sending API request...")

      const submitRes = await fetch(`${API_BASE}/api/assessment/complete-round`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          examId,
          roundType: "mcq",
          answers: formattedAnswers,
          sessionMediaUrl: recordingUrl,
          submittedAt: new Date(),
          autoSubmitted: auto,
          violationAutoSubmit: isViolation,
          ...violationCountsRef.current,
        }),
      })

      if (!submitRes.ok) {
        const errText = await submitRes.text()
        console.error("❌ API Error Response:", errText)
        throw new Error("Failed to submit exam")
      }

      console.log("✅ Submit success")

      localStorage.removeItem(draftKey)
      setSubmitted(true)

    } catch (err) {
      console.error("❌ Submit Error:", err)
      alert("Something went wrong while submitting. Please try again.")
    } finally {
      // ✅ ALWAYS RUN (success or error)
      submittingRef.current = false
      setSubmitting(false)
    }

    onSubmit?.()
  }

  if (forceSubmitRef) {
    forceSubmitRef.current = () => handleSubmit(true, true)
  }

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60)
    const s = t % 60
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  // ================= UI =================
  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh", background: "#000" }}>
      <Spinner animation="border" variant="light" />
    </div>
  )

  if (error) return (
    <Alert variant="dark" style={{ background: "#111", color: "#ff6b35", borderColor: "#ff6b35" }} className="m-3">
      {error}
    </Alert>
  )

  if (submitting) return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "#000000",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        zIndex: 9999,
        backdropFilter: "blur(0px)",
      }}
    >
      {/* Professional custom spinner with orange accent */}
      <div
        style={{
          width: "64px",
          height: "64px",
          border: "3px solid rgba(255, 255, 255, 0.1)",
          borderTop: "3px solid #ff6b35",
          borderRight: "3px solid rgba(255, 107, 53, 0.4)",
          borderRadius: "50%",
          animation: "spinnerRotate 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite",
          boxShadow: "0 0 12px rgba(255, 107, 53, 0.3)",
        }}
      />

      <p
        style={{
          color: "#ffffff",
          marginTop: "24px",
          fontSize: "1rem",
          fontWeight: 500,
          letterSpacing: "0.3px",
          background: "rgba(255, 107, 53, 0.1)",
          padding: "8px 20px",
          borderRadius: "40px",
          backdropFilter: "blur(4px)",
        }}
      >
        {timeLeft === 0
          ? "⏰ Time's up! Submitting..."
          : "Submitting your exam..."}
      </p>

      {/* Optional subtle loading dots indicator */}
      <div
        style={{
          display: "flex",
          gap: "6px",
          marginTop: "12px",
        }}
      >
        <span
          style={{
            width: "6px",
            height: "6px",
            backgroundColor: "#ff6b35",
            borderRadius: "50%",
            animation: "dotPulse 1.4s ease-in-out infinite",
            animationDelay: "0s",
          }}
        />
        <span
          style={{
            width: "6px",
            height: "6px",
            backgroundColor: "#ff6b35",
            borderRadius: "50%",
            animation: "dotPulse 1.4s ease-in-out infinite",
            animationDelay: "0.2s",
          }}
        />
        <span
          style={{
            width: "6px",
            height: "6px",
            backgroundColor: "#ff6b35",
            borderRadius: "50%",
            animation: "dotPulse 1.4s ease-in-out infinite",
            animationDelay: "0.4s",
          }}
        />
      </div>

      <style>{`
      @keyframes spinnerRotate {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }
      
      @keyframes dotPulse {
        0%, 60%, 100% {
          transform: scale(1);
          opacity: 0.4;
        }
        30% {
          transform: scale(1.2);
          opacity: 1;
        }
      }
    `}</style>
    </div>
  )

  return (
    <>
      {/* Camera Error Modal */}
      <Modal show={!!cameraError} centered backdrop="static">
        <Modal.Body style={{ background: "#111", color: "#fff", border: "1px solid #ff6b35" }} className="text-center">
          <h5 style={{ color: "#ff6b35" }}>📹 Camera Required</h5>
          <p>{cameraError}</p>
          <p className="text-warning small">Please allow camera access to continue with the exam.</p>
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

      {/* Time Warning Modal */}
      <Modal show={showWarning} centered backdrop="static">
        <Modal.Body style={{ background: "#111", color: "#fff", border: "1px solid #ff6b35" }} className="text-center">
          <h5 style={{ color: "#ff6b35" }}>⏰ Time Warning</h5>
          <p>Only 5 minutes remaining!</p>
          <Button
            style={{ background: "#ff6b35", border: "none" }}
            onClick={() => setShowWarning(false)}
          >
            Continue
          </Button>
        </Modal.Body>
      </Modal>

      <div style={{ display: "flex", height: "100vh", background: "#000", color: "#fff", overflow: "hidden" }}>
        {/* Main Content Area - More space for questions */}
        <div style={{ flex: 3, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column" }}>
          {/* Header with Question Number */}
          <div className="mb-3">
            <h5 style={{ color: "#ff6b35", marginBottom: "5px" }}>
              Question {current + 1} of {questions.length}
            </h5>
            <div style={{ height: "2px", background: "#ff6b35", width: "60px" }}></div>
          </div>

          {/* Resume banner */}
          {showResumeBanner && (
            <div style={{
              background: 'rgba(40,167,69,0.15)',
              border: '1px solid #28a745',
              borderRadius: 8,
              padding: '8px 14px',
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: '0.85rem',
              color: '#28a745',
              fontWeight: 600,
            }}>
              ✅ Your previous answers have been restored — continue from where you left off.
            </div>
          )}

          {/* Question Card - Prominent and spacious */}
          <Card
            style={{
              background: "#111",
              border: "1px solid #ff6b35",
              color: "#fff",
              marginBottom: "25px",
              borderRadius: "12px"
            }}
            className="p-4"
          >
            <div style={{ marginBottom: "10px" }}>
              {questions[current].questionType === 'FILL' ? (
                <span style={{ background: "rgba(40,167,69,0.15)", color: "#28a745", border: "1px solid #28a745", borderRadius: "20px", padding: "2px 12px", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.5px" }}>
                  ✏️ FILL IN THE BLANK
                </span>
              ) : (
                <span style={{ background: "rgba(255,107,53,0.15)", color: "#ff6b35", border: "1px solid #ff6b35", borderRadius: "20px", padding: "2px 12px", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.5px" }}>
                  ☑️ MCQ
                </span>
              )}
            </div>
            <div style={{ fontSize: "1.2rem", lineHeight: "1.6", fontWeight: "500" }}>
              {questions[current].text}
            </div>
          </Card>

          {/* Answer area — MCQ or FILL */}
          <div className="mb-4">
            {questions[current].questionType === 'FILL' ? (
              <>
                <h6 style={{ color: "#888", marginBottom: "12px", fontSize: "0.9rem" }}>Type your answer:</h6>
                <div style={{
                  background: "#111",
                  border: "1px solid #ff6b35",
                  borderRadius: "10px",
                  padding: "4px 8px",
                }}>
                  <input
                    type="text"
                    value={answers[questions[current].id] || ""}
                    onChange={e => {
                      if (submitted) return
                      const q = questions[current]
                      setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))
                    }}
                    onFocus={() => setIsTypingAnswer(true)}
                    onBlur={() => setIsTypingAnswer(false)}
                    disabled={submitted}
                    placeholder="Write your answer here..."
                    style={{
                      width: "100%",
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      color: "#fff",
                      fontSize: "1rem",
                      padding: "10px 8px",
                    }}
                  />
                </div>
                <div style={{ color: "#555", fontSize: "0.78rem", marginTop: "6px" }}>
                  Fill in the blank — type your answer exactly
                </div>
              </>
            ) : (
              <>
                <h6 style={{ color: "#888", marginBottom: "12px", fontSize: "0.9rem" }}>Select your answer:</h6>
                {questions[current].options.map((opt) => (
                  <Button
                    key={opt.key}
                    className="w-100 mb-2 text-start"
                    style={{
                      background: answers[questions[current].id] === opt.key ? "#ff6b35" : "#111",
                      border: answers[questions[current].id] === opt.key ? "none" : "1px solid #333",
                      color: "#fff",
                      justifyContent: "flex-start",
                      padding: "12px 16px",
                      fontSize: "0.95rem",
                      transition: "all 0.2s",
                      borderRadius: "8px"
                    }}
                    onClick={() => selectOption(opt.key)}
                    disabled={submitted}
                    onMouseEnter={(e) => {
                      if (answers[questions[current].id] !== opt.key) {
                        e.currentTarget.style.background = "#222"
                        e.currentTarget.style.borderColor = "#ff6b35"
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (answers[questions[current].id] !== opt.key) {
                        e.currentTarget.style.background = "#111"
                        e.currentTarget.style.borderColor = "#333"
                      }
                    }}
                  >
                    <b style={{ marginRight: "12px", color: "#ff6b35", fontSize: "1rem" }}>{opt.key}.</b>
                    {opt.text}
                  </Button>
                ))}
              </>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="d-flex justify-content-between mt-auto pt-3">
            <Button
              disabled={current === 0}
              onClick={() => setCurrent(p => p - 1)}
              style={{
                background: current === 0 ? "#333" : "#ff6b35",
                border: "none",
                padding: "8px 24px",
                cursor: current === 0 ? "not-allowed" : "pointer",
                borderRadius: "6px"
              }}
            >
              ← Previous
            </Button>
            <div className="d-flex gap-2">
              <Button
                onClick={() => setCurrent(p => p + 1)}
                disabled={current === questions.length - 1}
                style={{
                  background: current === questions.length - 1 ? "#333" : "#ff6b35",
                  border: "none",
                  padding: "8px 24px",
                  borderRadius: "6px",
                  cursor: current === questions.length - 1 ? "not-allowed" : "pointer"
                }}
              >
                Next →
              </Button>
              <Button
                onClick={() => handleSubmit(false)}
                disabled={submitted}
                style={{
                  background: "#dc3545",
                  border: "none",
                  padding: "8px 24px",
                  fontWeight: 500,
                  borderRadius: "6px",
                }}
              >
                Submit Exam
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar - Compact with Timer and Navigator */}
        <div style={{
          width: "360px",
          padding: "20px 15px",
          background: "#111",
          borderLeft: "1px solid #333",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          overflowY: "auto"
        }}>
          {/* Timer Section */}
          <div style={{ background: "#000", padding: "8px 12px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div>
              <div style={{ fontSize: "0.68rem", color: "#888" }}>Time Remaining</div>
              <div style={{ color: "#ff6b35", fontSize: "1.15rem", fontWeight: "bold", lineHeight: 1.2 }}>
                {formatTime(timeLeft)}
              </div>
            </div>
            <div style={{ flex: 1, maxWidth: 90 }}>
              <ProgressBar
                now={(Object.keys(answers).length / questions.length) * 100}
                style={{ background: "#333", height: "4px" }}
              >
                <ProgressBar
                  now={(Object.keys(answers).length / questions.length) * 100}
                  style={{ background: "#ff6b35" }}
                />
              </ProgressBar>
              <div style={{ fontSize: "0.65rem", color: "#888", marginTop: 3, textAlign: "right" }}>
                {Object.keys(answers).length}/{questions.length} answered
              </div>
            </div>
          </div>

          {/* Question Navigator - Compact Grid */}
          <div>
            <h6 style={{ color: "#ff6b35", marginBottom: "10px", fontSize: "0.9rem" }}>Quick Navigation</h6>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, 1fr)",
              gap: "6px",
              maxHeight: "220px",
              overflowY: "auto",
              overflowX: "hidden",
              width: "100%",
            }}>
              {questions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  style={{
                    width: "100%",
                    minWidth: 0,
                    boxSizing: "border-box",
                    aspectRatio: "1",
                    background: i === current ? "#ff6b35" : answers[questions[i].id] ? "#28a745" : "#222",
                    border: i === current ? "2px solid #fff" : "none",
                    color: "#fff",
                    fontWeight: "bold",
                    fontSize: "0.8rem",
                    borderRadius: "6px",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    if (i !== current && !answers[questions[i].id]) {
                      e.currentTarget.style.background = "#333"
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (i !== current && !answers[questions[i].id]) {
                      e.currentTarget.style.background = "#222"
                    }
                  }}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          <div style={{
            marginTop: "auto",
            background: "#000",
            borderRadius: "8px",
            overflow: "hidden",
            border: `1px solid ${gaze.isLookingAway || gaze.isHeadTurned ? '#dc3545' : '#ff6b35'}`,
            minHeight: "150px",
            transition: "border-color 0.2s",
          }}>
            {cameraStream ? (
              <>
                <div style={{
                  background: "#ff6b35",
                  padding: "4px 8px",
                  fontSize: "10px",
                  color: "#fff",
                  display: "flex",
                  justifyContent: "space-between"
                }}>
                  <span>📹 Recording</span>
                  {isRecording && <span>●</span>}
                </div>

                <div style={{ position: "relative" }}>
                  <video
                    ref={setVideoEl}
                    autoPlay
                    muted
                    playsInline
                    style={{ width: "100%", display: "block" }}
                  />
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

                {/* Gaze/head-pose proctoring status — same signal source as
                    /student/self-interview's face tracking, condensed to a
                    status strip since the camera box here is small. */}
                {gaze.isReady && (
                  <div style={{
                    padding: "5px 8px",
                    fontSize: "10.5px",
                    fontWeight: 600,
                    textAlign: "center",
                    color: !gaze.faceDetected || gaze.maskDetected || gaze.isLookingAway || gaze.isHeadTurned ? "#fff" : "#28a745",
                    background: !gaze.faceDetected || gaze.maskDetected || gaze.isLookingAway || gaze.isHeadTurned ? "#dc3545" : "rgba(40,167,69,0.12)",
                  }}>
                    {!gaze.faceDetected
                      ? `⚠ Face not visible — remove any covering (${gaze.noFaceSeconds}s)`
                      : gaze.maskDetected
                        ? `⚠ Mouth/nose covered — remove mask (${gaze.maskAwaySeconds}s)`
                        : gaze.isLookingAway
                          ? `⚠ Look at the screen (${gaze.lookAwaySeconds}s)`
                          : gaze.isHeadTurned
                            ? `⚠ Face the camera (${gaze.headAwaySeconds}s)`
                            : "✓ Face tracking OK"}
                  </div>
                )}

                {/* Silent tally — not a blocking violation, just a count
                    sent up with the submission for admin review. */}
                {faceViolationCount > 0 && (
                  <div style={{
                    padding: "3px 8px",
                    fontSize: "10px",
                    fontWeight: 600,
                    textAlign: "center",
                    color: "#f59e0b",
                    background: "rgba(245,158,11,0.12)",
                  }}>
                    Face/gaze violations noted: {faceViolationCount}
                  </div>
                )}
              </>
            ) : (
              <div style={{
                color: "#888",
                textAlign: "center",
                padding: "20px",
                fontSize: "12px"
              }}>
                🎥 Camera not started
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add pulse animation */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </>
  )
}