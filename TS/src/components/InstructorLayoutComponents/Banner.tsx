import avatar1 from '@/assets/images/avatar/01.jpg'
import patternImg from '@/assets/images/pattern/04.png'
import { Card, Col, Container, Row } from 'react-bootstrap'
import { BsPatchCheckFill } from 'react-icons/bs'
import { FaBook, FaSlidersH, FaStar, FaUserGraduate } from 'react-icons/fa'
import { Link } from 'react-router-dom'

const Banner = ({ toggleOffCanvas }: { toggleOffCanvas: () => void }) => {
  return (
    <section className="pt-0">
      <Container fluid className="px-0">
        <div
          className="bg-blue h-100px h-md-200px rounded-0"
          style={{ background: `url(${patternImg}) no-repeat center center`, backgroundSize: 'cover' }}></div>
      </Container>
      <Container className="mt-n4">
        <Row>
          <Col xs={12}>
            <Card className="bg-transparent card-body p-0">
              <Row className="d-flex justify-content-between">
                <Col xs={'auto'} className="mt-4 mt-md-0">
                  <div className="avatar avatar-xxl mt-n3">
                    <img className="avatar-img rounded-circle border border-white border-3 shadow" src={avatar1} alt="avatar" />
                  </div>
                </Col>
                <Col className="d-md-flex justify-content-between align-items-center mt-4">
                  <div>
                    <h1 className="my-1 fs-4">
                      Admin <BsPatchCheckFill className="text-info small" />
                    </h1>
                    {/* <ul className="list-inline mb-0">
                      <li className="list-inline-item h6 fw-light me-3 mb-1 mb-sm-0">
                        <FaStar className="text-warning me-2" />
                        4.5/5.0
                      </li>
                      <li className="list-inline-item h6 fw-light me-3 mb-1 mb-sm-0">
                        <FaUserGraduate className="text-orange me-2" />
                        12k Enrolled Students
                      </li>
                      <li className="list-inline-item h6 fw-light me-3 mb-1 mb-sm-0">
                        <FaBook className="text-purple me-2" />
                        25 Courses
                      </li>
                    </ul> */}
                  </div>
                  <div className="d-flex align-items-center mt-2 mt-md-0">
                    <a href="/instructor/create-course" className="btn btn-success mb-0" target="_blank" rel="noopener noreferrer">
                      Create a course
                    </a>
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
