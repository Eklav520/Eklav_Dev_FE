import { Button, Col, Container, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Row } from 'react-bootstrap'
import { FaCopy, FaFacebookSquare, FaLinkedin, FaSignal, FaStar, FaTwitterSquare, FaUserGraduate } from 'react-icons/fa'
import CourseTab from './CourseTab'

import avatar5 from '@/assets/images/avatar/05.jpg'
import AllPlayList from './AllPlayList'

const CourseDetails = () => {
  const tags = ['blog', 'business', 'theme', 'bootstrap', 'data science', 'web development', 'tips', 'machine learning']

  return (
    <section className="pt-0">
      <Container>
        <Row className="g-lg-5">
          <Col lg={8}>
            <Row className="g-4">
              <Col xs={12}>
                <h1>The Complete Digital Marketing Course - 12 Courses in 1</h1>
                <ul className="list-inline mb-0">
                  <li className="list-inline-item h6 me-3 mb-1 mb-sm-0">
                    <FaStar className="text-warning me-2" />
                    4.5/5.0
                  </li>
                  <li className="list-inline-item h6 me-3 mb-1 mb-sm-0">
                    <FaUserGraduate className="text-orange me-2" />
                    12k Enrolled
                  </li>
                  <li className="list-inline-item h6 me-3 mb-1 mb-sm-0">
                    <FaSignal className="text-success me-2" />
                    All levels
                  </li>
                </ul>
              </Col>
              <Col xs={12}>
                <div className="d-sm-flex justify-content-sm-between align-items-center">
                  <div className="d-flex align-items-center">
                    <div className="avatar avatar-lg">
                      <img className="avatar-img rounded-circle" src={avatar5} alt="avatar" />
                    </div>
                    <div className="ms-3">
                      <h6 className="mb-0">
                        <a href="#">By Jacqueline Miller</a>
                      </h6>
                      <p className="mb-0 small">Founder Eklav company</p>
                    </div>
                  </div>
                  <div className="d-flex mt-2 mt-sm-0">
                    <Button variant="danger-soft" size="sm" className="mb-0" href="#">
                      Follow
                    </Button>
                    <Dropdown className="ms-2">
                      <DropdownToggle
                        size="sm"
                        className="btn arrow-none border-0 py-2 mb-0 btn-info-soft small"
                        role="button"
                        id="dropdownShare"
                        aria-expanded="false">
                        share
                      </DropdownToggle>
                      <DropdownMenu className="dropdown-w-sm dropdown-menu-end min-w-auto shadow rounded" aria-labelledby="dropdownShare">
                        <li>
                          <DropdownItem href="">
                            <FaTwitterSquare className="me-2" />
                            Twitter
                          </DropdownItem>
                        </li>
                        <li>
                          <DropdownItem href="">
                            <FaFacebookSquare className="me-2" />
                            Facebook
                          </DropdownItem>
                        </li>
                        <li>
                          <DropdownItem href="">
                            <FaLinkedin className="me-2" />
                            LinkedIn
                          </DropdownItem>
                        </li>
                        <li>
                          <DropdownItem href="">
                            <FaCopy className="me-2" />
                            Copy link
                          </DropdownItem>
                        </li>
                      </DropdownMenu>
                    </Dropdown>
                  </div>
                </div>
              </Col>
              <Col xs={12}>
                <CourseTab />
              </Col>
            </Row>
          </Col>
          <Col lg={4}>
            <AllPlayList />
            <div className="mt-4">
              <h4 className="mb-3">Tags</h4>
              <ul className="list-inline mb-0">
                {tags.map((tag, idx) => (
                  <li className="list-inline-item" key={idx}>

                    <Button variant="outline-light" size="sm">
                      {tag}
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  )
}

export default CourseDetails
