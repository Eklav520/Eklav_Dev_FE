import PageMetaData from '@/components/PageMetaData'
import Chart from './components/Chart'
import Counter from './components/Counter'
import CourseList from './components/CourseList'

const DashboardPage = () => {
  return (
    <>
      <PageMetaData title="Instructor Dashboard" />
      <Counter />
      <Chart />
      {/* <CourseList /> */}
    </>
  )
}

export default DashboardPage
