import TopNavigationBar from '@/components/error-components/TopNavigationBar'
import Banner from './components/Banner'
import CreateCourseForm from './components/CreateCourseForm'
import Footer from './components/Footer'

const CreateCoursePage = () => {
  return (
    <>
      <TopNavigationBar />
      <main>
        <Banner />
        <CreateCourseForm />
      </main>
      <Footer />
    </>
  )
}

export default CreateCoursePage
