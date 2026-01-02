import PageMetaData from '@/components/PageMetaData'
import ContactForm from './components/ContactForm'
import Faqs from './components/Faqs'
import Footer from './components/Footer'
import Hero from './components/Hero'
import Services from './components/Services'
import TopNavigationBar from './components/TopNavigationBar'

const TutorHome = () => {
  return (
    <>
      <PageMetaData title="Tutor" />
      <TopNavigationBar />
      <main>
        <Hero />
        <Services />
        <ContactForm />
        <Faqs />
      </main>
      <Footer />
    </>
  )
}

export default TutorHome
