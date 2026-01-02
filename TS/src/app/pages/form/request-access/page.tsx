import PageMetaData from '@/components/PageMetaData'
import Client from './componets/Client'
import Footer from './componets/Footer'
import Hero from './componets/Hero'
import Newsletter from './componets/Newsletter'
import Testimonials from './componets/Testimonials'
import TopNavigationBar from './componets/TopNavigationBar'

const RequestAccessPage = () => {
  return (
    <>
      <PageMetaData title="Request Access" />
      <TopNavigationBar />
      <main>
        <Hero />
        <Client />
        <Testimonials />
        <Newsletter />
      </main>
      <Footer />
    </>
  )
}

export default RequestAccessPage
