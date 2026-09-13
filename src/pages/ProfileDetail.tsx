import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ReportUserButton } from '@/features/moderation/components/ReportUserButton'
import { ConnectRequestDialog } from '@/features/connections/components/ConnectRequestDialog'
import { useQuery, useMutation, useQueryClient, InfiniteData } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { AppBar } from '@/components/layout/AppBar'
import { PageContainer } from '@/components/layout/PageContainer'
import { CenteredSpinner } from '@/components/feedback/Spinner'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Button } from '@/components/ui/button'
import { Baby, MapPin } from 'lucide-react'
import { getStageDisplayLabel } from '@/utils/users'
import { initials } from '@/utils/format'
import { chat } from '@/lib/routes'
import axiosPrivate from '@/api/axiosPrivate'
import { toastError } from '@/lib/toast'
import { TIMEOUT_LENGTH_MS, INTEREST_DISPLAY_MAP, ICEBREAKER_PROMPTS } from '@/config/constants'
import type { Profile, ConnectionStatus } from '@/types/users'
import type { Chat } from '@/types/chats'

async function fetchProfile(id: string): Promise<Profile> {
  const res = await axiosPrivate.get<Profile>(`/api/users/${id}`, {
    timeout: TIMEOUT_LENGTH_MS,
  })
  return res.data
}

