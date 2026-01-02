import { Card, Badge, Button } from 'react-bootstrap'

type Props = {
  phase: {
    id: string
    title: string
    duration: string
    hours: number
    skills: string[]
    tools: string[]
  }
  completed: boolean
  onToggle: () => void
  onStartPhase: (phaseId: string) => void
  onValidateSkills: (phaseId: string) => void // ✅ NEW
}

const RoadmapPhaseCard: React.FC<Props> = ({
  phase,
  completed,
  onToggle,
  onStartPhase,
  onValidateSkills,
}) => {
  return (
    <Card
      className={`p-4 mb-3 shadow-sm ${
        completed ? 'border-success' : ''
      }`}
    >
      <div className="d-flex justify-content-between align-items-center">
        <h5 className="fw-bold">{phase.title}</h5>
        <Badge bg={completed ? 'success' : 'secondary'}>
          {completed ? 'Completed' : phase.duration}
        </Badge>
      </div>

      <p className="text-muted mb-1">⏱️ {phase.hours} hours</p>

      <div className="mt-2">
        <strong>Skills:</strong>
        <div className="mt-1">
          {phase.skills.map((s) => (
            <Badge key={s} bg="info" className="me-2">
              {s}
            </Badge>
          ))}
        </div>
      </div>

      <div className="mt-3">
        <strong>Tools:</strong>
        <div className="mt-1">
          {phase.tools.map((t) => (
            <Badge key={t} bg="dark" className="me-2">
              {t}
            </Badge>
          ))}
        </div>
      </div>

      <div className="mt-4 d-flex gap-2">
        {!completed && (
          <Button
            variant="primary"
            onClick={() => onStartPhase(phase.id)}
          >
            Start Learning
          </Button>
        )}

        <Button
          variant="outline-primary"
          onClick={() => onValidateSkills(phase.id)}
        >
          Validate Skills
        </Button>

        <Button
          variant={completed ? 'outline-success' : 'outline-secondary'}
          onClick={onToggle}
        >
          {completed ? 'Mark as Incomplete' : 'Mark Phase Completed'}
        </Button>
      </div>
    </Card>
  )
}

export default RoadmapPhaseCard
