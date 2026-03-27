import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

type ProtectedRouteProps = {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation()
  const isAuthenticated = window.localStorage.getItem('rke-authenticated') === 'true'

  if (!isAuthenticated) {
    const next = `${location.pathname}${location.search}${location.hash}`
    return <Navigate replace state={{ from: next }} to="/login" />
  }

  return <>{children}</>
}
