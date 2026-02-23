import PageMetaData from '@/components/PageMetaData'
import AdminCreateProblem from './components/AdminCreateProblem'
import AdminViewSubmissions from './components/AdminViewSubmissions'
import AdminCreateChallenge from './components/AdminCreateChallenge'
import AdminChallengeList from './components/AdminChallengeList'
import AdminProblemsUpload from './components/AdminProblemsUpload'



const ProblemStatement = () => {
  return (
    <>
      <PageMetaData title="Communication Skills" />
      {/* <AdminCreateProblem /> */}
      {/* <AdminCreateChallenge/> */}
      {/* <AdminSubmissionList/> */}

      <AdminProblemsUpload/>

    </>
  )
}

export default ProblemStatement
