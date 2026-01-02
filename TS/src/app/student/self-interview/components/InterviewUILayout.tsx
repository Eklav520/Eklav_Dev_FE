import React from 'react'
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap'
import './InterviewLayout.css'

const InterviewUILayout = () => {
  return (
    <>
      <div className="interview-blur-overlay"></div>

      <div className="interview-page-bg">
        <Container fluid className="p-4">
          {/* === TOP HEADER === */}
          <Row className="mb-4">
            <Col>
              <h3 className="fw-bold">Interview for UI/UX Designer</h3>
            </Col>
            <Col xs="auto" className="d-flex align-items-center">
              <img src="https://i.pravatar.cc/40" alt="" className="rounded-circle me-2" />
              <strong>Zaim Maulana</strong>
            </Col>
          </Row>

          <Row>
            {/* ================= LEFT SECTION ================= */}
            <Col md={7}>
              <Card className="shadow-sm p-3 mb-4 rounded-4">
                {/* === VIDEO SECTION === */}
                <div className="video-container rounded-4">
                  <div className="main-video"></div>

                  {/* top-right small participants */}
                  <div className="small-video-group">
                    <div className="small-video"></div>
                    <div className="small-video"></div>
                  </div>
                </div>

                {/* === Video Buttons === */}
                <div className="video-action-buttons d-flex justify-content-center gap-4 mt-3">
                  <Button variant="success" className="video-btn">
                    Start
                  </Button>
                  <Button variant="primary" className="video-btn">
                    Next
                  </Button>
                </div>

                {/* === AI FEEDBACK SECTION === */}
                <Card className="p-4 shadow-sm rounded-4 mt-4 ai-feedback-card">
                  <h5 className="text-muted mb-3">AI Feedback</h5>

                  <p className="text-muted mb-0">Submit your answer to see the AI-generated feedback here.</p>

                  {/* Example feedback block */}
                  <div className="feedback-block mt-3">
                    <h6 className="fw-bold">Analysis</h6>
                    <p className="feedback-text">Your explanation is good but lacks details on lexical scoping...</p>

                    <h6 className="fw-bold mt-3">Expected Answer</h6>
                    <p className="feedback-text">Closures allow inner functions to access variables of outer functions...</p>

                    <h6 className="fw-bold mt-3">Suggestions</h6>
                    <ul>
                      <li>Explain variable scope</li>
                      <li>Give a code example</li>
                    </ul>

                    <h6 className="fw-bold mt-3">Score</h6>
                    <span className="score-badge">7/10</span>
                  </div>

                  {/* === Score Circles === */}
                  {/* <Row className="text-center mt-4 score-row">
                    <Col>
                      <div className="score-circle purple">80%</div>
                      <p className="score-label">AI Video Score</p>
                    </Col>

                    <Col>
                      <div className="score-circle orange">75%</div>
                      <p className="score-label">Workmap Score</p>
                    </Col>
                  </Row>
 */}
                </Card>
              </Card>
            </Col>

            {/* ================= RIGHT SECTION ================= */}
            <Col md={5} className="align-top">
              <Card className="shadow-sm p-4 rounded-4 right-panel">
                {/* === MOVED QUESTION HERE === */}
                <div className="question-box-wrapper mb-4">
                  <div className="question-icon">
                    <span>🎯</span>
                  </div>

                  <div className="question-content">
                    <h6 className="question-title">Interview Question</h6>
                    <p className="question-text">Your resume is amazing Richard, next tell me why you choose this company?</p>
                  </div>
                </div>

                <h5 className="text-muted mb-3">Your Answer</h5>

                {/* Transcript */}
                <div className="transcript-display mb-3">
                  <p className="small text-muted mb-1">🎤 Voice Transcript</p>

                  <div className="transcript-box answer-transcript large-transcript">Start speaking... your transcript will appear here.</div>
                </div>

                {/* Terminal-style input */}
                <p className="small text-muted mb-1">💻 Type your answer or write code:</p>

                <div className="terminal-box mb-3">
                  <Form.Control as="textarea" rows={8} className="terminal-textarea" placeholder="Write your explanation or code here..." />
                </div>

                {/* Submit Button */}
                <Button variant="primary" className="w-100 mt-2 py-2 fw-bold">
                  Submit Answer
                </Button>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  )
}

export default InterviewUILayout
