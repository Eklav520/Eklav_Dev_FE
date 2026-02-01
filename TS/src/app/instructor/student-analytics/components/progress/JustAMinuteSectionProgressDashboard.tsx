import { Card } from 'react-bootstrap'
import SectionStudentProgressTable from './SectionStudentProgressTable'

type JustAMinuteSectionProgressDashboardProps = {
  year: number
  month: number
  week: string | null
  college: string | null
  registerDownload?: (fn: () => void) => void
}

const JustAMinuteSectionProgressDashboard = ({
  week,
  college,
  registerDownload,
}: JustAMinuteSectionProgressDashboardProps) => (
  <Card>
    <Card.Header className="d-flex justify-content-between align-items-center">
      <h5 className="mb-0">Just a Minute Section Progress</h5>
    </Card.Header>

    <Card.Body>
      {week ? (
        <SectionStudentProgressTable
          weekKey={week}
          apiType="justaMinute"
          college={college}        
          registerDownload={registerDownload}
        />
      ) : (
        <p className="text-center text-muted mb-0">
          Select a week in the filters above to view Just A Minute progress.
        </p>
      )}
    </Card.Body>
  </Card>
)

export default JustAMinuteSectionProgressDashboard
