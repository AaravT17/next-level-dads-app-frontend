import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  useInfiniteQuery,
  useMutation,
} from '@tanstack/react-query'
import BottomNav from '@/components/BottomNav'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Search, Users, Plus, Check, Loader2 } from 'lucide-react'
import logo from '@/assets/logo.png'
import { chat } from '@/lib/routes'
import { toast } from 'sonner'
import axiosPrivate from '@/api/axiosPrivate'
import { TIMEOUT_LENGTH_MS, PROFILES_PAGE_LIMIT, CHATS_PAGE_LIMIT } from '@/config/constants'
import { Chat, ChatsCursor } from '@/types/chats'
import { ConnectionResponse, ConnectionsCursor } from '@/types/users'

// ============================================
// Chats
// ============================================

const Chats = () => {
  const [isNewChatOpen, setIsNewChatOpen] = useState(false)
  const [newChatSearch, setNewChatSearch] = useState('')
  const [debouncedNewChatSearch, setDebouncedNewChatSearch] = useState('')
  const [selectedConnections, setSelectedConnections] = useState<string[]>([])
  const [groupName, setGroupName] = useState('')
  // Local input state — debounced into URL param
  const [searchInput, setSearchInput] = useState('')

  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const nameParam = searchParams.get('name') ?? ''

  // Sync input with URL param on mount (e.g. back navigation)
  useEffect(() => {
    setSearchInput(nameParam)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Debounce search input → URL param
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        if (searchInput.trim()) {
          next.set('name', searchInput.trim())
        } else {
          next.delete('name')
        }
        return next
      }, { replace: true })
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput, setSearchParams])

  // Debounce connection search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedNewChatSearch(newChatSearch), 300)
    return () => clearTimeout(timer)
  }, [newChatSearch])

  // ============================================
  // Chat list query
  // ============================================

  const {
    data: chatsData,
    isLoading: chatsLoading,
    isError: chatsError,
    fetchNextPage: fetchNextChats,
    hasNextPage: hasNextChats,
    isFetchingNextPage: isFetchingNextChats,
  } = useInfiniteQuery({
    queryKey: ['chats'],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams()
      if (pageParam) {
        params.append('cursor_id', (pageParam as ChatsCursor).cursor_id)
        params.append('cursor_updated_at', (pageParam as ChatsCursor).cursor_updated_at)
      }
      const res = await axiosPrivate.get<Chat[]>('/api/chats/', {
        params,
        timeout: TIMEOUT_LENGTH_MS,
      })
      return res.data
    },
    initialPageParam: undefined as ChatsCursor | undefined,
    staleTime: Infinity,
    getNextPageParam: (lastPage) => {
      if (lastPage.length < CHATS_PAGE_LIMIT) return undefined
      const last = lastPage[lastPage.length - 1]
      return { cursor_id: last.id, cursor_updated_at: last.updated_at }
    },
  })

  const chats = useMemo(() => chatsData?.pages.flat() ?? [], [chatsData])

  // ============================================
  // Search query (server-side, name param active)
  // ============================================

  const {
    data: searchData,
    isLoading: searchLoading,
    isError: searchError,
    fetchNextPage: fetchNextSearch,
    hasNextPage: hasNextSearch,
    isFetchingNextPage: isFetchingNextSearch,
  } = useInfiniteQuery({
    queryKey: ['chats', { name: nameParam }],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams()
      params.append('name', nameParam)
      if (pageParam) {
        params.append('cursor_id', (pageParam as ChatsCursor).cursor_id)
        params.append('cursor_updated_at', (pageParam as ChatsCursor).cursor_updated_at)
      }
      const res = await axiosPrivate.get<Chat[]>('/api/chats/', {
        params,
        timeout: TIMEOUT_LENGTH_MS,
      })
      return res.data
    },
    initialPageParam: undefined as ChatsCursor | undefined,
    enabled: !!nameParam,
    staleTime: 0,
    gcTime: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.length < CHATS_PAGE_LIMIT) return undefined
      const last = lastPage[lastPage.length - 1]
      return { cursor_id: last.id, cursor_updated_at: last.updated_at }
    },
  })

  const searchChats = useMemo(() => searchData?.pages.flat() ?? [], [searchData])

  // Active list — search results when name param set, normal cache otherwise
  const activeChats = nameParam ? searchChats : chats
  const activeLoading = nameParam ? searchLoading : chatsLoading
  const activeError = nameParam ? searchError : chatsError
  const fetchNext = nameParam ? fetchNextSearch : fetchNextChats
  const hasNext = nameParam ? hasNextSearch : hasNextChats
  const isFetchingNext = nameParam ? isFetchingNextSearch : isFetchingNextChats

  // Chat list sentinel
  const chatSentinelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const sentinel = chatSentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNext && !isFetchingNext) {
        fetchNext()
      }
    })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasNext, isFetchingNext, fetchNext])

  // ============================================
  // Connections query (for new chat dialog)
  // ============================================

  const {
    data: connectionsData,
    fetchNextPage: fetchNextConnections,
    hasNextPage: hasNextConnections,
    isFetchingNextPage: isFetchingNextConnections,
  } = useInfiniteQuery({
    queryKey: ['connections', 'new-chat', { name: debouncedNewChatSearch }],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams()
      if (debouncedNewChatSearch) params.append('name', debouncedNewChatSearch)
      if (pageParam) {
        params.append('cursor_id', (pageParam as ConnectionsCursor).cursor_id)
        params.append('cursor_updated_at', (pageParam as ConnectionsCursor).cursor_updated_at)
      }
      const res = await axiosPrivate.get<ConnectionResponse[]>('/api/connections/connected', {
        params,
        timeout: TIMEOUT_LENGTH_MS,
      })
      return res.data
    },
    initialPageParam: undefined as ConnectionsCursor | undefined,
    enabled: isNewChatOpen,
    staleTime: 0,
    gcTime: 0,
    getNextPageParam: (lastPage): ConnectionsCursor | undefined => {
      if (lastPage.length < PROFILES_PAGE_LIMIT) return undefined
      const last = lastPage[lastPage.length - 1]
      return { cursor_id: last.connection_id, cursor_updated_at: last.connection_updated_at }
    },
  })

  const connections = useMemo(() => connectionsData?.pages.flat() ?? [], [connectionsData])

  // Connections sentinel inside dialog
  const connectionSentinelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const sentinel = connectionSentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextConnections && !isFetchingNextConnections) {
        fetchNextConnections()
      }
    })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasNextConnections, isFetchingNextConnections, fetchNextConnections])

  // ============================================
  // Create chat mutation
  // ============================================

  const createChat = useMutation({
    mutationFn: async (body: { participant_ids: string[]; name?: string }) => {
      const res = await axiosPrivate.post<{ id: string }>('/api/chats/', body, {
        timeout: TIMEOUT_LENGTH_MS,
      })
      return res.data
    },
    onSuccess: (data) => {
      handleDialogClose(false)
      navigate(chat(data.id))
    },
    onError: () => {
      toast.error('Failed to create chat. Please try again.')
    },
  })

  // ============================================
  // Handlers
  // ============================================

  const toggleConnectionSelection = useCallback((id: string) => {
    setSelectedConnections((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }, [])

  const handleCreateChat = () => {
    if (selectedConnections.length === 0) return
    createChat.mutate({
      participant_ids: selectedConnections,
      name: isGroupChat && groupName.trim() ? groupName.trim() : undefined,
    })
  }

  const handleDialogClose = (open: boolean) => {
    setIsNewChatOpen(open)
    if (!open) {
      setSelectedConnections([])
      setGroupName('')
      setNewChatSearch('')
      setDebouncedNewChatSearch('')
    }
  }

  const isGroupChat = selectedConnections.length > 1

  // ============================================
  // Render helpers
  // ============================================

  const getChatDisplayName = (c: Chat) =>
    c.type === 'dm' ? (c.other_user?.name ?? 'Unknown') : (c.name ?? 'Group')

  const getChatAvatar = (c: Chat) =>
    c.type === 'dm' ? c.other_user?.avatar_url ?? null : null

  const getLastMessagePreview = (c: Chat) => {
    if (!c.last_message) return ''
    if (c.last_message.is_deleted) return 'Message deleted'
    return c.last_message.content
  }

  const formatTime = (isoString: string) => {
    const date = new Date(isoString)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  // ============================================
  // Render
  // ============================================

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="relative bg-card border-b border-border px-6 py-5 flex items-center justify-center">
        <img
          src={logo}
          alt="Next Level Dads"
          className="h-10 absolute top-4 left-3"
        />
        <div className="text-center">
          <h1 className="text-2xl font-heading font-semibold text-foreground">
            Chats
          </h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Search conversations..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10 rounded-full"
            />
          </div>
          <Dialog
            open={isNewChatOpen}
            onOpenChange={handleDialogClose}
          >
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={() => setIsNewChatOpen(true)}
              >
                <Plus className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>New Chat</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search connections..."
                    value={newChatSearch}
                    onChange={(e) => setNewChatSearch(e.target.value)}
                    className="pl-9 rounded-full"
                  />
                </div>

                {selectedConnections.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedConnections.map((id) => {
                      const connection = connections.find((c) => c.id === id)
                      return connection ? (
                        <div
                          key={id}
                          onClick={() => toggleConnectionSelection(id)}
                          className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-full text-sm cursor-pointer hover:bg-primary/20"
                        >
                          <span>{connection.name.split(' ')[0]}</span>
                          <span className="text-muted-foreground">×</span>
                        </div>
                      ) : null
                    })}
                  </div>
                )}

                {isGroupChat && (
                  <Input
                    placeholder="Group name..."
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="rounded-full"
                  />
                )}

                <div className="max-h-60 overflow-y-auto space-y-2">
                  {connections.length > 0 ? (
                    <>
                      {connections.map((connection) => (
                        <div
                          key={connection.id}
                          onClick={() => toggleConnectionSelection(connection.id)}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                            selectedConnections.includes(connection.id)
                              ? 'bg-primary/10 border border-primary'
                              : 'bg-muted/50 hover:bg-muted'
                          }`}
                        >
                          <Avatar className="w-10 h-10">
                            <AvatarImage
                              src={connection.avatar_url ?? undefined}
                              alt={connection.name}
                            />
                            <AvatarFallback>{connection.name[0]}</AvatarFallback>
                          </Avatar>
                          <span className="flex-1 font-medium">
                            {connection.name}
                          </span>
                          {selectedConnections.includes(connection.id) && (
                            <Check className="w-5 h-5 text-primary" />
                          )}
                        </div>
                      ))}
                      <div ref={connectionSentinelRef} className="h-1" />
                      {isFetchingNextConnections && (
                        <div className="flex justify-center py-2">
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      No connections found
                    </p>
                  )}
                </div>

                {selectedConnections.length > 0 && (
                  <Button
                    onClick={handleCreateChat}
                    disabled={createChat.isPending}
                    className="w-full rounded-full"
                    style={{ backgroundColor: '#D8A24A' }}
                  >
                    {createChat.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isGroupChat ? (
                      `Create Group (${selectedConnections.length} members)`
                    ) : (
                      'Start Chat'
                    )}
                  </Button>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {activeLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : activeError ? (
          <div className="text-center py-12 px-6">
            <p className="text-muted-foreground">Failed to load chats.</p>
          </div>
        ) : activeChats.length > 0 ? (
          <>
            <div className="divide-y divide-border">
              {activeChats.map((c) => {
                const displayName = getChatDisplayName(c)
                const avatarUrl = getChatAvatar(c)
                const preview = getLastMessagePreview(c)
                const time = c.last_message ? formatTime(c.last_message.created_at) : null
                const hasUnread = c.last_read_at === null || c.updated_at > c.last_read_at

                return (
                  <div
                    key={c.id}
                    onClick={() => navigate(chat(c.id))}
                    className="px-2 py-4 hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative shrink-0">
                        {c.type === 'dm' ? (
                          <Avatar className="w-14 h-14">
                            <AvatarImage
                              src={avatarUrl ?? undefined}
                              alt={displayName}
                            />
                            <AvatarFallback>{displayName[0]}</AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                            <Users className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                        {hasUnread && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary border-2 border-background" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className={`truncate ${hasUnread ? 'font-bold text-foreground' : 'font-medium text-foreground'}`}>
                            {displayName}
                          </h3>
                          {time && (
                            <span className="text-xs text-muted-foreground shrink-0 ml-2">
                              {time}
                            </span>
                          )}
                        </div>
                        <p className={`text-sm truncate ${hasUnread ? 'text-foreground font-medium' : preview ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}>
                          {preview || 'No messages yet'}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div ref={chatSentinelRef} className="h-1" />
            {isFetchingNext && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 px-6">
            <p className="text-muted-foreground">
              {nameParam ? 'No conversations found' : 'No chats yet'}
            </p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}

export default Chats
