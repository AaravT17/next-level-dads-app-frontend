// TODO: Add date separators between messages (e.g. "Today", "Yesterday", specific dates) so users can orient
// themselves in longer conversations — currently messages only show time, no date context.
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  useQuery,
  useMutation,
  useQueryClient,
  InfiniteData,
} from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  ArrowLeft,
  Send,
  Users,
  ChevronDown,
  Pencil,
  Trash2,
  Loader2,
  Reply,
  X,
} from 'lucide-react'
import { groupsTab, chatManage } from '@/lib/routes'
import {
  type ChatType,
  type Message,
  type Chat,
  type MessagesCursor,
} from '@/types/chats'
import { useAuth } from '@/contexts/AuthContext'
import { useChat } from '@/contexts/ChatContext'
import axios from 'axios'
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
  const { registerMessageHandler, registerReconnectHandler, sendWsMessage } =
    useChat()
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
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
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
  const scrollBehaviorRef = useRef<'smooth' | 'instant' | null>('instant')
  const hasInitialisedRef = useRef(false)

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
  const avatarUrl = isGroupChat
    ? null
    : (chatData?.other_user?.avatar_url ?? null)

  // ============================================
  // Messages initial load
  // ============================================

  const { data: initialMessages, isSuccess: messagesLoaded } = useQuery({
    queryKey: ['messages', chatId],
    queryFn: async () => {
      const res = await axiosPrivate.get<Message[]>(
        `/api/chats/${chatId}/messages`,
        {
          timeout: TIMEOUT_LENGTH_MS,
        },
      )
      // Reverse once on arrival: API returns newest-first, cache stores oldest-first
      return [...res.data].reverse()
    },
    enabled: !!chatId,
    staleTime: Infinity,
  })

  // On initial load: cache is already oldest-first, init state directly
  useEffect(() => {
    if (!messagesLoaded || !initialMessages) return
    if (hasInitialisedRef.current) return
    hasInitialisedRef.current = true
    setMessages(initialMessages)

    // Cursor points to the oldest loaded message (index 0 in oldest-first)
    if (initialMessages.length > 0) {
      const oldest = initialMessages[0]
      setOlderCursor({
        cursor_id: oldest.id,
        cursor_created_at: oldest.created_at,
      })
      setHasMoreOlder(true)
    } else {
      setHasMoreOlder(false)
    }
  }, [messagesLoaded, initialMessages])

  // Scroll to bottom after initial load, reconnect, or sending a message
  useEffect(() => {
    if (scrollBehaviorRef.current && messages.length > 0) {
      const behavior = scrollBehaviorRef.current
      scrollBehaviorRef.current = null
      messagesEndRef.current?.scrollIntoView({ behavior })
    }
  }, [messages])

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
      const res = await axiosPrivate.get<Message[]>(
        `/api/chats/${chatId}/messages`,
        {
          params,
          timeout: TIMEOUT_LENGTH_MS,
        },
      )
      const older = res.data

      if (older.length === 0) {
        setHasMoreOlder(false)
        return
      }

      const reversed = [...older].reverse()
      setMessages((prev) => [...reversed, ...prev])

      // Update cursor to the oldest message in this page
      const oldestInPage = older[older.length - 1]
      setOlderCursor({
        cursor_id: oldestInPage.id,
        cursor_created_at: oldestInPage.created_at,
      })

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
    sendWsMessage({ type: 'chats:read', chat_id: chatId })
  }, [chatId, sendWsMessage])

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
          prev.map((m) =>
            m.id === id ? { ...m, is_deleted: true, content: '' } : m,
          ),
        )
      }
    })
    return unregister
  }, [chatId, registerMessageHandler])

  useEffect(() => {
    return registerReconnectHandler(() => {
      hasInitialisedRef.current = false
      scrollBehaviorRef.current = 'instant'
    })
  }, [registerReconnectHandler])

  // ============================================
  // Send message
  // ============================================

  // TODO: add optimistic update — insert a temp message into local state on mutate,
  // replace with server response on success, remove on error
  const sendMessage = useMutation({
    mutationFn: async ({
      content,
      replyToId,
    }: {
      content: string
      replyToId?: string | null
    }) => {
      const res = await axiosPrivate.post<Message>(
        `/api/chats/${chatId}/messages`,
        { content, reply_to_id: replyToId ?? null },
        { timeout: TIMEOUT_LENGTH_MS },
      )
      return res.data
    },
    onSuccess: (newMsg) => {
      setMessageInput('')
      setReplyingTo(null)
      sendWsMessage({ type: 'chats:read', chat_id: chatId })
      // Update all three: chat preview, messages cache, local state
      const found = updateChatPreviewOnNewMessage(queryClient, newMsg)
      if (!found) {
        axiosPrivate
          .get<Chat>(`/api/chats/${chatId}`)
          .then((res) => {
            insertChatPreview(queryClient, res.data)
          })
          .catch(() => {})
      }
      updateMessagesCache(queryClient, chatId, newMsg)
      scrollBehaviorRef.current = 'smooth'
      setMessages((prev) => insertMessage(prev, newMsg))
    },
    onError: (error) => {
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        toast.error('Too many messages sent. Please slow down.')
      } else {
        toast.error('Failed to send message.')
      }
    },
  })

  // ============================================
  // Edit message
  // ============================================

  const editMessage = useMutation({
    mutationFn: async ({
      messageId,
      newContent,
    }: {
      messageId: string
      newContent: string
    }) => {
      const res = await axiosPrivate.patch<{
        id: string
        content: string
        edited_at: string
        chat_id: string
      }>(
        `/api/chats/${chatId}/messages/${messageId}`,
        { new_content: newContent },
        { timeout: TIMEOUT_LENGTH_MS },
      )
      return res.data
    },
    onSuccess: (data) => {
      setEditingId(null)
      setEditContent('')
      const patch = {
        id: data.id,
        chat_id: chatId,
        content: data.content,
        edited_at: data.edited_at,
      }
      updateChatPreviewOnEdit(queryClient, patch)
      patchMessageInCache(queryClient, chatId, patch)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === patch.id
            ? { ...m, content: patch.content, edited_at: patch.edited_at }
            : m,
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
      const patch = {
        id: messageId,
        chat_id: chatId,
        is_deleted: true as const,
        content: '',
      }
      updateChatPreviewOnDelete(queryClient, patch)
      patchMessageInCache(queryClient, chatId, patch)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, is_deleted: true, content: '' } : m,
        ),
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
    sendMessage.mutate({ content, replyToId: replyingTo?.id })
  }

  const handleBack = () => {
    if (from === 'groups') {
      navigate(groupsTab('communities'))
    } else {
      navigate(-1)
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditContent('')
  }

  const handleEditSubmit = (msg: Message) => {
    if (editContent.trim() && editContent.trim() !== msg.content) {
      editMessage.mutate({
        messageId: msg.id,
        newContent: editContent.trim(),
      })
    } else {
      cancelEdit()
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
    <div className="h-dvh bg-background flex flex-col">
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
        <div
          ref={topSentinelRef}
          className="h-1"
        />

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
                    <AvatarFallback>
                      {msg.sender_name?.[0] ?? '?'}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={`flex flex-col ${isSelf ? 'items-end' : ''} max-w-xs`}
                >
                  {!isSelf && isGroupChat && (
                    <span className="text-xs text-muted-foreground mb-1">
                      {msg.sender_name ?? 'Unknown'}
                    </span>
                  )}

                  {isEditing ? (
                    <div className="flex gap-0 items-center">
                      <Input
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleEditSubmit(msg)
                          }
                          if (e.key === 'Escape') {
                            cancelEdit()
                          }
                        }}
                        className="rounded-xl text-sm"
                        autoFocus
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEditSubmit(msg)}
                        disabled={editMessage.isPending}
                        className="shrink-0 h-7 w-7"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={cancelEdit}
                        className="shrink-0 h-7 w-7"
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <div
                        className={`rounded-2xl px-4 py-2 w-fit max-w-xs ${
                          isSelf
                            ? 'bg-gradient-gold text-foreground'
                            : 'bg-card text-foreground border border-border'
                        }`}
                      >
                        {/* Reply quote block */}
                        {msg.reply_to && !msg.is_deleted && (
                          <div className="mb-1.5 pl-2 border-l-2 border-muted-foreground/40">
                            {msg.reply_to.is_deleted ? (
                              <p className="text-xs text-muted-foreground italic">
                                Message deleted
                              </p>
                            ) : (
                              <>
                                <p className="text-xs font-medium text-muted-foreground truncate">
                                  {msg.reply_to.sender_name ?? 'Unknown'}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {msg.reply_to.content}
                                </p>
                              </>
                            )}
                          </div>
                        )}
                        <p
                          className={`text-sm ${msg.is_deleted ? 'italic text-muted-foreground' : ''}`}
                        >
                          {msg.is_deleted ? 'Message deleted' : msg.content}
                        </p>
                      </div>

                      {/* Hover actions */}
                      {!msg.is_deleted && (
                        <div
                          className={`absolute -top-5 ${isSelf ? 'right-0' : 'left-0'} hidden group-hover:flex gap-1`}
                        >
                          <button
                            onClick={() => setReplyingTo(msg)}
                            className="p-1 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground"
                          >
                            <Reply className="w-3 h-3" />
                          </button>
                          {isSelf && (
                            <>
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
                            </>
                          )}
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
        <div
          ref={bottomSentinelRef}
          className="h-1"
        />
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
        {replyingTo && (
          <div className="max-w-md mx-auto px-6 pt-3 flex items-start gap-2">
            <div className="flex-1 pl-2 border-l-2 border-primary min-w-0">
              <p className="text-xs font-medium text-primary">
                Replying to {replyingTo.sender_name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {replyingTo.is_deleted ? 'Message deleted' : replyingTo.content}
              </p>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-muted-foreground hover:text-foreground shrink-0 mt-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
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
              {sendMessage.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Chat
