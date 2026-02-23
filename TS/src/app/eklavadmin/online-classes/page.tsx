import { Card, CardHeader } from 'react-bootstrap'
import PageMetaData from '@/components/PageMetaData'
import ScheduleClassForm from './components/ScheduleClassForm'



const OnlineClasses = () => {
  return (
    <>
      <PageMetaData title="Self Interview" />
      <Card className="bg-transparent border rounded-4">
        <ScheduleClassForm adminId="665fc5556789d1c9cabcdef1" />
      </Card>
    </>
  )
}

export default OnlineClasses
