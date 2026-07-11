import React, { useState, useRef } from 'react'
import { useEffect } from 'react'
import { Button, Card, Container, Row, Col, Spinner, ProgressBar, Form, Modal } from 'react-bootstrap'
import {
  FaClipboardList, FaArrowRight, FaPlay, FaVolumeUp, FaCheckCircle, FaArrowLeft,
  FaHeadphones, FaMicrophone, FaBrain, FaChartLine, FaBullseye, FaStar, FaFire,
  FaFileAlt, FaQuestionCircle, FaLightbulb, FaChartBar,
  FaComments, FaNewspaper, FaUserTie, FaPodcast, FaChalkboardTeacher, FaBook, FaBriefcase,
} from 'react-icons/fa'
import { MdGraphicEq } from 'react-icons/md'
import { useAuthContext } from '@/context/useAuthContext'
import headsetsImg from '@/assets/images/headsets.png'

type Question = {
  q?: string
  question?: string
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
  const [audioEnded, setAudioEnded] = useState(false)
  const [currentQ, setCurrentQ] = useState(0)
  const [history, setHistory] = useState<ListeningHistory | null>(null)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [submittedData, setSubmittedData] = useState<{ answers: { [k: string]: string }; prompt: typeof prompt } | null>(null)
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner')
  const [activeCategory, setActiveCategory] = useState('Conversations')

  const audioRef = useRef<HTMLAudioElement | null>(null)
  //const isMonthlyLimitReached = !!history && history.attemptsUsed >= history.monthlyLimit

  const maxAllowedAttempts = isTrialUser
    ? TRIAL_LIMIT
    : history?.monthlyLimit ?? 0

  const isLimitReached =
    !!history && history.attemptsUsed >= maxAllowedAttempts

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
      const params = new URLSearchParams({
        difficulty,
        category: activeCategory,
      })
      const res = await fetch(`${baseURL}/learning/listening/prompt?${params}`, {
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
    setSubmittedData({ answers: { ...answers }, prompt })

    try {
      const res = await fetch(`${baseURL}/learning/listening/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          promptId: prompt.promptId,
          answers: Object.fromEntries(prompt.questions.map((_, i) => [i, answers[i] || ''])),
          correctAnswers: Object.fromEntries(
            prompt.questions.map((q, i) => {
              const idx = q.answer.charCodeAt(0) - 65  // A=0, B=1, C=2, D=3
              return [i, q.options[idx] ?? q.answer]
            })
          ),
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

  const ORANGE = '#ff6b00'

  const DIFFICULTIES = [
    { id: 'beginner',     label: 'Beginner',     sub: 'Simple conversations\nand slow-paced audio', recommended: true  },
    { id: 'intermediate', label: 'Intermediate',  sub: 'Daily conversations\nand moderate pace',     recommended: false },
    { id: 'advanced',     label: 'Advanced',      sub: 'Fast-paced audio\nand complex topics',       recommended: false },
  ]

  const FEATURES_HERO = [
    { Icon: FaHeadphones,        label: 'Real-life Audio',      sub: 'Conversations, talks\nand interviews'       },
    { Icon: FaBrain,             label: 'AI-Powered Questions', sub: 'Smart questions to test\nyour understanding' },
    { Icon: FaChartLine,         label: 'Instant Feedback',     sub: 'Get detailed analysis\nand improve faster'  },
  ]

  const WHAT_YOU_GET = [
    { Icon: FaFileAlt,          label: 'Audio transcripts'        },
    { Icon: FaQuestionCircle,   label: 'Comprehension questions'  },
    { Icon: FaLightbulb,        label: 'Detailed explanations'    },
    { Icon: FaChartBar,         label: 'Performance analytics'    },
  ]

  const CATEGORIES = [
    { label: 'Conversations', Icon: FaComments        },
    { label: 'News',          Icon: FaNewspaper       },
    { label: 'Interviews',    Icon: FaMicrophone      },
    { label: 'Podcasts',      Icon: FaPodcast         },
    { label: 'Lectures',      Icon: FaChalkboardTeacher },
    { label: 'Stories',       Icon: FaBook            },
    { label: 'Business',      Icon: FaBriefcase       },
  ]

  return (
    <>
      {/* ── Start Screen ── */}
      <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif", background: '#fff' }}>

        {/* ── Hero Row ── */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr auto 280px',
          gap: 0, alignItems: 'stretch',
          background: 'linear-gradient(120deg, #fffbf5 0%, #fff5e8 50%, #ffecd4 100%)',
          borderBottom: '1px solid #f1f5f9', minHeight: 220, position: 'relative', overflow: 'hidden',
        }}>
          {/* dot pattern */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.12, backgroundImage: 'radial-gradient(circle, #cc5500 1.5px, transparent 1.5px)', backgroundSize: '20px 20px', pointerEvents: 'none' }} />

          {/* Left: title + features */}
          <div style={{ padding: '28px 28px 20px', zIndex: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', margin: 0 }}>
                Listening Practice
              </h1>
              {status === 'pending' && (
                <span style={{ fontSize: 11, fontWeight: 700, background: ORANGE, color: '#fff', borderRadius: 20, padding: '3px 10px' }}>Trial</span>
              )}
            </div>
            <div style={{ width: 48, height: 3, background: ORANGE, borderRadius: 4, marginBottom: 12 }} />
            <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 20px', lineHeight: 1.6, maxWidth: 440 }}>
              Improve your listening comprehension with engaging<br />audio challenges powered by AI.
            </p>
            <div style={{ display: 'flex', gap: 28 }}>
              {FEATURES_HERO.map(({ Icon: FIcon, label, sub }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${ORANGE}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FIcon style={{ color: ORANGE, fontSize: 16 }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{label}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.5, whiteSpace: 'pre-line' }}>{sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Center: headsets illustration */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 8px', zIndex: 2 }}>
            <img src={headsetsImg} alt="Headsets" style={{ height: 210, width: 'auto', objectFit: 'contain' }} />
          </div>

          {/* Right: Your Progress card */}
          <div style={{ padding: '18px 20px', zIndex: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center', borderLeft: '1px solid #fde8c8' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>Your Progress</div>
            {[
              { label: status === 'pending' ? 'Free Attempts' : 'Monthly Attempts', value: !historyLoading && history ? `${Math.min(history.attemptsUsed, maxAllowedAttempts)} / ${maxAllowedAttempts}` : '-- / --', color: ORANGE, Icon: FaBullseye },
              { label: 'Best Score',       value: !historyLoading && history?.summary?.bestScore != null ? `${history.summary.bestScore}%` : '--', color: '#3b82f6', Icon: FaStar },
              { label: 'Overall Progress', value: '0%',      color: '#22c55e', Icon: FaChartLine },
              { label: 'Current Streak',   value: '0 Days',  color: '#8b5cf6', Icon: FaFire },
            ].map(({ label, value, color, Icon: PIcon }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <PIcon style={{ color, fontSize: 15 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>{label}</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color, lineHeight: 1.1 }}>{value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Difficulty + What You Get ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 0, borderBottom: '1px solid #f1f5f9' }}>

          {/* Left: Choose a Difficulty Level */}
          <div style={{ padding: '22px 28px', borderRight: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 14 }}>Choose a Difficulty Level</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {DIFFICULTIES.map(({ id, label, sub, recommended }) => {
                const active = difficulty === id
                return (
                  <div
                    key={id}
                    onClick={() => setDifficulty(id as typeof difficulty)}
                    style={{
                      border: `2px solid ${active ? ORANGE : '#e2e8f0'}`,
                      borderRadius: 14, padding: '16px 14px', cursor: 'pointer',
                      background: active ? '#fff7f0' : '#fff',
                      transition: 'all 0.15s',
                      position: 'relative',
                    }}
                  >
                    {/* Bar icon */}
                    <div style={{ display: 'flex', gap: 2, marginBottom: 10 }}>
                      {[1,2,3].map(n => (
                        <div key={n} style={{ width: 6, borderRadius: 2, background: active ? ORANGE : (id === 'intermediate' && n <= 2) || (id === 'advanced' && n <= 3) || (id === 'beginner' && n <= 1) ? '#cbd5e1' : '#e2e8f0', height: n === 1 ? 12 : n === 2 ? 18 : 24, alignSelf: 'flex-end' }} />
                      ))}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: active ? ORANGE : '#0f172a', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.5, whiteSpace: 'pre-line' }}>{sub}</div>
                    {recommended && (
                      <div style={{ marginTop: 8, display: 'inline-block', fontSize: 10, fontWeight: 700, background: `${ORANGE}18`, color: ORANGE, borderRadius: 20, padding: '3px 10px' }}>Recommended</div>
                    )}
                    {active && (
                      <div style={{ position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderRadius: '50%', background: ORANGE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FaCheckCircle style={{ color: '#fff', fontSize: 11 }} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right: What you will get */}
          <div style={{ padding: '22px 24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', bottom: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: '#eff6ff', pointerEvents: 'none' }} />
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 14 }}>What you will get</div>
            {WHAT_YOU_GET.map(({ Icon: WIcon, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: `${ORANGE}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <WIcon style={{ color: ORANGE, fontSize: 13 }} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Popular Categories + Start Button ── */}
        <div style={{ padding: '18px 28px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Popular Categories</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {CATEGORIES.map(({ label, Icon: CIcon }) => {
              const active = activeCategory === label
              return (
                <button
                  key={label}
                  onClick={() => setActiveCategory(label)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', borderRadius: 22, fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.15s',
                    background: active ? '#fff7f0' : '#f8fafc',
                    color: active ? ORANGE : '#374151',
                    border: `1.5px solid ${active ? ORANGE : '#e2e8f0'}`,
                  }}
                >
                  <CIcon style={{ fontSize: 12 }} />
                  {label}
                </button>
              )
            })}
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 22, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: '#fff', color: ORANGE, border: `1.5px solid ${ORANGE}` }}>
              View All
            </button>
          </div>

          {isLimitReached && (
            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#9a3412', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <FaBullseye style={{ flexShrink: 0 }} />
              {status === 'pending'
                ? 'Upgrade to unlock unlimited listening practice.'
                : 'Monthly limit reached. Try again next month.'}
            </div>
          )}

          <button
            onClick={startPractice}
            disabled={isLimitReached}
            style={{
              width: '100%', padding: '16px 0', borderRadius: 14, border: 'none',
              background: isLimitReached ? '#cbd5e1' : `linear-gradient(90deg, ${ORANGE} 0%, #ff9a3c 100%)`,
              color: '#fff', fontWeight: 800, fontSize: 16,
              cursor: isLimitReached ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: isLimitReached ? 'none' : `0 6px 20px ${ORANGE}40`,
            }}
          >
            <FaPlay style={{ fontSize: 14 }} />
            {isLimitReached ? 'Limit Reached' : 'Start Listening Practice'}
          </button>
        </div>

      </div>

      <Modal show={started} fullscreen onHide={() => setStarted(false)} className="practice-fullscreen-modal">
        <Modal.Header closeButton style={{ background: 'linear-gradient(135deg, #ff6a00 0%, #ff9a3c 100%)', color: '#fff', borderBottom: 'none' }}>
          <Modal.Title style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: 700 }}>
            <FaVolumeUp style={{ marginRight: 8 }} /> Listening Practice
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: '#f8fafc', overflowY: 'auto', padding: '2rem 1.5rem' }}>
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
                    {currentQ + 1} / {prompt?.questions?.length || 0}
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
                          <h5 className="question-text">{prompt.questions[currentQ].q ?? prompt.questions[currentQ].question}</h5>

                          <div className="options-container">
                            {prompt.questions[currentQ].options.map((opt, i) => (
                              <div
                                key={i}
                                className="option-item"
                                onClick={() => !feedback && handleOptionChange(currentQ, opt)}
                              >
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

                    {/* Answer Review */}
                    {submittedData?.prompt && (
                      <div className="feedback-item answer-review-section">
                        <h6 className="feedback-item-title">
                          <span className="feedback-item-icon">🧠</span>
                          Answer Review
                        </h6>
                        <div className="answer-review-list">
                          {submittedData.prompt.questions.map((q, idx) => {
                            const selectedText = submittedData.answers[idx] || '—'
                            const correctLetter = q.answer // e.g. "A"
                            const correctIndex = correctLetter.charCodeAt(0) - 65
                            const correctText = q.options[correctIndex] ?? correctLetter
                            const isCorrect = selectedText === correctText
                            return (
                              <div key={idx} className={`ar-item ${isCorrect ? 'ar-correct' : 'ar-wrong'}`}>
                                <div className="ar-q-header">
                                  <span className="ar-q-num">Q{idx + 1}</span>
                                  <span className="ar-q-text">{q.question ?? q.q}</span>
                                  <span className={`ar-badge ${isCorrect ? 'ar-badge-correct' : 'ar-badge-wrong'}`}>
                                    {isCorrect ? '✓ Correct' : '✗ Wrong'}
                                  </span>
                                </div>
                                <div className="ar-answers">
                                  <div className="ar-answer-row">
                                    <span className="ar-label">Your answer:</span>
                                    <span className={`ar-value ${isCorrect ? 'ar-value-correct' : 'ar-value-wrong'}`}>{selectedText}</span>
                                  </div>
                                  {!isCorrect && (
                                    <div className="ar-answer-row">
                                      <span className="ar-label">Correct answer:</span>
                                      <span className="ar-value ar-value-correct">{correctText}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
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
          cursor: pointer;
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

        /* Answer Review */
        .answer-review-section { margin-top: 1.5rem; }
        .answer-review-list { display: flex; flex-direction: column; gap: 10px; margin-top: 10px; }
        .ar-item { border-radius: 10px; overflow: hidden; border: 1px solid; }
        .ar-correct { border-color: #d1fae5; background: #f0fdf4; }
        .ar-wrong { border-color: #fee2e2; background: #fff5f5; }
        .ar-q-header { display: flex; align-items: flex-start; gap: 8px; padding: 10px 14px 8px; flex-wrap: wrap; }
        .ar-q-num { font-size: 0.72rem; font-weight: 700; background: #e2e8f0; color: #475569; border-radius: 4px; padding: 2px 6px; flex-shrink: 0; }
        .ar-q-text { flex: 1; font-size: 0.85rem; font-weight: 600; color: #1e293b; line-height: 1.4; }
        .ar-badge { font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 20px; flex-shrink: 0; }
        .ar-badge-correct { background: #dcfce7; color: #16a34a; }
        .ar-badge-wrong { background: #fee2e2; color: #dc2626; }
        .ar-answers { padding: 0 14px 10px; display: flex; flex-direction: column; gap: 4px; }
        .ar-answer-row { display: flex; align-items: center; gap: 8px; font-size: 0.82rem; }
        .ar-label { color: #64748b; min-width: 110px; font-weight: 500; }
        .ar-value { font-weight: 600; padding: 2px 8px; border-radius: 6px; }
        .ar-value-correct { background: #dcfce7; color: #15803d; }
        .ar-value-wrong { background: #fee2e2; color: #dc2626; }

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

export default ListeningPractice
