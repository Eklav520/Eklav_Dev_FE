// src/pages/SkillValidation/ProjectCard.tsx

import { Card, Badge, Button } from 'react-bootstrap'
import { MiniProject } from './projects.data'

type Props = {
  project: MiniProject
  onSubmit: (projectId: string) => void
}

const ProjectCard: React.FC<Props> = ({ project, onSubmit }) => {
  return (
    <Card className="p-4 shadow-sm mb-3">
      <h5 className="fw-bold">{project.title}</h5>
      <p className="text-muted">{project.description}</p>

      <div className="mb-2">
        {project.skills.map((s) => (
          <Badge key={s} bg="info" className="me-2">
            {s}
          </Badge>
        ))}
      </div>

      <Badge bg={project.difficulty === 'Easy' ? 'success' : 'warning'}>
        {project.difficulty}
      </Badge>

      <div className="mt-3">
        <Button onClick={() => onSubmit(project.id)}>
          Submit Project
        </Button>
      </div>
    </Card>
  )
}

export default ProjectCard
