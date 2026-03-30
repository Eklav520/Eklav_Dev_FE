import LogoBox from '@/components/LogoBox'
import TopNavbar from '@/components/TopNavbar'
import AppMenu from '@/components/TopNavbar/components/AppMenu'
import ProfileDropdown from '@/components/TopNavbar/components/ProfileDropdown'
import { useLayoutContext } from '@/context/useLayoutContext'
import { Container } from 'react-bootstrap'
import useTenant from '@/utils/tenant'   // ✅ ADD

interface TopNavigationBarProps {
  role: string
  onToggleMenu?: () => void
}

const TopNavigationBar = ({ role, onToggleMenu }: TopNavigationBarProps) => {
  const { appMenuControl } = useLayoutContext()
  const tenant = useTenant()   // ✅ ADD

  return (
    <TopNavbar>
      <Container
        fluid
        className="d-flex align-items-center px-3"
        style={{ height: 64 }}
      >
        {/* LEFT */}
        <div className="d-flex align-items-center gap-2">

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

          {/* ✅ FIXED */}
          <LogoBox height={36} role={role} tenant={tenant} />

          <h5
            className="mb-0 fw-semibold d-none d-md-block"
            style={{ color: '#ff7a00', whiteSpace: 'nowrap' }}
          >
            {role === 'tutor' ? 'Tutor Panel' : 'Admin Panel'}
          </h5>
        </div>

        {/* CENTER */}
        <div className="d-none d-lg-flex flex-grow-1 justify-content-center">
          <AppMenu
            mobileMenuOpen={appMenuControl.open}
            menuClassName="mx-auto"
            showExtraPages
            searchInput={false}
          />
        </div>

        {/* RIGHT */}
        <div className="d-flex align-items-center ms-auto">
          <ProfileDropdown className="ms-2" />
        </div>

      </Container>
    </TopNavbar>
  )
}

export default TopNavigationBar