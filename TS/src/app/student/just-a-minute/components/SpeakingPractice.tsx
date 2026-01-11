import React, { useEffect, useRef, useState } from 'react'
import { Button, Card, Container, Row, Col, Spinner, Badge, ProgressBar, Alert, Modal, Form } from 'react-bootstrap'
import { useAuthContext } from '@/context/useAuthContext'
import { FaMicrophone, FaStop, FaStar, FaLightbulb, FaCheckCircle, FaRedo, FaPlay, FaExclamationTriangle, FaMobileAlt, FaKeyboard } from 'react-icons/fa'

type Prompt = {
  _id: string
  text: string
}

type Feedback = {
  correctedTranscript: string
  grammar: string
  fluency: string
  vocabulary: string
  pronunciation: string
  recommendations: string
  score: number
  studentAudioUrl?: string
  correctedAudioUrl?: string
}

type JamHistory = {
  weeklyLimit: number
  attemptsUsed: number
  remainingAttempts: number
  summary: {
    bestScore: number | null
    latestScore: number | null
  }
  attempts: {
    attempt: number
    score: number
    date: string
  }[]
}

const SpeakingPractice: React.FC = () => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const token = user?.token

  const [prompt, setPrompt] = useState<Prompt | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  const [loadingPrompt, setLoadingPrompt] = useState(false)
  const [recording, setRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [manualTranscript, setManualTranscript] = useState('')
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [loading, setLoading] = useState(false)
  const [sampleAnswer, setSampleAnswer] = useState<string>('')
  const [recordingTime, setRecordingTime] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])
  const recognitionRef = useRef<any>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioStreamRef = useRef<MediaStream | null>(null)

  const [maxDuration] = useState(60)
  const [timeUp, setTimeUp] = useState(false)
  const [history, setHistory] = useState<JamHistory | null>(null)

  const [loadingHistory, setLoadingHistory] = useState(false)
  const [showMobileHelp, setShowMobileHelp] = useState(false)
  const [recordingError, setRecordingError] = useState<string>('')
  const [isMobile, setIsMobile] = useState(false)
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const [isWebView, setIsWebView] = useState(false)
  const [showManualInput, setShowManualInput] = useState(false)
  const [pendingAudioUri, setPendingAudioUri] = useState<string | null>(null)
  const finalTranscriptRef = useRef('')
  const sessionIdRef = useRef<string>('')

  const isWeeklyLimitReached: boolean = !!history && history.attemptsUsed >= history.weeklyLimit

  useEffect(() => {
    // Check if mobile device
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      setIsMobile(isMobileDevice)

      // Check if in WebView
      const isInWebView = typeof (window as any).ReactNativeWebView !== 'undefined'
      setIsWebView(isInWebView)

      // Show help modal on mobile first visit
      if (isMobileDevice && !localStorage.getItem('mobileHelpShown') && !isInWebView) {
        setTimeout(() => {
          setShowMobileHelp(true)
        }, 1000)
      }

      // For WebView, set up message handler
      if (isInWebView) {
        console.log('Running in WebView environment');
        // Set up handler for native audio ready
        (window as any).onNativeAudioReady = handleNativeAudioReady
      }
    }

    checkMobile()

    // Cleanup on unmount
    return () => {
      stopAllMedia()
      if (isWebView) {
        (window as any).onNativeAudioReady = null
      }
    }
  }, [])

  // Handle audio URI from native (WebView)
  const handleNativeAudioReady = (audioUri: string) => {
    const currentSession = sessionIdRef.current

    if (!currentSession) return

    // ❌ stale callback → ignore
    if (currentSession !== sessionIdRef.current) {
      console.warn('Stale native audio ignored')
      return
    }

    if (finalTranscriptRef.current.trim()) {
      submitAudioToBackend(audioUri, finalTranscriptRef.current)
    } else {
      setPendingAudioUri(audioUri)
      setShowManualInput(true)
    }
  }


  const stopAllMedia = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
        recognitionRef.current.onend = null
      } catch (e) {
        console.log('Speech recognition cleanup:', e)
      }
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }

    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop())
      audioStreamRef.current = null
    }

    if (audioContext) {
      audioContext.close()
    }
  }

  useEffect(() => {
    if (token) {
      fetchJamHistory()
    }

    return () => {
      stopAllMedia()
    }
  }, [token])

  const fetchJamHistory = async () => {
    if (!token) return

    try {
      setLoadingHistory(true)

      const res = await fetch(`${baseURL}/api/just-a-minute/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) throw new Error('History fetch failed')

      const data = await res.json()

      setHistory(data)
    } catch (err) {
      console.error('JAM history error', err)
    } finally {
      setLoadingHistory(false)
    }
  }

  // ⭐ Fetch speaking topic
  const fetchPrompt = async () => {
    const res = await fetch(`${baseURL}/speaking/prompt`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()

    // 🆕 NEW SESSION
    sessionIdRef.current = crypto.randomUUID()

    // 🧹 clear stale refs
    finalTranscriptRef.current = ''
    audioChunks.current = []

    setPrompt(data)
  }


  // ⭐ User clicks Start → Load topic only
  const beginPractice = async () => {
    setShowPrompt(true)
    setLoadingPrompt(true)
    await fetchPrompt()
    setLoadingPrompt(false)
  }

  const fetchSampleAnswer = async (question: string) => {
    try {
      const res = await fetch(`${baseURL}/speaking/sampleAnswer?prompt=${encodeURIComponent(question)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setSampleAnswer(data.sampleAnswer)
    } catch (err) {
      console.error('Error fetching sample answer:', err)
    }
  }

  const checkMediaRecorderSupport = (): boolean => {
    return typeof MediaRecorder !== 'undefined' &&
      typeof MediaRecorder.isTypeSupported === 'function' &&
      MediaRecorder.isTypeSupported('audio/webm')
  }

  const getSupportedMimeType = (): string | null => {
    const types = [
      'audio/webm',
      'audio/webm;codecs=opus',
      'audio/mp4',
      'audio/mp4;codecs=opus',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/wav',
      'audio/mpeg'
    ]

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type
      }
    }
    return 'audio/webm' // Fallback
  }

  const startRecording = async () => {
    setRecordingError('')
    setTranscript('')
    setManualTranscript('')
    setFeedback(null)
    setSampleAnswer('')
    setRecordingTime(0)
    setTimeUp(false)
    setShowManualInput(false)
    setPendingAudioUri(null)

    if (prompt) fetchSampleAnswer(prompt.text)

    // 🔴 WEBVIEW MODE: Use native recording
    if (isWebView) {
      console.log('Using native recording via WebView')

      // Send message to React Native to start recording
      if ((window as any).ReactNativeWebView) {
        (window as any).ReactNativeWebView.postMessage(
          JSON.stringify({
            type: "START_AUDIO",
            promptId: prompt?._id || '',
            userId: user?.id || ''
          })
        )
      }

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev + 1 >= maxDuration) {
            clearInterval(timerRef.current!)
            setTimeUp(true)
            stopRecording()
            return maxDuration
          }
          return prev + 1
        })
      }, 1000)

      setRecording(true)
      return
    }

    // 🔵 BROWSER MODE: Use Web APIs
    try {
      // Request microphone permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })
      audioStreamRef.current = stream

      // Check MediaRecorder support
      if (!checkMediaRecorderSupport()) {
        if (isMobile) {
          setRecordingError('Media recording not fully supported on your mobile browser. Try using Chrome or Firefox on Android, or Safari on iOS.')
          setShowMobileHelp(true)
          return
        } else {
          setRecordingError('Your browser does not support audio recording. Please try Chrome, Firefox, or Edge.')
          return
        }
      }

      const mimeType = getSupportedMimeType()

      // Create MediaRecorder with options for better mobile compatibility
      const options = mimeType ? { mimeType } : {}
      mediaRecorderRef.current = new MediaRecorder(stream, options)
      audioChunks.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunks.current.push(event.data)
      }

      mediaRecorderRef.current.onerror = (event) => {
        console.error('MediaRecorder error:', event)
        setRecordingError('Recording error occurred. Please try again.')
        stopRecording()
      }

      // Start recording with timeslice for better mobile performance
      mediaRecorderRef.current.start(1000)
      setRecording(true)

      // Timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev + 1 >= maxDuration) {
            clearInterval(timerRef.current!)
            setTimeUp(true)
            stopRecording()
            return maxDuration
          }
          return prev + 1
        })
      }, 1000)

      // Speech recognition with fallback (disable for mobile WebView)
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

      if (SpeechRecognition && !isWebView) {
        try {
          recognitionRef.current = new SpeechRecognition()
          recognitionRef.current.continuous = true
          recognitionRef.current.interimResults = true
          recognitionRef.current.lang = 'en-US'
          recognitionRef.current.maxAlternatives = 1

          // For iOS/Safari compatibility
          if (isMobile) {
            recognitionRef.current.interimResults = false
          }

          let finalTranscript = ''
          recognitionRef.current.onresult = (event: any) => {
            let finalTranscript = finalTranscriptRef.current
            let interimTranscript = ''

            for (let i = event.resultIndex; i < event.results.length; i++) {
              const chunk = event.results[i][0].transcript
              if (event.results[i].isFinal) {
                finalTranscript += ' ' + chunk
              } else {
                interimTranscript += chunk
              }
            }

            finalTranscriptRef.current = finalTranscript.trim()
            setTranscript((finalTranscript + ' ' + interimTranscript).trim())
          }


          recognitionRef.current.onerror = (event: any) => {
            console.log('Speech recognition error:', event.error)
            // Don't show error for common mobile issues
            if (event.error !== 'no-speech' && event.error !== 'aborted') {
              setRecordingError(`Speech recognition error: ${event.error}`)
            }
          }

          recognitionRef.current.onend = () => {
            if (recording) {
              // Restart recognition if still recording (for continuous mode)
              try {
                recognitionRef.current.start()
              } catch (e) {
                console.log('Speech recognition restart failed:', e)
              }
            }
          }

          recognitionRef.current.start()
        } catch (error) {
          console.log('Speech recognition initialization failed:', error)
        }
      } else if (!isWebView) {
        console.log('Speech Recognition API not supported')
      }

    } catch (error) {
      console.error('Error accessing microphone:', error)
      setRecordingError('Could not access microphone. Please check permissions and try again.')
      setRecording(false)
    }
  }

  const stopRecording = async () => {
    if (timerRef.current) clearInterval(timerRef.current)

    setRecording(false)

    // 🔴 WEBVIEW MODE: Stop native recording
    if (isWebView) {
      console.log('Stopping native recording via WebView')

      // Send message to React Native to stop recording
      if ((window as any).ReactNativeWebView) {
        (window as any).ReactNativeWebView.postMessage(
          JSON.stringify({ type: "STOP_AUDIO" })
        )
      }

      // Stop speech recognition if it was running
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          console.log('Error stopping recognition:', e)
        }
      }

      return
    }

    // 🔵 BROWSER MODE: Stop web recording
    // Stop speech recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (e) {
        console.log('Error stopping recognition:', e)
      }
    }

    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      return new Promise<void>((resolve) => {
        mediaRecorderRef.current!.onstop = () => {
          // ⏳ Allow speech recognition to flush final transcript
          setTimeout(async () => {
            await processAudioRecording()
            resolve()
          }, 500) // 300–500ms is ideal
        }
        mediaRecorderRef.current!.stop()

      })
    } else {
      await processAudioRecording()
    }
  }

  const processAudioRecording = async () => {
    const currentSession = sessionIdRef.current

    if (audioChunks.current.length === 0) {
      setLoading(false)
      return
    }

    const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm'
    const audioBlob = new Blob(audioChunks.current, { type: mimeType })

    // ❌ If session changed → DO NOTHING
    if (currentSession !== sessionIdRef.current) {
      console.warn('Stale recording ignored')
      return
    }

    await submitAudioToBackend(audioBlob, finalTranscriptRef.current)
  }


  const submitAudioToBackend = async (audioData: Blob | string, transcriptText: string) => {

    // 🚨 HARD VALIDATION
    if (!prompt?._id) {
      setRecordingError('Speaking topic missing. Please retry.')
      return
    }

    if (!user?.id) {
      setRecordingError('User session expired. Please login again.')
      return
    }

    if (!transcriptText?.trim()) {
      // ⛔ DO NOT AUTO SUBMIT
      setShowManualInput(true)
      setLoading(false)
      return
    }
    setLoading(true)

    try {
      const formData = new FormData()

      // Handle both Blob (browser) and string URI (native) audio data
      if (audioData instanceof Blob) {
        formData.append('audio', audioData, `speech.webm`)
      } else if (typeof audioData === 'string') {
        // For native audio URI, fetch and convert to blob
        const response = await fetch(audioData)
        const audioBlob = await response.blob()
        formData.append('audio', audioBlob, 'speech.mp3')
      }

      formData.append('studentId', user?.id || '')
      formData.append('promptId', prompt?._id || '')
      formData.append('transcript', transcriptText || '')

      const res = await fetch(`${baseURL}/speaking/submit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Submission failed: ${errorText}`)
      }

      const data = await res.json()

      setFeedback({
        correctedTranscript: data.correctedTranscript,
        grammar: data.feedback.grammar,
        fluency: data.feedback.fluency,
        vocabulary: data.feedback.vocabulary,
        pronunciation: data.feedback.pronunciation,
        recommendations: data.feedback.recommendations,
        score: data.score,
        studentAudioUrl: data.studentAudioUrl,
        correctedAudioUrl: data.correctedAudioUrl,
      })

      // Clear pending state
      setPendingAudioUri(null)
      setShowManualInput(false)
    } catch (error) {
      console.error('Error submitting speech:', error)
      setRecordingError(error instanceof Error ? error.message : 'Failed to submit recording. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleManualSubmit = () => {
    if (!pendingAudioUri) {
      setRecordingError('No audio recording found')
      return
    }

    if (!manualTranscript.trim()) {
      setRecordingError('Please enter what you said during recording')
      return
    }

    submitAudioToBackend(pendingAudioUri, manualTranscript)
  }

  const resetPractice = async () => {
    stopAllMedia()

    // ❌ invalidate previous session immediately
    sessionIdRef.current = ''

    setTranscript('')
    setManualTranscript('')
    setFeedback(null)
    setSampleAnswer('')
    setRecordingTime(0)
    setRecordingError('')
    setShowManualInput(false)
    setPendingAudioUri(null)

    setLoadingPrompt(true)
    setPrompt(null)

    try {
      await fetchPrompt()
    } finally {
      setLoadingPrompt(false)
    }
  }

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const getScoreVariant = (score: number) => (score >= 8 ? 'success' : score >= 6 ? 'warning' : 'danger')

  const getScoreFeedback = (score: number) =>
    score >= 9 ? 'Excellent!' : score >= 8 ? 'Very Good!' : score >= 7 ? 'Good!' : score >= 6 ? 'Fair' : 'Needs Improvement'

  const closeMobileHelp = () => {
    setShowMobileHelp(false)
    localStorage.setItem('mobileHelpShown', 'true')
  }

  return (
    <Container fluid className="speaking-practice-container">
      {/* Mobile Help Modal */}
      <Modal show={showMobileHelp} onHide={closeMobileHelp} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaMobileAlt className="me-2" />
            Mobile Recording Tips
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mobile-tips">
            <h6>For best recording experience on mobile:</h6>
            <ul>
              <li>📱 <strong>Use Chrome or Firefox on Android</strong></li>
              <li>🍏 <strong>Use Safari on iOS</strong></li>
              <li>🎤 <strong>Hold phone close to mouth</strong> (10-15 cm)</li>
              <li>🔇 <strong>Find a quiet environment</strong></li>
              <li>📶 <strong>Ensure stable internet connection</strong></li>
              <li>✅ <strong>Allow microphone permissions</strong> when prompted</li>
            </ul>
            {isWebView && (
              <Alert variant="info" className="mt-2">
                <strong>App Mode:</strong> You're using the Eklav.in mobile app.
                Audio recording uses native device capabilities.
              </Alert>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={closeMobileHelp}>
            Got it!
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Manual Transcript Modal for WebView */}
      <Modal show={showManualInput} onHide={() => setShowManualInput(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaKeyboard className="me-2" />
            Enter Your Speech
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Please type what you said during your recording:</p>
          <Form.Group>
            <Form.Control
              as="textarea"
              rows={4}
              value={manualTranscript}
              onChange={(e) => setManualTranscript(e.target.value)}
              placeholder="Type your speech here..."
            />
          </Form.Group>
          <small className="text-muted">
            This helps our AI provide accurate feedback on your pronunciation and grammar.
          </small>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowManualInput(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleManualSubmit}>
            Submit for Analysis
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ⭐ START SCREEN */}
      {!showPrompt && (
        <div className="start-screen-container">
          <Card className="start-screen-card">
            <div className="welcome-icon">🎤</div>

            <h2 className="welcome-title">Speaking Practice</h2>

            <p className="welcome-description">
              Test your speaking skills with AI-powered evaluation.
              {isWebView ? (
                <span className="mobile-note">
                  <br />
                  <small className="text-info">
                    <FaMobileAlt /> Using mobile app recording
                  </small>
                </span>
              ) : isMobile ? (
                <span className="mobile-note">
                  <br />
                  <small className="text-muted">
                    <FaMobileAlt /> Mobile browser recording
                  </small>
                </span>
              ) : null}
            </p>

            <Button
              className="start-button"
              onClick={beginPractice}
              disabled={isWeeklyLimitReached}>
              <FaPlay className="me-2" /> Start Speaking Practice
            </Button>

            {isWeeklyLimitReached && (
              <Alert variant="warning" className="mt-3">
                Weekly limit reached. Try again next week!
              </Alert>
            )}

            {history && (
              <Card className="history-card">
                <Card.Body className="history-card-body">
                  <div className="history-stats">
                    <div className="stat-item">
                      <h6 className="stat-label">🕒 Weekly Attempts</h6>
                      <small className="stat-value">
                        {history.attemptsUsed} / {history.weeklyLimit} used
                      </small>
                    </div>

                    <div className="stat-item best-score">
                      <h6 className="stat-label">⭐ Best Score</h6>
                      <div className="score-value">{history.summary.bestScore ?? '--'} / 10</div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            )}
          </Card>
        </div>
      )}

      {/* ⭐ SPINNER WHILE LOADING TOPIC */}
      {showPrompt && loadingPrompt && (
        <div className="loading-screen">
          <Spinner animation="border" variant="primary" />
          <p className="loading-text">Loading your speaking topic...</p>
        </div>
      )}

      {/* ⭐ MAIN UI */}
      {showPrompt && !loadingPrompt && prompt && (
        <Card className="main-practice-card">
          <div className="practice-header">
            <h4 className="practice-title">
              <FaMicrophone /> Speaking Challenge
            </h4>
            <div className="d-flex align-items-center gap-2">
              {isWebView && (
                <Badge bg="info" className="app-badge">
                  App Mode
                </Badge>
              )}
              <Badge bg={recording ? 'danger' : 'success'} className="status-badge">
                {recording ? 'Recording...' : 'Ready'}
              </Badge>
            </div>
          </div>

          <div className="practice-content">
            <div className="topic-section">
              <div className="topic-card">
                <h5 className="topic-title">🎯 Your Topic</h5>
                <p className="topic-text">{prompt.text}</p>
              </div>

              <div className="recording-controls">
                {!recording ? (
                  <Button
                    variant="primary"
                    className="record-button"
                    onClick={startRecording}
                    disabled={isWeeklyLimitReached}
                  >
                    <FaMicrophone className="me-2" />
                    {isWebView ? 'Start App Recording' : 'Start Speaking'}
                  </Button>
                ) : (
                  <Button variant="danger" className="stop-button" onClick={stopRecording}>
                    <FaStop className="me-2" /> Stop Recording
                  </Button>
                )}

                {recording && (
                  <Badge bg={recordingTime > maxDuration - 10 ? 'warning' : 'danger'} className="timer-badge">
                    ⏱ {formatTime(recordingTime)} / {formatTime(maxDuration)}
                  </Badge>
                )}

                {recordingError && (
                  <Alert variant="danger" className="mt-2 small p-2">
                    <FaExclamationTriangle className="me-1" />
                    {recordingError}
                  </Alert>
                )}
              </div>

              {isWebView && !recording && (
                <Alert variant="info" className="mt-2 small p-2">
                  <FaMobileAlt className="me-1" />
                  <strong>App Recording:</strong> Uses your device's microphone for best quality.
                </Alert>
              )}

              {!isWebView && isMobile && !recording && (
                <Alert variant="info" className="mt-2 small p-2">
                  <FaMobileAlt className="me-1" />
                  <strong>Mobile Browser:</strong> Hold phone close for best results.
                </Alert>
              )}
            </div>

            <div className="transcript-section">
              <div className="transcript-card">
                <h6 className="transcript-title">
                  {isWebView ? '📝 Your Speech' : '🎙️ Live Transcript'}
                </h6>
                <div className="transcript-content">
                  {isWebView ? (
                    <>
                      {transcript || 'Speech-to-text not available in app mode.'}
                      {showManualInput && (
                        <div className="mt-3">
                          <Form.Control
                            as="textarea"
                            rows={3}
                            value={manualTranscript}
                            onChange={(e) => setManualTranscript(e.target.value)}
                            placeholder="Type what you said here..."
                          />
                          <Button
                            variant="primary"
                            size="sm"
                            className="mt-2"
                            onClick={handleManualSubmit}
                            disabled={!manualTranscript.trim()}
                          >
                            Submit Transcript
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    transcript || 'Start speaking to see your transcript...'
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* FEEDBACK SECTION */}
          <div className="feedback-section">
            <h4 className="feedback-title">
              <FaLightbulb /> AI Feedback
            </h4>

            {loading && (
              <div className="loading-feedback">
                <Spinner animation="border" variant="success" />
                <p className="loading-feedback-text">
                  {isWebView ? 'Processing your recording...' : 'Analyzing your speech...'}
                </p>
              </div>
            )}

            {feedback && !loading && (
              <>
                <div className="score-display">
                  <h5>Your Score</h5>
                  <div className="score-number">{feedback.score}/10</div>
                  <div className="score-feedback">{getScoreFeedback(feedback.score)}</div>
                  <ProgressBar
                    now={feedback.score * 10}
                    variant={getScoreVariant(feedback.score)}
                    className="score-progress"
                  />
                </div>

                {sampleAnswer && (
                  <Alert variant="success" className="sample-answer-alert">
                    <h6 className="alert-title">
                      <FaStar className="me-2" /> Model Answer
                    </h6>
                    {sampleAnswer}
                  </Alert>
                )}

                <Alert variant="info" className="corrected-transcript-alert">
                  <h6 className="alert-title">
                    <FaCheckCircle className="me-2" /> Corrected Transcript
                  </h6>
                  {feedback.correctedTranscript}
                </Alert>

                {feedback.studentAudioUrl && (
                  <Alert variant="secondary" className="audio-alert">
                    <strong>🎧 Your Original Audio</strong>
                    <audio controls className="audio-player" preload="metadata">
                      <source src={feedback.studentAudioUrl} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  </Alert>
                )}

                {feedback.correctedAudioUrl && (
                  <Alert variant="success" className="audio-alert">
                    <strong>🗣️ AI Corrected Pronunciation</strong>
                    <audio controls className="audio-player" preload="metadata">
                      <source src={feedback.correctedAudioUrl} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  </Alert>
                )}

                <div className="feedback-grid">
                  <div className="feedback-item grammar">
                    <strong>📚 Grammar:</strong> {feedback.grammar}
                  </div>

                  <div className="feedback-item fluency">
                    <strong>🔄 Fluency:</strong> {feedback.fluency}
                  </div>

                  <div className="feedback-item vocabulary">
                    <strong>💎 Vocabulary:</strong> {feedback.vocabulary}
                  </div>

                  <div className="feedback-item pronunciation">
                    <strong>🔊 Pronunciation:</strong> {feedback.pronunciation}
                  </div>
                </div>

                <Alert variant="warning" className="recommendations-alert">
                  <FaLightbulb className="me-2" />
                  <strong>Recommendations:</strong> {feedback.recommendations}
                </Alert>

                <div className="reset-button-container">
                  <Button variant="outline-primary" onClick={resetPractice} className="reset-button">
                    <FaRedo className="me-2" /> Try Another Topic
                  </Button>
                </div>
              </>
            )}
          </div>
        </Card>
      )}

      <style>{`
        .speaking-practice-container {
          padding: 1rem !important;
        }
        
        .app-badge {
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
        }
        
        /* Mobile Tips */
        .mobile-tips ul {
          padding-left: 1.5rem;
        }
        
        .mobile-tips li {
          margin-bottom: 0.5rem;
        }
        
        .mobile-note {
          display: block;
          margin-top: 0.5rem;
        }
        
        /* Start Screen */
        .start-screen-container {
          display: flex;
          justify-content: center;
          margin-top: 2rem;
        }
        
        .start-screen-card {
          max-width: 650px;
          background: #ffffff;
          border-radius: 24px;
          padding: 2rem;
          text-align: center;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          border: none;
          width: 100%;
        }
        
        .welcome-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }
        
        .welcome-title {
          font-weight: bold;
          color: #1a3353;
          margin-bottom: 1rem;
          font-size: 1.75rem;
        }
        
        .welcome-description {
          color: #4a5568;
          line-height: 1.6;
          margin-bottom: 1.5rem;
          font-size: 1rem;
        }
        
        .start-button {
          border-radius: 12px;
          background: #006ADC;
          border: none;
          padding: 0.75rem 2rem;
          font-weight: 600;
          font-size: 1rem;
          width: 100%;
        }
        
        .start-button:hover:not(:disabled) {
          background: #0056b3;
          transform: translateY(-2px);
          transition: all 0.3s ease;
        }
        
        .start-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .history-card {
          margin-top: 1.5rem;
          border: none;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          border-radius: 12px;
        }
        
        .history-card-body {
          padding: 1rem;
        }
        
        .history-stats {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }
        
        .stat-item {
          flex: 1;
          min-width: 120px;
        }
        
        .best-score {
          text-align: right;
        }
        
        .stat-label {
          margin-bottom: 0.25rem;
          font-size: 0.875rem;
          color: #4a5568;
        }
        
        .stat-value {
          color: #4a5568;
        }
        
        .score-value {
          font-size: 1.25rem;
          font-weight: bold;
          color: #28a745;
        }
        
        /* Loading Screen */
        .loading-screen {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 70vh;
        }
        
        .loading-text {
          margin-top: 1rem;
          color: #6c757d;
        }
        
        /* Main Practice Card */
        .main-practice-card {
          margin-top: 1rem;
          border: none;
          border-radius: 20px;
          padding: 1.5rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }
        
        .practice-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        
        .practice-title {
          color: #006ADC;
          font-weight: bold;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.25rem;
        }
        
        .status-badge {
          font-size: 0.875rem;
          padding: 0.5rem 1rem;
          border-radius: 20px;
        }
        
        .practice-content {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        @media (min-width: 992px) {
          .practice-content {
            flex-direction: row;
          }
          
          .topic-section,
          .transcript-section {
            flex: 1;
          }
        }
        
        .topic-card {
          padding: 1.5rem;
          border-radius: 16px;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-left: 5px solid #006ADC;
          margin-bottom: 1.5rem;
        }
        
        .topic-title {
          color: #006ADC;
          font-weight: bold;
          margin-bottom: 1rem;
          font-size: 1.1rem;
        }
        
        .topic-text {
          font-size: 1.05rem;
          line-height: 1.6;
          color: #212529;
          margin: 0;
        }
        
        .recording-controls {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          align-items: flex-start;
        }
        
        @media (min-width: 576px) {
          .recording-controls {
            flex-direction: row;
            align-items: center;
          }
        }
        
        .record-button,
        .stop-button {
          border-radius: 50px;
          padding: 0.75rem 1.5rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 180px;
        }
        
        .record-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .timer-badge {
          font-size: 1rem;
          padding: 0.5rem 1rem;
          border-radius: 20px;
        }
        
        .transcript-card {
          border: 1px solid #dee2e6;
          border-radius: 12px;
          padding: 1.5rem;
          background: white;
          height: 100%;
          min-height: 220px;
          max-height: 280px;
          display: flex;
          flex-direction: column;
        }
        
        .transcript-title {
          color: #006ADC;
          font-weight: bold;
          margin-bottom: 1rem;
          font-size: 1.1rem;
        }
        
        .transcript-content {
          flex: 1;
          overflow-y: auto;
          line-height: 1.6;
          color: #212529;
          font-size: 0.95rem;
        }
        
        /* Feedback Section */
        .feedback-section {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid #dee2e6;
        }
        
        .feedback-title {
          color: #28a745;
          font-weight: bold;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.25rem;
        }
        
        .loading-feedback {
          text-align: center;
          padding: 2rem;
        }
        
        .loading-feedback-text {
          margin-top: 1rem;
          color: #6c757d;
        }
        
        .score-display {
          text-align: center;
          margin-bottom: 2rem;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          padding: 1.5rem;
          border-radius: 16px;
        }
        
        .score-display h5 {
          color: #212529;
          margin-bottom: 0.5rem;
        }
        
        .score-number {
          font-size: 3rem;
          font-weight: bold;
          color: #006ADC;
          margin: 0.5rem 0;
        }
        
        .score-feedback {
          color: #6c757d;
          margin-bottom: 1rem;
          font-size: 1.1rem;
        }
        
        .score-progress {
          height: 10px;
          border-radius: 5px;
          margin-top: 1rem;
        }
        
        .alert-title {
          font-size: 1rem;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
        }
        
        .sample-answer-alert,
        .corrected-transcript-alert,
        .recommendations-alert {
          border-radius: 12px;
          border: none;
          margin-bottom: 1rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        
        .audio-alert {
          border-radius: 12px;
          border: none;
          margin-bottom: 1rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        
        .audio-player {
          width: 100%;
          margin-top: 0.5rem;
        }
        
        .feedback-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
          margin: 1.5rem 0;
        }
        
        @media (min-width: 768px) {
          .feedback-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        .feedback-item {
          padding: 1rem;
          border-radius: 10px;
          background: white;
          border-left: 4px solid;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        
        .grammar {
          border-left-color: #006ADC;
        }
        
        .fluency {
          border-left-color: #28a745;
        }
        
        .vocabulary {
          border-left-color: #ffc107;
        }
        
        .pronunciation {
          border-left-color: #dc3545;
        }
        
        .reset-button-container {
          text-align: center;
          margin-top: 2rem;
        }
        
        .reset-button {
          border-radius: 25px;
          padding: 0.75rem 2rem;
          font-weight: 600;
        }
        
        /* Mobile Responsive */
        @media (max-width: 768px) {
          .speaking-practice-container {
            padding: 0.75rem !important;
          }
          
          .start-screen-card {
            padding: 1.5rem;
            margin: 0 0.5rem;
          }
          
          .welcome-title {
            font-size: 1.5rem;
          }
          
          .main-practice-card {
            padding: 1rem;
            margin: 0.5rem;
          }
          
          .practice-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }
          
          .status-badge {
            align-self: flex-start;
          }
          
          .record-button,
          .stop-button {
            width: 100%;
            min-width: unset;
          }
          
          .topic-text {
            font-size: 1rem;
          }
          
          .score-number {
            font-size: 2.5rem;
          }
          
          .feedback-item strong {
            display: block;
            margin-bottom: 0.25rem;
          }
          
          .audio-player {
            height: 40px;
          }
        }
        
        @media (max-width: 576px) {
          .welcome-title {
            font-size: 1.4rem;
          }
          
          .practice-title,
          .feedback-title {
            font-size: 1.1rem;
          }
          
          .history-stats {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          
          .best-score {
            text-align: left;
          }
          
          .stat-item {
            width: 100%;
          }
          
          .score-number {
            font-size: 2rem;
          }
          
          .audio-player {
            height: 36px;
          }
          
          .reset-button {
            width: 100%;
          }
        }
        
        @media (max-width: 400px) {
          .start-screen-card {
            padding: 1rem;
          }
          
          .welcome-icon {
            font-size: 2.5rem;
          }
          
          .main-practice-card {
            padding: 0.75rem;
          }
          
          .topic-card,
          .transcript-card {
            padding: 1rem;
          }
          
          .score-display {
            padding: 1rem;
          }
          
          .score-number {
            font-size: 1.75rem;
          }
        }
        
        /* Touch device optimizations */
        @media (hover: none) and (pointer: coarse) {
          .record-button,
          .stop-button,
          .reset-button,
          .start-button {
            min-height: 48px;
            padding: 0.875rem 1.5rem;
          }
          
          .audio-player {
            height: 44px;
          }
          
          .transcript-content {
            font-size: 1rem;
            line-height: 1.8;
          }
        }
      `}</style>
    </Container>
  )
}

export default SpeakingPractice