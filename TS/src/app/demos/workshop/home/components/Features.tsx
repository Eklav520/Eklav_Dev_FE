import { Card, Col, Container, Row } from 'react-bootstrap'

import { features, type FeatureType } from '../data'

import element30 from '@/assets/images/element/30.svg'

const FeatureCard = ({ feature }: { feature: FeatureType }) => {
  const { description, icon, title } = feature
  return (
    <Card className="card-body bg-light p-4 h-100">
      <figure>{icon}</figure>
      <h5>{title}</h5>
      <p className="mb-0">{description}</p>
    </Card>
  )
}
const Features = () => {
  return (
    <section className="position-relative">
      <div className="position-absolute bottom-0 end-0">
        <img width={230} height={300} src={element30} className="h-300px" alt="element" />
      </div>
      <Container>
        <Row className="g-4">
          <Col sm={6} lg={4}>
            <h2>Why choose our classes</h2>
            <p className="mb-0">
              Comfort reached gay perhaps chamber his six detract besides add. Moonlight newspaper up its enjoyment agreeable depending.
            </p>
          </Col>
          {features.map((feature, idx) => (
            <Col sm={6} lg={4} key={idx}>
              <FeatureCard feature={feature} />
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  )
}

export default Features
