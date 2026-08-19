import { Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient, InfiniteData } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Card, CardContent } from './ui/card'
import { toastError } from '@/lib/toast'
import { communityDetail } from '@/lib/routes'
import axiosPrivate from '@/api/axiosPrivate'
import type { Community } from '@/types/communities'

const CommunityCard = ({
  id,
  name,
  description,
  member_count,
  is_member,
  role,
}: Community) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const handleCardClick = () => {
    navigate(communityDetail(id))
  }

  /**
   * Patch membership in place rather than dropping the card from the list.
   *
   * The old version removed the item — from the discover cache on join, from
   * the groups cache on leave — because those were two separate lists. Now
   * that both scopes share one cache namespace, removal would make a card
   * disappear out from under the person who just clicked it. Flipping the
   * button is also simply what people expect.
   *
   * The 'joined' scope still drops it, since an item you just left genuinely
   * no longer belongs to that list.
   */
  const updateMembershipInCache = (isMember: boolean) => {
    queryClient.setQueriesData<InfiniteData<Community[]>>(
      { queryKey: ['communities'] },
      (oldData) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          pages: oldData.pages.map((page) =>
            page.map((community) =>
              community.id === id
                ? {
                    ...community,
                    is_member: isMember,
                    member_count: Math.max(
                      0,
                      community.member_count + (isMember ? 1 : -1),
                    ),
                  }
                : community,
            ),
          ),
        }
      },
    )

    // The joined list is now stale for this item either way.
    queryClient.invalidateQueries({ queryKey: ['communities', 'joined'] })

    // Detail caches refetch fresh on navigation.
    queryClient.removeQueries({ queryKey: ['community', id] })
    queryClient.removeQueries({ queryKey: ['community', id, 'members'] })
  }

  // POST /api/communities/{id}/members - Join community
  const joinCommunity = useMutation({
    mutationFn: () => axiosPrivate.post(`/api/communities/${id}/members`),
    onSuccess: () => {
      updateMembershipInCache(true)
    },
    onError: (err: AxiosError) => {
      toastError('Failed to join community. Please try again.')
    },
  })

  // DELETE /api/communities/{id}/members - Leave community
  const leaveCommunity = useMutation({
    mutationFn: () => axiosPrivate.delete(`/api/communities/${id}/members`),
    onSuccess: () => {
      updateMembershipInCache(false)
    },
    onError: (err: AxiosError) => {
      toastError('Failed to leave community. Please try again.')
    },
  })

  const handleJoin = () => {
    joinCommunity.mutate()
  }

  const handleLeave = () => {
    leaveCommunity.mutate()
  }

  const handleManage = () => {
    // TODO: navigate to community management
  }

  const renderButtons = () => {
    if (is_member) {
      if (role === 'admin') {
        return (
          <div className="flex gap-2">
            <Button
              className="flex-1 rounded-full"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                handleManage()
              }}
            >
              Manage
            </Button>
            <Button
              className="flex-1 rounded-full"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                handleLeave()
              }}
            >
              Leave
            </Button>
          </div>
        )
      }

      // role === 'member'
      return (
        <Button
          className="w-full rounded-full"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation()
            handleLeave()
          }}
        >
          Leave Community
        </Button>
      )
    }

    // not a member
    return (
      <Button
        className="w-full rounded-full"
        variant="outline"
        onClick={(e) => {
          e.stopPropagation()
          handleJoin()
        }}
      >
        Join Community
      </Button>
    )
  }

  return (
    <Card
      className="overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleCardClick}
    >
      <CardContent className="p-6 space-y-4">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-heading font-semibold text-foreground mb-2">
              {name}
            </h3>
            {role && (
              <Badge variant="soft" className="shrink-0">
                {role}
              </Badge>
            )}
          </div>
          {description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}
        </div>

        <div className="flex items-center text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{member_count} members</span>
          </div>
        </div>

        {renderButtons()}
      </CardContent>
    </Card>
  )
}

export default CommunityCard
