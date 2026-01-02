import about28Img from '@/assets/images/about/28.jpg'
import avatar1 from '@/assets/images/avatar/01.jpg'
import avatar2 from '@/assets/images/avatar/02.jpg'
import avatar3 from '@/assets/images/avatar/03.jpg'
import avatar4 from '@/assets/images/avatar/04.jpg'
import avatar5 from '@/assets/images/avatar/05.jpg'
import GlightBox from '@/components/GlightBox'
import { Button, Card, Col, Container, Row } from 'react-bootstrap'
import { BsClockHistory } from 'react-icons/bs'
import { FaPlay } from 'react-icons/fa'

const Banner = () => {
  return (
    <section>
      <Container>
        <Row className="g-4 g-md-5">
          <Col lg={8}>
            <h1>Design logo using Adobe Illustrator and Photoshop.</h1>
            <div className="d-sm-flex justify-content-between align-items-center mb-2">
              <div className="d-flex align-items-center mb-3">
                <div className="avatar">
                  <img className="avatar-img rounded-circle" src={avatar5} alt="avatar" />
                </div>
                <div className="ms-2">
                  <p className="mb-0 small">With</p>
                  <h5 className="mb-0">Lori Stevens</h5>
                </div>
              </div>
              <div className="mt-2 mt-sm-0">
                <p className="text-danger mb-0">
                  <BsClockHistory className="me-2" />
                  Class Start in: 22 Days 15:01:30
                </p>
                <a href="#" className="btn btn-link mb-0 p-0 text-primary-hover text-decoration-underline text-reset">
                  Notify me
                </a>
              </div>
            </div>
            <p className="mb-0">
              We understand that theory is important to build a solid foundation, we understand that theory alone isn&apos;t going to get the job done
              so that&apos;s why this course is packed with practical hands-on examples that you can follow step by step.
            </p>
          </Col>
          <Col lg={4}>
            <Card className="card-body bg-light p-5 text-center">
              <h5 className="fw-normal">One-Time Payment</h5>
              <h2>$557</h2>
              <Button variant="blue" className="mb-2">
                Enroll now
              </Button>
              <ul className="avatar-group mb-1 justify-content-center">
                <li className="avatar avatar-sm">
                  <img className="avatar-img rounded-circle" src={avatar1} alt="avatar" />
                </li>
                <li className="avatar avatar-sm">
                  <img className="avatar-img rounded-circle" src={avatar2} alt="avatar" />
                </li>
                <li className="avatar avatar-sm">
                  <img className="avatar-img rounded-circle" src={avatar3} alt="avatar" />
                </li>
                <li className="avatar avatar-sm">
                  <img className="avatar-img rounded-circle" src={avatar4} alt="avatar" />
                </li>
              </ul>
              <p className="mb-0">Join hundreds of students.</p>
            </Card>
          </Col>
          <Col md={12} className="text-center mx-auto">
            <Card
              className="card-body shadow p-2 h-200px h-sm-400px position-relative overflow-hidden"
              style={{ backgroundImage: `url(${about28Img})`, backgroundPosition: 'center left', backgroundSize: 'cover' }}>
              <div className="bg-overlay bg-dark opacity-6" />
              <div className="card-img-overlay">
                <div className="position-absolute top-50 start-50 translate-middle">
                  <GlightBox
                    href="https://www.youtube.com/embed/tXHviS-4ygo"
                    className="btn btn-lg text-danger btn-round btn-white-shadow mb-0"
                    data-glightbox
                    data-gallery="video-tour">
                    <FaPlay size={16} />
                  </GlightBox>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </Container>
    </section>
  )
}

export default Banner
