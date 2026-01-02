import instructorImg from '@/assets/images/instructor/10.jpg'
import { Col, Container, Row } from 'react-bootstrap'
import { FaFacebookSquare, FaTwitterSquare, FaYoutubeSquare } from 'react-icons/fa'
import { FaSquareInstagram } from 'react-icons/fa6'

const About = () => {
  return (
    <section>
      <Container>
        <Row className="g-lg-5 align-items-lg-center">
          <Col md={4}>
            <img src={instructorImg} className="rounded-2" alt="..." />
          </Col>
          <Col md={8}>
            <h2 className="mb-0">Frances Guerrero</h2>
            <h6 className="mb-3">Graphic Designer</h6>
            <p>
              Satisfied conveying a dependent contented he gentleman agreeable do be. Warrant private blushes removed an in equally totally if.
              Delivered dejection necessary objection do Mr prevailed. Mr feeling does chiefly cordial in do.
            </p>
            <p>
              We focus a great deal on the understanding of behavioral psychology and influence triggers which are crucial for becoming a well-rounded
              Digital Marketer. We understand that theory is important to build a solid foundation, we understand that theory alone isn’t going to get
              the job done so that’s why this course is packed with practical hands-on examples that you can follow step by step.
            </p>
            <ul className="list-inline hstack flex-wrap gap-3 mb-0">
              <li className="list-inline-item">

                <h5 className="mb-0">Follow me on:</h5>
              </li>
              <li className="list-inline-item">

                <a className="text-facebook" href="#">
                  <FaFacebookSquare /> Facebook
                </a>
              </li>
              <li className="list-inline-item">

                <a className="text-danger" href="#">
                  <FaSquareInstagram /> Instagram
                </a>
              </li>
              <li className="list-inline-item">

                <a className="text-twitter" href="#">
                  <FaTwitterSquare /> Twitter
                </a>
              </li>
              <li className="list-inline-item">

                <a className="text-youtube" href="#">
                  <FaYoutubeSquare /> Youtube
                </a>
              </li>
            </ul>
          </Col>
        </Row>
      </Container>
    </section>
  )
}

export default About
