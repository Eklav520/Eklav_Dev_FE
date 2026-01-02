import avatar5 from '@/assets/images/avatar/05.jpg'
import courses1 from '@/assets/images/courses/4by3/01.jpg'
import { Card, CardBody, CardHeader, Col, Row } from 'react-bootstrap'
import { FaStar } from 'react-icons/fa'

const MarketingCourse = () => {
  return (
    <Col xxl={6}>
      <Card className="bg-transparent border rounded-3 h-100">
        <CardHeader className="bg-light border-bottom">
          <h5 className="card-header-title">The Complete Digital Marketing Course - 12 Courses in 1</h5>
        </CardHeader>
        <CardBody>
          <Row className="g-4">
            <Col md={6}>
              <img src={courses1} className="rounded" alt="courses" />
            </Col>
            <Col md={6}>
              <p className="mb-3">
                Satisfied conveying a dependent contented he gentleman agreeable do be. Warrant private blushes removed an in equally totally if.
                Delivered dejection necessary objection do Mr prevailed. Mr feeling does chiefly cordial in do.
              </p>
              <h5 className="mb-3">$295.55</h5>
              <div className="d-sm-flex align-items-center">
                <div className="avatar avatar-md">
                  <img className="avatar-img rounded-circle" src={avatar5} alt="avatar" />
                </div>
                <div className="ms-sm-3 mt-2 mt-sm-0">
                  <h6 className="mb-0">
                    <a href="#">By Jacqueline Miller</a>
                  </h6>
                  <p className="mb-0 small">Founder Eklav company</p>
                </div>
              </div>
            </Col>
          </Row>
          <Row className="mt-3">
            <Col md={6}>
              <ul className="list-group list-group-borderless">
                <li className="list-group-item">
                  <span>release date:</span>
                  <span className="h6 mb-0">29 Aug 2020</span>
                </li>
                <li className="list-group-item">
                  <span>Total Hour:</span>
                  <span className="h6 mb-0">4h 50m</span>
                </li>
                <li className="list-group-item">
                  <span>Total Enrolled:</span>
                  <span className="h6 mb-0">12,000+</span>
                </li>
                <li className="list-group-item">
                  <span>Certificate:</span>
                  <span className="h6 mb-0">Yes</span>
                </li>
              </ul>
            </Col>
            <Col md={6}>
              <ul className="list-group list-group-borderless">
                <li className="list-group-item">
                  <span>Skills:</span>
                  <span className="h6 mb-0">All level</span>
                </li>
                <li className="list-group-item">
                  <span>Total Lecture:</span>
                  <span className="h6 mb-0">30</span>
                </li>
                <li className="list-group-item">
                  <span>Language:</span>
                  <span className="h6 mb-0">English</span>
                </li>
                <li className="list-group-item">
                  <span>Review:</span>
                  <span className="h6 mb-0">
                    4.5
                    <FaStar className="text-warning ms-1" />
                  </span>
                </li>
              </ul>
            </Col>
          </Row>
        </CardBody>
      </Card>
    </Col>
  )
}

export default MarketingCourse
