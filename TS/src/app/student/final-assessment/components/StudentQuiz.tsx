import React, { useEffect, useRef, useState } from "react"
import { Button, Card, ProgressBar, Spinner, Alert, Modal } from "react-bootstrap"
import { useAuthContext } from "@/context/useAuthContext"

type Props = {
  examId: string
  duration?: number
  onSubmit?: () => void
}

type Option = {
  key: string
  text: string
}

type Question = {
  id: string
  text: string
  options: Option[]
}

export default function StudentQuiz({ examId, duration = 600, onSubmit }: Props) {
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

  // Camera recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunks = useRef<Blob[]>([])
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const answersRef = useRef(answers)
  const questionsRef = useRef(questions)
  const submittingRef = useRef(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    questionsRef.current = questions
  }, [questions])


  useEffect(() => {
    answersRef.current = answers
  }, [answers])

  useEffect(() => {
    if (questions.length > 0 && !cameraStream) {
      startCameraRecording()
    }
  }, [questions])

  useEffect(() => {
    if (!loading && videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream

      videoRef.current.play().catch(() => {
        console.log("Autoplay blocked")
      })
    }
  }, [cameraStream, loading])

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
          options: q.options || [],
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
  const handleSubmit = async (auto = false) => {
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
        }),
      })

      if (!submitRes.ok) {
        const errText = await submitRes.text()
        console.error("❌ API Error Response:", errText)
        throw new Error("Failed to submit exam")
      }

      console.log("✅ Submit success")

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
            <div style={{ fontSize: "1.2rem", lineHeight: "1.6", fontWeight: "500" }}>
              {questions[current].text}
            </div>
          </Card>

          {/* Options - Compact but readable */}
          <div className="mb-4">
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
          </div>
        </div>

        {/* Sidebar - Compact with Timer and Navigator */}
        <div style={{
          width: "280px",
          padding: "20px 15px",
          background: "#111",
          borderLeft: "1px solid #333",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          overflowY: "auto"
        }}>
          {/* Timer Section */}
          <div className="text-center" style={{ background: "#000", padding: "12px", borderRadius: "10px" }}>
            <div style={{ fontSize: "0.8rem", color: "#888", marginBottom: "5px" }}>Time Remaining</div>
            <h2 style={{ color: "#ff6b35", fontSize: "1.8rem", fontWeight: "bold", margin: 0 }}>
              {formatTime(timeLeft)}
            </h2>
            <ProgressBar
              now={(Object.keys(answers).length / questions.length) * 100}
              style={{ background: "#333", height: "4px", marginTop: "10px" }}
            >
              <ProgressBar
                now={(Object.keys(answers).length / questions.length) * 100}
                style={{ background: "#ff6b35" }}
              />
            </ProgressBar>
            <div style={{ fontSize: "0.75rem", color: "#888", marginTop: "8px" }}>
              {Object.keys(answers).length} / {questions.length} answered
            </div>
          </div>

          {/* Question Navigator - Compact Grid */}
          <div>
            <h6 style={{ color: "#ff6b35", marginBottom: "12px", fontSize: "0.9rem" }}>Quick Navigation</h6>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, 1fr)",
              gap: "6px"
            }}>
              {questions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  style={{
                    width: "100%",
                    aspectRatio: "1",
                    background: i === current ? "#ff6b35" : answers[questions[i].id] ? "#28a745" : "#222",
                    border: i === current ? "2px solid #fff" : "none",
                    color: "#fff",
                    fontWeight: "bold",
                    fontSize: "0.85rem",
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
            border: "1px solid #ff6b35",
            minHeight: "120px"
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

                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  style={{ width: "100%" }}
                />
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

          {/* Submit Button at Bottom */}
          <Button
            style={{
              background: "#dc3545",
              border: "none",
              width: "100%",
              fontWeight: "500",
              padding: "8px",
              fontSize: "0.9rem",
              borderRadius: "6px",
              marginTop: "10px"
            }}
            onClick={() => handleSubmit(false)}
            disabled={submitted}
          >
            Submit Exam
          </Button>
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