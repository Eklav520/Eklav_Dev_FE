import { useEffect, useState } from "react"
import StudentQuiz from "@/app/student/final-assessment/components/StudentQuiz"
import StudentCodeChallengeComponent from "@/app/student/final-assessment/components/codeChallenge/StudentCodeChallengeComponent"
import TechnicalRound from "@/app/student/final-assessment/components/TRRound/TechnicalRound"
import HRRound from "@/app/student/final-assessment/HRRound/HRRound"

// ✅ Define proper type
type ExamConfig = {
  examId: string
  type: "mcq" | "coding" | "tr" | "hr"
  duration: number
}

export default function StudentExamSecure() {
  const [config, setConfig] = useState<ExamConfig | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    const examId = params.get("examId")
    const typeParam = params.get("type")
    const duration = Number(params.get("duration"))

    // ✅ Validate type properly
    const validTypes: ExamConfig["type"][] = ["mcq", "coding", "tr", "hr"]

    if (!examId || !typeParam || !validTypes.includes(typeParam as any)) {
      alert("Invalid exam access")
      window.location.href = "/student/final-assessment"
      return
    }

    const type = typeParam as ExamConfig["type"]

    setConfig({ examId, type, duration })

    // 🔒 Disable scroll
    document.body.style.overflow = "hidden"

    // 🔒 Prevent refresh / leave
    window.onbeforeunload = () => "Exam is in progress"

    return () => {
      document.body.style.overflow = "auto"
      window.onbeforeunload = null
    }
  }, [])

  // ✅ Prevent rendering until config ready
  if (!config) return null

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        zIndex: 999999,
      }}
    >
      {/* MCQ */}
      {config.type === "mcq" && (
        <StudentQuiz
          examId={config.examId}
          duration={config.duration}
        />
      )}

      {/* Coding */}
      {config.type === "coding" && (
        <StudentCodeChallengeComponent
          eventId={config.examId}
        />
      )}

      {/* Technical */}
      {config.type === "tr" && (
        <TechnicalRound
          examId={config.examId}
          duration={config.duration}
        />
      )}

      {/* HR */}
      {config.type === "hr" && (
        <HRRound
          examId={config.examId}
          duration={config.duration}
        />
      )}
    </div>
  )
}