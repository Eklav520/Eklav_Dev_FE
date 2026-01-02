import GlightBox from '@/components/GlightBox'
import { currency } from '@/context/constants'
import clsx from 'clsx'
import { Button, Card, CardBody, Col, Container, Nav, NavItem, NavLink, Row, TabContainer, TabContent, TabPane } from 'react-bootstrap'
import { BsCart3, BsPatchCheckFill } from 'react-icons/bs'
import { FaPlay, FaRegStar, FaStar, FaStarHalfAlt } from 'react-icons/fa'

import about11 from '@/assets/images/about/11.jpg'
import about12 from '@/assets/images/about/12.jpg'
import about13 from '@/assets/images/about/13.jpg'
import about14 from '@/assets/images/about/14.jpg'
import about15 from '@/assets/images/about/15.jpg'

type PricingType = {
  duration: number
  price: number
}

const CourseVideoCard = ({ showPricing, image }: { showPricing: boolean; image: string }) => {
  const pricingPlans: PricingType[] = [
    { duration: 6, price: 134 },
    { duration: 12, price: 355 },
    { duration: 18, price: 654 },
  ]
  return (
    <Card className={clsx('p-2 shadow', { 'pb-0': showPricing })}>
      <div className={clsx('overflow-hidden h-xl-200px', { 'rounded-3': !showPricing })}>
        <img src={image} className="card-img-top" alt="course image" />
        <div className="card-img-overlay d-flex p-3">
          <div className="m-auto">
            <GlightBox
              href="https://www.youtube.com/embed/tXHviS-4ygo"
              className="btn btn-lg text-danger btn-round btn-white-shadow mb-0"
              data-glightbox
              data-gallery="course-video">
              <FaPlay />
            </GlightBox>
          </div>
        </div>
      </div>
      {showPricing && (
        <CardBody>
          <Row className="g-3">
            {pricingPlans.map((plan, idx) => (
              <Col sm={4} lg={6} xl={4} key={idx}>
                <div className="d-flex align-items-center">
                  <a href="#" className="btn btn-orange rounded-2 me-3 mb-0">
                    <BsCart3 className="fs-5" />
                  </a>
                  <div>
                    <span className="badge text-bg-info mb-1">{plan.duration} months</span>
                    <h5 className="mb-0">
                      {currency}
                      {plan.price}
                    </h5>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </CardBody>
      )}
    </Card>
  )
}

const DesignCourse = () => {
  return (
    <Row>
      <Col xs={12}>
        <Row className="justify-content-between">
          <TabContainer defaultActiveKey="1">
            <Col lg={6}>
              <h3>Art &amp; Design</h3>
              <p className="mb-3">
                Perceived end knowledge certainly day sweetness why cordially. Ask a quick six seven offer see among. Handsome met debating sir
                dwelling age material. As style lived he worse dried. Offered related so visitors we private removed.
              </p>
              <Nav as="ul" className="nav-pills nav-pill-dark-soft mb-0" id="course-pills-tab-inner" role="tablist">
                <NavItem className="me-2 me-sm-3" role="presentation">
                  <NavLink as="button" eventKey="1">
                    Art &amp; Design
                  </NavLink>
                </NavItem>
                <NavItem className="me-2 me-sm-3" role="presentation">
                  <NavLink as="button" eventKey="2">
                    Graphic Design
                  </NavLink>
                </NavItem>
                <NavItem className="me-2 me-sm-3" role="presentation">
                  <NavLink as="button" eventKey="3">
                    Web Design
                  </NavLink>
                </NavItem>
              </Nav>
              <div className="d-flex align-items-center mb-3">
                <h2 className="me-3 mb-0">4.5</h2>
                <div>
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
                  <p className="mb-0">Review from our students</p>
                </div>
              </div>
            </Col>
            <Col lg={6} className="position-relative">
              <figure className="position-absolute top-0 start-100 translate-middle z-index-1 mt-5 pt-5 ms-3 d-none d-md-block">
                <svg>
                  <path
                    className="fill-primary"
                    d="m105.32 16.607c-3.262 5.822-12.294 0.748-9.037-5.064 3.262-5.821 12.294-0.747 9.037 5.064zm-6.865 21.74c-5.481 9.779-20.654 1.255-15.182-8.509 5.48-9.779 20.653-1.255 15.182 8.509zm-36.466-11.481c6.134-10.943 23.113-1.404 16.99 9.522-6.133 10.943-23.113 1.404-16.99-9.522zm5.08-24.019c3.002-5.355 11.311-0.687 8.314 4.66-3.001 5.355-11.31 0.687-8.314-4.66zm-4.357 58.171c6.507-0.155 10.785 7.113 7.628 12.746-3.156 5.634-11.589 5.779-14.853 0.148-0.108-0.186-0.215-0.371-0.322-0.556-3.091-5.332 0.744-12.175 6.905-12.322 0.214-5e-3 0.428-0.011 0.642-0.016zm-14.997-8.34c-2.57 0.843-5.367 0.264-7.715-0.917-2.262-1.137-4.134-3.706-4.81-6.102-0.706-2.505-0.358-5.443 0.914-7.712 1.344-2.399 3.54-3.965 6.101-4.806 2.571-0.843 5.368-0.263 7.715 0.917 2.262 1.138 4.134 3.706 4.81 6.102 0.706 2.506 0.358 5.444-0.913 7.713-1.345 2.398-3.541 3.965-6.102 4.805zm-4.824-41.632c3.915-6.985 14.753-0.896 10.845 6.078-3.915 6.985-14.753 0.896-10.845-6.078zm-11.502 89.749c-1.138 1.37-3.658 2.357-5.408 2.314-1.387-0.035-2.719-0.374-3.958-0.997-1.529-0.769-2.655-2.243-3.307-3.773-0.615-1.445-0.989-3.345-0.459-4.903 0.039-0.113 0.077-0.227 0.116-0.341 0.929-2.724 2.63-4.878 5.509-5.688 1.943-0.547 4.222-0.276 5.984 0.711 1.861 1.043 3.077 2.746 3.729 4.732 0.922 2.805-0.2 5.531-1.976 7.668-0.077 0.093-0.153 0.185-0.23 0.277zm-7.657-31.402c2.806-5.006 10.573-0.642 7.772 4.356-2.806 5.006-10.573 0.642-7.772-4.356zm-3.281-18.47c3.262-5.821 12.294-0.747 9.037 5.065-3.262 5.821-12.294 0.747-9.037-5.065zm-4.63-25.623c3.849-6.869 14.506-0.881 10.663 5.976-3.849 6.869-14.507 0.882-10.663-5.976zm-0.416 16.398c-3.785 6.753-14.261 0.867-10.483-5.874 3.784-6.753 14.261-0.867 10.483 5.874zm-6.41 13.04c-2.871 5.122-10.819 0.657-7.953-4.457 2.871-5.123 10.819-0.658 7.953 4.457zm3.665 16.114c2.701 1.359 3.576 5.061 2.147 7.612-1.533 2.735-4.903 3.506-7.613 2.143-2.702-1.359-3.577-5.061-2.147-7.612 1.532-2.735 4.903-3.506 7.613-2.143zm6.319 39.375c-2.936 5.239-11.064 0.673-8.133-4.558 2.936-5.239 11.064-0.672 8.133 4.558zm30.789-17.287c-3.98 7.101-14.998 0.911-11.025-6.179 3.98-7.102 14.998-0.912 11.025 6.179zm7.01 23.118c-5.807 10.362-21.883 1.33-16.086-9.015 5.807-10.361 21.884-1.329 16.086 9.015z"
                    fill="#f00"
                    fillRule="evenodd"
                  />
                </svg>
              </figure>
              <TabContent className="mb-0 pb-0" id="course-pills-tabContent1">
                <TabPane eventKey="1" className="fade" id="course-pills-tab01" role="tabpanel" aria-labelledby="course-pills-tab-01">
                  <CourseVideoCard image={about13} showPricing />
                </TabPane>
                <TabPane eventKey="2" className="fade" id="course-pills-tab02" role="tabpanel" aria-labelledby="course-pills-tab-02">
                  <CourseVideoCard image={about11} showPricing />
                </TabPane>
                <TabPane eventKey="3" className="fade" id="course-pills-tab03" role="tabpanel" aria-labelledby="course-pills-tab-03">
                  <Card className="p-2 shadow">
                    <div className="overflow-hidden h-xl-200px">
                      <img src={about14} className="card-img-top" alt="course image" />
                      <div className="card-img-overlay d-flex p-3">
                        <div className="m-auto">
                          <GlightBox
                            href="https://www.youtube.com/embed/tXHviS-4ygo"
                            className="btn btn-lg text-danger btn-round btn-white-shadow mb-0"
                            data-glightbox
                            data-gallery="course-video">
                            <FaPlay />
                          </GlightBox>
                        </div>
                      </div>
                    </div>
                    <CardBody className="px-2">
                      <p className="mb-0">
                        <span className="h6 mb-0 fw-bold me-1">Note:</span>Before you learning this video you need to first learn Beginner course
                      </p>
                    </CardBody>
                  </Card>
                </TabPane>
              </TabContent>
            </Col>
          </TabContainer>
        </Row>
      </Col>
    </Row>
  )
}

const Development = () => {
  const features = [
    'Create responsive, accessible, and beautiful layouts',
    'Course Videos & Readings',
    'Manipulate the DOM with vanilla JS',
    'Master the command line interface',
    'Create your own Node modules',
  ]
  return (
    <Row className="row">
      <Col lg={6}>
        <h3>Development</h3>
        <p className="mb-3">
          Ask a quick six seven offer see among. Handsome met debating sir dwelling age material. As style lived he worse dried. Offered related so
          visitors we private removed.
        </p>
        <h6 className="mt-4">What you’ll learn</h6>
        <ul className="list-group list-group-borderless mb-3">
          {features.map((feature, idx) => (
            <li className="list-group-item h6 fw-light d-flex mb-0" key={idx}>
              <BsPatchCheckFill className="text-success me-2" />
              {feature}
            </li>
          ))}
        </ul>
      </Col>
      <Col lg={6}>
        <CourseVideoCard image={about14} showPricing={false} />
      </Col>
    </Row>
  )
}

const PopularCourse = ({ title, image }: { title: string; image: string }) => {
  return (
    <Row className="g-4">
      <Col lg={6}>
        <h3>{title}</h3>
        <p className="mb-3">
          Handsome met debating sir dwelling age material. As style lived he worse dried. Offered related so visitors we private removed.
        </p>
        <div className="d-flex align-items-center mb-3">
          <h2 className="me-3 mb-0">4.0</h2>
          <div>
            <ul className="list-inline mb-0">
              {Array(Math.floor(4))
                .fill(0)
                .map((_star, idx) => (
                  <li key={idx} className="list-inline-item me-1 small">
                    <FaStar size={14} className="text-warning" />
                  </li>
                ))}
              {!Number.isInteger(4) && (
                <li className="list-inline-item me-1 small">

                  <FaStarHalfAlt size={14} className="text-warning" />
                </li>
              )}
              {4 < 5 &&
                Array(5 - Math.ceil(4))
                  .fill(0)
                  .map((_star, idx) => (
                    <li key={idx} className="list-inline-item me-1 small">
                      <FaRegStar size={14} className="text-warning" />
                    </li>
                  ))}
            </ul>
            <p className="mb-0">Review from our students </p>
          </div>
        </div>
        <div className="mt-3">
          <Button variant="success" className="me-1">
            Free trial
          </Button>
          <Button variant="danger">Buy course</Button>
        </div>
      </Col>
      <Col lg={6}>
        <CourseVideoCard image={image} showPricing={false} />
      </Col>
    </Row>
  )
}

const PopularCourses = () => {
  return (
    <section className="bg-light position-relative overflow-hidden">
      <figure className="position-absolute bottom-0 end-0 mb-n5">
        <svg width="822.2px" height="301.9px" viewBox="0 0 822.2 301.9">
          <path
            className="fill-warning"
            d="M752.5,51.9c-4.5,3.9-8.9,7.8-13.4,11.8c-51.5,45.3-104.8,92.2-171.7,101.4c-39.9,5.5-80.2-3.4-119.2-12.1 c-32.3-7.2-65.6-14.6-98.9-13.9c-66.5,1.3-128.9,35.2-175.7,64.6c-11.9,7.5-23.9,15.3-35.5,22.8c-40.5,26.4-82.5,53.8-128.4,70.7 c-2.1,0.8-4.2,1.5-6.2,2.2L0,301.9c3.3-1.1,6.7-2.3,10.2-3.5c46.1-17,88.1-44.4,128.7-70.9c11.6-7.6,23.6-15.4,35.4-22.8 c46.7-29.3,108.9-63.1,175.1-64.4c33.1-0.6,66.4,6.8,98.6,13.9c39.1,8.7,79.6,17.7,119.7,12.1C634.8,157,688.3,110,740,64.6 c4.5-3.9,9-7.9,13.4-11.8C773.8,35,797,16.4,822.2,1l-0.7-1C796.2,15.4,773,34,752.5,51.9z"
          />
        </svg>
      </figure>
      <figure className="position-absolute top-0 start-0 mt-n8 me-5 d-none d-lg-block">
        <svg width="822.2px" height="301.9px" viewBox="0 0 822.2 301.9">
          <path
            className="fill-purple opacity-3"
            d="M752.5,51.9c-4.5,3.9-8.9,7.8-13.4,11.8c-51.5,45.3-104.8,92.2-171.7,101.4c-39.9,5.5-80.2-3.4-119.2-12.1 c-32.3-7.2-65.6-14.6-98.9-13.9c-66.5,1.3-128.9,35.2-175.7,64.6c-11.9,7.5-23.9,15.3-35.5,22.8c-40.5,26.4-82.5,53.8-128.4,70.7 c-2.1,0.8-4.2,1.5-6.2,2.2L0,301.9c3.3-1.1,6.7-2.3,10.2-3.5c46.1-17,88.1-44.4,128.7-70.9c11.6-7.6,23.6-15.4,35.4-22.8 c46.7-29.3,108.9-63.1,175.1-64.4c33.1-0.6,66.4,6.8,98.6,13.9c39.1,8.7,79.6,17.7,119.7,12.1C634.8,157,688.3,110,740,64.6 c4.5-3.9,9-7.9,13.4-11.8C773.8,35,797,16.4,822.2,1l-0.7-1C796.2,15.4,773,34,752.5,51.9z"
          />
        </svg>
      </figure>
      <Container className="position-relative">
        <Row className="mb-4">
          <Col xs={12}>
            <h2 className="fs-1 fw-bold">
              <span className="position-relative z-index-9">Most Popular</span>&nbsp;
              <span className="position-relative z-index-1">
                Courses
                <span className="position-absolute top-50 start-50 translate-middle z-index-n1">
                  <svg width="163.9px" height="48.6px">
                    <path
                      className="fill-warning"
                      d="M162.5,19.9c-0.1-0.4-0.2-0.8-0.3-1.3c-0.1-0.3-0.2-0.5-0.4-0.7c-0.3-0.4-0.7-0.7-1.2-0.9l0.1,0l-0.1,0 c0.1-0.4-0.2-0.5-0.5-0.6c0,0-0.1,0-0.1,0c-0.1-0.1-0.2-0.2-0.3-0.3c0-0.3,0-0.6-0.2-0.7c-0.1-0.1-0.3-0.2-0.6-0.2 c0-0.3-0.1-0.5-0.3-0.6c-0.1-0.1-0.3-0.2-0.5-0.2c-0.1,0-0.1,0-0.2,0c-0.5-0.4-1-0.8-1.4-1.1c0,0,0-0.1,0-0.1c0-0.1-0.1-0.1-0.3-0.2 c-0.9-0.5-1.8-1-2.6-1.5c-6-3.6-13.2-4.3-19.8-6.2c-4.1-1.2-8.4-1.4-12.6-2c-5.6-0.8-11.3-0.6-16.9-1.1c-2.3-0.2-4.6-0.3-6.8-0.3 c-1.2,0-2.4-0.2-3.5-0.1c-2.4,0.4-4.9,0.6-7.4,0.7c-0.8,0-1.7,0.1-2.5,0.1c-0.1,0-0.1,0-0.2,0c-0.1,0-0.1,0-0.2,0 c-0.9,0-1.8,0.1-2.7,0.1c-0.9,0-1.8,0-2.7,0c-5.5-0.3-10.7,0.7-16,1.5c-2.5,0.4-5.1,1-7.6,1.5c-2.8,0.6-5.6,0.7-8.4,1.4 c-4.1,1-8.2,1.9-12.3,2.6c-4,0.7-8,1.6-11.9,2.7c-3.6,1-6.9,2.5-10.1,4.1c-1.9,0.9-3.8,1.7-5.2,3.2c-1.7,1.8-2.8,4-4.2,6 c-1,1.3-0.7,2.5,0.2,3.9c2,3.1,5.5,4.4,9,5.7c1.8,0.7,3.6,1,5.3,1.8c2.3,1.1,4.6,2.3,7.1,3.2c5.2,2,10.6,3.4,16.2,4.4 c3,0.6,6.2,0.9,9.2,1.1c4.8,0.3,9.5,1.1,14.3,0.8c0.3,0.3,0.6,0.3,0.9-0.1c0.7-0.3,1.4,0.1,2.1-0.1c3.7-0.6,7.6-0.3,11.3-0.3 c2.1,0,4.3,0.3,6.4,0.2c4-0.2,8-0.4,11.9-0.8c5.4-0.5,10.9-1,16.2-2.2c0.1,0.2,0.2,0.1,0.2,0c0.5-0.1,1-0.2,1.4-0.3 c0.1,0.1,0.2,0.1,0.3,0c0.5-0.1,1-0.3,1.6-0.3c3.3-0.3,6.7-0.6,10-1c2.1-0.3,4.1-0.8,6.2-1.2c0.2,0.1,0.3,0.1,0.4,0.1 c0.1,0,0.1,0,0.2-0.1c0,0,0.1,0,0.1-0.1c0,0,0-0.1,0.1-0.1c0.2-0.1,0.4-0.1,0.6-0.2c0,0,0.1,0,0.1,0c0.1,0,0.2-0.1,0.3-0.2 c0,0,0,0,0,0l0,0c0,0,0,0,0,0c0.2,0,0.4-0.1,0.5-0.1c0,0,0,0,0,0c0.1,0,0.1,0,0.2,0c0.2,0,0.3-0.1,0.3-0.3c0.5-0.2,0.9-0.4,1.4-0.5 c0.1,0,0.2,0,0.2,0c0,0,0.1,0,0.1,0c0,0,0.1-0.1,0.1-0.1c0,0,0,0,0.1,0c0,0,0.1,0,0.1,0c0.2,0.1,0.4,0.1,0.6,0 c0.1,0,0.1-0.1,0.2-0.2c0.1-0.1,0.1-0.2,0.1-0.3c0.5-0.2,1-0.4,1.6-0.7c1.5-0.7,3.1-1.4,4.7-1.9c4.8-1.5,9.1-3.4,12.8-6.3 c0.8-0.2,1.2-0.5,1.6-1c0.2-0.3,0.4-0.6,0.5-0.9c0.5-0.1,0.7-0.2,0.9-0.5c0.2-0.2,0.2-0.5,0.3-0.9c0-0.1,0-0.1,0.1-0.1 c0.5,0,0.6-0.3,0.8-0.5C162.3,24,163,22,162.5,19.9z M4.4,28.7c-0.2-0.4-0.3-0.9-0.1-1.2c1.8-2.9,3.4-6,6.8-8 c2.8-1.7,5.9-2.9,8.9-4.2c4.3-1.8,9-2.5,13.6-3.4c0,0.1,0,0.2,0,0.2l0,0c-1.1,0.4-2.2,0.7-3.2,1.1c-3.3,1.1-6.5,2.1-9.7,3.4 c-4.2,1.6-7.6,4.2-10.1,7.5c-0.5,0.7-1,1.3-1.6,2c-2.2,2.7-1,4.7,1.2,6.9c0.1,0.1,0.3,0.3,0.4,0.5C7.8,32.5,5.5,31.2,4.4,28.7z  M158.2,23.8c-1.7,2.8-4.1,5.1-7,6.8c-2,1.2-4.5,2.1-6.9,2.9c-3.3,1-6.4,2.4-9.5,3.7c-3.9,1.6-8.1,2.5-12.4,2.9 c-6,0.5-11.8,1.5-17.6,2.5c-4.8,0.8-9.8,1-14.7,1.5c-5.6,0.6-11.2,0.2-16.8,0.1c-3.1-0.1-6.3,0.3-9.4,0.5c-2.6,0.2-5.2,0.1-7.8-0.1 c-3.9-0.3-7.8-0.5-11.7-0.9c-2.8-0.3-5.5-0.7-8.2-1.4c-3.2-0.8-6.3-1.7-9.5-2.5c-0.5-0.1-1-0.3-1.4-0.5c-0.2-0.1-0.4-0.1-0.6-0.2 c0,0,0.1,0,0.1,0c0.3-0.1,0.5,0,0.7,0.1c0,0,0,0,0,0c3.4,0.5,6.9,1.2,10.3,1.4c0.5,0,1,0,1.5,0c0.5,0,1.3,0.2,1.3-0.3 c0-0.6-0.7-0.9-1.4-0.9c-2.1,0-4.2-0.2-6.3-0.5c-4.6-0.7-9.1-1.5-13.4-3c-2.9-1.1-5.4-2.7-6.9-5.2c-0.5-0.8-0.5-1.6-0.1-2.4 c3.2-6.2,9-9.8,16.3-12.2c6.7-2.2,13.2-4.5,20.2-6c5-1.1,10-1.8,15-2.9c8.5-1.9,17.2-2.4,26-2.7c3.6-0.1,7.1-0.8,10.8-0.6 c8.4,0.7,16.7,1.2,25,2.3c4.5,0.6,9,1.2,13.6,1.7c3.6,0.4,7.1,1.4,10.5,2.8c3.1,1.3,6,2.9,8.5,5C159.1,17.7,159.8,21.1,158.2,23.8z"
                    />
                  </svg>
                </span>
              </span>
            </h2>
            <p className="mb-0">See what course other students and experts in your domain are learning on.</p>
          </Col>
        </Row>
        <TabContainer defaultActiveKey="design">
          <Nav as="ul" className="nav-pills nav-pill-soft mb-3" id="course-pills-tab" role="tablist">
            <NavItem className="me-2 me-sm-5" role="presentation">
              <NavLink eventKey="design" as="button">
                Art &amp; Design
              </NavLink>
            </NavItem>
            <NavItem className="me-2 me-sm-5" role="presentation">
              <NavLink eventKey="development" as="button">
                Development
              </NavLink>
            </NavItem>
            <NavItem className="me-2 me-sm-5" role="presentation">
              <NavLink eventKey="data-science" as="button">
                Data Science
              </NavLink>
            </NavItem>
            <NavItem className="me-2 me-sm-5" role="presentation">
              <NavLink eventKey="marketing" as="button">
                Marketing
              </NavLink>
            </NavItem>
            <NavItem className="me-2 me-sm-5" role="presentation">
              <NavLink eventKey="finance" as="button">
                Finance
              </NavLink>
            </NavItem>
          </Nav>
          <TabContent className="mb-0" id="course-pills-tabContent">
            <TabPane className="fade" eventKey="design">
              <DesignCourse />
            </TabPane>
            <TabPane className="fade" eventKey="development">
              <Development />
            </TabPane>
            <TabPane className="fade" eventKey="data-science">
              <PopularCourse title="Data Science" image={about15} />
            </TabPane>
            <TabPane className="fade" eventKey="marketing">
              <PopularCourse title="Marketing" image={about12} />
            </TabPane>
            <TabPane className="fade" eventKey="finance">
              <PopularCourse title="Finance" image={about11} />
            </TabPane>
          </TabContent>
        </TabContainer>
      </Container>
    </section>
  )
}

export default PopularCourses
