import { lazy, Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { RouteErrorBoundary } from '@/components/primitives'
import { ProtectedRoute } from './ProtectedRoute'
import { PublicRoute } from './PublicRoute'
import { OrgRoute } from './OrgRoute'

const LoginPage         = lazy(() => import('@/features/auth/pages/LoginPage'))
const SignupPage        = lazy(() => import('@/features/auth/pages/SignupPage'))
const DashboardLayout   = lazy(() => import('@/features/dashboard/DashboardLayout'))
const DashboardPage     = lazy(() => import('@/features/dashboard/DashboardPage'))
const BoardPage         = lazy(() => import('@/features/dashboard/pages/BoardPage'))
const BacklogPage       = lazy(() => import('@/features/dashboard/pages/BacklogPage'))
const AIAssistantPage   = lazy(() => import('@/features/dashboard/pages/AIAssistantPage'))
const SettingsPage      = lazy(() => import('@/features/settings/pages/SettingsPage'))
const MembersPage       = lazy(() => import('@/features/settings/pages/MembersPage'))
const WorkflowPage      = lazy(() => import('@/features/settings/pages/WorkflowPage'))
const AcceptInvitePage  = lazy(() => import('@/features/settings/pages/AcceptInvitePage'))
const ProjectMembersPage = lazy(() => import('@/features/dashboard/pages/ProjectMembersPage'))
const AnalyticsPage      = lazy(() => import('@/features/dashboard/pages/AnalyticsPage'))

export function AppRouter() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
      <Routes>
        {/* Public — redirect authenticated users to their org dashboard */}
        <Route path="/login"  element={
          <RouteErrorBoundary label="the login page">
            <PublicRoute><LoginPage /></PublicRoute>
          </RouteErrorBoundary>
        } />
        <Route path="/signup" element={
          <RouteErrorBoundary label="the signup page">
            <PublicRoute><SignupPage /></PublicRoute>
          </RouteErrorBoundary>
        } />

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
          <Route path="projects/:projectId/board"   element={<BoardPage />} />
          <Route path="projects/:projectId/backlog" element={<BacklogPage />} />
          <Route path="projects/:projectId/members" element={<ProjectMembersPage />} />
          <Route path="ai-assistant" element={<AIAssistantPage />} />
          <Route path="analytics"    element={<AnalyticsPage />} />
          <Route path="settings" element={<SettingsPage />}>
            <Route path="members"   element={<MembersPage />} />
            <Route path="workflow"  element={<WorkflowPage />} />
          </Route>
        </Route>

        {/* Standalone — user may not be authenticated when accepting an invite */}
        <Route path="/invite/:token" element={<AcceptInvitePage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  )
}
