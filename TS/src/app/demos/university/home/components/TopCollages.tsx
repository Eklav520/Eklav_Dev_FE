import TinySlider from '@/components/TinySlider'
import { getAllColleges } from '@/helpers/data'
import { useFetchData } from '@/hooks/useFetchData'
import { CollegeType } from '@/types/other'
import { Col, Container, Row } from 'react-bootstrap'
import { renderToString } from 'react-dom/server'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import type { TinySliderSettings } from 'tiny-slider'
import CollegeCard from './CollegeCard'

const TopCollages = () => {
  const allColleges = useFetchData<CollegeType[]>(getAllColleges)
  const collegeSliderSettings: TinySliderSettings = {
    arrowKeys: true,
    gutter: 30,
    autoplayButton: false,
    autoplayButtonOutput: false,
    nested: 'inner',
    controlsText: [renderToString(<FaChevronLeft size={16} />), renderToString(<FaChevronRight size={16} />)],
    autoplay: false,
    mouseDrag: true,
    controls: true,
    edgePadding: 2,

    items: 3,
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
  return (
    <section className="pt-0">
      <Container>
        <Row className="mb-4">
          <Col lg={8} className="mx-auto text-center">
            <h2 className="mb-0">Top Listed College</h2>
            <p className="mb-0">Perceived end knowledge certainly day sweetness why cordially.</p>
          </Col>
        </Row>

        <Row>
          <Col sm={12}>
            <div className="tiny-slider arrow-round arrow-dark arrow-hover">
              {allColleges && (
                <TinySlider settings={collegeSliderSettings}>
                  {allColleges.map((college, idx) => (
                    <div key={idx}>
                      <CollegeCard college={college} />
                    </div>
                  ))}
                </TinySlider>
              )}
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  )
}

export default TopCollages
