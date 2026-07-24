import logo from '@/assets/images/logo_black.png'
import logoLight from '@/assets/images/logo_white.png'
import { Link } from 'react-router-dom'
import useTenant from '@/utils/tenant'
import { useLayoutContext } from '@/context/useLayoutContext'

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
  alwaysDark?: boolean  // force white logo — use when nav background is always dark
}

const LogoBox = ({ height, width, role, tenant: tenantProp, alwaysDark = false }: LogoBoxProps) => {

  const tenantContext = useTenant()
  const tenant = tenantProp || tenantContext

  const { theme } = useLayoutContext()
  const isDark = alwaysDark || theme === 'dark'

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

  // 🔹 Safe name split — preserve the tenant name's casing as stored in the
  // DB (only the very first letter is forced uppercase for the brand mark).
  const firstPart =
    tenantName.length > 1
      ? tenantName.charAt(0).toUpperCase() + tenantName.charAt(1)
      : tenantName.charAt(0).toUpperCase()

  const restPart = tenantName.slice(2)

  return (
    <Link
      className="navbar-brand d-flex align-items-center gap-1"
      style={{
        overflow: "visible",
        maxWidth: "none",
        flexShrink: 0
      }}
      to={getDashboardLink()}
    >

      {/* DEFAULT EKLAV — pick logo by current theme */}
      {isDefaultEklav && (
        <img
          height={height}
          width={width}
          className="navbar-brand-item w-auto"
          src={isDark ? logoLight : logo}
          alt="Eklav"
        />
      )}

      {/* TENANT CUSTOM LOGO */}
      {!isDefaultEklav && tenantLogo && (
        <img
          height={height}
          width={width}
          className="navbar-brand-item w-auto"
          src={tenantLogo}
          alt={tenantName}
        />
      )}

      {/* TENANT TEXT FALLBACK — color adapts to theme */}
      {!isDefaultEklav && !tenantLogo && (
        <span
          style={{
            fontSize: "22px",
            fontWeight: "800",
            letterSpacing: "1px",
            display: "flex",
            alignItems: "center",
            whiteSpace: "nowrap"
          }}
        >
          <span style={{ color: themeColor, marginRight: "2px" }}>
            {firstPart}
          </span>
          <span style={{ color: isDark ? "#fff" : "#000" }}>
            {restPart}
          </span>
        </span>
      )}
    </Link>
  )
}

export default LogoBox