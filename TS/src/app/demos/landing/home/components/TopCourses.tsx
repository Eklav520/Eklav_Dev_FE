import { Col, Container, Row } from 'react-bootstrap'
import { topCoursesData } from '../data'

const TopCourses = () => {
  return (
    <section className="position-relative pb-0 pb-sm-5">
      <Container>
        <Row className="mb-4">
          <Col lg={8} className="mx-auto text-center">
            <h2>Top Listed Subjects</h2>
            <p className="mb-0">Perceived end knowledge certainly day sweetness why cordially</p>
          </Col>
        </Row>
        <Row className="g-4">
          {topCoursesData.map((course, idx) => (
            <Col sm={6} md={4} xl={3} key={idx}>
              <div className="bg-primary bg-opacity-10 rounded-3 text-center p-3 position-relative btn-transition">
                <div className="icon-xl bg-body mx-auto rounded-circle mb-3">
                  <img src={course.image} alt="course-image" />
                </div>
                <h5 className="mb-1">
                  <a href="#" className="stretched-link">
                    {course.name}
                  </a>
                </h5>
                <span className="mb-0">{course.courses} Course</span>
              </div>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  )
}

export default TopCourses
