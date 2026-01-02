import TopNavbar from '@/components/TopNavbar'

import { Link } from 'react-router-dom'
import { Card, CardBody, CardFooter, CardHeader, Container, Dropdown, DropdownMenu, DropdownToggle } from 'react-bootstrap'
import { BsBell } from 'react-icons/bs'
import AppMenu from '@/components/TopNavbar/components/AppMenu'
import TopbarMenuToggler from '@/components/TopNavbar/components/TopbarMenuToggler'
import { useLayoutContext } from '@/context/useLayoutContext'

import logo from '@/assets/images/logo.svg'
import logoLight from '@/assets/images/logo-light.svg'
import avatar3 from '@/assets/images/avatar/03.jpg'
import ProfileDropdown from '@/components/TopNavbar/components/ProfileDropdown'

const TopNavigationBar = () => {
  const { appMenuControl } = useLayoutContext()
  return (
    <TopNavbar>
      <Container>
        <Link className="navbar-brand" to="/">
          <img height={36} width={170} className="light-mode-item navbar-brand-item" src={logo} alt="logo" />
          <img height={36} width={170} className="dark-mode-item navbar-brand-item" src={logoLight} alt="logo" />
        </Link>
        <TopbarMenuToggler />
        <AppMenu mobileMenuOpen={appMenuControl.open} />
        <ul className="nav flex-row align-items-center list-unstyled ms-xl-auto">
          <Dropdown as="li" className="nav-item ms-2 ms-sm-3 d-none d-sm-block">
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
          <ProfileDropdown className="nav-item ms-3" />
        </ul>
      </Container>
    </TopNavbar>
  )
}

export default TopNavigationBar
