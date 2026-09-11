import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/useAuth'
import { ROUTES } from '@/lib/routes'

/**
 * Route guards.
 *
 * Each renders an <Outlet /> so guards compose as parent routes rather than
 * wrapping every element individually.
 *
 * The status banners that used to live here moved to
 * components/layout/SystemBanners.tsx, where they render in normal flow
 * instead of covering the page header.
 */

type AuthGate = { kind: 'allow' } | { kind: 'redirect'; to: string }

/**
 * Resolves auth state to an explicit decision.
 *
 * The previous version returned a *path* and callers compared it against
 * ROUTES.DISCOVER to mean "authenticated" — a sentinel that ties the auth gate
 * to whatever the discover tab happens to be called.
 */
function resolveAuthGate(accessToken: string | null, user: unknown | null): AuthGate {
  if (!accessToken) return { kind: 'redirect', to: ROUTES.WELCOME }
  if (!user) return { kind: 'redirect', to: ROUTES.SETUP }
  return { kind: 'allow' }
}

function LoadingSpinner() {
  return (
    <div className="flex h-dvh w-full items-center justify-center bg-background">
      <div className="h-8 w-8 motion-safe-spin animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <span className="sr-only">Loading</span>
    </div>
  )
}

/** Requires a token and a profile. */
export function ProtectedRoute() {
  const { user, accessToken, loading } = useAuth()
  if (loading) return <LoadingSpinner />

  const gate = resolveAuthGate(accessToken, user)
  if (gate.kind === 'redirect') return <Navigate to={gate.to} replace />

  return <Outlet />
}

/** Login and registration screens: sends already-authenticated users onward. */
export function PublicRoute() {
  const { user, accessToken, loading } = useAuth()
  if (loading) return <LoadingSpinner />

  if (accessToken) {
    const gate = resolveAuthGate(accessToken, user)
    return <Navigate to={gate.kind === 'redirect' ? gate.to : ROUTES.HOME_AFTER_AUTH} replace />
  }

  return <Outlet />
}

/** Requires full auth plus the admin flag. */
export function AdminRoute() {
  const { user, accessToken, loading } = useAuth()
  if (loading) return <LoadingSpinner />

  if (!accessToken || !user) return <Navigate to={ROUTES.WELCOME} replace />
  if (!user.isAdmin) return <Navigate to={ROUTES.HOME_AFTER_AUTH} replace />

  return <Outlet />
}

/** Profile setup: a token but no profile yet. */
export function SetupRoute() {
  const { user, accessToken, loading } = useAuth()
  if (loading) return <LoadingSpinner />

  if (!accessToken) return <Navigate to={ROUTES.WELCOME} replace />
  if (user) return <Navigate to={ROUTES.HOME_AFTER_AUTH} replace />

  return <Outlet />
}
