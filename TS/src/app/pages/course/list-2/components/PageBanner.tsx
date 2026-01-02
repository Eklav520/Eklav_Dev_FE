import pattern4 from '@/assets/images/pattern/04.png'
import { Col, Container, Row } from 'react-bootstrap'

const PageBanner = () => {
  return (
    <section
      className="bg-dark align-items-center d-flex"
      style={{ background: `url(${pattern4}) no-repeat center center`, backgroundSize: 'cover' }}>
      <Container>
        <Row>
          <Col xs={12}>
            <h1 className="text-white">Course List Minimal</h1>
            <div className="d-flex">
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb breadcrumb-dark breadcrumb-dots mb-0">
                  <li className="breadcrumb-item">
                    <a href="#">Home</a>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Courses
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

export default PageBanner
