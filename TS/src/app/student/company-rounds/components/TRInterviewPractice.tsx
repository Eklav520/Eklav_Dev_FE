import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Badge, Button, ProgressBar } from 'react-bootstrap'

type InterviewQuestion = {
  _id: string
  question?: string
  title?: string
  description?: string
}

type InterviewRound = {
  _id: string
  roundName: string
  questions: InterviewQuestion[]
}

type AnswerEntry = {
  qid: string
  questionText: string
  textAnswer: string
}

type Props = {
  round: InterviewRound
  companyName: string
  role?: string
  onClose: () => void
  onAttemptComplete?: (answers: AnswerEntry[]) => void
}

const INTERVIEW_QUESTION_LIMIT = 10

const getRandomQuestions = (questions: InterviewQuestion[], limit: number) => {
  const shuffled = [...questions]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    const current = shuffled[index]
    shuffled[index] = shuffled[randomIndex]
    shuffled[randomIndex] = current
  }

  return shuffled.slice(0, Math.min(limit, shuffled.length))
}

const MicIcon = ({ active }: { active: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {active ? (
      <>
        <line x1="1" y1="1" x2="23" y2="23" />
        <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
        <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </>
    ) : (
      <>
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </>
    )}
  </svg>
)

const TRInterviewPractice: React.FC<Props> = ({ round, companyName, role, onAttemptComplete }) => {
  const [interviewQuestions, setInterviewQuestions] = useState<InterviewQuestion[]>([])
  const [interviewAnswers, setInterviewAnswers] = useState<Record<string, string>>({})
  const [interviewIndex, setInterviewIndex] = useState(0)
  const [interviewReview, setInterviewReview] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [interimText, setInterimText] = useState('')
  const [speechSupported, setSpeechSupported] = useState(false)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    const supported = !!(
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    )
    setSpeechSupported(supported)
  }, [])

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsListening(false)
    setInterimText('')
  }

  // Stop mic when switching questions
  useEffect(() => {
    stopListening()
  }, [interviewIndex])

  useEffect(() => {
    const randomizedQuestions = getRandomQuestions(round.questions || [], INTERVIEW_QUESTION_LIMIT)
    const initialAnswers: Record<string, string> = {}

    randomizedQuestions.forEach((question) => {
      initialAnswers[question._id] = ''
    })

    setInterviewQuestions(randomizedQuestions)
    setInterviewAnswers(initialAnswers)
    setInterviewIndex(0)
    setInterviewReview(false)
    stopListening()
  }, [round])

  useEffect(() => {
    if (interviewReview) {
      return
    }

    const currentQuestion = interviewQuestions[interviewIndex]
    const questionToSpeak = currentQuestion?.question || currentQuestion?.title

    if (!questionToSpeak) {
      return
    }

    const synth = window.speechSynthesis
    if (!synth) {
      return
    }

    synth.cancel()
    const utterance = new SpeechSynthesisUtterance(questionToSpeak)
    utterance.rate = 1

    try {
      synth.speak(utterance)
    } catch {
      // keep flow working even when speech APIs fail
    }

    return () => synth.cancel()
  }, [interviewIndex, interviewQuestions, interviewReview])

  useEffect(() => {
    return () => {
      try {
        window.speechSynthesis?.cancel()
      } catch {
        // ignore cleanup failures
      }
      stopListening()
    }
  }, [])

  const isInterviewLastQuestion = interviewQuestions.length > 0 && interviewIndex === interviewQuestions.length - 1
  const interviewCurrentQuestion = interviewQuestions[interviewIndex]
  const interviewProgress = useMemo(() => {
    if (!interviewQuestions.length) {
      return 0
    }

    return Math.round(((interviewIndex + 1) / interviewQuestions.length) * 100)
  }, [interviewIndex, interviewQuestions.length])

  const toggleListening = () => {
    if (isListening) {
      stopListening()
      return
    }

    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognitionAPI || !interviewCurrentQuestion) return

    // Pause TTS so it doesn't feed back into the mic
    window.speechSynthesis?.cancel()

    const recognition = new SpeechRecognitionAPI()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event: any) => {
      let interim = ''
      let finalTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' '
        } else {
          interim += transcript
        }
      }

      if (finalTranscript) {
        setInterviewAnswers((prev) => ({
          ...prev,
          [interviewCurrentQuestion._id]:
            (prev[interviewCurrentQuestion._id] || '').trimEnd() +
            (prev[interviewCurrentQuestion._id] ? ' ' : '') +
            finalTranscript.trim() + ' ',
        }))
      }

      setInterimText(interim)
    }

    recognition.onerror = () => {
      setIsListening(false)
      setInterimText('')
      recognitionRef.current = null
    }

    recognition.onend = () => {
      setIsListening(false)
      setInterimText('')
      recognitionRef.current = null
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }

  const handleFinish = () => {
    stopListening()
    const answersPayload: AnswerEntry[] = interviewQuestions.map((q) => ({
      qid: q._id,
      questionText: q.question || q.title || 'TR Interview Question',
      textAnswer: (interviewAnswers[q._id] || '').trim(),
    }))
    onAttemptComplete?.(answersPayload)
  }

  return (
    <div className="interview-practice-shell">
      <div className="interview-practice-header">
        <div>
          <h4>TR Practice Session</h4>
          <p>{companyName} • {role || round.roundName}</p>
        </div>
        <div className="interview-progress-block">
          <span>{interviewReview ? 'Review Answers' : `Question ${Math.min(interviewIndex + 1, Math.max(interviewQuestions.length, 1))} / ${interviewQuestions.length || 0}`}</span>
          {!interviewReview && (
            <ProgressBar now={interviewProgress} className="interview-progress-bar" />
          )}
        </div>
      </div>

      {!interviewReview ? (
        <div className="interview-practice-body">
          {interviewCurrentQuestion ? (
            <>
              <div className="interview-question-card">
                <Badge className="question-type tr">TR</Badge>
                <h5>{interviewCurrentQuestion.question || interviewCurrentQuestion.title || 'Technical Interview Question'}</h5>
                {interviewCurrentQuestion.description && (
                  <p className="interview-question-context">{interviewCurrentQuestion.description}</p>
                )}
              </div>

              <div className="interview-answer-card">
                <div className="interview-answer-label-row">
                  <label htmlFor="interview-answer" className="interview-answer-label">Your Answer</label>
                  {speechSupported && (
                    <button
                      type="button"
                      className={`mic-btn ${isListening ? 'mic-btn--active' : ''}`}
                      onClick={toggleListening}
                      title={isListening ? 'Stop recording' : 'Speak your answer'}
                    >
                      <MicIcon active={isListening} />
                      <span>{isListening ? 'Stop' : 'Speak'}</span>
                      {isListening && <span className="mic-pulse" />}
                    </button>
                  )}
                </div>
                <textarea
                  id="interview-answer"
                  rows={8}
                  className="interview-answer-textarea"
                  placeholder={speechSupported ? 'Type or click "Speak" to answer with your voice...' : 'Explain your technical approach clearly...'}
                  value={interviewAnswers[interviewCurrentQuestion._id] || ''}
                  onChange={(e) => {
                    setInterviewAnswers((prev) => ({
                      ...prev,
                      [interviewCurrentQuestion._id]: e.target.value,
                    }))
                  }}
                />
                {isListening && (
                  <div className="mic-interim">
                    <span className="mic-interim-dot" />
                    <span>{interimText || 'Listening…'}</span>
                  </div>
                )}
              </div>

              <div className="interview-practice-actions">
                <Button
                  variant="secondary"
                  onClick={() => setInterviewIndex((prev) => Math.max(prev - 1, 0))}
                  disabled={interviewIndex === 0}
                >
                  Previous
                </Button>
                {!isInterviewLastQuestion ? (
                  <Button
                    className="header-quiz-btn"
                    onClick={() => setInterviewIndex((prev) => Math.min(prev + 1, interviewQuestions.length - 1))}
                  >
                    Next Question
                  </Button>
                ) : (
                  <Button className="header-quiz-btn" onClick={() => setInterviewReview(true)}>
                    Review Answers
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="interview-empty-state">
              <p>No interview questions found for this round.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="interview-review-body">
          <h5>Review Your Practice Answers</h5>
          <div className="interview-review-list">
            {interviewQuestions.map((question, questionIndex) => {
              const answer = (interviewAnswers[question._id] || '').trim()
              return (
                <div key={question._id} className="interview-review-item">
                  <div className="interview-review-question" onClick={() => {
                    setInterviewReview(false)
                    setInterviewIndex(questionIndex)
                  }}>
                    Q{questionIndex + 1}. {question.question || question.title || 'Technical Interview Question'}
                  </div>
                  <div className={`interview-review-answer ${answer ? '' : 'empty'}`}>
                    {answer || 'No answer provided yet.'}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="interview-practice-actions">
            <Button variant="secondary" onClick={() => setInterviewReview(false)}>
              Back to Questions
            </Button>
            <Button className="header-quiz-btn" onClick={handleFinish}>
              Submit &amp; Get Score
            </Button>
          </div>
        </div>
      )}

      <style>{`
        .question-type.tr {
          background: rgba(168, 85, 247, 0.15);
          color: #a855f7;
        }

        .interview-practice-shell {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #080808;
          color: #f3f3f3;
        }

        .interview-practice-header {
          border-bottom: 1px solid #252525;
          padding: 1rem 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }

        .interview-practice-header h4 {
          margin: 0;
          color: #ff6b35;
          font-size: 1.1rem;
        }

        .interview-practice-header p {
          margin: 0.25rem 0 0;
          color: #9e9e9e;
          font-size: 0.82rem;
        }

        .interview-progress-block {
          min-width: 260px;
          color: #cfcfcf;
          font-size: 0.82rem;
        }

        .interview-progress-bar {
          margin-top: 0.35rem;
          height: 6px;
          background: #1c1c1c;
        }

        .interview-progress-bar .progress-bar {
          background: linear-gradient(135deg, #a855f7 0%, #c084fc 100%);
        }

        .interview-practice-body,
        .interview-review-body {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .interview-question-card,
        .interview-answer-card,
        .interview-review-item {
          background: #0d0d0d;
          border: 1px solid #232323;
          border-radius: 14px;
          padding: 1rem;
        }

        .interview-question-card h5 {
          margin: 0.7rem 0 0;
          color: #ffffff;
          line-height: 1.45;
        }

        .interview-question-context {
          margin-top: 0.6rem;
          color: #b5b5b5;
          font-size: 0.88rem;
        }

        .interview-answer-label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }

        .interview-answer-label {
          color: #ff6b35;
          font-size: 0.85rem;
          font-weight: 600;
          margin: 0;
        }

        .mic-btn {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          background: #181818;
          border: 1px solid #333;
          border-radius: 8px;
          color: #cfcfcf;
          font-size: 0.8rem;
          padding: 0.3rem 0.7rem;
          cursor: pointer;
          position: relative;
          transition: border-color 0.2s, color 0.2s;
        }

        .mic-btn:hover {
          border-color: #a855f7;
          color: #c084fc;
        }

        .mic-btn--active {
          border-color: #ef4444;
          color: #ef4444;
          background: rgba(239, 68, 68, 0.08);
        }

        .mic-pulse {
          position: absolute;
          top: -3px;
          right: -3px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ef4444;
          animation: mic-pulse-anim 1.2s ease-in-out infinite;
        }

        @keyframes mic-pulse-anim {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.4); }
        }

        .interview-answer-textarea {
          width: 100%;
          border-radius: 10px;
          border: 1px solid #2a2a2a;
          background: #070707;
          color: #f0f0f0;
          padding: 0.8rem;
          font-size: 0.9rem;
          line-height: 1.5;
          resize: vertical;
        }

        .interview-answer-textarea:focus {
          outline: none;
          border-color: #a855f7;
          box-shadow: 0 0 0 1px rgba(168, 85, 247, 0.35);
        }

        .mic-interim {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          margin-top: 0.5rem;
          color: #9ca3af;
          font-size: 0.82rem;
          font-style: italic;
          min-height: 1.2rem;
        }

        .mic-interim-dot {
          flex-shrink: 0;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #ef4444;
          margin-top: 0.2rem;
          animation: mic-pulse-anim 1s ease-in-out infinite;
        }

        .interview-practice-actions {
          margin-top: auto;
          display: flex;
          justify-content: space-between;
          gap: 0.8rem;
        }

        .interview-review-body h5 {
          color: #ff6b35;
          margin: 0;
        }

        .interview-review-list {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }

        .interview-review-question {
          color: #f6f6f6;
          font-weight: 600;
          cursor: pointer;
          margin-bottom: 0.6rem;
        }

        .interview-review-question:hover {
          color: #ff9a5c;
        }

        .interview-review-answer {
          padding: 0.7rem;
          border-radius: 10px;
          border: 1px solid #2a2a2a;
          background: #070707;
          color: #cbcbcb;
          white-space: pre-wrap;
        }

        .interview-review-answer.empty {
          color: #f87171;
        }

        .interview-empty-state {
          border: 1px solid #2a2a2a;
          border-radius: 12px;
          padding: 1rem;
          text-align: center;
          color: #bcbcbc;
        }

        @media (max-width: 768px) {
          .interview-practice-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .interview-progress-block {
            min-width: 100%;
          }

          .interview-practice-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  )
}

export default TRInterviewPractice
