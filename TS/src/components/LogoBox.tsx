import logo from '@/assets/images/logo_black.png'
import logoLight from '@/assets/images/logo_white.png'
import { Link } from 'react-router-dom'

interface Tenant {
  name?: string
  logo?: string
  themeColor?: string
}

interface LogoBoxProps {
  height?: number
  width?: number
  role?: string | { role?: string }
  tenant?: Tenant | null
}

const LogoBox = ({ height, width, role, tenant }: LogoBoxProps) => {

  // 🔹 Normalize role
  const normalizedRole =
    typeof role === 'string'
      ? role.toLowerCase()
      : typeof role === 'object' && role?.role
        ? role.role.toLowerCase()
        : ''

  // 🔹 Route based on role
  const getDashboardLink = () => {
    switch (normalizedRole) {
      case 'student':
        return '/student/dashboard'
      case 'admin':
      case 'instructor':
        return '/eklavadmin/dashboard'
      default:
        return '/'
    }
  }

  // 🔹 Tenant values
  const tenantName = tenant?.name?.trim() || "Eklav"
  const tenantLogo = tenant?.logo
  const themeColor = tenant?.themeColor || "#ff6b00"

  const isDefaultEklav = tenantName.toLowerCase() === "eklav"

  // 🔹 Safe name split
  const firstPart =
    tenantName.length > 1
      ? tenantName.charAt(0).toUpperCase() + tenantName.charAt(1).toLowerCase()
      : tenantName.charAt(0).toUpperCase();

  const restPart = tenantName.slice(2);

  return (
    <Link
      className="navbar-brand d-flex align-items-center"
      style={{
        overflow: "visible",
        maxWidth: "none",
        flexShrink: 0   // 🔥 ADD THIS (CRITICAL)
      }}
      to={getDashboardLink()}
    >

      {/* ✅ CASE 1: DEFAULT EKLAV */}
      {isDefaultEklav && (
        <>
          <img
            height={height}
            width={width}
            className="light-mode-item navbar-brand-item w-auto"
            src={logo}
            alt="Eklav"
          />
          <img
            height={height}
            width={width}
            className="dark-mode-item navbar-brand-item w-auto"
            src={logoLight}
            alt="Eklav"
          />
        </>
      )}

      {/* ✅ CASE 2: TENANT LOGO */}
      {!isDefaultEklav && tenantLogo && (
        <img
          height={height}
          width={width}
          className="navbar-brand-item w-auto"
          src={tenantLogo}
          alt={tenantName}
        />
      )}

      {/* ✅ CASE 3: FALLBACK STYLED NAME */}
      {/* ✅ CASE 3: FALLBACK STYLED NAME */}
      {!isDefaultEklav && !tenantLogo && (
        <span
          style={{
            fontSize: "22px",
            fontWeight: "800",
            letterSpacing: "1px",
            display: "flex",
            alignItems: "center",
            whiteSpace: "nowrap",       // ✅ Prevent wrapping
            overflow: "visible",        // ✅ Ensure no cut
            maxWidth: "100%"            // ✅ Allow full usage
          }}
        >
          <span
            style={{
              color: themeColor,
              marginRight: "2px"
            }}
          >
            {firstPart}
          </span>

          <span
            style={{
              color: "#ffffff",
              display: "inline-block"
            }}
          >
            {restPart}
          </span>
        </span>
      )}
    </Link>
  )
}

export default LogoBox