import ChoicesFormInput from '@/components/form/ChoicesFormInput'
import { Button, Col, Container, FormControl, Row } from 'react-bootstrap'
import { FaSearch } from 'react-icons/fa'
import Pagination from './Pagination'
import { getAllCourses } from '@/helpers/data'
import CourseCard from './CourseCard'
import { useFetchData } from '@/hooks/useFetchData'

const CourseList = () => {
  const allCourses = useFetchData(getAllCourses)
  return (
    <section className="pt-5">
      <Container>
        <Row className="mb-4 align-items-center">
          <Col sm={6} xl={4}>
            <form className="border rounded p-2">
              <div className="input-group input-borderless">
                <FormControl className="me-1" type="search" placeholder="Search course" />
                <Button variant="primary" type="button" className="mb-0 rounded">
                  <FaSearch />
                </Button>
              </div>
            </form>
          </Col>
          <Col sm={6} xl={3} className="mt-3 mt-lg-0">
            <form className="border rounded p-2 input-borderless">
              <ChoicesFormInput className="form-select form-select-sm js-choice" aria-label=".form-select-sm">
                <option>Category</option>
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
            </form>
          </Col>
          <Col sm={6} xl={3} className="mt-3 mt-xl-0">
            <form className="border rounded p-2 input-borderless">
              <ChoicesFormInput className="form-select form-select-sm js-choice" aria-label=".form-select-sm">
                <option>Sort by</option>
                <option>Free</option>
                <option>Most viewed</option>
                <option>Popular</option>
              </ChoicesFormInput>
            </form>
          </Col>
          <Col sm={6} xl={2} className="mt-3 mt-xl-0 d-grid">
            <Button variant="primary" size="lg" className="mb-0">
              Filter Results
            </Button>
          </Col>
        </Row>
        <Row className="g-4 justify-content-center">
          {allCourses?.slice(0, 10).map((course, idx) => (
            <Col lg={10} xxl={6} key={idx}>
              <CourseCard course={course} />
            </Col>
          ))}
        </Row>
        <Col xs={12}>
          <Pagination />
        </Col>
      </Container>
    </section>
  )
}

export default CourseList
