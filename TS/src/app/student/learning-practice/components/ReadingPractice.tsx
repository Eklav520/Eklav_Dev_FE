import React, { useState } from 'react'
import { useEffect } from 'react'
import { Button, Card, Container, Spinner, ProgressBar, Form, Badge } from 'react-bootstrap'
import { FaBookOpen, FaPlay, FaCheckCircle, FaArrowRight } from 'react-icons/fa'
import { useAuthContext } from '@/context/useAuthContext'

type Question = {
  q: string
  options: string[]
  answer: string
}

type Prompt = {
  promptId: string
  passage: string
  questions: Question[]
}

type Feedback = {
  summary: string
  recommendations: string[] | string
  score: number
}

type ReadingHistory = {
  monthlyLimit: number
  weeklyLimit: number
  attemptsUsed: number
  remainingAttempts: number
  summary: {
    bestScore: number | null
    latestScore: number | null
    trend: string
  }
}

const ReadingPractice: React.FC = () => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const token = user?.token

  const [started, setStarted] = useState(false)
  const [prompt, setPrompt] = useState<Prompt | null>(null)
  const [answers, setAnswers] = useState<{ [key: string]: string }>({})
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [loading, setLoading] = useState(false)
  const [currentQ, setCurrentQ] = useState(0)
  const [submittedData, setSubmittedData] = useState<any>(null)
  const [history, setHistory] = useState<ReadingHistory | null>(null)
  const [historyLoading, setHistoryLoading] = useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${baseURL}/learning/reading/history`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        setHistory(data)
      } catch (err) {
        console.error('Error fetching reading history', err)
      } finally {
        setHistoryLoading(false)
      }
    }

    if (token && baseURL) fetchHistory()
  }, [token, baseURL])

  // 🔹 Start practice & fetch AI reading prompt
  const startPractice = async () => {
    setStarted(true)
    setLoading(true)
    setFeedback(null)
    setAnswers({})
    setCurrentQ(0)
    setSubmittedData(null)

    try {
      const res = await fetch(`${baseURL}/learning/reading/prompt`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 429) {
        const data = await res.json()
        alert(`Weekly limit reached.\n\nAttempts used: ${data.attemptsUsed}\nTry again next week.`)
        setStarted(false)
        return
      }
      const data = await res.json()
      setPrompt(data)
    } catch (err) {
      console.error('Error fetching reading prompt', err)
    } finally {
      setLoading(false)
    }
  }

  const handleOptionChange = (qIndex: number, value: string) => {
    setAnswers({ ...answers, [qIndex]: value })
  }

  const handleNext = () => {
    if (currentQ < (prompt?.questions.length ?? 0) - 1) {
      setCurrentQ(currentQ + 1)
    }
  }

  const handleSubmit = async () => {
    if (!prompt) return
    setLoading(true)
    setFeedback(null)

    const correctAnswers = Object.fromEntries(prompt.questions.map((q, i) => [i, q.answer]))

    try {
      const res = await fetch(`${baseURL}/learning/reading/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentId: user?.id,
          promptId: prompt.promptId,
          passage: prompt.passage,
          answers,
          correctAnswers,
        }),
      })
      const data = await res.json()

      setFeedback({
        ...data.feedback,
        score: data.score,
      })
      setSubmittedData({ answers, correctAnswers })
      const historyRes = await fetch(`${baseURL}/learning/reading/history`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setHistory(await historyRes.json())
    } catch (err) {
      console.error('Error submitting reading answers', err)
    } finally {
      setLoading(false)
    }
  }

  const getScorePercentage = () => feedback?.score ?? 0

  return (
    <Container fluid className="reading-practice-container">
      {!started ? (
        <div className="start-screen text-center">
          <div className="start-card">
            <div className="icon-wrapper">
              <FaBookOpen className="main-icon" />
            </div>
            <h2>Reading Practice</h2>
            <p className="description">
              Sharpen your comprehension skills with AI-powered reading passages and interactive quizzes designed to improve your reading abilities.
            </p>
            <Button size="lg" className="start-button" onClick={startPractice} disabled={history?.remainingAttempts === 0}>
              <FaPlay className="me-2" />
              {history?.remainingAttempts === 0 ? 'Weekly Limit Reached' : 'Start Practice'}
            </Button>
            {!historyLoading && history && (
              <div className="stats-container">
                {/* Monthly Attempts */}
                <div className="stat-box attempts-box">
                  <div className="stat-title">Monthly Attempts</div>
                  <div className="stat-value">
                    {history.attemptsUsed}/{history.monthlyLimit}
                  </div>
                </div>

                {/* Best Score */}
                <div className="stat-box score-box">
                  <div className="stat-title">Best Score</div>
                  <div
                    className={`stat-value ${history.summary?.bestScore == null ? "empty" : ""
                      }`}
                  >
                    {history.summary?.bestScore != null
                      ? `${history.summary.bestScore}%`
                      : "No attempts yet"}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      ) : (
        <div className="practice-layout">
          {/* Main Challenge Area - Full Width */}
          <div className="challenge-section">
            <Card className="challenge-card">
              <Card.Header className="challenge-header">
                <FaBookOpen className="me-2" />
                Reading Challenge
                <span className="progress-indicator">
                  {String(currentQ + 1).padStart(3, '0')} / {String(prompt?.questions.length || 0).padStart(3, '0')}
                </span>
              </Card.Header>

              <Card.Body className="challenge-body">
                {loading && !feedback ? (
                  <div className="loading-state">
                    <Spinner animation="border" variant="primary" />
                    <p>Loading reading passage...</p>
                  </div>
                ) : prompt ? (
                  <>
                    {/* Reading Passage Section */}
                    <div className="passage-section">
                      <div className="passage-header">
                        <h5>Reading Passage</h5>
                        <Badge bg="info" className="passage-length">
                          {prompt.passage.split(' ').length} words
                        </Badge>
                      </div>
                      <div className="passage-content">
                        <p>{prompt.passage}</p>
                      </div>
                    </div>

                    {/* Questions Section */}
                    {prompt.questions.length > 0 && (
                      <div className="questions-section">
                        <div className="current-question">
                          <div className="question-header">
                            <h5 className="question-text">{prompt.questions[currentQ].q}</h5>
                            <div className="question-number">
                              Question {currentQ + 1} of {prompt.questions.length}
                            </div>
                          </div>

                          <div className="options-grid">
                            {prompt.questions[currentQ].options.map((opt, i) => (
                              <div key={i} className="option-item">
                                <Form.Check
                                  type="radio"
                                  id={`opt-${currentQ}-${i}`}
                                  label={opt}
                                  disabled={!!feedback}
                                  name={`q-${currentQ}`}
                                  value={opt}
                                  checked={answers[currentQ] === opt}
                                  onChange={(e) => handleOptionChange(currentQ, e.target.value)}
                                  className="custom-radio"
                                />
                              </div>
                            ))}
                          </div>

                          {/* Navigation */}
                          <div className="navigation-buttons">
                            {currentQ < prompt.questions.length - 1 ? (
                              <Button variant="primary" onClick={handleNext} size="lg" disabled={!answers[currentQ]} className="nav-button">
                                Next Question <FaArrowRight className="ms-2" />
                              </Button>
                            ) : (
                              <Button
                                variant="success"
                                size="lg"
                                onClick={handleSubmit}
                                disabled={Object.keys(answers).length !== prompt.questions.length}
                                className="submit-button">
                                <FaCheckCircle className="me-2" />
                                Submit All Answers
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="error-state">
                    <p>Unable to load reading passage. Please try again.</p>
                    <Button variant="outline-primary" onClick={startPractice}>
                      Retry
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>
          </div>

          {/* Feedback Section - Appears after submission */}
          {feedback && (
            <div className="feedback-section">
              <Card className="feedback-card">
                <Card.Header className="feedback-header">💡 AI Feedback & Analysis</Card.Header>
                <Card.Body className="feedback-body">
                  <div className="score-display">
                    <h3>Your Score</h3>
                    <div className="score-circle">
                      <span className="score-number">{feedback.score}%</span>
                      <span className="score-percentage">Reading Accuracy</span>
                    </div>
                    <ProgressBar
                      now={getScorePercentage()}
                      variant={getScorePercentage() >= 70 ? 'success' : getScorePercentage() >= 40 ? 'warning' : 'danger'}
                      className="score-bar"
                    />
                  </div>

                  <div className="feedback-content">
                    <div className="feedback-item summary">
                      <h6>📊 Performance Summary</h6>
                      <p>{feedback.summary || 'No summary available.'}</p>
                    </div>

                    <div className="feedback-item recommendations">
                      <h6>💡 Recommendations</h6>
                      <div className="recommendations-list">
                        {Array.isArray(feedback.recommendations) ? (
                          feedback.recommendations.map((rec, index) => (
                            <div key={index} className="recommendation-item">
                              <span className="bullet">•</span>
                              <span>{rec}</span>
                            </div>
                          ))
                        ) : (
                          <p>{feedback.recommendations || 'No recommendations available.'}</p>
                        )}
                      </div>
                    </div>

                    {/* Answer Review */}
                    {submittedData && (
                      <div className="feedback-item answer-review">
                        <h6>🧠 Answer Review</h6>
                        <div className="answers-grid">
                          {prompt?.questions?.map((q, idx) => {
                            const isCorrect = submittedData.answers[idx] === submittedData.correctAnswers[idx]
                            return (
                              <div key={idx} className="answer-item">
                                <div className="question-info">
                                  <span className="question-index">Q{idx + 1}</span>
                                  <span className="question-text">{q.q}</span>
                                </div>
                                <div className="answer-comparison">
                                  <div className="answer your-answer">
                                    <span className="label">Your Answer:</span>
                                    <Badge bg={isCorrect ? 'success' : 'danger'}>{submittedData.answers[idx] || 'Not answered'}</Badge>
                                  </div>
                                  <div className="answer correct-answer">
                                    <span className="label">Correct Answer:</span>
                                    <Badge bg="info">{submittedData.correctAnswers[idx]}</Badge>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="action-buttons">
                    <Button variant="outline-primary" onClick={startPractice}>
                      Try Another Passage
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </div>
          )}
        </div>
      )}

      <style>{`
        .reading-practice-container {
          padding: 2rem;
          min-height: 80vh;
        }

        /* Start Screen */
        .start-screen {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 60vh;
        }

        .start-card {
          background: white;
          padding: 3rem;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
          text-align: center;
          max-width: 500px;
          width: 100%;
        }

        .icon-wrapper {
          margin-bottom: 2rem;
        }

        .main-icon {
          font-size: 4rem;
          color: #667eea;
        }

        .start-card h2 {
          color: #2d3748;
          margin-bottom: 1rem;
          font-weight: 700;
        }

        .description {
          color: #4a5568;
          font-size: 1.1rem;
          line-height: 1.6;
          margin-bottom: 2rem;
        }

        .start-button {
          background: linear-gradient(135deg, #ff6a00 0%, #ff9a3c 100%) !important;
          border: none !important;
          color: white !important;
        }

        .start-button:hover:not(:disabled) {
          background: linear-gradient(135deg, #e55f00 0%, #ff8c1a 100%) !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(255, 122, 0, 0.3);
        }


        /* Practice Layout */
        .practice-layout {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          max-width: 1400px;   /* wider */
          width: 95%;          /* responsive */
          margin: 0 auto;
        }


        /* Challenge Section */
        .challenge-section {
          width: 100%;
        }

        .challenge-card {
          border: none;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          background: #ffffff;
        }

        .challenge-header {
          background: linear-gradient(135deg, #ff6a00 0%, #ff9a3c 100%);
          color: white;
          font-size: 1.3rem;
          font-weight: 600;
          padding: 1.5rem 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: none;
        }

        .progress-indicator {
          background: rgba(255, 255, 255, 0.2);
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 1rem;
          font-weight: 600;
          font-family: 'Courier New', monospace;
          letter-spacing: 1px;
        }

        .challenge-body {
          padding: 2rem 3rem;
          background: #ffffff;
        }

        /* Passage Section */
        .passage-section {
          margin-bottom: 2rem;
        }

        .passage-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .passage-header h5 {
          color: #2d3748;
          font-weight: 600;
          margin: 0;
        }

        .passage-length {
          font-size: 0.9rem;
        }

        .passage-content {
          background: #f8fafc;
          padding: 1.5rem;
          border-radius: 12px;
          border-left: 4px solid #667eea;
          min-height: 400px;  
          max-height: none; 
          font-size: 1.15rem;
          overflow: visible; 
          line-height: 1.6;
          color: #4a5568;
        }

        .passage-content p {
          margin: 0;
          font-size: 1.1rem;
        }

        /* Questions Section */
        .questions-section {
          margin-top: 2rem;
        }

        .question-header {
          margin-bottom: 2rem;
          text-align: center;
        }

        .question-text {
          color: #1a202c;
          margin-bottom: 0.5rem;
          font-weight: 700;
          font-size: 1.5rem;
          line-height: 1.4;
          text-align: center;
          background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .question-number {
          color: #718096;
          font-size: 1rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .options-grid {
          display: grid;
          gap: 1rem;
          margin-bottom: 2.5rem;
          max-width: 900px;
          margin: 0 auto 2.5rem;
        }

        .option-item {
          background: #f8fafc;
          padding: 1.25rem 1.5rem;
          border-radius: 12px;
          border: 2px solid #e2e8f0;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .option-item:hover {
          border-color: #667eea;
          background: #f0f4ff;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
        }

        .custom-radio :global(.form-check-input) {
          width: 1.3em;
          height: 1.3em;
          margin-right: 1rem;
          border: 2px solid #cbd5e0;
        }

        .custom-radio :global(.form-check-input:checked) {
          background-color: #ff7a00;
          border-color: #ff7a00;
        }

        .custom-radio :global(.form-check-label) {
          font-size: 1.1rem;
          font-weight: 500;
          color: #2d3748;
          cursor: pointer;
          line-height: 1.4;
        }

        /* Navigation */
        .navigation-buttons {
          text-align: center;
          margin-top: 2rem;
        }

        .nav-button, .submit-button {
          padding: 1rem 2.5rem;
          border-radius: 12px;
          font-weight: 600;
          font-size: 1.1rem;
          min-width: 220px;
          border: none;
          transition: all 0.3s ease;
        }

        .nav-button {
          background: linear-gradient(135deg, #ff6a00 0%, #ff9a3c 100%);
        }

        .nav-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        }

        .submit-button {
          background: linear-gradient(135deg, #ff6a00 0%, #ff9a3c 100%);
        }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(72, 187, 120, 0.3);
        }

        .nav-button:disabled, .submit-button:disabled {
          opacity: 0.6;
          transform: none;
          box-shadow: none;
        }

        /* Loading States */
        .loading-state {
          text-align: center;
          padding: 3rem;
          color: #667eea;
        }

        .loading-state :global(.spinner-border) {
          width: 3rem;
          height: 3rem;
          margin-bottom: 1rem;
        }

        /* Feedback Section */
        .feedback-section {
          width: 100%;
        }

        .feedback-card {
          border: none;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          background: #ffffff;
        }

        .feedback-header {
          background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
          color: white;
          font-size: 1.3rem;
          font-weight: 600;
          padding: 1.5rem 2rem;
          border-bottom: none;
        }

        .feedback-body {
          padding: 2.5rem;
          background: #ffffff;
        }

        .score-display {
          text-align: center;
          margin-bottom: 2rem;
        }

        .score-display h3 {
          color: #2d3748;
          margin-bottom: 1.5rem;
          font-weight: 700;
        }

        .score-circle {
          background: linear-gradient(135deg, #ff6a00 0%, #ff9a3c 100%);
          color: white;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        }

        .score-number {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .score-percentage {
          font-size: 0.9rem;
          opacity: 0.9;
        }

        .score-bar {
          height: 8px;
          border-radius: 4px;
          max-width: 300px;
          margin: 0 auto;
        }

        .feedback-content {
          display: grid;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .feedback-item {
          padding: 1.5rem;
          border-radius: 12px;
        }

        .feedback-item h6 {
          font-weight: 600;
          margin-bottom: 0.75rem;
          color: #2d3748;
        }

        .feedback-item p {
          margin: 0;
          line-height: 1.6;
          color: #4a5568;
        }

        .summary {
          background: #f0fff4;
          border-left: 4px solid #48bb78;
        }

        .recommendations {
          background: #fffaf0;
          border-left: 4px solid #ed8936;
        }

        .answer-review {
          background: #f7fafc;
          border-left: 4px solid #4299e1;
        }

        .recommendations-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .recommendation-item {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          line-height: 1.5;
        }

        .bullet {
          color: #ed8936;
          font-weight: bold;
        }

        .answers-grid {
          display: grid;
          gap: 1rem;
        }

        .answer-item {
          background: white;
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .question-info {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .question-index {
          background: #667eea;
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 600;
          min-width: 2.5rem;
          text-align: center;
        }

        .question-text {
          font-size: 0.95rem;
          color: #4a5568;
          font-weight: 500;
          flex: 1;
          background: none;
          -webkit-text-fill-color: #4a5568;
          text-align: left;
        }

        .answer-comparison {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .answer {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .answer .label {
          font-size: 0.85rem;
          color: #718096;
          font-weight: 500;
        }

        .action-buttons {
          text-align: center;
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .challenge-card,
          .feedback-card {
            background: #2d3748;
          }

          .challenge-body,
          .feedback-body {
            background: #2d3748;
          }

          .question-text {
            color: #ffffff;
            background: linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .custom-radio :global(.form-check-label) {
            color: #e2e8f0;
          }

          .option-item {
            background: #4a5568;
            border-color: #718096;
          }

          .option-item:hover {
            background: #5a6778;
            border-color: #667eea;
          }

          .passage-content {
            background: #4a5568;
            color: #e2e8f0;
          }

          .question-number {
            color: #a0aec0;
          }

          .feedback-item h6 {
            color: #e2e8f0;
          }

          .feedback-item p {
            color: #cbd5e0;
          }

          .answer-item {
            background: #4a5568;
            border-color: #718096;
          }

          .question-text {
            color: #e2e8f0;
            -webkit-text-fill-color: #e2e8f0;
          }
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .reading-practice-container {
            padding: 1rem;
          }

          .start-card {
            padding: 2rem 1.5rem;
          }

          .challenge-body {
            padding: 1.5rem;
          }

          .question-text {
            font-size: 1.3rem;
          }

          .options-grid {
            grid-template-columns: 1fr;
          }

          .score-circle {
            width: 100px;
            height: 100px;
          }

          .nav-button, .submit-button {
            min-width: 100%;
            padding: 1rem 1.5rem;
          }

          .answer-comparison {
            grid-template-columns: 1fr;
            gap: 0.5rem;
          }

          .passage-header {
            flex-direction: column;
            gap: 0.5rem;
            align-items: flex-start;
          }
        }

        @media (min-width: 992px) {
          .challenge-body {
            display: grid;
            grid-template-columns: 1.2fr 1fr;
            gap: 3rem;
            align-items: start;
          }

          .passage-section {
            margin-bottom: 0;
          }

          .questions-section {
            margin-top: 0;
          }
        }

        .stats-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-top: 1.5rem;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        .stat-box {
          background: white;
          padding: 1.2rem 1.5rem;
          border-radius: 16px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.06);
          text-align: center;
          transition: all 0.25s ease;
          background: #fff4e6;
        }

        .stat-box:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(255, 122, 0, 0.15);
        }

        .stat-title {
          font-size: 0.9rem;
          color: #718096;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        .stat-value {
          font-size: 1.6rem;
          font-weight: 700;
          color: #ff7a00;
        }
        .attempts .stat-value {
          color: #ff7a00;
        }

        .attempts .stat-value {
          color: #ff7a00;
        }

        .score-box .stat-value {
          color: #e96d00;
          back
        }

        .empty {
          color: #cbd5e0;
          font-size: 1rem;
          font-style: italic;
        }

        /* Mobile */
        @media (max-width: 576px) {
          .stats-container {
            grid-template-columns: 1fr;
          }
        }


      `}</style>
    </Container>
  )
}

export default ReadingPractice
