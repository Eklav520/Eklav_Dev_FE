import TopNavbar from '@/components/TopNavbar'

import { Container } from 'react-bootstrap'
import { Link } from 'react-router-dom'

import NotificationDropdown from '@/app/demos/workshop/home/components/NotificationDropdown'
import logoLight from '@/assets/images/logo-light.svg'
import logo from '@/assets/images/logo.svg'
import AppMenu from '@/components/TopNavbar/components/AppMenu'
import ProfileDropdown from '@/components/TopNavbar/components/ProfileDropdown'
import TopbarMenuToggler from '@/components/TopNavbar/components/TopbarMenuToggler'
import { useLayoutContext } from '@/context/useLayoutContext'

const TopNavigationBar = () => {
  const { appMenuControl } = useLayoutContext()
  return (
    <TopNavbar>
      <Container>
        <Link className="navbar-brand" to="/">
          <img width={170} height={36} className="light-mode-item navbar-brand-item" src={logo} alt="logo" />
          <img width={170} height={36} className="dark-mode-item navbar-brand-item" src={logoLight} alt="logo" />
        </Link>
        <TopbarMenuToggler />
        <AppMenu mobileMenuOpen={appMenuControl.open} startSearchInput menuClassName="ms-auto" />

        <ul className="nav flex-row align-items-center list-unstyled ms-xl-auto">
          <NotificationDropdown />
          <ProfileDropdown className="nav-item ms-3" />
        </ul>
      </Container>
    </TopNavbar>
  )
}

export default TopNavigationBar
