import { MapPin } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  useMutation,
  useQueryClient,
  InfiniteData,
} from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Card, CardContent } from './ui/card'
import { getStageDisplayLabel } from '@/utils/users'
import { initials } from '@/utils/format'
import { profileDetail, chat } from '@/lib/routes'
import { toastError } from '@/lib/toast'
import axiosPrivate from '@/api/axiosPrivate'
import { TIMEOUT_LENGTH_MS } from '@/config/constants'
import type { Profile, ConnectionStatus } from '@/types/users'
import type { Chat } from '@/types/chats'

type ListContext = 'dads' | 'connections' | 'requests'

interface DadCardProps extends Profile {
  connection_id?: string
  connection_updated_at?: string
}

const DadCard = ({
  id,
  name,
  age,
  city,
  province,
  children,
  about,
  interests,
  avatar_url,
  connection_status,
}: DadCardProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()

  /**
   * Which list this card sits in.
   *
   * Unlike CommunityCard, this branching is real: a declined request should
   * leave the requests list, while a browse result should stay put with its
   * button changed. The three lists mean different things.
   */
  const getListContext = (): ListContext => {
    const { pathname } = location
    if (pathname.startsWith('/you/connections')) return 'connections'
    if (pathname.startsWith('/you/requests')) return 'requests'
    return 'dads'
  }

  const listContext = getListContext()

  const handleCardClick = () => {
    navigate(profileDetail(id))
  }

  // Update connection status in current list's cache only (from card)
  const updateStatusInCache = (newStatus: ConnectionStatus) => {
    if (listContext === 'dads') {
      // Keep the card in the browse list; only its button changes.
      queryClient.setQueriesData<InfiniteData<Profile[]>>(
        { queryKey: ['dads'] },
        (oldData) => {
          if (!oldData) return oldData
          return {
            ...oldData,
            pages: oldData.pages.map((page) =>
              newStatus === null || newStatus === 'pending_outgoing'
                ? page.map((profile) =>
                    profile.id === id
                      ? { ...profile, connection_status: newStatus }
                      : profile,
                  )
                : page.filter((profile) => profile.id !== id),
            ),
          }
        },
      )
    } else if (listContext === 'connections') {
      // Update in connections list - remove if not connected
      queryClient.setQueriesData<InfiniteData<Profile[]>>(
        { queryKey: ['connections', 'connected'] },
        (oldData) => {
          if (!oldData) return oldData
          return {
            ...oldData,
            pages: oldData.pages.map((page) =>
              newStatus === 'connected'
                ? page.map((profile) =>
                    profile.id === id
                      ? { ...profile, connection_status: newStatus }
                      : profile,
                  )
                : page.filter((profile) => profile.id !== id),
            ),
          }
        },
      )
    } else if (listContext === 'requests') {
      // Update in requests list - remove if not pending_incoming
      queryClient.setQueriesData<InfiniteData<Profile[]>>(
        { queryKey: ['connections', 'requests'] },
        (oldData) => {
          if (!oldData) return oldData
          return {
            ...oldData,
            pages: oldData.pages.map((page) =>
              newStatus === 'pending_incoming'
                ? page.map((profile) =>
                    profile.id === id
                      ? { ...profile, connection_status: newStatus }
                      : profile,
                  )
                : page.filter((profile) => profile.id !== id),
            ),
          }
        },
      )
    }

    // Remove detail page cache so it fetches fresh on navigation
    queryClient.removeQueries({ queryKey: ['profile', id] })

    // The pending-requests badge in the nav reads this.
    queryClient.invalidateQueries({ queryKey: ['user', 'stats'] })
  }

  // POST /api/connections/{id} - Send connection request
  const sendConnectionRequest = useMutation({
    mutationFn: () =>
      axiosPrivate.post<{ connection_status: ConnectionStatus }>(
        `/api/connections/${id}`,
      ),
    onSuccess: (res) => {
      updateStatusInCache(res.data.connection_status)
    },
    onError: (err: AxiosError<{ connection_status: ConnectionStatus }>) => {
      if (
        err.response?.status === 409 &&
        err.response.data?.connection_status
      ) {
        updateStatusInCache(err.response.data.connection_status)
      } else if (err.response?.status === 429) {
        toastError('Connection request limit reached. Please try again later.')
      } else {
        toastError('Failed to send connection request. Please try again.')
      }
    },
  })

  // PATCH /api/connections/{id} - Accept connection request
  const acceptConnectionRequest = useMutation({
    mutationFn: () => axiosPrivate.patch(`/api/connections/${id}`),
    onSuccess: () => {
      updateStatusInCache('connected')
    },
    onError: (err: AxiosError) => {
      if (err.response?.status === 404) {
        updateStatusInCache(null)
      } else {
        toastError('Failed to accept connection. Please try again.')
      }
    },
  })

  // DELETE /api/connections/{id} - Remove/cancel/decline connection
  const removeConnection = useMutation({
    mutationFn: () => axiosPrivate.delete(`/api/connections/${id}`),
    onSuccess: () => {
      updateStatusInCache(null)

      // Backend deletes the DM chat on disconnect — clean up chat caches
      const chatsData = queryClient.getQueryData<InfiniteData<Chat[]>>(['chats'])
      if (chatsData) {
        let dmChatId: string | null = null
        const updatedPages = chatsData.pages.map((page) => {
          const filtered = page.filter((c) => {
            if (c.type === 'dm' && c.other_user?.id === id) {
              dmChatId = c.id
              return false
            }
            return true
          })
          return filtered
        })
        if (dmChatId) {
          queryClient.setQueryData<InfiniteData<Chat[]>>(['chats'], {
            ...chatsData,
            pages: updatedPages,
          })
          queryClient.removeQueries({ queryKey: ['chats', dmChatId] })
          queryClient.removeQueries({ queryKey: ['messages', dmChatId] })
        }
      }
    },
    onError: () => {
      toastError('Failed to update connection. Please try again.')
    },
  })

  const handleConnect = () => {
    sendConnectionRequest.mutate()
  }

  const handleCancelRequest = () => {
    removeConnection.mutate()
  }

  const handleAccept = () => {
    acceptConnectionRequest.mutate()
  }

  const handleIgnore = () => {
    removeConnection.mutate()
  }

  const createChat = useMutation({
    mutationFn: async () => {
      const res = await axiosPrivate.post<{ id: string }>(
        '/api/chats/',
        { participant_ids: [id] },
        { timeout: TIMEOUT_LENGTH_MS },
      )
      return res.data
    },
    onSuccess: (data) => {
      navigate(chat(data.id))
    },
    onError: (err: AxiosError) => {
      if (err.response?.status === 429) {
        toastError('Too many chats created. Please slow down.')
      } else {
        toastError('Failed to open chat. Please try again.')
      }
    },
  })

  const handleChat = () => {
    createChat.mutate()
  }

  const handleUnconnect = () => {
    removeConnection.mutate()
  }

  const isLoading =
    sendConnectionRequest.isPending ||
    acceptConnectionRequest.isPending ||
    removeConnection.isPending ||
    createChat.isPending

  const renderButtons = () => {
    if (connection_status === 'blocked') return null

    if (connection_status === 'connected') {
      return (
        <div className="flex gap-2">
          <Button
            className="flex-1 rounded-full font-semibold"
            onClick={(e) => {
              e.stopPropagation()
              handleChat()
            }}
          >
            Chat
          </Button>
          <Button
            className="flex-1 rounded-full font-semibold"
            variant="outline"
            disabled={isLoading}
            onClick={(e) => {
              e.stopPropagation()
              handleUnconnect()
            }}
          >
            Unconnect
          </Button>
        </div>
      )
    }

    if (connection_status === 'pending_incoming') {
      return (
        <div className="flex gap-2">
          <Button
            className="flex-1 rounded-full font-semibold"
            disabled={isLoading}
            onClick={(e) => {
              e.stopPropagation()
              handleAccept()
            }}
          >
            Accept
          </Button>
          <Button
            className="flex-1 rounded-full font-semibold"
            variant="outline"
            disabled={isLoading}
            onClick={(e) => {
              e.stopPropagation()
              handleIgnore()
            }}
          >
            Ignore
          </Button>
        </div>
      )
    }

    if (connection_status === 'pending_outgoing') {
      return (
        <Button
          className="w-full rounded-full font-semibold bg-muted text-muted-foreground hover:bg-muted"
          disabled={isLoading}
          onClick={(e) => {
            e.stopPropagation()
            handleCancelRequest()
          }}
        >
          Requested
        </Button>
      )
    }

    // connection_status === null
    return (
      <Button
        className="w-full rounded-full font-semibold"
        disabled={isLoading}
        onClick={(e) => {
          e.stopPropagation()
          handleConnect()
        }}
      >
        Connect
      </Button>
    )
  }

  return (
    <Card
      className="overflow-hidden shadow-md cursor-pointer"
      onClick={handleCardClick}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          {avatar_url ? (
            <img
              src={avatar_url}
              alt={name}
              className="w-20 h-20 rounded-lg object-cover flex-shrink-0 aspect-square"
            />
          ) : (
            <div className="w-20 h-20 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-semibold text-lg flex-shrink-0 aspect-square">
              {initials(name)}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h3 className="text-subhead font-heading font-semibold text-foreground">
              {name}, {age ?? '—'}
            </h3>
            <div className="flex items-center gap-1 text-caption text-muted-foreground mt-0.5">
              <MapPin className="w-3 h-3" />
              <span>
                {city}, {province}
              </span>
            </div>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {children.map((child) => (
                <Badge
                  key={child}
                  variant="soft"
                  className="rounded-full text-caption"
                >
                  {getStageDisplayLabel(child)}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <p className="text-foreground text-body leading-relaxed">{about}</p>

        <div className="flex flex-wrap gap-1.5">
          {interests.map((interest) => (
            <Badge
              key={interest}
              variant="interest"
              className="rounded-full text-caption"
            >
              {interest}
            </Badge>
          ))}
        </div>

        {renderButtons()}
      </CardContent>
    </Card>
  )
}

export default DadCard
