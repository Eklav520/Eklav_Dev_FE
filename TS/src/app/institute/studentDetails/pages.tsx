import { Card } from 'react-bootstrap'
import PageMetaData from '@/components/PageMetaData'
import StudentDetails from './components/studentDetails'


const StudentAdminDetails = () => {
  return (
    <>
      <PageMetaData title="Institute Details" />
      <Card className="bg-transparent border rounded-4">
        <StudentDetails />
      </Card>
    </>
  )
}

export default StudentAdminDetails
