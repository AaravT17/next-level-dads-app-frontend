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
      className="overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-primary"
      onClick={() => navigate(communityDetail(community.id))}
    >
      <CardContent className="p-6 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-heading font-semibold text-foreground leading-snug">
            {community.name}
          </h3>
          {community.role && (
            <Badge variant="soft" className="shrink-0 text-xs mt-0.5">
              {community.role}
            </Badge>
          )}
        </div>

        {community.description && (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
            {community.description}
          </p>
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1 border-t border-border">
          <Users className="w-4 h-4" />
          <span>{community.member_count} members</span>
        </div>
      </CardContent>
    </Card>
  )
}
