import { useState } from 'react'
import { Card, Form, Spinner } from 'react-bootstrap'
import { FaMicrophone } from 'react-icons/fa'
import { useEnglishDashboardHistory } from '../components/hooks/useEnglishDashboardHistory'
import { getScoreByMode } from '../components/utils/englishDashboard'
import { EnglishSection } from '../components/hooks/useEnglishDashboardHistory'

type Mode = 'Today' | 'Weekly' | 'Overall'

const skills: {
  key: EnglishSection
  label: string
  icon: string
  color: string
}[] = [
  { key: 'SPEAKING', label: 'Speaking', icon: '🎤', color: '#8b5cf6' },
  { key: 'WRITING', label: 'Writing', icon: '✍️', color: '#8b5cf6' },
  { key: 'READING', label: 'Reading', icon: '📖', color: '#8b5cf6' },
  { key: 'LISTENING', label: 'Listening', icon: '👂', color: '#8b5cf6' },
  { key: 'JUST_A_MINUTE', label: 'Grammar', icon: '📝', color: '#8b5cf6' },
]

const EnglishSkills = () => {
  const [mode, setMode] = useState<Mode>('Weekly')
  const { data, loading } = useEnglishDashboardHistory()

  if (loading) {
    return (
      <Card className="h-100 d-flex justify-content-center align-items-center">
        <Spinner />
      </Card>
    )
  }

  if (!data) {
    return <Card className="p-3">Failed to load English skills</Card>
  }

  // Radar chart renderer
  const renderRadarChart = () => {
    const scores = skills.map((skill) => getScoreByMode(data[skill.key], mode))
    const maxScore = 100
    const centerX = 150
    const centerY = 150
    const radius = 100
    const angleStep = (Math.PI * 2) / skills.length

    // Calculate points
    const points = scores.map((score, i) => {
      const angle = angleStep * i - Math.PI / 2
      const distance = (score / maxScore) * radius
      return {
        x: centerX + distance * Math.cos(angle),
        y: centerY + distance * Math.sin(angle),
      }
    })

    // Calculate max points for background grid
    const maxPoints = skills.map((_, i) => {
      const angle = angleStep * i - Math.PI / 2
      return {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        label: skills[i].label,
      }
    })

    return (
      <svg width="100%" viewBox="0 0 300 300" style={{ maxWidth: '300px', margin: '0 auto', display: 'block' }}>
        {/* Background grid circles */}
        {[0.2, 0.4, 0.6, 0.8, 1].map((scale, i) => (
          <polygon
            key={i}
            points={maxPoints
              .map((p) => {
                const x = centerX + (p.x - centerX) * scale
                const y = centerY + (p.y - centerY) * scale
                return `${x},${y}`
              })
              .join(' ')}
            fill="none"
            stroke="#475569"
            strokeWidth="1"
            opacity="0.3"
          />
        ))}

        {/* Grid lines from center */}
        {maxPoints.map((p, i) => (
          <line key={i} x1={centerX} y1={centerY} x2={p.x} y2={p.y} stroke="#475569" strokeWidth="1" opacity="0.3" />
        ))}

        {/* Data polygon */}
        <polygon
          points={points.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="#8b5cf6"
          fillOpacity="0.3"
          stroke="#8b5cf6"
          strokeWidth="2"
        />

        {/* Data points */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4" fill="#8b5cf6" />
        ))}

        {/* Labels */}
        {maxPoints.map((p, i) => {
          const angle = angleStep * i - Math.PI / 2
          const labelDistance = radius + 30
          const labelX = centerX + labelDistance * Math.cos(angle)
          const labelY = centerY + labelDistance * Math.sin(angle)

          return (
            <text
              key={i}
              x={labelX}
              y={labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#94a3b8"
              fontSize="12"
              fontWeight="500"
            >
              {p.label}
            </text>
          )
        })}
      </svg>
    )
  }

  const overallScore = Math.round(skills.reduce((sum, s) => sum + getScoreByMode(data[s.key], mode), 0) / skills.length) || 0

  return (
    <Card className="border-0 h-100" style={{ background: '#2563eb', borderRadius: '12px' }}>
      {/* HEADER */}
      <Card.Header className="border-0 text-white py-3">
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0 fw-bold">
            <FaMicrophone className="me-2" />
            English Skills
          </h6>

          <Form.Select 
            size="sm" 
            style={{ 
              width: 100, 
              background: '#1e40af',
              color: 'white',
              border: 'none',
              fontSize: '0.85rem'
            }} 
            value={mode} 
            onChange={(e) => setMode(e.target.value as Mode)}
          >
            <option>Weekly</option>
          </Form.Select>
        </div>
      </Card.Header>

      {/* BODY */}
      <Card.Body className="d-flex flex-column" style={{ background: '#1e3a5f' }}>
        {/* SUMMARY */}
        <div className="d-flex justify-content-between mb-3 text-white">
          <div>
            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Overall Score</div>
            <div className="fw-bold" style={{ fontSize: '1.5rem' }}>{overallScore}%</div>
          </div>
          <div className="text-end">
            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Rank</div>
            <div className="fw-bold" style={{ fontSize: '1.5rem', color: '#60a5fa' }}>—</div>
          </div>
        </div>

        {/* RADAR CHART */}
        <div className="flex-grow-1 d-flex align-items-center justify-content-center">
          {renderRadarChart()}
        </div>
      </Card.Body>
    </Card>
  )
}

export default EnglishSkills
