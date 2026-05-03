import React, { useState, useRef, useEffect } from 'react'
import { Modal, Row, Col, Card, Badge, Button } from 'react-bootstrap'
import TopicSelection from './TopicSelection'
import ResumeInterviewSelection from './ResumeInterviewSelection'
import InterviewUILayoutWithLogic from './InterviewUILayoutWithLogic'
import { FaLaptopCode, FaFileAlt, FaTimes, FaInfoCircle, FaDesktop } from 'react-icons/fa'
import { useAuthContext } from '@/context/useAuthContext'


type InterviewMeta = {
  interviewType: 'topic' | 'resume'
  attemptId?: string
  attemptNumber?: number
}


const InterviewModalLayout = () => {
  const { user } = useAuthContext()
  const token = user?.token
  const baseURL = import.meta.env.VITE_API_BASE_URL || ''
  const [show, setShow] = useState(false)
  const [interviewId, setInterviewId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<string[]>([])
  const [title, setTitle] = useState<string>('')

  const modalRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [meta, setMeta] = useState<InterviewMeta | undefined>(undefined)
  const [limits, setLimits] = useState<any>(null);
  const [resumeLimits, setResumeLimits] = useState<any>(null);

  // Check if mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (token) {
      fetchLimits();
      fetchResumeLimits();
    }
  }, [token]);

  const handleStart = (
    id: string,
    questions: string[],
    totalQuestions: number,
    title: string,
    options?: {
      interviewType: 'topic' | 'resume'
      attemptId?: string
      attemptNumber?: number
    }
  ) => {
    setInterviewId(id)
    setQuestions(questions)
    setTitle(title)
    setMeta(options)
    setShow(true)
  }

  const handleClose = async () => {
    setShow(false);

    await fetchLimits();
    await fetchResumeLimits();

    setInterviewId(null);
    setQuestions([]);
    setTitle('');
    setMeta(undefined);
  };

  const handleInterviewComplete = async () => {
    console.log("✅ Interview completed → refreshing limits");

    await Promise.all([
      fetchLimits(),
      fetchResumeLimits()
    ]);

    handleClose(); // no timeout needed
  };

  const fetchLimits = async () => {
    try {
      const res = await fetch(`${baseURL}/interview/limits`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      setLimits({ ...data }); // ✅ IMPORTANT

    } catch (err) {
      console.error("Limits fetch error", err);
    }
  };

  const fetchResumeLimits = async () => {
    try {
      const res = await fetch(
        `${baseURL}/api/resume-based-interview/remaining`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }
      );

      const data = await res.json();

      console.log("🔥 NEW LIMITS:", data);

      setResumeLimits({ ...data }); // ✅ IMPORTANT

    } catch (err) {
      console.error("Resume limits error", err);
    }
  };


  return (
    // ✅ OUTER SAFE SPACING CONTAINER
    <div className="px-3 px-md-4 px-lg-5 py-4">
      {/* ================= Interview Selection Header ================= */}
      <div className="mb-5">

        {/* Top Label */}
        <div className="mb-2">
          <span
            style={{
              color: '#ff7a00',
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: 1,
              textTransform: 'uppercase'
            }}
          >
            AI Powered Practice
          </span>
        </div>

        {/* Main Title Row */}
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div className="d-flex align-items-center gap-3">

            <div
              className="d-flex align-items-center justify-content-center"
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                backgroundColor: '#ff7a00'
              }}
            >
              <FaDesktop className="text-white" size={20} />
            </div>

            <h2 className="fw-bold mb-0">
              AI Interview Practice
            </h2>
          </div>

          <Badge
            className="text-white px-3 py-2"
            style={{
              backgroundColor: '#ff7a00',
              fontWeight: 500,
              fontSize: 13
            }}
          >
            Premium Access
          </Badge>
        </div>

        {/* Description */}
        <p
          className="text-muted mt-3 mb-0"
          style={{ maxWidth: 1300 }}
        >
          Choose between topic-based technical interviews or resume-based simulations tailored to your background. Experience real-time AI feedback in a structured and immersive environment.
        </p>
      </div>


      {/* ================= Interview Selection Cards ================= */}
      <Row className="g-4">
        {/* ---------------- Topic Card ---------------- */}
        <Col xs={12} md={6}>
          <Card
            className="h-100 border-0 rounded-4 shadow-sm"
            style={{
              border: '1px solid rgba(255,122,0,0.15)',
              transition: 'all 0.25s ease'
            }}
          >
            <div
              className="px-4 pt-4 pb-3"
              style={{ backgroundColor: 'rgba(255,122,0,0.05)' }}
            >
              <div className="d-flex align-items-center justify-content-between">

                <div className="d-flex align-items-center gap-3">
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: '50%',
                      backgroundColor: '#ff7a00',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <FaLaptopCode className="text-white" size={18} />
                  </div>

                  <h5 className="fw-semibold mb-0">
                    Topic-Based Interview
                  </h5>
                </div>

                <Badge
                  bg=""
                  className="px-3 py-2 text-white"
                  style={{
                    backgroundColor: '#ff7a00',
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  Tech Stack
                </Badge>

              </div>

              <p className="text-muted small mt-3 mb-0">
                Practice interviews on React, JavaScript, Node.js and more.
              </p>
            </div>

            <Card.Body className="p-4 pt-3">
              <TopicSelection onStart={handleStart} limits={limits?.limits || {}}  />
            </Card.Body>
          </Card>
        </Col>


        {/* ---------------- Resume Card ---------------- */}
        <Col xs={12} md={6}>
          <Card
            className="h-100 border-0 rounded-4 shadow-sm"
            style={{
              border: '1px solid rgba(255,122,0,0.15)',
              transition: 'all 0.25s ease'
            }}
          >
            <div
              className="px-4 pt-4 pb-3"
              style={{ backgroundColor: 'rgba(255,122,0,0.05)' }}
            >
              <div className="d-flex align-items-center justify-content-between">

                <div className="d-flex align-items-center gap-3">
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: '50%',
                      backgroundColor: '#ff7a00',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <FaFileAlt className="text-white" size={18} />
                  </div>

                  <h5 className="fw-semibold mb-0">
                    Resume-Based Interview
                  </h5>
                </div>
                <Badge
                  bg=""
                  className="px-3 py-2 text-white"
                  style={{
                    backgroundColor: '#ff7a00',
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  Core Branch
                </Badge>
              </div>

              <p className="text-muted small mt-3 mb-0">
                Upload your resume and get personalized interview questions.
              </p>
            </div>

            <Card.Body className="p-4 pt-3">
              <ResumeInterviewSelection onStart={handleStart} resumeLimits={resumeLimits} />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ================= How it works ================= */}
      <Row className="mt-5 pt-4">
        <Col xs={12} className="text-center mb-4">
          <h3 className="fw-bold mb-2">How It Works</h3>
          <p className="text-muted mb-0" style={{ maxWidth: 600, margin: '0 auto' }}>
            A simple 3-step process to simulate real interview experience and
            receive AI-powered feedback.
          </p>
        </Col>

        <Col xs={12}>
          <Row className="g-4">
            {[
              {
                title: 'Choose Interview Type',
                desc: 'Select between topic-based or resume-based interviews based on your preparation needs.'
              },
              {
                title: 'Realistic Interview Experience',
                desc: 'Simulate real-world interview scenarios and sharpen your answers in a structured, distraction-free virtual setup.'
              },
              {
                title: 'Get AI Feedback',
                desc: 'Receive instant AI-generated feedback, ratings, and improvement suggestions.'
              }
            ].map((step, index) => (
              <Col xs={12} md={4} key={index}>
                <Card
                  className="h-100 border-0 shadow-sm rounded-4"
                  style={{
                    transition: 'all 0.3s ease',
                    border: '1px solid rgba(255,122,0,0.15)'
                  }}
                >
                  <Card.Body className="p-4 text-center">

                    {/* Step Number */}
                    <div
                      className="mx-auto mb-3 d-flex align-items-center justify-content-center"
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        backgroundColor: '#ff7a00',
                        color: '#fff',
                        fontSize: 20,
                        fontWeight: 700
                      }}
                    >
                      {index + 1}
                    </div>

                    <h5 className="fw-semibold mb-2">
                      {step.title}
                    </h5>

                    <p className="text-muted mb-0 small">
                      {step.desc}
                    </p>

                  </Card.Body>
                </Card>
              </Col>
            ))}
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
            className="position-absolute"
            style={{
              top: isMobile ? 10 : 12,
              right: isMobile ? 10 : 16,
              zIndex: 1056,
              width: isMobile ? 28 : 30,
              height: isMobile ? 28 : 30,
              borderRadius: '50%',
              backgroundColor: '#f97316',
              color: '#fff',
              border: 'none',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
            }}
          >
            <FaTimes size={11} />
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
                meta={meta}
                onComplete={handleInterviewComplete}
              />

            )}
          </div>
        </Modal.Body>
      </Modal>
    </div>
  )
}

export default InterviewModalLayout
