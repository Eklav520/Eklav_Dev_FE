import PageMetaData from '@/components/PageMetaData'
import { Card } from 'react-bootstrap'
import CollegeLabsUpload from './components/CollegeLabsUpload'

const CollegeLabsUploadPage = () => {
  return (
    <>
      <PageMetaData title="College Labs Upload" />
      <Card className="bg-transparent border rounded-4">
        <CollegeLabsUpload />
      </Card>
    </>
  )
}

export default CollegeLabsUploadPage
