import React, { useEffect, useState, useRef } from 'react'
import VoiceAnswer from './VoiceAnswer'
import { useAuthContext } from '@/context/useAuthContext'
import { Card, Spinner, Button, Alert, Badge } from 'react-bootstrap'
import VideoRecorder from './VideoRecorder'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import './InterviewSession.css'

interface InterviewSessionProps {
  interviewId: string
  questions: string[]
  setLoadingFeedback: React.Dispatch<React.SetStateAction<boolean>>
  isFullscreen?: boolean
}

interface AnswerItem {
  question: string
  answer: string
  videoPath?: string
  feedback?: string
  idealAnswer?: string
  improvementTips?: string[]
  rating?: number
  timestamp?: string
  isFollowUp?: boolean
  exampleProgram?: {
    title: string
    language: string
    code: string
  }
}

const FOLLOW_UP_THRESHOLD = 4
const MAX_FOLLOW_UPS = 1

const InterviewSession: React.FC<InterviewSessionProps> = ({ interviewId, questions, setLoadingFeedback, isFullscreen }) => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()
  const token = user?.token

  const [questionsQueue, setQuestionsQueue] = useState<string[]>([questions[0]])
  const [questionIndex, setQuestionIndex] = useState(0)
  const [mainQuestionIndex, setMainQuestionIndex] = useState(0)
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [currentVideoUrl, setCurrentVideoUrl] = useState('')
  const [answers, setAnswers] = useState<AnswerItem[]>([])
  const [interviewFinished, setInterviewFinished] = useState(false)
  const [finalFeedback, setFinalFeedback] = useState<string>('')
  const [avatarVideoUrl, setAvatarVideoUrl] = useState('')
  const [loadingAvatar, setLoadingAvatar] = useState(false)
  const [loadingEvaluation, setLoadingEvaluation] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [currentFeedback, setCurrentFeedback] = useState<AnswerItem | null>(null)
  const [isFollowUp, setIsFollowUp] = useState(false)
  const [pendingFollowUp, setPendingFollowUp] = useState<string | null>(null)
  const [awaitingFollowUp, setAwaitingFollowUp] = useState(false)
  const [followUpCount, setFollowUpCount] = useState(0)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [robotStatus, setRobotStatus] = useState<'idle' | 'speaking' | 'processing' | 'listening'>('idle')
  const [eyeMovement, setEyeMovement] = useState({ left: 0, right: 0 })
  const [ledColor, setLedColor] = useState<'blue' | 'green' | 'yellow' | 'red'>('blue')
  const pdfRef = useRef<HTMLDivElement>(null)
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null)
  const eyeMovementRef = useRef<NodeJS.Timeout>()
  const [isIntroDone, setIsIntroDone] = useState(false);


  const currentQuestion = questionsQueue[questionIndex]

  // Professional robot status management
  useEffect(() => {
    if (isSpeaking) {
      setRobotStatus('speaking')
      setLedColor('blue')
    } else if (loadingEvaluation) {
      setRobotStatus('processing')
      setLedColor('yellow')
    } else if (showFeedback) {
      setRobotStatus('idle')
      setLedColor('green')
    } else {
      setRobotStatus('listening')
      setLedColor('blue')
    }
  }, [isSpeaking, loadingEvaluation, showFeedback])

  // Realistic eye movement animation
  useEffect(() => {
    if (eyeMovementRef.current) {
      clearInterval(eyeMovementRef.current)
    }

    const moveEyes = () => {
      setEyeMovement({
        left: Math.random() * 10 - 5,
        right: Math.random() * 10 - 5
      })
    }

    if (robotStatus === 'speaking' || robotStatus === 'listening') {
      eyeMovementRef.current = setInterval(moveEyes, 2000)
    } else {
      eyeMovementRef.current = setInterval(moveEyes, 4000)
    }

    return () => {
      if (eyeMovementRef.current) {
        clearInterval(eyeMovementRef.current)
      }
    }
  }, [robotStatus])

