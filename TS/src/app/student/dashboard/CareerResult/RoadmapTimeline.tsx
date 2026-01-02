import { Card, Badge } from 'react-bootstrap'

const RoadmapTimeline = ({ roadmap }: any) => {
  return (
    <Card className="p-4 shadow-sm">
      <h5 className="fw-bold mb-4">🛣️ Your Learning Roadmap</h5>

      {roadmap.map((step: any, index: number) => (
        <Card key={index} className="p-3 mb-3 border-start border-4 border-primary">
          <h6 className="fw-bold">{step.phase}</h6>
          <small className="text-muted">{step.duration}</small>
          <div className="mt-2">
            {step.skills.map((skill: string) => (
              <Badge key={skill} bg="info" className="me-2">
                {skill}
              </Badge>
            ))}
          </div>
        </Card>
      ))}
    </Card>
  )
}

export default RoadmapTimeline
