import { useAuthContext } from '@/context/useAuthContext'
import React, { useState } from 'react'
import { Form, Button, Container, Row, Col } from 'react-bootstrap'

interface TopicSelectionProps {
  onStart: (interviewId: string, question: string,totalQuestions: number) => void
}

const TopicSelection: React.FC<TopicSelectionProps> = ({ onStart }) => {
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const [topic, setTopic] = useState<string>('react')
  const { user } = useAuthContext()
  const token = user?.token

  const startInterview = async () => {
    const response = await fetch(`${baseURL}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ topic }), // ✅ use state value
    })

    const data = await response.json()
    onStart(data.interviewId, data.question, data.totalQuestions);
  }

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={6}>
          <h3 className="mb-4 text-center">🎤 Select a Topic to Begin</h3>
          <Form>
            <Form.Group controlId="formTopic">
              <Form.Label>Choose Topic</Form.Label>
              <Form.Select value={topic} onChange={(e) => setTopic(e.target.value)}>
                <option value="react">React</option>
                <option value="javascript">JavaScript</option>
                <option value="html">HTML</option>
              </Form.Select>
            </Form.Group>

            <div className="d-grid gap-2 mt-4">
              <Button variant="primary" size="lg" onClick={startInterview}>
                🚀 Start Interview
              </Button>
            </div>
          </Form>
        </Col>
      </Row>
    </Container>
  )
}

export default TopicSelection
