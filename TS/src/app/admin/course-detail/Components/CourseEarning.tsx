import ReactApexChart from 'react-apexcharts'
import { Card, CardBody, CardHeader, Col, Row } from 'react-bootstrap'
import { BsArrowUp } from 'react-icons/bs'
import { courseEarningChart, courseEarningChart2 } from '../data'

const CourseEarning = () => {
  return (
    <Col xxl={6}>
      <Row className="g-4">
        <Col md={6} xxl={12}>
          <Card className="bg-transparent border overflow-hidden">
            <CardHeader className="bg-light border-bottom">
              <h5 className="card-header-title mb-0">Total course earning</h5>
            </CardHeader>
            <CardBody className="p-0">
              <div className="d-sm-flex justify-content-between p-4">
                <h4 className="text-blue mb-0">$12,586</h4>
                <p className="mb-0">
                  <span className="text-success me-1">
                    0.20%
                    <BsArrowUp />
                  </span>
                  vs last Week
                </p>
              </div>
              <ReactApexChart height={130} series={courseEarningChart.series} type="area" options={courseEarningChart} />
            </CardBody>
          </Card>
        </Col>
        <Col md={6} xxl={12}>
          <Card className="bg-transparent border overflow-hidden">
            <CardHeader className="bg-light border-bottom">
              <h5 className="card-header-title mb-0">New Enrollment This Month</h5>
            </CardHeader>
            <CardBody className="p-0">
              <div className="d-sm-flex justify-content-between p-4">
                <h4 className="text-blue mb-0">186</h4>
                <p className="mb-0">
                  <span className="text-success me-1">
                    0.35%
                    <BsArrowUp />
                  </span>
                  vs last Week
                </p>
              </div>
              <ReactApexChart height={130} series={courseEarningChart2.series} type="area" options={courseEarningChart2} />
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Col>
  )
}

export default CourseEarning
