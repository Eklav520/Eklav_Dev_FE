import LogoBox from '@/components/LogoBox'
import TopNavbar from '@/components/TopNavbar'
import AppMenu from '@/components/TopNavbar/components/AppMenu'
import ProfileDropdown from '@/components/TopNavbar/components/ProfileDropdown'
import TopbarMenuToggler from '@/components/TopNavbar/components/TopbarMenuToggler'
import { useLayoutContext } from '@/context/useLayoutContext'
import { Container } from 'react-bootstrap'

interface TopNavigationBarProps {
  role: string
}

const TopNavigationBar = ({ role }: TopNavigationBarProps) => {
  const { appMenuControl } = useLayoutContext()

  console.log("role", role)

  return (
    <TopNavbar>
      <Container fluid className="d-flex align-items-center">
        
        <div className="d-flex align-items-center">
          <LogoBox height={36} width={143} role={role} />
          <h3 className="mb-0 text-warning">
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
          <TopbarMenuToggler />
          <ProfileDropdown className="ms-2" />
        </div>

      </Container>
    </TopNavbar>
  )
}

export default TopNavigationBar