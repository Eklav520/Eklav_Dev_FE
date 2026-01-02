import visaImg from '@/assets/images/client/visa.svg'
import ChoicesFormInput from '@/components/form/ChoicesFormInput'
import { Accordion, AccordionBody, AccordionHeader, AccordionItem, Button, Card, CardBody, CardHeader, Col } from 'react-bootstrap'

const PaymentMethods = () => {
  return (
    <Card className="bg-transparent border rounded-3 mb-4 z-index-9">
      <CardHeader className="bg-transparent d-sm-flex justify-content-sm-between align-items-center border-bottom">
        <h3 className="mb-2 mb-sm-0">Payment methods</h3>
        <Button variant="primary-soft" size="sm" className=" mb-0" data-bs-toggle="modal" data-bs-target="#addNewcard">
          Add new card
        </Button>
      </CardHeader>
      <CardBody>
        <Accordion className="accordion-circle" id="accordioncircle">
          <AccordionItem eventKey="1" className="mb-3">
            <AccordionHeader as="h6" className="font-base" id="heading-1">
              <div
                className="bg-white rounded collapsed"
                data-bs-toggle="collapse"
                data-bs-target="#collapse-1"
                aria-expanded="true"
                aria-controls="collapse-1">
                Credit or Debit Card
              </div>
            </AccordionHeader>
            <AccordionBody className="accordion-body">
              <form className="row text-start g-3">
                <Col xs={12}>
                  <label className="form-label">
                    Card Number <span className="text-danger">*</span>
                  </label>
                  <div className="position-relative">
                    <input type="text" className="form-control" placeholder="xxxx xxxx xxxx xxxx" />
                    <img src={visaImg} className="w-40px position-absolute top-50 end-0 translate-middle-y me-2 d-none d-sm-block" alt="visaImg" />
                  </div>
                </Col>
                <Col md={6}>
                  <label className="form-label">
                    Expiration date <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <input type="text" className="form-control" maxLength={2} placeholder="Month" />
                    <input type="text" className="form-control" maxLength={4} placeholder="Year" />
                  </div>
                </Col>
                <Col md={6}>
                  <label className="form-label">
                    CVV / CVC <span className="text-danger">*</span>
                  </label>
                  <input type="text" className="form-control" maxLength={3} placeholder="xxx" />
                </Col>
                <Col xs={12}>
                  <label className="form-label">
                    Name on Card <span className="text-danger">*</span>
                  </label>
                  <input type="text" className="form-control" aria-label="name of card holder" placeholder="Enter name" />
                </Col>
              </form>
            </AccordionBody>
          </AccordionItem>
          <AccordionItem eventKey="2" className="mb-3">
            <AccordionHeader as="h6" className="accordion-header font-base" id="heading-2">
              <div
                className="collapsed bg-white rounded"
                data-bs-toggle="collapse"
                data-bs-target="#collapse-2"
                aria-expanded="false"
                aria-controls="collapse-2">
                Pay with Net Banking
              </div>
            </AccordionHeader>
            <AccordionBody className="accordion-body">
              <form className="row text-start g-3">
                <p className="mb-1">In order to complete your transaction, we will transfer you over to Eklav secure servers.</p>
                <p className="my-0">Select your bank from the drop-down list and click proceed to continue with your payment.</p>
                <Col md={6}>
                  <ChoicesFormInput className="form-select form-select-sm js-choice border-0" aria-label=".form-select-sm">
                    <option>Please choose one</option>
                    <option>Bank of America</option>
                    <option>Bank of India</option>
                    <option>Bank of London</option>
                  </ChoicesFormInput>
                </Col>
              </form>
            </AccordionBody>
          </AccordionItem>
        </Accordion>
      </CardBody>
    </Card>
  )
}

export default PaymentMethods
