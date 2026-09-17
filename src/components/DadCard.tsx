import { useState } from 'react'
import { MapPin, MessageCircle, UserMinus, UserPlus, Check, X, Clock, Baby } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  useMutation,
  useQueryClient,
  InfiniteData,
} from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { Button } from './ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'
import { cn } from '@/lib/utils'
import { Card, CardContent } from './ui/card'
import { ConnectionNote } from '@/features/connections/components/ConnectionNote'
import { ConnectRequestDialog } from '@/features/connections/components/ConnectRequestDialog'
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
  /** Message attached to a pending request; only requests carry one. */
  note?: string | null
  /** Clamp a long note — the Dads panel sits above the browse grid. */
  clampNote?: boolean
  /**
   * Which list this card belongs to, when the URL does not say.
   *
   * The Dads screen shows incoming requests above the browse grid, so the
   * pathname alone can no longer tell the two apart on that page.
   */
  listContext?: ListContext
}

const DadCard = ({
  id,
  name,
  age,
  city,
  province,
  about,
  kid_count,
  avatar_url,
  connection_status,
  note,
  clampNote = false,
  listContext: listContextProp,
}: DadCardProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false)

  /**
   * Which list this card sits in.
   *
   * Unlike CommunityCard, this branching is real: a declined request should
   * leave the requests list, while a browse result should stay put with its
   * button changed. The three lists mean different things.
   */
  const getListContext = (): ListContext => {
    if (listContextProp) return listContextProp
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
    mutationFn: (note: string | null) =>
      axiosPrivate.post<{ connection_status: ConnectionStatus }>(
        `/api/connections/${id}`,
        // Omit the body entirely when there is no note.
        note ? { note } : undefined,
      ),
    onSuccess: (res) => {
      setIsNoteDialogOpen(false)
      updateStatusInCache(res.data.connection_status)
    },
    onError: (err: AxiosError<{ connection_status: ConnectionStatus; detail?: string }>) => {
      if (
        err.response?.status === 409 &&
        err.response.data?.connection_status
      ) {
        setIsNoteDialogOpen(false)
        updateStatusInCache(err.response.data.connection_status)
      } else if (err.response?.status === 429) {
        toastError('Connection request limit reached. Please try again later.')
      } else if (err.response?.status === 400 || err.response?.status === 403) {
        // The note was rejected. Leave the dialog open so it can be edited
        // rather than retyped.
        toastError(
          typeof err.response.data?.detail === 'string'
            ? err.response.data.detail
            : 'Your note could not be sent. Please revise it and try again.',
        )
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
    setIsNoteDialogOpen(true)
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

  /**
   * Round icon actions, pinned to the card's top-right.
   *
   * These stay circular against the otherwise squared-off system on purpose:
   * a circle here is a *shape*, not a rounded rectangle pretending to be one,
   * which is the same reason avatars and count badges kept their radius.
   *
   * Icon-only, so every one carries a label and a tooltip — the meaning of
   * "unconnect" or "ignore" is not obvious from a glyph alone.
   */
  const IconAction = ({
    label,
    icon: Icon,
    onClick,
    variant = 'default',
    disabled,
  }: {
    label: string
    icon: LucideIcon
    onClick: () => void
    variant?: 'default' | 'outline' | 'muted'
    disabled?: boolean
  }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="icon"
          variant={variant === 'outline' ? 'outline' : 'default'}
          aria-label={label}
          disabled={disabled}
          className={cn(
            // 44px — the standard touch-target size, and enough presence for
            // Connect to read as the primary action on the browse screen.
            'h-11 w-11 rounded-full shrink-0',
            variant === 'muted' && 'bg-muted text-muted-foreground hover:bg-muted',
          )}
          onClick={(e) => {
            e.stopPropagation()
            onClick()
          }}
        >
          <Icon className="w-5 h-5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )

  const renderButtons = () => {
    if (connection_status === 'blocked') return null

    if (connection_status === 'connected') {
      return (
        <div className="flex shrink-0 items-center gap-2">
          <IconAction label="Message" icon={MessageCircle} onClick={handleChat} />
          <IconAction
            label="Remove connection"
            icon={UserMinus}
            variant="outline"
            disabled={isLoading}
            onClick={handleUnconnect}
          />
        </div>
      )
    }

    if (connection_status === 'pending_incoming') {
      return (
        <div className="flex shrink-0 items-center gap-2">
          <IconAction
            label="Accept request"
            icon={Check}
            disabled={isLoading}
            onClick={handleAccept}
          />
          <IconAction
            label="Ignore request"
            icon={X}
            variant="outline"
            disabled={isLoading}
            onClick={handleIgnore}
          />
        </div>
      )
    }

    if (connection_status === 'pending_outgoing') {
      return (
        <div className="flex shrink-0 items-center gap-2">
          <IconAction
            label="Cancel request"
            icon={Clock}
            variant="muted"
            disabled={isLoading}
            onClick={handleCancelRequest}
          />
        </div>
      )
    }

    // connection_status === null
    return (
      <div className="flex shrink-0 items-center gap-2">
        <IconAction
          label={`Connect with ${name}`}
          icon={UserPlus}
          disabled={isLoading}
          onClick={handleConnect}
        />
      </div>
    )
  }

  return (
    <>
    <Card
      className={cn('overflow-hidden shadow-md cursor-pointer', listContext === 'dads' && 'h-[174px]')}
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
            <h3 className="text-subhead font-heading font-semibold text-foreground truncate">
              {name}, {age ?? '—'}
            </h3>
            <div className="flex items-center gap-1 text-caption text-muted-foreground mt-0.5">
              <MapPin className="w-3 h-3" />
              <span>
                {city}, {province}
              </span>
            </div>
            {kid_count != null && kid_count > 0 && (
              <div className="flex items-center gap-1 text-caption text-muted-foreground mt-0.5">
                <Baby className="w-3 h-3" />
                <span>
                  {kid_count} {kid_count === 1 ? 'kid' : 'kids'}
                </span>
              </div>
            )}
          </div>

          {renderButtons()}
        </div>

        <p className="text-foreground text-body leading-relaxed line-clamp-2">{about}</p>

        {note && <ConnectionNote note={note} clamp={clampNote} />}
      </CardContent>
    </Card>

    {/*
      A sibling of Card, never a child. React synthetic events bubble through
      the React tree rather than the DOM tree, so a dialog rendered inside
      Card still fires Card's click-to-navigate handler even though Radix
      portals it to <body> — closing the dialog would open the profile.
    */}
    <ConnectRequestDialog
      open={isNoteDialogOpen}
      onOpenChange={setIsNoteDialogOpen}
      recipientName={name}
      isSending={sendConnectionRequest.isPending}
      onSend={(note) => sendConnectionRequest.mutate(note)}
    />
    </>
  )
}

export default DadCard
