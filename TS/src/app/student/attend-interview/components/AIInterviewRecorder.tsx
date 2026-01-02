import React, { useEffect, useState, useRef } from 'react'
import { Modal, Button, Spinner, Form, Card, Badge } from 'react-bootstrap'
import axios from 'axios'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

interface Question {
  _id: string
  question: string
}

interface Props {
  show: boolean
  onHide: () => void
  studentId: string
  companyId: string
  roundName: string
  level: string
  selectedTopics: string[]
  onComplete: (score: number, feedback: string, feedbackList: { question: string; score: number; feedback: string }[]) => void
}

const AIInterviewRecorder: React.FC<Props> = ({ show, onHide, studentId, companyId, roundName, level, selectedTopics, onComplete }) => {
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [questions, setQuestions] = useState<Question[]>([])
  const [current, setCurrent] = useState(0)
  const [responses, setResponses] = useState<string[]>([])
  const [transcript, setTranscript] = useState('')
  const [loading, setLoading] = useState(false)
  const [aiScore, setAiScore] = useState<number | null>(null)
  const [aiFeedback, setAiFeedback] = useState<string | null>(null)

  const recognitionRef = useRef<any>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const screenStreamRef = useRef<MediaStream | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const [screenRecordingStarted, setScreenRecordingStarted] = useState(false)
  const [feedbackList, setFeedbackList] = useState<{ question: string; score: number; feedback: string }[]>([])

  const startScreenRecording = async () => {
    if (screenStreamRef.current) return

    try {
      const stream = await (navigator.mediaDevices as any).getDisplayMedia({
        video: true,
        audio: true,
      })
      screenStreamRef.current = stream
      recordedChunksRef.current = []

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' })
        await uploadScreenRecording(blob)
      }

      mediaRecorder.start()
      mediaRecorderRef.current = mediaRecorder
      setScreenRecordingStarted(true)
    } catch (err) {
      toast.error('Screen recording failed.')
      console.error(err)
    }
  }

  const stopScreenRecording = () => {
    mediaRecorderRef.current?.stop()
    screenStreamRef.current?.getTracks().forEach((track) => track.stop())
    mediaRecorderRef.current = null
    screenStreamRef.current = null
    setScreenRecordingStarted(false)
  }

  const uploadScreenRecording = async (blob: Blob) => {
    const formData = new FormData()
    formData.append('studentId', studentId)
    formData.append('companyId', companyId)
    formData.append('roundName', roundName)
    formData.append('video', blob, `${roundName}_${studentId}.webm`)

    try {
      await axios.post(`${baseURL}/upload/screen-recording`, formData)
    } catch (err) {
      console.error('Upload failed:', err)
    }
  }

  useEffect(() => {
    const init = async () => {
      if (!show) return

      if (!selectedTopics || selectedTopics.length === 0) {
        toast.warn('Please select at least one topic before starting.')
        onHide()
        return
      }

      setQuestions([])
      setResponses([])
      setTranscript('')
      setCurrent(0)
      setAiScore(null)
      setAiFeedback(null)

      try {
        const res = await axios.get(`${baseURL}/questions/${companyId}/${roundName}/${level}`, {
          params: {
            topics: selectedTopics,
          },
        })

        setQuestions(res.data)
        setResponses(Array(res.data.length).fill(''))
        await startScreenRecording()
      } catch (err) {
        toast.error('Failed to load questions.')
        console.error(err)
      }
    }

    init()
  }, [show])

  useEffect(() => {
    return () => {
      stopScreenRecording()
    }
  }, [])

  const startVoice = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    if (!SpeechRecognition) {
      toast.error('Speech recognition not supported in this browser.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = true
    recognition.continuous = true

    let finalTranscript = ''

    recognition.onresult = (event: any) => {
      let interimTranscript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptChunk = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcriptChunk + ' '
        } else {
          interimTranscript += transcriptChunk
        }
      }

      setTranscript(finalTranscript + interimTranscript)
    }

    recognition.onerror = (e: any) => {
      console.error('Speech recognition error:', e.error)
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  const stopVoice = () => {
    recognitionRef.current?.stop()
  }

  const handleNext = () => {
    const updated = [...responses]
    updated[current] = transcript.trim()
    setResponses(updated)
    setTranscript('')
    setCurrent((prev) => prev + 1)
  }

  const handleSubmit = async () => {
    stopScreenRecording()
    setLoading(true)
    try {
      const res = await axios.post(`${baseURL}/feedback`, {
        studentId,
        companyId,
        roundName,
        level,
        responses,
      })

      const { averageScore, finalFeedback, feedbackList } = res.data
      setAiScore(averageScore)
      setAiFeedback(finalFeedback)
      onComplete(averageScore, finalFeedback, feedbackList)
      setFeedbackList(feedbackList)
    } catch (err) {
      toast.error('Submission failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Modal show={show} onHide={onHide} size="lg" fullscreen>
        <Modal.Header closeButton>
          <Modal.Title>🎤 AI {roundName} Interview</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {loading ? (
            <div className="text-center">
              <Spinner animation="border" />
            </div>
          ) : aiScore !== null && aiFeedback !== null ? (
            <Card className="shadow mt-4 border-0">
              <Card.Body>
                <h5 className="mb-3">✅ Interview Feedback</h5>

                {/* Overall Score */}
                <div className="mb-3">
                  <strong>Overall Score:</strong>{' '}
                  <Badge bg={aiScore >= 8 ? 'success' : aiScore >= 5 ? 'warning' : 'danger'} className="ms-1">
                    {aiScore}/10
                  </Badge>
                  <div className="mt-2 text-warning">
                    {[...Array(10)].map((_, i) => (
                      <span key={i} style={{ fontSize: '1.2rem' }}>
                        {i < aiScore ? '★' : '☆'}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Question-wise Feedback */}
                {feedbackList?.length > 0 && (
                  <div className="mb-4">
                    <strong>Question-wise Feedback:</strong>
                    {feedbackList.map((item, idx) => (
                      <Card key={idx} className="mt-3 bg-light border-0">
                        <Card.Body>
                          <p>
                            <strong>Q{idx + 1}:</strong> {item.question}
                          </p>
                          <p>
                            <strong>Score:</strong>{' '}
                            <Badge bg={item.score >= 8 ? 'success' : item.score >= 5 ? 'warning' : 'danger'} className="ms-1">
                              {item.score}/10
                            </Badge>
                          </p>
                          <div className="text-warning mb-2">
                            {[...Array(10)].map((_, i) => (
                              <span key={i} style={{ fontSize: '1rem' }}>
                                {i < item.score ? '★' : '☆'}
                              </span>
                            ))}
                          </div>
                          <p style={{ whiteSpace: 'pre-wrap' }}>
                            <strong>Feedback:</strong> {item.feedback}
                          </p>
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Final Overall Feedback */}
                <div className="mb-3">
                  <strong>Final AI Feedback:</strong>
                  <Card className="mt-2 bg-light border-0">
                    <Card.Body style={{ whiteSpace: 'pre-wrap' }}>{aiFeedback}</Card.Body>
                  </Card>
                </div>

                {/* Close Button */}
                <div className="text-end mt-3">
                  <Button
                    onClick={() => {
                      stopScreenRecording()
                      onHide()
                    }}
                    variant="primary">
                    Close
                  </Button>
                </div>
              </Card.Body>
            </Card>
          ) : questions.length > 0 && current < questions.length ? (
            <Card className="p-3">
              <h5>
                Q{current + 1} of {questions.length}
              </h5>
              <p>{questions[current].question}</p>

              <Form.Control
                as="textarea"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                rows={3}
                placeholder="Your spoken or typed answer will appear here..."
              />

              <div className="mt-3">
                <Button onClick={startVoice} variant="primary" className="me-2">
                  🎙️ Start Voice
                </Button>
                <Button onClick={stopVoice} variant="secondary" className="me-2">
                  ⏹️ Stop
                </Button>
                <Button onClick={handleNext} variant="success" disabled={!transcript.trim()}>
                  ➡️ Next
                </Button>
              </div>
            </Card>
          ) : (
            <div className="text-center">
              <h5>✅ All Questions Answered</h5>
              <Button onClick={handleSubmit} variant="success">
                Submit to AI
              </Button>
            </div>
          )}
        </Modal.Body>
      </Modal>

      <ToastContainer position="top-right" autoClose={3000} />
    </>
  )
}

export default AIInterviewRecorder
