import { Col, Container, Row } from 'react-bootstrap'
import { Link } from 'react-router-dom'

const HelpCenterBanner = () => {
  return (
    <section className="bg-primary bg-opacity-10">
      <Container>
        <Row>
          <Col lg={8} className="mx-auto text-center">
            <h1 className="display-6">Search Solution. Get Support</h1>
            <p className="mb-0">Search here to get answers to your questions.</p>
            <form className="bg-body rounded p-2 mt-4">
              <div className="input-group">
                <input className="form-control border-0 me-1" type="text" placeholder="Search question..." />
                <button type="button" className="btn btn-dark mb-0 rounded">
                  Search
                </button>
              </div>
            </form>
            <Row className="mt-4 align-items-center">
              <Col xs={12}>
                <h5 className="mb-3">Popular questions</h5>
                <div className="list-group list-group-horizontal gap-2 justify-content-center flex-wrap mb-0 border-0">
                  <Link className="btn btn-white btn-sm fw-light" to="/help/center-detail">

                    How can we help?
                  </Link>
                  <Link className="btn btn-white btn-sm fw-light" to="/help/center-detail">

                    How to upload data to the system?
                  </Link>
                  <Link className="btn btn-white btn-sm fw-light" to="/help/center-detail">

                    Installation Guide?
                  </Link>
                  <Link className="btn btn-white btn-sm fw-light" to="/help/center-detail">

                    How to view expired course?
                  </Link>
                  <Link className="btn btn-white btn-sm fw-light" to="/help/center-detail">

                    What&apos;s are the difference between a social?
                  </Link>
                  <Link className="btn btn-primary-soft btn-sm fw-light" to="#!">
                    View all question
                  </Link>
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>
    </section>
  )
}

export default HelpCenterBanner
