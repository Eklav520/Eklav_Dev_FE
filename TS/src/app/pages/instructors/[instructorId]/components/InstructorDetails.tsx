import instructor7 from '@/assets/images/instructor/07.jpg'
import { Card, CardBody, Col, Container, Row } from 'react-bootstrap'
import {
  FaEnvelope,
  FaFacebookF,
  FaGlobe,
  FaGraduationCap,
  FaHeadphones,
  FaInstagram,
  FaMapMarkerAlt,
  FaRegStar,
  FaStar,
  FaStarHalfAlt,
  FaTwitter,
} from 'react-icons/fa'
import { FaLinkedinIn } from 'react-icons/fa6'
import Counter from './Counter'
import CoursesList from './CoursesList'
import RelatedInstructors from './RelatedInstructors'

const InstructorDetailCard = () => {
  return (
    <Card className="shadow p-2 mb-4 text-center">
      <div className="rounded-3">
        <img src={instructor7} className="card-img" alt="course image" />
      </div>
      <CardBody className="px-3">
        <ul className="list-inline icons-center">
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
          <li className="list-inline-item ms-2 h6 fw-light mb-0">4.5/5.0</li>
        </ul>
        <ul className="list-inline mb-0">
          <li className="list-inline-item">

            <a className="btn px-2 btn-sm bg-facebook" href="#">
              <FaFacebookF className="h-13px" />
            </a>
          </li>
          <li className="list-inline-item">

            <a className="btn px-2 btn-sm bg-instagram-gradient" href="#">
              <FaInstagram />
            </a>
          </li>
          <li className="list-inline-item">

            <a className="btn px-2 btn-sm bg-twitter" href="#">
              <FaTwitter />
            </a>
          </li>
          <li className="list-inline-item">

            <a className="btn px-2 btn-sm bg-linkedin" href="#">
              <FaLinkedinIn className="fab fa-fw fa-linkedin-in" />
            </a>
          </li>
        </ul>
      </CardBody>
    </Card>
  )
}

const EducationCard = () => {
  return (
    <Card className="card-body shadow p-4 mb-4">
      <h4 className="mb-3">Education</h4>
      <div className="d-flex align-items-center mb-4">
        <span className="icon-md mb-0 bg-light rounded-3">
          <FaGraduationCap />
        </span>
        <div className="ms-3">
          <h6 className="mb-0">Harvard University</h6>
          <p className="mb-0 small">Bachelor in Computer Graphics</p>
        </div>
      </div>
      <div className="d-flex align-items-center mb-4">
        <span className="icon-md mb-0 bg-light rounded-3">
          <FaGraduationCap />
        </span>
        <div className="ms-3">
          <h6 className="mb-0">University of Toronto</h6>
          <p className="mb-0 small">Master in Computer Graphics</p>
        </div>
      </div>
      <div className="d-flex align-items-center mb-4">
        <span className="icon-md mb-0 bg-light rounded-3">
          <FaGraduationCap />
        </span>
        <div className="ms-3">
          <h6 className="mb-0">East Ray University</h6>
          <p className="mb-0 small">Bachelor in Computer Graphics</p>
        </div>
      </div>
      <hr />
      <h4 className="mb-3">Skills</h4>
      <div className="overflow-hidden mb-4">
        <h6 className="uppercase">Graphic design</h6>
        <div className="progress progress-sm bg-primary bg-opacity-10">
          <div
            className="progress-bar bg-primary aos"
            role="progressbar"
            data-aos="slide-right"
            data-aos-delay={200}
            data-aos-duration={1000}
            data-aos-easing="ease-in-out"
            style={{ width: '90%' }}
            aria-valuenow={90}
            aria-valuemin={0}
            aria-valuemax={100}>
            <span className="progress-percent-simple h6 mb-0">90%</span>
          </div>
        </div>
      </div>
      <div className="overflow-hidden mb-4">
        <h6 className="uppercase">Web design</h6>
        <div className="progress progress-sm bg-success bg-opacity-10">
          <div
            className="progress-bar bg-success aos"
            role="progressbar"
            data-aos="slide-right"
            data-aos-delay={200}
            data-aos-duration={1000}
            data-aos-easing="ease-in-out"
            style={{ width: '80%' }}
            aria-valuenow={80}
            aria-valuemin={0}
            aria-valuemax={100}>
            <span className="progress-percent-simple h6 mb-0">80%</span>
          </div>
        </div>
      </div>
      <div className="overflow-hidden mb-4">
        <h6 className="uppercase">HTML/CSS</h6>
        <div className="progress progress-sm bg-warning bg-opacity-15">
          <div
            className="progress-bar bg-warning aos"
            role="progressbar"
            data-aos="slide-right"
            data-aos-delay={200}
            data-aos-duration={1000}
            data-aos-easing="ease-in-out"
            style={{ width: '60%' }}
            aria-valuenow={60}
            aria-valuemin={0}
            aria-valuemax={100}>
            <span className="progress-percent-simple h6 mb-0">60%</span>
          </div>
        </div>
      </div>
      <div className="overflow-hidden mb-4">
        <h6 className="uppercase">UI/UX</h6>
        <div className="progress progress-sm bg-danger bg-opacity-10">
          <div
            className="progress-bar bg-danger aos"
            role="progressbar"
            data-aos="slide-right"
            data-aos-delay={200}
            data-aos-duration={1000}
            data-aos-easing="ease-in-out"
            style={{ width: '50%' }}
            aria-valuenow={50}
            aria-valuemin={0}
            aria-valuemax={100}>
            <span className="progress-percent-simple h6 mb-0">50%</span>
          </div>
        </div>
      </div>
    </Card>
  )
}

