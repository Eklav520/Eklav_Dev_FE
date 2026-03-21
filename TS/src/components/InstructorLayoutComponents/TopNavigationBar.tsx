import LogoBox from '@/components/LogoBox'
import TopNavbar from '@/components/TopNavbar'
import AppMenu from '@/components/TopNavbar/components/AppMenu'
import ProfileDropdown from '@/components/TopNavbar/components/ProfileDropdown'
import TopbarMenuToggler from '@/components/TopNavbar/components/TopbarMenuToggler'
import { useLayoutContext } from '@/context/useLayoutContext'
import { Container } from 'react-bootstrap'

interface TopNavigationBarProps {
  role: string
  onToggleMenu?: () => void   // 👈 ADD THIS
}

const TopNavigationBar = ({ role, onToggleMenu }: TopNavigationBarProps) => {
  const { appMenuControl } = useLayoutContext()

  console.log("role", role)

  return (
    <TopNavbar>
      <Container fluid className="d-flex align-items-center">
        <div className="d-flex align-items-center">

          {/* ✅ MOBILE MENU BUTTON */}
          <button
            onClick={onToggleMenu}
            className="d-xl-none me-2"
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: '22px',
              color: '#fdfcfc'
            }}
          >
            ☰
          </button>

          <LogoBox height={36} width={143} role={role} />
      <h3 className="mb-0" style={{ color: '#ff7a00' }}>
  {role === 'tutor' ? 'Tutor Panel' : 'Admin Panel'}
</h3>
        </div>

        <div className="d-none d-lg-flex flex-grow-1 justify-content-center">
          <AppMenu
            mobileMenuOpen={appMenuControl.open}
            menuClassName="mx-auto"
            showExtraPages
            searchInput={false}
          />
        </div>

        <div className="d-flex align-items-center ms-auto">
          <ProfileDropdown className="ms-2" />
        </div>

      </Container>
    </TopNavbar>
  )
}

export default TopNavigationBar