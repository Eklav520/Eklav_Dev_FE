import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { Button, Card, CardBody, CardHeader, Col, Row, Spinner, Badge, ButtonGroup, Modal, Form, Alert } from 'react-bootstrap'
import { 
  FaMapMarkerAlt, 
  FaClipboardCheck, 
  FaSearch, 
  FaCode, 
  FaExclamationTriangle, 
  FaCheckCircle, 
  FaTimesCircle,
  FaUserGraduate,
  FaGraduationCap,
  FaChartLine,
  FaAward,
  FaMedal,
  FaTrophy,
  FaStar,
  FaFilter,
  FaDownload,
  FaEye
} from 'react-icons/fa'
import ChoicesFormInput from '@/components/form/ChoicesFormInput'
import PageMetaData from '@/components/PageMetaData'
import StarRating from './StarRating'
import React from 'react'

interface Student {
  _id: string
  fullName: string
  profileImage?: string
  location: string
  progress: number
  phoneNo: string
  email: string
  college?: string
}

// Calculate overall status based on scores
const calculateOverallStatus = (scores: { quiz: number; code: number; tr: number; hr: number }) => {
  const totalScore = scores.quiz + scores.code + scores.tr + scores.hr
  const maxScore = 20 + 20 + 40 + 20 // 100 total
  const percentage = (totalScore / maxScore) * 100
  
  if (percentage >= 60) return { status: 'passed', label: 'Passed', color: 'success', icon: FaCheckCircle }
  if (percentage >= 40) return { status: 'pending', label: 'Needs Review', color: 'warning', icon: FaExclamationTriangle }
  return { status: 'failed', label: 'Failed', color: 'danger', icon: FaTimesCircle }
}

// Extract VideoPlayer component
const VideoPlayer = React.memo(
  ({ videoPath, getVideoUrl }: { videoPath: string; getVideoUrl: (path: string) => string }) => {
    const videoRef = useRef<HTMLVideoElement>(null)

    return (
      <video
        ref={videoRef}
        src={getVideoUrl(videoPath)}
        controls
        preload="metadata"
        controlsList="nodownload"
        style={{
          width: '100%',
          maxHeight: 260,
          borderRadius: 12,
          marginBottom: 12,
          objectFit: 'contain',
          background: '#000',
        }}
        onLoadedMetadata={() => {
          if (videoRef.current) {
            videoRef.current.currentTime = 0
          }
        }}
        onError={(e) => {
          console.error('Video failed to load:', e)
        }}
      />
    )
  }
)

VideoPlayer.displayName = 'VideoPlayer'

// Search Component
const SearchComponent = React.memo(({
  searchTerm,
  setSearchTerm,
  setCurrentPage
}: {
  searchTerm: string
  setSearchTerm: (term: string) => void
  setCurrentPage: (page: number) => void
}) => {
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1)
  }, [setSearchTerm, setCurrentPage])

  return (
    <form className="rounded position-relative">
      <input
        className="form-control pe-5 bg-transparent search-input"
        type="search"
        placeholder="Search by name, email or location"
        aria-label="Search"
        value={searchTerm}
        onChange={handleSearchChange}
      />
      <button
        className="bg-transparent p-2 position-absolute top-50 end-0 translate-middle-y border-0 text-reset search-btn"
        type="submit"
        onClick={(e) => e.preventDefault()}>
        <FaSearch className="fas fa-search fs-6" />
      </button>
    </form>
  )
})

SearchComponent.displayName = 'SearchComponent'

