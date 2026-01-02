import { Card, Col, Container, Row } from 'react-bootstrap'
import { topITCourses, type ITCourseType } from '../data'

const CourseCard = ({ course }: { course: ITCourseType }) => {
  const { courses, image, name } = course
  return (
    <Card className="card-metro overflow-hidden rounded-3">
      <img src={image} alt="course" />
      <div className="card-img-overlay d-flex">
        <div className="mt-auto card-text">
          <a href="#" className="text-white mt-auto h5 stretched-link">
            {name}
          </a>
          <div className="text-white">{courses} Courses</div>
        </div>
      </div>
    </Card>
  )
}

const TopCourses = () => {
  return (
    <section>
      <Container>
        <Row className="mb-4">
          <Col lg={8} className="text-center mx-auto">
            <h2 className="fs-1">Top Courses for IT</h2>
            <p className="mb-0">Information Technology Courses to expand your skills and boost your career &amp; salary</p>
          </Col>
        </Row>
        <Row className="g-4">
          {topITCourses.map((course, idx) => (
            <Col sm={6} lg={4} xl={3} key={idx}>
              <CourseCard course={course} />
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  )
}

export default TopCourses
