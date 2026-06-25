import { useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient, InfiniteData } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import BottomNav from '@/components/BottomNav'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { MapPin, Calendar, ArrowLeft, Loader2 } from 'lucide-react'
import logo from '@/assets/logo.png'
import { getStageDisplayLabel } from '@/utils/users'
import { chat } from '@/lib/routes'
import axiosPrivate from '@/api/axiosPrivate'
import { useToast } from '@/hooks/use-toast'
import { TIMEOUT_LENGTH_MS } from '@/config/constants'
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
  const location = useLocation()
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Derive context from route path
  const isFromDiscover = location.pathname.startsWith('/discover/dads')

  // Update profile in all list caches
  const updateProfileInLists = (profile: Profile) => {
    const { connection_status } = profile

    // Update in discover profiles - keep only if null or pending_outgoing
    queryClient.setQueriesData<InfiniteData<Profile[]>>(
      { queryKey: ['discover', 'profiles'] },
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
  }

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
  }, [profile])

  const initials = profile
    ? profile.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : ''

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

    // Update in discover profiles - keep only if null or pending_outgoing
    queryClient.setQueriesData<InfiniteData<Profile[]>>(
      { queryKey: ['discover', 'profiles'] },
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
    mutationFn: () =>
      axiosPrivate.post<{ connection_status: ConnectionStatus }>(
        `/api/connections/${id}`,
      ),
    onSuccess: (res) => {
      updateStatusInCache(res.data.connection_status)
    },
    onError: (err: AxiosError<{ connection_status: ConnectionStatus }>) => {
      if (err.response?.status === 409 && err.response.data?.connection_status) {
        updateStatusInCache(err.response.data.connection_status)
      } else {
        toast({
          title: 'Error',
          description: 'Failed to send connection request. Please try again.',
          variant: 'destructive',
        })
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
        toast({
          title: 'Error',
          description: 'Failed to accept connection. Please try again.',
          variant: 'destructive',
        })
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
      toast({
        title: 'Error',
        description: 'Failed to update connection. Please try again.',
        variant: 'destructive',
      })
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
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to open chat. Please try again.',
        variant: 'destructive',
      })
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
            className="flex-1 rounded-full font-semibold"
            style={{ backgroundColor: '#D8A24A' }}
            onClick={handleChat}
          >
            Chat
          </Button>
          <Button
            className="flex-1 rounded-full font-semibold"
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
            className="flex-1 rounded-full font-semibold"
            style={{ backgroundColor: '#D8A24A' }}
            disabled={isMutating}
            onClick={handleAccept}
          >
            Accept
          </Button>
          <Button
            className="flex-1 rounded-full font-semibold"
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
          className="w-full rounded-full font-semibold"
          style={{ backgroundColor: '#9ca3af' }}
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
        className="w-full rounded-full font-semibold"
        style={{ backgroundColor: '#D8A24A' }}
        disabled={isMutating}
        onClick={handleConnect}
      >
        Connect
      </Button>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="bg-card border-b border-border px-6 py-5 relative">
          <img
            src={logo}
            alt="Next Level Dads"
            className="h-10 absolute top-4 left-3"
          />
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="rounded-full"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-2xl font-heading font-semibold text-foreground">
                Profile
              </h1>
            </div>
          </div>
        </div>
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
        <BottomNav />
      </div>
    )
  }

  if (isError || !profile) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="bg-card border-b border-border px-6 py-5 relative">
          <img
            src={logo}
            alt="Next Level Dads"
            className="h-10 absolute top-4 left-3"
          />
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="rounded-full"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-2xl font-heading font-semibold text-foreground">
                Profile
              </h1>
            </div>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Failed to load profile. Please try again.
          </p>
        </div>
        <BottomNav />
      </div>
    )
  }

  // Discover context: Card-based layout with Connect button (DadDetail style)
  if (isFromDiscover) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="bg-card border-b border-border px-6 py-5 relative">
          <img
            src={logo}
            alt="Next Level Dads"
            className="h-10 absolute top-4 left-3"
          />

          <div className="flex items-center justify-center h-full">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="rounded-full"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-2xl font-heading font-semibold text-foreground">
                Profile
              </h1>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto px-6 py-6">
          <Card className="overflow-hidden shadow-md">
            <CardContent className="p-6 space-y-4">
              {/* Avatar and basic info */}
              <div className="flex items-start gap-4">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.name}
                    className="w-24 h-24 rounded-lg object-cover flex-shrink-0 aspect-square"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-semibold text-xl flex-shrink-0 aspect-square">
                    {initials}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-heading font-semibold text-foreground">
                    {profile.name}, {profile.age ?? '—'}
                  </h2>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <MapPin className="w-4 h-4" />
                    <span>
                      {profile.city}, {profile.province}
                    </span>
                  </div>
                  {profile.children.length > 0 && (
                    <Badge
                      variant="soft"
                      className="rounded-full mt-2"
                    >
                      {getStageDisplayLabel(profile.children[0])}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">About</h3>
                <p className="text-foreground text-sm leading-relaxed">
                  {profile.about}
                </p>
              </div>

              {/* Interests */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">
                  Interests
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest) => (
                    <Badge
                      key={interest}
                      variant="outline"
                      className="rounded-full"
                      style={{ borderColor: '#D8A24A', color: '#D8A24A' }}
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-4">{renderButtons()}</div>
            </CardContent>
          </Card>
        </div>

        <BottomNav />
      </div>
    )
  }

  // Default context: Full-width layout without Connect button (ProfileDetail style)
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-card border-b border-border px-6 py-5 relative">
        <img
          src={logo}
          alt="Next Level Dads"
          className="h-10 absolute top-4 left-3"
        />

        <div className="flex items-center justify-center h-full">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-heading font-semibold text-foreground">
              Profile
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-8 space-y-6 animate-fade-in">
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
                {initials}
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
          </div>
        </div>

        <div className="bg-card rounded-lg p-6 space-y-4 shadow-md">
          <div>
            <h3 className="font-semibold text-foreground mb-2">About Me</h3>
            <p className="text-muted-foreground leading-relaxed">
              {profile.about}
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-2">
              Children's Age
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile.children.map((child) => (
                <Badge
                  key={child}
                  variant="soft"
                  className="rounded-full"
                >
                  <Calendar className="w-3 h-3 mr-1" />
                  {getStageDisplayLabel(child)}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-3">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest) => (
                <Badge
                  key={interest}
                  variant="soft"
                  className="rounded-full"
                >
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="px-6">{renderButtons()}</div>
      </div>

      <BottomNav />
    </div>
  )
}

export default ProfileDetail
