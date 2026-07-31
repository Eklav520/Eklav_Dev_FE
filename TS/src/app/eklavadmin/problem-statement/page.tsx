import { useState } from 'react'
import PageMetaData from '@/components/PageMetaData'
import AdminCreateProblem from './components/AdminCreateProblem'
import AdminViewSubmissions from './components/AdminViewSubmissions'
import AdminCreateChallenge from './components/AdminCreateChallenge'
import AdminChallengeList from './components/AdminChallengeList'
import AdminProblemsUpload from './components/AdminProblemsUpload'
import AdminSolutionRunner from './components/AdminSolutionRunner'

type ViewMode = 'upload' | 'solutions'

const ProblemStatement = () => {
  const [view, setView] = useState<ViewMode>('upload')

  return (
    <>
      <PageMetaData title="Communication Skills" />
      {/* <AdminCreateProblem /> */}
      {/* <AdminCreateChallenge/> */}
      {/* <AdminSubmissionList/> */}

      <div style={{ margin: '1rem', display: 'flex', gap: 8 }}>
        <button
          onClick={() => setView('upload')}
          className={view === 'upload' ? 'btn btn-primary' : 'btn btn-outline-primary'}
          type="button"
        >
          Upload Problems
        </button>

        <button
          onClick={() => setView('solutions')}
          className={view === 'solutions' ? 'btn btn-success' : 'btn btn-outline-success'}
          type="button"
        >
          AI Solutions &amp; Tests
        </button>
      </div>

      {view === 'upload' ? <AdminProblemsUpload /> : <AdminSolutionRunner />}
    </>
  )
}

export default ProblemStatement
