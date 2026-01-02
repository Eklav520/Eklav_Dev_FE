import { getAllCategories } from '@/helpers/data'
import { useFetchData } from '@/hooks/useFetchData'
import type { CategoryType } from '@/types/other'
import clsx from 'clsx'

import { Card, Col, Container, Row } from 'react-bootstrap'

const CategoryCard = ({ category }: { category: CategoryType }) => {
  const { courses, image, title, variant } = category
  return (
    <Card className={clsx('card-body  bg-opacity-10 text-center position-relative btn-transition p-4', variant)}>
      <div className="icon-xl bg-body mx-auto rounded-circle mb-3">
        <img src={image} alt="category-image" />
      </div>
      <h5 className="mb-2">
        <a href="#" className="stretched-link">
          {title}
        </a>
      </h5>
      <h6 className="mb-0">{courses} Courses</h6>
    </Card>
  )
}

const CourseCategories = () => {
  const allCategories = useFetchData(getAllCategories)
  return (
    <section>
      <Container>
        <Row className="mb-4">
          <Col lg={8} className="mx-auto text-center">
            <h2>Choose a Categories</h2>
            <p className="mb-0">Perceived end knowledge certainly day sweetness why cordially</p>
          </Col>
        </Row>
        <Row className="g-4">
          {allCategories?.map((category, idx) => (
            <Col sm={6} md={4} xl={3} key={idx}>
              <CategoryCard category={category} />
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  )
}

export default CourseCategories
