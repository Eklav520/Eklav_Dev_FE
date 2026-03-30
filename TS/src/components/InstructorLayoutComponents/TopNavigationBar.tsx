import LogoBox from '@/components/LogoBox'
import TopNavbar from '@/components/TopNavbar'
import AppMenu from '@/components/TopNavbar/components/AppMenu'
import ProfileDropdown from '@/components/TopNavbar/components/ProfileDropdown'
import { useLayoutContext } from '@/context/useLayoutContext'
import { Container } from 'react-bootstrap'

interface TopNavigationBarProps {
  role: string
  onToggleMenu?: () => void
}

const TopNavigationBar = ({ role, onToggleMenu }: TopNavigationBarProps) => {
  const { appMenuControl } = useLayoutContext()

  return (
    <TopNavbar>
      <Container
        fluid
        className="d-flex align-items-center px-3"
        style={{ height: 64 }}
      >
        {/* ✅ LEFT SECTION */}
        <div className="d-flex align-items-center gap-2">

          {/* MOBILE MENU */}
          <button
            onClick={onToggleMenu}
            className="d-xl-none"
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: '22px',
              color: '#ff7a00'
            }}
          >
            ☰
          </button>

          {/* LOGO */}
          <LogoBox height={36} role={role} />

          {/* PANEL TITLE */}
          <h5
            className="mb-0 fw-semibold d-none d-md-block"
            style={{ color: '#ff7a00', whiteSpace: 'nowrap' }}
          >
            {role === 'tutor' ? 'Tutor Panel' : 'Admin Panel'}
          </h5>
        </div>

        {/* ✅ CENTER MENU */}
        <div className="d-none d-lg-flex flex-grow-1 justify-content-center">
          <AppMenu
            mobileMenuOpen={appMenuControl.open}
            menuClassName="mx-auto"
            showExtraPages
            searchInput={false}
          />
        </div>

        {/* ✅ RIGHT SECTION */}
        <div className="d-flex align-items-center ms-auto">
          <ProfileDropdown className="ms-2" />
        </div>

      </Container>
    </TopNavbar>
  )
}

export default TopNavigationBar