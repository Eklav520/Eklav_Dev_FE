// src/pages/LearningSession/LearningSession.tsx

import { useState } from 'react'
import { Container, Card, Button, ProgressBar } from 'react-bootstrap'
import TaskCard from './TaskCard'
import { todayTasks } from './task.data'

type LearningSessionProps = {
  phaseId: string
  onBack: () => void
  onSessionComplete: () => void // 👈 NEW
}

const LearningSession: React.FC<LearningSessionProps> = ({
  phaseId,
  onBack,
  onSessionComplete,
}) => {
  const [completed, setCompleted] = useState(false)

  const totalMinutes = todayTasks.reduce(
    (sum, t) => sum + t.duration,
    0,
  )

  const handleComplete = () => {
    setCompleted(true)

    // small delay for UX
    setTimeout(() => {
      onSessionComplete()
    }, 500)
  }

  return (
    <Container className="mt-5 mb-5">
      <Card className="p-4 shadow-lg mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <h4 className="fw-bold mb-0">📅 Today’s Learning</h4>
          <Button variant="outline-secondary" size="sm" onClick={onBack}>
            ← Back to Roadmap
          </Button>
        </div>

        <p className="text-muted mt-2">
          Phase: {phaseId}
        </p>

        <ProgressBar
          now={completed ? 100 : 0}
          label={completed ? 'Completed' : 'In Progress'}
        />

        <p className="mt-2 mb-0">
          ⏱ Total time today: {totalMinutes} minutes
        </p>
      </Card>

      {todayTasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}

      <div className="text-center mt-4">
        <Button
          size="lg"
          variant={completed ? 'success' : 'primary'}
          onClick={handleComplete}
          disabled={completed}
        >
          {completed ? 'Day Completed 🎉' : 'Mark Day as Completed'}
        </Button>
      </div>
    </Container>
  )
}

export default LearningSession
