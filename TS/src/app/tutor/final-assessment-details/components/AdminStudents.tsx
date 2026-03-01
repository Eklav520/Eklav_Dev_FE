import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { Button, Card, CardBody, CardHeader, Col, Row, Spinner, Badge, ButtonGroup, Modal, Form, Alert } from 'react-bootstrap'
import { FaMapMarkerAlt, FaClipboardCheck, FaSearch, FaCode, FaExclamationTriangle } from 'react-icons/fa'
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

// Extract VideoPlayer component to prevent re-renders
const VideoPlayer = React.memo(
  ({ videoPath, getVideoUrl }: { videoPath: string; getVideoUrl: (path: string) => string }) => {
    const videoRef = useRef<HTMLVideoElement>(null)

    return (
      <video
        ref={videoRef}
        src={getVideoUrl(videoPath)}
        controls
        preload="metadata"        // ✅ REQUIRED FOR SEEK
        controlsList="nodownload" // optional
        style={{
          width: '100%',
          maxHeight: 260,
          borderRadius: 12,
          marginBottom: 12,
          objectFit: 'contain',
          background: '#000',
        }}
        onLoadedMetadata={() => {
          // Force browser to calculate duration
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

// Extract Search Component
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
        className="form-control pe-5 bg-transparent"
        type="search"
        placeholder="Search by name, email or location"
        aria-label="Search"
        value={searchTerm}
        onChange={handleSearchChange}
      />
      <button
        className="bg-transparent p-2 position-absolute top-50 end-0 translate-middle-y border-0 text-primary-hover text-reset"
        type="submit"
        onClick={(e) => e.preventDefault()}>
        <FaSearch className="fas fa-search fs-6" />
      </button>
    </form>
  )
})

SearchComponent.displayName = 'SearchComponent'

// Extract Student Table Row Component
const StudentTableRow = React.memo(({
  student,
  baseURL,
  onReviewClick
}: {
  student: Student
  baseURL: string
  onReviewClick: (student: Student) => void
}) => {
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
            <h6 className="mb-0">{student.fullName}</h6>
            <span className="text-body small">
              <FaMapMarkerAlt className="me-1" />
              {student.location}
            </span>
          </div>
        </div>
      </td>
      <td>{student.college}</td>
      <td>{student.phoneNo}</td>
      <td>{student.email}</td>
      <td>
        <Button
          variant="success-soft"
          className="btn-round me-2 mb-0"
          title="Review & Feedback"
          onClick={() => onReviewClick(student)}>
          <FaClipboardCheck />
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
        default:
          throw new Error(`Unknown assessment type: ${type}`)
      }

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to update ${type} status`)
      }

      await response.json()

      if (onChanged) {
        onChanged()
      }

      alert(`${type.toUpperCase()} round ${status} successfully!`)
    } catch (e: any) {
      console.error(`Error updating ${type} status:`, e)
      alert(`Failed to update ${type} status: ${e.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <ButtonGroup size="sm">
      <Button variant={item.status === 'passed' ? 'success' : 'outline-success'} disabled={saving} onClick={() => decide('passed')}>
        {saving ? <Spinner size="sm" /> : 'Pass'}
      </Button>
      <Button variant={item.status === 'failed' ? 'danger' : 'outline-danger'} disabled={saving} onClick={() => decide('failed')}>
        {saving ? <Spinner size="sm" /> : 'Fail'}
      </Button>
    </ButtonGroup>
  )
})

DecisionControls.displayName = 'DecisionControls'

// ScoreInput Component with proper state handling
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

  // Update local state when prop changes
  useEffect(() => {
    setInputValue(value.toString())
  }, [value])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)

    // Only update parent when we have a valid number
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
    // Validate and format on blur
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
    <Form.Group className="mb-2">
      <Form.Label>
        {label} (max {max})
      </Form.Label>
      <Form.Control
        type="number"
        min={0}
        max={max}
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
      />
    </Form.Group>
  )
})

ScoreInput.displayName = 'ScoreInput'

