import { Col, Row } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import CourseEarning from './Components/CourseEarning'
import MarketingCourse from './Components/MarketingCourse'
import StudentReview from './Components/StudentReview'

const page = () => {
  return (
    <>
      <Row className="mb-3">
        <Col xs={12} className="d-sm-flex justify-content-between align-items-center">
          <h1 className="h3 mb-2 mb-sm-0">Course Details</h1>
          <Link to="/admin/edit-course" className="btn btn-sm btn-primary mb-0">
            Edit Course
          </Link>
        </Col>
      </Row>
      <Row className="g-4">
        <MarketingCourse />
        <CourseEarning />
        <StudentReview />
      </Row>
    </>
  )
}

export default page
