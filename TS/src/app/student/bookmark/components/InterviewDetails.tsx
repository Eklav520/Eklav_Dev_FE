import { Accordion, Card, CardBody, CardHeader, CardTitle, Col, Row } from 'react-bootstrap'
import TopicSelection from './TopicSelection'
import { SetStateAction, useState } from 'react'
import InterviewSession from './InterviewSession'

const InterviewDetails: React.FC = () => {
  const [interviewId, setInterviewId] = useState<string | null>(null)
  const [initialQuestion, setInitialQuestion] = useState<string | null>(null)
  const [totalQuestions, setTotalQuestions] = useState<number>(0)

  return (
    <div className="App">
      {!interviewId || !initialQuestion ? (
        <TopicSelection
          onStart={(id: string, question: string, total: number) => {
            setInterviewId(id)
            setInitialQuestion(question)
            setTotalQuestions(total)
          }}
        />
      ) : (
        <InterviewSession
          interviewId={interviewId}
          initialQuestion={initialQuestion}
          totalQuestions={totalQuestions || 0} // fallback to 0 if null
        />
      )}
    </div>
  )
}

export default InterviewDetails
