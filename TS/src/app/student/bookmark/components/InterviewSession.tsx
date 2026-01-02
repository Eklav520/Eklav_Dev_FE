import React, { useState } from 'react'
import VoiceAnswer from './VoiceAnswer'
import { useAuthContext } from '@/context/useAuthContext'
import { Card, Button, Row, Col, Alert, Badge } from 'react-bootstrap'
import VideoRecorder from './VideoRecorder'

interface InterviewSessionProps {
  interviewId: string
  initialQuestion: string
  totalQuestions: number
}

const InterviewSession: React.FC<InterviewSessionProps> = ({ interviewId, initialQuestion, totalQuestions }) => {
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const [question, setQuestion] = useState<string | null>(initialQuestion)
  const [answer, setAnswer] = useState<string>('')
  const [feedback, setFeedback] = useState<string>('')
  const [rating, setRating] = useState<number | null>(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [interviewFinished, setInterviewFinished] = useState(false);
  const { user } = useAuthContext()
  const token = user?.token

  // Submit answer to backend and get feedback
  const submitAnswer = async (inputAnswer: string) => {
    const response = await fetch(`${baseURL}/answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        interviewId,
        question,
        answer: inputAnswer,
        questionIndex,
      }),
    })

    const data = await response.json()
    setFeedback(data.feedback)
    setRating(data.rating)
  }

/*   // Fetch next question from backend
  const fetchNextQuestion = async () => {
    const response = await fetch('http://localhost:3000/next-question', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        interviewId,
        questionIndex: questionIndex + 1,
      }),
    })

    const data = await response.json()
    if (data.nextQuestion) {
      setQuestion(data.nextQuestion)
      setQuestionIndex((prev) => prev + 1)
      setFeedback('')
      setRating(null)
    } else {
      setQuestion(null)
    }
  } */

  // Handle single button click for submit or skip + next
 const handleNext = async () => {
  let data;

  if (answer.trim()) {
    const response = await fetch(`${baseURL}/answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        interviewId,
        question,
        answer,
        questionIndex,
      }),
    });
    data = await response.json();
  } else {
    const response = await fetch(`${baseURL}/answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        interviewId,
        question,
        answer: '',
        questionIndex,
      }),
    });
    data = await response.json();
  }

  setAnswer('');
  setFeedback(data.feedback);
  setRating(data.rating);

  if (data.nextQuestion) {
    setQuestion(data.nextQuestion);
    setQuestionIndex((prev) => prev + 1);
  } else {
    setQuestion(null);
    setInterviewFinished(true); // Stop video recording
  }
};


  /* if (!question) {
    return <h4>🎉 Interview Complete!</h4>
  } */

  return (
  <div className="mt-4">
    <VideoRecorder interviewId={interviewId} token={token} stopRecording={interviewFinished} />

    {!question ? (
      <h4>🎉 Interview Complete!</h4>
    ) : (
      <Card className="shadow p-4">
        <h4 className="mb-4">
          🧠 <strong>Question:</strong> <span className="text-primary">{question}</span>
        </h4>

        <VoiceAnswer
          onSubmit={(transcript) => {
            setAnswer(transcript);
            submitAnswer(transcript);
          }}
        />

        <textarea
          className="form-control mt-3"
          rows={3}
          placeholder="Type your answer..."
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
        />

        <Row className="mt-4">
          <Col>
            <Button
              variant="outline-secondary"
              className="w-100"
              onClick={handleNext}
            >
              {questionIndex + 1 >= totalQuestions ? '🎉 Finish Interview' : '⏭️ Skip / Next Question'}
            </Button>
          </Col>
        </Row>

        {feedback && (
          <Alert variant="info" className="mt-4">
            <h5>📝 AI Feedback</h5>
            <p>{feedback}</p>
            <p>
              <strong>Rating:</strong> <Badge bg={rating && rating >= 7 ? 'success' : 'warning'}>{rating}/10</Badge>
            </p>
          </Alert>
        )}
      </Card>
    )}
  </div>
);

}

export default InterviewSession
