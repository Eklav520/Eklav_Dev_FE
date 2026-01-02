import useToggle from '@/hooks/useToggle'
import { Button, Col, Modal, ModalBody, ModalFooter, ModalHeader } from 'react-bootstrap'
import { BsPlusCircle, BsXLg } from 'react-icons/bs'

const AddToQuestion = () => {
  const { isTrue, toggle } = useToggle()
  return (
    <>
      <Button variant="primary-soft" size="sm" onClick={toggle} className="mb-0" data-bs-toggle="modal" data-bs-target="#addQuestion">
        <BsPlusCircle className="me-2" />
        Add Question
      </Button>
      <Modal className="fade" id="addQuestion" show={isTrue} onHide={toggle} tabIndex={-1} aria-labelledby="addQuestionLabel" aria-hidden="true">
        <ModalHeader className="bg-dark">
          <h5 className="modal-title text-white" id="addQuestionLabel">
            Add FAQ
          </h5>
          <button type="button" className="btn btn-sm btn-light mb-0 ms-auto" data-bs-dismiss="modal" aria-label="Close" onClick={toggle}>
            <BsXLg />
          </button>
        </ModalHeader>
        <ModalBody>
          <form className="row text-start g-3">
            <Col xs={12}>
              <label className="form-label">Question</label>
              <input className="form-control" type="text" placeholder="Write a question" />
            </Col>
            <Col xs={12} className="mt-3">
              <label className="form-label">Answer</label>
              <textarea className="form-control" rows={4} placeholder="Write a answer" spellCheck="false" defaultValue={''} />
            </Col>
          </form>
        </ModalBody>
        <ModalFooter>
          <button type="button" className="btn btn-danger-soft my-0" data-bs-dismiss="modal" onClick={toggle}>
            Close
          </button>
          <button type="button" className="btn btn-success my-0">
            Save topic
          </button>
        </ModalFooter>
      </Modal>
    </>
  )
}

export default AddToQuestion
