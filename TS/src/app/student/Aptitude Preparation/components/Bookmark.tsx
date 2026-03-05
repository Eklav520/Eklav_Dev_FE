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
    <Card className="bg-black text-white border-0 rounded-3">
      <CardHeader className="bg-black text-white border-bottom border-secondary">
        <Row className="align-items-center">
          <Col md={6}>
            <h3 className="mb-0 fw-light">APTITUDE PREPARATION</h3>
          </Col>
        </Row>
      </CardHeader>

      <CardBody className="bg-black">
        <Row xs={1} sm={2} md={3} className="g-4 my-1">
          {loading ? (
            <div className="text-center w-100">
              <Spinner animation="border" variant="warning" />
            </div>
          ) : error ? (
            <Alert variant="danger" className="w-100 bg-danger text-white border-0">
              {error}
            </Alert>
          ) : (
            categories.map((category) => (
              <Col key={category._id}>
                <Card className="category-card bg-dark text-white h-100">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <h5 className="fw-bold text-white category-title">{category.title}</h5>
                      <Button 
                        size="sm" 
                        className="btn-orange" 
                        onClick={() => openQuizForCategory(category)}
                      >
                        Take Quiz
                      </Button>
                    </div>

                    <div className="topic-list">
                      {category.items.map((item, index) => (
                        <div 
                          key={item._id} 
                          className="topic-item"
                          onClick={() => openTopicPreview(item)}
                        >
                          <span className="topic-bullet">›</span>
                          <span className="topic-name">{item.topic}</span>
                        </div>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))
          )}
        </Row>

        {/* Topic Preview Modal */}
        <Modal 
          show={topicPreviewOpen} 
          onHide={() => setTopicPreviewOpen(false)} 
          fullscreen 
          backdrop="static"
          className="text-white"
          contentClassName="bg-dark"
        >
          <Modal.Header closeButton className="bg-dark text-white border-secondary">
            <Modal.Title className="fw-bold text-white">{previewTopic?.topic} — Preparation</Modal.Title>
          </Modal.Header>

          <Modal.Body className="px-4 bg-dark text-white">
            {previewTopic?.questions?.length ? (
              <>
                {(() => {
                  const startIndex = (currentPage - 1) * QUESTIONS_PER_PAGE
                  const endIndex = startIndex + QUESTIONS_PER_PAGE
                  const currentQuestions = previewTopic.questions.slice(startIndex, endIndex)
                  const totalPages = Math.ceil(previewTopic.questions.length / QUESTIONS_PER_PAGE)

                  return (
                    <>
                      <Row>
                        <Col md={3}>
                          <Card className="bg-black text-white border-secondary h-100">
                            <Card.Body>
                              <div className="d-flex justify-content-between align-items-center mb-3">
                                <h6 className="text-white mb-0">Questions</h6>
                                <Badge bg="secondary" className="bg-orange text-white">{previewTopic.questions.length}</Badge>
                              </div>
                              
                              {/* Box-type question grid */}
                              <div className="question-box-grid" style={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(4, 1fr)', 
                                gap: '8px',
                                maxHeight: '60vh',
                                overflowY: 'auto',
                                padding: '4px'
                              }}>
                                {previewTopic.questions.map((_, i) => {
                                  const isInCurrentPage = i >= startIndex && i < endIndex
                                  return (
                                    <div
                                      key={i}
                                      onClick={() => {
                                        const newPage = Math.floor(i / QUESTIONS_PER_PAGE) + 1
                                        setCurrentPage(newPage)
                                      }}
                                      className={`question-box d-flex align-items-center justify-content-center p-2 rounded ${
                                        isInCurrentPage 
                                          ? 'bg-orange text-white' 
                                          : 'bg-dark text-secondary border-secondary'
                                      }`}
                                      style={{
                                        cursor: 'pointer',
                                        border: isInCurrentPage ? 'none' : '1px solid #333',
                                        aspectRatio: '1/1',
                                        fontSize: '0.9rem',
                                        fontWeight: isInCurrentPage ? '600' : '400',
                                        transition: 'all 0.2s ease'
                                      }}
                                    >
                                      {i + 1}
                                    </div>
                                  )
                                })}
                              </div>

                              {/* Pagination controls */}
                              <div className="d-flex justify-content-between align-items-center mt-3">
                                <Button
                                  size="sm"
                                  variant="outline-secondary"
                                  disabled={currentPage === 1}
                                  onClick={() => setCurrentPage((p) => p - 1)}
                                  className="text-white border-secondary"
                                >
                                  ← Prev
                                </Button>
                                <span className="small text-secondary">
                                  Page {currentPage} / {totalPages}
                                </span>
                                <Button
                                  size="sm"
                                  variant="outline-secondary"
                                  disabled={currentPage === totalPages}
                                  onClick={() => setCurrentPage((p) => p + 1)}
                                  className="text-white border-secondary"
                                >
                                  Next →
                                </Button>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>

                        <Col md={9}>
                          <Card className="bg-black text-white border-secondary h-100">
                            <Card.Body style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                              {currentQuestions.map((qa, i) => (
                                <div key={qa._id ?? i} className="mb-4 pb-3 border-bottom border-secondary">
                                  <h6 className="fw-semibold text-white">
                                    Q{startIndex + i + 1}: {qa.question}
                                  </h6>

                                  <ul className="mb-2 mt-2 text-secondary" style={{ listStyle: 'none', paddingLeft: 0 }}>
                                    {['A', 'B', 'C', 'D'].map((k) => {
                                      const opt = qa[`option${k}` as keyof QA]
                                      if (!opt) return null
                                      return (
                                        <li key={k} className="text-white mb-1">
                                          <span className="text-orange me-2">{k}.</span> {opt}
                                        </li>
                                      )
                                    })}
                                  </ul>

                                  <Accordion>
                                    <Accordion.Item eventKey="0" className="bg-black border-secondary">
                                      <Accordion.Header className="bg-black text-white">Show Answer & Explanation</Accordion.Header>
                                      <Accordion.Body className="bg-black text-secondary">
                                        <p>
                                          <strong className="text-white">Correct Answer:</strong> Option {qa.correctOptionKey} —{' '}
                                          {qa[`option${qa.correctOptionKey}` as keyof QA]}
                                        </p>
                                        {qa.explanation && (
                                          <p className="text-secondary mb-0">
                                            <strong className="text-white">Explanation:</strong> {qa.explanation}
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
              <p className="text-secondary">No questions available.</p>
            )}
          </Modal.Body>

          <Modal.Footer className="bg-dark border-secondary">
            <Button variant="secondary" onClick={() => setTopicPreviewOpen(false)} className="border-secondary">
              Close
            </Button>
            {previewTopic?.questions?.length ? (
              <Button
                className="btn-orange"
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
        <Modal 
          show={quizOpen} 
          onHide={closeQuiz} 
          fullscreen 
          backdrop="static"
          className="text-white"
          contentClassName="bg-dark"
        >
          <Modal.Header closeButton className="bg-dark text-white border-secondary">
            <div className="w-100">
              <Modal.Title className="text-white">{quizTitle}</Modal.Title>
              <ProgressBar
                now={progress}
                label={`${progress}%`}
                className="mt-2 orange-progress"
              />
            </div>
          </Modal.Header>

          <Modal.Body className="px-4 bg-dark text-white">
            <Row>
              <Col md={3}>
                <Card className="bg-black text-white border-secondary h-100">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="text-white mb-0">Questions</h6>
                      <Badge bg="secondary" className="bg-orange text-white">{quizQuestions.length}</Badge>
                    </div>
                    
                    {/* Box-type question grid for quiz */}
                    <div className="question-box-grid" style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(4, 1fr)', 
                      gap: '8px',
                      maxHeight: '60vh',
                      overflowY: 'auto',
                      padding: '4px'
                    }}>
                      {quizQuestions.map((_, i) => {
                        const answered = !!userAnswers[i]
                        return (
                          <div
                            key={i}
                            onClick={() => goto(i)}
                            className={`question-box d-flex align-items-center justify-content-center p-2 rounded ${
                              i === currentIndex
                                ? 'bg-orange text-white'
                                : answered
                                ? 'bg-success text-white'
                                : 'bg-dark text-secondary border-secondary'
                            }`}
                            style={{
                              cursor: 'pointer',
                              border: i === currentIndex || answered ? 'none' : '1px solid #333',
                              aspectRatio: '1/1',
                              fontSize: '0.9rem',
                              fontWeight: i === currentIndex ? '600' : '400',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            {i + 1}
                          </div>
                        )
                      })}
                    </div>

                    <div className="mt-3">
                      <div className="d-flex align-items-center gap-3 mb-2">
                        <div className="d-flex align-items-center">
                          <div className="bg-orange rounded me-2" style={{ width: '16px', height: '16px' }}></div>
                          <span className="small text-secondary">Current</span>
                        </div>
                        <div className="d-flex align-items-center">
                          <div className="bg-success rounded me-2" style={{ width: '16px', height: '16px' }}></div>
                          <span className="small text-secondary">Answered</span>
                        </div>
                      </div>
                      <div className="d-flex align-items-center">
                        <div className="bg-dark border border-secondary rounded me-2" style={{ width: '16px', height: '16px' }}></div>
                        <span className="small text-secondary">Pending</span>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={6}>
                <Card className="bg-black text-white border-secondary h-100">
                  <Card.Body>
                    {quizQuestions.length === 0 ? (
                      <div className="text-secondary text-center">No questions.</div>
                    ) : (
                      <>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h5 className="text-white mb-0">
                            Question {currentIndex + 1} of {quizQuestions.length}
                          </h5>
                          <Badge bg={userAnswers[currentIndex] ? 'success' : 'secondary'}>
                            {userAnswers[currentIndex] ? 'Answered' : 'Pending'}
                          </Badge>
                        </div>
                        
                        <h6 className="text-white mb-4">
                          {quizQuestions[currentIndex]?.question}
                        </h6>

                        {!submitted ? (
                          <Form>
                            {['A', 'B', 'C', 'D'].map((key) => {
                              const label = quizQuestions[currentIndex][`option${key}` as keyof QA]
                              return (
                                <Form.Check
                                  key={key}
                                  type="radio"
                                  name={`q${currentIndex}`}
                                  id={`option-${key}`}
                                  label={
                                    <span className="text-white">
                                      <span className="text-orange me-2">{key}.</span> {label}
                                    </span>
                                  }
                                  value={key}
                                  checked={userAnswers[currentIndex] === key}
                                  onChange={(e) => handleAnswerChange(currentIndex, e.target.value)}
                                  className="mb-3"
                                />
                              )
                            })}

                            <div className="d-flex justify-content-between mt-4">
                              <Button 
                                variant="outline-secondary" 
                                onClick={() => goto(currentIndex - 1)}
                                disabled={currentIndex === 0}
                                className="text-white border-secondary"
                              >
                                ← Previous
                              </Button>
                              <Button
                                variant="outline-secondary"
                                onClick={() => goto(currentIndex + 1)}
                                disabled={currentIndex === quizQuestions.length - 1}
                                className="text-white border-secondary"
                              >
                                Next →
                              </Button>
                            </div>
                          </Form>
                        ) : (
                          <div>
                            <div className="mb-3">
                              <Badge bg={results[currentIndex]?.correct ? 'success' : 'danger'} className="mb-2">
                                {results[currentIndex]?.correct ? '✓ Correct' : '✗ Incorrect'}
                              </Badge>
                            </div>
                            <div className="bg-dark p-3 rounded border border-secondary mb-3">
                              <div className="text-white mb-2">
                                <strong>Your answer:</strong> {userAnswers[currentIndex] || 'No answer selected'}
                              </div>
                              <div className="text-white">
                                <strong>Correct answer:</strong> {results[currentIndex]?.correctAnswer}
                              </div>
                            </div>
                            {quizQuestions[currentIndex]?.explanation && (
                              <div className="text-secondary mt-3 p-3 bg-black rounded border border-secondary">
                                <strong className="text-white d-block mb-2">Explanation:</strong>
                                {quizQuestions[currentIndex].explanation}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </Card.Body>
                </Card>
              </Col>

              <Col md={3}>
                <Card className="bg-black text-white border-secondary h-100">
                  <Card.Body>
                    {!submitted ? (
                      <>
                        <h6 className="text-white mb-3">Progress Summary</h6>
                        <div className="mb-4">
                          <div className="d-flex justify-content-between mb-1">
                            <span className="small text-secondary">Answered</span>
                            <span className="text-white fw-bold">{answeredCount}/{quizQuestions.length}</span>
                          </div>
                          <ProgressBar 
                            now={(answeredCount/quizQuestions.length)*100} 
                            className="orange-progress"
                            style={{ height: '6px' }}
                          />
                        </div>

                        <div className="mt-auto">
                          <Button 
                            className="btn-orange w-100 mb-2" 
                            onClick={handleSubmitQuiz} 
                            disabled={quizQuestions.length === 0 || answeredCount < quizQuestions.length}
                          >
                            {answeredCount === quizQuestions.length ? 'Submit Quiz' : `Answer all (${quizQuestions.length - answeredCount} left)`}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <h6 className="text-white mb-3">Final Results</h6>
                        <div className="text-center mb-4">
                          <div className="display-4 text-orange fw-bold mb-2">
                            {Math.round((score / results.length) * 100)}%
                          </div>
                          <div className="text-secondary">
                            {score} correct out of {results.length}
                          </div>
                        </div>

                        <div className="mt-auto d-grid gap-2">
                          <Button className="btn-orange" onClick={retake}>
                            Retake Quiz
                          </Button>
                          <Button variant="secondary" onClick={closeQuiz} className="border-secondary">
                            Close
                          </Button>
                        </div>
                      </>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {submitted && (
              <Row className="mt-4">
                <Col>
                  <Card className="bg-black text-white border-secondary">
                    <Card.Body>
                      <h6 className="text-white mb-3">Detailed Answers Review</h6>
                      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {quizQuestions.map((q, idx) => {
                          const r = results[idx]
                          const your = userAnswers[idx] || 'No Answer'
                          return (
                            <div key={idx} className="mb-3 pb-3 border-bottom border-secondary">
                              <div className="d-flex justify-content-between mb-2">
                                <strong className="text-white">Q{idx + 1}</strong>
                                <Badge bg={r.correct ? 'success' : 'danger'}>
                                  {r.correct ? 'Correct' : 'Incorrect'}
                                </Badge>
                              </div>
                              <div className="text-white mb-2">{q.question}</div>
                              <div className="small text-secondary mb-1">Your answer: {your}</div>
                              <div className="small text-secondary mb-2">
                                Correct: Option {q.correctOptionKey} ({q[`option${q.correctOptionKey}` as keyof QA]})
                              </div>
                              {q.explanation && (
                                <div className="text-secondary small mt-2">
                                  <span className="text-white">Explanation:</span> {q.explanation}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}
          </Modal.Body>
        </Modal>
      </CardBody>
      <style>
        {`
          body {
            background-color: #1a1a1a !important;
          }
          
          .bg-black {
            background-color: #1a1a1a !important;
          }
          
          .bg-dark {
            background-color: #1a1a1a !important;
          }
          
          .bg-orange {
            background-color: #ff7a00 !important;
          }
          
          .text-orange {
            color: #ff7a00 !important;
          }
          
          .btn-orange {
            background: #ff7a00 !important;
            border: none !important;
            color: #ffffff !important;
            font-weight: 600;
            padding: 0.35rem 0.9rem;
            border-radius: 6px;
            transition: all 0.2s ease;
          }
          
          .btn-orange:hover {
            background: #e56e00 !important;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(255, 122, 0, 0.3);
          }
          
          .orange-progress .progress-bar {
            background: #ff7a00 !important;
          }
          
          /* Category Card Styling */
          .category-card {
            background-color: #1a1a1a !important;
            border: 2px solid #ff7a00 !important;
            border-radius: 12px !important;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
          }
          
          .category-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 10px 30px rgba(255, 122, 0, 0.2);
            border-color: #ff8c1a !important;
          }
          
          .category-title {
            position: relative;
            display: inline-block;
            margin-bottom: 1rem;
            font-size: 1.3rem;
            letter-spacing: 0.5px;
          }
          
          .category-title::after {
            content: '';
            position: absolute;
            bottom: -6px;
            left: 0;
            width: 40px;
            height: 3px;
            background: #ff7a00;
            border-radius: 2px;
          }
          
          .topic-list {
            margin-top: 1rem;
          }
          
          .topic-item {
            display: flex;
            align-items: center;
            padding: 8px 0;
            cursor: pointer;
            border-bottom: 1px dashed #333;
            transition: all 0.2s ease;
          }
          
          .topic-item:last-child {
            border-bottom: none;
          }
          
          .topic-item:hover {
            padding-left: 8px;
            background: rgba(255, 122, 0, 0.05);
          }
          
          .topic-bullet {
            color: #ff7a00;
            font-size: 1.2rem;
            margin-right: 10px;
            font-weight: bold;
          }
          
          .topic-name {
            color: #9ca3af;
            font-size: 0.95rem;
            transition: color 0.2s ease;
          }
          
          .topic-item:hover .topic-name {
            color: #ff7a00;
          }
          
          .border-secondary {
            border-color: #333333 !important;
          }
          
          .text-secondary {
            color: #9ca3af !important;
          }
          
          /* Accordion styling */
          .accordion-button {
            background-color: #1a1a1a !important;
            color: #ffffff !important;
            font-weight: 500;
          }
          
          .accordion-button:not(.collapsed) {
            background-color: #1a1a1a !important;
            color: #ff7a00 !important;
          }
          
          .accordion-button:focus {
            box-shadow: 0 0 0 0.2rem rgba(255, 122, 0, 0.25) !important;
          }
          
          .accordion-body {
            background-color: #1a1a1a !important;
            color: #9ca3af !important;
          }
          
          .accordion-body strong {
            color: #ffffff !important;
          }
          
          .accordion-button::after {
            filter: brightness(0) invert(1);
          }
          
          .modal-content {
            background-color: #1a1a1a !important;
          }
          
          .btn-close {
            filter: brightness(0) invert(1);
          }
          
          .card {
            border-color: #333333 !important;
          }
          
          .form-check-input:checked {
            background-color: #ff7a00 !important;
            border-color: #ff7a00 !important;
          }
          
          .form-check-input:focus {
            box-shadow: 0 0 0 0.2rem rgba(255, 122, 0, 0.25) !important;
          }
          
          /* Question box hover effect */
          .question-box:hover {
            transform: scale(1.05);
            box-shadow: 0 4px 12px rgba(255, 122, 0, 0.2);
          }
          
          /* Custom scrollbar */
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          
          ::-webkit-scrollbar-track {
            background: #1a1a1a;
          }
          
          ::-webkit-scrollbar-thumb {
            background: #333;
            border-radius: 4px;
          }
          
          ::-webkit-scrollbar-thumb:hover {
            background: #ff7a00;
          }
        `}
      </style>
    </Card>
  )
}

export default CategoryGrid