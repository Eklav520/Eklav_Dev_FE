import React, { useEffect, useState } from "react"
import { Card, Button, Spinner, Alert, Modal, Badge } from "react-bootstrap"
import StudentQuiz from "./components/StudentQuiz"
import StudentCodeChallengeComponent from "./components/codeChallenge/StudentCodeChallengeComponent"
import { useAuthContext } from "@/context/useAuthContext"

type RoundKey = "mcq" | "coding" | "tr" | "hr"

type Round = {
  roundType: RoundKey
  status: "upcoming" | "active" | "completed"
  pickCount: number
  timeSeconds: number
  passPercentage?: number
  startDateTime?: string
  endDateTime?: string
}

type Assessment = {
  _id: string
  title: string
  description?: string
  activeRound: RoundKey | null
  createdAt: string
  rounds?: Round[]
}

// ✅ SVG ICON COMPONENTS
const AssessmentIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 4H20V20H4V4Z" stroke="#ff6b35" strokeWidth="1.5" fill="none"/>
    <path d="M8 7H16M8 11H14M8 15H12" stroke="#ff6b35" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M17 17L19 19" stroke="#ff6b35" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

const MCQIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" stroke="#ff6b35" strokeWidth="1.5" fill="none"/>
    <path d="M9 12L11 14L15 10" stroke="#ff6b35" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

const CodingIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="18" height="16" rx="2" stroke="#ff6b35" strokeWidth="1.5" fill="none"/>
    <path d="M8 10L6 12L8 14M16 10L18 12L16 14M12 9L10 15" stroke="#ff6b35" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

const TechnicalIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#ff6b35" strokeWidth="1.5" fill="none"/>
    <path d="M2 17L12 22L22 17M2 12L12 17L22 12" stroke="#ff6b35" strokeWidth="1.5" fill="none"/>
  </svg>
)

const HRIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="8" r="4" stroke="#ff6b35" strokeWidth="1.5" fill="none"/>
    <path d="M5 20V19C5 14.5 8 12 12 12C16 12 19 14.5 19 19V20" stroke="#ff6b35" strokeWidth="1.5" fill="none"/>
  </svg>
)

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

const QuestionIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <path d="M9 9C9 7.5 10 6 12 6C14 6 15 7.5 15 9C15 10.5 14 11 12 12V13M12 17H12.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

const TargetIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <circle cx="12" cy="12" r="2" fill="currentColor"/>
  </svg>
)

const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="6" width="18" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <path d="M8 3V6M16 3V6M3 10H21" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
)

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="11" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <path d="M8 11V7C8 4.5 10 3 12 3C14 3 16 4.5 16 7V11" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
)

const UnlockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="11" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <path d="M8 11V7C8 5 9 4 12 4C14 4 15 5 16 7" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
)

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

// Helper functions
function getRoundIcon(type: string) {
  switch(type) {
    case 'mcq': return <MCQIcon />
    case 'coding': return <CodingIcon />
    case 'tr': return <TechnicalIcon />
    case 'hr': return <HRIcon />
    default: return <AssessmentIcon />
  }
}

