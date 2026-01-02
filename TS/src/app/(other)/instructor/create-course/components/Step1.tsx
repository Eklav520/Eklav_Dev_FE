import ChoicesFormInput from '@/components/form/ChoicesFormInput'
import Stepper from 'bs-stepper'
import { FormEvent, useState } from 'react'
import { Col, Row } from 'react-bootstrap'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'

const Step1 = ({
  stepperInstance,
  formData,
  setFormData
}: {
  stepperInstance: Stepper | undefined
  formData: any
  setFormData: React.Dispatch<React.SetStateAction<any>>
}) => {
  const goToNextStep = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    stepperInstance?.next()
  }


  return (
    <form id="step-1" onSubmit={goToNextStep} role="tabpanel" className="content fade" aria-labelledby="steppertrigger1">
      <h4>Course details</h4>
      <hr />
      <Row className="g-4">
        <Col xs={12}>
          <label className="form-label">Course title</label>
          <input
            className="form-control"
            type="text"
            placeholder="Enter course title"
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </Col>
        <Col xs={12}>
          <label className="form-label">Short description</label>
          <textarea
            className="form-control"
            rows={2}
            placeholder="Enter keywords"
            defaultValue={''}
            onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
          />
        </Col>
        <Col md={6}>
          <label className="form-label">Course category</label>
          <ChoicesFormInput
            className="form-select js-choice border-0 z-index-9 bg-transparent"
            aria-label=".form-select-sm"
            data-search-enabled="true"
            onChange={(selected: string) => setFormData((prev: any) => ({ ...prev, category: selected }))}>
            <option>Select category</option>
            {/* <option>Engineer</option>
            <option>Medical</option> */}
            <option>Information technology</option>
           {/*  <option>Finance</option>
            <option>Marketing</option> */}
          </ChoicesFormInput>
        </Col>
        <Col md={6}>
          <label className="form-label">Course level</label>
          <ChoicesFormInput
            className="form-select js-choice border-0 z-index-9 bg-transparent"
            aria-label=".form-select-sm"
            data-search-enabled="false"
            data-remove-item-button="true"
            onChange={(selected: string) => setFormData((prev: any) => ({ ...prev, level: selected }))}>
            <option>Select course level</option>
            <option>All level</option>
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advance</option>
          </ChoicesFormInput>
        </Col>
        <Col md={6}>
          <label className="form-label">Language</label>
          <ChoicesFormInput
            className="form-select js-choice border-0 z-index-9 bg-transparent"
            aria-label=".form-select-sm"
            data-max-item-count={3}
            data-remove-item-button="true"
            onChange={(selected: string) => setFormData((prev: any) => ({ ...prev, language: selected }))}>
            <option>Select language</option>
            <option>English</option>
            <option>German</option>
            <option>French</option>
            <option>Hindi</option>
          </ChoicesFormInput>
        </Col>
        <Col md={6} className=" d-flex align-items-center justify-content-start mt-5">
          <div className="form-check form-switch form-check-md">
            <input className="form-check-input" type="checkbox" id="checkPrivacy1" onChange={(e) => setFormData({ ...formData, isFeatured: e.target.value })}/>
            <label className="form-check-label" htmlFor="checkPrivacy1">
              Check this for featured course
            </label>
          </div>
        </Col>
        <Col md={6}>
          <label className="form-label">Course time</label>
          <input className="form-control" type="text" placeholder="Enter course time" onChange={(e) => setFormData({ ...formData, duration: e.target.value })}/>
        </Col>
        <Col md={6}>
          <label className="form-label">Total lecture</label>
          <input className="form-control" type="text" placeholder="Enter total lecture" onChange={(e) => setFormData({ ...formData, totalLectures: e.target.value })}/>
        </Col>
        <Col md={6}>
          <label className="form-label">Course price</label>
          <input type="text" className="form-control" placeholder="Enter course price" onChange={(e) => setFormData({ ...formData, price: e.target.value })}/>
        </Col>
        <Col md={6}>
          <label className="form-label">Discount price</label>
          <input className="form-control" type="text" placeholder="Enter discount" onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}/>
          <Col xs={12} className=" mt-1 mb-0">
            <div className="form-check small mb-0">
              <input className="form-check-input" type="checkbox" id="checkBox1" />
              <label className="form-check-label" htmlFor="checkBox1">
                Enable this Discount
              </label>
            </div>
          </Col>
        </Col>
        <Col xs={12}>
          <label className="form-label">Add description</label>
          <ReactQuill
            className="pb-2 pb-sm-0"
            theme="snow"
            style={{ height: 400 }}
            value={formData.description}
            onChange={(value) => setFormData({ ...formData, description: value })}
            id="quilltoolbar"
          />
        </Col>
        <div className="d-flex justify-content-end mt-5">
          <button className="btn btn-primary next-btn mb-0">Next</button>
        </div>
      </Row>
    </form>
  )
}

export default Step1
