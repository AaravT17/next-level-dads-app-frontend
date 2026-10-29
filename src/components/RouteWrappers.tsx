import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/useAuth'
import { ROUTES } from '@/lib/routes'
import { adminGate, protectedGate, publicGate, setupGate } from '@/lib/authGate'

/**
 * Route guards.
 *
 * Each renders an <Outlet /> so guards compose as parent routes rather than
 * wrapping every element individually.
 *
 * What each one decides lives in lib/authGate.ts, as explicit allow/redirect
 * decisions rather than a path compared against a sentinel route. These
 * components only act on the answer.
 *
 * The status banners that used to live here moved to
 * components/layout/SystemBanners.tsx, where they render in normal flow
 * instead of covering the page header.
 */

function LoadingSpinner() {
  return (
    <div className="flex h-dvh w-full items-center justify-center bg-background">
      <div className="h-8 w-8 motion-safe-spin animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <span className="sr-only">Loading</span>
    </div>
  )
}

/** Requires a token, and a profile unless the role is one that browses without. */
export function ProtectedRoute() {
  const { user, accessToken, role, loading } = useAuth()
  const location = useLocation()
  if (loading) return <LoadingSpinner />

  const gate = protectedGate({ accessToken, user, role })
  if (gate.kind === 'redirect') {
    if (gate.to === ROUTES.WELCOME) {
      const destination = location.pathname + location.search
      const to =
        destination !== ROUTES.HOME_AFTER_AUTH
          ? `${ROUTES.WELCOME}?redirectTo=${encodeURIComponent(destination)}`
          : ROUTES.WELCOME
      return <Navigate to={to} replace />
    }
    return <Navigate to={gate.to} replace />
  }

  return <Outlet />
}

/** Login and registration screens: sends already-authenticated users onward. */
export function PublicRoute() {
  const { user, accessToken, role, loading } = useAuth()
  if (loading) return <LoadingSpinner />

  const gate = publicGate({ accessToken, user, role })
  if (gate.kind === 'redirect') return <Navigate to={gate.to} replace />

  return <Outlet />
}

/** The admin role only. It does not need a profile: an admin browses without one. */
export function AdminRoute() {
  const { user, accessToken, role, loading } = useAuth()
  if (loading) return <LoadingSpinner />

  const gate = adminGate({ accessToken, user, role })
  if (gate.kind === 'redirect') return <Navigate to={gate.to} replace />

  return <Outlet />
}

/** Profile setup: a token but no profile yet. A role that browses without a profile skips it. */
export function SetupRoute() {
  const { user, accessToken, role, loading } = useAuth()
  if (loading) return <LoadingSpinner />

  const gate = setupGate({ accessToken, user, role })
  if (gate.kind === 'redirect') return <Navigate to={gate.to} replace />

  return <Outlet />
}
