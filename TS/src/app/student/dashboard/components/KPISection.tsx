import { Row, Col, Card, Badge } from 'react-bootstrap'
import { KPI } from './data/dashboard.data'
import { FaTrophy, FaGraduationCap } from 'react-icons/fa'

type RankData = {
  instituteValue: string
  instituteTotal: number
  overallValue: string
  overallTotal: number
  trend: string
}

type Props = {
  kpis: KPI[]
  rankData?: RankData
}

const KPISection = ({ kpis, rankData }: Props) => (
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
                <div
                  className="p-2 rounded-circle"
                  style={{ background: 'rgba(255,122,0,0.15)', color: '#ff7a00' }}
                >
                  <Icon size={18} />
                </div>
                {k.trend && (
                  <Badge
                    bg=""
                    style={{
                      backgroundColor: 'transparent',
                      color: '#ff7a00',
                      border: '1px solid #ff7a00',
                      fontSize: '0.75rem',
                      padding: '4px 10px',
                      borderRadius: '20px',
                    }}
                  >
                    {k.trend}
                  </Badge>
                )}
              </div>
              <div>
                <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{k.label}</div>
                <h3 className="fw-bold mb-0" style={{ color: 'white', fontSize: '1.7rem' }}>
                  {k.value}
                </h3>
              </div>
            </Card.Body>
          </Card>
        </Col>
      )
    })}

    {/* Rank card — shows both Institute Rank and Overall Rank */}
    {rankData && (
      <Col>
        <Card
          className="border-0 h-100"
          style={{
            background: '#1e293b',
            borderRadius: '16px',
            boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
          }}
        >
          <Card.Body className="p-3">
            <div className="d-flex align-items-start justify-content-between mb-2">
              <div
                className="p-2 rounded-circle"
                style={{ background: 'rgba(255,122,0,0.15)', color: '#ff7a00' }}
              >
                <FaTrophy size={18} />
              </div>
              {rankData.trend && (
                <Badge
                  bg=""
                  style={{
                    backgroundColor: 'transparent',
                    color: '#ff7a00',
                    border: '1px solid #ff7a00',
                    fontSize: '0.65rem',
                    padding: '3px 7px',
                    borderRadius: '20px',
                    maxWidth: '110px',
                    textAlign: 'center',
                    whiteSpace: 'normal',
                    lineHeight: '1.2',
                  }}
                >
                  {rankData.trend}
                </Badge>
              )}
            </div>

            <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '8px' }}>Rank</div>

            <div className="d-flex align-items-stretch gap-2">
              {/* Institute Rank */}
              <div style={{ flex: 1 }}>
                <div className="d-flex align-items-center gap-1 mb-1">
                  <FaTrophy size={10} style={{ color: '#fbbf24' }} />
                  <span style={{ color: '#fbbf24', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.5px' }}>
                    INSTITUTE
                  </span>
                </div>
                <div style={{ color: '#fbbf24', fontSize: '1.4rem', fontWeight: 700, lineHeight: 1 }}>
                  {rankData.instituteValue}
                </div>
                {rankData.instituteTotal > 0 && (
                  <div style={{ color: '#64748b', fontSize: '0.65rem', marginTop: '2px' }}>
                    of {rankData.instituteTotal}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div style={{ width: '1px', background: '#334155', alignSelf: 'stretch' }} />

              {/* Overall Rank */}
              <div style={{ flex: 1 }}>
                <div className="d-flex align-items-center gap-1 mb-1">
                  <FaGraduationCap size={10} style={{ color: '#818cf8' }} />
                  <span style={{ color: '#818cf8', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.5px' }}>
                    OVERALL
                  </span>
                </div>
                <div style={{ color: '#818cf8', fontSize: '1.4rem', fontWeight: 700, lineHeight: 1 }}>
                  {rankData.overallValue}
                </div>
                {rankData.overallTotal > 0 && (
                  <div style={{ color: '#64748b', fontSize: '0.65rem', marginTop: '2px' }}>
                    of {rankData.overallTotal}
                  </div>
                )}
              </div>
            </div>
          </Card.Body>
        </Card>
      </Col>
    )}
  </Row>
)

export default KPISection