import Footer from '@/components/Footer'
import PageMetaData from '@/components/PageMetaData'
import ActionBox from './components/ActionBox'
import Banner from './components/Banner'
import Counter from './components/Counter'
import FormAndTabs from './components/FormAndTabs'
import Steps from './components/Steps'
import TopNavigationBar from './components/TopNavigationBar'

const BecomeInstructorPage = () => {
  return (
    <>
      <PageMetaData title="Become Instructor" />
      <TopNavigationBar />
      <main>
        <Banner />
        <Steps />
        <Counter />
        <FormAndTabs />
        <ActionBox />
      </main>
      <Footer className="bg-light" />
    </>
  )
}

export default BecomeInstructorPage
