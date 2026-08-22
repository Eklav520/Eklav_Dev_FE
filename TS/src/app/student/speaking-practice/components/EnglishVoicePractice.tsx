import React, { useState, useEffect, useRef } from 'react'
import { Spinner } from 'react-bootstrap'
import axios from 'axios'
import { useAuthContext } from '@/context/useAuthContext'
import RoboAvatar from './RoboAvatar'
import AnimatedRobotSVG from './AnimatedRobotSVG'
import {
  FaMicrophoneSlash, FaRobot, FaUser, FaMicrophone, FaClock, FaPause, FaPlay, FaStop,
  FaComments, FaClipboardList, FaEdit, FaTrash, FaSyncAlt, FaExclamationTriangle,
  FaLightbulb, FaChartLine, FaBolt, FaBullseye, FaUniversity, FaRocket, FaLaptop,
  FaCheck, FaFileAlt, FaMale, FaFemale, FaArrowUp, FaArrowDown, FaInfoCircle,
  FaChevronRight, FaChevronLeft, FaBriefcase, FaGlobe, FaBook, FaUsers, FaVolumeUp, FaVideo, FaStar,
  FaSpellCheck, FaTachometerAlt, FaFont, FaTimes, FaTrophy,
} from 'react-icons/fa'
import robotSpeakingImg from '@/assets/images/Robo.png'

interface Message {
  id: string
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
  const token = user?.token

  // Full access (status === 'approved', same as institute-granted students)
  // OR a standalone "speakingPractice" module purchase unlocks the full
  // 30-session monthly allowance — no free trial, fully locked otherwise.
  // Server-enforced in POST /api/english/end and GET /api/speakingPractice/history,
  // so `history.monthlyLimit` below is always the real, already-correct number.
  type ModulePlan = '6months' | '12months'
  const [moduleInfo, setModuleInfo] = useState<{ fullAccess: boolean; active: boolean; plans: Record<ModulePlan, number>; label: string; endDate?: string | null } | null>(null)
  // Tracks whether the module-access check has actually returned yet. Until
  // it has, `hasAccess` falling back to a `user.status` guess caused a
  // flash of the wrong UI on slow networks — locked/price-picker briefly
  // shown to already-purchased students, or the Start button briefly
  // enabled for students who turn out to be locked. Gate on this instead of
  // guessing so nothing renders until the real answer is known.
  const [moduleInfoLoaded, setModuleInfoLoaded] = useState(false)
  const [buyingPlan, setBuyingPlan] = useState<ModulePlan | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<ModulePlan>('12months')
  const [buyError, setBuyError] = useState<string | null>(null)