// --- AI Interview Intro + Question Speech ---
useEffect(() => {
  // Skip if no questions
  if (!questions.length) return

  // Intro should play first before first question
  if (!isIntroDone) {
    const introText = "Welcome to the AI Interview. My name is Eklav. Let's start the interview.";
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(introText);
      speechSynthRef.current = utterance;

      utterance.onstart = () => {
        setIsSpeaking(true);
        setRobotStatus('speaking');
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setRobotStatus('listening');
        setTimeout(() => setIsIntroDone(true), 600); // small gap before first question
      };

      utterance.rate = 0.9;
      utterance.pitch = 0.9;
      utterance.volume = 1;

      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v =>
        v.name.includes('Google UK English Male') ||
        v.name.includes('Microsoft David') ||
        v.lang.includes('en-US')
      );
      if (voice) utterance.voice = voice;
      window.speechSynthesis.speak(utterance);
    }
    return; // prevent question speech until intro finishes
  }

  // --- Speak the current question ---
  if (!currentQuestion) return;

  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(currentQuestion);
    speechSynthRef.current = utterance;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setRobotStatus('speaking');
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setRobotStatus('listening');
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setRobotStatus('idle');
    };

    utterance.rate = 0.85;
    utterance.pitch = 0.7;
    utterance.volume = 0.9;

    const voices = window.speechSynthesis.getVoices();
    const professionalVoice = voices.find(v =>
      v.name.includes('Microsoft David') ||
      v.name.includes('Google UK English Male') ||
      v.name.includes('Alex') ||
      v.lang.includes('en-US')
    );
    if (professionalVoice) utterance.voice = professionalVoice;

    setTimeout(() => window.speechSynthesis.speak(utterance), 600);
  }

  return () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setRobotStatus('idle');
  };
}, [currentQuestion, isIntroDone]);


  const downloadPDF = async () => {
    if (!pdfRef.current) return
    const canvas = await html2canvas(pdfRef.current)
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const imgProps = pdf.getImageProperties(imgData)
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
    pdf.save('interview-feedback.pdf')
  }

  const handleSubmit = async () => {
    if (loadingEvaluation) return 
    const trimmedAnswer = currentAnswer.trim()
    if (!trimmedAnswer) return alert('Please provide your answer')

    setLoadingEvaluation(true)
    setRobotStatus('processing')

    const updatedAnswer: AnswerItem = {
      question: currentQuestion,
      answer: trimmedAnswer,
      videoPath: currentVideoUrl || '',
      timestamp: new Date().toISOString(),
      isFollowUp: isFollowUp,
    }

    try {
      const res = await fetch(`${baseURL}/evaluate-answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          topic: currentQuestion,
          question: currentQuestion,
          answer: trimmedAnswer,
        }),
      })

      const data = await res.json()

      updatedAnswer.feedback = data.feedback
      updatedAnswer.idealAnswer = data.idealAnswer
      updatedAnswer.improvementTips = data.improvementTips
      updatedAnswer.rating = data.rating?.total || 0
      updatedAnswer.exampleProgram = data.exampleProgram || null

      setAnswers((prev) => [...prev, updatedAnswer])
      setCurrentFeedback(updatedAnswer)
      setShowFeedback(true)
      setRobotStatus('idle')

      const ratingPercent = data.rating?.total || 0

      if (ratingPercent >= FOLLOW_UP_THRESHOLD && data.followUpQuestion && followUpCount < MAX_FOLLOW_UPS && !isFollowUp) {
        const followUp = data.followUpQuestion
        setQuestionsQueue((prev) => [...prev, followUp])
        setPendingFollowUp(followUp)
        setAwaitingFollowUp(true)
      } else {
        setPendingFollowUp(null)
        setAwaitingFollowUp(false)
      }

      setCurrentAnswer('')
      setCurrentVideoUrl('')
    } catch (err) {
      console.error('Evaluation failed', err)
      setRobotStatus('idle')
    } finally {
      setLoadingEvaluation(false)
    }
  }

  const handleNext = () => {
    if (!showFeedback) {
      alert('Please submit your answer first.')
      return
    }

    setShowFeedback(false)
    setCurrentFeedback(null)
    setRobotStatus('speaking')

    if (pendingFollowUp && !isFollowUp) {
      setIsFollowUp(true)
      setFollowUpCount((prev) => prev + 1)
      setPendingFollowUp(null)
      setAwaitingFollowUp(false)
      setQuestionIndex((prev) => prev + 1)
      return
    }

    if (!isFollowUp) {
      setFollowUpCount(0)
    }

    setIsFollowUp(false)
    setPendingFollowUp(null)
    setAwaitingFollowUp(false)

    if (mainQuestionIndex + 1 < questions.length) {
      const nextMainQuestion = questions[mainQuestionIndex + 1]
      setMainQuestionIndex((prev) => prev + 1)
      setQuestionsQueue((prev) => [...prev, nextMainQuestion])
      setQuestionIndex((prev) => prev + 1)
    } else {
      handleFinish(answers)
    }
  }

  const handleFinish = async (finalAnswers: AnswerItem[]) => {
    setInterviewFinished(true)
    setLoadingFeedback(true)
    setRobotStatus('processing')
    try {
      const res = await fetch(`${baseURL}/final-feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ interviewId, answers: finalAnswers }),
      })
      const data = await res.json()
      setFinalFeedback(data.feedback)
      setRobotStatus('idle')
    } catch (err) {
      console.error('Final feedback error', err)
      setRobotStatus('idle')
    } finally {
      setLoadingFeedback(false)
    }
  }

  const getStatusMessage = () => {
    switch (robotStatus) {
      case 'speaking': return 'Asking question...'
      case 'listening': return 'Listening for response...'
      case 'processing': return 'Analyzing answer...'
      case 'idle': return 'Ready for next question'
      default: return 'System ready'
    }
  }

  return (
    <div className="mt-4">
      {!interviewFinished ? (
        <Card className="p-0 border-0 text-white" style={{ background: 'transparent' }}>
          <div className="d-flex flex-column flex-md-row align-items-stretch">
            {/* Professional Robot Interviewer Panel */}
            <div className="flex-fill d-flex flex-column align-items-center justify-content-start p-3 glass-panel" style={{ height: '400px' }}>
              <div className="text-center mb-3">
                <h6 className="mb-2">🤖 AI Interviewer</h6>
                <div className="professional-robot-container">
                  {/* Robot Head with Professional Design */}
                  <div className="robot-head-professional">
                    {/* Status LED */}
                    <div className={`status-led led-${ledColor}`}></div>

                    {/* Antenna */}
                    <div className="robot-antenna">
                      <div className="antenna-base"></div>
                      <div className="antenna-rod"></div>
                      <div className="antenna-tip"></div>
                    </div>

                    {/* Face Screen */}
                    <div className="robot-face">
                      {/* Eyes */}
                      <div className="robot-eyes-professional">
                        <div className="robot-eye-professional" style={{ transform: `translate(${eyeMovement.left}px, ${eyeMovement.right}px)` }}>
                          <div className="eye-pupil-professional"></div>
                        </div>
                        <div className="robot-eye-professional" style={{ transform: `translate(${eyeMovement.right}px, ${eyeMovement.left}px)` }}>
                          <div className="eye-pupil-professional"></div>
                        </div>
                      </div>

                      {/* Mouth/Status Display */}
                      <div className={`robot-display ${robotStatus}`}>
                        <div className="display-content">
                          {robotStatus === 'speaking' && '📢'}
                          {robotStatus === 'listening' && '🎤'}
                          {robotStatus === 'processing' && '⚡'}
                          {robotStatus === 'idle' && '✅'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status Information */}
                  <div className="robot-status-info mt-3">
                    <Badge bg="dark" className="p-2 status-badge">
                      <span className="status-indicator"></span>
                      {getStatusMessage()}
                    </Badge>
                    <div className="mt-2">
                      <small className="text-muted">
                        Question {mainQuestionIndex + 1} of {questions.length}
                        {isFollowUp && ' • Follow-up'}
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Question Panel */}
            <div
              className="flex-fill d-flex justify-content-center align-items-center glass-panel border-start border-end border-secondary"
              style={{ minHeight: '220px' }}>
              <div className="text-center">
                <h4 className="fw-semibold" style={{ lineHeight: '1.6' }}>
                  🎯 Interview Question
                </h4>
                <p className="fs-5 mt-3" style={{ color: '#e9ecef' }}>
                  {currentQuestion}
                </p>
                {isFollowUp && (
                  <div className="mt-2">
                    <Badge bg="warning" text="dark" className="px-3 py-2 rounded-pill fs-6">
                      🔁 Follow-up Question
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Video Response Panel */}
            <div className="flex-fill p-3 d-flex justify-content-center align-items-center glass-panel">
              <div className="text-center">
                <h6 className="mb-1">🎥 Your Response</h6>
                <VideoRecorder
                  interviewId={interviewId}
                  token={token}
                  stopRecording={interviewFinished}
                  onVideoUpload={(url) => setCurrentVideoUrl(url)}
                />
                <div className="mt-2">
                  <small className="text-muted">Record your answer clearly and professionally</small>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section: Voice + Feedback */}
          <div className="glass-panel text-white p-4 rounded-4 shadow">
            <VoiceAnswer
              answer={currentAnswer}
              onChange={setCurrentAnswer}
              onSubmit={handleSubmit}
              onNext={handleNext}
              isLastQuestion={false}
              disabled={loadingEvaluation || showFeedback}
            />

            {loadingEvaluation && (
              <div
                className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-opacity-50"
                style={{ zIndex: 1050 }}>
                <div className="text-center">
                  <Spinner animation="border" variant="light" />
                  <p className="text-light mt-2 fw-semibold">AI is analyzing your response...</p>
                </div>
              </div>
            )}

            {showFeedback && currentFeedback && !loadingEvaluation && (
              <Alert variant="info" className="mt-3">
                <div className="d-flex align-items-center mb-2">
                  <span className="fs-4">📊</span>
                  <h5 className="mb-0 ms-2">AI Feedback</h5>
                </div>
                <p>
                  <strong>Analysis:</strong> {currentFeedback.feedback}
                </p>
                <p>
                  <strong>Expected Answer:</strong> {currentFeedback.idealAnswer}
                </p>
                {currentFeedback.improvementTips && (
                  <>
                    <strong>Improvement Suggestions:</strong>
                    <ul className="mt-2">
                      {currentFeedback.improvementTips.map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </>
                )}
                {currentFeedback.exampleProgram && (
                  <div className="mt-3">
                    <strong>📘 Example Program: {currentFeedback.exampleProgram.title}</strong>
                    <p>
                      <em>Language:</em> {currentFeedback.exampleProgram.language}
                    </p>

                    <pre className="bg-dark text-white p-3 rounded">
                      <code>{currentFeedback.exampleProgram.code}</code>
                    </pre>
                  </div>
                )}
                <p>
                  <strong>Performance Score:</strong>{' '}
                  {typeof currentFeedback.rating === 'number' ? (
                    <Badge bg={currentFeedback.rating >= 7 ? 'success' : currentFeedback.rating >= 4 ? 'warning' : 'danger'}>
                      {currentFeedback.rating}/10
                    </Badge>
                  ) : (
                    <Badge bg="secondary">N/A</Badge>
                  )}
                </p>
                <Button onClick={handleNext} variant="primary">
                  {pendingFollowUp ? 'Continue to Follow-up' : 'Next Question'}
                </Button>
              </Alert>
            )}
          </div>
        </Card>
      ) : (
        <div className="text-center">
          <h4>🎉 Interview Completed!</h4>
          {finalFeedback ? (
            <>
              <div ref={pdfRef}>
                <Alert variant="success" className="mt-3 text-start">
                  <h5>📋 Final Feedback Summary</h5>
                  {Array.isArray(finalFeedback) ? (
                    finalFeedback.map((item, i) => (
                      <div key={i} className="mb-4 border-bottom pb-3">
                        <p>
                          <strong>Question {i + 1}:</strong> {item.question}
                        </p>
                        <p>
                          <strong>Your Answer:</strong> {item.answer}
                        </p>
                        <p>
                          <strong>AI Feedback:</strong> {item.feedback}
                        </p>
                        <p>
                          <strong>Expected Answer:</strong> {item.idealAnswer}
                        </p>
                        {item.improvementTips?.length > 0 && (
                          <>
                            <strong>Improvement Areas:</strong>
                            <ul>
                              {item.improvementTips.map((tip: any, j: any) => (
                                <li key={j}>{tip}</li>
                              ))}
                            </ul>
                          </>
                        )}
                        {item.exampleProgram && (
                          <div className="mt-2">
                            <strong>📘 Example Program: {item.exampleProgram.title}</strong>
                            <p>
                              <em>Language:</em> {item.exampleProgram.language}
                            </p>

                            <pre className="bg-light p-2 border rounded">
                              <code>{item.exampleProgram.code}</code>
                            </pre>
                          </div>
                        )}
                        <p>
                          <strong>Score:</strong>{' '}
                          <Badge bg={item.rating?.total >= 7 ? 'success' : item.rating?.total >= 4 ? 'warning' : 'danger'}>
                            {item.rating?.total || 0} / 10
                          </Badge>
                        </p>
                      </div>
                    ))
                  ) : (
                    <p>No feedback available.</p>
                  )}
                </Alert>
              </div>

              <Button variant="outline-primary" onClick={downloadPDF}>
                📄 Download PDF Summary
              </Button>
            </>
          ) : (
            <div className="mt-3">
              <Spinner animation="border" variant="primary" />
              <span>Generating comprehensive feedback...</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default InterviewSession