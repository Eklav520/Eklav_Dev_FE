import PageMetaData from '@/components/PageMetaData'
import { Card } from 'react-bootstrap'
import HRManager from './components/HRManager'

const HRDetailsPage = () => {
  return (
    <>
      <PageMetaData title="HR Management" />
      <Card className="bg-transparent border rounded-4">
        <HRManager />
      </Card>
    </>
  )
}

export default HRDetailsPage