// Student Table Row Component
const StudentTableRow = React.memo(({
  student,
  baseURL,
  onReviewClick,
  overallStatus
}: {
  student: Student
  baseURL: string
  onReviewClick: (student: Student) => void
  overallStatus: { status: string; label: string; color: string; icon: any }
}) => {
  const StatusIcon = overallStatus.icon
  
  return (
    <tr key={student._id}>
      <td>
        <div className="d-flex align-items-center">
          <div className="avatar avatar-md">
            <img
              src={`${baseURL}${student.profileImage}`}
              alt="avatar"
              className="rounded"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).onerror = null
                  ; (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                    student.fullName || 'User',
                  )}`
              }}
            />
          </div>
          <div className="ms-2">
            <h6 className="mb-0 student-name">{student.fullName}</h6>
            <span className="student-location">
              <FaMapMarkerAlt className="me-1" />
              {student.location}
            </span>
          </div>
        </div>
      </td>
      <td className="student-college">{student.college || '—'}</td>
      <td className="student-phone">{student.phoneNo}</td>
      <td className="student-email">{student.email}</td>
      <td>
        <Badge bg={overallStatus.color} className="status-badge">
          <StatusIcon className="me-1" />
          {overallStatus.label}
        </Badge>
      </td>
      <td>
        <Button
          variant="outline-primary"
          className="review-btn"
          onClick={() => onReviewClick(student)}>
          <FaClipboardCheck className="me-2" />
          Review
        </Button>
      </td>
    </tr>
  )
})

StudentTableRow.displayName = 'StudentTableRow'

// DecisionControls Component
const DecisionControls = React.memo(({
  type,
  item,
  onChanged
}: {
  type: 'quiz' | 'code' | 'tr' | 'hr'
  item: any
  onChanged?: () => void
}) => {
  const [saving, setSaving] = useState(false)
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const decide = async (status: 'passed' | 'failed') => {
    setSaving(true)
    try {
      let endpoint = ''

      switch (type) {
        case 'quiz':
          endpoint = `${baseURL}/api/adminProfiles/quiz/${item._id}/decision`
          break
        case 'code':
          endpoint = `${baseURL}/api/adminProfiles/code/${item._id}/decision`
          break
        case 'tr':
          endpoint = `${baseURL}/api/adminProfiles/tr/${item._id}/decision`
          break
        case 'hr':
          endpoint = `${baseURL}/api/adminProfiles/hr/${item._id}/decision`
          break
      }

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      })

      if (!response.ok) throw new Error(`Failed to update ${type} status`)

      if (onChanged) onChanged()
      alert(`${type.toUpperCase()} round marked as ${status}!`)
    } catch (e: any) {
      console.error(`Error updating ${type} status:`, e)
      alert(`Failed to update ${type} status: ${e.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <ButtonGroup size="sm" className="decision-group">
      <Button 
        variant={item.status === 'passed' ? 'success' : 'outline-success'} 
        disabled={saving} 
        onClick={() => decide('passed')}
        className="decision-btn"
      >
        {saving ? <Spinner size="sm" /> : <FaCheckCircle className="me-1" />}
        Pass
      </Button>
      <Button 
        variant={item.status === 'failed' ? 'danger' : 'outline-danger'} 
        disabled={saving} 
        onClick={() => decide('failed')}
        className="decision-btn"
      >
        {saving ? <Spinner size="sm" /> : <FaTimesCircle className="me-1" />}
        Fail
      </Button>
    </ButtonGroup>
  )
})

DecisionControls.displayName = 'DecisionControls'

// Score Input Component
const ScoreInput = React.memo(({
  label,
  value,
  onChange,
  max
}: {
  label: string
  value: number
  onChange: (n: number) => void
  max: number
}) => {
  const [inputValue, setInputValue] = useState(value.toString())

  useEffect(() => {
    setInputValue(value.toString())
  }, [value])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    if (newValue === '') {
      onChange(0)
    } else {
      const numValue = Number(newValue)
      if (!isNaN(numValue)) {
        onChange(Math.max(0, Math.min(max, numValue)))
      }
    }
  }, [onChange, max])

  const handleBlur = useCallback(() => {
    if (inputValue === '') {
      setInputValue('0')
      onChange(0)
    } else {
      const numValue = Number(inputValue)
      if (isNaN(numValue)) {
        setInputValue(value.toString())
      } else {
        const clampedValue = Math.max(0, Math.min(max, numValue))
        setInputValue(clampedValue.toString())
        onChange(clampedValue)
      }
    }
  }, [inputValue, onChange, max, value])

  return (
    <Form.Group className="score-input-group">
      <Form.Label>{label} <span className="max-score">(max {max})</span></Form.Label>
      <Form.Control
        type="number"
        min={0}
        max={max}
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        className="score-input"
      />
    </Form.Group>
  )
})

ScoreInput.displayName = 'ScoreInput'

// Overall Score Summary Card
const OverallScoreCard = React.memo(({
  quizScore,
  codeScore,
  trScore,
  hrScore
}: {
  quizScore: number
  codeScore: number
  trScore: number
  hrScore: number
}) => {
  const totalScore = quizScore + codeScore + trScore + hrScore
  const maxScore = 100
  const percentage = (totalScore / maxScore) * 100
  const overallStatus = calculateOverallStatus({ quiz: quizScore, code: codeScore, tr: trScore, hr: hrScore })
  const StatusIcon = overallStatus.icon

  return (
    <Card className="overall-score-card">
      <Card.Body>
        <div className="score-summary">
          <div className="total-score">
            <div className="score-value">{totalScore}</div>
            <div className="score-max">/ {maxScore}</div>
          </div>
          <div className="score-percentage">{percentage.toFixed(1)}%</div>
          <Badge bg={overallStatus.color} className="overall-status-badge">
            <StatusIcon className="me-1" />
            {overallStatus.label}
          </Badge>
        </div>
        <div className="score-breakdown">
          <div className="score-item">
            <span>Quiz</span>
            <strong>{quizScore}/20</strong>
          </div>
          <div className="score-item">
            <span>Code</span>
            <strong>{codeScore}/20</strong>
          </div>
          <div className="score-item">
            <span>TR</span>
            <strong>{trScore}/40</strong>
          </div>
          <div className="score-item">
            <span>HR</span>
            <strong>{hrScore}/20</strong>
          </div>
        </div>
      </Card.Body>
    </Card>
  )
})

