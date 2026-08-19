import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { UserSearch, Users, MessageCircle } from 'lucide-react'
import { ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { UserAvatar } from '@/components/media/UserAvatar'
import { useUnreadChatCount, usePendingRequestCount } from '@/hooks/useNavBadges'

/**
 * Primary navigation.
 *
 * One tab per kind of thing, which is why "Discover" and "Groups" collapsed:
 * they were the same objects split by whether you had joined them.
 *
 * The last tab renders the user's own avatar rather than an icon. Two tabs
 * previously shared the identical Users glyph, so the row read as ambiguous
 * no matter what the labels said.
 *
 * A flex sibling of the scroll region rather than `fixed`, so it cannot escape
 * the desktop frame and no page needs padding to clear it.
 */

function Badge({ count, label }: { count: number; label: string }) {
  if (count <= 0) return null
  return (
    <>
      <span
        aria-hidden
        className="absolute -top-0.5 right-1/2 translate-x-4 min-w-[1.125rem] h-[1.125rem] px-1 rounded-full bg-destructive text-destructive-foreground text-[0.625rem] font-semibold leading-[1.125rem] text-center"
      >
        {count > 9 ? '9+' : count}
      </span>
      <span className="sr-only">
        {count} {label}
      </span>
    </>
  )
}

type Tab = {
  label: string
  to: string
  isActive: (pathname: string) => boolean
  render: (active: boolean) => ReactNode
  badge?: ReactNode
}

export function BottomNav() {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const unread = useUnreadChatCount()
  const pendingRequests = usePendingRequestCount()

  const icon = (Icon: typeof Users) => (active: boolean) => (
    <Icon
      aria-hidden
      className={cn('w-5 h-5 transition-transform duration-fast', active && 'scale-110')}
      strokeWidth={active ? 2.25 : 2}
    />
  )

  const tabs: Tab[] = [
    {
      label: 'Dads',
      to: ROUTES.DADS,
      isActive: (p) => p.startsWith('/dads'),
      render: icon(UserSearch),
    },
    {
      label: 'Groups',
      to: ROUTES.GROUPS_COMMUNITIES,
      isActive: (p) =>
        p.startsWith('/groups') || p.startsWith('/communities') || p.startsWith('/events'),
      render: icon(Users),
    },
    {
      label: 'Chats',
      to: ROUTES.CHATS,
      isActive: (p) => p.startsWith('/chats'),
      render: icon(MessageCircle),
      badge: <Badge count={unread} label="unread conversations" />,
    },
    {
      label: 'You',
      to: ROUTES.YOU,
      isActive: (p) => p.startsWith('/you'),
      render: (active) => (
        <UserAvatar
          name={user?.name}
          src={user?.avatarUrl}
          size="xs"
          className={cn(
            'w-6 h-6 text-[0.5rem] transition-transform duration-fast',
            active && 'ring-2 ring-primary ring-offset-2 ring-offset-card scale-105',
          )}
        />
      ),
      badge: <Badge count={pendingRequests} label="pending connection requests" />,
    },
  ]

  return (
    <nav
      aria-label="Primary"
      className="shrink-0 bg-card border-t border-border pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="flex items-stretch h-16">
        {tabs.map((tab) => {
          const active = tab.isActive(pathname)
          return (
            <li key={tab.label} className="flex-1">
              <Link
                to={tab.to}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex h-full flex-col items-center justify-center gap-1 transition-colors duration-fast',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                {tab.render(active)}
                {tab.badge}
                <span className="text-overline">{tab.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
