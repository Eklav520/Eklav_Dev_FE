import { Card } from 'react-bootstrap'
import WritingUnifiedProgressTable from './WritingUnifiedProgressTable'

type SectionProgressDashboardProps = {
  year: number
  month: number
  week: string | null
  registerDownload?: (fn: () => void) => void
}

const SectionProgressDashboard = ({
  week,
  registerDownload,
}: SectionProgressDashboardProps) => (
  <Card>
    <Card.Header className="d-flex justify-content-between align-items-center">
      <h5 className="mb-0">Writing Section Progress</h5>
    </Card.Header>

    <Card.Body>
      {week ? (
        <WritingUnifiedProgressTable
          weekKey={week}
          registerDownload={registerDownload}
        />
      ) : (
        <p className="text-center text-muted mb-0">
          Select a week in the filters above to view writing progress.
        </p>
      )}
    </Card.Body>
  </Card>
)

export default SectionProgressDashboard
