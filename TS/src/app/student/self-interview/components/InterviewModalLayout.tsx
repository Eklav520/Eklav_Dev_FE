import React, { useState, useRef, useEffect } from 'react'
import { Modal, Row, Col, Card, Badge, Button } from 'react-bootstrap'
import TopicSelection from './TopicSelection'
import ResumeInterviewSelection from './ResumeInterviewSelection'
import InterviewUILayoutWithLogic from './InterviewUILayoutWithLogic'
import { FaLaptopCode, FaFileAlt, FaTimes, FaInfoCircle, FaDesktop } from 'react-icons/fa'

const InterviewModalLayout = () => {
  const [show, setShow] = useState(false)
  const [interviewId, setInterviewId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<string[]>([])
  const [title, setTitle] = useState<string>('')

  const modalRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Check if mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleStart = (
    id: string,
    questions: string[],
    totalQuestions: number,
    title: string
  ) => {
    setInterviewId(id)
    setQuestions(questions)
    setTitle(title)
    setShow(true)
  }

  // Enter fullscreen when modal opens (only on desktop)
  useEffect(() => {
    if (show && modalRef.current && !document.fullscreenElement && !isMobile) {
      modalRef.current.requestFullscreen().catch(() => {
        console.log('Fullscreen request failed')
      })
    }
  }, [show, isMobile])

  // Exit fullscreen + close modal
  const handleClose = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      }
    } catch (e) {
      console.warn('Exit fullscreen failed', e)
    }

    setShow(false)
    setInterviewId(null)
    setQuestions([])
    setTitle('')
  }

  // Handle escape key to exit fullscreen
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && document.fullscreenElement) {
        handleClose()
      }
    }

    if (show) {
      document.addEventListener('keydown', handleEscKey)
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey)
    }
  }, [show])

  return (
    // ✅ OUTER SAFE SPACING CONTAINER
    <div className="px-3 px-md-4 px-lg-5 py-4">

      {/* ================= Interview Selection Header ================= */}
      <div className="mb-4 mb-md-5">
        <div className="d-flex align-items-center mb-3">
          <div className="bg-primary rounded-circle p-3 me-3">
            <FaDesktop className="text-white" size={28} />
          </div>
          <div>
            <h2 className="fw-bold mb-1">AI Interview Practice</h2>
            <p className="text-muted mb-0">
              Fullscreen interview experience on desktop
            </p>
          </div>
        </div>

        <p className="text-muted lh-lg">
          Choose between topic-based technical interviews or resume-based interviews tailored to your background.
          Practice with AI-powered feedback and improve your interview skills. On desktop, interviews open in immersive fullscreen mode.
        </p>
      </div>

      {/* ================= Fullscreen Info Banner ================= */}
      {!isMobile && (
        <div className="alert alert-info border-0 rounded-4 px-4 py-3 mb-4">
          <div className="d-flex align-items-center">
            <FaDesktop className="me-3" size={24} />
            <div>
              <h6 className="fw-bold mb-1">🖥️ Fullscreen Desktop Experience</h6>
              <p className="mb-0 small">
                Interviews will open in fullscreen mode on desktop/laptop for an immersive experience.
                Press <kbd>Esc</kbd> or click the close button to exit.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ================= Interview Selection Cards ================= */}
      <Row className="g-3 g-md-4">
        <Col xs={12} md={6}>
          <Card className="h-100 border-0 shadow-sm rounded-4 overflow-hidden">
            <div className="bg-primary bg-opacity-10 p-4 pb-2">
              <div className="d-flex align-items-start justify-content-between mb-3">
                <div className="bg-primary rounded-circle p-3 d-inline-flex">
                  <FaLaptopCode className="text-white" size={24} />
                </div>
                <Badge bg="primary" className="px-3 py-2">
                  Tech Stack
                </Badge>
              </div>

              <h4 className="fw-bold mb-2">Topic-Based AI Interview</h4>
              <p className="text-muted mb-0">
                Practice technical interviews on React, JavaScript, HTML, CSS, Node.js and more.
                Perfect for software developers and tech roles.
              </p>
            </div>

            <Card.Body className="p-4">
              <TopicSelection onStart={handleStart} />

              {/* Mobile info */}
              <div className="d-block d-md-none mt-3">
                <div className="bg-light rounded-3 p-3">
                  <div className="d-flex align-items-center mb-2">
                    <FaInfoCircle className="text-primary me-2" />
                    <span className="fw-semibold">📱 Mobile Tips:</span>
                  </div>
                  <ul className="small mb-0 ps-3">
                    <li>Ensure good lighting for video recording</li>
                    <li>Use headphones for better audio quality</li>
                    <li>Find a quiet environment</li>
                  </ul>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} md={6}>
          <Card className="h-100 border-0 shadow-sm rounded-4 overflow-hidden">
            <div className="bg-success bg-opacity-10 p-4 pb-2">
              <div className="d-flex align-items-start justify-content-between mb-3">
                <div className="bg-success rounded-circle p-3 d-inline-flex">
                  <FaFileAlt className="text-white" size={24} />
                </div>
                <Badge bg="success" className="px-3 py-2">
                  Core Branch
                </Badge>
              </div>

              <h4 className="fw-bold mb-2">Resume-Based AI Interview</h4>
              <p className="text-muted mb-0">
                For ECE, EEE, Mechanical, Civil & Other Departments. Upload your resume for
                personalized interview questions based on your experience.
              </p>
            </div>

            <Card.Body className="p-4">
              <ResumeInterviewSelection onStart={handleStart} />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ================= Statistics / Info Section ================= */}
      <Row className="mt-4 mt-md-5">
        <Col xs={12}>
          <Card className="border-0 shadow-sm rounded-4 bg-light">
            <Card.Body className="p-4">
              <Row className="g-3 text-center">
                <Col xs={6} md={3}>
                  <div className="p-3">
                    <div className="display-6 fw-bold text-primary mb-1">∞</div>
                    <div className="text-muted small">Practice Topics</div>
                  </div>
                </Col>
                <Col xs={6} md={3}>
                  <div className="p-3">
                    <div className="display-6 fw-bold text-primary mb-1">AI</div>
                    <div className="text-muted small">Real-time Feedback</div>
                  </div>
                </Col>
                <Col xs={6} md={3}>
                  <div className="p-3">
                    <div className="display-6 fw-bold text-primary mb-1">5</div>
                    <div className="text-muted small">Monthly Attempts</div>
                  </div>
                </Col>
                <Col xs={6} md={3}>
                  <div className="p-3">
                    <div className="display-6 fw-bold text-primary mb-1">🖥️</div>
                    <div className="text-muted small">Fullscreen on Desktop</div>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ================= How it works ================= */}
      <Row className="mt-4 mt-md-5">
        <Col xs={12}>
          <h4 className="fw-bold mb-4">How It Works</h4>
          <Row className="g-3">
            {['Choose Interview Type', isMobile ? 'Mobile Interview' : 'Fullscreen Practice', 'Get AI Feedback'].map(
              (title, index) => (
                <Col xs={12} md={4} key={index}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body className="p-4">
                      <div className="bg-primary bg-opacity-10 rounded-circle p-3 mb-3 d-inline-flex">
                        <span className="fw-bold text-primary">{index + 1}</span>
                      </div>
                      <h5 className="fw-bold mb-2">{title}</h5>
                      <p className="text-muted mb-0">
                        {index === 0 &&
                          'Select between topic-based or resume-based interviews.'}
                        {index === 1 &&
                          (isMobile
                            ? 'Answer questions on your mobile device.'
                            : 'Immersive fullscreen experience on desktop.')}
                        {index === 2 &&
                          'Receive instant AI feedback and performance scores.'}
                      </p>
                    </Card.Body>
                  </Card>
                </Col>
              )
            )}
          </Row>
        </Col>
      </Row>

      {/* ================= Fullscreen Interview Modal ================= */}
      <Modal
        show={show}
        fullscreen={!isMobile ? true : undefined}
        backdrop="static"
        keyboard={false}
        onHide={handleClose}
        centered={isMobile}
        size={isMobile ? 'xl' : undefined}
      >
        <Modal.Header className="border-0 p-0 position-relative">
          <Button
            onClick={handleClose}
            variant="light"
            className="position-absolute shadow-sm"
            style={{
              top: isMobile ? 10 : 15,
              right: isMobile ? 10 : 20,
              zIndex: 1056,
              width: isMobile ? 36 : 42,
              height: isMobile ? 36 : 42,
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
            }}
          >
            <FaTimes size={isMobile ? 14 : 16} />
          </Button>
        </Modal.Header>

        <Modal.Body className="p-0">
          <div ref={modalRef} className="w-100 h-100 bg-body">
            {show && interviewId && questions.length > 0 && (
              <InterviewUILayoutWithLogic
                interviewId={interviewId}
                questions={questions}
                title={title}
                isFullscreen={!isMobile}
              />
            )}
          </div>
        </Modal.Body>
      </Modal>
    </div>
  )
}

export default InterviewModalLayout
