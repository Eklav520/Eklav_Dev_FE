import React, { useState, useEffect } from "react"
import { Card, Container, Button, Spinner, Form, ProgressBar, Badge, Modal } from "react-bootstrap"
import { FaBookReader, FaPlay, FaArrowRight, FaArrowLeft, FaCheckCircle, FaCalendarCheck } from "react-icons/fa"
import { useAuthContext } from "@/context/useAuthContext"

interface Word {
  _id: string
  word: string
  meaning: string
  example?: string
  quizOptions: string[]
  correctAnswer: string
}

interface Feedback {
  word: string
  yourAnswer: string
  correct: string
  isCorrect: boolean
}

const VocabularyPractice: React.FC = () => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const token = user?.token

  const [started, setStarted] = useState(false)
  const [words, setWords] = useState<Word[]>([])
  const [answers, setAnswers] = useState<{ [id: string]: string }>({})
  const [feedback, setFeedback] = useState<Feedback[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [statusLoading, setStatusLoading] = useState(true)
  const [todayScore, setTodayScore] = useState<{ score: number; total: number } | null>(null)

  // pagination states
  const [currentPage, setCurrentPage] = useState(0)
  const wordsPerPage = 4

  const startIndex = currentPage * wordsPerPage
  const currentWords = words.slice(startIndex, startIndex + wordsPerPage)
  const totalPages = Math.ceil(words.length / wordsPerPage)

  // On mount — check if student already did today's exam
  useEffect(() => {
    const checkStatus = async () => {
      if (!token || !baseURL) { setStatusLoading(false); return }
      try {
        const res = await fetch(`${baseURL}/learning/vocab/today/status`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (data.words?.length) setWords(data.words)
        if (data.completed && data.attempt) {
          setTodayScore({ score: data.attempt.score, total: data.attempt.total })
          setFeedback(data.attempt.feedback)
        }
      } catch (err) {
        console.error("Error checking vocab status", err)
      } finally {
        setStatusLoading(false)
      }
    }
    checkStatus()
  }, [token, baseURL])

  const startVocabulary = async () => {
    setStarted(true)
    setLoading(true)
    setAnswers({})
    setCurrentPage(0)

    try {
      // words already loaded from status check, but fetch fresh if empty
      if (!words.length) {
        const res = await fetch(`${baseURL}/learning/vocab/daily`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        setWords(data)
      }
    } catch (err) {
      console.error("Error fetching vocabulary:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (wordId: string, selected: string) => {
    setAnswers({ ...answers, [wordId]: selected })
  }

  const handleSubmit = async () => {
    if (!Object.keys(answers).length) return
    setLoading(true)
    setFeedback(null)

    try {
      const res = await fetch(`${baseURL}/learning/vocab/quiz/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ answers }),
      })
      const data = await res.json()
      setFeedback(data.feedback)
      setTodayScore({ score: data.score, total: data.total })
    } catch (err) {
      console.error("Quiz submit failed:", err)
    } finally {
      setLoading(false)
    }
  }

  const score = todayScore?.score ?? (feedback ? feedback.filter((f) => f.isCorrect).length : 0)
  const total = todayScore?.total ?? words.length
  const scorePercentage = total > 0 ? (score / total) * 100 : 0
  const alreadyDoneToday = !!todayScore && !started

  if (statusLoading) {
    return (
      <Container fluid className="vocabulary-practice-container">
        <div className="start-screen text-center">
          <Spinner animation="border" style={{ color: '#ff7a00' }} />
          <p style={{ marginTop: 12, color: '#888' }}>Loading today's vocabulary...</p>
        </div>
      </Container>
    )
  }

  return (
    <Container fluid className="vocabulary-practice-container">
      <div className="start-screen text-center">
          <div className="start-card">
            <div className="icon-wrapper">
              {alreadyDoneToday
                ? <FaCalendarCheck className="main-icon" style={{ color: '#22c55e' }} />
                : <FaBookReader className="main-icon" />
              }
            </div>
            <h2>Vocabulary Practice</h2>

            {alreadyDoneToday ? (
              <>
                <div className="done-score-badge">
                  <span className="done-score">{score}/{total}</span>
                  <span className="done-pct">{Math.round(scorePercentage)}%</span>
                </div>
                <p className="description" style={{ color: '#22c55e', fontWeight: 600 }}>
                  ✅ You've completed today's vocabulary exam!
                </p>
                <p className="description" style={{ fontSize: '0.9rem', marginTop: -10 }}>
                  Come back tomorrow for 10 new words.
                </p>
                <Button size="lg" className="start-button" onClick={() => setStarted(true)}>
                  📖 Review Today's Words & Result
                </Button>
              </>
            ) : (
              <>
                <p className="description">
                  Improve your vocabulary every day! Learn today's 10 AI-powered words and test yourself with a quiz.
                </p>
                <Button size="lg" className="start-button" onClick={startVocabulary}>
                  <FaPlay className="me-2" /> Start Today's Exam
                </Button>
              </>
            )}
          </div>
        </div>

      <Modal show={started} fullscreen onHide={() => setStarted(false)} className="practice-fullscreen-modal">
        <Modal.Header closeButton style={{ background: 'linear-gradient(135deg, #ff6a00 0%, #ff9a3c 100%)', color: '#fff', borderBottom: 'none' }}>
          <Modal.Title style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: 700 }}>
            <FaBookReader style={{ marginRight: 8 }} /> Vocabulary Practice
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: '#f8fafc', overflowY: 'auto', padding: '2rem 1.5rem' }}>
          <div className="practice-layout">
          {/* Main Vocabulary Area - Full Width */}
          <div className="vocabulary-section">
            <Card className="vocabulary-card">
              <Card.Header className="vocabulary-header">
                <FaBookReader className="me-2" />
                Daily Word List
                <span className="progress-indicator">
                  {String(currentPage + 1).padStart(2, '0')} / {String(totalPages).padStart(2, '0')}
                </span>
              </Card.Header>
              
              <Card.Body className="vocabulary-body">
                {loading && !feedback ? (
                  <div className="loading-state">
                    <Spinner animation="border" variant="primary" />
                    <p>Generating daily words...</p>
                  </div>
                ) : words.length > 0 ? (
                  <>
                    <div className="words-grid">
                      {currentWords.map((word, idx) => (
                        <div key={word._id || idx} className="word-card">
                          <div className="word-header">
                            <h4 className="word-text">
                              {startIndex + idx + 1}. {word.word}
                            </h4>
                            <Badge bg="primary" className="word-number">
                              Word {startIndex + idx + 1}
                            </Badge>
                          </div>
                          
                          <div className="word-details">
                            <div className="meaning-section">
                              <h6>Meaning</h6>
                              <p>{word.meaning}</p>
                            </div>
                            
                            {word.example && (
                              <div className="example-section">
                                <h6>Example</h6>
                                <p className="example-text">"{word.example}"</p>
                              </div>
                            )}

                            {/* Quiz Options */}
                            <div className="quiz-section">
                              <h6>Choose the correct meaning:</h6>
                              <div className="options-grid">
                                {word.quizOptions.map((opt, i) => (
                                  <div
                                    key={i}
                                    className="option-item"
                                    onClick={() => handleChange(word._id, opt)}
                                  >
                                    <Form.Check
                                      type="radio"
                                      id={`${word._id}-${i}`}
                                      name={`word-${word._id}`}
                                      label={opt}
                                      value={opt}
                                      checked={answers[word._id] === opt}
                                      onChange={(e) => handleChange(word._id, e.target.value)}
                                      className="custom-radio"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="navigation-buttons">
                      <Button
                        variant="outline-primary"
                        disabled={currentPage === 0}
                        onClick={() => setCurrentPage(currentPage - 1)}
                        className="nav-button prev-button"
                      >
                        <FaArrowLeft className="me-2" />
                        Previous
                      </Button>

                      {currentPage < totalPages - 1 ? (
                        <Button
                          variant="primary"
                          onClick={() => setCurrentPage(currentPage + 1)}
                          className="nav-button next-button"
                        >
                          Next
                          <FaArrowRight className="ms-2" />
                        </Button>
                      ) : (
                        <Button
                          variant="success"
                          size="lg"
                          onClick={handleSubmit}
                          disabled={Object.keys(answers).length !== words.length}
                          className="submit-button"
                        >
                          <FaCheckCircle className="me-2" />
                          Submit Quiz
                        </Button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="error-state">
                    <p>No words available. Please try again.</p>
                    <Button variant="outline-primary" onClick={startVocabulary}>
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
                <Card.Header className="feedback-header">
                  💡 AI Feedback & Results
                </Card.Header>
                <Card.Body className="feedback-body">
                  <div className="score-display">
                    <h3>Your Score</h3>
                    <div className="score-circle">
                      <span className="score-number">
                        {score}/{words.length}
                      </span>
                      <span className="score-percentage">
                        ({Math.round(scorePercentage)}%)
                      </span>
                    </div>
                    <ProgressBar
                      now={scorePercentage}
                      variant={
                        scorePercentage >= 70
                          ? "success"
                          : scorePercentage >= 40
                          ? "warning"
                          : "danger"
                      }
                      className="score-bar"
                    />
                  </div>

                  <div className="feedback-content">
                    <div className="feedback-item results">
                      <h6>📊 Quiz Results</h6>
                      <div className="results-grid">
                        {feedback.map((f, i) => (
                          <div key={i} className="result-item">
                            <div className="word-info">
                              <span className="word">{f.word}</span>
                              <div className="answers">
                                <div className="answer your-answer">
                                  <span className="label">Your Answer:</span>
                                  <Badge bg={f.isCorrect ? "success" : "danger"}>
                                    {f.yourAnswer || "Not answered"}
                                  </Badge>
                                </div>
                                <div className="answer correct-answer">
                                  <span className="label">Correct Answer:</span>
                                  <Badge bg="info">{f.correct}</Badge>
                                </div>
                              </div>
                            </div>
                            <div className={`status-indicator ${f.isCorrect ? 'correct' : 'incorrect'}`}>
                              {f.isCorrect ? '✓' : '✗'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="feedback-item encouragement">
                      <h6>🌟 Keep Learning!</h6>
                      <p className="encouragement-text">
                        {scorePercentage === 100
                          ? "🎉 Perfect score! You're mastering new vocabulary!"
                          : scorePercentage >= 70
                          ? "🌟 Excellent work! You're building a strong vocabulary foundation!"
                          : scorePercentage >= 40
                          ? "💡 Good progress! Regular practice will help you improve even more!"
                          : "📚 Every word learned is a step forward. Keep practicing!"}
                      </p>
                    </div>
                  </div>

                  <div className="action-buttons">
                    <p style={{ color: '#888', fontSize: '0.9rem', margin: 0 }}>
                      🗓️ Come back tomorrow for 10 new words!
                    </p>
                  </div>
                </Card.Body>
              </Card>
            </div>
          )}
        </div>
        </Modal.Body>
      </Modal>

      <style>{`
        .practice-fullscreen-modal .modal-header .btn-close {
          filter: invert(1) brightness(2);
          opacity: 0.9;
        }
        .practice-fullscreen-modal .modal-header .btn-close:hover {
          opacity: 1;
        }

        .vocabulary-practice-container {
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
          padding: 1rem 2.5rem;
          border-radius: 12px;
          font-size: 1.1rem;
          font-weight: 600;
        }

        /* Practice Layout */
        .practice-layout {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        /* Vocabulary Section */
        .vocabulary-section {
          width: 100%;
        }

        .vocabulary-card {
          border: none;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          background: #ffffff;
        }

        .vocabulary-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

        .vocabulary-body {
          padding: 2.5rem;
          background: #ffffff;
        }

        /* Words Grid */
        .words-grid {
          display: grid;
          gap: 2rem;
          margin-bottom: 2.5rem;
        }

        .word-card {
          background: #f8fafc;
          padding: 2rem;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          transition: all 0.3s ease;
        }

        .word-card:hover {
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }

        .word-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
        }

        .word-text {
          color: #2d3748;
          font-weight: 700;
          font-size: 1.5rem;
          margin: 0;
          background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .word-number {
          font-size: 0.8rem;
          padding: 0.4rem 0.8rem;
        }

        .word-details {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .meaning-section, .example-section, .quiz-section {
          background: white;
          padding: 1.25rem;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .meaning-section h6, .example-section h6, .quiz-section h6 {
          color: #2d3748;
          font-weight: 600;
          margin-bottom: 0.75rem;
          font-size: 1rem;
        }

        .meaning-section p, .example-section p {
          margin: 0;
          color: #4a5568;
          line-height: 1.5;
        }

        .example-text {
          font-style: italic;
          color: #718096;
        }

        .options-grid {
          display: grid;
          gap: 0.75rem;
        }

        .option-item {
          background: #f7fafc;
          padding: 1rem 1.25rem;
          border-radius: 8px;
          border: 2px solid #e2e8f0;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .option-item:hover {
          border-color: #667eea;
          background: #f0f4ff;
        }

        .custom-radio :global(.form-check-input) {
          width: 1.2em;
          height: 1.2em;
          margin-right: 0.75rem;
          border: 2px solid #cbd5e0;
        }

        .custom-radio :global(.form-check-input:checked) {
          background-color: #667eea;
          border-color: #667eea;
        }

        .custom-radio :global(.form-check-label) {
          font-size: 1rem;
          font-weight: 500;
          color: #2d3748;
          cursor: pointer;
          line-height: 1.4;
        }

        /* Navigation */
        .navigation-buttons {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 2rem;
        }

        .nav-button, .submit-button {
          padding: 1rem 2rem;
          border-radius: 12px;
          font-weight: 600;
          font-size: 1.1rem;
          min-width: 150px;
          border: none;
          transition: all 0.3s ease;
        }

        .nav-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .nav-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        }

        .submit-button {
          background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
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
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
          margin-bottom: 1rem;
          color: #2d3748;
        }

        .results {
          background: #f7fafc;
          border-left: 4px solid #4299e1;
        }

        .encouragement {
          background: #fffaf0;
          border-left: 4px solid #ed8936;
        }

        .encouragement-text {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 500;
          color: #4a5568;
          text-align: center;
        }

        .results-grid {
          display: grid;
          gap: 1rem;
        }

        .result-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .word-info {
          flex: 1;
        }

        .word {
          display: block;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 0.5rem;
          font-size: 1.1rem;
        }

        .answers {
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

        .status-indicator {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 1rem;
          margin-left: 1rem;
        }

        .status-indicator.correct {
          background: #c6f6d5;
          color: #22543d;
        }

        .status-indicator.incorrect {
          background: #fed7d7;
          color: #742a2a;
        }

        .action-buttons {
          text-align: center;
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .vocabulary-card,
          .feedback-card {
            background: #2d3748;
          }

          .vocabulary-body,
          .feedback-body {
            background: #2d3748;
          }

          .word-text {
            color: #ffffff;
            background: linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .custom-radio :global(.form-check-label) {
            color: #e2e8f0;
          }

          .word-card {
            background: #4a5568;
            border-color: #718096;
          }

          .meaning-section, .example-section, .quiz-section {
            background: #4a5568;
            border-color: #718096;
          }

          .meaning-section h6, .example-section h6, .quiz-section h6 {
            color: #e2e8f0;
          }

          .meaning-section p, .example-section p {
            color: #cbd5e0;
          }

          .option-item {
            background: #5a6778;
            border-color: #718096;
          }

          .option-item:hover {
            background: #6b7888;
            border-color: #667eea;
          }

          .feedback-item h6 {
            color: #e2e8f0;
          }

          .encouragement-text {
            color: #cbd5e0;
          }

          .result-item {
            background: #4a5568;
            border-color: #718096;
          }

          .word {
            color: #e2e8f0;
          }
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .vocabulary-practice-container {
            padding: 1rem;
          }

          .start-card {
            padding: 2rem 1.5rem;
          }

          .vocabulary-body {
            padding: 1.5rem;
          }

          .words-grid {
            gap: 1.5rem;
          }

          .word-card {
            padding: 1.5rem;
          }

          .word-header {
            flex-direction: column;
            gap: 0.5rem;
            align-items: flex-start;
          }

          .word-text {
            font-size: 1.3rem;
          }

          .options-grid {
            grid-template-columns: 1fr;
          }

          .score-circle {
            width: 100px;
            height: 100px;
          }

          .navigation-buttons {
            flex-direction: column;
            gap: 1rem;
          }

          .nav-button, .submit-button {
            min-width: 100%;
            padding: 1rem 1.5rem;
          }

          .answers {
            grid-template-columns: 1fr;
            gap: 0.5rem;
          }

          .result-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .status-indicator {
            align-self: flex-end;
          }
        }

        .done-score-badge {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin: 0 auto 1rem;
          width: 100px; height: 100px;
          border-radius: 50%;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white;
          justify-content: center;
          box-shadow: 0 8px 24px rgba(34,197,94,0.35);
        }
        .done-score { font-size: 1.5rem; font-weight: 800; line-height: 1; }
        .done-pct   { font-size: 0.8rem; opacity: 0.9; }

        .start-button {
        background: linear-gradient(135deg, #ff6a00 0%, #ff9a3c 100%) !important;
        border: none !important;
        color: white !important;
        padding: 1rem 2.5rem;
        border-radius: 14px;
        font-size: 1.1rem;
        font-weight: 600;
        transition: all 0.25s ease;
      }

      .start-button:hover {
        background: linear-gradient(135deg, #e55f00 0%, #ff8c1a 100%) !important;
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(255, 122, 0, 0.35);
      }

      .start-button:active {
        transform: translateY(0);
        box-shadow: none;
      }

      `}</style>
    </Container>
  )
}

export default VocabularyPractice