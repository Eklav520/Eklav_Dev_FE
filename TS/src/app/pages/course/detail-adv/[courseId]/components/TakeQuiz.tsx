import React, { useEffect, useState } from 'react'
import './TakeQuiz.css' // Add this CSS file for custom styles
import { useAuthContext } from '@/context/useAuthContext'

interface QuizQuestion {
  question: string
  options: string[]
}

interface TakeQuizProps {
  courseId: string
  onQuizSubmit: (result: QuizResult) => void
  setQuizWarning: React.Dispatch<React.SetStateAction<string>>  
}

interface QuizResult {
  score: number
  total: number
}

const TakeQuiz: React.FC<TakeQuizProps> = ({ courseId, onQuizSubmit,setQuizWarning }) => {
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const [quiz, setQuiz] = useState<QuizQuestion[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<{ [index: number]: string }>({})
  const [result, setResult] = useState<QuizResult | null>(null)
  const { user } = useAuthContext()
  const token = user?.token

  useEffect(() => {
    const fetchQuiz = async () => {
      const response = await fetch(`${baseURL}/courses/${courseId}/quiz`)
      const data = await response.json()
      setQuiz(data.quiz || [])
    }
    fetchQuiz()
  }, [courseId])

  useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.hidden) {
      setQuizWarning("🚫 Switching tabs/minimizing is not allowed during the quiz. This attempt will be submitted.");
      //handleSubmit(); // Optional: auto-submit
    }
  }

  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    e.preventDefault()
    e.returnValue = ''
  }

  document.addEventListener("visibilitychange", handleVisibilityChange)
  window.addEventListener("beforeunload", handleBeforeUnload)

  return () => {
    document.removeEventListener("visibilitychange", handleVisibilityChange)
    window.removeEventListener("beforeunload", handleBeforeUnload)
  }
}, [])


  const handleAnswerChange = (value: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion]: value }))
  }

  const goToQuestion = (index: number) => {
    setCurrentQuestion(index)
  }

  const handleSubmit = async () => {
    const formattedAnswers = quiz.map((q, i) => ({
      question: q.question,
      selectedOption: answers[i] || '',
    }))

    try {
      const response = await fetch(`${baseURL}/courses/${courseId}/quiz/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ answers: formattedAnswers }),
      })

      const data: QuizResult = await response.json()
      setResult(data)

      const scorePercent = (data.score / data.total) * 100

      if (scorePercent < 80) {
        alert('Score below 80%. You need to retake the quiz.')
        setAnswers({}) // Reset for retake
        onQuizSubmit(data)
      } else {
        onQuizSubmit(data) // Pass score back to parent, modal will close
      }
    } catch (error) {
      console.error('Quiz submission failed:', error)
    }
  }

  return (
    <div className="quiz-container row">
      {/* Left side: Question and Options */}
      <div className="col-md-8 question-box">
        <h5 className="text-body fw-semibold mb-3">
          Q{currentQuestion + 1}: {quiz[currentQuestion]?.question}
        </h5>
        {quiz[currentQuestion]?.options.map((opt, i) => {
          const isSelected = answers[currentQuestion] === opt

          return (
            <div key={i} className={`p-3 rounded mb-3 option-hover ${isSelected ? 'bg-primary text-white' : 'bg-body-secondary text-body'}`}>
              <label className="d-flex align-items-center" style={{ fontSize: '1.0rem' }}>
                <input
                  type="radio"
                  name={`question-${currentQuestion}`}
                  value={opt}
                  checked={isSelected}
                  onChange={() => handleAnswerChange(opt)}
                  className="form-check-input me-3"
                  style={{ width: '1.0em', height: '1.1em' }}
                />
                {opt}
              </label>
            </div>
          )
        })}

        <div className="mt-8">
          <button
            className="btn btn-danger me-2"
            onClick={() =>
              setAnswers((prev) => {
                const copy = { ...prev }
                delete copy[currentQuestion]
                return copy
              })
            }>
            Reset
          </button>
          <button
            className="btn btn-primary me-2"
            onClick={() => {
              if (currentQuestion < quiz.length - 1) {
                setCurrentQuestion(currentQuestion + 1)
              }
            }}>
            Save & Next
          </button>
          <button id="submit-quiz-btn" className="btn btn-primary" onClick={handleSubmit}>
            Submit Quiz
          </button>
          {result && (
            <div>
              <h4>
                Score: {result.score} / {result.total}
              </h4>
            </div>
          )}
        </div>
      </div>

      {/* Right side: Question Panel */}
      <div className="col-md-4 question-panel">
        <h6>Question Panel</h6>
        <div className="d-flex flex-wrap gap-2">
          {quiz.map((_, i) => (
            <button
              key={i}
              className={`btn btn-sm ${answers[i] ? 'btn-success' : currentQuestion === i ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => goToQuestion(i)}>
              {i + 1}
            </button>
          ))}
        </div>

        <div className="mt-3">
          <p>
            <span className="legend-box bg-success" /> Answered
          </p>
          <p>
            <span className="legend-box bg-primary" /> Current
          </p>
          <p>
            <span className="legend-box bg-outline-secondary" /> Not Visited
          </p>
        </div>
      </div>
    </div>
  )
}

export default TakeQuiz
