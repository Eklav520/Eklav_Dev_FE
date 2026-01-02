import PageMetaData from '@/components/PageMetaData'
import Footer from './components/Footer'
import Hero from './components/Hero'
import OfferCourses from './components/OfferCourses'
import Portfolio from './components/Portfolio'
import Steps from './components/Steps'
import TopNavigationBar from './components/TopNavigationBar'

const KindergartenHome = () => {
  return (
    <>
      <PageMetaData title="Kindergarten" />
      <TopNavigationBar />
      <main>
        <Hero />
        <Steps />
        <OfferCourses />
        <Portfolio />
      </main>
      <Footer />
    </>
  )
}

export default KindergartenHome
