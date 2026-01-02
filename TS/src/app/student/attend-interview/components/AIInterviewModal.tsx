import React, { useEffect, useRef, useState } from 'react'
import { Modal, Button, Form, Row, Col, Badge, Alert, Spinner, Card } from 'react-bootstrap'
import { FaMicrophone, FaStop, FaRedo } from 'react-icons/fa'

type Props = {
  show: boolean
  onHide: () => void
  studentId: string
  companyId: string
  roundName: string
  level?: 'Easy' | 'Medium' | 'Hard'
  selectedTopics?: string[]
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

type FeedbackResult = {
  score: number
  feedback: string
  suggestion: string
  rightAnswer: string
}

const AIInterviewModal: React.FC<Props> = ({ show, onHide, studentId, companyId, roundName, level = 'Easy', selectedTopics = [] }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const recognitionRef = useRef<any>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [questions, setQuestions] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answerText, setAnswerText] = useState('')
  const [feedbackResult, setFeedbackResult] = useState<FeedbackResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [loadingQ, setLoadingQ] = useState(false)
  const [error, setError] = useState<string>('')
  const [results, setResults] = useState<{ questionId: string; score: number }[]>([])

  const [recording, setRecording] = useState(false)
  const [listening, setListening] = useState(false)

  // 🔹 Fetch all questions
  useEffect(() => {
    const fetchAll = async () => {
      if (!show || !selectedTopics?.length) return
      setLoadingQ(true)
      try {
        const params = new URLSearchParams({
          round: roundName,
          level,
          topics: selectedTopics.join(','),
        })
        const res = await fetch(`${API_BASE}/api/ai-interview/questions?${params.toString()}`)
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'Failed to fetch questions')
        setQuestions(json)
        setCurrentIndex(0)
      } catch (err: any) {
        console.error(err)
        setQuestions([])
        setError(err.message)
      } finally {
        setLoadingQ(false)
      }
    }
    if (show) fetchAll()
  }, [show, roundName, level, selectedTopics])

  const currentQ = questions[currentIndex]

  // 🎥 Start camera + mic
  const startRecording = async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = 'en-US'

        recognitionRef.current.onstart = () => setListening(true)
        recognitionRef.current.onend = () => setListening(false)

        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = ''
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' '
            }
          }
          if (finalTranscript) {
            setAnswerText((prev) => (prev + ' ' + finalTranscript).trim())
          }
        }

        recognitionRef.current.start()
      }

      setRecording(true)
    } catch (err: any) {
      console.error(err)
      setError('Camera/Mic permission denied.')
    }
  }

  // ⏹ Stop camera + speech
  const stopRecording = () => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    streamRef.current?.getTracks().forEach((t) => t.stop())
    setRecording(false)
    setListening(false)
  }

  const resetRecording = () => {
    stopRecording()
    setAnswerText('')
  }

  const submitAnswer = async () => {
    if (!currentQ || submitting) return
    setSubmitting(true)
    setFeedbackResult(null)

    try {
      const res = await fetch(`${API_BASE}/api/ai-interview/attempt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          companyId,
          roundName,
          level,
          responses: [answerText],
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Submit failed')

      const fb = json.feedbackList?.[0]
      if (fb) {
        setFeedbackResult({
          score: fb.score,
          feedback: fb.feedback,
          suggestion: fb.suggestion,
          rightAnswer: fb.rightAnswer,
        })
        setResults((prev) => [...prev, { questionId: currentQ._id, score: fb.score }])
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleNext = () => {
    setFeedbackResult(null)
    setAnswerText('')
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handleFinish = async () => {
    const total = Math.round(results.reduce((s, r) => s + r.score, 0) / results.length)
    const passed = total >= 60

    await fetch(`${API_BASE}/api/ai-interview/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId,
        companyId,
        roundName,
        level,
        answers: results,
      }),
    })

    alert(passed ? `✅ Passed with ${total}%` : `❌ Failed with ${total}%`)
    onHide()
  }

  useEffect(() => {
    if (!show) stopRecording()
  }, [show])

  return (
    <Modal show={show} onHide={onHide} fullscreen backdrop="static" centered>
      <Modal.Header closeButton>
        <div className="d-flex gap-2">
          <h5 className="mb-0">AI Interview — {roundName}</h5>
          <Badge bg="secondary">{level}</Badge>
        </div>
      </Modal.Header>

      <Modal.Body>
        {loadingQ ? (
          <Spinner />
        ) : !currentQ ? (
          <Alert>No questions</Alert>
        ) : (
          <Row className="h-100">
            {/* Left side: Question + Answer */}
            <Col lg={8} className="d-flex flex-column">
              <h6>
                Question {currentIndex + 1}/{questions.length}
              </h6>
              <div className="p-3 mb-3 rounded bg-dark text-light">{currentQ.question}</div>

              {/* Spoken Answer */}
              <Form.Control
                as="textarea"
                value={answerText}
                readOnly
                placeholder="Your spoken answer will appear here..."
                style={{ minHeight: '80px', maxHeight: '160px', resize: 'vertical' }}
                rows={1}
              />

              {/* Controls */}
              <div className="mt-3 d-flex gap-3">
                {!feedbackResult && (
                  <Button disabled={submitting} onClick={submitAnswer}>
                    {submitting ? 'Submitting...' : 'Submit Answer'}
                  </Button>
                )}
                {feedbackResult && currentIndex < questions.length - 1 && (
                  <Button variant="primary" onClick={handleNext}>
                    Next Question ➡️
                  </Button>
                )}
                {feedbackResult && currentIndex === questions.length - 1 && (
                  <Button variant="success" onClick={handleFinish}>
                    ✅ Finish Interview
                  </Button>
                )}
              </div>

              {/* Feedback Card */}
              {feedbackResult && (
                <Card className="mt-3 shadow-sm">
                  <Card.Body>
                    <h6>
                      Score: <Badge bg={feedbackResult.score >= 6 ? 'success' : 'danger'}>{feedbackResult.score}/10</Badge>
                    </h6>
                    <p className="mb-1">
                      <strong>Feedback:</strong> {feedbackResult.feedback}
                    </p>
                    <p className="mb-1">
                      <strong>Right Answer:</strong> {feedbackResult.rightAnswer}
                    </p>
                    <p className="mb-0 text-muted fst-italic">
                      <strong>Example Answer:</strong> {feedbackResult.suggestion}
                    </p>
                  </Card.Body>
                </Card>
              )}
            </Col>

            {/* Right side: Camera */}
            <Col lg={4} className="d-flex flex-column align-items-center justify-content-start">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="rounded bg-dark"
                style={{ width: '300px', height: '220px', objectFit: 'cover' }}
              />

              <div className="mt-3 d-flex gap-3">
                {!recording && (
                  <Button variant="danger" onClick={startRecording}>
                    <FaMicrophone /> Start
                  </Button>
                )}
                {recording && (
                  <Button variant="warning" onClick={stopRecording}>
                    <FaStop /> Stop
                  </Button>
                )}
                {!recording && answerText && (
                  <Button variant="secondary" onClick={resetRecording}>
                    <FaRedo /> Re-record
                  </Button>
                )}
              </div>

              {listening && <div className="text-success mt-2 fw-bold">🎤 Listening...</div>}
            </Col>
          </Row>
        )}
      </Modal.Body>
    </Modal>
  )
}

export default AIInterviewModal
