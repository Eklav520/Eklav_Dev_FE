// src/pages/LearningRoadmap/LearningRoadmap.tsx

import { useState, useEffect } from 'react'
import { Container, Card, ProgressBar, Button } from 'react-bootstrap'
import RoadmapPhaseCard from './RoadmapPhaseCard'
import { fullStackRoadmap } from './roadmap.data'

/* ================= PROPS ================= */

type LearningRoadmapProps = {
  onStartSession: (phaseId: string) => void
  onAllPhasesCompleted: () => void
  onValidatePhase: (phaseId: string) => void
  onBackToResult: () => void // ✅ NEW
}

/* ================= COMPONENT ================= */

const LearningRoadmap: React.FC<LearningRoadmapProps> = ({
  onStartSession,
  onAllPhasesCompleted,
  onValidatePhase,
  onBackToResult,
}) => {
  const [completedPhases, setCompletedPhases] = useState<string[]>([])

  /* -------- Toggle Phase Completion -------- */

  const togglePhase = (id: string) => {
    setCompletedPhases((prev) =>
      prev.includes(id)
        ? prev.filter((p) => p !== id)
        : [...prev, id],
    )
  }

  /* -------- Start Learning (Screen 4) -------- */

  const handleStartPhase = (phaseId: string) => {
    onStartSession(phaseId)
  }

  /* -------- Validate Skills (Screen 6) -------- */

  const handleValidateSkills = (phaseId: string) => {
    onValidatePhase(phaseId)
  }

  /* -------- Detect All Phases Completed -------- */

  useEffect(() => {
    if (completedPhases.length === fullStackRoadmap.length) {
      onAllPhasesCompleted()
    }
  }, [completedPhases, onAllPhasesCompleted])

  const progress =
    (completedPhases.length / fullStackRoadmap.length) * 100

  /* ================= RENDER ================= */

  return (
    <Container className="mt-5 mb-5">
      {/* ===== Header ===== */}
      <Card className="p-4 shadow-lg mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h3 className="fw-bold">
              📘 Full Stack Developer – Learning Roadmap
            </h3>
            <p className="text-muted mb-0">
              Daily commitment: 1–2 hours · Estimated duration: 8–9 months
            </p>
          </div>

          <Button
            variant="outline-secondary"
            onClick={onBackToResult}
          >
            ← Back to Career Path
          </Button>
        </div>

        <ProgressBar
          className="mt-3"
          now={progress}
          label={`${Math.round(progress)}%`}
        />
      </Card>

      {/* ===== Roadmap Phases ===== */}
      {fullStackRoadmap.map((phase) => (
        <RoadmapPhaseCard
          key={phase.id}
          phase={phase}
          completed={completedPhases.includes(phase.id)}
          onToggle={() => togglePhase(phase.id)}
          onStartPhase={handleStartPhase}
          onValidateSkills={handleValidateSkills}
        />
      ))}
    </Container>
  )
}

export default LearningRoadmap
