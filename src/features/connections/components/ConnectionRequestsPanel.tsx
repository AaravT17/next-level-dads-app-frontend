import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, UserPlus } from 'lucide-react'
import DadCard from '@/components/DadCard'
import { ROUTES } from '@/lib/routes'
import { useIncomingRequests, NO_REQUEST_FILTERS } from '../hooks/useIncomingRequests'

/**
 * Incoming connection requests, at the top of the Dads screen.
 *
 * Someone asking to connect is the one thing on this page addressed to *you*;
 * browsing is what you do when there is nothing waiting. So it sits above the
 * search field rather than below the grid, and reads as an inbox — a single
 * vertical column against the two-up browse grid underneath, so the eye can
 * tell at a glance that these are not more search results.
 *
 * Capped at two. Past that the panel stops being a nudge and starts being a
 * second list competing with the one the page is named after; the overflow
 * link hands the rest to /you/requests, which already has search and paging.
 *
 * Renders nothing while loading, on error, and when empty. Most accounts have
 * no pending requests, and a skeleton that resolves to nothing would push the
 * dads grid down on every single load for a section that then vanishes.
 */

const VISIBLE_REQUEST_LIMIT = 2

export function ConnectionRequestsPanel() {
  const { pathname, search } = useLocation()
  const { data, isPending, isError, hasNextPage } =
    useIncomingRequests(NO_REQUEST_FILTERS)

  const requests = data?.pages.flat() ?? []

  if (isPending || isError || requests.length === 0) return null

  const visible = requests.slice(0, VISIBLE_REQUEST_LIMIT)
  const hasMore = requests.length > VISIBLE_REQUEST_LIMIT || hasNextPage

  return (
    <section
      aria-labelledby="connection-requests-heading"
      className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="connection-requests-heading"
          className="flex items-center gap-2 font-heading text-heading text-foreground"
        >
          <UserPlus aria-hidden className="h-5 w-5 text-primary" />
          Connection requests
        </h2>

        {/*
          The count lives beside the heading rather than in the link, so it
          still reads when there are four or fewer and no link is drawn. It
          counts what has been *loaded*, so a further page turns it into "20+"
          rather than quietly under-reporting.
        */}
        <span className="shrink-0 text-caption text-muted-foreground">
          {requests.length}
          {hasNextPage ? '+' : ''} waiting
        </span>
      </div>

      <ul role="list" className="space-y-3">
        {visible.map((request) => (
          <li key={request.id}>
            {/*
              listContext is passed explicitly: DadCard otherwise infers it
              from the pathname, and on /dads it would treat an accepted
              request as a browse result and leave the card sitting here.
            */}
            <DadCard {...request} listContext="requests" clampNote />
          </li>
        ))}
      </ul>

      {hasMore && (
        /*
          `from` is what the back button on /you/requests reads. Without it
          that screen falls back to /you and drops the user on a tab they were
          never on. The search string rides along so back returns to the browse
          filters they had set, not a reset grid.
        */
        <Link
          to={ROUTES.REQUESTS}
          state={{ from: `${pathname}${search}` }}
          className="flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-label font-medium text-foreground transition-colors duration-fast hover:bg-primary/10"
        >
          {/*
            Body text, not gold. Gold is the brand accent and reads as decoration
            against this panel's own gold-tinted fill, which left the label the
            faintest thing in a section that is asking to be acted on. The arrow
            keeps the accent — it is the part that says "this goes somewhere",
            and one gold glyph carries that without costing the words contrast.
          */}
          See all requests
          <ArrowRight aria-hidden className="h-4 w-4 text-primary" />
        </Link>
      )}
    </section>
  )
}
