import { lazy, Suspense, type ReactNode } from 'react'
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
const SettingsPage      = lazy(() => import('@/features/settings/pages/SettingsPage'))
const MembersPage       = lazy(() => import('@/features/settings/pages/MembersPage'))
const WorkflowPage      = lazy(() => import('@/features/settings/pages/WorkflowPage'))
const AcceptInvitePage  = lazy(() => import('@/features/settings/pages/AcceptInvitePage'))
const ProjectMembersPage = lazy(() => import('@/features/dashboard/pages/ProjectMembersPage'))
const AnalyticsPage      = lazy(() => import('@/features/dashboard/pages/AnalyticsPage'))
const ChatPage           = lazy(() => import('@/features/dashboard/pages/ChatPage'))

// Wrap a route element in a per-route error boundary so a render error in one
// route shows a recoverable fallback instead of blanking the whole app
// (FrontendRules §12: every route must be wrapped). For nested routes the leaf
// boundary sits inside the parent's <Outlet>, so a page crash keeps the
// surrounding dashboard shell (sidebar/nav) intact.
const guard = (label: string, node: ReactNode): ReactNode => (
  <RouteErrorBoundary label={label}>{node}</RouteErrorBoundary>
)

export function AppRouter() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
      <Routes>
        {/* Public — redirect authenticated users to their org dashboard */}
        <Route path="/login"  element={guard('the login page', <PublicRoute><LoginPage /></PublicRoute>)} />
        <Route path="/signup" element={guard('the signup page', <PublicRoute><SignupPage /></PublicRoute>)} />

        {/* Org-scoped shell — OrgRoute loads + validates the org for every child */}
        <Route
          path="/:slug"
          element={guard('this workspace',
            <ProtectedRoute>
              <OrgRoute>
                <DashboardLayout />
              </OrgRoute>
            </ProtectedRoute>,
          )}
        >
          <Route path="dashboard" element={guard('the dashboard', <DashboardPage />)} />
          <Route path="projects/:projectId/board"   element={guard('the board', <BoardPage />)} />
          <Route path="projects/:projectId/backlog" element={guard('the backlog', <BacklogPage />)} />
          <Route path="projects/:projectId/members" element={guard('project members', <ProjectMembersPage />)} />
          <Route path="analytics"    element={guard('analytics', <AnalyticsPage />)} />
          <Route path="chat"         element={guard('Planiqo Assistant', <ChatPage />)} />
          <Route path="settings" element={guard('settings', <SettingsPage />)}>
            <Route path="members"   element={guard('org members', <MembersPage />)} />
            <Route path="workflow"  element={guard('the workflow editor', <WorkflowPage />)} />
          </Route>
        </Route>

        {/* Standalone — user may not be authenticated when accepting an invite */}
        <Route path="/invite/:token" element={guard('the invite page', <AcceptInvitePage />)} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  )
}
