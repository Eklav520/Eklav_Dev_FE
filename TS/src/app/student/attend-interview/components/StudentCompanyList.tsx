import React, { useEffect, useState } from 'react'
import { Card, Col, Row, Button, Spinner } from 'react-bootstrap'
import axios from 'axios'

interface Company {
  _id: string
  name: string
  logoUrl: string
}

interface Props {
  onSelectCompany: (company: Company) => void
}

const StudentCompanyList: React.FC<Props> = ({ onSelectCompany }) => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios
      .get(`${baseURL}/companies`)
      .then((res) => setCompanies(res.data))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <h4 className="mt-3 mb-4 fw-bold text-light">Company Based Assessment</h4>

      {loading ? (
        <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
          <Spinner animation="border" role="status" />
        </div>
      ) : (
        <Row xs={1} sm={2} md={3} lg={4} xl={5} className="g-4">
          {companies.map((company) => (
            <Col key={company._id}>
              <Card
                className="h-100 shadow-sm border-0 rounded-3"
                style={{ transition: 'transform 0.2s, box-shadow 0.2s' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-5px)'
                  ;(e.currentTarget as HTMLElement).style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)'
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                  ;(e.currentTarget as HTMLElement).style.boxShadow = '0 2px 6px rgba(0,0,0,0.1)'
                }}
              >
                <div
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    height: 160,
                    backgroundColor: '#f8f9fa',
                    borderTopLeftRadius: '0.5rem',
                    borderTopRightRadius: '0.5rem',
                  }}
                >
                  {company.logoUrl ? (
                    <img
                      src={company.logoUrl}
                      alt={company.name}
                      style={{ maxHeight: '120px', maxWidth: '90%', objectFit: 'contain' }}
                    />
                  ) : (
                    <small className="text-muted">No Logo</small>
                  )}
                </div>

                <Card.Body className="d-flex flex-column justify-content-between">
                  <Card.Title className="text-center mb-3">{company.name}</Card.Title>
                  <Button
                    variant="primary"
                    onClick={() => onSelectCompany(company)}
                    className="w-100 fw-semibold"
                  >
                    Start Interview
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </>
  )
}

export default StudentCompanyList
