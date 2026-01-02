import { getAllInstructors } from '@/helpers/data'
import type { InstructorType } from '@/types/other'

import { Link } from 'react-router-dom'
import { Card, CardBody, CardTitle, Col, Container, Row } from 'react-bootstrap'
import { BsStarFill } from 'react-icons/bs'
import { useFetchData } from '@/hooks/useFetchData'

const InstructorCard = ({ instructor }: { instructor: InstructorType }) => {
  const { image, rating, name, title } = instructor
  return (
    <Card className="p-2 shadow h-100">
      <div className="card-image-scale rounded-3 position-relative">
        <img src={image} className="card-img" alt="instructor" />
        <div className="card-img-overlay d-flex flex-column p-2 z-index-1">
          <div>
            <span className="badge text-bg-dark">
              <BsStarFill className="text-warning me-2" />
              {rating}
            </span>
          </div>
        </div>
      </div>
      <CardBody className="px-2">
        <CardTitle>
          <Link to="/workshop/detail" className="stretched-link">
            {title}
          </Link>
        </CardTitle>
        <h6 className="mb-0 fw-normal">With {name}</h6>
      </CardBody>
    </Card>
  )
}

const Instructors = () => {
  const allInstructors = useFetchData(getAllInstructors)
  return (
    <section>
      <Container>
        <Row className="mb-4">
          <Col md={8} className="text-center mx-auto">
            <h2 className="fs-1">Featured Courses With Their Instructors</h2>
            <p className="mb-0">Space is limited. Reserve your spot today!</p>
          </Col>
        </Row>
        <Row className="g-4">
          {allInstructors?.map((instructor, idx) => (
            <Col sm={6} lg={4} xl={3} key={idx}>
              <InstructorCard instructor={instructor} />
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  )
}

export default Instructors
