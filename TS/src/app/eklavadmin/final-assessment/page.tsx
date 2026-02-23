import React, { useState } from 'react'
import { Card, Button } from 'react-bootstrap'
import PageMetaData from '@/components/PageMetaData'
import AdminQuizUpload from './components/QuizComponents/AdminQuizUpload'
import AdminCreateProblem from './components/CodeChallenegeComponents/CreateCodeChallenge'
import AdminManageChallenges from './components/CodeChallenegeComponents/AdminManageChallenges'
import InterviewQuestions from './components/InterviewQuestions/InterviewQuestions'
import AdminReview from './components/AdminReview'
import HRInterviewQuestions from './components/HRRoundQuestions/HRInterviewQuestions'

export default function FinalAssessmentPage() {
  const [view, setView] = useState('quiz') // 'quiz' | 'code' | 'tr' | 'hr'

  return (
    <>
      <PageMetaData title="Admin - Assessments" />

      <div className="d-flex flex-wrap gap-2 mb-3">
        <Button variant={view === 'quiz' ? 'primary' : 'outline-primary'} onClick={() => setView('quiz')}>
          Quiz
        </Button>

        <Button variant={view === 'code' ? 'success' : 'outline-success'} onClick={() => setView('code')}>
          Code Challenge
        </Button>

        <Button variant={view === 'tr' ? 'info' : 'outline-info'} onClick={() => setView('tr')}>
          TR Interview
        </Button>

        <Button variant={view === 'hr' ? 'warning' : 'outline-warning'} onClick={() => setView('hr')}>
          HR Interview
        </Button>
      </div>

      {/* Render views */}
      <div>
        {view === 'quiz' && (
          <Card className="bg-transparent border rounded-4 mb-3">
            <Card.Body>
              <h5 className="mb-3">Quiz Assessment (Quiz Upload & Templates)</h5>
              <AdminQuizUpload />
            </Card.Body>
          </Card>
        )}

        {view === 'code' && (
          <div>
            <Card className="bg-transparent border rounded-4 mb-3">
              <Card.Body>
                <AdminCreateProblem />
              </Card.Body>
            </Card>

            <Card className="bg-transparent border rounded-4">
              <Card.Body>
                <AdminManageChallenges eventId={'demoEventId'} baseURL={import.meta.env.VITE_API_BASE_URL} />
              </Card.Body>
            </Card>
          </div>
        )}

        {view === 'tr' && (
          <Card className="bg-transparent border rounded-4 mb-3">
            <Card.Body>
              <h5 className="mb-3">TR Interview Questions</h5>
              <InterviewQuestions />
            </Card.Body>
          </Card>
        )}

        {view === 'hr' && (
          <Card className="bg-transparent border rounded-4 mb-3">
            <Card.Body>
              <h5 className="mb-3">HR Interview Questions</h5>
              <HRInterviewQuestions />
            </Card.Body>
          </Card>
        )}
      </div>
    </>
  )
}
