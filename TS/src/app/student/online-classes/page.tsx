import { Card, CardHeader } from 'react-bootstrap'
import PageMetaData from '@/components/PageMetaData'
import StudentDashboard from './components/StudentDashboard'



const OnlineClasses = () => {
  return (
    <>
      <PageMetaData title="Self Interview" />
      <Card className="bg-transparent border rounded-4">
        <StudentDashboard userId="665fc5556789d1c9cabcdef2" />
      </Card>
    </>
  )
}

export default OnlineClasses
