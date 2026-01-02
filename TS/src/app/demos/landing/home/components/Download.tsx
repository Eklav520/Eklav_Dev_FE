import { Col, Container, Row } from 'react-bootstrap'

import googlePlay from '@/assets/images/element/google-play.svg'
import appStore from '@/assets/images/element/app-store.svg'
import element7 from '@/assets/images/element/07.svg'

const Download = () => {
  return (
    <section className="overflow-hidden">
      <Container>
        <Row className="g-4 align-items-center">
          <Col md={5} className="position-relative z-index-9">
            <h2>Learn on your mobile Anytime</h2>
            <p>
              How promotion excellent curiosity yet attempted happiness Gay prosperous impression had conviction For every delay death ask to style Me
              mean able my by in they Extremity. had conviction For every delay death ask to style Me mean able my by in they Extremity.
            </p>
            <Row>
              <Col xs={6} sm={4} md={6} lg={4}>
                <span role="button">
                  <img src={googlePlay} className="btn-transition w-auto" alt="google-play" />
                </span>
              </Col>
              <Col xs={6} sm={4} md={6} lg={4}>
                <span role="button">
                  <img src={appStore} className="btn-transition w-auto" alt="app-store" />
                </span>
              </Col>
            </Row>
          </Col>
          <Col md={7} className="text-md-end position-relative">
            <figure className="position-absolute top-50 end-0 translate-middle-y me-n8">
              <svg width="632.6px" height="540.4px" viewBox="0 0 632.6 540.4">
                <path
                  className="fill-primary opacity-1"
                  d="M531.4,46.9c46.3,27.4,81.4,79.8,91.1,136.2c9.7,56.8-6.4,117.7-38.3,166s-79.4,84.2-138.6,119.3 c-59.6,35.1-130.6,69.7-201.5,62.1c-70.5-7.7-141.4-57.6-185.4-126.5C14.4,335.5-2.9,247.2,23.7,179.5 c26.2-68.1,96.7-116.5,161.6-140.2c64.9-24.2,124.5-24.6,183.3-23.4C427,17.1,485.1,19.5,531.4,46.9z"
                />
              </svg>
            </figure>
            <img src={element7} className="position-relative" alt="" />
          </Col>
        </Row>
      </Container>
    </section>
  )
}

export default Download
