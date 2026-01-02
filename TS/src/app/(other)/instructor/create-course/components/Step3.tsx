import Stepper from 'bs-stepper'
import { FormEvent } from 'react'
import { Accordion, AccordionBody, AccordionHeader, AccordionItem, Button, Row } from 'react-bootstrap'
import { FaEdit, FaPlay, FaTimes } from 'react-icons/fa'
import AddLecture from './AddLecture'
import AddTopic from './AddTopic'

const Step3 = ({ stepperInstance }: { stepperInstance: Stepper | undefined }) => {
  const goToNextStep = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    stepperInstance?.next()
  }

  return (
    <form id="step-3" role="tabpanel" onSubmit={goToNextStep} className="content fade" aria-labelledby="steppertrigger3">
      <h4>Curriculum</h4>
      <hr />
      <Row className="">
        <div className="d-sm-flex justify-content-sm-between align-items-center mb-3">
          <h5 className="mb-2 mb-sm-0">Upload Lecture</h5>
          <AddLecture />
        </div>
        <Accordion className="accordion-icon accordion-bg-light" id="accordionExample2">
          <AccordionItem eventKey="1" className="mb-3">
            <AccordionHeader as={'h6'} className="font-base" id="heading-1">
              <div className="fw-bold">Introduction of Digital Marketing</div>
            </AccordionHeader>
            <AccordionBody className="mt-3">
              <div className="d-flex justify-content-between align-items-center">
                <div className="position-relative">
                  <Button variant="danger-soft" size="sm" className="btn-round mb-0 stretched-link position-static">
                    <FaPlay />
                  </Button>
                  <span className="ms-2 mb-0 h6 fw-light">Introduction</span>
                </div>
                <div>
                  <Button variant="success-soft" size="sm" className="btn-round me-1 mb-1 mb-md-0">
                    <FaEdit />
                  </Button>
                  <button className="btn btn-sm btn-danger-soft btn-round mb-0">
                    <FaTimes />
                  </button>
                </div>
              </div>
              <hr />
              <div className="d-flex justify-content-between align-items-center">
                <div className="position-relative">
                  <Button variant="danger-soft" size="sm" className="btn-round mb-0 stretched-link position-static">
                    <FaPlay />
                  </Button>
                  <span className="ms-2 mb-0 h6 fw-light">What is Digital Marketing</span>
                </div>
                <div>
                  <Button variant="success-soft" size="sm" className="btn-round me-1 mb-1 mb-md-0">
                    <FaEdit />
                  </Button>
                  <button className="btn btn-sm btn-danger-soft btn-round mb-0">
                    <FaTimes />
                  </button>
                </div>
              </div>
              <hr />
              <AddTopic />
            </AccordionBody>
          </AccordionItem>
          <AccordionItem eventKey="2" className="mb-3">
            <AccordionHeader as={'h6'} className="font-base" id="heading-2">
              <div
                className="fw-bold rounded d-inline-block collapsed d-block pe-5"
                data-bs-toggle="collapse"
                data-bs-target="#collapse-2"
                aria-expanded="false"
                aria-controls="collapse-2">
                Customer Life cycle
              </div>
            </AccordionHeader>
            <AccordionBody className="mt-3">
              <AddTopic />
            </AccordionBody>
          </AccordionItem>
          <AccordionItem eventKey="3" className="mb-3">
            <AccordionHeader as={'h6'} className="font-base" id="heading-3">
              <div className="fw-bold collapsed rounded d-block pe-5">How much should I offer the sellers?</div>
            </AccordionHeader>
            <AccordionBody className="mt-3">
              <AddTopic />
            </AccordionBody>
          </AccordionItem>
        </Accordion>
        <div className="d-flex justify-content-between">
          <button className="btn btn-secondary prev-btn mb-0">Previous</button>
          <button className="btn btn-primary next-btn mb-0">Next</button>
        </div>
      </Row>
    </form>
  )
}

export default Step3
