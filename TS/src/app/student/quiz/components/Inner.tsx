import { useEffect, useRef, useState } from 'react'
import { Accordion, AccordionBody, AccordionHeader, AccordionItem, Button, Card, CardBody, CardHeader, Col, ProgressBar, Row } from 'react-bootstrap'
import { BsClockHistory } from 'react-icons/bs'

interface Question {
  _id: string
  question: string
  options: string[]
  correctAnswerIndex: number
  explanation: string
}

const Inner = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const [questions, setQuestions] = useState<Question[]>([])
  const [selectedAnswers, setSelectedAnswers] = useState<{ [id: string]: number }>({})
  const [showResults, setShowResults] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [showExplanation, setShowExplanation] = useState<{ [id: string]: boolean }>({})
  const questionRef = useRef<HTMLDivElement>(null)
  const questionsPerPage = 1

  const indexOfLast = currentPage * questionsPerPage
  const indexOfFirst = indexOfLast - questionsPerPage
  const currentQuestions = questions.slice(indexOfFirst, indexOfLast)
  const allQuestionsAnswered = questions.length > 0 && questions.every((q) => selectedAnswers[q._id] !== undefined)

  useEffect(() => {
    fetchQuestions()
  }, [])

  useEffect(() => {
    questionRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentPage])

  const fetchQuestions = async () => {
  try {
    const res = await fetch(`${baseURL}/questions`)
    const data: Question[] = await res.json()

    // Shuffle questions
    const shuffled = data.sort(() => 0.5 - Math.random())

    // Pick first 50
    const selected = shuffled.slice(0, 50)

    setQuestions(selected)
  } catch (error) {
    console.error('Error fetching questions:', error)
  }
}


  const handleSelect = (qId: string, optionIndex: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [qId]: optionIndex }))
  }

  const handleSubmit = () => {
    setShowResults(true)
  }

  const getOptionVariant = (q: Question, i: number) => {
    if (!showResults) return 'outline-primary'
    const selected = selectedAnswers[q._id]
    const correct = q.correctAnswerIndex
    if (i === correct) return 'success'
    if (i === selected) return 'danger'
    return 'outline-secondary'
  }

  const getScore = () => {
    let correct = 0
    questions.forEach((q) => {
      if (selectedAnswers[q._id] === q.correctAnswerIndex) correct++
    })
    return correct
  }

  const Countdown = () => {
    const [timer, setTimer] = useState(90)
    const timerToString = () => {
      let hours = ('0' + Math.floor(timer / 3600)).slice(-2)
      let minutes = ('0' + Math.floor(timer / 60)).slice(-2)
      let seconds = ('0' + (timer % 60)).slice(-2)
      return hours + ':' + minutes + ':' + seconds
    }

    useEffect(() => {
      if (timer > 0) {
        const t = setTimeout(() => setTimer(timer - 1), 1000)
        return () => clearTimeout(t)
      }
    }, [timer])

    return (
      <h6 className="text-danger text-end mb-0">
        <BsClockHistory className="me-1" />
        Time Left: {timerToString()}
        {showResults && (
          <div className="text-right mt-4">
            <h5>
              Your Score: {getScore()} / {questions.length}
            </h5>
          </div>
        )}
      </h6>
      
    )
  }

  const progress = (Object.keys(selectedAnswers).length / questions.length) * 100

  return (
    <Card className="border bg-transparent rounded-3">
      <CardHeader className="bg-transparent border-bottom px-3">
        <Row className="g-4 align-items-center">
          <Col md={12} className="mt-4">
            <div className="d-flex flex-wrap gap-2">
              {questions.map((q, i) => {
                const isCurrent = i + 1 === currentPage
                const hasSelected = selectedAnswers[q._id] !== undefined
                let variant = 'outline-secondary'

                if (showResults) {
                  const selected = selectedAnswers[q._id]
                  if (selected !== undefined) {
                    variant = selected === q.correctAnswerIndex ? 'success' : 'danger'
                  }
                } else {
                  if (hasSelected) variant = 'success'
                  else if (isCurrent) variant = 'primary'
                }
                return (
                  <Button
                    key={i}
                    variant={variant}
                    size="sm"
                    className="rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm"
                    style={{
                      width: '40px',
                      height: '40px',
                      borderWidth: isCurrent ? '2px' : '1px',
                      fontSize: '0.9rem',
                    }}
                    onClick={() => setCurrentPage(i + 1)}>
                    {i + 1}
                  </Button>
                )
              })}
            </div>
          </Col>
        </Row>
        <Countdown />
      </CardHeader>

      <CardBody className="p-4">
        <ProgressBar now={progress} label={`${Math.round(progress)}%`} className="mb-3" />
        <div ref={questionRef}>
          <Accordion className="accordion-icon accordion-bg-light" defaultActiveKey={['0']}>
            {currentQuestions.map((q, idx) => (
              <AccordionItem className="mb-3" key={q._id} eventKey={`${idx}`}>
                <AccordionHeader>
                  <span className="text-secondary fw-bold me-3">{(indexOfFirst + idx + 1).toString().padStart(2, '0')}</span>
                  <span className="fw-bold">{q.question}</span>
                </AccordionHeader>
                <AccordionBody className="mt-3 px-0">
                  <div className="px-3">
                    {' '}
                    {/* Ensures same horizontal padding as question */}
                    <Row className="g-3">
                      {q.options.map((opt, i) => (
                        <Col xs={12} md={6} key={i}>
                          <input
                            type="radio"
                            className="btn-check"
                            name={`ques-${q._id}`}
                            id={`option-${q._id}-${i}`}
                            onChange={() => handleSelect(q._id, i)}
                            checked={selectedAnswers[q._id] === i}
                          />
                          <label className={`btn btn-${getOptionVariant(q, i)} w-100`} htmlFor={`option-${q._id}-${i}`}>
                            {opt}
                          </label>
                        </Col>
                      ))}
                    </Row>
                    {showResults && (
                      <div className="mt-3">
                        <Button
                          variant="info"
                          size="sm"
                          onClick={() =>
                            setShowExplanation((prev) => ({
                              ...prev,
                              [q._id]: !prev[q._id],
                            }))
                          }>
                          {showExplanation[q._id] ? 'Hide Explanation' : 'Show Explanation'}
                        </Button>

                        {showExplanation[q._id] && (
                          <div className="alert alert-info mt-2">
                            <strong>Explanation:</strong> {q.explanation}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </AccordionBody>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="d-flex justify-content-between mt-4">
          <Button variant="outline-secondary" disabled={currentPage === 1} onClick={() => setCurrentPage((prev) => prev - 1)}>
            Previous
          </Button>

          <Button variant="outline-secondary" disabled={currentPage === questions.length} onClick={() => setCurrentPage((prev) => prev + 1)}>
            Next
          </Button>
        </div>

        <div className="d-flex justify-content-center mt-4">
          <Button variant="success" onClick={handleSubmit} disabled={!allQuestionsAnswered}>
            Submit
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}

export default Inner
