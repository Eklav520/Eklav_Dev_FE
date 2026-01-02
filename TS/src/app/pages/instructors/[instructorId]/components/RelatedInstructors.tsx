import { instructorsData } from '@/assets/data/products'
import TinySlider from '@/components/TinySlider'
import { InstructorType } from '@/types/other'
import { Card, CardBody, CardTitle, Container, Row } from 'react-bootstrap'
import { renderToString } from 'react-dom/server'
import { FaArrowLeft, FaArrowRight, FaClipboardList, FaStar, FaStarHalfAlt, FaUserGraduate } from 'react-icons/fa'
import { TinySliderSettings } from 'tiny-slider'
//instructorsData: InstructorType[]

const RelatedInstructorsData = ({ title, department, image }: InstructorType) => {
  return (
    <Card className="bg-transparent">
      <div className="position-relative">
        <img src={image} className="card-img" alt="course image" />
        <div className="card-img-overlay d-flex flex-column p-3">
          <div className="w-100 mt-auto text-end">
            <a href="#" className="badge text-bg-info rounded-1">
              <FaUserGraduate className="me-2" />
              25
            </a>
            <a href="#" className="badge text-bg-orange rounded-1">
              <FaClipboardList className=" me-2" />
              15
            </a>
          </div>
        </div>
      </div>
      <CardBody className="text-center">
        <CardTitle>
          <a href="#">{title}</a>
        </CardTitle>
        <p className="mb-2">{department}</p>
        <ul className="list-inline hstack justify-content-center">
          <li className="list-inline-item ms-2 h6 mb-0 fw-normal">4.5/5.0</li>
          <li className="list-inline-item me-0 small">
            <FaStar className="text-warning" />
          </li>
          <li className="list-inline-item me-0 small">
            <FaStar className="text-warning" />
          </li>
          <li className="list-inline-item me-0 small">
            <FaStar className="text-warning" />
          </li>
          <li className="list-inline-item me-0 small">
            <FaStar className="text-warning" />
          </li>
          <li className="list-inline-item me-0 small">
            <FaStarHalfAlt className="text-warning" />
          </li>
        </ul>
      </CardBody>
    </Card>
  )
}

const RelatedInstructors = () => {
  const courseSliderSettings: TinySliderSettings = {
    arrowKeys: true,
    gutter: 20,
    mouseDrag: true,
    autoplayButton: false,
    autoplayButtonOutput: false,
    nested: 'inner',
    controlsText: [renderToString(<FaArrowLeft size={16} />), renderToString(<FaArrowRight size={16} />)],
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
    <>
      <section>
        <Container>
          <Row className="mb-4">
            <h2 className="mb-0">Related Instructors</h2>
          </Row>
          <div className="tiny-slider arrow-round arrow-creative arrow-blur arrow-hover">
            <TinySlider
              className="tiny-slider-inner"
              settings={courseSliderSettings}
              data-autoplay="false"
              data-arrow="true"
              data-dots="false"
              data-items={4}
              data-items-lg={3}
              data-items-md={2}
              data-items-xs={1}>
              {instructorsData.map((item, idx) => (
                <RelatedInstructorsData key={idx} {...item} />
              ))}
            </TinySlider>
          </div>
        </Container>
      </section>
    </>
  )
}

export default RelatedInstructors
