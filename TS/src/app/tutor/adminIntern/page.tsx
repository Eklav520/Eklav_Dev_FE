import { Card } from 'react-bootstrap'
import PageMetaData from '@/components/PageMetaData'
import InternshipManagement from './components/InternshipManagement'



const AdminIntern = () => {
  return (
    <>
      <PageMetaData title="Admin Reel Upload" />
      <Card className="bg-transparent border rounded-4">
        <InternshipManagement />
      </Card>
    </>
  )
}

export default AdminIntern
