import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { UserAvatar } from '@/components/media/UserAvatar'
import { usePendingRequestCount } from '@/hooks/useNavBadges'
import { ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'
import { NavBadge } from './NavBadge'

/**
 * The account entry point, pinned to the top-right of the header.
 *
 * Lives outside the primary navigation: the other three destinations are
 * places in the app, whereas this is "you", which is why it reads better in
 * the header corner than as a fourth peer tab.
 *
 * Carries the pending-connection-requests badge, since that count is the one
 * thing on the hub that is time-sensitive.
 */
export function AccountButton({ className }: { className?: string }) {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const pending = usePendingRequestCount()
  const active = pathname.startsWith('/you')

  return (
    <Link
      to={ROUTES.YOU}
      aria-label="Your account"
      aria-current={active ? 'page' : undefined}
      className={cn('relative shrink-0 rounded-full', className)}
    >
      <UserAvatar
        name={user?.name}
        src={user?.avatarUrl}
        size="sm"
        className={cn(
          'transition-transform duration-fast',
          active
            ? 'ring-2 ring-primary ring-offset-2 ring-offset-card'
            : 'hover:scale-105',
        )}
      />
      <NavBadge
        count={pending}
        label="pending connection requests"
        className="absolute -top-1 -right-1"
      />
    </Link>
  )
}
