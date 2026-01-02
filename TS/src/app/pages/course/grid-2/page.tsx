import Footer from '@/components/Footer'
import PageMetaData from '@/components/PageMetaData'
import ActionBox from './components/ActionBox'
import Courses from './components/Courses'
import PageBanner from './components/PageBanner'
import TopNavigationBar from './components/TopNavigationBar'

const CourseGrid2 = () => {
  return (
    <>
      <PageMetaData title="Course Grid2" />
      <TopNavigationBar />
      <main>
        <PageBanner />
        <Courses />
        <ActionBox />
      </main>
      <Footer className="bg-light" />
    </>
  )
}

export default CourseGrid2
