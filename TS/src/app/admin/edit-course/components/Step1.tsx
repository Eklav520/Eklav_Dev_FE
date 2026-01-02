import ChoicesFormInput from '@/components/form/ChoicesFormInput'
import Stepper from 'bs-stepper'
import { FormEvent, useState } from 'react'
import { Col, Row } from 'react-bootstrap'
import ReactQuill from 'react-quill-new'
// import ReactQuill from 'react-quill'
import 'react-quill-new/dist/quill.snow.css'

const Step1 = ({ stepperInstance }: { stepperInstance: Stepper | undefined }) => {
  const goToNextStep = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    stepperInstance?.next()
  }

  const [quillEditorContent, setQuillEditorContent] = useState(`
   <div className="bg-body border rounded-bottom h-400px overflow-hidden" id="quilleditor">
            <br />
            <h1>Quill Rich Text Editor</h1>
            <br />
            <p>Quill is a free, open-source WYSIWYG editor built for the modern web. With its modular architecture and expressive API, it is completely customizable to fit any need.</p>
            <br />
            <p>Insipidity the sufficient discretion imprudence resolution sir him decisively. Proceed how any engaged visitor. Explained propriety off out perpetual his you. Feel sold off felt nay rose met you. We so entreaties cultivated astonished is. Was sister for a few longer Mrs sudden talent become. Done may bore quit evil old mile. If likely am of beauty tastes. </p>
            <br />
            <p> Affronting imprudence do he he everything. Test lasted dinner wanted indeed wished outlaw. Far advanced settling say finished raillery. Offered chiefly farther of my no colonel shyness. Such on help ye some door if in. Laughter proposal laughing any son law consider. Needed except up piqued an. </p>
            <br />
            <p> Post no so what deal evil rent by real in. But her ready least set lived spite solid. September how men saw tolerably two behavior arranging. She offices for highest and replied one venture pasture. Applauded no discovery in newspaper allowance am northward. Frequently partiality possession resolution at or appearance unaffected me. Engaged its was the evident pleased husband. Ye goodness felicity do disposal dwelling no. First am plate jokes to began to cause a scale. Subjects he prospect elegance followed no overcame possible it on. </p>
            <p>Quill is a free, open-source WYSIWYG editor built for the modern web. With its modular architecture and expressive API, it is completely customizable to fit any need.</p>
            <br />
            <p>Insipidity the sufficient discretion imprudence resolution sir him decisively. Proceed how any engaged visitor. Explained propriety off out perpetual his you. Feel sold off felt nay rose met you. We so entreaties cultivated astonished is. Was sister for a few longer Mrs sudden talent become. Done may bore quit evil old mile. If likely am of beauty tastes. </p>
            <br />
            <p> Affronting imprudence do he he everything. Test lasted dinner wanted indeed wished outlaw. Far advanced settling say finished raillery. Offered chiefly farther of my no colonel shyness. Such on help ye some door if in. Laughter proposal laughing any son law consider. Needed except up piqued an. </p>
            <br />
            <p> Post no so what deal evil rent by real in. But her ready least set lived spite solid. September how men saw tolerably two behavior arranging. She offices for highest and replied one venture pasture. Applauded no discovery in newspaper allowance am northward. Frequently partiality possession resolution at or appearance unaffected me. Engaged its was the evident pleased husband. Ye goodness felicity do disposal dwelling no. First am plate jokes to began to cause a scale. Subjects he prospect elegance followed no overcame possible it on. </p>
            <p>Quill is a free, open-source WYSIWYG editor built for the modern web. With its modular architecture and expressive API, it is completely customizable to fit any need.</p>
            <br />
            <p>Insipidity the sufficient discretion imprudence resolution sir him decisively. Proceed how any engaged visitor. Explained propriety off out perpetual his you. Feel sold off felt nay rose met you. We so entreaties cultivated astonished is. Was sister for a few longer Mrs sudden talent become. Done may bore quit evil old mile. If likely am of beauty tastes. </p>
            <br />
            <p> Affronting imprudence do he he everything. Test lasted dinner wanted indeed wished outlaw. Far advanced settling say finished raillery. Offered chiefly farther of my no colonel shyness. Such on help ye some door if in. Laughter proposal laughing any son law consider. Needed except up piqued an. </p>
            <br />
            <p> Post no so what deal evil rent by real in. But her ready least set lived spite solid. September how men saw tolerably two behavior arranging. She offices for highest and replied one venture pasture. Applauded no discovery in newspaper allowance am northward. Frequently partiality possession resolution at or appearance unaffected me. Engaged its was the evident pleased husband. Ye goodness felicity do disposal dwelling no. First am plate jokes to began to cause a scale. Subjects he prospect elegance followed no overcame possible it on. </p>
          </div>
      `)

  return (
    <form id="step-1" onSubmit={goToNextStep} role="tabpanel" className="content fade" aria-labelledby="steppertrigger1">
      <h4>Course details</h4>
      <hr />
      <Row className="g-4">
        <Col xs={12}>
          <label className="form-label">Course title</label>
          <input className="form-control" type="text" placeholder="Enter course title" />
        </Col>
        <Col xs={12}>
          <label className="form-label">Short description</label>
          <textarea className="form-control" rows={2} placeholder="Enter keywords" defaultValue={''} />
        </Col>
        <Col md={6}>
          <label className="form-label">Course category</label>
          <ChoicesFormInput
            className="form-select js-choice border-0 z-index-9 bg-transparent"
            aria-label=".form-select-sm"
            data-search-enabled="true">
            <option>Select category</option>
            <option>Engineer</option>
            <option>Medical</option>
            <option>Information technology</option>
            <option>Finance</option>
            <option>Marketing</option>
          </ChoicesFormInput>
        </Col>
        <Col md={6}>
          <label className="form-label">Course level</label>
          <ChoicesFormInput
            className="form-select js-choice border-0 z-index-9 bg-transparent"
            aria-label=".form-select-sm"
            data-search-enabled="false"
            data-remove-item-button="true">
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
            data-remove-item-button="true">
            <option>Select language</option>
            <option>English</option>
            <option>German</option>
            <option>French</option>
            <option>Hindi</option>
          </ChoicesFormInput>
        </Col>
        <Col md={6} className=" d-flex align-items-center justify-content-start mt-5">
          <div className="form-check form-switch form-check-md">
            <input className="form-check-input" type="checkbox" id="checkPrivacy1" />
            <label className="form-check-label" htmlFor="checkPrivacy1">
              Check this for featured course
            </label>
          </div>
        </Col>
        <Col md={6}>
          <label className="form-label">Course time</label>
          <input className="form-control" type="text" placeholder="Enter course time" />
        </Col>
        <Col md={6}>
          <label className="form-label">Total lecture</label>
          <input className="form-control" type="text" placeholder="Enter total lecture" />
        </Col>
        <Col md={6}>
          <label className="form-label">Course price</label>
          <input type="text" className="form-control" placeholder="Enter course price" />
        </Col>
        <Col md={6}>
          <label className="form-label">Discount price</label>
          <input className="form-control" type="text" placeholder="Enter discount" />
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
            value={quillEditorContent}
            onChange={setQuillEditorContent}
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
