import { Card, Form, Badge } from 'react-bootstrap'
import { FaCalendarCheck } from 'react-icons/fa'

const AttendanceCalendar = ({
  year,
  month,
  attendance,
  setYear,
  setMonth,
}: any) => (
  <Card className="border-0 shadow-sm h-100">
    <Card.Header className="fw-bold d-flex align-items-center gap-2">
      <FaCalendarCheck />
      <Form.Select size="sm" value={month} onChange={(e) => setMonth(+e.target.value)}>
        {/* months */}
      </Form.Select>
      <Form.Select size="sm" value={year} onChange={(e) => setYear(+e.target.value)}>
        {/* years */}
      </Form.Select>
    </Card.Header>

    <Card.Body>
      {/* Paste calendar grid EXACTLY */}
    </Card.Body>
  </Card>
)

export default AttendanceCalendar
