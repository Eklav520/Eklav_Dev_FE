// src/pages/LearningSession/TaskCard.tsx

import { Card, Badge } from 'react-bootstrap'
import { LearningTask } from './task.data'

const typeColor = {
  video: 'primary',
  reading: 'info',
  practice: 'success',
} as const

const TaskCard = ({ task }: { task: LearningTask }) => {
  return (
    <Card className="p-3 shadow-sm mb-3">
      <div className="d-flex justify-content-between align-items-center">
        <h6 className="fw-bold mb-0">{task.title}</h6>
        <Badge bg={typeColor[task.type]}>
          {task.type.toUpperCase()}
        </Badge>
      </div>

      <p className="text-muted mt-2 mb-1">
        {task.description}
      </p>

      <small>⏱ {task.duration} minutes</small>
    </Card>
  )
}

export default TaskCard
