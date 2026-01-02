import PageMetaData from '@/components/PageMetaData'
import CoursesList from './components/CoursesList'
import CourseCard from '@/app/demos/workshop/home/components/CourseCard'
import PopularCourse from '../bookmark/components/PopularCourse'
import LiveCourses from '../dashboard/components/LiveCourses'


const DashboardPage = () => {
  return (
    <>
      <PageMetaData title="Student Dashboard" />
      <CoursesList />
      {/* <LiveCourses/> */}
    </>
  )
}

export default DashboardPage
