import ChoicesFormInput from '@/components/form/ChoicesFormInput'
import { getAllCourses } from '@/helpers/data'
import { Button, Col, Container, FormControl, Row } from 'react-bootstrap'
import { FaSearch } from 'react-icons/fa'
import CourseCard from './CourseCard'
import Pagination from './Pagination'
import { useFetchData } from '@/hooks/useFetchData'

const Courses = () => {
  const allCourses = useFetchData(getAllCourses)
  return (
    <section className="pt-0">
      <Container>
        <form className="bg-light border p-4 rounded-3 my-4 z-index-9 position-relative">
          <Row className="g-3">
            <Col xl={3}>
              <FormControl className="me-1" type="search" placeholder="Enter keyword" />
            </Col>
            <Col xl={8}>
              <Row className="g-3">
                <Col sm={6} md={3} className="pb-2 pb-md-0">
                  <ChoicesFormInput className="form-select form-select-sm js-choice" aria-label=".form-select-sm example">
                    <option>Categories</option>
                    <option>All</option>
                    <option>Development</option>
                    <option>Design</option>
                    <option>Accounting</option>
                    <option>Translation</option>
                    <option>Finance</option>
                    <option>Legal</option>
                    <option>Photography</option>
                    <option>Writing</option>
                    <option>Marketing</option>
                  </ChoicesFormInput>
                </Col>
                <Col sm={6} md={3} className="pb-2 pb-md-0">
                  <ChoicesFormInput className="form-select form-select-sm js-choice" aria-label=".form-select-sm example">
                    <option>Price level</option>
                    <option>All</option>
                    <option>Free</option>
                    <option>Paid</option>
                  </ChoicesFormInput>
                </Col>
                <Col sm={6} md={3} className="pb-2 pb-md-0">
                  <ChoicesFormInput className="form-select form-select-sm js-choice" aria-label=".form-select-sm example">
                    <option>Skill level</option>
                    <option>All levels</option>
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </ChoicesFormInput>
                </Col>
                <Col sm={6} md={3} className="pb-2 pb-md-0">
                  <ChoicesFormInput className="form-select form-select-sm js-choice" aria-label=".form-select-sm example">
                    <option>Language</option>
                    <option>English</option>
                    <option>Francas</option>
                    <option>Russian</option>
                    <option>Hindi</option>
                    <option>Bengali</option>
                    <option>Spanish</option>
                  </ChoicesFormInput>
                </Col>
              </Row>
            </Col>
            <Col xl={1}>
              <Button variant="primary" type="button" className="mb-0 rounded z-index-1 w-100">
                <FaSearch />
              </Button>
            </Col>
          </Row>
        </form>
        <Row className="mt-3">
          <Col xs={12}>
            <Row className="g-4">
              {allCourses?.slice(0, 12).map((course, idx) => (
                <Col sm={6} lg={4} xl={3} key={idx}>
                  <CourseCard course={course} />
                </Col>
              ))}
            </Row>
            <Col xs={12}>
              <Pagination />
            </Col>
          </Col>
        </Row>
      </Container>
    </section>
  )
}

export default Courses
