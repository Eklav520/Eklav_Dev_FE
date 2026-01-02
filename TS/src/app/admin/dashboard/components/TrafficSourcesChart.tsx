import ReactApexChart from 'react-apexcharts'
import { Card, CardBody, CardHeader, Col } from 'react-bootstrap'
import { FaCircle } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import { chartTrafficViews } from '../data'

const TrafficSourcesChart = () => {
  return (
    <Col lg={6} xxl={4}>
      <Card className="shadow h-100">
        <CardHeader className="border-bottom d-flex justify-content-between align-items-center p-4">
          <h5 className="card-header-title">Traffic Sources</h5>
          <Link to="#" className="btn btn-link p-0 mb-0">
            View all
          </Link>
        </CardHeader>
        <CardBody className="p-4">
          <Col sm={6} className="mx-auto">
            <ReactApexChart height={200} series={chartTrafficViews.series} type="donut" options={chartTrafficViews} />
          </Col>
          <ul className="list-group list-group-borderless mt-3">
            <li className="list-group-item">
              <FaCircle className="text-primary me-2" />
              Create a Design System in Figma
            </li>
            <li className="list-group-item">
              <FaCircle className="text-success me-2" />
              The Complete Digital Marketing Course - 12 Courses in 1
            </li>
            <li className="list-group-item">
              <FaCircle className="text-warning me-2" />
              Google Ads Training: Become a PPC Expert
            </li>
            <li className="list-group-item">
              <FaCircle className="text-danger me-2" />
              Microsoft Excel - Excel from Beginner to Advanced
            </li>
          </ul>
        </CardBody>
      </Card>
    </Col>
  )
}

export default TrafficSourcesChart
