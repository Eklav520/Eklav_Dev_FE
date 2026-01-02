import Stepper from 'bs-stepper'
import { FormEvent } from 'react'
import { Col, Row } from 'react-bootstrap'
import { FaEdit, FaTimes } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import AddToQuestion from './AddToQuestion'

const Step4 = ({ stepperInstance }: { stepperInstance: Stepper | undefined }) => {
  const goToNextStep = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    stepperInstance?.next()
  }
  return (
    <form id="step-4" onSubmit={goToNextStep} role="tabpanel" className="content fade" aria-labelledby="steppertrigger4">
      <h4>Additional information</h4>
      <hr />
      <Row className=" g-4">
        <Col xs={12} className="">
          <div className="bg-light border rounded p-2 p-sm-4">
            <div className="d-sm-flex justify-content-sm-between align-items-center mb-3">
              <h5 className="mb-2 mb-sm-0">Upload FAQs</h5>
              <AddToQuestion />
            </div>
            <Row className=" g-4">
              <Col xs={12} className="">
                <div className="bg-body p-3 p-sm-4 border rounded">
                  <div className="d-sm-flex justify-content-sm-between align-items-center mb-2">
                    <h6 className="mb-0">How Digital Marketing Work?</h6>
                    <div className="align-middle">
                      <a href="#" className="btn btn-sm btn-success-soft btn-round me-1 mb-1 mb-md-0">
                        <FaEdit />
                      </a>
                      <button className="btn btn-sm btn-danger-soft btn-round mb-0">
                        <FaTimes />
                      </button>
                    </div>
                  </div>
                  <p>
                    Comfort reached gay perhaps chamber his six detract besides add. Moonlight newspaper up its enjoyment agreeable depending. Timed
                    voice share led him to widen noisy young. At weddings believed laughing although the material does the exercise of. Up attempt
                    offered ye civilly so sitting to. She new course gets living within Elinor joy. She rapturous suffering concealed.
                  </p>
                </div>
              </Col>
              <Col xs={12} className="">
                <div className="bg-body p-4 border rounded">
                  <div className="d-sm-flex justify-content-sm-between align-items-center mb-2">
                    <h6 className="mb-0">How Digital Marketing Work?</h6>
                    <div className="align-middle">
                      <a href="#" className="btn btn-sm btn-success-soft btn-round me-1 mb-1 mb-md-0">
                        <FaEdit />
                      </a>
                      <button className="btn btn-sm btn-danger-soft btn-round mb-0">
                        <FaTimes />
                      </button>
                    </div>
                  </div>
                  <p>
                    Comfort reached gay perhaps chamber his six detract besides add. Moonlight newspaper up its enjoyment agreeable depending. Timed
                    voice share led him to widen noisy young. At weddings believed laughing although the material does the exercise of. Up attempt
                    offered ye civilly so sitting to. She new course gets living within Elinor joy. She rapturous suffering concealed.
                  </p>
                </div>
              </Col>
            </Row>
          </div>
        </Col>
        <Col xs={12}>
          <div className="bg-light border rounded p-4">
            <h5 className="mb-0">Tags</h5>
            <div className="mt-3">
              <input
                type="text"
                className="form-control js-choice mb-0"
                data-placeholder="true"
                data-placeholder-val="Enter tags"
                data-max-item-count={14}
                data-remove-item-button="true"
              />
              <span className="small">Maximum of 14 keywords. Keywords should all be in lowercase. e.g. javascript, react, marketing</span>
            </div>
          </div>
        </Col>
        <Col xs={12}>
          <div className="bg-light border rounded p-4">
            <h5 className="mb-0">Message to a reviewer</h5>
            <div className="mt-3">
              <textarea className="form-control" rows={4} placeholder="Write a message" spellCheck="false" defaultValue={''} />
              <div className="form-check mb-0 mt-2">
                <input type="checkbox" className="form-check-input" id="exampleCheck1" />
                <label className="form-check-label" htmlFor="exampleCheck1">
                  Any images, sounds, or other assets that are not my own work, have been appropriately licensed for use in the file preview or main
                  course. Other than these items, this work is entirely my own and I have full rights to sell it here.
                </label>
              </div>
            </div>
          </div>
        </Col>
        <div className="d-md-flex justify-content-between align-items-start mt-4">
          <button className="btn btn-secondary prev-btn mb-2 mb-md-0">Previous</button>
          <button className="btn btn-light me-auto ms-md-2 mb-2 mb-md-0">Preview Course</button>
          <div className="text-md-end">
            <Link to="/instructor/course-added" className="btn btn-success mb-2 mb-sm-0">
              Submit a Course
            </Link>
            <p className="mb-0 small mt-1">
              Once you click &quot;Submit a Course&quot;, your course will be uploaded and marked as pending for review.
            </p>
          </div>
        </div>
      </Row>
    </form>
  )
}

export default Step4
