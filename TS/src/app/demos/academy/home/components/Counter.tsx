import { Col, Row } from 'react-bootstrap'
import CountUp from 'react-countup'
import { BsBookHalf } from 'react-icons/bs'
import { FaUniversity } from 'react-icons/fa'

const Counter = () => {
  return (
    <Row className="g-3 mb-3 mb-lg-0">
      <Col sm={6}>
        <div className="d-flex align-items-center">
          <div className="icon-lg fs-4 text-orange bg-orange bg-opacity-10 rounded flex-centered">

            <BsBookHalf />
          </div>
          <div className="ms-3">
            <div className="d-flex">
              <h4 className="purecounter fw-bold mb-0">
                <CountUp suffix="+" end={600} delay={1} />
              </h4>
            </div>
            <div>Online Courses</div>
          </div>
        </div>
      </Col>
      <Col sm={6}>
        <div className="d-flex align-items-center">
          <div className="icon-lg fs-4 text-info bg-info bg-opacity-10 rounded flex-centered">

            <FaUniversity />
          </div>
          <div className="ms-3">
            <div className="d-flex">
              <h4 className="purecounter fw-bold mb-0">
                <CountUp suffix="+" end={400} delay={1} />
              </h4>
            </div>
            <div>Universities</div>
          </div>
        </div>
      </Col>
    </Row>
  )
}

export default Counter
