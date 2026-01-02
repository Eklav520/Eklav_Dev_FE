import TinySlider from '@/components/TinySlider'
import { getAllTestimonials } from '@/helpers/data'
import { useFetchData } from '@/hooks/useFetchData'
import { Col, Container, Row } from 'react-bootstrap'
import { renderToString } from 'react-dom/server'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import { TinySliderSettings } from 'tiny-slider'

const Testimonials = () => {
  const allTestimonials = useFetchData(getAllTestimonials)

  const testimanialsSliderSettings: TinySliderSettings = {
    arrowKeys: true,
    gutter: 20,
    autoplayButton: false,
    autoplayTimeout: 2000,
    autoplayButtonOutput: false,
    controlsText: [renderToString(<FaChevronLeft size={16} />), renderToString(<FaChevronRight size={16} />)],
    nested: 'inner',
    autoplay: true,
    controls: true,
    edgePadding: 2,
    mouseDrag: true,
    items: 2,
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
        items: 2,
      },
    },
  }

  return (
    <section>
      <Container>
        <Row>
          <Col lg={8} className="text-center mx-auto">
            <h2>What people say about us</h2>
            <p>
              Happiness prosperous impression had conviction For every delay in they Extremity now strangers contained breakfast him discourse
              additions Sincerity collected contented led now perpetual extremely forfeited
            </p>
          </Col>
        </Row>
        <Row className="mt-4 mt-lg-5">
          <Col xs={10} className="mx-auto">
            <Row className="g-4">
              <div className="tiny-slider arrow-round arrow-dark arrow-hover">
                {allTestimonials && (
                  <TinySlider settings={testimanialsSliderSettings}>
                    {allTestimonials.map((item, idx) => (
                      <Col xs={6} key={idx}>
                        <p className="fs-5">{item.description}</p>
                        <div className="d-flex align-items-center">
                          <div className="avatar avatar-md">
                            {item.course?.avatar && <img className="avatar-img rounded-circle" src={item.course.avatar} alt="avatar" />}
                          </div>
                          <div className="ms-2">
                            <h6 className="mb-0">{item.course?.name}</h6>
                            <p className="mb-0 small">{item.role}</p>
                          </div>
                        </div>
                      </Col>
                    ))}
                  </TinySlider>
                )}
              </div>
            </Row>
          </Col>
        </Row>
      </Container>
    </section>
  )
}

export default Testimonials
