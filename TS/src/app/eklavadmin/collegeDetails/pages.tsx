import { Card } from 'react-bootstrap'
import PageMetaData from '@/components/PageMetaData'
import CollegeAdmin from './components/CollegeAdmin'

const CollegeAdminDetails = () => {
  return (
    <>
      <PageMetaData title="Company Interview" />
      <Card className="bg-transparent border rounded-4">
        <CollegeAdmin />
      </Card>
    </>
  )
}

export default CollegeAdminDetails
