import PageMetaData from '@/components/PageMetaData'
import ActionBox from './components/ActionBox'
import ClientSlider from './components/ClientSlider'
import CourseSlider from './components/CourseSlider'
import Footer from './components/Footer'
import Hero from './components/Hero'
import Instructors from './components/Instructors'
import PopularCourses from './components/PopularCourses'
import TopNavigationBar from './components/TopNavigationBar'
import TrendingCourses from './components/TrendingCourses'
import WelcomeCard from './components/WelcomeCard'

const AcademicHome = () => {
  return (
    <>
      <PageMetaData title="Academy" />
      <TopNavigationBar />
      <main>
        <Hero />
        <CourseSlider />
        <WelcomeCard />
        <TrendingCourses />
        <PopularCourses />
        <Instructors />
        <ActionBox />
        <ClientSlider />
      </main>
      <Footer />
    </>
  )
}

export default AcademicHome
