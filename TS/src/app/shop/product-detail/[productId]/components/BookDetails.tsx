import instructor8 from '@/assets/images/instructor/08.jpg'
import ChoicesFormInput from '@/components/form/ChoicesFormInput'
import TextAreaFormInput from '@/components/form/TextAreaFormInput'
import TextFormInput from '@/components/form/TextFormInput'
import { getAllUserReviews } from '@/helpers/data'
import { useFetchData } from '@/hooks/useFetchData'
import { ReviewType } from '@/types/other'
import { yupResolver } from '@hookform/resolvers/yup'
import { Col, Nav, NavItem, NavLink, ProgressBar, Row, TabContainer, TabContent, TabPane } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaPeopleCarry,
  FaRegFileAlt,
  FaRegStar,
  FaReply,
  FaStar,
  FaStarHalfAlt,
  FaTruckMoving,
  FaTwitter,
} from 'react-icons/fa'
import { Fragment } from 'react/jsx-runtime'
import * as yup from 'yup'

const ReviewCard = ({ avatar, description, name, rating }: ReviewType) => {
  return (
    <>
      <div className="d-md-flex my-4">
        <div className="avatar avatar-xl me-4 flex-shrink-0">
          <img className="avatar-img rounded-circle" src={avatar} alt="avatar" />
        </div>
        <div>
          <div className="d-sm-flex mt-1 mt-md-0 align-items-center">
            <h5 className="me-3 mb-0">{name}</h5>
            <ul className="list-inline mb-0">
              {rating && (
                <>
                  {Array(Math.floor(rating))
                    .fill(0)
                    .map((_star, idx) => (
                      <li key={idx} className="list-inline-item me-1 small">
                        <FaStar size={14} className="text-warning" />
                      </li>
                    ))}
                  {!Number.isInteger(rating) && (
                    <li className="list-inline-item me-1 small">

                      <FaStarHalfAlt size={14} className="text-warning" />
                    </li>
                  )}
                  {rating < 5 &&
                    Array(5 - Math.ceil(rating))
                      .fill(0)
                      .map((_star, idx) => (
                        <li key={idx} className="list-inline-item me-1 small">
                          <FaRegStar size={14} className="text-warning" />
                        </li>
                      ))}
                </>
              )}
            </ul>
          </div>
          <p className="small mb-2">2 days ago</p>
          <p className="mb-2">{description} </p>
          <a href="#" className="text-body mb-0">
            <FaReply className="me-2" />
            Reply
          </a>
        </div>
      </div>
      <hr />
    </>
  )
}

