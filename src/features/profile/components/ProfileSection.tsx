import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * A titled block inside a profile card — About Me, Interests, a form field.
 *
 * The titles were previously bare `font-semibold`, which inherits the 16px
 * browser default and lands *above* the 15px body text set beneath it. A one
 * pixel step is not a hierarchy, so a profile read as an undifferentiated wall
 * of bold-then-not-bold. `subhead` plus the rule under it is the same
 * treatment the community screen already uses for its section headers.
 */

export type ProfileSectionProps = {
  title: string
  /** Instructional line under the title, e.g. "Select all that apply". */
  hint?: string
  /** Sits opposite the title on the rule — a count, an edit link. */
  action?: ReactNode
  children: ReactNode
  className?: string
}

export function ProfileSection({
  title,
  hint,
  action,
  children,
  className,
}: ProfileSectionProps) {
  return (
    <section className={cn('space-y-3', className)}>
      <div className="flex items-baseline justify-between gap-3 border-b border-border pb-2">
        <h3 className="font-heading text-subhead font-semibold text-foreground">
          {title}
        </h3>
        {action}
      </div>

      {hint ? <p className="text-caption text-muted-foreground">{hint}</p> : null}

      {children}
    </section>
  )
}

/**
 * The surface those sections sit on.
 *
 * Sections are separated by their own rules, so the card spaces them further
 * apart than the old uniform `space-y-4` did — the rule needs air on both
 * sides or it reads as a divider between the heading and its own content.
 */
export function ProfileCard({
  title,
  action,
  children,
  className,
}: {
  /** Names the card above its sections. Omit on a card that is the whole page. */
  title?: string
  /** Sits opposite the title — the Edit link on /you. */
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('rounded-lg bg-card p-6 shadow-md space-y-6', className)}>
      {title ? (
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-heading text-heading text-foreground">{title}</h2>
          {action}
        </div>
      ) : null}
      {children}
    </div>
  )
}
