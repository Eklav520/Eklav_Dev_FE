import { Alert, Button, Card, CardBody, CardHeader, Col, Container, Modal, ProgressBar, Row } from 'react-bootstrap'
import { FaGlobe, FaSignal, FaStar, FaUserGraduate, FaPlay, FaClock, FaCheckCircle, FaChartBar, FaChartLine } from 'react-icons/fa'
import CourseDescription from './CourseDescription'
import Curriculum from './Curriculum'
import VideoPlayer from './VideoPlayer'
import PricingAndTags from './PricingAndTags'
import { SetStateAction, useEffect, useRef, useState } from 'react'
import { useAuthContext } from '@/context/useAuthContext'
import TakeQuiz from './TakeQuiz'

interface CourseDetailsProps {
  course: any | null
  loading: boolean
}

interface QuizResult {
  score: number
  total: number
}

const Faqs: React.FC<CourseDetailsProps> = ({ course }) => {
  if (!course?.addFAQ?.length) return null
  return (
    <Card className="mt-4">
      <CardHeader className="bg-light">
        <h4 className="mb-0">Interview Asked Questions</h4>
      </CardHeader>
      <CardBody>
        {course.addFAQ.map((faq: any, index: number) => (
          <div key={faq._id || faq.question} className={`pb-3 ${index !== course.addFAQ.length - 1 ? 'border-bottom mb-3' : ''}`}>
            <h6 className="text-primary">❓ {faq.question}</h6>
            <p className="mb-0 text-muted">{faq.answer}</p>
          </div>
        ))}
      </CardBody>
    </Card>
  )
}

