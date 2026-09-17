import { Link } from 'react-router-dom'
import { ArrowRight, MessageCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ROUTES, conversationDetail } from '@/lib/routes'
import { RESUME_PAGE_LIMIT, RESUME_RAIL_VISIBLE_LIMIT } from '@/config/constants'
import { useResume } from '../hooks/useResume'
import type { ResumeConversation, ResumeReason } from '../api/resumeApi'

/**
 * "Get back into it" — a horizontal shelf of conversations you have a stake in.
 *
 * A rail rather than a list so the section stays shallow and the feed below it
 * still opens above the fold on a phone. Sideways motion also distinguishes it
 * from the feed: this is a short, finite set to resume, not something to browse.
 *
 * The shelf is capped at RESUME_RAIL_VISIBLE_LIMIT. The arrow beside the
 * heading opens the whole set as a full page, for when the shelf is not enough
 * -- and past the cap, there is genuinely more behind it.
 *
 * The section removes itself entirely when there is nothing to resume — on
 * error, and when the list is empty. A new user has nothing to get back into,
 * and an empty-state card telling them so would be the first thing they ever
 * see on Home. Failing silently is deliberate for the same reason: an error
 * strip above the feed would be noise for a section nobody asked for. The feed
 * is the page's real content; this is a shortcut that appears once earned.
 */

const RESUME_REASON_LABEL: Record<ResumeReason, string> = {
  authored: 'you posted',
  replied: 'you replied',
  hearted: 'you hearted',
}

function ResumeCard({ item }: { item: ResumeConversation }) {
  const hasUnseen = item.unseen_reply_count > 0

  // An anchor, not a Card with onClick. The div version was unreachable by
  // keyboard and invisible to assistive tech, despite the comment below
  // claiming tab order alone walks the rail. This also restores middle-click
  // and open-in-new-tab.
  return (
    <Link
      to={conversationDetail(item.community_id, item.id)}
      className="block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Card className="h-full transition-shadow hover:shadow-md">
      <CardContent className="flex h-full flex-col gap-2 p-4">
        <p className="text-overline uppercase text-primary">{item.community_name}</p>

        <h3 className="line-clamp-2 font-semibold leading-snug text-foreground">{item.title}</h3>

        <p className="mt-auto flex items-center gap-1.5 border-t border-border pt-2 text-caption text-muted-foreground">
          {hasUnseen ? (
            <>
              <MessageCircle aria-hidden className="h-3.5 w-3.5 text-primary" />
              <span className="font-medium text-primary">
                {item.unseen_reply_count} new{' '}
                {item.unseen_reply_count === 1 ? 'reply' : 'replies'}
              </span>
            </>
          ) : (
            <span>{RESUME_REASON_LABEL[item.reason] ?? 'you took part'}</span>
          )}
        </p>
      </CardContent>
      </Card>
    </Link>
  )
}

/**
 * The card that ends a capped rail.
 *
 * Sits where the eighth thread would have been, so reaching the end of the
 * scroll lands on the way to the rest rather than on a hard stop. Only drawn
 * when something was actually cut — with seven or fewer the rail is the whole
 * set, and a "see all" promising more would be a door onto the same room.
 *
 * Narrower than a thread card, and a gold surface rather than a white one: it
 * is the one thing in the rail that is an action instead of a thread, and the
 * accent is what says so before the words do. Deliberately not the dashed
 * outline that usually ends a row of cards — dashes read as an empty slot
 * waiting to be filled, and this is a destination, not a gap.
 *
 * The count leads at display size because it is the actual information; "see
 * all" is a label anyone could have guessed. The arrow nudges on hover, the
 * same gesture the conversation breadcrumb uses.
 */
function ResumeMoreCard({ remaining, isCapped }: { remaining: number; isCapped: boolean }) {
  return (
    <Link
      to={ROUTES.HOME_RESUME}
      className="group block h-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Card className="h-full border-primary/25 bg-primary/5 shadow-none transition-colors duration-fast group-hover:border-primary/50 group-hover:bg-primary/10">
        <CardContent className="flex h-full flex-col justify-between gap-3 p-4">
          {/*
            The server caps the query at RESUME_PAGE_LIMIT, so a full response
            means "this many at least". The plus keeps the card from reporting
            a ceiling as though it were a total.
          */}
          <p className="font-heading text-3xl font-semibold leading-none text-primary">
            {remaining}
            {isCapped ? '+' : ''}
          </p>

          <div className="space-y-1">
            <p className="font-semibold leading-snug text-foreground">more waiting</p>
            <p className="flex items-center gap-1 text-caption text-primary">
              See all
              <ArrowRight
                aria-hidden
                className="h-3.5 w-3.5 transition-transform duration-fast group-hover:translate-x-0.5"
              />
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function ResumeCardSkeleton() {
  return (
    <Card className="h-full">
      <CardContent className="space-y-2 p-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="mt-3 h-3 w-24" />
      </CardContent>
    </Card>
  )
}

export function ResumeRail() {
  const { data, isPending, isError } = useResume()

  // Nothing to resume, or no way to know yet: the section does not exist.
  if (isError) return null
  if (!isPending && !data?.length) return null

  // The query is shared with /home/resume, which shows all of it. Capping here
  // rather than in the request is what leaves that page something more to show,
  // and the links out of this one somewhere to go.
  const visible = data?.slice(0, RESUME_RAIL_VISIBLE_LIMIT) ?? []
  const remaining = (data?.length ?? 0) - visible.length

  return (
    <section aria-labelledby="resume-heading" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id="resume-heading" className="font-heading text-heading text-foreground">
          Get back into it
        </h2>

        {/*
          The arrow is its own link rather than the heading being clickable:
          a heading that navigates gives no hint that it does, and screen
          readers would announce the section title as a link to itself.
        */}
        <Link
          to={ROUTES.HOME_RESUME}
          aria-label="See everything to get back into"
          className="flex shrink-0 items-center gap-1 rounded-md p-2 -m-2 text-label text-muted-foreground transition-colors duration-fast hover:text-foreground"
        >
          <span className="sr-only sm:not-sr-only">See all</span>
          <ArrowRight aria-hidden className="h-4 w-4" />
        </Link>
      </div>

      {/*
        A scroll container rather than a carousel with controls: it is already
        swipeable on touch and keyboard-scrollable on desktop, and every card
        is a link, so tab order alone walks the whole rail.

        The negative margin plus matching padding lets cards bleed to the
        screen edge as they scroll while the first one still lines up with the
        page gutter — a rail that stops short of the edge reads as clipped.
      */}
      <ul
        role="list"
        className="-mx-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 pb-2 sm:-mx-6 sm:px-6"
      >
        {isPending
          ? Array.from({ length: 3 }, (_, i) => (
              <li key={i} className="w-56 shrink-0 sm:w-64">
                <ResumeCardSkeleton />
              </li>
            ))
          : visible.map((item) => (
              <li key={item.id} className="w-56 shrink-0 snap-start sm:w-64">
                <ResumeCard item={item} />
              </li>
            ))}

        {remaining > 0 && (
          <li className="w-44 shrink-0 snap-start sm:w-48">
            <ResumeMoreCard
              remaining={remaining}
              isCapped={data?.length === RESUME_PAGE_LIMIT}
            />
          </li>
        )}
      </ul>
    </section>
  )
}
