import LogoBox from '@/components/LogoBox'
import TopNavbar from '@/components/TopNavbar'
import AppMenu from '@/components/TopNavbar/components/AppMenu'
import ProfileDropdown from '@/components/TopNavbar/components/ProfileDropdown'
import { useLayoutContext } from '@/context/useLayoutContext'
import { Container } from 'react-bootstrap'

const TopNavigationBar = () => {
  const { appMenuControl } = useLayoutContext()
  return (
    <TopNavbar>
      <Container>
        <LogoBox width={143} height={36} />
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
        <AppMenu mobileMenuOpen={appMenuControl.open} menuClassName="mx-auto" showExtraPages searchInput />
        <ProfileDropdown className="ms-1 ms-lg-0" />
      </Container>
    </TopNavbar>
  )
}

export default TopNavigationBar
