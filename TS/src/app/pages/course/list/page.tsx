import Footer from '@/components/Footer'
import PageMetaData from '@/components/PageMetaData'
import CourseList from './components/CourseList'
import Newsletter from './components/Newsletter'
import PageBanner from './components/PageBanner'
import TopNavigationBar from './components/TopNavigationBar'

const List = () => {
  return (
    <>
      <PageMetaData title="Course List" />
      <TopNavigationBar />
      <main>
        <PageBanner />
        <CourseList />
        <Newsletter />
      </main>
      <Footer className="bg-light" />
    </>
  )
}

export default List
