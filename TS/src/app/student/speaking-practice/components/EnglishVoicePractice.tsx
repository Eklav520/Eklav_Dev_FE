import React, { useState, useEffect, useRef } from 'react'
import { Card, Button, Spinner, Container, Badge } from 'react-bootstrap'
import axios from 'axios'
import { useAuthContext } from '@/context/useAuthContext'
import RoboAvatar from './RoboAvatar'

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
  const lastUserRef = useRef('')
  const sessionActiveRef = useRef(false)
  const chatBodyRef = useRef<HTMLDivElement>(null)
  const [history, setHistory] = useState<any>(null)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const speechPauseTimerRef = useRef<any>(null)
  const canStop = sessionStarted && !sessionEnded
  const canNewSession = sessionEnded
  const TRIAL_LIMIT = 5

  const maxAllowedAttempts = isTrialUser ? TRIAL_LIMIT : history?.monthlyLimit ?? 0
  const isLimitReached = !!history && history.attemptsUsed >= maxAllowedAttempts
  const canStart = !sessionStarted && !isLimitReached
  const silenceTimerRef = useRef<any>(null)
  const noResponseCountRef = useRef(0)
  const manualStopRef = useRef(false)

  const MAX_NO_RESPONSE = 3
  const SILENCE_TIMEOUT = 6000
  const ttsCountRef = useRef(0)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [voiceGender, setVoiceGender] = useState<'male' | 'female'>('female')

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

      if (!res.ok) throw new Error('Failed to fetch history')

      const data = await res.json()
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

  useEffect(() => {
    const loadVoices = () => {
      const v = speechSynthesis.getVoices()
      if (v.length) setVoices(v)
    }

    loadVoices()
    speechSynthesis.onvoiceschanged = loadVoices
  }, [])

  useEffect(() => {
    if (token) fetchSpeakingHistory()
  }, [token])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight
    }
  }, [messages, liveSpeech, isTyping])

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

  const fixSpeechText = async (text: string) => {
    try {
      const res = await axios.post(`${baseURL}/api/english/fix-speech`, { text })
      return res.data.corrected || text
    } catch {
      return text
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
      if (!sessionActiveRef.current || ttsCountRef.current > 0) return
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

  const startListening = () => {
    if (!sessionActiveRef.current || ttsCountRef.current > 0) return

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return alert('Speech Recognition Not Supported')

    try {
      recognitionRef.current?.abort()
    } catch { }

    const rec = new SR()
    rec.lang = 'en-IN'
    rec.continuous = true
    rec.interimResults = true
    rec.maxAlternatives = 1

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
        const result = e.results[i][0]
        const txt = result.transcript
        const confidence = result.confidence || 0.5

        if (confidence < 0.6) continue
        e.results[i].isFinal ? (final += txt) : (interim += txt)
      }

      if (interim.trim()) {
        noResponseCountRef.current = 0
        setLiveSpeech(interim.trim())
      }

      if (final.trim()) {
        noResponseCountRef.current = 0
        const text = final.trim()

        clearTimeout(speechPauseTimerRef.current)
        speechPauseTimerRef.current = setTimeout(async () => {
          if (!sessionActiveRef.current || text === lastUserRef.current) return
          lastUserRef.current = text
          setLiveSpeech('')
          clearSilenceTimer()

          setMessages((p) => [...p, { sender: 'user', text, type: 'user' }])
          transcriptRef.current += `You: ${text}\n`
          const cleanText = await fixSpeechText(text)
          await sendToRob(cleanText)
        }, 2500)
      }
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

  const waitForTTS = () => new Promise<void>((res) => {
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
      setTimeout(() => {
        if (sessionActiveRef.current) startSilenceTimer()
      }, 500)
    }
  }

  const getBestVoice = (gender: 'male' | 'female'): SpeechSynthesisVoice | undefined => {
    const femalePriority = [
      'google uk english female', 'microsoft zira desktop', 'microsoft hazel desktop',
      'samantha', 'karen', 'moira', 'victoria', 'tessa', 'female', 'zira',
    ]
    const malePriority = [
      'google uk english male', 'microsoft david desktop', 'microsoft george desktop',
      'alex', 'daniel', 'oliver', 'aaron', 'fred', 'male', 'david',
    ]
    const priority = gender === 'female' ? femalePriority : malePriority
    for (const term of priority) {
      const found = voices.find(v => v.name.toLowerCase().includes(term))
      if (found) return found
    }
    return voices[0]
  }

  const speak = (text: string) => new Promise<void>(async (resolve) => {
    if (!sessionActiveRef.current) return resolve()
    onTTSStart()

    const utter = new SpeechSynthesisUtterance(text.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, ''))
    utter.voice = getBestVoice(voiceGender) || voices[0]
    utter.pitch = voiceGender === 'female' ? 1.05 : 0.95
    utter.rate = 0.95

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

  const sendToRob = async (msg: string) => {
    if (!sessionActiveRef.current) return
    setIsTyping(true)

    try {
      const { data } = await axios.post(`${baseURL}/api/english/chat`, { userMessage: msg })
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
    stopListening()
    speechSynthesis.cancel()
    ttsCountRef.current = 0
    setSessionEnded(true)
    setIsLoadingFeedback(true)

    try {
      const res = await axios.post(`${baseURL}/api/english/end`, { transcript: transcriptRef.current }, { headers: { Authorization: `Bearer ${token}` } })
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
    return t.split('\n').map((l) => {
      for (let k of keys) {
        if (l.toLowerCase().includes(k.toLowerCase()) && !found[k]) {
          found[k] = true
          const m = l.match(/(\d+)\/10/)
          return { label: k, score: m ? +m[1] : 0 }
        }
      }
      return null
    }).filter(Boolean) as any[]
  }

  const extractImprovements = (t: string) => t.split('\n').filter((l) => l.trim().startsWith('-'))
  const extractOverall = (t: string) => t.split('\n').slice(-2).join(' ')

  return (
    <div className="english-practice-container">
      <Container fluid className="px-0">
        <div className="main-layout">
          {/* Left Column - Avatar */}
          <div className="avatar-column">
            <Card className="avatar-card">
              <RoboAvatar
                isTyping={isTyping}
                isListening={isListening}
                isSpeaking={ttsCountRef.current > 0}
              />
            </Card>
          </div>

          {/* Right Column - Chat */}
          <div className="chat-column">
            <Card className="practice-card">
              <Card.Header className="practice-header">
                <div className="header-top">
                  <div className="header-left">
                    <h5 className="header-title">
                      🗣 Speak with Eklav
                      {isTrialUser && <span className="trial-badge ms-2">Trial</span>}
                    </h5>
                    <div className="attempts-text">
                      <div>
                        {isTrialUser ? 'Free Attempts' : 'Monthly Attempts'}:{' '}
                        <strong>{history ? `${Math.min(history.attemptsUsed, maxAllowedAttempts)} / ${maxAllowedAttempts}` : '...'}</strong>
                      </div>
                      {isLimitReached && (
                        <div className="trial-warning mt-1 small">
                          {isTrialUser ? 'Trial limit reached. Upgrade to continue.' : 'Monthly limit reached.'}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="header-right">
                    <div className="voice-selector">
                      <div className="voice-toggle">
                        <button
                          className={`voice-btn voice-btn-female${voiceGender === 'female' ? ' active' : ''}`}
                          onClick={() => setVoiceGender('female')}
                          title="Female voice"
                        >
                          👩‍🦳
                        </button>
                        <button
                          className={`voice-btn voice-btn-male${voiceGender === 'male' ? ' active' : ''}`}
                          onClick={() => setVoiceGender('male')}
                          title="Male voice"
                        >
                          👨‍🦱
                        </button>
                      </div>
                    </div>
                    <div className="stats-group">
                      {history && history.highestScore !== null && (
                        <div className="stat-item">
                          <small className="stat-label">Best Score</small>
                          <strong className="best-score-value">{history.highestScore}</strong>
                        </div>
                      )}
                      <div className="stat-item">
                        <small className="stat-label">Time</small>
                        <strong className="stat-value">{formatTime(timeLeft)}</strong>
                      </div>
                      <div className="mic-status">
                        <span className={`mic-icon ${isListening ? 'listening' : ''}`}>🎤</span>
                      </div>
                    </div>
                    <div className="action-buttons-group">
                      <div className="session-buttons">
                        <Button 
                          variant={canStart ? 'outline' : 'outline-secondary'} 
                          className="action-btn start-btn" 
                          disabled={!canStart} 
                          onClick={handleStartSession}
                        >
                          ▶ Start
                        </Button>
                        <Button 
                          variant={canStop ? 'outline' : 'outline-secondary'} 
                          className="action-btn stop-btn" 
                          disabled={!canStop} 
                          onClick={handleEndSession}
                        >
                          ⏹ Stop
                        </Button>
                        <Button 
                          variant={canNewSession ? 'outline' : 'outline-secondary'} 
                          className="action-btn new-btn" 
                          disabled={!canNewSession} 
                          onClick={restartSession}
                        >
                          🔄 New
                        </Button>
                      </div>
                      {sessionStarted && !sessionEnded && (
                        <div className="mic-buttons">
                          <Button 
                            variant={isListening ? 'outline-secondary' : 'outline'} 
                            disabled={isListening || ttsCountRef.current > 0} 
                            onClick={startListening} 
                            className="mic-action-btn speak-btn"
                          >
                            🎙 Speak
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            disabled={!isListening} 
                            onClick={() => { manualStopRef.current = true; stopListening(); clearSilenceTimer(); }} 
                            className="mic-action-btn stop-btn"
                          >
                            ⏹ Stop
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card.Header>

              <Card.Body className="chat-body-container">
                <div ref={chatBodyRef} className="chat-messages">
                  {!sessionStarted ? (
                    <div className="welcome-screen">
                      <div className="welcome-icon">🤖</div>
                      <h5 className="welcome-title">Let's Start Speaking with Eklav!</h5>
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
                                    <Badge bg="warning" text="dark" className="correction-badge ms-2">Correction</Badge>
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

              {sessionStarted && !sessionEnded && noResponseCountRef.current > 0 && (
                <div className="waiting-indicator-bar">
                  <small>⏳ Waiting for response ({noResponseCountRef.current}/{MAX_NO_RESPONSE})</small>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Feedback Section */}
        <div className="feedback-section">
          <Card className="feedback-card">
            <Card.Header className="feedback-header">
              <h5 className="fw-bold mb-0"><span className="feedback-icon">💡</span> Feedback Summary</h5>
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
                  <Spinner animation="border" variant="warning" />
                  <h5>Analyzing your session...</h5>
                  <p>This may take a few moments</p>
                </div>
              ) : (
                <div className="feedback-content">
                  <h5 className="score-title"><span className="score-icon">📝</span> Session Score</h5>

                  {extractScore(feedback).length > 0 ? (
                    <div className="score-circles-container">
                      {extractScore(feedback).map((s, i) => {
                        const radius = 35
                        const circumference = 2 * Math.PI * radius
                        const progress = (s.score / 10) * circumference
                        const color = s.score >= 8 ? '#28a745' : s.score >= 5 ? '#ff7a00' : '#dc3545'

                        return (
                          <div key={i} className="score-circle-wrapper">
                            <div className="score-circle">
                              <svg width="90" height="90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r={radius} stroke="#2c2c2c" strokeWidth="8" fill="none" />
                                <circle cx="50" cy="50" r={radius} stroke={color} strokeWidth="8" fill="none" strokeDasharray={circumference} strokeDashoffset={circumference - progress} strokeLinecap="round" transform="rotate(-90 50 50)" />
                              </svg>
                              <div className="score-value">
                                <strong className="score-number" style={{ color }}>{s.score}<span className="score-denominator">/10</span></strong>
                              </div>
                            </div>
                            <div className="score-label">{s.label}</div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="no-scores"><p>No detailed scores available</p></div>
                  )}

                  <h6 className="improvement-title"><span className="improvement-icon">📌</span> Areas for Improvement</h6>
                  <div className="improvement-list">
                    {extractImprovements(feedback).map((l, i) => (
                      <div key={i} className="improvement-item">
                        <span className="improvement-bullet">•</span>
                        <span className="improvement-text" dangerouslySetInnerHTML={{ __html: l.replace(/^- /, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                      </div>
                    ))}
                  </div>

                  <h6 className="overall-title"><span className="overall-icon">⭐</span> Overall Feedback</h6>
                  <div className="overall-feedback">
                    <div dangerouslySetInnerHTML={{ __html: extractOverall(feedback).replace(/^\s*\d+\s*/, '').replace(/^[^\w<]+/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </div>
      </Container>

      <style>{`
        .english-practice-container {
          background: #000000;
          min-height: 100vh;
          padding: 1rem;
        }

        /* Main Layout */
        .main-layout {
          display: flex;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }

        .avatar-column {
          flex: 0 0 300px;
        }

        .chat-column {
          flex: 1;
          min-width: 0;
        }

        /* Cards */
        .avatar-card, .practice-card, .feedback-card {
          background: #0a0a0a;
          border: 1px solid #1f1f1f;
          border-radius: 16px;
          overflow: hidden;
          height: 100%;
        }

        .avatar-card {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 500px;
        }

        /* Header */
        .practice-header {
          background: linear-gradient(135deg, #ff7a00 0%, #ff944d 100%) !important;
          border-bottom: none !important;
          padding: 1rem !important;
        }

        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .header-left {
          flex: 1;
        }

        .header-title {
          color: #000000 !important;
          font-weight: 700;
          margin: 0;
          font-size: 1.1rem;
        }

        .attempts-text {
          color: rgba(0, 0, 0, 0.7) !important;
          margin: 0.25rem 0 0 0 !important;
          font-size: 0.75rem;
        }

        .trial-warning {
          color: #000000;
          font-weight: 600;
        }

        .trial-badge {
          background: rgba(0, 0, 0, 0.3);
          color: #000000;
          padding: 2px 8px;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 600;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 0;
        }

        .stats-group {
          display: flex;
          align-items: center;
          gap: 0;
        }

        .stat-item {
          text-align: center;
          padding: 0 1.1rem;
          border-left: 1px solid rgba(0, 0, 0, 0.2);
        }

        .stat-label {
          display: block;
          color: rgba(0, 0, 0, 0.55) !important;
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 2px;
        }

        .stat-value {
          display: block;
          color: #000000 !important;
          font-size: 1.05rem;
          font-weight: 700;
          line-height: 1;
        }

        .best-score-value {
          display: block;
          color: #000000 !important;
          font-size: 1.05rem;
          font-weight: 700;
          line-height: 1;
        }

        .mic-status {
          display: flex;
          align-items: center;
          padding: 0 0.9rem;
          border-left: 1px solid rgba(0, 0, 0, 0.2);
        }

        .mic-icon {
          font-size: 1.2rem;
          opacity: 0.75;
        }

        .mic-icon.listening {
          color: #000000 !important;
          opacity: 1;
          animation: pulse 1.5s infinite;
        }

        .action-buttons-group {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding-left: 1.1rem;
          border-left: 1px solid rgba(0, 0, 0, 0.2);
        }

        .session-buttons {
          display: flex;
          gap: 0.4rem;
        }

        .action-btn {
          min-width: 72px;
          height: 32px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 0.8rem;
          transition: all 0.2s ease;
          background: transparent !important;
          border-width: 1.5px !important;
          padding: 0 0.75rem;
        }

        .action-btn.start-btn {
          border-color: #000000 !important;
          color: #000000 !important;
        }

        .action-btn.start-btn:hover:not(:disabled) {
          background: #000000 !important;
          color: #ff7a00 !important;
          transform: translateY(-1px);
        }

        .action-btn.stop-btn {
          border-color: #000000 !important;
          color: #000000 !important;
        }

        .action-btn.stop-btn:hover:not(:disabled) {
          background: #000000 !important;
          color: #ff7a00 !important;
          transform: translateY(-1px);
        }

        .action-btn.new-btn {
          border-color: #000000 !important;
          color: #000000 !important;
        }

        .action-btn.new-btn:hover:not(:disabled) {
          background: #000000 !important;
          color: #ff7a00 !important;
          transform: translateY(-1px);
        }

        .action-btn:disabled {
          border-color: #6c757d !important;
          color: #6c757d !important;
          opacity: 0.6;
        }

        .mic-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .mic-action-btn {
          min-width: 70px;
          height: 34px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 0.8rem;
          background: transparent !important;
          border-width: 1.5px !important;
        }

        .mic-action-btn.speak-btn {
          border-color: #000000 !important;
          color: #000000 !important;
        }

        .mic-action-btn.speak-btn:hover:not(:disabled) {
          background: #000000 !important;
          color: #ff7a00 !important;
          transform: translateY(-1px);
        }

        .mic-action-btn.stop-btn {
          border-color: #dc3545 !important;
          color: #dc3545 !important;
        }

        .mic-action-btn.stop-btn:hover:not(:disabled) {
          background: #dc3545 !important;
          color: #ffffff !important;
          transform: translateY(-1px);
        }

        .mic-action-btn:disabled {
          border-color: #6c757d !important;
          color: #6c757d !important;
          opacity: 0.6;
        }

        /* Chat */
        .chat-body-container {
          height: 450px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          padding: 0 !important;
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          background: #000000;
        }

        .chat-messages::-webkit-scrollbar {
          width: 6px;
        }

        .chat-messages::-webkit-scrollbar-track {
          background: #1a1a1a;
          border-radius: 3px;
        }

        .chat-messages::-webkit-scrollbar-thumb {
          background: #ff7a00;
          border-radius: 3px;
        }

        .waiting-indicator-bar {
          background: #1a1a1a;
          border-top: 1px solid #ff7a00;
          padding: 0.5rem;
          text-align: center;
          color: #ff7a00;
          font-size: 0.75rem;
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
          color: #ff7a00;
        }

        .welcome-title {
          color: #ffffff;
          margin-bottom: 0.5rem;
        }

        .welcome-text {
          color: #8a8a8a;
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

        .eklav-message {
          display: flex;
          justify-content: flex-start;
        }

        .message-bubble {
          max-width: 85%;
          padding: 0.75rem 1rem;
          border-radius: 1rem;
          position: relative;
        }

        .user-bubble {
          background: linear-gradient(135deg, #1f1f1f 0%, #2c2c2c 100%);
          border: 1px solid #ff7a00;
          box-shadow: 0 2px 8px rgba(255, 122, 0, 0.15);
          border-radius: 1rem 1rem 0.25rem 1rem;
        }

        .rob-bubble {
          background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);
          border: 1px solid #2c2c2c;
          border-radius: 1rem 1rem 1rem 0.25rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .correction-bubble {
          background: linear-gradient(135deg, #332200 0%, #442a00 100%);
          border: 2px solid #ff7a00;
          border-radius: 1rem 1rem 1rem 0.25rem;
          box-shadow: 0 2px 8px rgba(255, 122, 0, 0.2);
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

        .user-avatar, .rob-avatar, .correction-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.875rem;
          background: linear-gradient(135deg, #ff7a00 0%, #ff944d 100%);
          color: #000000;
        }

        .sender-name {
          color: #ffffff;
          font-size: 0.85rem;
        }

        .message-time {
          color: #8a8a8a;
          font-size: 0.7rem;
        }

        .message-text {
          color: #e5e5e5;
          line-height: 1.5;
          word-break: break-word;
          white-space: pre-wrap;
          font-size: 0.9rem;
        }

        .live-speech {
          color: #ff7a00;
          font-style: italic;
        }

        .pulsating-dot {
          width: 10px;
          height: 10px;
          background-color: #ff7a00;
          border-radius: 50%;
          animation: pulse 1.5s infinite ease-in-out;
        }

        .typing-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background: #1a1a1a;
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
          background-color: #ff7a00;
          border-radius: 50%;
          animation: typing 1.4s infinite ease-in-out;
        }

        .typing-text {
          color: #8a8a8a;
          font-size: 0.875rem;
        }

        /* Feedback */
        .feedback-section {
          margin-top: 1.5rem;
        }

        .feedback-header {
          background: linear-gradient(135deg, #ff7a00 0%, #ff944d 100%) !important;
          border-bottom: none !important;
          padding: 1rem !important;
        }

        .feedback-header h5 {
          color: #000000 !important;
          margin: 0 !important;
        }

        .feedback-icon {
          color: #000000 !important;
        }

        .feedback-body {
          padding: 0 !important;
        }

        .empty-feedback, .loading-feedback {
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
          color: #ff7a00;
        }

        .empty-feedback h5, .loading-feedback h5 {
          color: #ffffff;
          margin-bottom: 0.5rem;
        }

        .empty-feedback p, .loading-feedback p {
          color: #8a8a8a;
          margin: 0;
        }

        .feedback-content {
          padding: 1.5rem;
          max-height: 500px;
          overflow-y: auto;
        }

        .score-title {
          text-align: center;
          color: #ffffff;
          margin-bottom: 1.5rem;
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
          color: #8a8a8a;
          display: block;
          margin-top: 0.125rem;
        }

        .score-label {
          font-weight: 600;
          color: #ffffff;
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }

        .improvement-title, .overall-title {
          color: #ffffff;
          margin: 1.5rem 0 1rem 0;
        }

        .improvement-list {
          margin-bottom: 1.5rem;
        }

        .improvement-item {
          display: flex;
          align-items: flex-start;
          margin-bottom: 0.75rem;
          padding: 0.75rem;
          background: #000000;
          border-left: 4px solid #ff7a00;
          border-radius: 0.25rem;
        }

        .improvement-bullet {
          color: #ff7a00;
          font-size: 1.5rem;
          line-height: 1;
          margin-right: 0.75rem;
          margin-top: -0.125rem;
        }

        .improvement-text {
          color: #e5e5e5;
          line-height: 1.5;
          word-break: break-word;
        }

        .overall-feedback {
          padding: 1rem;
          background: #000000;
          border-left: 4px solid #ff7a00;
          border-radius: 0.5rem;
          color: #e5e5e5;
          line-height: 1.5;
          word-break: break-word;
        }

        @keyframes pulse {
          0% { transform: scale(0.8); opacity: 0.7; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(0.8); opacity: 0.7; }
        }

        @keyframes typing {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }

        /* Voice selector */
        .voice-selector {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding-right: 1.1rem;
          border-right: 1px solid rgba(0, 0, 0, 0.2);
        }

        .voice-label {
          color: rgba(0, 0, 0, 0.75);
          font-size: 0.72rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .voice-toggle {
          display: flex;
          gap: 5px;
        }

        .voice-btn {
          background: rgba(0, 0, 0, 0.35);
          border: 1.5px solid rgba(0, 0, 0, 0.5);
          padding: 0;
          width: 38px;
          height: 38px;
          font-size: 1.3rem;
          cursor: pointer;
          transition: all 0.18s ease;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          filter: grayscale(0.2) opacity(0.7);
        }

        .voice-btn.active {
          background: #000000;
          border-color: #000000;
          filter: none;
          transform: scale(1.12);
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
        }

        .voice-btn:not(.active):hover {
          background: rgba(0, 0, 0, 0.55);
          filter: grayscale(0) opacity(0.9);
        }

        /* Responsive */
        @media (max-width: 992px) {
          .main-layout {
            flex-direction: column;
          }
          
          .avatar-column {
            flex: 0 0 auto;
            width: 100%;
            max-width: 400px;
            margin: 0 auto;
          }
          
          .avatar-card {
            min-height: 400px;
          }
        }

        @media (max-width: 768px) {
          .header-top {
            flex-direction: column;
            align-items: stretch;
          }
          
          .header-right {
            flex-direction: column;
            align-items: stretch;
          }
          
          .stats-group {
            justify-content: space-between;
          }
          
          .action-buttons-group {
            flex-direction: column;
          }
          
          .session-buttons {
            justify-content: center;
          }
          
          .mic-buttons {
            justify-content: center;
          }
          
          .action-btn, .mic-action-btn {
            min-width: 100px;
          }
          
          .chat-body-container {
            height: 350px;
          }
          
          .score-circles-container {
            flex-direction: column;
            align-items: center;
          }
        }
      `}</style>
    </div>
  )
}

export default EnglishVoicePractice