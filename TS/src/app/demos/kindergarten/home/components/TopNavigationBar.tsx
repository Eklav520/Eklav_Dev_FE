import TopNavbar from '@/components/TopNavbar'

import { Link } from 'react-router-dom'
import { Button, Container } from 'react-bootstrap'
import AppMenu from '@/components/TopNavbar/components/AppMenu'

import logo from '@/assets/images/logo.svg'
import logoLight from '@/assets/images/logo-light.svg'
import { useLayoutContext } from '@/context/useLayoutContext'
import { BsPower } from 'react-icons/bs'

const TopNavigationBar = () => {
  const { appMenuControl } = useLayoutContext()
  return (
    <TopNavbar>
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
        <AppMenu mobileMenuOpen={appMenuControl.open} menuClassName="mx-auto" />
        <div className="navbar-nav ms-2">
          <Button variant="dark" size="sm" className="mb-0">
            <BsPower className="me-2" />
            Sign In
          </Button>
        </div>
      </Container>
    </TopNavbar>
  )
}

export default TopNavigationBar
