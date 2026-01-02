import { Col, Container, Row } from 'react-bootstrap'
import TinySlider from '@/components/TinySlider'

import { renderToString } from 'react-dom/server'
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa'
import type { TinySliderSettings } from 'tiny-slider'

import course3 from '@/assets/images/element/21.svg'
import course1 from '@/assets/images/element/22.svg'
import course2 from '@/assets/images/element/23.svg'
import course4 from '@/assets/images/element/24.svg'
import course5 from '@/assets/images/element/25.svg'
import course6 from '@/assets/images/element/26.svg'

const CourseSlider = () => {
  const courseImages = [
    {
      logo: course1,
      name: 'Chemistry',
    },
    {
      logo: course2,
      name: 'Physics',
    },
    {
      logo: course3,
      name: 'Technology',
    },
    {
      logo: course4,
      name: 'Health',
    },
    {
      logo: course5,
      name: 'Business',
    },
    {
      logo: course6,
      name: 'Engineer',
    },
  ]

  const courseSliderSettings: TinySliderSettings = {
    arrowKeys: true,
    gutter: 80,
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
        items: 3,
      },
      1200: {
        items: 5,
      },
    },
  }

  return (
    <section>
      <Container>
        <Row>
          <Col md={12}>
            <div className="bg-light rounded-3 p-4">
              <div className="tiny-slider arrow-round arrow-creative arrow-blur arrow-hover py-1">
                <TinySlider
                  settings={courseSliderSettings}
                  data-autoplay="true"
                  data-gutter={80}
                  data-arrow="true"
                  data-dots="false"
                  data-items={5}
                  data-items-lg={3}
                  data-items-md={2}
                  data-items-xs={1}>
                  {courseImages.map((course, idx) => (
                    <div key={idx}>
                      <div className="bg-body text-center rounded-2 border py-2 px-1 position-relative">
                        <img src={course.logo} className="h-40px" alt="course-name" />
                        <a href="#" className="text-primary-hover stretched-link">
                          <span className="h6 ms-2">{course.name}</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </TinySlider>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  )
}

export default CourseSlider
