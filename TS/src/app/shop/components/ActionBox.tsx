import book1 from '@/assets/images/book/01.jpg'
import element29 from '@/assets/images/element/29.svg'
import { Button, Col, Container, Row } from 'react-bootstrap'
import { FaRegStar, FaStar, FaStarHalfAlt } from 'react-icons/fa'

const ActionBox = () => {
  return (
    <section className="pt-0">
      <Container>
        <Row className="g-4">
          <Col lg={6}>
            <div className="bg-purple bg-opacity-10 rounded-3 p-5 h-100">
              <Row className="g-3 align-items-center">
                <Col sm={5} lg={12} xl={5}>
                  <img src={book1} alt="book" />
                </Col>
                <Col sm={7} lg={12} xl={7}>
                  <h3 className="mb-2">Best selling book of the month</h3>
                  <ul className="list-inline mb-2">
                    {Array(Math.floor(4.5))
                      .fill(0)
                      .map((_star, idx) => (
                        <li key={idx} className="list-inline-item me-1 small">
                          <FaStar size={14} className="text-warning" />
                        </li>
                      ))}
                    {!Number.isInteger(4.5) && (
                      <li className="list-inline-item me-1 small">

                        <FaStarHalfAlt size={14} className="text-warning" />
                      </li>
                    )}
                    {4.5 < 5 &&
                      Array(5 - Math.ceil(4.5))
                        .fill(0)
                        .map((_star, idx) => (
                          <li key={idx} className="list-inline-item me-1 small">
                            <FaRegStar size={14} className="text-warning" />
                          </li>
                        ))}
                  </ul>
                  <h6 className="lead fw-bold mb-2">HTML and CSS: Design and Build Websites (Paperback)</h6>
                  <a href="#" className="btn btn-sm btn-purple mb-0">
                    Buy now
                  </a>
                </Col>
              </Row>
            </div>
          </Col>
          <Col lg={6}>
            <div className="bg-warning rounded-3 bg-opacity-15 p-5 h-100">
              <Row className="g-3 align-items-center my-auto">
                <Col sm={7} lg={12} xl={7}>
                  <h2 className="mb-1 fs-1">50%OFF</h2>
                  <p className="mb-3 h5 fw-light lead">Enroll now in the most popular and best-rated Books.</p>
                  <Button variant="dark" className="mb-0">
                    View Books
                  </Button>
                </Col>
                <Col sm={5} lg={12} xl={5}>
                  <img src={element29} alt="element" />
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
