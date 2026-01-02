import { Button, Card, CardBody, CardTitle, Col, Container, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Row } from 'react-bootstrap'
import { BsThreeDotsVertical } from 'react-icons/bs'

import { FaQuestionCircle } from 'react-icons/fa'

import course1 from '@/assets/images/courses/4by3/01.jpg'

const UserProgressCard = () => {
  return (
    <Card className="p-2 bg-transparent border">
      <Row className="g-0">
        <Col md={3}>
          <img src={course1} className="rounded-2" alt="Card image" />
        </Col>
        <Col md={9}>
          <CardBody>
            <div className="d-flex justify-content-between">
              <div>
                <a href="#" className="badge text-bg-primary me-1">
                  Marketing
                </a>
                <a href="#" className="badge text-bg-dark">
                  Beginner
                </a>
              </div>
              <Dropdown drop="start" className="flex-shrink-0">
                <DropdownToggle
                  as="a"
                  className="text-primary-hover text-secondary p-0 mb-0"
                  id="cardShareAction2"
                  data-bs-toggle="dropdown"
                  aria-expanded="false">
                  <BsThreeDotsVertical />
                </DropdownToggle>
                <DropdownMenu className="dropdown-menu-end min-w-auto" aria-labelledby="cardShareAction2">
                  <li>
                    <DropdownItem href="#">Upgrade Course</DropdownItem>
                  </li>
                  <li>
                    <DropdownItem href="#">Rate Course</DropdownItem>
                  </li>
                  <li>
                    <DropdownItem href="#">Share course</DropdownItem>
                  </li>
                  <li>
                    <DropdownItem href="#">Unroll</DropdownItem>
                  </li>
                </DropdownMenu>
              </Dropdown>
            </div>
            <CardTitle className="mt-3 mb-0">
              <a href="#">The Complete Digital Marketing Course - 12 Courses in 1</a>
            </CardTitle>
            <div className="overflow-hidden mt-3">
              <div className="d-flex justify-content-between">
                <h6 className="uppercase">Overall Progress</h6>
                <span className="h6 mb-0">20%</span>
              </div>
              <div className="progress progress-sm bg-success bg-opacity-10">
                <div
                  className="progress-bar bg-success aos"
                  role="progressbar"
                  data-aos="slide-right"
                  data-aos-delay={200}
                  data-aos-duration={1000}
                  data-aos-easing="ease-in-out"
                  style={{ width: '20%' }}
                  aria-valuenow={20}
                  aria-valuemin={0}
                  aria-valuemax={100}></div>
              </div>
            </div>
            <div className="d-flex justify-content-between align-items-center mt-3">
              <ul className="nav nav-divider small mb-0">
                <li className="nav-item h6 mb-0">Week 2</li>
                <li className="nav-item">Lecture 12</li>
              </ul>
              <Button variant="primary-soft" size="sm" className="mb-0">
                Continue
              </Button>
            </div>
          </CardBody>
        </Col>
      </Row>
    </Card>
  )
}

const ExamScheduleCard = () => {
  return (
    <Card className="card-body bg-transparent border">
      <h5 className="mb-3">Schedule exam</h5>
      <div className="d-flex align-items-center position-relative">
        <a href="#" className="btn btn-primary-soft btn-round mb-0">
          <FaQuestionCircle />
        </a>
        <div className="ms-3">
          <a href="#" className="d-inline-block text-truncate mb-0 h6 fw-normal stretched-link">
            Quiz - Digital Marketing
          </a>
          <ul className="nav nav-divider small mb-0">
            <li className="nav-item">12 June</li>
            <li className="nav-item">20 pts</li>
            <li className="nav-item">30 min</li>
          </ul>
        </div>
      </div>
    </Card>
  )
}

const WelcomeCard = () => {
  return (
    <section className="pt-0 pt-lg-5">
      <Container>
        <Row className="mb-4">
          <Col xs={12}>
            <h2 className="mb-0">Welcome back user!</h2>
          </Col>
        </Row>
        <Row className="g-4">
          <Col xl={8}>
            <UserProgressCard />
          </Col>
          <Col xl={4}>
            <ExamScheduleCard />
          </Col>
        </Row>
      </Container>
    </section>
  )
}

export default WelcomeCard
