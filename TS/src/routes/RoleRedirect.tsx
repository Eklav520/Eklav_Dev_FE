import { Navigate } from 'react-router-dom'
import { useAuthContext } from '@/context/useAuthContext'

const RoleRedirect = () => {
  const { user } = useAuthContext()

  // 🔐 Not logged in
  if (!user) {
    return <Navigate to="/auth/sign-in" replace />
  }

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

  // 💼 HR Admin
  if (user.role === 'hrAdmin') {
    return <Navigate to="/hr/dashboard" replace />
  }

  // 🎤 Technical Interviewer (team member with a login-capable account)
  if (user.role === 'hrInterviewer') {
    return <Navigate to="/hr/my-interviews" replace />
  }

  // 🗣️ HR Interviewer — same interview/feedback mechanics as Technical
  // Interviewer, just a separate assigned-interview queue.
  if (user.role === 'hrRoundInterviewer') {
    return <Navigate to="/hr/my-interviews" replace />
  }

  // ✅ Hiring Manager (approves Shortlist/Hire recommendations)
  if (user.role === 'hiringManager') {
    return <Navigate to="/hr/hiring-manager/dashboard" replace />
  }

  // 📋 HR Operations (post-offer processing: offers, onboarding, documents)
  if (user.role === 'hrOperations') {
    return <Navigate to="/hr/operations" replace />
  }

  // 🚨 Unknown role fallback
  return <Navigate to="/auth/sign-in" replace />
}

export default RoleRedirect