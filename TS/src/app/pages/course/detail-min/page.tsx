import Footer from '@/components/Footer'
import PageMetaData from '@/components/PageMetaData'
import BannerVideo from './components/BannerVideo'
import CourseDetails from './components/CourseDetails'
import TopNavigationBar from './components/TopNavigationBar'

const DetailMinimal = () => {
  return (
    <>
      <PageMetaData title="Detail Minimal" />
      <TopNavigationBar />
      <main>
        <BannerVideo />
        <CourseDetails />
      </main>
      <Footer className="bg-light" />
    </>
  )
}

export default DetailMinimal
