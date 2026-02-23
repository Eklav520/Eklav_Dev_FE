import ReactApexChart from 'react-apexcharts'
import { Card, Col, Row } from 'react-bootstrap'
import { BsArrowDown, BsArrowUp } from 'react-icons/bs'
import { monthEarning } from '../data'

const MonthEarning = () => {
  return (
    <Card className="card-body bg-transparent rounded-top border overflow-hidden p-0 mt-5">
      <Row className="g-4 p-4">
        <Col sm={6} md={4}>
          <span className="badge text-bg-dark">Current Month</span>
          <h4 className="text-primary my-2">$35000</h4>
          <p className="mb-0">
            <span className="text-success me-1">
              0.20%
              <BsArrowUp className="bi bi-arrow-up" />
            </span>
            vs last month
          </p>
        </Col>
        <Col sm={6} md={4}>
          <span className="badge text-bg-dark">Last Month</span>
          <h4 className="my-2">$28000</h4>
          <p className="mb-0">
            <span className="text-danger me-1">
              0.10%
              <BsArrowDown className="bi bi-arrow-down" />
            </span>
            Then last month
          </p>
        </Col>
      </Row>
      <ReactApexChart id="ChartPayoutEarning" height={300} series={monthEarning.series} type="area" options={monthEarning} />
    </Card>
  )
}

export default MonthEarning
