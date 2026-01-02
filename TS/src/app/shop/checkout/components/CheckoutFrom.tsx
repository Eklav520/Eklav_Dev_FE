import aeCardImg from '@/assets/images/client/ae-card.svg'
import mastercardImg from '@/assets/images/client/mastercard.svg'
import visaCardImg from '@/assets/images/client/visa.svg'
import ChoicesFormInput from '@/components/form/ChoicesFormInput'
import TextFormInput from '@/components/form/TextFormInput'
import { getAllCourses } from '@/helpers/data'
import { useFetchData } from '@/hooks/useFetchData'
import { CourseType } from '@/types/other'
import { yupResolver } from '@hookform/resolvers/yup'
import {
  Accordion,
  AccordionBody,
  AccordionHeader,
  AccordionItem,
  Alert,
  Button,
  Card,
  CardBody,
  CardTitle,
  Col,
  Container,
  Row,
} from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import { BsExclamationOctagonFill, BsPencilSquare, BsTrash } from 'react-icons/bs'
import * as yup from 'yup'

//CourseType

const CheckoutProductCard = ({ image, title, price }: CourseType) => {
  return (
    <>
      <Row className="g-3">
        <Col sm={4}>
          <img className="rounded" src={image} alt="courses" />
        </Col>
        <Col sm={8}>
          <h6 className="mb-0">
            <a href="#">{title}</a>
          </h6>
          <div className="d-flex justify-content-between align-items-center mt-3">
            <span className="text-success">${price}</span>
            <div className="text-primary-hover">
              <a href="#" className="text-body me-2">
                <BsTrash className="me-1" />
                Remove
              </a>
              <a href="#" className="text-body me-2">
                <BsPencilSquare className="me-1" />
                Edit
              </a>
            </div>
          </div>
        </Col>
      </Row>
      <hr />
    </>
  )
}

