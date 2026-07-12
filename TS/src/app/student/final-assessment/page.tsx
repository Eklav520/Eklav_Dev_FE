import React, { useCallback, useEffect, useRef, useState } from "react"
import { Card, Button, Spinner, Alert, Modal, Badge } from "react-bootstrap"
import {
  FaCalendarAlt, FaCheckCircle, FaTrophy, FaChartBar, FaBullseye,
  FaClock, FaStopwatch, FaUser, FaPlay, FaCircle, FaCog, FaBroadcastTower, FaTimesCircle,
  FaGraduationCap, FaClipboardList, FaExclamationCircle, FaCheckDouble, FaChevronLeft, FaChevronRight,
  FaVolumeMute, FaExpand, FaWifi, FaSync, FaBan, FaLightbulb, FaListUl, FaPlayCircle,
} from 'react-icons/fa'
import StudentQuiz from "./components/StudentQuiz"
import StudentCodeChallengeComponent from "./components/codeChallenge/StudentCodeChallengeComponent"
import { useAuthContext } from "@/context/useAuthContext"
import TechnicalRound from "./components/TRRound/TechnicalRound"
import HRRound from "./HRRound/HRRound"
import StudentEnglishRound from "./components/EnglishRound/StudentEnglishRound"
import { useProctorGuard } from './helper/useProctorGuard'
import ViolationAlert from './components/ViolationAlert'

type RoundKey = "mcq" | "coding" | "tr" | "hr" | "english"

type Round = {
  roundType: RoundKey
  status: "upcoming" | "active" | "completed"
  pickCount: number
  timeSeconds: number
  passPercentage?: number
  pointsPerQuestion?: number
  enabled?: boolean
  startDateTime?: string
  endDateTime?: string
}

type Assessment = {
  _id: string
  title: string
  description?: string
  activeRound: RoundKey | null
  createdAt: string
  published?: boolean
  rounds?: Round[]
}

type RoundResult = {
  roundType: string
  score: number
  total: number
  percentage: number
  passed: boolean
  startedAt?: string
  completedAt?: string
}

type StudentResult = {
  approved: boolean
  status: string
  totalScore: number
  percentage: number
  approvalStatus: string
  comments?: string | null
  roundResults: RoundResult[]
}

// ✅ SVG ICON COMPONENTS
const AssessmentIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 4H20V20H4V4Z" stroke="#ff6b35" strokeWidth="1.5" fill="none" />
    <path d="M8 7H16M8 11H14M8 15H12" stroke="#ff6b35" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M17 17L19 19" stroke="#ff6b35" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const MCQIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" stroke="#ff6b35" strokeWidth="1.5" fill="none" />
    <path d="M9 12L11 14L15 10" stroke="#ff6b35" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const CodingIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="18" height="16" rx="2" stroke="#ff6b35" strokeWidth="1.5" fill="none" />
    <path d="M8 10L6 12L8 14M16 10L18 12L16 14M12 9L10 15" stroke="#ff6b35" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const TechnicalIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#ff6b35" strokeWidth="1.5" fill="none" />
    <path d="M2 17L12 22L22 17M2 12L12 17L22 12" stroke="#ff6b35" strokeWidth="1.5" fill="none" />
  </svg>
)

const HRIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="8" r="4" stroke="#ff6b35" strokeWidth="1.5" fill="none" />
    <path d="M5 20V19C5 14.5 8 12 12 12C16 12 19 14.5 19 19V20" stroke="#ff6b35" strokeWidth="1.5" fill="none" />
  </svg>
)

const EnglishIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="18" height="16" rx="2" stroke="#ff6b35" strokeWidth="1.5" fill="none" />
    <path d="M7 9H17M7 12H14M7 15H11" stroke="#ff6b35" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const QuestionIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M9 9C9 7.5 10 6 12 6C14 6 15 7.5 15 9C15 10.5 14 11 12 12V13M12 17H12.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const InfoIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M12 8V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M12 16H12.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const TargetIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
  </svg>
)

const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="6" width="18" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M8 3V6M16 3V6M3 10H21" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="11" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M8 11V7C8 4.5 10 3 12 3C14 3 16 4.5 16 7V11" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

const UnlockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="11" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M8 11V7C8 5 9 4 12 4C14 4 15 5 16 7" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

// Helper functions
function getRoundIcon(type: string) {
  switch (type) {
    case 'mcq':     return <MCQIcon />
    case 'coding':  return <CodingIcon />
    case 'tr':      return <TechnicalIcon />
    case 'hr':      return <HRIcon />
    case 'english': return <EnglishIcon />
    default:        return <AssessmentIcon />
  }
}

