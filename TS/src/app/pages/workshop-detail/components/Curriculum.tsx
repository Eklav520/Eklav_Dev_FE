import about27Img from '@/assets/images/about/27.jpg'
import coursesImg from '@/assets/images/courses/4by3/01.jpg'
import { Accordion, AccordionBody, AccordionHeader, AccordionItem, Button, Card, Col, Container, Row } from 'react-bootstrap'
import { BsCalendar, BsHourglassSplit, BsPcDisplayHorizontal } from 'react-icons/bs'
import { FaFileAlt, FaFileSignature, FaGlobeEurope, FaPlay, FaQuestionCircle, FaVideo } from 'react-icons/fa'

const Curriculum = () => {
  return (
    <section className="pt-0">
      <Container>
        <Row className="mb-4">
          <Col xs={12} className="text-center">
            <h2 className="fs-1 mb-0">Course Curriculum</h2>
          </Col>
        </Row>
        <Row className="g-4">
          <Col lg={8}>
            <Accordion className="accordion-icon accordion-bg-light" id="accordionExample2">
              <AccordionItem eventKey="0" className="accordion-item mb-3">
                <AccordionHeader className="accordion-header" id="heading-1">
                  <div className="fw-bold icons-center">
                    <BsPcDisplayHorizontal className="me-3" />2 Video Session
                  </div>
                </AccordionHeader>
                <AccordionBody className="mt-3">
                  <Row className="justify-content-md-between">
                    <Col md={5}>
                      <h5>Watch demo video</h5>
                      <ul className="list-group list-group-borderless">
                        <li className="list-group-item px-0">
                          <span className="h6 fw-normal">
                            <BsCalendar className="fa-fw text-primary me-2" />
                            30 min video
                          </span>
                        </li>
                        <li className="list-group-item px-0">
                          <span className="h6 fw-normal">
                            <FaGlobeEurope className="fa-fw text-primary me-2" />
                            USA timezone
                          </span>
                        </li>
                      </ul>
                    </Col>
                    <Col md={3}>
                      <Card className="shadow p-0">
                        <div className="overflow-hidden rounded-3">
                          <img src={coursesImg} className="card-img" alt="course image" />
                          <div className="bg-overlay bg-dark opacity-6" />
                          <div className="card-img-overlay d-flex align-items-start flex-column p-3">
                            <div className="m-auto">
                              <a
                                href="https://www.youtube.com/embed/tXHviS-4ygo"
                                className="btn btn-lg btn-white btn-round mb-0"
                                data-glightbox
                                data-gallery="course-video">
                                <FaPlay />
                              </a>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Col>
                  </Row>
                  <hr />
                  <Row className="justify-content-md-between">
                    <Col md={5}>
                      <h5>Meet me in a live session</h5>
                      <ul className="list-group list-group-borderless">
                        <li className="list-group-item px-0">
                          <span className="h6 fw-normal">
                            <BsCalendar className="fa-fw text-primary me-2" />
                            Jun 28, 6:30PM - 8:00PM
                          </span>
                        </li>
                        <li className="list-group-item px-0">
                          <span className="h6 fw-normal">
                            <FaGlobeEurope className="fa-fw text-primary me-2" />
                            USA timezone
                          </span>
                        </li>
                        <li className="list-group-item px-0">
                          <span className="h6 fw-normal">
                            <FaVideo className="text-primary me-2" />
                            Meet on a zoom call
                          </span>
                        </li>
                      </ul>
                    </Col>
                    <Col md={3}>
                      <img src={about27Img} className="rounded-3" alt="course image" />
                    </Col>
                  </Row>
                </AccordionBody>
              </AccordionItem>
              <AccordionItem eventKey="1" className="accordion-item mb-3">
                <AccordionHeader className="accordion-header" id="heading-2">
                  <div className="fw-bold rounded d-flex ">
                    <span className="me-3">01</span>
                    Introduction of Digital Marketing
                  </div>
                </AccordionHeader>
                <AccordionBody className="accordion-body mt-3">
                  <p>
                    If you wish to find out the skills that should be covered in a basic digital marketing course syllabus in India or anywhere around
                    the world, then reading this blog will help. Before we delve into the advanced digital marketing course syllabus, let&apos;s look
                    at the scope of <b>digital marketing</b> and what the future holds.
                  </p>
                  <a href="#" className="h6 fw-normal p-0 mb-0 align-items-center">

                    <FaPlay className="me-2" />
                    What is Digital Marketing What is Digital Marketing
                  </a>
                  <hr />
                  <a href="#" className="h6 fw-normal p-0 mb-0 align-items-center">

                    <FaFileSignature className="me-2" />
                    Assignments 1 - Research about marketing
                  </a>
                  <hr />
                  <a href="#" className="h6 fw-normal p-0 mb-0 align-items-center">

                    <FaFileAlt className="me-2" />
                    Slide - Digital Marketing
                  </a>
                  <hr />
                  <a href="#" className="h6 fw-normal p-0 mb-0 align-items-center">

                    <FaQuestionCircle className="me-2" />
                    Quiz - Digital Marketing
                  </a>
                </AccordionBody>
              </AccordionItem>
              <AccordionItem eventKey="2" className="accordion-item mb-3">
                <AccordionHeader className="accordion-header" id="heading-3">
                  <div className="fw-bold">
                    <span className="me-3">02</span>
                    What is Search Engine Optimization(SEO)
                  </div>
                </AccordionHeader>
                <AccordionBody className="accordion-body mt-3">
                  <a href="#" className="h6 fw-normal p-0 mb-0 align-items-center">

                    <FaPlay className="me-2" />
                    What is Digital Marketing What is Digital Marketing
                  </a>
                  <hr />
                  <a href="#" className="h6 fw-normal p-0 mb-0 align-items-center">

                    <FaFileSignature className="me-2" />
                    Assignments 1 - Research about marketing
                  </a>
                  <hr />
                  <a href="#" className="h6 fw-normal p-0 mb-0 align-items-center">

                    <FaFileAlt className=" me-2" />
                    Slide - Digital Marketing
                  </a>
                  <hr />
                  <a href="#" className="h6 fw-normal p-0 mb-0 align-items-center">

                    <FaQuestionCircle className="me-2" />
                    Quiz - Digital Marketing
                  </a>
                </AccordionBody>
              </AccordionItem>
              <AccordionItem eventKey="3" className="accordion-item mb-3">
                <AccordionHeader className="accordion-header" id="heading-4">
                  <div className="fw-bold ">
                    <span className="me-3">03</span>
                    Google tag manager
                  </div>
                </AccordionHeader>
                <AccordionBody className="accordion-body mt-3">
                  <p>
                    If you wish to find out the skills that should be covered in a basic digital marketing course syllabus in India or anywhere around
                    the world, then reading this blog will help. Before we delve into the advanced digital marketing course syllabus, let&apos;s look
                    at the scope of <b>digital marketing</b> and what the future holds.
                  </p>
                  <a href="#" className="h6 fw-normal p-0 mb-0 align-items-center">

                    <FaPlay className="fas fa-play fa-fw me-2" />
                    What is Digital Marketing What is Digital Marketing
                  </a>
                  <hr />
                  <a href="#" className="h6 fw-normal p-0 mb-0 align-items-center">

                    <FaFileSignature className="fas fa-file-signature fa-fw me-2" />
                    Assignments 1 - Research about marketing
                  </a>
                  <hr />
                  <a href="#" className="h6 fw-normal p-0 mb-0 align-items-center">

                    <FaFileAlt className="fas fa-file-alt fa-fw me-2" />
                    Slide - Digital Marketing
                  </a>
                </AccordionBody>
              </AccordionItem>
            </Accordion>
          </Col>
          <Col lg={4}>
            <Card className="card-body text-center bg-dark text-white p-5">
              <h6 className="text-danger mb-3">
                <BsHourglassSplit className="me-2" />
                Hurry! Limited Seat Available
              </h6>
              <h4 className="text-white">Developed your photo editing skills</h4>
              <small>Jun 10 - Aug 5, 2022</small>
              <h3 className="fs-1 text-white mt-3">$557</h3>
              <Button variant="success" className="mb-2">
                Enroll Now
              </Button>
              <small className="mb-0">
                By clicking &apos;Enroll Now&apos;, you agree to our
                <a href="#" className="text-decoration-underline">

                  Terms of Service and Privacy Policy.
                </a>
              </small>
            </Card>
          </Col>
        </Row>
      </Container>
    </section>
  )
}

export default Curriculum
