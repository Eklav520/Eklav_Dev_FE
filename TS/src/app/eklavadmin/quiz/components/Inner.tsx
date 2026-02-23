import React, { useEffect, useState } from 'react'
import {
  Accordion,
  AccordionBody,
  AccordionHeader,
  AccordionItem,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
  Col,
  Modal,
  Row,
} from 'react-bootstrap'
import { FaAngleLeft, FaAngleRight } from 'react-icons/fa'

interface Question {
  _id: string
  question: string
  options: string[]
  correctAnswerIndex: number
  explanation?: string
}

const Inner = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const [questions, setQuestions] = useState<Question[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<any>(null)
  const [formData, setFormData] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswerIndex: 0,
    explanation: '',
  })

  const [currentPage, setCurrentPage] = useState(1)
  const questionsPerPage = 2

  const indexOfLast = currentPage * questionsPerPage
  const indexOfFirst = indexOfLast - questionsPerPage
  const currentQuestions = questions.slice(indexOfFirst, indexOfLast)

  const totalPages = Math.ceil(questions.length / questionsPerPage)

  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    try {
      const res = await fetch(`${baseURL}/questions`)
      const data = await res.json()
      setQuestions(data)
    } catch (error) {
      console.error('Error fetching questions:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return

    try {
      const res = await fetch(`${baseURL}/questions/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setQuestions((prev) => prev.filter((q) => q._id !== id))
      } else {
        console.error('Failed to delete question')
      }
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  const handleEdit = (question: any) => {
    setEditingQuestion(question)
    setFormData({
      question: question.question,
      options: [...question.options],
      correctAnswerIndex: question.correctAnswerIndex,
      explanation: question.explanation || '',
    })
    setShowModal(true)
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options]
    newOptions[index] = value
    setFormData((prev) => ({ ...prev, options: newOptions }))
  }

  const handleUpdate = async () => {
    try {
      const res = await fetch(`${baseURL}/questions/${editingQuestion._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        const updated = await res.json()
        setQuestions((prev) => prev.map((q) => (q._id === editingQuestion._id ? updated.question : q)))
        setShowModal(false)
      } else {
        console.error('Failed to update question')
      }
    } catch (error) {
      console.error('Update error:', error)
    }
  }

  return (
    <Card className="border bg-transparent rounded-3">
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Question</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <label className="form-label">Question</label>
            <input type="text" name="question" className="form-control" value={formData.question} onChange={handleFormChange} />
          </div>

          {formData.options.map((opt, i) => (
            <div className="mb-2" key={i}>
              <label className="form-label">Option {String.fromCharCode(65 + i)}</label>
              <input type="text" className="form-control" value={opt} onChange={(e) => handleOptionChange(i, e.target.value)} />
            </div>
          ))}

          <div className="mb-3">
            <label className="form-label">Correct Answer (0–3)</label>
            <input
              type="number"
              name="correctAnswerIndex"
              className="form-control"
              min="0"
              max="3"
              value={formData.correctAnswerIndex}
              onChange={handleFormChange}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Explanation</label>
            <textarea name="explanation" className="form-control" value={formData.explanation} onChange={handleFormChange} />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpdate}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      <CardHeader className="bg-transparent border-bottom px-3">
        <Row className="g-4 align-items-center">
          <Col md={8}>
            <CardTitle as="h5" className="mb-0">
              <a href="#">Aptitude Questions</a>
            </CardTitle>
          </Col>
        </Row>
      </CardHeader>
      <CardBody className="p-4">
        <Accordion className="accordion-icon accordion-bg-light" id="accordionExample" defaultActiveKey={['0']}>
          {currentQuestions.map((q, idx) => {
            const globalIndex = indexOfFirst + idx // correct numbering for global index
            return (
              <AccordionItem key={q._id} eventKey={String(globalIndex)} className="mb-3">
                <AccordionHeader>
                  <span className="text-secondary fw-bold me-3">{globalIndex + 1 < 10 ? `0${globalIndex + 1}` : globalIndex + 1}</span>
                  <span className="fw-bold">{q.question}</span>
                </AccordionHeader>
                <AccordionBody className="mt-3">
                  {q.options.map((opt: string, i: number) => (
                    <p className="mb-3" key={i}>
                      <b className="text-dark">{String.fromCharCode(65 + i)}</b> {opt}
                    </p>
                  ))}
                  <p>
                    <strong>Correct Answer:</strong> Option {String.fromCharCode(65 + Number(q.correctAnswerIndex))}
                  </p>
                  <p>
                    <strong>Explanation:</strong> {q.explanation}
                  </p>
                  <Button variant="success-soft" size="sm" className="me-2" onClick={() => handleEdit(q)}>
                    Edit
                  </Button>
                  <Button variant="danger-soft" size="sm" onClick={() => handleDelete(q._id)}>
                    Delete
                  </Button>
                </AccordionBody>
              </AccordionItem>
            )
          })}
        </Accordion>
      </CardBody>
      <CardFooter className="bg-transparent pt-0">
        <nav className="d-flex justify-content-center mb-0">
          <ul className="pagination pagination-sm pagination-primary-soft">
            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}>
                <FaAngleLeft />
              </button>
            </li>
            {[...Array(totalPages)].map((_, i) => (
              <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                <button className="page-link" onClick={() => setCurrentPage(i + 1)}>
                  {i + 1}
                </button>
              </li>
            ))}
            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}>
                <FaAngleRight />
              </button>
            </li>
          </ul>
        </nav>
      </CardFooter>
    </Card>
  )
}

export default Inner
