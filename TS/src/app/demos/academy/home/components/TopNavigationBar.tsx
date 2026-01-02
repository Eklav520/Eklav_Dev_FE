import clsx from 'clsx'

import { Link } from 'react-router-dom'
import {
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
} from 'react-bootstrap'
import { BsBell, BsGridFill, BsHeart } from 'react-icons/bs'
import { FaChevronDown, FaSearch } from 'react-icons/fa'

import LogoBox from '@/components/LogoBox'
import ProfileDropdown from '@/components/TopNavbar/components/ProfileDropdown'
import useScrollEvent from '@/hooks/useScrollEvent'
import useToggle from '@/hooks/useToggle'

import avatar3 from '@/assets/images/avatar/03.jpg'

const NotificationDropdown = () => {
  return (
    <Dropdown className="nav-item ms-2 ms-sm-3">
      <DropdownToggle
        className="btn btn-light btn-round arrow-none mb-0"
        as="a"
        role="button"
        data-bs-toggle="dropdown"
        aria-expanded="false"
        data-bs-auto-close="outside">
        <BsBell className="fa-fw" />
      </DropdownToggle>
      <span className="notif-badge animation-blink" />
      <DropdownMenu className="dropdown-animation dropdown-menu-end dropdown-menu-size-md p-0 shadow-lg border-0">
        <Card className="bg-transparent">
          <CardHeader className="bg-transparent border-bottom py-4 d-flex justify-content-between align-items-center">
            <h6 className="m-0">
              Notifications <span className="badge bg-danger bg-opacity-10 text-danger ms-2">2 new</span>
            </h6>
            <a className="small" href="#">
              Clear all
            </a>
          </CardHeader>
          <CardBody className="p-0">
            <ul className="list-group list-unstyled list-group-flush">
              <li>
                <a href="#" className="list-group-item-action border-0 border-bottom d-flex p-3">
                  <div className="me-3">
                    <div className="avatar avatar-md">
                      <img className="avatar-img rounded-circle" src={avatar3} alt="avatar" />
                    </div>
                  </div>
                  <div>
                    <h6 className="mb-1">Update v2.3 completed successfully</h6>
                    <p className="small text-body m-0">What&apos;s new! Find out about new features</p>
                    <small className="text-body">5 min ago</small>
                  </div>
                </a>
              </li>
            </ul>
          </CardBody>
          <CardFooter className="bg-transparent border-0 py-3 text-center position-relative">
            <Link to="" className="stretched-link">
              See all incoming activity
            </Link>
          </CardFooter>
        </Card>
      </DropdownMenu>
    </Dropdown>
  )
}

const TopNavigationBar = () => {
  const { scrollY } = useScrollEvent()
  const { isTrue: isOpen, toggle } = useToggle()
  const { isTrue: isOpenCategory, toggle: toggleCategory } = useToggle()

  return (
    <>
      <header className={clsx('navbar-light navbar-sticky', { 'navbar-sticky-on': scrollY >= 400 })}>
        <nav className="navbar navbar-expand-xl z-index-9">
          <Container>
            <LogoBox height={36} width={170} />
            <button
              onClick={toggle}
              className="navbar-toggler ms-auto"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbarCollapse"
              aria-controls="navbarCollapse"
              aria-expanded="false"
              aria-label="Toggle navigation">
              <span className="navbar-toggler-animation">
                <span />
                <span />
                <span />
              </span>
            </button>
            <Collapse in={isOpen} className="navbar-collapse">
              <div>
                <Col xxl={6}>
                  <div className="nav my-3 my-xl-0 px-4 flex-nowrap align-items-center">
                    <div className="nav-item w-100">
                      <form className="rounded position-relative">
                        <input
                          className="form-control pe-5 bg-secondary bg-opacity-10 border-0"
                          type="search"
                          placeholder="Search"
                          aria-label="Search"
                        />
                        <button className="btn btn-link bg-transparent px-2 py-0 position-absolute top-50 end-0 translate-middle-y" type="submit">
                          <FaSearch className="fs-6 text-primary" />
                        </button>
                      </form>
                    </div>
                  </div>
                </Col>
                <ul className="navbar-nav navbar-nav-scroll ms-auto">
                  <NavItem>
                    <a className="nav-link" href="#">
                      For Enterprise
                    </a>
                  </NavItem>
                  <NavItem>
                    <a className="nav-link" href="#">
                      Eklav Business
                    </a>
                  </NavItem>
                  <NavItem>
                    <a className="nav-link" href="#">
                      My learning
                    </a>
                  </NavItem>
                </ul>
              </div>
            </Collapse>
            <ul className="nav flex-row align-items-center list-unstyled ms-xl-auto">
              <li className="nav-item ms-0 ms-sm-2 d-none d-sm-block">
                <a className="btn btn-light btn-round mb-0" href="#">

                  <BsHeart className="fa-fw" />
                </a>
              </li>
              <NotificationDropdown />
              <ProfileDropdown className="nav-item ms-3" />
            </ul>
          </Container>
        </nav>
        <hr className="my-0" />
        <nav className="navbar navbar-expand-xl nav-category">
          <Container className="px-0">
            <button
              onClick={toggleCategory}
              className="navbar-toggler m-auto w-100"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbarCollapse2"
              aria-controls="navbarCollapse2"
              aria-expanded="false"
              aria-label="Toggle navigation">
              <BsGridFill /> Category
            </button>
            <Collapse in={isOpenCategory} className="navbar-collapse w-100">
              <div>
                <ul className="navbar-nav navbar-nav-scroll mx-auto">
                  <Dropdown className="nav-item" role="button">
                    <DropdownToggle as="a" className="nav-link arrow-none active">
                      Development
                      <FaChevronDown className="ms-1" size={10} />
                    </DropdownToggle>
                    <ul className="dropdown-menu" aria-labelledby="demoMenu">
                      <li>

                        <DropdownItem href="#">Web Development</DropdownItem>
                      </li>
                      <li>

                        <DropdownItem href="#">Data Science</DropdownItem>
                      </li>
                      <li>

                        <DropdownItem href="#">Mobile Development</DropdownItem>
                      </li>
                      <li>

                        <DropdownItem href="#">Programing Language</DropdownItem>
                      </li>
                      <li>

                        <DropdownItem href="#">Software Testing</DropdownItem>
                      </li>
                      <li>

                        <DropdownItem href="#">Software Engineering</DropdownItem>
                      </li>
                      <li>

                        <DropdownItem href="#">Software Development Tools</DropdownItem>
                      </li>
                    </ul>
                  </Dropdown>
                  <NavItem>
                    <a className="nav-link" href="#">
                      Finance &amp; Accounting
                    </a>
                  </NavItem>
                  <NavItem>
                    <a className="nav-link" href="#">
                      Personal Development
                    </a>
                  </NavItem>
                  <NavItem>
                    <a className="nav-link" href="#">
                      IT &amp; Software
                    </a>
                  </NavItem>
                  <NavItem>
                    <a className="nav-link" href="#">
                      Personal Development
                    </a>
                  </NavItem>
                </ul>
              </div>
            </Collapse>
          </Container>
        </nav>
      </header>
    </>
  )
}

export default TopNavigationBar
