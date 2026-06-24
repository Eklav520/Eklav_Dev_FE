import PageMetaData from '@/components/PageMetaData'
import { Card } from 'react-bootstrap'
import InstituteStudentManager from './components/InstituteStudentManager'

const InstituteDetailsPage = () => {
  return (
    <>
      <PageMetaData title="Institute Student Management" />
      <Card className="bg-transparent border rounded-4">
        <InstituteStudentManager />
      </Card>
    </>
  )
}

export default InstituteDetailsPage
