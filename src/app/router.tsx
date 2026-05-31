import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { PublicRoute } from './PublicRoute'
import { OrgRoute } from './OrgRoute'

const LoginPage       = lazy(() => import('@/features/auth/pages/LoginPage'))
const SignupPage      = lazy(() => import('@/features/auth/pages/SignupPage'))
const DashboardLayout = lazy(() => import('@/features/dashboard/DashboardLayout'))
const DashboardPage   = lazy(() => import('@/features/dashboard/DashboardPage'))
const BoardPage       = lazy(() => import('@/features/dashboard/pages/BoardPage'))

export function AppRouter() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center" />}>
      <Routes>
        {/* Public — redirect authenticated users to their org dashboard */}
        <Route path="/login"  element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />

        {/* Org-scoped shell — OrgRoute loads + validates the org for every child */}
        <Route
          path="/:slug"
          element={
            <ProtectedRoute>
              <OrgRoute>
                <DashboardLayout />
              </OrgRoute>
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="projects/:projectId/board" element={<BoardPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  )
}
