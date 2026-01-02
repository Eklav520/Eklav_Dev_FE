import PageMetaData from '@/components/PageMetaData'
import About from './components/About'
import Clients from './components/Clients'
import CookieAlertBox from './components/CookieAlertBox'
import EducationEvents from './components/EducationEvents'
import Footer from './components/Footer'
import Hero from './components/Hero'
import NewsLetter from './components/NewsLetter'
import TopNavigationBar from './components/TopNavigationBar'
import TopUserNotice from './components/TopUserNotice'
import TrendingCourses from './components/TrendingCourses'
import Video from './components/Video'

const EducationHome = () => {
  return (
    <>
      <PageMetaData title="Education" />
      <TopUserNotice />
      <TopNavigationBar />
      <main>
        <Hero />
        <Clients />
        <About />
        <TrendingCourses />
        <Video />
        <EducationEvents />
        <NewsLetter />
      </main>
      <Footer />
      <CookieAlertBox />
    </>
  )
}

export default EducationHome
