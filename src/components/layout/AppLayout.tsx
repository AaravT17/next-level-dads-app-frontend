import { Outlet, useLocation } from 'react-router-dom'
import { AppShell } from './AppShell'
import { BottomNav } from './BottomNav'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'

export type AppLayoutProps = {
  /**
   * 'tabs'      — standard screens, with primary navigation.
   * 'immersive' — full-height screens that own their chrome (Chat, ChatManage).
   */
  variant?: 'tabs' | 'immersive'
}

/**
 * Route-level layout. Replaces the header + pb-20 + <BottomNav /> triplet that
 * each of 14 pages assembled by hand.
 */
export function AppLayout({ variant = 'tabs' }: AppLayoutProps) {
  const { pathname } = useLocation()

  return (
    <AppShell>
      <ErrorBoundary resetKey={pathname}>
        <Outlet />
      </ErrorBoundary>
      {variant === 'tabs' ? <BottomNav /> : null}
    </AppShell>
  )
}
