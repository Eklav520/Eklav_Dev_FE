import PageMetaData from '@/components/PageMetaData'
import StudentDetails from './components/studentDetails'


const StudentAdminDetails = () => {
  return (
    <>
      <PageMetaData title="Institute Details" />
      {/* No extra card — the layout's content card is the only frame, as on the dashboard */}
      <StudentDetails />
    </>
  )
}

export default StudentAdminDetails
