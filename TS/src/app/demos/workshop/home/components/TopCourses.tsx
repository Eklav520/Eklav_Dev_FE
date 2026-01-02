import TinySlider from '@/components/TinySlider'
import { getAllCourses } from '@/helpers/data'
import { useFetchData } from '@/hooks/useFetchData'
import { CourseType } from '@/types/other'
import { Col, Container, Row } from 'react-bootstrap'
import { renderToString } from 'react-dom/server'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import type { TinySliderSettings } from 'tiny-slider'
import CourseCard from './CourseCard'

const TopCourses = () => {
  const topCourses = useFetchData<CourseType[]>(getAllCourses)
  const courseSliderSettings: TinySliderSettings = {
    arrowKeys: true,
    gutter: 20,
    autoplayButton: false,
    autoplayButtonOutput: false,
    nested: 'inner',
    mouseDrag: true,
    controlsText: [renderToString(<FaChevronLeft size={16} />), renderToString(<FaChevronRight size={16} />)],
    autoplay: true,
    controls: true,
    edgePadding: 2,

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
        items: 4,
      },
    },
  }
  return (
    <section>
      <Container>
        <Row className="mb-4">
          <Col xs={12} className="mx-auto text-center">
            <h2 className="fs-1">Top Listed Courses</h2>
            <p className="mb-0">Check out most 🤩 courses in the market</p>
          </Col>
        </Row>
        <Row>
          <div className="tiny-slider arrow-round arrow-blur arrow-hover">
            {topCourses && (
              <TinySlider settings={courseSliderSettings} className="pb-1">
                {topCourses.map((course, idx) => (
                  <div key={idx}>
                    <CourseCard course={course} />
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

export default TopCourses
