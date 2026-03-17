import { Card } from 'react-bootstrap'
import PageMetaData from '@/components/PageMetaData'
import InstituteDetails from './components/InstituteDetails'

const InstituteAdminDetails = () => {
  return (
    <>
      <PageMetaData title="Institute Details" />
      <Card className="bg-transparent border rounded-4">
        <InstituteDetails />
      </Card>
    </>
  )
}

export default InstituteAdminDetails
