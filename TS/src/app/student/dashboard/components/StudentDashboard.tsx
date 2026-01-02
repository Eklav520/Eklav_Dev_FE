import React, { useState } from 'react'
import { Container, Row, Col, Card, ProgressBar, Badge, Button, Form } from 'react-bootstrap'
import {
  FaUserCircle,
  FaClock,
  FaBookOpen,
  FaBullseye,
  FaDownload,
  FaRobot,
  FaMicrophone,
  FaBell,
  FaChartLine,
  FaTrophy,
  FaGraduationCap,
  FaCalendarCheck,
  FaFire,
  FaUsers,
  FaChartPie,
  FaClipboardList,
} from 'react-icons/fa'
import { BsPatchCheckFill, BsGraphUp } from 'react-icons/bs'

/* ---------------- Dummy Data ---------------- */

const student = {
  name: 'Jagadeesh K',
  completion: 17,
}

type UpdateType = 'info' | 'success' | 'warning'

/* KPI */
const kpis = [
  { label: 'Hours Spent', value: '18 min', icon: <FaClock />, color: 'primary', bgColor: 'rgba(13, 110, 253, 0.1)', trend: '+2%' },
  { label: 'Courses', value: '1', icon: <FaBookOpen />, color: 'success', bgColor: 'rgba(25, 135, 84, 0.1)', trend: '+1' },
  { label: 'Accuracy', value: '78%', icon: <FaBullseye />, color: 'warning', bgColor: 'rgba(255, 193, 7, 0.1)', trend: '+5%' },
  { label: 'Rank', value: '#124', icon: <FaTrophy />, color: 'info', bgColor: 'rgba(13, 202, 240, 0.1)', trend: '↑12' },
]

/* Courses */
const courses = [
  {
    name: 'Full Stack MERN',
    status: 'In Progress',
    rank: 124,
    progress: 65,
    color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    skills: [
      { skill: 'React', progress: 85, color: '#667eea' },
      { skill: 'Node.js', progress: 72, color: '#24c6dc' },
      { skill: 'MongoDB', progress: 68, color: '#f46b45' },
      { skill: 'JavaScript', progress: 92, color: '#56ab2f' },
    ],
  },
  {
    name: 'Python',
    status: 'In Progress',
    rank: 88,
    progress: 48,
    color: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)',
    skills: [
      { skill: 'Basics', progress: 70, color: '#f7971e' },
      { skill: 'OOP', progress: 52, color: '#ffb347' },
    ],
  },
  {
    name: 'Power BI',
    status: 'Not Started',
    rank: 0,
    progress: 0,
    color: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    skills: [],
  },
]

/* Graph Data */
const weeklyProgressData = [
  { day: 'Mon', hours: 2.5, score: 65 },
  { day: 'Tue', hours: 3.2, score: 70 },
  { day: 'Wed', hours: 1.8, score: 58 },
  { day: 'Thu', hours: 4.1, score: 82 },
  { day: 'Fri', hours: 2.9, score: 75 },
  { day: 'Sat', hours: 3.5, score: 88 },
  { day: 'Sun', hours: 2.0, score: 72 },
]

const timeDistributionData = [
  { name: 'Coding', value: 35, color: '#4e54c8' },
  { name: 'Theory', value: 25, color: '#24c6dc' },
  { name: 'Practice', value: 20, color: '#f46b45' },
  { name: 'Projects', value: 15, color: '#834d9b' },
  { name: 'Revision', value: 5, color: '#56ab2f' },
]

const performanceTrendData = [
  { month: 'Jan', score: 62, rank: 150 },
  { month: 'Feb', score: 68, rank: 140 },
  { month: 'Mar', score: 75, rank: 124 },
  { month: 'Apr', score: 70, rank: 130 },
  { month: 'May', score: 82, rank: 110 },
  { month: 'Jun', score: 78, rank: 115 },
]

type AttendanceStatus = 'present' | 'absent'
type AttendanceMap = Record<string, AttendanceStatus>

const attendanceByMonth: Record<string, AttendanceMap> = {
  '2025-03': {
    '2025-03-01': 'present',
    '2025-03-02': 'absent',
    '2025-03-03': 'present',
    '2025-03-04': 'present',
    '2025-03-05': 'absent',
    '2025-03-06': 'present',
    '2025-03-07': 'present',
  },
}

