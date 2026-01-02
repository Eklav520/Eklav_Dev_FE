import { Col, Container, Row } from 'react-bootstrap'

import { Link } from 'react-router-dom'

import { languages } from '../data'

const Languages = () => {
  return (
    <section>
      <Container>
        <Row className="mb-4 mx-auto text-center">
          <Col xs={12}>
            <h2 className="mb-0">Choose Languages</h2>
          </Col>
        </Row>
        <Row className="g-4">
          {languages.map((language, idx) => (
            <Col sm={6} md={4} lg={3} key={idx}>
              <div className="bg-light rounded-2 p-3 d-flex align-items-center position-relative justify-content-center">
                <img width={60} height={40} src={language.flag} className="me-3 h-40px" alt="flags" />
                <h5 className="mb-0">
                  <Link to="" className="stretched-link text-primary-hover" />
                  {language.name}
                </h5>
              </div>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  )
}

export default Languages
