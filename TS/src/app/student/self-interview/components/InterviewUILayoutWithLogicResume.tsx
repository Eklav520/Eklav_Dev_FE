// InterviewUILayoutWithLogicResume.tsx
import React, { useEffect, useRef, useState } from 'react'
import { Container, Row, Col, Card, Form, Button, Badge, Spinner } from 'react-bootstrap'
import { useAuthContext } from '@/context/useAuthContext'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import './InterviewLayout.css'
import VideoRecorderUpdated from './VideoRecorderUpdated'
import RobotAvatarSVG from './RobotAvatarSVG'
import Avatar from './LetterAvatar'
import CircularScore from './CircularScore'
import GlowMic from './GlowMic'
import { FaMicrophone, FaCode } from 'react-icons/fa'

/* ---------------- TYPES ---------------- */

type AnswerItem = {
  question: string
  answer: string
  example?: string
  videoPath?: string
  feedback?: {
    theory?: string
    example?: string
  }
  idealAnswer?: string
  improvementTips?: string[]
  rating?: number
  timestamp?: string
  isFollowUp?: boolean
  exampleProgram?: { title: string; language: string; code: string } | null
  fixedExampleCode?: string
}

interface Props {
  interviewId: string
  questions: string[]
  title: string
  resumeId: string              // ⬅ REQUIRED
  setLoadingFeedback?: React.Dispatch<React.SetStateAction<boolean>>
  isFullscreen?: boolean
}

const QUESTION_TIME = 60

/* ========================================================= */

