import { Suspense } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AppShell } from './AppShell'
import { BottomNav } from './BottomNav'
import { CenteredSpinner } from '@/components/feedback/Spinner'
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
        {/*
          Routes are code-split, so navigating to one not yet downloaded
          suspends. Keeping the boundary here rather than around <Routes> means
          the shell and bottom nav stay put and only the pane swaps.
        */}
        <Suspense
          fallback={
            <div className="flex flex-1 items-center justify-center p-6">
              <CenteredSpinner />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </ErrorBoundary>
      <BottomNav />
    </AppShell>
  )
}