export default function StudentAssessmentController() {
  const { user } = useAuthContext()
  const token = user?.token
  const API_BASE = import.meta.env.VITE_API_BASE_URL

  const [loading, setLoading] = useState(true)
  const [assessments, setAssessments] = useState<Assessment[]>([])
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

  // Fetch assessments
  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/assessment/admin/exams`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        const data = await res.json()

        if (!data.success) {
          console.error("Failed to fetch assessments")
          return
        }

        setAssessments(data.exams || [])
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
          setRounds(formattedRounds)
          setCompletedRounds([])
          setExamStatus("upcoming")
        }
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
      setShowAssessmentModal(false)
      setStartingRound(null)
    } catch (err) {
      console.error("Start round error", err)
      alert("Failed to start round")
      setStartingRound(null)
    }
  }

  const handleRoundSubmit = async () => {
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
        }),
      })

      const submitData = await submitRes.json()

      if (!submitData.success) {
        console.error("Submit failed", submitData.message)
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
        <div className="container py-5">
          <div className="text-center mb-5">
            <h1 style={{ 
              color: "#fff", 
              fontSize: "2.5rem", 
              fontWeight: "bold",
              background: "linear-gradient(135deg, #ff6b35 0%, #ff9a5c 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}>
              Available Assessments
            </h1>
            <p style={{ color: "#888", fontSize: "1.1rem", marginTop: "1rem" }}>
              Select an assessment to begin your journey
            </p>
          </div>

          <div className="row g-4">
            {assessments.map((assessment) => (
              <div key={assessment._id} className="col-md-6 col-lg-4">
                <Card 
                  style={{ 
                    background: "#111", 
                    border: "1px solid #333",
                    cursor: "pointer",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    overflow: "hidden"
                  }}
                  className="h-100"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-8px)"
                    e.currentTarget.style.borderColor = "#ff6b35"
                    e.currentTarget.style.boxShadow = "0 8px 20px rgba(255, 107, 53, 0.2)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)"
                    e.currentTarget.style.borderColor = "#333"
                    e.currentTarget.style.boxShadow = "none"
                  }}
                  onClick={() => handleSelectAssessment(assessment)}
                >
                  <Card.Body>
                    <div style={{ 
                      width: "50px", 
                      height: "50px", 
                      background: "rgba(255, 107, 53, 0.1)",
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "1rem"
                    }}>
                      <AssessmentIcon />
                    </div>
                    <Card.Title style={{ color: "#ff6b35", fontSize: "1.5rem", fontWeight: "bold" }}>
                      {assessment.title}
                    </Card.Title>
                    <Card.Text style={{ color: "#888", marginTop: "1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                        <CalendarIcon />
                        <span>Created: {new Date(assessment.createdAt).toLocaleDateString()}</span>
                      </div>
                      {assessment.activeRound && (
                        <div className="mt-2">
                          <Badge style={{ background: "#ff6b35", padding: "4px 8px" }}>
                            Active: {assessment.activeRound.toUpperCase()}
                          </Badge>
                        </div>
                      )}
                    </Card.Text>
                  </Card.Body>
                </Card>
              </div>
            ))}
          </div>

          {assessments.length === 0 && (
            <div className="text-center mt-5">
              <Alert variant="dark" style={{ background: "#111", borderColor: "#333", color: "#888" }}>
                No assessments available at the moment.
              </Alert>
            </div>
          )}
        </div>
      )}

      {/* Fullscreen Assessment Modal */}
      <Modal 
        show={showAssessmentModal} 
        onHide={handleCloseModal}
        fullscreen={true}
        backdrop="static"
        className="assessment-modal"
      >
        <Modal.Header 
          style={{ 
            background: "linear-gradient(135deg, #0a0a0a 0%, #111 100%)",
            borderBottom: "2px solid #ff6b35",
            color: "#fff",
            padding: "1.5rem 2rem"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1 }}>
            <div style={{
              width: "56px",
              height: "56px",
              background: "rgba(255, 107, 53, 0.2)",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <AssessmentIcon />
            </div>
            <div style={{ flex: 1 }}>
              <Modal.Title style={{ color: "#ff6b35", fontSize: "2rem", fontWeight: "bold", marginBottom: "4px" }}>
                {selectedAssessment?.title}
              </Modal.Title>
              {selectedAssessment?.description && (
                <p style={{ color: "#888", margin: 0, fontSize: "0.9rem" }}>
                  {selectedAssessment.description}
                </p>
              )}
            </div>
          </div>
        </Modal.Header>
        
        <Modal.Body style={{ 
          background: "#000", 
          color: "#fff",
          padding: "2rem"
        }}>
          {modalLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="light" />
              <p className="mt-3" style={{ color: "#888" }}>Loading assessment details...</p>
            </div>
          ) : (
            <>
              {/* Exam Status Header */}
              <div style={{
                background: "linear-gradient(135deg, #0a0a0a 0%, #111 100%)",
                borderRadius: "12px",
                padding: "1.25rem",
                marginBottom: "2rem",
                border: "1px solid #333"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <TargetIcon />
                    <span style={{ color: "#888" }}>Exam Status:</span>
                  </div>
                  <Badge 
                    style={{ 
                      background: examStatus === "active" ? "#28a745" : 
                                 examStatus === "completed" ? "#6c757d" : "#ffc107",
                      padding: "8px 16px",
                      fontSize: "0.9rem",
                      borderRadius: "8px"
                    }}
                  >
                    {examStatus === "active" ? "IN PROGRESS" : 
                     examStatus === "completed" ? "COMPLETED" : "UPCOMING"}
                  </Badge>
                </div>
              </div>
              
              {/* Rounds Progress */}
              <div style={{ marginBottom: "2rem" }}>
                <h5 style={{ color: "#ff6b35", marginBottom: "1rem", fontSize: "1rem", fontWeight: "bold" }}>
                  Assessment Progress
                </h5>
                <div style={{ 
                  background: "#111", 
                  borderRadius: "12px", 
                  padding: "1rem",
                  display: "flex",
                  gap: "1rem",
                  flexWrap: "wrap"
                }}>
                  {rounds.map((round, idx) => {
                    const isCompleted = isRoundCompleted(round.roundType)
                    const isActive = isRoundActive(round)
                    return (
                      <div
                        key={idx}
                        style={{
                          flex: 1,
                          minWidth: "100px",
                          textAlign: "center",
                          padding: "0.75rem",
                          borderRadius: "8px",
                          background: isCompleted ? "rgba(40, 167, 69, 0.15)" : 
                                     isActive ? "rgba(255, 107, 53, 0.15)" : 
                                     "rgba(51, 51, 51, 0.3)",
                          border: `1px solid ${isCompleted ? "#28a745" : 
                                    isActive ? "#ff6b35" : "#333"}`
                        }}
                      >
                        <div style={{ marginBottom: "8px" }}>{getRoundIcon(round.roundType)}</div>
                        <div style={{ fontSize: "11px", color: "#888", marginTop: "4px", fontWeight: 500 }}>
                          {round.roundType.toUpperCase()}
                        </div>
                        {isCompleted && (
                          <div style={{ fontSize: "10px", color: "#28a745", marginTop: "4px", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                            <CheckIcon /> Completed
                          </div>
                        )}
                        {isActive && !isCompleted && (
                          <div style={{ fontSize: "10px", color: "#ff6b35", marginTop: "4px" }}>
                            Available Now
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
              
              {/* Rounds List */}
              <h5 style={{ color: "#ff6b35", marginBottom: "1.5rem", fontSize: "1rem", fontWeight: "bold" }}>
                Available Rounds
              </h5>
              
              {rounds.length === 0 ? (
                <div className="text-center py-5">
                  <p style={{ color: "#888" }}>No rounds available for this assessment.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {rounds.map((round, index) => {
                    const status = getRoundStatus(round)
                    const isActive = isRoundActive(round)
                    const isCompleted = isRoundCompleted(round.roundType)
                    
                    return (
                      <Card 
                        key={index} 
                        style={{ 
                          background: "#111", 
                          border: `1px solid ${isActive ? "#ff6b35" : "#333"}`,
                          transition: "all 0.3s ease",
                          overflow: "hidden"
                        }}
                      >
                        <Card.Body style={{ padding: "1.5rem" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1.5rem" }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "1rem", flexWrap: "wrap" }}>
                                <div style={{
                                  width: "48px",
                                  height: "48px",
                                  background: isActive ? "rgba(255, 107, 53, 0.2)" : "rgba(51, 51, 51, 0.5)",
                                  borderRadius: "12px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center"
                                }}>
                                  {getRoundIcon(round.roundType)}
                                </div>
                                <div>
                                  <h4 style={{ color: "#ff6b35", marginBottom: "6px", fontSize: "1.35rem", fontWeight: "bold" }}>
                                    {round.roundType.toUpperCase()} Round
                                  </h4>
                                  <Badge 
                                    style={{ 
                                      background: status.color,
                                      fontSize: "0.75rem",
                                      padding: "4px 10px",
                                      borderRadius: "6px"
                                    }}
                                  >
                                    {status.text}
                                  </Badge>
                                </div>
                              </div>
                              
                              <div style={{ 
                                display: "grid", 
                                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
                                gap: "1rem", 
                                marginTop: "1rem" 
                              }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#888", fontSize: "0.9rem" }}>
                                  <QuestionIcon />
                                  Questions: <strong style={{ color: "#fff" }}>{round.pickCount}</strong>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#888", fontSize: "0.9rem" }}>
                                  <ClockIcon />
                                  Duration: <strong style={{ color: "#fff" }}>{formatDuration(round.timeSeconds)}</strong>
                                </div>
                                {round.passPercentage && (
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#888", fontSize: "0.9rem" }}>
                                    <TargetIcon />
                                    Pass: <strong style={{ color: "#fff" }}>{round.passPercentage}%</strong>
                                  </div>
                                )}
                              </div>
                              
                              {round.startDateTime && (
                                <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #333" }}>
                                  <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.8rem", color: "#666", flexWrap: "wrap" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                      <CalendarIcon />
                                      Start: {formatDate(round.startDateTime)}
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                      <ClockIcon />
                                      End: {formatDate(round.endDateTime)}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div className="text-end">
                              <Button
                                style={{
                                  background: isActive && !isCompleted ? "linear-gradient(135deg, #ff6b35 0%, #ff9a5c 100%)" : "#333",
                                  border: "none",
                                  padding: "0.75rem 2rem",
                                  fontWeight: "bold",
                                  borderRadius: "10px",
                                  cursor: isActive && !isCompleted ? "pointer" : "not-allowed",
                                  opacity: isActive && !isCompleted ? 1 : 0.6,
                                  minWidth: "140px",
                                  transition: "all 0.3s ease",
                                  fontSize: "0.95rem"
                                }}
                                disabled={!isActive || isCompleted}
                                onClick={() => handleStartRound(round)}
                              >
                                {startingRound === round.roundType ? (
                                  <Spinner animation="border" size="sm" />
                                ) : isCompleted ? (
                                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                                    <CheckIcon /> Completed
                                  </span>
                                ) : isActive ? (
                                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                                    <UnlockIcon /> Start Round
                                  </span>
                                ) : (
                                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                                    <LockIcon /> Locked
                                  </span>
                                )}
                              </Button>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </Modal.Body>
        
        <Modal.Footer style={{ 
          background: "#111", 
          borderTop: "1px solid #333",
          padding: "1rem 2rem"
        }}>
          <Button 
            variant="secondary" 
            onClick={handleCloseModal}
            style={{ 
              background: "#333", 
              border: "none",
              padding: "0.6rem 1.5rem",
              transition: "all 0.3s ease",
              borderRadius: "8px"
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#444"}
            onMouseLeave={(e) => e.currentTarget.style.background = "#333"}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Quiz Round */}
      {isRunning && roundConfig?.type === "mcq" && selectedAssessment && (
        <div style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", background: "#000", zIndex: 999999 }}>
          <StudentQuiz
            examId={selectedAssessment._id}
            duration={roundConfig.duration}
            onSubmit={handleRoundSubmit}
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

      <style>{`
        .assessment-modal .modal-content {
          background: #000;
          border-radius: 0;
          height: 100vh;
        }
        
        .assessment-modal .modal-header .btn-close {
          filter: invert(1);
          opacity: 0.8;
          background-size: 1rem;
        }
        
        .assessment-modal .modal-header .btn-close:hover {
          opacity: 1;
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
      `}</style>
    </div>
  )
}