export default function StudentAssessmentController() {
  const { user } = useAuthContext()
  const token = user?.token
  const API_BASE = import.meta.env.VITE_API_BASE_URL
  const isPending = (user?.status || '').trim().toLowerCase() === 'pending'

  const [loading, setLoading] = useState(true)
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [studentProgressMap, setStudentProgressMap] = useState<Record<string, { completedRounds: string[]; status: string }>>({})
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null)
  const [rounds, setRounds] = useState<Round[]>([])
  const [activeRound, setActiveRound] = useState<RoundKey | null>(null)
  const [completedRounds, setCompletedRounds] = useState<string[]>([])
  const [examStatus, setExamStatus] = useState<string>("")

  const [isRunning, setIsRunning] = useState(false)
  const [roundConfig, setRoundConfig] = useState<any>(null)
  const [showAssessmentModal, setShowAssessmentModal] = useState(false)
  const [showStartScreen, setShowStartScreen] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [startingRound, setStartingRound] = useState<string | null>(null)
  const [showViolationAlert, setShowViolationAlert] = useState(false)
  const [studentResult, setStudentResult] = useState<StudentResult | null>(null)

  // Portal list state
  const [tick, setTick] = useState(0)
  const [activeFilter, setActiveFilter] = useState('all')
  const [sortBy, setSortBy] = useState('nearest')
  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const [resultsMap, setResultsMap] = useState<Record<string, StudentResult | null>>({})
  const [reportAssessment, setReportAssessment] = useState<Assessment | null>(null)
  const [reportTab, setReportTab] = useState('overview')
  const [showFullCalendar, setShowFullCalendar] = useState(false)
  const [fullCalMonth, setFullCalMonth] = useState(new Date())
  const [fullCalView, setFullCalView] = useState<'month' | 'list'>('month')
  const [fcFilterStatus, setFcFilterStatus] = useState('all')
  const [fcFilterType, setFcFilterType] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 5
  const [featuredAsmId, setFeaturedAsmId] = useState<string | null>(null)

  const submitRef = useRef<() => void>(() => {})
  const mcqForceSubmitRef = useRef<() => void>(() => {})
  const violationPendingRef = useRef(false)
  const onViolationCb = useCallback(() => setShowViolationAlert(true), [])
  const onMaxReachedCb = useCallback(() => {
    violationPendingRef.current = true
    setTimeout(() => submitRef.current(), 3000)
  }, [])

  const proctor = useProctorGuard(
    {
      maxViolations: 3,
      enabled: isRunning,
      captureFullscreenExit: true,
      autoReenterFullscreen: true,
      preventEscFullscreen: true,
    },
    { onViolation: onViolationCb, onMaxReached: onMaxReachedCb }
  )

  // Fetch assessments — list + full detail for each (for round data)
  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const [assessRes, progressRes] = await Promise.all([
          fetch(`${API_BASE}/api/assessment/admin/exams`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/api/assessment/my-progress`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])

        const data = await assessRes.json()
        const progressData = await progressRes.json()

        let localProgressMap: Record<string, { completedRounds: string[]; status: string }> = {}
        if (progressData.success && Array.isArray(progressData.data)) {
          progressData.data.forEach((p: any) => { localProgressMap[p.examId] = p })
          setStudentProgressMap(localProgressMap)
        }

        if (!data.success) {
          console.error("Failed to fetch assessments")
          return
        }

        const basicList: Assessment[] = data.exams || []
        setAssessments(basicList)

        // Fetch full detail for each exam in parallel to get rounds with dates
        const detailed = await Promise.all(
          basicList.map(async (exam) => {
            try {
              const dr = await fetch(`${API_BASE}/api/assessment/admin/exam/${exam._id}`, {
                headers: { Authorization: `Bearer ${token}` },
              })
              const dd = await dr.json()
              if (dd.success && dd.exam) {
                const now = new Date()
                const rounds: Round[] = (dd.exam.rounds || []).map((r: any) => {
                  const start = new Date(r.startDateTime)
                  const end = new Date(r.endDateTime)
                  let status: Round["status"] = "upcoming"
                  if (now >= start && now <= end) status = "active"
                  else if (now > end) status = "completed"
                  return { ...r, status }
                })
                return { ...exam, ...dd.exam, rounds, published: dd.exam.published }
              }
            } catch { }
            return exam
          })
        )

        setAssessments(detailed)

        // Fetch results for assessments with any completed rounds or fully completed
        const completedIds = detailed.filter(a => {
          const p = localProgressMap[a._id]
          return p?.status === 'completed' || (p?.completedRounds?.length ?? 0) > 0
        }).map(a => a._id)
        const resultEntries = await Promise.allSettled(
          completedIds.map(async (id) => {
            const r = await fetch(`${API_BASE}/api/assessment/result/${id}`, { headers: { Authorization: `Bearer ${token}` } })
            const d = await r.json()
            return [id, d.success ? d : null] as [string, StudentResult | null]
          })
        )
        const rm: Record<string, StudentResult | null> = {}
        resultEntries.forEach(r => { if (r.status === 'fulfilled') rm[r.value[0]] = r.value[1] })
        setResultsMap(rm)

        // Auto-select featured assessment: live first, then most recent
        const now = new Date()
        const liveAsm = detailed.find(a => (a.rounds ?? []).some((r: any) => {
          const s = r.startDateTime ? new Date(r.startDateTime) : null
          const e = r.endDateTime ? new Date(r.endDateTime) : null
          return s && e && now >= s && now <= e
        }))
        const fallback = [...detailed].sort((a, b) => {
          const ta = a.rounds?.[0]?.startDateTime ? new Date(a.rounds[0].startDateTime).getTime() : 0
          const tb = b.rounds?.[0]?.startDateTime ? new Date(b.rounds[0].startDateTime).getTime() : 0
          return tb - ta
        })[0]
        setFeaturedAsmId(prev => prev ?? (liveAsm ?? fallback)?._id ?? null)

      } catch (err) {
        console.error("Fetch assessments error", err)
      } finally {
        setLoading(false)
      }
    }

    if (token) fetchAssessments()
  }, [token])

  // Fetch exam details
  const handleSelectAssessment = async (assessment: Assessment) => {
    setSelectedAssessment(assessment)
    setShowStartScreen(true)
    setAgreedToTerms(false)
    setShowAssessmentModal(true)
    setModalLoading(true)

    try {
      const res = await fetch(`${API_BASE}/api/assessment/current-exam`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await res.json()

      if (data.success && data.examId === assessment._id) {
        const examDescription = data.description || data.exam?.description || assessment.description || ""

        setSelectedAssessment((prev: any) => ({
          ...prev,
          description: prev?.description || examDescription,
        }))
        setRounds(data.rounds || [])
        setActiveRound(data.activeRound)
        setCompletedRounds(data.completedRounds || [])
        setExamStatus(data.status)
      } else {
        const examRes = await fetch(`${API_BASE}/api/assessment/admin/exam/${assessment._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const examData = await examRes.json()

        if (examData.success && examData.exam) {
          const now = new Date()
          const formattedRounds = examData.exam.rounds.map((r: any) => {
            const startDate = new Date(r.startDateTime)
            const endDate = new Date(r.endDateTime)
            let status: "upcoming" | "active" | "completed" = "upcoming"

            if (now >= startDate && now <= endDate) {
              status = "active"
            } else if (now > endDate) {
              status = "completed"
            }

            return {
              roundType: r.roundType,
              status: status,
              pickCount: r.pickCount,
              timeSeconds: r.timeSeconds,
              passPercentage: r.passPercentage,
              startDateTime: r.startDateTime,
              endDateTime: r.endDateTime
            }
          })
          const now2 = new Date()
          const allEnded = formattedRounds.every((r: any) => r.endDateTime && new Date(r.endDateTime) < now2)
          const anyActive = formattedRounds.some((r: any) => r.status === "active")
          const computedStatus = allEnded ? "completed" : anyActive ? "active" : "upcoming"

          setSelectedAssessment(examData.exam)
          setRounds(formattedRounds)
          // Use cached progress map to restore completedRounds when current-exam doesn't match
          const cached = studentProgressMap[assessment._id]
          setCompletedRounds(cached?.completedRounds || [])
          setExamStatus(cached?.status === 'completed' ? 'completed' : computedStatus)
        }
      }

      // Fetch student result (scores + admin comments)
      try {
        const resultRes = await fetch(`${API_BASE}/api/assessment/result/${assessment._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const resultData = await resultRes.json()
        if (resultData.success) {
          setStudentResult(resultData)
          setResultsMap(prev => ({ ...prev, [assessment._id]: resultData }))
          // Sync completedRounds from result if not already set from current-exam
          if (resultData.completedRounds?.length > 0) {
            setCompletedRounds((prev) => prev.length > 0 ? prev : resultData.completedRounds)
          }
        } else {
          setStudentResult(null)
        }
      } catch {
        setStudentResult(null)
      }

    } catch (err) {
      console.error("Fetch exam details error", err)
    } finally {
      setModalLoading(false)
    }
  }

  const handleCloseModal = () => {
    setShowAssessmentModal(false)
    setTimeout(() => {
      setSelectedAssessment(null)
      setRounds([])
      setActiveRound(null)
      setCompletedRounds([])
      setExamStatus("")
      setStartingRound(null)
      setStudentResult(null)
    }, 300)
  }

  const handleStartRound = async (round: Round) => {
    setStartingRound(round.roundType)
    try {
      const startRes = await fetch(`${API_BASE}/api/assessment/start/${selectedAssessment._id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      const startData = await startRes.json()

      if (!startData.success) {
        alert(startData.message || "Cannot start this round")
        setStartingRound(null)
        return
      }

      setRoundConfig({
        questionCount: round.pickCount,
        duration: round.timeSeconds,
        type: round.roundType,
        passPercentage: round.passPercentage
      })

      setActiveRound(round.roundType)
      setIsRunning(true)
      await proctor.enterFullscreen()
      proctor.arm()

      // 🔥 Delay closing modal (IMPORTANT FIX)
      setTimeout(() => {
        setShowAssessmentModal(false)
      }, 100)

      setStartingRound(null)
    } catch (err) {
      console.error("Start round error", err)
      alert("Failed to start round")
      setStartingRound(null)
    }
  }

  const handleRoundSubmit = async () => {
    proctor.disarm()
    proctor.reset()
    const wasViolation = violationPendingRef.current
    violationPendingRef.current = false
    try {
      const submitRes = await fetch(`${API_BASE}/api/assessment/complete-round`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          examId: selectedAssessment._id,
          roundType: roundConfig?.type,
          violationAutoSubmit: wasViolation,
        }),
      })

      const submitData = await submitRes.json()

      if (!submitData.success) {
        console.error("Submit failed", submitData.message)
      }

      // Immediately mark this round as completed in local state
      // so the UI is correct even if current-exam refresh fails
      const submittedRound = roundConfig?.type
      if (submittedRound) {
        setCompletedRounds(prev =>
          prev.includes(submittedRound) ? prev : [...prev, submittedRound]
        )
      }

      const refreshRes = await fetch(`${API_BASE}/api/assessment/current-exam`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const refreshData = await refreshRes.json()

      if (refreshData.success && refreshData.examId === selectedAssessment._id) {
        setRounds(refreshData.rounds || [])
        setActiveRound(refreshData.activeRound)
        setCompletedRounds(refreshData.completedRounds || [])
        setExamStatus(refreshData.status)
      }

    } catch (err) {
      console.error("Submit error", err)
    }

    setIsRunning(false)
    setActiveRound(null)

    if (examStatus === "completed") {
      alert("🎉 Congratulations! You have successfully completed all rounds! 🎉")
      setSelectedAssessment(null)
      setRounds([])
      setShowAssessmentModal(false)
    } else {
      setShowAssessmentModal(true)
    }
  }

  submitRef.current = (roundConfig?.type === 'mcq')
    ? () => mcqForceSubmitRef.current()
    : handleRoundSubmit
  // English round: forceSubmitRef is passed directly to StudentEnglishRound via prop,
  // so submitRef already points to handleRoundSubmit as fallback

  // ── Round label (must be before useMemo that references it) ────────────────
  const getRoundLabel = (type: string) => {
    const labels: Record<string, string> = { mcq: "MCQ Round", coding: "Coding Round", tr: "Technical Round", hr: "HR Round", english: "English Round" }
    return labels[type] || type.toUpperCase()
  }

  // ── Refresh result when report view opens (picks up latest admin comments) ──
  useEffect(() => {
    if (!reportAssessment || !token) return
    const id = reportAssessment._id
    fetch(`${API_BASE}/api/assessment/result/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setResultsMap(prev => ({ ...prev, [id]: d })) })
      .catch(() => {})
  }, [reportAssessment])

  // ── Tick every second for live timers ──────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  // ── Portal helper functions ─────────────────────────────────────────────────
  const LOGO_COLORS = ['#f97316','#fb923c','#ea580c','#ff7a2f','#f87171','#fbbf24','#e8671a','#ff6b35']
  const getLogoColor = (title: string) => {
    let h = 0; for (let i = 0; i < title.length; i++) h = h * 31 + title.charCodeAt(i)
    return LOGO_COLORS[Math.abs(h) % LOGO_COLORS.length]
  }
  const getInitials = (title: string) => {
    const w = title.trim().split(/\s+/)
    return w.length >= 2 ? (w[0][0] + w[1][0]).toUpperCase() : title.slice(0, 2).toUpperCase()
  }
  const getCountdown = (dateStr?: string) => {
    if (!dateStr) return null
    const diff = new Date(dateStr).getTime() - Date.now()
    if (diff <= 0) return null
    return {
      days: Math.floor(diff / 86400000),
      hrs:  Math.floor((diff % 86400000) / 3600000),
      mins: Math.floor((diff % 3600000) / 60000),
      secs: Math.floor((diff % 60000) / 1000),
    }
  }
  const getAsmStatus = (assessment: Assessment) => {
    const progress = studentProgressMap[assessment._id]
    if (progress?.status === 'completed') return 'completed'
    const rounds = assessment.rounds ?? []
    const now = new Date()
    if (rounds.some(r => {
      const s = r.startDateTime ? new Date(r.startDateTime) : null
      const e = r.endDateTime   ? new Date(r.endDateTime)   : null
      return s && e && now >= s && now <= e
    })) return 'live'
    const firstStart = rounds[0]?.startDateTime
    if (firstStart && new Date(firstStart) > now) return 'upcoming'
    return 'past'
  }

  // ── Portal computed values ──────────────────────────────────────────────────
  const stats = React.useMemo(() => {
    let upcoming = 0, completed = 0
    assessments.forEach(a => {
      const s = getAsmStatus(a)
      if (s === 'upcoming' || s === 'live') upcoming++
      if (s === 'completed') completed++
    })
    const results = Object.values(resultsMap).filter(Boolean) as StudentResult[]
    const passed = results.filter(r => r.status === 'passed').length
    const avgScore = results.length > 0 ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length) : 0
    return { upcoming, completed, passed, certificates: passed, avgScore, placementReady: Math.min(100, passed * 25 + completed * 10) }
  }, [assessments, studentProgressMap, resultsMap])

  const filteredAssessments = React.useMemo(() => {
    const now = new Date()
    const today    = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today.getTime() + 86400000)
    const nextWeek = new Date(today.getTime() + 7 * 86400000)
    let list = assessments.filter(a => {
      const st = getAsmStatus(a)
      if (activeFilter === 'upcoming') return st === 'upcoming'
      if (activeFilter === 'live')     return st === 'live'
      if (activeFilter === 'completed') return st === 'completed'
      if (activeFilter === 'today') return (a.rounds ?? []).some(r => { const d = r.startDateTime ? new Date(r.startDateTime) : null; return d && d >= today && d < tomorrow })
      if (activeFilter === 'tomorrow') return (a.rounds ?? []).some(r => { const d = r.startDateTime ? new Date(r.startDateTime) : null; return d && d >= tomorrow && d < new Date(tomorrow.getTime() + 86400000) })
      if (activeFilter === 'thisweek') return (a.rounds ?? []).some(r => { const d = r.startDateTime ? new Date(r.startDateTime) : null; return d && d >= today && d <= nextWeek })
      return true
    })
    list = [...list].sort((a, b) => {
      const ta = a.rounds?.[0]?.startDateTime ? new Date(a.rounds[0].startDateTime!).getTime() : 0
      const tb = b.rounds?.[0]?.startDateTime ? new Date(b.rounds[0].startDateTime!).getTime() : 0
      return sortBy === 'nearest' ? ta - tb : tb - ta
    })
    return list
  }, [assessments, studentProgressMap, activeFilter, sortBy])

  const calDays = React.useMemo(() => {
    const year = calendarMonth.getFullYear(), month = calendarMonth.getMonth()
    const first = new Date(year, month, 1), last = new Date(year, month + 1, 0)
    const startDay = (first.getDay() + 6) % 7
    const asmDates = new Set<number>()
    assessments.forEach(a => (a.rounds ?? []).forEach(r => {
      if (r.startDateTime) { const d = new Date(r.startDateTime); if (d.getFullYear() === year && d.getMonth() === month) asmDates.add(d.getDate()) }
    }))
    const today = new Date(); const todayDate = today.getDate(), todayMonth = today.getMonth(), todayYear = today.getFullYear()
    const cells: { day: number | null; isToday: boolean; hasAssessment: boolean }[] = []
    for (let i = 0; i < startDay; i++) cells.push({ day: null, isToday: false, hasAssessment: false })
    for (let d = 1; d <= last.getDate(); d++) cells.push({ day: d, isToday: d === todayDate && month === todayMonth && year === todayYear, hasAssessment: asmDates.has(d) })
    return cells
  }, [calendarMonth, assessments])

  const calEvents = React.useMemo(() => {
    const year = calendarMonth.getFullYear(), month = calendarMonth.getMonth()
    const colors = ['#ef4444','#3b82f6','#f59e0b','#10b981','#8b5cf6']
    const events: { date: string; time: string; title: string; color: string }[] = []
    assessments.forEach((a, ai) => (a.rounds ?? []).forEach(r => {
      if (r.startDateTime) {
        const d = new Date(r.startDateTime)
        if (d.getFullYear() === year && d.getMonth() === month) {
          events.push({
            date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
            time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase(),
            title: a.title,
            color: colors[ai % colors.length]
          })
        }
      }
    }))
    return events.slice(0, 4)
  }, [calendarMonth, assessments])

  const STANDARD_ROUNDS = [
    { type: 'aptitude', label: 'Aptitude Round' },
    { type: 'mcq',      label: 'Aptitude Round' },
    { type: 'coding',   label: 'Coding Round' },
    { type: 'tr',       label: 'Technical Round' },
    { type: 'hr',       label: 'HR Interview' },
    { type: 'english',  label: 'English Round' },
  ]

  const journeySteps = React.useMemo(() => {
    const active = assessments.find(a => getAsmStatus(a) === 'live') || assessments.find(a => getAsmStatus(a) === 'upcoming') || assessments[0]
    if (!active) return []
    const progress = studentProgressMap[active._id]
    const now = new Date()
    const activeRounds = active.rounds ?? []

    const steps: { label: string; sub: string; status: string }[] = [
      { label: 'Registration', sub: `Completed on ${new Date(active.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`, status: 'done' }
    ]

    // Use standard round order; include rounds from assessment data in that order,
    // then append any remaining rounds not in the standard list
    const seen = new Set<string>()
    STANDARD_ROUNDS.forEach(sr => {
      const r = activeRounds.find(ar => ar.roundType === sr.type)
      if (!r) return
      seen.add(r.roundType)
      const done = progress?.completedRounds?.includes(r.roundType)
      const s = r.startDateTime ? new Date(r.startDateTime) : null
      const e = r.endDateTime   ? new Date(r.endDateTime)   : null
      const isLive = s && e && now >= s && now <= e && !done
      steps.push({ label: sr.label, sub: done ? 'Completed' : isLive ? 'In Progress' : 'Upcoming', status: done ? 'done' : isLive ? 'live' : 'pending' })
    })
    // Any rounds not in standard list
    activeRounds.filter(r => !seen.has(r.roundType)).forEach(r => {
      const done = progress?.completedRounds?.includes(r.roundType)
      const s = r.startDateTime ? new Date(r.startDateTime) : null
      const e = r.endDateTime   ? new Date(r.endDateTime)   : null
      const isLive = s && e && now >= s && now <= e && !done
      steps.push({ label: getRoundLabel(r.roundType), sub: done ? 'Completed' : isLive ? 'In Progress' : 'Upcoming', status: done ? 'done' : isLive ? 'live' : 'pending' })
    })

    steps.push({ label: 'Completed', sub: progress?.status === 'completed' ? 'Done' : 'Pending', status: progress?.status === 'completed' ? 'done' : 'pending' })
    return steps
  }, [assessments, studentProgressMap])

  const isRoundCompleted = (roundType: string) => completedRounds.includes(roundType)

  const isRoundActive = (round: Round) => round.status === "active" && !isRoundCompleted(round.roundType)

  const getRoundStatus = (round: Round) => {
    if (isRoundCompleted(round.roundType)) return { text: "Completed", color: "#28a745" }
    if (round.status === "active") return { text: "Available", color: "#ff6b35" }
    if (round.status === "completed") return { text: "Ended", color: "#dc3545" }
    return { text: "Upcoming", color: "#ffc107" }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60

    if (hours > 0) return `${hours}h ${remainingMinutes}m`
    return `${minutes} minutes`
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not scheduled"
    return new Date(dateString).toLocaleString()
  }

  const formatCardDate = (dateString?: string) => {
    if (!dateString) return "—"
    return new Date(dateString).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    })
  }

  const getRoundStatusFromDates = (round: Round): { label: string; color: string; bg: string } => {
    const now = new Date()
    const start = round.startDateTime ? new Date(round.startDateTime) : null
    const end = round.endDateTime ? new Date(round.endDateTime) : null
    if (isRoundCompleted(round.roundType)) return { label: "Completed", color: "#28a745", bg: "rgba(40,167,69,0.12)" }
    if (start && end && now >= start && now <= end) return { label: "Active", color: "#ff6b35", bg: "rgba(255,107,53,0.12)" }
    if (start && now < start) return { label: "Upcoming", color: "#ffc107", bg: "rgba(255,193,7,0.12)" }
    if (end && now > end) return { label: "Ended", color: "#dc3545", bg: "rgba(220,53,69,0.12)" }
    return { label: "Scheduled", color: "#888", bg: "rgba(136,136,136,0.12)" }
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh", background: "#f8fafc" }}>
        <Spinner animation="border" variant="secondary" />
      </div>
    )
  }

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh" }}>
      {/* ── Assessment Report View ── */}
      {!isRunning && !selectedAssessment && reportAssessment && (() => {
        const rpt = reportAssessment
        const rptResult = resultsMap[rpt._id]
        const rptProgress = studentProgressMap[rpt._id]
        const rptRounds = rpt.rounds ?? []
        const firstRound = rptRounds[0]
        const totalDuration = rptRounds.reduce((s, r) => s + (r.timeSeconds ?? 0), 0)
        const logoColor = getLogoColor(rpt.title)
        const initials = getInitials(rpt.title)
        const roundIcons: Record<string, React.ReactNode> = {
          aptitude: <FaChartBar style={{ fontSize: 11 }} />, mcq: <FaChartBar style={{ fontSize: 11 }} />,
          coding: <FaClipboardList style={{ fontSize: 11 }} />, tr: <FaGraduationCap style={{ fontSize: 11 }} />,
          hr: <FaUser style={{ fontSize: 11 }} />, english: <FaClipboardList style={{ fontSize: 11 }} />,
        }
        const scoreVal = rptResult ? Math.round(rptResult.percentage) : 0
        const circumference = 2 * Math.PI * 40
        const dashOffset = circumference * (1 - scoreVal / 100)
        const passed = rptResult?.status === 'passed'
        const ROUND_TAB_MAP: Record<string, string> = {
          aptitude: 'Aptitude', mcq: 'Aptitude',
          coding: 'Coding Round', tr: 'TR Round', hr: 'HR Round', english: 'English Round'
        }
        const roundTabs = rptRounds.map(r => ({ key: r.roundType, label: ROUND_TAB_MAP[r.roundType] || getRoundLabel(r.roundType) }))
          .filter((t, i, arr) => arr.findIndex(x => x.label === t.label) === i)
        const TABS = ['overview', ...roundTabs.map(t => t.key), 'summary', 'feedback']
        const TAB_LABELS: Record<string, string> = {
          overview: 'Overview', summary: 'Summary', feedback: 'Feedback',
          ...Object.fromEntries(roundTabs.map(t => [t.key, t.label]))
        }

        return (
          <div className="rpt-wrapper">
            {/* Breadcrumb */}
            <div className="rpt-breadcrumb">
              <button className="rpt-bc-link" onClick={() => setReportAssessment(null)}>Assessments</button>
              <span className="rpt-bc-sep">›</span>
              <span className="rpt-bc-link" onClick={() => setReportAssessment(null)} style={{ cursor: 'pointer' }}>{rpt.title}</span>
              <span className="rpt-bc-sep">›</span>
              <span className="rpt-bc-current">View Reports</span>
            </div>

            <div className="rpt-layout">
              {/* Left / Main */}
              <div className="rpt-main">

                {/* Header card */}
                <div className="rpt-header-card">
                  <div className="rpt-header-top">
                    <div className="rpt-logo" style={{ background: logoColor }}>{initials}</div>
                    <div className="rpt-header-info">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <h2 className="rpt-title">{rpt.title}</h2>
                        <span className="rpt-status-chip">{rptResult ? (passed ? 'Passed' : 'Failed') : 'Completed'}</span>
                      </div>
                      <div className="rpt-meta-row">
                        {firstRound?.startDateTime && <span><FaCalendarAlt /> {new Date(firstRound.startDateTime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>}
                        {firstRound?.startDateTime && <span><FaClock /> {new Date(firstRound.startDateTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>}
                        {totalDuration > 0 && <span><FaClock /> {Math.round(totalDuration / 60)} Mins</span>}
                        <span><FaUser /> Attempts: {rptProgress?.completedRounds?.length ?? 0}</span>
                      </div>
                      <div className="rpt-rounds-row">
                        <span className="rpt-rounds-lbl">Rounds:</span>
                        {rptRounds.map(r => {
                          const done = rptProgress?.completedRounds?.includes(r.roundType)
                          return (
                            <span key={r.roundType} className={'rpt-round-chip' + (done ? ' done' : '')}>
                              {roundIcons[r.roundType] ?? <FaCircle style={{ fontSize: 7 }} />}
                              {getRoundLabel(r.roundType)}
                              {done && <span className="rpt-round-date">{r.endDateTime ? new Date(r.endDateTime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}</span>}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                    {/* Score circle */}
                    <div className="rpt-score-box">
                      <div className="rpt-score-label">Your Score</div>
                      <div className="rpt-score-row">
                        <div className="rpt-score-circle-wrap">
                          <svg width="100" height="100" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="7"/>
                            <circle cx="50" cy="50" r="40" fill="none"
                              stroke={passed ? '#22c55e' : '#ef4444'}
                              strokeWidth="7" strokeLinecap="round"
                              strokeDasharray={String(circumference)}
                              strokeDashoffset={String(dashOffset)}
                              transform="rotate(-90 50 50)"
                            />
                          </svg>
                          <div className="rpt-score-inner">
                            <div className="rpt-score-pct">{scoreVal}%</div>
                          </div>
                        </div>
                        <div className="rpt-score-frac">{rptResult?.totalScore ?? scoreVal} / {rptResult?.roundResults?.reduce((s, r) => s + r.total, 0) || 100}</div>
                      </div>
                      <div className={'rpt-perf-badge ' + (passed ? 'good' : 'low')}>
                        {passed ? <FaCheckCircle style={{ marginRight: 4 }} /> : <FaTimesCircle style={{ marginRight: 4 }} />}
                        {passed ? 'Good Performance' : 'Needs Improvement'}
                      </div>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="rpt-tabs">
                    {TABS.map(t => (
                      <button key={t} className={'rpt-tab' + (reportTab === t ? ' active' : '')} onClick={() => setReportTab(t)}>
                        {TAB_LABELS[t]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab content */}
                {reportTab === 'overview' && (() => {
                  const totalQ = rptResult?.roundResults?.reduce((s, r) => s + r.total, 0) || 0
                  const correctA = rptResult?.roundResults?.reduce((s, r) => s + r.score, 0) || 0
                  const totalScoreVal = rptResult?.totalScore ?? scoreVal
                  const maxScore = rptResult?.roundResults?.reduce((s, r) => s + r.total, 0) || 100
                  const completedRR = rptResult?.roundResults ?? []
                  const totalTimeMins = Math.round(totalDuration / 60)
                  const approvalStatus = rptResult?.approvalStatus ?? 'pending'

                  // Simple SVG line chart data
                  const chartPoints = completedRR.map((rr, i) => ({ x: i, y: rr.percentage, label: getRoundLabel(rr.roundType) }))
                  const chartW = 340, chartH = 120, padX = 30, padY = 16
                  const toSvgX = (i: number) => padX + (chartPoints.length > 1 ? i * (chartW - padX * 2) / (chartPoints.length - 1) : (chartW - padX * 2) / 2)
                  const toSvgY = (v: number) => padY + (chartH - padY * 2) * (1 - v / 100)
                  const polyline = chartPoints.map((p, i) => String(toSvgX(i)) + ',' + String(toSvgY(p.y))).join(' ')

                  return (
                    <>
                      {/* Round Wise Summary Cards */}
                      {completedRR.length > 0 && (
                        <div className="rpt-content" style={{ marginBottom: 0 }}>
                          <div className="rpt-section-title">Round Wise Summary</div>
                          <div className="rpt-rws-grid">
                            {completedRR.map((rr, i) => {
                              const rnd = rptRounds.find(r => r.roundType === rr.roundType)
                              const dateStr = rnd?.endDateTime ? new Date(rnd.endDateTime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : rr.completedAt ? new Date(rr.completedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''
                              return (
                                <div key={i} className="rpt-rws-card">
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                    <FaCheckCircle style={{ color: '#22c55e', fontSize: 13 }} />
                                    <span className="rpt-rws-name">{getRoundLabel(rr.roundType)}</span>
                                  </div>
                                  {dateStr && <div className="rpt-rws-date">Completed on {dateStr}</div>}
                                  <div className="rpt-rws-score">{rr.score} / {rr.total}</div>
                                  <div className="rpt-rws-pct" style={{ color: rr.passed ? '#22c55e' : '#ef4444' }}>{rr.percentage}%</div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Overall Performance */}
                      <div className="rpt-content" style={{ marginBottom: 0 }}>
                        <div className="rpt-section-title">Overall Performance</div>
                        <div className="rpt-perf-cards">
                          <div className="rpt-perf-card">
                            <div className="rpt-perf-icon" style={{ background: '#ede9fe', color: '#6366f1' }}><FaClipboardList /></div>
                            <div>
                              <div className="rpt-perf-val">{totalScoreVal} / {maxScore}</div>
                              <div className="rpt-perf-lbl">Total Score</div>
                              <div className="rpt-perf-sub">{scoreVal}%</div>
                            </div>
                          </div>
                          <div className="rpt-perf-card">
                            <div className="rpt-perf-icon" style={{ background: '#f0fdf4', color: '#22c55e' }}><FaCheckCircle /></div>
                            <div>
                              <div className="rpt-perf-val">{totalQ > 0 ? (String(correctA) + ' / ' + String(totalQ)) : String(rptProgress?.completedRounds?.length ?? 0)}</div>
                              <div className="rpt-perf-lbl">{totalQ > 0 ? 'Correct Answers' : 'Rounds Completed'}</div>
                              <div className="rpt-perf-sub">{totalQ > 0 ? (String(scoreVal) + '%') : ('of ' + String(rptRounds.length) + ' rounds')}</div>
                            </div>
                          </div>
                          <div className="rpt-perf-card">
                            <div className="rpt-perf-icon" style={{ background: '#fff7ed', color: '#f59e0b' }}><FaClock /></div>
                            <div>
                              <div className="rpt-perf-val" style={{ color: '#f59e0b' }}>{totalTimeMins} mins</div>
                              <div className="rpt-perf-lbl">Time Taken</div>
                              <div className="rpt-perf-sub">Total duration</div>
                            </div>
                          </div>
                          <div className="rpt-perf-card">
                            {approvalStatus === 'approved'
                              ? <div className="rpt-perf-icon" style={{ background: '#f0fdf4', color: '#22c55e' }}><FaTrophy /></div>
                              : <div className="rpt-perf-icon" style={{ background: '#fefce8', color: '#ca8a04' }}><FaClock /></div>}
                            <div>
                              <div className="rpt-perf-val" style={{ color: approvalStatus === 'approved' ? '#16a34a' : '#ca8a04', fontSize: 13 }}>
                                {approvalStatus === 'approved' ? (passed ? 'Qualified' : 'Not Qualified') : 'Pending'}
                              </div>
                              <div className="rpt-perf-lbl">Result</div>
                              <div className="rpt-perf-sub">{approvalStatus === 'approved' ? (passed ? 'Congratulations!' : 'Better luck next time') : 'Awaiting admin'}</div>
                            </div>
                          </div>
                          <div className="rpt-perf-card">
                            {approvalStatus === 'approved'
                              ? <div className="rpt-perf-icon" style={{ background: '#f0fdf4', color: '#22c55e' }}><FaCheckCircle /></div>
                              : approvalStatus === 'rejected'
                              ? <div className="rpt-perf-icon" style={{ background: '#fef2f2', color: '#ef4444' }}><FaTimesCircle /></div>
                              : <div className="rpt-perf-icon" style={{ background: '#fefce8', color: '#ca8a04' }}><FaClock /></div>}
                            <div>
                              <div className="rpt-perf-val" style={{ color: approvalStatus === 'approved' ? '#16a34a' : approvalStatus === 'rejected' ? '#ef4444' : '#ca8a04', fontSize: 13 }}>
                                {approvalStatus === 'approved' ? 'Approved' : approvalStatus === 'rejected' ? 'Rejected' : 'Pending'}
                              </div>
                              <div className="rpt-perf-lbl">Result Status</div>
                              <div className="rpt-perf-sub">{approvalStatus === 'approved' ? 'Score released' : approvalStatus === 'rejected' ? 'Contact admin' : 'Awaiting admin'}</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Round Wise Performance Table + Trend */}
                      {completedRR.length > 0 && (
                        <div className="rpt-content" style={{ marginBottom: 0 }}>
                          <div className="rpt-two-col">
                            <div style={{ flex: 1 }}>
                              <div className="rpt-section-title">Round Wise Performance</div>
                              <div className="rpt-round-table">
                                <div className="rpt-round-table-head" style={{ gridTemplateColumns: '1.5fr 80px 80px 120px 60px' }}>
                                  <span>Round</span><span>Score</span><span>Obtained</span><span>Percentage</span><span>Result</span>
                                </div>
                                {completedRR.map((rr, i) => {
                                  const rnd = rptRounds.find(r => r.roundType === rr.roundType)
                                  const dateStr = rnd?.startDateTime ? new Date(rnd.startDateTime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''
                                  return (
                                    <div key={i} className="rpt-round-table-row" style={{ gridTemplateColumns: '1.5fr 80px 80px 120px 60px' }}>
                                      <span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                          <FaCheckCircle style={{ color: '#22c55e', fontSize: 11 }} />
                                          <div>
                                            <div style={{ fontWeight: 700, fontSize: 12 }}>{getRoundLabel(rr.roundType)}</div>
                                            {dateStr && <div style={{ fontSize: 10, color: '#94a3b8' }}>{dateStr}</div>}
                                          </div>
                                        </div>
                                      </span>
                                      <span style={{ fontWeight: 700 }}>{rr.total}</span>
                                      <span style={{ fontWeight: 800, color: '#22c55e' }}>{rr.score}</span>
                                      <span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                          <div style={{ flex: 1, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: String(rr.percentage) + '%', background: rr.passed ? '#22c55e' : '#ef4444', borderRadius: 3 }} />
                                          </div>
                                          <span style={{ fontSize: 11, fontWeight: 700, minWidth: 32 }}>{rr.percentage}%</span>
                                        </div>
                                      </span>
                                      <span className={'rpt-badge ' + (rr.passed ? 'pass' : 'fail')}>{rr.passed ? 'Pass' : 'Fail'}</span>
                                    </div>
                                  )
                                })}
                                {/* Total row */}
                                <div className="rpt-round-table-row rpt-total-row" style={{ gridTemplateColumns: '1.5fr 80px 80px 120px 60px' }}>
                                  <span style={{ fontWeight: 800 }}>Total</span>
                                  <span style={{ fontWeight: 800 }}>{maxScore}</span>
                                  <span style={{ fontWeight: 800, color: '#22c55e' }}>{totalScoreVal}</span>
                                  <span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                      <div style={{ flex: 1, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: String(scoreVal) + '%', background: '#22c55e', borderRadius: 3 }} />
                                      </div>
                                      <span style={{ fontSize: 11, fontWeight: 800, minWidth: 32 }}>{scoreVal}%</span>
                                    </div>
                                  </span>
                                  <span className={'rpt-badge ' + (passed ? 'pass' : 'fail')}>{passed ? 'Pass' : 'Fail'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Performance Trend */}
                            {chartPoints.length > 1 && (
                              <div style={{ width: 340, flexShrink: 0 }}>
                                <div className="rpt-section-title">Performance Trend</div>
                                <div style={{ background: '#f8fafc', borderRadius: 12, padding: '12px 8px 8px' }}>
                                  <svg width={chartW} height={chartH + 28} style={{ overflow: 'visible' }}>
                                    {/* Y grid lines */}
                                    {[0, 25, 50, 75, 100].map(v => (
                                      <g key={v}>
                                        <line x1={padX} y1={toSvgY(v)} x2={chartW - padX} y2={toSvgY(v)} stroke="#e2e8f0" strokeWidth="1" />
                                        <text x={padX - 6} y={toSvgY(v) + 4} fontSize="9" fill="#94a3b8" textAnchor="end">{v}</text>
                                      </g>
                                    ))}
                                    {/* Line */}
                                    <polyline points={polyline} fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinejoin="round" />
                                    {/* Dots + labels */}
                                    {chartPoints.map((p, i) => (
                                      <g key={i}>
                                        <circle cx={toSvgX(i)} cy={toSvgY(p.y)} r="4" fill="#22c55e" />
                                        <text x={toSvgX(i)} y={toSvgY(p.y) - 8} fontSize="9" fill="#374151" textAnchor="middle" fontWeight="700">{p.y}%</text>
                                        <text x={toSvgX(i)} y={chartH + 8} fontSize="9" fill="#64748b" textAnchor="middle">{p.label.split(' ')[0]}</text>
                                      </g>
                                    ))}
                                  </svg>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )
                })()}

                {(roundTabs.map(t => t.key) as string[]).includes(reportTab) && (() => {
                  const rr = rptResult?.roundResults?.find(x => x.roundType === reportTab)
                  const rnd = rptRounds.find(r => (r.roundType as string) === reportTab)
                  const isDone = rptProgress?.completedRounds?.includes(reportTab)
                  return (
                    <div className="rpt-content" key={reportTab}>
                      <div className="rpt-section-title">{TAB_LABELS[reportTab]} — Round Report</div>
                      {!isDone ? (
                        <div className="rpt-empty-msg" style={{ padding: '40px 0' }}>
                          <FaClock style={{ fontSize: 32, color: '#cbd5e1', marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
                          <div style={{ fontWeight: 700, color: '#64748b', marginBottom: 4 }}>Round Not Completed</div>
                          <div style={{ color: '#94a3b8', fontSize: 12 }}>
                            {rnd?.startDateTime ? `Scheduled on ${new Date(rnd.startDateTime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}` : 'Will be scheduled later'}
                          </div>
                        </div>
                      ) : rr ? (
                        <>
                          {/* Round score cards */}
                          <div className="rpt-perf-cards" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 20 }}>
                            <div className="rpt-perf-card">
                              <div className="rpt-perf-icon" style={{ background: '#ede9fe', color: '#6366f1' }}><FaClipboardList /></div>
                              <div>
                                <div className="rpt-perf-val">{rr.score} / {rr.total}</div>
                                <div className="rpt-perf-lbl">Score</div>
                                <div className="rpt-perf-sub">{rr.passed ? 'Passed' : 'Failed'}</div>
                              </div>
                            </div>
                            <div className="rpt-perf-card">
                              <div className="rpt-perf-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}><FaChartBar /></div>
                              <div>
                                <div className="rpt-perf-val">{rr.percentage}%</div>
                                <div className="rpt-perf-lbl">Percentage</div>
                                <div className="rpt-perf-sub">This round</div>
                              </div>
                            </div>
                            <div className="rpt-perf-card">
                              <div className="rpt-perf-icon" style={{ background: rr.passed ? '#f0fdf4' : '#fef2f2', color: rr.passed ? '#22c55e' : '#ef4444' }}>
                                {rr.passed ? <FaCheckCircle /> : <FaTimesCircle />}
                              </div>
                              <div>
                                <div className="rpt-perf-val" style={{ color: rr.passed ? '#16a34a' : '#ef4444' }}>{rr.passed ? 'Pass' : 'Fail'}</div>
                                <div className="rpt-perf-lbl">Result</div>
                                <div className="rpt-perf-sub">{rr.passed ? 'Well done!' : 'Keep trying'}</div>
                              </div>
                            </div>
                          </div>

                          {/* Score progress bar */}
                          <div style={{ background: '#f8fafc', borderRadius: 10, padding: '16px 20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
                              <span>Score Progress</span>
                              <span>{rr.score} / {rr.total}</span>
                            </div>
                            <div style={{ height: 10, background: '#e2e8f0', borderRadius: 5, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${rr.percentage}%`, background: rr.passed ? '#22c55e' : '#ef4444', borderRadius: 5, transition: 'width 0.5s' }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
                              <span>0</span><span>{rr.percentage}%</span><span>{rr.total}</span>
                            </div>
                          </div>

                          {rr.startedAt && rr.completedAt && (
                            <div style={{ display: 'flex', gap: 16, marginTop: 14 }}>
                              <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 16px', flex: 1 }}>
                                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}>Started At</div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{new Date(rr.startedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</div>
                              </div>
                              <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 16px', flex: 1 }}>
                                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}>Completed At</div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{new Date(rr.completedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</div>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="rpt-empty-msg">No result data available for this round.</div>
                      )}
                    </div>
                  )
                })()}

                {reportTab === 'summary' && (
                  <div className="rpt-content">
                    <div className="rpt-section-title">Assessment Summary</div>
                    <div className="rpt-summary-grid">
                      <div className="rpt-summary-item"><span>Status</span><strong style={{ color: passed ? '#22c55e' : '#ef4444' }}>{passed ? 'Passed' : 'Failed'}</strong></div>
                      <div className="rpt-summary-item"><span>Score</span><strong>{rptResult?.totalScore ?? 0}</strong></div>
                      <div className="rpt-summary-item"><span>Percentage</span><strong>{scoreVal}%</strong></div>
                      <div className="rpt-summary-item"><span>Rounds Completed</span><strong>{rptProgress?.completedRounds?.length ?? 0}</strong></div>
                      <div className="rpt-summary-item"><span>Assessment</span><strong>{rpt.title}</strong></div>
                      {firstRound?.startDateTime && <div className="rpt-summary-item"><span>Date</span><strong>{new Date(firstRound.startDateTime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></div>}
                    </div>
                  </div>
                )}

                {reportTab === 'feedback' && (
                  <div className="rpt-content">
                    <div className="rpt-section-title">Mentor Feedback</div>
                    {rptResult?.comments ? (
                      <div className="rpt-feedback-card">
                        <div className="rpt-feedback-icon">💬</div>
                        <div className="rpt-feedback-body">
                          <div className="rpt-feedback-label">Comments from Evaluator</div>
                          <div className="rpt-feedback-text">{rptResult.comments}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="rpt-empty-msg">
                        <FaClock style={{ fontSize: 28, color: '#cbd5e1', display: 'block', margin: '0 auto 10px' }} />
                        No feedback available yet.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right sidebar */}
              <div className="rpt-sidebar">
                {/* Round Progress */}
                <div className="rpt-side-card">
                  <div className="rpt-side-title">Round Progress</div>
                  {(() => {
                    const allStdRounds = [
                      { type: 'aptitude', label: 'Aptitude Round' },
                      { type: 'mcq',      label: 'Aptitude Round' },
                      { type: 'coding',   label: 'Coding Challenge' },
                      { type: 'tr',       label: 'Technical Interview' },
                      { type: 'hr',       label: 'HR Interview' },
                      { type: 'english',  label: 'English Round' },
                    ]
                    const seen = new Set<string>()
                    const displayRounds: { type: string; label: string; round?: any }[] = []
                    allStdRounds.forEach(sr => {
                      const r = rptRounds.find(ar => ar.roundType === sr.type)
                      if (r && !seen.has(sr.type)) { seen.add(sr.type); displayRounds.push({ ...sr, round: r }) }
                    })
                    rptRounds.filter(r => !seen.has(r.roundType)).forEach(r => {
                      displayRounds.push({ type: r.roundType, label: getRoundLabel(r.roundType), round: r })
                    })
                    return displayRounds.map((item, i) => {
                      const r = item.round
                      const done = rptProgress?.completedRounds?.includes(item.type)
                      const rr = rptResult?.roundResults?.find(x => x.roundType === item.type)
                      const isActive = !done && r?.startDateTime
                      const dateStr = r?.startDateTime ? new Date(r.startDateTime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date(r.startDateTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : null
                      return (
                        <div key={i} className={'rpt-rp-row' + (done ? ' done' : isActive ? ' active' : '')}>
                          <div className={'rpt-rp-icon' + (done ? ' done' : isActive ? ' active' : '')}>
                            {done ? <FaCheckCircle style={{ fontSize: 11 }} /> : isActive ? <FaCircle style={{ fontSize: 9, color: '#3b82f6' }} /> : <FaCircle style={{ fontSize: 9, opacity: 0.3 }} />}
                          </div>
                          <div className="rpt-rp-info">
                            <div className="rpt-rp-name">{item.label}</div>
                            <div className="rpt-rp-sub">
                              {done ? 'Completed' : isActive ? 'Scheduled' : 'Upcoming'}
                              {dateStr ? <><br />{dateStr}</> : !done ? <><br />Will be scheduled later</> : null}
                            </div>
                          </div>
                          {rr && rr.total > 0 && <div className="rpt-rp-score">{rr.score}/{rr.total}</div>}
                        </div>
                      )
                    })
                  })()}
                  <div className="rpt-rp-tip">
                    <FaCircle style={{ fontSize: 8, color: '#3b82f6', marginRight: 6 }} />
                    Complete the current round to unlock the next round.
                  </div>
                </div>

                {/* Report Actions */}
                <div className="rpt-side-card">
                  <div className="rpt-side-title">Report Actions</div>
                  <button className="rpt-action-btn"><FaClipboardList style={{ color: '#6366f1' }} /> Download Report (PDF)</button>
                  <button className="rpt-action-btn"><FaCheckDouble style={{ color: '#22c55e' }} /> View Solutions</button>
                  <button className="rpt-action-btn"><FaExclamationCircle style={{ color: '#f59e0b' }} /> Share Report</button>
                </div>

                {/* Assessment Details */}
                <div className="rpt-side-card">
                  <div className="rpt-side-title">Assessment Details</div>
                  <div className="rpt-detail-row"><span>Duration</span><span>{Math.round(totalDuration / 60)} Minutes</span></div>
                  <div className="rpt-detail-row"><span>Rounds</span><span>{rptRounds.length}</span></div>
                  <div className="rpt-detail-row"><span>Score</span><span>{rptResult?.totalScore ?? 0}</span></div>
                  <div className="rpt-detail-row"><span>Result</span><span style={{ color: passed ? '#22c55e' : '#ef4444', fontWeight: 700 }}>{passed ? 'Pass' : 'Fail'}</span></div>
                  {firstRound?.startDateTime && <div className="rpt-detail-row"><span>Date</span><span>{new Date(firstRound.startDateTime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>}
                  <div className="rpt-detail-row"><span>Approval</span><span>{rptResult?.approvalStatus ?? 'Pending'}</span></div>
                </div>
              </div>
            </div>

            <style>{`
              .rpt-wrapper { background: #f8fafc; min-height: 100vh; padding: 0 0 40px; }
              .rpt-breadcrumb { display: flex; align-items: center; gap: 6px; padding: 16px 28px 0; font-size: 13px; color: #64748b; }
              .rpt-bc-link { background: none; border: none; color: #ff6b35; font-size: 13px; font-weight: 600; cursor: pointer; padding: 0; }
              .rpt-bc-sep { color: #94a3b8; }
              .rpt-bc-current { color: #0f172a; font-weight: 600; }
              .rpt-layout { display: grid; grid-template-columns: 1fr 280px; gap: 16px; padding: 16px 28px 0; align-items: start; }
              .rpt-main { display: flex; flex-direction: column; gap: 14px; }
              .rpt-sidebar { display: flex; flex-direction: column; gap: 12px; }

              .rpt-header-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; }
              .rpt-header-top { display: flex; gap: 16px; align-items: stretch; padding: 20px 24px 16px; }
              .rpt-logo { width: 56px; height: 56px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 800; color: #fff; flex-shrink: 0; }
              .rpt-header-info { flex: 1; min-width: 0; }
              .rpt-title { font-size: 18px; font-weight: 800; color: #0f172a; margin: 0; }
              .rpt-status-chip { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; background: #dcfce7; color: #16a34a; border: 1px solid #bbf7d0; }
              .rpt-meta-row { display: flex; align-items: center; gap: 14px; font-size: 12px; color: #64748b; margin: 6px 0 10px; flex-wrap: wrap; }
              .rpt-meta-row span { display: flex; align-items: center; gap: 5px; }
              .rpt-rounds-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
              .rpt-rounds-lbl { font-size: 12px; font-weight: 700; color: #0f172a; }
              .rpt-round-chip { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 8px; background: #eff6ff; color: #3b82f6; }
              .rpt-round-chip.done { background: #f0fdf4; color: #16a34a; }
              .rpt-round-date { font-size: 10px; color: #94a3b8; margin-left: 4px; }

              .rpt-score-box { flex-shrink: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; border-left: 1.5px solid #e2e8f0; padding-left: 24px; }
              .rpt-score-label { font-size: 11px; font-weight: 700; color: #64748b; text-align: center; }
              .rpt-score-row { display: flex; align-items: center; gap: 12px; }
              .rpt-score-circle-wrap { position: relative; width: 100px; height: 100px; flex-shrink: 0; }
              .rpt-score-inner { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
              .rpt-score-pct { font-size: 20px; font-weight: 900; color: #0f172a; }
              .rpt-score-frac { font-size: 16px; font-weight: 800; color: #0f172a; white-space: nowrap; }
              .rpt-perf-badge { font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 20px; display: flex; align-items: center; }
              .rpt-perf-badge.good { background: #f0fdf4; color: #16a34a; }
              .rpt-perf-badge.low { background: #fef2f2; color: #ef4444; }

              .rpt-tabs { display: flex; border-top: 1px solid #f1f5f9; padding: 0 24px; gap: 0; }
              .rpt-tab { background: none; border: none; padding: 12px 18px; font-size: 13px; font-weight: 600; color: #64748b; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; }
              .rpt-tab.active { color: #ff6b35; border-bottom-color: #ff6b35; }

              .rpt-content { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px 24px; }
              .rpt-section-title { font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 14px; }

              .rpt-perf-cards { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }
              .rpt-perf-card { background: #f8fafc; border-radius: 12px; padding: 16px 14px; display: flex; flex-direction: row; align-items: center; gap: 12px; }
              .rpt-perf-icon { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 17px; flex-shrink: 0; }
              .rpt-perf-val { font-size: 17px; font-weight: 900; color: #0f172a; line-height: 1.2; }
              .rpt-perf-lbl { font-size: 12px; font-weight: 700; color: #374151; margin-top: 2px; }
              .rpt-perf-sub { font-size: 11px; color: #94a3b8; margin-top: 1px; }

              .rpt-round-table { border: 1px solid #f1f5f9; border-radius: 10px; overflow: hidden; }
              .rpt-bar-wrap { height: 6px; background: #e2e8f0; border-radius: 3px; flex: 1; overflow: hidden; display: inline-block; width: 80px; vertical-align: middle; margin-right: 8px; }
              .rpt-bar-fill { height: 100%; border-radius: 3px; }
              .rpt-bar-pct { font-size: 12px; font-weight: 700; vertical-align: middle; }
              .rpt-badge { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; display: inline-block; }
              .rpt-badge.pass { background: #f0fdf4; color: #16a34a; }
              .rpt-badge.fail { background: #fef2f2; color: #ef4444; }

              .rpt-rws-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
              .rpt-rws-card { background: #f8fafc; border-radius: 12px; padding: 16px; border: 1px solid #e2e8f0; }
              .rpt-rws-name { font-size: 13px; font-weight: 700; color: #0f172a; }
              .rpt-rws-date { font-size: 11px; color: #94a3b8; margin-bottom: 10px; }
              .rpt-rws-score { font-size: 22px; font-weight: 800; color: #0f172a; line-height: 1; }
              .rpt-rws-pct { font-size: 12px; font-weight: 700; margin-top: 2px; }

              .rpt-two-col { display: flex; gap: 20px; align-items: flex-start; }
              .rpt-total-row { background: #f8fafc; }
              .rpt-round-table-head { display: grid; padding: 10px 16px; background: #f8fafc; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
              .rpt-round-table-row { display: grid; padding: 12px 16px; border-top: 1px solid #f1f5f9; font-size: 13px; color: #374151; font-weight: 500; align-items: center; }

              .rpt-summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
              .rpt-summary-item { background: #f8fafc; border-radius: 10px; padding: 14px 16px; display: flex; flex-direction: column; gap: 4px; }
              .rpt-summary-item span { font-size: 11px; color: #64748b; font-weight: 600; }
              .rpt-summary-item strong { font-size: 14px; color: #0f172a; font-weight: 800; }
              .rpt-feedback-box { background: #f8fafc; border-radius: 10px; padding: 16px; font-size: 13px; color: #374151; line-height: 1.6; }
              .rpt-feedback-card { display: flex; gap: 14px; align-items: flex-start; background: #fff7ed; border: 1.5px solid #fed7aa; border-radius: 14px; padding: 20px; }
              .rpt-feedback-icon { font-size: 28px; flex-shrink: 0; line-height: 1; }
              .rpt-feedback-body { display: flex; flex-direction: column; gap: 6px; }
              .rpt-feedback-label { font-size: 11px; font-weight: 800; color: #ea580c; text-transform: uppercase; letter-spacing: 0.06em; }
              .rpt-feedback-text { font-size: 14px; color: #374151; line-height: 1.7; white-space: pre-wrap; }
              .rpt-empty-msg { color: #94a3b8; font-size: 13px; text-align: center; padding: 32px; }

              .rpt-side-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; }
              .rpt-side-title { font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 12px; }
              .rpt-rp-row { display: flex; align-items: flex-start; gap: 10px; padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
              .rpt-rp-row:last-child { border-bottom: none; }
              .rpt-rp-icon { width: 26px; height: 26px; border-radius: 50%; background: #f1f5f9; color: #94a3b8; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 2px solid #e2e8f0; }
              .rpt-rp-icon.done { background: #22c55e; color: #fff; border-color: #22c55e; }
              .rpt-rp-icon.active { background: #eff6ff; color: #3b82f6; border-color: #3b82f6; }
              .rpt-rp-tip { margin-top: 10px; background: #eff6ff; border-radius: 8px; padding: 8px 10px; font-size: 11px; color: #3b82f6; font-weight: 600; display: flex; align-items: center; }
              .rpt-rp-info { flex: 1; min-width: 0; }
              .rpt-rp-name { font-size: 12px; font-weight: 700; color: #0f172a; }
              .rpt-rp-sub { font-size: 10px; color: #94a3b8; margin-top: 1px; }
              .rpt-rp-score { font-size: 11px; font-weight: 700; color: #ff6b35; flex-shrink: 0; }
              .rpt-action-btn { width: 100%; background: none; border: none; display: flex; align-items: center; gap: 10px; padding: 9px 4px; font-size: 12px; font-weight: 600; color: #374151; cursor: pointer; border-bottom: 1px solid #f1f5f9; text-align: left; }
              .rpt-action-btn:last-child { border-bottom: none; }
              .rpt-action-btn:hover { color: #ff6b35; }
              .rpt-detail-row { display: flex; justify-content: space-between; align-items: center; padding: 7px 0; border-bottom: 1px solid #f8fafc; font-size: 12px; }
              .rpt-detail-row:last-child { border-bottom: none; }
              .rpt-detail-row span:first-child { color: #64748b; }
              .rpt-detail-row span:last-child { font-weight: 700; color: #0f172a; }
            `}</style>
          </div>
        )
      })()}

      {/* ── Start Assessment Screen ── */}
      {!isRunning && selectedAssessment && showStartScreen && (() => {
        const activeRoundObj = rounds.find(r => isRoundActive(r)) ?? rounds.find(r => !isRoundCompleted(r.roundType))
        const progress = studentProgressMap[selectedAssessment._id]
        const isLiveNow = rounds.some(r => isRoundActive(r))
        // Next upcoming round = not completed, not currently live, startDateTime in the future
        const nextUpcomingRound = rounds.find(r => !isRoundCompleted(r.roundType) && !isRoundActive(r) && r.startDateTime && new Date(r.startDateTime) > new Date())
        const asmCountdown = getCountdown(nextUpcomingRound?.startDateTime ?? rounds[0]?.startDateTime)
        const totalDur = rounds.reduce((s, r) => s + (r.timeSeconds ?? 0), 0)

        return (
          <div className="ss-wrapper">
            {/* Breadcrumb */}
            <div className="ss-breadcrumb">
              <button className="ss-bc-btn" onClick={() => { setShowStartScreen(false); setSelectedAssessment(null); setShowAssessmentModal(false) }}>
                <FaChevronLeft style={{ fontSize: 11 }} /> Assessments
              </button>
              <span className="ss-bc-sep">›</span>
              <span className="ss-bc-item">{selectedAssessment.title}</span>
              <span className="ss-bc-sep">›</span>
              <span className="ss-bc-item active">Start Assessment</span>
            </div>

            {modalLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                <Spinner animation="border" variant="secondary" />
              </div>
            ) : (
              <div className="ss-body">
                {/* ── Left Column ── */}
                <div className="ss-left">

                  {/* Assessment header card — inside left column so right sidebar aligns beside it */}
                  <div className="ss-header-card">
                    <div className="ss-header-left">
                      <div className="ap-card-logo" style={{ background: getLogoColor(selectedAssessment.title), width: 56, height: 56, fontSize: 18 }}>{getInitials(selectedAssessment.title)}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <h2 className="ss-title">{selectedAssessment.title}</h2>
                          <span className={'ap-status-chip ap-status-' + (isLiveNow ? 'live' : 'upcoming')}>{isLiveNow ? 'Live Now' : 'Scheduled'}</span>
                        </div>
                        <div className="ap-card-meta-row" style={{ marginBottom: 8 }}>
                          {rounds[0]?.startDateTime && <span><FaCalendarAlt /> {new Date(rounds[0].startDateTime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>}
                          {rounds[0]?.startDateTime && <span><FaClock /> {new Date(rounds[0].startDateTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>}
                          {totalDur > 0 && <span><FaStopwatch /> {Math.round(totalDur / 60)} Mins</span>}
                          {progress?.completedRounds?.length ? <span><FaUser /> Attempts: {progress.completedRounds.length}</span> : null}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>Rounds:</span>
                          {rounds.map(r => {
                            const done = isRoundCompleted(r.roundType)
                            const live = isRoundActive(r)
                            const iconColor = done || live ? '#16a34a' : '#3b82f6'
                            const chipIcons: Record<string, React.ReactNode> = {
                              aptitude: <FaChartBar style={{ fontSize: 9, color: iconColor }} />,
                              mcq: <FaChartBar style={{ fontSize: 9, color: iconColor }} />,
                              coding: <FaClipboardList style={{ fontSize: 9, color: iconColor }} />,
                              tr: <FaGraduationCap style={{ fontSize: 9, color: iconColor }} />,
                              hr: <FaUser style={{ fontSize: 9, color: iconColor }} />,
                              english: <FaClipboardList style={{ fontSize: 9, color: iconColor }} />,
                            }
                            const chipDate = !done && !live && r.startDateTime ? new Date(r.startDateTime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : null
                            return (
                              <span key={r.roundType} className={'ap-round-chip' + (done ? ' done' : '') + (live ? ' live-round' : '')}>
                                <span className="ap-chip-name">{chipIcons[r.roundType] ?? <FaCircle style={{ fontSize: 7 }} />}{getRoundLabel(r.roundType)}</span>
                                {done && <span className="ap-chip-sub done">Completed</span>}
                                {live && <span className="ap-chip-sub live">Live Now</span>}
                                {!done && !live && chipDate && <span className="ap-chip-sub upcoming">{chipDate}</span>}
                                {!done && !live && !chipDate && <span className="ap-chip-sub upcoming">Upcoming</span>}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="ss-header-timer">
                      {isLiveNow ? (
                        <div className="ap-live-timer-box">
                          <div className="ap-live-timer-label">Live</div>
                          {(() => {
                            const liveR = rounds.find(r => isRoundActive(r))
                            const el = liveR?.startDateTime ? Math.max(0, Math.floor((Date.now() - new Date(liveR.startDateTime!).getTime()) / 1000)) : 0
                            const h = Math.floor(el/3600), m = Math.floor((el%3600)/60), s = el%60
                            return (
                              <div className="ap-live-countdown">
                                <div className="ap-live-unit"><span className="ap-live-num">{String(h).padStart(2,'0')}</span><span className="ap-live-lbl">Hrs</span></div>
                                <span className="ap-live-sep">:</span>
                                <div className="ap-live-unit"><span className="ap-live-num">{String(m).padStart(2,'0')}</span><span className="ap-live-lbl">Mins</span></div>
                                <span className="ap-live-sep">:</span>
                                <div className="ap-live-unit"><span className="ap-live-num">{String(s).padStart(2,'0')}</span><span className="ap-live-lbl">Secs</span></div>
                              </div>
                            )
                          })()}
                        </div>
                      ) : asmCountdown ? (
                        <div>
                          {nextUpcomingRound ? (
                            <div className="ss-starts-label">
                              <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>{getRoundLabel(nextUpcomingRound.roundType)}</div>
                              <div>Starts in</div>
                            </div>
                          ) : (
                            <div className="ss-starts-label">Assessment starts in</div>
                          )}
                          <div className="ap-starts-timer-box" style={{ display: 'inline-block' }}>
                            <div className="ap-countdown">
                              <div className="ap-live-unit"><span>{String(asmCountdown.days).padStart(2,'0')}</span><span className="ap-cd-unit-lbl">Days</span></div>
                              <span className="ap-cd-sep">:</span>
                              <div className="ap-live-unit"><span>{String(asmCountdown.hrs).padStart(2,'0')}</span><span className="ap-cd-unit-lbl">Hrs</span></div>
                              <span className="ap-cd-sep">:</span>
                              <div className="ap-live-unit"><span>{String(asmCountdown.mins).padStart(2,'0')}</span><span className="ap-cd-unit-lbl">Mins</span></div>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Info bar */}
                  {activeRoundObj && (
                    <div className="ss-info-bar">
                      <FaExclamationCircle style={{ fontSize: 16, color: '#2563eb', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 700 }}>You are about to start the <strong>{getRoundLabel(activeRoundObj.roundType)}</strong>.</div>
                        <div>Make sure you are in a quiet place and have a stable internet connection.</div>
                      </div>
                    </div>
                  )}

                  {/* Round Schedule Table */}
                  <div className="ss-round-table-card">
                    <div className="ss-section-title" style={{ marginBottom: 16 }}>Round Details & Summary</div>
                    <table className="ss-round-table">
                      <thead>
                        <tr>
                          <th>Round</th>
                          <th>Status</th>
                          <th>Score</th>
                          <th>Date & Time</th>
                          <th style={{ textAlign: 'right' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rounds.map((r, i) => {
                          const done = isRoundCompleted(r.roundType)
                          const live = isRoundActive(r)
                          const now = new Date()
                          const start = r.startDateTime ? new Date(r.startDateTime) : null
                          const end = r.endDateTime ? new Date(r.endDateTime) : null
                          const ended = end ? now > end && !done : false
                          const scheduled = !done && !live && !ended && start && now < start

                          // Per-round score from results
                          const roundResult = resultsMap[selectedAssessment._id]?.roundResults?.find((rr: any) => rr.roundType === r.roundType)
                          const scoreStr = done && roundResult ? `${roundResult.score}/${roundResult.total}` : '—'

                          // Date & Time cell
                          const dateTimeCell = (() => {
                            if (live && end) {
                              const diffMs = end.getTime() - now.getTime()
                              if (diffMs > 0) {
                                const h = Math.floor(diffMs / 3600000)
                                const m = Math.floor((diffMs % 3600000) / 60000)
                                const s = Math.floor((diffMs % 60000) / 1000)
                                const countdown = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
                                return (
                                  <div>
                                    <span className="ss-rt-live-dot" />
                                    <span className="ss-rt-live-label">Live</span>
                                    <div className="ss-rt-ends-in">Ends in {countdown}</div>
                                  </div>
                                )
                              }
                            }
                            if (done && roundResult?.completedAt) {
                              return <span className="ss-rt-date">{new Date(roundResult.completedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                            }
                            if (start) {
                              return <span className="ss-rt-date">{start.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}, {start.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                            }
                            return <span className="ss-rt-date">—</span>
                          })()

                          // Round icon
                          const roundIcon = done
                            ? <span className="ss-rt-icon done"><FaCheckCircle /></span>
                            : live
                            ? <span className="ss-rt-icon live"><FaPlayCircle /></span>
                            : <span className="ss-rt-icon upcoming"><FaClock /></span>

                          return (
                            <tr key={i} className={'ss-rt-row' + (live ? ' live' : done ? ' done' : '')}>
                              <td>
                                <div className="ss-rt-name">
                                  {roundIcon}
                                  {getRoundLabel(r.roundType)}
                                </div>
                              </td>
                              <td>
                                {done ? <span className="ss-rt-badge done">Completed</span>
                                  : live ? <span className="ss-rt-badge live">Live Now</span>
                                  : ended ? <span className="ss-rt-badge ended">Ended</span>
                                  : <span className="ss-rt-badge upcoming">Scheduled</span>}
                              </td>
                              <td className="ss-rt-score">{scoreStr}</td>
                              <td>{dateTimeCell}</td>
                              <td style={{ textAlign: 'right' }}>
                                {(() => {
                                  const hasReport = done && roundResult
                                  if (hasReport) {
                                    return (
                                      <button
                                        className="ss-rt-btn view-report"
                                        onClick={() => {
                                          setReportAssessment(selectedAssessment)
                                          setReportTab(r.roundType)
                                          setShowAssessmentModal(false)
                                          setShowStartScreen(false)
                                          setSelectedAssessment(null)
                                        }}
                                      >
                                        View Report
                                      </button>
                                    )
                                  }
                                  if (live && !done) {
                                    return (
                                      <button
                                        className={'ss-rt-btn continue' + (agreedToTerms ? '' : ' disabled')}
                                        disabled={!agreedToTerms || startingRound === r.roundType}
                                        onClick={() => agreedToTerms && handleStartRound(r)}
                                      >
                                        {startingRound === r.roundType ? 'Starting…' : 'Start Assessment'} <FaChevronRight style={{ fontSize: 10, marginLeft: 4 }} />
                                      </button>
                                    )
                                  }
                                  return (
                                    <button className={'ss-rt-btn view-details' + (scheduled ? ' scheduled' : '')} disabled>
                                      View Details
                                    </button>
                                  )
                                })()}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>

                    {/* Checkbox attached to table bottom */}
                    <div className="ss-table-checkbox-row">
                      <label className="ss-checkbox-row" onClick={() => setAgreedToTerms(v => !v)}>
                        <div className={'ss-custom-check' + (agreedToTerms ? ' checked' : '')}>
                          {agreedToTerms && <FaCheckCircle style={{ fontSize: 16, color: '#ff6b35' }} />}
                        </div>
                        <span>I have read and understood all the instructions and guidelines.</span>
                      </label>
                    </div>
                  </div>

                  {/* Before You Start + Assessment Details side by side */}
                  <div className="ss-content-row">
                    {/* Left: instructions */}
                    <div className="ss-content-left ss-before-box">
                      <div className="ss-section-title">Before You Start</div>
                      <div className="ss-section-sub">Please read the instructions carefully</div>
                      <div className="ss-instructions-grid">
                        {[
                          { icon: <FaVolumeMute />, iconBg: '#fff3e0', iconColor: '#f97316', title: 'Find a quiet place', desc: 'Avoid distractions and ensure complete focus.' },
                          { icon: <FaExpand />,     iconBg: '#f1f5f9', iconColor: '#475569', title: 'Full screen mode',   desc: 'The assessment will open in full screen mode.' },
                          { icon: <FaWifi />,       iconBg: '#eff6ff', iconColor: '#3b82f6', title: 'Stable internet',    desc: 'Ensure stable internet connection throughout the assessment.' },
                          { icon: <FaSync />,       iconBg: '#fff7ed', iconColor: '#f97316', title: 'Do not refresh',     desc: 'Do not refresh or close the browser during the assessment.' },
                          { icon: <FaBan />,        iconBg: '#fef2f2', iconColor: '#ef4444', title: 'No switching tabs',  desc: 'Do not switch tabs or open other applications.' },
                          { icon: <FaClock />,      iconBg: '#fffbeb', iconColor: '#f59e0b', title: 'Time management',    desc: 'Manage your time well and attempt all questions.' },
                        ].map((item, i) => (
                          <div key={i} className="ss-instr-card">
                            <div className="ss-instr-icon" style={{ background: item.iconBg, color: item.iconColor }}>{item.icon}</div>
                            <div>
                              <div className="ss-instr-title">{item.title}</div>
                              <div className="ss-instr-desc">{item.desc}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* Note */}
                      <div className="ss-note" style={{ marginTop: 12 }}>
                        <FaExclamationCircle style={{ color: '#d97706', flexShrink: 0 }} />
                        <span><strong>Note:</strong> If any malpractice is detected, your assessment may be terminated and reported.</span>
                      </div>
                    </div>

                    {/* Right: Assessment Details */}
                    {activeRoundObj && (
                      <div className="ss-content-right">
                        <div className="ss-details-box">
                          <div className="ss-section-title" style={{ marginBottom: 16 }}>Assessment Details</div>
                          {[
                            { icon: <FaClipboardList />, label: 'Round', value: getRoundLabel(activeRoundObj.roundType) },
                            { icon: <FaCheckDouble />, label: 'Total Questions', value: String(activeRoundObj.pickCount || '—') },
                            { icon: <FaChartBar />, label: 'Total Marks', value: String(activeRoundObj.pickCount || '—') },
                            { icon: <FaClock />, label: 'Duration', value: activeRoundObj.timeSeconds ? Math.round(activeRoundObj.timeSeconds / 60) + ' Minutes' : '—' },
                            { icon: <FaExclamationCircle />, label: 'Negative Marking', value: activeRoundObj.pointsPerQuestion ? 'Yes' : 'No' },
                            { icon: <FaBullseye />, label: 'Passing Score', value: activeRoundObj.passPercentage ? activeRoundObj.passPercentage + '% (' + Math.ceil((activeRoundObj.pickCount || 0) * (activeRoundObj.passPercentage || 0) / 100) + ' Marks)' : '—' },
                          ].map((row, i) => (
                            <div key={i} className="ss-detail-row">
                              <span className="ss-detail-icon">{row.icon}</span>
                              <span className="ss-detail-label">{row.label}</span>
                              <span className="ss-detail-value">{row.value}</span>
                            </div>
                          ))}
                          <div className="ss-tip-box">
                            <div className="ss-tip-icon"><FaLightbulb /></div>
                            <span><strong>Tip:</strong> Use the preview option on the next page to check how questions will appear.</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                </div>

                {/* ── Right Column ── */}
                <div className="ss-right">
                  {/* Your Rounds */}
                  <div className="ss-side-card">
                    <div className="ss-side-title">Your Rounds <span style={{ color: '#94a3b8', fontWeight: 500 }}>({selectedAssessment.title})</span></div>
                    {rounds.map((r, i) => {
                      const done = isRoundCompleted(r.roundType)
                      const live = isRoundActive(r)
                      const roundScore = progress?.completedRounds?.includes(r.roundType) ? (resultsMap[selectedAssessment._id]?.roundResults?.find(rr => rr.roundType === r.roundType)) : null
                      return (
                        <div key={i} className="ss-round-row">
                          <div className={'ss-round-icon' + (done ? ' done' : live ? ' live' : '')}>
                            {done ? <FaCheckCircle style={{ fontSize: 11 }} /> : live ? <FaCircle style={{ fontSize: 8 }} /> : <FaCircle style={{ fontSize: 8, opacity: 0.3 }} />}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div className="ss-round-name">{getRoundLabel(r.roundType)}</div>
                            <div className="ss-round-sub">
                              {done ? 'Completed' : live ? (<span style={{ color: '#16a34a', fontWeight: 700 }}>Scheduled</span>) : 'Upcoming'}
                              {!done && !live && r.startDateTime ? <span style={{ color: '#94a3b8' }}> · {new Date(r.startDateTime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date(r.startDateTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span> : null}
                              {!done && !live && !r.startDateTime ? <span style={{ color: '#94a3b8' }}> · Will be scheduled later</span> : null}
                            </div>
                          </div>
                          {roundScore && <span className="ss-round-score">{roundScore.score}/{roundScore.total}</span>}
                        </div>
                      )
                    })}
                  </div>

                  {/* Round Flow */}
                  <div className="ss-side-card">
                    <div className="ss-side-title">Round Flow</div>
                    <div className="ss-flow">
                      {rounds.map((r, i) => {
                        const done = isRoundCompleted(r.roundType)
                        const live = isRoundActive(r)
                        return (
                          <React.Fragment key={i}>
                            <div className="ss-flow-step">
                              <div className={'ss-flow-icon' + (done ? ' done' : live ? ' live' : '')}>
                                {done ? <FaCheckCircle style={{ fontSize: 10 }} /> : <FaCircle style={{ fontSize: 7, opacity: done || live ? 1 : 0.4 }} />}
                              </div>
                              <div className="ss-flow-label">{getRoundLabel(r.roundType).split(' ')[0]}</div>
                              <div className="ss-flow-sub">{done ? 'Completed' : live ? 'Live Now' : 'Upcoming'}</div>
                            </div>
                            {i < rounds.length - 1 && <div className={'ss-flow-line' + (done ? ' done' : '')} />}
                          </React.Fragment>
                        )
                      })}
                    </div>
                  </div>

                  {/* Need Help */}
                  <div className="ss-side-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <FaExclamationCircle style={{ color: '#f59e0b', fontSize: 18 }} />
                      <div className="ss-side-title" style={{ marginBottom: 0 }}>Need Help?</div>
                    </div>
                    <div style={{ fontSize: 13, color: '#64748b', marginBottom: 14 }}>If you face any technical issue or have any questions, our support team is here to help.</div>
                    <button className="ss-support-btn">Contact Support</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })()}

      {/* ── Full Calendar View ── */}
      {!isRunning && !selectedAssessment && !reportAssessment && showFullCalendar && (() => {
        const fcYear = fullCalMonth.getFullYear()
        const fcMonthIdx = fullCalMonth.getMonth()
        const monthName = fullCalMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
        const daysInMonth = new Date(fcYear, fcMonthIdx + 1, 0).getDate()
        const firstDow = new Date(fcYear, fcMonthIdx, 1).getDay() // 0=Sun
        const startOffset = firstDow === 0 ? 6 : firstDow - 1 // Mon-based offset
        const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7
        const today = new Date()
        const todayKey = today.toISOString().slice(0, 10)

        // Build events map keyed by 'YYYY-MM-DD'
        const eventsMap: Record<string, { time: string; title: string; status: string; assessment: Assessment }[]> = {}
        assessments.forEach(a => {
          const asmStatus = getAsmStatus(a)
          ;(a.rounds ?? []).forEach(r => {
            if (r.startDateTime) {
              const d = new Date(r.startDateTime)
              const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
              if (!eventsMap[key]) eventsMap[key] = []
              eventsMap[key].push({
                time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase(),
                title: a.title,
                status: asmStatus,
                assessment: a,
              })
            }
          })
        })

        // Filtered upcoming list
        const upcomingList = assessments.filter(a => {
          const s = getAsmStatus(a)
          if (fcFilterStatus !== 'all' && s !== fcFilterStatus) return false
          if (fcFilterType !== 'all' && !(a.rounds ?? []).some(r => r.roundType === fcFilterType)) return false
          return true
        }).slice(0, 8)

        const statusColor: Record<string, string> = { live: '#16a34a', upcoming: '#f97316', scheduled: '#3b82f6', completed: '#64748b', past: '#94a3b8' }
        const statusEventBg: Record<string, string> = { live: '#dcfce7', upcoming: '#fff7ed', scheduled: '#eff6ff', completed: '#f8fafc', past: '#f8fafc' }
        const statusEventText: Record<string, string> = { live: '#15803d', upcoming: '#ea580c', scheduled: '#1d4ed8', completed: '#475569', past: '#94a3b8' }
        const statusLabel: Record<string, string> = { live: 'Live', upcoming: 'Upcoming', scheduled: 'Scheduled', completed: 'Completed', past: 'Ended' }

        const DAY_HEADERS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

        return (
          <div className="fc-wrapper">
            {/* Top bar */}
            <div className="fc-topbar">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button className="fc-today-btn" onClick={() => setFullCalMonth(new Date())}>Today</button>
                <button className="fc-nav-btn" onClick={() => setFullCalMonth(new Date(fcYear, fcMonthIdx - 1, 1))}>‹</button>
                <button className="fc-nav-btn" onClick={() => setFullCalMonth(new Date(fcYear, fcMonthIdx + 1, 1))}>›</button>
                <span className="fc-month-title">{monthName}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="fc-view-tabs">
                  {(['month', 'list'] as const).map(v => (
                    <button key={v} className={'fc-view-tab' + (fullCalView === v ? ' active' : '')} onClick={() => setFullCalView(v)}>
                      {v.charAt(0).toUpperCase() + v.slice(1)}
                    </button>
                  ))}
                </div>
                <button className="fc-back-btn" onClick={() => setShowFullCalendar(false)}>← Back</button>
              </div>
            </div>

            <div className="fc-body">
              {/* Main calendar area */}
              <div className="fc-main">
                {fullCalView === 'month' ? (
                  <div className="fc-grid">
                    {/* Day headers */}
                    {DAY_HEADERS.map(d => <div key={d} className="fc-day-header">{d}</div>)}
                    {/* Day cells */}
                    {Array.from({ length: totalCells }).map((_, ci) => {
                      const dayNum = ci - startOffset + 1
                      const isCurrentMonth = dayNum >= 1 && dayNum <= daysInMonth
                      const dateKey = fcYear + '-' + String(fcMonthIdx + 1).padStart(2, '0') + '-' + String(dayNum).padStart(2, '0')
                      const dayEvents = isCurrentMonth ? (eventsMap[dateKey] ?? []) : []
                      const isToday = dateKey === todayKey
                      return (
                        <div key={ci} className={'fc-cell' + (isCurrentMonth ? '' : ' fc-cell-other') + (isToday ? ' fc-cell-today' : '')}>
                          <div className={'fc-cell-num' + (isToday ? ' today' : '')}>{isCurrentMonth ? dayNum : ''}</div>
                          {dayEvents.slice(0, 2).map((ev, ei) => (
                            <div key={ei} className="fc-event" style={{ background: statusEventBg[ev.status] ?? '#eff6ff', color: statusEventText[ev.status] ?? '#1d4ed8' }}>
                              <div className="fc-event-time">{ev.time}</div>
                              <div className="fc-event-title">{ev.title}</div>
                              <span className="fc-event-chip" style={{ background: statusColor[ev.status] + '22', color: statusColor[ev.status] }}>{statusLabel[ev.status] ?? ev.status}</span>
                            </div>
                          ))}
                          {dayEvents.length > 2 && <div className="fc-more">+{dayEvents.length - 2} more</div>}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  /* List view */
                  <div className="fc-list">
                    {Object.entries(eventsMap).filter(([key]) => key.startsWith(fcYear + '-' + String(fcMonthIdx + 1).padStart(2, '0'))).sort(([a], [b]) => a.localeCompare(b)).map(([key, evs]) => (
                      <div key={key} className="fc-list-group">
                        <div className="fc-list-date">{new Date(key + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                        {evs.map((ev, ei) => (
                          <div key={ei} className="fc-list-event">
                            <div className="fc-list-time">{ev.time}</div>
                            <div style={{ flex: 1 }}>
                              <div className="fc-list-title">{ev.title}</div>
                            </div>
                            <span className="fc-event-chip" style={{ background: statusColor[ev.status] + '22', color: statusColor[ev.status] }}>{statusLabel[ev.status] ?? ev.status}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                    {Object.keys(eventsMap).filter(k => k.startsWith(fcYear + '-' + String(fcMonthIdx + 1).padStart(2, '0'))).length === 0 && (
                      <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>No assessments this month</div>
                    )}
                  </div>
                )}

                {/* Legend */}
                <div className="fc-legend">
                  {[{ color: '#16a34a', label: 'Live Now' }, { color: '#f97316', label: 'Upcoming' }, { color: '#3b82f6', label: 'Scheduled' }, { color: '#10b981', label: 'Completed' }, { color: '#ef4444', label: 'Cancelled' }, { color: '#8b5cf6', label: 'Attempted' }].map(l => (
                    <span key={l.label} className="fc-legend-item"><span className="fc-legend-dot" style={{ background: l.color }} />{l.label}</span>
                  ))}
                </div>
              </div>

              {/* Right sidebar */}
              <div className="fc-sidebar">
                {/* Mini calendar */}
                <div className="fc-mini-cal">
                  <div className="fc-mini-nav">
                    <button onClick={() => setFullCalMonth(new Date(fcYear, fcMonthIdx - 1, 1))}>‹</button>
                    <span>{fullCalMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
                    <button onClick={() => setFullCalMonth(new Date(fcYear, fcMonthIdx + 1, 1))}>›</button>
                  </div>
                  <div className="fc-mini-grid">
                    {['M','T','W','T','F','S','S'].map((d, i) => <div key={i} className="fc-mini-header">{d}</div>)}
                    {Array.from({ length: Math.ceil((startOffset + daysInMonth) / 7) * 7 }).map((_, ci) => {
                      const dn = ci - startOffset + 1
                      const inMonth = dn >= 1 && dn <= daysInMonth
                      const dk = fcYear + '-' + String(fcMonthIdx + 1).padStart(2, '0') + '-' + String(dn).padStart(2, '0')
                      const hasEv = inMonth && !!eventsMap[dk]
                      const isT = dk === todayKey
                      return (
                        <div key={ci} className={'fc-mini-day' + (inMonth ? '' : ' other') + (isT ? ' today' : '') + (hasEv && inMonth ? ' has-ev' : '')}>
                          {inMonth ? dn : ''}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Filters */}
                <div className="fc-side-card">
                  <div className="fc-side-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    Filters <button className="fc-clear-btn" onClick={() => { setFcFilterStatus('all'); setFcFilterType('all') }}>Clear</button>
                  </div>
                  <select className="fc-select" value={fcFilterStatus} onChange={e => setFcFilterStatus(e.target.value)}>
                    <option value="all">All Status</option>
                    <option value="live">Live</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                  </select>
                  <select className="fc-select" value={fcFilterType} onChange={e => setFcFilterType(e.target.value)}>
                    <option value="all">All Types</option>
                    <option value="mcq">MCQ Round</option>
                    <option value="coding">Coding Round</option>
                    <option value="tr">Technical Round</option>
                    <option value="hr">HR Interview</option>
                    <option value="english">English Round</option>
                  </select>
                  <button className="fc-apply-btn">Apply Filters</button>
                </div>

                {/* Upcoming assessments */}
                <div className="fc-side-card">
                  <div className="fc-side-title">Upcoming Assessments <span style={{ color: '#ff6b35' }}>({upcomingList.length})</span></div>
                  {upcomingList.map((a, i) => {
                    const s = getAsmStatus(a)
                    const firstRound = (a.rounds ?? [])[0]
                    return (
                      <div key={i} className="fc-upcoming-row">
                        <div className="ap-card-logo" style={{ background: getLogoColor(a.title), width: 34, height: 34, fontSize: 11, flexShrink: 0 }}>{getInitials(a.title)}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="fc-upcoming-title">{a.title}</div>
                          <div className="fc-upcoming-date">
                            {firstRound?.startDateTime ? new Date(firstRound.startDateTime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ' · ' + new Date(firstRound.startDateTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—'}
                          </div>
                        </div>
                        <span className="fc-event-chip" style={{ background: (statusColor[s] ?? '#94a3b8') + '22', color: statusColor[s] ?? '#94a3b8', flexShrink: 0 }}>{statusLabel[s] ?? s}</span>
                      </div>
                    )
                  })}
                </div>

                {/* Quick Actions */}
                <div className="fc-side-card">
                  <div className="fc-side-title">Quick Actions</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <button className="fc-quick-btn" onClick={() => { setShowFullCalendar(false); setReportAssessment(assessments[0] ?? null) }}>
                      <FaChartBar style={{ fontSize: 13 }} /> View My Results
                    </button>
                    <button className="fc-quick-btn" onClick={() => setShowFullCalendar(false)}>
                      <FaClipboardList style={{ fontSize: 13 }} /> Assessment History
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Assessment Portal List ── */}
      {!isRunning && !selectedAssessment && !reportAssessment && !showFullCalendar && (
        <div className="ap-wrapper">

          {/* Header */}
          <div className="ap-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="ap-header-icon"><AssessmentIcon /></div>
              <div>
                <h1 className="ap-title">Assessment Portal</h1>
                <p className="ap-subtitle">Explore, attempt and track all your assessments in one place.</p>
              </div>
            </div>
          </div>

          {isPending && (
            <div className="ap-pending-banner">
              <LockIcon />
              <span><strong>Enrollment required:</strong> Final assessments are available only for enrolled students.</span>
            </div>
          )}

          {/* Two-column layout */}
          <div className="ap-layout">
          <div className="ap-main">

          {/* ── Featured Assessment Card ── */}
          {(() => {
            const fa = assessments.find(a => a._id === featuredAsmId)
            if (!fa) return null
            const faRounds: Round[] = fa.rounds ?? []
            const faProgress = studentProgressMap[fa._id]
            const faResult = resultsMap[fa._id]
            const faCompletedTypes = faProgress?.completedRounds ?? []
            const faApprovedTypes = faResult?.roundResults?.map((r: any) => r.roundType) ?? []
            const faDoneTypes = faApprovedTypes.length > 0 ? faApprovedTypes : faCompletedTypes
            const faAllDone = faRounds.length > 0 && faDoneTypes.length >= faRounds.length
            const faLogo = getLogoColor(fa.title)
            const faInitials = getInitials(fa.title)
            const now2 = new Date()
            const faStatus = getAsmStatus(fa)
            const faStartedAt = faCompletedTypes.length > 0 ? faRounds.find(r => r.roundType === faCompletedTypes[0])?.startDateTime : faRounds[0]?.startDateTime
            return (
              <div className="fa-featured-card">
                {/* Header row */}
                <div className="fa-feat-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div className="fa-feat-logo" style={{ background: faLogo }}>{faInitials}</div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <h2 className="fa-feat-title">{fa.title}</h2>
                        <span className={'fa-feat-badge ' + faStatus}>{faStatus === 'live' ? 'Live Now' : faStatus === 'completed' ? 'Completed' : faStatus === 'past' ? 'Ended' : 'Upcoming'}</span>
                      </div>
                      <div className="fa-feat-meta">
                        <span><FaListUl style={{ marginRight: 4 }} /> Total Rounds: {faRounds.length}</span>
                        {faStartedAt && <span><FaCalendarAlt style={{ marginRight: 4 }} /> Started on: {new Date(faStartedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>}
                      </div>
                    </div>
                  </div>
                  {faCompletedTypes.length > 0 ? (
                    <button className="fa-feat-details-btn" style={{ color: '#ea580c', borderColor: '#fed7aa', background: '#fff7ed' }} onClick={() => { setReportAssessment(fa); setReportTab('overview') }}>
                      <FaChartBar style={{ marginRight: 6 }} /> View Report
                    </button>
                  ) : (
                    <button className="fa-feat-details-btn" onClick={() => handleSelectAssessment(fa)}>View Details</button>
                  )}
                </div>

                {/* Round Progress */}
                <div className="fa-feat-rounds-label">Round Progress</div>
                <div className="fa-feat-rounds" style={{
                  justifyContent: faRounds.length === 1 ? 'center' : 'space-between',
                }}>
                  {faRounds.map((r, idx) => {
                    const s = r.startDateTime ? new Date(r.startDateTime) : null
                    const e = r.endDateTime ? new Date(r.endDateTime) : null
                    const isCompleted = faCompletedTypes.includes(r.roundType)
                    const isLive = !isCompleted && s && e && now2 >= s && now2 <= e
                    const isScheduled = !isCompleted && !isLive && s && now2 < s
                    const roundResult = faResult?.roundResults?.find((rr: any) => rr.roundType === r.roundType)
                    const roundSt = isCompleted ? 'completed' : isLive ? 'live' : isScheduled ? 'scheduled' : 'ended'
                    const isEnded = !isCompleted && !isLive && !isScheduled
                    return (
                      <React.Fragment key={r.roundType}>
                        <div className={'fa-round-card ' + roundSt + (isCompleted && roundResult && !roundResult.passed ? ' fail' : '')}
                          style={faRounds.length === 1 ? { width: '360px', minWidth: '360px', maxWidth: '360px' } : { flex: 1, width: 'auto', minWidth: 0, maxWidth: 'none' }}>
                          {/* Floating circle badge — positioned above the card border */}
                          <div className={'fa-round-num ' + roundSt}>
                            {isCompleted ? <FaCheckCircle style={{ fontSize: 15 }} /> : idx + 1}
                          </div>

                          <div className="fa-round-name">{getRoundLabel(r.roundType)}</div>

                          {isCompleted && (
                            <>
                              <div className="fa-round-status-badge completed">
                                <FaCheckCircle style={{ marginRight: 4, fontSize: 10 }} /> Completed
                              </div>
                              {roundResult ? (
                                <>
                                  <div className={'fa-round-verdict ' + (roundResult.passed ? 'pass' : 'fail')}>
                                    {roundResult.passed ? 'PASS' : 'FAIL'}
                                  </div>
                                  <div className="fa-round-score">Score</div>
                                  <div className={'fa-round-score-val ' + (roundResult.passed ? 'pass' : 'fail')}>
                                    {Math.round(roundResult.percentage)}%
                                  </div>
                                  {roundResult.completedAt && (
                                    <div className="fa-round-date">
                                      Completed on<br />
                                      {new Date(roundResult.completedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="fa-round-review-badge">Under Review</div>
                              )}
                            </>
                          )}

                          {isLive && (() => {
                            const remaining = e ? Math.max(0, Math.floor((e.getTime() - now2.getTime()) / 1000)) : 0
                            const h = Math.floor(remaining / 3600), m = Math.floor((remaining % 3600) / 60), sec = remaining % 60
                            return (
                              <>
                                <div className="fa-round-status-badge live">
                                  <span className="fa-live-dot" />Live
                                </div>
                                <div className="fa-round-timer">
                                  <div className="fa-timer-unit">
                                    <span className="fa-timer-val">{String(h).padStart(2, '0')}</span>
                                    <span className="fa-timer-lbl">Hrs</span>
                                  </div>
                                  <span className="fa-round-timer-colon">:</span>
                                  <div className="fa-timer-unit">
                                    <span className="fa-timer-val">{String(m).padStart(2, '0')}</span>
                                    <span className="fa-timer-lbl">Mins</span>
                                  </div>
                                  <span className="fa-round-timer-colon">:</span>
                                  <div className="fa-timer-unit">
                                    <span className="fa-timer-val">{String(sec).padStart(2, '0')}</span>
                                    <span className="fa-timer-lbl">Secs</span>
                                  </div>
                                </div>
                                <button className="fa-round-start-btn" onClick={() => handleSelectAssessment(fa)}>Resume Now</button>
                              </>
                            )
                          })()}

                          {isScheduled && (
                            <>
                              <div className="fa-round-status-badge scheduled">Scheduled</div>
                              <div className="fa-round-date-label">Date &amp; Time</div>
                              <div className="fa-round-date-value">
                                {s!.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </div>
                              <div className="fa-round-time-value">
                                {s!.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                              </div>
                              <button className="fa-round-details-btn" onClick={() => handleSelectAssessment(fa)}>View Details</button>
                            </>
                          )}

                          {isEnded && (
                            <>
                              <div className="fa-round-status-badge ended">Not Attended</div>
                              <div className="fa-round-verdict fail">ABSENT</div>
                              <div className="fa-round-score">Score</div>
                              <div className="fa-round-score-val fail">0/{r.pickCount ?? 0}</div>
                              {e && (
                                <div className="fa-round-date">
                                  Completed on<br />
                                  {e.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                        {idx < faRounds.length - 1 && (
                          <div className="fa-round-arrow">
                            <svg width="56" height="16" viewBox="0 0 56 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <line x1="2" y1="8" x2="42" y2="8" stroke="#64748b" strokeWidth="5" strokeDasharray="6 3" strokeLinecap="round" />
                              <polyline points="38,2 52,8 38,14" stroke="#64748b" strokeWidth="5" fill="none" strokeLinejoin="round" strokeLinecap="round" />
                            </svg>
                          </div>
                        )}
                      </React.Fragment>
                    )
                  })}
                </div>
              </div>
            )
          })()}

          {/* ── All Assessments Table ── */}
          {(() => {
            const tblTotalPages = Math.ceil(filteredAssessments.length / PAGE_SIZE)
            const tblPaged = filteredAssessments.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
            return (
          <div className="fa-table-section">
            <div className="fa-table-header-row">
              <div className="fa-table-title">All Assessments by Company</div>
              <div className="fa-tbl-filters">
                {[
                  { key: 'all',       label: 'All' },
                  { key: 'live',      label: 'Live' },
                  { key: 'upcoming',  label: 'Upcoming' },
                  { key: 'completed', label: 'Completed' },
                  { key: 'today',     label: 'Today' },
                  { key: 'tomorrow',  label: 'Tomorrow' },
                  { key: 'thisweek',  label: 'This Week' },
                ].map(f => (
                  <button
                    key={f.key}
                    className={'fa-tbl-filter-btn' + (activeFilter === f.key ? ' active' : '')}
                    onClick={() => { setActiveFilter(f.key); setCurrentPage(1) }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <table className="fa-asm-table">
              <thead>
                <tr>
                  <th>Company / Assessment</th>
                  <th>Rounds</th>
                  <th>Progress</th>
                  <th>Your Score</th>
                  <th>Status</th>
                  <th>Next Round / Action</th>
                </tr>
              </thead>
              <tbody>
                {tblPaged.length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      <div className="fa-tbl-empty">
                        <div className="fa-tbl-empty-icon">📋</div>
                        <div className="fa-tbl-empty-title">No Assessments Scheduled</div>
                        <div className="fa-tbl-empty-sub">
                          {activeFilter === 'all'
                            ? 'You have no assessments at this time. Check back later.'
                            : `No assessments match the "${activeFilter}" filter.`}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                {tblPaged.map(assessment => {
                  const asmStatus = getAsmStatus(assessment)
                  const progress = studentProgressMap[assessment._id]
                  const result = resultsMap[assessment._id]
                  const aRounds: Round[] = assessment.rounds ?? []
                  const completedTypes = progress?.completedRounds ?? []
                  const approvedTypes = result?.roundResults?.map((r: any) => r.roundType) ?? []
                  const doneTypes = approvedTypes.length > 0 ? approvedTypes : completedTypes
                  const logoColor = getLogoColor(assessment.title)
                  const initials = getInitials(assessment.title)
                  const isFeatured = assessment._id === featuredAsmId
                  const now3 = new Date()
                  const liveRound3 = aRounds.find(r => { const s = r.startDateTime ? new Date(r.startDateTime) : null; const e = r.endDateTime ? new Date(r.endDateTime) : null; return s && e && now3 >= s && now3 <= e })
                  const nextRound = aRounds.find(r => !doneTypes.includes(r.roundType))
                  const score = result?.approved && result.percentage != null ? `${Math.round(result.percentage)}%` : '—'
                  const hasAnyCompleted = completedTypes.length > 0
                  return (
                    <tr
                      key={assessment._id}
                      className={'fa-asm-row' + (isFeatured ? ' selected' : '')}
                      onClick={() => setFeaturedAsmId(assessment._id)}
                    >
                      {/* Company / Assessment */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div className="fa-tbl-logo" style={{ background: logoColor }}>{initials}</div>
                          <div className="fa-tbl-name">{assessment.title}</div>
                        </div>
                      </td>

                      {/* Rounds */}
                      <td className="fa-tbl-rounds">{aRounds.length} Round{aRounds.length !== 1 ? 's' : ''}</td>

                      {/* Progress dots with connecting lines */}
                      <td>
                        <div className="fa-progress-dots">
                          {aRounds.map((r, i) => {
                            const done = doneTypes.includes(r.roundType)
                            const live = !done && liveRound3?.roundType === r.roundType
                            return (
                              <React.Fragment key={i}>
                                <div className={'fa-prog-dot' + (done ? ' done' : live ? ' live' : '')} title={getRoundLabel(r.roundType)}>
                                  {done ? <FaCheckCircle style={{ fontSize: 10 }} /> : i + 1}
                                </div>
                                {i < aRounds.length - 1 && (
                                  <div className={'fa-prog-line' + (done ? ' done' : '')} />
                                )}
                              </React.Fragment>
                            )
                          })}
                        </div>
                      </td>

                      {/* Your Score */}
                      <td className="fa-tbl-score">
                        {result?.approved && result.percentage != null
                          ? <span style={{ fontWeight: 700, color: result.status === 'passed' ? '#16a34a' : '#ef4444' }}>{Math.round(result.percentage)}%</span>
                          : <span style={{ color: '#94a3b8' }}>—</span>}
                      </td>

                      {/* Status chip */}
                      <td>
                        <span className={'fa-status-chip ' + asmStatus}>
                          {asmStatus === 'live' ? 'Live' : asmStatus === 'completed' ? 'Completed' : asmStatus === 'past' ? 'Ended' : 'Upcoming'}
                        </span>
                      </td>

                      {/* Next Round / Action */}
                      <td>
                        {liveRound3 && !doneTypes.includes(liveRound3.roundType) ? (
                          <span className="fa-tbl-action live" onClick={e => { e.stopPropagation(); handleSelectAssessment(assessment) }}>
                            Resume {getRoundLabel(liveRound3.roundType)} <FaChevronRight className="fa-tbl-chevron" />
                          </span>
                        ) : hasAnyCompleted && !nextRound ? (
                          <span className="fa-tbl-action report" onClick={e => { e.stopPropagation(); setReportAssessment(assessment); setReportTab('overview') }}>
                            View Report <FaChevronRight className="fa-tbl-chevron" />
                          </span>
                        ) : nextRound?.startDateTime ? (
                          <span className="fa-tbl-action date">
                            <FaCalendarAlt style={{ marginRight: 6, fontSize: 11, flexShrink: 0 }} />
                            Starts on {new Date(nextRound.startDateTime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            <FaChevronRight className="fa-tbl-chevron" />
                          </span>
                        ) : (
                          <span style={{ color: '#cbd5e1' }}>—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {tblTotalPages > 1 && (
              <div className="fa-tbl-pagination">
                <button className="fa-pg-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                  ‹ Prev
                </button>
                {Array.from({ length: tblTotalPages }).map((_, i) => (
                  <button key={i} className={'fa-pg-btn fa-pg-num' + (currentPage === i + 1 ? ' active' : '')} onClick={() => setCurrentPage(i + 1)}>
                    {i + 1}
                  </button>
                ))}
                <button className="fa-pg-btn" disabled={currentPage === tblTotalPages} onClick={() => setCurrentPage(p => p + 1)}>
                  Next ›
                </button>
              </div>
            )}
          </div>
          )
          })()}

          </div>{/* closes ap-main */}

          {/* hidden old content */}
          <div style={{ display: 'none' }}>
              {/* Stats row */}
              <div className="ap-stats-row">
                {[
                  { icon: <FaCalendarAlt />, bg: '#ede9fe', iconBg: '#7c3aed', label: 'Upcoming',  sub: 'Assessments', value: stats.upcoming },
                  { icon: <FaCheckCircle />, bg: '#dcfce7', iconBg: '#16a34a', label: 'Completed', sub: 'Assessments', value: stats.completed },
                  { icon: <FaTrophy />,      bg: '#fef9c3', iconBg: '#ca8a04', label: 'Passed',    sub: 'Assessments', value: stats.passed },
                ].map(s => (
                  <div key={s.label} className="ap-stat-card">
                    <div className="ap-stat-icon" style={{ background: s.bg, color: s.iconBg }}>{s.icon}</div>
                    <div>
                      <div className="ap-stat-num">{s.value}</div>
                      <div className="ap-stat-lbl">{s.label}</div>
                      <div className="ap-stat-sub">{s.sub}</div>
                    </div>
                  </div>
                ))}
                <div className="ap-stat-card">
                  <div className="ap-stat-icon" style={{ background: '#fff7ed', color: '#ea580c' }}><FaChartBar /></div>
                  <div>
                    <div className="ap-stat-num">{stats.avgScore}%</div>
                    <div className="ap-stat-lbl">Average Score</div>
                    <div className="ap-stat-sub">Overall</div>
                  </div>
                </div>
                <div className="ap-stat-card">
                  <div className="ap-stat-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}><FaBullseye /></div>
                  <div>
                    <div className="ap-stat-num">{stats.placementReady}%</div>
                    <div className="ap-stat-lbl">Placement Ready</div>
                    <div className="ap-stat-sub">Keep it up!</div>
                  </div>
                </div>
              </div>

              {/* Filter bar */}
              <div className="ap-filter-bar">
                <div className="ap-filter-tabs">
                  {[
                    { key: 'all', label: 'All' },
                    { key: 'upcoming', label: 'Upcoming' },
                    { key: 'live', label: 'Live Now' },
                    { key: 'today', label: 'Today' },
                    { key: 'tomorrow', label: 'Tomorrow' },
                    { key: 'thisweek', label: 'This Week' },
                    { key: 'completed', label: 'Completed' },
                  ].map(f => (
                    <button key={f.key} className={'ap-tab' + (activeFilter === f.key ? ' active' : '')} onClick={() => { setActiveFilter(f.key); setCurrentPage(1) }}>
                      {f.label}
                    </button>
                  ))}
                </div>
                <div className="ap-filter-right">
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="ap-sort-select">
                    <option value="nearest">Sort by: Date (Nearest)</option>
                    <option value="farthest">Sort by: Date (Farthest)</option>
                  </select>
                  <button className="ap-filter-icon-btn"><FaCog style={{ marginRight: 5 }} /> Filters</button>
                </div>
              </div>

              {/* Cards */}
              {assessments.length === 0 ? (
                <div className="ap-empty"><AssessmentIcon /><h3>No assessments available</h3><p>Check back later</p></div>
              ) : filteredAssessments.length === 0 ? (
                <div className="ap-empty"><AssessmentIcon /><h3>No assessments match this filter</h3></div>
              ) : (() => {
                const totalPages = Math.ceil(filteredAssessments.length / PAGE_SIZE)
                const pagedAssessments = filteredAssessments.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
                return (<>{pagedAssessments.map(assessment => {
                const asmStatus = getAsmStatus(assessment)
                const progress   = studentProgressMap[assessment._id]
                const rounds     = assessment.rounds ?? []
                const firstRound = rounds[0]
                const totalDuration = rounds.reduce((s, r) => s + (r.timeSeconds ?? 0), 0)
                const logoColor  = getLogoColor(assessment.title)
                const initials   = getInitials(assessment.title)
                const countdown  = asmStatus === 'upcoming' ? getCountdown(firstRound?.startDateTime) : null
                const now        = new Date()
                const liveRound  = rounds.find(r => { const s = r.startDateTime ? new Date(r.startDateTime) : null; const e = r.endDateTime ? new Date(r.endDateTime) : null; return s && e && now >= s && now <= e })
                const result     = resultsMap[assessment._id]

                // Derive the currently active / next pending round for the info bar
                const completedRoundKeys = progress?.completedRounds ?? []
                const activeRoundObj = liveRound
                const lastCompletedRound = completedRoundKeys.length > 0
                  ? rounds.find(r => r.roundType === completedRoundKeys[completedRoundKeys.length - 1])
                  : null

                return (
                  <div key={assessment._id} className={['ap-card', isPending ? 'ap-disabled' : '', asmStatus === 'live' ? 'ap-card-live' : ''].filter(Boolean).join(' ')}>
                    {/* Main row */}
                    <div style={{ display: 'flex', alignItems: 'center', padding: '18px 24px', gap: 18 }}>
                      {/* Logo */}
                      <div className="ap-card-logo" style={{ background: logoColor, flexShrink: 0 }}>{initials}</div>

                      {/* Info */}
                      <div className="ap-card-info">
                        <div className="ap-card-title-row">
                          <h3 className="ap-card-title">{assessment.title}</h3>
                          <span className={'ap-status-chip ap-status-' + asmStatus}>
                            {asmStatus === 'live' ? <>Live Now</> : asmStatus === 'completed' ? <><FaCheckCircle style={{ marginRight: 4 }} />Completed</> : asmStatus === 'past' ? <><FaTimesCircle style={{ marginRight: 4 }} />Ended</> : <><FaCalendarAlt style={{ marginRight: 4 }} />Scheduled</>}
                          </span>
                        </div>
                        <div className="ap-card-meta-row">
                          {firstRound?.startDateTime && <span><FaCalendarAlt /> {new Date(firstRound.startDateTime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>}
                          {firstRound?.startDateTime && <span><FaClock /> {new Date(firstRound.startDateTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>}
                          {totalDuration > 0 && <span><FaStopwatch /> {Math.round(totalDuration / 60)} Mins</span>}
                        </div>
                        {rounds.length > 0 && (
                          <div className="ap-card-rounds">
                            <div className="ap-rounds-label">Rounds :</div>
                            <div className="ap-rounds-chips">
                              {rounds.map(r => {
                                const isDone = completedRoundKeys.includes(r.roundType)
                                const isLiveRound = asmStatus === 'live' && liveRound?.roundType === r.roundType
                                const iconColor = isDone || isLiveRound ? '#16a34a' : '#3b82f6'
                                const chipIcons: Record<string, React.ReactNode> = {
                                  aptitude: <FaChartBar style={{ fontSize: 9, color: iconColor }} />,
                                  mcq:      <FaChartBar style={{ fontSize: 9, color: iconColor }} />,
                                  coding:   <FaClipboardList style={{ fontSize: 9, color: iconColor }} />,
                                  tr:       <FaGraduationCap style={{ fontSize: 9, color: iconColor }} />,
                                  hr:       <FaUser style={{ fontSize: 9, color: iconColor }} />,
                                  english:  <FaClipboardList style={{ fontSize: 9, color: iconColor }} />,
                                }
                                const chipDate = !isDone && !isLiveRound && r.startDateTime
                                  ? new Date(r.startDateTime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                  : null
                                return (
                                  <span key={r.roundType} className={'ap-round-chip' + (isDone ? ' done' : '') + (isLiveRound ? ' live-round' : '')}>
                                    <span className="ap-chip-name">
                                      {chipIcons[r.roundType] ?? <FaCircle style={{ fontSize: 7 }} />}
                                      {getRoundLabel(r.roundType)}
                                    </span>
                                    {isDone && <span className="ap-chip-sub done">Completed</span>}
                                    {isLiveRound && <span className="ap-chip-sub live">Live Now</span>}
                                    {!isDone && !isLiveRound && chipDate && <span className="ap-chip-sub upcoming">{chipDate}</span>}
                                    {!isDone && !isLiveRound && !chipDate && <span className="ap-chip-sub upcoming">Upcoming</span>}
                                  </span>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>{/* end ap-card-info */}

                      {/* Timer / Score */}
                      <div className="ap-card-timer">
                        {asmStatus === 'upcoming' && countdown && (
                          <div className="ap-starts-timer-box">
                            <div className="ap-starts-timer-label">Starts In</div>
                            <div className="ap-countdown">
                              <div className="ap-live-unit">
                                <span>{String(countdown.days).padStart(2,'0')}</span>
                                <span className="ap-cd-unit-lbl">Days</span>
                              </div>
                              <span className="ap-cd-sep">:</span>
                              <div className="ap-live-unit">
                                <span>{String(countdown.hrs).padStart(2,'0')}</span>
                                <span className="ap-cd-unit-lbl">Hrs</span>
                              </div>
                              <span className="ap-cd-sep">:</span>
                              <div className="ap-live-unit">
                                <span>{String(countdown.mins).padStart(2,'0')}</span>
                                <span className="ap-cd-unit-lbl">Mins</span>
                              </div>
                            </div>
                          </div>
                        )}
                        {asmStatus === 'live' && (
                          <div className="ap-live-timer-box">
                            <div className="ap-live-timer-label">Live</div>
                            {(() => {
                              const el = liveRound?.startDateTime ? Math.max(0, Math.floor((Date.now() - new Date(liveRound.startDateTime!).getTime()) / 1000)) : 0
                              const h = Math.floor(el/3600), m = Math.floor((el%3600)/60), s = el%60
                              return (
                                <div className="ap-live-countdown">
                                  <div className="ap-live-unit">
                                    <span className="ap-live-num">{String(h).padStart(2,'0')}</span>
                                    <span className="ap-live-lbl">Hrs</span>
                                  </div>
                                  <span className="ap-live-sep">:</span>
                                  <div className="ap-live-unit">
                                    <span className="ap-live-num">{String(m).padStart(2,'0')}</span>
                                    <span className="ap-live-lbl">Mins</span>
                                  </div>
                                  <span className="ap-live-sep">:</span>
                                  <div className="ap-live-unit">
                                    <span className="ap-live-num">{String(s).padStart(2,'0')}</span>
                                    <span className="ap-live-lbl">Secs</span>
                                  </div>
                                </div>
                              )
                            })()}
                          </div>
                        )}
                        {asmStatus === 'completed' && (
                          (result?.approved || (result && !result.approved)) ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                <div className="ap-timer-label">Score</div>
                                <div style={{ position: 'relative', width: 62, height: 62, flexShrink: 0 }}>
                                  <svg width="62" height="62" viewBox="0 0 62 62">
                                    <circle cx="31" cy="31" r="26" fill="none" stroke="#e2e8f0" strokeWidth="5"/>
                                    {result?.approved && (
                                      <circle cx="31" cy="31" r="26" fill="none"
                                        stroke={result.status === 'passed' ? '#22c55e' : '#ef4444'}
                                        strokeWidth="5" strokeLinecap="round"
                                        strokeDasharray={String(2 * Math.PI * 26)}
                                        strokeDashoffset={String(2 * Math.PI * 26 * (1 - Math.round(result.percentage) / 100))}
                                        transform="rotate(-90 31 31)"
                                      />
                                    )}
                                  </svg>
                                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#0f172a' }}>
                                    {result?.approved ? `${Math.round(result.percentage)}%` : '0%'}
                                  </div>
                                </div>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                <div className="ap-timer-label">Result</div>
                                {result?.approved ? (
                                  <span className={'ap-result-badge ' + (result.status === 'passed' ? 'pass' : 'fail')}>
                                    {result.status === 'passed' ? 'PASS' : 'FAIL'}
                                  </span>
                                ) : (
                                  <span className="ap-result-badge" style={{ background: '#fef3c7', color: '#d97706', border: '1px solid #fcd34d', fontSize: 10, padding: '3px 8px', whiteSpace: 'nowrap' }}>
                                    Under Review
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : <div className="ap-timer-label" style={{ color: '#22c55e', display: 'flex', alignItems: 'center', gap: 4 }}><FaCheckCircle /> Completed</div>
                        )}
                        {asmStatus === 'upcoming' && !countdown && (
                          <div className="ap-timer-label" style={{ color: '#94a3b8' }}>Upcoming</div>
                        )}
                        {asmStatus === 'past' && (
                          <div className="ap-timer-label" style={{ color: '#ef4444' }}>Ended</div>
                        )}
                      </div>

                      {/* Action */}
                      <div className="ap-card-action">
                        {(() => {
                          const approvedRoundTypes = result?.roundResults?.map((r: any) => r.roundType) ?? []
                          const doneTypes = approvedRoundTypes.length > 0 ? approvedRoundTypes : completedRoundKeys
                          const pendingRounds = rounds.filter(r => !doneTypes.includes(r.roundType))
                          const allRoundsDone = rounds.length > 0 && pendingRounds.length === 0
                          const hasLiveIncomplete = pendingRounds.some(r => {
                            const s = r.startDateTime ? new Date(r.startDateTime) : null
                            const e = r.endDateTime ? new Date(r.endDateTime) : null
                            return s && e && now >= s && now <= e
                          })
                          if (isPending) return <button className="ap-btn ap-btn-disabled" disabled><LockIcon /> Enroll</button>
                          if (hasLiveIncomplete) return <button className="ap-btn ap-btn-start" onClick={() => handleSelectAssessment(assessment)}><FaPlay style={{ marginRight: 5 }} />Start Assessment</button>
                          if (allRoundsDone && result?.approved) return <button className="ap-btn ap-btn-report" onClick={() => { setReportAssessment(assessment); setReportTab('overview') }}>View Report</button>
                          if (asmStatus === 'live') return <button className="ap-btn ap-btn-start" onClick={() => handleSelectAssessment(assessment)}><FaPlay style={{ marginRight: 5 }} />Start Assessment</button>
                          return <button className="ap-btn ap-btn-details" onClick={() => handleSelectAssessment(assessment)}>View Details</button>
                        })()}
                      </div>
                    </div>

                    {/* Info bar */}
                    {asmStatus === 'live' && lastCompletedRound && activeRoundObj && (
                      <div className="ap-info-bar">
                        <FaCheckCircle style={{ color: '#16a34a', fontSize: 13, flexShrink: 0 }} />
                        <span>{getRoundLabel(lastCompletedRound.roundType)} completed. You are now in <strong>{getRoundLabel(activeRoundObj.roundType)}</strong>.</span>
                      </div>
                    )}
                    {asmStatus === 'upcoming' && lastCompletedRound && (() => {
                      const nextRound = rounds.find(r => !completedRoundKeys.includes(r.roundType))
                      const nextDate = nextRound?.startDateTime ? new Date(nextRound.startDateTime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : null
                      return nextRound ? (
                        <div className="ap-info-bar">
                          <FaCheckCircle style={{ color: '#16a34a', fontSize: 13, flexShrink: 0 }} />
                          <span>{getRoundLabel(lastCompletedRound.roundType)} round completed. Next round (<strong>{getRoundLabel(nextRound.roundType)}</strong>) {nextDate ? ('is scheduled on ' + nextDate + '.') : 'will be scheduled soon.'}</span>
                        </div>
                      ) : null
                    })()}
                    {completedRoundKeys.length > 0 && (
                      <div className="ap-info-bar">
                        {(() => {
                          // Use approved roundResults length vs total exam rounds for accuracy
                          const approvedTypes = result?.roundResults?.map((r: any) => r.roundType) ?? []
                          const doneTypes = approvedTypes.length > 0 ? approvedTypes : completedRoundKeys
                          const pendingRounds = rounds.filter(r => !doneTypes.includes(r.roundType))
                          const allRoundsDone = rounds.length > 0 && pendingRounds.length === 0
                          if (!allRoundsDone && pendingRounds.length > 0) {
                            const nextPending = pendingRounds[0]
                            return <><FaCheckCircle style={{ color: '#16a34a', fontSize: 13, flexShrink: 0 }} /><span>{doneTypes.map(getRoundLabel).join(', ')} completed. <strong>{getRoundLabel(nextPending.roundType)}</strong> is pending — start it when it's live.</span></>
                          }
                          if (result?.approved && result.status === 'passed') return <><FaCheckCircle style={{ color: '#16a34a', fontSize: 13, flexShrink: 0 }} /><span>All rounds completed. Congratulations! You passed this assessment.</span></>
                          if (result && !result.approved) return <><FaSync style={{ color: '#f59e0b', fontSize: 13, flexShrink: 0 }} /><span>Your submission is <strong>under review</strong>. Results will be declared after admin approval.</span></>
                          return <><FaCheckCircle style={{ color: '#16a34a', fontSize: 13, flexShrink: 0 }} /><span>All rounds completed. Results will be declared after admin review.</span></>
                        })()}
                      </div>
                    )}
                  </div>
                )
              })}
                {totalPages > 1 && (
                  <div className="ap-pagination">
                    <button className="ap-page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>‹ Prev</button>
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button key={i} className={'ap-page-btn ap-page-num' + (currentPage === i + 1 ? ' active' : '')} onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
                    ))}
                    <button className="ap-page-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next ›</button>
                  </div>
                )}
              </>)
              })()}
          </div>{/* closes hidden old content */}

            {/* Right sidebar */}
            <div className="ap-sidebar">

              {/* Calendar */}
              <div className="ap-cal-card">
                <div className="ap-cal-header">
                  <button className="ap-cal-nav" onClick={() => setCalendarMonth(m => new Date(m.getFullYear(), m.getMonth()-1,1))}>‹</button>
                  <span className="ap-cal-month">{calendarMonth.toLocaleDateString('en-US',{month:'long',year:'numeric'})}</span>
                  <button className="ap-cal-nav" onClick={() => setCalendarMonth(m => new Date(m.getFullYear(), m.getMonth()+1,1))}>›</button>
                </div>
                <div className="ap-cal-grid">
                  {['MON','TUE','WED','THU','FRI','SAT','SUN'].map(d => <div key={d} className="ap-cal-dow">{d}</div>)}
                  {calDays.map((cell, i) => (
                    <div key={i} className={['ap-cal-day', !cell.day ? 'empty' : '', cell.isToday ? 'today' : '', cell.hasAssessment ? 'has-asm' : ''].filter(Boolean).join(' ')}>
                      {cell.day}
                    </div>
                  ))}
                </div>
                {calEvents.length > 0 && (
                  <div className="ap-cal-events">
                    {calEvents.map((e, i) => (
                      <div key={i} className="ap-cal-event">
                        <span className="ap-cal-dot" style={{ background: e.color }} />
                        <span className="ap-cal-event-date">{e.date}</span>
                        <span className="ap-cal-event-time">{e.time}</span>
                        <span className="ap-cal-event-title">{e.title}</span>
                      </div>
                    ))}
                  </div>
                )}
                <button className="ap-cal-view-all" onClick={() => { setShowFullCalendar(true); setFullCalMonth(new Date(calendarMonth)) }}>View Full Calendar <span style={{ fontSize: 15 }}>→</span></button>
              </div>

              {/* Journey */}
              {journeySteps.length > 0 && (
                <div className="ap-journey-card">
                  <h3 className="ap-journey-title">Assessment Journey</h3>
                  <div className="ap-journey-steps">
                    {journeySteps.map((step, i) => (
                      <div key={i} className={'ap-journey-step ap-jstep-' + step.status}>
                        <div className="ap-journey-icon-col">
                          <div className="ap-journey-icon">
                            {step.status === 'done'
                              ? <FaCheckCircle style={{ fontSize: 12 }} />
                              : step.status === 'live'
                              ? <FaBroadcastTower style={{ fontSize: 11 }} />
                              : <FaCircle style={{ fontSize: 9, opacity: 0.35 }} />}
                          </div>
                          {i < journeySteps.length - 1 && <div className="ap-journey-line" />}
                        </div>
                        <div className="ap-journey-content">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div className="ap-journey-name">{step.label}</div>
                            {step.status === 'live' && <span className="ap-jstep-badge">In Progress</span>}
                          </div>
                          <div className="ap-journey-sub">{step.sub}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Live CTA */}
                  {assessments.some(a => getAsmStatus(a) === 'live') && (
                    <>
                      <div className="ap-journey-illustration">
                        <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" style={{ maxHeight: 80 }}>
                          <rect x="10" y="10" width="80" height="55" rx="6" fill="#e8f0fe" stroke="#6366f1" strokeWidth="1.5"/>
                          <rect x="18" y="20" width="50" height="6" rx="3" fill="#6366f1" opacity="0.4"/>
                          <rect x="18" y="30" width="36" height="4" rx="2" fill="#94a3b8" opacity="0.5"/>
                          <rect x="18" y="38" width="44" height="4" rx="2" fill="#94a3b8" opacity="0.5"/>
                          <circle cx="95" cy="52" r="18" fill="#ff6b35"/>
                          <polygon points="90,44 90,60 106,52" fill="#fff"/>
                        </svg>
                      </div>
                      <div className="ap-journey-cta">
                        <div className="ap-journey-cta-title">Assessment Live</div>
                        <p className="ap-journey-cta-text">Your assessment is live. Click "Start Assessment" to begin your test.</p>
                        <button className="ap-journey-cta-btn" onClick={() => { const la = assessments.find(a => getAsmStatus(a) === 'live'); if (la) handleSelectAssessment(la) }}>
                          <FaPlay style={{ marginRight: 7, fontSize: 11 }} /> Start Assessment
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Assessment Detail Modal */}
      <Modal
        show={showAssessmentModal && !showStartScreen}
        onHide={handleCloseModal}
        fullscreen={true}
        backdrop="static"
        className="assessment-modal"
      >
        {/* ── Compact Header ── */}
        <Modal.Header style={{
          background: "#0d0d0d",
          borderBottom: "1px solid #1f1f1f",
          padding: "0.85rem 1.5rem",
          alignItems: "center"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 }}>
            <div style={{
              width: "36px", height: "36px", flexShrink: 0,
              background: "rgba(255,107,53,0.15)", borderRadius: "10px",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <AssessmentIcon />
            </div>
            <div style={{ minWidth: 0 }}>
              <Modal.Title style={{ color: "#fff", fontSize: "1.15rem", fontWeight: 700, margin: 0, lineHeight: 1.3 }}>
                {selectedAssessment?.title}
              </Modal.Title>
              {selectedAssessment?.description && (
                <p style={{ color: "#888", margin: 0, fontSize: "0.78rem", lineHeight: 1.4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {selectedAssessment.description}
                </p>
              )}
            </div>
            {/* Status pill inline */}
            {examStatus && (
              <span style={{
                marginLeft: "0.75rem", flexShrink: 0,
                background: examStatus === "active" ? "rgba(40,167,69,0.15)" : examStatus === "completed" ? "rgba(108,117,125,0.2)" : "rgba(255,193,7,0.15)",
                color: examStatus === "active" ? "#28a745" : examStatus === "completed" ? "#aaa" : "#ffc107",
                border: `1px solid ${examStatus === "active" ? "rgba(40,167,69,0.4)" : examStatus === "completed" ? "#444" : "rgba(255,193,7,0.4)"}`,
                borderRadius: "20px", padding: "0.2rem 0.75rem", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.04em"
              }}>
                {examStatus === "active" ? <><FaCircle style={{ fontSize: 8, color: '#22c55e', marginRight: 5 }} /> In Progress</> : examStatus === "completed" ? <><FaCheckCircle style={{ fontSize: 10, marginRight: 5 }} /> Completed</> : <><FaClock style={{ fontSize: 10, marginRight: 5 }} /> Upcoming</>}
              </span>
            )}
          </div>
          <button
            onClick={handleCloseModal}
            style={{
              background: "rgba(255,255,255,0.07)", border: "1px solid #2a2a2a",
              borderRadius: "8px", width: "34px", height: "34px", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", transition: "all 0.2s", color: "#aaa", marginLeft: "1rem"
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,107,53,0.15)"; e.currentTarget.style.color = "#ff6b35" }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "#aaa" }}
          >
            <CloseIcon />
          </button>
        </Modal.Header>

        <Modal.Body style={{ background: "#000", color: "#fff", padding: "1.5rem" }}>
          {modalLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" style={{ color: "#ff6b35" }} />
              <p className="mt-3" style={{ color: "#666", fontSize: "0.9rem" }}>Loading details…</p>
            </div>
          ) : (
            <div style={{ maxWidth: "860px", margin: "0 auto" }}>

              {/* Progress tracker */}
              {rounds.length > 0 && (
                <div className="am-progress-bar">
                  {rounds.map((round, idx) => {
                    const isCompleted = isRoundCompleted(round.roundType)
                    const isActive = isRoundActive(round)
                    return (
                      <React.Fragment key={idx}>
                        <div className={['am-step', isCompleted ? 'done' : isActive ? 'live' : ''].filter(Boolean).join(' ')}>
                          <div className="am-step-icon">{getRoundIcon(round.roundType)}</div>
                          <span className="am-step-label">{round.roundType.toUpperCase()}</span>
                          {isCompleted && <span className="am-step-tag done"><FaCheckCircle style={{ fontSize: 9, marginRight: 3 }} /> Done</span>}
                          {isActive && !isCompleted && <span className="am-step-tag live"><FaCircle style={{ fontSize: 7, marginRight: 3 }} /> Live</span>}
                          {!isActive && !isCompleted && <span className="am-step-tag">Upcoming</span>}
                        </div>
                        {idx < rounds.length - 1 && <div className={'am-connector' + (isCompleted ? ' done' : '')} />}
                      </React.Fragment>
                    )
                  })}
                </div>
              )}

              {/* Section heading */}
              <p className="am-section-label">Rounds</p>

              {/* Round cards */}
              {rounds.length === 0 ? (
                <p style={{ color: "#666", textAlign: "center", padding: "3rem 0" }}>No rounds available.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {rounds.map((round, index) => {
                    const status = getRoundStatus(round)
                    const isActive = isRoundActive(round)
                    const isCompleted = isRoundCompleted(round.roundType)

                    return (
                      <div key={index} className={['am-round-card', isActive ? 'active' : '', isCompleted ? 'completed' : ''].filter(Boolean).join(' ')}>
                        {/* Left: icon + title */}
                        <div className="am-round-left">
                          <div className="am-round-icon-wrap" style={{ background: isActive ? "rgba(255,107,53,0.18)" : "rgba(255,255,255,0.05)" }}>
                            {getRoundIcon(round.roundType)}
                          </div>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                              <span className="am-round-title">{getRoundLabel(round.roundType)}</span>
                              <span className="am-status-pill" style={{ color: status.color, background: status.color + "1a", border: `1px solid ${status.color}44` }}>
                                {status.text}
                              </span>
                            </div>
                            {/* Dates */}
                            {round.startDateTime && (
                              <div className="am-dates">
                                <CalendarIcon />
                                <span>{formatCardDate(round.startDateTime)}</span>
                                <span className="am-arrow">→</span>
                                <span>{formatCardDate(round.endDateTime)}</span>
                              </div>
                            )}
                            {/* Meta chips */}
                            <div className="am-meta-row">
                              <span className="am-chip"><ClockIcon /> {formatDuration(round.timeSeconds)}</span>
                              <span className="am-chip"><QuestionIcon /> {round.pickCount} Questions</span>
                              {round.passPercentage && <span className="am-chip"><TargetIcon /> {round.passPercentage}% to Pass</span>}
                              {round.pointsPerQuestion && <span className="am-chip">⭐ {round.pointsPerQuestion} pt/Q</span>}
                            </div>
                          </div>
                        </div>

                        {/* Right: CTA button */}
                        <button
                          className={'am-cta' + (isActive && !isCompleted ? ' enabled' : '')}
                          disabled={!isActive || isCompleted}
                          onClick={() => handleStartRound(round)}
                        >
                          {startingRound === round.roundType ? (
                            <Spinner animation="border" size="sm" />
                          ) : isCompleted ? (
                            <><CheckIcon /> Completed</>
                          ) : isActive ? (
                            <><UnlockIcon /> Start Round</>
                          ) : (
                            <><LockIcon /> Locked</>
                          )}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* ── Results Section ── */}
              {studentResult && (
                <>
                  <p className="am-section-label" style={{ marginTop: "2rem" }}>My Results</p>

                  {/* Pending state */}
                  {!studentResult.approved && (
                    <div style={{
                      background: "#0d0d0d", border: "1px solid #2a2a2a",
                      borderLeft: "3px solid #ffc107", borderRadius: "10px",
                      padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "0.75rem"
                    }}>
                      <span style={{ fontSize: "1.2rem" }}>⏳</span>
                      <div>
                        <p style={{ color: "#ffc107", fontWeight: 700, margin: "0 0 0.2rem", fontSize: "0.88rem" }}>Result Under Review</p>
                        <p style={{ color: "#666", margin: 0, fontSize: "0.8rem" }}>Your result has been submitted and is awaiting admin approval.</p>
                      </div>
                    </div>
                  )}

                  {/* Approved: show full result */}
                  {studentResult.approved && (<>

                  {/* Overall score bar */}
                  <div className="am-result-summary">
                    <div className="am-result-stat">
                      <span className="am-result-stat-label">Total Score</span>
                      <strong className="am-result-stat-value">{studentResult.totalScore}</strong>
                    </div>
                    <div className="am-result-stat">
                      <span className="am-result-stat-label">Percentage</span>
                      <strong className="am-result-stat-value">{Number(studentResult.percentage).toFixed(1)}%</strong>
                    </div>
                    <div className="am-result-stat">
                      <span className="am-result-stat-label">Result</span>
                      <strong className={'am-result-stat-value ' + (studentResult.status === 'passed' ? 'pass' : 'fail')}>
                        {studentResult.status === "passed" ? <><FaCheckCircle style={{ marginRight: 4 }} /> Passed</> : <><FaTimesCircle style={{ marginRight: 4 }} /> Failed</>}
                      </strong>
                    </div>
                    <div className="am-result-stat">
                      <span className="am-result-stat-label">Approval</span>
                      <strong className={'am-result-stat-value approval-' + studentResult.approvalStatus}>
                        {studentResult.approvalStatus === "approved" ? <><FaCheckCircle style={{ marginRight: 4 }} /> Approved</> :
                          studentResult.approvalStatus === "rejected" ? <><FaTimesCircle style={{ marginRight: 4 }} /> Rejected</> : <><FaClock style={{ marginRight: 4 }} /> Pending</>}
                      </strong>
                    </div>
                  </div>

                  {/* Per-round results */}
                  {studentResult.roundResults.length > 0 && (
                    <div className="am-round-results">
                      {studentResult.roundResults.map((rr, i) => (
                        <div key={i} className={'am-rr-row ' + (rr.passed ? 'passed' : 'failed')}>
                          <div className="am-rr-left">
                            <span className="am-rr-type-icon">{getRoundIcon(rr.roundType as RoundKey)}</span>
                            <span className="am-rr-label">{getRoundLabel(rr.roundType as RoundKey)}</span>
                          </div>
                          <div className="am-rr-scores">
                            <span className="am-rr-score">{rr.score} / {rr.total}</span>
                            <span className="am-rr-pct">{rr.percentage}%</span>
                          </div>
                          <div className="am-rr-bar-wrap">
                            <div className="am-rr-bar">
                              <div className="am-rr-fill" style={{ width: `${rr.percentage}%`, background: rr.passed ? "#28a745" : "#dc3545" }} />
                            </div>
                          </div>
                          <span className={'am-rr-badge ' + (rr.passed ? 'pass' : 'fail')}>
                            {rr.passed ? <><FaCheckCircle style={{ marginRight: 3, fontSize: 10 }} /> Pass</> : <><FaTimesCircle style={{ marginRight: 3, fontSize: 10 }} /> Fail</>}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Admin comments */}
                  {studentResult.comments && (
                    <div className="am-comments-box">
                      <p className="am-comments-label">💬 Feedback from Admin</p>
                      <p className="am-comments-text">"{studentResult.comments}"</p>
                    </div>
                  )}
                  </>
                )}
                </>
              )}
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Quiz Round */}
      {isRunning && roundConfig?.type === "mcq" && selectedAssessment && (
        <div style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", background: "#000", zIndex: 999999 }}>
          <StudentQuiz
            examId={selectedAssessment._id}
            duration={roundConfig.duration}
            onSubmit={handleRoundSubmit}
            forceSubmitRef={mcqForceSubmitRef}
          />
        </div>
      )}

      {/* Coding Round */}
      {isRunning && roundConfig?.type === "coding" && selectedAssessment && (
        <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 999999 }}>
          <StudentCodeChallengeComponent
            eventId={selectedAssessment._id}
            onSubmitted={handleRoundSubmit}
          />
        </div>
      )}

      {isRunning && roundConfig?.type === "tr" && selectedAssessment && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "#000",
          zIndex: 9999999   // 🔥 increase this
        }}>
          <TechnicalRound
            examId={selectedAssessment._id}
            duration={roundConfig.duration}
            onSubmitted={handleRoundSubmit}
          />
        </div>
      )}

      {isRunning && roundConfig?.type === "hr" && selectedAssessment && (
        <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 9999999 }}>
          <HRRound
            examId={selectedAssessment._id}
            duration={roundConfig.duration}
            onSubmitted={handleRoundSubmit}
          />
        </div>
      )}

      {isRunning && roundConfig?.type === "english" && selectedAssessment && (
        <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 9999999 }}>
          <StudentEnglishRound
            examId={selectedAssessment._id}
            duration={roundConfig.duration}
            onSubmit={handleRoundSubmit}
            forceSubmitRef={submitRef}
            disarmProctor={proctor.disarm}
            armProctor={proctor.arm}
          />
        </div>
      )}

      {isRunning && (
        <ViolationAlert
          show={showViolationAlert}
          count={proctor.violationCount}
          maxViolations={proctor.maxViolations}
          onClose={() => {
            setShowViolationAlert(false)
            proctor.acknowledge()
            proctor.enterFullscreen()
          }}
        />
      )}

      <style>{`
        /* ── Featured Assessment Card ──────────────────────────────────── */
        .fa-featured-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px 28px; margin-bottom: 16px; }
        .fa-feat-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; gap: 16px; }
        .fa-feat-logo { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 800; color: #fff; flex-shrink: 0; }
        .fa-feat-title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0; }
        .fa-feat-badge { border-radius: 20px; padding: 3px 12px; font-size: 12px; font-weight: 700; }
        .fa-feat-badge.live { background: #dcfce7; color: #16a34a; border: 1px solid #86efac; }
        .fa-feat-badge.completed { background: #f0fdf4; color: #16a34a; border: 1px solid #86efac; }
        .fa-feat-badge.upcoming { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
        .fa-feat-badge.past { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
        .fa-feat-meta { display: flex; gap: 18px; margin-top: 6px; font-size: 13px; color: #64748b; }
        .fa-feat-details-btn { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 8px 18px; font-size: 13px; font-weight: 700; color: #2563eb; cursor: pointer; white-space: nowrap; flex-shrink: 0; }
        .fa-feat-details-btn:hover { background: #eff6ff; }
        .fa-feat-report-btn { background: #fff7ed; border: 1.5px solid #fed7aa; border-radius: 10px; padding: 5px 14px; font-size: 12px; font-weight: 700; color: #ea580c; cursor: pointer; display: inline-flex; align-items: center; }
        .fa-feat-report-btn:hover { background: #ffedd5; }
        .fa-feat-rounds-label { font-size: 14px; font-weight: 800; color: #0f172a; letter-spacing: 0.01em; margin-bottom: 14px; padding-top: 18px; border-top: 1.5px solid #e2e8f0; }
        .fa-feat-rounds { display: flex; align-items: stretch; gap: 0; overflow-x: auto; padding: 22px 64px 4px; width: 100%; box-sizing: border-box; }
        .fa-round-arrow { flex: 0 0 64px; width: 64px; display: flex; align-items: center; justify-content: center; align-self: center; padding: 0 4px; }

        /* Card: fixed size, position:relative so the circle can float above */
        .fa-round-card { position: relative; background: #fff; border: 1.5px solid #e2e8f0; border-radius: 16px; padding: 28px 20px 14px; width: 220px; min-width: 180px; display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center; flex-shrink: 0; }
        .fa-round-card.completed { background: #f0fdf4; border-color: #86efac; border-width: 1.5px; }
        .fa-round-card.completed.fail { background: #fff1f2; border-color: #fca5a5; }
        .fa-round-card.live { background: #fff; border-color: #93c5fd; border-width: 2px; }
        .fa-round-card.scheduled { background: #fff7ed; border-color: #fcd34d; }
        .fa-round-card.ended { background: #fafafa; border-color: #e2e8f0; }

        /* Floating circle — sits on top of the card border */
        .fa-round-num { position: absolute; top: -18px; left: 50%; transform: translateX(-50%); width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 800; flex-shrink: 0; border: 3px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.12); }
        .fa-round-num.completed { background: #16a34a; color: #fff; }
        .fa-round-num.live { background: #2563eb; color: #fff; }
        .fa-round-num.scheduled { background: #f59e0b; color: #fff; }
        .fa-round-num.ended { background: #94a3b8; color: #fff; }

        .fa-round-name { font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 2px; }

        /* Status chips */
        .fa-round-status-badge { font-size: 11px; font-weight: 700; border-radius: 20px; padding: 4px 12px; display: inline-flex; align-items: center; gap: 5px; }
        .fa-round-status-badge.completed { background: #dcfce7; color: #16a34a; }
        .fa-round-status-badge.live { background: transparent; color: #374151; border: none; padding: 4px 0; }
        .fa-round-status-badge.scheduled { background: #fff7ed; color: #f59e0b; border: 1px solid #fcd34d; }
        .fa-round-status-badge.ended { background: #fee2e2; color: #dc2626; }
        .fa-live-dot { width: 9px; height: 9px; background: #22c55e; border-radius: 50%; animation: pulse 1.2s ease-in-out infinite; display: inline-block; flex-shrink: 0; }

        /* Verdict PASS / FAIL / ABSENT */
        .fa-round-verdict { font-size: 20px; font-weight: 900; letter-spacing: 0.02em; margin: 2px 0; line-height: 1; }
        .fa-round-verdict.pass { color: #16a34a; }
        .fa-round-verdict.fail { color: #ef4444; }

        /* "Score" label */
        .fa-round-score { font-size: 12px; color: #64748b; margin: 0; line-height: 1.4; }

        /* Score value e.g. 78/100 */
        .fa-round-score-val { font-size: 22px; font-weight: 800; line-height: 1.2; }
        .fa-round-score-val.pass { color: #16a34a; }
        .fa-round-score-val.fail { color: #ef4444; }

        /* Completed date below round name */
        .fa-round-completed-date { font-size: 11px; color: #64748b; font-weight: 500; text-align: center; line-height: 1.4; }

        /* PASS / FAIL badge chip */
        .fa-round-verdict-badge { font-size: 13px; font-weight: 800; border-radius: 20px; padding: 5px 20px; display: inline-block; letter-spacing: 0.04em; }
        .fa-round-verdict-badge.pass { background: #dcfce7; color: #16a34a; border: 1px solid #86efac; }
        .fa-round-verdict-badge.fail { background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; }

        /* Score: X/Y */
        .fa-round-score-ratio { font-size: 14px; font-weight: 700; color: #2563eb; text-align: center; }

        /* Under Review chip */
        .fa-round-review-badge { font-size: 11px; font-weight: 700; border-radius: 20px; padding: 4px 12px; background: #fef3c7; color: #d97706; border: 1px solid #fcd34d; margin-top: auto; }

        /* Completed-on date (small text under score) */
        .fa-round-date { font-size: 12px; color: #64748b; line-height: 1.8; text-align: center; }

        /* Scheduled card date/time breakdown */
        .fa-round-date-label { font-size: 11px; color: #94a3b8; font-weight: 500; text-align: center; margin-bottom: -2px; }
        .fa-round-date-value { font-size: 18px; font-weight: 800; color: #0f172a; text-align: center; line-height: 1.3; }
        .fa-round-time-value { font-size: 16px; font-weight: 600; color: #475569; text-align: center; line-height: 1.4; }

        /* Live timer */
        .fa-round-timer { display: flex; align-items: flex-start; justify-content: center; gap: 2px; }
        .fa-timer-unit { display: flex; flex-direction: column; align-items: center; gap: 2px; }
        .fa-timer-val { font-size: 26px; font-weight: 800; color: #1e3a8a; line-height: 1; letter-spacing: 0.01em; }
        .fa-timer-lbl { font-size: 10px; font-weight: 800; color: #64748b; }
        .fa-round-timer-colon { font-size: 24px; font-weight: 800; color: #1e3a8a; line-height: 1; margin-top: 1px; }

        /* Buttons */
        .fa-round-start-btn { background: #2563eb; color: #fff; border: none; border-radius: 10px; padding: 10px 16px; font-size: 12px; font-weight: 700; cursor: pointer; margin-top: auto; width: 100%; }
        .fa-round-start-btn:hover { background: #1d4ed8; }
        .fa-round-details-btn { background: #fff; border: 1.5px solid #f59e0b; color: #f59e0b; border-radius: 10px; padding: 9px 16px; font-size: 12px; font-weight: 700; cursor: pointer; width: 100%; margin-top: auto; }
        .fa-round-details-btn:hover { background: #fff7ed; }

        /* ── All Assessments Table ─────────────────────────────────────── */
        .fa-table-section { margin-bottom: 16px; background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; }
        .fa-table-header-row { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px 12px; border-bottom: 1px solid #f1f5f9; gap: 12px; flex-wrap: wrap; }
        .fa-table-title { font-size: 15px; font-weight: 800; color: #0f172a; }
        .fa-tbl-filters { display: flex; gap: 6px; flex-wrap: wrap; }
        .fa-tbl-filter-btn { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 20px; padding: 5px 16px; font-size: 12px; font-weight: 600; color: #64748b; cursor: pointer; transition: all 0.15s; }
        .fa-tbl-filter-btn:hover { background: #f1f5f9; color: #0f172a; border-color: #cbd5e1; }
        .fa-tbl-filter-btn.active { background: #ff6b35; border-color: #ff6b35; color: #fff; }
        .fa-asm-table { width: 100%; border-collapse: collapse; }
        .fa-asm-table thead tr { background: #f8fafc; }
        .fa-asm-table th { text-align: left; padding: 10px 20px; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; border-bottom: 1px solid #e2e8f0; white-space: nowrap; }
        .fa-tbl-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; text-align: center; }
        .fa-tbl-empty-icon { font-size: 40px; margin-bottom: 12px; opacity: 0.5; }
        .fa-tbl-empty-title { font-size: 15px; font-weight: 800; color: #64748b; margin-bottom: 6px; }
        .fa-tbl-empty-sub { font-size: 13px; color: #94a3b8; max-width: 320px; line-height: 1.5; }
        .fa-asm-row { cursor: pointer; transition: background 0.12s; border-bottom: 1px solid #f1f5f9; }
        .fa-asm-row:last-child { border-bottom: none; }
        .fa-asm-row:hover { background: #f8fafc; }
        .fa-asm-row.selected { background: #fff7ed; }
        .fa-asm-row td { padding: 14px 20px; vertical-align: middle; }

        /* Company cell */
        .fa-tbl-logo { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; color: #fff; flex-shrink: 0; }
        .fa-tbl-name { font-size: 13px; font-weight: 700; color: #0f172a; line-height: 1.3; }
        .fa-tbl-rounds { font-size: 13px; font-weight: 500; color: #475569; white-space: nowrap; }
        .fa-tbl-score { font-size: 13px; text-align: center; }

        /* Progress dots + connecting line */
        .fa-progress-dots { display: flex; align-items: center; gap: 0; }
        .fa-prog-dot { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; background: #f1f5f9; color: #94a3b8; border: 2px solid #e2e8f0; flex-shrink: 0; }
        .fa-prog-dot.done { background: #16a34a; color: #fff; border-color: #16a34a; }
        .fa-prog-dot.live { background: #2563eb; color: #fff; border-color: #2563eb; }
        .fa-prog-line { width: 14px; height: 2px; background: #e2e8f0; flex-shrink: 0; }
        .fa-prog-line.done { background: #16a34a; }

        /* Status chips */
        .fa-status-chip { border-radius: 20px; padding: 4px 14px; font-size: 11px; font-weight: 700; white-space: nowrap; display: inline-block; }
        .fa-status-chip.live { background: #dcfce7; color: #16a34a; border: 1px solid #86efac; }
        .fa-status-chip.completed { background: #f0fdf4; color: #16a34a; border: 1px solid #86efac; }
        .fa-status-chip.upcoming { background: #ede9fe; color: #7c3aed; border: 1px solid #c4b5fd; }
        .fa-status-chip.past { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }

        /* Action column */
        .fa-tbl-action { font-size: 13px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; white-space: nowrap; }
        .fa-tbl-action.live { color: #2563eb; }
        .fa-tbl-action.live:hover { text-decoration: underline; }
        .fa-tbl-action.report { color: #ea580c; }
        .fa-tbl-action.report:hover { text-decoration: underline; }
        .fa-tbl-action.date { color: #475569; font-weight: 500; cursor: default; }
        .fa-tbl-chevron { font-size: 12px; flex-shrink: 0; margin-left: 2px; }

        /* Table pagination */
        .fa-tbl-pagination { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 14px 20px; border-top: 1px solid #f1f5f9; }
        .fa-pg-btn { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 14px; font-size: 13px; font-weight: 600; color: #475569; cursor: pointer; transition: all 0.15s; }
        .fa-pg-btn:hover:not(:disabled) { background: #f8fafc; border-color: #cbd5e1; color: #0f172a; }
        .fa-pg-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .fa-pg-num { min-width: 36px; text-align: center; padding: 6px 10px; }
        .fa-pg-num.active { background: #ff6b35; border-color: #ff6b35; color: #fff; }

        /* ── Assessment Portal ─────────────────────────────────────────── */
        .ap-wrapper { background: #f8fafc; min-height: 100vh; padding: 0; }

        .ap-header {
          background: #fff; border-bottom: 1px solid #e2e8f0;
          padding: 16px 28px; display: flex; align-items: center; justify-content: space-between;
        }
        .ap-header-icon {
          width: 42px; height: 42px; background: #fff7ed; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
        }
        .ap-title { font-size: 1.3rem; font-weight: 800; color: #0f172a; margin: 0; }
        .ap-subtitle { font-size: 12px; color: #64748b; margin: 0; }

        .ap-pending-banner {
          margin: 12px 28px; background: #fff7ed; border: 1px solid #fed7aa;
          border-radius: 10px; padding: 10px 16px; display: flex; align-items: center;
          gap: 10px; font-size: 13px; color: #92400e;
        }

        /* Stats */
        .ap-stats-row {
          display: flex; gap: 12px; flex-wrap: wrap; padding: 0;
        }
        .ap-stat-card {
          background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;
          padding: 14px 16px; display: flex; align-items: center; gap: 12px;
          flex: 1; min-width: 140px;
        }
        .ap-stat-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
        .ap-stat-num { font-size: 1.5rem; font-weight: 800; color: #0f172a; line-height: 1; }
        .ap-stat-lbl { font-size: 11px; font-weight: 700; color: #374151; margin-top: 2px; }
        .ap-stat-sub { font-size: 10px; color: #94a3b8; }

        .ap-stat-large {
          background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;
          padding: 14px 20px; display: flex; align-items: center; gap: 12px;
          flex: 1.4; min-width: 160px;
        }
        .ap-stat-large.green .ap-stat-num-lg { color: #16a34a; }
        .ap-stat-icon-lg { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
        .ap-stat-num-lg { font-size: 1.8rem; font-weight: 900; color: #ff6b35; line-height: 1; }

        /* Layout */
        .ap-layout { display: grid; grid-template-columns: 1fr 280px; gap: 16px; padding: 16px 28px 32px; align-items: start; }
        .ap-main { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
        .ap-sidebar { display: flex; flex-direction: column; gap: 12px; }

        /* Filter bar */
        .ap-filter-bar {
          background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;
          padding: 10px 14px; display: flex; align-items: center; justify-content: space-between;
          gap: 10px; flex-wrap: wrap;
        }
        .ap-filter-tabs { display: flex; gap: 4px; flex-wrap: wrap; }
        .ap-tab {
          background: transparent; border: none; padding: 6px 12px; border-radius: 20px;
          font-size: 12px; font-weight: 600; color: #64748b; cursor: pointer; transition: all 0.15s;
        }
        .ap-tab:hover { background: #f1f5f9; color: #374151; }
        .ap-tab.active { background: #ff6b35; color: #fff; }
        .ap-filter-right { display: flex; align-items: center; gap: 8px; }
        .ap-sort-select {
          padding: 6px 10px; border: 1px solid #e2e8f0; border-radius: 8px;
          font-size: 12px; color: #374151; background: #fff; outline: none; cursor: pointer;
        }
        .ap-filter-icon-btn {
          display: flex; align-items: center; gap: 5px; padding: 6px 12px;
          border: 1px solid #e2e8f0; border-radius: 8px; background: #fff;
          font-size: 12px; font-weight: 700; color: #374151; cursor: pointer;
        }

        /* Assessment card */
        .ap-card {
          background: #fff; border: 1px solid #e2e8f0; border-radius: 14px;
          padding: 0; display: flex; flex-direction: column; align-items: stretch; gap: 0;
          overflow: hidden;
          transition: box-shadow 0.2s, border-color 0.2s;
        }
        .ap-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.07); border-color: #cbd5e1; }
        .ap-card.ap-card-live { border-left: 3px solid #22c55e; }
        .ap-card.ap-disabled { opacity: 0.6; pointer-events: none; }

        .ap-card-logo {
          width: 68px; height: 68px; border-radius: 14px; display: flex; align-items: center;
          justify-content: center; font-size: 22px; font-weight: 900; color: #fff; flex-shrink: 0;
          letter-spacing: -1px;
        }

        .ap-card-info { flex: 1; min-width: 0; }
        .ap-card-title-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 8px; }
        .ap-card-title { font-size: 16px; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.2px; }

        .ap-status-chip {
          font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 20px;
          white-space: nowrap; flex-shrink: 0;
        }
        .ap-status-upcoming  { background: #eff6ff; color: #2563eb; }
        .ap-status-live      { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
        .ap-status-completed { background: #f0fdf4; color: #16a34a; }
        .ap-status-past      { background: #f1f5f9; color: #64748b; }

        .ap-card-meta-row {
          display: flex; align-items: center; gap: 0; font-size: 13px; color: #64748b;
          font-weight: 500; margin-bottom: 10px; white-space: nowrap;
        }
        .ap-card-meta-row span {
          display: flex; align-items: center; gap: 6px;
          padding-right: 16px; margin-right: 16px;
          border-right: 1px solid #e2e8f0;
        }
        .ap-card-meta-row span:last-child { border-right: none; padding-right: 0; margin-right: 0; }
        .ap-card-meta-row svg { width: 12px; height: 12px; flex-shrink: 0; color: #94a3b8; vertical-align: middle; position: relative; top: -1px; }

        .ap-card-rounds { display: flex; flex-direction: column; gap: 6px; }
        .ap-rounds-label { font-size: 13px; font-weight: 800; color: #0f172a; }
        .ap-rounds-chips { display: flex; align-items: flex-start; gap: 8px; flex-wrap: wrap; }
        .ap-round-chip {
          display: inline-flex; flex-direction: column; align-items: flex-start; gap: 3px;
          padding: 7px 12px; border-radius: 8px; background: #eff6ff; white-space: nowrap;
        }
        .ap-round-chip.done { background: #f0fdf4; }
        .ap-round-chip.live-round { background: #f0fdf4; }
        .ap-chip-name { display: flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 700; color: #3b82f6; }
        .ap-round-chip.done .ap-chip-name { color: #16a34a; }
        .ap-round-chip.live-round .ap-chip-name { color: #16a34a; }
        .ap-chip-sub { font-size: 10px; font-weight: 700; }
        .ap-chip-sub.done { color: #16a34a; }
        .ap-chip-sub.live { color: #16a34a; }
        .ap-chip-sub.upcoming { color: #94a3b8; }

        /* Info bar */
        .ap-info-bar { display: flex; align-items: center; gap: 10px; padding: 11px 24px; background: #f0fdf4; border-top: 1px solid #d1fae5; font-size: 13px; color: #15803d; font-weight: 500; width: 100%; box-sizing: border-box; }

        /* Timer / Score section */
        .ap-card-timer { flex: 0 0 190px; width: 190px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; border-left: 1px solid #f1f5f9; border-right: 1px solid #f1f5f9; padding: 0 18px; min-height: 90px; }

        /* Starts In timer box */
        .ap-starts-timer-box { background: #fff7ed; border: none; border-radius: 12px; padding: 12px 16px; text-align: center; min-width: 140px; }
        .ap-starts-timer-label { font-size: 11px; font-weight: 800; color: #c2410c; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 5px; }
        .ap-cd-unit-lbl { font-size: 10px; font-weight: 700; color: #0f172a; }

        /* Live timer box */
        .ap-live-timer-box { background: #f0fdf4; border: none; border-radius: 12px; padding: 12px 16px; text-align: center; min-width: 140px; }
        .ap-live-timer-label { font-size: 11px; font-weight: 800; color: #15803d; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 5px; }
        .ap-live-countdown { display: flex; align-items: center; justify-content: center; gap: 2px; }
        .ap-live-unit { display: flex; flex-direction: column; align-items: center; gap: 3px; }
        .ap-live-num { font-size: 1.35rem; font-weight: 900; color: #22c55e; font-variant-numeric: tabular-nums; line-height: 1; }
        .ap-live-lbl { font-size: 10px; font-weight: 700; color: #0f172a; }
        .ap-live-sep { font-size: 1.1rem; font-weight: 700; color: #22c55e; opacity: 0.5; margin: 0 1px; padding-bottom: 14px; }
        .ap-timer-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 5px; }
        .ap-countdown { display: flex; align-items: center; justify-content: center; gap: 3px; font-variant-numeric: tabular-nums; }
        .ap-countdown span:not(.ap-cd-sep):not(.ap-cd-unit-lbl) { font-size: 1.6rem; font-weight: 900; color: #ff6b35; line-height: 1; }
        .ap-cd-sep { color: #ff6b35; font-size: 1.4rem; font-weight: 900; opacity: 0.6; padding-bottom: 14px; }
        .ap-score-num { font-size: 1.6rem; font-weight: 900; color: #0f172a; line-height: 1; }
        .ap-result-badge {
          display: inline-block; font-size: 18px; font-weight: 900; letter-spacing: 0.5px;
          margin-top: 2px; background: none; border: none; padding: 0;
        }
        .ap-result-badge.pass { color: #16a34a; }
        .ap-result-badge.fail { color: #ef4444; }

        /* Card action buttons */
        .ap-card-action { flex-shrink: 0; padding-left: 16px; display: flex; align-items: center; }
        .ap-btn {
          width: 160px; padding: 11px 16px; border-radius: 10px; font-size: 13px; font-weight: 700;
          cursor: pointer; transition: all 0.15s; white-space: nowrap; border: none;
          display: flex; align-items: center; justify-content: center; gap: 6px;
        }
        .ap-btn-details { background: #ff6b35; border: none; color: #fff; }
        .ap-btn-details:hover { background: #e55a25; }
        .ap-btn-start { background: #ff6b35; color: #fff; border: none; }
        .ap-btn-start:hover { background: #f05a22; }
        .ap-btn-report { background: #fff; border: 2px solid #ff6b35; color: #ff6b35; }
        .ap-btn-report:hover { background: #fff3ee; }
        .ap-btn-disabled { background: #f1f5f9; color: #94a3b8; cursor: not-allowed; border: none; }

        /* ── Start Screen ── */
        .ss-wrapper { padding: 24px 24px 48px; }
        .ss-breadcrumb { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; font-size: 13px; }
        .ss-bc-btn { background: none; border: none; color: #ff6b35; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 5px; padding: 0; font-size: 13px; }
        .ss-bc-sep { color: #94a3b8; }
        .ss-bc-item { color: #64748b; font-weight: 500; }
        .ss-bc-item.active { color: #0f172a; font-weight: 700; }

        .ss-header-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; gap: 20px; }
        .ss-header-left { display: flex; align-items: flex-start; gap: 16px; flex: 1; min-width: 0; }
        .ss-title { font-size: 18px; font-weight: 800; color: #0f172a; margin: 0; }
        .ss-header-timer { flex-shrink: 0; }
        .ss-starts-label { font-size: 12px; font-weight: 700; color: #64748b; text-align: center; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; }

        .ss-body { display: grid; grid-template-columns: 1fr 300px; gap: 20px; align-items: flex-start; }

        .ss-left { display: flex; flex-direction: column; gap: 16px; }

        .ss-content-row { display: grid; grid-template-columns: 3fr 2fr; gap: 16px; align-items: stretch; }
        .ss-content-left { display: flex; flex-direction: column; }
        .ss-content-right { display: flex; flex-direction: column; }
        .ss-before-box { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; box-sizing: border-box; }
        .ss-details-box { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; box-sizing: border-box; display: flex; flex-direction: column; height: 100%; }
        .ss-info-bar { display: flex; align-items: flex-start; gap: 12px; padding: 14px 18px; background: #eff6ff; border-radius: 12px; font-size: 13px; color: #1e40af; line-height: 1.5; }

        .ss-section-title { font-size: 15px; font-weight: 800; color: #0f172a; }
        .ss-section-sub { font-size: 12px; color: #64748b; margin-top: 2px; margin-bottom: 12px; }
        .ss-instructions-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .ss-instr-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; display: flex; align-items: center; gap: 10px; }
        .ss-instr-icon { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0; }
        .ss-instr-title { font-size: 12px; font-weight: 700; color: #0f172a; margin-bottom: 2px; }
        .ss-instr-desc { font-size: 11px; color: #64748b; line-height: 1.3; }

        .ss-note { display: flex; align-items: flex-start; gap: 10px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 12px 16px; font-size: 12px; color: #92400e; }

        .ss-detail-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
        .ss-detail-row:last-child { border-bottom: none; }
        .ss-tip-box { display: flex; align-items: flex-start; gap: 10px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 12px 14px; font-size: 12px; color: #374151; margin-top: 14px; line-height: 1.5; }
        .ss-tip-box strong { color: #16a34a; font-weight: 700; }
        .ss-tip-icon { width: 28px; height: 28px; background: #dcfce7; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #16a34a; font-size: 13px; flex-shrink: 0; margin-top: 1px; }
        .ss-detail-icon { color: #94a3b8; font-size: 13px; flex-shrink: 0; width: 16px; }
        .ss-detail-label { color: #64748b; font-weight: 500; flex: 1; }
        .ss-detail-value { color: #0f172a; font-weight: 700; }

        .ss-round-table-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px 24px; }
        .ss-round-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .ss-round-table thead tr { border-bottom: 1.5px solid #f1f5f9; }
        .ss-round-table th { text-align: left; padding: 10px 12px; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
        .ss-rt-row { border-bottom: 1px solid #f8fafc; transition: background 0.1s; }
        .ss-rt-row:last-child { border-bottom: none; }
        .ss-rt-row.live { background: #f0fdf4; }
        .ss-rt-row.done { background: #fafafa; }
        .ss-rt-row td { padding: 14px 12px; vertical-align: middle; }
        .ss-rt-name { display: flex; align-items: center; gap: 10px; font-weight: 700; color: #0f172a; white-space: nowrap; }
        .ss-rt-icon { display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
        .ss-rt-icon.done { color: #22c55e; }
        .ss-rt-icon.live { color: #3b82f6; }
        .ss-rt-icon.upcoming { color: #f59e0b; }
        .ss-rt-score { font-weight: 700; color: #0f172a; font-size: 13px; }
        .ss-rt-date { color: #64748b; font-size: 12px; white-space: nowrap; }
        .ss-rt-live-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #22c55e; margin-right: 6px; animation: pulse 1.4s infinite; }
        .ss-rt-live-label { font-size: 12px; font-weight: 700; color: #16a34a; }
        .ss-rt-ends-in { font-size: 11px; color: #64748b; margin-top: 2px; }
        .ss-rt-badge { display: inline-block; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 20px; white-space: nowrap; }
        .ss-rt-badge.done { background: #dcfce7; color: #16a34a; }
        .ss-rt-badge.live { background: #dcfce7; color: #16a34a; }
        .ss-rt-badge.upcoming { background: #fff7ed; color: #f59e0b; border: 1px solid #fed7aa; }
        .ss-rt-badge.ended { background: #f1f5f9; color: #94a3b8; }
        .ss-rt-btn { border-radius: 8px; padding: 8px 16px; font-size: 12px; font-weight: 700; cursor: not-allowed; white-space: nowrap; border: 1.5px solid #e2e8f0; background: #f8fafc; color: #94a3b8; }
        .ss-rt-btn.view-report { background: #fff; color: #2563eb; border-color: #bfdbfe; cursor: pointer; }
        .ss-rt-btn.view-report:hover { background: #eff6ff; }
        .ss-rt-btn.continue { background: #1e3a5f; color: #fff; border-color: #1e3a5f; cursor: pointer; display: inline-flex; align-items: center; }
        .ss-rt-btn.continue:hover { background: #162d4a; }
        .ss-rt-btn.continue.disabled { background: #94a3b8; border-color: #94a3b8; cursor: not-allowed; }
        .ss-rt-btn.view-details.scheduled { background: #fff; color: #ea580c; border-color: #fed7aa; cursor: not-allowed; }

        .ss-table-checkbox-row { border-top: 1px solid #f1f5f9; padding: 14px 20px; background: #fafafa; }
        .ss-checkbox-row { display: flex; align-items: center; gap: 10px; font-size: 13px; color: #374151; cursor: pointer; font-weight: 500; user-select: none; }
        .ss-custom-check { width: 18px; height: 18px; border: 2px solid #cbd5e1; border-radius: 4px; background: #fff; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: border-color 0.15s; }
        .ss-custom-check.checked { border-color: #ff6b35; background: #fff; }
        .ss-start-btn { background: #ff6b35; color: #fff; border: none; border-radius: 12px; padding: 14px; font-size: 15px; font-weight: 800; cursor: pointer; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; transition: background 0.15s; }
        .ss-start-btn:hover:not(:disabled) { background: #e55a25; }
        .ss-start-btn:disabled { background: #f1f5f9; color: #94a3b8; cursor: not-allowed; }

        .ss-right { display: flex; flex-direction: column; gap: 14px; position: sticky; top: 24px; }
        .ss-side-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; }
        .ss-side-title { font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 14px; }

        .ss-round-row { display: flex; align-items: flex-start; gap: 10px; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
        .ss-round-row:last-child { border-bottom: none; }
        .ss-round-icon { width: 28px; height: 28px; border-radius: 50%; background: #f1f5f9; color: #94a3b8; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 2px solid #e2e8f0; }
        .ss-round-icon.done { background: #22c55e; color: #fff; border-color: #22c55e; }
        .ss-round-icon.live { background: #eff6ff; color: #3b82f6; border-color: #3b82f6; }
        .ss-round-name { font-size: 13px; font-weight: 700; color: #0f172a; }
        .ss-round-sub { font-size: 11px; color: #64748b; margin-top: 2px; }
        .ss-round-score { font-size: 13px; font-weight: 800; color: #16a34a; flex-shrink: 0; }

        .ss-flow { display: flex; align-items: flex-start; justify-content: space-between; }
        .ss-flow-step { display: flex; flex-direction: column; align-items: center; gap: 4px; }
        .ss-flow-icon { width: 32px; height: 32px; border-radius: 50%; background: #f1f5f9; color: #94a3b8; display: flex; align-items: center; justify-content: center; border: 2px solid #e2e8f0; }
        .ss-flow-icon.done { background: #22c55e; color: #fff; border-color: #22c55e; }
        .ss-flow-icon.live { background: #eff6ff; color: #3b82f6; border-color: #3b82f6; }
        .ss-flow-label { font-size: 11px; font-weight: 700; color: #0f172a; text-align: center; }
        .ss-flow-sub { font-size: 10px; color: #94a3b8; text-align: center; }
        .ss-flow-line { flex: 1; height: 2px; background: #e2e8f0; margin-top: 15px; }
        .ss-flow-line.done { background: #22c55e; }

        .ss-support-btn { width: 100%; border: 1.5px solid #ff6b35; background: #fff; color: #ff6b35; border-radius: 10px; padding: 10px; font-size: 13px; font-weight: 700; cursor: pointer; }
        .ss-support-btn:hover { background: #fff3ee; }

        .ap-pagination { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 16px 0 4px; }
        .ap-page-btn { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 6px 14px; font-size: 13px; font-weight: 600; color: #374151; cursor: pointer; transition: all 0.15s; }
        .ap-page-btn:hover:not(:disabled) { border-color: #ff6b35; color: #ff6b35; }
        .ap-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .ap-page-num { min-width: 36px; text-align: center; padding: 6px 8px; }
        .ap-page-num.active { background: #ff6b35; border-color: #ff6b35; color: #fff; }

        .ap-empty {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 5rem 1rem; color: #94a3b8; text-align: center; gap: 0.75rem;
          background: #fff; border-radius: 14px; border: 1px solid #e2e8f0;
        }
        .ap-empty h3 { color: #374151; margin: 0; font-size: 1rem; }
        .ap-empty p  { color: #94a3b8; margin: 0; font-size: 0.85rem; }

        /* ── Full Calendar ── */
        .fc-wrapper { max-width: 1400px; margin: 0 auto; padding: 20px 24px 48px; display: flex; flex-direction: column; gap: 16px; }
        .fc-topbar { display: flex; align-items: center; justify-content: space-between; }
        .fc-today-btn { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 6px 14px; font-size: 13px; font-weight: 600; cursor: pointer; color: #374151; }
        .fc-today-btn:hover { border-color: #ff6b35; color: #ff6b35; }
        .fc-nav-btn { background: none; border: 1.5px solid #e2e8f0; border-radius: 8px; width: 32px; height: 32px; cursor: pointer; font-size: 16px; color: #374151; display: flex; align-items: center; justify-content: center; }
        .fc-nav-btn:hover { border-color: #ff6b35; color: #ff6b35; }
        .fc-month-title { font-size: 18px; font-weight: 800; color: #0f172a; margin-left: 6px; }
        .fc-view-tabs { display: flex; background: #f1f5f9; border-radius: 8px; padding: 3px; gap: 2px; }
        .fc-view-tab { background: none; border: none; border-radius: 6px; padding: 5px 14px; font-size: 12px; font-weight: 600; cursor: pointer; color: #64748b; }
        .fc-view-tab.active { background: #ff6b35; color: #fff; }
        .fc-back-btn { background: none; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 6px 14px; font-size: 13px; font-weight: 600; cursor: pointer; color: #64748b; }
        .fc-back-btn:hover { border-color: #ff6b35; color: #ff6b35; }

        .fc-body { display: grid; grid-template-columns: 1fr 280px; gap: 16px; align-items: flex-start; }
        .fc-main { display: flex; flex-direction: column; gap: 0; background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; }

        .fc-grid { display: grid; grid-template-columns: repeat(7, 1fr); }
        .fc-day-header { background: #f8fafc; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #f1f5f9; padding: 10px 8px; font-size: 11px; font-weight: 700; color: #64748b; text-align: center; letter-spacing: 0.04em; }
        .fc-day-header:last-child { border-right: none; }
        .fc-cell { border-right: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; padding: 8px 6px; min-height: 110px; display: flex; flex-direction: column; gap: 4px; }
        .fc-cell:nth-child(7n) { border-right: none; }
        .fc-cell-other { background: #fafafa; }
        .fc-cell-today { background: #fff8f5; }
        .fc-cell-num { font-size: 13px; font-weight: 600; color: #374151; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; border-radius: 50%; }
        .fc-cell-num.today { background: #ff6b35; color: #fff; font-weight: 800; }
        .fc-event { border-radius: 6px; padding: 5px 7px; display: flex; flex-direction: column; gap: 2px; cursor: pointer; }
        .fc-event:hover { filter: brightness(0.97); }
        .fc-event-time { font-size: 10px; font-weight: 600; opacity: 0.75; }
        .fc-event-title { font-size: 11px; font-weight: 700; line-height: 1.3; }
        .fc-event-chip { display: inline-block; font-size: 9px; font-weight: 700; padding: 1px 6px; border-radius: 20px; margin-top: 2px; align-self: flex-start; }
        .fc-more { font-size: 10px; color: #64748b; font-weight: 600; padding-left: 2px; }

        .fc-list { display: flex; flex-direction: column; }
        .fc-list-group { border-bottom: 1px solid #f1f5f9; }
        .fc-list-date { padding: 10px 16px; font-size: 12px; font-weight: 700; color: #64748b; background: #f8fafc; border-bottom: 1px solid #f1f5f9; }
        .fc-list-event { display: flex; align-items: center; gap: 12px; padding: 10px 16px; border-bottom: 1px solid #f8fafc; }
        .fc-list-time { font-size: 12px; font-weight: 600; color: #374151; white-space: nowrap; min-width: 80px; }
        .fc-list-title { font-size: 13px; font-weight: 700; color: #0f172a; }

        .fc-legend { display: flex; align-items: center; gap: 16px; padding: 12px 16px; border-top: 1px solid #f1f5f9; flex-wrap: wrap; }
        .fc-legend-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: #64748b; font-weight: 500; }
        .fc-legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

        .fc-sidebar { display: flex; flex-direction: column; gap: 12px; }
        .fc-side-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px; }
        .fc-side-title { font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 12px; }

        .fc-mini-cal { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 14px; }
        .fc-mini-nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .fc-mini-nav span { font-size: 12px; font-weight: 700; color: #0f172a; }
        .fc-mini-nav button { background: none; border: none; cursor: pointer; color: #64748b; font-size: 15px; padding: 2px 6px; }
        .fc-mini-nav button:hover { color: #ff6b35; }
        .fc-mini-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
        .fc-mini-header { font-size: 9px; font-weight: 700; color: #94a3b8; text-align: center; padding: 3px 0; }
        .fc-mini-day { font-size: 11px; color: #374151; text-align: center; padding: 4px 2px; border-radius: 50%; cursor: pointer; }
        .fc-mini-day.other { color: #cbd5e1; }
        .fc-mini-day.today { background: #ff6b35; color: #fff; font-weight: 800; border-radius: 50%; }
        .fc-mini-day.has-ev { background: #eff6ff; color: #2563eb; font-weight: 700; border-radius: 50%; }
        .fc-mini-day.today.has-ev { background: #ff6b35; color: #fff; }

        .fc-select { width: 100%; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 8px 10px; font-size: 12px; color: #374151; background: #fff; margin-bottom: 8px; cursor: pointer; }
        .fc-apply-btn { width: 100%; background: #ff6b35; color: #fff; border: none; border-radius: 8px; padding: 9px; font-size: 13px; font-weight: 700; cursor: pointer; margin-top: 4px; }
        .fc-apply-btn:hover { background: #e55a25; }
        .fc-clear-btn { background: none; border: none; color: #ff6b35; font-size: 12px; font-weight: 700; cursor: pointer; padding: 0; }

        .fc-upcoming-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
        .fc-upcoming-row:last-child { border-bottom: none; }
        .fc-upcoming-title { font-size: 12px; font-weight: 700; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .fc-upcoming-date { font-size: 10px; color: #94a3b8; margin-top: 1px; }

        .fc-quick-btn { display: flex; align-items: center; justify-content: center; gap: 6px; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 9px 8px; font-size: 11px; font-weight: 700; color: #374151; cursor: pointer; }
        .fc-quick-btn:hover { border-color: #ff6b35; color: #ff6b35; background: #fff8f5; }

        /* Calendar */
        .ap-cal-card {
          background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px 16px;
        }
        .ap-cal-header {
          display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;
        }
        .ap-cal-month { font-size: 13px; font-weight: 700; color: #0f172a; }
        .ap-cal-nav {
          background: transparent; border: none; cursor: pointer; font-size: 16px;
          color: #64748b; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;
          border-radius: 6px; transition: background 0.15s;
        }
        .ap-cal-nav:hover { background: #f1f5f9; }
        .ap-cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
        .ap-cal-dow { font-size: 9px; font-weight: 700; color: #94a3b8; text-align: center; padding: 4px 0; }
        .ap-cal-day {
          font-size: 11px; font-weight: 500; color: #374151; text-align: center;
          padding: 5px 2px; border-radius: 6px; cursor: default;
        }
        .ap-cal-day.empty { }
        .ap-cal-day.today { background: #ff6b35; color: #fff; font-weight: 700; }
        .ap-cal-day.has-asm { background: #eff6ff; color: #2563eb; font-weight: 700; border-radius: 50%; }
        .ap-cal-day.today.has-asm { background: #ff6b35; color: #fff; }
        .ap-cal-events { margin-top: 10px; display: flex; flex-direction: column; gap: 0; }
        .ap-cal-event { display: flex; align-items: center; gap: 8px; padding: 7px 2px; border-bottom: 1px solid #f1f5f9; }
        .ap-cal-event:last-child { border-bottom: none; }
        .ap-cal-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .ap-cal-event-date { font-size: 11px; color: #374151; font-weight: 500; white-space: nowrap; }
        .ap-cal-event-time { font-size: 11px; color: #374151; font-weight: 500; white-space: nowrap; }
        .ap-cal-event-title { font-size: 11px; color: #0f172a; font-weight: 700; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ap-cal-view-all {
          display: inline-flex; align-items: center; gap: 4px;
          background: transparent; border: none; color: #ff6b35;
          font-size: 13px; font-weight: 700; cursor: pointer;
          padding: 10px 0 2px; text-decoration: none;
          border-top: 1px solid #f1f5f9; margin-top: 10px; width: 100%; justify-content: center;
        }
        .ap-cal-view-all:hover { color: #e55a25; }

        /* Sidebar: Journey */
        .ap-journey-card {
          background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px;
        }
        .ap-journey-title { font-size: 14px; font-weight: 800; color: #0f172a; margin: 0 0 14px; }
        .ap-journey-steps { display: flex; flex-direction: column; }
        .ap-journey-step { display: flex; gap: 12px; align-items: flex-start; }
        .ap-journey-icon-col { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; width: 28px; }
        .ap-journey-icon {
          width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center;
          justify-content: center; flex-shrink: 0;
          background: #f1f5f9; color: #cbd5e1; border: 2px solid #e2e8f0;
        }
        .ap-jstep-done .ap-journey-icon { background: #22c55e; color: #fff; border-color: #22c55e; }
        .ap-jstep-live .ap-journey-icon { background: #ff6b35; color: #fff; border-color: #ff6b35; }
        .ap-journey-line { width: 2px; flex: 1; background: #e2e8f0; margin: 3px 0; min-height: 18px; }
        .ap-jstep-done .ap-journey-line { background: #22c55e; }
        .ap-journey-content { padding-top: 4px; padding-bottom: 14px; }
        .ap-journey-name { font-size: 12px; font-weight: 700; color: #0f172a; }
        .ap-jstep-live .ap-journey-name { color: #ff6b35; }
        .ap-journey-sub { font-size: 10px; color: #94a3b8; margin-top: 2px; }
        .ap-jstep-done .ap-journey-sub { color: #64748b; }
        .ap-jstep-live .ap-journey-sub { color: #64748b; }
        .ap-jstep-badge {
          font-size: 9px; font-weight: 700; color: #ff6b35;
          background: #fff3ee; border: 1px solid #ffcfb8;
          border-radius: 20px; padding: 1px 7px; white-space: nowrap;
        }
        .ap-journey-illustration {
          margin: 4px 0 8px; padding: 8px; background: #f8fafc;
          border-radius: 10px; display: flex; align-items: center; justify-content: center;
        }
        .ap-journey-cta { padding-top: 4px; }
        .ap-journey-cta-title { font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
        .ap-journey-cta-text { font-size: 11px; color: #64748b; margin: 0 0 10px; line-height: 1.5; }
        .ap-journey-cta-btn {
          width: 100%; background: #ff6b35; border: none; color: #fff; border-radius: 10px;
          padding: 10px; font-size: 13px; font-weight: 700; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s;
        }
        .ap-journey-cta-btn:hover { background: #e55a25; }

        /* ── Modal styles ──────────────────────────────────────────────── */
        .am-section-label {
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #555;
          margin: 1.5rem 0 0.75rem;
        }

        /* Progress tracker */
        .am-progress-bar {
          display: flex;
          align-items: center;
          gap: 0;
          background: #0d0d0d;
          border: 1px solid #1f1f1f;
          border-radius: 12px;
          padding: 1rem 1.25rem;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .am-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          min-width: 72px;
        }

        .am-step-icon {
          width: 38px; height: 38px;
          border-radius: 10px;
          background: #1a1a1a;
          border: 1px solid #2a2a2a;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }

        .am-step.live .am-step-icon  { background: rgba(255,107,53,0.18); border-color: #ff6b35; }
        .am-step.done .am-step-icon  { background: rgba(40,167,69,0.15);  border-color: #28a745; }

        .am-step-label {
          font-size: 0.68rem;
          font-weight: 700;
          color: #666;
          letter-spacing: 0.05em;
        }

        .am-step.live .am-step-label { color: #ff6b35; }
        .am-step.done .am-step-label { color: #28a745; }

        .am-step-tag {
          font-size: 0.6rem;
          font-weight: 600;
          background: #1a1a1a;
          color: #555;
          padding: 0.1rem 0.4rem;
          border-radius: 4px;
        }

        .am-step-tag.live { background: rgba(255,107,53,0.15); color: #ff6b35; }
        .am-step-tag.done { background: rgba(40,167,69,0.12);  color: #28a745; }

        .am-connector {
          flex: 1;
          height: 1px;
          background: #222;
          min-width: 20px;
          align-self: flex-start;
          margin-top: 19px;
        }

        .am-connector.done { background: #28a745; }

        /* Round cards */
        .am-round-card {
          background: #0d0d0d;
          border: 1px solid #1f1f1f;
          border-radius: 12px;
          padding: 1rem 1.25rem;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          transition: border-color 0.2s;
        }

        .am-round-card.active    { border-color: #ff6b3566; }
        .am-round-card.completed { border-color: #28a74544; }

        .am-round-left {
          display: flex;
          align-items: flex-start;
          gap: 0.85rem;
          flex: 1;
          min-width: 0;
        }

        .am-round-icon-wrap {
          width: 40px; height: 40px; flex-shrink: 0;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
        }

        .am-round-title {
          color: #fff;
          font-weight: 700;
          font-size: 0.95rem;
        }

        .am-status-pill {
          font-size: 0.68rem;
          font-weight: 700;
          padding: 0.18rem 0.55rem;
          border-radius: 20px;
          letter-spacing: 0.03em;
        }

        .am-dates {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          color: #666;
          font-size: 0.75rem;
          margin: 0.3rem 0 0.45rem;
          flex-wrap: wrap;
        }

        .am-arrow { color: #444; }

        .am-meta-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
        }

        .am-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          background: #141414;
          border: 1px solid #242424;
          color: #999;
          font-size: 0.73rem;
          padding: 0.2rem 0.55rem;
          border-radius: 6px;
        }

        /* CTA button */
        .am-cta {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: #1a1a1a;
          border: 1px solid #2a2a2a;
          color: #666;
          padding: 0.5rem 1.1rem;
          border-radius: 8px;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: not-allowed;
          transition: all 0.2s;
          white-space: nowrap;
          align-self: center;
        }

        .am-cta.enabled {
          background: #ff6b35;
          border-color: #ff6b35;
          color: #000;
          cursor: pointer;
          font-weight: 700;
        }

        .am-cta.enabled:hover {
          background: #ff9a5c;
          border-color: #ff9a5c;
        }

        /* ── Results section ─────────────────────────────────────────── */
        .am-result-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .am-result-stat {
          background: #0d0d0d;
          border: 1px solid #1f1f1f;
          border-radius: 10px;
          padding: 0.85rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }

        .am-result-stat-label {
          font-size: 0.68rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #555;
        }

        .am-result-stat-value {
          font-size: 1.1rem;
          font-weight: 700;
          color: #fff;
        }

        .am-result-stat-value.pass  { color: #28a745; }
        .am-result-stat-value.fail  { color: #dc3545; }
        .am-result-stat-value.approval-approved { color: #28a745; }
        .am-result-stat-value.approval-rejected { color: #dc3545; }
        .am-result-stat-value.approval-pending  { color: #ffc107; }

        /* Per-round result rows */
        .am-round-results {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .am-rr-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: #0d0d0d;
          border: 1px solid #1f1f1f;
          border-radius: 10px;
          padding: 0.75rem 1rem;
          flex-wrap: wrap;
        }

        .am-rr-row.passed { border-color: rgba(40,167,69,0.25); }
        .am-rr-row.failed { border-color: rgba(220,53,69,0.2);  }

        .am-rr-left {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          min-width: 140px;
        }

        .am-rr-type-icon {
          display: flex;
          align-items: center;
          transform: scale(0.85);
          opacity: 0.8;
        }

        .am-rr-label {
          color: #fff;
          font-weight: 600;
          font-size: 0.88rem;
        }

        .am-rr-scores {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          min-width: 90px;
        }

        .am-rr-score {
          color: #ccc;
          font-size: 0.88rem;
          font-weight: 600;
        }

        .am-rr-pct {
          color: #888;
          font-size: 0.78rem;
        }

        .am-rr-bar-wrap {
          flex: 1;
          min-width: 80px;
        }

        .am-rr-bar {
          height: 6px;
          background: #1a1a1a;
          border-radius: 3px;
          overflow: hidden;
        }

        .am-rr-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.4s ease;
        }

        .am-rr-badge {
          font-size: 0.72rem;
          font-weight: 700;
          padding: 0.2rem 0.6rem;
          border-radius: 6px;
          white-space: nowrap;
        }

        .am-rr-badge.pass { background: rgba(40,167,69,0.15);  color: #28a745; }
        .am-rr-badge.fail { background: rgba(220,53,69,0.12);  color: #dc3545; }

        /* Admin comments */
        .am-comments-box {
          background: #0d0d0d;
          border: 1px solid #2a2a2a;
          border-left: 3px solid #ff6b35;
          border-radius: 10px;
          padding: 1rem 1.25rem;
        }

        .am-comments-label {
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #ff6b35;
          margin: 0 0 0.5rem;
        }

        .am-comments-text {
          color: #ccc;
          font-size: 0.9rem;
          line-height: 1.6;
          margin: 0;
          font-style: italic;
        }

        /* remove margin */
        .main-content-wrapper {
          margin-top: 0 !important;
        }

        /* 🔥 TARGET INLINE STYLE PARENT */
        div[style*="padding: 24px"] {
          padding: 0 !important;
        }
        .assessment-modal .modal-content {
          background: #000;
          border-radius: 0;
          height: 100vh;
        }
        
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes slideIn {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .modal-content {
          animation: slideIn 0.3s ease-out;
        }
        
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #111;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #ff6b35;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #ff9a5c;
        }

        .violation-alert.modal { z-index: 99999999 !important; }
      `}</style>
    </div>
  )
}