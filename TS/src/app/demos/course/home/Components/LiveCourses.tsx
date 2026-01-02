import GlightBox from '@/components/GlightBox'
import TinySlider from '@/components/TinySlider'

import type { CourseType } from '@/types/other'
import { Button, Card, CardBody, Col, Container, Row } from 'react-bootstrap'
import { FaChevronLeft, FaChevronRight, FaCircle, FaPlay } from 'react-icons/fa'

import avatar1 from '@/assets/images/avatar/01.jpg'
import avatar2 from '@/assets/images/avatar/02.jpg'
import avatar3 from '@/assets/images/avatar/03.jpg'
import avatar6 from '@/assets/images/avatar/06.jpg'
import { getAllCourses } from '@/helpers/data'
import { useFetchData } from '@/hooks/useFetchData'
import { renderToString } from 'react-dom/server'
import type { TinySliderSettings } from 'tiny-slider'

const students = [avatar1, avatar2, avatar3, avatar6]
const CourseCard = ({ course }: { course: CourseType }) => {
  const { studentImage, title } = course
  return (
    <Card className="p-2">
      <div className="position-relative">
        <img src={studentImage} width={386} className="img-fluid card-img rounded-2" alt="Card image" />
        <div className="card-img-overlay">
          <div className="position-absolute top-50 start-50 translate-middle">
            <GlightBox
              href="https://www.youtube.com/embed/tXHviS-4ygo"
              className="btn btn-lg text-danger btn-round btn-white-shadow mb-0"
              data-glightbox
              data-gallery="video-tour">
              <FaPlay />
            </GlightBox>
          </div>
        </div>
      </div>
      <CardBody>
        <h5>
          <a href="#">{title}</a>
        </h5>
        <div className="d-sm-flex justify-content-sm-between align-items-center mt-3">
          <div>
            <h6 className="mb-1 fw-normal">
              <FaCircle className="fw-bold text-success small me-2" />
              Live Students
            </h6>
            <ul className="avatar-group mb-2 mb-sm-0">
              {students.map((student, idx) => (
                <li className="avatar avatar-xs" key={idx}>
                  <img className="avatar-img rounded-circle" src={student} alt="avatar" />
                </li>
              ))}
              <li className="avatar avatar-xs">
                <div className="avatar-img rounded-circle bg-primary">
                  <span className="text-white position-absolute top-50 start-50 translate-middle small">1K+</span>
                </div>
              </li>
            </ul>
          </div>
          <Button size="sm" variant="success" className="mb-0">
            Join now
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}
const LiveCourses = () => {
  const allLiveCourses = useFetchData<CourseType[]>(getAllCourses)

  const courseSliderSettings: TinySliderSettings = {
    arrowKeys: true,
    gutter: 15,
    mouseDrag: true,
    autoplayButton: false,
    autoplayButtonOutput: false,
    nested: 'inner',
    controlsText: [renderToString(<FaChevronLeft size={16} />), renderToString(<FaChevronRight size={16} />)],
    autoplay: false,
    controls: true,
    edgePadding: 2,

    items: 2,
    nav: false,
    responsive: {
      0: {
        items: 1,
      },
      992: {
        items: 1,
      },
      1200: {
        items: 2,
      },
    },
  }

  const liveCourses = allLiveCourses?.filter((course) => course.title.length >= 30)
  return (
    <section className="bg-light position-relative">
      <figure className="position-absolute top-50 start-0 translate-middle-y ms-5 d-none d-xxl-block">
        <svg width="29px" height="29px">
          <path
            className="fill-orange"
            d="M29.004,14.502 C29.004,22.512 22.511,29.004 14.502,29.004 C6.492,29.004 -0.001,22.512 -0.001,14.502 C-0.001,6.492 6.492,-0.001 14.502,-0.001 C22.511,-0.001 29.004,6.492 29.004,14.502 Z"
          />
        </svg>
      </figure>
      <figure className="position-absolute bottom-0 start-50 translate-middle-x">
        <svg width="23px" height="23px">
          <path
            className="fill-primary"
            d="M23.003,11.501 C23.003,17.854 17.853,23.003 11.501,23.003 C5.149,23.003 -0.001,17.854 -0.001,11.501 C-0.001,5.149 5.149,-0.000 11.501,-0.000 C17.853,-0.000 23.003,5.149 23.003,11.501 Z"
          />
        </svg>
      </figure>
      <figure className="position-absolute top-50 end-0 translate-middle-y ms-5">
        <svg width="22px" height="22px">
          <path
            className="fill-warning"
            d="M22.003,11.001 C22.003,17.078 17.077,22.003 11.001,22.003 C4.925,22.003 -0.001,17.078 -0.001,11.001 C-0.001,4.925 4.925,-0.000 11.001,-0.000 C17.077,-0.000 22.003,4.925 22.003,11.001 Z"
          />
        </svg>
      </figure>
      <Container>
        <Row className="g-4 align-items-center justify-content-between">
          <Col md={6} xl={4}>
            <h2 className="fs-1">Today&apos;s Top Free Live Courses</h2>
            <p>
              How promotion excellent curiosity yet attempted happiness prosperous impression had conviction For every delay death ask to style Me
              mean able my by in they Extremity now strangers contained.
            </p>
            <a href="#" className="btn btn-orange mb-0">
              Get premium courses
            </a>
          </Col>
          <Col md={6} xl={8}>
            <Row>
              <div className="tiny-slider arrow-round arrow-blur">
                {liveCourses && (
                  <TinySlider
                    settings={courseSliderSettings}
                    data-autoplay="false"
                    data-edge={2}
                    data-arrow="true"
                    data-dots="false"
                    data-items-lg={1}
                    data-items-xl={2}>
                    {liveCourses?.map((course, idx) => {
                      return (
                        <div key={idx}>
                          <CourseCard course={course} />
                        </div>
                      )
                    })}
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

export default LiveCourses
