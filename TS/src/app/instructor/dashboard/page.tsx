import PageMetaData from '@/components/PageMetaData'
import Chart from './components/Chart'
import Counter from './components/Counter'
import CourseList from './components/CourseList'
import JAMAttendanceChart from './components/JAMAttendanceChart'
import SelfInterviewChart from './components/SelfInterviewChart'
import SpeakingAttendanceChart from './components/SpeakingAttendanceChart'
import ReadingAttendanceChart from './components/ReadingAttendanceChart'
import WritingHistory from './components/WritingHistory'
import WritingAttendanceChart from './components/WritingAttendanceChart'
import ResumeInterviewAttendanceChart from './components/ResumeInterviewAttendanceChart'
import EnglishPracticeAttendanceChart from './components/EnglishPracticeAttendanceChart'

const DashboardPage = () => {
  return (
    <>
      <PageMetaData title="Instructor Dashboard" />
      <Counter />
      <Chart />
      <JAMAttendanceChart/>
      <SelfInterviewChart/>
      <SpeakingAttendanceChart />
      <ReadingAttendanceChart/>
      <WritingAttendanceChart />
      <ResumeInterviewAttendanceChart />
      <EnglishPracticeAttendanceChart />
      {/* <CourseList /> */}
    </>
  )
}

export default DashboardPage
