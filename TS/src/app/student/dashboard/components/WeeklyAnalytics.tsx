import { Card } from 'react-bootstrap'
import { BsGraphUp } from 'react-icons/bs'
import LineChart from '../components/charts/LineChart'

const WeeklyAnalytics = ({ data }: any) => (
  <Card className="border-0 shadow-sm h-100">
    <Card.Header className="border-0 text-white py-3"
      style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 100%)' }}>
      <h5 className="mb-0 fw-bold">
        <BsGraphUp className="me-2" />
        Weekly Performance Analytics
      </h5>
    </Card.Header>

    <Card.Body>
      <LineChart data={data} />
    </Card.Body>
  </Card>
)

export default WeeklyAnalytics
