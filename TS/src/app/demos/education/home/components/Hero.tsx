import GlightBox from '@/components/GlightBox'
import { Col, Container, Row } from 'react-bootstrap'
import { FaPlay } from 'react-icons/fa'

import bgImg3 from '@/assets/images/bg/03.jpg'
const Hero = () => {
  return (
    <section
      className="pt-0 position-relative overflow-hidden h-700px h-sm-600px h-lg-700px rounded-top-4 mx-2 mx-md-4"
      style={{ backgroundImage: `url(${bgImg3})`, backgroundPosition: 'center', backgroundSize: 'cover' }}>
      <div className="bg-overlay bg-dark opacity-5" />
      <figure className="position-absolute bottom-0 left-0 w-100 d-md-block mb-n3 z-index-9">
        <svg className="fill-body" width="100%" height={150} viewBox="0 0 500 150" preserveAspectRatio="none">
          <path d="M0,150 L0,40 Q250,150 500,40 L580,150 Z" />
        </svg>
      </figure>
      <figure className="position-absolute top-0 start-50 translate-middle-x z-index-9 mt-5">
        <svg width="29px" height="29px">
          <path
            className="fill-orange"
            d="M29.004,14.502 C29.004,22.512 22.511,29.004 14.502,29.004 C6.492,29.004 -0.001,22.512 -0.001,14.502 C-0.001,6.492 6.492,-0.001 14.502,-0.001 C22.511,-0.001 29.004,6.492 29.004,14.502 Z"
          />
        </svg>
      </figure>
      <Container className="z-index-9 position-relative">
        <figure className="position-absolute bottom-0 end-0 z-index-9 ms-5 mb-5">
          <svg width="23px" height="23px">
            <path
              className="fill-primary"
              d="M23.003,11.501 C23.003,17.854 17.853,23.003 11.501,23.003 C5.149,23.003 -0.001,17.854 -0.001,11.501 C-0.001,5.149 5.149,-0.000 11.501,-0.000 C17.853,-0.000 23.003,5.149 23.003,11.501 Z"
            />
          </svg>
        </figure>
        <Row className="py-0 py-md-5 align-items-center text-center text-sm-start">
          <Col sm={10} lg={8} xl={6} className="all-text-white my-5 mt-md-0">
            <div className="py-0 py-md-5 my-5">
              <div className="d-inline-block bg-white px-3 py-2 rounded-pill mb-3">
                <p className="mb-0 text-dark">
                  <span className="badge text-bg-success rounded-pill me-1">New</span> One to one video call using web browser
                </p>
              </div>
              <h1 className="text-white display-5">
                Start learning from <span className="text-warning">best institutions</span>
              </h1>
              <p className="text-white">
                Demesne far-hearted suppose venture excited see had has. Dependent on so extremely delivered by. Yet no jokes worse her why.
              </p>
              <div className="d-sm-flex align-items-center mt-4">
                <a href="#" className="btn btn-primary me-2 mb-4 mb-sm-0">
                  Get Started
                </a>
                <div className="d-flex align-items-center justify-content-center py-2 ms-0 ms-sm-4">
                  <GlightBox
                    data-gallery="office-tour"
                    href="https://www.youtube.com/embed/tXHviS-4ygo"
                    className="btn btn-round btn-white-shadow text-danger me-7 mb-0 overflow-visible">
                    <FaPlay className="fas fa-play" />
                    <h6 className="mb-0 ms-3 text-white fw-normal position-absolute start-100 top-50 translate-middle-y">Watch video</h6>
                  </GlightBox>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  )
}

export default Hero
