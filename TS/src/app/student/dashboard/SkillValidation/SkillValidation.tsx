// src/pages/SkillValidation/SkillValidation.tsx

import { Container, Card, Button } from 'react-bootstrap'
import ProjectCard from './ProjectCard'
import { phaseProjects } from './projects.data'

type SkillValidationProps = {
  phaseId: string
  onBack: () => void
  onStartInterview: () => void // 👈 NEW
}

const SkillValidation: React.FC<SkillValidationProps> = ({
  phaseId,
  onBack,
  onStartInterview,
}) => {
  const projects = phaseProjects[phaseId] || []

  return (
    <Container className="mt-5 mb-5">
      <Card className="p-4 shadow-lg mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <h4 className="fw-bold mb-0">🛠 Skill Validation</h4>
          <Button variant="outline-secondary" onClick={onBack}>
            ← Back to Roadmap
          </Button>
        </div>

        <p className="text-muted mt-2">
          Complete real-world projects to validate your skills
        </p>
      </Card>

      {projects.length === 0 && (
        <p className="text-muted">No projects for this phase yet.</p>
      )}

      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onSubmit={(id) =>
            alert(`Project ${id} submitted (MVP)`)
          }
        />
      ))}

      {/* ===== CTA ===== */}
      <div className="text-center mt-4">
        <Button size="lg" variant="primary" onClick={onStartInterview}>
          Take Mock Interview
        </Button>
      </div>
    </Container>
  )
}

export default SkillValidation
