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

/**
 * Suggested dads, as a shelf.
 *
 * Scrolls sideways like the resume rail at the top of Home, and for the same
 * reason: a set of fixed-width cards fits any viewport without the cards
 * themselves having to reflow, where one full-width profile between posts had
 * to stretch to whatever the page was and became the heaviest thing on it.
 * Sideways motion also separates a suggestion from the feed — this is a short,
 * finite set to skim, not more of what you were reading.
 *
 * Same labelled frame as an event suggestion, and no link out of it. The rail
 * is a handful of dads offered in passing; a "see all" would make it the top of
 * a section, which is what the Dads tab already is.
 *
 * Cards keep their natural width rather than shrinking to the rail's: a
 * DadCard holds an avatar, three lines of detail and its connect control in
 * one row, and squeezing that into a resume card's measure would mean a second
 * profile card built to a different spec. Wide cards with one and a bit in
 * view is the normal shape for a shelf of substantial items anyway.
 */
export function DadSuggestion({ dads }: { dads: Profile[] }) {
  return (
    <SuggestionFrame icon={UserPlus} label="Suggested dads">
      {/*
        A scroll container rather than a carousel with controls: already
        swipeable on touch, keyboard-scrollable on desktop, and every card
        carries its own focusable connect button, so tab order walks the rail.

        The negative margin plus matching padding lets cards bleed to the screen
        edge as they scroll while the first still lines up with the page gutter.
        The numbers match ResumeRail so the two shelves on Home scroll on the
        same edges.
      */}
      <ul
        role="list"
        className="-mx-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 pb-2 sm:-mx-6 sm:px-6"
      >
        {dads.map((dad) => (
          <li key={dad.id} className="w-[19rem] shrink-0 snap-start sm:w-[20rem]">
            {/*
              listContext is passed explicitly: DadCard otherwise reads the
              pathname, and /home is not one it knows, so it would fall through
              to the browse grid's rules — which remove a card once you connect.
              A card vanishing out of a shelf you are part-way along is the one
              thing a suggestion must never do.
            */}
            <DadCard {...dad} listContext="suggestion" />
          </li>
        ))}
      </ul>
    </SuggestionFrame>
  )
}
