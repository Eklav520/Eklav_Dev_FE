import ChoicesFormInput from '@/components/form/ChoicesFormInput'
import { getAllCourses } from '@/helpers/data'
import { useFetchData } from '@/hooks/useFetchData'
import useToggle from '@/hooks/useToggle'
import useViewPort from '@/hooks/useViewPort'
import { CourseType } from '@/types/other'
import { Button, Col, Container, Offcanvas, OffcanvasBody, OffcanvasHeader, OffcanvasTitle, Row } from 'react-bootstrap'
import { FaListUl, FaSlidersH, FaThLarge } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import CourseCard from './CourseCard'
import CourseFilter from './CourseFilter'
import Pagination from './Pagination'

const CourseList = () => {
  const { isTrue: isOpen, toggle } = useToggle()
  const { width } = useViewPort()
  const allCourses = useFetchData<CourseType[]>(getAllCourses)
  return (
    <section className="pb-0 py-sm-5">
      <Container>
        <Row className="g-3 align-items-center mb-4">
          <Col md={4}>
            <h4 className="mb-0">Showing 1-7 of 32 result</h4>
          </Col>
          <Col md={8}>
            <Row className="g-3 align-items-center justify-content-md-end me-auto">
              <Col sm={4} xl={6} className="text-md-end d-none d-md-block">
                <ul className="list-inline mb-0">
                  <li className="list-inline-item">
                    <Link to="/pages/course/grid" className="btn btn-outline-light mb-0 me-2">
                      <FaThLarge className="fa-fw" />
                    </Link>
                  </li>
                  <li className="list-inline-item">
                    <Link to="/pages/course/list" className="btn btn-outline-light mb-0 me-2">
                      <FaListUl className="fa-fw" />
                    </Link>
                  </li>
                </ul>
              </Col>
              <form className="col-md-4 border rounded p-1 input-borderless">
                <ChoicesFormInput className="form-select js-choice z-index-9" aria-label=".form-select-sm">
                  <option>Sort by</option>
                  <option>Free</option>
                  <option>Newest</option>
                  <option>Most popular</option>
                  <option>Most Viewed</option>
                </ChoicesFormInput>
              </form>
              <Col xs={4} className="text-md-end">
                <Button
                  onClick={toggle}
                  variant="primary"
                  className="mb-0 d-xl-none"
                  type="button"
                  data-bs-toggle="offcanvas"
                  data-bs-target="#offcanvasSidebar"
                  aria-controls="offcanvasSidebar">
                  <FaSlidersH className="me-1" /> Show filter
                </Button>
              </Col>
            </Row>
          </Col>
        </Row>
        <Row>
          <Col xl={9} xxl={8}>
            <Row className="g-4">
              {allCourses?.slice(0, 4).map((course, idx) => (
                <Col xs={12} key={idx}>
                  <CourseCard course={course} />
                </Col>
              ))}
            </Row>
            <Col xs={12}>
              <Pagination />
            </Col>
          </Col>
          <Col lg={3} xxl={4}>
            {width >= 1200 ? (
              <>
                <CourseFilter />
                <div className="d-grid p-2 p-xl-0 bg-body text-center">
                  <Button variant="primary" className="btn btn-primary mb-0">
                    Filter Results
                  </Button>
                </div>
              </>
            ) : (
              <Offcanvas show={isOpen} onHide={toggle} placement="end" className="offcanvas-xl offcanvas-end" tabIndex={-1} id="offcanvasSidebar">
                <OffcanvasHeader className="bg-light" closeButton>
                  <OffcanvasTitle as="h5" id="offcanvasNavbarLabel">
                    Advance Filter
                  </OffcanvasTitle>
                </OffcanvasHeader>
                <OffcanvasBody className="p-3 p-xl-0">
                  <CourseFilter />
                </OffcanvasBody>
                <div className="d-grid p-2 p-xl-0 bg-body text-center">
                  <Button variant="primary" className="btn btn-primary mb-0">
                    Filter Results
                  </Button>
                </div>
              </Offcanvas>
            )}
          </Col>
        </Row>
      </Container>
    </section>
  )
}

export default CourseList
