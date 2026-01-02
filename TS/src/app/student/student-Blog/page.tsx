import Footer from '@/components/Footer'
import PageMetaData from '@/components/PageMetaData'
import Banner from './components/Banner'

import { Card } from 'react-bootstrap'

const BlogGrid = () => {
  return (
    <>
      {/* <PageMetaData title="Blog Grid" />
      <TopNavigationBar />
      <main>
        <Banner/>
        <Blogs />
      </main>
      <Footer className="bg-light" /> */}
      <PageMetaData title="Self Interview" />
      <Card className="bg-transparent border rounded-4">
        <Banner/>
      </Card>
    </>
  )
}
export default BlogGrid
