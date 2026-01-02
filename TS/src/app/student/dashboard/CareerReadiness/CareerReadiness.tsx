// src/pages/CareerReadiness/CareerReadiness.tsx

import { Container, Card, Badge, Button } from 'react-bootstrap'
import SkillProgressCard from './SkillProgressCard'
import { readinessData } from './readiness.data'

type CareerReadinessProps = {
  onContinueLearning: () => void
}

const CareerReadiness: React.FC<CareerReadinessProps> = ({
  onContinueLearning,
}) => {
  const {
    overallScore,
    strengths,
    improvements,
    skills,
  } = readinessData

  return (
    <Container className="mt-5 mb-5">
      {/* ===== Header ===== */}
      <Card className="p-4 shadow-lg mb-4 text-center">
        <h3 className="fw-bold">📊 Career Readiness</h3>
        <p className="text-muted mb-3">
          Full Stack Developer – Job Readiness Overview
        </p>

        <h1 className="display-4 fw-bold text-primary">
          {overallScore}%
        </h1>
        <p className="text-muted">
          Overall Job Readiness Score
        </p>
      </Card>

      {/* ===== Skill Progress ===== */}
      <Card className="p-4 shadow-sm mb-4">
        <h5 className="fw-bold mb-3">Skill Progress</h5>
        {skills.map((s) => (
          <SkillProgressCard
            key={s.skill}
            skill={s.skill}
            progress={s.progress}
          />
        ))}
      </Card>

      {/* ===== Strengths & Gaps ===== */}
      <Card className="p-4 shadow-sm mb-4">
        <h5 className="fw-bold mb-3">Strengths</h5>
        {strengths.map((s) => (
          <Badge key={s} bg="success" className="me-2 mb-2">
            {s}
          </Badge>
        ))}

        <hr />

        <h5 className="fw-bold mb-3">Needs Improvement</h5>
        {improvements.map((i) => (
          <Badge key={i} bg="warning" className="me-2 mb-2">
            {i}
          </Badge>
        ))}
      </Card>

      {/* ===== Action ===== */}
      <div className="text-center">
        <Button size="lg" variant="primary" onClick={onContinueLearning}>
          Continue Learning
        </Button>
      </div>
    </Container>
  )
}

export default CareerReadiness
