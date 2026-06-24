import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useInfiniteQuery, useMutation, useQueryClient, InfiniteData } from '@tanstack/react-query'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Search, Loader2, Shield, ShieldOff, UserMinus, UserPlus, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import axiosPrivate from '@/api/axiosPrivate'
import { TIMEOUT_LENGTH_MS, PARTICIPANTS_PAGE_LIMIT } from '@/config/constants'
import { useAuth } from '@/contexts/AuthContext'
import { ROUTES } from '@/lib/routes'
import {
  type Chat,
  type ChatParticipant,
  type ChatAddableParticipant,
  type ParticipantsCursor,
} from '@/types/chats'

// ============================================
// ChatManage
// ============================================

const ChatManage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { id } = useParams<{ id: string }>()

  const chatId = id || ''

  const [addSearch, setAddSearch] = useState('')
  const [debouncedAddSearch, setDebouncedAddSearch] = useState('')
  const [selectedAddable, setSelectedAddable] = useState<string[]>([])

  // Debounce addable search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedAddSearch(addSearch), 300)
    return () => clearTimeout(timer)
  }, [addSearch])

  // ============================================
  // Chat metadata (reuse cache from Chat.tsx)
  // ============================================

  const { data: chatData } = useQuery({
    queryKey: ['chats', chatId],
    queryFn: async () => {
      const res = await axiosPrivate.get<Chat>(`/api/chats/${chatId}`, {
        timeout: TIMEOUT_LENGTH_MS,
      })
      return res.data
    },
    initialData: () =>
      queryClient
        .getQueryData<InfiniteData<Chat[]>>(['chats'])
        ?.pages.flat()
        .find((c) => c.id === chatId),
    enabled: !!chatId,
    staleTime: Infinity,
  })

  // ============================================
  // Participants query
  // ============================================

  const {
    data: participantsData,
    isLoading: participantsLoading,
    fetchNextPage: fetchNextParticipants,
    hasNextPage: hasNextParticipants,
    isFetchingNextPage: isFetchingNextParticipants,
  } = useInfiniteQuery({
    queryKey: ['participants', chatId],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams()
      if (pageParam) {
        params.append('cursor_id', (pageParam as ParticipantsCursor).cursor_id)
        params.append('cursor_joined_at', (pageParam as ParticipantsCursor).cursor_joined_at)
      }
      const res = await axiosPrivate.get<ChatParticipant[]>(
        `/api/chats/${chatId}/participants`,
        { params, timeout: TIMEOUT_LENGTH_MS },
      )
      return res.data
    },
    initialPageParam: undefined as ParticipantsCursor | undefined,
    staleTime: 0,
    gcTime: 0,
    enabled: !!chatId,
    getNextPageParam: (lastPage) => {
      if (lastPage.length < PARTICIPANTS_PAGE_LIMIT) return undefined
      const last = lastPage[lastPage.length - 1]
      return { cursor_id: last.id, cursor_joined_at: last.joined_at }
    },
  })

  const participants = useMemo(() => participantsData?.pages.flat() ?? [], [participantsData])

  // Participants sentinel
  const participantSentinelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const sentinel = participantSentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextParticipants && !isFetchingNextParticipants) {
        fetchNextParticipants()
      }
    })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasNextParticipants, isFetchingNextParticipants, fetchNextParticipants])

  // Derive current user role
  const currentParticipant = participants.find((p) => p.id === user?.id)
  const isAdmin = currentParticipant?.role === 'admin'

  // ============================================
  // Addable participants query (admin only)
  // ============================================

  const { data: addableData, isLoading: addableLoading } = useQuery({
    queryKey: ['participants', chatId, 'addable', debouncedAddSearch],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (debouncedAddSearch) params.append('user_name', debouncedAddSearch)
      const res = await axiosPrivate.get<ChatAddableParticipant[]>(
        `/api/chats/${chatId}/participants/addable`,
        { params, timeout: TIMEOUT_LENGTH_MS },
      )
      return res.data
    },
    enabled: !!chatId && isAdmin,
    staleTime: 0,
    gcTime: 0,
  })

  const addableParticipants = addableData ?? []

  // ============================================
  // Mutations
  // ============================================

  // Add participants
  const addParticipants = useMutation({
    mutationFn: async (ids: string[]) => {
      await axiosPrivate.post(
        `/api/chats/${chatId}/participants`,
        { new_participant_ids: ids },
        { timeout: TIMEOUT_LENGTH_MS },
      )
    },
    onSuccess: () => {
      setSelectedAddable([])
      setAddSearch('')
      setDebouncedAddSearch('')
      queryClient.invalidateQueries({ queryKey: ['participants', chatId] })
    },
    onError: () => {
      toast.error('Failed to add participants.')
    },
  })

  // Remove participant
  const removeParticipant = useMutation({
    mutationFn: async (participantId: string) => {
      await axiosPrivate.delete(`/api/chats/${chatId}/participants/${participantId}`, {
        timeout: TIMEOUT_LENGTH_MS,
      })
      return participantId
    },
    onSuccess: (participantId) => {
      queryClient.setQueryData<InfiniteData<ChatParticipant[]>>(
        ['participants', chatId],
        (old) => {
          if (!old) return old
          return {
            ...old,
            pages: old.pages.map((page) => page.filter((p) => p.id !== participantId)),
          }
        },
      )
    },
    onError: () => {
      toast.error('Failed to remove participant.')
    },
  })

  // Promote to admin
  const promoteParticipant = useMutation({
    mutationFn: async (participantId: string) => {
      await axiosPrivate.patch(
        `/api/chats/${chatId}/participants/${participantId}/promote`,
        {},
        { timeout: TIMEOUT_LENGTH_MS },
      )
      return participantId
    },
    onSuccess: (participantId) => {
      queryClient.setQueryData<InfiniteData<ChatParticipant[]>>(
        ['participants', chatId],
        (old) => {
          if (!old) return old
          return {
            ...old,
            pages: old.pages.map((page) =>
              page.map((p) => (p.id === participantId ? { ...p, role: 'admin' as const } : p)),
            ),
          }
        },
      )
    },
    onError: () => {
      toast.error('Failed to promote participant.')
    },
  })

  // Demote from admin
  const demoteParticipant = useMutation({
    mutationFn: async (participantId: string) => {
      await axiosPrivate.patch(
        `/api/chats/${chatId}/participants/${participantId}/demote`,
        {},
        { timeout: TIMEOUT_LENGTH_MS },
      )
      return participantId
    },
    onSuccess: (participantId) => {
      queryClient.setQueryData<InfiniteData<ChatParticipant[]>>(
        ['participants', chatId],
        (old) => {
          if (!old) return old
          return {
            ...old,
            pages: old.pages.map((page) =>
              page.map((p) => (p.id === participantId ? { ...p, role: 'member' as const } : p)),
            ),
          }
        },
      )
    },
    onError: () => {
      toast.error('Failed to demote participant.')
    },
  })

  // Leave group
  const leaveGroup = useMutation({
    mutationFn: async () => {
      await axiosPrivate.delete(`/api/chats/${chatId}/participants/me`, {
        timeout: TIMEOUT_LENGTH_MS,
      })
    },
    onSuccess: () => {
      // Remove chat from ['chats'] cache
      queryClient.setQueryData<InfiniteData<Chat[]>>(['chats'], (old) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page) => page.filter((c) => c.id !== chatId)),
        }
      })
      queryClient.removeQueries({ queryKey: ['chats', chatId] })
      queryClient.removeQueries({ queryKey: ['participants', chatId] })
      queryClient.removeQueries({ queryKey: ['messages', chatId] })
      navigate(ROUTES.CHATS)
    },
    onError: () => {
      toast.error('Failed to leave group.')
    },
  })

  // ============================================
  // Render
  // ============================================

  const groupName = chatData?.name ?? 'Group'

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-md mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="text-muted-foreground"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-heading font-semibold text-foreground flex-1">
            {groupName}
          </h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-6 space-y-6">

        {/* Add participants (admin only) */}
        {isAdmin && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Add People</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search connections..."
                value={addSearch}
                onChange={(e) => setAddSearch(e.target.value)}
                className="pl-9 rounded-full"
              />
            </div>

            {addableLoading ? (
              <div className="flex justify-center py-3">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            ) : addableParticipants.length > 0 ? (
              <div className="space-y-2">
                {addableParticipants.map((p) => (
                  <div
                    key={p.id}
                    onClick={() =>
                      setSelectedAddable((prev) =>
                        prev.includes(p.id) ? prev.filter((x) => x !== p.id) : [...prev, p.id],
                      )
                    }
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedAddable.includes(p.id)
                        ? 'bg-primary/10 border border-primary'
                        : 'bg-muted/50 hover:bg-muted'
                    }`}
                  >
                    <Avatar className="w-9 h-9">
                      <AvatarImage src={p.avatar_url ?? undefined} alt={p.name} />
                      <AvatarFallback>{p.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="flex-1 font-medium text-sm">{p.name}</span>
                  </div>
                ))}
                {selectedAddable.length > 0 && (
                  <Button
                    onClick={() => addParticipants.mutate(selectedAddable)}
                    disabled={addParticipants.isPending}
                    className="w-full rounded-full"
                    style={{ backgroundColor: '#D8A24A' }}
                  >
                    {addParticipants.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add {selectedAddable.length} {selectedAddable.length === 1 ? 'Person' : 'People'}
                      </>
                    )}
                  </Button>
                )}
              </div>
            ) : addSearch ? (
              <p className="text-sm text-muted-foreground text-center py-2">No connections found</p>
            ) : null}
          </div>
        )}

        {/* Participants list */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">
            Members {participants.length > 0 && `(${participants.length})`}
          </h2>

          {participantsLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2">
              {participants.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border"
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={p.avatar_url ?? undefined} alt={p.name} />
                    <AvatarFallback>{p.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">
                      {p.name}
                      {p.id === user?.id && (
                        <span className="ml-1 text-muted-foreground font-normal">(you)</span>
                      )}
                    </p>
                    {p.role === 'admin' && (
                      <p className="text-xs text-primary">Admin</p>
                    )}
                  </div>

                  {/* Admin actions — not on self */}
                  {isAdmin && p.id !== user?.id && (
                    <div className="flex gap-1">
                      {p.role === 'member' ? (
                        <button
                          onClick={() => promoteParticipant.mutate(p.id)}
                          disabled={promoteParticipant.isPending}
                          className="p-1.5 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground"
                          title="Make admin"
                        >
                          <Shield className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => demoteParticipant.mutate(p.id)}
                          disabled={demoteParticipant.isPending}
                          className="p-1.5 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground"
                          title="Remove admin"
                        >
                          <ShieldOff className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => removeParticipant.mutate(p.id)}
                        disabled={removeParticipant.isPending}
                        className="p-1.5 rounded-full bg-muted hover:bg-muted/80 text-destructive"
                        title="Remove from group"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
              <div ref={participantSentinelRef} className="h-1" />
              {isFetchingNextParticipants && (
                <div className="flex justify-center py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Leave group */}
        <Button
          variant="ghost"
          onClick={() => leaveGroup.mutate()}
          disabled={leaveGroup.isPending}
          className="w-full rounded-full text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          {leaveGroup.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <LogOut className="w-4 h-4 mr-2" />
              Leave Group
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

export default ChatManage
