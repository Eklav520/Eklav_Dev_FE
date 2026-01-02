import { Button, Col, Nav, NavItem, NavLink, ProgressBar, Row, TabContainer, TabContent, TabPane } from 'react-bootstrap'

import { Link } from 'react-router-dom'
import { Fragment } from 'react'
import { useForm } from 'react-hook-form'
import { FaCheckCircle, FaRegStar, FaReply, FaStar, FaStarHalfAlt } from 'react-icons/fa'
import * as yup from 'yup'
import { useFetchData } from '@/hooks/useFetchData'
import { ReviewType } from '@/types/other'
import { splitArray } from '@/utils/array'
import { timeSince } from '@/utils/date'
import ChoicesFormInput from '@/components/form/ChoicesFormInput'
import TextAreaFormInput from '@/components/form/TextAreaFormInput'
import TextFormInput from '@/components/form/TextFormInput'
import { yupResolver } from '@hookform/resolvers/yup'
import clsx from 'clsx'

import avatar9 from '@/assets/images/avatar/09.jpg'

import { commentData, faqsData } from '../data'
import { getAllUserReviews } from '@/helpers/data'

const Overview = () => {
  const features = [
    'Digital marketing course introduction',
    'Customer Life cycle',
    'What is Search engine optimization(SEO)',
    'Facebook ADS',
    'Facebook Messenger Chatbot',
    'Search engine optimization tools',
    'Why SEO',
    'URL Structure',
    'Featured Snippet',
    'SEO tips and tricks',
    'Google tag manager',
  ]
  const featureChunks = splitArray(features, 2)
  return (
    <>
      <h5 className="mb-3">Course Description</h5>
      <p className="mb-3">
        Welcome to the <strong> Digital Marketing Ultimate Course Bundle - 12 Courses in 1 (Over 36 hours of content)</strong>
      </p>
      <p className="mb-3">
        In this practical hands-on training, you’re going to learn to become a digital marketing expert with this
        <strong> ultimate course bundle that includes 12 digital marketing courses in 1!</strong>
      </p>
      <p className="mb-3">
        If you wish to find out the skills that should be covered in a basic digital marketing course syllabus in India or anywhere around the world,
        then reading this blog will help. Before we delve into the advanced
        <strong>
          <a href="#" className="text-reset text-decoration-underline">
            digital marketing course
          </a>
        </strong>
        syllabus, let’s look at the scope of digital marketing and what the future holds.
      </p>
      <p className="mb-0">
        We focus a great deal on the understanding of behavioral psychology and influence triggers which are crucial for becoming a well rounded
        Digital Marketer. We understand that theory is important to build a solid foundation, we understand that theory alone isn’t going to get the
        job done so that’s why this course is packed with practical hands-on examples that you can follow step by step.
      </p>
      <h5 className="mt-4">What you’ll learn</h5>
      <Row className="mb-3">
        {featureChunks.map((chunk, idx) => (
          <Col md={6} key={idx}>
            <ul className="list-group list-group-borderless">
              {chunk.map((feature, idx) => (
                <li className="list-group-item h6 fw-light d-flex mb-0" key={idx}>
                  <FaCheckCircle className="text-success me-2" />
                  {feature}
                </li>
              ))}
            </ul>
          </Col>
        ))}
      </Row>
      <p className="mb-0">
        As it so contrasted oh estimating instrument. Size like body someone had. Are conduct viewing boy minutes warrant the expense? Tolerably
        behavior may admit daughters offending her ask own. Praise effect wishes change way and any wanted. Lively use looked latter regard had. Do he
        it part more last in.
      </p>
    </>
  )
}

