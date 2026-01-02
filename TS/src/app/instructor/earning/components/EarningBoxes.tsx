import { Col, Row } from 'react-bootstrap'
import { BsInfoCircleFill } from 'react-icons/bs'

const EarningBoxes = () => {
  return (
    <Row className="g-4">
      <Col sm={6} lg={4}>
        <div className="text-center p-4 bg-light rounded-3">
          <h6 className="text-body">Sales this month</h6>
          <h2 className="mb-0 fs-1">$899.95</h2>
        </div>
      </Col>
      <Col sm={6} lg={4}>
        <div className="text-center p-4 bg-light rounded-3">
          <h6 className="text-body">
            To be paid
            <a
              tabIndex={0}
              className="h6 mb-0"
              role="button"
              data-bs-toggle="popover"
              data-bs-trigger="focus"
              data-bs-placement="top"
              data-bs-content="After US royalty withholding tax">
              &nbsp;
              <BsInfoCircleFill className="bi bi-info-circle-fill small" />
            </a>
          </h6>
          <h2 className="mb-0 fs-1">$750.35</h2>
        </div>
      </Col>
      <Col sm={6} lg={4}>
        <div className="text-center p-4 bg-light rounded-3">
          <h6 className="text-body">Lifetime Earnings</h6>
          <h2 className="mb-0 fs-1">$4882.65</h2>
        </div>
      </Col>
    </Row>
  )
}

export default EarningBoxes
