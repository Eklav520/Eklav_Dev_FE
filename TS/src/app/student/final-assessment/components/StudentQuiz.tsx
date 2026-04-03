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
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 320 },
          height: { ideal: 240 },
          facingMode: "user"
        },
        audio: true,
      })

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

        setTimeout(() => {
          startCameraRecording()
        }, 300)
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
          handleSubmit(true)
          return 0
        }

        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [submitted])

  // ================= SELECT OPTION =================
  const selectOption = (key: string) => {
    if (submitted) return

    const q = questions[current]

    setAnswers(prev => ({
      ...prev,
      [q.id]: key
    }))
  }

  // ================= SUBMIT =================
  const handleSubmit = async (auto = false) => {
    if (submitted) return

    setSubmitted(true)
    stopCameraRecording()

    try {
      let recordingUrl = ""

      /* =========================
         1. UPLOAD VIDEO (S3)
      ========================= */
      if (recordedChunks.current.length > 0) {
        const blob = new Blob(recordedChunks.current, { type: "video/webm" })
        const fileName = `quiz_${Date.now()}.webm`

        // 🔥 Get presigned URL
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

        // 🔥 Upload to S3
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
      }

      /* =========================
         2. FORMAT ANSWERS
      ========================= */
      const formattedAnswers = questions
        .map((q) => ({
          qid: q.id,
          questionText: q.text,
          textAnswer: answers[q.id] || "",
          mediaPath: "",
          mediaType: "none",
          rating: 0,
          feedback: ""
        }))
        .filter(a => a.textAnswer !== "") // 🔥 CRITICAL

      /* =========================
         3. SUBMIT ROUND
      ========================= */
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
        throw new Error("Failed to submit exam")
      }

    } catch (err) {
      console.error("❌ Submit Error:", err)

      // Optional: show user alert
      alert("Something went wrong while submitting. Please try again.")
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
            {current === questions.length - 1 ? (
              <Button
                style={{
                  background: "#28a745",
                  border: "none",
                  padding: "8px 32px",
                  borderRadius: "6px",
                  fontWeight: "500"
                }}
                onClick={() => handleSubmit(false)}
                disabled={submitted}
              >
                Submit Exam
              </Button>
            ) : (
              <Button
                onClick={() => setCurrent(p => p + 1)}
                style={{
                  background: "#ff6b35",
                  border: "none",
                  padding: "8px 24px",
                  borderRadius: "6px"
                }}
              >
                Next →
              </Button>
            )}
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

          {/* Camera Preview - Small and at bottom */}
          {cameraStream && (
            <div style={{
              marginTop: "auto",
              background: "#000",
              borderRadius: "8px",
              overflow: "hidden",
              border: "1px solid #ff6b35"
            }}>
              <div style={{
                background: "#ff6b35",
                padding: "4px 8px",
                fontSize: "10px",
                color: "#fff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <span>📹 Recording</span>
                {isRecording && (
                  <span style={{
                    display: "inline-block",
                    width: "8px",
                    height: "8px",
                    background: "#ff0000",
                    borderRadius: "50%",
                    animation: "pulse 1s infinite"
                  }}></span>
                )}
              </div>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                style={{
                  width: "100%",
                  height: "auto",
                  background: "#000",
                  display: "block"
                }}
              />
            </div>
          )}

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