import { Link } from 'react-router-dom'
import { ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'
import logo from '@/assets/logo.png'
import { useNavItems } from './useNavItems'
import { NavBadge } from './NavBadge'

/**
 * Desktop navigation.
 *
 * A persistent left rail from lg upward, replacing the bottom bar. On a laptop
 * a bottom-anchored tab bar is a phone idiom — it wastes the horizontal space
 * that is the whole reason the screen is wider.
 *
 * Renders from the same useNavItems() source as BottomNav, so the two cannot
 * describe different apps.
 */
export function SideNav() {
  const items = useNavItems()

  return (
    <nav
      aria-label="Primary"
      className="hidden lg:flex w-60 xl:w-64 shrink-0 flex-col gap-1 border-r border-border bg-card px-3 py-4"
    >
      <Link to={ROUTES.DADS} className="mb-4 flex items-center gap-2 px-2 py-1">
        <img src={logo} alt="Next Level Dads" className="h-9 w-auto" />
      </Link>

      <ul role="list" className="flex flex-col gap-1">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <li key={item.key}>
              <Link
                to={item.to}
                aria-current={item.active ? 'page' : undefined}
                className={cn(
                  'group flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors duration-fast',
                  item.active
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                )}
              >
                <Icon
                  aria-hidden
                  className="w-5 h-5 shrink-0"
                  strokeWidth={item.active ? 2.25 : 2}
                />
                <span className="flex-1 text-label">{item.label}</span>
                <NavBadge count={item.badge} label={item.badgeLabel} />
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
