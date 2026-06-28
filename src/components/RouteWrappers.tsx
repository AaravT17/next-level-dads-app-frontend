import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { ROUTES } from '@/lib/routes'

/**
 * Determines the appropriate redirect path based on auth state.
 *
 * Cases after hydration:
 * - Case 1: No access token → "/" (not logged in)
 * - Case 2: Access token exists but user is null → "/setup" (profile not set up)
 * - Case 3: Both access token and user exist → "/discover" (fully authenticated)
 */
function getAuthRedirectPath(
  accessToken: string | null,
  user: unknown | null,
): typeof ROUTES.WELCOME | typeof ROUTES.SETUP | typeof ROUTES.DISCOVER {
  if (!accessToken) {
    return ROUTES.WELCOME
  }
  if (!user) {
    return ROUTES.SETUP
  }
  return ROUTES.DISCOVER
}

/**
 * Simple loading spinner component
 */
function LoadingSpinner() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  )
}

interface RouteWrapperProps {
  children: ReactNode
}

/**
 * ProtectedRoute - Blocks unauthenticated access to protected pages.
 *
 * Behavior:
 * - While loading (hydrating): Shows a loading spinner
 * - After hydration:
 *   - If fully authenticated (accessToken + user): Renders children
 *   - If access token but no user: Redirects to /setup
 *   - If no access token: Redirects to /
 */
export function ProtectedRoute({ children }: RouteWrapperProps) {
  const { user, accessToken, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  const redirectPath = getAuthRedirectPath(accessToken, user)

  if (redirectPath !== ROUTES.DISCOVER) {
    return (
      <Navigate
        to={redirectPath}
        replace
      />
    )
  }

  return <>{children}</>
}

/**
 * PublicRoute - For login/register pages that should redirect authenticated users.
 *
 * Behavior:
 * - While loading (hydrating): Shows a loading spinner
 *   (prevents flash of login page before redirecting)
 * - After hydration:
 *   - If not authenticated: Renders children (login/register page)
 *   - If authenticated: Redirects based on auth state
 */
export function PublicRoute({ children }: RouteWrapperProps) {
  const { user, accessToken, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  const redirectPath = getAuthRedirectPath(accessToken, user)

  if (accessToken) {
    return (
      <Navigate
        to={redirectPath}
        replace
      />
    )
  }

  return <>{children}</>
}

/**
 * AdminRoute - Requires full auth AND is_admin === true.
 *
 * Behavior:
 * - While loading: Shows spinner
 * - Not authenticated: Redirects to /
 * - Authenticated but not admin: Redirects to /discover
 * - Authenticated admin: Renders children
 */
export function AdminRoute({ children }: RouteWrapperProps) {
  const { user, accessToken, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!accessToken || !user) {
    return <Navigate to={ROUTES.WELCOME} replace />
  }

  if (!user.isAdmin) {
    return <Navigate to={ROUTES.DISCOVER} replace />
  }

  return <>{children}</>
}

/**
 * SetupRoute - For the profile setup page.
 *
 * Behavior:
 * - While loading: Shows spinner
 * - After hydration:
 *   - If no access token: Redirects to / (must login first)
 *   - If already has user profile: Redirects to /discover (setup complete)
 *   - If access token but no user: Renders setup page
 */
export function SetupRoute({ children }: RouteWrapperProps) {
  const { user, accessToken, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!accessToken) {
    return (
      <Navigate
        to={ROUTES.WELCOME}
        replace
      />
    )
  }

  if (user) {
    return (
      <Navigate
        to={ROUTES.DISCOVER}
        replace
      />
    )
  }

  return <>{children}</>
}
