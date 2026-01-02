import bookBg from '@/assets/images/book/book-bg.svg'
import { Col, Container, Row } from 'react-bootstrap'

const Banner = () => {
  return (
    <section className="py-0">
      <Container>
        <Row>
          <Col xs={12}>
            <div className="bg-light p-4 rounded-3 position-relative overflow-hidden">
              <figure className="position-absolute top-0 end-0 mt-5">
                <svg width="566.3px" height="353.7px" viewBox="0 0 566.3 353.7">
                  <path
                    stroke="#17a2b8"
                    fill="none"
                    d="M525.1,4c8.1,0.7,14.9,7.2,17.9,14.8c3,7.6,3,16,2.1,24.1c-4.7,44.3-32.1,84.7-69.4,108.9 c-37.4,24.2-83.7,32.8-127.9,27.6c-32.3-3.8-63.5-14.5-95.9-16.6c-21.6-1.4-45.6,2.1-60.1,18.3c-7.7,8.5-11.8,19.6-14.8,30.7 c-7.9,29.5-9,60.8-19.7,89.5c-5.5,14.8-14,29.1-27.1,38c-15.6,10.5-35.6,12-54.2,9.5c-18.6-2.5-36.5-8.6-55-12.1"
                  />
                  <path
                    stroke="#F99D2B"
                    fill="none"
                    d="M560.7,0.2c10,18.3,3.7,41.1-5,60.1c-11.8,25.9-28,50.3-50.2,68.2c-29,23.3-66.3,34-103.2,38.6 c-36.9,4.6-74.3,3.8-111.3,7.2c-22.3,2-45.3,5.9-63.5,19c-26.8,19.2-39,55.3-68.3,70.4c-38.2,19.6-89.7-4.9-125.6,18.8 c-22.6,15-30.7,44.2-33.3,71.2"
                  />
                </svg>
              </figure>
              <Row className="position-relative align-items-center">
                <Col md={6} className="px-md-5">
                  <h1 className="mb-3">Welcome to our online book store!</h1>
                  <p className="mb-3">
                    Expand knowledge by reading book Two before narrow not relied on how except moment myself Dejection assurance.
                  </p>
                  <form className="bg-body rounded p-2">
                    <div className="input-group">
                      <input className="form-control border-0 me-1" type="search" placeholder="Search book" />
                      <button type="button" className="btn btn-primary mb-0 rounded">
                        Search
                      </button>
                    </div>
                  </form>
                </Col>
                <Col md={6} className="text-center">
                  <img src={bookBg} alt="book-bg" />
                </Col>
              </Row>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  )
}

export default Banner
