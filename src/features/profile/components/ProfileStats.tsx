import { cn } from '@/lib/utils'

/**
 * The connections / communities / events figure strip.
 *
 * /you and /you/edit both showed these three numbers in two different
 * treatments — 20px neutral against 24px gold, captions against body text.
 * One component, and the figure gets to be the loudest thing in the strip:
 * it is the only part anyone reads at a glance, so the label under it drops to
 * small caps and gets out of the way.
 */

export type ProfileStat = {
  label: string
  value: number
}

export function ProfileStats({
  stats,
  label = 'Your activity',
  className,
}: {
  stats: readonly ProfileStat[]
  /** Names the strip for screen readers, which otherwise meet three bare numbers. */
  label?: string
  className?: string
}) {
  return (
    <dl
      aria-label={label}
      className={cn(
        'grid grid-cols-3 overflow-hidden rounded-lg bg-card shadow-sm',
        className,
      )}
    >
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          // col-reverse so the figure paints above its label while the DOM
          // keeps the dt-then-dd order a definition list requires.
          className={cn(
            'flex flex-col-reverse gap-1 px-2 py-5 text-center',
            i > 0 && 'border-l border-border',
          )}
        >
          <dt className="text-overline uppercase text-muted-foreground">
            {stat.label}
          </dt>
          <dd className="font-heading text-title text-primary">{stat.value}</dd>
        </div>
      ))}
    </dl>
  )
}
