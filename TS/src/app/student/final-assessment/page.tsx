import React, { useCallback, useEffect, useRef, useState } from "react"
import { Card, Button, Spinner, Alert, Modal, Badge } from "react-bootstrap"
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
  const [modalLoading, setModalLoading] = useState(false)
  const [startingRound, setStartingRound] = useState<string | null>(null)
  const [showViolationAlert, setShowViolationAlert] = useState(false)
  const [studentResult, setStudentResult] = useState<StudentResult | null>(null)

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

        if (progressData.success && Array.isArray(progressData.data)) {
          const map: Record<string, { completedRounds: string[]; status: string }> = {}
          progressData.data.forEach((p: any) => { map[p.examId] = p })
          setStudentProgressMap(map)
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

  const getRoundLabel = (type: RoundKey) => {
    const map: Record<RoundKey, string> = { mcq: "MCQ Round", coding: "Coding Round", tr: "Technical Round", hr: "HR Round", english: "English Round" }
    return map[type] || type.toUpperCase()
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh", background: "#000" }}>
        <Spinner animation="border" variant="light" />
      </div>
    )
  }

  return (
    <div style={{ background: "#000", minHeight: "100vh", color: "#fff" }}>
      {/* Assessments List */}
      {!isRunning && !selectedAssessment && (
        <div className="sa-container">
          {/* Page header */}
          <div className="sa-header">
            <div className="sa-header-left">
              <AssessmentIcon />
              <h1 className="sa-title">Final Assessments</h1>
            </div>
            <span className="sa-count-badge">{assessments.length} Available</span>
          </div>

          {/* Pending trial banner */}
          {isPending && (
            <div style={{
              background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.3)',
              borderRadius: '12px', padding: '12px 18px', marginBottom: '20px',
              display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13.5px', color: '#ccc',
            }}>
              <LockIcon />
              <span>
                <strong style={{ color: '#ff6b35' }}>Enrollment required:</strong>{' '}
                Final assessments are available only for enrolled students. Enroll to participate.
              </span>
            </div>
          )}

          {/* Assessment list */}
          {assessments.length === 0 ? (
            <div className="sa-empty">
              <AssessmentIcon />
              <h3>No assessments available</h3>
              <p>Check back later for new assessments</p>
            </div>
          ) : (
            <div className="sa-list">
              {assessments.map((assessment) => {
                const rounds = assessment.rounds ?? []
                const now = new Date()
                const studentProgress = studentProgressMap[assessment._id]
                const studentCompleted = studentProgress?.status === 'completed'
                return (
                  <div key={assessment._id} className="sa-card" style={isPending ? { opacity: 0.6, pointerEvents: 'none' } : undefined}>

                    {/* ── Card top row: badges + title + View Details ── */}
                    <div className="sa-card-top" style={{ paddingBottom: rounds.length > 0 ? '0.5rem' : undefined }}>
                      <div className="sa-card-meta">
                        <div className="sa-badges">
                          <span className="sa-badge-type">📋 Assessment</span>
                          {assessment.published && <span className="sa-badge-published">● Published</span>}
                          {assessment.activeRound && (
                            <span className="sa-badge-active">⚡ {assessment.activeRound.toUpperCase()} Live</span>
                          )}
                          {studentCompleted && (
                            <span style={{ background: 'rgba(40,167,69,0.15)', color: '#28a745', border: '1px solid rgba(40,167,69,0.3)', fontSize: '0.73rem', fontWeight: 600, padding: '0.28rem 0.65rem', borderRadius: '8px' }}>
                              ✓ All Rounds Completed
                            </span>
                          )}
                        </div>
                        <h4 className="sa-card-title">{assessment.title}</h4>
                        {assessment.description && (
                          <p className="sa-card-desc">{assessment.description}</p>
                        )}
                      </div>
                      {studentProgress && studentProgress.completedRounds.length > 0 && (
                        <div className="sa-card-actions">
                          <button
                            className="sa-btn-details"
                            onClick={() => handleSelectAssessment(assessment)}
                          >
                            View Details
                          </button>
                        </div>
                      )}
                    </div>

                    {/* ── Rounds: each with its own action button ── */}
                    {rounds.length > 0 && (
                      <>
                        <div className="sa-rounds-divider" />
                        <div className="sa-rounds-list">
                          {rounds.map((round, idx) => {
                            const rs = getRoundStatusFromDates(round)
                            const roundDone = studentProgress?.completedRounds?.includes(round.roundType)
                            const roundStart = round.startDateTime ? new Date(round.startDateTime) : null
                            const roundEnd = round.endDateTime ? new Date(round.endDateTime) : null
                            const isActive = roundStart && roundEnd && now >= roundStart && now <= roundEnd
                            const isEnded = roundEnd && now > roundEnd
                            return (
                              <div key={idx} className="sa-round-col" style={{
                                borderColor: roundDone ? '#22c55e44' : rs.color + '33',
                                background: roundDone ? 'rgba(34,197,94,0.06)' : rs.bg,
                                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                              }}>
                                <div>
                                  <div className="sa-round-col-top">
                                    <div className="sa-round-label">
                                      <span className="sa-round-type-icon">{getRoundIcon(round.roundType)}</span>
                                      <strong>{getRoundLabel(round.roundType)}</strong>
                                    </div>
                                    <span className="sa-round-status" style={{ color: roundDone ? '#22c55e' : rs.color }}>
                                      ● {roundDone ? 'Completed' : rs.label}
                                    </span>
                                  </div>
                                  <div className="sa-round-dates">
                                    <CalendarIcon />
                                    <span>{formatCardDate(round.startDateTime)}</span>
                                    <span className="sa-arrow">→</span>
                                    <span>{formatCardDate(round.endDateTime)}</span>
                                  </div>
                                  <div className="sa-round-meta">
                                    <span className="sa-meta-chip">⏱ {formatDuration(round.timeSeconds)}</span>
                                    <span className="sa-meta-chip">❓ {round.pickCount} Qs</span>
                                    {round.passPercentage && <span className="sa-meta-chip">🎯 {round.passPercentage}% Pass</span>}
                                    {round.pointsPerQuestion && <span className="sa-meta-chip">⭐ {round.pointsPerQuestion} pt/Q</span>}
                                  </div>
                                </div>
                                {/* Per-round action */}
                                <div style={{ marginTop: '0.85rem' }}>
                                  {isPending ? (
                                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '0.45rem', borderRadius: 8, border: '1px solid #2a2a2a', background: '#111', color: '#444', fontSize: '0.78rem', fontWeight: 600, cursor: 'not-allowed' }}>
                                      <LockIcon /> Enroll to Start
                                    </span>
                                  ) : roundDone ? (
                                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '0.45rem', borderRadius: 8, background: 'rgba(34,197,94,0.12)', border: '1px solid #22c55e44', color: '#22c55e', fontSize: '0.78rem', fontWeight: 700 }}>
                                      ✓ Assessment Complete
                                    </span>
                                  ) : isActive ? (
                                    <button
                                      onClick={() => handleSelectAssessment(assessment)}
                                      style={{ width: '100%', padding: '0.45rem', borderRadius: 8, background: '#ff6b35', border: 'none', color: '#fff', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                                    >
                                      ▶ Start {getRoundLabel(round.roundType)}
                                    </button>
                                  ) : isEnded ? (
                                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '0.45rem', borderRadius: 8, background: 'rgba(220,53,69,0.10)', border: '1px solid #dc354544', color: '#dc3545', fontSize: '0.78rem', fontWeight: 600 }}>
                                      ✗ Round Ended
                                    </span>
                                  ) : (
                                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '0.45rem', borderRadius: 8, background: 'rgba(255,193,7,0.08)', border: '1px solid #ffc10744', color: '#ffc107', fontSize: '0.78rem', fontWeight: 600 }}>
                                      ⏳ Upcoming
                                    </span>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Assessment Detail Modal */}
      <Modal
        show={showAssessmentModal}
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
                {examStatus === "active" ? "● In Progress" : examStatus === "completed" ? "✓ Completed" : "◷ Upcoming"}
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
                        <div className={`am-step ${isCompleted ? "done" : isActive ? "live" : ""}`}>
                          <div className="am-step-icon">{getRoundIcon(round.roundType)}</div>
                          <span className="am-step-label">{round.roundType.toUpperCase()}</span>
                          {isCompleted && <span className="am-step-tag done">✓ Done</span>}
                          {isActive && !isCompleted && <span className="am-step-tag live">● Live</span>}
                          {!isActive && !isCompleted && <span className="am-step-tag">Upcoming</span>}
                        </div>
                        {idx < rounds.length - 1 && <div className={`am-connector ${isCompleted ? "done" : ""}`} />}
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
                      <div key={index} className={`am-round-card ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}>
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
                          className={`am-cta ${isActive && !isCompleted ? "enabled" : ""}`}
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
                      <strong className={`am-result-stat-value ${studentResult.status === "passed" ? "pass" : "fail"}`}>
                        {studentResult.status === "passed" ? "✓ Passed" : "✗ Failed"}
                      </strong>
                    </div>
                    <div className="am-result-stat">
                      <span className="am-result-stat-label">Approval</span>
                      <strong className={`am-result-stat-value approval-${studentResult.approvalStatus}`}>
                        {studentResult.approvalStatus === "approved" ? "✓ Approved" :
                          studentResult.approvalStatus === "rejected" ? "✗ Rejected" : "⏳ Pending"}
                      </strong>
                    </div>
                  </div>

                  {/* Per-round results */}
                  {studentResult.roundResults.length > 0 && (
                    <div className="am-round-results">
                      {studentResult.roundResults.map((rr, i) => (
                        <div key={i} className={`am-rr-row ${rr.passed ? "passed" : "failed"}`}>
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
                          <span className={`am-rr-badge ${rr.passed ? "pass" : "fail"}`}>
                            {rr.passed ? "✓ Pass" : "✗ Fail"}
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
        /* ── Assessment List ───────────────────────────────────────────── */
        .sa-container {
          background: #000;
          min-height: 100vh;
          padding: 1.5rem 1.25rem 3rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .sa-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
          padding-bottom: 1.25rem;
          border-bottom: 1px solid #1f1f1f;
          margin-bottom: 1.75rem;
        }

        .sa-header-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .sa-title {
          font-size: 1.6rem;
          font-weight: 700;
          color: #ff6b35;
          margin: 0;
        }

        .sa-count-badge {
          background: rgba(255,107,53,0.12);
          color: #ff6b35;
          border: 1px solid rgba(255,107,53,0.3);
          padding: 0.3rem 0.9rem;
          border-radius: 20px;
          font-size: 0.82rem;
          font-weight: 600;
        }

        /* Assessment list — full-width stacked */
        .sa-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        /* Card — full width */
        .sa-card {
          background: #0d0d0d;
          border: 1px solid #1f1f1f;
          border-radius: 16px;
          padding: 1.25rem 1.5rem;
          transition: border-color 0.2s;
        }

        .sa-card:hover {
          border-color: #2a2a2a;
        }

        /* Card top: info left + buttons right */
        .sa-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1.5rem;
          flex-wrap: wrap;
        }

        .sa-card-meta {
          flex: 1;
          min-width: 0;
        }

        .sa-card-actions {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex-shrink: 0;
          min-width: 160px;
        }

        .sa-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          margin-bottom: 0.6rem;
        }

        .sa-badge-type {
          background: rgba(255,107,53,0.13);
          color: #ff6b35;
          font-size: 0.73rem;
          font-weight: 600;
          padding: 0.28rem 0.65rem;
          border-radius: 8px;
        }

        .sa-badge-published {
          background: rgba(13,202,240,0.12);
          color: #0dcaf0;
          font-size: 0.73rem;
          font-weight: 600;
          padding: 0.28rem 0.65rem;
          border-radius: 8px;
        }

        .sa-badge-active {
          background: rgba(40,167,69,0.15);
          color: #28a745;
          font-size: 0.73rem;
          font-weight: 600;
          padding: 0.28rem 0.65rem;
          border-radius: 8px;
          border: 1px solid rgba(40,167,69,0.3);
        }

        .sa-card-title {
          color: #ffffff;
          font-size: 1.05rem;
          font-weight: 700;
          margin: 0 0 0.35rem;
          line-height: 1.4;
        }

        .sa-card-desc {
          color: #777;
          font-size: 0.82rem;
          line-height: 1.5;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Divider between top and rounds */
        .sa-rounds-divider {
          height: 1px;
          background: #1a1a1a;
          margin: 1rem 0;
        }

        /* Rounds — equal horizontal columns */
        .sa-rounds-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 0.75rem;
        }

        .sa-round-col {
          border: 1px solid #2a2a2a;
          border-radius: 10px;
          padding: 0.85rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .sa-round-col-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.5rem;
        }

        .sa-round-label {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          color: #fff;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .sa-round-type-icon {
          display: flex;
          align-items: center;
          opacity: 0.85;
          transform: scale(0.8);
          flex-shrink: 0;
        }

        .sa-round-status {
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.02em;
          white-space: nowrap;
        }

        .sa-round-dates {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          color: #666;
          font-size: 0.72rem;
          flex-wrap: wrap;
          line-height: 1.4;
        }

        .sa-arrow {
          color: #444;
          font-size: 0.7rem;
        }

        .sa-round-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
        }

        .sa-meta-chip {
          background: rgba(255,255,255,0.04);
          border: 1px solid #222;
          color: #999;
          font-size: 0.72rem;
          padding: 0.18rem 0.5rem;
          border-radius: 5px;
          white-space: nowrap;
        }

        .sa-divider {
          height: 1px;
          background: #1f1f1f;
          margin: auto 0 1rem;
        }

        .sa-btn-details {
          width: 100%;
          background: transparent;
          border: 1.5px solid #2a2a2a;
          color: #ccc;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
        }

        .sa-btn-details:hover {
          border-color: #ff6b35;
          color: #ff6b35;
        }

        .sa-btn-start {
          width: 100%;
          background: #ff6b35;
          border: none;
          color: #000;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
        }

        .sa-btn-start:hover:not(:disabled) {
          background: #ff9a5c;
        }

        .sa-btn-start.ended {
          background: rgba(40,167,69,0.12);
          color: #28a745;
          border: 1px solid rgba(40,167,69,0.3);
          cursor: not-allowed;
          font-weight: 600;
        }

        .sa-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 5rem 1rem;
          color: #555;
          text-align: center;
          gap: 0.75rem;
        }

        .sa-empty h3 { color: #777; margin: 0; }
        .sa-empty p  { color: #555; margin: 0; font-size: 0.9rem; }

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