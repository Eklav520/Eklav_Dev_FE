import logoMobileLightImg from '@/assets/images/logo-mobile-light.svg'
import logoMobileImg from '@/assets/images/logo-mobile.svg'
import ProfileDropdown from '@/components/TopNavbar/components/ProfileDropdown'
import { useLayoutContext } from '@/context/useLayoutContext'
import useToggle from '@/hooks/useToggle'
import { Collapse, Container } from 'react-bootstrap'
import { BsTextRight } from 'react-icons/bs'
import { FaSearch } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import NotificationDropdown from './NotificationDropdown'

const NavbarTopbar = () => {
  const { isTrue, toggle: toggles } = useToggle()
  const { appMenuControl } = useLayoutContext()

  return (
    <nav className="navbar top-bar navbar-light border-bottom py-0 py-xl-3">
      <Container fluid className="p-0">
        <div className="d-flex align-items-center w-100">
          <div className="d-flex align-items-center d-xl-none">
            <Link className="navbar-brand" to="/">
              <img className="light-mode-item navbar-brand-item h-30px w-auto" src={logoMobileImg} alt="logo Mobile" />
              <img className="dark-mode-item navbar-brand-item h-30px w-auto" src={logoMobileLightImg} alt="logo Mobile Light" />
            </Link>
          </div>
          <div className="navbar-expand-xl sidebar-offcanvas-menu">
            <button
              className="navbar-toggler me-auto"
              onClick={appMenuControl.toggle}
              type="button"
              data-bs-toggle="offcanvas"
              data-bs-target="#offcanvasSidebar"
              aria-controls="offcanvasSidebar"
              aria-expanded="false"
              aria-label="Toggle navigation"
              data-bs-auto-close="outside">
              <BsTextRight className="bi bi-text-right fa-fw h2 lh-0 mb-0 rtl-flip" data-bs-target="#offcanvasMenu">

              </BsTextRight>
            </button>
          </div>
          <div className="navbar-expand-lg ms-auto ms-xl-0">
            <button
              className="navbar-toggler ms-auto"
              type="button"
              onClick={toggles}
              data-bs-toggle="collapse"
              data-bs-target="#navbarTopContent"
              aria-controls="navbarTopContent"
              aria-expanded={isTrue}
              aria-label="Toggle navigation">
              <span className="navbar-toggler-animation">
                <span />
                <span />
                <span />
              </span>
            </button>
            <Collapse in={isTrue} className="navbar-collapse w-100">
              <div className=" flex-nowrap align-items-center">
                <div className="my-3 my-xl-0 ">
                  <div className="nav-item w-100">
                    <form className="position-relative">
                      <input
                        className="form-control pe-5 bg-secondary bg-opacity-10 border-0"
                        type="search"
                        placeholder="Search"
                        aria-label="Search"
                      />
                      <button className="bg-transparent px-2 py-0 border-0 position-absolute top-50 end-0 translate-middle-y" type="submit">
                        <FaSearch className="text-primary" />
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </Collapse>
          </div>
          <div className="ms-xl-auto">
            <ul className="navbar-nav flex-row align-items-center">
              <NotificationDropdown />
              <ProfileDropdown className="ms-2 ms-md-3" />
            </ul>
          </div>
        </div>
      </Container>
    </nav>
  )
}

export default NavbarTopbar