const CheckoutFrom = () => {
  const editEmailFormSchema = yup.object({
    name: yup.string().required('Please enter your name'),
    email: yup.string().email('Please enter valid email').required('Please enter your Email'),
    phoneNo: yup.number().required('Please enter your phone number'),
    postalCode: yup.string().required('Please enter your postal code'),
    address: yup.string().required('Please enter your address'),
  })
  const { control, handleSubmit } = useForm({
    resolver: yupResolver(editEmailFormSchema),
  })

  const cartData = useFetchData(getAllCourses)

  return (
    <section className="pt-5">
      <Container>
        <Row className="g-4 g-sm-5">
          <Col xl={8} className="mb-4 mb-sm-0">
            <Alert variant="danger" className="d-flex justify-content-between align-items-center fade show py-3 pe-2" role="alert" dismissible>
              <div className="icon-center">
                <BsExclamationOctagonFill className="me-2" />
                Already have an account?
                <a href="#" className="text-reset btn-link mb-0 fw-bold">
                  Log in
                </a>
              </div>
            </Alert>
            <Card className="card-body shadow p-4">
              <h5 className="mb-0">Personal Details</h5>
              <form className="row g-3 mt-0" onSubmit={handleSubmit(() => {})}>
                <TextFormInput name="name" placeholder="Name" containerClassName="col-md-6 bg-light-input" label="Your name *" control={control} />
                <TextFormInput
                  name="email"
                  placeholder="Email"
                  containerClassName="col-md-6 bg-light-input"
                  label="Email address *"
                  control={control}
                />
                <TextFormInput
                  name="phoneNo"
                  placeholder="Mobile number"
                  containerClassName="col-md-6 bg-light-input"
                  label="Mobile number *"
                  control={control}
                />
                <Col md={6} className="bg-light-input">
                  <label htmlFor="mobileNumber" className="form-label">
                    Select country *
                  </label>
                  <ChoicesFormInput className="form-select js-choice" aria-label=".form-select-lg">
                    <option>Select country</option>
                    <option>India</option>
                    <option>China</option>
                    <option>USA</option>
                    <option>Canada</option>
                    <option>Paris</option>
                    <option>Australia</option>
                    <option>Japan</option>
                    <option>Brazil</option>
                  </ChoicesFormInput>
                </Col>
                <Col md={6} className="bg-light-input">
                  <label htmlFor="mobileNumber" className="form-label">
                    Select state *
                  </label>
                  <ChoicesFormInput className="form-select js-choice" aria-label=".form-select-lg">
                    <option>Select state</option>
                    <option>Maharashtra</option>
                    <option>Delhi</option>
                    <option>Punjab</option>
                    <option>London</option>
                    <option>New york</option>
                    <option>California</option>
                  </ChoicesFormInput>
                </Col>
                <TextFormInput
                  name="postalCode"
                  placeholder="PIN code"
                  containerClassName="col-md-6 bg-light-input"
                  label="Postal code *"
                  control={control}
                />
                <TextFormInput
                  name="address"
                  placeholder="Address"
                  containerClassName="col-md-6 bg-light-input"
                  label="Address *"
                  control={control}
                />
                <Col xs={12}>
                  <label className="form-label">Your saved cards *</label>
                  <Row className="g-2">
                    <Col xs={2} sm={1} className="border rounded me-2">
                      <a href="#">
                        <img src={mastercardImg} alt="mastercard" />
                      </a>
                    </Col>
                    <Col xs={2} sm={1} className="border rounded me-2">
                      <a href="#">
                        <img src={visaCardImg} alt="visa" />
                      </a>
                    </Col>
                    <Col xs={2} sm={1} className="border rounded me-2">
                      <a href="#">
                        <img src={aeCardImg} alt="aeCardImg" />
                      </a>
                    </Col>
                  </Row>
                </Col>
                <Col xs={12} className="text-end">
                  <button type="submit" className="btn btn-primary mb-0">
                    Save changes
                  </button>
                </Col>
              </form>
              <Row className="g-3 mt-4">
                <h5>Payment method</h5>
                <Col xs={12}>
                  <Accordion className="accordion-circle" id="accordioncircle">
                    <AccordionItem eventKey="1" className="mb-3">
                      <AccordionHeader as={'h6'} id="heading-1">
                        <div>Credit or Debit Card</div>
                      </AccordionHeader>
                      <AccordionBody>
                        <form className="row g-3">
                          <Col xs={12} className="">
                            <label className="form-label">
                              Card Number <span className="text-danger">*</span>
                            </label>
                            <div className="position-relative">
                              <input type="text" className="form-control" placeholder="xxxx xxxx xxxx xxxx" />
                              <img
                                src={visaCardImg}
                                className="w-40px position-absolute top-50 end-0 translate-middle-y me-2 d-none d-sm-block"
                                alt="visa"
                              />
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
                            <input type="text" className="form-control" aria-label="name of card holder" placeholder="Enter card holder name" />
                          </Col>
                        </form>
                      </AccordionBody>
                    </AccordionItem>
                    <AccordionItem eventKey="2" className=" mb-3">
                      <AccordionHeader as={'h6'} id="heading-2">
                        <div>Pay with Net Banking</div>
                      </AccordionHeader>
                      <AccordionBody>
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
                </Col>
              </Row>
            </Card>
          </Col>
          <Col xl={4}>
            <Row className="mb-0">
              <Col md={6} xl={12}>
                <Card className="card-body shadow p-4 mb-4">
                  <h4 className="mb-4">Order Summary</h4>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <span>Transaction code</span>
                      <p className="mb-0 h6 fw-light">AB12365E</p>
                    </div>
                    <div className="input-group mt-2">
                      <input className="form-control form-control" placeholder="COUPON CODE" />
                      <button type="button" className="btn btn-primary">
                        Apply
                      </button>
                    </div>
                  </div>
                  <hr />
                  {cartData?.slice(0, 2).map((item, idx) => <CheckoutProductCard key={idx} {...item} />)}
                  <ul className="list-group list-group-borderless mb-2">
                    <li className="list-group-item px-0 d-flex justify-content-between">
                      <span className="h6 fw-light mb-0">Original Price</span>
                      <span className="h6 fw-light mb-0 fw-bold">$500</span>
                    </li>
                    <li className="list-group-item px-0 d-flex justify-content-between">
                      <span className="h6 fw-light mb-0">Coupon Discount</span>
                      <span className="text-danger">-$20</span>
                    </li>
                    <li className="list-group-item px-0 d-flex justify-content-between">
                      <span className="h5 mb-0">Total</span>
                      <span className="h5 mb-0">$480</span>
                    </li>
                  </ul>
                  <div className="d-grid">
                    <Button variant="success" size="lg">
                      Place Order
                    </Button>
                  </div>
                  <p className="small mb-0 mt-2 text-center">
                    By completing your purchase, you agree to these
                    <a href="#">
                      <strong>Terms of Service</strong>
                    </a>
                  </p>
                </Card>
              </Col>
              <Col md={6} xl={12}>
                <Card
                  className="bg-blue p-3 position-relative overflow-hidden"
                  style={{ background: 'url(assets/images/pattern/05.png) no-repeat center center', backgroundSize: 'cover' }}>
                  <figure className="position-absolute bottom-0 end-0 mb-n4 d-none d-md-block">
                    <svg width="92.6px" height="135.2px">
                      <path
                        className="fill-white"
                        d="M71.5,131.4c0.2,0.1,0.4,0.1,0.6-0.1c0,0,0.6-0.7,1.6-1.9c0.2-0.2,0.1-0.5-0.1-0.7c-0.2-0.2-0.5-0.1-0.7,0.1 c-1,1.2-1.6,1.8-1.6,1.8c-0.2,0.2-0.2,0.5,0,0.7C71.4,131.3,71.4,131.4,71.5,131.4z"
                      />
                      <path
                        className="fill-white"
                        d="M76,125.5c-0.2-0.2-0.3-0.5-0.1-0.7c1-1.4,1.9-2.8,2.8-4.2c0.1-0.2,0.4-0.3,0.7-0.2c0.2,0.1,0.3,0.4,0.2,0.7 c-0.9,1.4-1.8,2.9-2.8,4.2C76.6,125.6,76.3,125.6,76,125.5C76.1,125.5,76.1,125.5,76,125.5z M81.4,116.9 c-0.2-0.1-0.3-0.4-0.2-0.7c0.2-0.5,0.5-0.9,0.7-1.4c0.5-1.1,1-2.1,1.5-3.2c0.1-0.3,0.4-0.4,0.6-0.3c0.3,0.1,0.4,0.4,0.3,0.6 c-0.5,1.1-1,2.1-1.5,3.2c-0.2,0.5-0.5,0.9-0.7,1.4C81.9,117,81.6,117,81.4,116.9C81.4,116.9,81.4,116.9,81.4,116.9z M85.1,107.1 c0.5-1.6,1-3.2,1.3-4.8c0.1-0.3,0.3-0.4,0.6-0.4c0.3,0.1,0.4,0.3,0.4,0.6c-0.4,1.6-0.8,3.3-1.3,4.9c-0.1,0.3-0.4,0.4-0.6,0.3 c0,0,0,0-0.1,0C85.1,107.6,85,107.3,85.1,107.1z M47.3,83c-1.5-1.1-2.5-2.5-3.1-4.2c-0.1-0.3,0-0.5,0.3-0.6 c0.3-0.1,0.5,0,0.6,0.3c0.5,1.5,1.5,2.7,2.8,3.7c0.2,0.2,0.3,0.5,0.1,0.7C47.9,83.1,47.6,83.1,47.3,83C47.4,83,47.4,83,47.3,83z  M51.7,84.6c0-0.3,0.3-0.5,0.5-0.4c1.4,0.2,2.9-0.3,4.3-1.4c0.2-0.2,0.5-0.1,0.7,0.1c0.2,0.2,0.1,0.5-0.1,0.7 c-1.6,1.2-3.4,1.8-5,1.6c-0.1,0-0.1,0-0.2,0C51.8,85,51.7,84.8,51.7,84.6z M87.2,97.4c0.2-1.7,0.2-3.3,0.2-5 c0-0.3,0.2-0.5,0.5-0.5c0.3,0,0.5,0.2,0.5,0.5c0.1,1.7,0,3.4-0.2,5.1c0,0.3-0.3,0.5-0.5,0.4c-0.1,0-0.1,0-0.2,0 C87.3,97.8,87.1,97.6,87.2,97.4z M43.7,73.6c0.2-1.6,0.7-3.2,1.5-4.8l0.1-0.1c0.1-0.2,0.4-0.3,0.7-0.2c0,0,0,0,0,0 c0.2,0.1,0.3,0.4,0.2,0.7l-0.1,0.1c-0.7,1.5-1.2,3-1.4,4.5c0,0.3-0.3,0.5-0.6,0.4c-0.1,0-0.1,0-0.2,0 C43.8,74,43.7,73.8,43.7,73.6z M60,79.8c-0.2-0.1-0.3-0.5-0.1-0.7c0.4-0.6,0.8-1.3,1.1-2c0.4-0.8,0.7-1.6,1-2.4 c0.1-0.3,0.4-0.4,0.6-0.3c0.3,0.1,0.4,0.4,0.3,0.6c-0.3,0.9-0.7,1.7-1.1,2.5c-0.4,0.7-0.8,1.4-1.2,2.1C60.5,79.9,60.2,80,60,79.8 C60,79.9,60,79.8,60,79.8z M86.8,87.5c-0.3-1.6-0.7-3.2-1.2-4.8c-0.1-0.3,0.1-0.5,0.3-0.6c0.3-0.1,0.5,0.1,0.6,0.3 c0.5,1.6,1,3.3,1.2,4.9c0,0.3-0.1,0.5-0.4,0.6c-0.1,0-0.2,0-0.3,0C87,87.7,86.9,87.6,86.8,87.5z M48.2,65.1 c-0.2-0.2-0.2-0.5,0-0.7c1.2-1.3,2.5-2.4,3.9-3.4c0.2-0.1,0.5-0.1,0.7,0.1c0.1,0.2,0.1,0.5-0.1,0.7c-1.4,0.9-2.6,2-3.7,3.2 c-0.2,0.2-0.4,0.2-0.6,0.1C48.3,65.2,48.3,65.1,48.2,65.1z M63.3,70c0.3-1.6,0.5-3.3,0.5-4.9c0-0.3,0.2-0.5,0.5-0.5 c0.3,0,0.5,0.2,0.5,0.5c-0.1,1.7-0.2,3.4-0.5,5.1c0,0.3-0.3,0.4-0.6,0.4c0,0-0.1,0-0.1,0C63.3,70.4,63.2,70.2,63.3,70z M83.8,78 c-0.7-1.5-1.5-3-2.4-4.3c-0.1-0.2-0.1-0.5,0.1-0.7c0.2-0.1,0.5-0.1,0.7,0.2c0.9,1.4,1.7,2.9,2.5,4.4c0.1,0.2,0,0.5-0.2,0.7 c-0.1,0.1-0.3,0.1-0.4,0C83.9,78.2,83.8,78.1,83.8,78z M56.5,59.6c-0.1-0.3,0.1-0.5,0.4-0.6c1.7-0.4,3.4-0.5,5.2-0.3 c0.3,0,0.5,0.3,0.4,0.5c0,0.3-0.3,0.5-0.5,0.4c-1.7-0.2-3.3-0.1-4.8,0.3c-0.1,0-0.2,0-0.3,0C56.6,59.8,56.5,59.7,56.5,59.6z  M78.4,69.7c-1.1-1.3-2.2-2.5-3.4-3.6c-0.2-0.2-0.2-0.5,0-0.7c0.2-0.2,0.5-0.2,0.7,0c1.2,1.1,2.4,2.4,3.5,3.7 c0.2,0.2,0.1,0.5-0.1,0.7c-0.2,0.1-0.4,0.1-0.5,0.1C78.5,69.8,78.4,69.7,78.4,69.7z M63.6,60.1c-0.2-1.6-0.4-3.3-0.8-4.9 c-0.1-0.3,0.1-0.5,0.4-0.6c0.3-0.1,0.5,0.1,0.6,0.4c0.4,1.7,0.7,3.4,0.8,5c0,0.3-0.2,0.5-0.4,0.5c-0.1,0-0.2,0-0.3,0 C63.7,60.4,63.6,60.2,63.6,60.1z M71,63.1c-1.4-0.9-2.9-1.7-4.4-2.3c-0.3-0.1-0.4-0.4-0.3-0.6c0.1-0.3,0.4-0.4,0.6-0.3 c1.5,0.6,3.1,1.4,4.6,2.3c0.2,0.1,0.3,0.5,0.1,0.7C71.6,63.1,71.3,63.2,71,63.1C71.1,63.1,71.1,63.1,71,63.1z M61.3,50.4 c-0.6-1.5-1.3-3-2.1-4.5c-0.1-0.2-0.1-0.5,0.2-0.7c0.2-0.1,0.5-0.1,0.7,0.2c0.9,1.5,1.6,3.1,2.2,4.6c0.1,0.3,0,0.5-0.3,0.6 c-0.1,0.1-0.3,0-0.4,0C61.5,50.6,61.4,50.5,61.3,50.4z M56.5,41.8c-1-1.3-2.1-2.6-3.2-3.8c-0.2-0.2-0.2-0.5,0-0.7 c0.2-0.2,0.5-0.2,0.7,0c1.2,1.3,2.3,2.6,3.3,3.9c0.2,0.2,0.1,0.5-0.1,0.7c-0.2,0.1-0.4,0.1-0.5,0C56.6,41.9,56.5,41.8,56.5,41.8z  M49.7,34.5c-1.2-1.1-2.5-2.1-3.9-3.2c-0.2-0.2-0.3-0.5-0.1-0.7c0.2-0.2,0.5-0.3,0.7-0.1c1.4,1,2.7,2.1,3.9,3.2 c0.2,0.2,0.2,0.5,0,0.7c-0.2,0.2-0.4,0.2-0.6,0.1C49.7,34.6,49.7,34.5,49.7,34.5z M41.7,28.5c-1.4-0.9-2.8-1.8-4.3-2.6 c-0.2-0.1-0.3-0.4-0.2-0.7c0.1-0.2,0.4-0.3,0.7-0.2c1.5,0.8,2.9,1.7,4.3,2.6c0.2,0.1,0.3,0.5,0.1,0.7 C42.2,28.6,42,28.6,41.7,28.5C41.7,28.5,41.7,28.5,41.7,28.5z"
                      />
                      <path
                        className="fill-white"
                        d="M30.7,22.6C30.7,22.6,30.7,22.6,30.7,22.6c0,0,0.9,0.4,2.3,1c0.2,0.1,0.5,0,0.7-0.2c0.1-0.2,0-0.5-0.2-0.7 c0,0,0,0,0,0c-1.4-0.7-2.2-1-2.3-1c-0.3-0.1-0.5,0-0.6,0.3C30.3,22.2,30.4,22.5,30.7,22.6z"
                      />
                      <path
                        className="fill-warning"
                        d="M22.6,23.6l-1.1-4.1c0,0-11.7-7.5-11.9-7.6c-0.1-0.2-4.9-6.5-4.9-6.5l8.2,3.5l12.2,8.4L22.6,23.6z"
                      />
                      <polygon className="fill-warning opacity-6" points="31.2,12.3 4.7,5.4 25.1,17.2" />
                      <polygon className="fill-warning opacity-6" points="21.5,19.5 15,24.8 4.7,5.4 " />
                    </svg>
                  </figure>
                  <CardBody>
                    <CardTitle className="text-white mb-2">Access 25K Online courses from 120 institutions, Start today!</CardTitle>
                    <p className="text-white text-opacity-75">
                      Here is the description of premium features which will allow users to get benefits and save a lot of money
                    </p>
                    <Button variant="warning" size="sm" className="mb-0">
                      Purchase Premium
                    </Button>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>
    </section>
  )
}

export default CheckoutFrom
