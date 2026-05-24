import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Col, Row, Badge, Button, Form, InputGroup } from 'react-bootstrap'
import { BsBookmark, BsSearch, BsArrowRight, BsGrid, BsPerson, BsLightbulb } from 'react-icons/bs'
import { careerRoadmaps, type CareerRoadmap } from '../data/roadmaps'

const ROLE_ICONS: Record<string, string> = {
  // Role-Based
  'web-developer': '🌐',
  'full-stack-developer': '⚡',
  'android-developer': '📱',
  'ios-developer': '🍎',
  'data-scientist': '📊',
  'ai-engineer': '🤖',
  'backend-developer': '🛠️',
  'devops-engineer': '☁️',
  'machine-learning': '🧠',
  'deep-learning': '🔬',
  'developer-relations': '🎙️',
  'engineering-manager': '👔',
  'game-developer': '🎮',
  'ml-engineer': '⚙️',
  'nlp-engineer': '💬',
  'product-manager': '📋',
  // Skill-Based
  'linux': '🐧',
  'docker': '🐳',
  'kubernetes': '☸️',
  'git-github': '🐙',
  'javascript': '⚡',
  'mongodb': '🍃',
  'react': '⚛️',
  'typescript': '📘',
  'openai-apis': '🔮',
  'claude-code': '🤖',
  'vibe-coding': '🎵',
}

