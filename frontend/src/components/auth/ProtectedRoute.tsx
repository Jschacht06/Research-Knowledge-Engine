import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

type ProtectedRouteProps = {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation()
  const { isAuthenticated, isInitializing } = useAuth()

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f9fc] px-5">
        <div className="rounded-3xl border border-rke-border bg-white px-6 py-4 text-sm font-semibold text-rke-copy shadow-[0_14px_40px_rgba(15,23,42,0.08)]">
          Checking session...
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    const next = `${location.pathname}${location.search}${location.hash}`
    return <Navigate replace state={{ from: next }} to="/login" />
  }

  return <>{children}</>
}
