import Stepper from 'bs-stepper'
import { FormEvent } from 'react'
import { Col, Row } from 'react-bootstrap'
import { FaEdit, FaTimes } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import AddToQuestion from './AddToQuestion'
import FeatureInput from './FeatureInput'

const Step4 = ({
  stepperInstance,
  formData,
  setFormData,
  handleSubmit,
  uploadProgress,
}: {
  stepperInstance: Stepper | undefined
  formData: any
  setFormData: React.Dispatch<React.SetStateAction<any>>
  handleSubmit: any
  uploadProgress: any
}) => {
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
              <AddToQuestion
                onAddFAQ={(faq) =>
                  setFormData((prev: any) => ({
                    ...prev,
                    addFAQ: [...prev.addFAQ, faq],
                  }))
                }
              />
            </div>
            <Row className=" g-4">
              {formData.addFAQ.map((faq: any, index: number) => (
                <Col xs={12} key={index}>
                  <div className="bg-body p-3 p-sm-4 border rounded">
                    <div className="d-sm-flex justify-content-sm-between align-items-center mb-2">
                      <h6 className="mb-0">{faq.question}</h6>
                      <div className="align-middle">
                        <button className="btn btn-sm btn-success-soft btn-round me-1 mb-1 mb-md-0">
                          <FaEdit />
                        </button>
                        <button
                          className="btn btn-sm btn-danger-soft btn-round mb-0"
                          onClick={() =>
                            setFormData((prev: any) => ({
                              ...prev,
                              addFAQ: prev.addFAQ.filter((_: any, i: number) => i !== index),
                            }))
                          }>
                          <FaTimes />
                        </button>
                      </div>
                    </div>
                    <p>{faq.answer}</p>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        </Col>
        <FeatureInput onFeaturesChange={(features) => setFormData((prev: any) => ({ ...prev, features }))} />
        <Col xs={12}>
          <div className="bg-light border rounded p-4">
            <h5 className="mb-0">Quiz</h5>
            <div className="mt-3">
              <span>
                <input
                  className="form-control"
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null
                    setFormData((prev: any) => ({ ...prev, quizFile: file }))
                  }}
                />
              </span>
            </div>
          </div>
        </Col>
        {/*  <Col xs={12}>
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
        </Col> */}
        <div className="d-md-flex justify-content-between align-items-start flex-wrap gap-3 mt-4">
          {/* Previous and Preview Buttons */}
          <div className="d-flex flex-wrap gap-2">
            <button className="btn btn-secondary">Previous</button>
            <button className="btn btn-light">Preview Course</button>
          </div>

          {/* Upload Progress */}
          {uploadProgress > 0 && (
            <div className="flex-grow-1 mx-md-3">
              <label className="form-label">Uploading Video: {uploadProgress}%</label>
              <div className="progress" style={{ height: '8px' }}>
                <div
                  className="progress-bar"
                  role="progressbar"
                  style={{ width: `${uploadProgress}%` }}
                  aria-valuenow={uploadProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </div>
          )}

          {/* Submit Button & Note */}
          <div className="text-md-end">
            <button type="button" className="btn btn-success mb-2" onClick={handleSubmit}>
              Submit a Course
            </button>
            <p className="mb-0 small text-muted">Once you click "Submit a Course", your course will be uploaded and marked as pending for review.</p>
          </div>
        </div>
      </Row>
    </form>
  )
}

export default Step4
