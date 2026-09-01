import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Newspaper } from 'lucide-react'
import { Segmented } from '@/components/layout/Segmented'
import { QueryState } from '@/components/feedback/QueryState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { InfiniteSentinel } from '@/components/feedback/InfiniteSentinel'
import { ListSkeleton } from '@/components/feedback/skeletons/ListSkeleton'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { ConversationCard } from '@/features/communities/components/ConversationCard'
import { useFeed } from '../hooks/useFeed'
import { useSuggestions } from '../hooks/useSuggestions'
import { interleaveFeed } from '../lib/interleave'
import { DadSuggestion, EventSuggestion } from './SuggestionRow'

/**
 * Posts from across every community.
 *
 * "Following" means communities you have joined — the app has no separate
 * follow relationship, and membership is what /api/users/me/communities
 * already exposes.
 *
 * Events and dads are woven in between posts. They are deliberately not part
 * of the feed query: suggestions are not posts, they page differently, and
 * folding them into the same cursor would make pagination depend on how many
 * non-posts happened to land on a page. The feed pages on its own, and
 * interleaveFeed places suggestions over whatever it has loaded.
 *
 * The scope lives in the URL as ?feed=, distinct from the communities list's
 * ?scope=. The two lived on one page as sibling tabs before the feed became
 * Home; keeping the names apart means old links still resolve unambiguously.
 */

const FEED_SCOPES = [
  { value: 'all' as const, label: 'All' },
  { value: 'following' as const, label: 'Following' },
]

/**
 * The All/Following control is hidden: the feed shows everything.
 *
 * Only the control is gone. The scope itself is still wired end to end — the
 * ?feed=following URL still filters, useFeed still takes the flag, and the
 * empty state still offers to widen the scope if you arrive on a filtered
 * link. Flipping this back to true is all it takes to re-expose it, so the
 * plumbing does not rot in the meantime.
 */
const SHOW_FEED_SCOPE_FILTER = false

function FeedCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </CardContent>
    </Card>
  )
}

export function CommunityFeed() {
  const [searchParams, setSearchParams] = useSearchParams()
  const following = searchParams.get('feed') === 'following'
  const query = useFeed(following)
  const suggestions = useSuggestions()
  const posts = useMemo(() => query.data?.pages.flat() ?? [], [query.data])

  const rows = useMemo(
    () => interleaveFeed(posts, suggestions.events, suggestions.dads),
    [posts, suggestions.events, suggestions.dads],
  )

  const setScope = (value: 'all' | 'following') =>
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value === 'following') next.set('feed', 'following')
      else next.delete('feed')
      return next
    })

  // The page's AppBar already names this section, so there is no visible heading.
  return (
    <section aria-label="Feed" className="space-y-4">
      {SHOW_FEED_SCOPE_FILTER && (
        <div className="w-full sm:max-w-xs">
          <Segmented
            ariaLabel="Filter the feed"
            options={FEED_SCOPES}
            value={following ? 'following' : 'all'}
            onChange={setScope}
          />
        </div>
      )}

      <QueryState
        query={{
          isPending: query.isPending,
          isError: query.isError,
          error: query.error,
          data: posts,
          refetch: query.refetch,
          isRefetching: query.isRefetching,
        }}
        noun="posts"
        skeleton={<ListSkeleton count={4} item={<FeedCardSkeleton />} />}
        empty={
          <EmptyState
            icon={Newspaper}
            title={following ? 'Nothing from your communities yet' : 'No posts yet'}
            description={
              following
                ? 'Posts from communities you have joined will show up here.'
                : 'Be the first to start a conversation in a community.'
            }
            action={
              following ? { label: 'Show all posts', onClick: () => setScope('all') } : undefined
            }
          />
        }
      >
        {/*
          QueryState still owns the pending, error and empty states off `posts`;
          the rendered rows come from `rows`, which is `posts` with suggestions
          woven in. Hence the ignored argument — suggestions must not affect
          whether the feed counts as empty.
        */}
        {() => (
          <ul role="list" className="space-y-4">
            {rows.map((row) => (
              <li key={row.key}>
                {row.kind === 'post' ? (
                  <ConversationCard
                    conversation={row.post}
                    communityName={row.post.community_name}
                  />
                ) : row.kind === 'event' ? (
                  <EventSuggestion event={row.event} />
                ) : (
                  <DadSuggestion dad={row.dad} />
                )}
              </li>
            ))}
          </ul>
        )}
      </QueryState>

      <InfiniteSentinel
        hasNextPage={query.hasNextPage}
        isFetchingNextPage={query.isFetchingNextPage}
        fetchNextPage={query.fetchNextPage}
        noun="posts"
      />
    </section>
  )
}
