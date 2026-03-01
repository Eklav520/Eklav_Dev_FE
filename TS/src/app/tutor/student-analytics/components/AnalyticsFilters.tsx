import { Card, Row, Col, Form } from 'react-bootstrap'

const AnalyticsFilters = () => {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1

  return (
    <Card className="mb-4">
      <Card.Body>
        <Row className="g-3">
          <Col xs={12} md={4}>
            <Form.Label>Year</Form.Label>
            <Form.Select size="sm">
              {[currentYear, currentYear - 1, currentYear - 2].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </Form.Select>
          </Col>
          <Col xs={12} md={4}>
            <Form.Label>Month</Form.Label>
            <Form.Select size="sm">
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <option key={month} value={month}>
                  {new Date(0, month - 1).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col xs={12} md={4}>
            <Form.Label>Course</Form.Label>
            <Form.Select size="sm">
              <option value="">All Courses</option>
            </Form.Select>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  )
}

export default AnalyticsFilters
