import TinySlider from '@/components/TinySlider'

import { Card, CardBody, CardTitle, Col, Container, Row } from 'react-bootstrap'
import { abroadCourses, type AbroadCourseType } from '../data'
import type { TinySliderSettings } from 'tiny-slider'
import { renderToString } from 'react-dom/server'
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa'

const CourseCard = ({ course }: { course: AbroadCourseType }) => {
  return (
    <Card className="text-center bg-transparent">
      <img src={course.image} className="card-img" alt="Course img" />
      <CardBody className="px-2">
        <CardTitle>{course.name}</CardTitle>
        <a href="#" className="btn btn-sm btn-danger mb-0">
          Enquire Now
        </a>
      </CardBody>
    </Card>
  )
}

const Courses = () => {
  const courseSliderSettings: TinySliderSettings = {
    arrowKeys: true,
    gutter: 30,
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
        items: 4,
      },
    },
  }
  return (
    <section className="pt-0 pt-sm-5">
      <Container>
        <Row className="mb-4">
          <Col xs={12} className="text-center mx-auto">
            <h2 className="h1 mb-0">What We Offer</h2>
          </Col>
        </Row>
        <Row>
          <div className="tiny-slider arrow-hover arrow-blur arrow-round">
            <TinySlider settings={courseSliderSettings}>
              {abroadCourses.map((course, idx) => (
                <div key={idx}>
                  <CourseCard course={course} />
                </div>
              ))}
            </TinySlider>
          </div>
        </Row>
      </Container>
    </section>
  )
}

export default Courses
