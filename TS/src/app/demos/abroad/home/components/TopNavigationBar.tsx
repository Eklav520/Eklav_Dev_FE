import TopNavbar from '@/components/TopNavbar'
import { useLayoutContext } from '@/context/useLayoutContext'

import { Link } from 'react-router-dom'
import { BsCart2, BsSearch, BsXLg } from 'react-icons/bs'
import { FaChevronDown, FaClock } from 'react-icons/fa'
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Col,
  Collapse,
  Container,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  NavItem,
  Row,
} from 'react-bootstrap'

import logo from '@/assets/images/logo.svg'
import logoLight from '@/assets/images/logo-light.svg'
import book2 from '@/assets/images/book/02.jpg'
import ChoicesFormInput from '@/components/form/ChoicesFormInput'

const TopNavigationBar = () => {
  const { appMenuControl } = useLayoutContext()
  return (
    <TopNavbar>
      <Container>
        <Row className="d-flex w-100 mx-auto align-items-center">
          <Col xs={3} md={4} xl={5} className="d-flex align-items-center ps-0">
            <button onClick={appMenuControl.toggle} className="navbar-toggler p-2" type="button" aria-expanded={appMenuControl.open}>
              <span className="navbar-toggler-animation">
                <span />
                <span />
                <span />
              </span>
              &nbsp;
              <span className="text-body small d-none d-sm-inline-block ms-2">Menu</span>
            </button>
            <Collapse className="navbar-collapse" in={appMenuControl.open}>
              <div>
                <ul className="navbar-nav navbar-nav-scroll">
                  <Dropdown as="li" className="nav-item">
                    <DropdownToggle as="a" className="arrow-none nav-link d-flex align-items-center justify-content-between ps-0">
                      Category
                      <FaChevronDown className="ms-1" size={10} />
                    </DropdownToggle>
                    <ul className="dropdown-menu" aria-labelledby="demoMenu">
                      <li>

                        <DropdownItem href="#">IELTS</DropdownItem>
                      </li>
                      <li>

                        <DropdownItem href="#">GRE</DropdownItem>
                      </li>
                      <li>

                        <DropdownItem href="#">Duolingo</DropdownItem>
                      </li>
                      <li>

                        <DropdownItem href="#">Toefl</DropdownItem>
                      </li>
                    </ul>
                  </Dropdown>
                  <NavItem as={'li'}>
                    <a className="nav-link" href="#">
                      Eklav business
                    </a>
                  </NavItem>
                  <NavItem as={'li'}>
                    <a className="nav-link" href="#">
                      My learning
                    </a>
                  </NavItem>
                  <NavItem as={'li'}>
                    <a className="nav-link" href="#">
                      Contact
                    </a>
                  </NavItem>
                </ul>
              </div>
            </Collapse>
          </Col>
          <Col xs={6} md={4} xl={2} className="text-center d-flex">
            <Link className="navbar-brand mx-auto" to="/">
              <img className="navbar-brand-item light-mode-item" src={logo} alt="logo" />
              <img className="navbar-brand-item dark-mode-item" src={logoLight} alt="logo" />
            </Link>
          </Col>
          <Col xs={3} md={4} xl={5} className="d-flex justify-content-end pe-0">
            <ul className="nav flex-row align-items-center list-unstyled ms-xl-auto">
              <Dropdown className="nav-item ms-2 position-relative overflow-visible">
                <DropdownToggle as="a" className="nav-link mb-0 stretched-link" role="button">
                  <BsCart2 className="fs-4" />
                </DropdownToggle>
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-circle text-bg-success mt-2 mt-xl-3 ms-n3 smaller">
                  5<span className="visually-hidden">unread messages</span>
                </span>
                <DropdownMenu className="dropdown-animation dropdown-menu-end dropdown-menu-size-md p-0 shadow-lg border-0">
                  <Card className="bg-transparent">
                    <CardHeader className="bg-transparent border-bottom py-4">
                      <h5 className="m-0">Cart items</h5>
                    </CardHeader>
                    <CardBody className="p-0">
                      <Row className="p-3 g-2">
                        <Col xs={3}>
                          <img className="rounded-2" src={book2} alt="avatar" />
                        </Col>
                        <Col xs={9}>
                          <div className="d-flex justify-content-between">
                            <h6 className="m-0">Angular 4 Tutorial in audio (Compact Disk)</h6>
                            <a href="#" className="small text-primary-hover">
                              <BsXLg />
                            </a>
                          </div>
                          <form className="choices-sm pt-2 col-4">
                            <ChoicesFormInput
                              options={{ searchEnabled: false }}
                              className="form-select js-choice border-0 bg-transparent"
                              data-search-enabled="false">
                              <option>1</option>
                              <option selected>2</option>
                              <option>3</option>
                              <option>4</option>
                              <option>5</option>
                            </ChoicesFormInput>
                          </form>
                        </Col>
                      </Row>
                    </CardBody>
                    <CardFooter className="bg-transparent border-top py-3 text-center d-flex justify-content-between position-relative">
                      <Button variant="light" size="sm" className="mb-0">
                        View Cart
                      </Button>
                      <Button variant="success" size="sm" className="mb-0">
                        Checkout
                      </Button>
                    </CardFooter>
                  </Card>
                </DropdownMenu>
              </Dropdown>
              <Dropdown className="nav-item nav-search d-none d-sm-block">
                <DropdownToggle
                  as="a"
                  className="arrow-none nav-link mb-0"
                  role="button"
                  id="navSearch"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  data-bs-auto-close="outside"
                  data-bs-display="static">
                  <BsSearch className="fs-4"> </BsSearch>
                </DropdownToggle>
                <DropdownMenu className="dropdown-menu-end shadow rounded p-2" aria-labelledby="navSearch">
                  <form className="input-group">
                    <input className="form-control border-primary" type="search" placeholder="Search..." aria-label="Search" />
                    <button className="btn btn-primary m-0" type="submit">
                      Search
                    </button>
                  </form>
                  <ul className="list-group list-group-borderless p-2 small">
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                      <span className="fw-bold">Recent Searches:</span>
                      <button className="btn btn-sm btn-link mb-0 px-0">Clear all</button>
                    </li>
                    <li className="list-group-item text-primary-hover text-truncate">
                      <Link to="#" className="text-body">

                        <FaClock className="me-1" />
                        Digital marketing course for Beginner
                      </Link>
                    </li>
                  </ul>
                </DropdownMenu>
              </Dropdown>
              <li className="nav-item ms-2 d-none d-md-block">
                <Button variant="dark" size="sm" className="mb-0">
                  Sign In
                </Button>
              </li>
            </ul>
          </Col>
        </Row>
      </Container>
    </TopNavbar>
  )
}

export default TopNavigationBar
