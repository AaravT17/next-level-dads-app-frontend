import { Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { communityDetail } from '@/lib/routes'
import type { Community } from '@/types/communities'

interface CommunityCardProps {
  community: Community
}

export function CommunityCard({ community }: CommunityCardProps) {
  const navigate = useNavigate()

  return (
    <Card
      className="overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigate(communityDetail(community.id))}
    >
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-heading font-semibold text-foreground leading-snug">
            {community.name}
          </h3>
          {community.role && (
            <Badge variant="soft" className="shrink-0 text-xs">
              {community.role}
            </Badge>
          )}
        </div>

        {community.description && (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {community.description}
          </p>
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          <span>{community.member_count} members</span>
        </div>
      </CardContent>
    </Card>
  )
}
