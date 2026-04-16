import PageMetaData from '@/components/PageMetaData'
import { Card } from 'react-bootstrap'
import StudentCollegeLabsPage from './components/StudentCollegeLabsPage'


const CollegeLabsPage = () => {
  return (
    <>
      <PageMetaData title="College Labs Upload" />
      <Card className="bg-transparent border rounded-4">
        <StudentCollegeLabsPage />
      </Card>
    </>
  )
}

export default CollegeLabsPage
