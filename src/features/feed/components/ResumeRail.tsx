import { Link } from 'react-router-dom'
import { ArrowRight, MessageCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ROUTES, conversationDetail } from '@/lib/routes'
import { useResume } from '../hooks/useResume'
import type { ResumeConversation, ResumeReason } from '../api/resumeApi'

/**
 * "Get back into it" — a horizontal shelf of conversations you have a stake in.
 *
 * A rail rather than a list so the section stays shallow and the feed below it
 * still opens above the fold on a phone. Sideways motion also distinguishes it
 * from the feed: this is a short, finite set to resume, not something to browse.
 *
 * The arrow beside the heading opens the same set as a full page, for when the
 * shelf is not enough.
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
          : data?.map((item) => (
              <li key={item.id} className="w-56 shrink-0 snap-start sm:w-64">
                <ResumeCard item={item} />
              </li>
            ))}
      </ul>
    </section>
  )
}