const UserReviews = () => {
  const reviewSchema = yup.object({
    name: yup.string().required('please enter your name'),
    email: yup.string().email('please enter valid email').required('please enter your email'),
    review: yup.string().required('please enter your review'),
  })
  const { control, handleSubmit } = useForm({
    resolver: yupResolver(reviewSchema),
  })
  const userReviews = useFetchData<ReviewType[]>(getAllUserReviews)
  return (
    <>
      <Row className="mb-4">
        <h5 className="mb-4">Our Student Reviews</h5>
        <Col md={4} className="mb-3 mb-md-0">
          <div className="text-center">
            <h2 className="mb-0">4.5</h2>
            <ul className="list-inline mb-0">
              {Array(Math.floor(4.5))
                .fill(0)
                .map((_star, idx) => (
                  <li key={idx} className="list-inline-item me-1 small">
                    <FaStar size={16} className="text-warning" />
                  </li>
                ))}
              {!Number.isInteger(4.5) && (
                <li className="list-inline-item me-1 small">

                  <FaStarHalfAlt size={16} className="text-warning" />
                </li>
              )}
              {4.5 < 5 &&
                Array(5 - Math.ceil(4.5))
                  .fill(0)
                  .map((_star, idx) => (
                    <li key={idx} className="list-inline-item me-1 small">
                      <FaRegStar size={16} className="text-warning" />
                    </li>
                  ))}
            </ul>
            <p className="mb-0">(Based on todays review)</p>
          </div>
        </Col>
        <Col md={8}>
          <Row className="align-items-center text-center">
            {[100, 80, 60, 40, 20].map((progress, idx) => (
              <Fragment key={idx}>
                <Col xs={6} sm={8}>
                  <ProgressBar variant="warning" className="progress-sm bg-opacity-15" now={progress} />
                </Col>
                <Col xs={6} sm={4}>
                  <ul className="list-inline mb-0">
                    {Array(Math.floor(5 - idx))
                      .fill(0)
                      .map((_star, idx) => (
                        <li key={idx} className="list-inline-item me-1 small">
                          <FaStar size={14} className="text-warning" />
                        </li>
                      ))}
                    {!Number.isInteger(5 - idx) && (
                      <li className="list-inline-item me-1 small">

                        <FaStarHalfAlt size={14} className="text-warning" />
                      </li>
                    )}
                    {5 - idx < 5 &&
                      Array(5 - Math.ceil(5 - idx))
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
      <Row>
        {userReviews?.map((review, idx) => (
          <Fragment key={idx}>
            <div className="d-md-flex my-4" key={idx}>
              <div className="avatar avatar-xl me-4 flex-shrink-0">
                <img className="avatar-img rounded-circle" src={review.avatar} alt="avatar" />
              </div>
              <div>
                <div className="d-sm-flex mt-1 mt-md-0 align-items-center">
                  <h5 className="me-3 mb-0">{review.name}</h5>
                  {review.rating && (
                    <ul className="list-inline mb-0">
                      {Array(Math.floor(review.rating))
                        .fill(0)
                        .map((_star, idx) => (
                          <li key={idx} className="list-inline-item me-1 small">
                            <FaStar size={16} className="text-warning" />
                          </li>
                        ))}
                      {!Number.isInteger(review.rating) && (
                        <li className="list-inline-item me-1 small">

                          <FaStarHalfAlt size={16} className="text-warning" />
                        </li>
                      )}
                      {review.rating < 5 &&
                        Array(5 - Math.ceil(review.rating))
                          .fill(0)
                          .map((_star, idx) => (
                            <li key={idx} className="list-inline-item me-1 small">
                              <FaRegStar size={16} className="text-warning" />
                            </li>
                          ))}
                    </ul>
                  )}
                </div>
                <p className="small mb-2">{timeSince(review.time)}</p>
                <p className="mb-2">{review.description}</p>
                <span role="button" className="text-body mb-0">
                  <FaReply className="me-2" />
                  Reply
                </span>
              </div>
            </div>
            <hr />
          </Fragment>
        ))}
      </Row>
      <div className="mt-2">
        <h5 className="mb-4">Leave a Review</h5>
        <form className="row g-3" onSubmit={handleSubmit(() => {})}>
          <TextFormInput name="name" control={control} placeholder="Name" containerClassName="col-md-6" />
          <TextFormInput name="email" type="email" control={control} placeholder="Email" containerClassName="col-md-6" />
          <Col xs={12}>
            <ChoicesFormInput id="inputState2" className="form-select  js-choice">
              <option>★★★★★ (5/5)</option>
              <option>★★★★☆ (4/5)</option>
              <option>★★★☆☆ (3/5)</option>
              <option>★★☆☆☆ (2/5)</option>
              <option>★☆☆☆☆ (1/5)</option>
            </ChoicesFormInput>
          </Col>
          <TextAreaFormInput name="review" placeholder="Your review" rows={3} control={control} containerClassName="col-12" />
          <Col xs={12}>
            <Button variant="primary" type="submit" className="mb-0">
              Post Review
            </Button>
          </Col>
        </form>
      </div>
    </>
  )
}

const Faqs = () => {
  return (
    <>
      <h5 className="mb-3">Frequently Asked Questions</h5>
      {faqsData.map((faq, idx) => (
        <div className="mt-4" key={idx}>
          <h6>{faq.question}</h6>
          <p className="mb-0">{faq.answer}</p>
        </div>
      ))}
    </>
  )
}

const Comment = () => {
  return (
    <Row className="mb-4">
      <Col xs={12}>
        <h5 className="mb-4">Ask Your Question</h5>
        <div className="d-flex mb-4">
          <div className="avatar avatar-sm flex-shrink-0 me-2">
            <span role="button">

              <img className="avatar-img rounded-circle" src={avatar9} alt="avatar" />
            </span>
          </div>
          <form className="w-100 d-flex">
            <textarea className="one form-control pe-4 bg-light" id="autoheighttextarea" rows={1} placeholder="Add a comment..." defaultValue={''} />
            <Button variant="primary" className="ms-2 mb-0" type="button">
              Post
            </Button>
          </form>
        </div>
        {commentData.map((comment, idx) => (
          <div className={clsx('border p-2 p-sm-4 rounded-3', { 'mb-4': commentData.length - 1 != idx })} key={idx}>
            <ul className="list-unstyled mb-0">
              <li className="comment-item">
                <div className={clsx('d-flex', { 'mb-3': comment.reply })}>
                  <div className="avatar avatar-sm flex-shrink-0">
                    <span role="button">
                      <img className="avatar-img rounded-circle" src={comment.avatar} alt="avatar" />
                    </span>
                  </div>
                  <div className="ms-2">
                    <div className="bg-light p-3 rounded">
                      <div className="d-flex justify-content-center">
                        <div className="me-2">
                          <h6 className="mb-1 lead fw-bold">

                            <a href="#!"> {comment.name} </a>
                          </h6>
                          <p className="h6 mb-0">{comment.comment}</p>
                        </div>
                        <small className="text-nowrap">{timeSince(comment.time)}</small>
                      </div>
                    </div>
                    <ul className="nav nav-divider py-2 small">
                      <li className="nav-item">

                        <a className="text-primary-hover" href="#">

                          Like {comment.like && comment.like}
                        </a>
                      </li>
                      <li className="nav-item">

                        <a className="text-primary-hover" href="#">

                          Reply
                        </a>
                      </li>
                      {comment.replies && (
                        <li className="nav-item">

                          <a className="text-primary-hover" href="#">

                            View {comment.replies} replies
                          </a>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
                {comment.reply &&
                  comment.reply.map((comment, idx) => (
                    <ul className="list-unstyled ms-4" key={idx}>
                      <li className="comment-item">
                        <div className="d-flex">
                          <div className="avatar avatar-xs flex-shrink-0">
                            <span role="button">
                              <img className="avatar-img rounded-circle" src={comment.avatar} alt="avatar" />
                            </span>
                          </div>
                          <div className="ms-2">
                            <div className="bg-light p-3 rounded">
                              <div className="d-flex justify-content-center">
                                <div className="me-2">
                                  <h6 className="mb-1  lead fw-bold">

                                    <a href="#"> {comment.name} </a>
                                  </h6>
                                  <p className=" mb-0">{comment.comment}</p>
                                </div>
                                <small className="text-nowrap">{timeSince(comment.time)}</small>
                              </div>
                            </div>
                            <ul className="nav nav-divider py-2 small">
                              <li className="nav-item">
                                <Link className="text-primary-hover" to="">

                                  Like {comment.like && comment.like}
                                </Link>
                              </li>
                              <li className="nav-item">
                                <Link className="text-primary-hover" to="">

                                  Reply
                                </Link>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </li>
                    </ul>
                  ))}
              </li>
            </ul>
          </div>
        ))}
      </Col>
    </Row>
  )
}

const CourseTab = () => {
  return (
    <TabContainer defaultActiveKey="overview">
      <Nav className="nav-pills nav-pills-bg-soft px-3" id="course-pills-tab" role="tablist">
        <NavItem className="me-2 me-sm-4" role="presentation">
          <NavLink as="button" className="mb-0" type="button" eventKey="overview">
            Overview
          </NavLink>
        </NavItem>
        <NavItem className="me-2 me-sm-4" role="presentation">
          <NavLink as="button" className="mb-0" type="button" eventKey="reviews">
            Reviews
          </NavLink>
        </NavItem>
        <NavItem className="me-2 me-sm-4" role="presentation">
          <NavLink as="button" className="mb-0" type="button" eventKey="faqs">
            FAQs
          </NavLink>
        </NavItem>
        <NavItem className="me-2 me-sm-4" role="presentation">
          <NavLink as="button" className="mb-0" type="button" eventKey="comment">
            Comment
          </NavLink>
        </NavItem>
      </Nav>
      <TabContent className="pt-4 px-3" id="course-pills-tabContent">
        <TabPane eventKey="overview" className="fade" role="tabpanel">
          <Overview />
        </TabPane>
        <TabPane eventKey="reviews" className="fade" role="tabpanel">
          <UserReviews />
        </TabPane>
        <TabPane eventKey="faqs" className="fade" role="tabpanel">
          <Faqs />
        </TabPane>
        <TabPane eventKey="comment" className="fade" role="tabpanel">
          <Comment />
        </TabPane>
      </TabContent>
    </TabContainer>
  )
}

export default CourseTab
