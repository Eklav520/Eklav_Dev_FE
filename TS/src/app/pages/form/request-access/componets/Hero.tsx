import avatar1 from '@/assets/images/avatar/01.jpg'
import avatar2 from '@/assets/images/avatar/02.jpg'
import avatar3 from '@/assets/images/avatar/03.jpg'
import avatar4 from '@/assets/images/avatar/04.jpg'
import avatar5 from '@/assets/images/avatar/05.jpg'
import Image16 from '@/assets/images/element/16.svg'
import { Col, Container, Row } from 'react-bootstrap'
import { FaRegStar, FaStar, FaStarHalfAlt } from 'react-icons/fa'

const Hero = () => {
  return (
    <section className="bg-primary bg-opacity-10">
      <Container>
        <Row className="g-4 g-sm-5 align-items-center py-4">
          <Col lg={6} xl={5}>
            <h1>Access to Free Online Courses</h1>
            <form className="row align-items-center justify-content-center my-4">
              <Col xs={12}>
                <p className="mb-2 h6 fw-light">Enter your email address to get access</p>
                <div className="bg-body shadow rounded-3 p-2">
                  <div className="input-group">
                    <input className="form-control border-0 me-1" type="email" placeholder="Enter your email" />
                    <button type="button" className="btn btn-blue mb-0 rounded-3">
                      Request access!
                    </button>
                  </div>
                </div>
              </Col>
            </form>
            <div className="d-sm-flex justify-content-sm-between align-items-center">
              <div>
                <ul className="avatar-group mb-3 mb-sm-0">
                  <li className="avatar avatar-sm">
                    <img src={avatar1} className="avatar-img rounded-circle" alt="avatar" />
                  </li>
                  <li className="avatar avatar-sm">
                    <img src={avatar2} className="avatar-img rounded-circle" alt="avatar" />
                  </li>
                  <li className="avatar avatar-sm">
                    <img src={avatar3} className="avatar-img rounded-circle" alt="avatar" />
                  </li>
                  <li className="avatar avatar-sm">
                    <img src={avatar4} className="avatar-img rounded-circle" alt="avatar" />
                  </li>
                  <li className="avatar avatar-sm">
                    <img src={avatar5} className="avatar-img rounded-circle" alt="avatar" />
                  </li>
                  <li className="avatar avatar-sm">
                    <div className="avatar-img rounded-circle bg-primary">
                      <span className="text-white position-absolute top-50 start-50 translate-middle small">1K+</span>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="d-flex align-items-center">
                <h5 className="mb-0 me-2">4.5/5.0</h5>
                <ul className="list-inline mb-1">
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
              </div>
            </div>
          </Col>
          <Col lg={6} xl={7} className=" text-center">
            <img className="w-auto" height={494} src={Image16} alt="decoration" />
          </Col>
        </Row>
      </Container>
    </section>
  )
}

export default Hero
