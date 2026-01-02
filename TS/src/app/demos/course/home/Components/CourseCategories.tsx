import clsx from 'clsx'
import { Card, Col, Container, Row } from 'react-bootstrap'
import { courseCategories, type CategoryType } from '../data'

const CategoryCard = ({ courses, icon, title, variant }: CategoryType) => {
  const Icon = icon
  return (
    <Card className="card-body shadow rounded-3">
      <div className="d-flex align-items-center">
        <div className={clsx('icon-lg bg-opacity-10 rounded-circle', variant)}>
          <Icon />
        </div>
        <div className="ms-3">
          <h5 className="mb-0">
            <a href="#" className="stretched-link">
              {title}
            </a>
          </h5>
          <span>{courses} Courses</span>
        </div>
      </div>
    </Card>
  )
}

const CourseCategories = () => {
  return (
    <section>
      <Container>
        <Row className="g-4">
          {courseCategories.map((category, idx) => (
            <Col sm={6} lg={4} xl={3} key={idx}>
              <CategoryCard {...category} />
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  )
}

export default CourseCategories
