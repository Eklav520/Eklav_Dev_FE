import Footer from '@/components/Footer'
import PageMetaData from '@/components/PageMetaData'
import Banner from './components/Banner'
import Blogs from './components/Blogs'
import TopNavigationBar from './components/TopNavigationBar'

const BlogGrid = () => {
  return (
    <>
      <PageMetaData title="Blog Grid" />
      <TopNavigationBar />
      <main>
        <Banner />
        <Blogs />
      </main>
      <Footer className="bg-light" />
    </>
  )
}
export default BlogGrid
