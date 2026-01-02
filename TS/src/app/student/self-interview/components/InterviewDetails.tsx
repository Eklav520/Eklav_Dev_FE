import { Modal, Button, Spinner, Container } from 'react-bootstrap'
import TopicSelection from './TopicSelection'
import { useState, useRef, useEffect } from 'react'
import InterviewSession from './InterviewSession'
import './InterviewDetails.css'

const InterviewDetails: React.FC = () => {
  const [interviewId, setInterviewId] = useState<string | null>(null)
  const [showInterviewModal, setShowInterviewModal] = useState(false)
  const [loadingFeedback, setLoadingFeedback] = useState(false)
  const [questions, setQuestions] = useState<string[]>([])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const modalDialogRef = useRef<HTMLDivElement>(null)

  const handleStart = (id: string, questions: string[], total: number) => {
    setInterviewId(id)
    setQuestions(questions)
    setShowInterviewModal(true)
  }

  const handleClose = () => {
    if (isFullscreen) exitFullscreen()
    setShowInterviewModal(false)
    setInterviewId(null)
    setLoadingFeedback(false)
  }

  const requestFullscreen = async (element: HTMLElement) => {
    try {
      if (element.requestFullscreen) {
        await element.requestFullscreen()
      } else if ((element as any).webkitRequestFullscreen) {
        await (element as any).webkitRequestFullscreen()
      } else if ((element as any).mozRequestFullScreen) {
        await (element as any).mozRequestFullScreen()
      } else if ((element as any).msRequestFullscreen) {
        await (element as any).msRequestFullscreen()
      }
    } catch (err) {
      console.error('Error requesting fullscreen:', err)
    }
  }

  const exitFullscreen = async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen()
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen()
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen()
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen()
      }
    } catch (err) {
      console.error('Error exiting fullscreen:', err)
    }
  }

  const toggleFullscreen = async () => {
    const dialog = modalDialogRef.current
    if (!dialog) return
    if (!isFullscreen) {
      await requestFullscreen(dialog)
    } else {
      await exitFullscreen()
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenElement =
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement

      setIsFullscreen(!!fullscreenElement)

      document
        .querySelectorAll('.fullscreen-active')
        .forEach((el) => el.classList.remove('fullscreen-active'))

      if (fullscreenElement) {
        fullscreenElement.classList.add('fullscreen-active')
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
    }
  }, [])

  useEffect(() => {
    if (showInterviewModal && modalDialogRef.current && !isFullscreen) {
      requestFullscreen(modalDialogRef.current)
    }
  }, [showInterviewModal])

  return (
    <Container className="py-4">
      <h2 className="text-center mb-4">AI-Powered Interview</h2>
      <TopicSelection onStart={handleStart} />
      <Modal
        show={showInterviewModal}
        onHide={handleClose}
        backdrop="static"
        centered={!isFullscreen}
        keyboard={false}
        dialogClassName="custom-glass-modal"
      >
        <div ref={modalDialogRef} className={`modal-dialog custom-glass-modal ${isFullscreen ? 'fullscreen' : ''}`}>
          <div className="modal-content">
            <Modal.Header closeButton className="border-0">
              <Modal.Title className="fw-bold fs-4">🧠 AI Interview Session-Test</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {interviewId && showInterviewModal && (
                <InterviewSession
                  interviewId={interviewId}
                  questions={questions}
                  setLoadingFeedback={setLoadingFeedback}
                />
              )}
            </Modal.Body>
           {/*  <Modal.Footer className="border-0">
              <Button
                variant="outline-secondary"
                onClick={toggleFullscreen}
                className="me-auto"
              >
                {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              </Button>
              <Button variant="outline-danger" onClick={handleClose} disabled={loadingFeedback} style={{ marginBottom: '8px' }}>
                {loadingFeedback && <Spinner animation="border" size="sm" className="me-2" />}
                {loadingFeedback ? 'Please wait...' : 'Exit Interview'}
              </Button>
            </Modal.Footer> */}
          </div>
        </div>
      </Modal>
    </Container>
  )
}

export default InterviewDetails
