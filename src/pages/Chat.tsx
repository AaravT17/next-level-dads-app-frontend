import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient, InfiniteData } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArrowLeft, Send, Users, ChevronDown, Pencil, Trash2, Loader2 } from 'lucide-react'
import { groupsTab, chatManage } from '@/lib/routes'
import { type ChatType, type Message, type Chat, type MessagesCursor } from '@/types/chats'
import { useAuth } from '@/contexts/AuthContext'
import { useChat } from '@/contexts/ChatContext'
import axiosPrivate from '@/api/axiosPrivate'
import { TIMEOUT_LENGTH_MS, MESSAGES_PAGE_LIMIT } from '@/config/constants'
import {
  insertMessage,
  updateChatPreviewOnNewMessage,
  insertChatPreview,
  updateChatPreviewOnEdit,
  updateChatPreviewOnDelete,
  updateMessagesCache,
  patchMessageInCache,
} from '@/utils/chats'
import { toast } from 'sonner'

// ============================================
// Chat
// ============================================

const Chat = () => {
  const { user } = useAuth()
  const { registerMessageHandler } = useChat()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()

  const chatId = id || ''
  const from = searchParams.get('from')

  // ============================================
  // Local state
  // ============================================

  const [messages, setMessages] = useState<Message[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [olderCursor, setOlderCursor] = useState<MessagesCursor | null>(null)
  const [isFetchingOlder, setIsFetchingOlder] = useState(false)
  const [hasMoreOlder, setHasMoreOlder] = useState(true)

  // ============================================
  // Refs
  // ============================================

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const topSentinelRef = useRef<HTMLDivElement>(null)
  const bottomSentinelRef = useRef<HTMLDivElement>(null)
  const isAtBottomRef = useRef<boolean>(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // ============================================
  // Chat metadata query
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

  const chatType: ChatType = chatData?.type ?? 'dm'
  const isGroupChat = chatType === 'group'
  const displayName = isGroupChat
    ? (chatData?.name ?? 'Group')
    : (chatData?.other_user?.name ?? '')
  const avatarUrl = isGroupChat ? null : (chatData?.other_user?.avatar_url ?? null)

  // ============================================
  // Messages initial load
  // ============================================

  const { data: initialMessages, isSuccess: messagesLoaded } = useQuery({
    queryKey: ['messages', chatId],
    queryFn: async () => {
      const res = await axiosPrivate.get<Message[]>(`/api/chats/${chatId}/messages`, {
        timeout: TIMEOUT_LENGTH_MS,
      })
      // Reverse once on arrival: API returns newest-first, cache stores oldest-first
      return [...res.data].reverse()
    },
    enabled: !!chatId,
    staleTime: Infinity,
  })

  // On initial load: cache is already oldest-first, init state directly
  useEffect(() => {
    if (!messagesLoaded || !initialMessages) return
    setMessages(initialMessages)

    // Cursor points to the oldest loaded message (index 0 in oldest-first)
    if (initialMessages.length > 0) {
      const oldest = initialMessages[0]
      setOlderCursor({ cursor_id: oldest.id, cursor_created_at: oldest.created_at })
      setHasMoreOlder(true)
    } else {
      setHasMoreOlder(false)
    }
  }, [messagesLoaded, initialMessages])

  // Scroll to bottom on initial load
  useEffect(() => {
    if (messagesLoaded && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView()
    }
  }, [messagesLoaded]) // eslint-disable-line react-hooks/exhaustive-deps

  // ============================================
  // Bottom sentinel — isAtBottom tracking
  // ============================================

  useEffect(() => {
    const sentinel = bottomSentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver((entries) => {
      const visible = entries[0].isIntersecting
      isAtBottomRef.current = visible
      setIsAtBottom(visible)
      if (visible) setUnreadCount(0)
    })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  // ============================================
  // Top sentinel — load older messages
  // ============================================

  const fetchOlderMessages = useCallback(async () => {
    if (!olderCursor || isFetchingOlder || !hasMoreOlder) return

    setIsFetchingOlder(true)
    const container = scrollContainerRef.current
    const prevScrollHeight = container?.scrollHeight ?? 0

    try {
      const params = new URLSearchParams({
        cursor_id: olderCursor.cursor_id,
        cursor_created_at: olderCursor.cursor_created_at,
      })
      const res = await axiosPrivate.get<Message[]>(`/api/chats/${chatId}/messages`, {
        params,
        timeout: TIMEOUT_LENGTH_MS,
      })
      const older = res.data

      if (older.length === 0) {
        setHasMoreOlder(false)
        return
      }

      const reversed = [...older].reverse()
      setMessages((prev) => [...reversed, ...prev])

      // Update cursor to the oldest message in this page
      const oldestInPage = older[older.length - 1]
      setOlderCursor({ cursor_id: oldestInPage.id, cursor_created_at: oldestInPage.created_at })

      // Preserve scroll position
      requestAnimationFrame(() => {
        if (container) {
          container.scrollTop = container.scrollHeight - prevScrollHeight
        }
      })

      if (older.length < MESSAGES_PAGE_LIMIT) setHasMoreOlder(false)
    } catch {
      // silently fail — user can scroll up again to retry
    } finally {
      setIsFetchingOlder(false)
    }
  }, [chatId, olderCursor, isFetchingOlder, hasMoreOlder])

  useEffect(() => {
    const sentinel = topSentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) fetchOlderMessages()
    })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [fetchOlderMessages])

  // ============================================
  // WS handler
  // ============================================

  useEffect(() => {
    if (!chatId) return
    const unregister = registerMessageHandler(chatId, (event) => {
      if (event.type === 'messages:new') {
        const msg = event.payload
        setMessages((prev) => insertMessage(prev, msg))
        if (!isAtBottomRef.current) {
          setUnreadCount((n) => n + 1)
        }
      } else if (event.type === 'messages:edit') {
        const { id, content, edited_at } = event.payload
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, content, edited_at } : m)),
        )
      } else if (event.type === 'messages:delete') {
        const { id } = event.payload
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, is_deleted: true, content: '' } : m)),
        )
      }
    })
    return unregister
  }, [chatId, registerMessageHandler])

  // ============================================
  // Send message
  // ============================================

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      const res = await axiosPrivate.post<Message>(
        `/api/chats/${chatId}/messages`,
        { content },
        { timeout: TIMEOUT_LENGTH_MS },
      )
      return res.data
    },
    onSuccess: (newMsg) => {
      setMessageInput('')
      // Update all three: chat preview, messages cache, local state
      const found = updateChatPreviewOnNewMessage(queryClient, newMsg)
      if (!found) {
        axiosPrivate.get<Chat>(`/api/chats/${chatId}`).then((res) => {
          insertChatPreview(queryClient, res.data)
        }).catch(() => {})
      }
      updateMessagesCache(queryClient, chatId, newMsg)
      setMessages((prev) => insertMessage(prev, newMsg))
      // Scroll to bottom
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    },
    onError: () => {
      toast.error('Failed to send message.')
    },
  })

  // ============================================
  // Edit message
  // ============================================

  const editMessage = useMutation({
    mutationFn: async ({ messageId, newContent }: { messageId: string; newContent: string }) => {
      const res = await axiosPrivate.patch<{ id: string; content: string; edited_at: string; chat_id: string }>(
        `/api/chats/${chatId}/messages/${messageId}`,
        { new_content: newContent },
        { timeout: TIMEOUT_LENGTH_MS },
      )
      return res.data
    },
    onSuccess: (data) => {
      setEditingId(null)
      setEditContent('')
      updateChatPreviewOnEdit(queryClient, data)
      patchMessageInCache(queryClient, chatId, data)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.id ? { ...m, content: data.content, edited_at: data.edited_at } : m,
        ),
      )
    },
    onError: () => {
      toast.error('Failed to edit message.')
    },
  })

  // ============================================
  // Delete message
  // ============================================

  const deleteMessage = useMutation({
    mutationFn: async (messageId: string) => {
      await axiosPrivate.delete(`/api/chats/${chatId}/messages/${messageId}`, {
        timeout: TIMEOUT_LENGTH_MS,
      })
      return messageId
    },
    onSuccess: (messageId) => {
      const patch = { id: messageId, chat_id: chatId, is_deleted: true as const, content: '' }
      updateChatPreviewOnDelete(queryClient, patch)
      patchMessageInCache(queryClient, chatId, patch)
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, is_deleted: true, content: '' } : m)),
      )
    },
    onError: () => {
      toast.error('Failed to delete message.')
    },
  })

  // ============================================
  // Handlers
  // ============================================

  const handleSend = () => {
    const content = messageInput.trim()
    if (!content || sendMessage.isPending) return
    sendMessage.mutate(content)
  }

  const handleBack = () => {
    if (from === 'groups') {
      navigate(groupsTab('communities'))
    } else {
      navigate(-1)
    }
  }

  const handleScrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    setUnreadCount(0)
  }

  const formatTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // ============================================
  // Render
  // ============================================

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border shrink-0">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="text-muted-foreground"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>

            {isGroupChat ? (
              <button
                onClick={() => navigate(chatManage(chatId))}
                className="flex items-center gap-4 flex-1 text-left"
              >
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h1 className="text-lg font-heading font-semibold text-foreground">
                    {displayName}
                  </h1>
                  <p className="text-xs text-muted-foreground">Group</p>
                </div>
              </button>
            ) : (
              <>
                <Avatar className="w-10 h-10 shrink-0">
                  <AvatarImage src={avatarUrl ?? undefined} />
                  <AvatarFallback>{displayName[0] ?? '?'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h1 className="text-lg font-heading font-semibold text-foreground">
                    {displayName}
                  </h1>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        className="flex-1 max-w-md mx-auto w-full px-6 py-4 overflow-y-auto relative"
      >
        {/* Top sentinel — triggers loading older messages */}
        <div ref={topSentinelRef} className="h-1" />

        {isFetchingOlder && (
          <div className="flex justify-center py-3">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        )}

        <div className="space-y-4">
          {messages.map((msg) => {
            const isSelf = msg.sender_id === user?.id
            const isEditing = editingId === msg.id

            return (
              <div
                key={msg.id}
                className={`flex gap-3 group ${isSelf ? 'flex-row-reverse' : ''}`}
              >
                {!isSelf && (
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarImage
                      src={msg.sender_avatar_url ?? undefined}
                      alt={msg.sender_name}
                    />
                    <AvatarFallback>{msg.sender_name[0]}</AvatarFallback>
                  </Avatar>
                )}

                <div className={`flex flex-col ${isSelf ? 'items-end' : ''} max-w-xs`}>
                  {!isSelf && isGroupChat && (
                    <span className="text-xs text-muted-foreground mb-1">
                      {msg.sender_name}
                    </span>
                  )}

                  {isEditing ? (
                    <div className="flex gap-2 items-center">
                      <Input
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            if (editContent.trim()) {
                              editMessage.mutate({ messageId: msg.id, newContent: editContent.trim() })
                            }
                          }
                          if (e.key === 'Escape') {
                            setEditingId(null)
                            setEditContent('')
                          }
                        }}
                        className="rounded-xl text-sm"
                        autoFocus
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          if (editContent.trim()) {
                            editMessage.mutate({ messageId: msg.id, newContent: editContent.trim() })
                          }
                        }}
                        disabled={editMessage.isPending}
                        className="shrink-0"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <div
                        className={`rounded-2xl px-4 py-2 ${
                          isSelf
                            ? 'bg-gradient-gold text-foreground'
                            : 'bg-card text-foreground border border-border'
                        }`}
                      >
                        <p className={`text-sm ${msg.is_deleted ? 'italic text-muted-foreground' : ''}`}>
                          {msg.is_deleted ? 'Message deleted' : msg.content}
                        </p>
                      </div>

                      {/* Hover actions — own messages only, non-deleted */}
                      {isSelf && !msg.is_deleted && (
                        <div className="absolute -top-7 right-0 hidden group-hover:flex gap-1">
                          <button
                            onClick={() => {
                              setEditingId(msg.id)
                              setEditContent(msg.content)
                            }}
                            className="p-1 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => deleteMessage.mutate(msg.id)}
                            className="p-1 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <span className="text-xs text-muted-foreground mt-1">
                    {formatTime(msg.created_at)}
                    {msg.edited_at && !msg.is_deleted && (
                      <span className="ml-1 opacity-60">edited</span>
                    )}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom sentinel — isAtBottom detection */}
        <div ref={bottomSentinelRef} className="h-1" />
        <div ref={messagesEndRef} />
      </div>

      {/* Down arrow + unread badge */}
      {!isAtBottom && (
        <div className="absolute bottom-24 right-6 max-w-md">
          <button
            onClick={handleScrollToBottom}
            className="relative bg-card border border-border rounded-full p-2 shadow-md text-muted-foreground hover:text-foreground"
          >
            <ChevronDown className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full w-4 h-4 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Input */}
      <div className="bg-card border-t border-border shrink-0">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              className="rounded-full"
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={sendMessage.isPending || !messageInput.trim()}
              className="rounded-full shrink-0 bg-gradient-gold"
            >
              {sendMessage.isPending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />
              }
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Chat
