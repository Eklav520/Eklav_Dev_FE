import Footer from '@/components/Footer'
import PageMetaData from '@/components/PageMetaData'
//import ActionBox from './components/ActionBox'
import Counter from './components/Counter'
import Hero from './components/Hero'
import PopularCourse from './components/PopularCourse'
import Reviews from './components/Reviews'
import TopNavbar1 from './components/TopNavbar1'
//import TrendingCourses from './components/TrendingCourses'
import WelcomeCard from './components/WelcomeCard'

const HomePage = () => {
  return (
    <>
      <PageMetaData title="Home" />
      <TopNavbar1 />
      <main>
        <Hero />
        <WelcomeCard />
        <Counter />
        <PopularCourse />
        
        
       {/*  <ActionBox /> */}
        {/* <TrendingCourses /> */}
        <Reviews />
      </main>
      <Footer />
    </>
  )
}

export default HomePage
