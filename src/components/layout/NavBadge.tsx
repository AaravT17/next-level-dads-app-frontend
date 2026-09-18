import { cn } from '@/lib/utils'

/** Count pill shared by both navigations. Caps the glyph, not the announcement. */
export function NavBadge({
  count,
  label,
  className,
}: {
  count: number
  label?: string
  className?: string
}) {
  if (count <= 0) return null
  return (
    <>
      <span
        aria-hidden
        className={cn(
          'min-w-[1.375rem] h-[1.375rem] px-1 rounded-full bg-badge text-badge-foreground',
          'text-[0.6875rem] font-semibold leading-[1.375rem] text-center',
          className,
        )}
      >
        {count > 99 ? '99+' : count}
      </span>
      <span className="sr-only">
        {count} {label ?? 'unread'}
      </span>
    </>
  )
}
