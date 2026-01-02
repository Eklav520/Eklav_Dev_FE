import { Button, Col, Container, FormControl, Row } from 'react-bootstrap'
import { Link } from 'react-router-dom'

import { footerLinks } from '@/assets/data/footer-items'
import logoLight from '@/assets/images/logo-light.svg'
import logo from '@/assets/images/logo.svg'
import { currentYear, developedBy, developedByLink } from '@/context/constants'
import { BsInstagram } from 'react-icons/bs'
import { FaRegEnvelope, FaWhatsapp, FaYoutube } from 'react-icons/fa'

const Footer = () => {
  return (
    <footer className="pt-5">
      <Container>
        <Row className="g-4 justify-content-between">
          <Col md={5} lg={4}>
            <Link className="me-0" to="/">
              <img width={189} height={40} className="light-mode-item h-40px" src={logo} alt="logo" />
              <img width={189} height={40} className="dark-mode-item h-40px" src={logoLight} alt="logo" />
            </Link>
            <p className="my-3">
              Eklav education theme, built specifically for the education centers which is dedicated to teaching and involve learners.
            </p>
            <form className="row row-cols-lg-auto g-2">
              <Col xs={12}>
                <FormControl type="email" placeholder="Enter your email address" />
              </Col>
              <Col xs={12}>
                <Button variant="dark" type="submit" className="m-0">
                  Subscribe
                </Button>
              </Col>
            </form>
          </Col>
          <Col md={7} lg={6}>
            <Row className="g-4 g-lg-5">
              {footerLinks.slice(0, 2).map((item, idx) => (
                <Col xs={6} sm={4} key={idx}>
                  <h5 className="mb-2 mb-md-3">{item.title}</h5>
                  <ul className="nav flex-column">
                    {item.items.map((item, idx) => (
                      <li className="nav-item" key={idx}>
                        <Link className="nav-link" to={item.link ?? ''}>
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </Col>
              ))}
              <Col xs={6} sm={4}>
                <h5 className="mb-2 mb-md-3">Follow Us</h5>
                <ul className="nav flex-column">
                  <li className="nav-item">
                    <Link className="nav-link pt-0" to="">
                      <FaWhatsapp size={16} className="fa-fw me-1" />
                      WhatsApp
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="">
                      <FaYoutube size={16} className="fa-fw me-1" />
                      YouTube
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="">
                      <FaRegEnvelope size={16} className="fa-fw me-1" />
                      Newsletters
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="">
                      <BsInstagram size={16} className="fa-fw me-1" />
                      Instagram
                    </Link>
                  </li>
                </ul>
              </Col>
            </Row>
          </Col>
        </Row>
        <hr />
        <Row>
          <Col xs={12}>
            <div className="d-md-flex justify-content-between align-items-center pt-2 pb-4 text-center">
              <div className="text-primary-hover">

                Copyrights ©{currentYear} Eklav. All rights reserved
                <Link to={developedByLink} target="_blank" className="text-reset">
                  {developedBy}
                </Link>
                .
              </div>
              <div className="nav justify-content-center mt-3 mt-md-0">
                <ul className="list-inline mb-0">
                  <li className="list-inline-item">
                    <a className="nav-link" href="#">
                      Terms of use
                    </a>
                  </li>
                  <li className="list-inline-item">
                    <a className="nav-link" href="#">
                      Privacy policy
                    </a>
                  </li>
                  <li className="list-inline-item pe-0">
                    <a className="nav-link" href="#">
                      Cookies
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </footer>
  )
}

export default Footer
