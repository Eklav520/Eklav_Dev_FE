import React, { useState, useEffect } from 'react'
import { Container, Card, Form, Button, Row, Col, Spinner, ProgressBar, Badge, Modal } from 'react-bootstrap'
import { FaFeatherAlt, FaPlay, FaRedo, FaLightbulb, FaCheckCircle, FaPenNib } from 'react-icons/fa'
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
        <Modal.Body style={{ background: '#f8fafc', overflowY: 'auto', padding: '1rem 1.25rem' }}>
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
                  <div className="action-buttons">
                    <Button
                      disabled={loading || !text.trim() || isLimitReached}
                      onClick={handleSubmit}
                      className="submit-button">
                      {loading ? (
                        <><Spinner animation="border" size="sm" className="me-1" />Evaluating...</>
                      ) : (
                        <><FaCheckCircle className="me-1" />Submit</>
                      )}
                    </Button>
                    <Button onClick={restartPractice} className="restart-button">
                      <FaRedo className="me-1" />New Topic
                    </Button>
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

                      {/* Score Row */}
                      <div className="score-row">
                        <div className="score-circle-sm">
                          <span className="score-num">{feedback.score}</span>
                          <span className="score-denom">/10</span>
                        </div>
                        <div className="score-details">
                          <div className="score-label">{getScoreFeedback(feedback.score!)}</div>
                          <ProgressBar now={feedback.score! * 10} variant={getScoreVariant(feedback.score!)} className="score-bar" />
                          <div className="score-hint">{feedback.score! >= 7 ? 'Great work! Keep it up.' : feedback.score! >= 4 ? 'Good effort, room to improve.' : 'Keep practising — you\'ll get there!'}</div>
                        </div>
                      </div>

                      {/* Corrected Version */}
                      {feedback.corrections && (
                        <div className="fb-section fb-correction">
                          <div className="fb-section-title"><span className="fb-icon">✅</span>Corrected Version</div>
                          <div className="fb-section-body">{formatParagraphs(feedback.corrections)}</div>
                        </div>
                      )}

                      {feedback.feedback && (
                        <>
                          {feedback.feedback.overall && (
                            <div className="fb-section fb-overall">
                              <div className="fb-section-title"><span className="fb-icon">⭐</span>Overall Feedback</div>
                              <div className="fb-section-body">{formatParagraphs(feedback.feedback.overall)}</div>
                            </div>
                          )}

                          {(feedback.feedback.grammar || feedback.feedback.tone) && (
                            <div className="fb-skills-row">
                              {feedback.feedback.grammar && (
                                <div className="fb-skill-chip">
                                  <span className="fb-skill-icon">📚</span>
                                  <div>
                                    <div className="fb-skill-title">Grammar</div>
                                    <div className="fb-skill-text">{formatParagraphs(feedback.feedback.grammar)}</div>
                                  </div>
                                </div>
                              )}
                              {feedback.feedback.tone && (
                                <div className="fb-skill-chip">
                                  <span className="fb-skill-icon">🎯</span>
                                  <div>
                                    <div className="fb-skill-title">Tone & Structure</div>
                                    <div className="fb-skill-text">{formatParagraphs(feedback.feedback.tone)}</div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {feedback.feedback.suggestions?.length ? (
                            <div className="fb-section fb-suggestions">
                              <div className="fb-section-title"><span className="fb-icon">💡</span>Suggestions</div>
                              <ul className="fb-suggestions-list">
                                {feedback.feedback.suggestions.map((s, i) => (
                                  <li key={i}><span className="fb-bullet">→</span>{s}</li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="empty-feedback">
                      <div className="empty-icon">✍️</div>
                      <h5>Ready for Feedback</h5>
                      <p>Submit your writing to receive detailed AI analysis on grammar, tone, and structure.</p>
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

        /* Practice Layout */
        .practice-layout {
          height: calc(100vh - 210px);
          align-items: stretch;
          margin-left: 0;
          margin-right: 0;
          width: 100%;
        }

        .practice-layout > [class*="col-"] {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        /* ── Writing Card ── */
        .writing-card {
          border: none;
          border-radius: 14px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
          background: #fff;
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .writing-header {
          background: linear-gradient(135deg, #ff6a00, #ff9a3c);
          color: #fff;
          font-size: 0.9rem;
          font-weight: 600;
          padding: 0.6rem 1rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: none;
          border-radius: 14px 14px 0 0 !important;
          flex-shrink: 0;
        }

        .word-count {
          background: rgba(255,255,255,0.22);
          padding: 0.2rem 0.65rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .writing-body {
          padding: 0.75rem 1rem;
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
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
          border: 1.5px solid #e2e8f0;
          padding: 0.85rem;
          font-size: 0.92rem;
          line-height: 1.65;
          resize: none;
          flex: 1;
          min-height: 0;
          background: #fafafa !important;
          color: #2d3748 !important;
          transition: border-color 0.2s;
        }

        .writing-textarea:focus {
          border-color: #ff7a00;
          background: #fff !important;
          box-shadow: 0 0 0 3px rgba(255,122,0,0.12);
          outline: none;
        }

        /* ── Action Buttons ── */
        .action-buttons {
          display: flex;
          gap: 8px;
          padding-top: 0.6rem;
          flex-shrink: 0;
        }

        .submit-button {
          flex: 1;
          padding: 0.45rem 1rem;
          border-radius: 8px;
          font-size: 0.82rem;
          font-weight: 600;
          border: none;
          background: linear-gradient(135deg, #ff6a00, #ff9a3c);
          color: #fff;
          transition: opacity 0.15s, box-shadow 0.15s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
        }

        .submit-button:hover:not(:disabled) { opacity: 0.92; box-shadow: 0 4px 12px rgba(255,122,0,0.3); }
        .submit-button:disabled { opacity: 0.5; cursor: not-allowed; }

        .restart-button {
          flex: 1;
          padding: 0.45rem 1rem;
          border-radius: 8px;
          font-size: 0.82rem;
          font-weight: 600;
          border: 1.5px solid #ff7a00 !important;
          color: #ff7a00 !important;
          background: transparent !important;
          transition: all 0.15s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
        }

        .restart-button:hover { background: #ff7a00 !important; color: #fff !important; }

        /* ── Feedback Card ── */
        .feedback-card {
          border: none;
          border-radius: 14px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
          background: #fff;
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .feedback-header {
          background: linear-gradient(135deg, #ff6a00, #ff9a3c);
          color: #fff;
          font-size: 0.9rem;
          font-weight: 600;
          padding: 0.6rem 1rem;
          border-bottom: none;
          border-radius: 14px 14px 0 0 !important;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .feedback-body {
          padding: 0.85rem 1rem;
          flex: 1;
          overflow-y: auto;
          min-height: 0;
        }

        /* ── Score Row ── */
        .score-row {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 14px;
          background: linear-gradient(135deg, #fff7f0, #fff3e8);
          border: 1px solid #ffe0c0;
          border-radius: 12px;
          padding: 12px 14px;
          margin-bottom: 12px;
        }

        .score-circle-sm {
          width: 68px;
          height: 68px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ff6a00, #ff9a3c);
          box-shadow: 0 6px 18px rgba(255,122,0,0.38);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          gap: 1px;
        }

        .score-num { font-size: 1.25rem; font-weight: 800; color: #fff; line-height: 1; }
        .score-denom { font-size: 0.65rem; font-weight: 600; color: rgba(255,255,255,0.8); line-height: 1.2; }

        .score-details { flex: 1; min-width: 0; }

        .score-label {
          font-size: 0.82rem;
          font-weight: 700;
          color: #c45000;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .score-bar { height: 7px; border-radius: 4px; margin-bottom: 5px; }

        .score-hint { font-size: 0.74rem; color: #999; }

        /* ── Feedback Sections ── */
        .fb-section {
          border-radius: 10px;
          margin-bottom: 10px;
          overflow: hidden;
          border: 1px solid #eee;
        }

        .fb-section-title {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 7px 12px;
          color: #fff;
        }

        .fb-icon { font-size: 0.88rem; }

        .fb-correction .fb-section-title { background: #1565c0; }
        .fb-overall .fb-section-title   { background: #2e7d32; }
        .fb-suggestions .fb-section-title { background: #e65100; }

        .fb-section-body {
          padding: 10px 12px;
          font-size: 0.83rem;
          line-height: 1.65;
          color: #374151;
          background: #fff;
        }

        /* Corrected Version — document styling */
        .fb-correction {
          border: none;
          box-shadow: 0 2px 12px rgba(0,0,0,0.1);
        }

        .fb-correction .fb-section-body {
          background: #f9fbff;
          padding: 16px 18px;
          font-size: 0.88rem;
          line-height: 1.85;
          color: #1e293b;
          font-family: 'Georgia', 'Times New Roman', serif;
          border-left: 4px solid #1565c0;
          white-space: pre-wrap;
          letter-spacing: 0.01em;
        }

        .fb-correction .fb-section-body p {
          margin-bottom: 0.65em;
        }

        .fb-correction .fb-section-body p:last-child {
          margin-bottom: 0;
        }

        /* ── Skill chips ── */
        .fb-skills-row {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 10px;
        }

        .fb-skill-chip {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 10px;
          padding: 9px 12px;
        }

        .fb-skill-icon { font-size: 1.1rem; flex-shrink: 0; margin-top: 1px; }
        .fb-skill-title { font-size: 0.78rem; font-weight: 700; color: #374151; margin-bottom: 3px; text-transform: uppercase; letter-spacing: 0.04em; }
        .fb-skill-text { font-size: 0.81rem; color: #6b7280; line-height: 1.5; }

        /* ── Suggestions list ── */
        .fb-suggestions-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .fb-suggestions-list li {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 0.83rem;
          color: #374151;
          line-height: 1.55;
          padding: 4px 0;
          border-bottom: 1px solid #f3f4f6;
        }

        .fb-suggestions-list li:last-child { border-bottom: none; }
        .fb-bullet { color: #ff7a00; font-weight: 700; flex-shrink: 0; font-size: 0.85rem; }

        /* ── Empty / Loading states ── */
        .empty-feedback {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          text-align: center;
          padding: 1rem;
        }

        .empty-icon { font-size: 2.2rem; }
        .empty-feedback h5 { font-size: 0.95rem; font-weight: 700; color: #374151; margin: 0; }
        .empty-feedback p { font-size: 0.8rem; color: #9ca3af; max-width: 200px; margin: 0; line-height: 1.5; }

        .loading-feedback {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          text-align: center;
        }

        .loading-feedback h5 { font-size: 0.9rem; color: #374151; margin: 0; }
        .loading-feedback p  { font-size: 0.78rem; color: #9ca3af; margin: 0; }

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
