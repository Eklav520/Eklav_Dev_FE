import PageMetaData from '@/components/PageMetaData'
import { Col, Row } from 'react-bootstrap'
import AllReviews from './components/AllReviews'
import CoursesList from './components/CoursesList'
import InstructorCharts from './components/InstructorCharts'
import PersonalInformation from './components/PersonalInformation'

const InstructorDetailPage = () => {
  return (
    <>
      <PageMetaData title="Instructor Details" />
      <Row>
        <Col xs={12} className="mb-3">
          <h1 className="h3 mb-2 mb-sm-0">Instructor detail</h1>
        </Col>
      </Row>
      <Row className="g-4">
        <PersonalInformation />
        <InstructorCharts />
        <CoursesList />
        <AllReviews />
      </Row>
    </>
  )
}

export default InstructorDetailPage