const CourseDetails: React.FC<CourseDetailsProps> = ({ course, loading }) => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()
  const token = user?.token

  const allVideos = course?.videos?.length ? course.videos : course?.videoUrl?.length ? course.videoUrl : []
  const [selectedVideo, setSelectedVideo] = useState(allVideos.length ? allVideos[0] : null)
  const [videoProgressMap, setVideoProgressMap] = useState<Record<string, number>>({})
  const [currentProgressPercent, setCurrentProgressPercent] = useState(0)
  const [completedVideos, setCompletedVideos] = useState<string[]>([])
  const totalVideos = allVideos.length

  // quiz state
  const [showQuiz, setShowQuiz] = useState(false)
  const [quizScore, setQuizScore] = useState<QuizResult | null>(null)
  const [quizWarning, setQuizWarning] = useState('')
  const [timer, setTimer] = useState('30:00')
  const [secondsLeft, setSecondsLeft] = useState(1800)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [caseStudyMap, setCaseStudyMap] = useState<Record<string, boolean>>({});

  const [playerNonce, setPlayerNonce] = useState(0)
  const selId = String(selectedVideo?._id || selectedVideo?.url || '')
  const selProgress = videoProgressMap[selId] || 0
  const playerKey = `${String(selectedVideo?._id || selectedVideo?.url || 'no-video')}:${playerNonce}`

  const UNLOCK_COMPLETE_AT = 95

  // Progress batching setup
  const pendingProgressRef = useRef<{ videoId: string; percent: number } | null>(null)
  const flushTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const flushProgress = async () => {
    const pending = pendingProgressRef.current
    if (!pending || !token || !course?._id) return
    pendingProgressRef.current = null
    const { videoId, percent } = pending

    const total = allVideos.length || 1
    const completed = Object.values(videoProgressMap).filter((p) => p >= 95).length
    const courseProgress = (completed / total) * 100

    try {
      await fetch(`${baseURL}/userProgress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          videoId,
          courseId: String(course._id),
          progress: percent,
          courseProgress,
        }),
      })
    } catch {
      /* ignore network errors */
    }
  }

  useEffect(() => {
    flushTimerRef.current = setInterval(flushProgress, 10000)
    return () => {
      if (flushTimerRef.current) clearInterval(flushTimerRef.current)
      flushProgress()
    }
  }, [token, course?._id])

  const handleVideoProgress = (video: any, percent: number) => {
    const videoId = String(video._id)
    if (!videoId) return
    setVideoProgressMap((prev) => {
      if (prev[videoId] && Math.abs(prev[videoId] - percent) < 0.5) return prev
      return { ...prev, [videoId]: percent }
    })
    pendingProgressRef.current = { videoId, percent }
  }

  const handleVideoComplete = async (video: any) => {
    await handleVideoProgress(video, 100)
    await flushProgress()

    const videoId = String(video._id)
    if (!videoId || completedVideos.includes(videoId)) return
    setCompletedVideos((prev) => [...prev, videoId])
  }

  useEffect(() => {
    const fetchProgress = async () => {
      if (!course || !token) return;
      const res = await fetch(`${baseURL}/userProgress/${course._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.progress) {
        setVideoProgressMap(data.progress);
      }

      if (data.caseStudies) {
        setCaseStudyMap(
          Object.fromEntries(Object.entries(data.caseStudies))
        );
      }
    };
    fetchProgress()
  }, [course?._id, token])

  useEffect(() => {
    const completed = Object.entries(videoProgressMap)
      .filter(([, p]) => p >= UNLOCK_COMPLETE_AT)
      .map(([videoId]) => videoId)
    setCompletedVideos(completed)
    const percent = (completed.length / (totalVideos || 1)) * 100
    setCurrentProgressPercent(percent)
  }, [videoProgressMap, totalVideos])

  // Quiz timer
  useEffect(() => {
    if (!showQuiz) return
    let seconds = 1800
    setSecondsLeft(seconds)
    intervalRef.current = setInterval(() => {
      seconds--
      setSecondsLeft(seconds)
      const min = Math.floor(seconds / 60)
      const sec = seconds % 60
      setTimer(`${min}:${sec.toString().padStart(2, '0')}`)
      if (seconds === 600) setQuizWarning('⏳ Only 10 minutes left!')
      if (seconds <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        setQuizWarning("⏰ Time's up! Submitting your quiz.")
      }
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [showQuiz])

  useEffect(() => {
    if (!course?._id || !token) return
    const fetchQuizResult = async () => {
      try {
        const res = await fetch(`${baseURL}/courses/${course._id}/quiz/result`, {
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setQuizScore(data)
        }
      } catch (err) {
        console.error('Failed to fetch quiz result:', err)
      }
    }
    fetchQuizResult()
  }, [course?._id, token])

  const handleSelectVideo = (video: any, opts?: { force?: boolean }) => {
    const nextId = String(video?._id || video?.url || '')
    const currId = String(selectedVideo?._id || selectedVideo?.url || '')

    // Always update the selected video
    setSelectedVideo(video)
    setPlayerNonce((n) => n + 1)

    // Scroll to video player
    setTimeout(() => {
      const videoPlayerContainer = document.getElementById('main-video-player')
      if (videoPlayerContainer) {
        const offsetTop = videoPlayerContainer.offsetTop - 80
        window.scrollTo({
          top: offsetTop,
          behavior: 'smooth',
        })
      }
    }, 150)
  }

  const handleQuizClick = () => setShowQuiz(true)
  const handleCloseQuiz = () => setShowQuiz(false)
  const handleQuizResult = (scoreData: SetStateAction<QuizResult | null>) => {
    setQuizScore(scoreData)
    setShowQuiz(false)
  }

  const formatDuration = (duration: string) => {
    if (!duration) return '--:--'
    return duration
  }

  // Calculate if we need scroll (more than 2 videos)
  const needsScroll = totalVideos > 6

  return (
    <div className="bg-light min-vh-100 py-4">
      <Container>
        <Row>
          {/* Main Content - Left Side */}
          <Col lg={8} className="mb-4">
            {/* Video Player */}
            <div id="main-video-player" className="video-player-anchor">
              <Card className="mb-4">
                <CardBody className="p-0">
                  <VideoPlayer
                    key={`player-${playerKey}`}
                    video={{ ...selectedVideo, progress: selProgress }}
                    onVideoComplete={() => handleVideoComplete(selectedVideo)}
                    onProgress={(percent) => handleVideoProgress(selectedVideo, percent)}
                  />
                </CardBody>
              </Card>
            </div>

            {/* Video Info */}
            <Card className="mb-4">
              <CardBody>
                <h4 className="mb-3">{selectedVideo?.title || course?.title}</h4>
                <div className="d-flex flex-wrap gap-3 align-items-center text-muted mb-3">
                  <p className="text-muted mb-0">Title : {selectedVideo?.description || course?.shortDescription}</p>
                  <small className="text-success fw-bold">{Math.round(selProgress)}% watched</small>
                </div>
              </CardBody>
            </Card>

            {/* Course Info */}
            <div className="d-flex flex-wrap gap-2 mb-4">
              <span className="badge bg-primary">
                <FaStar className="me-1" /> 4.5/5.0
              </span>
              <span className="badge bg-success">
                <FaUserGraduate className="me-1" /> 12k Enrolled
              </span>
              <span className="badge bg-info">
                <FaSignal className="me-1" /> {course?.level}
              </span>
              <span className="badge bg-secondary">
                <FaGlobe className="me-1" /> {course?.language}
              </span>
            </div>

            {/* Course Description */}
            <CourseDescription course={course} loading={false} />

            {/* Pricing & Tags */}
            <PricingAndTags courseId={course?._id} />

            {/* FAQs */}
            <Faqs course={course} loading={false} />
          </Col>

          {/* Sidebar - Right Side */}
          <Col lg={4}>
            <div className="position-sticky" style={{ top: '100px', zIndex: 100 }}>
              {/* Curriculum */}
              <Card className="mb-3">
                <CardHeader className="bg-primary text-white py-3">
                  <div className="d-flex justify-content-between align-items-center w-100">
                    {/* Left side - Curriculum with progress */}
                    <div className="d-flex align-items-center">
                      <FaPlay className="me-2 fs-5" />
                      <div>
                        <h6 className="mb-0">Curriculum</h6>
                        <small className="opacity-75">
                          {completedVideos.length} of {totalVideos} completed
                        </small>
                      </div>
                    </div>

                    {/* Right side - Quiz button */}
                    <div>
                      {currentProgressPercent === 100 ? (
                        quizScore ? (
                          (quizScore.score / quizScore.total) * 100 >= 80 ? (
                            <Button variant="success" disabled size="sm" className="px-3">
                              <FaCheckCircle className="me-1" />
                              Passed
                            </Button>
                          ) : (
                            <Button variant="warning" onClick={handleQuizClick} size="sm" className="px-3">
                              Retake
                            </Button>
                          )
                        ) : (
                          <Button variant="light" onClick={handleQuizClick} size="sm" className="px-3">
                            Take Quiz
                          </Button>
                        )
                      ) : (
                        <Button variant="outline-light" disabled size="sm" className="px-3">
                          Quiz Locked
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardBody
                  className="p-0"
                  style={{
                    maxHeight: needsScroll ? '400px' : undefined,
                    overflowY: needsScroll ? 'auto' : undefined,
                  }}
                >
                  <Curriculum
                    videos={
                      course?.videos?.length
                        ? course.videos.map((v: any) => ({
                          ...v,
                          progress: videoProgressMap[String(v._id)] || 0,
                          caseStudyCompleted: caseStudyMap[v._id] || false,
                        }))
                        : course?.videoUrl || []
                    }
                    courseId={course._id}
                    token={token}
                    onSelectVideo={handleSelectVideo}
                  />
                </CardBody>
              </Card>

              {/* Course Stats */}
              <Card>
                <CardBody>
                  <h6 className="mb-3 d-flex align-items-center gap-2">
                    <FaChartLine className="text-primary" />
                    Course Stats
                  </h6>
                  <Row className="text-center">
                    <Col xs={4}>
                      <div className="h5 text-primary mb-1">{totalVideos}</div>
                      <small className="text-muted">Videos</small>
                    </Col>
                    <Col xs={4}>
                      <div className="h5 text-success mb-1">{completedVideos.length}</div>
                      <small className="text-muted">Completed</small>
                    </Col>
                    <Col xs={4}>
                      <div className="h5 text-warning mb-1">{Math.round(currentProgressPercent)}%</div>
                      <small className="text-muted">Progress</small>
                    </Col>
                  </Row>
                </CardBody>
              </Card>
            </div>
          </Col>
        </Row>

        {/* Quiz Modal */}
        <Modal show={showQuiz} onHide={handleCloseQuiz} backdrop="static" centered fullscreen>
          <Modal.Header closeButton className="bg-light">
            <Modal.Title>
              🎯 Course Quiz
              <span
                style={{
                  float: 'right',
                  fontSize: '0.9rem',
                  color: secondsLeft <= 600 ? 'red' : 'inherit',
                  fontWeight: secondsLeft <= 600 ? 'bold' : 'normal',
                }}>
                ⏱️ Time Left: {timer}
              </span>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ backgroundColor: '#f8f9fa' }}>
            {quizWarning && (
              <Alert variant="warning" dismissible onClose={() => setQuizWarning('')} className="my-3">
                {quizWarning}
              </Alert>
            )}
            <TakeQuiz
              key={`quiz-${course?._id}-${showQuiz}`}
              courseId={course?._id}
              onQuizSubmit={handleQuizResult}
              setQuizWarning={setQuizWarning}
            />
          </Modal.Body>
        </Modal>
      </Container>

      {/* Add CSS for better scrolling */}
      <style>{`
        .video-player-anchor {
          scroll-margin-top: 80px;
        }
        
        #main-video-player {
          scroll-margin-top: 80px;
        }
        
        /* Smooth scrolling for curriculum */
        .curriculum-scroll {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e0 #f7fafc;
        }
        
        .curriculum-scroll::-webkit-scrollbar {
          width: 8px;
        }
        
        .curriculum-scroll::-webkit-scrollbar-track {
          background: #f7fafc;
          border-radius: 4px;
        }
        
        .curriculum-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e0;
          border-radius: 4px;
          border: 2px solid #f7fafc;
        }
        
        .curriculum-scroll::-webkit-scrollbar-thumb:hover {
          background: #a0aec0;
        }
      `}</style>
    </div>
  )
}

export default CourseDetails
