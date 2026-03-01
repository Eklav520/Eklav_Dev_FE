import { Navigate } from 'react-router-dom'
import { useAuthContext } from '@/context/useAuthContext'

const RoleRedirect = () => {
  const { user } = useAuthContext()

  // 🔐 Not logged in
  if (!user) {
    return <Navigate to="/auth/sign-in" replace />
  }

  console.log("user.role:", user.role)

  // 👑 Admin & College Admin
  if (user.role === 'admin' || user.role === 'collegeAdmin') {
    return <Navigate to="/eklavadmin/dashboard" replace />
  }

  // 🎓 Tutor
  if (user.role === 'tutor') {
    return <Navigate to="/tutor/dashboard" replace />
  }

  // 👨‍🎓 Student (default)
  if (user.role === 'student') {
    return <Navigate to="/student/dashboard" replace />
  }

  //  Unknown role fallback
  return <Navigate to="/auth/sign-in" replace />
}

export default RoleRedirect