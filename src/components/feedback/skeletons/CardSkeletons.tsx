import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { ListSkeleton } from './ListSkeleton'

/**
 * Each skeleton mirrors its real card's box model so content swapping in
 * does not shift the layout. Sizes here track DadCard, EventCard,
 * CommunityCard and the Chats row — update them together.
 */

export function DadCardSkeleton() {
  return (
    <Card className="shadow-md">
      <CardContent className="p-4 flex gap-4">
        <Skeleton className="w-20 h-20 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2 py-1">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function CommunityCardSkeleton() {
  return (
    <Card className="shadow-md">
      <CardContent className="p-4 space-y-2">
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </CardContent>
    </Card>
  )
}

export function EventCardSkeleton() {
  return (
    <Card className="shadow-md">
      <CardContent className="p-4 space-y-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-3 w-2/5" />
      </CardContent>
    </Card>
  )
}

export function ChatRowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3">
      <Skeleton className="w-14 h-14 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-3/5" />
      </div>
    </div>
  )
}

export const DadListSkeleton = () => <ListSkeleton count={4} item={<DadCardSkeleton />} />
export const CommunityListSkeleton = () => <ListSkeleton count={4} item={<CommunityCardSkeleton />} />
export const EventListSkeleton = () => <ListSkeleton count={4} item={<EventCardSkeleton />} />
export const ChatListSkeleton = () => <ListSkeleton count={6} item={<ChatRowSkeleton />} />
