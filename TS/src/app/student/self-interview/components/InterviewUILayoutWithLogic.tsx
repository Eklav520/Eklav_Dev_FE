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
import GazeScanOverlay from './GazeScanOverlay'
import { useGazeDetection } from './useGazeDetection'
import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { java } from '@codemirror/lang-java'
import { cpp } from '@codemirror/lang-cpp'
import { php } from '@codemirror/lang-php'
import { go } from '@codemirror/lang-go'
import { rust } from '@codemirror/lang-rust'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { sql } from '@codemirror/lang-sql'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorView } from '@codemirror/view'

const CODE_LANGUAGES = [
  { label: 'JavaScript', extension: javascript() },
  { label: 'Python', extension: python() },
  { label: 'Java', extension: java() },
  { label: 'C++', extension: cpp() },
  { label: 'PHP', extension: php() },
  { label: 'Go', extension: go() },
  { label: 'Rust', extension: rust() },
  { label: 'HTML', extension: html() },
  { label: 'CSS', extension: css() },
  { label: 'SQL', extension: sql() },
] as const
import { FaMicrophone, FaCode, FaBullseye, FaClipboardList, FaCog, FaCheckCircle, FaBoxOpen, FaChartBar, FaLightbulb, FaShieldAlt, FaEye, FaHandPaper, FaVideo, FaSun, FaVolumeUp, FaUserCheck, FaClock, FaStop, FaStar, FaArrowRight, FaCheck } from 'react-icons/fa'

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

// Green → yellow → orange → red taper used by the answer waveform, matching
// the equalizer reference (tall/green near the mic, short/red at the edges).
const WAVE_COLOR_STOPS: [number, [number, number, number]][] = [
  [0,    [22, 163, 74]],   // green
  [0.45, [132, 204, 22]],  // lime
  [0.7,  [245, 158, 11]],  // orange
  [1,    [239, 68, 68]],   // red
]

