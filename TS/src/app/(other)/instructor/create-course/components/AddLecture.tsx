import useToggle from '@/hooks/useToggle'
import { Button, Col, Modal, ModalBody, ModalFooter, ModalHeader } from 'react-bootstrap'
import { BsPlusCircle, BsXLg } from 'react-icons/bs'

const AddLecture = () => {
  const { isTrue, toggle } = useToggle()

  return (
    <>
      <Button variant="primary-soft" size="sm" onClick={toggle} className="mb-0" data-bs-toggle="modal" data-bs-target="#addLecture">
        <BsPlusCircle className="me-2" />
        Add Lecture
      </Button>
      <Modal className="fade" show={isTrue} tabIndex={-1} aria-labelledby="addLectureLabel" aria-hidden="true">
        <ModalHeader className="bg-dark">
          <h5 className="modal-title text-white" id="addLectureLabel">
            Add Lecture
          </h5>
          <button type="button" className="btn btn-sm btn-light mb-0 ms-auto" data-bs-dismiss="modal" onClick={toggle} aria-label="Close">
            <BsXLg />
          </button>
        </ModalHeader>
        <ModalBody>
          <form className="row text-start g-3">
            <Col xs={12}>
              <label className="form-label">
                Course name <span className="text-danger">*</span>
              </label>
              <input type="text" className="form-control" placeholder="Enter course name" />
            </Col>
          </form>
        </ModalBody>
        <ModalFooter>
          <button type="button" className="btn btn-danger-soft my-0" data-bs-dismiss="modal" onClick={toggle}>
            Close
          </button>
          <button type="button" className="btn btn-success my-0">
            Save Lecture
          </button>
        </ModalFooter>
      </Modal>
    </>
  )
}

export default AddLecture
