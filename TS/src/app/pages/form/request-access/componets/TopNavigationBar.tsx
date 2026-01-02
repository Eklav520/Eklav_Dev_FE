import { Link } from 'react-router-dom'

import logoLight from '@/assets/images/logo-light.svg'
import logo from '@/assets/images/logo.svg'
import TopNavbar from '@/components/TopNavbar'
import { useLayoutContext } from '@/context/useLayoutContext'
import { Collapse, Container } from 'react-bootstrap'

const TopNavigationBar = () => {
  const { appMenuControl } = useLayoutContext()

  return (
    <>
      <TopNavbar className="navbar-transparent">
        <Container>
          <Link className="navbar-brand me-0" to="/">
            <img height={36} width={170} className="light-mode-item navbar-brand-item" src={logo} alt="logo" />
            <img height={36} width={170} className="dark-mode-item navbar-brand-item" src={logoLight} alt="logo" />
          </Link>
          <button
            onClick={appMenuControl.toggle}
            className="navbar-toggler ms-auto"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarCollapse"
            aria-controls="navbarCollapse"
            aria-expanded={appMenuControl.open}
            aria-label="Toggle navigation">
            <span className="navbar-toggler-animation">
              <span />
              <span />
              <span />
            </span>
          </button>
          <Collapse in={appMenuControl.open} className="navbar-collapse collapse">
            <div>
              <ul className="navbar-nav navbar-nav-scroll mx-auto">
                <li className="nav-item">
                  <a className="nav-link" href="#">
                    About Eklav
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="#">
                    Careers
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="#">
                    Help center
                  </a>
                </li>
              </ul>
            </div>
          </Collapse>
          <div className="navbar-nav ms-2">
            <button className="btn btn-sm btn-primary mb-0">Get access</button>
          </div>
        </Container>
      </TopNavbar>
    </>
  )
}

export default TopNavigationBar
