import { Row, Col, Card, Badge } from 'react-bootstrap'
import { KPI } from './data/dashboard.data'

type Props = {
  kpis: KPI[]
}

const KPISection = ({ kpis }: Props) => (
  <Row className="g-3 mb-4">
    {kpis.map((k, i) => {
      const Icon = k.icon

      return (
        <Col xs={12} sm={6} md={3} key={i}>
          <Card
            className="border-0 h-100"
            style={{
              background: '#1e293b',
              borderRadius: '12px',
            }}
          >
            <Card.Body className="p-3">
              <div className="d-flex align-items-start justify-content-between mb-2">
                <div
                  className="p-2 rounded-circle"
                  style={{
                    background: 'rgba(99, 102, 241, 0.1)',
                    color: `var(--bs-${k.color})`,
                  }}
                >
                  <Icon size={18} />
                </div>

                {k.trend && (
                  <Badge
                    style={{
                      background: '#10b981',
                      border: 'none',
                      fontSize: '0.75rem',
                      padding: '4px 8px',
                    }}
                  >
                    {k.trend}
                  </Badge>
                )}
              </div>

              <div>
                <div className="text-muted mb-1" style={{ fontSize: '0.85rem' }}>
                  {k.label}
                </div>
                <h3 className="fw-bold mb-0" style={{ color: 'white' }}>
                  {k.value}
                </h3>
              </div>
            </Card.Body>
          </Card>
        </Col>
      )
    })}
  </Row>
)

export default KPISection
