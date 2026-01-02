import Footer from '@/components/Footer'
import Banner from './components/Banner'
import EventDetailsContent from './components/EventDetailsContent'
import TopNavigationBar from './components/TopNavigationBar'
import PageMetaData from '@/components/PageMetaData'

const EventDetailPage = () => {
  return (
    <>
      <PageMetaData title="Event Detail" />
      <TopNavigationBar />
      <main>
        <Banner />
        <EventDetailsContent />
      </main>
      <Footer className="pt-5 bg-light" />
    </>
  )
}

export default EventDetailPage
