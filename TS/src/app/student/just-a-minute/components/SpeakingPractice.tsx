import React, { useEffect, useRef, useState } from 'react'
import { Button, Card, Container, Row, Col, Spinner, Badge, ProgressBar, Alert, Modal, Form } from 'react-bootstrap'
import { useAuthContext } from '@/context/useAuthContext'
import { FaMicrophone, FaStop, FaStar, FaLightbulb, FaCheckCircle, FaRedo, FaPlay, FaExclamationTriangle, FaMobileAlt, FaKeyboard, FaArrowLeft } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'

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
  monthlyLimit: number
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
  const navigate = useNavigate()
  const status = user?.status?.toLowerCase()
  const TRIAL_LIMIT = 5
  const isTrialUser = status === 'pending'
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
  const [loadingNewTopic, setLoadingNewTopic] = useState(false)
  const [showMobileHelp, setShowMobileHelp] = useState(false)
  const [recordingError, setRecordingError] = useState<string>('')
  const [isMobile, setIsMobile] = useState(false)
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const [isWebView, setIsWebView] = useState(false)
  const [showManualInput, setShowManualInput] = useState(false)
  const [pendingAudioUri, setPendingAudioUri] = useState<string | null>(null)
  const [selectedAttempt, setSelectedAttempt] = useState<JamHistory['attempts'][0] | null>(null)
  const [preloadedPrompt, setPreloadedPrompt] = useState<Prompt | null>(null)
  const [loadingPreloadedPrompt, setLoadingPreloadedPrompt] = useState(false)
  const [activeTab, setActiveTab] = useState('your-answer')
  const [attemptsPage, setAttemptsPage] = useState(1)
  const finalTranscriptRef = useRef('')
  const sessionIdRef = useRef<string>('')
  const isSubmittingRef = useRef(false)
  const isStoppingRef = useRef(false)

  //const isMonthlyLimitReached: boolean = !!history && history.attemptsUsed >= history.monthlyLimit

 const maxAllowedAttempts = isTrialUser
  ? TRIAL_LIMIT
  : history?.monthlyLimit ?? 0

  const isLimitReached =
    !!history && history.attemptsUsed >= maxAllowedAttempts

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

    // âŒ stale callback â†' ignore
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
      preloadPrompt()
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

  // â­ Fetch speaking topic (for recording session)
  const fetchPrompt = async () => {
    const res = await fetch(`${baseURL}/speaking/prompt`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()

    sessionIdRef.current = crypto.randomUUID()
    isSubmittingRef.current = false
    isStoppingRef.current = false
    finalTranscriptRef.current = ''
    audioChunks.current = []

    setPrompt(data)
  }

  // Pre-load a topic for display on the start screen
  const preloadPrompt = async () => {
    if (!token) return
    try {
      setLoadingPreloadedPrompt(true)
      const res = await fetch(`${baseURL}/speaking/prompt`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setPreloadedPrompt(data)
    } catch (err) {
      console.error('preloadPrompt error', err)
    } finally {
      setLoadingPreloadedPrompt(false)
    }
  }

  // â­ User clicks Start Speaking â€" use preloaded prompt if available
  const beginPractice = async () => {
    setShowPrompt(true)
    if (preloadedPrompt) {
      sessionIdRef.current = crypto.randomUUID()
      isSubmittingRef.current = false
      isStoppingRef.current = false
      finalTranscriptRef.current = ''
      audioChunks.current = []
      setPrompt(preloadedPrompt)
    } else {
      setLoadingPrompt(true)
      await fetchPrompt()
      setLoadingPrompt(false)
    }
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

    // ðŸ"´ WEBVIEW MODE: Use native recording
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

    // ðŸ"µ BROWSER MODE: Use Web APIs
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
    if (isStoppingRef.current) return
    isStoppingRef.current = true

    if (timerRef.current) clearInterval(timerRef.current)

    setRecording(false)

    // ðŸ"´ WEBVIEW MODE: Stop native recording
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

    // ðŸ"µ BROWSER MODE: Stop web recording
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
          // â³ Allow speech recognition to flush final transcript
          setTimeout(async () => {
            await processAudioRecording()
            resolve()
          }, 500) // 300â€"500ms is ideal
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

    // âŒ If session changed â†' DO NOTHING
    if (currentSession !== sessionIdRef.current) {
      console.warn('Stale recording ignored')
      return
    }

    await submitAudioToBackend(audioBlob, finalTranscriptRef.current)
  }


  const submitAudioToBackend = async (audioData: Blob | string, transcriptText: string) => {

    if (isSubmittingRef.current) return
    isSubmittingRef.current = true

    // ðŸš¨ HARD VALIDATION
    if (!prompt?._id) {
      setRecordingError('Speaking topic missing. Please retry.')
      return
    }

    if (!user?.id) {
      setRecordingError('User session expired. Please login again.')
      return
    }

    if (!transcriptText?.trim()) {
      // â›" DO NOT AUTO SUBMIT
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
      formData.append('promptText', prompt?.text || '')
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

    // âŒ invalidate previous session immediately
    sessionIdRef.current = ''

    setTranscript('')
    setManualTranscript('')
    setFeedback(null)
    setSampleAnswer('')
    setRecordingTime(0)
    setRecordingError('')
    setShowManualInput(false)
    setPendingAudioUri(null)
    setActiveTab('your-answer')

    setLoadingPrompt(true)
    setPrompt(null)

    try {
      await fetchPrompt()
    } finally {
      setLoadingPrompt(false)
    }
  }

  const fetchAnotherTopic = async () => {
    if (recording) return
    stopAllMedia()
    sessionIdRef.current = ''
    finalTranscriptRef.current = ''
    audioChunks.current = []
    setTranscript('')
    setManualTranscript('')
    setFeedback(null)
    setSampleAnswer('')
    setRecordingTime(0)
    setRecordingError('')
    setShowManualInput(false)
    setPendingAudioUri(null)
    setTimeUp(false)
    setLoadingNewTopic(true)
    try {
      await fetchPrompt()
    } finally {
      setLoadingNewTopic(false)
    }
  }

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const getScoreVariant = (score: number) => (score >= 80 ? 'success' : score >= 60 ? 'warning' : 'danger')

  const getScoreFeedback = (score: number) =>
    score >= 90 ? 'Excellent!' : score >= 80 ? 'Very Good!' : score >= 70 ? 'Good!' : score >= 60 ? 'Fair' : 'Needs Improvement'

  const getAttemptFeedback = (score: number): string => {
    if (score >= 80) return 'Excellent fluency and clear expression!'
    if (score >= 60) return 'Good fluency and clear expression.'
    if (score >= 40) return 'Try to improve your vocabulary and confidence.'
    return 'Keep practicing to improve your overall performance.'
  }

  const formatAttemptDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const day = d.getDate()
    const month = d.toLocaleString('en-US', { month: 'short' })
    const year = d.getFullYear()
    const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    return { date: `${day} ${month} ${year}`, time }
  }

  const closeMobileHelp = () => {
    setShowMobileHelp(false)
    localStorage.setItem('mobileHelpShown', 'true')
  }

  const highlightFeedbackText = (text: string) => {
    if (!text) return text

    let quoteIndex = 0

    return text.split(/('.*?')/g).map((part, index) => {
      if (part.startsWith("'") && part.endsWith("'")) {
        const content = part.replace(/'/g, '')
        const isIncorrect = quoteIndex % 2 === 0
        quoteIndex++

        return (
          <span
            key={index}
            style={{
              backgroundColor: isIncorrect ? '#fee2e2' : '#dcfce7',
              color: isIncorrect ? '#991b1b' : '#065f46',
              padding: '2px 6px',
              borderRadius: '4px',
              fontWeight: 600,
              margin: '0 4px',
              display: 'inline-block',
            }}
          >
            {content}
          </span>
        )
      }

      return <span key={index}>{part}</span>
    })
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
              <li>ðŸ"± <strong>Use Chrome or Firefox on Android</strong></li>
              <li>ðŸ <strong>Use Safari on iOS</strong></li>
              <li>ðŸŽ¤ <strong>Hold phone close to mouth</strong> (10-15 cm)</li>
              <li>ðŸ"‡ <strong>Find a quiet environment</strong></li>
              <li>ðŸ"¶ <strong>Ensure stable internet connection</strong></li>
              <li>âœ… <strong>Allow microphone permissions</strong> when prompted</li>
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

      {/* â­ START SCREEN */}
      {!showPrompt && (
        <div style={{ padding: '0 0 24px' }}>
          <Row className="g-4 align-items-stretch" style={{ marginBottom: 20 }}>

            {/* â•â• LEFT COLUMN â•â• */}
            <Col lg={7} className="d-flex">

              {/* Hero header card */}
              <div style={{ position: 'relative' as const, background: 'linear-gradient(120deg,#eceaff 0%,#e8d8ff 50%,#fde8ff 100%)', borderRadius: 24, padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, overflow: 'hidden', boxShadow: '0 8px 32px rgba(108,99,255,0.12)', width: '100%' }}>
                {/* Watermark decorative circles */}
                <div style={{ position: 'absolute' as const, top: -40, right: 110, width: 160, height: 160, borderRadius: '50%', background: 'rgba(108,99,255,0.08)', pointerEvents: 'none' as const }} />
                <div style={{ position: 'absolute' as const, top: 20, right: 60, width: 100, height: 100, borderRadius: '50%', background: 'rgba(108,99,255,0.06)', pointerEvents: 'none' as const }} />
                <div style={{ position: 'absolute' as const, bottom: -30, right: 140, width: 120, height: 120, borderRadius: '50%', background: 'rgba(180,120,255,0.07)', pointerEvents: 'none' as const }} />
                <div style={{ position: 'absolute' as const, bottom: -20, left: -20, width: 90, height: 90, borderRadius: '50%', background: 'rgba(108,99,255,0.05)', pointerEvents: 'none' as const }} />

                <div style={{ flex: 1, position: 'relative' as const, zIndex: 1 }}>
                  <h2 style={{ fontWeight: 800, fontSize: '1.75rem', color: '#1a1a2e', marginBottom: 8, letterSpacing: '-0.3px' }}>
                    Just A Minute
                    {status === 'pending' && <span style={{ fontSize: '0.68rem', fontWeight: 700, background: 'rgba(255,122,0,0.15)', color: '#ff7a00', padding: '3px 10px', borderRadius: 20, border: '1px solid rgba(255,122,0,0.35)', marginLeft: 10, verticalAlign: 'middle', letterSpacing: 0 }}>Trial</span>}
                  </h2>
                  <p style={{ color: '#5a5a7a', fontSize: '0.88rem', marginBottom: 20, lineHeight: 1.65, fontWeight: 400 }}>
                    Speak on the given topic for just 60 seconds.<br />Organize your thoughts and express your ideas clearly!
                  </p>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
                    {[
                      { label: '60 Seconds', icon: <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><circle cx="12" cy="12" r="10" stroke="#6c63ff" strokeWidth="2"/><polyline points="12,6 12,12 16,14" stroke="#6c63ff" strokeWidth="2" strokeLinecap="round"/></svg>, bg: 'rgba(255,255,255,0.75)', text: '#6c63ff', border: 'rgba(108,99,255,0.2)' },
                      { label: 'AI Evaluation', icon: <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><rect x="2" y="3" width="20" height="14" rx="2" stroke="#ff7a00" strokeWidth="2"/><path d="M8 21h8M12 17v4" stroke="#ff7a00" strokeWidth="2" strokeLinecap="round"/></svg>, bg: 'rgba(255,255,255,0.75)', text: '#ff7a00', border: 'rgba(255,122,0,0.2)' },
                      { label: 'Detailed Feedback', icon: <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M18 20V10M12 20V4M6 20v-6" stroke="#16a34a" strokeWidth="2" strokeLinecap="round"/></svg>, bg: 'rgba(255,255,255,0.75)', text: '#16a34a', border: 'rgba(22,163,74,0.2)' },
                    ].map(b => (
                      <span key={b.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: b.bg, color: b.text, fontSize: '0.78rem', fontWeight: 600, padding: '5px 14px', borderRadius: 20, border: `1px solid ${b.border}`, backdropFilter: 'blur(4px)' }}>
                        {b.icon}{b.label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Mic graphic */}
                <div style={{ flexShrink: 0, position: 'relative' as const, zIndex: 1 }}>
                  <svg viewBox="0 0 110 140" width="110" height="140" fill="none">
                    <defs>
                      <linearGradient id="micGrad" x1="30" y1="10" x2="80" y2="90" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#a393f5"/>
                        <stop offset="1" stopColor="#5c4fcf"/>
                      </linearGradient>
                      <linearGradient id="micShine" x1="38" y1="14" x2="55" y2="50" gradientUnits="userSpaceOnUse">
                        <stop stopColor="rgba(255,255,255,0.45)"/>
                        <stop offset="1" stopColor="rgba(255,255,255,0)"/>
                      </linearGradient>
                      <filter id="micShadow" x="-30%" y="-10%" width="160%" height="140%">
                        <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#6c63ff" floodOpacity="0.35"/>
                      </filter>
                    </defs>
                    {/* Glow ring */}
                    <ellipse cx="55" cy="132" rx="28" ry="6" fill="rgba(108,99,255,0.18)"/>
                    {/* Mic body */}
                    <rect x="32" y="10" width="46" height="72" rx="23" fill="url(#micGrad)" filter="url(#micShadow)"/>
                    {/* Shine */}
                    <rect x="38" y="14" width="14" height="36" rx="7" fill="url(#micShine)"/>
                    {/* Grille lines */}
                    <line x1="42" y1="30" x2="68" y2="30" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="40" y1="38" x2="70" y2="38" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="40" y1="46" x2="70" y2="46" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="42" y1="54" x2="68" y2="54" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round"/>
                    {/* Stand arc */}
                    <path d="M22 60c0 18.2 14.8 33 33 33s33-14.8 33-33" stroke="#7c6fd4" strokeWidth="4" strokeLinecap="round"/>
                    {/* Stand pole */}
                    <line x1="55" y1="93" x2="55" y2="114" stroke="#7c6fd4" strokeWidth="4" strokeLinecap="round"/>
                    {/* Base */}
                    <line x1="38" y1="114" x2="72" y2="114" stroke="#7c6fd4" strokeWidth="4" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>

            </Col>

            {/* RIGHT: Performance — same row as hero, matches height */}
            <Col lg={5} className="d-flex">
              {history && history.summary.latestScore !== null && (
                <div style={{ background: '#ffffff', borderRadius: 18, padding: '20px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.07)', width: '100%' }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1a1a2e', marginBottom: 16 }}>Your Latest Performance</div>
                  <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' as const }}>
                    <div style={{ position: 'relative' as const, flexShrink: 0 }}>
                      {(() => {
                        const score = history.summary.latestScore ?? 0
                        const r = 54, circ = 2 * Math.PI * r
                        const dash = (score / 100) * circ
                        return (
                          <svg width="130" height="130" viewBox="0 0 130 130">
                            <circle cx="65" cy="65" r={r} fill="none" stroke="#f0f0f0" strokeWidth="10"/>
                            <circle cx="65" cy="65" r={r} fill="none" stroke="#ff7a00" strokeWidth="10" strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset="0" strokeLinecap="round" transform="rotate(-90 65 65)"/>
                            <text x="65" y="60" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 22, fontWeight: 800, fill: '#1a1a2e' }}>{score}</text>
                            <text x="65" y="78" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 11, fill: '#9ca3af' }}>/100</text>
                          </svg>
                        )
                      })()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#1a1a2e', marginBottom: 4 }}>
                        {(history.summary.latestScore ?? 0) >= 80 ? 'Great Job!' : (history.summary.latestScore ?? 0) >= 60 ? 'Good Work!' : 'Keep Going!'}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#6c757d', lineHeight: 1.4 }}>Keep practicing to achieve perfection.</div>
                      <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                        <div style={{ background: '#fff7ed', borderRadius: 10, padding: '6px 12px', textAlign: 'center' as const }}>
                          <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginBottom: 1 }}>Best Score</div>
                          <div style={{ fontWeight: 700, color: '#ff7a00', fontSize: '0.95rem' }}>{history.summary.bestScore ?? '--'}/100</div>
                        </div>
                        <div style={{ background: '#f0efff', borderRadius: 10, padding: '6px 12px', textAlign: 'center' as const }}>
                          <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginBottom: 1 }}>Attempts</div>
                          <div style={{ fontWeight: 700, color: '#6c63ff', fontSize: '0.95rem' }}>{history.attemptsUsed}/{history.monthlyLimit}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Col>
          </Row>

          <Row className="g-4">
            <Col lg={7}>

              {/* Start Speaking card */}
              <div style={{ background: '#ffffff', borderRadius: 18, padding: '28px 28px 24px', marginBottom: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>

                {/* Title */}
                <div style={{ fontWeight: 700, color: '#1a1a2e', fontSize: '1.05rem', marginBottom: 18 }}>Ready to test your speaking skills?</div>

                {/* Tips 2x2 grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 22 }}>
                  {([
                    { icon: <svg viewBox="0 0 24 24" fill="none" width="18" height="18"><path d="M12 2a7 7 0 0 1 7 7c0 2.5-1.5 5-3.5 6.5V17H8.5v-1.5C6.5 14 5 11.5 5 9a7 7 0 0 1 7-7z" stroke="#6c63ff" strokeWidth="1.5"/><line x1="8.5" y1="20" x2="15.5" y2="20" stroke="#6c63ff" strokeWidth="1.5" strokeLinecap="round"/><line x1="12" y1="17" x2="12" y2="20" stroke="#6c63ff" strokeWidth="1.5"/></svg>, bg: '#ede9fe', title: 'Plan Before You Speak', desc: 'Take 5–10 seconds to organize your thoughts.' },
                    { icon: <svg viewBox="0 0 24 24" fill="none" width="18" height="18"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15z" stroke="#16a34a" strokeWidth="1.5"/></svg>, bg: '#dcfce7', title: 'Expand Your Vocabulary', desc: 'Use varied words to express ideas better.' },
                    { icon: <svg viewBox="0 0 24 24" fill="none" width="18" height="18"><circle cx="12" cy="12" r="10" stroke="#0284c7" strokeWidth="1.5"/><polyline points="12,6 12,12 16,14" stroke="#0284c7" strokeWidth="1.5" strokeLinecap="round"/></svg>, bg: '#e0f2fe', title: 'Maintain Good Pace', desc: 'A steady pace is ideal — not too fast or slow.' },
                    { icon: <svg viewBox="0 0 24 24" fill="none" width="18" height="18"><path d="M2 12c0 0 3-5 10-5s10 5 10 5-3 5-10 5S2 12 2 12z" stroke="#f59e0b" strokeWidth="1.5"/><circle cx="12" cy="12" r="3" stroke="#f59e0b" strokeWidth="1.5"/></svg>, bg: '#fef9c3', title: 'Practice Regularly', desc: 'More practice builds confidence and fluency.' },
                  ]).map((tip, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#fafafa', borderRadius: 12, padding: '12px 14px' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: tip.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{tip.icon}</div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#1a1a2e', marginBottom: 2 }}>{tip.title}</div>
                        <div style={{ fontSize: '0.72rem', color: '#6c757d', lineHeight: 1.4 }}>{tip.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Hint pills */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const, marginBottom: 22 }}>
                  {[
                    { label: '60 Seconds', color: '#ede9fe', text: '#6c63ff' },
                    { label: 'Speak Clearly', color: '#e0f2fe', text: '#0284c7' },
                    { label: 'Express Your Ideas', color: '#fef9c3', text: '#a16207' },
                    { label: 'Be Confident', color: '#fee2e2', text: '#dc2626' },
                  ].map(h => (
                    <span key={h.label} style={{ background: h.color, color: h.text, fontSize: '0.75rem', fontWeight: 600, padding: '5px 13px', borderRadius: 20 }}>{h.label}</span>
                  ))}
                </div>

                {/* Start Speaking button */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <button
                    style={{ background: isLimitReached ? '#e5e7eb' : '#ff7a00', border: 'none', borderRadius: 30, padding: '13px 52px', color: '#fff', fontWeight: 700, fontSize: '1rem', cursor: isLimitReached ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: isLimitReached ? 'none' : '0 4px 16px rgba(255,122,0,0.35)' }}
                    onClick={beginPractice}
                    disabled={isLimitReached}
                  >
                    <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                      <rect x="8" y="1" width="8" height="13" rx="4" fill="white"/>
                      <path d="M5 10a7 7 0 0 0 14 0" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="12" y1="17" x2="12" y2="21" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="9" y1="21" x2="15" y2="21" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Start Speaking (60 Seconds)
                  </button>
                  {isLimitReached ? (
                    <div style={{ textAlign: 'center', fontSize: '0.78rem', color: '#dc2626', fontWeight: 600 }}>
                      {status === 'pending' ? 'Upgrade to unlock unlimited practice.' : 'Monthly limit reached. Try again next month.'}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#9ca3af' }}>Click the button above to reveal your topic and start speaking.</div>
                  )}
                </div>
              </div>


            </Col>

            {/* RIGHT: Tips + Motivational */}
            <Col lg={5}>

              {/* Your Recent Attempts */}
              {history && history.attempts.length > 0 && (() => {
                const PAGE_SIZE = 5
                const sorted = [...history.attempts].reverse()
                const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
                const page = Math.min(attemptsPage, totalPages)
                const pageItems = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
                return (
                  <div style={{ background: '#ffffff', borderRadius: 18, padding: '18px 20px', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ fontWeight: 700, fontSize: '1rem', color: '#1a1a2e' }}>Your Recent Attempts</span>
                      <span style={{ fontSize: '0.73rem', color: '#9ca3af' }}>{sorted.length} total</span>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                      <thead>
                        <tr>
                          {['Date & Time', 'Score', 'Dur.', 'Action'].map(h => (
                            <th key={h} style={{ textAlign: 'left', padding: '5px 6px', color: '#9ca3af', fontWeight: 600, fontSize: '0.72rem', borderBottom: '1px solid #f0f0f0', whiteSpace: 'nowrap' as const }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {pageItems.map((att) => {
                          const { date, time } = formatAttemptDate(att.date)
                          const isBest = att.score === history.summary.bestScore
                          const scoreColor = att.score >= 80 ? '#16a34a' : att.score >= 60 ? '#d97706' : '#dc2626'
                          return (
                            <tr key={att.attempt}>
                              <td style={{ padding: '8px 6px', borderBottom: '1px solid #f8f8f8', verticalAlign: 'middle', width: '36%' }}>
                                <div style={{ fontWeight: 600, fontSize: '0.78rem', color: '#1a1a2e' }}>{date}</div>
                                <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{time}</div>
                              </td>
                              <td style={{ padding: '8px 6px', borderBottom: '1px solid #f8f8f8', verticalAlign: 'middle', width: '22%' }}>
                                <span style={{ color: scoreColor, fontWeight: 700, fontSize: '0.82rem' }}>{att.score}/100</span>
                                {isBest && <span style={{ display: 'block', background: '#dcfce7', color: '#16a34a', fontSize: '0.6rem', fontWeight: 700, padding: '1px 5px', borderRadius: 10, marginTop: 2, width: 'fit-content' }}>Best</span>}
                              </td>
                              <td style={{ padding: '8px 6px', borderBottom: '1px solid #f8f8f8', verticalAlign: 'middle', color: '#6c757d', fontSize: '0.78rem', width: '12%' }}>1:00</td>
                              <td style={{ padding: '8px 6px', borderBottom: '1px solid #f8f8f8', verticalAlign: 'middle', width: '30%' }}>
                                <button className="jam-view-report-btn" style={{ fontSize: '0.72rem', padding: '4px 8px' }} onClick={() => setSelectedAttempt(att)}>View Report</button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTop: '1px solid #f5f5f5' }}>
                        <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Page {page} of {totalPages}</span>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => setAttemptsPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid #e5e7eb', background: page === 1 ? '#f9fafb' : '#fff', color: page === 1 ? '#d1d5db' : '#374151', cursor: page === 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><polyline points="15,18 9,12 15,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </button>
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
                            <button
                              key={pg}
                              onClick={() => setAttemptsPage(pg)}
                              style={{ width: 28, height: 28, borderRadius: 8, border: pg === page ? '1.5px solid #6c63ff' : '1px solid #e5e7eb', background: pg === page ? '#6c63ff' : '#fff', color: pg === page ? '#fff' : '#374151', cursor: 'pointer', fontSize: '0.72rem', fontWeight: pg === page ? 700 : 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >{pg}</button>
                          ))}
                          <button
                            onClick={() => setAttemptsPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid #e5e7eb', background: page === totalPages ? '#f9fafb' : '#fff', color: page === totalPages ? '#d1d5db' : '#374151', cursor: page === totalPages ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><polyline points="9,18 15,12 9,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}

            </Col>
          </Row>

          {/* View Report modal */}
          {selectedAttempt && (() => {
            const { date, time } = formatAttemptDate(selectedAttempt.date)
            const score = selectedAttempt.score
            const scoreColor = score >= 80 ? '#16a34a' : score >= 60 ? '#d97706' : '#dc2626'
            const scoreBg = score >= 80 ? '#dcfce7' : score >= 60 ? '#fef9c3' : '#fee2e2'
            const r = 44, circ = 2 * Math.PI * r
            const dash = (score / 100) * circ
            return (
              <div
                style={{ position: 'fixed' as const, inset: 0, background: 'rgba(15,15,30,0.55)', backdropFilter: 'blur(4px)', zIndex: 1060, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
                onClick={() => setSelectedAttempt(null)}
              >
                <div
                  style={{ background: '#ffffff', borderRadius: 24, width: '100%', maxWidth: 420, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.18)' }}
                  onClick={e => e.stopPropagation()}
                >
                  {/* Gradient header */}
                  <div style={{ background: 'linear-gradient(120deg,#eceaff 0%,#e8d8ff 60%,#fde8ff 100%)', padding: '24px 24px 20px', position: 'relative' as const }}>
                    <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1a1a2e' }}>Attempt #{selectedAttempt.attempt} Report</div>
                    <div style={{ fontSize: '0.78rem', color: '#6c757d', marginTop: 2 }}>{date} {'·'} {time}</div>
                    <button
                      onClick={() => setSelectedAttempt(null)}
                      style={{ position: 'absolute' as const, top: 16, right: 16, background: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6c757d', fontSize: '1rem', fontWeight: 700, lineHeight: 1 }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M18 6 6 18M6 6l12 12" stroke="#6c757d" strokeWidth="2.5" strokeLinecap="round"/></svg>
                    </button>
                  </div>

                  {/* Body */}
                  <div style={{ padding: '28px 28px 24px' }}>
                    {/* Score circle */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                      <div style={{ position: 'relative' as const }}>
                        <svg width="120" height="120" viewBox="0 0 120 120">
                          <circle cx="60" cy="60" r={r} fill="none" stroke="#f0f0f0" strokeWidth="9"/>
                          <circle cx="60" cy="60" r={r} fill="none" stroke={scoreColor} strokeWidth="9"
                            strokeDasharray={`${dash} ${circ}`}
                            strokeDashoffset={circ * 0.25}
                            strokeLinecap="round"
                          />
                          <text x="60" y="55" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 26, fontWeight: 800, fill: scoreColor }}>{score}</text>
                          <text x="60" y="72" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 11, fill: '#9ca3af' }}>/100</text>
                        </svg>
                      </div>
                    </div>

                    {/* Label pill */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                      <span style={{ background: scoreBg, color: scoreColor, fontWeight: 700, fontSize: '0.85rem', padding: '5px 18px', borderRadius: 20 }}>{getScoreFeedback(score)}</span>
                    </div>

                    {/* Stats row */}
                    <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                      <div style={{ flex: 1, background: '#f8f9ff', borderRadius: 12, padding: '12px 14px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.68rem', color: '#9ca3af', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>Score</div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: scoreColor }}>{score}/100</div>
                      </div>
                      <div style={{ flex: 1, background: '#f8f9ff', borderRadius: 12, padding: '12px 14px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.68rem', color: '#9ca3af', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>Duration</div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1a1a2e' }}>1:00</div>
                      </div>
                      <div style={{ flex: 1, background: '#f8f9ff', borderRadius: 12, padding: '12px 14px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.68rem', color: '#9ca3af', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>Attempt</div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1a1a2e' }}>#{selectedAttempt.attempt}</div>
                      </div>
                    </div>

                    {/* Feedback box */}
                    <div style={{ background: 'linear-gradient(135deg,#f8f7ff,#fff8f0)', borderRadius: 14, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 20 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: scoreBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M12 2a10 10 0 1 1 0 20A10 10 0 0 1 12 2zm0 6v5m0 3v.5" stroke={scoreColor} strokeWidth="2" strokeLinecap="round"/></svg>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#374151', lineHeight: 1.6 }}>{getAttemptFeedback(score)}</div>
                    </div>

                    {/* Close button */}
                    <button
                      onClick={() => setSelectedAttempt(null)}
                      style={{ width: '100%', background: '#ff7a00', border: 'none', borderRadius: 12, padding: '11px', color: '#fff', fontWeight: 700, fontSize: '0.92rem', cursor: 'pointer' }}
                    >
                      Close Report
                    </button>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      )}


      {/* SPINNER WHILE LOADING TOPIC */}
      {showPrompt && loadingPrompt && (
        <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#eceaff,#fde8ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(108,99,255,0.2)' }}>
            <svg viewBox="0 0 24 24" fill="none" width="30" height="30"><rect x="8" y="1" width="8" height="13" rx="4" stroke="#6c63ff" strokeWidth="2"/><path d="M5 10a7 7 0 0 0 14 0" stroke="#6c63ff" strokeWidth="2" strokeLinecap="round"/><line x1="12" y1="17" x2="12" y2="21" stroke="#6c63ff" strokeWidth="2" strokeLinecap="round"/><line x1="9" y1="21" x2="15" y2="21" stroke="#6c63ff" strokeWidth="2" strokeLinecap="round"/></svg>
          </div>
          <div style={{ fontWeight: 700, color: '#1a1a2e', fontSize: '1rem' }}>Loading your speaking topic...</div>
          <div style={{ fontSize: '0.82rem', color: '#9ca3af' }}>Please wait a moment</div>
        </div>
      )}

      {/* MAIN PRACTICE UI */}
      {showPrompt && !loadingPrompt && prompt && (
        <div style={{ padding: '0 0 32px' }}>
          <Row className="g-3">

            {/* LEFT: Speaking area */}
            <Col lg={6} md={12}>

              {/* Header bar */}
              <div style={{ background: '#ffffff', borderRadius: 18, padding: '13px 18px', marginBottom: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                  <button
                    style={{ background: 'rgba(108,99,255,0.08)', border: '1.5px solid rgba(108,99,255,0.2)', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: recording ? 'not-allowed' : 'pointer', color: '#6c63ff', flexShrink: 0, opacity: recording ? 0.4 : 1 }}
                    onClick={() => { if (!recording) { stopAllMedia(); setShowPrompt(false); setFeedback(null); setTranscript(''); setSampleAnswer(''); setRecordingTime(0); setRecordingError('') } }}
                    disabled={recording}
                  >
                    <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M19 12H5M5 12l7-7M5 12l7 7" stroke="#6c63ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#eceaff,#fde8ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg viewBox="0 0 24 24" fill="none" width="17" height="17"><rect x="8" y="1" width="8" height="13" rx="4" stroke="#6c63ff" strokeWidth="2"/><path d="M5 10a7 7 0 0 0 14 0" stroke="#6c63ff" strokeWidth="2" strokeLinecap="round"/><line x1="12" y1="17" x2="12" y2="21" stroke="#6c63ff" strokeWidth="2" strokeLinecap="round"/><line x1="9" y1="21" x2="15" y2="21" stroke="#6c63ff" strokeWidth="2" strokeLinecap="round"/></svg>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1a1a2e' }}>Just A Minute</div>
                    <div style={{ fontSize: '0.7rem', color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>Speak on the given topic for just 60 seconds. Organize your thoughts and express your ideas clearly!</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f4f3ff', border: '1.5px solid #e0deff', borderRadius: 12, padding: '7px 14px', flexShrink: 0 }}>
                  <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><circle cx="12" cy="12" r="10" stroke="#6c63ff" strokeWidth="2"/><polyline points="12,6 12,12 16,14" stroke="#6c63ff" strokeWidth="2" strokeLinecap="round"/></svg>
                  <div>
                    <div style={{ fontSize: '0.62rem', color: '#9ca3af', fontWeight: 600, letterSpacing: '0.2px', lineHeight: 1.2 }}>Time Left</div>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: '#1a1a2e', lineHeight: 1.1, letterSpacing: 0, fontVariantNumeric: 'tabular-nums', fontFamily: 'monospace' }}>{recording ? formatTime(maxDuration - recordingTime) : formatTime(maxDuration)}</div>
                  </div>
                </div>
              </div>

              {/* Topic card — lavender bg, text left, mic right with wave lines */}
              <div style={{ background: 'linear-gradient(135deg,#f0eeff 0%,#ede8ff 100%)', borderRadius: 18, padding: '20px 20px 20px 22px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 16, minHeight: 130 }}>
                {/* Left: text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#6c63ff', fontWeight: 700, fontSize: '0.68rem', letterSpacing: '0.6px', textTransform: 'uppercase' as const, marginBottom: 6 }}>Today's Topic</div>
                  <h3 style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1a1a2e', marginBottom: 6, lineHeight: 1.4 }}>
                    {loadingNewTopic ? <span style={{ color: '#9ca3af' }}>Generating new topic...</span> : prompt.text}
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#6c757d', marginBottom: 12, lineHeight: 1.55 }}>Share your thoughts on how this topic affects the lives of people today.</p>
                  {!recording && !feedback && (
                    <button
                      style={{ background: '#ffffff', border: '1.5px solid #d4cfff', borderRadius: 20, padding: '5px 14px', fontSize: '0.73rem', color: '#6c63ff', fontWeight: 600, cursor: loadingNewTopic ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, boxShadow: '0 1px 4px rgba(108,99,255,0.08)' }}
                      onClick={fetchAnotherTopic}
                      disabled={recording || loadingNewTopic}
                    >
                      <svg viewBox="0 0 24 24" fill="none" width="12" height="12"><path d="M1 4v6h6M23 20v-6h-6" stroke="#6c63ff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15" stroke="#6c63ff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Change Topic
                    </button>
                  )}
                </div>

                {/* Right: mic + horizontal wave lines */}
                <div style={{ flexShrink: 0, position: 'relative' as const, width: 100, height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {/* Horizontal wave bars left */}
                  <div style={{ position: 'absolute' as const, left: 0, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column' as const, gap: 4, alignItems: 'flex-end' }}>
                    {[18,26,16,30,14,22,10].map((h,i) => (
                      <div key={i} className={recording ? 'jam-bar-anim' : ''} style={{ width: `${h}px`, height: 3, borderRadius: 2, background: 'rgba(108,99,255,0.25)' }} />
                    ))}
                  </div>
                  {/* Mic SVG */}
                  <svg viewBox="0 0 110 140" width="70" height="88" fill="none" style={{ position: 'relative' as const, zIndex: 1 }}>
                    <defs>
                      <linearGradient id="micGrad3" x1="30" y1="10" x2="80" y2="90" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#a393f5"/>
                        <stop offset="1" stopColor="#5c4fcf"/>
                      </linearGradient>
                      <linearGradient id="micShine3" x1="38" y1="14" x2="55" y2="50" gradientUnits="userSpaceOnUse">
                        <stop stopColor="rgba(255,255,255,0.45)"/>
                        <stop offset="1" stopColor="rgba(255,255,255,0)"/>
                      </linearGradient>
                      <filter id="micShadow3" x="-30%" y="-10%" width="160%" height="140%">
                        <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#6c63ff" floodOpacity="0.3"/>
                      </filter>
                    </defs>
                    <ellipse cx="55" cy="132" rx="28" ry="5" fill="rgba(108,99,255,0.15)"/>
                    <rect x="32" y="10" width="46" height="72" rx="23" fill="url(#micGrad3)" filter="url(#micShadow3)"/>
                    <rect x="38" y="14" width="14" height="36" rx="7" fill="url(#micShine3)"/>
                    <line x1="42" y1="30" x2="68" y2="30" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="40" y1="38" x2="70" y2="38" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="40" y1="46" x2="70" y2="46" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="42" y1="54" x2="68" y2="54" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M22 60c0 18.2 14.8 33 33 33s33-14.8 33-33" stroke="#7c6fd4" strokeWidth="4" strokeLinecap="round"/>
                    <line x1="55" y1="93" x2="55" y2="114" stroke="#7c6fd4" strokeWidth="4" strokeLinecap="round"/>
                    <line x1="38" y1="114" x2="72" y2="114" stroke="#7c6fd4" strokeWidth="4" strokeLinecap="round"/>
                  </svg>
                  {/* Horizontal wave bars right */}
                  <div style={{ position: 'absolute' as const, right: 0, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column' as const, gap: 4, alignItems: 'flex-start' }}>
                    {[16,28,12,32,10,24,14].map((h,i) => (
                      <div key={i} className={recording ? 'jam-bar-anim' : ''} style={{ width: `${h}px`, height: 3, borderRadius: 2, background: 'rgba(108,99,255,0.25)' }} />
                    ))}
                  </div>
                </div>
              </div>

              {recordingError && (
                <div style={{ background: '#fee2e2', borderRadius: 12, padding: '10px 14px', marginBottom: 12, fontSize: '0.82rem', color: '#dc2626', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="#dc2626" strokeWidth="2" strokeLinecap="round"/></svg>
                  {recordingError}
                </div>
              )}

              {/* Recording section — centred card */}
              <div style={{ background: '#ffffff', borderRadius: 18, padding: '32px 24px 28px', boxShadow: '0 4px 20px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column' as const, alignItems: 'center' }}>

                {/* Status badge */}
                <div style={{ marginBottom: 24 }}>
                  {recording ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff0f0', color: '#dc2626', fontSize: '0.8rem', fontWeight: 700, padding: '5px 14px', borderRadius: 20 }}>
                      <span className="jam-rec-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#dc2626', display: 'inline-block' }}/>
                      Recording...
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f0eeff', color: '#6c63ff', fontSize: '0.8rem', fontWeight: 600, padding: '5px 16px', borderRadius: 20 }}>
                      Ready to speak
                    </span>
                  )}
                </div>

                {/* Dots — Mic — Dots (symmetric row) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, width: '100%' }}>
                  {/* Left dots / waveform */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: recording ? 3 : 5, flex: 1, overflow: 'hidden', height: 44 }}>
                    {recording
                      ? Array.from({ length: 14 }).map((_, i) => {
                          const colors = ['#22c55e','#4ade80','#86efac','#facc15','#fb923c','#f97316','#ef4444']
                          const c = colors[Math.floor(i / 14 * colors.length)]
                          return <div key={i} className="jam-bar jam-bar-anim" style={{ width: 4, flexShrink: 0, borderRadius: 3, background: c, '--i': i } as React.CSSProperties} />
                        })
                      : Array.from({ length: 10 }).map((_, i) => (
                          <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#e0deff', flexShrink: 0 }} />
                        ))
                    }
                  </div>

                  {/* Mic button with aura — centred */}
                  <div style={{ position: 'relative' as const, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, width: 90, height: 90 }}>
                    <div style={{ position: 'absolute' as const, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,122,0,0.07)' }} />
                    <div style={{ position: 'absolute' as const, width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,122,0,0.12)' }} />
                    <div style={{ position: 'absolute' as const, width: 57, height: 57, borderRadius: '50%', background: 'rgba(255,122,0,0.18)' }} />
                    <button
                      onClick={recording ? stopRecording : startRecording}
                      disabled={isLimitReached && !recording}
                      style={{ position: 'relative' as const, zIndex: 1, width: 46, height: 46, borderRadius: '50%', border: 'none', background: 'linear-gradient(135deg,#ffb347,#ff7a00)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: (isLimitReached && !recording) ? 'not-allowed' : 'pointer', boxShadow: '0 4px 16px rgba(255,122,0,0.45)', transition: 'transform 0.15s' }}
                    >
                      {recording
                        ? <svg viewBox="0 0 24 24" fill="white" width="18" height="18"><rect x="4" y="4" width="16" height="16" rx="3"/></svg>
                        : <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><rect x="8" y="1" width="8" height="13" rx="4" fill="white"/><path d="M5 10a7 7 0 0 0 14 0" stroke="white" strokeWidth="2.2" strokeLinecap="round"/><line x1="12" y1="17" x2="12" y2="21" stroke="white" strokeWidth="2.2" strokeLinecap="round"/><line x1="9" y1="21" x2="15" y2="21" stroke="white" strokeWidth="2.2" strokeLinecap="round"/></svg>
                      }
                    </button>
                  </div>

                  {/* Right dots / waveform */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: recording ? 3 : 5, flex: 1, overflow: 'hidden', height: 44 }}>
                    {recording
                      ? Array.from({ length: 14 }).map((_, i) => {
                          const colors = ['#ef4444','#f97316','#fb923c','#facc15','#86efac','#4ade80','#22c55e']
                          const c = colors[Math.floor(i / 14 * colors.length)]
                          return <div key={i} className="jam-bar jam-bar-anim" style={{ width: 4, flexShrink: 0, borderRadius: 3, background: c, '--i': i + 14 } as React.CSSProperties} />
                        })
                      : Array.from({ length: 10 }).map((_, i) => (
                          <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#e0deff', flexShrink: 0 }} />
                        ))
                    }
                  </div>
                </div>

                {/* Tip text */}
                <div style={{ fontSize: '0.8rem', color: '#7c6fd4', marginBottom: 22, textAlign: 'center' as const }}>
                  Make sure to speak clearly and cover your points.
                </div>

                {/* Action button */}
                {recording ? (
                  <button onClick={stopRecording} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#fff0f0', border: '1.5px solid #fecaca', borderRadius: 10, padding: '9px 22px', color: '#dc2626', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                    <svg viewBox="0 0 24 24" fill="#dc2626" width="14" height="14"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                    Finish Early
                  </button>
                ) : !feedback ? (
                  <button onClick={startRecording} disabled={isLimitReached} style={{ background: isLimitReached ? '#e5e7eb' : 'linear-gradient(90deg,#6c63ff,#8b7cf8)', border: 'none', borderRadius: 50, padding: '13px 48px', color: '#fff', fontWeight: 700, fontSize: '1rem', cursor: isLimitReached ? 'not-allowed' : 'pointer', boxShadow: '0 6px 18px rgba(108,99,255,0.35)', letterSpacing: '0.2px' }}>
                    Start Speaking
                  </button>
                ) : null}
              </div>
            </Col>

            {/* RIGHT: Feedback — always visible */}
            <Col lg={6} md={12}>
              <div style={{ background: '#ffffff', borderRadius: 18, padding: '18px 20px', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>

                {/* ── PERFORMANCE HEADER with score opposite ── */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1a1a2e' }}>Your Performance</div>
                  {feedback && !loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ textAlign: 'right' as const }}>
                        <div style={{ fontSize: '0.6rem', color: '#9ca3af', fontWeight: 600 }}>OVERALL SCORE</div>
                        <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#ff7a00', lineHeight: 1 }}>{feedback.score}<span style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 400 }}>/100</span></div>
                      </div>
                      <span style={{ background: feedback.score >= 80 ? '#dcfce7' : feedback.score >= 60 ? '#fef9c3' : '#fee2e2', color: feedback.score >= 80 ? '#16a34a' : feedback.score >= 60 ? '#a16207' : '#dc2626', fontWeight: 700, fontSize: '0.7rem', padding: '3px 9px', borderRadius: 20 }}>{getScoreFeedback(feedback.score)}</span>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'right' as const }}>
                      <div style={{ fontSize: '0.6rem', color: '#d1d5db', fontWeight: 600 }}>OVERALL SCORE</div>
                      <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#d1d5db', lineHeight: 1 }}>--<span style={{ fontSize: '0.7rem', fontWeight: 400 }}>/100</span></div>
                    </div>
                  )}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginBottom: 16 }}>
                  {feedback && !loading
                    ? (feedback.score >= 60 ? 'Great job! You communicated your ideas well.' : 'Keep practicing to improve your score.')
                    : 'Complete speaking to see your detailed AI feedback here.'}
                </div>

                {/* ── TABS (underline style with icons) ── */}
                <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #f0f0f0', marginBottom: 18 }}>
                  {([
                    { key: 'your-answer',  label: 'Your Answer',  icon: <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><rect x="8" y="1" width="8" height="13" rx="4" stroke="currentColor" strokeWidth="2"/><path d="M5 10a7 7 0 0 0 14 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> },
                    { key: 'model-answer', label: 'Model Answer', icon: <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> },
                    { key: 'transcript',   label: 'Transcript',   icon: <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><line x1="7" y1="8" x2="17" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="7" y1="12" x2="14" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> },
                    { key: 'voice',        label: 'Voice',        icon: <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><rect x="8" y="1" width="8" height="13" rx="4" stroke="currentColor" strokeWidth="2"/><path d="M5 10a7 7 0 0 0 14 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> },
                    { key: 'detailed',     label: 'Detailed',     icon: <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> },
                  ]).map(tab => {
                    const isActive = activeTab === tab.key
                    return (
                      <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '8px 4px', background: 'none', border: 'none', borderBottom: isActive ? '2.5px solid #6c63ff' : '2.5px solid transparent', marginBottom: -2, color: isActive ? '#6c63ff' : '#4b5563', fontWeight: isActive ? 700 : 500, fontSize: '0.74rem', cursor: 'pointer', whiteSpace: 'nowrap' as const, transition: 'all 0.15s' }}>
                        {tab.icon}{tab.label}
                      </button>
                    )
                  })}
                </div>

                {/* Loading */}
                {loading && (
                  <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', minHeight: 260, gap: 14 }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#eceaff,#fde8ff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Spinner animation="border" style={{ color: '#6c63ff', width: 26, height: 26, borderWidth: 3 }} />
                    </div>
                    <div style={{ fontWeight: 700, color: '#1a1a2e', fontSize: '0.92rem' }}>Analyzing your speech...</div>
                    <div style={{ fontSize: '0.76rem', color: '#9ca3af' }}>AI is evaluating fluency, grammar and vocabulary</div>
                  </div>
                )}

                {/* Placeholder skeleton */}
                {!loading && !feedback && (
                  <div>
                    {/* Your Answer — always live, no skeleton needed */}
                    {activeTab === 'your-answer' && (
                      <div style={{ minHeight: 220 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                          {recording && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fee2e2', color: '#dc2626', fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 12 }}>
                              <span className="jam-rec-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#dc2626', display: 'inline-block' }}/>
                              Recording...
                            </span>
                          )}
                        </div>
                        <div style={{ background: '#f8f9fa', borderRadius: 12, padding: '16px', minHeight: 160, fontSize: '0.85rem', color: transcript ? '#374151' : '#c4c4c4', lineHeight: 1.8 }}>
                          {isWebView && !transcript ? 'Speech-to-text not available in app mode.' : transcript || 'Start speaking to see your live transcript here...'}
                        </div>
                        {isWebView && showManualInput && (
                          <div style={{ marginTop: 10 }}>
                            <Form.Control as="textarea" rows={4} value={manualTranscript} onChange={(e) => setManualTranscript(e.target.value)} placeholder="Type what you said here..." style={{ fontSize: '0.85rem' }} />
                            <button onClick={handleManualSubmit} disabled={!manualTranscript.trim()} style={{ marginTop: 8, background: '#6c63ff', border: 'none', borderRadius: 8, padding: '6px 16px', color: '#fff', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}>Submit Transcript</button>
                          </div>
                        )}
                      </div>
                    )}
                    {/* Model Answer skeleton */}
                    {activeTab === 'model-answer' && (
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#d1d5db', marginBottom: 8 }}>Model Answer <span style={{ fontWeight: 400 }}>(Ideal Answer)</span></div>
                        <div style={{ background: '#f8f9fa', borderRadius: 12, padding: '16px', display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                          {[85, 95, 70, 88, 60].map((w, i) => <div key={i} style={{ height: 8, background: '#e5e7eb', borderRadius: 4, width: `${w}%` }} />)}
                        </div>
                      </div>
                    )}
                    {activeTab === 'transcript' && (
                      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
                        {['Your Original Transcript', 'AI Corrected Transcript'].map((label, idx) => (
                          <div key={label}>
                            <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#d1d5db', marginBottom: 6 }}>{label}</div>
                            <div style={{ background: idx === 0 ? '#f8f9fa' : '#f0fdf4', borderRadius: 12, padding: '12px 14px', display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                              {[80, 92, 65].map((w, i) => <div key={i} style={{ height: 7, background: idx === 0 ? '#e5e7eb' : '#bbf7d0', borderRadius: 3, width: `${w}%` }} />)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {activeTab === 'voice' && (
                      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
                        {['Your Voice', 'AI Corrected Voice'].map(label => (
                          <div key={label}>
                            <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#d1d5db', marginBottom: 6 }}>{label}</div>
                            <div style={{ background: '#f8f9fa', borderRadius: 12, height: 44 }} />
                          </div>
                        ))}
                      </div>
                    )}
                    {activeTab === 'detailed' && (
                      <div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginBottom: 12 }}>
                          {([{ c: '#f0efff' }, { c: '#fff7ed' }, { c: '#dcfce7' }, { c: '#e0f2fe' }]).map((x, i) => (
                            <div key={i} style={{ background: x.c, borderRadius: 12, padding: '10px 12px', opacity: 0.5 }}>
                              <div style={{ height: 8, background: 'rgba(0,0,0,0.1)', borderRadius: 3, width: '50%', marginBottom: 8 }} />
                              <div style={{ height: 6, background: 'rgba(0,0,0,0.07)', borderRadius: 3, width: '80%', marginBottom: 4 }} />
                              <div style={{ height: 6, background: 'rgba(0,0,0,0.05)', borderRadius: 3, width: '60%' }} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Filled feedback */}
                {feedback && !loading && (
                  <div>

                    {/* Tab 1: Model Answer */}
                    {/* Tab 1: Your Answer */}
                    {activeTab === 'your-answer' && (
                      <div style={{ minHeight: 220 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.83rem', color: '#1a1a2e' }}>Your Answer <span style={{ fontWeight: 400, color: '#6c757d' }}>(Speaking to Text)</span></div>
                        </div>
                        <div style={{ background: '#f8f9fa', borderRadius: 12, padding: '16px', minHeight: 160, fontSize: '0.85rem', color: transcript ? '#374151' : '#c4c4c4', lineHeight: 1.8 }}>
                          {isWebView && !transcript ? 'Speech-to-text not available in app mode.' : transcript || 'No transcript recorded.'}
                        </div>
                      </div>
                    )}

                    {/* Tab 2: Model Answer */}
                    {activeTab === 'model-answer' && (
                      <div>
                        {sampleAnswer ? (
                          <>
                            <div style={{ fontWeight: 700, fontSize: '0.83rem', color: '#1a1a2e', marginBottom: 8 }}>Model Answer <span style={{ color: '#9ca3af', fontWeight: 400 }}>(Ideal Answer)</span></div>
                            <div style={{ background: '#f8f9ff', borderRadius: 12, padding: '14px 16px', fontSize: '0.83rem', color: '#374151', lineHeight: 1.75, borderLeft: '3px solid #6c63ff', maxHeight: 320, overflowY: 'auto' as const }}>{sampleAnswer}</div>
                          </>
                        ) : (
                          <div style={{ textAlign: 'center' as const, color: '#9ca3af', fontSize: '0.82rem', padding: '40px 0' }}>Model answer not available for this topic.</div>
                        )}
                      </div>
                    )}

                    {/* Tab 3: Transcript */}
                    {activeTab === 'transcript' && (
                      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
                        {transcript && (
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.83rem', color: '#1a1a2e', marginBottom: 6 }}>Your Original Transcript</div>
                            <div style={{ background: '#f8f9fa', borderRadius: 12, padding: '12px 14px', fontSize: '0.83rem', color: '#374151', lineHeight: 1.7 }}>{transcript}</div>
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.83rem', color: '#1a1a2e', marginBottom: 6 }}>AI Corrected Transcript</div>
                          <div style={{ background: '#f0fdf4', borderRadius: 12, padding: '12px 14px', fontSize: '0.83rem', color: '#15803d', lineHeight: 1.7, borderLeft: '3px solid #16a34a' }}>{feedback.correctedTranscript}</div>
                        </div>
                      </div>
                    )}

                    {/* Tab 3: Voice (both) */}
                    {activeTab === 'voice' && (
                      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 16 }}>
                        {([
                          { url: feedback.studentAudioUrl, label: 'Your Voice', badge: 'You', badgeBg: '#f0efff', badgeColor: '#6c63ff', waveBg: '#f0efff', waveColor: '#6c63ff', type: ['audio/webm','audio/mpeg'] },
                          { url: feedback.correctedAudioUrl, label: 'AI Corrected Voice', badge: 'AI', badgeBg: '#dcfce7', badgeColor: '#16a34a', waveBg: '#f0fdf4', waveColor: '#16a34a', type: ['audio/mpeg'] },
                        ]).map(item => item.url && (
                          <div key={item.label} style={{ background: item.waveBg, borderRadius: 14, padding: '14px 16px' }}>
                            {/* Header */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                              <span style={{ background: item.badgeColor, color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: '0.66rem', fontWeight: 700 }}>{item.badge}</span>
                              <span style={{ fontWeight: 700, fontSize: '0.83rem', color: '#1a1a2e' }}>{item.label}</span>
                            </div>
                            {/* Decorative waveform bars */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, height: 36, marginBottom: 10 }}>
                              {Array.from({ length: 36 }).map((_, i) => {
                                const heights = [8,14,20,28,22,32,18,26,12,30,24,16,28,20,10,34,22,28,16,30,24,12,26,20,32,14,22,28,18,10,26,30,16,22,14,8]
                                return (
                                  <div key={i} style={{ width: 3, height: heights[i] || 10, borderRadius: 3, background: item.waveColor, opacity: 0.55 + (i % 3) * 0.15 }} />
                                )
                              })}
                            </div>
                            {/* Audio player */}
                            <audio controls style={{ width: '100%', height: 32, borderRadius: 8, accentColor: item.badgeColor } as React.CSSProperties}>
                              {item.type.map(t => <source key={t} src={item.url!} type={t} />)}
                            </audio>
                          </div>
                        ))}
                        {!feedback.studentAudioUrl && !feedback.correctedAudioUrl && (
                          <div style={{ textAlign: 'center' as const, color: '#9ca3af', fontSize: '0.82rem', padding: '40px 0' }}>Audio not available.</div>
                        )}
                      </div>
                    )}

                    {/* Tab 4: Detailed Feedback */}
                    {activeTab === 'detailed' && (
                      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                        {([
                          { label: 'Fluency',       color: '#6c63ff', bg: '#f0efff', borderColor: '#c7c3ff', text: feedback.fluency,       icon: <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M18 20V10M12 20V4M6 20v-6" stroke="#6c63ff" strokeWidth="2" strokeLinecap="round"/></svg> },
                          { label: 'Grammar',       color: '#0284c7', bg: '#e0f2fe', borderColor: '#93c5fd', text: feedback.grammar,       icon: <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M4 7h16M4 12h10M4 17h7" stroke="#0284c7" strokeWidth="2" strokeLinecap="round"/></svg> },
                          { label: 'Vocabulary',    color: '#ff7a00', bg: '#fff7ed', borderColor: '#fed7aa', text: feedback.vocabulary,    icon: <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#ff7a00" strokeWidth="2" strokeLinecap="round"/></svg> },
                          { label: 'Pronunciation', color: '#16a34a', bg: '#dcfce7', borderColor: '#86efac', text: feedback.pronunciation, icon: <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><polygon points="11,5 6,9 2,9 2,15 6,15 11,19" stroke="#16a34a" strokeWidth="2" strokeLinejoin="round"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke="#16a34a" strokeWidth="2" strokeLinecap="round"/></svg> },
                        ] as const).map(item => (
                          <div key={item.label} style={{ background: item.bg, borderRadius: 12, padding: '12px 14px', borderLeft: `3px solid ${item.borderColor}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                              <div style={{ width: 26, height: 26, borderRadius: 8, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>{item.icon}</div>
                              <span style={{ fontWeight: 700, fontSize: '0.82rem', color: item.color }}>{item.label}</span>
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#374151', lineHeight: 1.65 }}>{String(item.text || 'No feedback available.')}</div>
                          </div>
                        ))}

                        {feedback.recommendations && (
                          <div style={{ background: 'linear-gradient(135deg,#dcfce7,#f0fdf4)', borderRadius: 12, padding: '12px 14px', borderLeft: '3px solid #86efac', display: 'flex', alignItems: 'flex-start', gap: 9, marginTop: 4 }}>
                            <svg viewBox="0 0 24 24" fill="none" width="17" height="17" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10" stroke="#16a34a" strokeWidth="2"/><path d="M9 12l2 2 4-4" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#15803d', marginBottom: 3 }}>Recommendations</div>
                              <div style={{ fontSize: '0.78rem', color: '#15803d', lineHeight: 1.6 }}>{feedback.recommendations}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div style={{ marginTop: 20 }}>
                      <button onClick={resetPractice} style={{ width: '100%', background: 'linear-gradient(90deg,#6c63ff,#8b7cf8)', border: 'none', borderRadius: 12, padding: '12px', color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(108,99,255,0.28)' }}>
                        Try Another Topic
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </Col>

          </Row>
        </div>
      )}

      <style>{`
        /* Waveform bar */
        .jam-bar { height: 4px; transition: height 0.1s; }
        .jam-bar-anim {
          animation: jamBarPulse 0.6s ease-in-out infinite alternate;
          animation-delay: calc(var(--i, 0) * 0.04s);
        }
        @keyframes jamBarPulse {
          from { height: 4px; }
          to   { height: 22px; }
        }
        /* Recording dot blink */
        .jam-rec-dot { animation: jamBlink 1s step-start infinite; }
        @keyframes jamBlink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
        /* Mic wave rings */
        .jam-wave-ring { animation: jamRing 1.8s ease-out infinite; }
        .jam-wave-ring-2 { animation-delay: 0.5s; }
        .jam-wave-ring-3 { animation-delay: 1s; }
        @keyframes jamRing {
          0%   { transform: scale(0.85); opacity: 0.7; }
          100% { transform: scale(1.25); opacity: 0; }
        }
        /* View Report button */
        .jam-view-report-btn {
          background: none; border: 1px solid #e5e7eb; border-radius: 8px;
          padding: 4px 10px; font-size: 0.75rem; color: #6c757d; cursor: pointer;
        }
        .jam-view-report-btn:hover { border-color: #6c63ff; color: #6c63ff; }
        /* View All button */
        .jam-view-all-btn {
          background: none; border: 1px solid #e5e7eb; border-radius: 8px;
          padding: 4px 10px; font-size: 0.75rem; color: #6c757d; cursor: pointer;
        }
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
          position: relative;
        }

        /* back-btn used in both start screen (white card) and practice header (dark card) */
        .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,122,0,0.08);
          border: 1.5px solid rgba(255,122,0,0.35);
          color: #ff7a00;
          border-radius: 20px;
          padding: 5px 14px;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          transition: background 0.18s, border-color 0.18s;
        }
        .back-btn:hover:not(:disabled) {
          background: #ff7a00;
          border-color: #ff7a00;
          color: #fff;
        }
        .back-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        /* position override for start-screen card only */
        .start-screen-card .back-btn {
          position: absolute;
          top: 1.2rem;
          left: 1.2rem;
          background: none;
          border-color: #e0e0e0;
          color: #888;
        }
        .start-screen-card .back-btn:hover {
          background: none;
          border-color: #ff7a00;
          color: #ff7a00;
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
          background: #ff7a00;
          border: none;
          padding: 0.75rem 2rem;
          font-weight: 600;
          font-size: 1rem;
          width: 100%;
        }
        
        .start-button:hover:not(:disabled) {
          background: #e96d00;
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
          color: #ff7a00;
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
          border-left: 5px solid #ff7a00;
          margin-bottom: 1.5rem;
        }

        .topic-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.75rem;
        }

        .topic-title {
          color: #ff7a00;
          font-weight: bold;
          font-size: 1.1rem;
        }

        .another-topic-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #fff;
          border: 1.5px solid #ff7a00;
          color: #ff7a00;
          border-radius: 20px;
          padding: 5px 14px;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.18s, color 0.18s;
          flex-shrink: 0;
        }
        .another-topic-btn:hover:not(:disabled) {
          background: #ff7a00;
          color: #fff;
        }
        .another-topic-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .topic-loading-text {
          color: #aaa;
          font-style: italic;
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
          color: #ff7a00;
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
          color: #ff7a00;
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
          border-left-color: #ff7a00;
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
      .record-button {
        background: #ff7a00 !important;
        border-color: #ff7a00 !important;
      }

      .record-button:hover {
        background: #e96d00 !important;
        border-color: #e96d00 !important;
      }

      .history-card-modern {
          margin-top: 1.5rem;
          border: none;
          border-radius: 18px;
          background: linear-gradient(135deg, #fff8f1 0%, #ffe8d1 100%);
          box-shadow: 0 8px 20px rgba(255, 122, 0, 0.15);
        }

        .history-grid {
          display: flex;
          justify-content: space-between;
          gap: 1.5rem;
          flex-wrap: wrap;
        }

        .history-box {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;
          min-width: 150px;
          background: white;
          padding: 1rem;
          border-radius: 14px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .history-icon {
          font-size: 1.8rem;
        }

        .history-label {
          font-size: 0.85rem;
          color: #6c757d;
          margin-bottom: 2px;
        }

        .history-value {
          font-size: 1.2rem;
          font-weight: 700;
          color: #212529;
        }

        .history-value.highlight {
          color: #ff7a00;
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


        /* â"€â"€ Section cards (Recent Attempts / Tips) â"€â"€ */
        .jam-section-card {
          border: none;
          border-radius: 18px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.07);
          height: 100%;
        }

        .jam-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .jam-section-title {
          display: flex;
          align-items: center;
          font-weight: 700;
          font-size: 1rem;
          color: #1a1a2e;
        }

        .jam-view-all-btn {
          background: none;
          border: none;
          color: #ff7a00;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
        }
        .jam-view-all-btn:hover { text-decoration: underline; }

        /* Table */
        .jam-table-wrap { overflow-x: auto; }

        .jam-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }

        .jam-table th {
          text-align: left;
          padding: 8px 10px;
          color: #6c757d;
          font-weight: 600;
          font-size: 0.8rem;
          border-bottom: 1px solid #f0f0f0;
          white-space: nowrap;
        }

        .jam-table td {
          padding: 10px 10px;
          border-bottom: 1px solid #f8f8f8;
          vertical-align: middle;
          color: #374151;
        }

        .jam-table tr:last-child td { border-bottom: none; }

        .jam-date-cell {
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }

        .jam-date-main { font-weight: 600; font-size: 0.85rem; color: #1a1a2e; }
        .jam-date-sub  { font-size: 0.75rem; color: #9ca3af; margin-top: 1px; }

        .jam-duration { color: #6c757d; white-space: nowrap; }

        .jam-best-badge {
          display: inline-block;
          background: #dcfce7;
          color: #16a34a;
          font-size: 0.68rem;
          font-weight: 700;
          padding: 1px 7px;
          border-radius: 20px;
          margin-top: 3px;
        }

        .jam-feedback-text {
          color: #4b5563;
          font-size: 0.82rem;
          max-width: 200px;
        }

        .jam-view-report-btn {
          background: none;
          border: 1.5px solid #e0e7ef;
          border-radius: 8px;
          padding: 5px 14px;
          font-size: 0.8rem;
          font-weight: 600;
          color: #374151;
          cursor: pointer;
          white-space: nowrap;
          transition: border-color 0.15s, color 0.15s;
        }
        .jam-view-report-btn:hover {
          border-color: #ff7a00;
          color: #ff7a00;
        }

        /* Tips */
        .jam-tip-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid #f5f5f5;
        }
        .jam-tip-item:last-of-type { border-bottom: none; }

        .jam-tip-icon {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .jam-tip-title {
          font-weight: 700;
          font-size: 0.875rem;
          color: #1a1a2e;
          margin-bottom: 2px;
        }

        .jam-tip-desc {
          font-size: 0.78rem;
          color: #6c757d;
        }

        /* Motivational banner */
        .jam-motivational-banner {
          margin-top: 1.5rem;
          background: linear-gradient(135deg, #fff8f1 0%, #fff3e8 100%);
          border-radius: 16px;
          padding: 16px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          box-shadow: 0 2px 10px rgba(255,122,0,0.1);
        }

        .jam-banner-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .jam-banner-title {
          font-weight: 700;
          font-size: 0.9rem;
          color: #1a1a2e;
        }

        .jam-banner-sub {
          font-size: 0.8rem;
          color: #9ca3af;
          margin-top: 2px;
        }

        .jam-how-btn {
          display: inline-flex;
          align-items: center;
          background: white;
          border: 1.5px solid #ff7a00;
          color: #ff7a00;
          font-weight: 600;
          font-size: 0.85rem;
          border-radius: 10px;
          padding: 8px 16px;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.15s, color 0.15s;
          flex-shrink: 0;
        }
        .jam-how-btn:hover {
          background: #ff7a00;
          color: white;
        }

      `}</style>
    </Container>
  )
}

export default SpeakingPractice
