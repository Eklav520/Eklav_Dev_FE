import { Card } from 'react-bootstrap'
import SectionStudentProgressTable from './SectionStudentProgressTable'

type ListeningSectionProgressDashboardProps = {
  year: number
  month: number
  week: string | null
  college: string | null
  registerDownload?: (fn: () => void) => void
}

const ListeningSectionProgressDashboard = ({
  week,
  college,
  registerDownload,
}: ListeningSectionProgressDashboardProps) => (
  <Card>
    <Card.Header className="d-flex justify-content-between align-items-center">
      <h5 className="mb-0">Listening Section Progress</h5>
    </Card.Header>

    <Card.Body>
      {week ? (
        <SectionStudentProgressTable
          weekKey={week}
          apiType="listening"
          college={college}         
          registerDownload={registerDownload}
        />
      ) : (
        <p className="text-center text-muted mb-0">
          Select a week above to view listening progress.
        </p>
      )}
    </Card.Body>
  </Card>
)

export default ListeningSectionProgressDashboard
