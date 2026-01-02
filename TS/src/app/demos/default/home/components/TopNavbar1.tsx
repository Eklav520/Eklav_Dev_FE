import LogoBox from '@/components/LogoBox'
import TopNavbar from '@/components/TopNavbar'
import { useLayoutContext } from '@/context/useLayoutContext'
import { Container } from 'react-bootstrap'

import AppMenu from '@/components/TopNavbar/components/AppMenu'
import ProfileDropdown from '@/components/TopNavbar/components/ProfileDropdown'

const TopNavbar1 = () => {
  const { appMenuControl } = useLayoutContext()
  return (
    <TopNavbar>
      <Container fluid className="px-3 px-xl-5">
        <LogoBox height={36} width={150} />
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

        <AppMenu mobileMenuOpen={appMenuControl.open} menuClassName="me-auto" showExtraPages showCategories showMegaMenu searchInput />
        <ProfileDropdown className="ms-1 ms-lg-0" />
      </Container>
    </TopNavbar>
  )
}

export default TopNavbar1
