import element10 from '@/assets/images/element/10.svg'
import { Col, Container, Row } from 'react-bootstrap'
import TinySlider from '@/components/TinySlider'
import type { TinySliderSettings } from 'tiny-slider'
import { renderToString } from 'react-dom/server'
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa'
import { useFetchData } from '@/hooks/useFetchData'
import { getAllTestimonials } from '@/helpers/data'
import TestimonialCard from './TestimonialCard'

const TestimonialSlider = () => {
  const allTestimonialSlides = useFetchData(getAllTestimonials)
  const testimonialSliderSettings: TinySliderSettings = {
    arrowKeys: true,
    gutter: 30,
    autoplayButton: false,
    autoplayButtonOutput: false,
    nested: 'inner',
    controlsText: [renderToString(<FaArrowLeft size={16} />), renderToString(<FaArrowRight size={16} />)],
    autoplay: true,
    mouseDrag: true,
    controls: true,
    edgePadding: 5,

    items: 4,
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
        items: 3,
      },
      1200: {
        items: 3,
      },
    },
  }
  return (
    <section className="bg-light position-relative">
      <figure className="position-absolute start-0 bottom-0 mb-0">
        <img width={253} height={200} src={element10} className="h-200px" alt="element" />
      </figure>
      <Container>
        <Row className="mb-4">
          <Col lg={8} className="mx-auto text-center">
            <h2>Our Customer Feedback</h2>
            <p className="mb-0">Perceived end knowledge certainly day sweetness why cordially</p>
          </Col>
        </Row>
        <Row>
          <div className="tiny-slider arrow-round arrow-creative arrow-dark arrow-hover">
            {allTestimonialSlides && (
              <TinySlider settings={testimonialSliderSettings}>
                {allTestimonialSlides.map((testimonial, idx) => (
                  <div key={idx}>
                    <TestimonialCard testimonial={testimonial} />
                  </div>
                ))}
              </TinySlider>
            )}
          </div>
        </Row>
      </Container>
    </section>
  )
}

export default TestimonialSlider
