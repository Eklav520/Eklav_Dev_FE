import { Card } from 'react-bootstrap'
import SectionStudentProgressTable from './SectionStudentProgressTable'

type Props = {
  year: number
  month: number
  week: string | null
  college: string | null
  registerDownload?: (fn: () => void) => void
}

const EnglishPracticeSectionProgressDashboard = ({
  week,
  college,
  registerDownload,
}: Props) => (
  <Card>
    <Card.Header>
      <h5 className="mb-0">Speaking Section Progress</h5>
    </Card.Header>

    <Card.Body>
      {week ? (
        <SectionStudentProgressTable
          weekKey={week}
          apiType="englishPractice"
          college={college}        
          registerDownload={registerDownload}
        />
      ) : (
        <p className="text-center text-muted mb-0">
          Select a week in the filters above to view Speaking progress.
        </p>
      )}
    </Card.Body>
  </Card>
)

export default EnglishPracticeSectionProgressDashboard
