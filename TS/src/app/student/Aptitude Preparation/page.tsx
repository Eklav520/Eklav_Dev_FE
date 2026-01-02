import { Card, CardHeader } from 'react-bootstrap'
import PageMetaData from '@/components/PageMetaData'
import Bookmark from './components/Bookmark'
import ResumeBuilder from './components/ResumeBuilder'

const Aptitude = () => {
  return (
    <>
      <PageMetaData title="Wishlist" />
      <Card className="bg-transparent border rounded-4">
         <Bookmark/>
      </Card>
    </>
  )
}

export default Aptitude
