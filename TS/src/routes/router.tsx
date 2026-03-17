import { Navigate, Route, Routes, type RouteProps } from 'react-router-dom'
import {
  adminRoutes,
  appRoutes,
  authRoutes,
  EklavAdminRoutes,
  InstituteAdminRoutes,
  shopRoutes,
  studentRoutes,
  tutorRoutes
} from '@/routes/index'

import AdminLayout from '@/layouts/AdminLayout'
import ShopLayout from '@/layouts/ShopLayout'
import InstructorLayout from '@/layouts/InstructorLayout'
import StudentLayout from '@/layouts/StudentLayout'
import OtherLayout from '@/layouts/OtherLayout'
import TutorLayout from '@/layouts/TutorLayout'
import InstituteAdminLayout from '@/layouts/InstituteAdminLayout'

import { useAuthContext } from '@/context/useAuthContext'

const AppRouter = (props: RouteProps) => {

  const { isAuthenticated } = useAuthContext()

  const redirectToLogin = (path: string) => (
    <Navigate
      to={{
        pathname: '/auth/sign-in',
        search: 'redirectTo=' + path,
      }}
    />
  )

  return (

    <Routes>

      {/* Auth Routes */}
      {(authRoutes || []).map((route, idx) => (
        <Route
          key={idx + route.name}
          path={route.path}
          element={<OtherLayout {...props}>{route.element}</OtherLayout>}
        />
      ))}

      {/* Public App Routes */}
      {(appRoutes || []).map((route, idx) => (
        <Route
          key={idx + route.name}
          path={route.path}
          element={
            isAuthenticated
              ? <OtherLayout {...props}>{route.element}</OtherLayout>
              : redirectToLogin(route.path || '/')
          }
        />
      ))}

      {/* Shop Routes */}
      {(shopRoutes || []).map((route, idx) => (
        <Route
          key={idx + route.name}
          path={route.path}
          element={
            isAuthenticated
              ? <ShopLayout {...props}>{route.element}</ShopLayout>
              : redirectToLogin(route.path || '/')
          }
        />
      ))}

      {/* EKLAV Admin */}
      {(EklavAdminRoutes || []).map((route: any, idx: any) => (
        <Route
          key={idx + route.name}
          path={route.path}
          element={
            isAuthenticated
              ? <InstructorLayout {...props}>{route.element}</InstructorLayout>
              : redirectToLogin(route.path)
          }
        />
      ))}

      {/* Institute Admin */}
      {(InstituteAdminRoutes || []).map((route: any, idx: any) => (
        <Route
          key={idx + route.name}
          path={route.path}
          element={
            isAuthenticated
              ? <InstituteAdminLayout {...props}>{route.element}</InstituteAdminLayout>
              : redirectToLogin(route.path)
          }
        />
      ))}

      {/* Tutor Routes */}
      {(tutorRoutes || []).map((route, idx) => (
        <Route
          key={idx + route.name}
          path={route.path}
          element={
            isAuthenticated
              ? <TutorLayout {...props}>{route.element}</TutorLayout>
              : redirectToLogin(route.path || '/')
          }
        />
      ))}

      {/* Student Routes */}
      {(studentRoutes || []).map((route, idx) => (
        <Route
          key={idx + route.name}
          path={route.path}
          element={
            isAuthenticated
              ? <StudentLayout {...props}>{route.element}</StudentLayout>
              : redirectToLogin(route.path || '/')
          }
        />
      ))}

      {/* System Admin */}
      {(adminRoutes || []).map((route, idx) => (
        <Route
          key={idx + route.name}
          path={route.path}
          element={
            isAuthenticated
              ? <AdminLayout {...props}>{route.element}</AdminLayout>
              : redirectToLogin(route.path || '/')
          }
        />
      ))}

    </Routes>

  )
}

export default AppRouter