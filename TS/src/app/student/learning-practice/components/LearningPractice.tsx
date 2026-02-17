import React, { useState, useRef } from 'react'
import { useEffect } from 'react'
import { Button, Card, Container, Row, Col, Spinner, ProgressBar, Form } from 'react-bootstrap'
import { FaClipboardList, FaArrowRight, FaPlay, FaVolumeUp, FaCheckCircle, FaArrowLeft } from 'react-icons/fa'
import { useAuthContext } from '@/context/useAuthContext'

type Question = {
  q: string
  options: string[]
  answer: string
}

type Prompt = {
  promptId: string
  audioUrl: string
  transcript: string
  questions: Question[]
}

type Feedback = {
  summary: string
  recommendations: string
  score: number
}

type ApiResponse = {
  score: number
  feedback: Feedback
}

type ListeningHistory = {
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

const ListeningPractice: React.FC = () => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const token = user?.token

  const [started, setStarted] = useState(false)
  const [prompt, setPrompt] = useState<Prompt | null>(null)
  const [answers, setAnswers] = useState<{ [key: string]: string }>({})
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [loading, setLoading] = useState(false)
  const [audioEnded, setAudioEnded] = useState(false)
  const [currentQ, setCurrentQ] = useState(0)
  const [history, setHistory] = useState<ListeningHistory | null>(null)
  const [historyLoading, setHistoryLoading] = useState(true)

  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${baseURL}/learning/listening/history`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const data = await res.json()
        setHistory(data)
      } catch (err) {
        console.error('Error fetching listening history', err)
      } finally {
        setHistoryLoading(false)
      }
    }

    if (token) fetchHistory()
  }, [token, baseURL])

  // 🔹 Start button → fetch AI listening prompt
  const startPractice = async () => {
    setStarted(true)
    setLoading(true)
    setFeedback(null)
    setAnswers({})
    setAudioEnded(false)
    setCurrentQ(0)

    try {
      const res = await fetch(`${baseURL}/learning/listening/prompt`, {
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
      console.error('Error fetching prompt', err)
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

  const handlePrevious = () => {
    if (currentQ > 0) {
      setCurrentQ(currentQ - 1)
    }
  }

  const handleSubmit = async () => {
    if (!prompt) return
    setLoading(true)
    setFeedback(null)

    try {
      const res = await fetch(`${baseURL}/learning/listening/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          promptId: prompt.promptId,
          answers,
          correctAnswers: Object.fromEntries(prompt.questions.map((q, i) => [i, q.answer])),
        }),
      })

      const data = await res.json()

      setFeedback({
        summary: data.feedback.summary,
        recommendations: data.feedback.recommendations,
        score: data.score,
      })

      // ✅ refresh history
      const historyRes = await fetch(`${baseURL}/learning/listening/history`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setHistory(await historyRes.json())
    } catch (err) {
      console.error('Error submitting listening answers', err)
    } finally {
      setLoading(false)
    }
  }

  const getScorePercentage = () => feedback?.score ?? 0

  return (
    <Container fluid className="listening-practice-container">
      {!started ? (
        <div className="start-screen">
          <Card className="start-card">
            <Card.Body className="start-card-body">
              <div className="icon-wrapper">
                <FaVolumeUp className="main-icon" />
              </div>
              <h1 className="start-title">Listening Practice</h1>
              <p className="start-description">
                Test your listening skills with AI-powered audio challenges. Click start to begin your journey to better English comprehension.
              </p>

              <div className="start-button-container">
                <Button
                  className="start-button"
                  onClick={startPractice}
                  disabled={history?.remainingAttempts === 0}
                >
                  <FaPlay className="me-2" />
                  {history?.remainingAttempts === 0 ? 'Monthly Limit Reached' : 'Start Practice'}
                </Button>

              </div>

              {!historyLoading && history && (
                <div className="stats-container">
                  {/* Attempts */}
                  <div className="stat-card attempts">
                    <div className="stat-label">Monthly Attempts</div>
                    <div className="stat-value">
                      {history.remainingAttempts ?? 0} / {history.monthlyLimit ?? 0}
                    </div>
                  </div>

                  {/* Best Score */}
                  <div className="stat-card best-score">
                    <div className="stat-label">Best Score</div>
                    <div
                      className={`stat-value ${history.summary?.bestScore == null ? "empty-score" : ""
                        }`}
                    >
                      {history.summary?.bestScore != null
                        ? `${history.summary.bestScore}%`
                        : "No attempts yet"}
                    </div>
                  </div>
                </div>
              )}

            </Card.Body>
          </Card>
        </div>
      ) : (
        <div className="practice-layout">
          {/* Main Challenge Area */}
          <div className="challenge-section">
            <Card className="challenge-card">
              <Card.Header className="challenge-header">
                <div className="header-content">
                  <div className="header-left">
                    <FaClipboardList className="header-icon" />
                    <span className="header-title">Listening Challenge</span>
                  </div>
                  <span className="progress-indicator">
                    {currentQ + 1} / {prompt?.questions.length || 0}
                  </span>
                </div>
              </Card.Header>

              <Card.Body className="challenge-body">
                {loading && !feedback ? (
                  <div className="loading-state">
                    <Spinner animation="border" variant="primary" />
                    <p className="loading-text">Loading audio challenge...</p>
                  </div>
                ) : prompt ? (
                  <>
                    {/* Audio Player Section */}
                    <div className="audio-section">
                      <div className="audio-player-wrapper">
                        <audio ref={audioRef} controls src={prompt.audioUrl} onEnded={() => setAudioEnded(true)} className="custom-audio-player" />
                      </div>
                      {!audioEnded && (
                        <div className="audio-instruction">
                          <FaVolumeUp className="instruction-icon" />
                          <span className="instruction-text">Listen carefully — questions will appear after the audio finishes.</span>
                        </div>
                      )}
                    </div>

                    {/* Questions Section */}
                    {audioEnded && prompt.questions.length > 0 && (
                      <div className="questions-section">
                        <div className="current-question">
                          <h5 className="question-text">{prompt.questions[currentQ].q}</h5>

                          <div className="options-container">
                            {prompt.questions[currentQ].options.map((opt, i) => (
                              <div key={i} className="option-item">
                                <Form.Check
                                  type="radio"
                                  disabled={!!feedback}
                                  id={`opt-${currentQ}-${i}`}
                                  label={opt}
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
                            {currentQ > 0 && (
                              <Button variant="outline-primary" onClick={handlePrevious} className="nav-button prev-button">
                                <FaArrowLeft className="me-2" />
                                Previous
                              </Button>
                            )}

                            {currentQ < prompt.questions.length - 1 ? (
                              <Button variant="primary" onClick={handleNext} disabled={!answers[currentQ]} className="nav-button next-button">
                                Next Question
                                <FaArrowRight className="ms-2" />
                              </Button>
                            ) : (
                              <Button
                                variant="success"
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
                    <p className="error-text">Unable to load challenge. Please try again.</p>
                    <Button variant="outline-primary" onClick={startPractice} className="retry-button">
                      Retry
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>
          </div>

          {/* Feedback Section */}
          {feedback && (
            <div className="feedback-section">
              <Card className="feedback-card">
                <Card.Header className="feedback-header">
                  <span className="feedback-icon">💡</span>
                  AI Feedback & Analysis
                </Card.Header>
                <Card.Body className="feedback-body">
                  <div className="score-display">
                    <h3 className="score-title">Your Score</h3>
                    <div className="score-circle">
                      <span className="score-number">{feedback.score}%</span>
                      <span className="score-percentage">Listening Accuracy</span>
                    </div>
                    <ProgressBar
                      now={getScorePercentage()}
                      variant={getScorePercentage() >= 70 ? 'success' : getScorePercentage() >= 40 ? 'warning' : 'danger'}
                      className="score-bar"
                    />
                  </div>

                  <div className="feedback-content">
                    <div className="feedback-item summary">
                      <h6 className="feedback-item-title">
                        <span className="feedback-item-icon">📊</span>
                        Performance Summary
                      </h6>
                      <p className="feedback-item-text">{feedback.summary || 'No summary available.'}</p>
                    </div>

                    <div className="feedback-item recommendations">
                      <h6 className="feedback-item-title">
                        <span className="feedback-item-icon">💡</span>
                        Recommendations
                      </h6>
                      <p className="feedback-item-text">{feedback.recommendations || 'No recommendations available.'}</p>
                    </div>
                  </div>

                  <div className="action-buttons">
                    <Button variant="outline-primary" onClick={startPractice} className="try-again-button">
                      Try Another Challenge
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </div>
          )}
        </div>
      )}

      <style>{`
        .listening-practice-container {
          padding: 1rem;
          min-height: calc(100vh - 80px);
          background: #f8fafc;
        }

        /* Start Screen */
        .start-screen {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 70vh;
          padding: 1rem;
        }

        .start-card {
          border: none;
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
          max-width: 600px;
          width: 100%;
          margin: 0 auto;
          background: white;
        }

        .start-card-body {
          padding: 2.5rem;
          text-align: center;
        }

        @media (max-width: 576px) {
          .start-card-body {
            padding: 1.5rem;
          }
        }

        .icon-wrapper {
          margin-bottom: 1.5rem;
        }

        .main-icon {
          font-size: 3rem;
          color: #ff7a00;
        }

        .start-title {
          color: #2d3748;
          font-weight: 700;
          font-size: 1.75rem;
          margin-bottom: 1rem;
        }

        .start-description {
          color: #4a5568;
          font-size: 1rem;
          line-height: 1.6;
          margin-bottom: 2rem;
        }

        .start-button-container {
          margin-bottom: 2rem;
        }

        .stats-container {
          display: flex;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .stat-card {
          padding: 0.875rem 1.25rem;
          border-radius: 12px;
          min-width: 150px;
          text-align: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .attempts {
          background: #fff4e6;
          border: 1px solid #ffd8b0;
        }

        .attempts .stat-value {
          color: #ff7a00;
        }


        .best-score {
          background: #fff4e6;
          border: 1px solid #ffd8b0;
        }

        .stat-label {
          font-size: 0.875rem;
          color: #4a5568;
          margin-bottom: 0.25rem;
        }

        .stat-value {
          font-size: 1.25rem;
          font-weight: 700;
        }

        .attempts .stat-value {
          color: #ff7a00;
        }

        .best-score .stat-value {
          color: #ff7a00;
        }

        /* Practice Layout */
        .practice-layout {
          max-width: 1000px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        /* Challenge Section */
        .challenge-card {
          border: none;
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          background: white;
        }

        .challenge-header {
          background: var(--orange-gradient);
          color: white;
          padding: 1.25rem 1.5rem;
          border-bottom: none;
        }

        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .header-icon {
          font-size: 1.25rem;
        }

        .header-title {
          font-size: 1.25rem;
          font-weight: 600;
          flex: 1;
          margin: 0 0.5rem;
        }

        .progress-indicator {
          background: rgba(255, 255, 255, 0.2);
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.875rem;
          white-space: nowrap;
        }

        .challenge-body {
          padding: 1.5rem;
        }

        @media (max-width: 576px) {
          .challenge-body {
            padding: 1rem;
          }
        }

        /* Audio Section */
        .audio-section {
          margin-bottom: 1.5rem;
        }

        .audio-player-wrapper {
          margin-bottom: 1rem;
        }

        .custom-audio-player {
          width: 100%;
          border-radius: 12px;
        }

        .audio-instruction {
          background: #e3f2fd;
          padding: 0.875rem 1rem;
          border-radius: 12px;
          color: #1976d2;
          display: flex;
          align-items: center;
          font-size: 0.875rem;
        }

        .instruction-icon {
          margin-right: 0.5rem;
          flex-shrink: 0;
        }

        .instruction-text {
          flex: 1;
        }

        /* Questions Section */
        .questions-section {
          margin-top: 1.5rem;
        }

        .question-text {
          color: #2d3748;
          font-weight: 600;
          font-size: 1.25rem;
          line-height: 1.4;
          text-align: center;
          margin-bottom: 1.5rem;
          padding: 0 0.5rem;
        }

        .options-container {
          margin-bottom: 2rem;
        }

        .option-item {
          background: #f8fafc;
          padding: 1rem;
          border-radius: 12px;
          border: 2px solid #e2e8f0;
          transition: all 0.2s ease;
          margin-bottom: 0.75rem;
        }

        .option-item:hover {
          border-color: #ff7a00;
          background: #fff4e6;
        }

        .option-item:last-child {
          margin-bottom: 0;
        }

        .custom-radio :global(.form-check-input) {
          width: 1.1em;
          height: 1.1em;
          margin-right: 0.75rem;
        }

        .custom-radio :global(.form-check-label) {
          font-size: 1rem;
          color: #4a5568;
          line-height: 1.4;
        }

        /* Navigation Buttons */
        .navigation-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          justify-content: center;
        }

        .nav-button,
        .submit-button {
          padding: 0.75rem 1.5rem;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.875rem;
          min-width: 140px;
          flex: 1;
          max-width: 100%;
          white-space: nowrap;
        }

        .nav-button {
          min-width: 120px;
        }

        .submit-button {
          min-width: 160px;
        }

        .prev-button {
          order: 1;
        }

        .next-button,
        .submit-button {
          order: 2;
        }

        /* Loading States */
        .loading-state {
          text-align: center;
          padding: 3rem 1rem;
          color: #667eea;
        }

        .loading-state :global(.spinner-border) {
          width: 2.5rem;
          height: 2.5rem;
          margin-bottom: 1rem;
        }

        .loading-text {
          font-size: 1rem;
          color: #4a5568;
        }

        /* Error State */
        .error-state {
          text-align: center;
          padding: 2rem 1rem;
        }

        .error-text {
          color: #e53e3e;
          margin-bottom: 1rem;
          font-size: 1rem;
        }

        .retry-button {
          min-width: 120px;
        }

        /* Feedback Section */
        .feedback-section {
          width: 100%;
        }

        .feedback-card {
          border: none;
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          background: white;
        }

        .feedback-header {
          background: linear-gradient(135deg, #ff6a00 0%, #ff9a3c 100%);
          color: white;
          font-size: 1.25rem;
          font-weight: 600;
          padding: 1.25rem 1.5rem;
          border-bottom: none;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .feedback-icon {
          font-size: 1.25rem;
        }

        .feedback-body {
          padding: 1.5rem;
        }

        @media (max-width: 576px) {
          .feedback-body {
            padding: 1rem;
          }
        }

        /* Score Display */
        .score-display {
          text-align: center;
          margin-bottom: 2rem;
        }

        .score-title {
          color: #2d3748;
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }

        .score-circle {
          background: linear-gradient(135deg, #ff6a00 0%, #ff9a3c 100%);
          color: white;
          width: 100px;
          height: 100px;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
        }

        .score-number {
          font-size: 1.5rem;
          font-weight: 700;
          line-height: 1;
        }

        .score-percentage {
          font-size: 0.75rem;
          opacity: 0.9;
          margin-top: 0.25rem;
        }

        .score-bar {
          height: 8px;
          border-radius: 4px;
          max-width: 300px;
          margin: 0 auto;
        }

        /* Feedback Content */
        .feedback-content {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .feedback-item {
          padding: 1.25rem;
          border-radius: 12px;
          background: #f8fafc;
          border-left: 4px solid transparent;
        }

        .summary {
          border-left-color: #48bb78;
          background: #f0fff4;
        }

        .recommendations {
          border-left-color: #ed8936;
          background: #fffaf0;
        }

        .feedback-item-title {
          font-size: 1rem;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .feedback-item-icon {
          font-size: 1rem;
        }

        .feedback-item-text {
          font-size: 0.875rem;
          line-height: 1.6;
          color: #4a5568;
          margin: 0;
        }

        /* Action Buttons */
        .action-buttons {
          text-align: center;
        }

        .try-again-button {
          padding: 0.75rem 2rem;
          border-radius: 10px;
          font-weight: 600;
          min-width: 180px;
          max-width: 100%;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .header-title {
            font-size: 1.1rem;
          }
          
          .progress-indicator {
            font-size: 0.8rem;
            padding: 0.2rem 0.6rem;
          }
          
          .question-text {
            font-size: 1.1rem;
          }
          
          .nav-button,
          .submit-button {
            min-width: 120px;
            font-size: 0.85rem;
            padding: 0.625rem 1.25rem;
          }
          
          .score-circle {
            width: 80px;
            height: 80px;
          }
          
          .score-number {
            font-size: 1.25rem;
          }
        }

        @media (max-width: 576px) {
          .start-title {
            font-size: 1.5rem;
          }
          
          .header-content {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }
          
          .progress-indicator {
            align-self: flex-end;
          }
          
          .stat-card {
            min-width: 130px;
            padding: 0.75rem 1rem;
          }
          
          .stat-value {
            font-size: 1.1rem;
          }
          
          .question-text {
            font-size: 1rem;
            margin-bottom: 1rem;
          }
          
          .option-item {
            padding: 0.875rem;
          }
          
          .custom-radio :global(.form-check-label) {
            font-size: 0.9375rem;
          }
          
          .navigation-buttons {
            flex-direction: column;
            align-items: stretch;
          }
          
          .nav-button,
          .submit-button {
            width: 100%;
            max-width: 100%;
          }
          
          .score-circle {
            width: 70px;
            height: 70px;
          }
          
          .score-number {
            font-size: 1.1rem;
          }
          
          .score-percentage {
            font-size: 0.7rem;
          }
        }

                .start-button {
          background: #ff7a00 !important;
          border: none !important;
          color: #ffffff !important;
          padding: 0.875rem 2rem;
          border-radius: 12px;
          font-weight: 600;
          font-size: 1rem;
          width: 100%;
          max-width: 300px;
          margin: 0 auto;
          display: block;
          transition: all 0.2s ease;
        }

        .start-button:hover:not(:disabled) {
          background: #e96d00 !important;
          box-shadow: 0 6px 18px rgba(255, 122, 0, 0.25);
          transform: translateY(-1px);
        }

        .start-button:disabled {
          background: #ffd8b0 !important;
          color: white !important;
        }


        @media (max-width: 400px) {
          .listening-practice-container {
            padding: 0.5rem;
          }
          
          .start-card-body {
            padding: 1.25rem;
          }
          
          .challenge-body,
          .feedback-body {
            padding: 0.875rem;
          }
          
          .stat-card {
            min-width: 100%;
          }
          
          .stats-container {
            flex-direction: column;
            gap: 0.75rem;
          }
          
          .header-title {
            font-size: 1rem;
          }
          
          .score-title {
            font-size: 1.25rem;
          }
          
          .feedback-item {
            padding: 1rem;
          }
          
          .feedback-item-title {
            font-size: 0.9375rem;
          }
          
          .feedback-item-text {
            font-size: 0.8125rem;
          }

       .start-button {
          background: #ff7a00 !important;
          border: none !important;
          color: #ffffff !important;
          padding: 0.875rem 2rem;
          border-radius: 12px;
          font-weight: 600;
          font-size: 1rem;
          width: 100%;
          max-width: 300px;
          margin: 0 auto;
          display: block;
          transition: all 0.2s ease;
        }

        .start-button:hover:not(:disabled) {
          background: #e96d00 !important;
          box-shadow: 0 6px 18px rgba(255, 122, 0, 0.25);
          transform: translateY(-1px);
        }

        .start-button:disabled {
          background: #ffd8b0 !important;
          color: white !important;
        }

        }

        .nav-button.btn-primary,
        .submit-button.btn-success {
          background: #ff7a00 !important;
          border-color: #ff7a00 !important;
        }

        .nav-button.btn-primary:hover,
        .submit-button.btn-success:hover {
          background: #e96d00 !important;
          border-color: #e96d00 !important;
        }

        .nav-button.btn-outline-primary,
        .try-again-button.btn-outline-primary {
          color: #ff7a00 !important;
          border-color: #ff7a00 !important;
        }

        .nav-button.btn-outline-primary:hover,
        .try-again-button.btn-outline-primary:hover {
          background: #ff7a00 !important;
          color: white !important;
        }

        .empty-score {
          color: #cbd5e0;
          font-style: italic;
        }


      `}</style>
    </Container>
  )
}

export default ListeningPractice
