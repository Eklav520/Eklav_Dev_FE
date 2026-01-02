// src/pages/MockInterview/MockInterview.tsx

import { useState } from 'react'
import { Container, Card, Button, ProgressBar } from 'react-bootstrap'
import QuestionCard from './QuestionCard'
import { interviewQuestions } from './interview.data'

type MockInterviewProps = {
  onFinish: () => void
}

const MockInterview: React.FC<MockInterviewProps> = ({ onFinish }) => {
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})

  const question = interviewQuestions[current]

  const handleNext = () => {
    if (current < interviewQuestions.length - 1) {
      setCurrent((c) => c + 1)
    } else {
      onFinish()
    }
  }

  const progress =
    ((current + 1) / interviewQuestions.length) * 100

  return (
    <Container className="mt-5 mb-5">
      {/* ===== Header ===== */}
      <Card className="p-4 shadow-lg mb-4">
        <h4 className="fw-bold">🎤 Mock Interview</h4>
        <p className="text-muted">
          Practice interview questions in a real interview flow
        </p>

        <ProgressBar now={progress} label={`${Math.round(progress)}%`} />
      </Card>

      {/* ===== Question ===== */}
      <QuestionCard
        question={question}
        answer={answers[question.id] || ''}
        onChange={(val) =>
          setAnswers({ ...answers, [question.id]: val })
        }
      />

      {/* ===== Navigation ===== */}
      <div className="d-flex justify-content-end mt-4">
        <Button
          onClick={handleNext}
          disabled={!answers[question.id]}
        >
          {current === interviewQuestions.length - 1
            ? 'Finish Interview'
            : 'Next'}
        </Button>
      </div>
    </Container>
  )
}

export default MockInterview
