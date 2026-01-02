import { getProductById } from '@/helpers/data'
import { BookType } from '@/types/other'
import { useEffect, useState } from 'react'
import { Col, Container, Row } from 'react-bootstrap'
import { BsBagFill, BsCalendarFill, BsEyeFill, BsPersonCircle, BsStarFill, BsTranslate } from 'react-icons/bs'
import { FaBook, FaFont, FaRegStar, FaStar, FaStarHalfAlt } from 'react-icons/fa'
import { useNavigate, useParams } from 'react-router-dom'
import BookDetails from './components/BookDetails'
import ProductImage from './components/ProductImage'

const ProductDetailPage = () => {
  const [event, setEvent] = useState<BookType>()
  const { eventId } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    ;(async () => {
      if (eventId) {
        const data = await getProductById(eventId)
        if (data) setEvent(data)
        else navigate('/error-404')
      }
    })()
  }, [])

  return (
    <main>
      <section className="pt-5">
        <Container>
          <Row className="g-4 g-sm-5">
            <Col xl={4}>
              <div className="data-sticky-container">{event && <ProductImage event={event} />}</div>
            </Col>

            <Col xl={8}>
              <h1 className="mb-4">{event?.title}</h1>
              <div className="d-flex align-items-center mb-4">
                <h2 className="me-3 mb-0">4.5</h2>
                <div>
                  <ul className="list-inline mb-0">
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
                  <p className="mb-0 small mt-n1">Reviews from our buyers</p>
                </div>
              </div>
              <ul className="list-inline mb-4">
                <li className="list-inline-item">
                  <input type="radio" className="btn-check" name="options" id="option1" defaultChecked />
                  <label className="btn btn-success-soft-check" htmlFor="option1">
                    <span className="mb-2 h6 fw-light">Paperback</span>
                    <span className="d-flex align-items-center">
                      <span className="mb-0 h5 me-2 text-success">$215</span>
                      <span className="text-decoration-line-through fs-6 mb-0 me-2">$350</span>
                      <span className="badge text-bg-dark mb-0">60% off</span>
                    </span>
                  </label>
                </li>
                &nbsp;
                <li className="list-inline-item">
                  <input type="radio" className="btn-check" name="options" id="option2" />
                  <label className="btn btn-success-soft-check" htmlFor="option2">
                    <span className="mb-2 h6 fw-light">Compact disk</span>
                    <span className="d-flex align-items-center">
                      <span className="mb-0 h5 me-2 text-success">$180</span>
                      <span className="text-decoration-line-through fs-6 mb-0 me-2">$240</span>
                      <span className="badge text-bg-dark mb-0">40% off</span>
                    </span>
                  </label>
                </li>
              </ul>
              <h4>Description</h4>
              <p>
                Satisfied conveying a dependent contented he gentleman agreeable do be. Warrant private blushes removed an in equally totally if.
                Delivered dejection necessary objection do Mr prevailed. Mr feeling does chiefly cordial in do.
              </p>
              <p>
                We focus a great deal on the understanding of behavioral psychology and influence triggers which are crucial for becoming a
                well-rounded Digital Marketer. We understand that theory is important to build a solid foundation, we understand that theory alone
                isn&apos;t going to get the job done so that&apos;s why this course is packed with practical hands-on examples that you can follow
                step by step.
              </p>
              <Row className="mb-3">
                <Col md={6}>
                  <ul className="list-group list-group-borderless">
                    <li className="list-group-item px-0">
                      <span className="h6 fw-light">
                        <BsCalendarFill className="bi fa-fw bi-calendar-fill text-primary me-2" />
                        Published date:
                      </span>
                      <span className="h6">12 Dec 2021</span>
                    </li>
                    <li className="list-group-item px-0">
                      <span className="h6 fw-light">
                        <FaBook className="text-primary me-2" />
                        Page count:
                      </span>
                      <span className="h6">180</span>
                    </li>
                    <li className="list-group-item px-0">
                      <span className="h6 fw-light">
                        <FaFont className="text-primary me-2" />
                        Word count:
                      </span>
                      <span className="h6">15879</span>
                    </li>
                    <li className="list-group-item px-0">
                      <span className="h6 fw-light">
                        <BsTranslate className="text-primary me-2" />
                        Language:
                      </span>
                      <span className="h6">English</span>
                    </li>
                  </ul>
                </Col>
                <Col md={6}>
                  <ul className="list-group list-group-borderless">
                    <li className="list-group-item px-0">
                      <span className="h6 fw-light">
                        <BsPersonCircle className="text-primary me-2" />
                        Published by:
                      </span>
                      <span className="h6">Dennis Barrett</span>
                    </li>
                    <li className="list-group-item px-0">
                      <span className="h6 fw-light">
                        <BsEyeFill className="text-primary me-2" />
                        Visited by:
                      </span>
                      <span className="h6">18K</span>
                    </li>
                    <li className="list-group-item px-0">
                      <span className="h6 fw-light">
                        <BsBagFill className="text-primary me-2" />
                        Purchase by:
                      </span>
                      <span className="h6">8245</span>
                    </li>
                    <li className="list-group-item px-0">
                      <span className="h6 fw-light">
                        <BsStarFill className="text-primary me-2" />
                        Rating/Review:
                      </span>
                      <span className="h6">4.5 (568)</span>
                    </li>
                  </ul>
                </Col>
              </Row>
              <p>
                Crucial for becoming a well-rounded Digital Marketer. We understand that theory is important to build a solid foundation, we
                understand that theory alone isn&apos;t going to get the job done so that&apos;s why this course is packed with practical hands-on
                examples that you can follow step by step.
              </p>
              <BookDetails />
            </Col>
          </Row>
        </Container>
      </section>
    </main>
  )
}

export default ProductDetailPage
