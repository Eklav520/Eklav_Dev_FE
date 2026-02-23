import ReactApexChart from 'react-apexcharts'
import { Card, CardBody, CardHeader, Col, Row } from 'react-bootstrap'
import { FaCircle } from 'react-icons/fa'
import { topEarning } from '../data'

const TopEarning = () => {
  return (
    <Card className="bg-transparent border rounded-3 mt-5">
      <CardHeader className="bg-transparent">
        <h5 className="mb-0">Top five earning sources</h5>
      </CardHeader>
      <CardBody>
        <Row className="g-4 g-md-5 align-items-center">
          <Col md={6}>
            <ReactApexChart width={300} height={300} series={topEarning.series} type="donut" options={topEarning} id="ChartPageViews" />
          </Col>
          <Col md={6}>
            <ul className="list-group list-group-borderless mb-3">
              <li className="list-group-item">
                <h6 className="mb-0">Course Name</h6>
              </li>
              <li className="list-group-item">
                <FaCircle className="text-success  me-2" />
                The Complete Digital Marketing Course - 12 Courses in 1
              </li>
              <li className="list-group-item">
                <FaCircle className="text-warning  me-2" />
                Google Ads Training: Become a PPC Expert
              </li>
              <li className="list-group-item">
                <FaCircle className="text-danger  me-2" />
                Microsoft Excel - Excel from Beginner to Advanced
              </li>
              <li className="list-group-item">
                <FaCircle className="text-primary  me-2" />
                Create a Design System in Figma
              </li>
              <li className="list-group-item">
                <FaCircle className="text-secondary  me-2" />
                Deep Learning with React-Native
              </li>
            </ul>
          </Col>
        </Row>
      </CardBody>
    </Card>
  )
}

export default TopEarning