const waveColorAt = (t: number) => {
  const clamped = Math.min(1, Math.max(0, t))
  for (let i = 0; i < WAVE_COLOR_STOPS.length - 1; i++) {
    const [t0, c0] = WAVE_COLOR_STOPS[i]
    const [t1, c1] = WAVE_COLOR_STOPS[i + 1]
    if (clamped >= t0 && clamped <= t1) {
      const localT = t1 === t0 ? 0 : (clamped - t0) / (t1 - t0)
      const r = Math.round(c0[0] + (c1[0] - c0[0]) * localT)
      const g = Math.round(c0[1] + (c1[1] - c0[1]) * localT)
      const b = Math.round(c0[2] + (c1[2] - c0[2]) * localT)
      return `rgb(${r},${g},${b})`
    }
  }
  const last = WAVE_COLOR_STOPS[WAVE_COLOR_STOPS.length - 1][1]
  return `rgb(${last[0]},${last[1]},${last[2]})`
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
      title: `${title} â€¢ ${summarizeNarrative(code)}`,
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
  const [codeLanguage, setCodeLanguage] = useState<string>(CODE_LANGUAGES[0].label)
  const [answerTab, setAnswerTab] = useState<'transcript' | 'code'>('transcript')
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [loadingFinalFeedback, setLoadingFinalFeedback] = useState(false)
  const [stopRecording, setStopRecording] = useState(false);
  const [isRecordingActive, setIsRecordingActive] = useState(true);
  const [centerTab, setCenterTab] = useState<'question' | 'feedback'>('question')
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null)
  const [lightingLabel, setLightingLabel] = useState<string>('Checking...')
  const [lightingOk, setLightingOk] = useState(true)


  // speech synth
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null)
  const [isIntroDone, setIsIntroDone] = useState(false)
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

        // â­ TRUE SIRI MOTION: amplitude + phase shift
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
      ['#00E5FF', '#00FFC8'], // cyan â†' green
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

    // â­ Use frequency data instead of time domain
    analyserRef.current.getByteFrequencyData(dataArrayRef.current)

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const barCount = 48
    const barWidth = canvas.width / barCount
    const centerY = canvas.height / 2

    for (let i = 0; i < barCount; i++) {
      // raw volume value 0â€"255
      const value = dataArrayRef.current[i] || 0

      // â­ strong responsiveness
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

    // Equalizer mirrored from the center: tall/green near the mic,
    // tapering down to short/red bars at the outer edges.
    const barCount = 32
    const half = barCount / 2
    const barWidth = w / barCount
    const step = Math.floor(dataArrayRef.current.length / barCount) || 1

    for (let i = 0; i < barCount; i++) {
      const raw = dataArrayRef.current[i * step] || 128
      const norm = Math.abs(raw - 128) / 128 // 0 to 1
      const distFromCenter = Math.abs(i - (half - 0.5)) / half // 0 center → 1 edge
      const envelope = 1 - distFromCenter * 0.85
      const barHeight = Math.max(3, (0.35 + norm * 0.65) * envelope * h * 0.9)

      ctx.fillStyle = waveColorAt(distFromCenter)
      ctx.beginPath()
      ctx.roundRect(
        i * barWidth + barWidth * 0.2,
        centerY - barHeight / 2,
        barWidth * 0.6,
        barHeight,
        barWidth * 0.3,
      )
      ctx.fill()
    }
  }

  useEffect(() => {
    if (isListening) {
      requestAnimationFrame(drawTrueSiriWave)
    }
  }, [isListening])

  /*  useEffect(() => {
     // After final question evaluation completed â†' auto finish
     if (showFeedback && hasSubmitted && mainQuestionIndex + 1 === questions.length) {
       setTimeout(() => handleNext(), 500)
     }
   }, [showFeedback]) */

  // Real lighting detection — samples video frame brightness every 2s
  useEffect(() => {
    if (!videoElement) return
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 48
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const measure = () => {
      try {
        if (videoElement.readyState < 2) return
        ctx.drawImage(videoElement, 0, 0, 64, 48)
        const pixels = ctx.getImageData(0, 0, 64, 48).data
        let sum = 0
        for (let i = 0; i < pixels.length; i += 4) {
          sum += 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2]
        }
        const brightness = sum / (pixels.length / 4) // 0–255
        if (brightness < 35) {
          setLightingLabel('Too Dark'); setLightingOk(false)
        } else if (brightness < 75) {
          setLightingLabel('Dim'); setLightingOk(false)
        } else if (brightness > 220) {
          setLightingLabel('Too Bright'); setLightingOk(false)
        } else {
          setLightingLabel('Well Lit'); setLightingOk(true)
        }
      } catch { /* cross-origin or not ready */ }
    }

    measure() // run immediately
    const id = setInterval(measure, 2000)
    return () => clearInterval(id)
  }, [videoElement])

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

  // --- Speech Synthesis: intro + question readout
  useEffect(() => {
    if (!questions || questions.length === 0) return

    // play intro once then questions
    if (!isIntroDone) {
      const introText = "Welcome to the AI Interview. My name is Eklav. Let's start the interview."
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
        const u = new SpeechSynthesisUtterance(introText)
        speechRef.current = u
        u.rate = 0.95
        u.pitch = 0.9
        u.onstart = () => {
          setIsSpeaking(true)
          setRobotStatus('speaking')
        }
        u.onend = () => {
          setIsSpeaking(false)
          setRobotStatus('listening')
          setTimeout(() => setIsIntroDone(true), 300)
        }
        const voices = window.speechSynthesis.getVoices()
        const voice = voices.find((v) => (v.name || '').includes('Google') || (v.lang || '').includes('en'))
        if (voice) u.voice = voice
        window.speechSynthesis.speak(u)
      } else {
        setIsIntroDone(true)
      }
      return
    }

    // read current question, then (optionally) start listening
    if (!currentQuestion) return
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(currentQuestion)
      speechRef.current = u
      u.rate = 0.88
      u.pitch = 0.85
      u.onstart = () => {
        setIsSpeaking(true)
        setRobotStatus('speaking')
      }
      u.onend = () => {
        setIsSpeaking(false)
        setRobotStatus('listening')
        // do not auto-start listening by default â€" leave manual control for stability
      }
      const voices = window.speechSynthesis.getVoices()
      const v = voices.find((vv) => (vv.name || '').includes('Microsoft') || (vv.name || '').includes('Google'))
      if (v) u.voice = v
      setTimeout(() => window.speechSynthesis.speak(u), 250)
    }
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel()
      setIsSpeaking(false)
      setRobotStatus('idle')
    }
  }, [currentQuestion, isIntroDone])

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
    // ðŸŽµ  WAVEFORM INITIALIZATION
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
    // ðŸ"µ Siri-Style Vertical Bars
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

        // â­ Siri pulse effect (bigger bars near center)
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

    // ðŸ"¥ START LOOP HERE
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
        downloadPDF() // ðŸŽ‰ auto triggers once
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

  useEffect(() => {
    if (showFeedback) setCenterTab('feedback')
    else setCenterTab('question')
  }, [showFeedback])

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
        rating: data.rating ?? 0,
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

    // ðŸ"‡ Stop mic completely so user cannot speak after feedback
    stopListening()
    listeningHardRef.current = false
    setIsListening(false)

    // ðŸ§¹ Reset transcript & speech buffer for next question
    setTranscript('')
    finalRef.current = ''
    setCurrentExample('')
    setAnswerTab('transcript')
    setCodeLanguage(CODE_LANGUAGES[0].label)

    // ðŸ"" Unlock submit for next question
    setHasSubmitted(false)

    // ðŸŽ­ Hide previous feedback
    setShowFeedback(false)
    setCurrentFeedback(null)

    // ðŸ¤– Robot will speak the next question
    setRobotStatus('speaking')

    // ðŸ'‰ Handle pending follow-up question
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

    // â­ Final Question â†' Finish interview
    // â­ Final Question â†' DO NOT auto-finish
    if (mainQuestionIndex + 1 === questions.length) {
      // Just stop here and wait for user to click "Finish Interview"
      return
    }


    // âž¡ï¸ Move to next main question
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
      const monitoring = {
        eyeViolations: gaze.violationCount,
        headViolations: gaze.headViolationCount,
        faceDetected: gaze.faceDetected,
        lightingOk,
        lightingLabel,
        recordingActive: isRecordingActive,
      }

      const res = await fetch(`${baseURL}/final-feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ interviewId, answers: finalAnswers, monitoring }),
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

    setIsDownloadingPdf(true) // ðŸ"¥ START SPINNER

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
      setIsDownloadingPdf(false) // âœ… STOP SPINNER
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


  // Gaze detection (runs whenever we have a live video element)
  // Typing a code answer means legitimately looking at the editor/keyboard —
  // exempt that from eye/head "away" violations.
  const gaze = useGazeDetection(videoElement, !interviewFinished, answerTab === 'code' && !showFeedback)

  // Average scores across ALL completed questions (not just the current one)
  const scoredAnswers = answers.filter(a => a.rating != null)
  const getRating = (r: any) => typeof r === 'number' ? r : (r?.total ?? 0)
  const getField = (r: any, field: string, fallback: number) =>
    typeof r === 'object' && r !== null ? (r[field] ?? fallback) : fallback

  const overallScore = scoredAnswers.length > 0
    ? scoredAnswers.reduce((s, a) => s + getRating(a.rating), 0) / scoredAnswers.length
    : 0
  const accuracy = scoredAnswers.length > 0
    ? scoredAnswers.reduce((s, a) => s + getField(a.rating, 'accuracy', getRating(a.rating)), 0) / scoredAnswers.length
    : 0
  const clarity = scoredAnswers.length > 0
    ? scoredAnswers.reduce((s, a) => s + getField(a.rating, 'clarity', getRating(a.rating)), 0) / scoredAnswers.length
    : 0
  const completeness = scoredAnswers.length > 0
    ? scoredAnswers.reduce((s, a) => s + getField(a.rating, 'completeness', getRating(a.rating)), 0) / scoredAnswers.length
    : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0f1117', fontFamily: '"Segoe UI", system-ui, sans-serif', overflow: 'hidden' }}>

      {/* â"€â"€ TOP HEADER BAR â"€â"€ */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '10px 20px', background: '#0d1117', borderBottom: '1px solid #1e2432', flexShrink: 0, gap: 16 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 220 }}>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>AI</span>
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 14, lineHeight: 1.2 }}>AI INTERVIEW</div>
            <div style={{ color: '#64748b', fontSize: 10 }}>Real-time Proctoring & Interview Platform</div>
          </div>
        </div>
        {/* Timer + Round */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FaClock color="#64748b" size={12} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#64748b', fontSize: 10 }}>Time Remaining</div>
              <div style={{ color: '#00e5ff', fontWeight: 800, fontSize: 20, fontFamily: 'monospace', letterSpacing: 2 }}>
                {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
              </div>
            </div>
          </div>
          <div style={{ width: 1, height: 32, background: '#1e2432' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#64748b', fontSize: 10 }}>Round {mainQuestionIndex + 1} / {questions.length}</div>
            <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 12 }}>{title}</div>
          </div>
        </div>
        {/* End Interview */}
        <div style={{ minWidth: 220, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => { stopListening(); onComplete?.() }}
            style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
          >
            <FaStop size={10} /> End Interview
          </button>
        </div>
      </div>

      {/* â"€â"€ MAIN CONTENT â"€â"€ */}
      {!interviewFinished ? (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* LEFT: Video Panel */}
          <div className="ai-interview-video-panel" style={{ width: '28%', flexShrink: 0, background: '#0a0d14', display: 'flex', flexDirection: 'column', borderRight: '1px solid #1e2432', position: 'relative' }}>
            {/* LIVE badge */}
            <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10, display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(220,38,38,0.9)', borderRadius: 5, padding: '3px 8px' }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff' }} />
              <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>LIVE</span>
            </div>
            {/* Signal bars */}
            <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 10, display: 'flex', alignItems: 'flex-end', gap: 2 }}>
              {[4, 7, 10, 13].map((h, i) => (
                <div key={i} style={{ width: 4, height: h, background: '#22c55e', borderRadius: 2 }} />
              ))}
            </div>
            {/* Video */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
              <VideoRecorderUpdated
                interviewId={interviewId}
                token={token}
                stopRecording={stopRecording || !isRecordingActive}
                onVideoUpload={handleVideoUpload}
                onVideoElementReady={setVideoElement}
              />
              {/* Gaze scan overlay */}
              <GazeScanOverlay
                landmarks={gaze.landmarks}
                faceDetected={gaze.faceDetected}
                direction={gaze.direction}
                isLookingAway={gaze.isLookingAway}
                violationCount={gaze.violationCount}
                lookAwaySeconds={gaze.lookAwaySeconds}
                headDirection={gaze.headDirection}
                isHeadTurned={gaze.isHeadTurned}
                headViolationCount={gaze.headViolationCount}
                headAwaySeconds={gaze.headAwaySeconds}
              />
              {/* Look-away / head-turn warning banner */}
              {(gaze.isLookingAway || gaze.isHeadTurned) && (
                <div style={{ position: 'absolute', top: 48, left: '50%', transform: 'translateX(-50%)', zIndex: 8, background: 'rgba(239,68,68,0.95)', color: '#fff', borderRadius: 8, padding: '5px 14px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', boxShadow: '0 2px 12px rgba(0,0,0,0.4)', display: 'flex', gap: 10 }}>
                  {gaze.isLookingAway && <span>Eye away: {gaze.lookAwaySeconds}s (×{gaze.violationCount})</span>}
                  {gaze.isHeadTurned  && <span>Head turned: {gaze.headAwaySeconds}s (×{gaze.headViolationCount})</span>}
                </div>
              )}
              {/* Violation toast */}
              {gaze.violationCount > 0 && (
                <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 9, background: 'rgba(239,68,68,0.92)', color: '#fff', borderRadius: 8, padding: '4px 12px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
                  Eye Violation #{gaze.violationCount}
                </div>
              )}
              {/* Robot avatar overlay */}
              <div style={{ position: 'absolute', bottom: 10, right: 10, width: 116, height: 116, borderRadius: 14, border: '2px solid rgba(255,165,0,0.8)', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 7 }}>
                <RobotAvatarSVG size={82} status={robotStatus} />
              </div>
            </div>
            {/* Monitoring Active + gaze status */}
            <div style={{ padding: '6px 14px', background: '#0d1117', borderTop: '1px solid #1e2432', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <FaShieldAlt color="#22c55e" size={12} />
                <span style={{ color: '#22c55e', fontSize: 11, fontWeight: 600 }}>Monitoring Active</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: gaze.faceDetected ? '#22c55e' : '#ef4444' }} />
                  <span style={{ fontSize: 10, color: gaze.faceDetected ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                    {gaze.faceDetected ? `Eye: ${gaze.direction}` : 'No Face'}
                  </span>
                </div>
                {gaze.violationCount > 0 && (
                  <div style={{ background: '#dc2626', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>
                    {gaze.violationCount} violation{gaze.violationCount > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CENTER: Question + Answer */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fff' }}>
            {/* Tab bar */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
              <button onClick={() => setCenterTab('question')} style={{ flex: 1, padding: '12px 0', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: 'transparent', color: centerTab === 'question' ? '#3b82f6' : '#64748b', borderBottom: centerTab === 'question' ? '2px solid #3b82f6' : '2px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.15s' }}>
                <FaBullseye size={12} /> Question
              </button>
              <button onClick={() => setCenterTab('feedback')} style={{ flex: 1, padding: '12px 0', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: 'transparent', color: centerTab === 'feedback' ? '#f59e0b' : '#64748b', borderBottom: centerTab === 'feedback' ? '2px solid #f59e0b' : '2px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.15s' }}>
                <FaStar size={12} /> Feedback
              </button>
            </div>

            {/* Tab body */}
            <div className="slim-scroll" style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              {centerTab === 'question' ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: '#3b82f6', fontSize: 13, fontWeight: 700 }}>Question {mainQuestionIndex + 1} of {questions.length}</span>
                      {isFollowUp && <span style={{ background: '#fef3c7', color: '#d97706', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12 }}>Follow-up</span>}
                    </div>
                    {/* AI Interviewer chip */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: '#f0f9ff', borderRadius: 8 }}>
                      <div style={{ width: 22, height: 22, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ color: '#fff', fontSize: 8, fontWeight: 800 }}>AI</span>
                      </div>
                      <span style={{ color: '#475569', fontSize: 12, fontWeight: 600 }}>AI Interviewer</span>
                      <span style={{ color: '#64748b', fontSize: 12 }}>
                        {isSpeaking ? 'Reading the question...' : isListening ? 'Listening to your answer...' : loadingEvaluation ? 'Analyzing your answer...' : showFeedback ? 'Review feedback and proceed.' : 'Click Start Answering when ready.'}
                      </span>
                    </div>
                  </div>
                  {/* Question text */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '16px', marginBottom: 8 }}>
                    <p style={{ color: '#1e293b', fontSize: 15, fontWeight: 700, margin: 0, lineHeight: 1.6 }}>{currentQuestion}</p>
                  </div>
                </>
              ) : (
                showFeedback && currentFeedback ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {currentFeedback.feedback?.theory && (
                      <div style={{ padding: '12px 14px', borderRadius: 10, background: '#f0f9ff', borderLeft: '3px solid #3b82f6' }}>
                        <div style={{ color: '#1d4ed8', fontWeight: 700, fontSize: 12, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}><FaClipboardList size={12} /> Theory Feedback</div>
                        <p style={{ color: '#374151', fontSize: 13, margin: 0, lineHeight: 1.6 }}>{currentFeedback.feedback.theory}</p>
                      </div>
                    )}
                    {currentFeedback.feedback?.example && (
                      <div style={{ padding: '12px 14px', borderRadius: 10, background: '#fdf4ff', borderLeft: '3px solid #a855f7' }}>
                        <div style={{ color: '#7e22ce', fontWeight: 700, fontSize: 12, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}><FaCog size={12} /> Example Feedback</div>
                        <p style={{ color: '#374151', fontSize: 13, margin: 0, lineHeight: 1.6 }}>{currentFeedback.feedback.example}</p>
                      </div>
                    )}
                    {currentFeedback.idealAnswer && (
                      <div style={{ padding: '12px 14px', borderRadius: 10, background: '#f0fdf4', borderLeft: '3px solid #22c55e' }}>
                        <div style={{ color: '#16a34a', fontWeight: 700, fontSize: 12, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}><FaCheckCircle size={12} /> Ideal Answer</div>
                        <p style={{ color: '#374151', fontSize: 13, margin: 0, lineHeight: 1.6 }}>{currentFeedback.idealAnswer}</p>
                      </div>
                    )}
                    {/* Real-world example — text narrative */}
                    {!currentExampleProgramIsCode && currentFeedback.exampleProgram?.code && (
                      <div style={{ padding: '12px 14px', borderRadius: 10, background: '#fff7ed', borderLeft: '3px solid #f97316' }}>
                        <div style={{ color: '#c2410c', fontWeight: 700, fontSize: 12, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <FaLightbulb size={12} /> {currentFeedback.exampleProgram.title || 'Real-world Example'}
                        </div>
                        <p style={{ color: '#374151', fontSize: 13, margin: 0, lineHeight: 1.6 }}>{currentFeedback.exampleProgram.code}</p>
                      </div>
                    )}
                    {/* Code-based example program */}
                    {currentExampleProgramIsCode && formattedExampleProgramCode && (
                      <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                        <div style={{ padding: '8px 14px', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', fontWeight: 700, fontSize: 12, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <FaBoxOpen size={12} /> {currentFeedback.exampleProgram?.title || 'Example Program'}
                        </div>
                        <div className="slim-scroll">
                          <CodeMirror value={formattedExampleProgramCode} height="200px" theme={oneDark} extensions={[javascript(), EditorView.lineWrapping]} editable={false} />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 20px', fontSize: 13 }}>
                    Submit your answer to see detailed feedback here.
                  </div>
                )
              )}
            </div>

            {/* YOUR ANSWER — only shown while the student is composing an answer */}
            {!showFeedback && (
            <div style={{ borderTop: '2px solid #e2e8f0', flexShrink: 0 }}>
              {/* Answer tabs header */}
              <div style={{ display: 'flex', alignItems: 'center', padding: '6px 14px 0', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <span style={{ color: '#1e293b', fontWeight: 700, fontSize: 12, marginRight: 12 }}>Your Answer</span>
                {(['transcript', 'code'] as const).map((tab) => (
                  <button key={tab} onClick={() => setAnswerTab(tab)} style={{ padding: '6px 14px', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, background: 'transparent', color: answerTab === tab ? '#3b82f6' : '#94a3b8', borderBottom: answerTab === tab ? '2px solid #3b82f6' : '2px solid transparent', transition: 'all 0.15s' }}>
                    {tab === 'transcript' ? 'Voice Answer' : 'Code'}
                  </button>
                ))}
                <div style={{ marginLeft: 'auto' }}>
                  <select
                    value={codeLanguage}
                    onChange={(e) => setCodeLanguage(e.target.value)}
                    style={{ fontSize: 11, border: '1px solid #e2e8f0', borderRadius: 6, padding: '3px 8px', color: '#475569', background: '#fff' }}
                  >
                    {CODE_LANGUAGES.map((l) => (
                      <option key={l.label} value={l.label}>{l.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Answer body */}
              {answerTab === 'transcript' ? (
                <div className="slim-scroll" style={{ height: 200, overflowY: 'auto', padding: '14px 16px', background: '#fff' }}>
                  {getDisplayedTranscript() ? (
                    <p style={{ color: '#1e293b', fontSize: 14, margin: 0, lineHeight: 1.7 }}>{getDisplayedTranscript()}</p>
                  ) : (
                    <p style={{ color: '#94a3b8', fontSize: 13, fontStyle: 'italic', margin: 0 }}>Your voice transcript will appear here...</p>
                  )}
                </div>
              ) : (
                <div className="slim-scroll">
                  <CodeMirror
                    value={currentExample}
                    height="200px"
                    theme={oneDark}
                    extensions={[CODE_LANGUAGES.find((l) => l.label === codeLanguage)?.extension || javascript()]}
                    onChange={(v) => setCurrentExample(v)}
                  />
                </div>
              )}

              {/* Controls row */}
              <div style={{ display: 'flex', alignItems: 'center', padding: '8px 14px', gap: 10, background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                <button
                  onClick={isListening ? stopListening : startListening}
                  disabled={showFeedback || hasSubmitted}
                  style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: isListening ? '#dc2626' : '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: (showFeedback || hasSubmitted) ? 'not-allowed' : 'pointer', flexShrink: 0, opacity: (showFeedback || hasSubmitted) ? 0.5 : 1 }}
                >
                  <FaMicrophone size={13} />
                </button>
                <canvas ref={canvasRef} width={200} height={34} style={{ flex: 1, height: 34, background: 'transparent', border: 'none' }} />
                <span style={{ color: '#64748b', fontSize: 11, fontFamily: 'monospace', flexShrink: 0 }}>
                  {String(Math.floor((QUESTION_TIME - timeLeft) / 60)).padStart(2, '0')}:{String((QUESTION_TIME - timeLeft) % 60).padStart(2, '0')}
                </span>
                <button
                  disabled={!canSubmit}
                  onClick={handleEvaluate}
                  style={{ background: canSubmit ? '#3b82f6' : '#94a3b8', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 12, fontWeight: 700, cursor: canSubmit ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}
                >
                  {loadingEvaluation ? <><Spinner size="sm" /> Analyzing...</> : <><FaArrowRight size={11} /> Submit Answer</>}
                </button>
              </div>
            </div>
            )}
          </div>

          {/* RIGHT: Feedback Panel */}
          <div style={{ width: '24%', flexShrink: 0, background: '#fff', borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <FaStar color="#f59e0b" size={13} />
              <span style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>Feedback</span>
            </div>
            <div className="slim-scroll" style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              {showFeedback && currentFeedback ? (
                <>
                  {/* Score circle */}
                  <div style={{ textAlign: 'center', marginBottom: 18 }}>
                    <div style={{ position: 'relative', width: 90, height: 90, margin: '0 auto 8px' }}>
                      <svg width="90" height="90" viewBox="0 0 90 90">
                        <circle cx="45" cy="45" r="38" fill="none" stroke="#e2e8f0" strokeWidth="7" />
                        <circle cx="45" cy="45" r="38" fill="none"
                          stroke={overallScore >= 8 ? '#22c55e' : overallScore >= 6 ? '#f59e0b' : '#ef4444'}
                          strokeWidth="7"
                          strokeDasharray={`${2 * Math.PI * 38 * overallScore / 10} ${2 * Math.PI * 38}`}
                          strokeLinecap="round" transform="rotate(-90 45 45)" />
                      </svg>
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontWeight: 800, fontSize: 22, color: '#1e293b', lineHeight: 1 }}>{overallScore.toFixed(1)}</span>
                        <span style={{ fontSize: 10, color: '#64748b' }}>/10</span>
                      </div>
                    </div>
                    <div style={{ color: '#64748b', fontSize: 11, fontWeight: 600 }}>
                      Avg Score{scoredAnswers.length > 1 ? ` (${scoredAnswers.length} questions)` : ''}
                    </div>
                  </div>

                  {/* Metric cards */}
                  {[
                    { label: 'Technical Accuracy', score: accuracy, color: '#3b82f6' },
                    { label: 'Communication', score: clarity, color: '#8b5cf6' },
                    { label: 'Completeness', score: completeness, color: '#10b981' },
                  ].map((m, i) => {
                    const stars = Math.round(m.score / 2)
                    const desc = m.score >= 8 ? 'Very Good' : m.score >= 6 ? 'Good' : 'Needs Work'
                    return (
                      <div key={i} style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.color, flexShrink: 0 }} />
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>{m.label}</span>
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#1e293b' }}>{m.score.toFixed(1)}/10</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 5 }}>
                          {[1,2,3,4,5].map(s => (
                            <FaStar key={s} size={11} color={s <= stars ? '#f59e0b' : '#e2e8f0'} />
                          ))}
                          <span style={{ fontSize: 10, color: '#64748b', marginLeft: 4 }}>{desc}</span>
                        </div>
                        <div style={{ height: 4, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${m.score * 10}%`, background: m.color, borderRadius: 4, transition: 'width 0.5s ease' }} />
                        </div>
                      </div>
                    )
                  })}

                  {/* AI Suggestions */}
                  {Array.isArray(currentFeedback.improvementTips) && currentFeedback.improvementTips.length > 0 && (
                    <div style={{ padding: '12px', background: '#fffbeb', borderRadius: 10, border: '1px solid #fde68a' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <FaLightbulb color="#f59e0b" size={12} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#92400e' }}>AI Suggestions</span>
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {currentFeedback.improvementTips.slice(0, 4).map((tip, i) => (
                          <li key={i} style={{ fontSize: 11, color: '#78350f', lineHeight: 1.5 }}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 12px' }}>
                  <FaStar size={28} color="#e2e8f0" style={{ display: 'block', margin: '0 auto 10px' }} />
                  <div style={{ fontSize: 12, lineHeight: 1.6 }}>Feedback will appear here after you submit your answer.</div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            {showFeedback && (
              <div style={{ padding: '12px 14px', borderTop: '1px solid #e2e8f0', flexShrink: 0 }}>
                {isLastQuestion ? (
                  <button
                    onClick={async () => {
                      const mergedAnswers = await finishInterview([...answers])
                      await submitScoreIfNeeded(mergedAnswers)
                    }}
                    disabled={loadingFinalFeedback}
                    style={{ width: '100%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    {loadingFinalFeedback ? <><Spinner size="sm" /> Processing...</> : 'Finish Interview'}
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    style={{ width: '100%', background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    Next Question <FaArrowRight size={11} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        interviewFinished && finalFeedback ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, background: '#f8fafc' }}>
            <div style={{ fontSize: 48 }}>ðŸŽ‰</div>
            <h4 style={{ fontWeight: 800, color: '#1e293b', margin: 0 }}>Interview Completed!</h4>
            <p style={{ color: '#64748b', margin: 0 }}>Your results have been saved. Download your report below.</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button disabled={isDownloadingPdf} onClick={downloadPDF}
                style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                {isDownloadingPdf ? <><Spinner size="sm" /> Generating...</> : 'ðŸ"„ Download Interview Report'}
              </button>
              <button onClick={() => onComplete?.()}
                style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                Close
              </button>
            </div>
          </div>
        ) : null
      )}

      {/* BOTTOM PROCTORING STATUS BAR */}
      {!interviewFinished && (
        <div style={{ display: 'flex', alignItems: 'center', padding: '7px 24px', background: '#0d1117', borderTop: '1px solid #1e2432', gap: 0, flexShrink: 0, overflowX: 'auto', justifyContent: 'space-between' }}>
          {([
            {
              label: 'Face Detection',
              value: gaze.faceDetected ? '100%' : '0%',
              sub: gaze.faceDetected ? 'Good' : 'No Face',
              icon: <FaUserCheck size={13} />,
              iconColor: gaze.faceDetected ? '#60a5fa' : '#ef4444',
              ok: gaze.faceDetected,
            },
            {
              label: 'Eye Detection',
              value: gaze.isReady ? (gaze.violationCount > 0 ? `${gaze.violationCount} Violation${gaze.violationCount > 1 ? 's' : ''}` : 'Active') : 'Loading...',
              sub: gaze.isLookingAway ? `Away ${gaze.lookAwaySeconds}s` : (gaze.direction === 'center' ? 'On Camera' : gaze.direction),
              icon: <FaEye size={13} />,
              iconColor: gaze.violationCount > 0 ? '#ef4444' : (gaze.isLookingAway ? '#f59e0b' : '#34d399'),
              ok: !gaze.isLookingAway && gaze.violationCount === 0,
            },
            {
              label: 'Head Position',
              value: gaze.faceDetected
                ? (gaze.headDirection === 'center' || gaze.headDirection === 'unknown'
                    ? 'Center'
                    : gaze.headDirection.charAt(0).toUpperCase() + gaze.headDirection.slice(1))
                : 'Unknown',
              sub: gaze.headViolationCount > 0
                ? `Violations: ${gaze.headViolationCount}`
                : gaze.isHeadTurned
                  ? `Turned ${gaze.headAwaySeconds}s`
                  : 'Good',
              icon: <FaUserCheck size={13} />,
              iconColor: gaze.isHeadTurned ? '#ef4444' : '#a78bfa',
              ok: !gaze.isHeadTurned && gaze.headViolationCount === 0,
            },
            { label: 'Audio Level', value: isListening ? 'Active' : 'Good', sub: isListening ? 'Recording' : 'Clear', icon: <FaVolumeUp size={13} />, iconColor: isListening ? '#22d3ee' : '#94a3b8', ok: true },
            { label: 'Lighting', value: lightingLabel, sub: lightingOk ? 'Good' : 'Poor', icon: <FaSun size={13} />, iconColor: lightingOk ? '#fbbf24' : '#ef4444', ok: lightingOk },
            { label: 'Recording', value: '1080p 30fps', sub: isRecordingActive ? 'Active' : 'Paused', icon: <FaVideo size={13} />, iconColor: isRecordingActive ? '#f87171' : '#64748b', ok: isRecordingActive },
          ] as { label: string; value: string; sub: string; icon: React.ReactNode; iconColor: string; ok: boolean }[]).map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, padding: '0 14px', borderRight: i < 6 ? '1px solid #1e2432' : 'none' }}>
              <div style={{ color: item.iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {item.icon}
              </div>
              <div>
                <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: 0.5, fontWeight: 600 }}>{item.label}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', lineHeight: 1.3 }}>{item.value}</div>
                <div style={{ fontSize: 9, color: item.ok ? '#22c55e' : '#f59e0b', fontWeight: 500 }}>{item.sub}</div>
              </div>
              <FaCheck size={11} color={item.ok ? '#22c55e' : '#f59e0b'} style={{ flexShrink: 0, marginLeft: 2 }} />
            </div>
          ))}
        </div>
      )}

      {/* PDF (hidden) */}
      <div ref={pdfRef} style={{ position: 'absolute', left: '-9999px', top: 0, width: '794px', background: '#ffffff', padding: '24px', color: '#000' }}>
        <h2 style={{ marginBottom: 16 }}>Interview Feedback Report</h2>
        <p><strong>Candidate:</strong> {user?.fullName}</p>
        <p><strong>Topic:</strong> {title}</p>
        <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
        <p><strong>Eye Detection Violations:</strong> {gaze.violationCount} (looked away &gt;15s, {gaze.violationCount} time{gaze.violationCount !== 1 ? 's' : ''})</p>
        <hr />
        {finalFeedback?.map((item: any, idx: number) => (
          <div key={idx} style={{ marginBottom: 32, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
            <h4 style={{ marginBottom: 8, color: '#000', fontWeight: 500 }}>Q{idx + 1}. {item.question}</h4>
            <p><strong>Your Answer:</strong></p>
            <p>{item.answer?.trim() ? item.answer : 'â€" Skipped â€"'}</p>
            {item.feedback && (
              <>
                <p><strong>AI Feedback:</strong></p>
                {item.feedback.theory && <p><strong>Theory:</strong><br />{item.feedback.theory}</p>}
                {item.feedback.example && <p><strong>Example:</strong><br />{item.feedback.example}</p>}
              </>
            )}
            {item.idealAnswer && <><p><strong>Ideal Answer:</strong></p><p>{item.idealAnswer}</p></>}
            {item.exampleProgram && (
              <>
                <p><strong>Example Program:</strong></p>
                {isCodeLanguage((item.exampleProgram as any)?.language) ? (
                  <pre style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px', fontSize: '12px', overflowX: 'auto' }}>
                    {formatCodeSnippet(typeof item.exampleProgram === 'string' ? item.exampleProgram : item.exampleProgram.code)}
                  </pre>
                ) : (
                  <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px', fontSize: '14px', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {typeof item.exampleProgram === 'string' ? item.exampleProgram : item.exampleProgram.code}
                  </div>
                )}
              </>
            )}
            {Array.isArray(item.improvementTips) && item.improvementTips.length > 0 && (
              <><p><strong>Improvement Tips:</strong></p><ul>{item.improvementTips.map((tip: string, i: number) => <li key={i}>{tip}</li>)}</ul></>
            )}
            <p style={{ marginTop: 8 }}><strong>Score:</strong> {item.rating?.total ?? 0}/10</p>
            <hr />
          </div>
        ))}
      </div>
    </div>
  )
}

export default InterviewUILayoutWithLogic
