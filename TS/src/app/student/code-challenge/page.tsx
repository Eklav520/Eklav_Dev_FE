import PageMetaData from '@/components/PageMetaData'
import StudentCodeChallengeComponent from './components/StudentCodeChallengeComponent';

const StudentCodeChallenge = () => {
  // later this can come from API or context
  const eventId = "demoEventId"; 
  const baseURL = import.meta.env.VITE_API_BASE_URL; 

  return (
    <>
      <PageMetaData title="Code Challenge" />
      {/* <StudentChallengeList eventId={eventId} baseURL={baseURL} /> */}
       <StudentCodeChallengeComponent />
    </>
  )
}

export default StudentCodeChallenge
