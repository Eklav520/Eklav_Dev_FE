import React, { useEffect, useState } from 'react'
import { Card, Col, Row, Spinner, Alert, Modal, Button, CardHeader, CardBody, Form, ProgressBar, ListGroup, Badge, Accordion } from 'react-bootstrap'

type QA = {
  _id?: string
  question: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctOptionKey: string
  explanation?: string
}

type TopicItem = {
  _id: string
  topic: string
  questions: QA[]
}

type Category = {
  _id: string
  title: string
  items: TopicItem[]
}

const COUNT = 20 // number of questions in a quiz

function shuffle<T>(arr: T[]) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const normalize = (s: any) => (s ?? '').toString().trim().toLowerCase()

const CategoryGrid: React.FC = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Topic preview modal
  const [topicPreviewOpen, setTopicPreviewOpen] = useState(false)
  const [previewTopic, setPreviewTopic] = useState<TopicItem | null>(null)

  // Quiz modal
  const [quizOpen, setQuizOpen] = useState(false)
  const [quizTitle, setQuizTitle] = useState<string>('')
  const [quizQuestions, setQuizQuestions] = useState<QA[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [results, setResults] = useState<{ correct: boolean; correctAnswer: string }[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const QUESTIONS_PER_PAGE = 50

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`${baseURL}/apptitudeQuestions`)
        if (!res.ok) throw new Error('Failed to fetch categories')
        const data = await res.json()
        setCategories(data.data || [])
      } catch (err) {
        console.error(err)
        setError('Failed to load categories.')
        setCategories([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [baseURL])

  const openTopicPreview = (topicItem: TopicItem) => {
    setPreviewTopic(topicItem)
    setCurrentPage(1) // reset page
    setTopicPreviewOpen(true)
  }

  const openQuizForCategory = (category: Category) => {
    const all: QA[] = []
    category.items.forEach((it) => all.push(...(it.questions || [])))
    const chosen = shuffle(all).slice(0, COUNT)
    setQuizTitle(`${category.title} — Practice Quiz`)
    setQuizQuestions(chosen)
    setUserAnswers(Array(chosen.length).fill(''))
    setCurrentIndex(0)
    setSubmitted(false)
    setResults([])
    setQuizOpen(true)
  }

  const closeQuiz = () => {
    setQuizOpen(false)
    setQuizQuestions([])
    setUserAnswers([])
    setSubmitted(false)
    setResults([])
    setQuizTitle('')
  }

  const handleAnswerChange = (idx: number, val: string) => {
    setUserAnswers((prev) => {
      const next = prev.slice()
      next[idx] = val
      return next
    })
  }

  const goto = (i: number) => {
    if (i < 0 || i >= quizQuestions.length) return
    setCurrentIndex(i)
  }

  const handleSubmitQuiz = () => {
    const computed = quizQuestions.map((q, idx) => {
      const user = normalize(userAnswers[idx])
      const correctKey = normalize(q.correctOptionKey)
      const correctFlag = user === correctKey
      return {
        correct: correctFlag,
        correctAnswer: `Option ${q.correctOptionKey}: ${q[`option${q.correctOptionKey}` as keyof QA]}`,
      }
    })
    setResults(computed)
    setSubmitted(true)
  }

  const retake = () => {
    setQuizQuestions(shuffle(quizQuestions).slice(0, COUNT))
    setUserAnswers(Array(Math.min(COUNT, quizQuestions.length)).fill(''))
    setCurrentIndex(0)
    setSubmitted(false)
    setResults([])
  }

  const score = results.filter((r) => r.correct).length
  const answeredCount = userAnswers.filter((a) => (a ?? '').toString().trim().length > 0).length
  const progress = Math.round((answeredCount / Math.max(1, quizQuestions.length)) * 100)

  return (
    <Card className="bg-transparent border rounded-3">
      <CardHeader className="bg-transparent border-bottom">
        <Row className="align-items-center">
          <Col md={6}>
            <h3 className="mb-0">Aptitude Preparation</h3>
          </Col>
        </Row>
      </CardHeader>

      <CardBody>
        <Row xs={1} sm={2} md={3} className="g-4 my-1">
          {loading ? (
            <div className="text-center w-100">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : error ? (
            <Alert variant="danger" className="w-100">
              {error}
            </Alert>
          ) : (
            categories.map((category) => (
              <Col key={category._id}>
                <Card className="shadow-sm h-100">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start">
                      <h5 className="text-success fw-bold mb-3">{category.title}</h5>
                      <Button size="sm" variant="outline-primary" onClick={() => openQuizForCategory(category)}>
                        Take Quiz
                      </Button>
                    </div>

                    <ul className="list-unstyled mb-3">
                      {category.items.map((item) => (
                        <li key={item._id} className="mb-2">
                          <div style={{ cursor: 'pointer' }} onClick={() => openTopicPreview(item)} className="small text-body d-inline-block">
                            › {item.topic}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </Card.Body>
                </Card>
              </Col>
            ))
          )}
        </Row>

        {/* Topic Preview Modal */}
        <Modal show={topicPreviewOpen} onHide={() => setTopicPreviewOpen(false)} fullscreen backdrop="static">
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold">{previewTopic?.topic} — Preparation</Modal.Title>
          </Modal.Header>

          <Modal.Body className="px-4">
            {previewTopic?.questions?.length ? (
              <>
                {/* Pagination Logic */}
                {(() => {
                  const startIndex = (currentPage - 1) * QUESTIONS_PER_PAGE
                  const endIndex = startIndex + QUESTIONS_PER_PAGE
                  const currentQuestions = previewTopic.questions.slice(startIndex, endIndex)
                  const totalPages = Math.ceil(previewTopic.questions.length / QUESTIONS_PER_PAGE)

                  return (
                    <>
                      <Row>
                        <Col md={3}>
                          <Card className="h-100">
                            <Card.Body>
                              <h6 className="mb-3">Questions ({previewTopic.questions.length})</h6>
                              <ListGroup variant="flush" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                                {currentQuestions.map((_, i) => (
                                  <ListGroup.Item key={i + startIndex}>Q{startIndex + i + 1}</ListGroup.Item>
                                ))}
                              </ListGroup>
                              {/* Pagination controls */}
                              <div className="d-flex justify-content-between mt-3">
                                <Button
                                  size="sm"
                                  variant="outline-secondary"
                                  disabled={currentPage === 1}
                                  onClick={() => setCurrentPage((p) => p - 1)}>
                                  ← Prev
                                </Button>
                                <span className="small text-muted">
                                  Page {currentPage} / {totalPages}
                                </span>
                                <Button
                                  size="sm"
                                  variant="outline-secondary"
                                  disabled={currentPage === totalPages}
                                  onClick={() => setCurrentPage((p) => p + 1)}>
                                  Next →
                                </Button>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>

                        {/* Right side with questions */}
                        <Col md={9}>
                          <Card className="h-100">
                            <Card.Body style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                              {currentQuestions.map((qa, i) => (
                                <div key={qa._id ?? i} className="mb-4 pb-3 border-bottom">
                                  <h6 className="fw-semibold">
                                    Q{startIndex + i + 1}: {qa.question}
                                  </h6>

                                  <ul className="mb-2 mt-2">
                                    {['A', 'B', 'C', 'D'].map((k) => {
                                      const opt = qa[`option${k}` as keyof QA]
                                      if (!opt) return null
                                      return (
                                        <li key={k}>
                                          {k}) {opt}
                                        </li>
                                      )
                                    })}
                                  </ul>

                                  {/* Accordion for Answer & Explanation */}
                                  <Accordion>
                                    <Accordion.Item eventKey="0">
                                      <Accordion.Header>Show Answer & Explanation</Accordion.Header>
                                      <Accordion.Body>
                                        <p>
                                          <strong>Correct Answer:</strong> Option {qa.correctOptionKey} —{' '}
                                          {qa[`option${qa.correctOptionKey}` as keyof QA]}
                                        </p>
                                        {qa.explanation && (
                                          <p className="text-muted mb-0">
                                            <strong>Explanation:</strong> {qa.explanation}
                                          </p>
                                        )}
                                      </Accordion.Body>
                                    </Accordion.Item>
                                  </Accordion>
                                </div>
                              ))}
                            </Card.Body>
                          </Card>
                        </Col>
                      </Row>
                    </>
                  )
                })()}
              </>
            ) : (
              <p className="text-muted">No questions available.</p>
            )}
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onClick={() => setTopicPreviewOpen(false)}>
              Close
            </Button>
            {previewTopic?.questions?.length ? (
              <Button
                variant="primary"
                onClick={() => {
                  setTopicPreviewOpen(false)
                  const chosen = shuffle(previewTopic.questions).slice(0, COUNT)
                  setQuizTitle(`${previewTopic.topic} — Practice Quiz`)
                  setQuizQuestions(chosen)
                  setUserAnswers(Array(chosen.length).fill(''))
                  setCurrentIndex(0)
                  setSubmitted(false)
                  setResults([])
                  setQuizOpen(true)
                }}>
                Take Quiz (This Topic)
              </Button>
            ) : null}
          </Modal.Footer>
        </Modal>

        {/* Quiz Modal */}
        <Modal show={quizOpen} onHide={closeQuiz} fullscreen backdrop="static">
          <Modal.Header closeButton>
            <div className="w-100">
              <Modal.Title>{quizTitle}</Modal.Title>
              <ProgressBar now={progress} label={`${progress}%`} className="mt-2" />
            </div>
          </Modal.Header>

          <Modal.Body className="px-4">
            <Row>
              {/* Left side navigation */}
              <Col md={3}>
                <Card className="h-100">
                  <Card.Body>
                    <h6>Questions</h6>
                    <ListGroup variant="flush">
                      {quizQuestions.map((_, i) => {
                        const answered = !!userAnswers[i]
                        return (
                          <ListGroup.Item
                            key={i}
                            action
                            active={i === currentIndex}
                            onClick={() => goto(i)}
                            className="d-flex justify-content-between align-items-center">
                            <div>Q{i + 1}</div>
                            <Badge bg={answered ? 'success' : 'secondary'}>{answered ? 'Done' : 'Pending'}</Badge>
                          </ListGroup.Item>
                        )
                      })}
                    </ListGroup>
                  </Card.Body>
                </Card>
              </Col>

              {/* Center question */}
              <Col md={6}>
                <Card className="h-100">
                  <Card.Body>
                    {quizQuestions.length === 0 ? (
                      <div className="text-muted text-center">No questions.</div>
                    ) : (
                      <>
                        <h5>
                          Q{currentIndex + 1}. {quizQuestions[currentIndex]?.question}
                        </h5>
                        {!submitted ? (
                          <Form>
                            {['A', 'B', 'C', 'D'].map((key) => {
                              const label = quizQuestions[currentIndex][`option${key}` as keyof QA]
                              return (
                                <Form.Check
                                  key={key}
                                  type="radio"
                                  name={`q${currentIndex}`}
                                  label={`${key}. ${label}`}
                                  value={key}
                                  checked={userAnswers[currentIndex] === key}
                                  onChange={(e) => handleAnswerChange(currentIndex, e.target.value)}
                                  className="mb-2"
                                />
                              )
                            })}

                            <div className="d-flex gap-2 mt-3">
                              <Button variant="outline-secondary" size="sm" onClick={() => goto(Math.max(0, currentIndex - 1))}>
                                Previous
                              </Button>
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => goto(Math.min(quizQuestions.length - 1, currentIndex + 1))}>
                                Next
                              </Button>
                            </div>
                          </Form>
                        ) : (
                          <div>
                            <div className="mb-2">
                              <Badge bg={results[currentIndex]?.correct ? 'success' : 'danger'}>
                                {results[currentIndex]?.correct ? 'Correct' : 'Incorrect'}
                              </Badge>
                            </div>
                            <div>
                              <strong>Correct answer:</strong> {results[currentIndex]?.correctAnswer}
                            </div>
                            {quizQuestions[currentIndex]?.explanation && (
                              <div className="text-muted mt-2">
                                <strong>Explanation:</strong> {quizQuestions[currentIndex].explanation}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </Card.Body>
                </Card>
              </Col>

              {/* Right summary */}
              <Col md={3}>
                <Card className="h-100">
                  <Card.Body>
                    {!submitted ? (
                      <>
                        <h6>Summary</h6>
                        <div className="mb-3">
                          <div className="small text-muted">Answered</div>
                          <h4>
                            {answeredCount}/{quizQuestions.length}
                          </h4>
                        </div>

                        <div className="mt-auto">
                          <Button variant="success" className="w-100 mb-2" onClick={handleSubmitQuiz} disabled={quizQuestions.length === 0}>
                            Submit & See Results
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <h6>Results</h6>
                        <h4>
                          {score}/{results.length}
                        </h4>
                        <h5 className="text-muted">{results.length ? Math.round((score / results.length) * 100) : 0}%</h5>
                        <div className="mt-auto d-grid gap-2">
                          <Button variant="outline-primary" onClick={retake}>
                            Retake
                          </Button>
                          <Button variant="secondary" onClick={closeQuiz}>
                            Close
                          </Button>
                        </div>
                      </>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Full results after submission */}
            {submitted && (
              <Row className="mt-4">
                <Col>
                  <Card>
                    <Card.Body>
                      <h6>All Answers</h6>
                      {quizQuestions.map((q, idx) => {
                        const r = results[idx]
                        const your = userAnswers[idx] || 'No Answer'
                        return (
                          <div key={idx} className="mb-2 pb-2 border-bottom">
                            <div>
                              <strong>Q{idx + 1}:</strong> {q.question}
                            </div>
                            <div className="small text-muted">Your: {your}</div>
                            <div className="small text-muted">
                              Correct: Option {q.correctOptionKey} ({q[`option${q.correctOptionKey}` as keyof QA]})
                            </div>
                            <div>{r.correct ? <Badge bg="success">Correct</Badge> : <Badge bg="danger">Incorrect</Badge>}</div>
                            {q.explanation && <div className="text-muted mt-1">Explanation: {q.explanation}</div>}
                          </div>
                        )
                      })}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}
          </Modal.Body>
        </Modal>
      </CardBody>
    </Card>
  )
}

export default CategoryGrid
