// src/pages/MockInterview/QuestionCard.tsx

import { Card, Form } from 'react-bootstrap'
import { InterviewQuestion } from './interview.data'

type Props = {
  question: InterviewQuestion
  answer: string
  onChange: (value: string) => void
}

const QuestionCard: React.FC<Props> = ({
  question,
  answer,
  onChange,
}) => {
  return (
    <Card className="p-4 shadow-sm">
      <h5 className="fw-bold mb-3">{question.question}</h5>

      <Form.Control
        as="textarea"
        rows={4}
        placeholder="Type your answer here..."
        value={answer}
        onChange={(e) => onChange(e.target.value)}
      />
    </Card>
  )
}

export default QuestionCard
