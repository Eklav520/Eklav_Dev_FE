import React, { useState } from 'react'
import { useEffect } from 'react'
import { Button, Card, Container, Spinner, ProgressBar, Badge, Modal } from 'react-bootstrap'
import {
  FaBookOpen, FaPlay, FaCheckCircle, FaArrowRight,
  FaLaptopCode, FaFlask, FaLandmark, FaBriefcase, FaLeaf,
  FaHeartbeat, FaGraduationCap, FaPalette, FaFootballBall,
  FaPlane, FaBalanceScale, FaChartLine, FaBrain, FaRocket,
  FaNewspaper, FaBook, FaGavel, FaUtensils, FaRobot, FaAlignLeft,
  FaComments, FaQuestionCircle, FaBullseye, FaStar, FaFire, FaChartBar,
} from 'react-icons/fa'
import { useAuthContext } from '@/context/useAuthContext'
import bookImg from '@/assets/images/Reading.png'

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
  attemptsUsed: number
  remainingAttempts: number
  summary: {
    bestScore: number | null
    latestScore: number | null
    trend: string
  }
  attempts: { attempt: number; score: number; createdAt?: string; date?: string }[]
}

const ReadingPractice: React.FC = () => {
  const { user } = useAuthContext()
  const status = user?.status?.toLowerCase()
  const TRIAL_LIMIT = 5
  const isTrialUser = status === 'pending'

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
  const [selectedTopic, setSelectedTopic] = useState<string>('')
  const maxAllowedAttempts = isTrialUser
  ? TRIAL_LIMIT
  : history?.monthlyLimit ?? 0

  const isLimitReached =
  !!history && history.attemptsUsed >= maxAllowedAttempts

  const computeStreak = (attempts: { createdAt?: string; date?: string }[]): number => {
    if (!attempts?.length) return 0
    const days = Array.from(new Set(
      attempts.map(a => new Date(a.createdAt || a.date || '').toISOString().slice(0, 10))
    )).sort().reverse()
    const today = new Date().toISOString().slice(0, 10)
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    if (days[0] !== today && days[0] !== yesterday) return 0
    let streak = 1
    for (let i = 1; i < days.length; i++) {
      const diff = (new Date(days[i - 1]).getTime() - new Date(days[i]).getTime()) / 86400000
      if (diff === 1) streak++
      else break
    }
    return streak
  }

  const streak = computeStreak(history?.attempts ?? [])

  //const isMonthlyLimitReached =!!history && history.attemptsUsed >= history.monthlyLimit

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
      const topicParam = selectedTopic ? `?topic=${encodeURIComponent(selectedTopic)}` : ''
      const res = await fetch(`${baseURL}/learning/reading/prompt${topicParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 429) {
        const data = await res.json()
        alert(
          `Monthly limit reached.\n\nAttempts used: ${data.attemptsUsed}/${data.monthlyLimit}\nTry again next month.`
        )
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

    // Convert letter (A/B/C/D) → full option text so backend string comparison works
    const correctAnswers = Object.fromEntries(
      prompt.questions.map((q, i) => {
        const idx = q.answer.charCodeAt(0) - 65  // A=0, B=1, C=2, D=3
        return [i, q.options[idx] ?? q.answer]
      })
    )

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
          answers: Object.fromEntries(prompt.questions.map((_, i) => [i, answers[i] || ''])),
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

  const BLUE = '#3b82f6'

  const TOPICS = [
    { label: 'Technology',           value: 'Technology',           Icon: FaLaptopCode   },
    { label: 'Science',              value: 'Science',              Icon: FaFlask        },
    { label: 'History',              value: 'History',              Icon: FaLandmark     },
    { label: 'Sports',               value: 'Sports',               Icon: FaFootballBall },
    { label: 'Business',             value: 'Business',             Icon: FaBriefcase    },
    { label: 'Nature',               value: 'Nature',               Icon: FaLeaf         },
    { label: 'Travel',               value: 'Travel',               Icon: FaPlane        },
    { label: 'Health',               value: 'Health',               Icon: FaHeartbeat    },
    { label: 'Culture',              value: 'Culture',              Icon: FaPalette      },
    { label: 'Current Events',       value: 'Current Events',       Icon: FaNewspaper    },
    { label: 'Politics',             value: 'Politics',             Icon: FaBalanceScale },
    { label: 'Economics',            value: 'Economics',            Icon: FaChartLine    },
    { label: 'Psychology',           value: 'Psychology',           Icon: FaBrain        },
    { label: 'Space',                value: 'Space Exploration',    Icon: FaRocket       },
    { label: 'Environment',          value: 'Environment',          Icon: FaLeaf         },
    { label: 'Education',            value: 'Education',            Icon: FaGraduationCap},
    { label: 'Artificial Intelligence', value: 'Artificial Intelligence', Icon: FaRobot },
    { label: 'Law & Justice',        value: 'Law and Justice',      Icon: FaGavel        },
    { label: 'Food & Cuisine',       value: 'Food and Cuisine',     Icon: FaUtensils     },
    { label: 'Arts & Literature',    value: 'Arts and Literature',  Icon: FaBook         },
  ]

  const FEATURES = [
    { Icon: FaAlignLeft,     label: 'Diverse Passages',    sub: 'Wide range of topics'     },
    { Icon: FaQuestionCircle,label: 'Comprehension Quiz',  sub: 'Test your understanding'  },
    { Icon: FaComments,      label: 'Instant Feedback',    sub: 'AI-powered analysis'      },
    { Icon: FaChartBar,      label: 'Track Progress',      sub: 'Monitor your growth'      },
  ]

  return (
    <>
      {/* ── Start Screen ── */}
      <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif", background: '#fff', minHeight: '100%' }}>

        {/* Hero / Header */}
        <div style={{
          display: 'flex', alignItems: 'stretch', justifyContent: 'space-between',
          background: 'linear-gradient(120deg, #eff6ff 0%, #dbeafe 55%, #bfdbfe 100%)',
          borderBottom: '1px solid #bfdbfe', minHeight: 220,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.10, backgroundImage: 'radial-gradient(circle, #1d4ed8 1.5px, transparent 1.5px)', backgroundSize: '20px 20px', pointerEvents: 'none' }} />

          {/* Left: title + features */}
          <div style={{ padding: '28px 28px 20px', zIndex: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
            <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', margin: '0 0 8px' }}>
              Reading Practice
              {status === 'pending' && (
                <span style={{ fontSize: 11, fontWeight: 700, background: '#ff6b00', color: '#fff', borderRadius: 20, padding: '3px 10px', marginLeft: 10, verticalAlign: 'middle' }}>Trial</span>
              )}
            </h1>
            <div style={{ width: 48, height: 3, background: BLUE, borderRadius: 4, marginBottom: 12 }} />
            <p style={{ fontSize: 13, color: '#1e40af', margin: '0 0 20px', lineHeight: 1.6 }}>
              Sharpen your comprehension with AI-powered passages and interactive quizzes<br />designed to build lasting reading skills.
            </p>
            <div style={{ display: 'flex', gap: 22 }}>
              {[
                { Icon: FaAlignLeft,      label: 'Diverse Passages',   sub: 'Wide range of\nengaging topics'     },
                { Icon: FaQuestionCircle, label: 'Comprehension Quiz', sub: 'Test your\nunderstanding'           },
                { Icon: FaComments,       label: 'Instant Feedback',   sub: 'AI-powered\nanalysis'               },
                { Icon: FaChartBar,       label: 'Track Progress',     sub: 'Monitor your\ngrowth'               },
              ].map(({ Icon: FIcon, label, sub }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: `${BLUE}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FIcon style={{ color: BLUE, fontSize: 15 }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{label}</div>
                    <div style={{ fontSize: 11, color: '#3b82f6', lineHeight: 1.5, whiteSpace: 'pre-line' }}>{sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: illustration + decorative elements */}
          <div style={{ position: 'relative', width: 260, flexShrink: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 2 }}>
            <div style={{ position: 'absolute', top: 20, right: 20, width: 140, height: 140, borderRadius: '50%', background: 'rgba(59,130,246,0.12)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: 14, left: 22, fontSize: 42, fontWeight: 900, color: 'rgba(59,130,246,0.18)', fontFamily: 'serif' }}>A</div>
            <div style={{ position: 'absolute', top: 60, right: 14, fontSize: 30, fontWeight: 900, color: 'rgba(59,130,246,0.13)', fontFamily: 'serif' }}>C</div>
            <img src={bookImg} alt="Reading" style={{ height: 200, width: 'auto', objectFit: 'contain', position: 'relative', zIndex: 2 }} />
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 32px 32px' }}>

          {/* Choose a Topic */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Choose a Topic <span style={{ fontSize: 12, fontWeight: 500, color: '#94a3b8' }}>(optional)</span></div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Select a specific topic or leave blank for a random passage</div>
              </div>
              {selectedTopic && (
                <button
                  onClick={() => setSelectedTopic('')}
                  style={{ fontSize: 11, color: '#64748b', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 20, padding: '4px 12px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Clear
                </button>
              )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {TOPICS.map(({ label, value, Icon: TIcon }) => {
                const active = selectedTopic === value
                return (
                  <button
                    key={value}
                    onClick={() => setSelectedTopic(prev => prev === value ? '' : value)}
                    type="button"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '7px 14px', borderRadius: 22, fontSize: 12.5, fontWeight: 600,
                      cursor: 'pointer', transition: 'all 0.15s',
                      background: active ? BLUE : '#f8fafc',
                      color: active ? '#fff' : '#374151',
                      border: `1.5px solid ${active ? BLUE : '#e2e8f0'}`,
                      boxShadow: active ? `0 3px 10px ${BLUE}30` : 'none',
                    }}
                  >
                    <TIcon style={{ fontSize: 12, opacity: active ? 1 : 0.6 }} />
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Feature row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
            {FEATURES.map(({ Icon: FIcon, label, sub }) => (
              <div key={label} style={{ background: '#f8fafc', borderRadius: 14, border: '1px solid #f1f5f9', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: `${BLUE}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FIcon style={{ color: BLUE, fontSize: 16 }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{label}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Start button */}
          <button
            onClick={startPractice}
            disabled={isLimitReached}
            style={{
              width: '100%', padding: '14px 0', borderRadius: 14, border: 'none',
              background: isLimitReached ? '#cbd5e1' : BLUE,
              color: '#fff', fontWeight: 800, fontSize: 16,
              cursor: isLimitReached ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: isLimitReached ? 'none' : `0 6px 20px ${BLUE}35`,
              marginBottom: 14,
            }}
          >
            <FaPlay style={{ fontSize: 14 }} />
            {isLimitReached ? 'Limit Reached' : 'Start Reading Practice'}
          </button>

          {isLimitReached && (
            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#9a3412', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <FaBullseye style={{ flexShrink: 0 }} />
              {status === 'pending'
                ? 'Upgrade to unlock unlimited reading practice.'
                : 'Monthly limit reached. Try again next month.'}
            </div>
          )}

          {/* Stats row */}
          {!historyLoading && history && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginTop: 8 }}>
              {[
                { label: status === 'pending' ? 'Free Attempts' : 'Monthly Attempts', value: `${Math.min(history.attemptsUsed, maxAllowedAttempts)} / ${maxAllowedAttempts}`, sub: `${Math.max(0, maxAllowedAttempts - history.attemptsUsed)} remaining`, color: BLUE, Icon: FaBullseye },
                { label: 'Best Score', value: history.summary?.bestScore != null ? `${history.summary.bestScore}%` : '--', sub: history.summary?.bestScore != null ? 'Personal best' : 'No attempts yet', color: '#f59e0b', Icon: FaStar },
                { label: 'Latest Score', value: history.summary?.latestScore != null ? `${history.summary.latestScore}%` : '--', sub: history.summary?.trend ?? 'Start practicing', color: '#22c55e', Icon: FaChartBar },
                { label: 'Current Streak', value: `${streak} Day${streak !== 1 ? 's' : ''}`, sub: streak > 0 ? 'Keep it up!' : 'Start your streak!', color: '#ff6b00', Icon: FaFire },
              ].map(({ label, value, sub, color, Icon: SIcon }) => (
                <div key={label} style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: 14, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 11, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <SIcon style={{ color, fontSize: 18 }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{value}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>{sub}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      <Modal show={started} fullscreen onHide={() => setStarted(false)} className="practice-fullscreen-modal">
        <Modal.Header closeButton style={{ background: 'linear-gradient(135deg, #ff6a00 0%, #ff9a3c 100%)', color: '#fff', borderBottom: 'none' }}>
          <Modal.Title style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: 700 }}>
            <FaBookOpen style={{ marginRight: 8 }} /> Reading Practice
            {selectedTopic && (
              <span style={{ fontSize: '0.75rem', fontWeight: 500, background: 'rgba(255,255,255,0.25)', padding: '2px 10px', borderRadius: 12, marginLeft: 8 }}>
                {selectedTopic}
              </span>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: '#f8fafc', overflowY: 'auto', padding: '2rem 1.5rem' }}>
          <div className="practice-layout">
          {/* Main Challenge Area - Full Width */}
          <div className="challenge-section">
            <Card className="challenge-card">
              <Card.Header className="challenge-header">
                <FaBookOpen className="me-2" />
                Reading Challenge
                <span className="progress-indicator">
                  {String(currentQ + 1).padStart(3, '0')} / {String(prompt?.questions?.length || 0).padStart(3, '0')}
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

                          {/* Question badge + progress */}
                          <div className="question-meta">
                            <span className="question-badge">
                              Question {currentQ + 1} <span className="q-of">of {prompt.questions.length}</span>
                            </span>
                            <div className="q-progress-track">
                              <div
                                className="q-progress-fill"
                                style={{ width: `${((currentQ + 1) / prompt.questions.length) * 100}%` }}
                              />
                            </div>
                          </div>

                          {/* Question text */}
                          <h5 className="question-text">{prompt.questions[currentQ].q}</h5>

                          {/* Options */}
                          <div className="options-grid">
                            {prompt.questions[currentQ].options.map((opt, i) => {
                              const isSelected = answers[currentQ] === opt
                              return (
                                <div
                                  key={i}
                                  className={`option-item${isSelected ? ' option-selected' : ''}${feedback ? ' option-disabled' : ''}`}
                                  onClick={() => !feedback && handleOptionChange(currentQ, opt)}
                                >
                                  <div className={`option-radio-ring${isSelected ? ' ring-selected' : ''}`}>
                                    {isSelected && <div className="option-radio-dot" />}
                                  </div>
                                  <span className="option-label">{opt}</span>
                                </div>
                              )
                            })}
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
          max-width: 680px;
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

        /* Question meta row: badge + progress bar */
        .question-meta {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.25rem;
        }

        .question-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #fff4e6;
          color: #ff7a00;
          border: 1.5px solid #ffd8a8;
          border-radius: 20px;
          padding: 4px 14px;
          font-size: 0.8rem;
          font-weight: 700;
          white-space: nowrap;
          letter-spacing: 0.3px;
        }

        .q-of {
          color: #f09840;
          font-weight: 500;
        }

        .q-progress-track {
          flex: 1;
          height: 5px;
          background: #e2e8f0;
          border-radius: 99px;
          overflow: hidden;
        }

        .q-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #ff7a00, #ffb347);
          border-radius: 99px;
          transition: width 0.4s ease;
        }

        /* Question text */
        .question-text {
          font-size: 1.15rem;
          font-weight: 700;
          color: #1a202c;
          line-height: 1.55;
          margin-bottom: 1.5rem;
        }

        /* Options */
        .options-grid {
          display: grid;
          gap: 0.75rem;
          margin-bottom: 2rem;
        }

        .option-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: #fff;
          padding: 1rem 1.25rem;
          border-radius: 12px;
          border: 2px solid #e2e8f0;
          cursor: pointer;
          transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
          user-select: none;
        }

        .option-item:hover:not(.option-disabled) {
          border-color: #ff7a00;
          background: #fff9f5;
          box-shadow: 0 2px 10px rgba(255, 122, 0, 0.1);
        }

        .option-item.option-selected {
          border-color: #ff7a00;
          background: #fff4e6;
          box-shadow: 0 2px 12px rgba(255, 122, 0, 0.15);
        }

        .option-item.option-disabled {
          cursor: default;
          opacity: 0.8;
        }

        .option-radio-ring {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid #cbd5e0;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: border-color 0.15s ease;
        }

        .option-radio-ring.ring-selected {
          border-color: #ff7a00;
        }

        .option-radio-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #ff7a00;
        }

        .option-label {
          font-size: 1rem;
          font-weight: 500;
          color: #2d3748;
          line-height: 1.4;
        }

        .option-item.option-selected .option-label {
          color: #c05c00;
          font-weight: 600;
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
        
        /* Topic Selection */
        .topic-section {
          margin-bottom: 1.5rem;
          text-align: left;
        }
        .topic-label {
          font-size: 0.85rem;
          font-weight: 600;
          color: #4a5568;
          margin-bottom: 0.6rem;
        }
        .topic-optional {
          font-weight: 400;
          color: #a0aec0;
          font-size: 0.78rem;
        }
        .topic-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .topic-chip {
          padding: 5px 13px;
          border-radius: 20px;
          border: 1.5px solid #e2e8f0;
          background: #f7fafc;
          color: #4a5568;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.18s ease;
          white-space: nowrap;
        }
        .topic-chip:hover {
          border-color: #ff7a00;
          color: #ff7a00;
          background: #fff4e6;
        }
        .topic-chip-active {
          border-color: #ff7a00 !important;
          background: #ff7a00 !important;
          color: #fff !important;
          box-shadow: 0 3px 10px rgba(255,122,0,0.3);
        }

        .trial-badge-modern {
        background: rgba(255, 122, 0, 0.15);
        color: #ff7a00;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
        border: 1px solid rgba(255, 122, 0, 0.4);
      }

      .trial-limit-box-modern {
        margin-top: 14px;
        background: linear-gradient(135deg, #fff3e6 0%, #ffe0c2 100%);
        color: #8a4b00;
        padding: 10px 16px;
        border-radius: 12px;
        font-size: 0.9rem;
        font-weight: 600;
        display: inline-block;
        box-shadow: 0 4px 12px rgba(255, 122, 0, 0.15);
      }


      `}</style>
    </>
  )
}

export default ReadingPractice
