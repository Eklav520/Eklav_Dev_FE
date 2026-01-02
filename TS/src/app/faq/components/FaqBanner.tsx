import { Card, Col, Container, Row } from 'react-bootstrap'
import { FaExclamationCircle, FaFlag, FaHandsHelping, FaStreetView } from 'react-icons/fa'

const FaqBanner = () => {
  return (
    <section className="bg-light py-5">
      <Container>
        <Row className="g-4 g-md-5 position-relative">
          <figure className="position-absolute top-0 start-0 d-none d-sm-block">
            <svg width="22px" height="22px" viewBox="0 0 22 22">
              <polygon
                className="fill-purple"
                points="22,8.3 13.7,8.3 13.7,0 8.3,0 8.3,8.3 0,8.3 0,13.7 8.3,13.7 8.3,22 13.7,22 13.7,13.7 22,13.7 "
              />
            </svg>
          </figure>
          <Col lg={10} className="mx-auto text-center position-relative">
            <figure className="position-absolute top-50 end-0 translate-middle-y">
              <svg width="27px" height="27px">
                <path
                  className="fill-orange"
                  d="M13.122,5.946 L17.679,-0.001 L17.404,7.528 L24.661,5.946 L19.683,11.533 L26.244,15.056 L18.891,16.089 L21.686,23.068 L15.400,19.062 L13.122,26.232 L10.843,19.062 L4.557,23.068 L7.352,16.089 L-0.000,15.056 L6.561,11.533 L1.582,5.946 L8.839,7.528 L8.565,-0.001 L13.122,5.946 Z"
                />
              </svg>
            </figure>
            <h1 className="display-6">Hello, how can we help?</h1>
            <Col lg={8} className="mx-auto text-center mt-4">
              <form className="bg-body shadow rounded p-2">
                <div className="input-group">
                  <input className="form-control border-0 me-1" type="text" placeholder="Ask a question..." />
                  <button type="button" className="btn btn-blue mb-0 rounded">
                    Submit
                  </button>
                </div>
              </form>
            </Col>
          </Col>
          <Col xs={12}>
            <Row className="g-4 text-center">
              <p className="mb-0">Choose a category to quickly find the help you need</p>
              <Col sm={6} md={3}>
                <Card className="card-body card-border-hover p-0">
                  <a href="#" className="p-3">
                    <h2>
                      <FaStreetView className="transition-base" />
                    </h2>
                    <h6 className="mb-0">User Guide</h6>
                  </a>
                </Card>
              </Col>
              <Col sm={6} md={3}>
                <Card className="card-body card-border-hover p-0">
                  <a href="#" className="p-3">
                    <h2>
                      <FaHandsHelping className="transition-base" />
                    </h2>
                    <h6 className="mb-0">Assistance</h6>
                  </a>
                </Card>
              </Col>
              <Col sm={6} md={3}>
                <Card className="card-body card-border-hover p-0">
                  <a href="#" className="p-3">
                    <h2>
                      <FaExclamationCircle className="transition-base" />
                    </h2>
                    <h6 className="mb-0">General guide</h6>
                  </a>
                </Card>
              </Col>
              <Col sm={6} md={3}>
                <Card className="card-body card-border-hover p-0">
                  <a href="#" className="p-3">
                    <h2>
                      <FaFlag className="transition-base" />
                    </h2>
                    <h6 className="mb-0">Getting started</h6>
                  </a>
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>
    </section>
  )
}

export default FaqBanner