// Feedback Form Component
const FeedbackForm = React.memo(({
  selectedStudent,
  feedbackText,
  setFeedbackText,
  feedbackRating,
  setFeedbackRating,
  baseURL
}: {
  selectedStudent: Student | null
  feedbackText: string
  setFeedbackText: (text: string) => void
  feedbackRating: number
  setFeedbackRating: (rating: number) => void
  baseURL: string
}) => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudent) return
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
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Error sending feedback.')
    }
  }

  return (
    <Card className="border-0 shadow-sm">
      <Card.Header className="bg-transparent">
        <b>Feedback</b>
      </Card.Header>
      <Card.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Feedback</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Rating</Form.Label>
            <StarRating rating={feedbackRating} setRating={setFeedbackRating} />
          </Form.Group>
          <div className="d-flex justify-content-end">
            <Button type="submit" variant="primary">
              Send
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  )
})

FeedbackForm.displayName = 'FeedbackForm'

// Scores Card Component
const ScoresCard = React.memo(({
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
  refreshOverview
}: {
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
  refreshOverview: () => void
}) => {
  const handleSaveScores = async () => {
    if (!selectedStudent) return
    setSavingScores(true)
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
      setSavingScores(false)
    }
  }

  return (
    <Card className="border-0 shadow-sm mb-3">
      <Card.Header className="bg-transparent">
        <b>Section Scores</b>
      </Card.Header>
      <Card.Body>
        <Form>
          <ScoreInput label="Quiz" value={quizScore} onChange={setQuizScore} max={20} />
          <ScoreInput label="Code Challenge" value={codeScore} onChange={setCodeScore} max={20} />
          <ScoreInput label="Technical Round" value={trScore} onChange={setTrScore} max={40} />
          <ScoreInput label="HR Round" value={hrScore} onChange={setHrScore} max={20} />

          <div className="d-flex gap-2 mt-2">
            <Button
              variant="primary"
              disabled={!selectedStudent || savingScores}
              onClick={handleSaveScores}>
              {savingScores ? 'Saving…' : 'Save Scores'}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  )
})

ScoresCard.displayName = 'ScoresCard'

