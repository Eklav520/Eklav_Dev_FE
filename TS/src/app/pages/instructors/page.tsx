import Footer from '@/components/Footer'
import PageMetaData from '@/components/PageMetaData'
import ActionBox from './components/ActionBox'
import Banner from './components/Banner'
import InstructorLists from './components/InstructorLists'
import TopNavigationBar from './components/TopNavigationBar'

const Instructors = () => {
  return (
    <>
      <PageMetaData title="Instructor List" />
      <TopNavigationBar />
      <main>
        <Banner />
        <InstructorLists />
        <ActionBox />
      </main>
      <Footer className="bg-light" />
    </>
  )
}
export default Instructors
