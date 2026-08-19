import { Users } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useMutation, useQueryClient, InfiniteData } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Card, CardContent } from './ui/card'
import { toastError } from '@/lib/toast'
import { communityDetail } from '@/lib/routes'
import axiosPrivate from '@/api/axiosPrivate'
import type { Community } from '@/types/communities'

type ListContext = 'discover' | 'groups'

const CommunityCard = ({
  id,
  name,
  description,
  member_count,
  is_member,
  role,
}: Community) => {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()

  // Determine which list context we're in based on route
  const getListContext = (): ListContext => {
    const { pathname } = location
    if (pathname.startsWith('/groups')) return 'groups'
    return 'discover'
  }

  const listContext = getListContext()

  const handleCardClick = () => {
    navigate(communityDetail(id))
  }

  // Update membership status in current list's cache only (from card)
  const updateMembershipInCache = (isMember: boolean) => {
    if (listContext === 'discover') {
      // Remove from discover cache (user just joined)
      queryClient.setQueriesData<InfiniteData<Community[]>>(
        { queryKey: ['discover', 'communities'] },
        (oldData) => {
          if (!oldData) return oldData
          return {
            ...oldData,
            pages: oldData.pages.map((page) =>
              page.filter((community) => community.id !== id),
            ),
          }
        },
      )
    } else {
      // Remove from groups cache (user just left)
      queryClient.setQueriesData<InfiniteData<Community[]>>(
        { queryKey: ['groups', 'communities'] },
        (oldData) => {
          if (!oldData) return oldData
          return {
            ...oldData,
            pages: oldData.pages.map((page) =>
              page.filter((community) => community.id !== id),
            ),
          }
        },
      )
    }

    // Remove detail page caches so they fetch fresh on navigation
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
