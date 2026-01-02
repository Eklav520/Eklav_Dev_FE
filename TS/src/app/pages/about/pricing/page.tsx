import Footer from '@/components/Footer'
import PageMetaData from '@/components/PageMetaData'
import ClientSlider from './components/ClientSlider'
import Faqs from './components/Faqs'
import Features from './components/Features'
import PricingPlans from './components/PricingPlans'
import TopNavigationBar from './components/TopNavigationBar'

const Pricing = () => {
  return (
    <>
      <PageMetaData title="Contact Us" />
      <TopNavigationBar />
      <main>
        <PricingPlans />
        <ClientSlider />
        <Features />
        <Faqs />
      </main>
      <Footer className="bg-light" />
    </>
  )
}
export default Pricing
