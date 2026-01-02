import { Link } from 'react-router-dom'
import { Col, Container, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Row } from 'react-bootstrap'
import { footerLinks, socialMediaLinks } from '@/assets/data/footer-items'
import { FaChevronUp, FaGlobe } from 'react-icons/fa'
import clsx from 'clsx'
import { developedBy, developedByLink } from '@/context/constants'

import logoLight from '@/assets/images/logo-light.svg'
import googlePlay from '@/assets/images/client/google-play.svg'
import playStore from '@/assets/images/client/app-store.svg'
import ukFlag from '@/assets/images/flags/uk.svg'
import grFlag from '@/assets/images/flags/gr.svg'
import spFlag from '@/assets/images/flags/sp.svg'

const Footer = () => {
  return (
    <footer className="bg-dark pt-5">
      <Container>
        <Row className="g-4">
          <Col lg={3}>
            <Link className="me-0" to="/">
              <img width={189} height={40} className="h-40px" src={logoLight} alt="logo" />
            </Link>
            <p className="my-3 text-body-secondary">
              Eklav education theme, built specifically for the education centers which is dedicated to teaching and involving learners.
            </p>
            <ul className="list-inline mb-0 mt-3">
              {socialMediaLinks.map((item, idx) => {
                const Icon = item.icon
                return (
                  <li className="list-inline-item" key={idx}>

                    <Link className={clsx('btn btn-white btn-sm shadow px-2', item.variant)} to="">
                      <Icon className="fa-fw" />
                    </Link>
                  </li>
                )
              })}
            </ul>
          </Col>
          <Col lg={6}>
            <Row className="g-4">
              {footerLinks.map((link, idx) => (
                <Col xs={6} md={4} key={idx}>
                  <h5 className="mb-2 mb-md-4 text-white">{link.title}</h5>
                  <ul className="nav flex-column text-primary-hover">
                    {link.items.map((item, idx) => (
                      <li className="nav-item" key={idx}>
                        <Link className="nav-link" to={item.link ?? ''}>
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </Col>
              ))}
            </Row>
          </Col>
          <Col lg={3}>
            <h5 className="mb-2 mb-md-4 text-white">Contact</h5>
            <p className="mb-2 text-body-secondary">
              Toll free:<span className="h6 fw-light text-white ms-2">+1234 568 963</span>
              <span className="d-block small">(9:AM to 8:PM IST)</span>
            </p>
            <p className="mb-0 text-body-secondary">
              Email:<span className="h6 fw-light text-white ms-2">example@gmail.com</span>
            </p>
            <Row className="g-2 mt-2">
              <Col xs={6} sm={4} md={3} lg={6}>
                <span role="button">

                  <img height={45} width={145} src={googlePlay} alt="google-play" />
                </span>
              </Col>
              <Col xs={6} sm={4} md={3} lg={6}>
                <span role="button">

                  <img height={45} width={145} src={playStore} alt="app-store" />
                </span>
              </Col>
            </Row>
          </Col>
        </Row>
        <hr className="mt-4 mb-0" />
        <div className="py-3">
          <Container className="px-0">
            <div className="d-lg-flex justify-content-between align-items-center py-3 text-center text-md-left">
              <div className="text-body-secondary">

                Copyrights ©2024 Eklav. All rights reserved3
                <Link to={developedByLink} className="text-body-secondary text-primary-hover">
                  {developedBy}
                </Link>
                .
              </div>
              <div className="nav justify-content-center mt-3 mt-lg-0">
                <ul className="list-inline mb-0">
                  <li className="list-inline-item text-primary-hover">
                    <Dropdown className="dropup mt-0 text-center text-sm-end">
                      <DropdownToggle
                        as="a"
                        className="nav-link arrow-none"
                        role="button"
                        id="languageSwitcher"
                        data-bs-toggle="dropdown"
                        aria-expanded="false">
                        <FaGlobe className="me-2" />
                        Language <FaChevronUp size={12} />
                      </DropdownToggle>
                      <DropdownMenu as="ul" className="min-w-auto" aria-labelledby="languageSwitcher">
                        <li>
                          <DropdownItem className="me-4 text-body" href="#">
                            <img alt="uk" height={12} width={18} className="fa-fw me-2" src={ukFlag} />
                            English
                          </DropdownItem>
                        </li>
                        <li>
                          <DropdownItem className="me-4 text-body" href="#">
                            <img alt="gr" height={12} width={18} className="fa-fw me-2" src={grFlag} />
                            German
                          </DropdownItem>
                        </li>
                        <li>
                          <DropdownItem className="me-4 text-body" href="#">
                            <img alt="sp" height={12} width={18} className="fa-fw me-2" src={spFlag} />
                            French
                          </DropdownItem>
                        </li>
                      </DropdownMenu>
                    </Dropdown>
                  </li>
                  <li className="list-inline-item text-primary-hover">
                    <a className="nav-link" href="#">
                      Terms of use
                    </a>
                  </li>
                  <li className="list-inline-item text-primary-hover">
                    <a className="nav-link pe-0" href="#">
                      Privacy policy
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </Container>
        </div>
      </Container>
    </footer>
  )
}

export default Footer