// SectionBlock Component
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
    <div className="mb-4">
      <h5 className="mb-2">{title}</h5>
      <div className="vstack gap-3">
        {items.map((it) => {
          const createdLabel = it.createdAt ? new Date(it.createdAt).toLocaleString() : ''
          const quizAuto =
            type === 'quiz' && it?.details?.totalQuestions != null ? `${it?.details?.autoCorrectCount ?? 0} / ${it?.details?.totalQuestions}` : null

          const isCode = type === 'code'
          const codeInfo = it.details?.codeInfo
          const hasCode = codeInfo?.hasCode
          const hasTests = it.details?.tests?.length > 0
          const isAutoSubmitted = codeInfo?.autoSubmitted
          const language = codeInfo?.language

          return (
            <Card key={it._id} className="border-0 shadow-sm">
              <Card.Header className="bg-transparent">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-3">
                    <div>
                      <b>Status:</b>{' '}
                      <Badge bg={it.status === 'passed' ? 'success' : it.status === 'failed' ? 'danger' : 'secondary'}>
                        {it.status || 'pending'}
                      </Badge>
                    </div>
                    <div>
                      <b>Score:</b> {it.score ?? 0} / {it.maxScore ?? 20}
                    </div>

                    {isCode && (
                      <>
                        {isAutoSubmitted && <Badge bg="info">Auto-submitted</Badge>}
                        {!hasCode && <Badge bg="danger">No Code</Badge>}
                        {hasCode && !hasTests && <Badge bg="warning">Needs Review</Badge>}
                      </>
                    )}

                    {type === 'quiz' && quizAuto && <Badge bg="info">Auto {quizAuto}</Badge>}
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    <DecisionControls type={type} item={it} onChanged={onRefresh} />
                    <div className="text-muted">{createdLabel}</div>
                  </div>
                </div>
              </Card.Header>

              <Card.Body>
                {it.videoPath && (
                  <VideoPlayer videoPath={it.videoPath} getVideoUrl={getVideoUrl} />
                )}

                {isCode && (
                  <div className="mb-3">
                    <h6 className="d-flex align-items-center gap-2">
                      <FaCode /> Code Submission Details
                    </h6>

                    <Card className="bg-light">
                      <Card.Body className="p-3">
                        <Row className="small">
                          <Col md={6}>
                            <strong>Language:</strong> {language || 'Unknown'}
                          </Col>
                          <Col md={6}>
                            <strong>Code Submitted:</strong> {hasCode ? 'Yes' : 'No'}
                          </Col>
                          <Col md={6}>
                            <strong>Code Length:</strong> {codeInfo?.codeLength || 0} characters
                          </Col>
                          <Col md={6}>
                            <strong>Submission Type:</strong> {isAutoSubmitted ? 'Auto-submitted' : 'Manual'}
                          </Col>
                          {codeInfo?.challengeId && (
                            <Col md={12}>
                              <strong>Challenge ID:</strong> {codeInfo.challengeId}
                            </Col>
                          )}
                        </Row>
                      </Card.Body>
                    </Card>

                    {!hasCode && (
                      <Alert variant="danger" className="mt-2">
                        <FaExclamationTriangle className="me-2" />
                        <strong>No code was submitted.</strong> This appears to be an empty submission.
                      </Alert>
                    )}

                    {hasCode && !hasTests && (
                      <Alert variant="warning" className="mt-2">
                        <strong>Manual Review Required:</strong> Code was submitted but no automated tests were run.
                      </Alert>
                    )}

                    {isAutoSubmitted && (
                      <Alert variant="info" className="mt-2">
                        This submission was automatically submitted by the system.
                      </Alert>
                    )}
                  </div>
                )}

                {hasTests && (
                  <div className="mt-2">
                    <b>
                      Test Results ({it.details.passedCount}/{it.details.total} passed):
                    </b>
                    <ul className="mb-0">
                      {it.details.tests.map((t: any, i: number) => (
                        <li key={i} className={t.passed ? 'text-success' : 'text-danger'}>
                          {t.name} — {t.passed ? 'PASS' : 'FAIL'}
                          {t.error && <span className="text-muted">: {t.error}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {type !== 'quiz' && Array.isArray(it.details?.qa) && it.details.qa.length > 0 && (
                  <div className="mt-3">
                    <b>Q&A (latest):</b>
                    <ul className="mb-0">
                      {it.details.qa.map((qa: any, idx: number) => (
                        <li key={idx}>
                          <div>
                            <b>Q:</b> {qa.question}
                          </div>
                          <div>
                            <b>A:</b> {qa.answer}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {type === 'tr' && Array.isArray(it.details?.qa) && it.details.qa.length > 0 && (
                  <div className="mt-3">
                    <b>Technical Round — AI Evaluation</b>

                    {it.details.qa.map((qa: any, idx: number) => (
                      <Card key={idx} className="mb-3">
                        <Card.Body>
                          <div className="mb-1">
                            <b>Q:</b> {qa.question}
                          </div>

                          <div className="mb-2">
                            <b>A:</b> {qa.answer}
                          </div>

                          <div className="d-flex align-items-center gap-2 mb-2">
                            <b>Rating:</b>
                            <StarRating rating={qa.rating ?? 0} readOnly />
                            <span className="text-muted">({qa.rating ?? 0} / 5)</span>
                          </div>

                          {qa.feedback && (
                            <Alert variant="info" className="mb-0">
                              <b>AI Feedback:</b> {qa.feedback}
                            </Alert>
                          )}
                        </Card.Body>
                      </Card>
                    ))}

                    <Alert variant="secondary" className="mt-2">
                      <b>Note:</b> Ratings and feedback are generated automatically by AI.
                      Admin action is limited to <b>Pass / Fail</b>.
                    </Alert>
                  </div>
                )}


                {(type === 'tr' || type === 'hr') && (!it.details?.qa || it.details.qa.length === 0) && (
                  <Alert variant="info">No questions and answers recorded for this {type.toUpperCase()} round.</Alert>
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
  setFeedbackRating
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
}) => {
  if (loadingOverview) {
    return (
      <div className="d-flex justify-content-center py-5">
        <Spinner />
      </div>
    )
  }

  return (
    <Row className="g-4">
      <Col lg={8}>
        <SectionBlock
          title="Quiz"
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
        <ScoresCard
          selectedStudent={selectedStudent}
          quizScore={quizScore}
          setQuizScore={setQuizScore}
          codeScore={codeScore}
          setCodeScore={setCodeScore}
          trScore={trScore}
          setTrScore={setTrScore}
          hrScore={hrScore}
          setHrScore={setHrScore}
          savingScores={savingScores}
          setSavingScores={setSavingScores}
          baseURL={baseURL}
          refreshOverview={refreshOverview}
        />

        <FeedbackForm
          selectedStudent={selectedStudent}
          feedbackText={feedbackText}
          setFeedbackText={setFeedbackText}
          feedbackRating={feedbackRating}
          setFeedbackRating={setFeedbackRating}
          baseURL={baseURL}
        />
      </Col>
    </Row>
  )
})

ModalContent.displayName = 'ModalContent'

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
  const [savingScores, setSavingScores] = useState(false)
  const [loadingStudents, setLoadingStudents] = useState(true)

  const studentsPerPage = 5

  const filteredStudents = useMemo(() => {
    let sortedStudents = [...students]

    if (sortOption === 'college') {
      sortedStudents.sort((a, b) => {
        const collegeA = a.college?.toLowerCase() || ''
        const collegeB = b.college?.toLowerCase() || ''
        return collegeA.localeCompare(collegeB)
      })
    }

    const term = searchTerm.toLowerCase()

    return sortedStudents.filter(student =>
      student.fullName?.toLowerCase().includes(term) ||
      student.email?.toLowerCase().includes(term) ||
      student.phoneNo?.includes(term) ||
      student.college?.toLowerCase().includes(term)
    )
  }, [students, sortOption, searchTerm])


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
        console.error('Failed to fetch TR-attended students', e)
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

    if (path.includes('https//')) {
      return path.replace('https//', 'https://')
    }
    if (path.includes('http//')) {
      return path.replace('http//', 'http://')
    }

    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path
    }

    if (path.startsWith('//')) {
      return `https:${path}`
    }

    if (path.includes('s3.') || path.includes('amazonaws.com')) {
      const cleanPath = path.replace(/^\/+/, '')
      if (!cleanPath.startsWith('http')) {
        return `https://${cleanPath}`
      }
      return cleanPath
    }

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
      <PageMetaData title="Student List" />
      <Card className="border bg-transparent rounded-3">
        <CardHeader className="bg-transparent border-bottom">
          <h3 className="mb-0">My Students List</h3>
        </CardHeader>
        <CardBody>
          <Row className="g-3 align-items-center justify-content-between mb-4">
            <Col md={8}>
              <SearchComponent
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                setCurrentPage={setCurrentPage}
              />
            </Col>
            <Col md={3}>
              <form>
                <ChoicesFormInput
                  className="form-select js-choice border-0 z-index-9 bg-transparent"
                  onChange={setSortOption}>
                  <option value="">Sort by</option>
                  <option value="free">Free</option>
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="college">College</option>
                </ChoicesFormInput>
              </form>
            </Col>
          </Row>

          <div className="table-responsive border-0">
            <table className="table table-dark-gray align-middle p-4 mb-0 table-hover">
              <thead>
                <tr>
                  <th>Student name</th>
                  <th>College</th>
                  <th>Phone Number</th>
                  <th>Email</th>
                  <th>View Final Assessment</th>
                </tr>
              </thead>
              <tbody>
                {loadingStudents ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4">
                      <Spinner animation="border" />
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4">
                      No TR-attended students found.
                    </td>
                  </tr>
                ) : (
                  currentStudents.map((student) => (
                    <StudentTableRow
                      key={student._id}
                      student={student}
                      baseURL={baseURL}
                      onReviewClick={handleReviewClick}
                    />
                  ))
                )}
              </tbody>
            </table>

            <div className="d-flex justify-content-between align-items-center mt-4">
              <Button variant="outline-primary" disabled={currentPage === 1} onClick={() => setCurrentPage((prev) => prev - 1)}>
                Previous
              </Button>

              <div>
                Page {currentPage} of {totalPages}
              </div>

              <Button variant="outline-primary" disabled={currentPage === totalPages} onClick={() => setCurrentPage((prev) => prev + 1)}>
                Next
              </Button>
            </div>

            <Modal show={showModal} onHide={() => setShowModal(false)} fullscreen scrollable>
              <Modal.Header closeButton>
                <Modal.Title>
                  Review & Feedback — {selectedStudent?.fullName}
                  {selectedStudent?.email && (
                    <span className="text-muted" style={{ fontSize: 14 }}>
                      {' '}
                      • {selectedStudent.email}
                    </span>
                  )}
                </Modal.Title>
              </Modal.Header>

              <Modal.Body>
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
                  savingScores={savingScores}
                  setSavingScores={setSavingScores}
                  baseURL={baseURL}
                  feedbackText={feedbackText}
                  setFeedbackText={setFeedbackText}
                  feedbackRating={feedbackRating}
                  setFeedbackRating={setFeedbackRating}
                />
              </Modal.Body>
            </Modal>
          </div>
        </CardBody>
      </Card>
    </>
  )
}

export default StudentListPage