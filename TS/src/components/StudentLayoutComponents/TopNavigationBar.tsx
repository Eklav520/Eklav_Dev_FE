import LogoBox from '@/components/LogoBox'
import TopNavbar from '@/components/TopNavbar'
import ProfileDropdown from '@/components/TopNavbar/components/ProfileDropdown'
import TopbarMenuToggler from '@/components/TopNavbar/components/TopbarMenuToggler'
import { Container } from 'react-bootstrap'

const TopNavigationBar = ({ role, onToggleMenu }: any) => {
  return (
    <TopNavbar>
      <Container fluid className="d-flex align-items-center justify-content-between px-3 px-md-4" style={{ height: 64 }}>
        {/* LEFT: Logo */}
        <div className="d-flex align-items-center">
          <LogoBox height={36} width={140} role={role} />
        </div>

        {/* RIGHT: Menu + Profile (ALWAYS RIGHT) */}
        <div className="d-flex align-items-center ms-auto">
          <TopbarMenuToggler onToggleSidebar={onToggleMenu} />
          <ProfileDropdown className="ms-2" />
        </div>
      </Container>
    </TopNavbar>
  )
}

export default TopNavigationBar
