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
          'min-w-[1.125rem] h-[1.125rem] px-1 rounded-full bg-destructive text-destructive-foreground',
          'text-[0.625rem] font-semibold leading-[1.125rem] text-center',
          className,
        )}
      >
        {count > 9 ? '9+' : count}
      </span>
      <span className="sr-only">
        {count} {label ?? 'unread'}
      </span>
    </>
  )
}
