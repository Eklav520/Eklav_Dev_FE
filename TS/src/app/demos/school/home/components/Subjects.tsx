import { Card, CardBody, CardHeader, Col, Container, Row } from 'react-bootstrap'
import { subjects, type SubjectType } from '../data'

import clsx from 'clsx'

const SubjectCard = ({ subject }: { subject: SubjectType }) => {
  const { grades, image, lessons, title, variant } = subject
  return (
    <Card className={clsx('bg-opacity-50 p-4 overflow-hidden h-100', variant)}>
      <CardHeader className="bg-transparent p-0">
        <h6>{grades}</h6>
      </CardHeader>
      <CardBody className="p-0 mt-3">
        <h3 className="mb-2">
          <a href="#" className="stretched-link">
            {title}
          </a>
        </h3>
        <h6 className="lead">{lessons} Lessons</h6>
        <img src={image} className="opacity-5 mb-n5" alt="element-image" />
      </CardBody>
    </Card>
  )
}

const Subjects = () => {
  return (
    <section>
      <Container>
        <Row className="g-4">
          {subjects.map((subject, idx) => (
            <Col sm={6} lg={3} key={idx}>
              <SubjectCard subject={subject} />
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  )
}

export default Subjects
