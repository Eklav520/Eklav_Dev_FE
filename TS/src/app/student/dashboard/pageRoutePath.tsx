import { useState } from 'react'
import { Container, Spinner } from 'react-bootstrap'

import CareerDiscovery from './CareerDiscovery/CareerDiscovery'
import CareerResult from './CareerResult/CareerResult'
import LearningRoadmap from './LearningRoadmap/LearningRoadmap'
import LearningSession from './LearningSession/LearningSession'
import CareerReadiness from './CareerReadiness/CareerReadiness'
import SkillValidation from './SkillValidation/SkillValidation'
import { CareerProfile } from './career'
import MockInterview from './MockInterview/MockInterview'

/* ================= TYPES ================= */

type ViewState =
  | 'DISCOVERY'
  | 'LOADING'
  | 'RESULT'
  | 'ROADMAP'
  | 'SESSION'
  | 'READINESS'
  | 'SKILL_VALIDATION' // ✅ NEW
  | 'INTERVIEW'

/* ================= COMPONENT ================= */

const StudentDashboard: React.FC = () => {
  const [view, setView] = useState<ViewState>('DISCOVERY')
  const [careerProfile, setCareerProfile] = useState<CareerProfile | null>(null)
  const [activePhaseId, setActivePhaseId] = useState<string | null>(null)

  const handleDiscoveryComplete = (profile: CareerProfile) => {
    setCareerProfile(profile)
    setView('LOADING')
    setTimeout(() => setView('RESULT'), 1500)
  }

  const handleEditPreferences = () => setView('DISCOVERY')
  const handleStartLearning = () => setView('ROADMAP')

  const handleStartSession = (phaseId: string) => {
    setActivePhaseId(phaseId)
    setView('SESSION')
  }

  const handleValidatePhase = (phaseId: string) => {
    setActivePhaseId(phaseId)
    setView('SKILL_VALIDATION')
  }

  const handleBackToRoadmap = () => setView('ROADMAP')

  const handleSessionComplete = () => setView('READINESS')

  const handleAllPhasesCompleted = () => setView('READINESS')
  const handleStartInterview = () => {
    setView('INTERVIEW')
  }

  return (
    <>
      {view === 'DISCOVERY' && <CareerDiscovery onComplete={handleDiscoveryComplete} />}

      {view === 'LOADING' && (
        <Container className="d-flex flex-column justify-content-center align-items-center mt-5">
          <Spinner animation="border" />
          <h5 className="mt-3">Analyzing your career goals…</h5>
        </Container>
      )}

      {view === 'RESULT' && careerProfile && (
        <CareerResult careerProfile={careerProfile} onEdit={handleEditPreferences} onStartLearning={handleStartLearning} />
      )}

      {view === 'ROADMAP' && careerProfile && (
        <LearningRoadmap
          onStartSession={handleStartSession}
          onAllPhasesCompleted={handleAllPhasesCompleted}
          onValidatePhase={handleValidatePhase}
          onBackToResult={() => setView('RESULT')} // ✅ ADD THIS
        />
      )}

      {view === 'SESSION' && activePhaseId && (
        <LearningSession phaseId={activePhaseId} onBack={handleBackToRoadmap} onSessionComplete={handleSessionComplete} />
      )}

      {view === 'SKILL_VALIDATION' && activePhaseId && (
        <SkillValidation phaseId={activePhaseId} onBack={handleBackToRoadmap} onStartInterview={handleStartInterview} />
      )}

      {view === 'READINESS' && <CareerReadiness onContinueLearning={() => setView('ROADMAP')} />}

      {view === 'INTERVIEW' && <MockInterview onFinish={() => setView('READINESS')} />}
    </>
  )
}

export default StudentDashboard