const InstructorDetails = () => {
  return (
    <section className="pt-5 pb-0">
      <Container>
        <Row className="g-0 g-lg-5">
          <Col lg={4}>
            <Row>
              <Col md={6} lg={12}>
                <InstructorDetailCard />
              </Col>
              <Col md={6} lg={12}>
                <EducationCard />
              </Col>
            </Row>
          </Col>
          <Col lg={8}>
            <h5 className="mb-0">Hi, I am</h5>
            <h1 className="mb-0">Lori Stevens</h1>
            <p>Graphic Designer</p>
            <p className="mt-4">
              Satisfied conveying a dependent contented he gentleman agreeable do be. Warrant private blushes removed an in equally totally if.
              Delivered dejection necessary objection do Mr prevailed. Mr feeling does chiefly cordial in do.
            </p>
            <p>
              We focus a great deal on the understanding of behavioral psychology and influence triggers which are crucial for becoming a well-rounded
              Digital Marketer. We understand that theory is important to build a solid foundation, we understand that theory alone isn’t going to get
              the job done so that’s why this course is packed with practical hands-on examples that you can follow step by step.
            </p>
            <ul className="list-group list-group-borderless">
              <li className="list-group-item px-0">
                <span className="h6 fw-light">
                  <FaMapMarkerAlt className="text-primary me-1 me-sm-3" />
                  Address:
                </span>
                <span>2002 Horton Ford Rd, Eidson, TN, 37731</span>
              </li>
              <li className="list-group-item px-0">
                <span className="h6 fw-light">
                  <FaEnvelope className="text-primary me-1 me-sm-3" />
                  Email:
                </span>
                <span>example@gmail.com</span>
              </li>
              <li className="list-group-item px-0">
                <span className="h6 fw-light">
                  <FaHeadphones className="text-primary me-1 me-sm-3" />
                  Phone number:
                </span>
                <span>+896-789-546</span>
              </li>
              <li className="list-group-item px-0">
                <span className="h6 fw-light">
                  <FaGlobe className="text-primary me-1 me-sm-3" />
                  Website:
                </span>
                <span>https://stackbros.in/</span>
              </li>
            </ul>

            <Counter />
            <Row className="g-4 mt-4">
              <h2>Courses List</h2>
              <CoursesList />
            </Row>
          </Col>
        </Row>
      </Container>
      <RelatedInstructors />
    </section>
  )
}
export default InstructorDetails
