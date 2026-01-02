import ChoicesFormInput from '@/components/form/ChoicesFormInput'
import TextAreaFormInput from '@/components/form/TextAreaFormInput'
import TextFormInput from '@/components/form/TextFormInput'
import { yupResolver } from '@hookform/resolvers/yup'
import { Col, Container, Row } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'

const AdmissionFrom = () => {
  const admissionFormSchema = yup.object({
    fName: yup.string().required('Please enter your first fast name'),
    mName: yup.string().required('Please enter your first middle name'),
    lName: yup.string().required('Please enter your first last name'),
    email: yup.string().email('Please enter valid email').required('Please enter your email'),
    email2: yup.string().email('Please enter valid email').required('Please enter your email'),
    phoneNo: yup.number().required('Please enter your phone number'),
    phoneNo2: yup.number().required('Please enter your phone number'),
    phoneNoF: yup.number().required('Please enter your phone number'),
    address: yup.string().required('Please enter your address'),
    address2: yup.string().required('Please enter your address'),
    zipCode: yup.string().required('Please enter your zipCode'),
    fullName: yup.string().required('Please enter your fullName'),
    relation: yup.string().required('Please enter your relation'),
    jobTitle: yup.string().required('Please enter your jobTitle'),
    collegeName: yup.string().required('Please enter your collegeName'),
    board: yup.string().required('Please enter your board'),
    collegeAddress: yup.string().required('Please enter your collegeAddress'),
  })
  const { control, handleSubmit } = useForm({
    resolver: yupResolver(admissionFormSchema),
  })

  return (
    <section>
      <Container>
        <Row className=" g-5 justify-content-between">
          <Col md={8} className="mx-auto">
            <h2 className="mb-3">Apply for Admission</h2>
            <p>
              You can apply online by filling up below form or <a href="#">Download a pdf</a> and submit. Any question related admission process,
              please contact our admission office at <a href="#">+123 456 789</a> or <a href="#">example@email.com</a>.
            </p>
            <p className="mb-1">Before you proceed with the form please read below topics:</p>
            <ul className="ps-3">
              <li>Application fee is $49</li>
              <li>Fees are non-refundable</li>
              <li>
                Field required with <span className="text-danger">*</span> are required to complete the admission form
              </li>
            </ul>
            <form className="row g-3" onSubmit={handleSubmit(() => {})}>
              <h5 className="mb-0">Personal information</h5>
              <Col xs={12}>
                <Row className=" g-xl-0 align-items-center">
                  <Col lg={4}>
                    <h6 className="mb-lg-0">
                      Student first name <span className="text-danger">*</span>
                    </h6>
                  </Col>
                  <TextFormInput name="fName" control={control} containerClassName="col-lg-8" />
                </Row>
              </Col>
              <Col xs={12}>
                <Row className=" g-xl-0 align-items-center">
                  <Col lg={4}>
                    <h6 className="mb-lg-0">
                      Student middle name <span className="text-danger">*</span>
                    </h6>
                  </Col>
                  <TextFormInput name="mName" control={control} containerClassName="col-lg-8" />
                </Row>
              </Col>
              <Col xs={12}>
                <Row className=" g-xl-0 align-items-center">
                  <Col lg={4}>
                    <h6 className="mb-lg-0">
                      Student last name <span className="text-danger">*</span>
                    </h6>
                  </Col>
                  <TextFormInput name="lName" control={control} containerClassName="col-lg-8" />
                </Row>
              </Col>
              <Col xs={12}>
                <Row className=" g-xl-0 align-items-center">
                  <Col lg={4}>
                    <h6 className="mb-lg-0">
                      Gender <span className="text-danger">*</span>
                    </h6>
                  </Col>
                  <Col lg={8}>
                    <div className="d-flex">
                      <div className="form-check radio-bg-light me-4">
                        <input className="form-check-input" type="radio" name="flexRadioDefault" id="flexRadioDefault1" defaultChecked />
                        <label className="form-check-label" htmlFor="flexRadioDefault1">
                          Male
                        </label>
                      </div>
                      <div className="form-check radio-bg-light">
                        <input className="form-check-input" type="radio" name="flexRadioDefault" id="flexRadioDefault2" />
                        <label className="form-check-label" htmlFor="flexRadioDefault2">
                          Female
                        </label>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Col>
              <Col xs={12}>
                <Row className="g-xl-0 align-items-center">
                  <Col lg={4}>
                    <h6 className="mb-lg-0">Date of birth</h6>
                  </Col>
                  <Col lg={8}>
                    <Row className="g-2 g-sm-4">
                      <Col xs={4}>
                        <ChoicesFormInput className="form-select js-choice z-index-9 border-0 bg-light" aria-label=".form-select-sm">
                          <option>Date</option>
                          <option>1</option>
                          <option>2</option>
                          <option>3</option>
                          <option>4</option>
                          <option>5</option>
                          <option>6</option>
                          <option>7</option>
                          <option>8</option>
                          <option>9</option>
                          <option>10</option>
                          <option>11</option>
                          <option>12</option>
                          <option>13</option>
                          <option>14</option>
                          <option>15</option>
                          <option>16</option>
                          <option>17</option>
                          <option>18</option>
                          <option>19</option>
                          <option>20</option>
                          <option>21</option>
                          <option>22</option>
                          <option>23</option>
                          <option>24</option>
                          <option>25</option>
                          <option>26</option>
                          <option>27</option>
                          <option>28</option>
                          <option>29</option>
                          <option>30</option>
                          <option>31</option>
                        </ChoicesFormInput>
                      </Col>
                      <Col xs={4}>
                        <ChoicesFormInput className="form-select js-choice z-index-9 border-0 bg-light" aria-label=".form-select-sm">
                          <option>Month</option>
                          <option>Jan</option>
                          <option>Feb</option>
                          <option>Mar</option>
                          <option>Apr</option>
                          <option>Jun</option>
                          <option>Jul</option>
                          <option>Aug</option>
                          <option>Sep</option>
                          <option>Oct</option>
                          <option>Nov</option>
                          <option>Dec</option>
                        </ChoicesFormInput>
                      </Col>
                      <Col xs={4}>
                        <ChoicesFormInput className="form-select js-choice z-index-9 border-0 bg-light" aria-label=".form-select-sm">
                          <option>Year</option>
                          <option>1990</option>
                          <option>1991</option>
                          <option>1992</option>
                          <option>1993</option>
                          <option>1994</option>
                          <option>1995</option>
                          <option>1996</option>
                          <option>1997</option>
                          <option>1998</option>
                          <option>1999</option>
                          <option>2000</option>
                          <option>2001</option>
                          <option>2002</option>
                          <option>2003</option>
                          <option>2004</option>
                          <option>2005</option>
                        </ChoicesFormInput>
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </Col>
              <Col xs={12}>
                <Row className=" g-xl-0 align-items-center">
                  <Col lg={4}>
                    <h6 className="mb-lg-0">
                      Email <span className="text-danger">*</span>
                    </h6>
                  </Col>
                  <TextFormInput name="email" control={control} containerClassName="col-lg-8" />
                </Row>
              </Col>
              <Col xs={12}>
                <Row className=" g-xl-0 align-items-center">
                  <Col lg={4}>
                    <h6 className="mb-lg-0">
                      Phone number <span className="text-danger">*</span>
                    </h6>
                  </Col>
                  <TextFormInput name="phoneNo" control={control} containerClassName="col-lg-8" />
                </Row>
              </Col>
              <Col xs={12}>
                <Row className=" g-xl-0">
                  <Col lg={4}>
                    <h6 className="mb-lg-0">
                      Your address <span className="text-danger">*</span>
                    </h6>
                  </Col>
                  <TextAreaFormInput name="address" control={control} containerClassName="col-lg-8" />
                </Row>
              </Col>
              <Col xs={12}>
                <Row className=" g-xl-0 align-items-center">
                  <Col lg={4}>
                    <h6 className="mb-lg-0">
                      Select city <span className="text-danger">*</span>
                    </h6>
                  </Col>
                  <Col lg={8}>
                    <ChoicesFormInput className="form-select js-choice z-index-9 rounded-3 border-0 bg-light" aria-label=".form-select-sm">
                      <option>Select city</option>
                      <option>New york</option>
                      <option>Mumbai</option>
                      <option>Delhi</option>
                      <option>London</option>
                      <option>Los angeles</option>
                    </ChoicesFormInput>
                  </Col>
                </Row>
              </Col>
              <Col xs={12}>
                <Row className=" g-xl-0 align-items-center">
                  <Col lg={4}>
                    <h6 className="mb-lg-0">
                      Select state <span className="text-danger">*</span>
                    </h6>
                  </Col>
                  <Col lg={8}>
                    <ChoicesFormInput className="form-select js-choice z-index-9 rounded-3 border-0 bg-light" aria-label=".form-select-sm">
                      <option>Select state</option>
                      <option>Maharashtra</option>
                      <option>California</option>
                      <option>Florida</option>
                      <option>Alaska</option>
                      <option>Ohio</option>
                    </ChoicesFormInput>
                  </Col>
                </Row>
              </Col>
              <Col xs={12}>
                <Row className=" g-xl-0 align-items-center">
                  <Col lg={4}>
                    <h6 className="mb-lg-0">
                      Select country <span className="text-danger">*</span>
                    </h6>
                  </Col>
                  <Col lg={8}>
                    <ChoicesFormInput className="form-select js-choice z-index-9 rounded-3 border-0 bg-light" aria-label=".form-select-sm">
                      <option>Select country</option>
                      <option>India</option>
                      <option>Canada</option>
                      <option>Japan</option>
                      <option>America</option>
                      <option>Dubai</option>
                    </ChoicesFormInput>
                  </Col>
                </Row>
              </Col>
              <Col xs={12}>
                <Row className=" g-xl-0 align-items-center">
                  <Col lg={4}>
                    <h6 className="mb-lg-0">
                      Zip code <span className="text-danger">*</span>
                    </h6>
                  </Col>
                  <TextFormInput name="zipCode" control={control} containerClassName="col-lg-8" />
                </Row>
              </Col>
              <hr className="my-5" />
              <h5 className="mt-0">Parent detail</h5>
              <Col xs={12}>
                <Row className=" g-xl-0 align-items-center">
                  <Col lg={4}>
                    <h6 className="mb-lg-0">
                      Salutation <span className="text-danger">*</span>
                    </h6>
                  </Col>
                  <Col lg={8}>
                    <div className="d-flex">
                      <div className="form-check radio-bg-light me-4">
                        <input className="form-check-input" type="radio" name="flexRadioSalutation" id="flexRadioSalutation1" defaultChecked />
                        <label className="form-check-label" htmlFor="flexRadioSalutation1">
                          Mr.
                        </label>
                      </div>
                      <div className="form-check radio-bg-light me-4">
                        <input className="form-check-input" type="radio" name="flexRadioSalutation" id="flexRadioSalutation2" />
                        <label className="form-check-label" htmlFor="flexRadioSalutation2">
                          Mrs.
                        </label>
                      </div>
                      <div className="form-check radio-bg-light me-4">
                        <input className="form-check-input" type="radio" name="flexRadioSalutation" id="flexRadioSalutation3" />
                        <label className="form-check-label" htmlFor="flexRadioSalutation3">
                          Ms.
                        </label>
                      </div>
                      <div className="form-check radio-bg-light">
                        <input className="form-check-input" type="radio" name="flexRadioSalutation" id="flexRadioSalutation4" />
                        <label className="form-check-label" htmlFor="flexRadioSalutation4">
                          Dr.
                        </label>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Col>
              <Col xs={12}>
                <Row className=" g-xl-0 align-items-center">
                  <Col lg={4}>
                    <h6 className="mb-lg-0">
                      Full name <span className="text-danger">*</span>
                    </h6>
                  </Col>
                  <TextFormInput name="fullName" control={control} containerClassName="col-lg-8" />
                </Row>
              </Col>
              <Col xs={12}>
                <Row className=" g-xl-0 align-items-center">
                  <Col lg={4}>
                    <h6 className="mb-lg-0">
                      Relation with applicant <span className="text-danger">*</span>
                    </h6>
                  </Col>
                  <TextFormInput name="relation" control={control} containerClassName="col-lg-8" />
                </Row>
              </Col>
              <Col xs={12}>
                <Row className=" g-xl-0 align-items-center">
                  <Col lg={4}>
                    <h6 className="mb-lg-0">
                      Email <span className="text-danger">*</span>
                    </h6>
                  </Col>
                  <TextFormInput name="email2" control={control} containerClassName="col-lg-8" />
                </Row>
              </Col>
              <Col xs={12}>
                <Row className=" g-xl-0 align-items-center">
                  <Col lg={4}>
                    <h6 className="mb-lg-0">
                      Phone number <span className="text-danger">*</span>
                    </h6>
                  </Col>
                  <TextFormInput name="phoneNo2" control={control} containerClassName="col-lg-8" />
                </Row>
              </Col>
              <Col xs={12}>
                <Row className=" g-xl-0">
                  <Col lg={4}>
                    <h6 className="mb-lg-0">
                      Home address <span className="text-danger">*</span>
                    </h6>
                  </Col>
                  <TextAreaFormInput name="address2" control={control} containerClassName="col-lg-8" />
                </Row>
              </Col>
              <Col xs={12}>
                <Row className=" g-xl-0 align-items-center">
                  <Col lg={4}>
                    <h6 className="mb-lg-0">
                      Job title <span className="text-danger">*</span>
                    </h6>
                  </Col>
                  <TextFormInput name="jobTitle" control={control} containerClassName="col-lg-8" />
                </Row>
              </Col>
              <Col xs={12}>
                <Row className=" g-xl-0 align-items-center">
                  <Col lg={4}>
                    <h6 className="mb-lg-0">Office phone number</h6>
                  </Col>
                  <TextFormInput name="phoneNoF" control={control} containerClassName="col-lg-8" />
                </Row>
              </Col>
              <hr className="my-5" />
              <h5 className="mt-0">Education</h5>
              <Col xs={12}>
                <Row className=" g-xl-0 align-items-center">
                  <Col lg={4}>
                    <h6 className="mb-lg-0">
                      School or college name <span className="text-danger">*</span>
                    </h6>
                  </Col>
                  <TextFormInput name="collegeName" control={control} containerClassName="col-lg-8" />
                </Row>
              </Col>
              <Col xs={12}>
                <Row className=" g-xl-0 align-items-center">
                  <Col lg={4}>
                    <h6 className="mb-lg-0">
                      Year of passing <span className="text-danger">*</span>
                    </h6>
                  </Col>
                  <Col lg={8}>
                    <ChoicesFormInput className="form-select js-choice z-index-9 border-0 bg-light" aria-label=".form-select-sm">
                      <option>Year</option>
                      <option>1990</option>
                      <option>1991</option>
                      <option>1992</option>
                      <option>1993</option>
                      <option>1994</option>
                      <option>1995</option>
                      <option>1996</option>
                      <option>1997</option>
                      <option>1998</option>
                      <option>1999</option>
                      <option>2000</option>
                      <option>2001</option>
                      <option>2002</option>
                      <option>2003</option>
                      <option>2004</option>
                      <option>2005</option>
                    </ChoicesFormInput>
                  </Col>
                </Row>
              </Col>
              <Col xs={12}>
                <Row className=" g-xl-0 align-items-center">
                  <Col lg={4}>
                    <h6 className="mb-lg-0">
                      Board of university <span className="text-danger">*</span>
                    </h6>
                  </Col>
                  <TextFormInput name="board" control={control} containerClassName="col-lg-8" />
                </Row>
              </Col>
              <Col xs={12}>
                <Row className=" g-xl-0 align-items-center">
                  <Col lg={4}>
                    <h6 className="mb-lg-0">
                      Class grad <span className="text-danger">*</span>
                    </h6>
                  </Col>
                  <Col lg={8}>
                    <ChoicesFormInput className="form-select js-choice z-index-9" aria-label=".form-select-sm">
                      <option>Select grad</option>
                      <option>Distinction</option>
                      <option>First class</option>
                      <option>Second class</option>
                      <option>Third class</option>
                    </ChoicesFormInput>
                  </Col>
                </Row>
              </Col>
              <Col xs={12}>
                <Row className=" g-xl-0">
                  <Col lg={4}>
                    <h6 className="mb-lg-0">
                      School or college address <span className="text-danger">*</span>
                    </h6>
                  </Col>
                  <TextAreaFormInput name="collegeAddress" control={control} containerClassName="col-lg-8" />
                </Row>
              </Col>
              <Col xs={12} className="text-sm-end">
                <button className="btn btn-primary mb-0">Submit</button>
              </Col>
            </form>
          </Col>
        </Row>
      </Container>
    </section>
  )
}

export default AdmissionFrom
