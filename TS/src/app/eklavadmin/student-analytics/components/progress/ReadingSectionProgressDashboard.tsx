import { Card } from 'react-bootstrap'
import SectionStudentProgressTable from './SectionStudentProgressTable'

type ReadingSectionProgressDashboardProps = {
  year: number
  month: number
  week: string | null
  college: string | null
  registerDownload?: (fn: () => void) => void
}

const ReadingSectionProgressDashboard = ({
  week,
  college,
  registerDownload,
}: ReadingSectionProgressDashboardProps) => (
  <Card>
    <Card.Header className="d-flex justify-content-between align-items-center">
      <h5 className="mb-0">Reading Section Progress</h5>
    </Card.Header>

    <Card.Body>
      {week ? (
        <SectionStudentProgressTable
          weekKey={week}
          apiType="reading"
          college={college}     
          registerDownload={registerDownload}
        />
      ) : (
        <p className="text-center text-muted mb-0">
          Select a week above to view reading progress.
        </p>
      )}
    </Card.Body>
  </Card>
)

export default ReadingSectionProgressDashboard
