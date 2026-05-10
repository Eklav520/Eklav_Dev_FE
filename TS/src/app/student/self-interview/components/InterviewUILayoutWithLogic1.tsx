// InterviewUILayoutWithLogic.tsx
import React, { useEffect, useRef, useState } from 'react'
import { Container, Row, Col, Card, Form, Button, Badge, Spinner, Alert } from 'react-bootstrap'
import VideoRecorder from './VideoRecorder'
import { useAuthContext } from '@/context/useAuthContext'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import './InterviewLayout.css'
import VideoRecorderUpdated from './VideoRecorderUpdated'
import RobotAvatarSVG from './RobotAvatarSVG'
import Avatar from './LetterAvatar'
import CircularScore from './CircularScore'
import GlowMic from './GlowMic'
import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorView } from '@codemirror/view'
import HeyGenAvatar, { HeyGenAvatarHandle } from '../../speaking-practice/components/HeyGenAvatar'

type AnswerItem = {
  question: string
  answer: string
  example?: string
  videoPath?: string
  feedback?: {
    theory?: string
    example?: string
  }
  idealAnswer?: string
  improvementTips?: string[]
  rating?: number | { accuracy: number; clarity: number; completeness: number; total: number }
  timestamp?: string
  isFollowUp?: boolean
  exampleProgram?: { title: string; language: string; code: string } | null
  fixedExampleCode?: string
}

const isCodeLanguage = (language?: string) => {
  const lang = (language || '').toLowerCase().trim()
  if (!lang) return false
  return !['text', 'plain', 'plaintext', 'natural-language', 'narrative'].includes(lang)
}

const TECH_KEYWORDS = [
  'html', 'css', 'javascript', 'js', 'react', 'node', 'express',
  'java', 'python', 'c++', 'coding', 'code', 'programming', 'sql',
  'api', 'function', 'class', 'async', 'await', 'algorithm', 'database',
  'sass', 'less', 'preprocessor'
]

const isLikelyTechnicalQuestion = (question: string, topic: string) => {
  const source = `${question} ${topic}`.toLowerCase()
  return TECH_KEYWORDS.some((k) => source.includes(k))
}

const summarizeNarrative = (text: string) => {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (!cleaned) return 'Generated example from explanation'
  const firstSentence = cleaned.split('.').find(Boolean)?.trim() || cleaned
  return firstSentence.length > 90 ? `${firstSentence.slice(0, 87)}...` : firstSentence
}

const generateExampleCode = (question: string, narrative: string) => {
  const q = `${question} ${narrative}`.toLowerCase()

  if (q.includes('this') && q.includes('javascript')) {
    return `const user = {
  name: 'Asha',
  greet() {
    console.log('Hello, ' + this.name); // this -> user
  },
};

user.greet();

function regularFunction() {
  console.log(this); // depends on call-site
}

const arrowFunction = () => {
  console.log(this); // lexical this (inherits from parent scope)
};`
  }

  if (q.includes('sass') || q.includes('less') || q.includes('preprocessor')) {
    return `$primary-color: #d97706;
$spacing: 12px;

.card {
  padding: $spacing;
  border: 1px solid $primary-color;

  .title {
    color: $primary-color;
  }
}

@mixin center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero {
  @include center;
}`
  }

  return `// Auto-generated code example from backend narrative.
function exampleProgram() {
  const concept = ${JSON.stringify(narrative || question)};
  console.log('Concept:', concept);
}

exampleProgram();`
}

const normalizeExampleProgram = (
  raw: any,
  question: string,
  topic: string
): { title: string; language: string; code: string } | null => {
  if (!raw) return null

  const isTechnical = isLikelyTechnicalQuestion(question, topic)

  if (typeof raw === 'string') {
    if (!isTechnical) {
      return {
        title: 'Real-world example',
        language: 'text',
        code: raw,
      }
    }

    return {
      title: summarizeNarrative(raw),
      language: 'javascript',
      code: generateExampleCode(question, raw),
    }
  }

  const language = (raw.language || '').toLowerCase()
  const code = typeof raw.code === 'string' ? raw.code : ''
  const title = typeof raw.title === 'string' ? raw.title : 'Example Program'

  if (!isCodeLanguage(language)) {
    if (!isTechnical) {
      return {
        title: title || 'Real-world example',
        language: 'text',
        code,
      }
    }

    return {
      title: `${title} • ${summarizeNarrative(code)}`,
      language: 'javascript',
      code: generateExampleCode(question, code),
    }
  }

  return {
    title,
    language: raw.language || 'javascript',
    code,
  }
}

const formatCodeSnippet = (code?: string) => {
  if (!code) return ''

  const compact = code.replace(/\r\n/g, '\n').trim()
  if (!compact) return ''

  // Preserve already formatted code.
  if (compact.includes('\n')) return compact

  // Basic readable formatting for one-line snippets from API.
  let formatted = compact
    .replace(/;\s*(?=[A-Za-z_$])/g, ';\n')
    .replace(/\{\s*/g, '{\n  ')
    .replace(/\s*\}/g, '\n}')
    .replace(/\}\s*(?=[A-Za-z_$])/g, '}\n')

  // Simple indentation pass.
  let indent = 0
  formatted = formatted
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      if (line.startsWith('}')) indent = Math.max(indent - 1, 0)
      const out = `${'  '.repeat(indent)}${line}`
      if (line.endsWith('{')) indent += 1
      return out
    })
    .join('\n')

  return formatted
}

const normalizeCodeForCompare = (code?: string) =>
  (code || '').replace(/\s+/g, ' ').trim().toLowerCase()
interface Props {
  interviewId: string
  questions: string[]
  title: string
  setLoadingFeedback?: React.Dispatch<React.SetStateAction<boolean>>
  isFullscreen?: boolean

  meta?: {
    interviewType: 'topic' | 'resume'
    attemptId?: string
    attemptNumber?: number
  }
  onComplete?: () => void
}


const FOLLOW_UP_THRESHOLD = 4
const MAX_FOLLOW_UPS = 1

