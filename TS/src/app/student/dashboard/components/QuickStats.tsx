import { Row, Col, Card } from 'react-bootstrap'
import { FaClock, FaFire, FaUsers, FaChartLine } from 'react-icons/fa'

const QuickStats = () => {
  const quickStats = [
    {
      label: 'Current Streak',
      value: '5 days',
      icon: FaFire,
      color: '#FF6B6B',
    },
    {
      label: 'Avg Daily Time',
      value: '2.4 hrs',
      icon: FaClock,
      color: '#4ECDC4',
    },
    {
      label: 'Peer Rank',
      value: 'Top 15%',
      icon: FaUsers,
      color: '#45B7D1',
    },
    {
      label: 'Accuracy Trend',
      value: '↑ 12%',
      icon: FaChartLine,
      color: '#96CEB4',
    },
  ]

  return (
    <Row className="g-3 mb-4">
      {quickStats.map((stat, i) => {
        const Icon = stat.icon
        return (
          <Col xs={12} sm={6} md={3} key={i}>
            <Card
              className="border-0 shadow-sm h-100"
              style={{ background: '#111417' }}
            >
              <Card.Body className="d-flex align-items-center p-3">
                {/* ICON */}
                <div
                  className="d-flex align-items-center justify-content-center me-3 rounded-circle"
                  style={{
                    width: 40,
                    height: 40,
                    background: 'rgba(255,255,255,0.05)',
                    color: stat.color,
                  }}
                >
                  <Icon size={18} />
                </div>

                {/* TEXT */}
                <div>
                  <div
                    className="fw-bold"
                    style={{ color: stat.color, lineHeight: 1.2 }}
                  >
                    {stat.value}
                  </div>
                  <small className="text-muted">{stat.label}</small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        )
      })}
    </Row>
  )
}

export default QuickStats
