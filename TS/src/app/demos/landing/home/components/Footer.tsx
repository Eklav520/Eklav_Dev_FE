import { Link } from 'react-router-dom'
import { Col, Container, Row } from 'react-bootstrap'
import { developedBy, developedByLink } from '@/context/constants'
import { FaFacebookSquare, FaInstagramSquare, FaLinkedin, FaTwitterSquare } from 'react-icons/fa'

import { footerItems } from '../data'

import logoLight from '@/assets/images/logo-light.svg'
import logo from '@/assets/images/logo.svg'
import clsx from 'clsx'

const Footer = () => {
  return (
    <footer>
      <Container>
        <Row className="g-4 justify-content-between pt-5">
          <Col md={5} lg={4}>
            <Link className="me-0" to="/">
              <img height={40} width={189} className="light-mode-item h-40px" src={logo} alt="logo" />
              <img height={40} width={189} className="dark-mode-item h-40px" src={logoLight} alt="logo" />
            </Link>
            <p className="my-3">
              Eklav education theme, built specifically for the education centers which is dedicated to teaching and involve learners.
            </p>
            <form className="row row-cols-lg-auto g-2">
              <Col xs={12}>
                <input type="email" className="form-control" placeholder="Enter your email address" />
              </Col>
              <Col xs={12}>
                <button type="submit" className="btn btn-dark m-0">
                  Subscribe
                </button>
              </Col>
            </form>
          </Col>
          <Col md={7} lg={6}>
            <Row className="g-4 g-lg-5">
              <Col xs={6} sm={4}>
                <ul className="nav flex-column">
                  {footerItems.map((item, idx) => (
                    <li className="nav-item" key={idx}>
                      <Link className={clsx('nav-link', { 'pt-0': idx === 0 })} to={item.link ?? ''}>
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Col>
              <Col xs={6} sm={4}>
                <ul className="nav flex-column">
                  <li className="nav-item">
                    <Link className="nav-link pt-0" to="#">
                      Become instructor
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="#">
                      Download
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="#">
                      Pricing
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="#">
                      Services
                    </Link>
                  </li>
                </ul>
              </Col>
              <Col xs={6} sm={4}>
                <ul className="nav flex-column">
                  <li className="nav-item">
                    <Link className="nav-link pt-0" to="#">
                      <FaFacebookSquare className="text-facebook me-2" />
                      Facebook
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="#">
                      <FaInstagramSquare className="text-instagram-gradient text-danger me-2" />
                      Instagram
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="#">
                      <FaTwitterSquare className="text-twitter me-2" />
                      Twitter
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="#">
                      <FaLinkedin className="text-linkedin me-2" />
                      Linkedin
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

                Copyrights ©2024 Eklav. All rights reserved6
                <Link to={developedByLink} target="_blank" className="text-reset">
                  {developedBy}
                </Link>
                .
              </div>
              <div className="nav justify-content-center mt-3 mt-md-0">
                <ul className="list-inline mb-0">
                  <li className="list-inline-item">
                    <Link className="nav-link" to="">
                      Terms of use
                    </Link>
                  </li>
                  <li className="list-inline-item">
                    <Link className="nav-link" to="">
                      Privacy policy
                    </Link>
                  </li>
                  <li className="list-inline-item pe-0">
                    <Link className="nav-link" to="">
                      Cookies
                    </Link>
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
