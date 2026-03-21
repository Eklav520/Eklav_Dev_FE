import { developedBy, developedByLink } from '@/context/constants'
import { Link } from 'react-router-dom'

import logoLight from '@/assets/images/logo-light.svg'
import { Col, Container, Row } from 'react-bootstrap'
import { FaFacebook, FaInstagram, FaLinkedinIn, FaTwitter } from 'react-icons/fa'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-dark py-3">
      <Container>
        <Row className="align-items-center">
          
          {/* Logo */}
          <Col md={4} className="text-center text-md-start mb-3 mb-md-0">
            <Link to="/">
              <img
                className="h-20px"
                src={logoLight}
                height={20}
                width={94}
                alt="Eklav Logo"
              />
            </Link>
          </Col>

          {/* Copyright */}
          <Col md={4} className="mb-3 mb-md-0">
            <div className="text-center text-white small">
              © {currentYear} <strong>Eklav</strong>. All rights reserved. Developed by{' '}
              <Link
                to={developedByLink}
                target="_blank"
                className="text-white text-decoration-underline"
              >
                {developedBy}
              </Link>
            </div>
          </Col>

          {/* Social Icons */}
          <Col md={4}>
            <ul className="list-inline mb-0 text-center text-md-end">
              <li className="list-inline-item ms-2">
                <Link to="#">
                  <FaFacebook className="text-white" />
                </Link>
              </li>
              <li className="list-inline-item ms-2">
                <Link to="#">
                  <FaInstagram className="text-white" />
                </Link>
              </li>
              <li className="list-inline-item ms-2">
                <Link to="#">
                  <FaLinkedinIn className="text-white" />
                </Link>
              </li>
              <li className="list-inline-item ms-2">
                <Link to="#">
                  <FaTwitter className="text-white" />
                </Link>
              </li>
            </ul>
          </Col>

        </Row>
      </Container>
    </footer>
  )
}

export default Footer