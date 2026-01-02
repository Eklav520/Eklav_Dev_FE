import { Card, Badge } from 'react-bootstrap'
import { FaBell } from 'react-icons/fa'

const UpdatesAndStats = ({ updates }: any) => (
  <Card className="border-0 shadow-sm">
    <Card.Header className="border-0 text-white py-3"
      style={{ background: 'linear-gradient(135deg, #8e44ad 0%, #c653d5 100%)' }}>
      <h5 className="mb-0 fw-bold">
        <FaBell className="me-2" />
        Updates & Notifications
      </h5>
    </Card.Header>

    <Card.Body className="p-0">
      {updates.map((u: any, i: number) => (
        <div key={i} className="px-3 py-3 border-bottom">
          <div className="fw-semibold">{u.text}</div>
          <small className="text-muted">{u.date}</small>
          <Badge bg="info" pill className="ms-2">New</Badge>
        </div>
      ))}
    </Card.Body>
  </Card>
)

export default UpdatesAndStats
