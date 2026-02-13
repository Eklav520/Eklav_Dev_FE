import PageMetaData from '@/components/PageMetaData'
import Counter from './components/Counter'
import CoursesList from './components/CoursesList'
import Hero from './components/Hero'
import LiveCourses from './components/LiveCourses'
import BookClass from './components/BookClass'
import StudentDashboardUpdated from './components/StudentDashboradUpdated'



const DashboardPage = () => {
  return (
    <>
      <PageMetaData title="Student Dashboard" />
      

      <StudentDashboardUpdated/> 

     
    </>
  )
}

export default DashboardPage
