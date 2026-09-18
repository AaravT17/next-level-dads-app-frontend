/**
 * How wide a page's content column is allowed to grow.
 *
 * Below lg everything is full-bleed — the phone layout. Above it, text and
 * forms stay in a readable measure while card grids are allowed to spread,
 * which is what earns the extra screen width.
 */
export type ContentWidth = 'default' | 'wide' | 'full'

export const CONTENT_WIDTH: Record<ContentWidth, string> = {
  /** Feeds, forms, detail screens — a comfortable reading measure. */
  default: 'mx-auto w-full max-w-2xl',
  /** Card grids that benefit from multiple columns. */
  wide: 'mx-auto w-full max-w-6xl',
  /** Full-height panes that manage their own layout, such as Chat. */
  full: 'w-full',
}
