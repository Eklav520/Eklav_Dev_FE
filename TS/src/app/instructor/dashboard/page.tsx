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
import ListeningAttendanceChart from './components/ListeningAttendanceChart'
import SectionProgressDashboard from './components/SectionProgressDashboard'
import ReadingSectionProgressDashboard from './components/ReadingSectionProgressDashboard'
import ListeningSectionProgressDashboard from './components/ListeningSectionProgressDashboard'
import JustAMinuteSectionProgressDashboard from './components/JustAMinuteSectionProgressDashboard'
import EnglishPracticeSectionProgressDashboard from './components/EnglishPracticeSectionProgressDashboard'
import AdminSelfInterviewProgressTable from './components/AdminSelfInterviewProgressTable'
import EnglishPracticeLeaderboard from './components/EnglishPracticeLeaderboard'
import EnglishPracticeLeaderboardDashboard from './components/EnglishPracticeLeaderboardDashboard'
import JustAMinuteLeaderboardDashboard from './components/JustAMinuteLeaderboardDashboard'

const DashboardPage = () => {
  return (
    <>
      <PageMetaData title="Instructor Dashboard" />

      <Counter />
      <Chart />

      <JAMAttendanceChart />
      <SelfInterviewChart />
      <SpeakingAttendanceChart />
      <ReadingAttendanceChart />
      <WritingAttendanceChart />
      <ResumeInterviewAttendanceChart />
      <EnglishPracticeAttendanceChart />
      <ListeningAttendanceChart />

      {/* 🔹 Writing Section Progress */}
      <SectionProgressDashboard />

      {/* 🔹 Reading Section Progress (NEW) */}
      <ReadingSectionProgressDashboard />

      <ListeningSectionProgressDashboard/>

      <JustAMinuteSectionProgressDashboard/>

      <EnglishPracticeSectionProgressDashboard />

      <AdminSelfInterviewProgressTable/>

      <EnglishPracticeLeaderboardDashboard/>
      <JustAMinuteLeaderboardDashboard/>


      {/* <CourseList /> */}
    </>
  )
}

export default DashboardPage
