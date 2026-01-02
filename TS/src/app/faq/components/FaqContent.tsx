import { Accordion, AccordionBody, AccordionHeader, AccordionItem, Card, Col, Container, Row } from 'react-bootstrap'
import { FaCaretRight } from 'react-icons/fa'
import { questionsData, QuestionsType, topicData, TopicType } from '../data'

const QuestionsCard = ({ description, id, title }: QuestionsType) => {
  return (
    <AccordionItem eventKey={id} className=" mb-3">
      <AccordionHeader className="accordion-header font-base " id="heading-1">
        <div className="fw-bold">{title}</div>
      </AccordionHeader>
      <AccordionBody className="accordion-body mt-3">{description}</AccordionBody>
    </AccordionItem>
  )
}

const TopicCard = ({ title, totalCourse }: TopicType) => {
  return (
    <div className="d-flex justify-content-between align-items-center mb-2">
      <a href="#" className="h6 fw-light">
        <FaCaretRight className="text-orange me-2" />
        {title}
      </a>
      <span className="small">({totalCourse})</span>
    </div>
  )
}

const FaqContent = () => {
  return (
    <section className="pt-5 pb-0 pb-lg-5">
      <Container>
        <Row className="g-4 g-md-5">
          <Col lg={8}>
            <h3 className="mb-4">Frequently Asked Questions</h3>
            <Accordion className="accordion accordion-icon accordion-bg-light" id="accordionExample2">
              {questionsData.map((item, idx) => (
                <QuestionsCard {...item} key={idx} />
              ))}
            </Accordion>
          </Col>
          <Col lg={4}>
            <Row className="mb-5 mb-lg-0">
              <Col xs={12} sm={6} lg={12}>
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center bg-info bg-opacity-10 rounded p-2 position-relative mb-3">
                    <h6 className="m-0 text-info">Last Question</h6>
                    <a href="#" className="badge bg-info stretched-link">
                      2D ago
                    </a>
                  </div>
                  <div className="d-flex justify-content-between align-items-center bg-danger bg-opacity-10 rounded p-2 position-relative mb-3">
                    <h6 className="m-0 text-danger">Total Question</h6>
                    <a href="#" className="badge bg-danger stretched-link">
                      15,525
                    </a>
                  </div>
                  <div className="d-flex justify-content-between align-items-center bg-success bg-opacity-10 rounded p-2 position-relative mb-3">
                    <h6 className="m-0 text-success">Answer</h6>
                    <a href="#" className="badge bg-success stretched-link">
                      12536
                    </a>
                  </div>
                </div>
                <Card className="card-body shadow p-4 mb-4">
                  <h4 className="mb-3">Related Topic</h4>
                  {topicData.map((item, idx) => (
                    <TopicCard {...item} key={idx} />
                  ))}
                </Card>
              </Col>
              <Col xs={12} sm={6} lg={12}>
                <Card className="card-body shadow p-4">
                  <h4 className="mb-3">Popular Tags</h4>
                  <ul className="list-inline mb-0">
                    <li className="list-inline-item">
                      <a className="btn btn-outline-light btn-sm" href="#">
                        blog
                      </a>
                    </li>
                    <li className="list-inline-item">
                      <a className="btn btn-outline-light btn-sm" href="#">
                        business
                      </a>
                    </li>
                    <li className="list-inline-item">
                      <a className="btn btn-outline-light btn-sm" href="#">
                        theme
                      </a>
                    </li>
                    <li className="list-inline-item">
                      <a className="btn btn-outline-light btn-sm" href="#">
                        bootstrap
                      </a>
                    </li>
                    <li className="list-inline-item">
                      <a className="btn btn-outline-light btn-sm" href="#">
                        data science
                      </a>
                    </li>
                    <li className="list-inline-item">
                      <a className="btn btn-outline-light btn-sm" href="#">
                        web development
                      </a>
                    </li>
                    <li className="list-inline-item">
                      <a className="btn btn-outline-light btn-sm" href="#">
                        tips
                      </a>
                    </li>
                    <li className="list-inline-item">
                      <a className="btn btn-outline-light btn-sm" href="#">
                        machine learning
                      </a>
                    </li>
                  </ul>
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>
    </section>
  )
}

export default FaqContent
