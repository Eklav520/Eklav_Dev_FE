import React, { useState, useEffect } from 'react'
import { Container, Card, Form, Button, Row, Col, Spinner, ProgressBar, Badge, Modal } from 'react-bootstrap'
import { FaFeatherAlt, FaPlay, FaRedo, FaLightbulb, FaCheckCircle, FaPenNib, FaStar } from 'react-icons/fa'
import { useAuthContext } from '@/context/useAuthContext'

interface WritingFeedbackResult {
  score: number
  corrections?: string
  feedback?: FeedbackDetail
}

interface WritingHistoryUI {
  monthlyLimit: number
  attemptsUsed: number
  remainingAttempts: number
  bestScore: number | null
}

interface FeedbackDetail {
  overall?: string
  grammar?: string
  tone?: string
  suggestions?: string[]
}

interface Submission {
  _id?: string
  mode: string
  prompt: string
  text: string
  corrections?: string
  feedback?: FeedbackDetail
  score?: number
  createdAt?: string
}

type ModeType = 'essay' | 'email' | 'summary'

const WritingPractice: React.FC = () => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const token = user?.token
  const status = user?.status?.toLowerCase()

  const TRIAL_LIMIT = 5
  const PREMIUM_DEFAULT = 30

  const isTrial = status === 'pending'

  const [started, setStarted] = useState(false)
  const [mode, setMode] = useState<ModeType>('essay')
  const [prompt, setPrompt] = useState('')
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<WritingFeedbackResult | null>(null)
  const [fetchingPrompt, setFetchingPrompt] = useState(false)
  const [history, setHistory] = useState<WritingHistoryUI | null>(null)

  const [loadingHistory, setLoadingHistory] = useState(false)
  //const isMonthlyLimitReached = !!history && history.attemptsUsed >= history.monthlyLimit


  const startWriting = async () => {
    setStarted(true)
    setFeedback(null)
    setText('')
    setPrompt('')
    setFetchingPrompt(true)

    try {
      const res = await fetch(`${baseURL}/writing/prompt/${mode}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setPrompt(data?.prompt || 'Write about a topic of your choice.')
    } catch (err) {
      console.error('Error fetching AI prompt:', err)
      setPrompt('Write about a topic of your choice.')
    } finally {
      setFetchingPrompt(false)
    }
  }

  const fetchWritingHistory = async () => {
    if (!token || !user?.id) return

    try {
      setLoadingHistory(true)

      const res = await fetch(`${baseURL}/writing/history/${user.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) throw new Error('Failed to fetch writing history')

      const data = await res.json()

      // No history yet
      if (!Array.isArray(data) || data.length === 0) {
        setHistory({
          attemptsUsed: 0,
          monthlyLimit: isTrial ? TRIAL_LIMIT : PREMIUM_DEFAULT,
          remainingAttempts: isTrial ? TRIAL_LIMIT : PREMIUM_DEFAULT,
          bestScore: null,
        })
        return
      }

      const latest = data[0]
      const attempts = latest.attempts || []

      const rawAttemptsUsed = attempts.length

      const backendLimit = latest.monthlyLimit ?? PREMIUM_DEFAULT

      const monthlyLimit = isTrial ? TRIAL_LIMIT : backendLimit

      // 🔥 DO NOT clamp trial attempts
      const attemptsUsed = rawAttemptsUsed

      const remainingAttempts = Math.max(monthlyLimit - attemptsUsed, 0)


      // Prefer backend summary, fallback to computation
      const bestScore = latest.summary?.bestScore ?? (attempts.length > 0 ? Math.max(...attempts.map((a: any) => a.score ?? 0)) : null)

      setHistory({
        attemptsUsed,
        monthlyLimit,
        remainingAttempts,
        bestScore,
      })
    } catch (err) {
      console.error('Writing history error:', err)
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    if (token && user?.id) {
      fetchWritingHistory()
    }
  }, [token, user?.id])

  const maxAllowedAttempts = isTrial
    ? TRIAL_LIMIT
    : history?.monthlyLimit ?? PREMIUM_DEFAULT

  const isLimitReached =
    !!history && history.attemptsUsed >= maxAllowedAttempts

  const handleSubmit = async () => {
    if (!text.trim()) return alert('Please write your response first!')
    setLoading(true)
    try {
      const res = await fetch(`${baseURL}/writing/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentId: user?.id,
          mode,
          prompt,
          text,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setFeedback({
        score: data.score,
        corrections: data.feedback?.corrections,
        feedback: data.feedback?.feedback,
      })
    } catch (err) {
      console.error('Error submitting writing:', err)
    } finally {
      setLoading(false)
    }
  }

  const restartPractice = () => {
    setStarted(false)
    setFeedback(null)
    setPrompt('')
    setText('')
  }

  const getScoreVariant = (score: number) => {
    if (score >= 8) return 'success'
    if (score >= 6) return 'warning'
    return 'danger'
  }

  const getScoreFeedback = (score: number) => {
    if (score >= 9) return 'Excellent!'
    if (score >= 8) return 'Very Good!'
    if (score >= 7) return 'Good!'
    if (score >= 6) return 'Fair'
    return 'Needs Improvement'
  }

  const formatParagraphs = (text?: string) => {
    if (!text) return null // safely handle undefined
    return text
      .split(/\n+/)
      .filter((p) => p.trim() !== '')
      .map((p, i) => (
        <p key={i} className="mb-2">
          {p}
        </p>
      ))
  }

  return (
    <Container fluid className="writing-practice-container">
      <div className="start-screen text-center">
          <div className="start-card">
            <div className="icon-wrapper">
              <FaFeatherAlt className="main-icon" />
            </div>
            <h2>Writing Practice</h2>
            <p className="description">
              Enhance your writing skills with AI-powered feedback on grammar, tone, structure, and vocabulary. Get detailed analysis and improvement
              suggestions.
            </p>

            <div className="mode-selection mb-4">
              <label className="mode-label">Choose Writing Mode</label>
              <div className="mode-select-wrapper">
                <Form.Select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as ModeType)}
                  className="mode-selector"
                >
                  <option value="essay">📝 Essay Writing</option>
                  <option value="email">📧 Email Writing</option>
                  <option value="summary">📄 Summary Writing</option>
                </Form.Select>
              </div>
            </div>
            <Button variant="primary" size="lg" onClick={startWriting} disabled={fetchingPrompt || isLimitReached} className="start-button">
              {fetchingPrompt ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Generating Prompt...
                </>
              ) : (
                <>
                  <FaPlay className="me-2" />
                  Start {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </>
              )}
            </Button>
            {history && (
              <>
                <div className="writing-stats mt-4">
                  <div className={`stat-box attempts ${isLimitReached ? 'limit-reached' : ''}`}>
                    <div className="stat-label">
                      {isTrial ? 'Trial Attempts' : 'Monthly Attempts'}
                    </div>
                    <div className="stat-value">
                      {Math.min(history.attemptsUsed, maxAllowedAttempts)} / {maxAllowedAttempts}
                    </div>
                  </div>

                  <div className="stat-box score">
                    <div className="stat-label">Best Score</div>
                    <div className="stat-value">
                      {history.bestScore !== null ? `${history.bestScore}/10 ⭐` : 'No attempts yet'}
                    </div>
                  </div>
                </div>

                {/* 👇 ADD HERE */}
                {isTrial && isLimitReached && (
                  <div className="trial-limit-box-modern mt-3">
                    🔒 Trial limit reached. Upgrade to continue writing practice.
                  </div>
                )}
              </>
            )}

          </div>
        </div>

      <Modal show={started} fullscreen onHide={restartPractice} className="practice-fullscreen-modal">
        <Modal.Header closeButton style={{ background: 'linear-gradient(135deg, #ff6a00 0%, #ff9a3c 100%)', color: '#fff', borderBottom: 'none' }}>
          <Modal.Title style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: 700 }}>
            <FaFeatherAlt style={{ marginRight: 8 }} />
            {mode === 'essay' ? 'Essay Writing' : mode === 'email' ? 'Email Writing' : 'Summary Writing'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: '#f8fafc', overflow: 'hidden', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', height: 0, flex: 1 }}>
        <div className="practice-container">
          {/* Question Section - Top */}
          <Card className="question-card">
            <Card.Body className="question-body">
              <div className="question-header">
                <h4 className="question-title">
                  <FaPenNib className="me-2" />
                  Writing Topic
                </h4>
                <Badge bg="primary" className="mode-badge">
                  {mode.toUpperCase()}
                </Badge>
              </div>
              <div className="question-content">
                {fetchingPrompt ? (
                  <div className="loading-prompt text-center">
                    <Spinner animation="border" variant="primary" size="sm" className="me-2" />
                    Generating your writing prompt...
                  </div>
                ) : (
                  <p className="mb-0 question-text">{prompt}</p>
                )}
              </div>
            </Card.Body>
          </Card>

          {/* Writing and Feedback Section - Bottom */}
          <Row className="practice-layout g-2">
            {/* Left: Writing Area */}
            <Col md={6}>
              <Card className="writing-card">
                <Card.Header className="writing-header">
                  <FaFeatherAlt className="me-2" />
                  Your Response
                  <span className="word-count">
                    {text.length > 0 ? `${text.split(/\s+/).filter((word) => word.length > 0).length} words` : 'Start writing...'}
                  </span>
                </Card.Header>

                <Card.Body className="writing-body d-flex flex-column">
                  <Form.Group className="flex-grow-1 d-flex flex-column">
                    <Form.Control
                      as="textarea"
                      placeholder={`Start writing your ${mode} here... Express your thoughts clearly and creatively.`}
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      onPaste={(e) => e.preventDefault()}
                      onCopy={(e) => e.preventDefault()}
                      onCut={(e) => e.preventDefault()}
                      onContextMenu={(e) => e.preventDefault()}
                      className="writing-textarea flex-grow-1"
                      style={{ userSelect: 'none' }}
                    />
                  </Form.Group>

                  {/* Action Buttons */}
                  <div className="action-buttons mt-4">
                    <Row className="g-3">
                      <Col md={6}>
                        <Button
                          variant="success"
                          disabled={loading || !text.trim() || isLimitReached}
                          onClick={handleSubmit}
                          className="w-100 submit-button">
                          {loading ? (
                            <>
                              <Spinner animation="border" size="sm" className="me-2" />
                              Evaluating...
                            </>
                          ) : (
                            <>
                              <FaCheckCircle className="me-2" />
                              Submit
                            </>
                          )}
                        </Button>
                      </Col>
                      <Col md={6}>
                        <Button variant="outline-primary" onClick={restartPractice} className="w-100 restart-button">
                          <FaRedo className="me-2" />
                          Try Another Topic
                        </Button>
                      </Col>
                    </Row>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {/* Right: AI Feedback */}
            <Col md={6}>
              <Card className="feedback-card">
                <Card.Header className="feedback-header">
                  <FaLightbulb className="me-2" />
                  AI Feedback & Analysis
                </Card.Header>

                <Card.Body className="feedback-body">
                  {loading ? (
                    <div className="loading-feedback text-center d-flex flex-column justify-content-center align-items-center">
                      <Spinner animation="border" variant="info" />
                      <h5 className="mt-3 text-info">Analyzing Your Writing</h5>
                      <p className="text-muted">Our AI is evaluating your grammar, tone, and structure...</p>
                    </div>
                  ) : feedback ? (
                    <div className="feedback-content">
                      {/* Score Section */}
                      <div className="score-display text-center mb-4">
                        <h3 className="fw-bold mb-3">Your Writing Score</h3>
                        <div className="score-circle mb-3">
                          <span className="score-number">{feedback.score}/10</span>
                          <span className="score-text">{getScoreFeedback(feedback.score!)}</span>
                        </div>
                        <ProgressBar now={feedback.score! * 10} variant={getScoreVariant(feedback.score!)} className="score-bar" />
                      </div>

                      {/* Corrected Version */}
                      {feedback.corrections && (
                        <div className="feedback-item corrected-version mb-3">
                          <h6 className="fw-bold">
                            <FaCheckCircle className="me-2" />
                            Corrected Version
                          </h6>
                          {feedback.corrections && <div className="content-box">{formatParagraphs(feedback.corrections)}</div>}
                        </div>
                      )}

                      {/* Detailed Feedback */}
                      {feedback.feedback && (
                        <>
                          {/* Overall Feedback */}
                          {feedback.feedback.overall && (
                            <div className="feedback-item overall-feedback mb-3">
                              <h6 className="fw-bold">
                                <FaStar className="me-2" />
                                Overall Feedback
                              </h6>
                              {feedback.feedback?.overall && <div className="content-box">{formatParagraphs(feedback.feedback?.overall)}</div>}
                            </div>
                          )}

                          {/* Skills Assessment */}
                          {(feedback.feedback.grammar || feedback.feedback.tone) && (
                            <div className="feedback-item skills-assessment mb-3">
                              <h6 className="fw-bold mb-3">Skills Breakdown</h6>
                              <Row className="g-2">
                                {feedback.feedback.grammar && (
                                  <Col md={6}>
                                    <div className="skill-card grammar h-100">
                                      <div className="skill-icon">📚</div>
                                      <div className="skill-content">
                                        <h6 className="fw-bold">Grammar & Vocabulary</h6>
                                        {feedback.feedback?.grammar && <p className="mb-0 small">{formatParagraphs(feedback.feedback?.grammar)}</p>}
                                      </div>
                                    </div>
                                  </Col>
                                )}
                                {feedback.feedback.tone && (
                                  <Col md={6}>
                                    <div className="skill-card tone h-100">
                                      <div className="skill-icon">🎯</div>
                                      <div className="skill-content">
                                        <h6 className="fw-bold">Tone & Structure</h6>
                                        {feedback.feedback?.tone && <p className="mb-0 small">{formatParagraphs(feedback.feedback?.tone)}</p>}
                                      </div>
                                    </div>
                                  </Col>
                                )}
                              </Row>
                            </div>
                          )}

                          {/* Suggestions */}
                          {feedback.feedback.suggestions?.length ? (
                            <div className="feedback-item recommendations">
                              <h6 className="fw-bold">
                                <FaLightbulb className="me-2" />
                                Suggestions for Improvement
                              </h6>
                              <div className="content-box">
                                <ul className="mb-0 suggestions-list">
                                  {feedback.feedback.suggestions.map((s, i) => (
                                    <li key={i}>{s}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          ) : null}
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="empty-feedback text-center d-flex flex-column justify-content-center align-items-center">
                      <div className="display-1 text-muted mb-3">✍️</div>
                      <h5 className="text-muted">Ready for Feedback</h5>
                      <p className="text-muted">Submit your writing to receive detailed AI feedback on your skills.</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
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

        .writing-practice-container {
          padding: 2rem;
          min-height: 80vh;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          max-width: 1800px;
          margin: 0 auto;
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
          padding: 1.5rem;
          border-radius: 14px;
          box-shadow: 0 25px 80px rgba(0, 0, 0, 0.15);
          text-align: center;
          max-width: 600px;
          width: 100%;
        }

       .icon-wrapper {
          width: 50px;
          height: 50px;
          margin: 0 auto 1rem auto;   /* 🔥 CENTER FIX */
          display: flex;
          align-items: center;
          justify-content: center;
        }


        .main-icon {
          font-size: 22px;
          color: #ff7a00;
        }

        .start-card h2 {
          color: #2d3748;
          margin-bottom: 0.75rem;
          font-weight: 700;
          font-size: 2rem;
        }

        .description {
          font-size: 1rem;
          margin-bottom: 1.5rem;
          max-width: 520px;
          margin-left: auto;
          margin-right: auto;
        }


       .mode-selection {
        max-width: 380px;
        margin: 0 auto 1.5rem;
        text-align: center;   /* 🔥 Fix */
        }

        .start-button {
        width: 260px;   /* cleaner */
        margin: 0 auto;
        display: block;
        }

        .writing-stats {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-top: 1.5rem;
        }

        .stat-box {
          padding: 0.8rem 1.2rem;
        }




        .mode-label {
          display: block;
          text-align: center;
          font-weight: 600;
          font-size: 0.95rem;
          color: #4a5568;
          margin-bottom: 0.5rem;
        }
        
        .mode-select-wrapper {
          position: relative;
        }

        .mode-selector {
          border-radius: 14px !important;
          border: 2px solid #ffe0cc !important;
          padding: 0.85rem 1rem !important;
          font-size: 1.05rem;
          font-weight: 500;
          background-color: white !important;
          color: black;
          transition: all 0.25s ease;
          box-shadow: 0 4px 12px rgba(255, 122, 0, 0.05);
        }

        /* Make select dropdown arrow black */
        .mode-selector {
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;

          background-image: url("data:image/svg+xml;utf8,<svg fill='black' height='20' viewBox='0 0 20 20' width='20' xmlns='http://www.w3.org/2000/svg'><path d='M5.516 7.548a.625.625 0 0 1 .884-.032L10 10.89l3.6-3.374a.625.625 0 1 1 .852.916l-4.026 3.774a.625.625 0 0 1-.852 0L5.548 8.432a.625.625 0 0 1-.032-.884z'/></svg>");
          
          background-repeat: no-repeat;
          background-position: right 1rem center;
          background-size: 18px;
        }

        .mode-selector:focus {
          border-color: #ff7a00 !important;
          box-shadow: 0 0 0 0.2rem rgba(255, 122, 0, 0.25) !important;
          background-color: #ffffff !important;
        }

        .mode-selector:hover {
          border-color: #ff9a3c !important;
        }

        .start-button {
            padding: 1.2rem 3rem;
            border-radius: 12px;
            font-size: 1.2rem;
            font-weight: 600;
            background: linear-gradient(135deg, #ff6a00 0%, #ff9a3c 100%);
            border: none;
            transition: all 0.3s ease;
          }

          .start-button:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(255, 122, 0, 0.35);
        }


        /* Practice Container */
        .practice-container {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        /* Question Card - Top (compact) */
        .question-card {
          border: none;
          border-radius: 14px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.07);
          background: #ffffff;
          flex-shrink: 0;
        }

        .question-body {
          padding: 1rem 1.25rem;
        }

        .question-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .question-title {
          color: #2d3748;
          font-weight: 700;
          font-size: 1rem;
          margin: 0;
          display: flex;
          align-items: center;
        }

        .mode-badge {
          font-size: 0.75rem;
          padding: 0.3rem 0.85rem;
          border-radius: 20px;
          background: #ff7a00 !important;
        }

        .question-content {
          background: #fff9f5;
          padding: 0.75rem 1rem;
          border-radius: 10px;
          border-left: 4px solid #ff7a00;
        }

        .question-text {
          color: #2d3748;
          font-size: 1.05rem;
          line-height: 1.6;
          font-weight: 650;
          margin: 0;
        }

        .loading-prompt {
          color: #667eea;
          font-weight: 500;
          font-size: 0.9rem;
        }

        /* Practice Layout — fills remaining height */
        .practice-layout {
          flex: 1;
          min-height: 0;
          align-items: stretch;
          margin-left: 0;
          margin-right: 0;
          width: 100%;
        }

        .practice-layout > [class*="col-"] {
          display: flex;
          flex-direction: column;
        }

        /* Writing Card */
        .writing-card {
          border: none;
          border-radius: 14px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.07);
          background: #ffffff;
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }

        .writing-header {
          background: linear-gradient(135deg, #ff6a00 0%, #ff9a3c 100%);
          color: white;
          font-size: 1rem;
          font-weight: 600;
          padding: 0.75rem 1.25rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: none;
          border-radius: 14px 14px 0 0 !important;
          flex-shrink: 0;
        }

        .word-count {
          background: rgba(255, 255, 255, 0.2);
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .writing-body {
          padding: 1rem 1.25rem;
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
          overflow: hidden;
        }

        .writing-body .form-group,
        .writing-body .flex-grow-1 {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
        }

        .writing-textarea {
          border-radius: 10px;
          border: 2px solid #e2e8f0;
          padding: 1rem;
          font-size: 1rem;
          line-height: 1.6;
          resize: none;
          flex: 1;
          min-height: 120px;
          background: #ffffff !important;
          color: #2d3748 !important;
          transition: border-color 0.2s ease;
          font-family: 'Inter', sans-serif;
        }

        .writing-textarea:focus {
          border-color: #ff7a00;
          box-shadow: 0 0 0 0.2rem rgba(255, 122, 0, 0.2);
        }

        /* Action Buttons */
        .action-buttons {
          margin-top: 0.75rem;
          flex-shrink: 0;
        }

        .submit-button, .restart-button {
          padding: 0.6rem 1.25rem;
          border-radius: 10px;
          font-size: 0.95rem;
          font-weight: 600;
          border: none;
          transition: all 0.2s ease;
        }

        .submit-button {
          background: linear-gradient(135deg, #ff6a00 0%, #ff9a3c 100%);
        }

        .submit-button:hover:not(:disabled) {
          box-shadow: 0 6px 18px rgba(255, 122, 0, 0.35);
        }

        .restart-button {
          border: 2px solid #ff7a00 !important;
          color: #ff7a00 !important;
          background: transparent !important;
        }

        .restart-button:hover {
          background: #ff7a00 !important;
          color: white !important;
        }

        /* Feedback Card */
        .feedback-card {
          border: none;
          border-radius: 14px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.07);
          background: #ffffff;
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }

        .feedback-header {
          background: linear-gradient(135deg, #ff6a00 0%, #ff9a3c 100%);
          color: white;
          font-size: 1rem;
          font-weight: 600;
          padding: 0.75rem 1.25rem;
          border-bottom: none;
          border-radius: 14px 14px 0 0 !important;
          flex-shrink: 0;
        }

        .feedback-body {
          padding: 1rem 1.25rem;
          flex: 1;
          overflow-y: auto;
          min-height: 0;
        }

        .feedback-content {
          min-height: 0;
        }

        .empty-feedback {
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 0.25rem;
        }

        .empty-feedback .display-1 {
          font-size: 2.5rem;
        }

        .empty-feedback h5 {
          font-size: 1rem;
          margin: 0;
        }

        .empty-feedback p {
          font-size: 0.85rem;
          max-width: 220px;
          margin: 0;
          color: #a0aec0;
        }

        .loading-feedback {
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 0.5rem;
        }

        /* Score Display */
        .score-display h3 {
          color: #2d3748;
          font-weight: 700;
          font-size: 1.6rem;
        }

        .score-circle {
          background: linear-gradient(135deg, #ff6a00 0%, #ff9a3c 100%);
          box-shadow: 0 10px 30px rgba(255, 122, 0, 0.4);
          color: white;
          width: 130px;
          height: 130px;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
          box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
        }

        .score-number {
          font-size: 2rem;
          font-weight: 700;
          line-height: 1;
        }

        .score-text {
          font-size: 0.85rem;
          opacity: 0.9;
          margin-top: 0.4rem;
        }

        .score-bar {
          height: 10px;
          border-radius: 5px;
          max-width: 280px;
          margin: 0 auto;
        }

        /* Feedback Items */
        .feedback-item {
          padding: 1.25rem;
          border-radius: 14px;
          margin-bottom: 1.25rem;
        }

        .feedback-item h6 {
          font-weight: 600;
          margin-bottom: 0.75rem;
          color: #2d3748;
          display: flex;
          align-items: center;
          font-size: 1.1rem;
        }

        .corrected-version {
          background: #e3f2fd;
          border-left: 5px solid #1976d2;
        }

        .overall-feedback {
          background: #f0fff4;
          border-left: 5px solid #48bb78;
        }

        .skills-assessment {
          background: #f7fafc;
          border-left: 5px solid #ed8936;
        }

        .recommendations {
          background: #fffaf0;
          border-left: 5px solid #ed8936;
        }

        .general-feedback {
          background: #f0f9ff;
          border-left: 5px solid #0ea5e9;
        }

        .content-box {
          line-height: 1.6;
          color: #4a5568;
          font-size: 1rem;
        }

        .suggestions-list {
          padding-left: 1.25rem;
          margin-bottom: 0;
        }

        .suggestions-list li {
          margin-bottom: 0.4rem;
          line-height: 1.5;
        }

        .suggestions-list li:last-child {
          margin-bottom: 0;
        }

        /* Skill Cards */
        .skill-card {
          background: white;
          padding: 1rem;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          transition: all 0.3s ease;
          height: 100%;
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
        }

        .skill-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
        }

        .skill-icon {
          font-size: 1.3rem;
          flex-shrink: 0;
          margin-top: 0.2rem;
        }

        .skill-content h6 {
          margin: 0 0 0.5rem 0;
          font-size: 0.9rem;
        }

        .skill-content p {
          margin: 0;
          font-size: 0.85rem;
          color: #718096;
          line-height: 1.4;
        }

        /* Responsive Design */
        @media (max-width: 1200px) {
          .writing-practice-container {
            padding: 1.5rem;
          }
        }

        @media (max-width: 768px) {
          .writing-practice-container {
            padding: 1rem;
          }

          .start-card {
            padding: 2.5rem 2rem;
          }

          .question-body {
            padding: 2rem;
          }

          .question-header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }

          .question-content {
            padding: 1.5rem;
          }

          .writing-body,
          .feedback-body {
            padding: 1.5rem;
          }

          .writing-header,
          .feedback-header {
            padding: 1.25rem;
            font-size: 1.1rem;
            flex-direction: column;
            gap: 0.75rem;
            text-align: center;
          }

          .writing-textarea {
            min-height: 300px;
            font-size: 1rem;
          }

          .action-buttons .btn {
            width: 100%;
          }

          .score-circle {
            width: 110px;
            height: 110px;
          }
        }
        
        .writing-stats {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.stat-box {
  background: #fff7f0;
  border: 2px solid #ffe0cc;
  padding: 0.9rem 1.5rem;
  border-radius: 14px;
  min-width: 170px;
  text-align: center;
  transition: all 0.3s ease;
}

.stat-box:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(255, 122, 0, 0.15);
}

.stat-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #9a3412;
  margin-bottom: 0.3rem;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #ff6a00;
}

/* If limit reached */
.stat-box.limit-reached {
  background: #fff1f2;
  border-color: #fecaca;
}

.stat-box.limit-reached .stat-value {
  color: #dc2626;
}

      `}</style>
    </Container>
  )
}

export default WritingPractice
