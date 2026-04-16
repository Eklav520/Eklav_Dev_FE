import { Row, Col, Card, Badge } from 'react-bootstrap'
import { KPI } from './data/dashboard.data'

type Props = {
  kpis: KPI[]
}

const KPISection = ({ kpis }: Props) => (
  <Row className="g-3 mb-4 row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-5">
    {kpis.map((k, i) => {
      const Icon = k.icon

      return (
        <Col key={i}>
          <Card
            className="border-0 h-100"
            style={{
              background: '#1e293b',
              borderRadius: '16px',
              boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
            }}
          >
            <Card.Body className="p-3">
              <div className="d-flex align-items-start justify-content-between mb-3">

                {/* Icon Circle */}
                <div
                  className="p-2 rounded-circle"
                  style={{
                    background: 'rgba(255,122,0,0.15)',
                    color: '#ff7a00',
                  }}
                >
                  <Icon size={18} />
                </div>

                {/* Trend Badge */}
                {k.trend && (
                  <Badge
                    bg=""
                    className=""
                    style={{
                      backgroundColor: 'transparent',
                      color: '#ff7a00',
                      border: '1px solid #ff7a00',
                      fontSize: '0.75rem',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      boxShadow: 'none',
                    }}
                  >
                    {k.trend}
                  </Badge>
                )}
              </div>

              <div>
                <div
                  style={{
                    color: '#94a3b8',
                    fontSize: '0.85rem',
                  }}
                >
                  {k.label}
                </div>

                <h3
                  className="fw-bold mb-0"
                  style={{
                    color: 'white',
                    fontSize: '1.7rem',
                  }}
                >
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