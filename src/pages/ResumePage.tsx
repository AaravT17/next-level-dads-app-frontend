import { MessageCircle } from 'lucide-react'
import { AppBar } from '@/components/layout/AppBar'
import { PageContainer } from '@/components/layout/PageContainer'
import { QueryState } from '@/components/feedback/QueryState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ListSkeleton } from '@/components/feedback/skeletons/ListSkeleton'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ConversationCard } from '@/features/communities/components/ConversationCard'
import { useResume } from '@/features/feed/hooks/useResume'
import { ROUTES } from '@/lib/routes'

/**
 * "Get back into it" as a feed of its own.
 *
 * The Home rail is a shelf of the few most recent threads; this is the same
 * set laid out as a feed, which is what the rail's arrow promises. It shares
 * useResume with the rail, so arriving here from Home renders off the warm
 * cache rather than re-fetching what is already on screen.
 *
 * Unlike the rail, this page does show its empty and error states: you asked
 * to be here, so silence would read as breakage rather than as tact.
 */

function ResumeSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </CardContent>
    </Card>
  )
}

const ResumePage = () => {
  const query = useResume()

  return (
    <>
      <AppBar
        title="Get back into it"
        leading="back"
        backTo={ROUTES.HOME}
        width="wide"
      />

      <PageContainer width="wide" className="animate-fade-in">
        <QueryState
          query={{
            isPending: query.isPending,
            isError: query.isError,
            error: query.error,
            data: query.data ?? [],
            refetch: query.refetch,
            isRefetching: query.isRefetching,
          }}
          noun="posts"
          skeleton={<ListSkeleton count={4} item={<ResumeSkeleton />} />}
          empty={
            <EmptyState
              icon={MessageCircle}
              title="Nothing to get back into yet"
              description="Threads you post in, reply to, or heart will show up here."
            />
          }
        >
          {(items) => (
            <ul role="list" className="space-y-4">
              {items.map((item) => (
                <li key={item.id}>
                  <ConversationCard conversation={item} communityName={item.community_name} />
                </li>
              ))}
            </ul>
          )}
        </QueryState>
      </PageContainer>
    </>
  )
}

export default ResumePage
