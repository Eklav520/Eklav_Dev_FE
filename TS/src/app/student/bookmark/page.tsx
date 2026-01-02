import { Card, CardHeader } from 'react-bootstrap'
import Bookmark from './components/Bookmark'
import PageMetaData from '@/components/PageMetaData'
import PopularCourse from './components/PopularCourse'
import MockInterviewVideos from './components/MockInterviewVideos'



const BookmarkPage = () => {
  return (
    <>
      <PageMetaData title="Wishlist" />
      <Card className="bg-transparent border rounded-4">
         {/* <PopularCourse/> */}
         <MockInterviewVideos />
      </Card>
    </>
  )
}

export default BookmarkPage
