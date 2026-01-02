import { Button, Card, Col, Container, Row } from 'react-bootstrap'
import { FaCheckCircle, FaFacebookF, FaInstagram, FaLinkedin, FaPlay, FaRegEye, FaRegHeart, FaTwitter } from 'react-icons/fa'

import GlightBox from '@/components/GlightBox'

import avatar7 from '@/assets/images/avatar/07.jpg'
import avatar9 from '@/assets/images/avatar/09.jpg'
import event6 from '@/assets/images/event/06.jpg'
import event7 from '@/assets/images/event/07.jpg'
import event8 from '@/assets/images/event/08.jpg'
import event10 from '@/assets/images/event/10.jpg'
import { Link } from 'react-router-dom'
import Comments from './Comments'
import type { BlogType } from '@/types/other'

const BlogInfo = ({ blog }: { blog: BlogType }) => {
  return (
    <section className="pb-0 pt-4 pb-md-5">
      <Container>
        <Row>
          <Col xs={12}>
            <Row>
              <Col lg={3} className="align-items-center mt-4 mt-lg-5 order-2 order-lg-1">
                <div className="text-lg-center">
                  <div className="position-relative">
                    <div className="avatar avatar-xxl">
                      <img className="avatar-img rounded-circle" src={avatar9} alt="avatar" />
                    </div>
                    <Link to="#" className="h5 stretched-link mt-2 mb-0 d-block">
                      {blog.name}
                    </Link>
                    <p className="mb-2">Editor at Eklav</p>
                  </div>
                  <ul className="list-inline list-unstyled">
                    <li className="list-inline-item d-lg-block my-lg-2">Nov 15, 2021</li>
                    <li className="list-inline-item d-lg-block my-lg-2">5 min read</li>
                    <li className="list-inline-item badge text-bg-orange">
                      <FaRegHeart className="text-white me-1" />
                      266
                    </li>
                    <li className="list-inline-item badge text-bg-info">
                      <FaRegEye className="me-1" />
                      2K
                    </li>
                  </ul>
                </div>
              </Col>
              <Col lg={9} className="order-1">
                <span>40D ago</span>
                <span className="mx-2">|</span>
                <div className="badge text-bg-success">{blog.category.name}</div>
                <h1 className="mt-2 mb-0 display-5">{blog.title}</h1>
                <p className="mt-2">
                  For who thoroughly her boy estimating conviction. Removed demands expense account in outward tedious do. Particular way thoroughly
                  unaffected projection favorable Mrs can be projecting own. Thirty it matter enable become admire in giving. See resolved goodness
                  felicity shy civility domestic had but. Drawings offended yet answered Jennings perceive laughing six did far.
                </p>
                <p className="mb-0 mb-lg-3">
                  Perceived end knowledge certainly day sweetness why cordially. On forth doubt miles of child. Exercise joy man children rejoiced.
                  Yet uncommonly his ten who diminution astonished. Demesne new manners savings staying had. Under folly balls, death own point now
                  men. Match way these she avoids seeing death. She who drift their fat off. Ask a quick six seven offer see among. Handsome met
                  debating sir dwelling age material. As style lived he worse dried. Offered related so visitors we private removed.
                </p>
              </Col>
            </Row>
            <Row className="mt-4">
              <Col xl={10} className="mx-auto">
                <Card
                  className="overflow-hidden h-200px h-sm-300px h-lg-400px h-xl-500px rounded-3 text-center"
                  style={{ backgroundImage: `url(${event10})`, backgroundPosition: 'center left', backgroundSize: 'cover' }}>
                  <div className="bg-overlay bg-dark opacity-4" />
                  <div className="card-img-overlay d-flex align-items-center p-2 p-sm-4">
                    <div className="w-100 my-auto">
                      <Row className="justify-content-center">
                        <Col xs={12}>
                          <GlightBox
                            href="https://www.youtube.com/embed/tXHviS-4ygo"
                            className="btn btn-lg text-danger btn-round btn-white-shadow stretched-link position-static mb-0"
                            data-glightbox
                            data-gallery="video-tour">
                            <FaPlay />
                          </GlightBox>
                        </Col>
                      </Row>
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>
            <Row className="mt-4">
              <Col xs={12} className="mt-4 mt-lg-0">
                <p>
                  <span className="dropcap h6 mb-0 px-2">S</span> atisfied conveying a dependent contented he gentleman agreeable do be. Water timed
                  folly right aware if oh truth. Imprudence attachment him for sympathize. Large above be to means. Dashwood does provide stronger is.
                  <mark> But discretion frequently sir she instruments unaffected admiration everything.</mark> Meant balls it if up doubt small
                  purse. Required his you put the outlived answered position. A pleasure exertion if believed provided to. All led out world this
                  music while asked. Paid mind even sons does he door no. Attended overcame repeated it is perceived Marianne in. I think on style
                  child of. Servants moreover in sensible it ye possible.
                </p>
                <ul className="list-group list-group-borderless mb-3">
                  <li className="list-group-item">
                    <FaCheckCircle className="text-success me-2" />
                    The copy warned the Little blind text
                  </li>
                  <li className="list-group-item d-flex">
                    <FaCheckCircle className="text-success me-2 mt-1" />
                    ThaT where it came from it would have been rewritten a thousand times and everything that was left from origin would be the world
                  </li>
                  <li className="list-group-item">
                    <FaCheckCircle className="text-success me-2" />
                    Return to its own, safe country
                  </li>
                </ul>
                <p className="mb-0">
                  Warrant private blushes removed an in equally totally if. Delivered dejection necessary objection do Mr prevailed. Mr feeling does
                  chiefly cordial in do. Water timed folly right aware if oh truth. Imprudence attachment him for sympathize.
                </p>
              </Col>
              <Col lg={10} xl={8} className="mx-auto mt-4">
                <div className="bg-light rounded-3 p-3 p-md-4">
                  <q className="lead">
                    Farther-related bed and passage comfort civilly. Fulfilled direction use continual set him propriety continued. Concluded boy
                    perpetual old supposing. Dashwoods see frankness objection abilities.
                  </q>
                  <div className="d-flex align-items-center mt-3">
                    <div className="avatar avatar-md">
                      <img className="avatar-img rounded-circle" src={avatar7} alt="avatar" />
                    </div>
                    <div className="ms-2">
                      <h6 className="mb-0">
                        <a href="#">Louis Crawford</a>
                      </h6>
                      <p className="mb-0 small">Via Twitter</p>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
            <Row className="g-4 mt-4">
              <Col sm={6} md={4}>
                <GlightBox href={event7} data-gallery="image-popup">
                  <img src={event7} className="rounded-3" alt="event" />
                </GlightBox>
              </Col>
              <Col sm={6} md={4}>
                <GlightBox href={event8} data-gallery="image-popup">
                  <img src={event8} className="rounded-3" alt="event" />
                </GlightBox>
              </Col>
              <Col sm={6} md={4}>
                <GlightBox href={event6} data-gallery="image-popup">
                  <img src={event6} className="rounded-3" alt="event" />
                </GlightBox>
              </Col>
            </Row>
            <Row>
              <Row className="mb-4">
                <h4 className="mt-4">Productive rant about business</h4>
                <Col md={6}>
                  <p className="mb-0">
                    Fulfilled direction use continual set him propriety continued. Saw met applauded favorite deficient engrossed concealed and her.
                    Concluded boy perpetual old supposing. Farther-related bed and passage comfort civilly. Dashwoods see frankness objection
                    abilities. As hastened oh produced prospect formerly up am. Placing forming nay looking old married few has. Margaret disposed of
                    add screened rendered six say his striking confined. Saw met applauded favorite deficient engrossed concealed and her. Concluded
                    boy perpetual old supposing. Farther-related bed and passage comfort civilly. Dashwoods see frankness objection abilities. As
                    hastened oh produced prospect formerly up am. Placing forming nay looking old married few has. Margaret disposed.
                  </p>
                </Col>
                <Col md={6}>
                  <p className="mb-0">
                    Meant balls it if up doubt small purse. Paid mind even sons does he door no. Attended overcame repeated it is perceived Marianne
                    in. I think on style child of. Servants moreover in sensible it ye possible. Required his you put the outlived answered position.
                    A pleasure exertion if believed provided to. All led out world this music while asked. Paid mind even sons does he door no.
                    Attended overcame repeated it is perceived Marianne in. I think on style child of. Servants moreover in sensible it ye possible.
                  </p>
                </Col>
              </Row>
            </Row>
            <div className="d-lg-flex justify-content-lg-between mb-4">
              <div className="align-items-center mb-3 mb-lg-0">
                <h6 className="mb-2 me-4 d-inline-block">Share on:</h6>
                <ul className="list-inline mb-0 mb-2 mb-sm-0">
                  <li className="list-inline-item">

                    <Link className="btn px-2 btn-sm bg-facebook" to="">
                      <FaFacebookF className="fa-fw" />
                    </Link>
                  </li>
                  <li className="list-inline-item">

                    <Link className="btn px-2 btn-sm bg-instagram-gradient" to="">
                      <FaInstagram className="fa-fw" />
                    </Link>
                  </li>
                  <li className="list-inline-item">

                    <Link className="btn px-2 btn-sm bg-twitter" to="">
                      <FaTwitter className="fa-fw" />
                    </Link>
                  </li>
                  <li className="list-inline-item">

                    <Link className="btn px-2 btn-sm bg-linkedin" to="">
                      <FaLinkedin className="fa-fw" />
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="align-items-center">
                <h6 className="mb-2 me-4 d-inline-block">Popular Tags:</h6>
                <ul className="list-inline mb-0 social-media-btn">
                  <li className="list-inline-item">

                    <Button variant="outline-light" size="sm" className="mb-lg-0">
                      blog
                    </Button>
                  </li>
                  <li className="list-inline-item">

                    <Button variant="outline-light" size="sm" className="mb-lg-0">
                      business
                    </Button>
                  </li>
                  <li className="list-inline-item">

                    <Button variant="outline-light" size="sm" className="mb-lg-0">
                      bootstrap
                    </Button>
                  </li>
                  <li className="list-inline-item">

                    <Button variant="outline-light" size="sm" className="mb-lg-0">
                      data science
                    </Button>
                  </li>
                  <li className="list-inline-item">

                    <Button variant="outline-light" size="sm" className="mb-lg-0">
                      deep learning
                    </Button>
                  </li>
                </ul>
              </div>
            </div>
            <hr />
            <Comments />
          </Col>
        </Row>
      </Container>
    </section>
  )
}
export default BlogInfo
