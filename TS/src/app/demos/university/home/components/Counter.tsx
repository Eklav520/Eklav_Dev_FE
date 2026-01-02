import { Col, Container, Row } from 'react-bootstrap'
import element2 from '@/assets/images/element/02.png'

import { counterData } from '../data'
import CountUp from 'react-countup'

const Counter = () => {
  return (
    <section className="py-0 py-lg-5">
      <Container>
        <Row>
          <Col xs={12} className="position-relative z-index-1">
            <div className="d-none d-lg-block position-absolute bottom-0 start-0 ms-5">
              <img src={element2} alt="Image" />
            </div>
            <div className="bg-warning p-4 p-sm-5 rounded position-relative z-index-n1 overflow-hidden">
              <figure className="position-absolute top-50 end-0 translate-middle-y me-n7">
                <svg className="fill-orange rotate-193 opacity-2" width="676px" height="161.3px" viewBox="0 0 676 161.3" xmlSpace="preserve">
                  <path d="M53.6,18.8c28.6,8.8,50.3,27.3,70.9,48c19.9,19.9,39.5,40.8,65.3,53c53.3,24.9,116,12.4,168.2-9.1 c58.4-23.9,113.2-59.8,176.2-70.3c30.9-5.1,64.1-2.6,90.9,14.7c22.4,14.4,34.4,36.9,39.5,62.4c2.9,14.5,3.9,29.2,4.6,43.9h6.8 c-0.2-4.2-0.5-8.3-0.8-12.5c-1.7-24.1-4.9-49.1-17.6-70.3c-14.5-23.9-40-39.2-67-44.8c-32.9-6.8-67.2-0.3-98.5,10.2 c-30.3,10-59,24.2-87.7,38.1c-54.8,26.4-115.5,53.1-177.9,42c-14.5-2.6-28.7-7.4-41.7-14.7c-12.8-7.3-23.9-16.7-34.6-26.7 c-20.7-19.6-39.4-42-64.1-56.8c-25.6-15.4-56.4-22.2-86-19H0v6.9C17.9,11.8,36.3,13.5,53.6,18.8z" />
                </svg>
              </figure>
              <Row className="align-items-end justify-content-end position-relative">
                <Col lg={10}>
                  <Row className="g-3 d-flex align-items-center justify-content-center">
                    {counterData.map((item, idx) => (
                      <Col sm={6} lg={3} className="text-center" key={idx}>
                        <div className="d-flex justify-content-center">
                          <h4 className="purecounter display-6 text-white fw-bold mb-0">
                            <CountUp end={item.count} delay={2} suffix={item.suffix} />
                          </h4>
                        </div>
                        <h6 className="text-dark mb-0 fw-bold">{item.title}</h6>
                      </Col>
                    ))}
                  </Row>
                </Col>
              </Row>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  )
}

export default Counter
