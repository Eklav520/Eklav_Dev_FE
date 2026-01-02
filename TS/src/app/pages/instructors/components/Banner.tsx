import { Col, Container, Row } from 'react-bootstrap'

const Banner = () => {
  return (
    <section className="py-0">
      <Container>
        <Row>
          <Col xs={12}>
            <div className="bg-dark p-4 text-center rounded-3">
              <h1 className="text-white m-0">Instructors list</h1>
              <div className="d-flex justify-content-center">
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb breadcrumb-dark breadcrumb-dots mb-0">
                    <li className="breadcrumb-item">
                      <a href="#">Home</a>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                      instructor list
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
export default Banner
