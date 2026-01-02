import { Accordion, AccordionBody, AccordionHeader, AccordionItem, Col, Container, Row } from 'react-bootstrap'
import { faqsData } from '../data'

const Faqs = () => {
  return (
    <section className="pt-0 pt-md-5">
      <Container>
        <Row className="g-4">
          <Col lg={6} xl={5}>
            <h2 className="fs-1">Frequently Asked Questions</h2>
            <p className="mb-0">
              We are answering the most frequent questions. No worries if you do not find the exact one. You can find out more by searching or
              continuing by clicking the button below or directly
              <a href="#" className="text-decoration-underline">
                Contact our supports
              </a>
            </p>
          </Col>
          <Col lg={6} className="ms-xl-auto">
            <Accordion defaultActiveKey="0" className="accordion-icon accordion-bg-light" id="accordionFaq">
              {faqsData.map((faq, idx) => (
                <AccordionItem eventKey={`${idx}`} className="mb-2" key={idx}>
                  <AccordionHeader>
                    <div className="fw-bold">{faq.question}</div>
                  </AccordionHeader>
                  <AccordionBody>{faq.answer}</AccordionBody>
                </AccordionItem>
              ))}
            </Accordion>
          </Col>
        </Row>
      </Container>
    </section>
  )
}

export default Faqs
