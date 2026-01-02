import TinySlider from '@/components/TinySlider'
import { getAllStudentsReviews } from '@/helpers/data'
import { useFetchData } from '@/hooks/useFetchData'
import { ReviewType } from '@/types/other'
import { Card, Col, Container, Row } from 'react-bootstrap'
import { renderToString } from 'react-dom/server'
import { FaArrowLeft, FaArrowRight, FaRegStar, FaStar, FaStarHalfAlt } from 'react-icons/fa'
import { TinySliderSettings } from 'tiny-slider'

const StudentsCard = ({ avatar, name, description, rating }: ReviewType) => {
  return (
    <Card className="card-body h-100">
      <div className="d-sm-flex justify-content-between align-items-center mb-3">
        <div className="d-flex align-items-center mb-1 mb-sm-0">
          <div className="avatar avatar-sm">
            <img className="avatar-img rounded-circle" src={avatar} alt="avatar" />
          </div>
          <div className="ms-2">
            <h6 className="mb-0">{name}</h6>
          </div>
        </div>
        <ul className="list-inline mb-0">
          {rating && (
            <>
              {Array(Math.floor(rating))
                .fill(0)
                .map((_star, idx) => (
                  <li key={idx} className="list-inline-item me-1 small">
                    <FaStar size={14} className="text-warning" />
                  </li>
                ))}
              {!Number.isInteger(rating) && (
                <li className="list-inline-item me-1 small">

                  <FaStarHalfAlt size={14} className="text-warning" />
                </li>
              )}
              {rating < 5 &&
                Array(5 - Math.ceil(rating))
                  .fill(0)
                  .map((_star, idx) => (
                    <li key={idx} className="list-inline-item me-1 small">
                      <FaRegStar size={14} className="text-warning" />
                    </li>
                  ))}
            </>
          )}
        </ul>
      </div>
      <h6 className="fw-normal mb-0">&quot;{description}&quot;</h6>
    </Card>
  )
}

const courseSliderSettings: TinySliderSettings = {
  arrowKeys: true,
  mouseDrag: true,
  gutter: 20,
  autoplayButton: false,
  autoplayButtonOutput: false,
  nested: 'inner',
  controlsText: [renderToString(<FaArrowLeft size={16} />), renderToString(<FaArrowRight size={16} />)],
  autoplay: true,
  controls: true,
  edgePadding: 2,

  items: 5,
  nav: false,
  responsive: {
    1: {
      items: 1,
    },
    576: {
      items: 1,
    },
    768: {
      items: 2,
    },
    992: {
      items: 2,
    },
    1200: {
      items: 3,
    },
  },
}

const Testimonials = () => {
  const allReviews = useFetchData(getAllStudentsReviews)

  return (
    <section className="pt-0">
      <Container>
        <div className="bg-light p-4 rounded-3">
          <Row className="mb-4">
            <Col xs={12} className="text-center">
              <h2>What students are saying</h2>
            </Col>
          </Row>
          <Row>
            <div className="tiny-slider arrow-round arrow-blur arrow-hover">
              <TinySlider
                settings={courseSliderSettings}
                className="pb-1"
                data-autoplay="true"
                data-arrow="true"
                data-edge={2}
                data-dots="false"
                data-items={3}
                data-items-lg={2}
                data-items-sm={1}>
                {allReviews?.map((item, idx) => (
                  <div key={idx}>
                    <StudentsCard {...item} />
                  </div>
                ))}
              </TinySlider>
            </div>
          </Row>
        </div>
      </Container>
    </section>
  )
}

export default Testimonials
