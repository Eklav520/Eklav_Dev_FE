import { Col, Container, Row } from 'react-bootstrap'

const PageBanner = () => {
  return (
    <section className="py-4">
      <Container>
        <Row>
          <Col xs={12}>
            <div className="bg-light p-4 text-center rounded-3">
              <h1 className="m-0">Course Grid Minimal</h1>
              <div className="d-flex justify-content-center">
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb breadcrumb-dots mb-0">
                    <li className="breadcrumb-item">
                      <a href="#">Home</a>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                      Course minimal
                    </li>
                  </ol>
                </nav>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  )
}

export default PageBanner
