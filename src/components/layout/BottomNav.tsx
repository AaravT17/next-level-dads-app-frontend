import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { UserAvatar } from '@/components/media/UserAvatar'
import { cn } from '@/lib/utils'
import { useNavItems } from './useNavItems'
import { NavBadge } from './NavBadge'

/**
 * Mobile navigation. Hidden from lg upward, where SideNav takes over.
 *
 * A flex sibling of the scroll region rather than `fixed`, so no page needs
 * padding to clear it.
 */
export function BottomNav() {
  const items = useNavItems()
  const { user } = useAuth()

  return (
    <nav
      aria-label="Primary"
      className="lg:hidden shrink-0 bg-card border-t border-border pb-[env(safe-area-inset-bottom)]"
    >
      <ul role="list" className="flex items-stretch h-16">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <li key={item.key} className="flex-1">
              <Link
                to={item.to}
                aria-current={item.active ? 'page' : undefined}
                className={cn(
                  'relative flex h-full flex-col items-center justify-center gap-1 transition-colors duration-fast',
                  item.active ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                {item.kind === 'avatar' ? (
                  <UserAvatar
                    name={user?.name}
                    src={user?.avatarUrl}
                    size="xs"
                    className={cn(
                      'w-6 h-6 text-[0.5rem] transition-transform duration-fast',
                      item.active &&
                        'ring-2 ring-primary ring-offset-2 ring-offset-card scale-105',
                    )}
                  />
                ) : Icon ? (
                  <Icon
                    aria-hidden
                    className={cn(
                      'w-5 h-5 transition-transform duration-fast',
                      item.active && 'scale-110',
                    )}
                    strokeWidth={item.active ? 2.25 : 2}
                  />
                ) : null}
                <NavBadge
                  count={item.badge}
                  label={item.badgeLabel}
                  className="absolute -top-0.5 right-1/2 translate-x-4"
                />
                <span className="text-overline">{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
