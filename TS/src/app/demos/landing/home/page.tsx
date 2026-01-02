import PageMetaData from '@/components/PageMetaData'
import About from './components/About'
import ActionBox from './components/ActionBox'
import Download from './components/Download'
import Footer from './components/Footer'
import Hero from './components/Hero'
import TestimonialSlider from './components/TestimonialSlider'
import TopCourses from './components/TopCourses'
import TopNavigationBar from './components/TopNavigationBar'

const LandingHome = () => {
  return (
    <>
      <PageMetaData title="Landing" />
      <TopNavigationBar />
      <main>
        <Hero />
        <About />
        <TopCourses />
        <Download />
        <ActionBox />
        <TestimonialSlider />
      </main>
      <Footer />
    </>
  )
}

export default LandingHome
