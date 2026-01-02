import { Card, Col, Container, Row } from 'react-bootstrap'
import { services } from '../data'

import { Link } from 'react-router-dom'
import { BsPatchCheckFill } from 'react-icons/bs'

const Services = () => {
  return (
    <section className="pt-4 pt-lg-5">
      <Container>
        <Row className="g-4">
          <Col sm={6} lg={12} xl={3}>
            <h2>Services that you need to know</h2>
            <p>The 1-hour demo will provide Happiness prosperous impression had conviction For every delay in their Extremity now, strangers</p>
          </Col>
          {services.map((service, idx) => (
            <Col sm={6} lg={4} xl={3} key={idx}>
              <Card className="card-body shadow h-100">
                <div className="d-flex align-items-center">
                  <img height={60} width={60} src={service.image} className="h-60px mb-2" alt="element" />
                  <div className="ms-3">
                    <h5 className="mb-0">
                      <Link to="">{service.title}</Link>
                    </h5>
                    <p className="mb-0 small">Total {service.students} Students</p>
                  </div>
                </div>
                <ul className="list-group list-group-borderless small mt-2">
                  {service.features.map((feature, idx) => (
                    <li className="list-group-item text-body pb-0" key={idx}>

                      <BsPatchCheckFill className="text-success me-1" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  )
}

export default Services