const InterviewUILayoutWithLogicResume: React.FC<Props> = ({
  interviewId,
  questions,
  title,
  resumeId,
  setLoadingFeedback,
}) => {
  const { user } = useAuthContext()
  const token = user?.token
  const baseURL = import.meta.env.VITE_API_BASE_URL || ''

  /* ---------------- FLOW ---------------- */

  const [questionsQueue, setQuestionsQueue] = useState<string[]>(questions.length ? [questions[0]] : [])
  const [questionIndex, setQuestionIndex] = useState(0)
  const [mainQuestionIndex, setMainQuestionIndex] = useState(0)
  const currentQuestion = questionsQueue[questionIndex] || ''

  /* ---------------- ANSWERS ---------------- */

  const [currentAnswer, setCurrentAnswer] = useState('')
  const [transcript, setTranscript] = useState('')
  const [currentVideoUrl, setCurrentVideoUrl] = useState('')
  const [answers, setAnswers] = useState<AnswerItem[]>([])
  const [currentExample, setCurrentExample] = useState('')
  const [answerTab, setAnswerTab] = useState<'transcript' | 'code'>('transcript')
  const [hasSubmitted, setHasSubmitted] = useState(false)

  /* ---------------- UI ---------------- */

  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [robotStatus, setRobotStatus] = useState<'idle' | 'speaking' | 'listening' | 'processing'>('idle')

  /* ---------------- FEEDBACK ---------------- */

  const [loadingEvaluation, setLoadingEvaluation] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [currentFeedback, setCurrentFeedback] = useState<AnswerItem | null>(null)
  const [finalFeedback, setFinalFeedback] = useState<any>(null)
  const [interviewFinished, setInterviewFinished] = useState(false)

  /* ---------------- SPEECH ---------------- */

  const recognitionRef = useRef<any>(null)
  const finalRef = useRef('')
  const listeningHardRef = useRef(false)

  const getSpeechCtor = () =>
    (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition

  /* ---------------- TIMER ---------------- */

  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME)
  const timerRef = useRef<any>(null)

  useEffect(() => {
    if (!isListening) return
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          stopListening()
          handleEvaluate()
          return QUESTION_TIME
        }
        return t - 1
      })
    }, 1000)

    return () => clearInterval(timerRef.current)
  }, [isListening])

  /* ---------------- LISTENING ---------------- */

  const ensureRecognition = () => {
    if (recognitionRef.current) return recognitionRef.current
    const Ctor = getSpeechCtor()
    if (!Ctor) return null

    const rec = new Ctor()
    rec.lang = 'en-US'
    rec.interimResults = true
    rec.continuous = true

    rec.onresult = (e: any) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const text = e.results[i][0].transcript
        if (e.results[i].isFinal) finalRef.current += text + ' '
        else interim += text
      }
      setTranscript((finalRef.current + interim).trim())
    }

    rec.onstart = () => {
      setIsListening(true)
      listeningHardRef.current = true
    }

    rec.onend = () => {
      setIsListening(false)
      if (listeningHardRef.current) {
        try { rec.start() } catch {}
      }
    }

    recognitionRef.current = rec
    return rec
  }

  const startListening = async () => {
    const rec = ensureRecognition()
    if (!rec) return
    finalRef.current = ''
    setTranscript('')
    setTimeLeft(QUESTION_TIME)
    rec.start()
  }

  const stopListening = () => {
    listeningHardRef.current = false
    try { recognitionRef.current?.stop() } catch {}
    setIsListening(false)
  }

  /* ---------------- EVALUATE ---------------- */

  const handleEvaluate = async () => {
    if (loadingEvaluation || hasSubmitted) return

    const finalTheory = currentAnswer.trim() || transcript.trim()
    if (!finalTheory && !currentExample.trim()) {
      alert('Please answer before submitting.')
      return
    }

    stopListening()
    setLoadingEvaluation(true)
    setRobotStatus('processing')

    // 🔥 RESUME-AWARE PAYLOAD
    const payload = {
      interviewType: 'resume',
      resumeId,
      topic: title,
      question: currentQuestion,
      answer: {
        theory: finalTheory,
        example: currentExample,
      },
    }

    try {
      const res = await fetch(`${baseURL}/evaluate-answer-updated`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      const newAnswer: AnswerItem = {
        question: currentQuestion,
        answer: finalTheory,
        example: currentExample,
        videoPath: currentVideoUrl,
        feedback: data.feedback,
        idealAnswer: data.idealAnswer,
        improvementTips: data.improvementTips || [],
        rating: data.rating?.total ?? 0,
        exampleProgram: data.exampleProgram ?? null,
        fixedExampleCode: data.fixedExampleCode || '',
        timestamp: new Date().toISOString(),
      }

      setAnswers((p) => [...p, newAnswer])
      setCurrentFeedback(newAnswer)
      setShowFeedback(true)
      setHasSubmitted(true)
    } catch (err) {
      console.error(err)
      alert('Evaluation failed')
    } finally {
      setLoadingEvaluation(false)
      setRobotStatus('idle')
      setCurrentAnswer('')
      setTranscript('')
      setCurrentExample('')
    }
  }

  /* ---------------- NEXT ---------------- */

  const handleNext = () => {
    if (!showFeedback) return

    setShowFeedback(false)
    setCurrentFeedback(null)
    setHasSubmitted(false)
    finalRef.current = ''
    setTranscript('')

    if (mainQuestionIndex + 1 === questions.length) {
      finishInterview([...answers])
      return
    }

    const nextQ = questions[mainQuestionIndex + 1]
    setQuestionsQueue((q) => [...q, nextQ])
    setMainQuestionIndex((i) => i + 1)
    setQuestionIndex((i) => i + 1)
  }

  /* ---------------- FINISH ---------------- */

  const finishInterview = async (finalAnswers: AnswerItem[]) => {
    setInterviewFinished(true)
    setRobotStatus('processing')

    const res = await fetch(`${baseURL}/final-feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ interviewId, answers: finalAnswers }),
    })

    const data = await res.json()
    setFinalFeedback(data)
    setRobotStatus('idle')
  }

  /* ========================================================= */

return (
  <div className="interview-layout-with-logic">
    <Container fluid className="p-4 interview-page-bg">
      {/* HEADER */}
      <Row className="mb-4 align-items-center">
        <Col>
          <h3 className="fw-bold d-flex align-items-center gap-2">
            Interview for {title}
            <Badge bg="info">Resume Based</Badge>
          </h3>
        </Col>
        <Col xs="auto" className="d-flex align-items-center">
          <Avatar
            name={user?.fullName || 'User'}
            image={user?.profileImage}
            size={40}
            className="me-2"
          />
          <strong>{user?.email ?? 'Student'}</strong>
        </Col>
      </Row>

      {!interviewFinished ? (
        <Row className="g-4">
          {/* LEFT PANEL */}
          <Col md={7}>
            <Card className="shadow-sm p-3 mb-4 rounded-4">
              <div className="video-container rounded-4 position-relative">
                <div className="main-video">
                  <VideoRecorderUpdated
                    interviewId={interviewId}
                    token={token}
                    stopRecording={false}
                    onVideoUpload={(url: string) => setCurrentVideoUrl(url)}
                  />
                </div>

                {isListening && (
                  <div className="d-flex justify-content-center my-3">
                    <GlowMic listening={isListening} />
                  </div>
                )}

                <div className="small-video-group">
                  <div className="small-video participant">
                    <RobotAvatarSVG size={160} status={robotStatus} />
                  </div>
                </div>
              </div>

              {/* CONTROLS */}
              <div className="d-flex justify-content-center gap-4 mt-3">
                <Button
                  variant="success"
                  onClick={startListening}
                  disabled={showFeedback || hasSubmitted}
                >
                  Start
                </Button>

                <Button
                  variant="primary"
                  onClick={handleNext}
                  disabled={!showFeedback}
                >
                  Next
                </Button>
              </div>

              {/* STATUS */}
              <div className="text-center mt-3">
                {isListening ? (
                  <>
                    <span className="fw-semibold text-success">🎤 Listening...</span>
                    <div
                      style={{
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: timeLeft < 10 ? 'red' : '#555',
                      }}
                    >
                      ⏳ {timeLeft}s
                    </div>
                  </>
                ) : (
                  <span className="text-muted">Press Start to answer</span>
                )}
              </div>

              {/* AI FEEDBACK */}
              <Card className="p-4 shadow-sm rounded-4 mt-4">
                <h5>📊 AI Feedback</h5>

                {!currentFeedback && (
                  <p className="text-muted">
                    Submit your answer to see feedback.
                  </p>
                )}

                {currentFeedback && (
                  <>
                    <h6 className="fw-bold">Theory</h6>
                    <p>{currentFeedback.feedback?.theory}</p>

                    <h6 className="fw-bold mt-3">Code Feedback</h6>
                    <p>{currentFeedback.feedback?.example}</p>

                    {currentFeedback.fixedExampleCode && (
                      <pre className="bg-dark text-white p-3 rounded">
                        <code>{currentFeedback.fixedExampleCode}</code>
                      </pre>
                    )}

                    <h6 className="fw-bold mt-3">Expected Answer</h6>
                    <p>{currentFeedback.idealAnswer}</p>
                  </>
                )}
              </Card>
            </Card>
          </Col>

          {/* RIGHT PANEL */}
          <Col md={5}>
            <Card className="shadow-sm p-4 rounded-4">
              <div className="mb-3 d-flex justify-content-between">
                <div>
                  <h6>Interview Question</h6>
                  <p>{currentQuestion}</p>
                  <small className="text-muted">
                    Question {mainQuestionIndex + 1} of {questions.length}
                  </small>
                </div>

                {currentFeedback ? (
                  <CircularScore score={currentFeedback.rating ?? 0} size={55} />
                ) : (
                  <Badge bg="secondary">--</Badge>
                )}
              </div>

              {/* TABBED: Voice Transcript / Code Editor */}
              <div className="mb-3" style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)' }}>
                  <button
                    onClick={() => setAnswerTab('transcript')}
                    style={{
                      flex: 1, padding: '11px 0', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                      background: answerTab === 'transcript' ? 'rgba(255,122,0,0.12)' : 'transparent',
                      color: answerTab === 'transcript' ? '#ff7a00' : '#94a3b8',
                      borderBottom: answerTab === 'transcript' ? '2px solid #ff7a00' : '2px solid transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    }}>
                    <FaMicrophone size={13} /> Voice Transcript
                  </button>
                  <button
                    onClick={() => setAnswerTab('code')}
                    style={{
                      flex: 1, padding: '11px 0', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                      background: answerTab === 'code' ? 'rgba(99,102,241,0.12)' : 'transparent',
                      color: answerTab === 'code' ? '#818cf8' : '#94a3b8',
                      borderBottom: answerTab === 'code' ? '2px solid #818cf8' : '2px solid transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    }}>
                    <FaCode size={13} /> Code Editor
                  </button>
                </div>
                {answerTab === 'transcript' ? (
                  <div className="transcript-box p-3" style={{ minHeight: 180, maxHeight: 260, overflowY: 'auto' }}>
                    {transcript || 'Start speaking...'}
                  </div>
                ) : (
                  <Form.Control
                    as="textarea"
                    rows={8}
                    style={{ borderRadius: 0, border: 'none', background: '#1e1e2e', color: '#cdd6f4', resize: 'none', fontFamily: 'monospace', fontSize: '0.82rem' }}
                    value={currentExample}
                    onChange={(e) => setCurrentExample(e.target.value)}
                  />
                )}
              </div>

              <Button
                variant="primary"
                className="fw-bold"
                disabled={loadingEvaluation || hasSubmitted}
                onClick={handleEvaluate}
              >
                {loadingEvaluation ? (
                  <>
                    <Spinner size="sm" /> Analyzing...
                  </>
                ) : mainQuestionIndex + 1 === questions.length ? (
                  'Finish Interview'
                ) : (
                  'Submit Answer'
                )}
              </Button>
            </Card>
          </Col>
        </Row>
      ) : (
        /* FINAL */
        <div className="text-center p-5">
          <h4 className="fw-bold">🎉 Interview Completed!</h4>
          <Spinner animation="border" className="mt-3" />
        </div>
      )}
    </Container>
  </div>
)


}

export default InterviewUILayoutWithLogicResume
