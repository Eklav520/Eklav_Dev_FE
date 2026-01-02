import Footer from '@/components/Footer'
import PageMetaData from '@/components/PageMetaData'
import About from './components/About'
import ActionBox from './components/ActionBox'
import ClientSlider from './components/ClientSlider'
import ContactForm from './components/ContactForm'
import Courses from './components/Courses'
import Hero from './components/Hero'
import TopCountries from './components/TopCountries'
import TopNavigationBar from './components/TopNavigationBar'

const AbroadHome = () => {
  return (
    <>
      <PageMetaData title="Abroad" />
      <TopNavigationBar />
      <main>
        <Hero />
        <TopCountries />
        <About />
        <Courses />
        <ClientSlider />
        <ActionBox />
        <ContactForm />
      </main>
      <Footer className="bg-light" />
    </>
  )
}

export default AbroadHome
