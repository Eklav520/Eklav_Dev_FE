import Footer from '@/components/Footer'
import PageMetaData from '@/components/PageMetaData'
import About from './components/About'
import Counter from './components/Counter'
import HeroSlider from './components/HeroSlider'
import LatestNews from './components/LatestNews'
import TopAlert from './components/TopAlert'
import TopCollages from './components/TopCollages'
import TopNavigationBar from './components/TopNavigationBar'
import UpcomingEvents from './components/UpcomingEvents'

const UniversityHome = () => {
  return (
    <>
      <PageMetaData title="University" />
      <TopAlert />
      <TopNavigationBar />
      <main>
        <HeroSlider />
        <About />
        <TopCollages />
        <Counter />
        <LatestNews />
        <UpcomingEvents />
      </main>
      <Footer className="bg-light" />
    </>
  )
}

export default UniversityHome
