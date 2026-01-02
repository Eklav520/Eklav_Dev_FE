import avatar9 from '@/assets/images/avatar/09.jpg'
import patternImg from '@/assets/images/pattern/04.png'
import { Card, Col, Container, Row } from 'react-bootstrap'
import { FaSlidersH } from 'react-icons/fa'
import { Link } from 'react-router-dom'

const Banner = ({ toggleOffCanvas }: { toggleOffCanvas: () => void }) => {
  return (
    <section className="pt-0">
      <Container fluid className="px-0">
        <Card
          className="bg-blue h-100px h-md-200px rounded-0"
          style={{ background: `url(${patternImg}) no-repeat center center`, backgroundSize: 'cover' }}></Card>
      </Container>
      <Container className="mt-n4">
        <Row>
          <Col xs={12}>
            <Card className="bg-transparent card-body pb-0 px-0 mt-2 mt-sm-0">
              <Row className="d-sm-flex justify-sm-content-between mt-2 mt-md-0">
                <Col xs={'auto'}>
                  <div className="avatar avatar-xxl position-relative mt-n3">
                    <img className="avatar-img rounded-circle border border-white border-3 shadow" src={avatar9} alt="avatar" />
                    <span className="badge text-bg-success rounded-pill position-absolute top-50 start-100 translate-middle mt-4 mt-md-5 ms-n3 px-md-3">
                      Pro
                    </span>
                  </div>
                </Col>
                <Col className="d-sm-flex justify-content-between align-items-center">
                  <div>
                    <h1 className="my-1 fs-4">Lori Stevens</h1>
                    <ul className="list-inline mb-0">
                      <li className="list-inline-item me-3 mb-1 mb-sm-0">
                        <span className="h6">255</span>
                        &nbsp;<span className="text-body fw-light">points</span>
                      </li>
                      <li className="list-inline-item me-3 mb-1 mb-sm-0">
                        <span className="h6">7</span>
                        &nbsp;<span className="text-body fw-light">Completed courses</span>
                      </li>
                      <li className="list-inline-item me-3 mb-1 mb-sm-0">
                        <span className="h6">52</span>
                        &nbsp; <span className="text-body fw-light">Completed lessons</span>
                      </li>
                    </ul>
                  </div>
                  <div className="mt-2 mt-sm-0">
                    <Link to="/student/course-list" className="btn btn-outline-primary mb-0">
                      View my courses
                    </Link>
                  </div>
                   <div className="mt-2 mt-sm-0">
                    <Link to="/student/course-list" className="btn btn-outline-primary mb-0">
                      View courses list
                    </Link>
                  </div>
                </Col>
              </Row>
            </Card>
            <hr className="d-xl-none" />
            <Col xs={12} xl={3} className="d-flex justify-content-between align-items-center">
              <a className="h6 mb-0 fw-bold d-xl-none" href="#">
                Menu
              </a>
              <button
                onClick={toggleOffCanvas}
                className="btn btn-primary d-xl-none"
                type="button"
                data-bs-toggle="offcanvas"
                data-bs-target="#offcanvasSidebar"
                aria-controls="offcanvasSidebar">
                <FaSlidersH />
              </button>
            </Col>
          </Col>
        </Row>
      </Container>
    </section>
  )
}

export default Banner
