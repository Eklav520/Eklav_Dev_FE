// src/pages/CareerReadiness/SkillProgressCard.tsx

import { Card, ProgressBar } from 'react-bootstrap'
import { SkillProgress } from './readiness.data'

const SkillProgressCard = ({ skill, progress }: SkillProgress) => {
  return (
    <Card className="p-3 shadow-sm mb-3">
      <div className="d-flex justify-content-between mb-2">
        <strong>{skill}</strong>
        <span>{progress}%</span>
      </div>
      <ProgressBar now={progress} />
    </Card>
  )
}

export default SkillProgressCard
