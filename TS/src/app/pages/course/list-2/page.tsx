import Footer from '@/components/Footer'
import PageMetaData from '@/components/PageMetaData'
import ActionBox from './components/ActionBox'
import CourseList from './components/CourseList'
import PageBanner from './components/PageBanner'
import TopNavigationBar from './components/TopNavigationBar'

const List2 = () => {
  return (
    <>
      <PageMetaData title="Course List Minimal" />
      <TopNavigationBar />
      <main>
        <PageBanner />
        <CourseList />
        <ActionBox />
      </main>
      <Footer className="bg-light" />
    </>
  )
}

export default List2
