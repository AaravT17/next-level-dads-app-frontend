import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { CONTENT_WIDTH, type ContentWidth } from './contentWidth'

/**
 * URL-driven section tabs.
 *
 * Links with aria-current rather than a role="tablist", because each tab is a
 * distinct route: tablist would promise same-page panels that back/forward
 * navigation does not deliver.
 *
 * The underline rides on a transform so switching tabs animates on the
 * compositor rather than by repainting a border.
 */

export type TabBarItem = {
  label: string
  to: string
  isActive: boolean
}

export function TabBar({
  items,
  ariaLabel,
  width = 'default',
}: {
  items: TabBarItem[]
  ariaLabel: string
  /** Should match the AppBar above it so the left edges line up. */
  width?: ContentWidth
}) {
  const activeIndex = Math.max(0, items.findIndex((i) => i.isActive))

  return (
    <nav aria-label={ariaLabel} className="shrink-0 bg-card border-b border-border">
      <div className={cn(CONTENT_WIDTH[width], 'px-3 sm:px-6')}>
        {/* Tabs stay compact on wide screens instead of stretching edge to edge. */}
        <div className="relative w-full sm:max-w-md">
          <ul className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
            {items.map((item) => (
              <li key={item.to} className="contents">
                <Link
                  to={item.to}
                  aria-current={item.isActive ? 'page' : undefined}
                  className={cn(
                    'flex h-12 items-center justify-center text-label transition-colors duration-fast',
                    item.isActive
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <span
            aria-hidden
            className="absolute bottom-0 left-0 h-0.5 bg-primary transition-transform duration-base ease-soft"
            style={{
              width: `${100 / items.length}%`,
              transform: `translateX(${activeIndex * 100}%)`,
            }}
          />
        </div>
      </div>
    </nav>
  )
}
