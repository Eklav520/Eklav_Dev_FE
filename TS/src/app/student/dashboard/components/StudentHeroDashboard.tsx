import { Card, ProgressBar, Badge, Button } from 'react-bootstrap'
import { FaUserCircle, FaClock, FaBookOpen, FaBullseye } from 'react-icons/fa'

type Props = {
  name: string
  completion: number
}

const StudentHeroDashboard = ({ name, completion }: Props) => {
  return (
    <Card className="border-0 shadow-sm mb-4">
      <Card.Body>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-4">

          {/* LEFT */}
          <div className="d-flex align-items-center gap-3">
            <FaUserCircle size={72} className="text-primary" />
            <div>
              <h5 className="mb-1">{name}</h5>
              <small className="text-muted">Student Dashboard</small>

              <ProgressBar
                now={completion}
                className="mt-2"
                style={{ height: 6, width: 180 }}
              />
              <small className="text-muted">{completion}% completed</small>
            </div>
          </div>

          {/* STATS */}
          <div className="d-flex gap-3 flex-wrap">
            <Stat label="Hours" value="18 min" icon={<FaClock />} color="warning" />
            <Stat label="Courses" value="1" icon={<FaBookOpen />} color="success" />
            <Stat label="Accuracy" value="0%" icon={<FaBullseye />} color="info" />
          </div>

          {/* ACTION */}
          <Button size="sm" variant="outline-primary">
            Edit Profile
          </Button>
        </div>
      </Card.Body>
    </Card>
  )
}

const Stat = ({ label, value, icon, color }: any) => (
  <div className="d-flex align-items-center gap-2">
    <div className={`bg-${color} bg-opacity-10 p-2 rounded-circle`}>
      {icon}
    </div>
    <div>
      <small className="text-muted d-block">{label}</small>
      <strong>{value}</strong>
    </div>
  </div>
)

export default StudentHeroDashboard
