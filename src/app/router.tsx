import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { PublicRoute } from './PublicRoute'

const LoginPage   = lazy(() => import('@/features/auth/pages/LoginPage'))
const SignupPage   = lazy(() => import('@/features/auth/pages/SignupPage'))

export function AppRouter() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center" />}>
      <Routes>
        <Route path="/login"  element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />

        <Route path="/dashboard" element={<ProtectedRoute><div /></ProtectedRoute>} />

        <Route path="/*" element={<ProtectedRoute><div /></ProtectedRoute>} />
      </Routes>
    </Suspense>
  )
}
