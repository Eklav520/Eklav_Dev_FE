import { Accordion, AccordionBody, AccordionHeader, AccordionItem, Col, Container, Row } from 'react-bootstrap'
import { faqs } from '../data'

const Faqs = () => {
  return (
    <section className="position-relative overflow-hidden pt-0 pt-sm-5">
      <Container>
        <Row className="position-relative z-index-9">
          <Col xs={12} className="text-center mx-auto">
            <h2 className="mb-0">Frequently Asked Questions</h2>
          </Col>
        </Row>
        <Row>
          <Col lg={10} xl={8} className="mx-auto text-center position-relative">
            <figure className="position-absolute top-0 start-0 translate-middle ms-8">
              <svg>
                <path
                  className="fill-success"
                  d="M137.7,53.1c9.6,29.3,1.8,64.7-20.2,80.7s-58.1,12.6-83.5-5.8C8.6,109.5-6.1,76.1,2.4,48.7 C10.8,21.1,42.2-0.7,71.5,0S128.1,23.8,137.7,53.1z"
                />
              </svg>
            </figure>
            <figure className="position-absolute bottom-0 end-0 me-n9 rotate-193">
              <svg width="297.5px" height="295.9px">
                <path
                  stroke="#F99D2B"
                  fill="none"
                  strokeWidth={13}
                  d="M286.2,165.5c-9.8,74.9-78.8,128.9-153.9,120.4c-76-8.6-131.4-78.2-122.8-154.2C18.2,55.8,87.8,0.3,163.7,9"
                />
              </svg>
            </figure>
            <Accordion defaultActiveKey="0" className="accordion-icon accordion-shadow mt-4 text-start position-relative" id="accordionExample2">
              {faqs.map((faq, idx) => (
                <AccordionItem eventKey={`${idx}`} className="mb-3" key={idx}>
                  <AccordionHeader>
                    <div className="fw-bold">{faq.question}</div>
                  </AccordionHeader>
                  <AccordionBody className="mt-3">{faq.answer}</AccordionBody>
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
