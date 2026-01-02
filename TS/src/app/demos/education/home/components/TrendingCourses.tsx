import { currency } from '@/context/constants'
import { getAllCourses } from '@/helpers/data'
import type { CourseType } from '@/types/other'
import { toAlphaNumber } from '@/utils/change-casing'

import { Link } from 'react-router-dom'
import { Button, Card, CardBody, CardTitle, Col, Container, Row } from 'react-bootstrap'
import { FaCircle, FaShoppingCart, FaStar, FaSync, FaUserGraduate } from 'react-icons/fa'
import { useFetchData } from '@/hooks/useFetchData'

const CourseCard = ({ course }: { course: CourseType }) => {
  const { avatar, studentImage, label, price, rating, title, students } = course
  return (
    <Card className="p-2 shadow h-100">
      <div className="rounded-top overflow-hidden">
        <div className="card-overlay-hover">
          <img src={studentImage} className="card-img-top" alt="course image" />
        </div>
        <div className="card-img-overlay">
          <div className="card-element-hover d-flex justify-content-end">
            <a href="#" className="icon-md bg-white rounded-circle text-center">
              <FaShoppingCart className="text-danger" />
            </a>
          </div>
        </div>
      </div>
      <CardBody>
        <div className="d-flex justify-content-between">
          <ul className="list-inline hstack gap-2 mb-0">
            <li className="list-inline-item d-flex justify-content-center align-items-center">
              <div className="icon-md bg-orange bg-opacity-10 text-orange rounded-circle">
                <FaUserGraduate />
              </div>
              <span className="h6 fw-light mb-0 ms-2">{toAlphaNumber(students)}</span>
            </li>
            <li className="list-inline-item d-flex justify-content-center align-items-center">
              <div className="icon-md bg-warning bg-opacity-15 text-warning rounded-circle">
                <FaStar />
              </div>
              <span className="h6 fw-light mb-0 ms-2">{rating.star}</span>
            </li>
          </ul>
          <div className="avatar avatar-sm">
            <img className="avatar-img rounded-circle" src={avatar} alt="avatar" />
          </div>
        </div>
        <hr />
        <CardTitle>
          <Link to="">{title}</Link>
        </CardTitle>
        <div className="d-flex justify-content-between align-items-center mb-0">
          <a href="#" className="badge bg-info bg-opacity-10 text-info me-2">
            <FaCircle className="fw-bold" /> {label}
          </a>
          <h3 className="text-success mb-0">
            {currency}
            {price}
          </h3>
        </div>
      </CardBody>
    </Card>
  )
}

const TrendingCourses = () => {
  const trendingCourses = useFetchData(getAllCourses)
  return (
    <section className="pt-0 pt-md-5">
      <Container>
        <Row>
          <Col lg={8} className="mb-4">
            <h2 className="mb-0">
              Our <span className="text-warning">Trending</span> Courses
            </h2>
            <p className="mb-0">Check out most 🔥 courses in the market</p>
          </Col>
        </Row>
        <Row className="g-4">
          {trendingCourses?.slice(0, 6).map((course, idx) => (
            <Col md={6} xl={4} key={idx}>
              <CourseCard course={course} />
            </Col>
          ))}
        </Row>
        <div className="text-center mt-5">
          <Button variant="primary-soft" className="mb-0">
            View more
            <FaSync className="ms-2" />
          </Button>
        </div>
      </Container>
    </section>
  )
}

export default TrendingCourses