const ProfileDetail = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false)
  const queryClient = useQueryClient()

  // Update profile in all list caches.
  //
  // Memoised so the effect below can depend on it honestly. Both deps are
  // stable for the life of the route — the query client is a singleton and the
  // id comes from the path — so this does not add a render to the effect.
  const updateProfileInLists = useCallback((profile: Profile) => {
    const { connection_status } = profile

    // Browse list: keep the row, just refresh its status
    queryClient.setQueriesData<InfiniteData<Profile[]>>(
      { queryKey: ['dads'] },
      (oldData) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          pages: oldData.pages.map((page) =>
            connection_status === null || connection_status === 'pending_outgoing'
              ? page.map((p) => (p.id === id ? { ...p, ...profile } : p))
              : page.filter((p) => p.id !== id),
          ),
        }
      },
    )

    // Update in connections list - keep only if connected
    queryClient.setQueriesData<InfiniteData<Profile[]>>(
      { queryKey: ['connections', 'connected'] },
      (oldData) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          pages: oldData.pages.map((page) =>
            connection_status === 'connected'
              ? page.map((p) => (p.id === id ? { ...p, ...profile } : p))
              : page.filter((p) => p.id !== id),
          ),
        }
      },
    )

    // Update in requests list - keep only if pending_incoming
    queryClient.setQueriesData<InfiniteData<Profile[]>>(
      { queryKey: ['connections', 'requests'] },
      (oldData) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          pages: oldData.pages.map((page) =>
            connection_status === 'pending_incoming'
              ? page.map((p) => (p.id === id ? { ...p, ...profile } : p))
              : page.filter((p) => p.id !== id),
          ),
        }
      },
    )
  }, [queryClient, id])

  const {
    data: profile,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['profile', id],
    queryFn: () => fetchProfile(id!),
    enabled: !!id,
    staleTime: 0, // Always fresh fetch
  })

  // Update list caches when profile is fetched
  useEffect(() => {
    if (profile) {
      updateProfileInLists(profile)
    }
  }, [profile, updateProfileInLists])

  const handleBack = () => {
    navigate(-1)
  }

  // Update connection status in all relevant caches
  const updateStatusInCache = (newStatus: ConnectionStatus) => {
    // Update the profile query directly
    queryClient.setQueryData<Profile>(['profile', id], (oldData) => {
      if (!oldData) return oldData
      return { ...oldData, connection_status: newStatus }
    })

    // Browse list: keep the row, just refresh its status
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

    // Update in connections list - update status, remove if not connected
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

    // Update in requests list - update status, remove if not pending_incoming
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

  // POST /api/connections/{id} - Send connection request
  const sendConnectionRequest = useMutation({
    mutationFn: (note: string | null) =>
      axiosPrivate.post<{ connection_status: ConnectionStatus }>(
        `/api/connections/${id}`,
        // No body at all when there is no note, so the request stays identical
        // to the one-tap connect on the browse grid.
        note ? { note } : undefined,
      ),
    onSuccess: (res) => {
      setIsNoteDialogOpen(false)
      updateStatusInCache(res.data.connection_status)
    },
    onError: (err: AxiosError<{ connection_status: ConnectionStatus; detail?: string }>) => {
      if (err.response?.status === 409 && err.response.data?.connection_status) {
        setIsNoteDialogOpen(false)
        updateStatusInCache(err.response.data.connection_status)
      } else if (err.response?.status === 400 || err.response?.status === 403) {
        // The note was rejected (profanity, length, or an active ban). Keep the
        // dialog open so the text is still there to edit.
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
    onError: () => {
      toastError('Failed to open chat. Please try again.')
    },
  })

  const handleChat = () => {
    createChat.mutate()
  }

  const handleUnconnect = () => {
    removeConnection.mutate()
  }

  const isMutating =
    sendConnectionRequest.isPending ||
    acceptConnectionRequest.isPending ||
    removeConnection.isPending ||
    createChat.isPending

  const renderButtons = () => {
    if (!profile) return null

    const { connection_status } = profile

    if (connection_status === 'blocked') return null

    if (connection_status === 'connected') {
      return (
        <div className="flex gap-2">
          <Button
            className="flex-1 rounded-md font-semibold"
            onClick={handleChat}
          >
            Chat
          </Button>
          <Button
            className="flex-1 rounded-md font-semibold"
            variant="outline"
            disabled={isMutating}
            onClick={handleUnconnect}
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
            className="flex-1 rounded-md font-semibold"
            disabled={isMutating}
            onClick={handleAccept}
          >
            Accept
          </Button>
          <Button
            className="flex-1 rounded-md font-semibold"
            variant="outline"
            disabled={isMutating}
            onClick={handleIgnore}
          >
            Ignore
          </Button>
        </div>
      )
    }

    if (connection_status === 'pending_outgoing') {
      return (
        <Button
          className="w-full rounded-md font-semibold bg-muted text-muted-foreground hover:bg-muted"
          disabled={isMutating}
          onClick={handleCancelRequest}
        >
          Requested
        </Button>
      )
    }

    // connection_status === null
    return (
      <Button
        className="w-full rounded-md font-semibold"
        disabled={isMutating}
        onClick={handleConnect}
      >
        Connect
      </Button>
    )
  }

  if (isLoading) {
    return (
      <>
        <AppBar title="Profile" leading="back" onBack={handleBack} />
        <PageContainer>
          <CenteredSpinner label="Loading profile" />
        </PageContainer>
      </>
    )
  }

  if (isError || !profile) {
    return (
      <>
        <AppBar title="Profile" leading="back" onBack={handleBack} />
        <PageContainer>
          <ErrorState noun="this profile" />
        </PageContainer>
      </>
    )
  }

  // Discover context: Card-based layout with Connect button (DadDetail style)
  return (
    <>
      <AppBar title="Profile" leading="back" onBack={handleBack} />

      <PageContainer className="space-y-6 animate-fade-in">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-32 h-32 rounded-lg overflow-hidden border-4 border-primary/20">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-2xl">
                {initials(profile?.name)}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-heading font-semibold text-foreground">
              {profile.name}, {profile.age ?? '—'}
            </h2>
            <div className="flex items-center justify-center gap-1 text-muted-foreground mt-1">
              <MapPin className="w-4 h-4" />
              <span>
                {profile.city}, {profile.province}
              </span>
            </div>
            {profile.kid_count != null && profile.kid_count > 0 && (
              <div className="flex items-center justify-center gap-1 text-muted-foreground mt-1">
                <Baby className="w-4 h-4" />
                <span>Dad of {profile.kid_count}</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-foreground mb-2">About</h3>
            <p className="text-muted-foreground leading-relaxed">
              {profile.about}
            </p>
          </div>

          {profile.children_age_ranges.length > 0 && (
            <div>
              <h3 className="font-semibold text-foreground mb-2">Kids' stages</h3>
              <div className="flex flex-wrap gap-2">
                {profile.children_age_ranges.map((stage) => (
                  <span
                    key={stage}
                    className="rounded-md border border-border bg-card px-3.5 py-2.5 text-sm font-medium text-foreground"
                  >
                    {getStageDisplayLabel(stage)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {profile.interests.length > 0 && (
            <div>
              <h3 className="font-semibold text-foreground mb-3">Interests</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {profile.interests.map((interest) => {
                  const display = INTEREST_DISPLAY_MAP[interest.slug]
                  return (
                    <div
                      key={interest.id}
                      className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-border bg-card p-4 text-center"
                    >
                      <span className="text-2xl">{display?.emoji ?? '✨'}</span>
                      <span className="text-sm font-medium text-foreground">{display?.label ?? interest.slug}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {profile.icebreakers && profile.icebreakers.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Get to know me</h3>
            {profile.icebreakers.map((ib) => {
              const prompt = ICEBREAKER_PROMPTS.find((p) => p.slug === ib.prompt_slug)
              return (
                <div
                  key={ib.prompt_slug}
                  className="rounded-xl border-2 border-primary/30 bg-card px-6 py-5 shadow-lg"
                >
                  <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                    {prompt?.text ?? ib.prompt_slug}
                  </p>
                  <p className="mt-3 text-base leading-relaxed text-foreground whitespace-pre-line">
                    {ib.answer}
                  </p>
                </div>
              )
            })}
          </div>
        )}

        {/* Action buttons */}
        <div className="px-6">{renderButtons()}</div>

        {/* Report */}
        {profile && id && (
          <div className="px-6 flex justify-center">
            <ReportUserButton userId={id} userName={profile.name} />
          </div>
        )}

        {profile && (
          <ConnectRequestDialog
            open={isNoteDialogOpen}
            onOpenChange={setIsNoteDialogOpen}
            recipientName={profile.name}
            isSending={sendConnectionRequest.isPending}
            onSend={(note) => sendConnectionRequest.mutate(note)}
          />
        )}
      </PageContainer>
    </>
  )
}

export default ProfileDetail
