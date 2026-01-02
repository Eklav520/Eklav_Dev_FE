import { Button, Card, CardBody, CardTitle, Col, Container, Row } from 'react-bootstrap'
import { FaAngleRight } from 'react-icons/fa'

import eventImg1 from '@/assets/images/event/01.jpg'
import eventImg2 from '@/assets/images/event/02.jpg'
import eventImg3 from '@/assets/images/event/03.jpg'

const LatestNews = () => {
  return (
    <section>
      <Container>
        <Row className="mb-4">
          <div className="d-md-flex justify-content-md-between align-items-center">
            <h2 className="mb-2 mb-md-0">Eklav Latest News</h2>
            <div>
              <span className="me-2">Want to read more?</span>
              <Button variant="primary-soft" size="sm" className=" mb-0">
                Go here
                <FaAngleRight className="ms-2" />
              </Button>
            </div>
          </div>
        </Row>
        <Row className="g-4">
          <Col md={6} lg={4}>
            <Card className="bg-transparent">
              <div className="overflow-hidden rounded-3">
                <img src={eventImg2} className="card-img" alt="Card image" />
                <div className="bg-overlay bg-dark opacity-4" />
                <div className="card-img-overlay d-flex align-items-start flex-column p-3">
                  <span role="button" className="badge text-bg-danger">
                    Student life
                  </span>
                </div>
              </div>
              <CardBody className="px-3">
                <CardTitle>
                  <a href="#">Student Loan Survey: Many Owe $50K-plus</a>
                </CardTitle>
                <p className="text-truncate-2">
                  Affronting imprudence do he he everything. Offered chiefly farther of my no colonel shyness. Such on help ye some door if in.
                  Laughter proposal laughing any son law consider. Needed except up piqued an.
                </p>
                <div className="d-flex justify-content-between">
                  <h6 className="mb-0">
                    <a href="#">Frances Guerrero</a>
                  </h6>
                  <span className="small">30M Ago</span>
                </div>
              </CardBody>
            </Card>
          </Col>
          <Col md={6} lg={8}>
            <Row className="g-4">
              <Col lg={7}>
                <Card className="bg-light p-3 mb-4">
                  <CardBody>
                    <a href="#" className="badge text-bg-success mb-2">
                      Research
                    </a>
                    <CardTitle>
                      <a href="#">How to make a college list</a>
                    </CardTitle>
                    <p>
                      Prospective students should start broadly and then narrow their list down to colleges that best fit their needs, experts say.Yet
                      remarkably appearance get him his projection.
                    </p>
                    <div className="d-flex justify-content-between">
                      <h6 className="mb-0">
                        <a href="#">Louis Crawford</a>
                      </h6>
                      <span className="small">12H Ago</span>
                    </div>
                  </CardBody>
                </Card>
                <Card className="bg-transparent">
                  <div className="overflow-hidden rounded-3">
                    <img src={eventImg1} className="card-imgp" alt="Card image" />
                    <div className="bg-overlay bg-dark opacity-4" />
                    <div className="card-img-overlay d-flex align-items-start flex-column p-3">
                      <a href="#" className="badge text-bg-info">
                        Student story
                      </a>
                    </div>
                  </div>
                  <CardBody className="px-3">
                    <CardTitle>
                      <a href="#">Campus Support for First-Year Students</a>
                    </CardTitle>
                    <p className="text-truncate-2">Prospective students should start broadly and then narrow their list </p>
                    <div className="d-flex justify-content-between">
                      <h6 className="mb-0">
                        <a href="#">Lori Stevens</a>
                      </h6>
                      <span className="small">3M Ago</span>
                    </div>
                  </CardBody>
                </Card>
              </Col>
              <Col lg={5}>
                <Card className="bg-transparent">
                  <div className="overflow-hidden rounded-3">
                    <img src={eventImg3} className="card-img-top" alt="course image" />
                    <div className="bg-overlay bg-dark opacity-2 rounded-2" />
                    <div className="card-img-overlay d-flex align-items-start flex-column p-3">
                      <a href="#" className="badge text-bg-purple">
                        Covid-19
                      </a>
                    </div>
                  </div>
                  <CardBody className="px-3">
                    <CardTitle>
                      <a href="#">Covid-19 and the college experienced</a>
                    </CardTitle>
                    <p>Rooms oh fully taken by worse do. Points afraid but may end law.Points afraid but may end law. </p>
                    <div className="d-flex justify-content-between">
                      <h6 className="mb-0">
                        <a href="#">Amanda Reed</a>
                      </h6>
                      <span className="small">July 21, 2021</span>
                    </div>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>
    </section>
  )
}

export default LatestNews