const BookDetails = () => {
  const progress = [100, 80, 60, 40, 20]
  const reviewData = useFetchData(getAllUserReviews)

  const editEmailFormSchema = yup.object({
    name: yup.string().required('Please enter your name'),
    email: yup.string().required('Please enter your email'),
    smtpSecure: yup.string().required('Please enter your SMTP Secure'),
    description: yup.string().required('Please enter your description'),
  })
  const { control, handleSubmit } = useForm({
    resolver: yupResolver(editEmailFormSchema),
  })
  return (
    <Col xs={12}>
      <TabContainer defaultActiveKey={1}>
        <Nav className=" nav-pills nav-pills-bg-soft px-3" id="book-pills-tab" role="tablist">
          <NavItem className="me-2 me-sm-4" role="presentation">
            <NavLink
              eventKey={1}
              className="mb-0 "
              id="book-pills-tab-1"
              data-bs-toggle="pill"
              data-bs-target="#book-pills-1"
              type="button"
              role="tab"
              aria-controls="book-pills-1"
              aria-selected="true">
              Author
            </NavLink>
          </NavItem>
          <NavItem className="me-2 me-sm-4" role="presentation">
            <NavLink
              eventKey={2}
              className="mb-0"
              id="book-pills-tab-2"
              data-bs-toggle="pill"
              data-bs-target="#book-pills-2"
              type="button"
              role="tab"
              aria-controls="book-pills-2"
              aria-selected="false">
              Reviews
            </NavLink>
          </NavItem>
          <NavItem className="me-2 me-sm-4" role="presentation">
            <NavLink
              eventKey={3}
              className="mb-0"
              id="book-pills-tab-3"
              data-bs-toggle="pill"
              data-bs-target="#book-pills-3"
              type="button"
              role="tab"
              aria-controls="book-pills-3"
              aria-selected="false">
              Shipping Method
            </NavLink>
          </NavItem>
        </Nav>
        <TabContent className="pt-4 px-3" id="book-pills-tabContent">
          <TabPane eventKey={1} className="fade show " id="book-pills-1" role="tabpanel" aria-labelledby="book-pills-tab-1">
            <Row className=" g-4">
              <Col md={3}>
                <img src={instructor8} className="rounded-3" alt="instructor" />
              </Col>
              <Col md={9}>
                <div className="d-sm-flex justify-content-sm-between">
                  <div className="mb-3">
                    <h3 className="mb-0">Dennis Barrett</h3>
                    <span>Publisher</span>
                  </div>
                  <ul className="list-inline mb-0">
                    <li className="list-inline-item">
                      <a className="mb-0 me-1 text-facebook" href="#">
                        <FaFacebookF />
                      </a>
                    </li>
                    &nbsp;
                    <li className="list-inline-item">
                      <a className="mb-0 me-1 text-instagram-gradient" href="#">
                        <FaInstagram className="text-danger" />
                      </a>
                    </li>
                    &nbsp;
                    <li className="list-inline-item">
                      <a className="mb-0 me-1 text-twitter" href="#">
                        <FaTwitter />
                      </a>
                    </li>
                    &nbsp;
                    <li className="list-inline-item">
                      <a className="mb-0 text-linkedin" href="#">
                        <FaLinkedinIn />
                      </a>
                    </li>
                  </ul>
                </div>
                <p className="mt-3 mt-sm-0 mb-0">
                  We understand that theory is important to build a solid foundation, we understand that theory alone isn&apos;t going to get the job
                  done so that&apos;s why this course is packed with practical hands-on examples that you can follow step by step.
                </p>
              </Col>
            </Row>
          </TabPane>
          <TabPane eventKey={2} className="fade" id="book-pills-2" role="tabpanel" aria-labelledby="book-pills-tab-2">
            <Row className=" mb-4">
              <h4 className="mb-4">All Reviews</h4>
              <Col md={4} className="mb-3 mb-md-0">
                <div className="text-center">
                  <h2 className="mb-0">4.5</h2>
                  <ul className="list-inline mb-0">
                    {Array(Math.floor(4.5))
                      .fill(0)
                      .map((_star, idx) => (
                        <li key={idx} className="list-inline-item me-1 small">
                          <FaStar size={14} className="text-warning" />
                        </li>
                      ))}
                    {!Number.isInteger(4.5) && (
                      <li className="list-inline-item me-1 small">

                        <FaStarHalfAlt size={14} className="text-warning" />
                      </li>
                    )}
                    {4.5 < 5 &&
                      Array(5 - Math.ceil(4.5))
                        .fill(0)
                        .map((_star, idx) => (
                          <li key={idx} className="list-inline-item me-1 small">
                            <FaRegStar size={14} className="text-warning" />
                          </li>
                        ))}
                  </ul>
                  <p className="mb-0">(Based on 155 review)</p>
                </div>
              </Col>
              <Col md={8}>
                <Row className=" align-items-center text-center">
                  {progress.map((item, idx) => (
                    <Fragment key={idx}>
                      <Col xs={6} sm={8}>
                        <ProgressBar variant="warning" className="progress-sm bg-opacity-15 " role="progressbar" now={item} />
                      </Col>
                      <Col xs={6} sm={4}>
                        <ul className="list-inline mb-0">
                          {Array(Math.floor(progress.length - idx))
                            .fill(0)
                            .map((_star, idx) => (
                              <li key={idx} className="list-inline-item me-1 small">
                                <FaStar size={14} className="text-warning" />
                              </li>
                            ))}
                          {!Number.isInteger(progress.length - idx) && (
                            <li className="list-inline-item me-1 small">

                              <FaStarHalfAlt size={14} className="text-warning" />
                            </li>
                          )}
                          {progress.length - idx < 5 &&
                            Array(5 - Math.ceil(progress.length - idx))
                              .fill(0)
                              .map((_star, idx) => (
                                <li key={idx} className="list-inline-item me-1 small">
                                  <FaRegStar size={14} className="text-warning" />
                                </li>
                              ))}
                        </ul>
                      </Col>
                    </Fragment>
                  ))}
                </Row>
              </Col>
            </Row>
            <Row>{reviewData?.map((item, idx) => <ReviewCard key={idx} {...item} />)}</Row>
            <div className="mt-2">
              <h5 className="mb-4">Leave a Review</h5>
              <form className="row g-3" onSubmit={handleSubmit(() => {})}>
                <TextFormInput name="name" containerClassName="col-md-6" placeholder="Name" control={control} />
                <TextFormInput name="email" containerClassName="col-md-6" placeholder="Email" control={control} />
                <Col xs={12}>
                  <ChoicesFormInput id="inputState2" className="form-select  js-choice">
                    <option>★★★★★ (5/5)</option>
                    <option>★★★★☆ (4/5)</option>
                    <option>★★★☆☆ (3/5)</option>
                    <option>★★☆☆☆ (2/5)</option>
                    <option>★☆☆☆☆ (1/5)</option>
                  </ChoicesFormInput>
                </Col>
                <TextAreaFormInput name="description" containerClassName="col-12" placeholder="Your review" control={control} />
                <Col xs={12}>
                  <button type="submit" className="btn btn-primary mb-0">
                    Post Review
                  </button>
                </Col>
              </form>
            </div>
          </TabPane>
          <TabPane eventKey={3} className="fade" id="book-pills-3" role="tabpanel" aria-labelledby="book-pills-tab-3">
            <p>
              As it so contrasted oh estimating instrument. Size like body someone had. Are conduct viewing boy minutes warrant the expense? Tolerably
              behavior may admit daughters offending her ask own. Praise effect wishes change way and any wanted. Lively use looked latter regard had.
              Do he it part more last in.
            </p>
            <Row className=" mb-4">
              <Col xs={12}>
                <div className="bg-light p-4 rounded-3">
                  <Row className=" g-4 text-center mx-auto">
                    <Col md={4} className="text-center">
                      <div className="icon-xl bg-dark bg-opacity-10 mx-auto rounded-circle mb-3">
                        <FaRegFileAlt />
                      </div>
                      <h6>You place your order</h6>
                    </Col>
                    <Col md={4} className="text-center">
                      <div className="icon-xl bg-dark bg-opacity-10 mx-auto rounded-circle mb-3">
                        <FaTruckMoving />
                      </div>
                      <h6>We Ship Your Order</h6>
                    </Col>
                    <Col md={4} className="text-center">
                      <div className="icon-xl bg-dark bg-opacity-10 mx-auto rounded-circle mb-3">
                        <FaPeopleCarry />
                      </div>
                      <h6>Delivery</h6>
                    </Col>
                  </Row>
                </div>
              </Col>
            </Row>
            <p>
              Are conduct viewing boy minutes warrant the expense? Tolerably behavior may admit daughters offending her ask own. Praise effect wishes
              change way and any wanted. Lively use looked latter regard had. Do he it part more last in.
            </p>
            <p>
              <b>Processing time:</b> The time it takes to prepare your item(s) to ship from our warehouse. This includes preparing your items,
              performing quality checks, and packing for shipment.
            </p>
            <p>
              <b>Shipping time:</b> The time for your item(s) to travel from our warehouse to your destination.
            </p>
            <p>
              Tolerably behavior may admit daughters offending her ask own. Praise effect wishes change way and any wanted. Lively use looked latter
              regard had. Do he it part more last in.
            </p>
          </TabPane>
        </TabContent>
      </TabContainer>
    </Col>
  )
}

export default BookDetails
