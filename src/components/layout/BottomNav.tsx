import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useNavItems } from './useNavItems'
import { NavBadge } from './NavBadge'

/**
 * Primary navigation at every width — the bar spans the screen rather than
 * handing over to a side rail on desktop.
 *
 * A flex sibling of the scroll region rather than `fixed`, so no page needs
 * padding to clear it.
 */
export function BottomNav() {
  const items = useNavItems()

  return (
    <nav
      aria-label="Primary"
      className="shrink-0 bg-card border-t border-border pb-[env(safe-area-inset-bottom)]"
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
                <span className="relative">
                  <Icon
                    aria-hidden
                    className={cn(
                      'w-5 h-5 transition-transform duration-fast',
                      item.active && 'scale-110',
                    )}
                    strokeWidth={item.active ? 2.25 : 2}
                  />
                  <NavBadge
                    count={item.badge}
                    label={item.badgeLabel}
                    className="absolute -top-3 -right-3"
                  />
                </span>
                <span className="text-overline">{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
