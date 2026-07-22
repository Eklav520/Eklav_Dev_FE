import { Navigate, Outlet, Route, Routes, type RouteProps } from 'react-router-dom'
import {
  adminRoutes,
  appRoutes,
  authRoutes,
  EklavAdminRoutes,
  InstituteAdminRoutes,
  facultyAdminRoutes,
  hrRoutes,
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
import HRLayout from '@/layouts/HRLayout'
import InterviewerLayout from '@/layouts/InterviewerLayout'
import { ChildrenType } from '@/types/component-props'

import { useAuthContext } from '@/context/useAuthContext'
import ProtectedRoute from './ProtectedRoute'

// hrAdmin (Talent Acquisition) gets the full HR console; every other
// login-capable team member role — Technical Interviewer, HR Interviewer,
// Hiring Manager, HR Operations — shares the same scoped layout, which
// adapts its own nav based on the role.
const TEAM_MEMBER_ROLES = ['hrInterviewer', 'hrRoundInterviewer', 'hiringManager', 'hrOperations']
const HRAreaLayout = ({ children, ...rest }: ChildrenType) => {
  const { user } = useAuthContext()
  const role = (user as any)?.role
  if (TEAM_MEMBER_ROLES.includes(role)) {
    return <InterviewerLayout>{children}</InterviewerLayout>
  }
  return <HRLayout {...rest}>{children}</HRLayout>
}

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
            <ProtectedRoute allowedRoles={['tutor', 'admin']}>
              <InstructorLayout {...props}>
                {route.element}
              </InstructorLayout>
            </ProtectedRoute>
          }
        />
      ))}

      {/* Institute Admin */}
      {(InstituteAdminRoutes || []).map((route: any, idx: any) => (
        <Route
          key={idx + route.name}
          path={route.path}
          element={
            <ProtectedRoute allowedRoles={['instituteAdmin']}>
              <InstituteAdminLayout {...props}>
                {route.element}
              </InstituteAdminLayout>
            </ProtectedRoute>
          }
        />
      ))}

      {/* Faculty Admin Routes */}
      {(facultyAdminRoutes || []).map((route, idx) => (
        <Route
          key={idx + route.name}
          path={route.path}
          element={
            <ProtectedRoute allowedRoles={['facultyAdmin']}>
              <InstituteAdminLayout {...props}>
                {route.element}
              </InstituteAdminLayout>
            </ProtectedRoute>
          }
        />
      ))}

      {/* Tutor Routes */}
      {(tutorRoutes || []).map((route, idx) => (
        <Route
          key={idx + route.name}
          path={route.path}
          element={
            <ProtectedRoute allowedRoles={['tutor']}>
              <TutorLayout {...props}>
                {route.element}
              </TutorLayout>
            </ProtectedRoute>
          }
        />
      ))}

      {/* Student Routes */}
      {(studentRoutes || []).map((route, idx) => (
        <Route
          key={idx + route.name}
          path={route.path}
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentLayout {...props}>
                {route.element}
              </StudentLayout>
            </ProtectedRoute>
          }
        />
      ))}

      {/* HR Routes — nested under one persistent layout instance via <Outlet/>,
          so switching between HR pages doesn't unmount/remount the sidebar
          (which looked like a full page refresh). */}
      <Route
        path="/hr/*"
        element={
          <ProtectedRoute allowedRoles={['hrAdmin', 'hrInterviewer', 'hrRoundInterviewer', 'hiringManager', 'hrOperations']}>
            <HRAreaLayout {...props}>
              <Outlet />
            </HRAreaLayout>
          </ProtectedRoute>
        }
      >
        {(hrRoutes || []).map((route, idx) => (
          <Route
            key={idx + route.name}
            path={(route.path || '').replace(/^\/hr\//, '')}
            element={route.element}
          />
        ))}
      </Route>

      {/* System Admin */}
      {(adminRoutes || []).map((route, idx) => (
        <Route
          key={idx + route.name}
          path={route.path}
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout {...props}>
                {route.element}
              </AdminLayout>
            </ProtectedRoute>
          }
        />
      ))}

    </Routes>

  )
}

export default AppRouter