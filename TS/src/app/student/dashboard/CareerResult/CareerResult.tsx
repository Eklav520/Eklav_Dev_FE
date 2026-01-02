import { Container, Card, Badge, Button, Row, Col } from 'react-bootstrap'
import RoadmapTimeline from './RoadmapTimeline'
import CareerCard from './CareerCard'
import { CareerProfile } from '../career'

/* ================= PROPS ================= */

type CareerResultProps = {
  careerProfile: CareerProfile
  onEdit: () => void
  onStartLearning: () => void
}

/* ================= TEMP MOCK LOGIC ================= */
/* Later this will come from backend based on careerProfile */

const buildCareerResult = (profile: CareerProfile) => {
  return {
    primaryCareer: 'Full Stack Developer',
    duration: '8–12 Months',
    salaryRange: '₹12–25 LPA',
    regions: profile.locations.length ? profile.locations : ['India'],
    whyThisPath: [
      `Matches your interest in ${profile.interests.join(', ')}`,
      `Fits your ${profile.dailyTime} availability`,
      'High global demand',
      'Strong long-term salary growth',
    ],
    roadmap: [
      {
        phase: 'Phase 1: Foundations',
        duration: 'Weeks 1–6',
        skills: ['HTML', 'CSS', 'JavaScript'],
      },
      {
        phase: 'Phase 2: Core Skills',
        duration: 'Weeks 7–16',
        skills: ['React', 'Node.js', 'Databases'],
      },
      {
        phase: 'Phase 3: Advanced & Projects',
        duration: 'Weeks 17–32',
        skills: ['System Design', 'Projects', 'Interview Prep'],
      },
    ],
    alternatives: ['Frontend Developer', 'AI Engineer'],
  }
}

/* ================= COMPONENT ================= */

const CareerResult: React.FC<CareerResultProps> = ({ careerProfile, onEdit,onStartLearning, }) => {
  const careerResult = buildCareerResult(careerProfile)

  return (
    <Container className="mt-5 mb-5">
      {/* ===== Header ===== */}
      <Card className="p-4 shadow-lg mb-4">
        <h3 className="fw-bold">🎯 Your Best Career Path</h3>
        <p className="text-muted">Based on your interests, goals, and availability</p>

        <Row className="mt-3">
          <Col md={6}>
            <h4 className="fw-bold text-primary">{careerResult.primaryCareer}</h4>
            <p className="mb-2">
              ⏱ <strong>Duration:</strong> {careerResult.duration}
            </p>
            <p className="mb-2">
              💰 <strong>Expected Package:</strong> {careerResult.salaryRange}
            </p>
            <p>
              📍 <strong>Best Regions:</strong>{' '}
              {careerResult.regions.map((r: any) => (
                <Badge key={r} bg="secondary" className="me-2">
                  {r}
                </Badge>
              ))}
            </p>
          </Col>

          <Col md={6}>
            <h6 className="fw-bold">Why this path?</h6>
            <ul>
              {careerResult.whyThisPath.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </Col>
        </Row>
      </Card>

      {/* ===== Roadmap ===== */}
      <RoadmapTimeline roadmap={careerResult.roadmap} />

      {/* ===== Alternatives ===== */}
      <Card className="p-4 shadow-sm mt-4">
        <h5 className="fw-bold">🔁 Alternative Career Options</h5>
        <Row className="mt-3">
          {careerResult.alternatives.map((alt) => (
            <Col md={6} key={alt}>
              <CareerCard title={alt} />
            </Col>
          ))}
        </Row>
      </Card>

      {/* ===== CTA ===== */}
      <div className="text-center mt-5 d-flex justify-content-center gap-3">
        <Button size="lg" variant="success" onClick={onStartLearning}>
          Start My Learning Path
        </Button>

        <Button size="lg" variant="outline-secondary" onClick={onEdit}>
          Edit Preferences
        </Button>
      </div>
    </Container>
  )
}

export default CareerResult
