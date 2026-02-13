import { useState } from 'react'
import {
  Card,
  Button,
  Row,
  Col,
  Badge,
  Form,
} from 'react-bootstrap'
import {
  FaChartLine,
  FaDownload,
  FaChartPie,
  FaCalendarCheck,
} from 'react-icons/fa'

/* ================= DATA ================= */

const performanceTrendData = [
  { month: 'Jan', score: 62, rank: 150 },
  { month: 'Feb', score: 68, rank: 140 },
  { month: 'Mar', score: 75, rank: 124 },
  { month: 'Apr', score: 70, rank: 130 },
  { month: 'May', score: 82, rank: 110 },
  { month: 'Jun', score: 78, rank: 115 },
]

const attendanceByMonth: Record<string, Record<string, 'present' | 'absent'>> = {
  '2025-03': {
    '2025-03-01': 'present',
    '2025-03-02': 'absent',
    '2025-03-03': 'present',
    '2025-03-04': 'present',
    '2025-03-05': 'present',
  },
}

const getMonthDays = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  return { firstDay, daysInMonth }
}

/* ================= COMPONENT ================= */

const MonthlyReport = () => {
  const [selectedMonth, setSelectedMonth] = useState(2) // March
  const [selectedYear, setSelectedYear] = useState(2025)

  const monthKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`
  const monthInfo = getMonthDays(selectedYear, selectedMonth)
  const attendanceData = attendanceByMonth[monthKey] || {}

  const presentCount = Object.values(attendanceData).filter((s) => s === 'present').length
  const absentCount = Object.values(attendanceData).filter((s) => s === 'absent').length
  const attendancePercent = Math.round((presentCount / monthInfo.daysInMonth) * 100)

  return (
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
              <small className="opacity-75">March 2025 Analysis</small>
            </div>

            <div className="d-none d-md-block">
             {/*  <Button variant="light" size="sm" className="fw-bold me-2">
                <FaDownload className="me-2" />
                PDF
              </Button> */}
              <Button variant="outline-light" size="sm" className="fw-bold">
                <FaChartPie className="me-2" />
                Analytics
              </Button>
            </div>
          </Card.Header>

          <Card.Body className="p-3">
            <Row className="align-items-center">
              <Col xs={12} md={8}>
                <div style={{ height: 180 }}>
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
                        ${performanceTrendData
                          .map((d, i) => `${(i / 5) * 100},${100 - d.score}`)
                          .join(' ')}
                        100,100
                      `}
                    />

                    <polyline
                      fill="none"
                      stroke="#56ab2f"
                      strokeWidth="3"
                      points={performanceTrendData
                        .map((d, i) => `${(i / 5) * 100},${100 - d.score}`)
                        .join(' ')}
                    />
                  </svg>
                </div>

                <div className="d-flex justify-content-between mt-2">
                  {performanceTrendData.map((d) => (
                    <small key={d.month} className="text-muted">
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

              <Form.Select
                size="sm"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                style={{ width: 120 }}>
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i} value={i}>
                    {new Date(0, i).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </Form.Select>

              <Form.Select
                size="sm"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                style={{ width: 90 }}>
                {[2023, 2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </Form.Select>
            </div>
          </Card.Header>

          <Card.Body className="p-3">
            <div className="d-flex justify-content-between mb-3">
              <Badge bg="success">Present</Badge>
              <Badge bg="danger">Absent</Badge>
              <Badge bg="secondary">No Data</Badge>
            </div>

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

              {Array.from({ length: monthInfo.firstDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}

              {Array.from({ length: monthInfo.daysInMonth }, (_, i) => {
                const day = i + 1
                const dateKey = `${monthKey}-${String(day).padStart(2, '0')}`
                const status = attendanceData[dateKey]

                return (
                  <div
                    key={dateKey}
                    style={{
                      padding: 6,
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      background:
                        status === 'present'
                          ? '#d4edda'
                          : status === 'absent'
                          ? '#f8d7da'
                          : '#f1f3f5',
                      color:
                        status === 'present'
                          ? '#155724'
                          : status === 'absent'
                          ? '#721c24'
                          : '#6c757d',
                    }}>
                    {day}
                  </div>
                )
              })}
            </div>

            <div className="d-flex justify-content-between mt-3 small text-muted">
              <span>Present: {presentCount}</span>
              <span>Absent: {absentCount}</span>
              <span>{attendancePercent}%</span>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  )
}

export default MonthlyReport