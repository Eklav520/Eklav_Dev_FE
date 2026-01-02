import { socialMediaLinks } from '@/assets/data/footer-items'
import ChoicesFormInput from '@/components/form/ChoicesFormInput'
import { getAllInstructors } from '@/helpers/data'
import type { InstructorType } from '@/types/other'
import clsx from 'clsx'

import { Link } from 'react-router-dom'
import { Button, Card, CardBody, CardTitle, Col, Container, Row } from 'react-bootstrap'
import { FaSearch, FaStar } from 'react-icons/fa'
import Pagination from './Pagination'
import { useFetchData } from '@/hooks/useFetchData'

const InstructorCard = ({ instructor }: { instructor: InstructorType }) => {
  const { image, name, college, department, description, rating } = instructor
  return (
    <Card className="shadow p-2">
      <Row className="g-0">
        <Col ms={4}>
          <img src={image} className="rounded-3" alt="..." />
        </Col>
        <Col md={8}>
          <CardBody>
            <div className="d-sm-flex justify-content-sm-between mb-2 mb-sm-3">
              <div>
                <CardTitle className="mb-0">
                  <a href="#">{name}</a>
                </CardTitle>
                <p className="small mb-2 mb-sm-0">Professor at {college}</p>
              </div>
              <span className="h6 fw-light">
                {rating}
                <FaStar className="text-warning ms-1" />
              </span>
            </div>
            <p className="text-truncate-2 mb-3">{description}</p>
            <div className="d-sm-flex justify-content-sm-between align-items-center">
              <h6 className="text-orange mb-0">{department}</h6>
              <ul className="list-inline mb-0 mt-3 mt-sm-0">
                {socialMediaLinks.map((social, idx) => {
                  const Icon = social.icon
                  return (
                    <li className="list-inline-item" key={idx}>
                      <Link className={clsx('mb-0 me-1', social.variant)} to="">
                        <Icon />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          </CardBody>
        </Col>
      </Row>
    </Card>
  )
}

const InstructorLists = () => {
  const allInstructors = useFetchData(getAllInstructors)
  return (
    <section className="pt-4">
      <Container>
        <Row className="mb-4 align-items-center">
          <Col sm={6} xl={4}>
            <form className="border rounded p-2">
              <div className="input-group input-borderless">
                <input className="form-control me-1" type="search" placeholder="Search instructor" />
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
                <option>Most popular</option>
                <option>Most viewed</option>
                <option>Top rated</option>
              </ChoicesFormInput>
            </form>
          </Col>
          <Col sm={6} xl={2} className="mt-3 mt-xl-0 d-grid">
            <Button size="lg" variant="primary" className="mb-0">
              Filter Results
            </Button>
          </Col>
        </Row>
        <Row className="g-4 justify-content-center">
          {allInstructors?.map((instructor, idx) => (
            <Col lg={10} xl={6} key={idx}>
              <InstructorCard instructor={instructor} />
            </Col>
          ))}
        </Row>
        <Pagination />
      </Container>
    </section>
  )
}
export default InstructorLists
