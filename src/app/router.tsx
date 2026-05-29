import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'

const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'))
const SignupPage = lazy(() => import('@/features/auth/pages/SignupPage'))

export function AppRouter() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center" />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/*" element={<div />} />
      </Routes>
    </Suspense>
  )
}
