import React, { useEffect, useMemo, useState } from 'react'
import { Badge, Button, ProgressBar } from 'react-bootstrap'

type InterviewQuestion = {
  _id: string
  question?: string
  title?: string
  description?: string
}

type InterviewRound = {
  roundName: string
  questions: InterviewQuestion[]
}

type Props = {
  round: InterviewRound
  companyName: string
  role?: string
  onClose: () => void
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

const HRInterviewPractice: React.FC<Props> = ({ round, companyName, role, onClose }) => {
  const [interviewQuestions, setInterviewQuestions] = useState<InterviewQuestion[]>([])
  const [interviewAnswers, setInterviewAnswers] = useState<Record<string, string>>({})
  const [interviewIndex, setInterviewIndex] = useState(0)
  const [interviewReview, setInterviewReview] = useState(false)

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

  return (
    <div className="interview-practice-shell">
      <div className="interview-practice-header">
        <div>
          <h4>HR Practice Session</h4>
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
                <Badge className="question-type hr">HR</Badge>
                <h5>{interviewCurrentQuestion.question || interviewCurrentQuestion.title || 'Interview Question'}</h5>
                {interviewCurrentQuestion.description && (
                  <p className="interview-question-context">{interviewCurrentQuestion.description}</p>
                )}
              </div>

              <div className="interview-answer-card">
                <label htmlFor="interview-answer" className="interview-answer-label">Your Answer</label>
                <textarea
                  id="interview-answer"
                  rows={8}
                  className="interview-answer-textarea"
                  placeholder="Type your response as if you are in a real interview..."
                  value={interviewAnswers[interviewCurrentQuestion._id] || ''}
                  onChange={(e) => {
                    setInterviewAnswers((prev) => ({
                      ...prev,
                      [interviewCurrentQuestion._id]: e.target.value,
                    }))
                  }}
                />
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
                    Q{questionIndex + 1}. {question.question || question.title || 'Interview Question'}
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
            <Button className="header-quiz-btn" onClick={onClose}>
              Finish Practice
            </Button>
          </div>
        </div>
      )}

      <style>{`
        .question-type.hr {
          background: rgba(59, 130, 246, 0.15);
          color: #3b82f6;
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
          background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
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

        .interview-answer-label {
          color: #ff6b35;
          font-size: 0.85rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          display: block;
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
          border-color: #3b82f6;
          box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.35);
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

export default HRInterviewPractice
