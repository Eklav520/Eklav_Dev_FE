import { Card } from 'react-bootstrap'
import PageMetaData from '@/components/PageMetaData'
import AdminReelUpload from './components/AdminReelUpload'


const AdminReel = () => {
  return (
    <>
      <PageMetaData title="Admin Reel Upload" />
      <Card className="bg-transparent border rounded-4">
        <AdminReelUpload />
      </Card>
    </>
  )
}

export default AdminReel
