import Footer from '@/components/Footer'
import PageMetaData from '@/components/PageMetaData'
import ActionBox from './components/ActionBox'
import CourseCategories from './components/CourseCategories'
import Hero from './components/Hero'
import Languages from './components/Languages'
import TopNavigationBar from './components/TopNavigationBar'

const Categories = () => {
  return (
    <>
      <PageMetaData title="Categories" />
      <TopNavigationBar />
      <Hero />
      <CourseCategories />
      <Languages />
      <ActionBox />
      <Footer className="bg-light" />
    </>
  )
}

export default Categories
