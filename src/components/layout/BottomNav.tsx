import { Users, MessageCircle, Compass } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'

/**
 * Primary navigation.
 *
 * A flex sibling of the scroll region rather than `fixed bottom-0`, so it
 * cannot escape the desktop frame and no page needs bottom padding to clear
 * it. Real list semantics and aria-current, which the previous div-and-link
 * version lacked.
 *
 * The tab set itself is unchanged here; the IA rework replaces it.
 */

type NavItem = {
  icon: typeof Compass
  label: string
  path: string
  isActive: (pathname: string) => boolean
}

const NAV_ITEMS: NavItem[] = [
  {
    icon: Compass,
    label: 'Discover',
    path: ROUTES.DISCOVER_DADS,
    isActive: (p) => p.startsWith('/discover'),
  },
  {
    icon: Users,
    label: 'Groups',
    path: ROUTES.GROUPS_COMMUNITIES,
    isActive: (p) => p.startsWith('/groups') || p.startsWith('/communities'),
  },
  {
    icon: MessageCircle,
    label: 'Chats',
    path: ROUTES.CHATS,
    isActive: (p) => p.startsWith('/chats'),
  },
  {
    // Only the user's own profile, never /profiles/:id.
    icon: Users,
    label: 'Profile',
    path: ROUTES.PROFILE,
    isActive: (p) => p === '/profile' || p.startsWith('/profile/'),
  },
]

export function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav
      aria-label="Primary"
      className="shrink-0 bg-card border-t border-border pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="flex items-stretch h-16">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const active = item.isActive(pathname)
          return (
            <li key={item.label} className="flex-1">
              <Link
                to={item.path}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-full flex-col items-center justify-center gap-1 transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <Icon className={cn('w-5 h-5 transition-transform', active && 'scale-110')} />
                <span className="text-overline">{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
