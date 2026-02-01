import { Row, Col, Card } from 'react-bootstrap'
import { FaClock, FaFire, FaUsers, FaChartLine } from 'react-icons/fa'

const QuickStats = () => {
  const quickStats = [
    {
      label: 'Current Streak',
      value: '5 days',
      icon: FaFire,
      color: '#ef4444',
    },
    {
      label: 'Avg Daily Time',
      value: '2.4 hrs',
      icon: FaClock,
      color: '#06b6d4',
    },
    {
      label: 'Peer Rank',
      value: 'Top 15%',
      icon: FaUsers,
      color: '#3b82f6',
    },
    {
      label: 'Accuracy Trend',
      value: '↑ 12%',
      icon: FaChartLine,
      color: '#8b5cf6',
    },
  ]

  return (
    <Row className="g-3 mb-4">
      {quickStats.map((stat, i) => {
        const Icon = stat.icon
        return (
          <Col xs={12} sm={6} md={3} key={i}>
            <Card
              className="border-0 h-100"
              style={{ background: '#1e293b', borderRadius: '12px' }}
            >
              <Card.Body className="p-3">
                <div className="d-flex align-items-center mb-2">
                  <div
                    className="d-flex align-items-center justify-content-center me-2 rounded-circle"
                    style={{
                      width: 32,
                      height: 32,
                      background: 'rgba(255,255,255,0.05)',
                      color: stat.color,
                    }}
                  >
                    <Icon size={14} />
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                    {stat.label}
                  </div>
                </div>

                <div
                  className="fw-bold"
                  style={{ color: stat.color, fontSize: '1.25rem' }}
                >
                  {stat.value}
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
