import { Col, Container, FormControl, Row } from 'react-bootstrap'

const ActionBox = () => {
  return (
    <section className="py-0">
      <Container className="position-relative">
        <Row>
          <Col xs={12}>
            <div className="bg-light rounded-3 position-relative p-3 p-sm-5">
              <Row className="g-4 align-items-center">
                <Col md={6}>
                  <h6 className="text-primary">Newsletter</h6>
                  <h2 className="mb-0">Subscribe Mail list!</h2>
                  <p className="mb-0">
                    Speedily say has suitable disposal add boy. On forth doubt miles of child. Exercise joy man children rejoiced.
                  </p>
                </Col>
                <Col md={6}>
                  <form className="bg-body rounded-2 p-2">
                    <div className="input-group">
                      <FormControl className="border-0 me-1" type="email" placeholder="Enter your email" />
                      <button type="button" className="btn btn-blue mb-0 rounded-2">
                        Subscribe!
                      </button>
                    </div>
                  </form>
                </Col>
              </Row>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  )
}

export default ActionBox
