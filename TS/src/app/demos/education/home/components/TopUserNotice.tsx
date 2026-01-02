import { Link } from 'react-router-dom'
import { Container, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { FaChevronDown, FaFacebook, FaGlobe, FaHeadset, FaInstagram, FaLinkedinIn, FaRegClock, FaTwitter } from 'react-icons/fa'

import ukFlag from '@/assets/images/flags/uk.svg'
import spFlag from '@/assets/images/flags/sp.svg'
import frFlag from '@/assets/images/flags/fr.svg'
import grFlag from '@/assets/images/flags/gr.svg'

const TopUserNotice = () => {
  return (
    <div className="navbar-top navbar-dark bg-light d-none d-xl-block py-2 mx-2 mx-md-4 rounded-bottom-4">
      <Container>
        <div className="d-lg-flex justify-content-lg-between align-items-center">
          <ul className="nav align-items-center justify-content-center">
            <OverlayTrigger placement="bottom" overlay={<Tooltip>Sunday CLOSED</Tooltip>}>
              <li className="nav-item me-3">
                <span>
                  <FaRegClock className="me-2" />
                  Visit time: Mon-Sat 9:00-19:00
                </span>
              </li>
            </OverlayTrigger>
            <li className="nav-item">
              <a className="nav-link" href="#">
                <FaHeadset className="me-2" />
                Call us now: +135-869-328
              </a>
            </li>
          </ul>
          <div className="nav d-flex align-items-center justify-content-center">
            <Dropdown className="me-3">
              <DropdownToggle className="nav-link" as="a" id="dropdownLanguage" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <FaGlobe className="me-2" />
                Language
                <FaChevronDown size={12} className="ms-1" />
              </DropdownToggle>
              <DropdownMenu className="mt-2 min-w-auto shadow" aria-labelledby="dropdownLanguage">
                <DropdownItem className="me-4" href="#">
                  <img width={18} height={12} className="fa-fw me-2" src={ukFlag} alt="flag" />
                  English
                </DropdownItem>
                <DropdownItem className="me-4" href="#">
                  <img width={18} height={12} className="fa-fw me-2" src={spFlag} alt="flag" />
                  Español
                </DropdownItem>
                <DropdownItem className="me-4" href="#">
                  <img width={18} height={12} className="fa-fw me-2" src={frFlag} alt="flag" />
                  Français
                </DropdownItem>
                <DropdownItem className="me-4" href="#">
                  <img width={18} height={12} className="fa-fw me-2" src={grFlag} alt="flag" />
                  Deutsch
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
            <ul className="list-unstyled d-flex mb-0">
              <li>

                <Link className="px-2 nav-link" to="">
                  <FaFacebook />
                </Link>
              </li>
              <li>

                <Link className="px-2 nav-link" to="">
                  <FaTwitter />
                </Link>
              </li>
              <li>

                <Link className="px-2 nav-link" to="">
                  <FaInstagram />
                </Link>
              </li>
              <li>

                <Link className="ps-2 nav-link" to="">
                  <FaLinkedinIn />
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </Container>
    </div>
  )
}

export default TopUserNotice
