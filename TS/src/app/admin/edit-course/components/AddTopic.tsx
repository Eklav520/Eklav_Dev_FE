import useToggle from '@/hooks/useToggle'
import { Button, Col, Modal, ModalBody, ModalFooter, ModalHeader } from 'react-bootstrap'
import { BsPlusCircle, BsXLg } from 'react-icons/bs'

const AddTopic = () => {
  const { isTrue, toggle } = useToggle()
  return (
    <>
      <Button variant="dark" onClick={toggle} size="sm" className="mb-0" data-bs-toggle="modal" data-bs-target="#addTopic">
        <BsPlusCircle className="me-2" />
        Add topic
      </Button>
      <Modal className="fade" show={isTrue} onHide={toggle} id="addTopic" tabIndex={-1} aria-labelledby="addTopicLabel" aria-hidden="true">
        <ModalHeader className="bg-dark">
          <h5 className="modal-title text-white" id="addTopicLabel">
            Add topic
          </h5>
          <button type="button" className="btn btn-sm btn-light mb-0 ms-auto" data-bs-dismiss="modal" onClick={toggle} aria-label="Close">
            <BsXLg />
          </button>
        </ModalHeader>
        <ModalBody>
          <form className="row text-start g-3">
            <Col md={6}>
              <label className="form-label">Topic name</label>
              <input className="form-control" type="text" placeholder="Enter topic name" />
            </Col>
            <Col md={6}>
              <label className="form-label">Video link</label>
              <input className="form-control" type="text" placeholder="Enter Video link" />
            </Col>
            <Col xs={12} className="mt-3">
              <label className="form-label">Course description</label>
              <textarea className="form-control" rows={4} spellCheck="false" defaultValue={''} />
            </Col>
            <Col xs={6} className="mt-3">
              <div className="btn-group" role="group" aria-label="Basic radio toggle button group">
                <input type="radio" className="btn-check" name="options" id="option1" defaultChecked />
                <label className="btn btn-sm btn-light btn-primary-soft-check border-0 m-0" htmlFor="option1">
                  Free
                </label>
                <input type="radio" className="btn-check" name="options" id="option2" />
                <label className="btn btn-sm btn-light btn-primary-soft-check border-0 m-0" htmlFor="option2">
                  Premium
                </label>
              </div>
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

export default AddTopic
