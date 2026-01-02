import { Row, Col, Card, Badge } from 'react-bootstrap'
import MiniLineGraph from './charts/MiniLineGraph'
import { KPI } from './data/dashboard.data'

type Props = {
  kpis: KPI[]
}

// helper to detect trend color
const getTrendVariant = (trend: string) => {
  if (!trend) return 'secondary'
  if (trend.includes('+') || trend.includes('↑')) return 'success'
  if (trend.includes('-') || trend.includes('↓')) return 'danger'
  return 'secondary'
}

const KPISection = ({ kpis }: Props) => (
  <Row className="g-3 mb-4">
    {kpis.map((k, i) => {
      const Icon = k.icon
      const trendVariant = getTrendVariant(k.trend)

      return (
        <Col xs={12} sm={6} md={3} key={i}>
          <Card
            className="border-0 shadow-sm h-100"
            style={{
              borderTop: `4px solid var(--bs-${k.color})`,
              background: '#111417',
            }}
          >
            <Card.Body className="p-3">
              {/* ===== HEADER ===== */}
              <div className="d-flex align-items-center mb-3">
                <div
                  className="p-2 rounded-circle me-3"
                  style={{
                    background: k.bgColor,
                    color: `var(--bs-${k.color})`,
                  }}
                >
                  <Icon size={16} />
                </div>

                <div className="flex-grow-1">
                  <small className="text-muted">{k.label}</small>
                  <h4 className={`fw-bold text-${k.color} mb-0`}>
                    {k.value}
                  </h4>
                </div>

                {k.trend && (
                  <Badge bg={trendVariant} className="fw-normal">
                    {k.trend}
                  </Badge>
                )}
              </div>

              {/* ===== MINI GRAPH ===== */}
              <MiniLineGraph
                data={k.graphData || [2, 3, 1, 4, 2]}
                color={`var(--bs-${k.color})`}
              />
            </Card.Body>
          </Card>
        </Col>
      )
    })}
  </Row>
)

export default KPISection
