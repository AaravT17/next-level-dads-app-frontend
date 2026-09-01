import { Link } from 'react-router-dom'
import { ArrowRight, Users } from 'lucide-react'
import { communityDetail } from '@/lib/routes'
import type { SharedCommunity } from '@/types/chats'

export type SharedCommunityCardProps = {
  community: SharedCommunity
}

/**
 * The community attached to an invite message, rendered inside the bubble.
 *
 * The card only navigates. Joining stays on the community page, where the
 * recipient can read the description and see who is in it first — an invite is
 * a pointer, not a membership action taken on their behalf.
 */
export function SharedCommunityCard({ community }: SharedCommunityCardProps) {
  return (
    <Link
      to={communityDetail(community.id)}
      className="mt-2 block rounded-lg border border-border bg-background/80 p-3 transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <p className="font-heading font-semibold text-foreground leading-snug">
        {community.name}
      </p>
      {community.description && (
        <p className="mt-0.5 text-caption text-muted-foreground line-clamp-2">
          {community.description}
        </p>
      )}
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-caption text-muted-foreground">
          <Users aria-hidden className="w-3.5 h-3.5" />
          {community.member_count} {community.member_count === 1 ? 'member' : 'members'}
        </span>
        <span className="flex items-center gap-1 text-caption font-medium text-primary">
          View
          <ArrowRight aria-hidden className="w-3.5 h-3.5" />
        </span>
      </div>
    </Link>
  )
}
