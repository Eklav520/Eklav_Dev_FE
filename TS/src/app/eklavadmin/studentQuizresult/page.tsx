import { Card } from 'react-bootstrap'
import PageMetaData from '@/components/PageMetaData'
import StudentScore from './components/StudentScore'



const StudentQuizResult = () => {
  return (
    <>
      <PageMetaData title="Student Quiz Overview" />
      <Card className="bg-transparent border rounded-4">
        <StudentScore/>
      </Card>
    </>
  )
}

export default StudentQuizResult
