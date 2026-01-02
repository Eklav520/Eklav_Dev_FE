import Footer from '@/components/Footer'
import PageMetaData from '@/components/PageMetaData'
import ContactCards from './components/ContactCards'
import ContactFormAndMap from './components/ContactFormAndMap'
import TopNavigationBar from './components/TopNavigationBar'

const ContactUs = () => {
  return (
    <>
      <PageMetaData title="Contact Us" />
      <TopNavigationBar />
      <main>
        <ContactCards />
        <ContactFormAndMap />
      </main>
      <Footer className="bg-light" />
    </>
  )
}
export default ContactUs
