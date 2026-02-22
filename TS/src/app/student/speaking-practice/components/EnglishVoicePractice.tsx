import React, { useState, useEffect, useRef } from 'react'
import { Card, ProgressBar, Button, Row, Col, Spinner, Container, Badge } from 'react-bootstrap'
import axios from 'axios'
import { useAuthContext } from '@/context/useAuthContext'

interface Message {
  sender: 'user' | 'eklav'
  text: string
  type: 'user' | 'correction' | 'reply'
}

declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

const EnglishVoicePractice: React.FC = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()
  const status = user?.status?.toLowerCase()

  const isTrialUser = status === 'pending'
  const isSubscribedUser = status === 'approved'
  const token = user?.token

  const [messages, setMessages] = useState<Message[]>([])
  const [feedback, setFeedback] = useState('')
  const [sessionStarted, setSessionStarted] = useState(false)
  const [sessionEnded, setSessionEnded] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [timeLeft, setTimeLeft] = useState(180)
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false)

  const [liveSpeech, setLiveSpeech] = useState('')
  const [isUserSpeaking, setIsUserSpeaking] = useState(false)

  const recognitionRef = useRef<any>(null)
  const transcriptRef = useRef('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const lastUserRef = useRef('')
  const sessionActiveRef = useRef(false)
  const chatBodyRef = useRef<HTMLDivElement>(null)
  const [history, setHistory] = useState<any>(null)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const canStop = sessionStarted && !sessionEnded
  const canNewSession = sessionEnded
  const isMonthlyLimitReached = history && history.attemptsUsed >= history.monthlyLimit
  //const canStart = !sessionStarted && !isMonthlyLimitReached
  const maxAllowedAttempts = isTrialUser
    ? 5
    : history?.monthlyLimit ?? 0

  const isLimitReached =
    !!history && history.attemptsUsed >= maxAllowedAttempts

  const canStart = !sessionStarted && !isLimitReached
  const silenceTimerRef = useRef<any>(null)
  const noResponseCountRef = useRef(0)
  const manualStopRef = useRef(false)


  const MAX_NO_RESPONSE = 3
  const SILENCE_TIMEOUT = 6000 // 6 seconds


  // 🔐 TTS TURN CONTROL
  const ttsCountRef = useRef(0)

  const fetchSpeakingHistory = async () => {
    if (!token) return

    try {
      setLoadingHistory(true)

      const res = await fetch(`${baseURL}/api/speakingPractice/history`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        throw new Error('Failed to fetch history')
      }

      const data = await res.json()

      // ✅ extract only what UI needs
      setHistory({
        highestScore: data.summary?.bestScore ?? null,
        attemptsText: `${data.attemptsUsed} / ${data.monthlyLimit ?? 0}`,
        attemptsUsed: data.attemptsUsed,
        monthlyLimit: data.monthlyLimit,
      })
    } catch (error) {
      console.error('Speaking history error:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
  }

  const startSilenceTimer = () => {
    clearSilenceTimer()

    silenceTimerRef.current = setTimeout(async () => {
      if (!sessionActiveRef.current) return
      if (ttsCountRef.current > 0) return // ⛔ AI is speaking

      noResponseCountRef.current += 1

      if (noResponseCountRef.current <= MAX_NO_RESPONSE) {
        const msg = 'Are you there? Please respond.'
        setMessages((p) => [...p, { sender: 'eklav', text: msg, type: 'reply' }])
        await speak(msg)
        startSilenceTimer()
      } else {
        const msg = 'Sorry, closing the session. Have a nice day.'
        setMessages((p) => [...p, { sender: 'eklav', text: msg, type: 'reply' }])
        await speak(msg)
        handleEndSession()
      }
    }, SILENCE_TIMEOUT)
  }


  useEffect(() => {
    if (token) {
      fetchSpeakingHistory()
    }
  }, [token])

  /* -------------------- AUTO SCROLL -------------------- */
  useEffect(() => {
    if (!sessionStarted) return

    const el = chatBodyRef.current
    if (!el) return

    el.scrollTop = el.scrollHeight
  }, [messages, liveSpeech])

  /* -------------------- TIMER -------------------- */
  useEffect(() => {
    if (!sessionStarted || sessionEnded) return

    if (timeLeft <= 0) {
      handleEndSession()
      return
    }

    const t = setInterval(() => setTimeLeft((p) => p - 1), 1000)
    return () => clearInterval(t)
  }, [sessionStarted, sessionEnded, timeLeft])

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  /* ===================== MIC CONTROL ===================== */
  const startListening = () => {
    if (!sessionActiveRef.current || ttsCountRef.current > 0) return

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return alert('Speech Recognition Not Supported')

    try {
      recognitionRef.current?.abort()
    } catch { }

    const rec = new SR()
    rec.lang = 'en-US'
    rec.continuous = false
    rec.interimResults = true

    rec.onstart = () => {
      setIsListening(true)
      setIsUserSpeaking(true)
      setLiveSpeech('')
      startSilenceTimer()
    }

    rec.onresult = async (e: any) => {
      clearSilenceTimer()

      let interim = ''
      let final = ''

      for (let i = 0; i < e.results.length; i++) {
        const txt = e.results[i][0].transcript
        e.results[i].isFinal ? (final += txt) : (interim += txt)
      }

      if (interim.trim()) {
        noResponseCountRef.current = 0
        setLiveSpeech(interim.trim())
      }

      if (final.trim()) {
        noResponseCountRef.current = 0
        const text = final.trim()

        if (text === lastUserRef.current) return
        lastUserRef.current = text

        setLiveSpeech('')
        setMessages((p) => [...p, { sender: 'user', text, type: 'user' }])
        transcriptRef.current += `You: ${text}\n`

        await sendToRob(text)
      }

      startSilenceTimer()
    }

    rec.onend = () => {
      setIsListening(false)
      setIsUserSpeaking(false)
      manualStopRef.current = false
    }




    recognitionRef.current = rec
    rec.start()
  }

  const stopListening = () => {
    try {
      recognitionRef.current?.abort()
    } catch { }
  }

  /* ===================== TTS CONTROL ===================== */
  const waitForTTS = () =>
    new Promise<void>((res) => {
      const i = setInterval(() => {
        if (!speechSynthesis.speaking && !speechSynthesis.pending) {
          clearInterval(i)
          res()
        }
      }, 100)
    })

  const onTTSStart = () => {
    ttsCountRef.current += 1
    stopListening()
  }

  const onTTSEnd = () => {
    ttsCountRef.current -= 1

    if (ttsCountRef.current === 0 && sessionActiveRef.current) {
      startListening()

      // Start timer ONLY after mic restarts
      setTimeout(() => {
        if (sessionActiveRef.current) {
          startSilenceTimer()
        }
      }, 500)
    }
  }


  const speak = (text: string) =>
    new Promise<void>(async (resolve) => {
      if (!sessionActiveRef.current) return resolve()

      onTTSStart()

      const utter = new SpeechSynthesisUtterance(text.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, ''))

      utter.onend = async () => {
        await waitForTTS()
        onTTSEnd()
        resolve()
      }

      utter.onerror = async () => {
        await waitForTTS()
        onTTSEnd()
        resolve()
      }

      speechSynthesis.speak(utter)
    })

  /* ===================== BACKEND ===================== */
  const sendToRob = async (msg: string) => {
    if (!sessionActiveRef.current) return
    setIsTyping(true)

    try {
      const { data } = await axios.post(`${baseURL}/api/english/chat`, {
        userMessage: msg,
      })

      if (data.correction && data.correction !== '-') {
        setMessages((p) => [...p, { sender: 'eklav', text: data.correction, type: 'correction' }])
        await speak('Correction: ' + data.correction)
      }

      if (data.reply) {
        setMessages((p) => [...p, { sender: 'eklav', text: data.reply, type: 'reply' }])
        await speak(data.reply)
      }
    } finally {
      setIsTyping(false)
    }
  }

  /* ===================== SESSION ===================== */
  const resetSessionState = () => {
    clearSilenceTimer()
    noResponseCountRef.current = 0
    manualStopRef.current = false
    ttsCountRef.current = 0

    stopListening()
    speechSynthesis.cancel()

    transcriptRef.current = ''
    lastUserRef.current = ''

    setMessages([])
    setFeedback('')
    setSessionStarted(true)
    setSessionEnded(false)
    setTimeLeft(180)
    setLiveSpeech('')
    setIsUserSpeaking(false)
  }


  const handleStartSession = async () => {
    resetSessionState()
    sessionActiveRef.current = true

    const res = await axios.post(`${baseURL}/api/english/start`)
    setMessages([{ sender: 'eklav', text: res.data.aiMessage, type: 'reply' }])
    await speak(res.data.aiMessage)
  }

  const handleEndSession = async () => {
    if (!sessionActiveRef.current) return
    clearSilenceTimer()
    noResponseCountRef.current = 0
    sessionActiveRef.current = false

    sessionActiveRef.current = false
    stopListening()
    speechSynthesis.cancel()
    ttsCountRef.current = 0

    setSessionEnded(true)
    setIsLoadingFeedback(true)

    try {
      const res = await axios.post(
        `${baseURL}/api/english/end`,
        {
          transcript: transcriptRef.current,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      setFeedback(res.data.feedback)

      await fetchSpeakingHistory()
    } finally {
      setIsLoadingFeedback(false)
    }
  }

  const restartSession = () => handleStartSession()

  const extractScore = (t: string) => {
    const keys = ['Grammar', 'Fluency', 'Vocabulary']
    const found: Record<string, boolean> = {}

    return t
      .split('\n')
      .map((l) => {
        for (let k of keys) {
          if (l.toLowerCase().includes(k.toLowerCase()) && !found[k]) {
            found[k] = true
            const m = l.match(/(\d+)\/10/)
            return { label: k, score: m ? +m[1] : 0 }
          }
        }
        return null
      })
      .filter(Boolean) as any[]
  }

  const extractImprovements = (t: string) => t.split('\n').filter((l) => l.trim().startsWith('-'))

  const extractOverall = (t: string) => t.split('\n').slice(-2).join(' ')

  /* ===================== UI ===================== */
  return (
    <Container fluid className="english-practice-container">
      <Row className="g-3 align-items-stretch">
        {/* PRACTICE SESSION CARD */}
        <Col xs={12} lg={6} >
          <Card className="shadow-sm h-100">
            <Card.Header className="practice-header">
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center">
                <div className="flex-grow-1 header-text">
                  <h5 className="fw-bold mb-1 d-flex align-items-center">
                    🗣 Speak with Eklav
                    {isTrialUser && (
                      <span className="trial-badge ms-2">
                        Trial
                      </span>
                    )}
                  </h5>
                    {history && (
                      <p className="mb-0 attempts-text">
                        {isTrialUser ? 'Free Attempts' : 'Monthly Attempts'}:{' '}
                        <strong>{history.attemptsUsed} / {maxAllowedAttempts}</strong>

                        {isLimitReached && (
                          <p className="trial-warning mt-1 mb-0 small">
                            {isTrialUser
                              ? 'Trial limit reached. Upgrade to continue practicing.'
                              : 'Monthly limit reached. Try again next month.'}
                          </p>
                        )}
                      </p>
                    )}
                </div>
                <div className="d-flex align-items-center stats-container">
                  {history && history.highestScore !== null && (
                    <div className="me-3 text-end">
                      <small className="text-muted d-block">Best Score</small>
                      <strong className="best-score-value">
                        {history.highestScore}
                      </strong>

                    </div>
                  )}

                  <div className="text-end me-3 stat-box">
                    <small className="stat-label">Time</small>
                    <strong className="stat-value">{formatTime(timeLeft)}</strong>
                  </div>
                  <div>
                    <span className={`mic-icon ${isListening ? 'listening' : ''}`}>🎤</span>
                  </div>
                </div>
              </div>
            </Card.Header>
            <Card.Body className="p-0 chat-body-container">
              <div ref={chatBodyRef} className="chat-messages">
                {!sessionStarted ? (
                  <div className="welcome-screen">
                    <div className="welcome-icon">🤖</div>
                    <h5 className="welcome-title">Let’s Start Speaking with Eklav!</h5>
                    <p className="welcome-text">Click Start to begin your session</p>
                  </div>
                ) : (
                  <>
                    {messages.map((m, i) => (
                      <div key={i} className={`message-container ${m.sender === 'user' ? 'user-message' : 'eklav-message'}`}>
                        {m.sender === 'user' ? (
                          <div className="message-bubble user-bubble">
                            <div className="message-header">
                              <div className="sender-info">
                                <span className="user-avatar">👤</span>
                                <strong className="sender-name">You</strong>
                              </div>
                              <small className="message-time">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                            </div>
                            <div className="message-text">{m.text}</div>
                          </div>
                        ) : m.type === 'correction' ? (
                          <div className="message-bubble correction-bubble">
                            <div className="message-header">
                              <div className="sender-info">
                                <span className="correction-avatar">🤖</span>
                                <div>
                                  <strong className="sender-name">Eklav</strong>
                                  <Badge bg="warning" text="dark" className="correction-badge">
                                    Correction
                                  </Badge>
                                </div>
                              </div>
                              <small className="message-time">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                            </div>
                            <div className="message-text">{m.text}</div>
                          </div>
                        ) : (
                          <div className="message-bubble rob-bubble">
                            <div className="message-header">
                              <div className="sender-info">
                                <span className="rob-avatar">🤖</span>
                                <strong className="sender-name">Eklav</strong>
                              </div>
                              <small className="message-time">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                            </div>
                            <div className="message-text">{m.text}</div>
                          </div>
                        )}
                      </div>
                    ))}

                    {liveSpeech && (
                      <div className="message-container user-message">
                        <div className="message-bubble user-bubble speaking">
                          <div className="message-header">
                            <div className="sender-info">
                              <span className="user-avatar">👤</span>
                              <strong className="sender-name">You (Speaking)</strong>
                            </div>
                            <div className="pulsating-dot"></div>
                          </div>
                          <div className="message-text live-speech">{liveSpeech}</div>
                        </div>
                      </div>
                    )}

                    {isTyping && (
                      <div className="typing-indicator">
                        <span className="rob-avatar">🤖</span>
                        <div className="typing-dots">
                          <div className="dot"></div>
                          <div className="dot"></div>
                          <div className="dot"></div>
                        </div>
                        <span className="typing-text">Eklav is typing...</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </Card.Body>

            <Card.Footer className="session-controls">
              {sessionStarted && !sessionEnded && noResponseCountRef.current > 0 && (
                <div className="text-center mb-2">
                  <small className="text-muted">
                    ⏳ Waiting for response ({noResponseCountRef.current}/{MAX_NO_RESPONSE})
                  </small>
                </div>
              )}

              {sessionStarted && !sessionEnded && (
                <div className="control-buttons mt-2">
                  <Button
                    variant={isListening ? 'outline-secondary' : 'info'}
                    disabled={isListening || ttsCountRef.current > 0}
                    onClick={startListening}
                  >
                    🎙 Start Speaking
                  </Button>

                  <Button
                    variant="outline-danger"
                    disabled={!isListening}
                    onClick={() => {
                      manualStopRef.current = true
                      stopListening()
                      clearSilenceTimer()
                    }}
                  >
                    ⏹ Stop Speaking
                  </Button>
                </div>
              )}

              <div className="control-buttons">
                <Button
                  variant={canStart ? 'success' : 'outline-secondary'}
                  size="lg"
                  className="control-btn"
                  disabled={!canStart}
                  onClick={handleStartSession}>
                  ▶ Start Session
                </Button>
                <Button
                  variant={canStop ? 'danger' : 'outline-secondary'}
                  size="lg"
                  className="control-btn"
                  disabled={!canStop}
                  onClick={handleEndSession}>
                  ⏹ Stop Session
                </Button>
                <Button
                  variant={canNewSession ? 'primary' : 'outline-secondary'}
                  size="lg"
                  className="control-btn"
                  disabled={!canNewSession}
                  onClick={restartSession}>
                  🔄 New Session
                </Button>
              </div>
            </Card.Footer>
          </Card>
        </Col>
        {/* FEEDBACK CARD */}
        <Col xs={12} lg={6}>
          <Card className="shadow-sm h-100">
            <Card.Header className="feedback-header">
              <h5 className="fw-bold mb-0">
                <span className="feedback-icon">💡</span> Feedback Summary
              </h5>
            </Card.Header>

            <Card.Body className="feedback-body">
              {!feedback && !isLoadingFeedback ? (
                <div className="empty-feedback">
                  <div className="empty-icon">📄</div>
                  <h5>No Feedback Yet</h5>
                  <p>Complete a practice session to see your feedback</p>
                </div>
              ) : isLoadingFeedback ? (
                <div className="loading-feedback">
                  <Spinner animation="border" variant="primary" />
                  <h5>Analyzing your session...</h5>
                  <p>This may take a few moments</p>
                </div>
              ) : (
                <div className="feedback-content">
                  <h5 className="score-title">
                    <span className="score-icon">📝</span> Session Score
                  </h5>

                  {extractScore(feedback).length > 0 ? (
                    <div className="score-circles-container">
                      {extractScore(feedback).map((s, i) => {
                        const radius = 35
                        const circumference = 2 * Math.PI * radius
                        const progress = (s.score / 10) * circumference
                        const color = s.score >= 8 ? '#28a745' : s.score >= 5 ? '#ffc107' : '#dc3545'

                        return (
                          <div key={i} className="score-circle-wrapper">
                            <div className="score-circle">
                              <svg width="90" height="90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r={radius} stroke="#e9ecef" strokeWidth="8" fill="none" />
                                <circle
                                  cx="50"
                                  cy="50"
                                  r={radius}
                                  stroke={color}
                                  strokeWidth="8"
                                  fill="none"
                                  strokeDasharray={circumference}
                                  strokeDashoffset={circumference - progress}
                                  strokeLinecap="round"
                                  transform="rotate(-90 50 50)"
                                />
                              </svg>
                              <div className="score-value">
                                <strong className="score-number" style={{ color }}>
                                  {s.score}
                                  <span className="score-denominator">/10</span>
                                </strong>
                              </div>
                            </div>
                            <div className="score-label">{s.label}</div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="no-scores">
                      <p>No detailed scores available</p>
                    </div>
                  )}

                  {/* Rest of the feedback content remains the same */}
                  <h6 className="improvement-title">
                    <span className="improvement-icon">📌</span> Areas for Improvement
                  </h6>
                  <div className="improvement-list">
                    {extractImprovements(feedback).map((l, i) => (
                      <div key={i} className="improvement-item">
                        <span className="improvement-bullet">•</span>
                        <span
                          className="improvement-text"
                          dangerouslySetInnerHTML={{
                            __html: l.replace(/^- /, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  <h6 className="overall-title">
                    <span className="overall-icon">⭐</span> Overall Feedback
                  </h6>
                  <div className="overall-feedback">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: extractOverall(feedback)
                          .replace(/^\s*\d+\s*/, '')
                          .replace(/^[^\w<]+/, '')
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
                      }}
                    />
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* CSS Styles */}
      <style>{`
        .english-practice-container {
          padding: 1rem !important;
        }
        
        /* Header Styles */
        .practice-header {
          background: linear-gradient(135deg, #ff7a00 0%, #ff9a3c 100%) !important;
          color: white !important;
          padding: 1rem !important;
        }
        
        .header-text h5 {
          color: white !important;
          margin: 0 !important;
        }
        
        .attempts-text {
          color: rgba(255, 255, 255, 0.9) !important;
          margin: 0.25rem 0 0 0 !important;
        }
        
        .stats-container {
          display: flex;
          align-items: center;
          margin-top: 0.5rem;
        }
        
        @media (min-width: 576px) {
          .stats-container {
            margin-top: 0;
          }
        }
        
        .stat-box {
          min-width: 70px;
        }
        
        .stat-label {
          display: block;
          color: rgba(255, 255, 255, 0.8) !important;
          font-size: 0.75rem;
        }
        
        .stat-value {
          display: block;
          color: white !important;
          font-size: 1.25rem;
        }
        
        .mic-icon {
          font-size: 1.5rem;
          opacity: 0.8;
        }
        
        .mic-icon.listening {
          color: #ff7a00 !important;
          animation: pulse 1.5s infinite;
        }
        
        /* Chat Messages */
        .chat-body-container {
          min-height: 300px;
          max-height: 400px;
        }
        
        .chat-messages {
          height: 100%;
          padding: 1rem;
          overflow-y: auto;
          background: #f8f9fa;
        }
        
        .welcome-screen {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 2rem;
        }
        
        .welcome-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          color: #6c757d;
        }
        
        .welcome-title {
          color: #212529;
          margin-bottom: 0.5rem;
        }
        
        .welcome-text {
          color: #6c757d;
          margin: 0;
        }
        
        /* Message Bubbles */
        .message-container {
          margin-bottom: 1rem;
        }
        
        .user-message {
          display: flex;
          justify-content: flex-end;
        }
        
        .rob-message {
          display: flex;
          justify-content: flex-start;
        }
        
        .message-bubble {
          max-width: 80%;
          padding: 1rem;
          border-radius: 1rem;
          position: relative;
        }
        
        .user-bubble {
          background: linear-gradient(135deg, #fff4e6 0%, #ffe0c2 100%);
          border: 1px solid #ff7a00;
          box-shadow: 0 2px 8px rgba(255, 122, 0, 0.15);
          border-radius: 1rem 1rem 0.25rem 1rem;
         
        }
        
        .rob-bubble {
          background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
          border: 1px solid #e0e0e0;
          border-radius: 1rem 1rem 1rem 0.25rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .correction-bubble {
          background: linear-gradient(135deg, #fff3e0 0%, #ffcc80 100%);
          border: 2px solid #ff9800;
          border-radius: 1rem 1rem 1rem 0.25rem;
          box-shadow: 0 2px 8px rgba(255, 152, 0, 0.2);
        }
        
        .message-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        
        .sender-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .user-avatar,
        .rob-avatar,
        .correction-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.875rem;
        }
        
        .user-avatar {
          background: linear-gradient(135deg, #ff7a00 0%, #ff9a3c 100%);
          color: white;
        }
        
        .rob-avatar {
          background: linear-gradient(135deg, #757575 0%, #424242 100%);
          color: white;
        }
        
        .correction-avatar {
          background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
          color: white;
        }
        
        .sender-name {
          color: #212529;
        }
        
        .message-time {
          color: #6c757d;
          font-size: 0.75rem;
        }
        
        .message-text {
          color: #212529;
          line-height: 1.5;
          word-break: break-word;
        }
        
        .live-speech {
          color: #6c757d;
          font-style: italic;
        }
        
        .correction-badge {
          margin-left: 0.5rem;
          font-size: 0.65rem;
          padding: 0.25rem 0.5rem;
        }
        
        .pulsating-dot {
          width: 10px;
          height: 10px;
          background-color: #ff7a00;
          border-radius: 50%;
          animation: pulse 1.5s infinite ease-in-out;
        }
        
        .speaking {
          opacity: 0.9;
        }
        
        /* Typing Indicator */
        .typing-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background: #f5f5f5;
          border-radius: 0.5rem;
          max-width: 80%;
        }
        
        .typing-dots {
          display: flex;
          gap: 0.25rem;
        }
        
        .dot {
          width: 8px;
          height: 8px;
          background-color: #9e9e9e;
          border-radius: 50%;
          animation: typing 1.4s infinite ease-in-out;
        }
        
        .dot:nth-child(1) { animation-delay: -0.32s; }
        .dot:nth-child(2) { animation-delay: -0.16s; }
        
        .typing-text {
          color: #6c757d;
          font-size: 0.875rem;
        }
        
        /* Session Controls */
        .session-controls {
          background: white;
          padding: 1rem !important;
        }
        
        .progress-section {
          margin-bottom: 1rem;
        }
        
        .progress-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.25rem;
        }
        
        .progress-info small {
          color: #212529;
        }
        
       /* ===== CLEAN PROFESSIONAL BUTTON ALIGNMENT ===== */

.session-controls {
  background: #000; /* keep your dark look */
  padding: 1.5rem !important;
}

/* Both rows wrapper */
.control-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 14px;
  flex-wrap: wrap;
}

/* Make all buttons equal height */
.control-buttons .btn {
  min-width: 140px;   /* reduced */
  height: 42px;       /* reduced */
  padding: 0 16px;    /* tighter */
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.control-btn {
  flex: 0 0 auto;
  min-width: 150px;   /* reduced */
}

.control-buttons .btn {
  min-width: 120px;
  height: 38px;
  font-size: 0.85rem;
}


/* Mobile */
@media (max-width: 768px) {
  .control-buttons {
    flex-direction: column;
    align-items: stretch;
  }

  .control-buttons .btn {
    width: 100%;
    min-width: unset;
  }
}

        
        @media (min-width: 576px) {
          .control-buttons {
            flex-direction: row;
          }
        }
        
        .control-btn {
          flex: 1;
          font-weight: 600;
          white-space: nowrap;
        }
        
        .feedback-header {
          background: linear-gradient(135deg, #ff7a00 0%, #ff9a3c 100%) !important;
          color: white !important;
          padding: 1rem !important;
          border-bottom: none !important;
        }

        .feedback-header h5 {
          color: white !important;
          margin: 0 !important;
        }

        .feedback-icon {
          color: #fff !important;
        }
        .feedback-body {
        padding: 0 !important;
        }

        
        .empty-feedback,
        .loading-feedback {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 2rem;
          text-align: center;
        }

        
        .empty-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          color: #6c757d;
        }
        
        .empty-feedback h5 {
          color: #ffffffff;
          margin-bottom: 0.5rem;
        }
        
        .empty-feedback p {
          color: #6c757d;
          margin: 0;
        }
        
        .loading-feedback h5 {
          color: #ffffffff;
          margin: 1rem 0 0.5rem 0;
        }
        
        .loading-feedback p {
          color: #6c757d;
          margin: 0;
        }
        
        /* Feedback Content */
        .feedback-content {
          padding: 1.5rem;
          max-height: 500px;
          overflow-y: auto;
        }
        
        .score-title {
          text-align: center;
          color: #ffffffff;
          margin-bottom: 1.5rem;
        }
        
        .score-icon {
          color: #ffffffff;
          margin-right: 0.5rem;
          
        }
        
        .score-circles {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .score-item {
          text-align: center;
          min-width: 80px;
        }
        
        .score-circle {
          position: relative;
          margin: 0 auto 0.5rem;
        }
        
        .score-value {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
        
        .score-label {
          font-weight: 600;
          color: #212529;
        }
        
        .improvement-title {
          color: #fafafaff;
          margin: 1.5rem 0 1rem 0;
        }
        
        .improvement-icon {
          color: #ff5722;
          margin-right: 0.5rem;
        }
        
        .improvement-list {
          margin-bottom: 1.5rem;
        }
        
        .improvement-item {
          display: flex;
          align-items: flex-start;
          margin-bottom: 0.75rem;
          padding: 0.75rem;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-left: 4px solid #ff9800;
          border-radius: 0.25rem;
        }
        
        .improvement-bullet {
          color: #ff9800;
          font-size: 1.5rem;
          line-height: 1;
          margin-right: 0.75rem;
          margin-top: -0.125rem;
        }
        
        .improvement-text {
          color: #212529;
          line-height: 1.5;
          word-break: break-word;
        }
        
        .overall-title {
          color: #fafafaff;
          margin: 1.5rem 0 1rem 0;
        }
        
        .overall-icon {
          color: #ffc107;
          margin-right: 0.5rem;
        }
        
        .overall-feedback {
          padding: 1rem;
          background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
          border-left: 4px solid #4caf50;
          border-radius: 0.5rem;
          color: #212529;
          line-height: 1.5;
          word-break: break-word;
        }
        
        /* Animations */
        @keyframes pulse {
          0% { transform: scale(0.8); opacity: 0.7; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(0.8); opacity: 0.7; }
        }
        
        @keyframes typing {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
        
        /* Mobile Responsive */
        @media (max-width: 768px) {
          .english-practice-container {
            padding: 0.5rem !important;
          }
          
          .message-bubble {
            max-width: 90%;
            padding: 0.75rem;
          }
          
          .score-circles {
            gap: 1rem;
          }
          
          .score-circle svg {
            width: 70px;
            height: 70px;
          }
          
          .control-btn {
            font-size: 0.875rem;
            padding: 0.5rem;
          }
        }
        
        @media (max-width: 576px) {
          .control-buttons {
            flex-direction: column;
          }
          
          .control-btn {
            width: 100%;
            margin-bottom: 0.5rem;
          }
          
          .stats-container {
            width: 100%;
            justify-content: space-between;
            margin-top: 1rem;
          }
          
          .score-circles {
            flex-direction: column;
            align-items: center;
          }
          
          .score-item {
            width: 100%;
          }
        }
          .score-circles-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1.5rem;
    margin-bottom: 2rem;
  }
  
  .score-circle-wrapper {
    text-align: center;
    flex: 0 0 auto;
  }
  
  .score-circle {
    position: relative;
    margin: 0 auto 0.5rem;
    width: 90px;
    height: 90px;
  }
  
  .score-circle svg {
    width: 100%;
    height: 100%;
  }
  
  .score-value {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    width: 100%;
  }
  
  .score-number {
    font-size: 1.5rem;
    line-height: 1.2;
    display: inline-block;
  }
  
  .score-denominator {
    font-size: 0.875rem;
    color: #6c757d;
    display: block;
    margin-top: 0.125rem;
  }
  
  .score-label {
    font-weight: 600;
    color: #ffffffff;
    font-size: 0.875rem;
    margin-top: 0.25rem;
  }
  
  /* Desktop: Circles in a row */
  @media (min-width: 768px) {
    .score-circles-container {
      flex-wrap: nowrap;
      justify-content: space-around;
    }
    
    .score-circle-wrapper {
      flex: 1;
      max-width: 120px;
    }
    
    .score-circle {
      width: 100px;
      height: 100px;
    }
    
    .score-number {
      font-size: 1.75rem;
    }
    
    .score-denominator {
      font-size: 1rem;
    }
  }
  
  /* Mobile: Adjust circle size and layout */
  @media (max-width: 767px) {
    .score-circles-container {
      gap: 1rem;
    }
    
    .score-circle-wrapper {
      flex: 0 0 calc(33.333% - 1rem);
      min-width: 80px;
    }
    
    .score-circle {
      width: 80px;
      height: 80px;
    }
    
    .score-number {
      font-size: 1.25rem;
    }
    
    .score-denominator {
      font-size: 0.75rem;
    }
  }
  
  /* Small mobile: Stack vertically if needed */
  @media (max-width: 576px) {
    .score-circles-container {
      flex-direction: row;
      flex-wrap: wrap;
      gap: 1.5rem;
    }
    
    .score-circle-wrapper {
      flex: 0 0 calc(50% - 0.75rem);
      min-width: 70px;
    }
    
    .score-circle {
      width: 70px;
      height: 70px;
    }
    
    .score-number {
      font-size: 1.1rem;
    }
    
    .score-denominator {
      font-size: 0.7rem;
    }
    
    .score-label {
      font-size: 0.8rem;
    }
  }
  
  /* Extra small mobile: Smaller circles */
  @media (max-width: 400px) {
    .score-circle-wrapper {
      flex: 0 0 calc(50% - 0.5rem);
      min-width: 60px;
    }
    
    .score-circle {
      width: 60px;
      height: 60px;
    }
    
    .score-number {
      font-size: 1rem;
    }
    
    .score-denominator {
      font-size: 0.65rem;
    }
    
    .score-label {
      font-size: 0.75rem;
    }
  }

  
  /* Very small mobile: Stack vertically */
  @media (max-width: 360px) {
    .score-circles-container {
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }
    
    .score-circle-wrapper {
      flex: 0 0 auto;
      width: 100%;
      max-width: 80px;
    }
    
    .score-circle {
      width: 80px;
      height: 80px;
    }
    
    .score-number {
      font-size: 1.25rem;
    }
    
    .score-denominator {
      font-size: 0.875rem;
    }
  }
  /* ORANGE BUTTON STYLE */
    .control-btn.btn-success,
    .control-btn.btn-primary,
    .control-btn.btn-danger {
      background: #ff7a00 !important;
      border-color: #ff7a00 !important;
      color: #fff !important;
    }

    .control-btn.btn-success:hover,
    .control-btn.btn-primary:hover,
    .control-btn.btn-danger:hover {
      background: #e96d00 !important;
      border-color: #e96d00 !important;
    }

    .best-score-value {
      color: #ffffff !important;
      font-size: 1.6rem;
      font-weight: 700;
      text-shadow: 0 2px 6px rgba(0,0,0,0.3);
    }

    .trial-warning {
        color: #5c3d00;   /* deep brown for contrast */
        font-weight: 600;
      }

      .trial-badge {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  backdrop-filter: blur(4px);
}

.attempts-wrapper {
  margin-top: 6px;
}

.attempts-text {
  color: rgba(255,255,255,0.95);
  font-size: 0.9rem;
}

.trial-limit-box {
  margin-top: 6px;
  background: rgba(255,255,255,0.15);
  color: #fff;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 500;
  display: inline-block;
}

  

      `}</style>
    </Container>
  )
}

export default EnglishVoicePractice
