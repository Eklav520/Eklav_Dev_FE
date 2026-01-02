import logo from '@/assets/images/logo_black.png'
import logoLight from '@/assets/images/logo_white.png'
import { Link } from 'react-router-dom'

interface LogoBoxProps {
  height?: number
  width?: number
  role?: string | { role?: string }
}

const LogoBox = ({ height, width, role }: LogoBoxProps) => {
  // Normalize role safely
  const normalizedRole =
    typeof role === 'string'
      ? role.toLowerCase()
      : typeof role === 'object' && role?.role
      ? role.role.toLowerCase()
      : ''

  // Route based on role
  const getDashboardLink = () => {
    switch (normalizedRole) {
      case 'student':
        return '/student/dashboard'
      case 'admin':
      case 'instructor':
        return '/instructor/dashboard'
      default:
        return '/'
    }
  }

  return (
    <Link className="navbar-brand" to={getDashboardLink()}>
      <img
        height={height}
        width={width}
        className="light-mode-item navbar-brand-item w-auto"
        src={logo}
        alt="logo"
      />
      <img
        height={height}
        width={width}
        className="dark-mode-item navbar-brand-item w-auto"
        src={logoLight}
        alt="logo"
      />
    </Link>
  )
}

export default LogoBox