const RoadmapCard = ({ roadmap }: { roadmap: CareerRoadmap }) => {
  const navigate = useNavigate()

  return (
    <Card
      className="h-100 border position-relative"
      style={{
        borderRadius: '12px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'box-shadow 0.2s',
        borderTop: `3px solid ${roadmap.color} !important`,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.12)')}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
      onClick={() => navigate(`/student/career-roadmap/${roadmap.id}`)}
    >
      {/* Color top bar */}
      <div style={{ height: '4px', backgroundColor: roadmap.color }} />

      <Card.Body className="p-3 d-flex flex-column">
        {/* Header row */}
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className="d-flex align-items-center gap-2">
            {/* Icon */}
            <div
              className="d-flex align-items-center justify-content-center rounded-2"
              style={{ width: 40, height: 40, backgroundColor: roadmap.color + '18', fontSize: 20 }}
            >
              {ROLE_ICONS[roadmap.id] ?? '📌'}
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <Badge
              className="text-uppercase fw-semibold"
              style={{ backgroundColor: roadmap.color + '22', color: roadmap.color, fontSize: '10px', letterSpacing: '0.05em' }}
            >
              {roadmap.type}
            </Badge>
            <BsBookmark style={{ color: '#aaa', cursor: 'pointer', fontSize: 14 }} />
          </div>
        </div>

        {/* Title */}
        <h6 className="fw-bold mb-1" style={{ fontSize: '15px', lineHeight: 1.3 }}>
          {roadmap.title}
        </h6>

        {/* Description */}
        <p className="text-muted mb-0" style={{ fontSize: '12px', lineHeight: 1.5, flex: 1 }}>
          {roadmap.description}
        </p>

        {/* Footer */}
        <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
          <span className="text-muted d-flex align-items-center gap-1" style={{ fontSize: '12px' }}>
            <span style={{ fontSize: 13 }}>📋</span>
            {roadmap.totalTopics} topics
          </span>
          <Button
            size="sm"
            className="d-flex align-items-center gap-1 px-3"
            style={{
              backgroundColor: roadmap.color,
              borderColor: roadmap.color,
              fontSize: '12px',
              fontWeight: 600,
            }}
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/student/career-roadmap/${roadmap.id}`)
            }}
          >
            Start <BsArrowRight />
          </Button>
        </div>
      </Card.Body>
    </Card>
  )
}

const CareerRoadmapList = () => {
  const [search, setSearch] = useState('')
  const [activeType, setActiveType] = useState<'ALL' | 'ROLE' | 'SKILL'>('ALL')

  const filtered = careerRoadmaps.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase())
    const matchesType = activeType === 'ALL' || r.type === activeType
    return matchesSearch && matchesType
  })

  const roleRoadmaps = filtered.filter((r) => r.type === 'ROLE')
  const skillRoadmaps = filtered.filter((r) => r.type === 'SKILL')

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 gap-3">
        <div>
          <h4 className="fw-bold mb-1">Career Roadmaps</h4>
          <p className="text-muted mb-0" style={{ fontSize: '14px' }}>
            Choose your career path and follow a structured learning journey
          </p>
        </div>

        {/* Search */}
        <InputGroup style={{ maxWidth: 320 }}>
          <InputGroup.Text className="bg-transparent">
            <BsSearch style={{ color: '#ff7a00' }} />
          </InputGroup.Text>
          <Form.Control
            placeholder="Search roadmaps, skills, roles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent"
          />
        </InputGroup>
      </div>

      {/* Type Filter Tabs */}
      <div className="d-flex gap-2 mb-4 flex-wrap">
        {(['ALL', 'ROLE', 'SKILL'] as const).map((type) => {
          const icon = type === 'ALL' ? <BsGrid size={13} /> : type === 'ROLE' ? <BsPerson size={13} /> : <BsLightbulb size={13} />
          const count = type === 'ALL' ? careerRoadmaps.length : careerRoadmaps.filter((r) => r.type === type).length
          return (
            <Button
              key={type}
              size="sm"
              variant={activeType === type ? 'dark' : 'outline-secondary'}
              className="d-flex align-items-center gap-1 px-3"
              style={{ borderRadius: '20px', fontSize: '13px' }}
              onClick={() => setActiveType(type)}
            >
              {icon}
              {type === 'ALL' ? 'All Roadmaps' : type === 'ROLE' ? 'Role-Based' : 'Skill-Based'}
              <Badge bg={activeType === type ? 'light' : 'secondary'} text={activeType === type ? 'dark' : 'light'} style={{ fontSize: '10px' }}>
                {count}
              </Badge>
            </Button>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-5 text-muted">
          <p>No roadmaps found matching "<strong>{search}</strong>"</p>
        </div>
      )}

      {/* Role-Based Section */}
      {roleRoadmaps.length > 0 && (
        <div className="mb-5">
          <div className="d-flex align-items-center gap-2 mb-3">
            <BsPerson size={18} className="text-muted" />
            <h5 className="fw-bold mb-0">Role-Based Roadmaps</h5>
            <Badge bg="secondary" style={{ fontSize: '11px' }}>{roleRoadmaps.length}</Badge>
            <span className="text-muted" style={{ fontSize: '13px' }}>· Master the full toolkit for a specific role</span>
          </div>
          <Row className="g-3">
            {roleRoadmaps.map((roadmap) => (
              <Col key={roadmap.id} xs={12} sm={6} lg={4} xl={3}>
                <RoadmapCard roadmap={roadmap} />
              </Col>
            ))}
          </Row>
        </div>
      )}

      {/* Skill-Based Section */}
      {skillRoadmaps.length > 0 && (
        <div className="mb-4">
          <div className="d-flex align-items-center gap-2 mb-3">
            <BsLightbulb size={18} className="text-muted" />
            <h5 className="fw-bold mb-0">Skill-Based Roadmaps</h5>
            <Badge bg="secondary" style={{ fontSize: '11px' }}>{skillRoadmaps.length}</Badge>
            <span className="text-muted" style={{ fontSize: '13px' }}>· Deep dive into a specific technology or skill</span>
          </div>
          <Row className="g-3">
            {skillRoadmaps.map((roadmap) => (
              <Col key={roadmap.id} xs={12} sm={6} lg={4} xl={3}>
                <RoadmapCard roadmap={roadmap} />
              </Col>
            ))}
          </Row>
        </div>
      )}
    </div>
  )
}

export default CareerRoadmapList
