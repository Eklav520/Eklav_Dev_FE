import CountUp from 'react-countup'
import { Col, Row } from 'react-bootstrap'
import { counterData } from '../data'
import clsx from 'clsx'

const Counter = () => {
  return (
    <Row className="g-4 justify-content-center">
      {counterData.map((item, idx) => {
        const Icon = item.icon
        return (
          <Col sm={6} md={4} xl={6} xxl={4} key={idx}>
            <div className="d-flex justify-content-center align-items-center">
              <div className={clsx('icon-lg bg-body shadow rounded-circle mb-0', item.variant)}>{Icon && <Icon className="fa-fw" />}</div>
              <div className="ms-3">
                <div className="d-flex text-dark">
                  <h5 className="purecounter mb-0 fw-bold">
                    <CountUp end={item.count} suffix={item.suffix} delay={5} />
                  </h5>
                </div>
                <span className="mb-0">Total Students</span>
              </div>
            </div>
          </Col>
        )
      })}
    </Row>
  )
}

export default Counter