const getMonthDays = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  return { firstDay, daysInMonth }
}

type GrammarSkill = 'Speaking' | 'Listening' | 'Writing'
type GrammarMode = 'Today' | 'Weekly' | 'Overall'

/* English Grammar */
const grammarData: Record<GrammarMode, Record<GrammarSkill, number>> & { lastPracticed: string } = {
  Today: {
    Speaking: 58,
    Listening: 61,
    Writing: 64,
  },
  Weekly: {
    Speaking: 56,
    Listening: 89,
    Writing: 74,
  },
  Overall: {
    Speaking: 72,
    Listening: 60,
    Writing: 68,
  },
  lastPracticed: '22 Feb 2025',
}

const grammarRankByMode: Record<GrammarMode, number> = {
  Today: 112,
  Weekly: 72,
  Overall: 58,
}

const grammarSkillRanks: Record<GrammarSkill, number> = {
  Speaking: 124,
  Listening: 18,
  Writing: 52,
}

/* Self Preparation */
const selfPrep = {
  aiInterview: {
    Today: { score: 55, rank: 110 },
    Weekly: { score: 62, rank: 72 },
  },
  coding: {
    easy: 12,
    medium: 5,
    hard: 1,
    rank: 220,
  },
  aptitude: {
    marks: 70,
    rank: 95,
  },
}

/* Admin Updates */
const adminUpdates: {
  text: string
  date: string
  type: UpdateType
}[] = [
  { text: 'New Aptitude Test released', date: 'Today', type: 'info' },
  { text: 'AI Interview v2 is live', date: '2 days ago', type: 'success' },
  { text: 'English Speaking mock on Friday', date: '1 week ago', type: 'warning' },
]

/* Quick Stats */
const quickStats = [
  { label: 'Current Streak', value: '5 days', icon: <FaFire />, color: '#FF6B6B' },
  { label: 'Avg Daily Time', value: '2.4 hrs', icon: <FaClock />, color: '#4ECDC4' },
  { label: 'Peer Rank', value: 'Top 15%', icon: <FaUsers />, color: '#45B7D1' },
  { label: 'Accuracy Trend', value: '↑ 12%', icon: '📈', color: '#96CEB4' },
]

/* ---------------- Component ---------------- */