  const fetchModuleAccess = () => {
    if (!token) return
    fetch(`${baseURL}/api/student/module-access`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) return
        const mod = data.modules?.speakingPractice
        setModuleInfo({
          fullAccess: !!data.fullAccess,
          active: !!mod?.active,
          plans: { '6months': mod?.plans?.['6months'] ?? 19900, '12months': mod?.plans?.['12months'] ?? 34900 },
          label: mod?.label ?? 'Speaking Practice With AI',
          endDate: mod?.endDate ?? null,
        })
      })
      .catch(() => {})
      .finally(() => setModuleInfoLoaded(true))
  }
  useEffect(fetchModuleAccess, [token, baseURL])

  const hasAccess = moduleInfoLoaded && (moduleInfo ? (moduleInfo.fullAccess || moduleInfo.active) : user?.status?.toLowerCase() === 'approved')
  const modulePurchased = moduleInfoLoaded && !!moduleInfo?.active && !moduleInfo?.fullAccess

  const buyModule = (plan: ModulePlan) => {
    if (!token || buyingPlan) return
    setBuyingPlan(plan)
    setBuyError(null)
    fetch(`${baseURL}/api/student/module-access/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ moduleKey: 'speakingPractice', plan }),
    })
      .then((r) => r.json())
      .then((order) => {
        if (!order.success) throw new Error(order.message || 'Failed to start payment')
        const options = {
          key: order.key,
          amount: order.amount,
          currency: order.currency,
          name: 'Eklav',
          description: order.moduleLabel,
          order_id: order.orderId,
          prefill: { name: (user as any)?.fullName || '', email: user?.email || '' },
          theme: { color: '#ff7a00' },
          handler: async (response: any) => {
            try {
              const verifyRes = await fetch(`${baseURL}/api/student/module-access/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ ...response, moduleKey: 'speakingPractice', plan }),
              })
              const verifyData = await verifyRes.json()
              if (!verifyData.success) throw new Error(verifyData.message || 'Payment verification failed')
              fetchModuleAccess()
              fetchSpeakingHistory()
            } catch (e: any) {
              setBuyError(e.message || 'Payment verification failed. Contact support.')
            } finally {
              setBuyingPlan(null)
            }
          },
          modal: { ondismiss: () => setBuyingPlan(null) },
        }
        const razorpay = new (window as any).Razorpay(options)
        razorpay.on('payment.failed', (response: any) => {
          setBuyError(`Payment failed: ${response.error?.description || 'Unknown error'}`)
          setBuyingPlan(null)
        })
        razorpay.open()
      })
      .catch((e) => { setBuyError(e.message || 'Failed to start payment'); setBuyingPlan(null) })
  }

  const [messages, setMessages] = useState<Message[]>([])
  const [feedback, setFeedback] = useState('')
  const [feedbackScore, setFeedbackScore] = useState<number | null>(null)
  const [feedbackBreakdown, setFeedbackBreakdown] = useState<{ grammar: number; fluency: number; vocabulary: number } | null>(null)
  const [sessionStarted, setSessionStarted] = useState(false)
  const [sessionEnded, setSessionEnded] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [timeLeft, setTimeLeft] = useState(180)
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false)

  const [liveSpeech, setLiveSpeech] = useState('')
  const [isUserSpeaking, setIsUserSpeaking] = useState(false)
  // Reactive mirror of ttsCountRef (a ref, so it doesn't trigger re-renders on
  // its own) — used anywhere the UI needs to visibly reflect "Robo is
  // speaking right now" in sync with the actual TTS start/end events, e.g.
  // the turn-indicator badge and avatar mouth animation.
  const [botSpeaking, setBotSpeaking] = useState(false)
  // Elapsed seconds while waiting on the AI's reply (isTyping window) — gives
  // the student a live "how much longer" cue instead of an unbounded silent
  // wait after they finish speaking.
  const [thinkingSeconds, setThinkingSeconds] = useState(0)
  const thinkingTimerRef = useRef<any>(null)
  const [typewriterMap, setTypewriterMap] = useState<Record<string, number>>({})

  const mkId = () => `${Date.now()}-${Math.random()}`

  const clearTypewriter = (msgId: string) =>
    setTypewriterMap(prev => { const n = { ...prev }; delete n[msgId]; return n })

  const recognitionRef = useRef<any>(null)
  const transcriptRef = useRef('')
  const lastUserRef = useRef('')
  const accumulatedRef = useRef('')   // accumulates finals across pauses within one utterance
  const sessionActiveRef = useRef(false)
  const chatBodyRef = useRef<HTMLDivElement>(null)
  const [history, setHistory] = useState<any>(null)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const speechPauseTimerRef = useRef<any>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [showHowItWorks, setShowHowItWorks] = useState(false)
  const isPausedRef = useRef(false)

  const canStop = sessionStarted && !sessionEnded
  const canNewSession = sessionEnded

  // The server already returns the correct effective limit (30 unlocked /
  // 5 free-trial) in history.monthlyLimit — no need to re-derive it here.
  const maxAllowedAttempts = history?.monthlyLimit ?? 0
  const isLimitReached = !hasAccess || (!!history && history.attemptsUsed >= maxAllowedAttempts)
  const canStart = !sessionStarted && !isLimitReached
  const silenceTimerRef = useRef<any>(null)
  const noResponseCountRef = useRef(0)
  const manualStopRef = useRef(false)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const micCheckRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [micWarning, setMicWarning] = useState<'muted' | 'low' | null>(null)
  const [showMicMutePopup, setShowMicMutePopup] = useState(false)
  const micMutePopupDismissedRef = useRef(false)

  // Surface the popup automatically the moment a system-level mute is
  // detected (Google Meet does the same) — the student shouldn't have to
  // notice a small badge and click it themselves. Closing it (✕) suppresses
  // it for the rest of this muted stretch; it reappears next time the mic
  // toggles from unmuted back to muted.
  useEffect(() => {
    if (micWarning === 'muted') {
      if (!micMutePopupDismissedRef.current) setShowMicMutePopup(true)
    } else {
      micMutePopupDismissedRef.current = false
      setShowMicMutePopup(false)
    }
  }, [micWarning])

  // Deep-links into the OS sound settings where possible. Browsers can't
  // silently flip a hardware/OS mute switch, but on Windows the `ms-settings:`
  // URI opens the Settings app directly to the Sound page (Chrome/Edge prompt
  // once to allow it, then remember the choice). Other platforms have no
  // equivalent URI, so we just point the user to where to look.
  const openSoundSettings = () => {
    const ua = navigator.userAgent
    if (ua.includes('Windows')) {
      window.location.href = 'ms-settings:sound'
    } else if (ua.includes('Mac')) {
      window.location.href = 'x-apple.systempreferences:com.apple.preference.sound'
    }
  }

  const MAX_NO_RESPONSE = 3
  const SILENCE_TIMEOUT = 6000
  const ttsCountRef = useRef(0)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [voiceGender, setVoiceGender] = useState<'male' | 'female'>('female')
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('')

  const webcamRef = useRef<HTMLVideoElement>(null)
  const webcamStreamRef = useRef<MediaStream | null>(null)
  const [webcamActive, setWebcamActive] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const segmentationRef = useRef<any>(null)
  const rafRef = useRef<number>(0)
  const [segReady, setSegReady] = useState(false)
  const youBgOptionRef = useRef<any>({ id: 'none', canvasColors: undefined, cat: 'color' })
  const bgImageCacheRef = useRef<Record<string, HTMLImageElement>>({})

  const loadBgImage = (url: string) => {
    if (bgImageCacheRef.current[url]) return
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => { bgImageCacheRef.current[url] = img }
    img.src = url
  }

  const onSegmentationResults = (results: any) => {
    const canvas = canvasRef.current
    if (!canvas || !results.segmentationMask) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const w = canvas.width
    const h = canvas.height
    ctx.save()
    ctx.clearRect(0, 0, w, h)
    // Draw mask: person=opaque, background=transparent
    ctx.drawImage(results.segmentationMask, 0, 0, w, h)
    // Keep only person pixels from video frame
    ctx.globalCompositeOperation = 'source-in'
    ctx.drawImage(results.image, 0, 0, w, h)
    // Draw chosen background behind the person
    ctx.globalCompositeOperation = 'destination-over'
    const option = youBgOptionRef.current
    const cachedImg: HTMLImageElement | undefined = option.imageUrl ? bgImageCacheRef.current[option.imageUrl] : undefined
    if (cachedImg) {
      // Cover-fit the image to the canvas
      const scale = Math.max(w / cachedImg.naturalWidth, h / cachedImg.naturalHeight)
      const sw = cachedImg.naturalWidth * scale
      const sh = cachedImg.naturalHeight * scale
      ctx.drawImage(cachedImg, (w - sw) / 2, (h - sh) / 2, sw, sh)
    } else {
      if (option.imageUrl) loadBgImage(option.imageUrl)
      const colors: string[] = option.canvasColors ?? ['#0d1117', '#1a1f35']
      const grad = ctx.createLinearGradient(0, 0, w, h)
      grad.addColorStop(0, colors[0])
      grad.addColorStop(1, colors[1])
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)
    }
    ctx.restore()
  }

  const startSegLoop = () => {
    const loop = async () => {
      const video = webcamRef.current
      const canvas = canvasRef.current
      if (video && video.readyState >= 2 && video.videoWidth > 0 && segmentationRef.current) {
        if (canvas && (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight)) {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
        }
        try { await segmentationRef.current.send({ image: video }) } catch { /* skip frame */ }
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
  }

  const initSegmentation = async () => {
    try {
      // Load the MediaPipe selfie segmentation script from CDN if not already loaded
      await new Promise<void>((resolve, reject) => {
        if ((window as any).SelfieSegmentation) { resolve(); return }
        const s = document.createElement('script')
        s.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/selfie_segmentation.js'
        s.crossOrigin = 'anonymous'
        s.onload = () => resolve()
        s.onerror = reject
        document.head.appendChild(s)
      })
      const SelfieSegmentation = (window as any).SelfieSegmentation
      const seg = new SelfieSegmentation({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1/${file}`,
      })
      seg.setOptions({ modelSelection: 1 })
      seg.onResults(onSegmentationResults)
      await seg.initialize()
      segmentationRef.current = seg
      setSegReady(true)
      startSegLoop()
    } catch (e) {
      console.warn('Selfie segmentation failed to load, showing raw feed', e)
    }
  }

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      webcamStreamRef.current = stream
      if (webcamRef.current) {
        webcamRef.current.srcObject = stream
      }
      setWebcamActive(true)
      // Raw feed by default — only start the ML segmentation pipeline once
      // the student has actually picked a virtual background (see applyYouBg).
      if (youWantsBg) {
        if (!segmentationRef.current) initSegmentation()
        else startSegLoop()
      }
    } catch {
      setWebcamActive(false)
    }
  }

  // Applies a background choice for the student's own camera panel. Picking
  // "None" reverts to the raw webcam feed (segmentation instance is kept
  // around, just paused, so switching back to a real background later is
  // instant). Picking any real background lazily starts segmentation the
  // first time it's needed.
  const applyYouBg = (o: any) => {
    setYouBgOption(o)
    youBgOptionRef.current = o
    setShowYouBgPicker(false)
    if (o.imageUrl) loadBgImage(o.imageUrl)

    if (o.id === 'none') {
      setYouWantsBg(false)
      cancelAnimationFrame(rafRef.current)
      setSegReady(false)
      return
    }

    setYouWantsBg(true)
    if (webcamActive) {
      if (!segmentationRef.current) initSegmentation()
      else startSegLoop()
    }
  }

  const stopWebcam = () => {
    cancelAnimationFrame(rafRef.current)
    webcamStreamRef.current?.getTracks().forEach(t => t.stop())
    webcamStreamRef.current = null
    setWebcamActive(false)
  }

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
        latestScore: data.summary?.latestScore ?? null,
        trend: data.summary?.trend ?? null,
        attemptsText: `${data.attemptsUsed} / ${data.monthlyLimit ?? 0}`,
        attemptsUsed: data.attemptsUsed,
        monthlyLimit: data.monthlyLimit,
        latestFeedback: data.latestFeedback ?? null,
        latestBreakdown: data.latestBreakdown ?? null,
        attempts: data.attempts ?? [],
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

    // Chrome bug: speechSynthesis freezes after ~15s of inactivity — resume it periodically
    const keepAlive = setInterval(() => {
      if (speechSynthesis.speaking) {
        speechSynthesis.pause()
        speechSynthesis.resume()
      }
    }, 10000)

    return () => clearInterval(keepAlive)
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
    if (!sessionStarted || sessionEnded || isPaused) return
    if (timeLeft <= 0) {
      handleEndSession()
      return
    }
    const t = setInterval(() => setTimeLeft((p) => p - 1), 1000)
    return () => clearInterval(t)
  }, [sessionStarted, sessionEnded, timeLeft, isPaused])

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

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
        const id = mkId()
        setMessages((p) => [...p, { id, sender: 'eklav', text: msg, type: 'reply' }])
        setTypewriterMap(prev => ({ ...prev, [id]: 0 }))
        await speak(msg, { msgId: id, displayText: msg })
        clearTypewriter(id)
        startSilenceTimer()
      } else {
        const msg = 'Sorry, closing the session. Have a nice day.'
        const id = mkId()
        setMessages((p) => [...p, { id, sender: 'eklav', text: msg, type: 'reply' }])
        setTypewriterMap(prev => ({ ...prev, [id]: 0 }))
        await speak(msg, { msgId: id, displayText: msg })
        clearTypewriter(id)
        handleEndSession()
      }
    }, SILENCE_TIMEOUT)
  }

  const stopThinkingTimer = () => {
    if (thinkingTimerRef.current) {
      clearInterval(thinkingTimerRef.current)
      thinkingTimerRef.current = null
    }
    setThinkingSeconds(0)
  }

  const startThinkingTimer = () => {
    stopThinkingTimer()
    setThinkingSeconds(0)
    thinkingTimerRef.current = setInterval(() => {
      setThinkingSeconds((s) => s + 1)
    }, 1000)
  }

  const startMicMonitor = async () => {
    if (micCheckRef.current) return // already running — avoid a duplicate stream/interval
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const ctx = new AudioContext()
      audioCtxRef.current = ctx
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      const data = new Uint8Array(analyser.frequencyBinCount)

      micCheckRef.current = setInterval(() => {
        analyser.getByteFrequencyData(data)
        const avg = data.reduce((s, v) => s + v, 0) / data.length
        if (avg === 0) {
          setMicWarning('muted')
        } else if (avg < 5) {
          setMicWarning('low')
        } else {
          setMicWarning(null)
        }
      }, 1000)
    } catch {
      // mic permission denied — silently skip monitoring
    }
  }

  const stopMicMonitor = () => {
    if (micCheckRef.current) { clearInterval(micCheckRef.current); micCheckRef.current = null }
    if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null }
    setMicWarning(null)
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
      startSilenceTimer()
    }

    rec.onresult = async (e: any) => {
      clearSilenceTimer()

      let interim = ''
      let newFinal = ''

      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i][0]
        const txt = result.transcript.trim()
        if (!txt) continue
        // Accept all finals; only skip interim if very low confidence
        if (!e.results[i].isFinal && (result.confidence || 0.6) < 0.15) continue
        e.results[i].isFinal ? (newFinal += ' ' + txt) : (interim += ' ' + txt)
      }

      if (newFinal.trim()) {
        noResponseCountRef.current = 0
        // Append to accumulated so pauses don't wipe previous words
        accumulatedRef.current = (accumulatedRef.current + ' ' + newFinal.trim()).trim()
        setLiveSpeech(accumulatedRef.current)
        clearTimeout(speechPauseTimerRef.current)
        // 2s pause after last final word before sending
        speechPauseTimerRef.current = setTimeout(async () => {
          const text = accumulatedRef.current.trim()
          if (!sessionActiveRef.current || !text || text === lastUserRef.current) return
          lastUserRef.current = text
          accumulatedRef.current = ''
          setLiveSpeech('')
          clearSilenceTimer()
          setMessages((p) => [...p, { id: mkId(), sender: 'user', text, type: 'user' }])
          transcriptRef.current += `You: ${text}\n`
          await sendToRob(text)
        }, 2000)
      }

      if (interim.trim()) {
        noResponseCountRef.current = 0
        // Show accumulated finals + current interim so nothing looks erased
        setLiveSpeech((accumulatedRef.current + ' ' + interim.trim()).trim())
        clearTimeout(speechPauseTimerRef.current)
      }
    }

    rec.onend = () => {
      setIsListening(false)
      setIsUserSpeaking(false)
      manualStopRef.current = false
      // Auto-restart if session is active, not paused, and TTS is not playing
      if (sessionActiveRef.current && !isPausedRef.current && ttsCountRef.current === 0) {
        setTimeout(() => startListening(), 300)
      }
    }

    recognitionRef.current = rec
    rec.start()
  }

  const stopListening = () => {
    accumulatedRef.current = ''
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
    setBotSpeaking(true)
    stopListening()
  }

  const onTTSEnd = () => {
    ttsCountRef.current -= 1
    if (ttsCountRef.current === 0) {
      setBotSpeaking(false)
      stopThinkingTimer()
      if (sessionActiveRef.current && !isPausedRef.current) {
        startListening()
        setTimeout(() => {
          if (sessionActiveRef.current && !isPausedRef.current) startSilenceTimer()
        }, 500)
      }
    }
  }


  const waitForVoices = (): Promise<SpeechSynthesisVoice[]> => new Promise(resolve => {
    const v = speechSynthesis.getVoices()
    if (v.length) return resolve(v)
    const handler = () => resolve(speechSynthesis.getVoices())
    speechSynthesis.addEventListener('voiceschanged', handler, { once: true })
    // Fallback: don't wait forever
    setTimeout(() => resolve(speechSynthesis.getVoices()), 3000)
  })

  // tw: typewriter sync — drives character-by-character reveal timed to actual TTS playback
  const speak = (text: string, tw?: { msgId: string; displayText: string; displayOffset?: number }) =>
    new Promise<void>((resolve) => {
    if (!sessionActiveRef.current) return resolve()
    onTTSStart()

    // Use voices directly from state (loaded at mount via onvoiceschanged) — no async wait
    const utter = new SpeechSynthesisUtterance(text.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, ''))
    const pickedVoice = selectedVoiceName
      ? voices.find(v => v.name === selectedVoiceName)
      : voices.find(v => voiceGender === 'female'
          ? ['google uk english female', 'zira', 'samantha', 'karen', 'female'].some(k => v.name.toLowerCase().includes(k))
          : ['google uk english male', 'david', 'alex', 'daniel', 'male'].some(k => v.name.toLowerCase().includes(k))
        )
    if (pickedVoice) utter.voice = pickedVoice
    else if (voices[0]) utter.voice = voices[0]
    utter.pitch = voiceGender === 'female' ? 1.05 : 0.95
    utter.rate = 0.95

    let twInterval: any = null
    let twMsgId: string | undefined
    let twTotalChars = 0

    if (tw) {
      const { msgId, displayText } = tw
      twMsgId = msgId
      twTotalChars = displayText.length
      utter.onstart = () => {
        let pos = 0
        // 3 chars per 16ms tick ≈ 187 chars/sec — completes 150-char sentence in ~800ms
        twInterval = setInterval(() => {
          pos = Math.min(pos + 3, twTotalChars)
          setTypewriterMap(prev => ({ ...prev, [msgId]: pos }))
          if (pos >= twTotalChars) clearInterval(twInterval)
        }, 16)
      }
    }

    const cleanup = () => {
      if (twInterval) clearInterval(twInterval)
      // Snap to full text so clearTypewriter() causes no visible jump
      if (twMsgId) setTypewriterMap(prev => ({ ...prev, [twMsgId!]: twTotalChars }))
    }

    utter.onend = () => { cleanup(); onTTSEnd(); resolve() }
    utter.onerror = () => { cleanup(); onTTSEnd(); resolve() }

    speechSynthesis.speak(utter)
  })

  const sendToRob = async (msg: string) => {
    if (!sessionActiveRef.current) return
    setIsTyping(true)
    startThinkingTimer()

    try {
      const { data } = await axios.post(`${baseURL}/api/english/chat`, { userMessage: msg })

      const toSpeak: Array<{ spokenText: string; displayText: string; msgId: string; displayOffset: number }> = []
      if (data.correction && data.correction !== '-') {
        const id = mkId()
        setMessages((p) => [...p, { id, sender: 'eklav', text: data.correction, type: 'correction' }])
        setTypewriterMap(prev => ({ ...prev, [id]: 0 }))
        toSpeak.push({ spokenText: 'Correction: ' + data.correction, displayText: data.correction, msgId: id, displayOffset: 'Correction: '.length })
      }
      if (data.reply) {
        const id = mkId()
        setMessages((p) => [...p, { id, sender: 'eklav', text: data.reply, type: 'reply' }])
        setTypewriterMap(prev => ({ ...prev, [id]: 0 }))
        toSpeak.push({ spokenText: data.reply, displayText: data.reply, msgId: id, displayOffset: 0 })
      }

      setIsTyping(false)
      stopThinkingTimer()

      for (const item of toSpeak) {
        if (!sessionActiveRef.current) break
        const sg = setTimeout(() => clearTypewriter(item.msgId), 8000)
        await speak(item.spokenText, { msgId: item.msgId, displayText: item.displayText, displayOffset: item.displayOffset })
        clearTimeout(sg)
        clearTypewriter(item.msgId)
      }
    } finally {
      setIsTyping(false)
      stopThinkingTimer()
    }
  }

  const resetSessionState = () => {
    clearSilenceTimer()
    noResponseCountRef.current = 0
    manualStopRef.current = false
    ttsCountRef.current = 0
    setBotSpeaking(false)
    stopThinkingTimer()
    isPausedRef.current = false
    setIsPaused(false)
    stopListening()
    speechSynthesis.cancel()
    transcriptRef.current = ''
    lastUserRef.current = ''
    setMessages([])
    setFeedback('')
    setFeedbackScore(null)
    setFeedbackBreakdown(null)
    setActiveSessionTab('conversation')
    setSessionStarted(true)
    setSessionEnded(false)
    setTimeLeft(180)
    setLiveSpeech('')
    setIsUserSpeaking(false)
  }

  const handlePause = () => {
    isPausedRef.current = true
    setIsPaused(true)
    clearSilenceTimer()
    stopListening()
    speechSynthesis.cancel()
    ttsCountRef.current = 0
    setBotSpeaking(false)
    stopThinkingTimer()
    setLiveSpeech('')
  }

  const handleResume = () => {
    isPausedRef.current = false
    setIsPaused(false)
    startListening()
    setTimeout(() => {
      if (sessionActiveRef.current && !isPausedRef.current) startSilenceTimer()
    }, 500)
  }

  const handleStartSession = async () => {
    resetSessionState()
    sessionActiveRef.current = true
    startMicMonitor()

    try {
      const res = await axios.post(`${baseURL}/api/english/start`)
      if (!sessionActiveRef.current) return
      const welcomeText = res.data.aiMessage
      const welcomeId = mkId()
      setMessages([{ id: welcomeId, sender: 'eklav', text: welcomeText, type: 'reply' }])
      setTypewriterMap(prev => ({ ...prev, [welcomeId]: 0 }))
      const sg = setTimeout(() => clearTypewriter(welcomeId), 8000)
      await speak(welcomeText, { msgId: welcomeId, displayText: welcomeText })
      clearTimeout(sg)
      clearTypewriter(welcomeId)
    } catch (err) {
      console.error('Session start error:', err)
    }
  }

  const handleEndSession = async () => {
    if (!sessionActiveRef.current) return
    clearSilenceTimer()
    noResponseCountRef.current = 0
    sessionActiveRef.current = false
    stopListening()
    stopMicMonitor()
    speechSynthesis.cancel()
    ttsCountRef.current = 0
    setBotSpeaking(false)
    stopThinkingTimer()
    setSessionEnded(true)
    setIsLoadingFeedback(true)
    setActiveSessionTab('feedback')

    try {
      const durationSeconds = Math.max(0, 180 - timeLeft)
      const res = await axios.post(`${baseURL}/api/english/end`, { transcript: transcriptRef.current, durationSeconds, timeLimit: 180 }, { headers: { Authorization: `Bearer ${token}` } })
      setFeedback(res.data.feedback || '')
      setFeedbackScore(res.data.score ?? null)
      setFeedbackBreakdown(res.data.breakdown ?? null)
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

  const [showSessionModal, setShowSessionModal] = useState(false)
  const [activeSessionTab, setActiveSessionTab] = useState<'conversation' | 'feedback'>('conversation')
  const topicsScrollRef = useRef<HTMLDivElement>(null)

  const BG_OPTIONS = [
    // ── Color gradients ───────────────────────────────────────────────────────
    { id: 'none',   style: 'transparent', canvasColors: undefined, label: 'None',   cat: 'color' },
    { id: 'dark',   style: 'linear-gradient(160deg,#0d1117 0%,#1a1f35 100%)',              canvasColors: ['#0d1117','#1a1f35'], label: 'Dark',   cat: 'color' },
    { id: 'ocean',  style: 'linear-gradient(160deg,#0ea5e9 0%,#0369a1 100%)',              canvasColors: ['#0ea5e9','#0369a1'], label: 'Ocean',  cat: 'color' },
    { id: 'purple', style: 'linear-gradient(160deg,#6d28d9 0%,#8b5cf6 100%)',              canvasColors: ['#6d28d9','#8b5cf6'], label: 'Purple', cat: 'color' },
    { id: 'slate',  style: 'linear-gradient(160deg,#334155 0%,#475569 100%)',              canvasColors: ['#334155','#475569'], label: 'Slate',  cat: 'color' },
    { id: 'warm',   style: 'linear-gradient(160deg,#f5e6d0 0%,#e8d5b0 50%,#d4b896 100%)', canvasColors: ['#f5e6d0','#d4b896'], label: 'Warm',   cat: 'color' },
    { id: 'green',  style: 'linear-gradient(160deg,#064e3b 0%,#065f46 100%)',              canvasColors: ['#064e3b','#065f46'], label: 'Green',  cat: 'color' },
    // ── Premium image backgrounds ─────────────────────────────────────────────
    {
      id: 'forest', label: 'Forest', cat: 'premium',
      style: 'linear-gradient(160deg,#14532d,#166534)',
      canvasColors: ['#14532d','#166534'],
      imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1280&auto=format&fit=crop',
      thumb:    'https://images.unsplash.com/photo-1448375240586-882707db888b?w=80&auto=format&fit=crop',
    },
    {
      id: 'office', label: 'Office', cat: 'premium',
      style: 'linear-gradient(160deg,#1e293b,#334155)',
      canvasColors: ['#1e293b','#334155'],
      imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1280&auto=format&fit=crop',
      thumb:    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=80&auto=format&fit=crop',
    },
    {
      id: 'cabin', label: 'Cabin', cat: 'premium',
      style: 'linear-gradient(160deg,#78350f,#92400e)',
      canvasColors: ['#78350f','#92400e'],
      imageUrl: 'https://images.unsplash.com/photo-1474552226712-ac0f0961a954?w=1280&auto=format&fit=crop',
      thumb:    'https://images.unsplash.com/photo-1474552226712-ac0f0961a954?w=80&auto=format&fit=crop',
    },
    {
      id: 'library', label: 'Library', cat: 'premium',
      style: 'linear-gradient(160deg,#1c1917,#292524)',
      canvasColors: ['#1c1917','#292524'],
      imageUrl: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1280&auto=format&fit=crop',
      thumb:    'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=80&auto=format&fit=crop',
    },
    {
      id: 'city', label: 'City', cat: 'premium',
      style: 'linear-gradient(160deg,#0f172a,#1e3a5f)',
      canvasColors: ['#0f172a','#1e3a5f'],
      imageUrl: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1280&auto=format&fit=crop',
      thumb:    'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=80&auto=format&fit=crop',
    },
    {
      id: 'beach', label: 'Beach', cat: 'premium',
      style: 'linear-gradient(160deg,#0284c7,#7dd3fc)',
      canvasColors: ['#0284c7','#7dd3fc'],
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1280&auto=format&fit=crop',
      thumb:    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=80&auto=format&fit=crop',
    },
  ]
  // AI Coach panel is just a colored backdrop behind the robot avatar (no
  // camera involved), so it keeps a real color as its default — only the
  // student's own camera panel defaults to "None" (raw feed, no processing).
  const [aiBgStyle, setAiBgStyle] = useState(BG_OPTIONS[1].style)
  const [youBgOption, setYouBgOption] = useState(BG_OPTIONS[0])
  // Whether the student has opted into a virtual background — until they do,
  // the raw webcam feed is shown as-is and the (heavier) ML segmentation
  // pipeline never even starts.
  const [youWantsBg, setYouWantsBg] = useState(false)
  const [showAiBgPicker, setShowAiBgPicker]   = useState(false)
  const [showYouBgPicker, setShowYouBgPicker] = useState(false)
  const scrollTopics = (direction: 1 | -1 = 1) => {
    if (topicsScrollRef.current) topicsScrollRef.current.scrollBy({ left: 200 * direction, behavior: 'smooth' })
  }

  const ORANGE = '#ff7a00'

  // Reads the same --dash-* CSS vars StudentLayout sets for dark mode
  // (light-mode values as fallback), so this page re-themes along with
  // the rest of the portal without needing its own theme plumbing.
  const PAGE_BG = 'var(--dash-page-bg, #f8fafc)'
  const CARD_BG = 'var(--dash-card-bg, #ffffff)'
  const PAGE_BORDER = 'var(--dash-border, #e2e8f0)'
  const PAGE_TEXT = 'var(--dash-text, #0f172a)'
  const PAGE_GRAY = 'var(--dash-gray, #64748b)'

  type Topic = { icon: React.ReactNode; title: string; desc: string; level: string; iconBg: string; iconColor: string }
  const TOPICS: Topic[] = [
    { icon: <FaUser />,       title: 'Self Introduction',     desc: 'Introduce yourself and your background.',              level: 'Easy',   iconBg: '#fed7aa', iconColor: '#ea580c' },
    { icon: <FaBullseye />,   title: 'Hobbies',               desc: 'Talk about your hobbies and interests.',                level: 'Easy',   iconBg: '#bbf7d0', iconColor: '#16a34a' },
    { icon: <FaUniversity />, title: 'Describe your College', desc: 'Describe your college, campus and activities.',         level: 'Medium', iconBg: '#bfdbfe', iconColor: '#2563eb' },
    { icon: <FaRocket />,     title: 'Future Goals',          desc: 'Talk about your short and long term goals.',            level: 'Medium', iconBg: '#e9d5ff', iconColor: '#7c3aed' },
    { icon: <FaLaptop />,     title: 'Technology',            desc: 'Discuss technology and its impact.',                    level: 'Hard',   iconBg: '#fecdd3', iconColor: '#dc2626' },
    { icon: <FaBriefcase />,  title: 'Job Interview',         desc: 'Practice common job interview questions.',              level: 'Hard',   iconBg: '#fef3c7', iconColor: '#d97706' },
    { icon: <FaGlobe />,      title: 'Travel & Tourism',      desc: 'Discuss travel experiences and destinations.',          level: 'Easy',   iconBg: '#ccfbf1', iconColor: '#0d9488' },
    { icon: <FaBook />,       title: 'Academic Discussion',   desc: 'Talk about academic topics and study life.',            level: 'Medium', iconBg: '#fce7f3', iconColor: '#db2777' },
    { icon: <FaUsers />,      title: 'Social Skills',         desc: 'Practice everyday social conversations.',               level: 'Easy',   iconBg: '#e0e7ff', iconColor: '#4338ca' },
    { icon: <FaChartLine />,  title: 'Current Affairs',       desc: 'Speak about news, events and global topics.',           level: 'Hard',   iconBg: '#d1fae5', iconColor: '#059669' },
  ]
  const LEVEL_COLOR: Record<string, string> = { Easy: '#22c55e', Medium: '#f59e0b', Hard: '#ef4444' }

  const handleOpenSession = () => {
    if (isLimitReached) return
    setShowSessionModal(true)
    setActiveSessionTab('conversation')
    setTimeout(() => startWebcam(), 100)
    // Start mic monitoring as soon as the preview is up, not only once the
    // session actually begins — the mute banner should be visible on this
    // pre-start screen too, since that's when a muted mic is easiest to miss.
    startMicMonitor()
  }

  const handleCloseSession = () => {
    // Cancel any in-progress speech/listening without generating feedback
    sessionActiveRef.current = false
    clearSilenceTimer()
    stopListening()
    stopMicMonitor()
    speechSynthesis.cancel()
    ttsCountRef.current = 0
    setBotSpeaking(false)
    stopThinkingTimer()
    stopWebcam()
    setShowSessionModal(false)
    setSessionStarted(false)
    setSessionEnded(false)
    setMessages([])
    setFeedback('')
    setFeedbackScore(null)
    setFeedbackBreakdown(null)
    setTimeLeft(180)
    setIsPaused(false)
    isPausedRef.current = false
  }

  const handleMicClick = async () => {
    if (sessionEnded) {
      restartSession()
    } else if (!sessionStarted) {
      await handleStartSession()
    } else if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  // Compute monthly averages from attempts that have breakdown data
  const attemptsWithBreakdown = history?.attempts?.filter((a: any) => a.breakdown) ?? []
  const avgBreakdown = attemptsWithBreakdown.length > 0 ? {
    grammar:    Math.round(attemptsWithBreakdown.reduce((s: number, a: any) => s + (a.breakdown.grammar    ?? 0), 0) / attemptsWithBreakdown.length),
    fluency:    Math.round(attemptsWithBreakdown.reduce((s: number, a: any) => s + (a.breakdown.fluency    ?? 0), 0) / attemptsWithBreakdown.length),
    vocabulary: Math.round(attemptsWithBreakdown.reduce((s: number, a: any) => s + (a.breakdown.vocabulary ?? 0), 0) / attemptsWithBreakdown.length),
  } : null
  const avgScore = history?.attempts?.length > 0
    ? Math.round(history.attempts.reduce((s: number, a: any) => s + (a.score ?? 0), 0) / history.attempts.length)
    : null

  const SKILL_BARS = avgBreakdown ? [
    { label: 'Fluency',    pct: Math.round(avgBreakdown.fluency    * 10), color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Grammar',    pct: Math.round(avgBreakdown.grammar    * 10), color: '#22c55e', bg: '#f0fdf4' },
    { label: 'Vocabulary', pct: Math.round(avgBreakdown.vocabulary * 10), color: '#06b6d4', bg: '#ecfeff' },
  ] : [
    { label: 'Fluency',    pct: 0, color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Grammar',    pct: 0, color: '#22c55e', bg: '#f0fdf4' },
    { label: 'Vocabulary', pct: 0, color: '#06b6d4', bg: '#ecfeff' },
  ]

  const handleViewDetailedFeedback = () => {
    if (!history?.latestFeedback) return
    setFeedback(history.latestFeedback)
    setFeedbackBreakdown(history.latestBreakdown ?? null)
    setFeedbackScore(history.latestScore ?? null)
    setActiveSessionTab('feedback')
    setShowSessionModal(true)
  }


  const overallPct = avgScore ?? 0
  const R = 46, CX = 56, CY = 56, SW = 9
  const C = 2 * Math.PI * R
  const greenOffset = C * (1 - overallPct / 100)

  const HERO_FEATURES = [
    { icon: <FaComments />,  label: 'Real Conversations', color: '#2563eb', bg: '#dbeafe' },
    { icon: <FaRobot />,     label: 'AI Feedback',        color: ORANGE,    bg: '#fff7ed' },
    { icon: <FaChartLine />, label: 'Track Progress',     color: '#16a34a', bg: '#dcfce7' },
    { icon: <FaBolt />,      label: 'Improve Skills',     color: '#7c3aed', bg: '#f3e8ff' },
  ]

  return (
    <div style={{ background: PAGE_BG, minHeight: '100vh', fontFamily: 'inherit' }}>

      {/* ── SESSION MODAL (full screen) ── */}
      {showSessionModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: CARD_BG, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

          {/* ── Header ── */}
          <div style={{ borderBottom: '1px solid #e2e8f0', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            {/* Left: title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#fff7ed', border: `1.5px solid ${ORANGE}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ORANGE, fontSize: 15 }}>
                <FaMicrophone />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14, color: PAGE_TEXT, lineHeight: 1.2 }}>Speaking with Eklav</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>Have a natural conversation and improve your communication skills</div>
              </div>
            </div>

            {/* Center: voice + timer + start/pause/stop */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <div style={{ display: 'flex', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 13px', background: PAGE_BG, fontSize: 12, fontWeight: 600, cursor: 'default', color: PAGE_TEXT, border: 'none', borderRight: '1px solid #e2e8f0' }}>
                  <FaMicrophone style={{ fontSize: 10 }} /> Voice
                </button>
                <button onClick={() => { setVoiceGender('male'); setSelectedVoiceName('') }}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 13px', background: voiceGender === 'male' ? '#fff7ed' : PAGE_BG, fontSize: 12, fontWeight: 600, cursor: 'pointer', color: voiceGender === 'male' ? ORANGE : PAGE_TEXT, border: 'none', borderRight: '1px solid #e2e8f0' }}>
                  <FaMale style={{ fontSize: 10 }} /> Male Voice
                </button>
                <button onClick={() => { setVoiceGender('female'); setSelectedVoiceName('') }}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 13px', background: voiceGender === 'female' ? '#fff7ed' : PAGE_BG, fontSize: 12, fontWeight: 600, cursor: 'pointer', color: voiceGender === 'female' ? ORANGE : PAGE_TEXT, border: 'none' }}>
                  <FaFemale style={{ fontSize: 10 }} /> Female Voice
                </button>
              </div>
              {/* Voice picker */}
              {voices.filter(v => v.lang.startsWith('en')).length > 0 && (
                <select
                  value={selectedVoiceName}
                  onChange={e => setSelectedVoiceName(e.target.value)}
                  style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '5px 10px', fontSize: 12, fontWeight: 600, color: selectedVoiceName ? ORANGE : PAGE_TEXT, background: PAGE_BG, cursor: 'pointer', outline: 'none', maxWidth: 180 }}
                >
                  <option value=''>Auto ({voiceGender})</option>
                  {voices
                    .filter(v => v.lang.startsWith('en'))
                    .map(v => (
                      <option key={v.name} value={v.name}>{v.name}</option>
                    ))
                  }
                </select>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: PAGE_BG, border: '1px solid #e2e8f0', borderRadius: 8, padding: '5px 12px' }}>
                <FaClock style={{ color: PAGE_TEXT, fontSize: 12 }} />
                <span style={{ fontWeight: 700, fontSize: 12, fontVariantNumeric: 'tabular-nums', color: PAGE_TEXT }}>Time Left: {formatTime(timeLeft)}</span>
              </div>

              {/* Start → Pause / Resume */}
              {!sessionStarted || sessionEnded ? (
                <button onClick={sessionEnded ? restartSession : handleStartSession}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, border: `1.5px solid ${ORANGE}`, borderRadius: 8, padding: '5px 14px', background: ORANGE, fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#fff' }}>
                  <FaPlay style={{ fontSize: 9 }} /> {sessionEnded ? 'Restart' : 'Start'}
                </button>
              ) : isPaused ? (
                <button onClick={handleResume}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, border: '1.5px solid #22c55e', borderRadius: 8, padding: '5px 14px', background: '#22c55e', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#fff' }}>
                  <FaPlay style={{ fontSize: 9 }} /> Resume
                </button>
              ) : (
                <button onClick={handlePause}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, border: '1px solid #e2e8f0', borderRadius: 8, padding: '5px 14px', background: CARD_BG, fontSize: 12, fontWeight: 600, cursor: 'pointer', color: PAGE_TEXT }}>
                  <FaPause style={{ fontSize: 9 }} /> Pause
                </button>
              )}

              {/* Stop — ends conversation & generates feedback */}
              {sessionStarted && !sessionEnded && (
                <button onClick={handleEndSession}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, border: '1.5px solid #ef4444', borderRadius: 8, padding: '5px 14px', background: CARD_BG, fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#ef4444' }}>
                  <FaStop style={{ fontSize: 9 }} /> Stop
                </button>
              )}
            </div>

            {/* Right: End Session — closes modal only */}
            <button onClick={handleCloseSession}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#ef4444', border: '1.5px solid #ef4444', borderRadius: 8, padding: '6px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#fff', flexShrink: 0 }}>
              <FaStop style={{ fontSize: 9 }} /> End Session
            </button>
          </div>

          {/* ── Keyframe styles ── */}
          <style>{`
            @keyframes roboFloat {
              0%,100% { transform: translateY(0px) rotate(0deg); }
              30%      { transform: translateY(-14px) rotate(1.5deg); }
              70%      { transform: translateY(-8px) rotate(-1deg); }
            }
            @keyframes roboSpeak {
              0%,100% { transform: translateY(-10px) scale(1); }
              25%     { transform: translateY(-16px) scale(1.03) rotate(2deg); }
              75%     { transform: translateY(-6px)  scale(1.03) rotate(-2deg); }
            }
            @keyframes roboWave {
              0%,100% { transform: translateY(-8px) rotate(-4deg); }
              25%     { transform: translateY(-14px) rotate(4deg); }
              50%     { transform: translateY(-8px)  rotate(-3deg); }
              75%     { transform: translateY(-13px) rotate(3deg); }
            }
            @keyframes glowRing {
              0%   { transform: translate(-50%,-50%) scale(0.85); opacity: 0.7; }
              100% { transform: translate(-50%,-50%) scale(2.2);  opacity: 0; }
            }
            @keyframes turnDotPulse {
              0%,100% { transform: scale(1);   opacity: 1; }
              50%     { transform: scale(1.6); opacity: 0.5; }
            }
            @keyframes lipBounce {
              0%,100% { transform: scaleY(1); }
              50%     { transform: scaleY(1.6); }
            }
            @keyframes earWiggle {
              0%,100% { transform: rotate(0deg); }
              30%     { transform: rotate(12deg); }
              70%     { transform: rotate(-10deg); }
            }
          `}</style>

          {/* ── Outer wrapper ── */}
          <div style={{ flex: 1, display: 'flex', minHeight: 0, margin: '12px 60px', background: CARD_BG, borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}>

          {/* ── LEFT: videos stacked ── */}
          <div style={{ width: '42%', flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid #e2e8f0', background: PAGE_BG, gap: 6, padding: 8, alignSelf: 'stretch' }}>
          {/* ── Video panels ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>

            {/* AI Coach panel — equal height */}
            <div style={{ position: 'relative', background: aiBgStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, overflow: 'hidden', flex: 1, minHeight: 0 }}>
              <div style={{ position: 'absolute', top: 10, left: 10, background: '#22c55e', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 5, zIndex: 3 }}>
                <FaRobot style={{ fontSize: 9 }} /> AI Coach
              </div>
              <button onClick={() => { setShowAiBgPicker(p => !p); setShowYouBgPicker(false) }}
                style={{ position: 'absolute', top: 10, right: 10, zIndex: 4, width: 26, height: 26, borderRadius: '50%', background: 'rgba(255,255,255,0.85)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}
                title="Change background">🎨</button>
              {showAiBgPicker && (
                <div style={{ position: 'absolute', top: 42, right: 10, zIndex: 20, background: CARD_BG, borderRadius: 12, padding: '10px', boxShadow: '0 8px 32px rgba(0,0,0,0.25)', display: 'flex', gap: 8, flexWrap: 'wrap', width: 160 }}>
                  {BG_OPTIONS.map(o => (
                    <button key={o.id} onClick={() => { setAiBgStyle(o.style); setShowAiBgPicker(false) }} title={o.label}
                      style={{ width: 32, height: 32, borderRadius: 8, background: o.style, border: aiBgStyle === o.style ? `3px solid ${ORANGE}` : '2px solid #e2e8f0', cursor: 'pointer' }} />
                  ))}
                </div>
              )}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 16px', zIndex: 2 }}>
                <AnimatedRobotSVG isSpeaking={botSpeaking} isListening={isListening} isTyping={isTyping} />
              </div>
              <div style={{ position: 'absolute', bottom: 10, left: 12, display: 'flex', gap: 2, alignItems: 'flex-end', zIndex: 3 }}>
                {[3,5,9,6,11,8,5,7,4,9,5,3,6,4,8].map((h, i) => (
                  <div key={i} style={{ width: 3, height: botSpeaking ? h * 2.5 : 4, background: ORANGE, borderRadius: 2, transition: 'height .18s', opacity: 0.95 }} />
                ))}
              </div>
              {/* ── Turn indicator — the actual fix: an unmissable, color-coded
                  badge that always says whose turn it is right now, instead of
                  students having to infer it from the avatar animation alone. */}
              {sessionStarted && !sessionEnded && !isPaused && (
                <div style={{
                  position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 3,
                  display: 'flex', alignItems: 'center', gap: 6, borderRadius: 20, padding: '5px 14px',
                  fontSize: 12, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap',
                  background: botSpeaking ? '#2563eb' : isTyping ? '#94a3b8' : isListening ? '#16a34a' : '#94a3b8',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)', transition: 'background .2s',
                }}>
                  {botSpeaking ? (
                    <><FaVolumeUp size={11} /> Robo is speaking…</>
                  ) : isTyping ? (
                    <>Robo is thinking… {thinkingSeconds}s</>
                  ) : isListening ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', animation: 'turnDotPulse 0.9s ease-in-out infinite' }} />
                      Your turn — speak now!
                    </span>
                  ) : (
                    <>Get ready…</>
                  )}
                </div>
              )}
            </div>

            {/* You panel — equal height */}
            <div style={{ position: 'relative', background: youWantsBg ? youBgOption.style : '#111827', overflow: 'hidden', borderRadius: 12, flex: 1, minHeight: 0 }}>
              {/* Video element: hidden when segmentation is ready (canvas takes over), visible as fallback */}
              <video ref={webcamRef} autoPlay playsInline muted style={{
                display: webcamActive && !segReady ? 'block' : 'none',
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1,
              }} />
              {/* Canvas shows the ML-segmented output: person on chosen virtual background */}
              <canvas ref={canvasRef} style={{
                display: webcamActive && segReady ? 'block' : 'none',
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1,
              }} />
              {/* Loading indicator while model initialises */}
              {youWantsBg && webcamActive && !segReady && (
                <div style={{ position: 'absolute', bottom: 40, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 5 }}>
                  <div style={{ background: 'rgba(0,0,0,0.6)', borderRadius: 20, padding: '4px 14px', color: '#fff', fontSize: 11, fontWeight: 600 }}>
                    Loading virtual background…
                  </div>
                </div>
              )}
              {/* Avatar shown when webcam not active */}
              {!webcamActive && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.7)', fontSize: 36 }}>
                    <FaUser />
                  </div>
                </div>
              )}
              <div style={{ position: 'absolute', top: 10, left: 10, background: '#2563eb', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 5, zIndex: 10 }}>
                <FaUser style={{ fontSize: 9 }} /> You
              </div>
              {/* Background picker */}
              <button onClick={() => { setShowYouBgPicker(p => !p); setShowAiBgPicker(false) }}
                style={{ position: 'absolute', top: 10, right: 10, zIndex: 10, width: 26, height: 26, borderRadius: '50%', background: 'rgba(255,255,255,0.85)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}
                title="Change virtual background">🎨</button>
              {showYouBgPicker && (
                <div style={{ position: 'absolute', top: 42, right: 10, zIndex: 30, background: CARD_BG, borderRadius: 14, padding: '12px', boxShadow: '0 12px 40px rgba(0,0,0,0.28)', width: 210 }}>
                  {/* Color section */}
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', marginBottom: 6 }}>COLORS</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                    {BG_OPTIONS.filter(o => o.cat === 'color').map(o => (
                      <button key={o.id} title={o.label}
                        onClick={() => applyYouBg(o)}
                        style={{
                          width: 28, height: 28, borderRadius: 7,
                          background: o.id === 'none' ? PAGE_BG : o.style,
                          border: youBgOption.id === o.id ? '3px solid #2563eb' : '2px solid #e2e8f0', cursor: 'pointer', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: PAGE_GRAY, fontWeight: 700,
                        }}>
                        {o.id === 'none' ? '✕' : ''}
                      </button>
                    ))}
                  </div>
                  {/* Premium image section */}
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                    PREMIUM ✨
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                    {BG_OPTIONS.filter(o => o.cat === 'premium').map(o => (
                      <button key={o.id} title={o.label}
                        onClick={() => applyYouBg(o)}
                        style={{
                          width: '100%', aspectRatio: '16/10', borderRadius: 8, padding: 0, overflow: 'hidden', cursor: 'pointer',
                          border: youBgOption.id === o.id ? '3px solid #2563eb' : '2px solid #e2e8f0',
                          backgroundImage: (o as any).thumb ? `url(${(o as any).thumb})` : o.style,
                          backgroundSize: 'cover', backgroundPosition: 'center',
                          position: 'relative',
                        }}>
                        <span style={{ position: 'absolute', bottom: 2, left: 0, right: 0, textAlign: 'center', fontSize: 9, fontWeight: 700, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.8)', background: 'linear-gradient(transparent, rgba(0,0,0,0.5))', padding: '2px 0' }}>
                          {o.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ position: 'absolute', bottom: 10, left: 12, display: 'flex', gap: 2, alignItems: 'flex-end', zIndex: 10 }}>
                {[3,5,9,6,11,8,5,7,4,9,5,3,6,4,8].map((h, i) => (
                  <div key={i} style={{ width: 3, height: isListening && isUserSpeaking ? h * 2.5 : 4, background: '#3b82f6', borderRadius: 2, transition: 'height .15s', opacity: 0.9 }} />
                ))}
              </div>
            </div>
          </div>{/* end video stack */}
          </div>{/* end left panel */}

          {/* ── RIGHT: Conversation / Feedback ── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, background: CARD_BG }}>

            {/* Tab bar */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
              {(['conversation', 'feedback'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveSessionTab(tab)}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'none', border: 'none', borderBottom: activeSessionTab === tab ? `2.5px solid ${ORANGE}` : '2.5px solid transparent', borderRight: tab === 'conversation' ? '1px solid #e2e8f0' : 'none', marginBottom: -1, padding: '12px 16px', fontSize: 13, fontWeight: activeSessionTab === tab ? 700 : 500, color: activeSessionTab === tab ? ORANGE : '#64748b', cursor: 'pointer' }}>
                  {tab === 'conversation' ? <><FaComments style={{ fontSize: 12 }} /> Conversation</> : <><FaClipboardList style={{ fontSize: 12 }} /> Feedback</>}
                </button>
              ))}
            </div>

            {/* Chat / Feedback body */}
            <div ref={chatBodyRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', background: PAGE_BG }}>
              {activeSessionTab === 'conversation' ? (
                <>
                  {messages.length === 0 && !isTyping && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center' }}>
                      <div style={{ fontSize: 13, color: '#94a3b8' }}>
                        {!sessionStarted ? 'Click Start to begin your session' : 'Waiting for conversation...'}
                      </div>
                    </div>
                  )}
                  {messages.map((m, i) => {
                    const isTypingOut = m.sender === 'eklav' && typewriterMap[m.id] !== undefined
                    const twPos = typewriterMap[m.id] ?? 0
                    const displayText = isTypingOut && twPos > 0 ? m.text.slice(0, twPos) : m.text
                    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    return (
                      <div key={i} style={{ display: 'flex', justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
                        {m.sender !== 'user' && (
                          <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#fff7ed', border: `1.5px solid ${ORANGE}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ORANGE, fontSize: 13, marginRight: 8, flexShrink: 0 }}>
                            <FaRobot />
                          </div>
                        )}
                        <div style={{ maxWidth: '70%' }}>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3, textAlign: m.sender === 'user' ? 'right' : 'left' }}>
                            {m.sender === 'user' ? 'You' : 'AI Coach'} · {time}
                          </div>
                          <div style={{ background: m.sender === 'user' ? '#dbeafe' : m.type === 'correction' ? '#f0fdf4' : '#fff', border: m.type === 'correction' ? '1px solid #bbf7d0' : '1px solid #e2e8f0', borderRadius: m.sender === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px', padding: '10px 15px', fontSize: 15, fontFamily: '"Segoe UI", system-ui, sans-serif', color: '#0f172a', lineHeight: 1.65 }}>
                            {m.type === 'correction' && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#22c55e', marginBottom: 4 }}>
                                <FaCheck /> Improved
                              </div>
                            )}
                            {displayText}{isTypingOut && <span style={{ animation: 'blink 1s infinite' }}>|</span>}
                          </div>
                        </div>
                        {m.sender === 'user' && (
                          <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', fontSize: 13, marginLeft: 8, flexShrink: 0 }}>
                            <FaUser />
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {liveSpeech ? (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                      <div style={{ maxWidth: '70%', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '14px 14px 4px 14px', padding: '8px 13px', fontSize: 13, color: '#1e40af', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FaMicrophone style={{ flexShrink: 0 }} /> {liveSpeech}
                        <span style={{ display: 'inline-block', width: 2, height: 14, background: '#1e40af', animation: 'turnDotPulse 0.9s ease-in-out infinite', flexShrink: 0 }} />
                      </div>
                    </div>
                  ) : isListening && (
                    // Placeholder bubble right where the student's transcribed
                    // speech will appear once they start talking — makes it
                    // obvious it's their turn AND exactly where to look,
                    // instead of an empty chat area giving no feedback at all.
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                      <div style={{ maxWidth: '70%', background: '#eff6ff', border: '1px dashed #bfdbfe', borderRadius: '14px 14px 4px 14px', padding: '8px 13px', fontSize: 13, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: 7 }}>
                        <FaMicrophone style={{ flexShrink: 0 }} />
                        <span>Listening for your answer</span>
                        <span style={{ display: 'inline-block', width: 2, height: 14, background: '#3b82f6', animation: 'turnDotPulse 0.9s ease-in-out infinite', flexShrink: 0 }} />
                      </div>
                    </div>
                  )}
                  {isTyping && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: ORANGE, fontSize: 13 }}>
                        <FaRobot />
                      </div>
                      <div style={{ background: CARD_BG, border: '1px solid #e2e8f0', borderRadius: '14px 14px 14px 4px', padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {[0,1,2].map(j => <div key={j} style={{ width: 6, height: 6, borderRadius: '50%', background: '#94a3b8', animation: `bounce 1.2s infinite ${j * 0.2}s` }} />)}
                        </div>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>{thinkingSeconds}s</span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  {!feedback && !isLoadingFeedback ? (
                    <div style={{ textAlign: 'center', color: '#94a3b8', padding: '48px 0' }}>
                      <div style={{ fontSize: 36, marginBottom: 10, display: 'flex', justifyContent: 'center', opacity: 0.4 }}><FaFileAlt /></div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: PAGE_GRAY }}>No Feedback Yet</div>
                      <div style={{ fontSize: 12, marginTop: 6, color: '#94a3b8' }}>Complete the session to see your analysis</div>
                    </div>
                  ) : isLoadingFeedback ? (
                    <div style={{ textAlign: 'center', padding: '48px 0' }}>
                      <Spinner animation="border" style={{ color: ORANGE }} />
                      <div style={{ marginTop: 12, color: PAGE_GRAY, fontSize: 13, fontWeight: 500 }}>Analyzing your session...</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>This may take a few seconds</div>
                    </div>
                  ) : (() => {
                    // Strip all markdown artifacts and emoji numbers
                    const cleanMd = (t: string) =>
                      t.replace(/\*\*(.*?)\*\*/g, '$1')
                       .replace(/\*(.*?)\*/g, '$1')
                       .replace(/^[*\-•.\s]*[1-9]?[0-9]?[️⃣🔟1234567890]*[.):\s]*/u, '')
                       .replace(/^[*\-•.\s]+/, '')
                       .trim()

                    const lines = feedback.split('\n').map(l => l.trim()).filter(Boolean)

                    // Skip lines that are just score summaries or section headers
                    const isScoreLine = (l: string) =>
                      /score\s*:\s*\*?\*?\s*\d+\/10/i.test(l) ||
                      /grammar score|fluency score|vocabulary score/i.test(l) ||
                      /friendly improvement tips?/i.test(l) ||
                      /improvement tips?:/i.test(l)

                    const tips = lines
                      .filter(l => !isScoreLine(l))
                      .filter(l => /^[-•*.1-9]|^\d+[.)]/.test(l) || l.startsWith('.'))
                      .map(l => cleanMd(l))
                      .filter(t => t.length > 8)

                    const overallLine = lines.filter(l =>
                      !isScoreLine(l) && (
                        l.toLowerCase().includes('overall') || l.toLowerCase().includes('keep') ||
                        l.toLowerCase().includes('great') || l.toLowerCase().includes('well done') ||
                        l.toLowerCase().includes('excellent') || l.toLowerCase().includes('practice')
                      )
                    ).slice(-1)[0] || ''

                    const scoreColor  = (s: number) => s >= 8 ? '#16a34a' : s >= 6 ? '#d97706' : '#dc2626'
                    const scoreBg     = (s: number) => s >= 8 ? '#f0fdf4' : s >= 6 ? '#fffbeb' : '#fef2f2'
                    const scoreLabel  = (s: number) => s >= 8 ? 'Good' : s >= 6 ? 'Average' : 'Needs Improvement'
                    const scoreTrend  = (s: number) => s >= 8 ? <FaArrowUp style={{ fontSize: 9 }} /> : s >= 6 ? <FaArrowUp style={{ fontSize: 9 }} /> : <FaArrowDown style={{ fontSize: 9 }} />
                    const overallPct  = feedbackScore ?? 0
                    const overallColor = overallPct >= 70 ? '#16a34a' : overallPct >= 50 ? '#d97706' : '#dc2626'
                    const overallGrade = overallPct >= 80 ? 'Excellent' : overallPct >= 60 ? 'Good' : overallPct >= 40 ? 'Average' : 'Needs Work'
                    const overallMsg   = overallPct >= 80 ? 'Excellent performance! Keep it up.' : overallPct >= 60 ? 'Good effort! Keep practicing to improve your skills.' : 'Keep practicing to improve your skills.'

                    const metrics = feedbackBreakdown
                      ? [
                          { label: 'Grammar',    score: feedbackBreakdown.grammar,    icon: <FaSpellCheck />,     iconBg: '#fef2f2', iconColor: scoreColor(feedbackBreakdown.grammar) },
                          { label: 'Fluency',    score: feedbackBreakdown.fluency,    icon: <FaTachometerAlt />,  iconBg: '#fffbeb', iconColor: scoreColor(feedbackBreakdown.fluency) },
                          { label: 'Vocabulary', score: feedbackBreakdown.vocabulary, icon: <FaFont />,           iconBg: '#f0fdf4', iconColor: scoreColor(feedbackBreakdown.vocabulary) },
                        ]
                      : []

                    const focusAreas = metrics.filter(m => m.score < 7).map(m => m.label)
                    const goodAreas  = metrics.filter(m => m.score >= 7).map(m => m.label)
                    const nextGoal   = overallPct >= 80 ? '90+' : overallPct >= 60 ? '80+' : '70+'

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                        {/* Header */}
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 15, color: PAGE_TEXT }}>Performance Summary</div>
                          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
                            Your overall interview performance <FaInfoCircle style={{ fontSize: 11 }} />
                          </div>
                        </div>

                        {/* Score + metrics row */}
                        <div style={{ background: CARD_BG, border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px', display: 'flex', gap: 12, alignItems: 'stretch' }}>

                          {/* Overall circle */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingRight: 16, borderRight: '1px solid #e2e8f0', flexShrink: 0 }}>
                            <div style={{ position: 'relative', width: 80, height: 80 }}>
                              <svg width="80" height="80" viewBox="0 0 80 80">
                                <circle cx="40" cy="40" r="34" fill="none" stroke="#e2e8f0" strokeWidth="6"/>
                                <circle cx="40" cy="40" r="34" fill="none" stroke={overallColor} strokeWidth="6"
                                  strokeDasharray={`${(overallPct / 100) * 213.6} 213.6`}
                                  strokeLinecap="round" transform="rotate(-90 40 40)"/>
                              </svg>
                              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: 20, fontWeight: 900, color: overallColor, lineHeight: 1 }}>{overallPct}</span>
                                <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>/100</span>
                              </div>
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14, color: PAGE_TEXT, marginBottom: 6 }}>Session Score</div>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: `${overallColor}12`, border: `1px solid ${overallColor}30`, borderRadius: 20, padding: '3px 10px', marginBottom: 8 }}>
                                <FaStar style={{ color: overallColor, fontSize: 10 }} />
                                <span style={{ fontSize: 11, fontWeight: 700, color: overallColor }}>{overallGrade}</span>
                              </div>
                              <div style={{ fontSize: 12, color: PAGE_GRAY, lineHeight: 1.5, maxWidth: 130 }}>{overallMsg}</div>
                            </div>
                          </div>

                          {/* Metric cards */}
                          {metrics.map(m => (
                            <div key={m.label} style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 14px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                <div style={{ width: 34, height: 34, borderRadius: 10, background: m.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: m.iconColor, fontSize: 14, flexShrink: 0 }}>
                                  {m.icon}
                                </div>
                                <span style={{ fontWeight: 700, fontSize: 13, color: PAGE_TEXT }}>{m.label}</span>
                              </div>
                              <div style={{ fontSize: 22, fontWeight: 900, color: scoreColor(m.score), lineHeight: 1, marginBottom: 6 }}>
                                {m.score}<span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>/10</span>
                              </div>
                              <div style={{ height: 4, borderRadius: 4, background: '#e2e8f0', marginBottom: 8 }}>
                                <div style={{ height: '100%', borderRadius: 4, background: scoreColor(m.score), width: `${m.score * 10}%`, transition: 'width 0.8s ease' }}/>
                              </div>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: `${scoreColor(m.score)}12`, border: `1px solid ${scoreColor(m.score)}25`, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600, color: scoreColor(m.score), whiteSpace: 'nowrap' }}>
                                {scoreTrend(m.score)} {scoreLabel(m.score)}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Insights row */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
                          <div style={{ background: CARD_BG, border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 12px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <FaBullseye style={{ color: '#7c3aed', fontSize: 14 }} />
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 12, color: '#7c3aed' }}>Focus Areas</div>
                              <div style={{ fontSize: 11, color: PAGE_GRAY, marginTop: 2 }}>{focusAreas.length > 0 ? focusAreas.join(', ') : 'All areas good!'}</div>
                            </div>
                          </div>
                          <div style={{ background: CARD_BG, border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 12px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <FaChartLine style={{ color: '#2563eb', fontSize: 14 }} />
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 12, color: '#2563eb' }}>Keep It Up</div>
                              <div style={{ fontSize: 11, color: PAGE_GRAY, marginTop: 2 }}>{goodAreas.length > 0 ? `Your ${goodAreas.join(', ')} ${goodAreas.length > 1 ? 'are' : 'is'} Good!` : 'Practice more!'}</div>
                            </div>
                          </div>
                          <div style={{ background: CARD_BG, border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 12px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <FaClock style={{ color: '#16a34a', fontSize: 14 }} />
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 12, color: '#16a34a' }}>Practice Regularly</div>
                              <div style={{ fontSize: 11, color: PAGE_GRAY, marginTop: 2 }}>Consistency leads to improvement</div>
                            </div>
                          </div>
                          <div style={{ background: CARD_BG, border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 12px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#fef9c3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <FaStar style={{ color: '#ca8a04', fontSize: 14 }} />
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 12, color: '#ca8a04' }}>Next Goal</div>
                              <div style={{ fontSize: 11, color: PAGE_GRAY, marginTop: 2 }}>Aim for {nextGoal} in your next session</div>
                            </div>
                          </div>
                        </div>

                        {/* Improvement tips */}
                        {tips.length > 0 && (
                          <div style={{ background: CARD_BG, border: '1px solid #e2e8f0', borderRadius: 14, padding: '14px 16px' }}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: PAGE_TEXT, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 26, height: 26, borderRadius: 8, background: `${ORANGE}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <FaLightbulb style={{ color: ORANGE, fontSize: 13 }} />
                              </div>
                              Areas to Improve
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {tips.slice(0, 6).map((tip, i) => {
                                const colonIdx = tip.indexOf(':')
                                const hasTitle = colonIdx > 0 && colonIdx < 40
                                const title = hasTitle ? tip.slice(0, colonIdx).trim() : null
                                const body = hasTitle ? tip.slice(colonIdx + 1).trim() : tip
                                return (
                                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: PAGE_BG, borderRadius: 10, padding: '10px 12px', border: '1px solid #e2e8f0' }}>
                                    <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: '50%', background: ORANGE, color: '#fff', fontWeight: 700, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>{i + 1}</span>
                                    <span style={{ fontSize: 12.5, color: PAGE_TEXT, lineHeight: 1.6 }}>
                                      {title && <strong style={{ color: PAGE_TEXT }}>{title}: </strong>}
                                      {body}
                                    </span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>

            {/* ── Mic bar ── */}
            <div style={{ background: CARD_BG, borderTop: '1px solid #e2e8f0', padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, minHeight: 44 }}>
              <div style={{
                flex: 1, fontSize: 12.5, fontWeight: isListening ? 700 : 500,
                color: isPaused || sessionEnded || !sessionStarted ? '#94a3b8' : botSpeaking ? '#2563eb' : isTyping ? '#94a3b8' : isListening ? '#16a34a' : '#94a3b8',
              }}>
                {isPaused ? 'Session paused...'
                  : sessionEnded ? 'Session ended'
                  : !sessionStarted ? 'Click the mic and start speaking...'
                  : botSpeaking ? '🔊 Robo is speaking — listen up'
                  : isTyping ? `Robo is thinking… ${thinkingSeconds}s`
                  : isListening ? '🎤 Your turn — speak now!'
                  : 'Get ready…'}
              </div>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {/* Popup — appears anchored above the mic button, Meet-style,
                    with a small pointer triangle connecting the two. */}
                {showMicMutePopup && micWarning === 'muted' && (
                  <>
                    <div onClick={() => { setShowMicMutePopup(false); micMutePopupDismissedRef.current = true }} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                    <div style={{ position: 'absolute', bottom: 'calc(100% + 14px)', right: -20, width: 280, background: '#3c4043', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.35)', padding: '14px 16px', zIndex: 50, textAlign: 'left' }}>
                      <button
                        onClick={() => { setShowMicMutePopup(false); micMutePopupDismissedRef.current = true }}
                        style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', color: '#9aa0a6', cursor: 'pointer', padding: 2, display: 'flex' }}
                      >
                        <FaTimes size={13} />
                      </button>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, paddingRight: 18 }}>
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#fbbc04', color: '#202124', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 900 }}>
                          !
                        </div>
                        <span style={{ fontSize: 13.5, fontWeight: 700, color: '#fff' }}>Microphone muted by system</span>
                      </div>
                      <p style={{ fontSize: 12.5, color: '#dadce0', margin: '0 0 10px', lineHeight: 1.5 }}>
                        Go to your computer's settings to unmute your mic and increase its level
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => { openSoundSettings(); setShowMicMutePopup(false); micMutePopupDismissedRef.current = true }}
                          style={{ background: 'none', border: 'none', color: '#8ab4f8', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '4px 2px' }}
                        >
                          Open Sound Settings
                        </button>
                      </div>
                      {/* Pointer triangle */}
                      <div style={{ position: 'absolute', top: '100%', right: 26, width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: '8px solid #3c4043' }} />
                    </div>
                  </>
                )}
                <button onClick={handleMicClick} disabled={isPaused && !sessionEnded}
                  style={{ width: 36, height: 36, borderRadius: '50%', background: sessionEnded ? '#22c55e' : isListening ? '#ef4444' : ORANGE, border: 'none', cursor: (isPaused && !sessionEnded) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 15, boxShadow: `0 3px 12px ${isListening ? '#ef444455' : ORANGE + '55'}`, transition: 'all .2s', opacity: (isPaused && !sessionEnded) ? 0.5 : 1 }}>
                  {sessionEnded ? <FaSyncAlt /> : isListening ? <FaStop /> : <FaMicrophone />}
                </button>
                {/* Small warning badge on the mic button itself */}
                {micWarning === 'muted' && (
                  <button
                    onClick={e => { e.stopPropagation(); setShowMicMutePopup(p => !p); micMutePopupDismissedRef.current = false }}
                    style={{ position: 'absolute', top: -3, right: -3, width: 16, height: 16, borderRadius: '50%', background: '#fbbc04', color: '#202124', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, cursor: 'pointer', padding: 0 }}
                  >
                    !
                  </button>
                )}
              </div>
              {micWarning && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#ef4444', fontWeight: 600 }}>
                  <FaExclamationTriangle /> {micWarning === 'muted' ? 'Mic muted' : 'Mic low'}
                </div>
              )}
            </div>
          </div>{/* end right conversation panel */}

          </div>{/* end outer wrapper */}

        </div>
      )}

      {/* ── LANDING PAGE ── */}
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

        {/* Header + hero + sidebar row */}
        <div style={{ display: 'flex' }}>

        {/* Main content */}
        <div style={{ flex: 1, padding: '20px 24px', minWidth: 0, display: 'flex', flexDirection: 'column' }}>

          {/* Page header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: ORANGE, fontSize: 20 }}>
                <FaMicrophone />
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: PAGE_TEXT, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  Speaking Practice With AI
                  {moduleInfoLoaded && !hasAccess && (
                    <span title="Unlock this module, or subscribe to a full plan" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: ORANGE, fontSize: 12, fontWeight: 700 }}>
                      🔒 (Premium Module)
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: PAGE_GRAY }}>Improve your spoken English through real conversations and get AI-powered feedback.</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {modulePurchased && (
                <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <FaTrophy size={13} color="#16a34a" />
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: '#166534', whiteSpace: 'nowrap' }}>
                    Unlocked{moduleInfo?.endDate ? ` — valid until ${new Date(moduleInfo.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}` : ''}
                  </span>
                </div>
              )}
              <button onClick={() => setShowHowItWorks(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, border: `1.5px solid ${ORANGE}`, borderRadius: 10, padding: '8px 16px', background: CARD_BG, color: ORANGE, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                <FaInfoCircle /> How it works?
              </button>
            </div>
          </div>
          {buyError && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 10, padding: '10px 16px', fontSize: 12.5, marginBottom: 16 }}>
              {buyError}
            </div>
          )}

          {/* Hero banner */}
          <div style={{ flex: 1, background: 'linear-gradient(135deg, #fce7f3 0%, #f9a8d4 60%, #f472b6 100%)', borderRadius: 20, padding: '40px 32px', marginBottom: 24, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 230 }}>
            <div style={{ maxWidth: 640, position: 'relative', zIndex: 2 }}>
              {/* Fixed dark text — this banner's pink background never changes with theme */}
              <h2 style={{ fontSize: 28, fontWeight: 900, color: '#1e293b', margin: '0 0 8px', lineHeight: 1.2 }}>Practice. Speak. Improve.</h2>
              <p style={{ fontSize: 13.5, color: '#475569', margin: '0 0 16px', lineHeight: 1.6 }}>Have real conversations with our AI coach and enhance your fluency, pronunciation and confidence.</p>
              <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
                {HERO_FEATURES.map(f => (
                  <div key={f.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: f.color, fontSize: 17, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>{f.icon}</div>
                    <span style={{ fontSize: 10, fontWeight: 600, color: PAGE_GRAY, textAlign: 'center' }}>{f.label}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 14 }}>
                {[4,6,10,7,13,9,6,10,8,13,9,6,10,7,4].map((h, i) => (
                  <div key={i} style={{ width: 3, height: h * 2, background: ORANGE, borderRadius: 2, opacity: 0.6 }} />
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'nowrap' }}>
                <button onClick={handleOpenSession} disabled={!moduleInfoLoaded || isLimitReached}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: ORANGE, color: '#fff', border: 'none', borderRadius: 14, padding: '14px 22px', fontSize: 14, fontWeight: 800, cursor: (!moduleInfoLoaded || isLimitReached) ? 'not-allowed' : 'pointer', boxShadow: `0 6px 20px ${ORANGE}55`, opacity: (!moduleInfoLoaded || isLimitReached) ? 0.5 : 1, whiteSpace: 'nowrap', flexShrink: 0 }}>
                  <FaMicrophone /> {!moduleInfoLoaded ? 'Loading…' : !hasAccess ? 'Locked — Unlock to Start' : 'Start Speaking Now'}
                </button>

                {moduleInfoLoaded && !hasAccess && (() => {
                  const price6 = (moduleInfo?.plans?.['6months'] ?? 19900) / 100
                  const price12 = (moduleInfo?.plans?.['12months'] ?? 34900) / 100
                  const betterValue = price12 / 12 < price6 / 6
                  const isBusy = buyingPlan === selectedPlan
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: 'rgba(255,255,255,0.85)', border: '1px solid #f0d9c0', borderRadius: 10, padding: 4, flexShrink: 0 }}>
                      {(['6months', '12months'] as const).map((plan) => {
                        const price = plan === '6months' ? price6 : price12
                        const active = selectedPlan === plan
                        const highlight = plan === '12months' && betterValue
                        return (
                          <button
                            key={plan}
                            onClick={() => setSelectedPlan(plan)}
                            style={{
                              position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                              padding: '6px 14px', borderRadius: 7, minWidth: 78,
                              border: active ? `1.5px solid ${ORANGE}` : '1.5px solid transparent', cursor: 'pointer',
                              background: active ? '#fff' : 'transparent',
                            }}
                          >
                            {highlight && (
                              <span style={{
                                position: 'absolute', top: -8, right: -4, background: '#16a34a', color: '#fff', fontSize: 8.5,
                                fontWeight: 700, letterSpacing: 0.2, borderRadius: 10, padding: '2px 5px', whiteSpace: 'nowrap',
                              }}>
                                BEST
                              </span>
                            )}
                            <span style={{ fontSize: 10.5, fontWeight: 700, color: active ? ORANGE : '#999', whiteSpace: 'nowrap' }}>
                              {plan === '6months' ? '6 Months' : '12 Months'}
                            </span>
                            <span style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a' }}>₹{price}</span>
                          </button>
                        )
                      })}
                      <button
                        onClick={() => buyModule(selectedPlan)}
                        disabled={!!buyingPlan || !moduleInfo}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6, background: ORANGE, border: 'none', color: '#fff',
                          borderRadius: 7, padding: '9px 18px', fontSize: 12.5, fontWeight: 700, marginLeft: 6,
                          cursor: buyingPlan ? 'not-allowed' : 'pointer', opacity: buyingPlan && !isBusy ? 0.5 : 1,
                        }}
                      >
                        {isBusy ? 'Processing…' : 'Buy Now'}
                      </button>
                    </div>
                  )
                })()}
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                <FaClock /> Jump into a real conversation for just 60 seconds!
              </div>
            </div>
            <div style={{ position: 'relative', zIndex: 2, flexShrink: 0 }}>
              <img src={robotSpeakingImg} alt="Robot speaking" style={{ height: 300, width: 'auto', objectFit: 'contain', display: 'block' }} />
            </div>
            <div style={{ position: 'absolute', top: -40, right: 200, width: 180, height: 180, borderRadius: '50%', background: 'rgba(236,72,153,0.08)', zIndex: 1 }} />
            <div style={{ position: 'absolute', bottom: -60, right: 80, width: 200, height: 200, borderRadius: '50%', background: 'rgba(236,72,153,0.05)', zIndex: 1 }} />
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ width: 280, flexShrink: 0, padding: '20px 20px 20px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Your Speaking Progress */}
          <div style={{ background: CARD_BG, border: '1.5px solid #e2e8f0', borderRadius: 16, padding: '18px 16px' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: PAGE_TEXT, marginBottom: 4 }}>Your Speaking Progress</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 10 }}>This Month · {history?.attemptsUsed ?? 0} session{history?.attemptsUsed !== 1 ? 's' : ''}</div>

            {/* Attempts left bar */}
            {(() => {
              const used = history?.attemptsUsed ?? 0
              const limit = history?.monthlyLimit ?? 30
              const remaining = Math.max(0, limit - used)
              const usedPct = Math.round((used / limit) * 100)
              const isLow = remaining <= 5
              return (
                <div style={{ background: PAGE_BG, borderRadius: 10, padding: '10px 12px', marginBottom: 14, border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: PAGE_TEXT }}>
                      <FaBullseye style={{ color: isLow ? '#ef4444' : ORANGE, fontSize: 11 }} />
                      Attempts This Month
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: isLow ? '#ef4444' : '#0f172a' }}>
                      {remaining} left
                    </span>
                  </div>
                  <div style={{ height: 5, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden', marginBottom: 5 }}>
                    <div style={{ height: '100%', width: `${usedPct}%`, background: isLow ? '#ef4444' : ORANGE, borderRadius: 3, transition: 'width 0.8s ease' }} />
                  </div>
                  <div style={{ fontSize: 10, color: '#94a3b8', textAlign: 'right' }}>{used} / {limit} used</div>
                </div>
              )
            })()}

            {!history || history.attemptsUsed === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8' }}>
                <FaMicrophone style={{ fontSize: 28, marginBottom: 8, color: '#cbd5e1' }} />
                <div style={{ fontSize: 12, fontWeight: 600, color: PAGE_GRAY }}>No sessions yet</div>
                <div style={{ fontSize: 11, marginTop: 4 }}>Start speaking to see your progress</div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                  <div style={{ position: 'relative', width: 112, height: 112, flexShrink: 0 }}>
                    <svg width="112" height="112" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#e2e8f0" strokeWidth={SW} />
                      <circle cx={CX} cy={CY} r={R} fill="none" stroke={overallPct >= 70 ? '#22c55e' : ORANGE} strokeWidth={SW} strokeLinecap="round"
                        strokeDasharray={C} strokeDashoffset={greenOffset} />
                      <circle cx={CX} cy={CY} r={R} fill="none" stroke={ORANGE} strokeWidth={SW} strokeLinecap="round"
                        strokeDasharray={`16 ${C - 16}`} strokeDashoffset={greenOffset + 8} />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: PAGE_TEXT }}>{overallPct}%</div>
                      <div style={{ fontSize: 10, color: PAGE_GRAY, fontWeight: 600 }}>Avg Score</div>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: overallPct >= 70 ? '#22c55e' : ORANGE }}>
                      {overallPct >= 80 ? 'Excellent!' : overallPct >= 60 ? 'Great Progress!' : 'Keep Practicing!'}
                    </div>
                    <div style={{ fontSize: 11, color: PAGE_GRAY, marginTop: 3 }}>
                      {history?.trend === 'IMPROVED' ? '↑ Improving this month' :
                       history?.trend === 'DROPPED'  ? '↓ Keep going, you can do it!' :
                       history?.trend === 'SAME'     ? '→ Consistent performance' :
                       'Keep practicing to reach 100%'}
                    </div>
                  </div>
                </div>

                {/* Best Score bar */}
                {history?.highestScore != null && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333ea', fontSize: 10 }}>
                          <FaStar />
                        </div>
                        <span style={{ fontSize: 12, color: PAGE_TEXT, fontWeight: 500 }}>Best Score</span>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: PAGE_TEXT }}>{history.highestScore}%</span>
                    </div>
                    <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${history.highestScore}%`, background: '#9333ea', borderRadius: 3, transition: 'width 0.8s ease' }} />
                    </div>
                  </div>
                )}

                {SKILL_BARS.map(s => (
                  <div key={s.label} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, fontSize: 10 }}>
                          <FaBolt />
                        </div>
                        <span style={{ fontSize: 12, color: PAGE_TEXT, fontWeight: 500 }}>{s.label}</span>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: PAGE_TEXT }}>{s.pct > 0 ? `${s.pct}%` : '—'}</span>
                    </div>
                    <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${s.pct}%`, background: s.color, borderRadius: 3, transition: 'width 0.8s ease' }} />
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
        </div>{/* end header + hero + sidebar row */}

        {/* Practice Topics */}
        <div style={{ padding: '0 24px', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: PAGE_TEXT }}>Practice Topics</div>
              <div style={{ fontSize: 12, color: PAGE_GRAY }}>Choose a topic and start speaking with AI</div>
            </div>
            <button style={{ background: 'none', border: 'none', color: ORANGE, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              View All Topics <FaChevronRight style={{ fontSize: 11 }} />
            </button>
          </div>
          <div style={{ position: 'relative' }}>
            <div ref={topicsScrollRef} style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {TOPICS.map((t, i) => (
                <div key={i} style={{ flexShrink: 0, width: 210, background: CARD_BG, border: '1.5px solid #e2e8f0', borderRadius: 16, padding: '22px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: t.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.iconColor, fontSize: 23, marginBottom: 14 }}>{t.icon}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: PAGE_TEXT, marginBottom: 6 }}>{t.title}</div>
                  <div style={{ fontSize: 12, color: PAGE_GRAY, lineHeight: 1.5, marginBottom: 16, minHeight: 54 }}>{t.desc}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>5 Questions</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700, color: LEVEL_COLOR[t.level] }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: LEVEL_COLOR[t.level], display: 'inline-block' }} />
                      {t.level}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {/* Left scroll arrow */}
            <button onClick={() => scrollTopics(-1)} style={{ position: 'absolute', left: -14, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, borderRadius: '50%', background: CARD_BG, border: '1.5px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: PAGE_TEXT, zIndex: 2 }}>
              <FaChevronLeft style={{ fontSize: 12 }} />
            </button>
            {/* Right scroll arrow */}
            <button onClick={() => scrollTopics(1)} style={{ position: 'absolute', right: -14, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, borderRadius: '50%', background: CARD_BG, border: '1.5px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: PAGE_TEXT, zIndex: 2 }}>
              <FaChevronRight style={{ fontSize: 12 }} />
            </button>
          </div>
        </div>

        {/* Tips to Improve */}
        <div style={{ margin: '0 24px 24px', background: CARD_BG, border: '1.5px solid #e2e8f0', borderRadius: 16, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: PAGE_TEXT }}>Performance Over Time</div>
          </div>

          {/* Performance line graph */}
          {(() => {
            const attempts: { n: number; score: number }[] = (history?.attempts ?? []).map((a: any, i: number) => ({ n: a.attempt ?? i + 1, score: a.score ?? 0 }))
            if (attempts.length < 2) return null

            const w = 700, h = 220
            const padL = 34, padR = 12, padT = 12, padB = 24
            const plotW = w - padL - padR
            const plotH = h - padT - padB

            const stepX = attempts.length > 1 ? plotW / (attempts.length - 1) : 0
            const xFor = (i: number) => padL + i * stepX
            const yFor = (score: number) => padT + (1 - score / 100) * plotH

            const points = attempts.map((a, i) => [xFor(i), yFor(a.score)] as const)
            const bestScore = Math.max(...attempts.map((a) => a.score))

            const yTicks = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
            const areaPath = `M${xFor(0)},${padT + plotH} ` +
              points.map(([x, y]) => `L${x},${y}`).join(' ') +
              ` L${xFor(attempts.length - 1)},${padT + plotH} Z`

            return (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 8 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#9333ea' }}>
                    <FaStar style={{ fontSize: 9 }} /> Best Score: {bestScore}%
                  </span>
                </div>
                <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: 220, display: 'block' }}>
                  <defs>
                    <linearGradient id="perfAreaFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={ORANGE} stopOpacity={0.22} />
                      <stop offset="100%" stopColor={ORANGE} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  {/* Y gridlines + labels (0-100, step 10) */}
                  {yTicks.map((t) => {
                    const y = yFor(t)
                    return (
                      <g key={t}>
                        <line x1={padL} y1={y} x2={w - padR} y2={y} stroke="#f1f5f9" strokeWidth={1} />
                        <text x={padL - 8} y={y + 3} textAnchor="end" fontSize={9} fill="#94a3b8">{t}</text>
                      </g>
                    )
                  })}
                  {/* X axis labels — every attempt number */}
                  {attempts.map((a, i) => (
                    <text key={a.n} x={xFor(i)} y={h - 6} textAnchor="middle" fontSize={9} fill="#94a3b8">{a.n}</text>
                  ))}
                  <path d={areaPath} fill="url(#perfAreaFill)" stroke="none" />
                  <polyline
                    points={points.map(([x, y]) => `${x},${y}`).join(' ')}
                    fill="none"
                    stroke={ORANGE}
                    strokeWidth={2.5}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  {points.map(([x, y], i) => (
                    <circle key={i} cx={x} cy={y} r={3.5} fill={ORANGE} stroke={CARD_BG} strokeWidth={1.5} />
                  ))}
                </svg>
                <div style={{ textAlign: 'center', marginTop: 2 }}>
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>Attempt #</span>
                </div>
              </div>
            )
          })()}
        </div>
      </div>

      <style>{`
        @keyframes bounce { 0%,80%,100% { transform: translateY(0) } 40% { transform: translateY(-6px) } }
        @keyframes blink  { 0%,100% { opacity:1 } 50% { opacity:0 } }
        div::-webkit-scrollbar { display: none; }
      `}</style>

      {/* ── How It Works Modal ── */}
      {showHowItWorks && (
        <div onClick={() => setShowHowItWorks(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: CARD_BG, borderRadius: 24, width: '100%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.18)', fontFamily: '"Segoe UI", sans-serif' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '28px 32px 0' }}>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: PAGE_TEXT, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <FaStar style={{ color: '#f59e0b', fontSize: 16 }} /> How It Works <FaStar style={{ color: '#f59e0b', fontSize: 16 }} />
                </div>
                <p style={{ fontSize: 13, color: PAGE_GRAY, margin: '6px 0 0' }}>Your AI speaking coach is here to help you speak with confidence.</p>
                <div style={{ width: 40, height: 3, background: ORANGE, borderRadius: 4, margin: '10px auto 0' }} />
              </div>
              <button onClick={() => setShowHowItWorks(false)} style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid #e2e8f0', background: PAGE_BG, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: PAGE_GRAY, flexShrink: 0 }}>✕</button>
            </div>

            {/* Body */}
            <div style={{ display: 'flex', gap: 24, padding: '24px 32px' }}>
              {/* Left: robot image */}
              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <img src={robotSpeakingImg} alt="AI Coach" style={{ width: 150, height: 'auto', objectFit: 'contain' }} />
                <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 14, padding: '12px 14px', maxWidth: 150, textAlign: 'center' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: ORANGE, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px' }}>
                    <FaRobot style={{ color: '#fff', fontSize: 12 }} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 12, color: '#0f172a' }}>Your Personal AI Coach</div>
                  <div style={{ fontSize: 11, color: '#78350f', marginTop: 4 }}>Practice anytime, get instant feedback and improve every day.</div>
                </div>
              </div>

              {/* Right: steps */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { num: '1', color: '#f97316', bg: '#fff7ed', icon: <FaMicrophone />, title: 'Start a Topic', desc: "Select a topic you're interested in from various real-life scenarios and conversations." },
                  { num: '2', color: '#3b82f6', bg: '#eff6ff', icon: <FaMicrophone />, title: 'Speak & Record', desc: 'Speak naturally for 60 seconds. Our AI will listen to your pronunciation, fluency and clarity.' },
                  { num: '3', color: '#8b5cf6', bg: '#f5f3ff', icon: <FaRobot />, title: 'AI Analysis', desc: 'Our AI analyzes your speech on multiple parameters like fluency, grammar, vocabulary and pronunciation.' },
                  { num: '4', color: '#16a34a', bg: '#f0fdf4', icon: <FaChartLine />, title: 'Get Feedback', desc: 'Receive detailed feedback, score and suggestions to help you improve your speaking skills.' },
                  { num: '5', color: '#f59e0b', bg: '#fffbeb', icon: <FaBullseye />, title: 'Track & Improve', desc: 'Track your progress over time and keep practicing to achieve your best score.' },
                ].map((step, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: step.bg, border: `2px solid ${step.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: step.color, fontSize: 15 }}>
                      {step.icon}
                    </div>
                    <div style={{ flex: 1, paddingTop: 2 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: PAGE_TEXT, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ background: step.color, color: '#fff', borderRadius: 6, fontSize: 10, fontWeight: 800, padding: '1px 6px' }}>{step.num}</span>
                        {step.title}
                      </div>
                      <div style={{ fontSize: 12.5, color: PAGE_GRAY, marginTop: 3, lineHeight: 1.6 }}>{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div style={{ margin: '0 32px 28px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 14, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <FaLightbulb style={{ color: ORANGE, fontSize: 20, flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>Consistent practice leads to confidence!</div>
                  <div style={{ fontSize: 12, color: '#78350f' }}>Just 10 minutes daily can help you see a big improvement.</div>
                </div>
              </div>
              <button onClick={() => setShowHowItWorks(false)}
                style={{ background: ORANGE, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 800, fontSize: 14, cursor: 'pointer', flexShrink: 0, boxShadow: `0 4px 14px ${ORANGE}44` }}>
                Got It!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EnglishVoicePractice


