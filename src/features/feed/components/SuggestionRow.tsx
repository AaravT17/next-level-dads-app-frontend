import type { ReactNode } from 'react'
import { CalendarDays, UserPlus } from 'lucide-react'
import DadCard from '@/components/DadCard'
import EventCard from '@/components/EventCard'
import type { Event } from '@/types/events'
import type { Profile } from '@/types/users'

/**
 * A suggestion sitting between feed posts.
 *
 * The existing EventCard and DadCard are reused whole rather than restyled:
 * they already own their join/connect mutations and cache patching, and a feed
 * copy of that logic would be a second place for those to drift.
 *
 * What is added is a labelled frame. Without it a suggestion is a card that
 * looks like every other card but is not a post, which reads as the feed
 * glitching. The eyebrow says what the row is and why it is here before the
 * card below it asks for anything.
 */

function SuggestionFrame({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof CalendarDays
  label: string
  children: ReactNode
}) {
  return (
    <section aria-label={label} className="space-y-1.5">
      <p className="flex items-center gap-1.5 text-overline uppercase text-muted-foreground">
        <Icon aria-hidden className="h-3.5 w-3.5" />
        {label}
      </p>
      {children}
    </section>
  )
}

export function EventSuggestion({ event }: { event: Event }) {
  return (
    <SuggestionFrame icon={CalendarDays} label="Suggested event">
      <EventCard {...event} />
    </SuggestionFrame>
  )
}

export function DadSuggestion({ dad }: { dad: Profile }) {
  return (
    <SuggestionFrame icon={UserPlus} label="Suggested dad">
      {/*
        listContext is passed explicitly: DadCard otherwise reads the pathname,
        and /home is not one it knows, so it would fall through to the browse
        grid's rules — which now remove a card once you connect. A row vanishing
        out of the middle of a feed you are reading is the one thing a
        suggestion must never do.
      */}
      <DadCard {...dad} listContext="suggestion" />
    </SuggestionFrame>
  )
}
