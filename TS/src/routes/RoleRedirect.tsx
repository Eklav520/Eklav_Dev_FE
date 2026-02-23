// components/RoleRedirect.tsx
import { Navigate } from 'react-router-dom'
import { useAuthContext } from '@/context/useAuthContext'

const RoleRedirect = () => {
  const { user } = useAuthContext()

  if (!user) return <Navigate to="/login" />
  console.log("user.role",user.role)

  if (user.role === 'admin' || user.role === "collegeAdmin") {
    return <Navigate to="/eklavadmin/dashboard" />
  } else {
    return <Navigate to="/student/dashboard" />
  }
}

export default RoleRedirect
