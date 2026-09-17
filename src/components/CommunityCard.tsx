import { Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge } from './ui/badge'
import { Card, CardContent } from './ui/card'
import { CommunityImage } from './CommunityImage'
import { communityDetail } from '@/lib/routes'
import type { Community } from '@/types/communities'

/**
 * A community in a list.
 *
 * Purely presentational: joining and leaving happen inside the community
 * itself, so the card no longer owns those mutations or the cache patching
 * that went with them. Tapping it opens the community.
 */
const CommunityCard = ({ id, name, description, image_url, member_count, role }: Community) => {
  const navigate = useNavigate()

  return (
    <Card
      className="overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer h-[142px]"
      onClick={() => navigate(communityDetail(id))}
    >
      <CardContent className="p-4 flex gap-4">
        <CommunityImage src={image_url} size={80} />

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-subhead font-heading font-semibold text-foreground">{name}</h3>
            {role && (
              <Badge variant="soft" className="shrink-0">
                {role}
              </Badge>
            )}
          </div>

          {description && (
            <p className="text-body text-muted-foreground leading-relaxed line-clamp-2">
              {description}
            </p>
          )}

          <div className="flex items-center gap-2 text-caption text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{member_count} members</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default CommunityCard
