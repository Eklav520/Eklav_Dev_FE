import Footer from '@/components/Footer'
import PageMetaData from '@/components/PageMetaData'
import Courses from './components/Courses'
import NewsLetter from './components/NewsLetter'
import PageBanner from './components/PageBanner'
import TopNavigationBar from './components/TopNavigationBar'

const CourseGrid = () => {
  return (
    <>
      <PageMetaData title="Course Grid" />
      <TopNavigationBar />
      <main>
        <PageBanner />
        <Courses />
        <NewsLetter />
        <Footer className="bg-light" />
      </main>
    </>
  )
}

export default CourseGrid
