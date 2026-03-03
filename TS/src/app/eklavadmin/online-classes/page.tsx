import { Card, CardHeader } from 'react-bootstrap'
import PageMetaData from '@/components/PageMetaData'
import ScheduleClassForm from './components/ScheduleClassForm'
import AdminTutorApproval from './components/AdminTutorApproval'



const OnlineClasses = () => {
  return (
    <>
      <PageMetaData title="Self Interview" />
      <Card className="bg-transparent border rounded-2">
       <AdminTutorApproval/>
      </Card>
    </>
  )
}

export default OnlineClasses
