import { Col, Container, Row } from 'react-bootstrap'
import { FaGlobe, FaRegStar, FaStar, FaStarHalfAlt, FaUserGraduate } from 'react-icons/fa'

const Intro = () => {
  return (
    <section className="bg-blue py-7">
      <Container>
        <Row className="justify-content-lg-between">
          <Col lg={8}>
            <h1 className="text-white">The Complete Digital Marketing Course - 12 Courses in 1</h1>
            <p className="text-white">
              Satisfied conveying a dependent contented he gentleman agreeable do be. Warrant private blushes removed an in equally totally if.
              Delivered dejection necessary objection do Mr prevailed. Mr feeling does chiefly cordial in do.
            </p>
            <ul className="list-inline mb-5">
              <li className="list-inline-item h6 me-4 mb-1 mb-sm-0 text-white">
                <span className="fw-light">By</span> Lori Stevens
              </li>
              <li className="list-inline-item me-4 mb-1 mb-sm-0">
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
                  <li className="list-inline-item ms-2 h6 text-white">4.5/5.0</li>
                  <li className="list-inline-item text-white">(1,586 reviews)</li>
                </ul>
              </li>
              <li className="list-inline-item h6 mb-0 text-white">
                <FaGlobe className="text-info me-2" />
                English
              </li>
            </ul>
          </Col>
          <Col lg={3}>
            <h6 className="text-white lead fw-light mb-3">
              <FaUserGraduate className="text-orange me-2" />
              12,155 already enrolled
            </h6>
            <a href="#" className="btn btn-warning mb-3 w-100">
              Enroll Course
            </a>
            <div className="overflow-hidden mb-4">
              <h6 className="text-white">Your Progress</h6>
              <div className="progress progress-sm bg-white bg-opacity-10 mb-1">
                <div
                  className="progress-bar bg-white aos"
                  role="progressbar"
                  data-aos="slide-right"
                  data-aos-delay={200}
                  data-aos-duration={1000}
                  data-aos-easing="ease-in-out"
                  style={{ width: '25%' }}
                  aria-valuenow={25}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
              <small className="text-white">08 of 135 Completed</small>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  )
}
export default Intro
