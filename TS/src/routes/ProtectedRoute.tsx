import { Navigate } from "react-router-dom"
import { useAuthContext } from "@/context/useAuthContext"

interface Props {
  children: JSX.Element
  allowedRoles: string[]
}

const ProtectedRoute = ({ children, allowedRoles }: Props) => {
  const { user, isAuthenticated } = useAuthContext()

  // 🔐 Not logged in
  if (!isAuthenticated) {
    return <Navigate to="/auth/sign-in" replace />
  }

  // 🚫 Role not allowed
  if (!user?.role || !allowedRoles.includes(user.role)) {
    console.warn("⛔ Unauthorized access attempt:", user?.role)
    return <Navigate to="/" replace /> // or RoleRedirect
  }

  return children
}

export default ProtectedRoute