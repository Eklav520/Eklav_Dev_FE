import React, { useEffect, useState } from 'react'
import { Button, Card, Form, ListGroup, Badge, Table, Modal, Alert, ProgressBar } from 'react-bootstrap'
import axios from 'axios'
import AIInterviewModal from './AIInterviewModal'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

interface Company {
  _id: string
  name: string
  rounds?: { name: string }[]
}

interface Question {
  _id: string
  question: string
  options?: string[]
  answer?: string
}

interface Progress {
  attemptedAt: string | number | Date
  roundName: string
  level: string
  score: number
  passed: boolean
  createdAt: string
}

interface Props {
  studentId: string
  company: Company
}

const StudentInterviewRounds: React.FC<Props> = ({ studentId, company }) => {
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [rounds, setRounds] = useState<string[]>([])
  const [globalLevel, setGlobalLevel] = useState<string>('')
  const [selectedRound, setSelectedRound] = useState<string | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [progress, setProgress] = useState<Progress[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [timeLeft, setTimeLeft] = useState(300)
  const [timerId, setTimerId] = useState<ReturnType<typeof setInterval> | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAIModal, setShowAIModal] = useState(false)
  const [topics, setTopics] = useState<string[]>([])
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])

  useEffect(() => {
    axios.get(`${baseURL}/companies`).then((res) => {
      const found = res.data.find((c: Company) => c._id === company._id)
      if (found) setRounds(found.rounds.map((r: any) => r.name))
    })

    axios.get(`${baseURL}/student/progress/${studentId}/${company._id}`).then((res) => setProgress(res.data))
  }, [company, studentId])

  const isRoundUnlocked = (round: string) => {
    if (round.toLowerCase() === 'aptitude') return true
    const passedAptitude = progress.find((p) => p.roundName.toLowerCase() === 'aptitude' && p.level === globalLevel && p.passed)
    return !!passedAptitude
  }

  const handleStartRound = async (round: string) => {
    if (!globalLevel) {
      toast.warning('Please select a level.')
      return
    }

    if (round.toLowerCase() === 'technical' && selectedTopics.length === 0) {
      toast.error('Please select at least one topic before starting the Technical round.')
      return
    }

    try {
      setLoading(true)

      let questionUrl = `${baseURL}/questions/${company._id}/${round}/${globalLevel}`
      if (round.toLowerCase() === 'technical' && selectedTopics.length > 0) {
        const queryParams = new URLSearchParams()
        selectedTopics.forEach((topic) => queryParams.append('topics[]', topic))
        questionUrl += `?${queryParams.toString()}`
      }

      const res = await axios.get(questionUrl)
      const fetchedQuestions = res.data

      if (!fetchedQuestions || fetchedQuestions.length === 0) {
        toast.info('No questions available for this round and level.')
        return
      }

      setQuestions(fetchedQuestions)
      setAnswers({})
      setCurrentIndex(0)
      setSelectedRound(round)

      if (round.toLowerCase() === 'aptitude') {
        setTimeLeft(300)
        setShowModal(true)
      } else {
        setTimeout(() => setShowAIModal(true), 100)
      }
    } catch (err) {
      console.error('❌ Failed to fetch round/questions:', err)
      toast.error('Error loading round.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitAnswers = async () => {
    if (!questions.length || !selectedRound) return
    let correct = 0
    questions.forEach((q) => {
      const given = answers[q._id]?.trim().toLowerCase()
      const actual = q.answer?.trim().toLowerCase()
      if (given && actual && given === actual) correct++
    })

    const score = Math.round((correct / questions.length) * 100)
    const passed = score >= 60

    await axios.post(`${baseURL}/student/submit-round`, {
      studentId,
      companyId: company._id,
      roundName: selectedRound,
      level: globalLevel,
      score,
    })

    const updated = await axios.get(`${baseURL}/student/progress/${studentId}/${company._id}`)
    setProgress(updated.data)

    alert(passed ? `✅ Passed with ${score}%` : `❌ Failed with ${score}%`)
    setShowModal(false)
    setQuestions([])
    setSelectedRound(null)
    setTimeLeft(300)
    if (timerId !== null) clearInterval(timerId)
  }

  const getStatus = (round: string, level: string) => {
    const records = progress.filter((p) => p.roundName === round && p.level === level)
    const latest = records[records.length - 1]
    const todayAttempts = records.filter((p) => {
      const today = new Date()
      const attemptDate = new Date(p.createdAt)
      return today.toDateString() === attemptDate.toDateString()
    })

    return {
      latest,
      attemptsToday: todayAttempts.length,
      isDisabled: todayAttempts.length >= 2,
    }
  }

  // ⏱️ Timer effect for aptitude
  useEffect(() => {
    if (!showModal) {
      if (timerId) clearInterval(timerId)
      return
    }

    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(id)
          handleSubmitAnswers()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    setTimerId(id)
    return () => clearInterval(id)
  }, [showModal])

  return (
    <Card className="p-4">
      <h5> Interview Rounds - {company.name}</h5>
      {/* Level + Topics */}
      <div className="mb-3 d-flex align-items-center gap-3">
        <strong>Level:</strong>
        <Form.Select
          style={{ width: 180 }}
          value={globalLevel}
          onChange={async (e) => {
            const level = e.target.value
            setGlobalLevel(level)

            if (!level) {
              setTopics([])
              setSelectedTopics([])
              return
            }

            try {
              const res = await axios.get(`${baseURL}/topics/${company._id}/Technical/${level}`)
              setTopics(res.data)
              setSelectedTopics([])
            } catch (err) {
              console.error('Error fetching topics:', err)
              setTopics([])
            }
          }}>
          <option value="">Select Level</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="tough">Tough</option>
        </Form.Select>

        {topics.length > 0 && (
          <div className="d-flex flex-wrap gap-3 mt-2 align-items-center">
            <strong>Topics:</strong>
            {topics.map((topic) => (
              <Form.Check
                key={topic}
                inline
                type="checkbox"
                label={topic}
                checked={selectedTopics.includes(topic)}
                onChange={(e) =>
                  e.target.checked ? setSelectedTopics([...selectedTopics, topic]) : setSelectedTopics(selectedTopics.filter((t) => t !== topic))
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Aptitude Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} fullscreen centered>
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            📝 Aptitude Round - <strong>{selectedRound}</strong>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4 py-3">
          {questions.length > 0 ? (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <Alert variant={timeLeft <= 60 ? 'danger' : 'info'} className="py-1 px-3 mb-0">
                  ⏳ Time Left:{' '}
                  <strong>
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                  </strong>
                </Alert>
                <div>
                  <strong>
                    Question {currentIndex + 1} / {questions.length}
                  </strong>
                </div>
              </div>

              <ProgressBar now={((currentIndex + 1) / questions.length) * 100} variant="success" animated striped className="mb-4" />

              <div className="mb-3">
                <h5>
                  <span className="text-grey">Q{currentIndex + 1}:</span> {questions[currentIndex].question}
                </h5>
              </div>

              <Form>
                <div className="d-flex flex-column gap-2">
                  {questions[currentIndex].options?.map((opt, idx) => {
                    const isChecked = answers[questions[currentIndex]._id] === opt
                    return (
                      <label
                        key={idx}
                        htmlFor={`option-${idx}`}
                        className={`d-flex align-items-center p-2 border rounded ${isChecked ? 'bg-primary text-white' : 'bg-light'}`}
                        style={{ cursor: 'pointer' }}>
                        <Form.Check
                          type="radio"
                          name={`question-${questions[currentIndex]._id}`}
                          id={`option-${idx}`}
                          value={opt}
                          checked={isChecked}
                          onChange={(e) =>
                            setAnswers({
                              ...answers,
                              [questions[currentIndex]._id]: e.target.value,
                            })
                          }
                          className="me-2"
                        />
                        <div className="flex-grow-1 fw-medium">
                          {String.fromCharCode(65 + idx)}. {opt}
                        </div>
                      </label>
                    )
                  })}
                </div>
              </Form>
            </>
          ) : (
            <Alert variant="warning">No question found.</Alert>
          )}
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-between px-4">
          <Button variant="secondary" disabled={currentIndex === 0} onClick={() => setCurrentIndex(currentIndex - 1)}>
            ⬅️ Previous
          </Button>
          {currentIndex < questions.length - 1 ? (
            <Button variant="primary" onClick={() => setCurrentIndex(currentIndex + 1)}>
              Next ➡️
            </Button>
          ) : (
            <Button variant="success" onClick={handleSubmitAnswers}>
              ✅ Submit
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Round List */}
      <ListGroup>
        {rounds.map((round) => {
          const { latest, attemptsToday, isDisabled } = getStatus(round, globalLevel)
          return (
            <ListGroup.Item key={round} className="d-flex flex-column gap-2">
              <div className="d-flex justify-content-between align-items-center">
                <strong>{round}</strong>
                <Button
                  size="sm"
                  onClick={() => handleStartRound(round)}
                  disabled={!globalLevel || isDisabled || !isRoundUnlocked(round)}
                  variant={latest?.passed ? 'secondary' : latest ? 'warning' : isRoundUnlocked(round) ? 'primary' : 'secondary'}>
                  {latest?.passed ? 'Completed' : latest ? 'Retake' : isRoundUnlocked(round) ? 'Start' : 'Locked'}
                </Button>
              </div>
              <Badge bg={latest?.passed ? 'success' : latest ? 'danger' : 'secondary'}>
                {latest ? `${latest.passed ? 'Passed' : 'Failed'} (${latest.score}%)` : 'Not Attempted'}
              </Badge>
              {attemptsToday >= 2 && <small className="text-danger">❌ Max 2 attempts reached today</small>}
            </ListGroup.Item>
          )
        })}
      </ListGroup>

      {/* Previous Attempts */}
      {globalLevel && (
        <div className="mt-4">
          <h6>🕓 Previous Attempts (Level: {globalLevel})</h6>
          <Table striped bordered hover size="sm">
            <thead>
              <tr>
                <th>Round</th>
                <th>Date</th>
                <th>Score</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {progress
                .filter((p) => p.level === globalLevel)
                .map((p, idx) => (
                  <tr key={idx}>
                    <td>{p.roundName}</td>
                    <td>{new Date(p.attemptedAt).toLocaleString()}</td>
                    <td>{p.score}%</td>
                    <td>
                      <Badge bg={p.passed ? 'success' : 'danger'}>{p.passed ? 'Passed' : 'Failed'}</Badge>
                    </td>
                  </tr>
                ))}
            </tbody>
          </Table>
        </div>
      )}

      {/* 🧠 AI Modal for practice (no recording, just Q&A + feedback) */}
      {selectedRound && showAIModal && (
        <AIInterviewModal
          show={showAIModal}
          onHide={() => {
            setShowAIModal(false)
            setSelectedRound(null)
          }}
          studentId={studentId}
          companyId={company._id}
          roundName={selectedRound}
          level={globalLevel as 'Easy' | 'Medium' | 'Hard'} 
          selectedTopics={selectedTopics}
        />
      )}
    </Card>
  )
}

export default StudentInterviewRounds
