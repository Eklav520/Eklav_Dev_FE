import { Button, Card, CardBody, CardTitle, Col, Container, Row } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { FaComment, FaSync, FaTag } from 'react-icons/fa'
import { initIsotope } from '@/helpers/init-isotope'

import event1 from '@/assets/images/event/01.jpg'
import event2 from '@/assets/images/event/02.jpg'
import event3 from '@/assets/images/event/03.jpg'
import event4 from '@/assets/images/event/04.jpg'
import pattern3 from '@/assets/images/pattern/03.png'
import pattern5 from '@/assets/images/pattern/05.png'
import { useEffect } from 'react'
import { BsHeart } from 'react-icons/bs'

const Blogs = () => {
  useEffect(() => {
    initIsotope()
  }, [])
  return (
    <section className="position-relative pt-0">
      <Container>
        <Row className="g-4 filter-container overflow-hidden" data-isotope='{"layoutMode": "masonry"}'>
          <Col sm={6} lg={4} className="grid-item">
            <Card className="bg-transparent">
              <div className="overflow-hidden rounded-3">
                <img src={event2} className="card-img" alt="course image" />
                <div className="bg-overlay bg-dark opacity-4" />
                <div className="card-img-overlay d-flex align-items-start p-3">
                  <a href="#" className="badge text-bg-danger">
                    Student life
                  </a>
                </div>
              </div>
              <CardBody className="px-3">
                <CardTitle>
                  <Link to="">Student Loan Survey: Many Owe $50K-plus</Link>
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
          <Col sm={6} lg={4} className="grid-item">
            <Card className="bg-light p-3">
              <CardBody className="">
                <a href="#" className="badge text-bg-success mb-2">
                  Research
                </a>
                <CardTitle>
                  <Link to="">How to make a college list</Link>
                </CardTitle>
                <p>
                  Prospective students should start broadly and then narrow their list down to colleges that best fit their needs, experts say. Yet
                  remarkably appearance gets him his projection.
                </p>
                <div className="d-flex justify-content-between">
                  <h6 className="mb-0">
                    <a href="#">Louis Crawford</a>
                  </h6>
                  <span className="small">12H Ago</span>
                </div>
              </CardBody>
            </Card>
          </Col>
          <Col sm={6} lg={4} className="grid-item">
            <Card className="h-100 bg-transparent">
              <div className="card-img-top rounded-3 overflow-hidden position-relative hover-overlay-top">
                <div className="ratio ratio-16x9">
                  <iframe
                    width={620}
                    height={347}
                    src="https://www.youtube.com/embed/9No-FiEInLA"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                  />
                </div>
              </div>
              <CardBody className=" px-3">
                <a href="#" className="badge text-bg-purple mb-2">
                  Travel
                </a>
                <CardTitle>
                  <Link to="">Never underestimate the influence of Eklav</Link>
                </CardTitle>
                <p className="text-truncate-2">Prospective students should start broadly and then narrow their list </p>
                <div className="d-flex justify-content-between">
                  <h6 className="mb-0">
                    <a href="#">Joan Wallace</a>
                  </h6>
                  <span className="small">5D Ago</span>
                </div>
              </CardBody>
            </Card>
          </Col>
          <Col sm={6} lg={4} className="grid-item">
            <Card className="bg-transparent">
              <div className="overflow-hidden rounded-3">
                <img src={event3} className="card-img-top" alt="course image" />
                <div className="bg-overlay bg-dark opacity-4" />
                <div className="card-img-overlay d-flex align-items-start p-3">
                  <a href="#" className="badge text-bg-warning">
                    Lifestyle
                  </a>
                </div>
              </div>
              <CardBody className=" px-3">
                <CardTitle>
                  <Link to="">Covid-19 and the college experienced</Link>
                </CardTitle>
                <p>Rooms oh fully taken by worse do. Points afraid but may end law. Points afraid but may end law. </p>
                <div className="d-flex justify-content-between">
                  <h6 className="mb-0">
                    <a href="#">Amanda Reed</a>
                  </h6>
                  <span className="small">July 21, 2021</span>
                </div>
              </CardBody>
            </Card>
          </Col>
          <Col sm={6} lg={4} className="grid-item">
            <Card className="bg-dark p-3" style={{ background: `url(${pattern5}) no-repeat center center`, backgroundSize: 'cover' }}>
              <CardBody className="">
                <a href="#" className="badge text-bg-warning mb-2">
                  Lifestyle
                </a>
                <CardTitle className="text-primary-hover mb-1">
                  <a href="#" className="text-white">
                    Student Success
                  </a>
                </CardTitle>
                <span className="text-white">Louis Crawford</span>
                <ul className="list-inline mb-0 mt-3">
                  <li className="list-inline-item text-white me-3 mb-1 mb-sm-0">Aug 26, 2021</li>
                  <li className="list-inline-item text-primary-hover me-3 mb-1 mb-xl-0">
                    <a href="#" className="text-white">
                      <BsHeart className="me-1" />
                      10
                    </a>
                  </li>
                  <li className="list-inline-item text-primary-hover me-3 mb-1 mb-xl-0">
                    <a href="#" className="text-white">
                      <FaComment className="me-1" />5
                    </a>
                  </li>
                  <li className="list-inline-item text-primary-hover me-3 mb-1 mb-xl-0">
                    <a href="#" className="text-white">
                      <FaTag className="me-1" />
                      Business
                    </a>
                  </li>
                </ul>
              </CardBody>
            </Card>
          </Col>
          <Col sm={6} lg={4} className="grid-item">
            <Card className="bg-info p-3" style={{ background: `url(${pattern3}) no-repeat center center`, backgroundSize: 'cover' }}>
              <CardBody className="">
                <CardTitle className="text-primary-hover mb-1">
                  <a href="#" className="text-white">
                    Choose your direction
                  </a>
                </CardTitle>
                <p className="text-white mb-0">https://stackbros.in/</p>
              </CardBody>
            </Card>
          </Col>
          <Col sm={6} lg={4} className="grid-item">
            <Card className="h-100 bg-transparent">
              <div className="card-img-top rounded overflow-hidden position-relative hover-overlay-top">
                <div className="ratio ratio-16x9">
                  <iframe src="https://player.vimeo.com/video/167434033?title=0&byline=0&portrait=0" width={620} height={347} allowFullScreen />
                </div>
              </div>
              <CardBody className=" px-3">
                <a href="#" className="badge text-bg-purple mb-2">
                  Technology
                </a>
                <CardTitle>
                  <Link to="">10 things you need to know about Eklav</Link>
                </CardTitle>
                <p className="text-truncate-2">Prospective students should start broadly and then narrow their list </p>
                <div className="d-flex justify-content-between">
                  <h6 className="mb-0">
                    <a href="#">Bryan Knight</a>
                  </h6>
                  <span className="small">20D Ago</span>
                </div>
              </CardBody>
            </Card>
          </Col>
          <Col sm={6} lg={4} className="grid-item">
            <Card className="bg-transparent">
              <div className="overflow-hidden rounded-3">
                <img src={event4} className="card-img" alt="course image" />
                <div className="bg-overlay bg-dark opacity-4" />
                <div className="card-img-overlay d-flex align-items-start p-3">
                  <a href="#" className="badge text-bg-primary">
                    Sports
                  </a>
                </div>
              </div>
              <CardBody className=" px-3">
                <CardTitle>
                  <Link to="">The Olympics are over, now what?</Link>
                </CardTitle>
                <p>Rooms oh fully taken by worse do. Points afraid but may end law. Points afraid but may end law. </p>
                <div className="d-flex justify-content-between">
                  <h6 className="mb-0">
                    <a href="#">Amanda Reed</a>
                  </h6>
                  <span className="small">Aug 31, 2021</span>
                </div>
              </CardBody>
            </Card>
          </Col>
          <Col sm={6} lg={4} className="grid-item">
            <Card className="bg-transparent">
              <div className="overflow-hidden rounded-3">
                <img src={event1} className="card-imgp" alt="course image" />
                <div className="bg-overlay bg-dark opacity-4" />
                <div className="card-img-overlay d-flex align-items-start p-3">
                  <a href="#" className="badge text-bg-info">
                    Student story
                  </a>
                </div>
              </div>
              <CardBody className=" px-3">
                <CardTitle>
                  <Link to="">Campus Support for First-Year Students</Link>
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
        </Row>
        <div className="text-center mt-4">
          <Button variant="primary-soft" className="mb-0">
            Load more
            <FaSync className="ms-2" />
          </Button>
        </div>
      </Container>
    </section>
  )
}
export default Blogs
