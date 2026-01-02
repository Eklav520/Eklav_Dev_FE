import { Col, Container, Row } from 'react-bootstrap'
import { faqs } from '../data'

const Faqs = () => {
  return (
    <section className="pt-0">
      <Container className="mt-4">
        <Row className="mb-5">
          <Col md={8} className="text-center mx-auto">
            <h2>Frequently asked questions</h2>
            <p className="mb-0">Perceived end knowledge certainly day sweetness why cordially</p>
          </Col>
        </Row>
        <Row className="g-4 g-md-5">
          {faqs.map((faq, idx) => (
            <Col md={6} key={idx}>
              <h5>{faq.question}</h5>
              <p>{faq.answer}</p>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  )
}
export default Faqs
