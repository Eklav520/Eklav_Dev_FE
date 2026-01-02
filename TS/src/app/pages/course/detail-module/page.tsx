import Footer from '@/components/Footer'
import PageMetaData from '@/components/PageMetaData'
import CourseDetail from './components/CourseDetail'
import Intro from './components/Intro'
import TopNavigationBar from './components/TopNavigationBar'

const CourseDetailModule = () => {
  return (
    <>
      <PageMetaData title="Course Module" />
      <TopNavigationBar />
      <main>
        <Intro />
        <CourseDetail />
      </main>
      <Footer className="bg-light" />
    </>
  )
}
export default CourseDetailModule
