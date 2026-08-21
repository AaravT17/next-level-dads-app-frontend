import { Outlet, useLocation } from 'react-router-dom'
import { AppShell } from './AppShell'
import { BottomNav } from './BottomNav'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'

/**
 * Route-level layout. Replaces the header + pb-20 + <BottomNav /> triplet that
 * each of 14 pages assembled by hand.
 *
 * Every screen keeps the bottom bar, including an open chat thread: hiding it
 * there left the thread with its own back button as the single way out, which
 * strands anyone who arrives from a notification or a deep link.
 */
export function AppLayout() {
  const { pathname } = useLocation()

  return (
    <AppShell>
      <ErrorBoundary resetKey={pathname}>
        <Outlet />
      </ErrorBoundary>
      <BottomNav />
    </AppShell>
  )
}
