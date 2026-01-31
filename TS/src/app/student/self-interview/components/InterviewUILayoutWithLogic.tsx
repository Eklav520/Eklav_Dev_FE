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
  rating?: number
  timestamp?: string
  isFollowUp?: boolean
  exampleProgram?: { title: string; language: string; code: string } | null
  fixedExampleCode?: string
}
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
}


const FOLLOW_UP_THRESHOLD = 4
const MAX_FOLLOW_UPS = 1

const InterviewUILayoutWithLogic: React.FC<Props> = ({ interviewId, questions, title, setLoadingFeedback,meta }) => {
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
        // do not auto-start listening by default — leave manual control for stability
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
    listeningHardRef.current = false

    // Stop speech recognition
    try {
      recognitionRef.current?.stop()
    } catch { }

    setIsListening(false)

    // Stop waveform animation
    cancelAnimationFrame(animationId)

    // Close audio context
    if (audioContextRef.current) {
      try {
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close().catch(() => { })
        }
      } catch { }
    }

    // Clear canvas
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }

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

    const payload = {
      topic: title,
      question: currentQuestion,
      answer: {
        theory: finalTheory,
        example: exampleCode,
      },
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
        exampleProgram: data.exampleProgram ?? null,
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

    // 🔇 Stop mic completely so user cannot speak after feedback
    stopListening()
    listeningHardRef.current = false
    setIsListening(false)

    // 🧹 Reset transcript & speech buffer for next question
    setTranscript('')
    finalRef.current = ''

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
  const finishInterview = async (finalAnswers: AnswerItem[]) => {
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
            : serverItem.question || questions[i], // ⭐ HARD FALLBACK
          feedback:
            typeof serverItem.feedback === 'object'
              ? serverItem.feedback
              : ans.feedback,
          idealAnswer: serverItem.idealAnswer ?? ans.idealAnswer,
          improvementTips: serverItem.improvementTips ?? ans.improvementTips,
          rating: serverItem.rating ?? ans.rating,
          exampleProgram: serverItem.exampleProgram ?? ans.exampleProgram,
        }
      })

      setFinalFeedback(merged)

      // ✅ NOW interview is really finished
      setInterviewFinished(true)
      setRobotStatus('idle')
    } catch (err) {
      console.error('final feedback', err)
      alert('Could not get final feedback.')
      setRobotStatus('idle')
    } finally {
      setLoadingEvaluation(false)
      setLoadingFinalFeedback(false)
      if (setLoadingFeedback) setLoadingFeedback(false)
    }
  }

  const submitResumeScoreIfNeeded = async (finalAnswers: AnswerItem[]) => {
  if (meta?.interviewType !== 'resume') return
  if (meta.attemptNumber !== 1) return // 🔒 only first attempt
  if (!meta.attemptId) return

  const scores = finalAnswers.map((a, idx) => ({
    question: a.question,
    score: a.rating ?? 0,
  }))

  try {
    await fetch(`${baseURL}/api/resume-based-interview/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        attemptId: meta.attemptId,
        scores,
      }),
    })
  } catch (err) {
    console.error('Resume score submit failed', err)
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


  return (
    <div className="interview-layout-with-logic">
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

          <Col xs="auto" className="d-flex align-items-center mt-2 mt-md-0">
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
                {/* VIDEO */}
                <div
                  className="position-relative rounded-4 overflow-hidden"
                  style={{
                    minHeight: isMobile ? 240 : 400, // ⭐ INCREASED
                    maxHeight: isMobile ? 260 : 420, // ⭐ INCREASED
                  }}>
                  <VideoRecorderUpdated interviewId={interviewId} token={token} stopRecording={false} onVideoUpload={handleVideoUpload} />
                  {/* ROBOT */}
                  <div
                    className="position-absolute d-flex align-items-center justify-content-center"
                    style={{
                      /* 📍 POSITION */
                      top: isMobile ? 8 : 'auto',
                      right: isMobile ? 8 : 14,
                      bottom: isMobile ? 'auto' : 16,

                      /* 📐 SIZE */
                      width: isMobile ? 64 : 170,
                      height: isMobile ? 64 : 170,

                      borderRadius: '50%',

                      /* 🟠 ORANGE BORDER + SOFT GLOW */
                      border: isMobile ? '2px solid rgba(255,165,0,0.75)' : '3px solid rgba(255,165,0,0.85)',

                      boxShadow: isMobile ? '0 0 6px rgba(255,165,0,0.45)' : '0 0 12px rgba(255,165,0,0.6)',

                      background: 'rgba(0,0,0,0.25)',
                      zIndex: 5, // stay above video
                    }}>
                    <RobotAvatarSVG size={isMobile ? 46 : 150} status={robotStatus} />
                  </div>
                </div>

                {/* MIC VISUAL */}
                {isListening && (
                  <div className="d-flex justify-content-center my-2">
                    <GlowMic listening size={isMobile ? 42 : 58} />
                  </div>
                )}

                {/* FLEX SPACER – pushes buttons down */}
                <div className="flex-grow-1" />

                {/* ACTION BUTTONS */}
                <div className="d-flex justify-content-center gap-3 mt-3">
                  <Button
                    onClick={startListening}
                    disabled={showFeedback || hasSubmitted}
                    style={{
                      ...circleBtnStyleGreen,
                      width: isMobile ? 46 : 60, // ⭐ slightly bigger
                      height: isMobile ? 46 : 60,
                      fontSize: isMobile ? 13 : 15,
                    }}>
                    Start
                  </Button>

                  <Button
                    onClick={handleNext}
                    disabled={!showFeedback}
                    style={{
                      ...circleBtnStyleBlue,
                      width: isMobile ? 46 : 60,
                      height: isMobile ? 46 : 60,
                      fontSize: isMobile ? 13 : 15,
                      opacity: showFeedback ? 1 : 0.4,
                    }}>
                    Next
                  </Button>
                </div>

                {/* TIMER */}
                <div className="text-center mt-2">
                  {isListening ? (
                    <small className="fw-bold" style={{ color: timeLeft < 10 ? 'red' : '#28a745' }}>
                      ⏳ {timeLeft}s
                    </small>
                  ) : (
                    <small className="text-light opacity-75">Tap Start to answer</small>
                  )}
                </div>
                {/* ================= AI FEEDBACK ================= */}
                {showFeedback && currentFeedback && (
                  <Card className="mt-3 p-3 rounded-4 bg-dark border border-warning">
                    <h6 className="fw-bold text-warning mb-3">📊 AI Evaluation</h6>

                    {/* THEORY FEEDBACK */}
                    {currentFeedback.feedback?.theory && (
                      <div className="mb-3">
                        <small className="text-info fw-semibold">📝 Theory Feedback</small>
                        <p className="text-light mb-0">{currentFeedback.feedback.theory}</p>
                        <hr className="border-secondary my-2" />
                      </div>
                    )}

                    {/* EXAMPLE FEEDBACK */}
                    {currentFeedback.feedback?.example && (
                      <div className="mb-3">
                        <small className="text-info fw-semibold">⚙️ Example Feedback</small>
                        <p className="text-light mb-0">{currentFeedback.feedback.example}</p>
                        <hr className="border-secondary my-2" />
                      </div>
                    )}

                    {/* IDEAL ANSWER */}
                    {currentFeedback.idealAnswer && (
                      <div className="mb-3 p-3 rounded bg-black border border-success">
                        <small className="text-success fw-semibold">✅ Ideal Answer</small>
                        <p className="text-light mb-0 mt-1">{currentFeedback.idealAnswer}</p>
                      </div>
                    )}

                    {/* FIXED EXAMPLE CODE */}
                    {currentFeedback.fixedExampleCode && (
                      <div className="mb-3">
                        <small className="text-info fw-semibold">🔧 Corrected Example Code</small>
                        <div className="mt-2 rounded overflow-hidden border border-secondary">
                          <CodeMirror
                            value={currentFeedback.fixedExampleCode}
                            height="160px"
                            theme={oneDark}
                            extensions={[javascript()]}
                            editable={false}
                          />
                        </div>
                      </div>
                    )}

                    {/* FULL EXAMPLE PROGRAM */}
                    {currentFeedback.exampleProgram && (
                      <div className="mb-3">
                        <div className="d-flex align-items-center mb-1">
                          <small className="text-info fw-semibold">📦 Example Program — {currentFeedback.exampleProgram.title}</small>
                          <Badge bg="secondary" className="ms-2">
                            {currentFeedback.exampleProgram.language.toUpperCase()}
                          </Badge>
                        </div>

                        <div className="mt-2 rounded overflow-hidden border border-secondary">
                          <CodeMirror
                            value={currentFeedback.exampleProgram.code}
                            height="220px"
                            theme={oneDark}
                            extensions={[javascript()]}
                            editable={false}
                          />
                        </div>
                      </div>
                    )}

                    {/* IMPROVEMENT TIPS */}
                    {Array.isArray(currentFeedback.improvementTips) && currentFeedback.improvementTips.length > 0 && (
                      <div className="mb-3">
                        <small className="text-info fw-semibold">🚀 Improvement Tips</small>
                        <ul className="text-light ps-3 mb-0 mt-1">
                          {currentFeedback.improvementTips.map((tip, i) => (
                            <li key={i}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* FOLLOW-UP QUESTION */}
                    {(currentFeedback as any)?.followUpQuestion && (
                      <Alert variant="warning" className="mt-3 mb-2 py-2 px-3 rounded-3">
                        <strong>🤔 Follow-up Question</strong>
                        <div className="mt-1">{(currentFeedback as any).followUpQuestion}</div>
                      </Alert>
                    )}

                    {/* SCORE */}
                    {typeof currentFeedback.rating === 'number' && (
                      <div className="text-end mt-2">
                        <Badge
                          bg={currentFeedback.rating >= 7 ? 'success' : currentFeedback.rating >= 4 ? 'warning' : 'danger'}
                          className="px-3 py-2">
                          Score: {currentFeedback.rating}/10
                        </Badge>
                      </div>
                    )}
                  </Card>
                )}
              </Card>
            </Col>

            {/* ================= RIGHT / BOTTOM ================= */}
            <Col xs={12} md={5}>
              <Card className="shadow-sm p-3 rounded-4">
                {/* QUESTION */}
                <div className="mb-3 p-3 rounded-3 bg-dark border border-secondary">
                  <h6 className="fw-bold text-info mb-2">🎯 Interview Question</h6>

                  <p className="mb-0 text-light">{currentQuestion}</p>
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
  const finalAnswers = [...answers, currentFeedback]
  await finishInterview(finalAnswers)
  await submitResumeScoreIfNeeded(finalAnswers)
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
                    <pre
                      style={{
                        background: '#f5f5f5',
                        padding: '12px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        overflowX: 'auto',
                      }}
                    >
                      {typeof item.exampleProgram === 'string'
                        ? item.exampleProgram
                        : item.exampleProgram.code}
                    </pre>
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

      </Container>
    </div>
  )
}

export default InterviewUILayoutWithLogic
