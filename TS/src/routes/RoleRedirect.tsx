import { Navigate } from 'react-router-dom'
import { useAuthContext } from '@/context/useAuthContext'

const RoleRedirect = () => {
  const { user } = useAuthContext()

  // 🔐 Not logged in
  if (!user) {
    return <Navigate to="/auth/sign-in" replace />
  }

  console.log("user.role:", user.role)

  // 👑 Platform Admin
  if (user.role === 'admin' || user.role === 'collegeAdmin') {
    return <Navigate to="/eklavadmin/dashboard" replace />
  }

  // 🏫 Institute Admin
  if (user.role === 'instituteAdmin') {
    return <Navigate to="/institute/dashboard" replace />
  }

  // 🧑‍🏫 Tutor
  if (user.role === 'tutor') {
    return <Navigate to="/tutor/online-classes" replace />
  }

  // 👨‍🏫 Faculty Admin
  if (user.role === 'facultyAdmin') {
    return <Navigate to="/faculty-admin/dashboard" replace />
  }

  // 👨‍🎓 Student
  if (user.role === 'student') {
    return <Navigate to="/student/dashboard" replace />
  }

  // 🚨 Unknown role fallback
  return <Navigate to="/auth/sign-in" replace />
}

export default RoleRedirect