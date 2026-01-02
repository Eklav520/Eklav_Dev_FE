import { Button, Col, Container, Row } from 'react-bootstrap'

import element8 from '@/assets/images/element/08.svg'
import element15 from '@/assets/images/element/15.svg'

const ActionBox = () => {
  return (
    <section className="py-0">
      <Container>
        <Row className="g-4">
          <Col lg={6} className="position-relative overflow-hidden">
            <div className="bg-primary bg-opacity-10 rounded-3 p-5 h-100">
              <div className="position-absolute bottom-0 end-0 me-3">
                <img src={element8} className="h-100px h-sm-200px w-auto" alt="element" />
              </div>
              <Row>
                <Col sm={8} className="position-relative">
                  <h3 className="mb-1">Earn a Certificate</h3>
                  <p className="mb-3 h5 fw-light lead">Get the right professional certificate program for you.</p>
                  <Button variant="primary" className="mb-0">
                    View Programs
                  </Button>
                </Col>
              </Row>
            </div>
          </Col>
          <Col lg={6} className="position-relative overflow-hidden">
            <div className="bg-secondary rounded-3 bg-opacity-10 p-5 h-100">
              <div className="position-absolute bottom-0 end-0 me-3">
                <img src={element15} className="h-100px h-sm-200px w-auto" alt="element" />
              </div>
              <Row>
                <Col sm={8} className="position-relative">
                  <h3 className="mb-1">Best Rated Courses</h3>
                  <p className="mb-3 h5 fw-light lead">Enroll now in the most popular and best rated courses.</p>
                  <Button variant="warning" className="mb-0">
                    View Courses
                  </Button>
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
