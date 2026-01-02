import { Col, Container, Row } from 'react-bootstrap'

const Banner = () => {
  return (
    <section className="py-5">
      <Container>
        <Row className="position-relative">
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
            <h1>Blog Masonry</h1>
            <div className="d-flex justify-content-center">
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <a href="#">Home</a>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Library
                  </li>
                </ol>
              </nav>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  )
}
export default Banner
