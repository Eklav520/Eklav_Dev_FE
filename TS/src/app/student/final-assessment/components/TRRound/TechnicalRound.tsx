import React, { useEffect, useMemo, useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import { ProgressBar, Spinner, Alert, Modal, Button, Form } from 'react-bootstrap'
import {
  FaMicrophone,
  FaStop,
  FaArrowLeft,
  FaArrowRight,
  FaCheckCircle,
  FaClock,
  FaFileAlt,
  FaCode,
  FaVideo,
  FaExclamationTriangle,
  FaUserGraduate,
  FaBrain,
  FaUpload,
  FaSpinner,
  FaBook,
  FaQuestionCircle
} from 'react-icons/fa'
import { useAuthContext } from "@/context/useAuthContext"
import { useGazeDetection } from "@/app/student/self-interview/components/useGazeDetection"
import GazeScanOverlay from "@/app/student/self-interview/components/GazeScanOverlay"

// ---- Types ----
type TRQuestion = { _id: string; topic: string; question: string }
type Props = {
  examId: string
  duration?: number
  onSubmitted?: () => void
  baseURL?: string
  // Tab-switch/window-blur/fullscreen-exit count from the page-level
  // useProctorGuard — folded into the submission alongside the face/gaze
  // violations tracked in this component.
  tabSwitchViolationCount?: number
  // Call right before requesting camera/mic — the resulting permission
  // bubble steals window focus and can force fullscreen to exit, which
  // would otherwise be mistaken for the student tabbing away.
  onBeforeCameraRequest?: () => void
}

type QuestionGenerationMode = 'resume' | 'topic'

// ---- Code editor language options (Example/Code panel) ----
const CODE_LANGUAGES: { id: string; name: string }[] = [
  { id: 'javascript', name: 'JavaScript' },
  { id: 'typescript', name: 'TypeScript' },
  { id: 'python', name: 'Python' },
  { id: 'java', name: 'Java' },
  { id: 'cpp', name: 'C++' },
  { id: 'c', name: 'C' },
  { id: 'csharp', name: 'C#' },
  { id: 'go', name: 'Go' },
  { id: 'rust', name: 'Rust' },
  { id: 'php', name: 'PHP' },
  { id: 'ruby', name: 'Ruby' },
  { id: 'sql', name: 'SQL' },
]

function getMonacoLanguage(lang: string) {
  const map: Record<string, string> = {
    javascript: 'javascript', typescript: 'typescript', python: 'python',
    java: 'java', cpp: 'cpp', c: 'c', csharp: 'csharp', go: 'go',
    rust: 'rust', php: 'php', ruby: 'ruby', sql: 'sql',
  }
  return map[lang] || 'plaintext'
}

export default function TechnicalRound({ examId, duration = 45 * 60, onSubmitted, baseURL = import.meta.env.VITE_API_BASE_URL, tabSwitchViolationCount = 0, onBeforeCameraRequest }: Props) {
  const { user } = useAuthContext()
  const token = user?.token
  const [open, setOpen] = useState(true)

  // ===== MODE SELECTION =====
  const [generationMode, setGenerationMode] = useState<QuestionGenerationMode | null>(null)
  const [selectedTopic, setSelectedTopic] = useState('')
  const [availableTopics, setAvailableTopics] = useState<string[]>([])
  const [topicQuestionsCount, setTopicQuestionsCount] = useState(15)
  const [loadingTopics, setLoadingTopics] = useState(false)

  // ===== TIMER STATE =====
  const [timeLeft, setTimeLeft] = useState(duration)
  const [timerActive, setTimerActive] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Resume & Skills
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [resumeSkills, setResumeSkills] = useState<string[]>([])
  const [uploadingResume, setUploadingResume] = useState(false)
  const [resumeAnalysis, setResumeAnalysis] = useState<{
    skills: string[]
    summary: string
    extractedText: string
  } | null>(null)
  const [loadErr, setLoadErr] = useState('')

  // Q&A
  const [loadingQs, setLoadingQs] = useState(false)
  const [qs, setQs] = useState<TRQuestion[]>([])
  const [idx, setIdx] = useState(0)
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({})
  const current = qs[idx]
  const progress = useMemo(() => (qs.length ? Math.round((idx / qs.length) * 100) : 0), [idx, qs.length])
  const isLastQuestion = qs.length > 0 && idx === qs.length - 1

  // Dictation - Fixed version
  const [recording, setRecording] = useState(false)
  const recognitionRef = useRef<any>(null)
  const finalTranscriptRef = useRef('')
  const interimTranscriptRef = useRef('')

  // UI
  const [reviewing, setReviewing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uiErr, setUiErr] = useState('')

  // Camera Recording
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  // State (not a plain ref) so the gaze-detection effect below — which
  // depends on this value — actually re-runs once the <video> node mounts.
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)

  // ── Gaze/head-pose/mask/no-face proctoring (same detector as the MCQ,
  // coding & HR rounds and /student/self-interview). No blocking modal, no
  // strike cap — just a silent tally sent up with the submission for admin
  // review. Reuses this panel's existing camera stream/video element (via
  // useExternalStream) rather than requesting a second independent camera
  // stream — mediapipe's Camera utility always does its own getUserMedia,
  // and most Windows webcams only allow one active capture session.
  const gaze = useGazeDetection(videoEl, !!cameraStream && open, false, { useExternalStream: true })
  const faceViolationCount = gaze.violationCount + gaze.headViolationCount + gaze.maskViolationCount + gaze.noFaceViolationCount
  // handleSubmit may run well after the values above changed, so submission
  // reads this ref instead of closing over stale state.
  const violationCountsRef = useRef({
    eyeViolationCount: 0,
    headViolationCount: 0,
    maskViolationCount: 0,
    noFaceViolationCount: 0,
    tabSwitchViolationCount: 0,
    faceViolationCount: 0,
  })
  useEffect(() => {
    violationCountsRef.current = {
      eyeViolationCount: gaze.violationCount,
      headViolationCount: gaze.headViolationCount,
      maskViolationCount: gaze.maskViolationCount,
      noFaceViolationCount: gaze.noFaceViolationCount,
      tabSwitchViolationCount,
      faceViolationCount,
    }
  }, [gaze.violationCount, gaze.headViolationCount, gaze.maskViolationCount, gaze.noFaceViolationCount, tabSwitchViolationCount, faceViolationCount])

  const [interviewId, setInterviewId] = useState<string | null>(null)
  const [startingInterview, setStartingInterview] = useState(false)
  const welcomePlayedRef = useRef(false)
  const [exampleAnswers, setExampleAnswers] = useState<Record<string, string>>({})
  const [codeLanguage, setCodeLanguage] = useState('javascript')
  const [answerTab, setAnswerTab] = useState<'answer' | 'code'>('answer')
  const audioStreamRef = useRef<MediaStream | null>(null)

  const [showResumeBanner, setShowResumeBanner] = useState(false)
  const draftKey = `tr_draft_${user?.id}_${examId}`

  // Auto-save draft whenever answers or position changes (only while questions are active)
  useEffect(() => {
    if (qs.length === 0) return
    localStorage.setItem(draftKey, JSON.stringify({ qs, textAnswers, exampleAnswers, idx, generationMode, selectedTopic }))
  }, [textAnswers, exampleAnswers, idx])

  // Restore draft on mount
  useEffect(() => {
    const saved = localStorage.getItem(draftKey)
    if (!saved) return
    try {
      const { qs: savedQs, textAnswers: savedAnswers, exampleAnswers: savedExamples, idx: savedIdx, generationMode: savedMode, selectedTopic: savedTopic } = JSON.parse(saved)
      if (savedQs && savedQs.length > 0) {
        setQs(savedQs)
        setTextAnswers(savedAnswers || {})
        setExampleAnswers(savedExamples || {})
        setIdx(Math.min(savedIdx ?? 0, savedQs.length - 1))
        if (savedMode) setGenerationMode(savedMode)
        if (savedTopic) setSelectedTopic(savedTopic)
        startTimer()
        setShowResumeBanner(true)
        setTimeout(() => setShowResumeBanner(false), 4000)
      }
    } catch {
      localStorage.removeItem(draftKey)
    }
  }, [])

  // ===== FETCH AVAILABLE TOPICS =====
  useEffect(() => {
    const fetchTopics = async () => {
      if (!token) return
      setLoadingTopics(true)
      try {
        const res = await fetch(`${baseURL}/api/tr/topics?examId=${examId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (data.success) {
          setAvailableTopics(data.topics || [])
        }
      } catch (err) {
        console.error('Failed to fetch topics', err)
      } finally {
        setLoadingTopics(false)
      }
    }
    fetchTopics()
  }, [token, baseURL, examId])

  useEffect(() => {
    if (videoEl && cameraStream) {
      console.log("🎯 Attaching stream to video")

      videoEl.srcObject = cameraStream
      videoEl.muted = true
      videoEl.playsInline = true

      videoEl.play()
        .then(() => console.log("✅ Video playing"))
        .catch(() => {
          setTimeout(() => videoEl.play().catch(() => { }), 500)
        })
    }
  }, [cameraStream, qs.length, videoEl])

  // ===== CAMERA RECORDING =====
  const startCameraRecording = async () => {
    try {
      onBeforeCameraRequest?.()
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      })
      console.log("Stream tracks:", stream.getTracks())
      setCameraStream(stream)

      if (videoEl) {
        videoEl.srcObject = stream
        videoEl.muted = true
        videoEl.playsInline = true

        videoEl.play()
          .then(() => console.log("✅ Video playing"))
          .catch((err) => {
            console.log("Play failed, retrying...", err)
            setTimeout(() => videoEl.play().catch(() => { }), 500)
          })
      }
      console.log("Video srcObject:", videoEl?.srcObject)
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' })
      mediaRecorderRef.current = recorder
      recordedChunksRef.current = []
      recorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunksRef.current.push(e.data) }
      recorder.start(1000)
      setIsRecording(true)
      setCameraError(null)
    } catch (err) {
      console.error("Camera error", err)
      setCameraError("Unable to access camera. Please ensure camera permissions are granted.")
    }
  }

  const stopCameraRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop()
    }
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }
    setIsRecording(false)
  }

  // ===== TIMER FUNCTIONS =====
  const startTimer = () => {
    setTimerActive(true)
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          handleAutoSubmit('Time expired - auto submitted')
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setTimerActive(false)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // ===== Resume Upload & Analysis =====
  const uploadResume = async () => {
    if (!token || !resumeFile) {
      setLoadErr('Please select a resume file')
      return
    }
    setUploadingResume(true)
    setLoadErr('')
    setResumeAnalysis(null)
    setResumeSkills([])
    try {
      const form = new FormData()
      form.append('resume', resumeFile)
      const res = await fetch(`${baseURL}/api/tr/resume/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      })
      const data = await res.json()
      if (!data?.interviewId) throw new Error(data.message || 'Resume analysis failed')
      setInterviewId(data.interviewId)
      setResumeAnalysis({
        skills: data.skills || [],
        summary: data.summary || '',
        extractedText: data.extractedText || ''
      })
      setResumeSkills(data.skills || [])
    } catch (e: any) {
      setLoadErr(e.message || 'Failed to analyze resume')
    } finally {
      setUploadingResume(false)
    }
  }

  // ===== Generate Questions =====
  const generateQuestions = async () => {
    if (!token) return
    setLoadingQs(true)
    setUiErr('')
    try {
      let endpoint = ''
      let payload = {}
      if (generationMode === 'resume') {
        if (!interviewId) throw new Error('Please upload and analyze resume first')
        endpoint = `${baseURL}/api/tr/resume/start`
        payload = { interviewId, examId }
      } else if (generationMode === 'topic') {
        if (!selectedTopic) throw new Error('Please select a topic')
        endpoint = `${baseURL}/api/tr/topic/generate`
        payload = { topic: selectedTopic, questionCount: topicQuestionsCount, examId }
      }
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!data?.questions || !Array.isArray(data.questions)) {
        throw new Error(data.message || 'Failed to generate questions')
      }
      setQs(data.questions || [])
      setIdx(0)
      const init: Record<string, string> = {}
      data.questions.forEach((q: TRQuestion) => (init[q._id] = ''))
      setTextAnswers(init)
      startTimer()
    } catch (e: any) {
      setUiErr(e.message || 'Failed to generate questions')
    } finally {
      setLoadingQs(false)
    }
  }

  // ===== TTS =====
  const speak = (text: string): Promise<void> =>
    new Promise((resolve) => {
      try {
        const synth = window.speechSynthesis
        if (!synth) return resolve()
        try { if (synth.paused) synth.resume() } catch { }
        synth.cancel()
        const u = new SpeechSynthesisUtterance(text)
        u.rate = 1.0
        u.onend = () => resolve()
        u.onerror = () => resolve()
        setTimeout(() => { try { synth.speak(u) } catch { resolve() } }, 80)
      } catch { resolve() }
    })

  const playWelcomeIntro = async () => {
    if (welcomePlayedRef.current) return
    await speak("Hello. Welcome to TR Panel. Let's start the discussion.")
    welcomePlayedRef.current = true
  }

  // ===== Dictation - Fixed =====
  function getSpeechRecognition(): any | null {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return null
    const rec = new SR()
    rec.lang = 'en-US'
    rec.continuous = true
    rec.interimResults = true
    rec.maxAlternatives = 1
    return rec
  }

  const checkMicrophonePermission = async () => {
    try {
      onBeforeCameraRequest?.()
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop())
      return true
    } catch (err) {
      setUiErr('Microphone access is required for speech-to-text. Please allow microphone permissions.')
      return false
    }
  }

  const startDictation = async () => {
    if (recording || !current) return

    try {
      const rec = getSpeechRecognition()
      if (!rec) {
        setUiErr('Speech recognition not supported. Use Chrome/Edge.')
        return
      }

      const qid = current._id
      finalTranscriptRef.current = textAnswers[qid] || ''
      interimTranscriptRef.current = ''

      rec.onstart = () => {
        console.log("🎤 ACTUALLY LISTENING NOW")
        setUiErr('')
      }

      rec.onaudiostart = () => console.log("🎧 AUDIO STARTED")
      rec.onspeechstart = () => console.log("🗣 SPEECH DETECTED")

      rec.onresult = (event: any) => {
        let finalTranscript = finalTranscriptRef.current
        let interimTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' '
          } else {
            interimTranscript += transcript
          }
        }

        finalTranscriptRef.current = finalTranscript

        setTextAnswers(prev => ({
          ...prev,
          [qid]: (finalTranscript + " " + interimTranscript).trim()
        }))

        interimTranscriptRef.current = interimTranscript
      }

      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)

        if (event.error === 'no-speech') {
          // 🔥 Restart recognition automatically
          try {
            rec.stop()
          } catch { }

          setTimeout(() => {
            try {
              rec.start()
            } catch { }
          }, 300)

          return
        }

        setUiErr(`Speech error: ${event.error}`)
      }

      rec.onend = () => {
        console.log("Recognition ended")

        if (recording) {
          setTimeout(() => {
            try {
              rec.start()
            } catch (e) {
              console.log("Restart failed", e)
            }
          }, 200)
        }
      }

      rec.start()
      setRecording(true)
      recognitionRef.current = rec

    } catch (err) {
      console.error(err)
      setUiErr('Microphone access denied')
    }
  }

  const stopDictation = () => {
    setRecording(false)

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch { }
      recognitionRef.current = null
    }

    // ✅ STOP MIC STREAM
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop())
      audioStreamRef.current = null
    }

    interimTranscriptRef.current = ''
  }
  useEffect(() => {
    if (recording) stopDictation()
  }, [idx])

  // ===== Flow control =====
  const handleStartInterview = async () => {
    if (generationMode === 'resume' && (!resumeFile || resumeSkills.length === 0 || !interviewId)) {
      setUiErr('Please upload and analyze resume first')
      return
    }
    if (generationMode === 'topic' && !selectedTopic) {
      setUiErr('Please select a topic')
      return
    }
    setStartingInterview(true)
    try {
      const synth = window.speechSynthesis
      if (synth) { synth.cancel(); synth.resume() }
    } catch { }
    await startCameraRecording()
    await generateQuestions()
    setStartingInterview(false)
  }

  const handleNext = () => setIdx((i) => Math.min(i + 1, qs.length - 1))
  const handlePrev = () => setIdx((i) => Math.max(i - 1, 0))
  const allAnswered = qs.length > 0 && qs.every((q) => (textAnswers[q._id] || '').trim().length > 0)

  const uploadRecordingToS3 = async (blob: Blob): Promise<string> => {
    if (!token) throw new Error('Auth required')
    const presignRes = await fetch(`${baseURL}/api/tr/presign/session`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: `tr_recording_${Date.now()}.webm`, fileType: blob.type || 'video/webm' }),
    })
    const presignData = await presignRes.json()
    if (!presignData.uploadUrl || !presignData.fileUrl) throw new Error('Failed to get upload URL')
    await fetch(presignData.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': blob.type || 'video/webm' },
      body: blob,
    })
    return presignData.fileUrl
  }

  const handleSubmit = async () => {
    if (!token || qs.length === 0) return
    stopTimer()
    setSubmitting(true)
    try {
      stopDictation()
      let recordingUrl = ''
      if (mediaRecorderRef.current && isRecording) {
        const blobPromise = new Promise<Blob>((resolve) => {
          if (mediaRecorderRef.current) {
            mediaRecorderRef.current.onstop = () => {
              const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' })
              resolve(blob)
            }
            mediaRecorderRef.current.stop()
          }
        })
        const blob = await blobPromise
        if (blob && blob.size > 0) recordingUrl = await uploadRecordingToS3(blob)
      }
      const answers = qs.map((q) => ({
        qid: q._id,
        questionText: q.question,
        textAnswer: (textAnswers[q._id] || '').trim(),
        exampleAnswer: (exampleAnswers[q._id] || '').trim()
      }))
      const res = await fetch(`${baseURL}/api/tr/submit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId, interviewId, generationMode,
          topic: generationMode === 'topic' ? selectedTopic : undefined,
          resumeSkills: generationMode === 'resume' ? resumeSkills : undefined,
          resumeSummary: generationMode === 'resume' ? resumeAnalysis?.summary || '' : undefined,
          answers, recordingUrl, timeLeft,
          ...violationCountsRef.current,
        }),
      })
      const data = await res.json()
      if (data?.success) {
        localStorage.removeItem(draftKey)
        stopCameraRecording()
        setOpen(false)
        onSubmitted?.()
      } else {
        setUiErr(data?.error || 'Submit failed')
      }
    } catch (e: any) {
      setUiErr(e.message || 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAutoSubmit = async (why: string) => {
    console.log('Auto-submitting due to:', why)
    await handleSubmit()
  }

  useEffect(() => {
    if (timeLeft === 0 && timerActive) handleAutoSubmit('Time expired - auto submitted')
  }, [timeLeft, timerActive])

  useEffect(() => {
    if (current?.question) {
      const speakQuestion = async () => {
        if (idx === 0 && !welcomePlayedRef.current) {
          await playWelcomeIntro()
          await speak(current.question)
        } else {
          await speak(current.question)
        }
      }
      speakQuestion()
    }
  }, [current?._id])

  useEffect(() => {
    return () => {
      stopTimer()
      if (recognitionRef.current) try { recognitionRef.current.stop() } catch { }
      stopCameraRecording()
      try { window.speechSynthesis?.cancel() } catch { }
    }
  }, [])

  const handleCloseModal = () => {
    stopTimer()
    if (recognitionRef.current) try { recognitionRef.current.stop() } catch { }
    stopCameraRecording()
    setOpen(false)
    onSubmitted?.()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setResumeFile(file)
    if (file) {
      setResumeAnalysis(null)
      setResumeSkills([])
      setLoadErr('')
      setInterviewId(null)
    }
  }

  const committedValue = (() => {
    if (!current) return ''
    if (recording && finalTranscriptRef.current) return finalTranscriptRef.current
    return textAnswers[current._id] || ''
  })()

  const currentInterim = recording && current ? interimTranscriptRef.current : ''

  // Mode Selection — a plain JSX value (not a nested component function), so
  // it's never given a new component identity on re-render. Defining these
  // as `const X = () => (...)` inside the parent's render body used to make
  // React treat <X /> as a brand-new component type every re-render, forcing
  // an unmount/remount of the subtree — which is what snapped the topic
  // <select> shut the instant it was opened (a re-render while the native
  // dropdown was open remounted the element out from under it).
  const modeSelectionEl = (
    <div className="mode-selection-section">
      <div className="mode-selection-header">
        <h3 className="mode-title">Choose Question Generation Method</h3>
        <p className="mode-subtitle">Select how you want to generate your technical interview questions</p>
      </div>
      <div className="mode-options">
        <div className={`mode-card ${generationMode === 'resume' ? 'active' : ''}`} onClick={() => setGenerationMode('resume')}>
          <div className="mode-icon-wrapper"><FaUserGraduate className="mode-icon" /></div>
          <div className="mode-card-content">
            <h4 className="mode-card-title">Resume-Based Questions</h4>
            <p className="mode-card-description">Upload your resume and get personalized questions based on your skills and experience</p>
            <div className="mode-features"><span>✓ Personalized questions</span><span>✓ Based on your skills</span><span>✓ Industry-relevant topics</span></div>
          </div>
        </div>
        <div className={`mode-card ${generationMode === 'topic' ? 'active' : ''}`} onClick={() => setGenerationMode('topic')}>
          <div className="mode-icon-wrapper"><FaBook className="mode-icon" /></div>
          <div className="mode-card-content">
            <h4 className="mode-card-title">Topic-Based Questions</h4>
            <p className="mode-card-description">Select a specific topic and get questions from our question bank</p>
            <div className="mode-features"><span>✓ Specific topic focus</span><span>✓ Choose question count</span><span>✓ Standardized questions</span></div>
          </div>
        </div>
      </div>
    </div>
  )

  const topicSelectionEl = (
    <div className="topic-selection-section">
      <div className="topic-selection-header"><FaQuestionCircle className="topic-header-icon" /><div><h4 className="topic-title">Select a Topic</h4><p className="topic-subtitle">Choose a technical topic for your interview questions</p></div></div>
      <Form.Group className="topic-select-group">
        <Form.Label className="topic-label">Technical Topic</Form.Label>
        {loadingTopics ? (
          <div className="topic-loading"><Spinner animation="border" size="sm" /><span>Loading topics...</span></div>
        ) : (
          <Form.Control as="select" value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)} className="topic-select">
            <option value="">-- Select a topic --</option>
            {availableTopics.map((topic) => (<option key={topic} value={topic}>{topic}</option>))}
          </Form.Control>
        )}
      </Form.Group>
      <Form.Group className="question-count-group">
        <Form.Label className="topic-label">Number of Questions</Form.Label>
        <Form.Control type="number" min={5} max={30} value={topicQuestionsCount} onChange={(e) => setTopicQuestionsCount(Math.min(30, Math.max(5, parseInt(e.target.value) || 15)))} className="question-count-input" />
        <small className="count-hint">Choose between 5-30 questions</small>
      </Form.Group>
    </div>
  )

  const resumeUploadEl = (
    <div className="upload-section">
      <div className="upload-card">
        <div className="upload-icon-wrapper"><FaFileAlt className="upload-icon" /></div>
        <h3 className="upload-title">Upload Your Resume</h3>
        <p className="upload-subtitle">Upload your resume (PDF, DOC, DOCX). We'll analyze it and generate personalized interview questions.</p>
        <div className="upload-area">
          <input type="file" accept=".pdf,.doc,.docx" className="file-input-custom" onChange={handleFileChange} disabled={uploadingResume} id="resume-upload" />
          <label htmlFor="resume-upload" className="file-label"><FaUpload className="me-2" /> Choose File</label>
          {resumeFile && (<div className="file-info-custom"><strong>Selected:</strong> {resumeFile.name}<span className="file-size">({(resumeFile.size / 1024).toFixed(1)} KB)</span></div>)}
          <button className="analyze-btn-custom" onClick={uploadResume} disabled={!resumeFile || uploadingResume}>
            {uploadingResume ? (<><FaSpinner className="spinner-icon" /> Analyzing Resume...</>) : (<><FaBrain className="me-2" /> Analyze Resume</>)}
          </button>
        </div>
        {resumeAnalysis && (
          <div className="analysis-results-custom">
            <h4 className="results-title">Resume Analysis Results</h4>
            <div className="skills-section-custom"><h5>Extracted Skills:</h5><div className="skills-tags">{resumeSkills.map((skill) => (<span key={skill} className="skill-tag">{skill}</span>))}</div></div>
            {resumeAnalysis.summary && (<div className="summary-section-custom"><h5>Resume Summary:</h5><div className="summary-text-custom">{resumeAnalysis.summary}</div></div>)}
            <div className="success-message"><FaCheckCircle className="success-icon" /><span>Resume analyzed successfully! {resumeSkills.length} skills detected.</span></div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      <Modal show={!!cameraError} centered backdrop="static" onHide={() => setCameraError(null)}>
        <Modal.Body style={{ background: "#111", color: "#fff", border: "1px solid #ff6b35" }} className="text-center">
          <h5 style={{ color: "#ff6b35" }}>📹 Camera Required</h5>
          <p>{cameraError}</p>
          <p className="text-warning small">Please allow camera access to continue with the interview.</p>
          <Button style={{ background: "#ff6b35", border: "none" }} onClick={() => { setCameraError(null); startCameraRecording() }}>Try Again</Button>
        </Modal.Body>
      </Modal>

      <Modal show={open} onHide={handleCloseModal} fullscreen backdrop="static" keyboard={false} className="tr-modal-custom" container={document.body} style={{ zIndex: 9999999 }}>
        <Modal.Header closeButton className="modal-header-custom">
          <div className="header-content-custom">
            <div>
              <h1 className="modal-title-custom">Technical Interview (TR)</h1>
              <p className="modal-subtitle">{generationMode === 'resume' ? 'Resume-based personalized interview' : generationMode === 'topic' ? `Topic-based interview - ${selectedTopic || 'Select topic'}` : 'Choose how to generate questions'}</p>
            </div>
            {timerActive && (<div className="timer-display-custom"><FaClock className="timer-icon" /><span className={timeLeft < 300 ? 'time-warning' : ''}>{formatTime(timeLeft)}</span></div>)}
          </div>
        </Modal.Header>

        <Modal.Body className="modal-body-custom">
          {showResumeBanner && (
            <div style={{
              background: '#28a745', color: '#fff', textAlign: 'center',
              padding: '10px 16px', fontSize: '14px', fontWeight: 600,
              borderRadius: '6px', marginBottom: '12px',
              animation: 'fadeOut 0.5s ease 3.5s forwards'
            }}>
              ✅ Previous session restored — your answers have been loaded
            </div>
          )}
          {loadErr && (<Alert variant="danger" className="alert-custom alert-danger"><FaExclamationTriangle className="alert-icon" /><span>{loadErr}</span></Alert>)}
          {uiErr && (<Alert variant="warning" className="alert-custom alert-warning"><FaExclamationTriangle className="alert-icon" /><span>{uiErr}</span></Alert>)}

          {(!generationMode || generationMode === null) && !qs.length && !startingInterview && modeSelectionEl}
          {generationMode === 'resume' && !qs.length && !startingInterview && resumeSkills.length === 0 && resumeUploadEl}
          {generationMode === 'topic' && !qs.length && !startingInterview && !selectedTopic && topicSelectionEl}

          {generationMode && !qs.length && !startingInterview && (
            <div className="start-interview-container">
              {generationMode === 'resume' && resumeSkills.length > 0 && (
                <div className="ready-section"><div className="ready-card"><FaCheckCircle className="ready-icon" /><h4>Ready to Start!</h4><p>Your resume has been analyzed. {resumeSkills.length} skills detected.</p><button className="start-interview-btn-custom" disabled={startingInterview} onClick={handleStartInterview}>{startingInterview ? (<><FaSpinner className="spinner-icon" /> Setting Up Interview...</>) : (<><FaUserGraduate className="me-2" /> Start Resume-Based Interview</>)}</button></div></div>
              )}
              {generationMode === 'topic' && selectedTopic && (
                <div className="ready-section"><div className="ready-card"><FaBook className="ready-icon" /><h4>Ready to Start!</h4><p>Topic: <strong>{selectedTopic}</strong> • Questions: <strong>{topicQuestionsCount}</strong></p><button className="start-interview-btn-custom" disabled={startingInterview} onClick={handleStartInterview}>{startingInterview ? (<><FaSpinner className="spinner-icon" /> Setting Up Interview...</>) : (<><FaQuestionCircle className="me-2" /> Start Topic-Based Interview</>)}</button></div></div>
              )}
            </div>
          )}

          {startingInterview && !qs.length && (
            <div className="loading-section"><div className="loading-card"><h3 className="loading-title">Setting Up Interview</h3><div className="loading-spinner-custom"><FaSpinner className="spinner-large" /></div><p className="loading-text">Please wait while we set up your interview session...</p><div className="loading-steps-custom"><div className="loading-step done"><FaCheckCircle className="step-icon" /><span>{generationMode === 'resume' ? 'Resume Analyzed' : 'Topic Selected'}</span></div><div className={`loading-step ${isRecording ? 'done' : ''}`}><span className="step-icon">{isRecording ? '✓' : '...'}</span><span>Camera Setup</span></div><div className={`loading-step ${qs.length > 0 ? 'done' : ''}`}><span className="step-icon">{qs.length > 0 ? '✓' : '...'}</span><span>Generating Questions</span></div></div></div></div>
          )}

          {!!qs.length && !reviewing && !startingInterview && (
            <div className="interview-grid">
              <div className="interview-left">
                <div className="question-container-custom">
                  <div className="question-header-custom">
                    <div className="progress-area"><span className="question-count">Question {idx + 1} / {qs.length}</span><ProgressBar now={progress} className="progress-bar-custom" /></div>
                    {generationMode === 'resume' && resumeSkills.length > 0 && (<div className="skills-tags-small">{resumeSkills.slice(0, 5).map((skill) => (<span key={skill} className="skill-tag-small">{skill}</span>))}</div>)}
                    {generationMode === 'topic' && selectedTopic && (<div className="topic-badge"><FaBook className="me-1" /> {selectedTopic}</div>)}
                  </div>

                  <div className="question-card-custom">
                    <div className="question-source"><small>Generated from {generationMode === 'resume' ? 'your resume' : `topic: ${selectedTopic}`}</small></div>
                    <h3 className="question-text-custom">{current?.question}</h3>

                    <div className="answer-tabs-container">
                      <div className="answer-tabs-header">
                        <button
                          type="button"
                          className={`answer-tab-btn ${answerTab === 'answer' ? 'active' : ''}`}
                          onClick={() => setAnswerTab('answer')}
                        >
                          <span className="terminal-prompt">$</span> Answer
                        </button>
                        <button
                          type="button"
                          className={`answer-tab-btn ${answerTab === 'code' ? 'active' : ''}`}
                          onClick={() => setAnswerTab('code')}
                        >
                          <FaCode className="me-2" /> Code
                        </button>
                      </div>

                      {answerTab === 'answer' && (
                        <div className="answer-tab-panel">
                          <textarea
                            placeholder="Speak (Start) or type freely..."
                            value={
                              recording
                                ? (finalTranscriptRef.current + " " + interimTranscriptRef.current)
                                : (textAnswers[current?._id] || "")
                            }
                            onChange={(e) => {
                              if (!current) return
                              finalTranscriptRef.current = e.target.value
                              setTextAnswers((prev) => ({ ...prev, [current._id]: e.target.value }))
                            }}
                            rows={14}
                            className="answer-textarea-terminal"
                          />
                          {recording && currentInterim && (
                            <div className="interim-line-terminal"><span className="terminal-prompt-small"></span><em>{currentInterim}</em><span className="cursor-blink">_</span></div>
                          )}

                          <div className="audio-controls-custom">
                            {!recording ? (
                              <button className="record-btn-custom" onClick={startDictation}><FaMicrophone className="me-2" /> Start Speaking</button>
                            ) : (
                              <div className="mic-active-container">
                                <button className="stop-record-btn-custom" onClick={stopDictation}><FaStop className="me-2" /> Stop Recording</button>
                                <div className="mic-status-indicator">
                                  <span className="mic-dot listening"></span>
                                  <span className="mic-status-text">🎤 Listening...</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {answerTab === 'code' && (
                        <div className="answer-tab-panel">
                          <div className="code-editor-toolbar">
                            <span className="code-editor-toolbar-label">Language</span>
                            <select
                              value={codeLanguage}
                              onChange={(e) => setCodeLanguage(e.target.value)}
                              className="code-lang-select"
                            >
                              {CODE_LANGUAGES.map((l) => (<option key={l.id} value={l.id}>{l.name}</option>))}
                            </select>
                          </div>
                          <div className="code-editor-wrapper">
                            <Editor
                              height="360px"
                              language={getMonacoLanguage(codeLanguage)}
                              value={exampleAnswers[current?._id] || ''}
                              onChange={(value) => { if (!current) return; setExampleAnswers(prev => ({ ...prev, [current._id]: value || '' })) }}
                              theme="vs"
                              options={{
                                minimap: { enabled: false },
                                fontSize: 13,
                                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                lineNumbers: 'on',
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                wordWrap: 'on',
                                padding: { top: 10, bottom: 10 },
                                renderLineHighlight: 'all',
                                scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="nav-controls-custom">
                    <button className="nav-btn prev" onClick={handlePrev} disabled={idx === 0}><FaArrowLeft className="me-2" /> Previous</button>
                    {!isLastQuestion ? (
                      <button className="nav-btn next" onClick={handleNext} disabled={idx === qs.length - 1}>Next <FaArrowRight className="ms-2" /></button>
                    ) : (
                      <button className="review-btn" onClick={() => setReviewing(true)}>Review Answers</button>
                    )}
                  </div>
                </div>
              </div>

              <div className="interview-right">
                <div className="video-panel">
                  <div className="video-section-custom"><h4><FaVideo className="me-2" /> Camera Recording</h4>
                    <div className="video-preview-custom camera-preview">
                      {/* Mirror wrapper — the video is flipped for a natural
                          "look in a mirror" preview; the gaze overlay must
                          flip with it so the mesh stays aligned to the face
                          instead of floating off to the wrong side. */}
                      <div style={{ position: 'relative', width: '100%', height: '100%', transform: 'scaleX(-1)' }}>
                        <video ref={setVideoEl} autoPlay playsInline muted className="video-element" style={{ width: '100%', height: '100%', objectFit: 'cover', backgroundColor: '#000' }} />
                        {gaze.isReady && (
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
                            maskDetected={gaze.maskDetected}
                            maskViolationCount={gaze.maskViolationCount}
                            maskAwaySeconds={gaze.maskAwaySeconds}
                            widen={1}
                          />
                        )}
                      </div>
                      {!isRecording && !cameraStream && (<div className="video-placeholder-custom"><FaVideo size={32} /><div>Camera not started</div></div>)}
                    </div>
                  </div>
                  <div className="recording-status"><span className={`status-dot ${isRecording ? 'active' : ''}`}></span><span>{isRecording ? 'Camera is recording' : 'Recording stopped'}</span></div>
                  {gaze.isReady && (
                    <div style={{
                      padding: '6px 10px', fontSize: '11px', fontWeight: 600, textAlign: 'center', borderRadius: 8,
                      color: !gaze.faceDetected || gaze.maskDetected || gaze.isLookingAway || gaze.isHeadTurned ? '#fff' : '#28a745',
                      background: !gaze.faceDetected || gaze.maskDetected || gaze.isLookingAway || gaze.isHeadTurned ? '#dc3545' : 'rgba(40,167,69,0.12)',
                    }}>
                      {!gaze.faceDetected
                        ? `⚠ Face not visible — remove any covering (${gaze.noFaceSeconds}s)`
                        : gaze.maskDetected
                          ? `⚠ Mouth/nose covered — remove mask (${gaze.maskAwaySeconds}s)`
                          : gaze.isLookingAway
                            ? `⚠ Look at the screen (${gaze.lookAwaySeconds}s)`
                            : gaze.isHeadTurned
                              ? `⚠ Face the camera (${gaze.headAwaySeconds}s)`
                              : '✓ Face tracking OK'}
                    </div>
                  )}
                  {faceViolationCount > 0 && (
                    <div style={{ padding: '4px 10px', fontSize: '10.5px', fontWeight: 600, textAlign: 'center', color: '#f59e0b', background: 'rgba(245,158,11,0.12)', borderRadius: 8 }}>
                      Face/gaze violations noted: {faceViolationCount}
                    </div>
                  )}
                  {timerActive && (<div className="timer-panel-custom"><FaClock className="timer-icon" /><strong>Time: {formatTime(timeLeft)}</strong>{isLastQuestion && (<div className="final-note">This is the final question. Click "Review Answers" to submit.</div>)}</div>)}
                  {generationMode === 'resume' && resumeSkills.length > 0 && (<div className="skills-summary-custom"><h5><FaCode className="me-2" /> Resume Skills</h5><div className="skills-tags-compact">{resumeSkills.slice(0, 8).map((skill) => (<span key={skill} className="skill-tag-compact">{skill}</span>))}{resumeSkills.length > 8 && (<span className="skill-tag-compact">+{resumeSkills.length - 8} more</span>)}</div></div>)}
                </div>
              </div>
            </div>
          )}

          {!!qs.length && reviewing && !startingInterview && (
            <div className="review-section">
              <div className="review-container">
                <div className="review-header"><h3>Review your answers</h3><p>Click any question to edit, then submit.</p>{timerActive && (<div className="timer-review-custom"><FaClock className="timer-icon" /><strong>Time Remaining: {formatTime(timeLeft)}</strong></div>)}</div>
                <div className="review-list">{qs.map((q, i) => { const ans = (textAnswers[q._id] || '').trim(); return (<div key={q._id} className="review-item"><div className="review-question" onClick={() => { setReviewing(false); setIdx(i) }}>Q{i + 1}. {q.question}</div><div className={`review-answer ${!ans ? 'empty' : ''}`}>{ans || <span>No answer provided</span>}</div></div>) })}</div>
                <div className="review-actions"><button className="back-btn" onClick={() => setReviewing(false)}><FaArrowLeft className="me-2" /> Back to questions</button><button className="final-submit-btn" onClick={handleSubmit} disabled={(!allAnswered) || submitting}>{submitting ? <FaSpinner className="spinner-icon" /> : <FaCheckCircle className="me-2" />}{submitting ? 'Submitting...' : 'Final Submit'}</button></div>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>

      <style>{`
        /* All your existing styles remain exactly as they were */
        .tr-modal-custom .modal-content { background: #000000; border: none; border-radius: 0; height: 100vh; display: flex; flex-direction: column; }
        .modal-header-custom { background: linear-gradient(135deg, #0a0a0a 0%, #000000 100%); border-bottom: 1px solid #ff7a00; padding: 1.25rem 2rem; flex-shrink: 0; }
        .header-content-custom { display: flex; justify-content: space-between; align-items: center; width: 100%; flex-wrap: wrap; gap: 1rem; }
        .modal-title-custom { color: #ffffff; font-size: 1.5rem; font-weight: 700; margin: 0; }
        .modal-subtitle { color: #8a8a8a; font-size: 0.85rem; margin: 0.25rem 0 0 0; }
        .timer-display-custom { background: rgba(255, 122, 0, 0.2); border: 1px solid #ff7a00; border-radius: 8px; padding: 0.5rem 1rem; display: flex; align-items: center; gap: 0.5rem; }
        .timer-icon { color: #ff7a00; }
        .timer-display-custom span { color: #ffffff; font-weight: 600; font-size: 1.25rem; }
        .time-warning { color: #ff6b6b !important; }
        .modal-body-custom { padding: 2rem; overflow-y: auto; background: #000000; flex: 1; }
        .mode-selection-section { max-width: 1000px; margin: 0 auto; padding: 2rem; }
        .mode-selection-header { text-align: center; margin-bottom: 2.5rem; }
        .mode-title { color: #ffffff; font-size: 1.75rem; font-weight: 700; margin-bottom: 0.5rem; }
        .mode-subtitle { color: #8a8a8a; font-size: 1rem; }
        .mode-options { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 1.5rem; }
        .mode-card { background: #0a0a0a; border: 2px solid #2c2c2c; border-radius: 16px; padding: 1.5rem; cursor: pointer; transition: all 0.3s ease; }
        .mode-card:hover { transform: translateY(-4px); border-color: #ff7a00; background: #111; }
        .mode-card.active { border-color: #ff7a00; background: linear-gradient(135deg, #0a1a0a 0%, #0a0a0a 100%); box-shadow: 0 8px 24px rgba(255, 122, 0, 0.2); }
        .mode-icon-wrapper { width: 60px; height: 60px; background: rgba(255, 122, 0, 0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; }
        .mode-icon { font-size: 2rem; color: #ff7a00; }
        .mode-card-title { color: #ffffff; font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem; }
        .mode-card-description { color: #8a8a8a; font-size: 0.85rem; margin-bottom: 1rem; line-height: 1.5; }
        .mode-features { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .mode-features span { font-size: 0.75rem; color: #ff7a00; background: rgba(255, 122, 0, 0.1); padding: 0.25rem 0.5rem; border-radius: 4px; }
        .topic-selection-section { max-width: 500px; margin: 0 auto; padding: 2rem; background: #0a0a0a; border-radius: 16px; border: 1px solid #2c2c2c; }
        .topic-selection-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
        .topic-header-icon { font-size: 2rem; color: #ff7a00; }
        .topic-title { color: #ffffff; font-size: 1.25rem; font-weight: 600; margin: 0; }
        .topic-subtitle { color: #8a8a8a; font-size: 0.8rem; margin: 0.25rem 0 0 0; }
        .topic-select-group, .question-count-group { margin-bottom: 1.5rem; }
        .topic-label { color: #ff7a00; font-weight: 500; margin-bottom: 0.5rem; display: block; }
        .topic-select, .question-count-input { background: #000000; border: 1px solid #2c2c2c; color: #ffffff; padding: 0.75rem; border-radius: 8px; width: 100%; }
        .topic-select:focus, .question-count-input:focus { border-color: #ff7a00; outline: none; }
        .topic-loading { display: flex; align-items: center; gap: 0.5rem; color: #8a8a8a; padding: 0.75rem; }
        .count-hint { color: #6c757d; font-size: 0.7rem; display: block; margin-top: 0.25rem; }
        .start-interview-container { max-width: 500px; margin: 2rem auto; }
        .ready-section { margin-top: 1rem; }
        .ready-card { background: linear-gradient(135deg, #0a2a0a 0%, #0a0a0a 100%); border: 1px solid #28a745; border-radius: 16px; padding: 2rem; text-align: center; }
        .ready-icon { font-size: 3rem; color: #28a745; margin-bottom: 1rem; }
        .ready-card h4 { color: #ffffff; font-size: 1.25rem; margin-bottom: 0.5rem; }
        .ready-card p { color: #8a8a8a; margin-bottom: 1.5rem; }
        .alert-custom { display: flex; align-items: center; gap: 0.75rem; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; }
        .alert-danger { background: rgba(220, 53, 69, 0.1); border: 1px solid #dc3545; color: #ff6b6b; }
        .alert-warning { background: rgba(255, 122, 0, 0.1); border: 1px solid #ff7a00; color: #ff7a00; }
        .alert-icon { font-size: 1.25rem; }
        .upload-section { display: flex; justify-content: center; align-items: center; min-height: 60vh; }
        .upload-card { background: #0a0a0a; border: 1px solid #1f1f1f; border-radius: 24px; padding: 2.5rem; max-width: 600px; width: 100%; text-align: center; }
        .upload-icon-wrapper { width: 80px; height: 80px; background: rgba(255, 122, 0, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; }
        .upload-icon { font-size: 2.5rem; color: #ff7a00; }
        .upload-title { color: #ffffff; font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem; }
        .upload-subtitle { color: #8a8a8a; margin-bottom: 1.5rem; }
        .upload-area { margin: 1.5rem 0; }
        .file-input-custom { display: none; }
        .file-label { background: #2c2c2c; color: #ffffff; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; transition: all 0.2s ease; }
        .file-label:hover { background: #3a3a3a; }
        .file-info-custom { margin-top: 1rem; padding: 0.75rem; background: #000000; border-radius: 8px; color: #e5e5e5; }
        .file-size { color: #8a8a8a; margin-left: 0.5rem; }
        .analyze-btn-custom { background: linear-gradient(135deg, #ff7a00 0%, #ff944d 100%); border: none; padding: 0.75rem 1.5rem; border-radius: 8px; color: #000000; font-weight: 600; width: 100%; margin-top: 1rem; transition: all 0.2s ease; }
        .analyze-btn-custom:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(255, 122, 0, 0.4); }
        .analyze-btn-custom:disabled { opacity: 0.6; cursor: not-allowed; }
        .analysis-results-custom { margin-top: 1.5rem; padding: 1rem; background: #000000; border-radius: 12px; border: 1px solid #1f1f1f; }
        .results-title { color: #ff7a00; font-size: 1rem; margin-bottom: 1rem; }
        .skills-section-custom, .summary-section-custom { margin-bottom: 1rem; }
        .skills-section-custom h5, .summary-section-custom h5 { color: #8a8a8a; font-size: 0.8rem; margin-bottom: 0.5rem; }
        .skills-tags { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .skill-tag { background: rgba(255, 122, 0, 0.1); color: #ff7a00; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.8rem; }
        .summary-text-custom { background: #0a0a0a; padding: 0.75rem; border-radius: 8px; color: #e5e5e5; font-size: 0.85rem; line-height: 1.5; }
        .success-message { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem; background: rgba(40, 167, 69, 0.1); border-radius: 8px; color: #28a745; }
        .success-icon { font-size: 1rem; }
        .start-interview-btn-custom { background: linear-gradient(135deg, #ff7a00 0%, #ff944d 100%); border: none; padding: 0.75rem 1.5rem; border-radius: 8px; color: #000000; font-weight: 600; width: 100%; transition: all 0.2s ease; }
        .start-interview-btn-custom:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(255, 122, 0, 0.4); }
        .loading-section { display: flex; justify-content: center; align-items: center; min-height: 70vh; }
        .loading-card { background: #0a0a0a; border: 1px solid #1f1f1f; border-radius: 24px; padding: 2.5rem; text-align: center; max-width: 500px; }
        .loading-title { color: #ffffff; font-size: 1.25rem; margin-bottom: 1.5rem; }
        .loading-spinner-custom { margin: 2rem 0; }
        .spinner-large { font-size: 2.5rem; color: #ff7a00; animation: spin 1s linear infinite; }
        .loading-text { color: #8a8a8a; margin-bottom: 2rem; }
        .loading-steps-custom { display: flex; flex-direction: column; gap: 0.75rem; }
        .loading-step { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: #000000; border-radius: 8px; }
        .loading-step.done { border-left: 3px solid #28a745; }
        .step-icon { width: 24px; text-align: center; }
        .interview-grid { display: grid; grid-template-columns: 1fr 320px; gap: 1.5rem; height: calc(100vh - 140px); }
        .interview-left { overflow-y: auto; }
        .interview-right { background: #0a0a0a; border: 1px solid #1f1f1f; border-radius: 16px; padding: 1rem; overflow-y: auto; }
        .question-container-custom { max-width: 900px; margin: 0 auto; }
        .question-header-custom { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem; }
        .progress-area { flex: 1; }
        .question-count { color: #ff7a00; font-size: 0.85rem; display: block; margin-bottom: 0.25rem; }
        .progress-bar-custom { height: 6px; background: #2c2c2c; }
        .progress-bar-custom .progress-bar { background: linear-gradient(90deg, #ff7a00 0%, #ff944d 100%); }
        .topic-badge { background: rgba(255, 122, 0, 0.1); color: #ff7a00; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; display: flex; align-items: center; }
        .question-card-custom { background: #0a0a0a; border: 1px solid #1f1f1f; border-radius: 16px; padding: 1.5rem; margin-bottom: 1rem; }
        .question-source { margin-bottom: 0.5rem; }
        .question-source small { color: #8a8a8a; font-size: 0.7rem; }
        .question-text-custom { color: #ffffff; font-size: 1.25rem; font-weight: 600; line-height: 1.5; margin-bottom: 1.5rem; font-family: 'Courier New', monospace; border-left: 3px solid #00ff00; padding-left: 1rem; }
        .answer-section-custom label, .example-section label { color: #ff7a00; font-weight: 500; margin-bottom: 0.5rem; display: block; }
        .audio-controls-custom { margin-top: 1rem; }
        .record-btn-custom, .stop-record-btn-custom { padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600; display: inline-flex; align-items: center; transition: all 0.2s ease; font-family: 'Courier New', monospace; }
        .record-btn-custom { background: rgba(0, 255, 0, 0.1); border: 1px solid #00ff00; color: #00ff00; }
        .record-btn-custom:hover:not(:disabled) { background: #00ff00; color: #000000; }
        .stop-record-btn-custom { background: rgba(255, 0, 0, 0.1); border: 1px solid #ff0000; color: #ff0000; }
        .stop-record-btn-custom:hover:not(:disabled) { background: #ff0000; color: #ffffff; }
        .nav-controls-custom { display: flex; justify-content: space-between; gap: 1rem; margin-top: 1rem; }
        .nav-btn { padding: 0.5rem 1rem; border-radius: 8px; background: #2c2c2c; border: none; color: #e5e5e5; display: inline-flex; align-items: center; transition: all 0.2s ease; }
        .nav-btn:hover:not(:disabled) { background: #3a3a3a; }
        .nav-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .review-btn { padding: 0.5rem 1rem; border-radius: 8px; background: linear-gradient(135deg, #ff7a00 0%, #ff944d 100%); border: none; color: #000000; font-weight: 600; }
        .video-panel { display: flex; flex-direction: column; gap: 1rem; }
        .video-section-custom h4 { color: #ff7a00; font-size: 0.9rem; margin-bottom: 0.5rem; display: flex; align-items: center; }
        .video-preview-custom { background: #000000; border-radius: 8px; overflow: hidden; aspect-ratio: 4/3; position: relative; display: flex; align-items: center; justify-content: center; }
        .video-element { width: 100%; height: 100%; object-fit: cover; background: #000; transform: scaleX(-1); }
        .video-placeholder-custom { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: #0a0a0a; color: #8a8a8a; }
        .recording-status { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; background: #000000; border-radius: 8px; font-size: 0.8rem; color: #8a8a8a; }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #dc3545; }
        .status-dot.active { background: #28a745; animation: pulse 1.5s infinite; }
        .timer-panel-custom { background: #000000; border: 1px solid #ff7a00; border-radius: 8px; padding: 0.75rem; text-align: center; }
        .final-note { color: #ff7a00; font-size: 0.7rem; margin-top: 0.25rem; }
        .skills-summary-custom { background: #000000; border-radius: 8px; padding: 0.75rem; }
        .skills-summary-custom h5 { color: #ff7a00; font-size: 0.8rem; margin-bottom: 0.5rem; }
        .skills-tags-compact { display: flex; flex-wrap: wrap; gap: 0.25rem; }
        .skill-tag-compact { background: rgba(255, 122, 0, 0.1); color: #ff7a00; padding: 0.2rem 0.5rem; border-radius: 20px; font-size: 0.7rem; }
        .skills-tags-small { display: flex; flex-wrap: wrap; gap: 0.25rem; }
        .skill-tag-small { background: rgba(255, 122, 0, 0.1); color: #ff7a00; padding: 0.2rem 0.5rem; border-radius: 20px; font-size: 0.7rem; }
        .review-section { height: 100%; overflow-y: auto; }
        .review-container { max-width: 900px; margin: 0 auto; }
        .review-header { text-align: center; margin-bottom: 2rem; }
        .review-header h3 { color: #ffffff; margin-bottom: 0.5rem; }
        .review-header p { color: #8a8a8a; }
        .timer-review-custom { display: inline-flex; align-items: center; gap: 0.5rem; background: #0a0a0a; padding: 0.5rem 1rem; border-radius: 8px; margin-top: 1rem; }
        .review-list { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem; }
        .review-item { background: #0a0a0a; border: 1px solid #1f1f1f; border-radius: 12px; padding: 1rem; }
        .review-question { font-weight: 600; color: #ff7a00; margin-bottom: 0.5rem; cursor: pointer; }
        .review-question:hover { text-decoration: underline; }
        .review-answer { background: #000000; padding: 0.75rem; border-radius: 8px; color: #e5e5e5; white-space: pre-wrap; }
        .review-answer.empty { color: #dc3545; }
        .review-actions { display: flex; gap: 1rem; justify-content: center; }
        .back-btn { padding: 0.75rem 1.5rem; border-radius: 8px; background: #2c2c2c; border: none; color: #e5e5e5; display: inline-flex; align-items: center; }
        .final-submit-btn { padding: 0.75rem 1.5rem; border-radius: 8px; background: linear-gradient(135deg, #ff7a00 0%, #ff944d 100%); border: none; color: #000000; font-weight: 600; display: inline-flex; align-items: center; }
        .final-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .spinner-icon { animation: spin 1s linear infinite; margin-right: 0.5rem; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.1); } }
        @keyframes fadeOut { to { opacity: 0; pointer-events: none; } }
        @media (max-width: 1024px) { .interview-grid { grid-template-columns: 1fr; } .interview-right { order: 2; } }
        @media (max-width: 768px) { .modal-header-custom { padding: 1rem; } .header-content-custom { flex-direction: column; text-align: center; } .modal-body-custom { padding: 1rem; } .mode-options { grid-template-columns: 1fr; } .upload-card { padding: 1.5rem; } .nav-controls-custom { flex-direction: column; } .nav-btn, .review-btn { width: 100%; justify-content: center; } .review-actions { flex-direction: column; } .back-btn, .final-submit-btn { width: 100%; justify-content: center; } }
        .modal-backdrop { z-index: 9999998 !important; }
        .tr-modal-custom { z-index: 9999999 !important; }
        .tr-modal-custom .modal-dialog { max-width: 100% !important; margin: 0 !important; }
        .tr-modal-custom .modal-content { position: fixed !important; inset: 0 !important; z-index: 9999999 !important; display: flex; flex-direction: column; }
        .tr-modal-custom .modal-body { flex: 1; overflow-y: auto; }
        body.modal-open { overflow: hidden !important; }
        .terminal-label { color: #00ff00 !important; font-weight: 500; margin-bottom: 0.5rem; display: block; font-family: 'Courier New', monospace; }
        .terminal-prompt { color: #00ff00; font-weight: bold; margin-right: 0.5rem; }
        .terminal-prompt-small { color: #00ff00; font-weight: bold; margin-right: 0.5rem; font-size: 0.8rem; }
        .answer-textarea-terminal { width: 100%; background: #0a0a0a; border: 1px solid #00ff00; border-radius: 4px; padding: 1rem; color: #00ff00; resize: vertical; font-family: 'Courier New', monospace; font-size: 0.9rem; line-height: 1.4; box-shadow: inset 0 0 5px rgba(0, 255, 0, 0.1); }
        .answer-textarea-terminal:focus { outline: none; border-color: #00ff00; box-shadow: 0 0 10px rgba(0, 255, 0, 0.3); background: #000000; }
        .answer-textarea-terminal::placeholder { color: #2a6b2a; font-family: 'Courier New', monospace; }
        .interim-line-terminal { margin-top: 0.5rem; color: #00ff00; font-size: 0.85rem; font-family: 'Courier New', monospace; background: #0a0a0a; padding: 0.5rem; border-left: 3px solid #00ff00; }
        /* Answer / Code tabbed box — replaces two separately-labelled
           stacked sections with a single box + tab switcher. */
        .answer-tabs-container { border: 1px solid #00ff00; border-radius: 6px; background: #050505; overflow: hidden; margin-bottom: 1rem; }
        .answer-tabs-header { display: flex; border-bottom: 1px solid #00ff00; background: #0a0a0a; }
        .answer-tab-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.35rem; padding: 0.6rem 1rem; background: transparent; border: none; color: #2a6b2a; font-family: 'Courier New', monospace; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; border-right: 1px solid #003300; }
        .answer-tab-btn:last-child { border-right: none; }
        .answer-tab-btn:hover { color: #00ff00; background: rgba(0, 255, 0, 0.05); }
        .answer-tab-btn.active { color: #00ff00; background: rgba(0, 255, 0, 0.1); box-shadow: inset 0 -2px 0 #00ff00; }
        .answer-tab-panel { padding: 1rem; }
        .answer-tab-panel .answer-textarea-terminal { border: none; box-shadow: none; background: transparent; padding: 0; margin-bottom: 0.5rem; }
        .code-editor-toolbar { display: flex; align-items: center; justify-content: flex-end; gap: 0.5rem; margin-bottom: 0.5rem; }
        .code-editor-toolbar-label { color: #00ff00; font-family: 'Courier New', monospace; font-size: 0.8rem; }
        .code-lang-select { background: #0a0a0a; color: #00ff00; border: 1px solid #00ff00; border-radius: 4px; padding: 0.3rem 0.6rem; font-family: 'Courier New', monospace; font-size: 0.8rem; cursor: pointer; }
        .code-lang-select:focus { outline: none; box-shadow: 0 0 8px rgba(0, 255, 0, 0.3); }
        /* White code panel, as requested — a clean light card instead of
           the terminal's neon-green styling, since the editor itself now
           uses Monaco's light "vs" theme. */
        .code-editor-wrapper { border: 1px solid #d0d7de; border-radius: 6px; overflow: hidden; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.15); }
        .cursor-blink { animation: blink 1s step-end infinite; color: #00ff00; }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        .mic-active-container { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
        .mic-status-indicator { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: #0a0a0a; border-radius: 8px; border: 1px solid #00ff00; }
        .mic-dot { width: 10px; height: 10px; border-radius: 50%; background: #00ff00; animation: pulse-green 1.5s infinite; }
        .mic-status-text { font-size: 0.8rem; font-family: 'Courier New', monospace; color: #00ff00; }
        @keyframes pulse-green { 0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 0 rgba(0, 255, 0, 0.7); } 50% { opacity: 0.5; transform: scale(1.2); box-shadow: 0 0 0 10px rgba(0, 255, 0, 0); } }
      `}</style>
    </>
  )
}