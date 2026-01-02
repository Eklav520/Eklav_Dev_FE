import { Card, Button } from 'react-bootstrap'
import { FaChartLine, FaDownload } from 'react-icons/fa'

const MonthlyReport = ({ data }: any) => (
  <Card className="border-0 shadow-lg h-100">
    <Card.Header className="border-0 text-white py-3"
      style={{ background: 'linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)' }}>
      <h5 className="fw-bold">
        <FaChartLine className="me-2" />
        Monthly Performance Report
      </h5>
    </Card.Header>

    <Card.Body>
      {/* Paste SVG AREA CHART exactly */}
      <Button variant="light" size="sm">
        <FaDownload /> PDF
      </Button>
    </Card.Body>
  </Card>
)

export default MonthlyReport
