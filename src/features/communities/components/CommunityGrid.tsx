import type { Community } from '@/types/communities'
import { CommunityCard } from './CommunityCard'

interface CommunityGridProps {
  communities: Community[]
}

export function CommunityGrid({ communities }: CommunityGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4">
      {communities.map((community) => (
        <CommunityCard key={community.id} community={community} />
      ))}
    </div>
  )
}
