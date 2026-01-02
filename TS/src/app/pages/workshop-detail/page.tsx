import PageMetaData from '@/components/PageMetaData'
import About from './components/About'
import ActionBox from './components/ActionBox'
import Banner from './components/Banner'
import Curriculum from './components/Curriculum'
import Footer from './components/Footer'
import Testimonials from './components/Testimonials'
import TopNavigationBar from './components/TopNavigationBar'

const WorkshopDetailPage = () => {
  return (
    <>
      <PageMetaData title="Workshop Detail" />
      <TopNavigationBar />
      <main>
        <Banner />
        <About />
        <ActionBox />
        <Curriculum />
        <Testimonials />
      </main>
      <Footer />
    </>
  )
}

export default WorkshopDetailPage
