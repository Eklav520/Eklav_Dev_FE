import { currency } from '@/context/constants'
import { getAllCourses } from '@/helpers/data'
import type { CourseType } from '@/types/other'
import { toAlphaNumber } from '@/utils/change-casing'

import { useFetchData } from '@/hooks/useFetchData'
import { Button, Card, CardBody, CardTitle, Col, Container, Row } from 'react-bootstrap'
import { FaCircle, FaShoppingCart, FaStar, FaSync, FaUserGraduate } from 'react-icons/fa'
import { Link } from 'react-router-dom'

const FeatureCourseCard = ({ course }: { course: CourseType }) => {
  const { studentImage, label, rating, students, price, avatar, title } = course
  return (
    <Card className="p-2 shadow h-100">
      <div className="rounded-top overflow-hidden">
        <div className="card-overlay-hover">
          <img src={studentImage} className="card-img-top" alt="course image" />
        </div>
        <div className="card-img-overlay">
          <div className="card-element-hover d-flex justify-content-end">
            <a href="#" className="icon-md bg-white rounded-circle">
              <FaShoppingCart className="text-danger" />
            </a>
          </div>
        </div>
      </div>
      <CardBody className="px-2">
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
        <CardTitle as="h6">
          <Link to="">{title}</Link>
        </CardTitle>
        <div className="d-flex justify-content-between align-items-center mb-0">
          <div>
            <a href="#" className="badge bg-info bg-opacity-10 text-info me-2">
              <FaCircle className="small fw-bold" /> {label}
            </a>
          </div>
          <h5 className="text-success mb-0">
            {currency}
            {price}
          </h5>
        </div>
      </CardBody>
    </Card>
  )
}

const FeaturedCourses = () => {
  const allFeaturedCourses = useFetchData(getAllCourses)
  return (
    <section className="pt-0 pt-md-5">
      <Container>
        <Row className="mb-4">
          <Col lg={8} className="text-center mx-auto">
            <h2 className="fs-1 mb-0">Featured Courses</h2>
            <p className="mb-0">Explore top picks of the week </p>
          </Col>
        </Row>
        <Row className="g-4">
          {allFeaturedCourses?.slice(0, 8).map((course, idx) => (
            <Col md={6} lg={4} xxl={3} key={idx}>
              <FeatureCourseCard course={course} />
            </Col>
          ))}
        </Row>
        <div className="text-center mt-5">
          <Button variant="primary-soft">
            View more
            <FaSync className="ms-2" />
          </Button>
        </div>
      </Container>
    </section>
  )
}

export default FeaturedCourses
