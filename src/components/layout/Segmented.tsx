import { cn } from '@/lib/utils'

/**
 * Scope filter for a list — "Joined" vs "All".
 *
 * This control is what replaced a whole section of the app: browsing all
 * communities and seeing the ones you belong to used to be two different
 * screens under two different tabs, which meant the same card appeared twice
 * meaning two different things.
 */

export type SegmentedOption<T extends string> = { value: T; label: string }

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  ariaLabel: string
}) {
  const index = Math.max(0, options.findIndex((o) => o.value === value))

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="relative grid rounded-full bg-muted/60 p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}
    >
      <span
        aria-hidden
        className="absolute inset-y-1 rounded-full bg-card shadow-sm transition-transform duration-base ease-soft"
        style={{
          width: `calc((100% - 0.5rem) / ${options.length})`,
          transform: `translateX(calc(${index} * 100%))`,
          left: '0.25rem',
        }}
      />
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative z-10 rounded-full px-4 py-1.5 text-label transition-colors duration-fast',
              selected ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
