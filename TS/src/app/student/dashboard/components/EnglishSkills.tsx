import { useState } from 'react'
import { Card, Form, Spinner } from 'react-bootstrap'
import { FaMicrophone } from 'react-icons/fa'
import { useEnglishDashboardHistory } from '../components/hooks/useEnglishDashboardHistory'
import { getScoreByMode, getTrendData } from '../components/utils/englishDashboard'
import { EnglishSection } from '../components/hooks/useEnglishDashboardHistory'

type Mode = 'Today' | 'Weekly' | 'Overall'

const skills: {
  key: EnglishSection
  label: string
  icon: string
  color: string
}[] = [
  { key: 'SPEAKING', label: 'Speaking', icon: '🎤', color: '#FF6B6B' },
  { key: 'LISTENING', label: 'Listening', icon: '👂', color: '#4ECDC4' },
  { key: 'READING', label: 'Reading', icon: '📖', color: '#FFD166' },
  { key: 'WRITING', label: 'Writing', icon: '✍️', color: '#45B7D1' },
  { key: 'JUST_A_MINUTE', label: 'Just a Minute', icon: '⏱️', color: '#A78BFA' },
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

  // ✅ SVG Mini Line Graph (Improved & Stable)
const renderMiniLineGraph = (data: number[], color: string) => {
  if (!data || data.length === 0) {
    return <div style={{ height: 80 }} />
  }

  const safeData = data.length === 1 ? [data[0], data[0]] : data

  const max = Math.max(...safeData)
  const min = Math.min(...safeData)
  const range = max - min || 1

  const HEIGHT = 80
  const PADDING = 10

  return (
    <svg width="100%" height={HEIGHT} viewBox={`0 0 100 ${HEIGHT}`}>
      {/* Line */}
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={safeData
          .map((d, i) => {
            const x = (i * 100) / (safeData.length - 1)
            const y =
              HEIGHT -
              PADDING -
              ((d - min) / range) * (HEIGHT - PADDING * 2)
            return `${x},${y}`
          })
          .join(' ')}
      />

      {/* Dots */}
      {safeData.map((d, i) => {
        const x = (i * 100) / (safeData.length - 1)
        const y =
          HEIGHT -
          PADDING -
          ((d - min) / range) * (HEIGHT - PADDING * 2)

        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="4"
            fill={color}
            stroke="#111"
            strokeWidth="1"
          />
        )
      })}
    </svg>
  )
}


  const overallScore = Math.round(skills.reduce((sum, s) => sum + getScoreByMode(data[s.key], mode), 0) / skills.length) || 0

  return (
    <Card className="border-0 shadow-sm h-100">
      {/* HEADER */}
      <Card.Header
        className="border-0 text-white py-3"
        style={{
          background: 'linear-gradient(135deg, #24c6dc 0%, #514a9d 100%)',
        }}>
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0 fw-bold">
            <FaMicrophone className="me-2" />
            English Skills
          </h5>

          <Form.Select size="sm" style={{ width: 110 }} value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
            <option>Today</option>
            <option>Weekly</option>
            <option>Overall</option>
          </Form.Select>
        </div>
      </Card.Header>

      {/* BODY */}
      <Card.Body className="d-flex flex-column gap-3">
        {/* SUMMARY */}
        <div className="d-flex justify-content-between">
          <div>
            <div className="text-muted small">Overall Score</div>
            <div className="fw-bold fs-4">{overallScore}%</div>
          </div>
          <div className="text-end">
            <div className="text-muted small">Rank</div>
            <div className="fw-bold fs-4 text-primary">—</div>
          </div>
        </div>

        {/* SKILLS */}
        {skills.map((skill) => {
          const section = data[skill.key]
          const trend = getTrendData(section, mode)
          const score = getScoreByMode(section, mode)

          return (
            <div
              key={skill.key}
              className="d-flex align-items-center px-3 py-2 rounded"
              style={{
                background: 'rgba(0,0,0,0.03)',
                border: '1px solid rgba(0,0,0,0.08)',
              }}>
              {/* Skill */}
              <div style={{ width: 150 }}>
                <span className="me-2">{skill.icon}</span>
                <strong>{skill.label}</strong>
              </div>

              {/* Graph */}
              <div className="flex-grow-1 px-2" style={{ height: 60 }}>
                {renderMiniLineGraph(trend, skill.color)}
              </div>

              {/* Score */}
              <div style={{ width: 60, color: skill.color }} className="fw-bold text-end">
                {score}%
              </div>
            </div>
          )
        })}
      </Card.Body>
    </Card>
  )
}

export default EnglishSkills
