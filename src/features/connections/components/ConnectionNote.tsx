import { Quote } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * The message someone attached to their connection request.
 *
 * Styled as a quotation rather than as more body copy, because it is the one
 * piece of a request card somebody wrote — everything else on the card is the
 * same profile text every other dad sees. The left rule and the mark do that
 * work without needing an attribution label eating a line, which is also what
 * lets the sent-requests panel reuse it for the note you wrote them.
 *
 * `clamp` is on in both Dads panels, where cards sit above the browse grid and
 * cannot be allowed to grow without bound; the requests page and the profile
 * show the note in full, since deciding is the whole purpose of those screens.
 */
export function ConnectionNote({
  note,
  clamp = false,
  className,
}: {
  note: string
  clamp?: boolean
  className?: string
}) {
  return (
    <figure
      className={cn(
        'flex gap-2 rounded-md border-l-2 border-primary/40 bg-muted/50 px-3 py-2',
        className,
      )}
    >
      <Quote aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/60" />
      <blockquote
        className={cn(
          'text-body italic leading-relaxed text-foreground/90',
          clamp && 'line-clamp-3',
        )}
      >
        {note}
      </blockquote>
    </figure>
  )
}
