import { Navigate, Route, Routes, type RouteProps } from 'react-router-dom'
import { adminRoutes, appRoutes, authRoutes, EklavAdminRoutes, shopRoutes, studentRoutes, tutorRoutes } from '@/routes/index'
import AdminLayout from '@/layouts/AdminLayout'
import ShopLayout from '@/layouts/ShopLayout'
import InstructorLayout from '@/layouts/InstructorLayout'
import StudentLayout from '@/layouts/StudentLayout'
import OtherLayout from '@/layouts/OtherLayout'
import { useAuthContext } from '@/context/useAuthContext'
import TutorLayout from '@/layouts/TutorLayout'

const AppRouter = (props: RouteProps) => {
  const { isAuthenticated } = useAuthContext()

  return (
    <Routes>
      {(authRoutes || []).map((route, idx) => (
        <Route key={idx + route.name} path={route.path} element={<OtherLayout {...props}>{route.element}</OtherLayout>} />
      ))}
      {(appRoutes || []).map((route, idx) => (
        <Route
          key={idx + route.name}
          path={route.path}
          element={
            isAuthenticated ? (
              <OtherLayout {...props}>{route.element}</OtherLayout>
            ) : (
              <Navigate
                to={{
                  pathname: '/auth/sign-in',
                  search: 'redirectTo=' + route.path,
                }}
              />
            )
          }
        />
      ))}
      {(shopRoutes || []).map((route, idx) => (
        <Route
          key={idx + route.name}
          path={route.path}
          element={
            isAuthenticated ? (
              <ShopLayout {...props}>{route.element}</ShopLayout>
            ) : (
              <Navigate
                to={{
                  pathname: '/auth/sign-in',
                  search: 'redirectTo=' + route.path,
                }}
              />
            )
          }
        />
      ))}
      {(EklavAdminRoutes || []).map((route: any, idx: any) => (
        <Route
          key={idx + route.name}
          path={route.path}
          element={
            isAuthenticated ? (
              <InstructorLayout {...props}>{route.element}</InstructorLayout>
            ) : (
              <Navigate
                to={{
                  pathname: '/auth/sign-in',
                  search: 'redirectTo=' + route.path,
                }}
              />
            )
          }
        />
      ))}
      {(tutorRoutes || []).map((route, idx) => (
        <Route
          key={idx + route.name}
          path={route.path}
          element={
            isAuthenticated ? (
              <TutorLayout {...props}>{route.element}</TutorLayout>
            ) : (
              <Navigate
                to={{
                  pathname: '/auth/sign-in',
                  search: 'redirectTo=' + route.path,
                }}
              />
            )
          }
        />
      ))}
      {(studentRoutes || []).map((route, idx) => (
        <Route
          key={idx + route.name}
          path={route.path}
          element={
            isAuthenticated ? (
              <StudentLayout {...props}>{route.element}</StudentLayout>
            ) : (
              <Navigate
                to={{
                  pathname: '/auth/sign-in',
                  search: 'redirectTo=' + route.path,
                }}
              />
            )
          }
        />
      ))}

      {(adminRoutes || []).map((route, idx) => (
        <Route
          key={idx + route.name}
          path={route.path}
          element={
            isAuthenticated ? (
              <AdminLayout {...props}>{route.element}</AdminLayout>
            ) : (
              <Navigate
                to={{
                  pathname: '/auth/sign-in',
                  search: 'redirectTo=' + route.path,
                }}
              />
            )
          }
        />
      ))}
    </Routes>
  )
}

export default AppRouter
