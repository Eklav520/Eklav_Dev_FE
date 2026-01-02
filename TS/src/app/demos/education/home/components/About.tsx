import { Col, Container, Row } from 'react-bootstrap'

import about3 from '@/assets/images/about/03.jpg'

import { features } from '../data'
import clsx from 'clsx'

const About = () => {
  return (
    <section>
      <Container>
        <Row className="g-4 align-items-center">
          <Col lg={5}>
            <h2>
              Find Out More About us, <span className="text-warning">Eklav</span> insides.
            </h2>
            <img src={about3} className="rounded-2" alt="" />
          </Col>
          <Col lg={7}>
            <Row className="g-4">
              {features.map((feature, idx) => {
                const Icon = feature.icon
                return (
                  <Col sm={6} key={idx}>
                    <div className={clsx('icon-lg bg-opacity-10 rounded-2', feature.variant)}>
                      <Icon className="fs-5" />
                    </div>
                    <h5 className="mt-2">{feature.title}</h5>
                    <p className="mb-0">{feature.description}</p>
                  </Col>
                )
              })}
            </Row>
          </Col>
        </Row>
      </Container>
    </section>
  )
}

export default About
