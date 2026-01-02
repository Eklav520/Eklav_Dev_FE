// components/RoleRedirect.tsx
import { Navigate } from 'react-router-dom'
import { useAuthContext } from '@/context/useAuthContext'

const RoleRedirect = () => {
  const { user } = useAuthContext()

  if (!user) return <Navigate to="/login" />

  if (user.role === 'admin') {
    return <Navigate to="/instructor/dashboard" />
  } else {
    return <Navigate to="/student/dashboard" />
  }
}

export default RoleRedirect
