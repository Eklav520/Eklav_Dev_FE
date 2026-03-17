import { Col, Row } from 'react-bootstrap'

const PayoutBoxs = () => {
  return (
    <Row className="g-4 mb-4">
      <Col sm={6} md={4}>
        <div className="border p-3 rounded-3 h-100">
          <div className="d-flex mb-1 justify-content-between align-items-center">
            <h6 className="mb-0">Last month payout</h6>
            <span className="badge bg-success bg-opacity-10 text-success ms-2 mb-0">Paid</span>
          </div>
          <h2 className="mb-2 mt-2">$12,825</h2>
          <a href="#">View transaction</a>
        </div>
      </Col>
      <Col sm={6} md={4}>
        <div className="border p-3 rounded-3 h-100">
          <h6 className="mb-0">This month earning</h6>
          <h2 className="mb-2 mt-2">$15,356</h2>
          <p className="mb-0">Expected payout on 05/01/2023</p>
        </div>
      </Col>
      <Col sm={6} md={4}>
        <div className="bg-primary bg-opacity-10 h-100 p-3 rounded-3">
          <h6 className="mb-0">Balance</h6>
          <h2 className="mb-2 mt-2">$8,485</h2>
          <a href="#" className="btn btn-sm btn-primary mb-0">
            Withdraw Earning
          </a>
        </div>
      </Col>
    </Row>
  )
}

export default PayoutBoxs