const StudentDashboard: React.FC = () => {
  const [grammarMode, setGrammarMode] = useState<'Today' | 'Weekly' | 'Overall'>('Weekly')
  const [aiMode, setAiMode] = useState<'Today' | 'Weekly'>('Weekly')
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 2))
  const [activeCourseIndex, setActiveCourseIndex] = useState(0)
  const activeCourse = courses[activeCourseIndex]
  const grammarRank = grammarRankByMode[grammarMode]
  const [selectedYear, setSelectedYear] = useState(2025)
  const [selectedMonth, setSelectedMonth] = useState(2) // 0 = Jan

  const grammarTrendData: Record<GrammarSkill, number[]> = {
    Speaking: [48, 52, 55, 58, 62, 72],
    Listening: [50, 55, 58, 60, 64, 60],
    Writing: [45, 50, 56, 60, 64, 68],
  }

  // Helper function to create a simple SVG line graph
  const renderMiniLineGraph = (data: number[], color: string) => {
    const max = Math.max(...data)
    const min = Math.min(...data)
    const range = max - min || 1 // Prevent division by zero

    return (
      <svg width="100%" height="60" style={{ overflow: 'visible' }}>
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          points={data.map((d, i) => `${(i * 100) / (data.length - 1)},${60 - ((d - min) / range) * 50}`).join(' ')}
        />
        {data.map((d, i) => (
          <circle key={i} cx={(i * 100) / (data.length - 1)} cy={60 - ((d - min) / range) * 50} r="2" fill={color} />
        ))}
      </svg>
    )
  }

  // Helper function to create a simple bar chart
  const renderBarChart = (data: { level: string; solved: number; color: string }[]) => {
    const maxSolved = Math.max(...data.map((d) => d.solved), 1)

    return (
      <div className="d-flex justify-content-between" style={{ height: 160 }}>
        {data.map((item) => {
          const heightPercent = (item.solved / maxSolved) * 100

          return (
            <div key={item.level} className="d-flex flex-column align-items-center" style={{ width: '30%' }}>
              {/* BAR CONTAINER (IMPORTANT) */}
              <div
                style={{
                  height: 110,
                  width: '100%',
                  display: 'flex',
                  alignItems: 'flex-end',
                }}>
                {/* ACTUAL BAR */}
                <div
                  className="rounded-top"
                  style={{
                    width: '70%',
                    height: `${heightPercent}%`,
                    backgroundColor: item.color,
                    margin: '0 auto',
                    transition: 'height 0.4s ease',
                  }}
                />
              </div>

              {/* VALUE */}
              <div className="fw-bold mt-2">{item.solved}</div>

              {/* LABEL */}
              <div className="text-muted small">{item.level}</div>
            </div>
          )
        })}
      </div>
    )
  }

  // Helper function to create a pie chart
  const renderPieChart = (data: { name: string; value: number; color: string }[]) => {
    const total = data.reduce((sum, item) => sum + item.value, 0)
    let cumulativePercent = 0

    return (
      <svg width="120" height="120" viewBox="0 0 120 120">
        {data.map((item, i) => {
          const percent = (item.value / total) * 100
          const startAngle = cumulativePercent * 3.6
          cumulativePercent += percent
          const endAngle = cumulativePercent * 3.6

          // Calculate points for the arc
          const x1 = 60 + 50 * Math.cos((Math.PI * startAngle) / 180)
          const y1 = 60 + 50 * Math.sin((Math.PI * startAngle) / 180)
          const x2 = 60 + 50 * Math.cos((Math.PI * endAngle) / 180)
          const y2 = 60 + 50 * Math.sin((Math.PI * endAngle) / 180)

          const largeArcFlag = percent > 50 ? 1 : 0

          return (
            <path key={i} d={`M 60 60 L ${x1} ${y1} A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2} Z`} fill={item.color} stroke="white" strokeWidth="2" />
          )
        })}
        <circle cx="60" cy="60" r="20" fill="white" />
        <text x="60" y="60" textAnchor="middle" dy=".3em" fontSize="14" fontWeight="bold">
          {total}h
        </text>
      </svg>
    )
  }

  // Helper function to create a line chart
  const renderLineChart = (data: { day: string; hours: number; score: number }[]) => {
    const maxHours = Math.max(...data.map((d) => d.hours))
    const maxScore = Math.max(...data.map((d) => d.score))

    return (
      <div style={{ height: '250px', position: 'relative', paddingLeft: '40px' }}>
        {/* Y-axis labels for Hours */}
        <div className="position-absolute start-0 top-0 h-100 d-flex flex-column justify-content-between pe-2 border-end">
          {[4, 3, 2, 1, 0].map((num) => (
            <div key={num} className="small text-muted" style={{ fontSize: '12px' }}>
              {num}h
            </div>
          ))}
        </div>

        {/* Y-axis labels for Score */}
        <div className="position-absolute end-0 top-0 h-100 d-flex flex-column justify-content-between ps-2 border-start">
          {[100, 75, 50, 25, 0].map((num) => (
            <div key={num} className="small text-muted" style={{ fontSize: '12px' }}>
              {num}%
            </div>
          ))}
        </div>

        {/* Chart container */}
        <div className="position-absolute start-4 end-4 top-0 h-100">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((y) => (
            <div
              key={y}
              className="position-absolute start-0 end-0 border-top"
              style={{
                top: `${y}%`,
                opacity: 0.1,
                borderColor: '#dee2e6',
              }}></div>
          ))}

          {/* Hours line */}
          <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
            <polyline
              fill="none"
              stroke="#667eea"
              strokeWidth="3"
              points={data.map((d, i) => `${(i * 100) / (data.length - 1)},${100 - (d.hours / maxHours) * 100}`).join(' ')}
            />
            {data.map((d, i) => (
              <circle
                key={i}
                cx={(i * 100) / (data.length - 1)}
                cy={100 - (d.hours / maxHours) * 100}
                r="6"
                fill="#667eea"
                stroke="white"
                strokeWidth="2"
              />
            ))}
          </svg>

          {/* Score line */}
          <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
            <polyline
              fill="none"
              stroke="#f46b45"
              strokeWidth="3"
              points={data.map((d, i) => `${(i * 100) / (data.length - 1)},${100 - (d.score / maxScore) * 100}`).join(' ')}
            />
            {data.map((d, i) => (
              <circle
                key={i}
                cx={(i * 100) / (data.length - 1)}
                cy={100 - (d.score / maxScore) * 100}
                r="6"
                fill="#f46b45"
                stroke="white"
                strokeWidth="2"
              />
            ))}
          </svg>

          {/* X-axis labels */}
          <div className="position-absolute bottom-0 start-0 end-0 d-flex justify-content-between mt-2">
            {data.map((d, i) => (
              <div key={i} className="small text-muted" style={{ fontSize: '12px' }}>
                {d.day}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="position-absolute top-0 end-0" style={{ paddingRight: '20px' }}>
          <div className="d-flex align-items-center mb-2">
            <div className="rounded-circle me-2" style={{ width: '12px', height: '12px', background: '#667eea' }}></div>
            <small className="fw-bold" style={{ fontSize: '12px' }}>
              Study Hours
            </small>
          </div>
          <div className="d-flex align-items-center">
            <div className="rounded-circle me-2" style={{ width: '12px', height: '12px', background: '#f46b45' }}></div>
            <small className="fw-bold" style={{ fontSize: '12px' }}>
              Score %
            </small>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Container
      fluid
      className="p-3 p-md-4"
      style={{
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        minHeight: '100vh',
      }}>
      {/* ================= HERO ================= */}
      <Card
        className="border-0 shadow-lg mb-4"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
        }}>
        <Card.Body className="p-3 p-md-4">
          <Row className="align-items-center">
            <Col xs={12} md={2} className="text-center mb-3 mb-md-0">
              <div className="position-relative d-inline-block">
                <div
                  className="avatar-wrapper"
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '36px',
                    color: 'white',
                  }}>
                  JK
                </div>
                <Badge bg="success" className="position-absolute bottom-0 end-0" style={{ fontSize: '10px' }}>
                  <BsPatchCheckFill /> Active
                </Badge>
              </div>
            </Col>
            <Col xs={12} md={6} className="mb-3 mb-md-0">
              <h4 className="fw-bold mb-1">{student.name}</h4>
              <small className="opacity-75">Full Stack Developer Student</small>
              <div className="mt-3">
                <div className="d-flex justify-content-between mb-1">
                  <span>Profile Completion</span>
                  <span>{student.completion}%</span>
                </div>
                <ProgressBar now={student.completion} style={{ height: '8px', borderRadius: '5px' }} variant="light" />
              </div>
            </Col>
            <Col xs={12} md={4} className="text-md-end">
              <Button variant="light" className="fw-bold me-2 mb-2 mb-md-0">
                <FaUserCircle className="me-2" /> Edit Profile
              </Button>
              <Button variant="outline-light" className="fw-bold">
                <FaChartLine className="me-2" /> View Stats
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* ================= KPI WITH GRAPHS ================= */}
      <Row className="g-3 mb-4">
        {kpis.map((k, i) => (
          <Col xs={12} sm={6} md={3} key={i}>
            <Card
              className="border-0 shadow-sm h-100"
              style={{
                borderTop: `4px solid var(--bs-${k.color})`,
                transition: 'transform 0.3s ease',
              }}>
              <Card.Body className="p-3">
                <div className="d-flex align-items-center mb-3">
                  <div
                    className="p-2 rounded-circle me-3"
                    style={{
                      background: k.bgColor,
                      color: `var(--bs-${k.color})`,
                    }}>
                    {k.icon}
                  </div>
                  <div className="flex-grow-1">
                    <small className="text-muted">{k.label}</small>
                    <h4 className={`fw-bold text-${k.color} mb-0`}>{k.value}</h4>
                  </div>
                  <Badge bg={k.color} className="fw-normal">
                    {k.trend}
                  </Badge>
                </div>

                {/* Mini Graph */}
                <div style={{ height: '50px', marginTop: '10px' }}>{renderMiniLineGraph([2.5, 3.2, 1.8, 4.1, 2.9], `var(--bs-${k.color})`)}</div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* ================= QUICK STATS ================= */}
      <Row className="g-3 mb-4">
        {quickStats.map((stat, i) => (
          <Col xs={6} sm={3} key={i}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="p-3">
                <div className="d-flex align-items-center">
                  <div className="me-3" style={{ color: stat.color, fontSize: '20px' }}>
                    {stat.icon}
                  </div>
                  <div>
                    <h6 className="fw-bold mb-0" style={{ color: stat.color }}>
                      {stat.value}
                    </h6>
                    <small className="text-muted" style={{ fontSize: '12px' }}>
                      {stat.label}
                    </small>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* ================= MAIN CONTENT ================= */}
      <Row className="g-3 mb-4">
        {/* Courses */}
        <Col xs={12} lg={4} className="mb-3 mb-lg-0">
          <Card className="border-0 shadow-sm h-100">
            <Card.Header
              className="border-0 text-white py-3"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}>
              <h5 className="mb-0 fw-bold">
                <FaGraduationCap className="me-2" />
                Course Progress
              </h5>
            </Card.Header>
            <Card.Body className="p-3">
              {/* ③ COURSE SWITCHER */}
              <div className="d-flex gap-2 mb-3 flex-wrap">
                {courses.map((course, index) => (
                  <Badge
                    key={course.name}
                    bg={index === activeCourseIndex ? 'primary' : 'secondary'}
                    pill
                    style={{ cursor: 'pointer' }}
                    onClick={() => setActiveCourseIndex(index)}>
                    {course.name}
                  </Badge>
                ))}
              </div>

              {/* ④ ACTIVE COURSE INFO */}
              <div className="text-center mb-4">
                <div className="rounded p-3 text-white" style={{ background: activeCourse.color }}>
                  <h6 className="fw-bold mb-2">{activeCourse.name}</h6>
                  <Badge
                    pill
                    className="fw-semibold"
                    style={{
                      background: 'rgba(255,255,255,0.85)',
                      color: '#111',
                    }}>
                    {activeCourse.status}
                  </Badge>
                </div>
              </div>

              {/* ⑤ COURSE PROGRESS */}
              <div className="mb-4">
                <div className="d-flex justify-content-between mb-2">
                  <span className="fw-bold" style={{ fontSize: 14 }}>
                    Progress: {activeCourse.progress}%
                  </span>
                  <span className="text-muted" style={{ fontSize: 14 }}>
                    {activeCourse.rank ? `#${activeCourse.rank} Rank` : '--'}
                  </span>
                </div>

                <ProgressBar now={activeCourse.progress} label={`${activeCourse.progress}%`} style={{ height: 12, borderRadius: 6 }} />
              </div>

              {/* SKILL LEVELS */}
              {activeCourse.skills.length > 0 && (
                <div className="mt-4">
                  <h6 className="fw-bold mb-3" style={{ fontSize: 16 }}>
                    Skill Levels
                  </h6>

                  {activeCourse.skills.map((item, index) => (
                    <div key={index} className="mb-3">
                      <div className="d-flex justify-content-between mb-1">
                        <span className="fw-bold" style={{ fontSize: 14 }}>
                          {item.skill}
                        </span>
                        <span style={{ color: item.color, fontSize: 14 }}>{item.progress}%</span>
                      </div>

                      <ProgressBar style={{ height: 8, borderRadius: 4 }}>
                        <ProgressBar
                          now={item.progress}
                          style={{
                            background: item.color,
                            borderRadius: 4,
                          }}
                        />
                      </ProgressBar>
                    </div>
                  ))}
                </div>
              )}

              {/* EMPTY STATE */}
              {activeCourse.skills.length === 0 && <div className="text-muted text-center mt-4">No skills started yet</div>}
            </Card.Body>
          </Card>
        </Col>

        {/* English Grammar */}
        <Col xs={12} lg={4} className="mb-3 mb-lg-0">
          <Card className="border-0 shadow-sm h-100 d-flex flex-column">
            {/* ===== Header ===== */}
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

                <Form.Select
                  size="sm"
                  className="bg-white text-dark fw-bold"
                  style={{ width: 110, fontSize: '14px' }}
                  value={grammarMode}
                  onChange={(e) => setGrammarMode(e.target.value as GrammarMode)}>
                  <option value="Today">Today</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Overall">Overall</option>
                </Form.Select>
              </div>
            </Card.Header>

            {/* ===== Body ===== */}
            <Card.Body className="px-3 py-3 d-flex flex-column flex-grow-1">
              {/* ===== Summary ===== */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <div className="text-muted small">Overall Score</div>
                  <div className="fw-bold fs-4">
                    {Math.round((grammarData[grammarMode].Speaking + grammarData[grammarMode].Listening + grammarData[grammarMode].Writing) / 3)}%
                  </div>
                </div>

                <div className="text-end">
                  <div className="text-muted small">Rank</div>
                  <div className="fw-bold fs-4 text-primary">#{grammarRank}</div>
                </div>
              </div>

              {/* ===== Skills ===== */}
              <div className="d-flex flex-column gap-2">
                {(Object.keys(grammarSkillRanks) as GrammarSkill[]).map((skill) => {
                  const colors: Record<GrammarSkill, string> = {
                    Speaking: '#FF6B6B',
                    Listening: '#4ECDC4',
                    Writing: '#45B7D1',
                  }

                  const icons: Record<GrammarSkill, string> = {
                    Speaking: '🎤',
                    Listening: '👂',
                    Writing: '✍️',
                  }

                  const value = grammarData[grammarMode][skill]
                  const rank = grammarSkillRanks[skill]

                  return (
                    <div
                      key={skill}
                      className="d-flex align-items-center rounded px-3"
                      style={{
                        minHeight: 78,
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}>
                      {/* Skill */}
                      <div className="d-flex align-items-center gap-2" style={{ width: 130 }}>
                        <span style={{ fontSize: 16 }}>{icons[skill]}</span>
                        <span className="fw-semibold small">{skill}</span>
                      </div>

                      {/* Graph */}
                      <div className="flex-grow-1 px-2 d-flex align-items-center" style={{ height: 56 }}>
                        {renderMiniLineGraph(grammarTrendData[skill], colors[skill])}
                      </div>

                      {/* Score */}
                      <div className="fw-bold text-end" style={{ width: 60, color: colors[skill] }}>
                        {value}%
                      </div>

                      {/* Rank */}
                      <div className="text-muted small text-end" style={{ width: 55 }}>
                        #{rank}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* ===== FLEX SPACER (keeps equal height with other cards) ===== */}
              <div className="flex-grow-1" />
            </Card.Body>
          </Card>
        </Col>

        {/* Self Prep */}
        <Col xs={12} lg={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header
              className="border-0 text-white py-3"
              style={{
                background: 'linear-gradient(135deg, #f46b45 0%, #eea849 100%)',
              }}>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold">
                  <FaRobot className="me-2" />
                  Self Preparation
                </h5>
                <Form.Select
                  size="sm"
                  className="bg-white text-dark fw-bold"
                  style={{ width: 110, fontSize: '14px' }}
                  value={aiMode}
                  onChange={(e) => setAiMode(e.target.value as any)}>
                  <option value="Today">Today</option>
                  <option value="Weekly">Weekly</option>
                </Form.Select>
              </div>
            </Card.Header>
            <Card.Body className="p-3">
              {/* AI Interview Score */}
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="fw-bold mb-0" style={{ fontSize: '15px' }}>
                    🤖 AI Interview
                  </h6>
                  <Badge bg="warning" className="fw-bold">
                    {selfPrep.aiInterview[aiMode].score}%
                  </Badge>
                </div>
                <ProgressBar now={selfPrep.aiInterview[aiMode].score} variant="warning" style={{ height: '8px', borderRadius: '4px' }} />
                <div className="text-end small text-muted mt-1" style={{ fontSize: '12px' }}>
                  Rank #{selfPrep.aiInterview[aiMode].rank}
                </div>
              </div>

              {/* Coding Challenges Bar Chart */}
              <div className="mb-4">
                <h6 className="fw-bold mb-3" style={{ fontSize: '15px' }}>
                  💻 Code Challenge Stats
                </h6>
                {renderBarChart([
                  { level: 'Easy', solved: selfPrep.coding.easy, color: '#28a745' },
                  { level: 'Medium', solved: selfPrep.coding.medium, color: '#ffc107' },
                  { level: 'Hard', solved: selfPrep.coding.hard, color: '#dc3545' },
                ])}
              </div>

              {/* Time Distribution Pie Chart */}
              <div className="text-center">
                <h6 className="fw-bold mb-3" style={{ fontSize: '15px' }}>
                  ⏰ Time Distribution
                </h6>
                <div className="d-flex justify-content-center">{renderPieChart(timeDistributionData)}</div>
                <div className="d-flex flex-wrap justify-content-center gap-2 mt-3">
                  {timeDistributionData.map((item, index) => (
                    <div key={index} className="d-flex align-items-center me-2">
                      <div className="rounded-circle me-1" style={{ width: '10px', height: '10px', background: item.color }}></div>
                      <small style={{ fontSize: '11px' }}>{item.name}</small>
                    </div>
                  ))}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ================= CHARTS SECTION ================= */}
      <Row className="g-3 mb-4">
        {/* Weekly Performance Chart */}
        <Col xs={12} lg={8} className="mb-3 mb-lg-0">
          <Card className="border-0 shadow-sm h-100">
            <Card.Header
              className="border-0 text-white py-3"
              style={{
                background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 100%)',
              }}>
              <h5 className="mb-0 fw-bold">
                <BsGraphUp className="me-2" />
                Weekly Performance Analytics
              </h5>
            </Card.Header>
            <Card.Body className="p-3">{renderLineChart(weeklyProgressData)}</Card.Body>
          </Card>
        </Col>

        {/* Admin Updates + Attendance */}
        <Col xs={12} lg={4}>
          <Row className="g-3">
            {/* ================= Updates & Notifications ================= */}
            <Col xs={12}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Header
                  className="border-0 text-white py-3"
                  style={{
                    background: 'linear-gradient(135deg, #8e44ad 0%, #c653d5 100%)',
                  }}>
                  <h5 className="mb-0 fw-bold d-flex align-items-center">
                    <FaBell className="me-2" />
                    Updates & Notifications
                  </h5>
                </Card.Header>

                <Card.Body className="p-0">
                  {adminUpdates.map((u, i) => {
                    const iconMap = {
                      info: <FaClipboardList />,
                      success: <FaRobot />,
                      warning: <FaMicrophone />,
                    }

                    const badgeVariant = u.type === 'success' ? 'success' : u.type === 'warning' ? 'warning' : 'info'

                    return (
                      <div
                        key={i}
                        className="d-flex align-items-start gap-3 px-3 py-3 border-bottom"
                        style={{
                          background: i === 0 ? '#f8f9fa' : '#fff',
                        }}>
                        {/* Icon */}
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center"
                          style={{
                            width: 36,
                            height: 36,
                            background: '#eef1f6',
                            color: '#6f42c1',
                            fontSize: 16,
                          }}>
                          {iconMap[u.type]}
                        </div>

                        {/* Content */}
                        <div className="flex-grow-1">
                          <div className="fw-semibold" style={{ fontSize: 14 }}>
                            {u.text}
                          </div>
                          <div className="small text-muted d-flex align-items-center mt-1">
                            <FaClock className="me-1" size={11} /> {u.date}
                          </div>
                        </div>

                        {/* Badge */}
                        <Badge bg={badgeVariant} pill className="align-self-start">
                          New
                        </Badge>
                      </div>
                    )
                  })}
                </Card.Body>
              </Card>
            </Col>

            {/* ================= Quick Stats ================= */}
            <Col xs={12}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="text-center p-3">
                  <div className="d-flex justify-content-around">
                    <div>
                      <div className="fw-bold text-primary fs-5">85%</div>
                      <small className="text-muted">Attendance</small>
                    </div>
                    <div>
                      <div className="fw-bold text-success fs-5">18</div>
                      <small className="text-muted">Active Days</small>
                    </div>
                    <div>
                      <div className="fw-bold text-warning fs-5">5</div>
                      <small className="text-muted">Streak</small>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
      {/* ================= MONTHLY REPORT + ATTENDANCE ================= */}
      <Row className="g-3 mt-3">
        {/* ===== Monthly Performance Report ===== */}
        <Col xs={12} lg={8}>
          <Card className="border-0 shadow-lg h-100">
            <Card.Header
              className="border-0 text-white d-flex justify-content-between align-items-center py-3"
              style={{
                background: 'linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)',
              }}>
              <div>
                <h5 className="mb-0 fw-bold">
                  <FaChartLine className="me-2" />
                  Monthly Performance Report
                </h5>
                <small className="opacity-75" style={{ fontSize: 12 }}>
                  March 2025 Analysis
                </small>
              </div>

              <div className="d-none d-md-block">
                <Button variant="light" size="sm" className="fw-bold me-2">
                  <FaDownload className="me-2" /> PDF
                </Button>
                <Button variant="outline-light" size="sm" className="fw-bold">
                  <FaChartPie className="me-2" /> Analytics
                </Button>
              </div>
            </Card.Header>

            <Card.Body className="p-3">
              <Row className="align-items-center">
                <Col xs={12} md={8}>
                  <div style={{ height: 180 }}>
                    {/* AREA CHART (unchanged logic) */}
                    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#56ab2f" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#56ab2f" stopOpacity="0" />
                        </linearGradient>
                      </defs>

                      <polygon
                        fill="url(#areaGradient)"
                        points={`
                    0,100
                    ${performanceTrendData.map((d, i) => `${(i / 5) * 100},${100 - d.score}`).join(' ')}
                    100,100
                  `}
                      />

                      <polyline
                        fill="none"
                        stroke="#56ab2f"
                        strokeWidth="3"
                        points={performanceTrendData.map((d, i) => `${(i / 5) * 100},${100 - d.score}`).join(' ')}
                      />
                    </svg>
                  </div>

                  <div className="d-flex justify-content-between mt-2">
                    {performanceTrendData.map((d, i) => (
                      <small key={i} className="text-muted">
                        {d.month}
                      </small>
                    ))}
                  </div>
                </Col>

                <Col xs={12} md={4}>
                  <div className="text-center">
                    <div style={{ fontSize: 42 }}>📈</div>
                    <h6 className="fw-bold">Overall Score</h6>
                    <div className="display-6 fw-bold text-success">78%</div>
                    <small className="text-muted">+12% from last month</small>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        {/* ===== Attendance / Timesheet ===== */}
        <Col xs={12} lg={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="fw-bold d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <FaCalendarCheck />

                {/* Month Select */}
                <Form.Select size="sm" value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} style={{ width: 120 }}>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <option key={i} value={i}>
                      {new Date(0, i).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </Form.Select>

                {/* Year Select */}
                <Form.Select size="sm" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} style={{ width: 90 }}>
                  {Array.from({ length: 5 }, (_, i) => 2023 + i).map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </Form.Select>
              </div>
            </Card.Header>

            <Card.Body className="p-3">
              {/* Legend */}
              <div className="d-flex justify-content-between mb-3">
                <Badge bg="success">Present</Badge>
                <Badge bg="danger">Absent</Badge>
                <Badge bg="secondary">No Data</Badge>
              </div>

              {/* Calendar */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: 6,
                  textAlign: 'center',
                }}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => (
                  <div key={d} className="fw-bold text-muted small">
                    {d}
                  </div>
                ))}

                {Array.from({ length: getMonthDays(2025, 2).firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}

                {Array.from({ length: getMonthDays(2025, 2).daysInMonth }, (_, i) => {
                  const day = i + 1
                  const dateKey = `2025-03-${String(day).padStart(2, '0')}`
                  const status = attendanceByMonth['2025-03']?.[dateKey]

                  return (
                    <div
                      key={dateKey}
                      style={{
                        padding: 6,
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        background: status === 'present' ? '#d4edda' : status === 'absent' ? '#f8d7da' : '#f1f3f5',
                        color: status === 'present' ? '#155724' : status === 'absent' ? '#721c24' : '#6c757d',
                      }}>
                      {day}
                    </div>
                  )
                })}
              </div>

              {/* Summary */}
              <div className="d-flex justify-content-between mt-3 small text-muted">
                <span>Present: {Object.values(attendanceByMonth['2025-03']).filter((s) => s === 'present').length}</span>
                <span>Absent: {Object.values(attendanceByMonth['2025-03']).filter((s) => s === 'absent').length}</span>
                <span>
                  {Math.round(
                    (Object.values(attendanceByMonth['2025-03']).filter((s) => s === 'present').length / getMonthDays(2025, 2).daysInMonth) * 100,
                  )}
                  %
                </span>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default StudentDashboard
