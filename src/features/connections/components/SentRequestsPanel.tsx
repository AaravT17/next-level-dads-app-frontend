import { useId, useState } from 'react'
import { ChevronDown, Clock } from 'lucide-react'
import DadCard from '@/components/DadCard'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { NO_REQUEST_FILTERS } from '../hooks/useIncomingRequests'
import { useOutgoingRequests } from '../hooks/useOutgoingRequests'

/**
 * Requests you have sent, on the Dads screen.
 *
 * The browse grid below used to hold these: a dad you had already asked stayed
 * in the results with his Connect button swapped for a clock. Browse now
 * returns only dads you have not acted on, which is what makes the grid worth
 * scrolling — but it also means a sent request would have had nowhere left to
 * live, and no way to be taken back. This is that place.
 *
 * Deliberately quieter than ConnectionRequestsPanel above it, and collapsed by
 * default. An incoming request is addressed to you and wants an answer; a sent
 * one is waiting on somebody else and wants nothing. Giving both the same
 * treatment would make the top of the page read as two inboxes when only one
 * of them is. Closed, it costs a single line; open, it is a working list.
 *
 * Renders nothing while loading, on error, and when empty — the same rule the
 * incoming panel follows, so the browse grid does not jump on every load for a
 * section most accounts will not have.
 */
export function SentRequestsPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const listId = useId()

  const { data, isPending, isError, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useOutgoingRequests(NO_REQUEST_FILTERS)

  const requests = data?.pages.flat() ?? []

  if (isPending || isError || requests.length === 0) return null

  // Counts what has been loaded, so a further page reads as "12+" rather than
  // quietly under-reporting.
  const count = `${requests.length}${hasNextPage ? '+' : ''}`

  return (
    <section aria-labelledby={`${listId}-heading`} className="rounded-lg border border-border">
      <h2 id={`${listId}-heading`}>
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={listId}
          onClick={() => setIsOpen((open) => !open)}
          className="flex w-full items-center gap-2 rounded-lg px-4 py-3 text-left ring-offset-background transition-colors duration-fast hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Clock aria-hidden className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="text-label font-medium text-foreground">
            {count} sent {requests.length === 1 && !hasNextPage ? 'request' : 'requests'}
          </span>
          <span className="text-caption text-muted-foreground">awaiting a reply</span>
          <ChevronDown
            aria-hidden
            className={cn(
              'ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-fast',
              isOpen && 'rotate-180',
            )}
          />
        </button>
      </h2>

      <div id={listId} hidden={!isOpen} className="space-y-3 border-t border-border p-4">
        <ul role="list" className="space-y-3">
          {requests.map((request) => (
            <li key={request.id}>
              {/*
                listContext is passed explicitly: DadCard otherwise infers it
                from the pathname, and on /dads it would treat this as a browse
                result and leave a cancelled request sitting in the panel.
              */}
              <DadCard {...request} listContext="sent" clampNote />
            </li>
          ))}
        </ul>

        {hasNextPage && (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={isFetchingNextPage}
            onClick={() => fetchNextPage()}
          >
            {isFetchingNextPage ? 'Loading…' : 'Load more'}
          </Button>
        )}
      </div>
    </section>
  )
}
