import { Col, Container, Row } from 'react-bootstrap'

const Banner = () => {
  return (
    <section
      className="py-0 bg-blue h-100px align-items-center d-flex h-200px rounded-0"
      style={{ background: 'url(assets/images/pattern/04.png) no-repeat center center', backgroundSize: 'cover' }}>
      <Container>
        <Row>
          <Col xs={12} className="text-center">
            <h1 className="text-white">Submit a new Course</h1>
            <p className="text-white mb-0">
              Read our
              <a href="#" className="text-white">
                <u>&quot;Before you create a course&quot;</u>
              </a>
              article before submitting!
            </p>
          </Col>
        </Row>
      </Container>
    </section>
  )
}

export default Banner