OverallScoreCard.displayName = 'OverallScoreCard'

// Feedback Form Component
const FeedbackForm = React.memo(({
  selectedStudent,
  feedbackText,
  setFeedbackText,
  feedbackRating,
  setFeedbackRating,
  baseURL,
  onFeedbackSent
}: {
  selectedStudent: Student | null
  feedbackText: string
  setFeedbackText: (text: string) => void
  feedbackRating: number
  setFeedbackRating: (rating: number) => void
  baseURL: string
  onFeedbackSent?: () => void
}) => {
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudent) return
    setSending(true)
    try {
      const response = await fetch(`${baseURL}/api/adminProfiles/${selectedStudent._id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ feedback: feedbackText, rating: feedbackRating }),
      })
      if (!response.ok) throw new Error('Failed to submit feedback')
      alert('Feedback sent successfully!')
      setFeedbackText('')
      setFeedbackRating(0)
      if (onFeedbackSent) onFeedbackSent()
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Error sending feedback.')
    } finally {
      setSending(false)
    }
  }

  return (
    <Card className="feedback-card">
      <Card.Header className="feedback-header">
        <h6 className="mb-0">Send Feedback</h6>
      </Card.Header>
      <Card.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Feedback Message</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Provide detailed feedback to the student..."
              required
              className="feedback-textarea"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Rating</Form.Label>
            <StarRating rating={feedbackRating} setRating={setFeedbackRating} />
          </Form.Group>
          <Button type="submit" variant="primary" className="send-feedback-btn" disabled={sending}>
            {sending ? <Spinner size="sm" className="me-2" /> : <FaStar className="me-2" />}
            {sending ? 'Sending...' : 'Send Feedback'}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  )
})

FeedbackForm.displayName = 'FeedbackForm'

// Section Block Component
const SectionBlock = React.memo(({
  title,
  items,
  type,
  onRefresh,
  getVideoUrl
}: {
  title: string
  items: any[]
  type: 'quiz' | 'code' | 'tr' | 'hr'
  onRefresh: () => void
  getVideoUrl: (path: string) => string
}) => {
  if (!items?.length) return null

  return (
    <div className="section-block">
      <h5 className="section-title">{title}</h5>
      <div className="section-items">
        {items.map((it) => {
          const createdLabel = it.createdAt ? new Date(it.createdAt).toLocaleString() : ''
          const quizAuto = type === 'quiz' && it?.details?.totalQuestions != null 
            ? `${it?.details?.autoCorrectCount ?? 0} / ${it?.details?.totalQuestions}` 
            : null

          const isCode = type === 'code'
          const codeInfo = it.details?.codeInfo
          const hasCode = codeInfo?.hasCode
          const hasTests = it.details?.tests?.length > 0
          const isAutoSubmitted = codeInfo?.autoSubmitted
          const language = codeInfo?.language

          return (
            <Card key={it._id} className="assessment-item-card">
              <Card.Header className="assessment-header">
                <div className="assessment-meta">
                  <Badge bg={it.status === 'passed' ? 'success' : it.status === 'failed' ? 'danger' : 'secondary'} className="status-badge">
                    {it.status || 'pending'}
                  </Badge>
                  <span className="score-display">
                    Score: <strong>{it.score ?? 0}</strong> / {it.maxScore ?? 20}
                  </span>
                  {isCode && isAutoSubmitted && <Badge bg="info">Auto-submitted</Badge>}
                  {type === 'quiz' && quizAuto && <Badge bg="info">Auto {quizAuto}</Badge>}
                </div>
                <DecisionControls type={type} item={it} onChanged={onRefresh} />
              </Card.Header>

              <Card.Body>
                {it.videoPath && <VideoPlayer videoPath={it.videoPath} getVideoUrl={getVideoUrl} />}

                {isCode && (
                  <div className="code-details">
                    <h6><FaCode className="me-2" /> Code Submission</h6>
                    <div className="code-info">
                      <span><strong>Language:</strong> {language || 'Unknown'}</span>
                      <span><strong>Code Length:</strong> {codeInfo?.codeLength || 0} chars</span>
                      <span><strong>Type:</strong> {isAutoSubmitted ? 'Auto-submitted' : 'Manual'}</span>
                    </div>
                    {!hasCode && (
                      <Alert variant="danger" className="alert-sm">
                        <FaExclamationTriangle className="me-2" /> No code was submitted.
                      </Alert>
                    )}
                    {hasCode && !hasTests && (
                      <Alert variant="warning" className="alert-sm">
                        <strong>Manual Review Required:</strong> Code submitted but no tests were run.
                      </Alert>
                    )}
                  </div>
                )}

                {hasTests && (
                  <div className="test-results">
                    <b>Test Results ({it.details.passedCount}/{it.details.total} passed):</b>
                    <ul>
                      {it.details.tests.map((t: any, i: number) => (
                        <li key={i} className={t.passed ? 'test-passed' : 'test-failed'}>
                          {t.name} — {t.passed ? '✓ PASS' : '✗ FAIL'}
                          {t.error && <span className="test-error">: {t.error}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {(type === 'tr' || type === 'hr') && it.details?.qa?.length > 0 && (
                  <div className="qa-section">
                    <h6>{type === 'tr' ? 'Technical Round Q&A' : 'HR Round Q&A'}</h6>
                    {it.details.qa.map((qa: any, idx: number) => (
                      <Card key={idx} className="qa-item">
                        <Card.Body>
                          <div className="qa-question"><strong>Q:</strong> {qa.question}</div>
                          <div className="qa-answer"><strong>A:</strong> {qa.answer}</div>
                          {qa.rating !== undefined && (
                            <div className="qa-rating">
                              <strong>Rating:</strong> <StarRating rating={qa.rating ?? 0} readOnly />
                              <span className="rating-value">({qa.rating ?? 0}/5)</span>
                            </div>
                          )}
                          {qa.feedback && (
                            <Alert variant="info" className="ai-feedback">
                              <strong>AI Feedback:</strong> {qa.feedback}
                            </Alert>
                          )}
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>
          )
        })}
      </div>
    </div>
  )
})

SectionBlock.displayName = 'SectionBlock'

// Modal Content Component
const ModalContent = React.memo(({
  loadingOverview,
  overview,
  refreshOverview,
  getVideoUrl,
  selectedStudent,
  quizScore,
  setQuizScore,
  codeScore,
  setCodeScore,
  trScore,
  setTrScore,
  hrScore,
  setHrScore,
  savingScores,
  setSavingScores,
  baseURL,
  feedbackText,
  setFeedbackText,
  feedbackRating,
  setFeedbackRating,
  onFeedbackSent
}: {
  loadingOverview: boolean
  overview: any
  refreshOverview: () => void
  getVideoUrl: (path: string) => string
  selectedStudent: Student | null
  quizScore: number
  setQuizScore: (score: number) => void
  codeScore: number
  setCodeScore: (score: number) => void
  trScore: number
  setTrScore: (score: number) => void
  hrScore: number
  setHrScore: (score: number) => void
  savingScores: boolean
  setSavingScores: (saving: boolean) => void
  baseURL: string
  feedbackText: string
  setFeedbackText: (text: string) => void
  feedbackRating: number
  setFeedbackRating: (rating: number) => void
  onFeedbackSent?: () => void
}) => {
  const [savingScoresLocal, setSavingScoresLocal] = useState(false)

  const handleSaveScores = async () => {
    if (!selectedStudent) return
    setSavingScoresLocal(true)
    try {
      const res = await fetch(`${baseURL}/api/adminProfiles/${selectedStudent._id}/assessment-score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          quiz: quizScore,
          code: codeScore,
          tr: trScore,
          hr: hrScore,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed to save scores')
      alert('Scores saved!')
      refreshOverview()
    } catch (e: any) {
      console.error(e)
      alert(e.message || 'Error saving scores')
    } finally {
      setSavingScoresLocal(false)
    }
  }

  if (loadingOverview) {
    return (
      <div className="loading-container">
        <Spinner animation="border" variant="warning" />
        <p>Loading assessment data...</p>
      </div>
    )
  }

  return (
    <Row className="g-4">
      <Col lg={8}>
        <SectionBlock
          title="Quiz Assessment"
          type="quiz"
          items={overview?.attended?.quiz}
          onRefresh={refreshOverview}
          getVideoUrl={getVideoUrl}
        />
        <SectionBlock
          title="Code Challenge"
          type="code"
          items={overview?.attended?.code}
          onRefresh={refreshOverview}
          getVideoUrl={getVideoUrl}
        />
        <SectionBlock
          title="Technical Round"
          type="tr"
          items={overview?.attended?.tr}
          onRefresh={refreshOverview}
          getVideoUrl={getVideoUrl}
        />
        <SectionBlock
          title="HR Round"
          type="hr"
          items={overview?.attended?.hr}
          onRefresh={refreshOverview}
          getVideoUrl={getVideoUrl}
        />
      </Col>

      <Col lg={4}>
        <OverallScoreCard
          quizScore={quizScore}
          codeScore={codeScore}
          trScore={trScore}
          hrScore={hrScore}
        />

        <Card className="scores-card">
          <Card.Header className="scores-header">
            <h6 className="mb-0">Section Scores</h6>
          </Card.Header>
          <Card.Body>
            <ScoreInput label="Quiz" value={quizScore} onChange={setQuizScore} max={20} />
            <ScoreInput label="Code Challenge" value={codeScore} onChange={setCodeScore} max={20} />
            <ScoreInput label="Technical Round" value={trScore} onChange={setTrScore} max={40} />
            <ScoreInput label="HR Round" value={hrScore} onChange={setHrScore} max={20} />
            <Button
              variant="primary"
              className="save-scores-btn"
              disabled={!selectedStudent || savingScoresLocal}
              onClick={handleSaveScores}>
              {savingScoresLocal ? <Spinner size="sm" className="me-2" /> : <FaAward className="me-2" />}
              {savingScoresLocal ? 'Saving...' : 'Save Scores'}
            </Button>
          </Card.Body>
        </Card>

        <FeedbackForm
          selectedStudent={selectedStudent}
          feedbackText={feedbackText}
          setFeedbackText={setFeedbackText}
          feedbackRating={feedbackRating}
          setFeedbackRating={setFeedbackRating}
          baseURL={baseURL}
          onFeedbackSent={onFeedbackSent}
        />
      </Col>
    </Row>
  )
})