const InterviewUILayoutWithLogic: React.FC<Props> = ({ interviewId, questions, title, setLoadingFeedback, meta, onComplete }) => {
  const { user } = useAuthContext()
  const token = user?.token
  const baseURL = import.meta.env.VITE_API_BASE_URL || ''

  // FLOW
  const [questionsQueue, setQuestionsQueue] = useState<string[]>(questions.length ? [questions[0]] : [])
  const [questionIndex, setQuestionIndex] = useState(0)
  const [mainQuestionIndex, setMainQuestionIndex] = useState(0)
  const currentQuestion = questionsQueue[questionIndex] || ''

  // ANSWERS / UI
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [transcript, setTranscript] = useState('')
  const [currentVideoUrl, setCurrentVideoUrl] = useState('')
  const [answers, setAnswers] = useState<AnswerItem[]>([])

  // ROBOT UI
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [robotStatus, setRobotStatus] = useState<'idle' | 'speaking' | 'listening' | 'processing'>('idle')
  const [ledColor, setLedColor] = useState<'blue' | 'green' | 'yellow' | 'red'>('blue')
  const [eyeMovement, setEyeMovement] = useState({ left: 0, right: 0 })
  const eyeRef = useRef<number | null>(null)

  // EVALUATION
  const [loadingEvaluation, setLoadingEvaluation] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [currentFeedback, setCurrentFeedback] = useState<AnswerItem | null>(null)

  const [isFollowUp, setIsFollowUp] = useState(false)
  const [pendingFollowUp, setPendingFollowUp] = useState<string | null>(null)
  const [awaitingFollowUp, setAwaitingFollowUp] = useState(false)
  const [followUpCount, setFollowUpCount] = useState(0)
  const [interviewFinished, setInterviewFinished] = useState(false)
  const [finalFeedback, setFinalFeedback] = useState<any>(null)
  const [isListening, setIsListening] = useState(false)
  const [currentExample, setCurrentExample] = useState('')
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [loadingFinalFeedback, setLoadingFinalFeedback] = useState(false)
  const [stopRecording, setStopRecording] = useState(false);
  const [isRecordingActive, setIsRecordingActive] = useState(true);


  // HeyGen avatar
  const heygenRef = useRef<HeyGenAvatarHandle | null>(null)
  const [avatarReady, setAvatarReady] = useState(false)

  // Typed question reveal
  const [typedQuestion, setTypedQuestion] = useState('')
  const typingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startTyping = (text: string) => {
    if (typingTimerRef.current) clearInterval(typingTimerRef.current)
    setTypedQuestion('')
    let i = 0
    typingTimerRef.current = setInterval(() => {
      i++
      setTypedQuestion(text.slice(0, i))
      if (i >= text.length && typingTimerRef.current) clearInterval(typingTimerRef.current)
    }, 30)
  }

  // Refs to avoid stale closures in HeyGenAvatar callbacks
  const isIntroDoneRef = useRef(false)
  const currentQuestionRef = useRef('')

  // speech synth
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null)
  const [isIntroDone, setIsIntroDone] = useState(false)

  // Keep refs in sync so HeyGenAvatar callbacks never have stale closures
  useEffect(() => { isIntroDoneRef.current = isIntroDone }, [isIntroDone])
  useEffect(() => { currentQuestionRef.current = currentQuestion }, [currentQuestion])
  const [isMobile, setIsMobile] = useState(false)

  // transcript / recognition
  const recognitionRef = useRef<any>(null)
  const finalRef = useRef<string>('')
  const listeningHardRef = useRef(false)

  const getSpeechCtor = () => (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition

  const browserSupportsSpeech = typeof window !== 'undefined' && !!getSpeechCtor()

  const QUESTION_TIME = 60 // 60 seconds per question
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME)
  const timerRef = useRef<any>(null)

  // WAVEFORM VISUALIZER
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const audioContextRef = useRef<any>(null)
  const analyserRef = useRef<any>(null)
  const dataArrayRef = useRef<any>(null)
  let animationId: number
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const isLastQuestion = mainQuestionIndex + 1 === questions.length



  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Start HeyGen avatar stream on mount, stop on unmount
  useEffect(() => {
    if (token) {
      ;(window as any).__eklavUserToken = token
      setTimeout(() => heygenRef.current?.startStream(), 200)
    }
    return () => {
      heygenRef.current?.stopStream()
    }
  }, [token])

  // Poll for avatar readiness every 500ms; force-enable after 12s so browser TTS fallback kicks in
  useEffect(() => {
    const poll = setInterval(() => {
      if (heygenRef.current?.isReady()) setAvatarReady(true)
    }, 500)
    const fallback = setTimeout(() => setAvatarReady(true), 12000)
    return () => { clearInterval(poll); clearTimeout(fallback) }
  }, [])

  // QUESTION TIMER
  useEffect(() => {
    if (!isListening) return

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          stopListening()
          clearInterval(timerRef.current)
          setIsListening(false)
          setTimeLeft(QUESTION_TIME)

          // Auto-submit when time ends
          handleEvaluate()
          return QUESTION_TIME
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timerRef.current)
  }, [isListening])

  // map robotStatus -> led/eye
  useEffect(() => {
    if (isSpeaking) {
      setRobotStatus('speaking')
      setLedColor('blue')
    } else if (loadingEvaluation) {
      setRobotStatus('processing')
      setLedColor('yellow')
    } else if (showFeedback) {
      setRobotStatus('idle')
      setLedColor('green')
    } else {
      setRobotStatus('listening')
      setLedColor('blue')
    }
  }, [isSpeaking, loadingEvaluation, showFeedback])

  const drawSiriWave = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    animationId = requestAnimationFrame(drawSiriWave)

    analyserRef.current.getByteTimeDomainData(dataArrayRef.current)

    const w = canvas.width
    const h = canvas.height
    const centerY = h / 2

    ctx.clearRect(0, 0, w, h)

    const time = Date.now() * 0.002

    // TRUE SIRI COLORS
    const layers = [
      { color: 'rgba(0, 255, 200, 0.9)', amp: 26, phase: 0.0, speed: 1.8 }, // green
      { color: 'rgba(255, 60, 160, 0.9)', amp: 22, phase: 1.0, speed: 1.6 }, // pink
      { color: 'rgba(0, 140, 255, 0.9)', amp: 18, phase: 2.0, speed: 1.4 }, // blue
      { color: 'rgba(255,255,255,0.90)', amp: 14, phase: 3.0, speed: 1.2 }, // white core
    ]

    layers.forEach((layer) => {
      ctx.beginPath()
      ctx.lineWidth = 6
      ctx.strokeStyle = layer.color
      ctx.shadowBlur = 12
      ctx.shadowColor = layer.color

      let prevX = 0
      let prevY = centerY

      for (let i = 0; i < dataArrayRef.current.length; i += 3) {
        const raw = dataArrayRef.current[i] || 128
        const normalized = (raw - 128) / 128

        const x = (i / dataArrayRef.current.length) * w

        // ⭐ TRUE SIRI MOTION: amplitude + phase shift
        const y = centerY + Math.sin(time * layer.speed + i * 0.018 + layer.phase) * layer.amp + normalized * (layer.amp * 0.6)

        const cpX = (prevX + x) / 2
        ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y)

        prevX = x
        prevY = y
      }

      ctx.stroke()
    })
  }

  const drawMirrorSiriWave = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    animationId = requestAnimationFrame(drawMirrorSiriWave)

    analyserRef.current.getByteTimeDomainData(dataArrayRef.current)

    const w = canvas.width
    const h = canvas.height
    const centerY = h / 2

    ctx.clearRect(0, 0, w, h)
    ctx.lineWidth = 3

    // Mic amplitude
    const volume = dataArrayRef.current.reduce((acc: number, v: number) => acc + Math.abs(v - 128), 0) / dataArrayRef.current.length

    const ampBoost = Math.min(1.5, volume / 20) // amplitude scale

    // Layer colors
    const layers = [
      ['#00E5FF', '#00FFC8'], // cyan → green
      ['#FF00E0', '#FF6AF9'], // pink
      ['#FFFFFF', '#99FFFF'], // white glow
    ]

    layers.forEach((colors, idx) => {
      const [colorStart, colorEnd] = colors

      const gradient = ctx.createLinearGradient(0, 0, w, 0)
      gradient.addColorStop(0, colorStart)
      gradient.addColorStop(1, colorEnd)

      // wave offsets to separate 3 layers
      const offset = idx * 10

      ctx.strokeStyle = gradient
      ctx.shadowBlur = 20
      ctx.shadowColor = colorStart

      drawSingleWave(ctx, w, centerY - offset, ampBoost, idx)
      drawSingleWave(ctx, w, centerY + offset, -ampBoost, idx) // MIRROR WAVE
    })
  }

  const drawSingleWave = (ctx: CanvasRenderingContext2D, width: number, centerY: number, amp: number, layerIndex: number) => {
    const slice = width / dataArrayRef.current.length

    ctx.beginPath()

    let prevX = 0
    let prevY = centerY

    for (let i = 0; i < dataArrayRef.current.length; i += 4) {
      const v = (dataArrayRef.current[i] - 128) / 128
      const y = centerY + v * 120 * amp * (1 + layerIndex * 0.3)

      const x = (i / dataArrayRef.current.length) * width
      const cpX = (prevX + x) / 2

      ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y)

      prevX = x
      prevY = y
    }

    ctx.stroke()
  }

  const drawWaveform = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    animationId = requestAnimationFrame(drawWaveform)

    // ⭐ Use frequency data instead of time domain
    analyserRef.current.getByteFrequencyData(dataArrayRef.current)

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const barCount = 48
    const barWidth = canvas.width / barCount
    const centerY = canvas.height / 2

    for (let i = 0; i < barCount; i++) {
      // raw volume value 0–255
      const value = dataArrayRef.current[i] || 0

      // ⭐ strong responsiveness
      const barHeight = Math.max(6, (value / 255) * 90)

      // Siri neon gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      gradient.addColorStop(0, 'rgba(0,255,255,0.95)')
      gradient.addColorStop(0.5, 'rgba(0,128,255,1)')
      gradient.addColorStop(1, 'rgba(174,0,255,0.95)')
      ctx.fillStyle = gradient
      ctx.shadowColor = 'cyan'
      ctx.shadowBlur = 18

      ctx.beginPath()
      ctx.roundRect(
        i * barWidth + barWidth * 0.1,
        centerY - barHeight / 2,
        barWidth * 0.8,
        barHeight,
        6, // corner radius
      )
      ctx.fill()
    }
  }

  const drawTrueSiriWave = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    animationId = requestAnimationFrame(drawTrueSiriWave)

    analyserRef.current.getByteTimeDomainData(dataArrayRef.current)

    const w = canvas.width
    const h = canvas.height
    const centerY = h / 2

    ctx.clearRect(0, 0, w, h)

    const time = Date.now() * 0.002

    // Siri ribbon colors
    const layers = [
      { color: 'rgba(0,255,200,0.95)', amp: 35, phase: 0, speed: 1.8 }, // green
      { color: 'rgba(255,60,160,0.95)', amp: 30, phase: 1.4, speed: 1.4 }, // pink
      { color: 'rgba(0,140,255,0.95)', amp: 26, phase: 2.8, speed: 1.2 }, // blue
      { color: 'rgba(255,255,255,0.90)', amp: 20, phase: 4.0, speed: 1.0 }, // white
    ]

    layers.forEach((layer) => {
      ctx.beginPath()
      ctx.lineWidth = 5
      ctx.strokeStyle = layer.color
      ctx.shadowBlur = 18
      ctx.shadowColor = layer.color

      let prevX = 0
      let prevY = centerY

      for (let i = 0; i < dataArrayRef.current.length; i += 2) {
        const raw = dataArrayRef.current[i] || 128
        const norm = (raw - 128) / 128 // −1 to +1

        const x = (i / dataArrayRef.current.length) * w

        // Real Siri motion (phase + smooth movement)
        const sine = Math.sin(time * layer.speed + i * 0.02 + layer.phase)

        // Mix mic input + fluid sine
        const y = centerY + sine * layer.amp + norm * layer.amp * 0.8 // microphone movement

        const cpX = (prevX + x) / 2

        ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y)

        prevX = x
        prevY = y
      }

      ctx.stroke()
    })
  }

  useEffect(() => {
    if (isListening) {
      requestAnimationFrame(drawTrueSiriWave)
    }
  }, [isListening])

  /*  useEffect(() => {
     // After final question evaluation completed → auto finish
     if (showFeedback && hasSubmitted && mainQuestionIndex + 1 === questions.length) {
       setTimeout(() => handleNext(), 500)
     }
   }, [showFeedback]) */

  // eye movement
  useEffect(() => {
    if (eyeRef.current) window.clearInterval(eyeRef.current)
    const tick = () =>
      setEyeMovement({
        left: Math.random() * 10 - 5,
        right: Math.random() * 10 - 5,
      })
    const interval = robotStatus === 'speaking' || robotStatus === 'listening' ? 1800 : 3600
    eyeRef.current = window.setInterval(tick, interval)
    return () => {
      if (eyeRef.current) window.clearInterval(eyeRef.current)
    }
  }, [robotStatus])

  const browserSpeak = (text: string) => new Promise<void>((resolve) => {
    if (!('speechSynthesis' in window)) return resolve()
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.rate = 0.9
    u.pitch = 1.05
    const voices = window.speechSynthesis.getVoices()
    const femalePriority = ['google uk english female', 'microsoft zira', 'microsoft hazel', 'samantha', 'karen', 'moira', 'victoria', 'female']
    const femaleVoice = femalePriority.reduce<SpeechSynthesisVoice | undefined>(
      (found, term) => found || voices.find(v => v.name.toLowerCase().includes(term)),
      undefined
    ) || voices[0]
    if (femaleVoice) u.voice = femaleVoice
    u.onend = () => resolve()
    u.onerror = () => resolve()
    window.speechSynthesis.speak(u)
  })

  // --- Avatar speech: try HeyGen first, fall back to browser TTS if avatar silent or not ready
  const speakWithAvatar = async (text: string) => {
    setIsSpeaking(true)
    setRobotStatus('speaking')

    let heygenPlayed = false
    if (heygenRef.current?.isReady()) {
      try {
        heygenPlayed = await heygenRef.current.speak(text)
      } catch {
        // swallow — fall through to browser TTS
      }
    }

    // If HeyGen didn't produce audio (silent, not ready, or timed out) → use browser TTS
    if (!heygenPlayed) {
      await browserSpeak(text)
    }

    setIsSpeaking(false)
    setRobotStatus('listening')
  }

  useEffect(() => {
    if (!questions || questions.length === 0) return
    // Wait for avatar to be ready before speaking
    if (!avatarReady) return

    let cancelled = false

    const run = async () => {
      if (!isIntroDone) {
        const introText = "Welcome to the AI Interview. My name is Eklav. Let's start the interview."
        await speakWithAvatar(introText)
        if (!cancelled) setIsIntroDone(true)
      } else {
        if (!currentQuestion) return
        setTypedQuestion('')
        await speakWithAvatar(currentQuestion)
      }
    }

    run()

    return () => {
      cancelled = true
      if (typingTimerRef.current) clearInterval(typingTimerRef.current)
      if ('speechSynthesis' in window) window.speechSynthesis.cancel()
      setIsSpeaking(false)
      setRobotStatus('idle')
    }
  }, [currentQuestion, isIntroDone, avatarReady])

  /* -------------------------
     Speech Recognition helpers
  --------------------------*/
  // Create high-speed recognizer
  const ensureRecognition = () => {
    const Ctor = getSpeechCtor()
    if (!Ctor) return null
    if (recognitionRef.current) return recognitionRef.current

    const rec = new Ctor()
    rec.lang = 'en-US'
    rec.interimResults = true
    rec.continuous = true // needed for fast streaming

    rec.onresult = (event: any) => {
      let interim = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript

        if (event.results[i].isFinal) {
          finalRef.current += chunk + ' '
        } else {
          interim += chunk
        }
      }

      // update transcript FAST
      setTranscript((finalRef.current + interim).trim())
    }

    rec.onstart = () => {
      setIsListening(true)
      listeningHardRef.current = true
    }

    rec.onend = () => {
      setIsListening(false)

      // Auto-restart for smooth continuous mode
      if (listeningHardRef.current) {
        try {
          rec.start()
        } catch { }
      }
    }

    rec.onerror = (err: any) => {
      if (err.error === 'no-speech') return // ignore harmless error
      if (err.error === 'audio-capture') return
      console.warn('Recognition error:', err.error)

      if (err.error === 'not-allowed') {
        listeningHardRef.current = false
        setIsListening(false)
      }
    }

    recognitionRef.current = rec
    return rec
  }

  // Start fast listening
  const startListening = async () => {
    if (!browserSupportsSpeech) {
      alert('Speech recognition not supported')
      return
    }

    // Reset timer
    setTimeLeft(QUESTION_TIME)

    // Request mic access
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      alert('Mic permission denied.')
      return
    }

    // EXTRA MIC STREAM JUST FOR WAVEFORM
    let waveformStream: MediaStream
    try {
      waveformStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          noiseSuppression: false,
          echoCancellation: false,
          autoGainControl: false,
        },
      })
      waveformStream.getAudioTracks()[0].enabled = true
    } catch (err) {
      console.error('Waveform mic access failed', err)
      return
    }

    // Prepare Web Speech API
    const rec = ensureRecognition()
    if (!rec) return

    finalRef.current = ''
    setTranscript('')
    listeningHardRef.current = true

    // --------------------------
    // 🎵  WAVEFORM INITIALIZATION
    // --------------------------
    // --- Create Audio Context ---
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()

    // --- Connect mic input ---
    const source = audioContextRef.current.createMediaStreamSource(waveformStream)

    // --- Create analyser ---
    analyserRef.current = audioContextRef.current.createAnalyser()
    analyserRef.current.fftSize = 2048
    analyserRef.current.smoothingTimeConstant = 0.92

    // --- Create silent gain node ---
    const gainNode = audioContextRef.current.createGain()
    gainNode.gain.value = 0 // mute output but keep analyser alive

    // --- Correct audio graph ---
    source.connect(analyserRef.current)
    analyserRef.current.connect(gainNode)
    gainNode.connect(audioContextRef.current.destination)

    // --- Prepare buffer ---
    const bufferLength = analyserRef.current.frequencyBinCount
    dataArrayRef.current = new Uint8Array(bufferLength)

    // DRAW WAVEFORM LOOP
    // ------------------------------
    // 🔵 Siri-Style Vertical Bars
    // ------------------------------
    // DRAW WAVEFORM LOOP
    // ------------------------------
    const draw = () => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      animationId = requestAnimationFrame(draw)

      analyserRef.current.getByteTimeDomainData(dataArrayRef.current)

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const barCount = 48
      const barWidth = canvas.width / barCount
      const centerY = canvas.height / 2

      for (let i = 0; i < barCount; i++) {
        const raw = dataArrayRef.current[i * 2] || 128

        const normalized = (raw - 128) / 128

        // ⭐ Siri pulse effect (bigger bars near center)
        const distanceFromCenter = Math.abs(i - barCount / 2)
        const centerBoost = Math.max(1, 10 - distanceFromCenter * 0.3)

        const barHeight = Math.max(6, Math.abs(normalized) * 50 * centerBoost)

        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
        gradient.addColorStop(0, 'rgba(0,255,255,0.95)')
        gradient.addColorStop(0.5, 'rgba(0,128,255,1)')
        gradient.addColorStop(1, 'rgba(174,0,255,0.95)')
        ctx.fillStyle = gradient

        ctx.fillRect(i * barWidth + barWidth * 0.1, centerY - barHeight / 2, barWidth * 0.8, barHeight)
      }
    }

    // 🔥 START LOOP HERE
    requestAnimationFrame(draw)

    // Start recognition
    try {
      rec.start()
    } catch { }

    setIsListening(true)
  }

  // STOP fast listening
  const stopListening = () => {
    listeningHardRef.current = false;

    // Stop speech recognition
    try {
      recognitionRef.current?.stop();
    } catch { }

    setIsListening(false);

    // Stop video recording temporarily
    setStopRecording(true);

    // Stop waveform animation
    cancelAnimationFrame(animationId);

    // Close audio context
    if (audioContextRef.current) {
      try {
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close().catch(() => { });
        }
      } catch { }
    }

    // Clear canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };
  /*   useEffect(() => {
      if (interviewFinished && finalFeedback) {
        downloadPDF() // 🎉 auto triggers once
      }
    }, [interviewFinished, finalFeedback]) */

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop?.()
      } catch { }
      recognitionRef.current = null
      listeningHardRef.current = false
    }
  }, [])

  /* -------------------------
     Handlers: evaluate / next / finish
  --------------------------*/
  const handleEvaluate = async () => {
    if (loadingEvaluation || hasSubmitted || showFeedback) return

    const theoryFromTyped = currentAnswer.trim()
    const theoryFromVoice = transcript.trim()

    const finalTheory = theoryFromTyped || theoryFromVoice
    const exampleCode = currentExample.trim() || ''

    if (!finalTheory && !exampleCode) {
      return alert('Please speak or type something before submitting.')
    }

    stopListening()
    setLoadingEvaluation(true)
    setRobotStatus('processing')

    const technicalQuestion = isLikelyTechnicalQuestion(currentQuestion, title)

    const payload: any = {
      topic: title,
      question: currentQuestion,
      answer: {
        theory: finalTheory,
        example: exampleCode,
      },
    }

    if (technicalQuestion) {
      payload.exampleProgramRequired = true
      payload.exampleProgramFormat = 'code'
      payload.exampleProgramLanguage = 'javascript'
    }

    try {
      const res = await fetch(`${baseURL}/evaluate-answer-updated`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      const normalizedExampleProgram = normalizeExampleProgram(data.exampleProgram, currentQuestion, title)

      const newAnswer: AnswerItem = {
        question: currentQuestion,
        answer: finalTheory,
        example: exampleCode,
        videoPath: currentVideoUrl || '',
        timestamp: new Date().toISOString(),
        isFollowUp,
        feedback: data.feedback, // now an object
        idealAnswer: data.idealAnswer,
        improvementTips: data.improvementTips || [],
        rating: data.rating?.total ?? 0,
        exampleProgram: normalizedExampleProgram,
        fixedExampleCode: data.fixedExampleCode || '',
      }

      setAnswers((p) => [...p, newAnswer])
      setCurrentFeedback(newAnswer)
      setShowFeedback(true)
      setHasSubmitted(true)
      setRobotStatus('idle')

      setCurrentAnswer('')
      setTranscript('')
      setCurrentExample('') // ← reset
    } catch (err) {
      console.error('evaluate error', err)
      alert('Evaluation failed. See console.')
      setRobotStatus('idle')
    } finally {
      setLoadingEvaluation(false)
    }
  }

  const handleNext = () => {
    if (!showFeedback) {
      alert('Please submit your answer first.')
      return
    }

    setStopRecording(false);
    setIsRecordingActive(true);

    // 🔇 Stop mic completely so user cannot speak after feedback
    stopListening()
    listeningHardRef.current = false
    setIsListening(false)

    // 🧹 Reset transcript, speech buffer, and typed question for next question
    setTranscript('')
    finalRef.current = ''
    setTypedQuestion('')

    // 🔓 Unlock submit for next question
    setHasSubmitted(false)

    // 🎭 Hide previous feedback
    setShowFeedback(false)
    setCurrentFeedback(null)

    // 🤖 Robot will speak the next question
    setRobotStatus('speaking')

    // 👉 Handle pending follow-up question
    if (pendingFollowUp && !isFollowUp) {
      setIsFollowUp(true)
      setFollowUpCount((p) => p + 1)
      setPendingFollowUp(null)
      setAwaitingFollowUp(false)
      setQuestionIndex((p) => p + 1)
      return
    }

    // Reset follow-up state when moving to next main question
    if (!isFollowUp) setFollowUpCount(0)
    setIsFollowUp(false)
    setPendingFollowUp(null)
    setAwaitingFollowUp(false)

    // ⭐ Final Question → Finish interview
    // ⭐ Final Question → DO NOT auto-finish
    if (mainQuestionIndex + 1 === questions.length) {
      // Just stop here and wait for user to click "Finish Interview"
      return
    }


    // ➡️ Move to next main question
    const nextMain = questions[mainQuestionIndex + 1]
    setMainQuestionIndex((p) => p + 1)
    setQuestionsQueue((prev) => [...prev, nextMain])
    setQuestionIndex((p) => p + 1)
  }
  const finishInterview = async (finalAnswers: AnswerItem[]): Promise<AnswerItem[]> => {
    setLoadingFinalFeedback(true)
    setLoadingEvaluation(true)
    setRobotStatus('processing')
    if (setLoadingFeedback) setLoadingFeedback(true)
    try {
      const res = await fetch(`${baseURL}/final-feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ interviewId, answers: finalAnswers }),
      })
      const data = await res.json()
      const merged = finalAnswers.map((ans, i) => {
        const serverItem = data.feedback?.feedback?.[i] || {}

        return {
          ...ans,
          question: ans.question?.trim()
            ? ans.question
            : serverItem.question || questions[i],
          feedback:
            typeof serverItem.feedback === 'object'
              ? serverItem.feedback
              : ans.feedback,
          idealAnswer: serverItem.idealAnswer ?? ans.idealAnswer,
          improvementTips: serverItem.improvementTips ?? ans.improvementTips,
          rating: serverItem.rating ?? ans.rating,
          exampleProgram: normalizeExampleProgram(serverItem.exampleProgram ?? ans.exampleProgram, ans.question, title),
        }
      })

      setFinalFeedback(merged)
      setInterviewFinished(true)
      setShowFeedback(false)
      setCurrentFeedback(null)
      setRobotStatus('idle')
      return merged
    } catch (err) {
      console.error('final feedback', err)
      alert('Could not get final feedback.')
      setRobotStatus('idle')
      return finalAnswers
    } finally {
      setLoadingEvaluation(false)
      setLoadingFinalFeedback(false)
      if (setLoadingFeedback) setLoadingFeedback(false)
    }
  }

  const submitScoreIfNeeded = async (mergedAnswers: AnswerItem[]) => {
    if (!meta?.interviewType || !meta.attemptId) return

    const scores = mergedAnswers.map((a) => ({
      question: a.question,
      score: typeof a.rating === 'object' ? (a.rating?.total ?? 0) : (a.rating ?? 0),
    }))

    if (meta.interviewType === 'resume') {
      try {
        await fetch(`${baseURL}/api/resume-based-interview/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ attemptId: meta.attemptId, scores }),
        })
      } catch (err) {
        console.error('Resume score submit failed', err)
      }
    }
  }



  // transcript / video callbacks
  const handleTranscriptUpdate = (text: string) => setTranscript(text)
  const handleVideoUpload = (url: string) => setCurrentVideoUrl(url)

  // pdf
  const pdfRef = useRef<HTMLDivElement | null>(null)
  // improved downloadPDF - replaces your existing downloadPDF
  const downloadPDF = async () => {
    if (!pdfRef.current || isDownloadingPdf) return

    setIsDownloadingPdf(true) // 🔥 START SPINNER

    try {
      // Ensure DOM is fully rendered
      await new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve))
        setTimeout(resolve, 120)
      })

      const canvas = await html2canvas(pdfRef.current as HTMLElement, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: '#ffffff',
      })

      const imgData = canvas.toDataURL('image/png')

      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()

      const imgProps = pdf.getImageProperties(imgData)
      const imgHeightMm = (imgProps.height * pdfWidth) / imgProps.width

      if (imgHeightMm <= pdfHeight) {
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeightMm)
      } else {
        const pageCanvas = document.createElement('canvas')
        const pageCtx = pageCanvas.getContext('2d')!
        const pxPerMm = canvas.width / pdfWidth
        const pageHeightPx = Math.floor(pdfHeight * pxPerMm)

        pageCanvas.width = canvas.width
        pageCanvas.height = pageHeightPx

        let y = 0
        let page = 0

        while (y < canvas.height) {
          pageCtx.clearRect(0, 0, pageCanvas.width, pageCanvas.height)
          pageCtx.drawImage(canvas, 0, y, canvas.width, pageHeightPx, 0, 0, pageCanvas.width, pageCanvas.height)

          const pageData = pageCanvas.toDataURL('image/png')

          if (page > 0) pdf.addPage()
          pdf.addImage(pageData, 'PNG', 0, 0, pdfWidth, pdfHeight)

          y += pageHeightPx
          page++
        }
      }

      pdf.save('interview-feedback.pdf')
    } catch (err) {
      console.error('PDF generation failed', err)
      alert('Could not generate PDF.')
    } finally {
      setIsDownloadingPdf(false) // ✅ STOP SPINNER
    }
  }

  // Small Robot visual component
  // const RobotSmall = () => (
  //   <div className="robot-small">
  //     <svg width="60" height="60" viewBox="0 0 100 100">
  //       <circle cx="50" cy="50" r="48" fill="#1e1e1e" stroke="#555" strokeWidth="4" />

  //       {/* Eyes */}
  //       <circle cx="35" cy="40" r="8" fill="#00e5ff" className="eye-left" />
  //       <circle cx="65" cy="40" r="8" fill="#00e5ff" className="eye-right" />

  //       {/* Mouth */}
  //       <rect x="32" y="60" width="36" height="8" rx="4" fill="#00e5ff" className="mouth" />
  //     </svg>
  //   </div>
  // )

  // For displaying transcript + interim text
  const getDisplayedTranscript = () => {
    const rec = recognitionRef.current as any
    const interim = rec?._latestInterim ?? ''
    if (interim && transcript) return `${transcript} ${interim}`
    if (interim && !transcript) return interim
    return transcript
  }

  // small inline styles for circular buttons (Zoom-like)
  const circleBtnBase: React.CSSProperties = {
    width: 64,
    height: 64,
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 6px 18px rgba(0,0,0,0.16)',
    border: 'none',
  }

  const circleBtnStyleGreen = {
    ...circleBtnBase,
    background: '#28a745',
  }

  const circleBtnStyleRed = {
    ...circleBtnBase,
    background: '#dc3545',
  }

  const circleBtnStyleBlue = {
    ...circleBtnBase,
    background: '#0d6efd',
  }

  const canSubmit =
    !loadingEvaluation &&
    !showFeedback &&
    !hasSubmitted &&
    (
      transcript.trim().length > 0 ||
      currentExample.trim().length > 0 ||
      currentAnswer.trim().length > 0
    )

  const formattedFixedExampleCode = formatCodeSnippet(currentFeedback?.fixedExampleCode || '')
  const formattedExampleProgramCode = formatCodeSnippet(currentFeedback?.exampleProgram?.code || '')
  const currentExampleProgramIsCode = isCodeLanguage(currentFeedback?.exampleProgram?.language)
  const hasDistinctFixedExampleCode =
    !!formattedFixedExampleCode &&
    normalizeCodeForCompare(formattedFixedExampleCode) !== normalizeCodeForCompare(formattedExampleProgramCode)


  return (
    <div className="interview-layout-with-logic">
      {/* Full-screen connecting overlay — HeyGenAvatar still mounts behind it */}
      {!avatarReady && !interviewFinished && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(10,12,18,0.97)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24,
        }}>
          <Spinner animation="border" variant="warning" style={{ width: 64, height: 64, borderWidth: 5 }} />
          <h4 className="fw-bold text-light text-center mb-0">Connecting to AI Interview</h4>
          <p className="text-secondary text-center mb-0">Please wait while we set up your session...</p>
        </div>
      )}
      <Container fluid className="px-2 px-md-4 py-3 interview-page-bg">
        {/* HEADER */}
        <Row className="mb-3 align-items-center">
          <Col xs={12} md>
            <h5 className="fw-bold mb-1">Interview for {title}</h5>
            <small className="text-light opacity-75">
              Question {mainQuestionIndex + 1} of {questions.length}
              {isFollowUp ? ' • Follow-up' : ''}
            </small>
          </Col>

          <Col xs="auto" className="d-flex align-items-center mt-2 mt-md-0 pe-md-5 me-md-3">
            <Avatar name={user?.fullName || 'User'} image={user?.profileImage} size={isMobile ? 32 : 40} className="me-2" />

            {/* TEXT: responsive */}
            <div className="d-flex flex-column">
              <strong className="text-light">{isMobile ? user?.fullName || 'User' : user?.email || 'Student'}</strong>

              {/* Optional subtitle only on mobile */}
              {isMobile && <small className="text-light opacity-75">Student</small>}
            </div>
          </Col>
        </Row>

        {!interviewFinished ? (
          <Row className="g-3">
            {/* ================= LEFT / TOP (VIDEO) ================= */}
            <Col xs={12} md={7}>
              <Card
                className={`shadow-sm rounded-4 d-flex flex-column ${isMobile ? 'p-2' : 'p-3'}`}
                style={{
                  minHeight: isMobile ? 'auto' : 520, // ⭐ helps align with right card
                }}>
                {/* SPLIT-SCREEN: HeyGen Avatar (left) + Student Cam (right) */}
                <div
                  className="rounded-4 d-flex"
                  style={{
                    height: isMobile ? 240 : 420,
                    gap: 6,
                  }}>
                  {/* Left half — AI Interviewer (HeyGen) */}
                  <div style={{ flex: 1, position: 'relative', borderRadius: 12, overflow: 'hidden', background: '#000' }}>
                    {/* Label */}
                    <div style={{ position: 'absolute', top: 8, left: 10, zIndex: 10, background: 'rgba(0,0,0,0.65)', borderRadius: 6, padding: '3px 9px', display: 'flex', alignItems: 'center', gap: 5 }}>
                      {!avatarReady && (
                        <div style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid #ff7a00', borderTopColor: 'transparent', animation: 'avatarSpin 0.8s linear infinite' }} />
                      )}
                      <small style={{ color: avatarReady ? '#ff7a00' : '#aaa', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.04em' }}>
                        {avatarReady ? 'AI INTERVIEWER' : 'Connecting...'}
                      </small>
                      <style>{`@keyframes avatarSpin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                    <div style={{ height: '100%' }}>
                      <style>{`.hg-root { min-height: 0 !important; border-radius: 0 !important; background: #000 !important; }`}</style>
                      <HeyGenAvatar
                        ref={heygenRef}
                        isTyping={robotStatus === 'processing'}
                        isListening={false}
                        isSpeaking={isSpeaking}
                        onReady={() => setAvatarReady(true)}
                        onSpeakStart={() => {
                          if (isIntroDoneRef.current) startTyping(currentQuestionRef.current)
                        }}
                      />
                    </div>
                  </div>

                  {/* Right half — Student Camera */}
                  <div style={{ flex: 1, position: 'relative', height: '100%', borderRadius: 12, overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 8, right: 10, zIndex: 10, background: 'rgba(0,0,0,0.55)', borderRadius: 6, padding: '2px 8px' }}>
                      <small style={{ color: '#4ade80', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.04em' }}>YOU</small>
                    </div>
                    <div style={{ width: '100%', height: '100%' }}>
                      <VideoRecorderUpdated interviewId={interviewId} token={token} stopRecording={stopRecording || !isRecordingActive} onVideoUpload={handleVideoUpload} />
                    </div>
                  </div>
                </div>

                {/* GRID CONTAINER */}
                <div className="bg-dark bg-opacity-75 rounded-4 p-3 my-3 border border-secondary">
                  <div className="row align-items-center">

                    {/* LEFT: Status Indicators */}
                    <div className="col-md-4">
                      <div className="d-flex align-items-center gap-3">
                        {/* Timer */}
                        {/* <div className="text-center">
                          <div className={`fw-bold ${timeLeft < 10 ? 'text-danger' : 'text-success'}`}
                            style={{ fontSize: '2rem', lineHeight: '1' }}>
                            {timeLeft}
                          </div>
                          <small className="text-light-emphasis">seconds</small>
                        </div> */}

                        {/* Mic Status */}
                        <div className="d-flex align-items-center gap-2">
                          <div className="position-relative">
                            {isListening ? (
                              <>
                                <div className="position-absolute top-50 start-50 translate-middle"
                                  style={{
                                    width: '28px',
                                    height: '28px',
                                    border: '2px solid #0dcaf0',
                                    borderRadius: '50%',
                                    animation: 'pulse 1.5s infinite',
                                    opacity: '0.5',
                                  }}
                                ></div>
                                <GlowMic listening size={20} />
                              </>
                            ) : (
                              <i className="bi bi-mic text-secondary fs-5"></i>
                            )}
                          </div>
                          <div>
                            <small className={`fw-medium ${isListening ? 'text-info' : 'text-light-emphasis'}`}>
                              {isListening ? 'Recording' : 'Ready'}
                            </small>
                            {isListening && (
                              <div className="text-info" style={{ fontSize: '0.7rem' }}>
                                <i className="bi bi-circle-fill me-1"></i>
                                Live
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* CENTER: Divider (visible on desktop) */}
                    <div className="col-md-1 d-none d-md-block">
                      <div className="border-start border-secondary h-100"></div>
                    </div>

                    {/* RIGHT: Action Buttons */}
                    <div className="col-md-7">
                      <div className="d-flex align-items-center justify-content-end gap-3">

                        {/* Record/Stop Button - FIXED: Toggle between start/stop */}
                        <Button
                          onClick={isListening ? stopListening : startListening}
                          disabled={showFeedback || hasSubmitted}
                          variant={isListening ? "danger" : "success"}
                          className={`rounded-pill d-flex align-items-center gap-2 px-4 py-2 ${showFeedback || hasSubmitted ? 'opacity-50' : ''
                            }`}
                          style={{
                            minWidth: '120px',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {isListening ? (
                            <>
                              <i className="bi bi-stop-fill"></i>
                              Stop Recording
                            </>
                          ) : (
                            <>
                              <i className="bi bi-mic-fill"></i>
                              Start Recording
                            </>
                          )}
                        </Button>

                        {/* Next Button — hidden on last question */}
                        {!isLastQuestion && (
                          <Button
                            onClick={handleNext}
                            disabled={!showFeedback}
                            variant={showFeedback ? "primary" : "secondary"}
                            className="rounded-pill d-flex align-items-center gap-2 px-4 py-2"
                            style={{
                              minWidth: '120px',
                              opacity: showFeedback ? 1 : 0.5,
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <i className="bi bi-arrow-right"></i>
                            Next Question
                          </Button>
                        )}

                      </div>
                    </div>

                  </div>
                </div>
              </Card>
            </Col>

            {/* ================= RIGHT / BOTTOM ================= */}
            <Col xs={12} md={5}>
              <Card className="shadow-sm p-3 rounded-4">
                {/* QUESTION */}
                <div className="mb-3 p-3 rounded-3 bg-dark border border-secondary">
                  <h6 className="fw-bold text-info mb-2">🎯 Interview Question</h6>

                  {!isIntroDone ? (
                    <p className="mb-0 text-secondary fst-italic" style={{ fontSize: '0.9rem' }}>
                      AI Interviewer is introducing the session...
                    </p>
                  ) : (
                    <p className="mb-0 fs-5 fw-bold lh-base"
                      style={{
                        fontFamily: "'Poppins', sans-serif",
                        color: '#ffa726',
                        letterSpacing: '0.3px',
                        textShadow: '0 1px 3px rgba(255, 167, 38, 0.2)',
                        minHeight: '2.5rem',
                      }}>
                      {typedQuestion}
                      {typedQuestion.length < currentQuestion.length && (
                        <span style={{ display: 'inline-block', width: 2, height: '1em', background: '#ffa726', marginLeft: 2, verticalAlign: 'text-bottom', animation: 'blink 0.8s step-end infinite' }} />
                      )}
                      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
                    </p>
                  )}
                </div>
                {/* TRANSCRIPT */}
                <div className="mb-3">
                  <small className="text-muted">🎤 Voice Transcript</small>
                  <div
                    className="transcript-box p-2 rounded"
                    style={{
                      minHeight: 80,
                      maxHeight: isMobile ? 120 : 180,
                      overflowY: 'auto',
                    }}>
                    {getDisplayedTranscript() || 'Your voice transcript will appear here...'}
                  </div>
                </div>

                {/* CODE EDITOR */}
                <small className="text-muted">🧩 Example Code (optional)</small>
                <div className="terminal-box mt-1 mb-3">
                  <CodeMirror
                    value={currentExample}
                    height={isMobile ? '140px' : '220px'}
                    theme={oneDark}
                    extensions={[javascript()]}
                    onChange={(value) => setCurrentExample(value)}
                  />
                </div>
                {/* SUBMIT */}
                <Button
                  variant="primary"
                  className="fw-bold w-100"
                  disabled={!canSubmit}
                  onClick={handleEvaluate}
                >
                  {loadingEvaluation ? (
                    <>
                      <Spinner size="sm" /> Analyzing...
                    </>
                  ) : (
                    'Submit Answer'
                  )}
                </Button>
                {isLastQuestion && showFeedback && currentFeedback && (
                  <Button
                    variant="success"
                    className="fw-bold w-100 mt-2"
                    onClick={async () => {
                      const mergedAnswers = await finishInterview([...answers])
                      await submitScoreIfNeeded(mergedAnswers)
                      // modal stays open → PDF section renders via interviewFinished state
                    }}
                  >
                    Finish Interview
                  </Button>
                )}

              </Card>
            </Col>
          </Row>
        ) : (
          /* FINAL SUMMARY stays same */
          interviewFinished && finalFeedback ? (
            <div className="text-center py-5">
              <h4 className="fw-bold mb-4">🎉 Interview Completed!</h4>
              <p className="text-light mb-4">Your results have been saved. Download your report below.</p>

              <div className="d-flex justify-content-center gap-3 flex-wrap">
                <Button
                  variant="success"
                  className="fw-bold px-5 py-2"
                  disabled={isDownloadingPdf}
                  onClick={downloadPDF}
                >
                  {isDownloadingPdf ? (
                    <>
                      <Spinner size="sm" /> Generating PDF...
                    </>
                  ) : (
                    '📄 Download Interview Report'
                  )}
                </Button>

                <Button
                  variant="outline-secondary"
                  className="fw-bold px-5 py-2"
                  onClick={() => onComplete?.()}
                >
                  Close
                </Button>
              </div>
            </div>
          ) : null
        )}
        {/* 🔽 PDF CONTENT (HIDDEN) */}
        <div
          ref={pdfRef}
          style={{
            position: 'absolute',
            left: '-9999px',
            top: 0,
            width: '794px', // A4 width @ 96dpi
            background: '#ffffff',
            padding: '24px',
            color: '#000',
          }}
        >
          <h2 style={{ marginBottom: 16 }}>Interview Feedback Report</h2>

          <p><strong>Candidate:</strong> {user?.fullName}</p>
          <p><strong>Topic:</strong> {title}</p>
          <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>

          <hr />

          {finalFeedback?.map((item: any, idx: number) => {
            return (

              <div key={idx} style={{
                marginBottom: 32, pageBreakInside: 'avoid',   // 🔥 CRITICAL
                breakInside: 'avoid',
              }}>
                {/* QUESTION */}
                <h4
                  style={{
                    marginBottom: 8,
                    color: '#000',        // 🔥 FORCE BLACK
                    fontWeight: 500,
                  }}
                >
                  Q{idx + 1}. {item.question}
                </h4>



                {/* USER ANSWER */}
                <p><strong>Your Answer:</strong></p>
                <p>{item.answer?.trim() ? item.answer : '— Skipped —'}</p>

                {/* AI FEEDBACK */}

                {item.feedback && (
                  <>
                    <p><strong>AI Feedback:</strong></p>

                    {item.feedback.theory && (
                      <p>
                        <strong>Theory:</strong><br />
                        {item.feedback.theory}
                      </p>
                    )}

                    {item.feedback.example && (
                      <p>
                        <strong>Example:</strong><br />
                        {item.feedback.example}
                      </p>
                    )}
                  </>
                )}


                {/* IDEAL ANSWER */}
                {item.idealAnswer && (
                  <>
                    <p><strong>Ideal Answer:</strong></p>
                    <p>{item.idealAnswer}</p>
                  </>
                )}

                {/* EXAMPLE PROGRAM */}
                {item.exampleProgram && (
                  <>
                    <p><strong>Example Program:</strong></p>
                    {isCodeLanguage((item.exampleProgram as any)?.language) ? (
                      <pre
                        style={{
                          background: '#f5f5f5',
                          padding: '12px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          overflowX: 'auto',
                        }}
                      >
                        {formatCodeSnippet(
                          typeof item.exampleProgram === 'string'
                            ? item.exampleProgram
                            : item.exampleProgram.code
                        )}
                      </pre>
                    ) : (
                      <div
                        style={{
                          background: '#f5f5f5',
                          padding: '12px',
                          borderRadius: '4px',
                          fontSize: '14px',
                          lineHeight: 1.6,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                        }}
                      >
                        {typeof item.exampleProgram === 'string'
                          ? item.exampleProgram
                          : item.exampleProgram.code}
                      </div>
                    )}
                  </>
                )}

                {/* IMPROVEMENT TIPS */}
                {Array.isArray(item.improvementTips) && item.improvementTips.length > 0 && (
                  <>
                    <p><strong>Improvement Tips:</strong></p>
                    <ul>
                      {item.improvementTips.map((tip: string, i: number) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </>
                )}

                {/* SCORE */}
                <p style={{ marginTop: 8 }}>
                  <strong>Score:</strong> {item.rating?.total ?? 0}/10
                </p>

                <hr />
              </div>
            )

          })}

        </div>

        {/* ================= AI FEEDBACK ================= */}
        {showFeedback && currentFeedback && (
          <Card className="mt-4 p-4 rounded-3 border border-warning-subtle shadow-lg bg-dark bg-gradient">
            {/* Header with better visual hierarchy */}
            <div className="d-flex align-items-start justify-content-between mb-4">
              <div className="d-flex align-items-center">
                <div className="bg-warning bg-opacity-20 p-2 rounded-circle me-3">
                  <span className="text-warning fs-5">📊</span>
                </div>
                <div>
                  <h5 className="fw-bold text-light mb-1">AI Evaluation</h5>
                  <small className="text-light-emphasis">Detailed feedback and analysis</small>
                </div>
              </div>

              {/* Score badge positioned in header */}
              {typeof currentFeedback.rating === 'number' && (
                <Badge
                  bg={currentFeedback.rating >= 7 ? 'success' : currentFeedback.rating >= 4 ? 'warning' : 'danger'}
                  className="px-3 py-2 fw-bold rounded-pill shadow-sm"
                >
                  {currentFeedback.rating}/10
                </Badge>
              )}
            </div>

            {/* Content area with better spacing */}
            <div className="d-flex flex-column gap-4">

              {/* THEORY FEEDBACK */}
              {currentFeedback.feedback?.theory && (
                <div className="p-3 rounded-3 bg-black bg-opacity-25 border-start border-3 border-info">
                  <div className="d-flex align-items-center mb-2">
                    <span className="text-info me-2 fs-5">📝</span>
                    <h6 className="text-info fw-bold mb-0">Theory Feedback</h6>
                  </div>
                  <p className="text-light mb-0 mt-2 lh-base fs-6">
                    {currentFeedback.feedback.theory}
                  </p>
                </div>
              )}

              {/* EXAMPLE FEEDBACK */}
              {currentFeedback.feedback?.example && (
                <div className="p-3 rounded-3 bg-black bg-opacity-25 border-start border-3 border-info">
                  <div className="d-flex align-items-center mb-2">
                    <span className="text-info me-2 fs-5">⚙️</span>
                    <h6 className="text-info fw-bold mb-0">Example Feedback</h6>
                  </div>
                  <p className="text-light mb-0 mt-2 lh-base fs-6">
                    {currentFeedback.feedback.example}
                  </p>
                </div>
              )}

              {/* IDEAL ANSWER - More prominent */}
              {currentFeedback.idealAnswer && (
                <div className="p-3 rounded-3 bg-success bg-opacity-10 border border-success border-2">
                  <div className="d-flex align-items-center mb-2">
                    <div className="bg-success bg-opacity-25 p-1 rounded-2 me-2">
                      <span className="text-success fs-5">✅</span>
                    </div>
                    <h6 className="text-success fw-bold mb-0">Ideal Answer</h6>
                  </div>
                  <p className="text-light mb-0 mt-2 lh-base fs-6">
                    {currentFeedback.idealAnswer}
                  </p>
                </div>
              )}

              {/* FIXED EXAMPLE CODE */}
              {hasDistinctFixedExampleCode && currentExampleProgramIsCode && (
                <div className="p-3 rounded-3 bg-black bg-opacity-50 border border-secondary">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="d-flex align-items-center">
                      <span className="text-info me-2 fs-5">🔧</span>
                      <h6 className="text-info fw-bold mb-0">Corrected Example Code</h6>
                    </div>
                    <Badge bg="dark" className="px-2 py-1">JavaScript</Badge>
                  </div>
                  <div className="mt-2 rounded-2 overflow-hidden border border-dark">
                    <CodeMirror
                      value={formattedFixedExampleCode}
                      height="180px"
                      theme={oneDark}
                      extensions={[javascript(), EditorView.lineWrapping]}
                      editable={false}
                      basicSetup={{
                        lineNumbers: true,
                        highlightActiveLineGutter: false,
                        foldGutter: false,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* FULL EXAMPLE PROGRAM */}
              {currentFeedback.exampleProgram && (
                <div className="p-3 rounded-3 bg-black bg-opacity-50 border border-secondary">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="d-flex align-items-center">
                      <span className="text-info me-2 fs-5">📦</span>
                      <div>
                        <h6 className="text-info fw-bold mb-0">Example Program</h6>
                        <small className="text-light-emphasis">{currentFeedback.exampleProgram.title}</small>
                      </div>
                    </div>
                    <Badge bg="secondary" className="px-2 py-1">
                      {currentFeedback.exampleProgram.language.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="mt-2 rounded-2 overflow-hidden border border-dark">
                    {currentExampleProgramIsCode ? (
                      <CodeMirror
                        value={formattedExampleProgramCode}
                        height="240px"
                        theme={oneDark}
                        extensions={[javascript(), EditorView.lineWrapping]}
                        editable={false}
                        basicSetup={{
                          lineNumbers: true,
                          highlightActiveLineGutter: false,
                          foldGutter: false,
                        }}
                      />
                    ) : (
                      <div
                        className="p-3"
                        style={{
                          color: '#f8f9fa',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          lineHeight: 1.7,
                          fontSize: '15px',
                        }}
                      >
                        {currentFeedback.exampleProgram.code}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* IMPROVEMENT TIPS */}
              {Array.isArray(currentFeedback.improvementTips) && currentFeedback.improvementTips.length > 0 && (
                <div className="p-3 rounded-3 bg-info bg-opacity-10 border-start border-3 border-info">
                  <div className="d-flex align-items-center mb-2">
                    <span className="text-info me-2 fs-5">🚀</span>
                    <h6 className="text-info fw-bold mb-0">Improvement Tips</h6>
                  </div>
                  <ul className="text-light ps-3 mb-0 mt-2">
                    {currentFeedback.improvementTips.map((tip, i) => (
                      <li key={i} className="mb-2 lh-base fs-6">
                        <span className="text-info me-2">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* FOLLOW-UP QUESTION */}
              {(currentFeedback as any)?.followUpQuestion && (
                <div className="p-3 rounded-3 bg-warning bg-opacity-10 border border-warning">
                  <div className="d-flex align-items-start">
                    <div className="bg-warning bg-opacity-20 p-1 rounded-2 me-3 mt-1">
                      <span className="text-warning fs-5">🤔</span>
                    </div>
                    <div>
                      <h6 className="text-warning fw-bold mb-1">Follow-up Question</h6>
                      <p className="text-light mb-0 mt-2 lh-base fs-6">
                        {(currentFeedback as any).followUpQuestion}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Optional: Footer with timestamp or additional info */}
            <div className="text-end mt-4 pt-3 border-top border-secondary-subtle">
              <small className="text-light-emphasis">AI-generated feedback • Refresh to see updates</small>
            </div>
          </Card>
        )}
      </Container>
    </div>
  )
}

export default InterviewUILayoutWithLogic
