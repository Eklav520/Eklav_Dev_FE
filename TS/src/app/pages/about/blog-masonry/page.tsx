import PageMetaData from '@/components/PageMetaData'
import Banner from './components/Banner'
import Blogs from './components/Blogs'
import TopNavigationBar from './components/TopNavigationBar'

const BlogMasonry = () => {
  return (
    <>
      <PageMetaData title="Blog Masonry" />
      <TopNavigationBar />
      <main>
        <Banner />
        <Blogs />
      </main>
    </>
  )
}
export default BlogMasonry
