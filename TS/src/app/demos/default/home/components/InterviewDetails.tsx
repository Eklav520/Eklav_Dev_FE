import { Accordion, Card, CardBody, CardHeader, CardTitle, Col, Row } from 'react-bootstrap'

const InterviewDetails = () => {
  return (
    <Card className="border bg-transparent rounded-3">
      <CardHeader className="bg-transparent border-bottom px-3">
        <Row className="g-4 align-items-center">
          <Col md={10}>
            <CardTitle as={'h3'} className="mb-0">
              <a href="#">Latest Interview Details</a>
            </CardTitle>
          </Col>
        </Row>
      </CardHeader>
      <CardBody className="p-4">
        <Accordion className="accordion-icon accordion-bg-light" id="accordionExample" defaultActiveKey={['0']}>
          <Accordion.Item eventKey="0">
            <Accordion.Header>DevOps Engineer – May 30, Chennai</Accordion.Header>
            <Accordion.Body>
              <p>
                <strong>Company:</strong> CloudNet
              </p>
              <p>
                <strong>Time:</strong> 10 AM – 2 PM
              </p>
              <p>
                <strong>Experience:</strong> 3–5 Years
              </p>
              <p>
                <strong>Venue:</strong> CloudNet Tech Park, Phase 2
              </p>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </CardBody>
    </Card>
  )
}

export default InterviewDetails