ModalContent.displayName = 'ModalContent'

// Main Component
const StudentListPage: React.FC = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const [students, setStudents] = useState<Student[]>([])
  const [showModal, setShowModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackRating, setFeedbackRating] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOption, setSortOption] = useState<string>('')

  const [overview, setOverview] = useState<any>(null)
  const [loadingOverview, setLoadingOverview] = useState(false)
  const [quizScore, setQuizScore] = useState<number>(0)
  const [codeScore, setCodeScore] = useState<number>(0)
  const [trScore, setTrScore] = useState<number>(0)
  const [hrScore, setHrScore] = useState<number>(0)
  const [loadingStudents, setLoadingStudents] = useState(true)

  const studentsPerPage = 5

  // Calculate student scores and statuses
  const studentsWithStatus = useMemo(() => {
    return students.map(student => {
      // You can fetch actual scores from your data
      // For now using placeholder - replace with actual data
      const scores = {
        quiz: 0,
        code: 0,
        tr: 0,
        hr: 0
      }
      const overall = calculateOverallStatus(scores)
      return { ...student, overallStatus: overall }
    })
  }, [students])

const filteredStudents = useMemo(() => {
  let sortedStudents = [...studentsWithStatus]

  if (sortOption === 'college') {
    sortedStudents.sort((a, b) => {
      const collegeA = a.college?.toLowerCase() || ''
      const collegeB = b.college?.toLowerCase() || ''
      return collegeA.localeCompare(collegeB)
    })
  } else if (sortOption === 'status') {
    sortedStudents.sort((a, b) => {
      const order: Record<string, number> = { passed: 1, pending: 2, failed: 3 }
      return order[a.overallStatus.status] - order[b.overallStatus.status]
    })
  }

  const term = searchTerm.toLowerCase()
  return sortedStudents.filter(student =>
    student.fullName?.toLowerCase().includes(term) ||
    student.email?.toLowerCase().includes(term) ||
    student.phoneNo?.includes(term) ||
    student.college?.toLowerCase().includes(term)
  )
}, [studentsWithStatus, sortOption, searchTerm])

  const currentStudents = useMemo(() => {
    const indexOfLastStudent = currentPage * studentsPerPage
    const indexOfFirstStudent = indexOfLastStudent - studentsPerPage
    return filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent)
  }, [filteredStudents, currentPage, studentsPerPage])

  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage)

  useEffect(() => {
    const fetchStudents = async () => {
      setLoadingStudents(true)
      try {
        const res = await fetch(`${baseURL}/api/tr/attended-students`)
        const json = await res.json()
        if (json.success && Array.isArray(json.students)) {
          setStudents(json.students)
        } else {
          setStudents([])
        }
      } catch (e) {
        console.error('Failed to fetch students', e)
        setStudents([])
      } finally {
        setLoadingStudents(false)
      }
    }
    fetchStudents()
  }, [baseURL])

  const refreshOverview = useCallback(async () => {
    if (!selectedStudent) return
    setLoadingOverview(true)
    try {
      const res = await fetch(`${baseURL}/api/adminProfiles/${selectedStudent._id}/assessment-overview`, { credentials: 'include' })
      const data = await res.json()
      setOverview(data)
      const as = data?.profile?.assessmentScores
      setQuizScore(as?.quizScore ?? 0)
      setCodeScore(as?.codeChallengeScore ?? 0)
      setTrScore(as?.technicalRoundScore ?? 0)
      setHrScore(as?.hrRoundScore ?? 0)
    } finally {
      setLoadingOverview(false)
    }
  }, [baseURL, selectedStudent])

  const getVideoUrl = useCallback((path: string) => {
    if (!path) return ''
    if (path.includes('https//')) return path.replace('https//', 'https://')
    if (path.includes('http//')) return path.replace('http//', 'http://')
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    if (path.startsWith('//')) return `https:${path}`
    return `${baseURL}/${path.replace(/^\/+/, '')}`
  }, [baseURL])

  const handleReviewClick = useCallback(async (student: Student) => {
    setSelectedStudent(student)
    setShowModal(true)
    setOverview(null)
    setLoadingOverview(true)
    try {
      const res = await fetch(`${baseURL}/api/adminProfiles/${student._id}/assessment-overview`, { credentials: 'include' })
      const json = await res.json()
      setOverview(json)
      const as = json?.profile?.assessmentScores
      setQuizScore(as?.quizScore ?? 0)
      setCodeScore(as?.codeChallengeScore ?? 0)
      setTrScore(as?.technicalRoundScore ?? 0)
      setHrScore(as?.hrRoundScore ?? 0)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingOverview(false)
    }
  }, [baseURL])

  return (
    <>
      <PageMetaData title="Student Assessment Dashboard" />
      <div className="student-list-container">
        <Card className="students-card">
          <CardHeader className="students-card-header">
            <div className="header-content">
              <div>
                <h3 className="header-title">Student Assessment Dashboard</h3>
                <p className="header-subtitle">Review and evaluate student performance</p>
              </div>
              <div className="header-stats">
                <div className="stat-badge">
                  <FaUserGraduate className="me-2" />
                  Total Students: {students.length}
                </div>
                <div className="stat-badge">
                  <FaGraduationCap className="me-2" />
                  Pass Rate: {students.length ? Math.round(studentsWithStatus.filter(s => s.overallStatus.status === 'passed').length / students.length * 100) : 0}%
                </div>
              </div>
            </div>
          </CardHeader>
          <CardBody className="students-card-body">
            <Row className="g-3 align-items-center justify-content-between mb-4">
              <Col md={6}>
                <SearchComponent
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  setCurrentPage={setCurrentPage}
                />
              </Col>
              <Col md={3}>
                <ChoicesFormInput
                  className="form-select js-choice border-0 z-index-9 bg-transparent sort-select"
                  onChange={setSortOption}
                >
                  <option value="">Sort by</option>
                  <option value="college">College</option>
                  <option value="status">Status</option>
                </ChoicesFormInput>
              </Col>
            </Row>

            <div className="table-responsive">
              <table className="students-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>College</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingStudents ? (
                    <tr>
                      <td colSpan={6} className="text-center py-5">
                        <Spinner animation="border" variant="warning" />
                      </td>
                    </tr>
                  ) : filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-5">
                        <div className="empty-state">
                          <FaUserGraduate className="empty-icon" />
                          <h5>No students found</h5>
                          <p>Try adjusting your search or filter criteria</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    currentStudents.map((student) => (
                      <StudentTableRow
                        key={student._id}
                        student={student}
                        baseURL={baseURL}
                        onReviewClick={handleReviewClick}
                        overallStatus={student.overallStatus}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination-section">
                <Button 
                  variant="outline-primary" 
                  disabled={currentPage === 1} 
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                  className="pagination-btn"
                >
                  Previous
                </Button>
                <span className="pagination-info">
                  Page {currentPage} of {totalPages}
                </span>
                <Button 
                  variant="outline-primary" 
                  disabled={currentPage === totalPages} 
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  className="pagination-btn"
                >
                  Next
                </Button>
              </div>
            )}
          </CardBody>
        </Card>

        <Modal show={showModal} onHide={() => setShowModal(false)} fullscreen className="review-modal">
          <Modal.Header closeButton className="modal-header-custom">
            <Modal.Title>
              <FaClipboardCheck className="me-2" />
              Review & Feedback — {selectedStudent?.fullName}
              {selectedStudent?.email && (
                <span className="student-email"> • {selectedStudent.email}</span>
              )}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="modal-body-custom">
            <ModalContent
              loadingOverview={loadingOverview}
              overview={overview}
              refreshOverview={refreshOverview}
              getVideoUrl={getVideoUrl}
              selectedStudent={selectedStudent}
              quizScore={quizScore}
              setQuizScore={setQuizScore}
              codeScore={codeScore}
              setCodeScore={setCodeScore}
              trScore={trScore}
              setTrScore={setTrScore}
              hrScore={hrScore}
              setHrScore={setHrScore}
              savingScores={false}
              setSavingScores={() => {}}
              baseURL={baseURL}
              feedbackText={feedbackText}
              setFeedbackText={setFeedbackText}
              feedbackRating={feedbackRating}
              setFeedbackRating={setFeedbackRating}
              onFeedbackSent={refreshOverview}
            />
          </Modal.Body>
        </Modal>
      </div>

      <style>{`
        .student-list-container {
          background: #000000;
          min-height: 100vh;
          padding: 1rem;
        }

        .students-card {
          background: #0a0a0a;
          border: 1px solid #1f1f1f;
          border-radius: 16px;
          overflow: hidden;
        }

        .students-card-header {
          background: linear-gradient(135deg, #0a0a0a 0%, #000000 100%);
          border-bottom: 1px solid #ff7a00;
          padding: 1.5rem;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .header-title {
          color: #ffffff;
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
        }

        .header-subtitle {
          color: #8a8a8a;
          font-size: 0.85rem;
          margin: 0.25rem 0 0 0;
        }

        .header-stats {
          display: flex;
          gap: 1rem;
        }

        .stat-badge {
          background: rgba(255, 122, 0, 0.1);
          border: 1px solid #ff7a00;
          border-radius: 8px;
          padding: 0.5rem 1rem;
          color: #ff7a00;
          font-size: 0.85rem;
        }

        .students-card-body {
          padding: 1.5rem;
        }

        /* Search Input */
        .search-input {
          background: #0a0a0a !important;
          border: 1px solid #2c2c2c;
          color: #ffffff;
        }

        .search-input:focus {
          border-color: #ff7a00;
          box-shadow: 0 0 0 0.2rem rgba(255, 122, 0, 0.25);
        }

        .search-btn {
          color: #ff7a00;
        }

        /* Sort Select */
        .sort-select {
          background: #0a0a0a !important;
          border: 1px solid #2c2c2c;
          color: #ffffff;
        }

        /* Table */
        .students-table {
          width: 100%;
          border-collapse: collapse;
        }

        .students-table thead th {
          background: #000000;
          color: #ff7a00;
          padding: 1rem;
          font-weight: 600;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #ff7a00;
        }

        .students-table tbody tr {
          border-bottom: 1px solid #1f1f1f;
          transition: background 0.2s ease;
        }

        .students-table tbody tr:hover {
          background: #141414;
        }

        .students-table td {
          padding: 1rem;
          vertical-align: middle;
          color: #e5e5e5;
        }

        .student-name {
          color: #ffffff;
          margin-bottom: 0.25rem;
        }

        .student-location {
          color: #8a8a8a;
          font-size: 0.75rem;
        }

        .student-college, .student-phone, .student-email {
          color: #e5e5e5;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
        }

        .review-btn {
          background: transparent;
          border: 1px solid #ff7a00;
          color: #ff7a00;
          padding: 0.375rem 1rem;
          border-radius: 6px;
          transition: all 0.2s ease;
        }

        .review-btn:hover {
          background: #ff7a00;
          color: #000000;
        }

        /* Pagination */
        .pagination-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid #1f1f1f;
        }

        .pagination-btn {
          background: #2c2c2c;
          border: none;
          color: #e5e5e5;
        }

        .pagination-btn:hover:not(:disabled) {
          background: #ff7a00;
          color: #000000;
        }

        .pagination-info {
          color: #8a8a8a;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 3rem;
        }

        .empty-icon {
          font-size: 3rem;
          color: #ff7a00;
          opacity: 0.5;
          margin-bottom: 1rem;
        }

        .empty-state h5 {
          color: #ffffff;
          margin-bottom: 0.5rem;
        }

        .empty-state p {
          color: #8a8a8a;
        }

        /* Modal */
        .review-modal .modal-content {
          background: #0a0a0a;
          border: 1px solid #ff7a00;
          border-radius: 16px;
        }

        .modal-header-custom {
          background: linear-gradient(135deg, #0a0a0a 0%, #000000 100%);
          border-bottom: 1px solid #ff7a00;
          padding: 1rem 1.5rem;
        }

        .modal-header-custom .modal-title {
          color: #ff7a00;
          font-weight: 600;
        }

        .student-email {
          color: #8a8a8a;
          font-size: 0.85rem;
        }

        .modal-body-custom {
          padding: 1.5rem;
        }

        /* Section Blocks */
        .section-block {
          margin-bottom: 2rem;
        }

        .section-title {
          color: #ff7a00;
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .assessment-item-card {
          background: #000000;
          border: 1px solid #1f1f1f;
          border-radius: 12px;
          margin-bottom: 1rem;
          overflow: hidden;
        }

        .assessment-header {
          background: #0a0a0a;
          border-bottom: 1px solid #1f1f1f;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
          padding: 1rem;
        }

        .assessment-meta {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .score-display {
          color: #e5e5e5;
        }

        .decision-group .decision-btn {
          padding: 0.25rem 0.75rem;
          font-size: 0.75rem;
        }

        /* Overall Score Card */
        .overall-score-card {
          background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);
          border: 1px solid #ff7a00;
          border-radius: 12px;
          margin-bottom: 1rem;
        }

        .score-summary {
          text-align: center;
          margin-bottom: 1rem;
        }

        .total-score {
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 0.25rem;
        }

        .score-value {
          font-size: 3rem;
          font-weight: 700;
          color: #ff7a00;
        }

        .score-max {
          font-size: 1rem;
          color: #8a8a8a;
        }

        .score-percentage {
          font-size: 1rem;
          color: #e5e5e5;
          margin-top: 0.25rem;
        }

        .overall-status-badge {
          display: inline-flex;
          align-items: center;
          margin-top: 0.5rem;
          padding: 0.375rem 1rem;
          font-size: 0.85rem;
        }

        .score-breakdown {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
          padding-top: 1rem;
          border-top: 1px solid #1f1f1f;
        }

        .score-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem;
          background: #000000;
          border-radius: 8px;
        }

        .score-item span {
          color: #8a8a8a;
        }

        .score-item strong {
          color: #ff7a00;
        }

        /* Scores Card */
        .scores-card {
          background: #0a0a0a;
          border: 1px solid #1f1f1f;
          border-radius: 12px;
          margin-bottom: 1rem;
        }

        .scores-header {
          background: #000000;
          border-bottom: 1px solid #1f1f1f;
          padding: 1rem;
        }

        .score-input-group {
          margin-bottom: 1rem;
        }

        .score-input-group label {
          color: #ff7a00;
          font-size: 0.85rem;
          margin-bottom: 0.25rem;
        }

        .max-score {
          color: #8a8a8a;
          font-size: 0.7rem;
        }

        .score-input {
          background: #000000;
          border: 1px solid #2c2c2c;
          color: #ffffff;
        }

        .score-input:focus {
          border-color: #ff7a00;
          box-shadow: 0 0 0 0.2rem rgba(255, 122, 0, 0.25);
        }

        .save-scores-btn {
          width: 100%;
          background: linear-gradient(135deg, #ff7a00 0%, #ff944d 100%);
          border: none;
          color: #000000;
          font-weight: 600;
          margin-top: 0.5rem;
        }

        /* Feedback Card */
        .feedback-card {
          background: #0a0a0a;
          border: 1px solid #1f1f1f;
          border-radius: 12px;
        }

        .feedback-header {
          background: #000000;
          border-bottom: 1px solid #1f1f1f;
          padding: 1rem;
        }

        .feedback-textarea {
          background: #000000;
          border: 1px solid #2c2c2c;
          color: #ffffff;
        }

        .feedback-textarea:focus {
          border-color: #ff7a00;
          box-shadow: 0 0 0 0.2rem rgba(255, 122, 0, 0.25);
        }

        .send-feedback-btn {
          width: 100%;
          background: linear-gradient(135deg, #ff7a00 0%, #ff944d 100%);
          border: none;
          color: #000000;
          font-weight: 600;
        }

        /* Loading */
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
        }

        .loading-container p {
          color: #8a8a8a;
          margin-top: 1rem;
        }

        /* Code Details */
        .code-details {
          margin-bottom: 1rem;
        }

        .code-details h6 {
          color: #ff7a00;
          margin-bottom: 0.5rem;
        }

        .code-info {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          background: #0a0a0a;
          padding: 0.75rem;
          border-radius: 8px;
          margin-bottom: 0.5rem;
        }

        .code-info span {
          color: #e5e5e5;
          font-size: 0.85rem;
        }

        .alert-sm {
          padding: 0.5rem;
          font-size: 0.8rem;
        }

        /* Test Results */
        .test-results {
          margin-top: 1rem;
        }

        .test-results ul {
          list-style: none;
          padding-left: 0;
        }

        .test-results li {
          padding: 0.25rem 0;
        }

        .test-passed {
          color: #28a745;
        }

        .test-failed {
          color: #dc3545;
        }

        .test-error {
          color: #8a8a8a;
          margin-left: 0.5rem;
        }

        /* QA Section */
        .qa-section {
          margin-top: 1rem;
        }

        .qa-section h6 {
          color: #ff7a00;
          margin-bottom: 1rem;
        }

        .qa-item {
          background: #0a0a0a;
          border: 1px solid #1f1f1f;
          margin-bottom: 1rem;
        }

        .qa-question {
          margin-bottom: 0.5rem;
          color: #ffffff;
        }

        .qa-answer {
          margin-bottom: 0.5rem;
          color: #e5e5e5;
        }

        .qa-rating {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .rating-value {
          color: #8a8a8a;
          font-size: 0.85rem;
        }

        .ai-feedback {
          margin-top: 0.5rem;
          font-size: 0.85rem;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .header-content {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .header-stats {
            flex-direction: column;
            width: 100%;
          }
          
          .stat-badge {
            text-align: center;
          }
          
          .students-table thead th {
            font-size: 0.7rem;
            padding: 0.75rem;
          }
          
          .students-table td {
            padding: 0.75rem;
          }
          
          .pagination-section {
            flex-direction: column;
            gap: 1rem;
          }
          
          .pagination-btn {
            width: 100%;
          }
        }
      `}</style>
    </>
  )
}

export default StudentListPage