import { useState } from 'react'
import { Button, Col, Modal, ModalBody, ModalFooter, ModalHeader } from 'react-bootstrap'
import { BsPlusCircle, BsXLg } from 'react-icons/bs'

const AddToQuestion = ({ onAddFAQ }: { onAddFAQ: (faq: { question: string, answer: string }) => void }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')

  const toggle = () => setIsOpen(!isOpen)

  const handleSave = () => {
    if (question.trim() && answer.trim()) {
      onAddFAQ({ question, answer })
      setQuestion('')
      setAnswer('')
      toggle()
    }
  }

  return (
    <>
      <Button variant="primary-soft" size="sm" onClick={toggle}>
        <BsPlusCircle className="me-2" />
        Add Question
      </Button>
      <Modal show={isOpen} onHide={toggle}>
        <ModalHeader className="bg-dark">
          <h5 className="modal-title text-white">Add FAQ</h5>
          <button type="button" className="btn btn-sm btn-light mb-0 ms-auto" onClick={toggle}>
            <BsXLg />
          </button>
        </ModalHeader>
        <ModalBody>
          <form className="row text-start g-3">
            <Col xs={12}>
              <label className="form-label">Question</label>
              <input
                className="form-control"
                type="text"
                placeholder="Write a question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
            </Col>
            <Col xs={12}>
              <label className="form-label mt-3">Answer</label>
              <textarea
                className="form-control"
                rows={4}
                placeholder="Write an answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
              />
            </Col>
          </form>
        </ModalBody>
        <ModalFooter>
          <button className="btn btn-danger-soft" onClick={toggle}>
            Close
          </button>
          <button className="btn btn-success" onClick={handleSave}>
            Save FAQ
          </button>
        </ModalFooter>
      </Modal>
    </>
  )
}

export default AddToQuestion
