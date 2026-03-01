import { Card } from 'react-bootstrap'
import PageMetaData from '@/components/PageMetaData'
import AdminUploadQuestions from './components/AdminUploadQuestions'

const CompanyInterview = () => {
  return (
    <>
      <PageMetaData title="Company Interview" />
      <Card className="bg-transparent border rounded-4">
        <AdminUploadQuestions />
      </Card>
    </>
  )
}

export default CompanyInterview
