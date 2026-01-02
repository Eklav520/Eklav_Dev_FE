import React, { useState } from 'react';
import { Form, Button, Container, Row, Col, Card } from 'react-bootstrap';
import BulkUpload from '../../aptitudeQuestionsUpload/components/BulkUpload';

const UploadAptitudeQuestion = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const [formData, setFormData] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswerIndex: '',
    explanation: '',
  });

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    const response = await fetch(`${baseURL}/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...formData,
        correctAnswerIndex: parseInt(formData.correctAnswerIndex, 10),
      }),
    });

    const data = await response.json();

    if (response.ok) {
      alert('Question submitted successfully!');
      setFormData({
        question: '',
        options: ['', '', '', ''],
        correctAnswerIndex: '',
        explanation: '',
      });
    } else {
      alert(`Error: ${data.message || 'Failed to submit question'}`);
    }
  } catch (error) {
    console.error('Submit error:', error);
    alert('Server error. Please try again later.');
  }
};


  return (
    
      <Card className="border bg-transparent rounded-3 mt-4">
        <Card.Header>
          <h4 className="mb-0">Upload Aptitude Question</h4>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Question</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Enter the question"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                required
              />
            </Form.Group>

            <Row>
              {formData.options.map((opt, idx) => (
                <Col md={6} key={idx} className="mb-3">
                  <Form.Group>
                    <Form.Label>Option {String.fromCharCode(65 + idx)}</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder={`Enter option ${idx + 1}`}
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      required
                    />
                  </Form.Group>
                </Col>
              ))}
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Correct Answer</Form.Label>
              <Form.Select
                value={formData.correctAnswerIndex}
                onChange={(e) => setFormData({ ...formData, correctAnswerIndex: e.target.value })}
                required
              >
                <option value="">-- Select Correct Option --</option>
                {formData.options.map((_, idx) => (
                  <option key={idx} value={idx}>
                    Option {String.fromCharCode(65 + idx)}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Explanation</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Enter explanation for the answer"
                value={formData.explanation}
                onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              />
            </Form.Group>

            <div className="d-grid">
              <Button variant="primary" type="submit">
                Submit Question
              </Button>
            </div>
          </Form>
          {/* <BulkUpload/> */}
        </Card.Body>
      </Card>
   
  );
};

export default UploadAptitudeQuestion;
