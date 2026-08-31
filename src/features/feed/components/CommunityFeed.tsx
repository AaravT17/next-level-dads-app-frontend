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

/**
 * Posts from across every community.
 *
 * "Following" means communities you have joined — the app has no separate
 * follow relationship, and membership is what /api/users/me/communities
 * already exposes.
 *
 * The scope lives in the URL as ?feed=, distinct from the communities list's
 * ?scope=. The two lived on one page as sibling tabs before the feed became
 * Home; keeping the names apart means old links still resolve unambiguously.
 */

const FEED_SCOPES = [
  { value: 'all' as const, label: 'All' },
  { value: 'following' as const, label: 'Following' },
]

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
  const posts = query.data?.pages.flat() ?? []

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
      <div className="w-full sm:max-w-xs">
        <Segmented
          ariaLabel="Filter the feed"
          options={FEED_SCOPES}
          value={following ? 'following' : 'all'}
          onChange={setScope}
        />
      </div>

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
        {(items) => (
          <ul role="list" className="space-y-4">
            {items.map((post) => (
              <li key={post.id}>
                <ConversationCard conversation={post} communityName={post.community_name} />
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
