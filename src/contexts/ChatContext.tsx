import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from 'react'
import { useQueryClient, InfiniteData } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import axiosPrivate, {
  getAccessToken,
  setAccessToken,
  getAuthCallbacks,
} from '@/api/axiosPrivate'
import { Message, Chat, ChatMembership } from '@/types/chats'
import {
  updateChatPreviewOnNewMessage,
  insertChatPreview,
  removeChatPreview,
  updateChatPreviewOnEdit,
  updateChatPreviewOnDelete,
  updateMessagesCache,
  patchMessageInCache,
} from '@/utils/chats'

// ============================================
// Types
// ============================================

type MessageHandler = (event: WsEvent) => void

type WsEvent =
  | { type: 'ws:ready' }
  | { type: 'messages:new'; payload: Message }
  | {
      type: 'messages:edit'
      payload: {
        id: string
        chat_id: string
        content: string
        is_deleted: false
        edited_at: string
      }
    }
  | {
      type: 'messages:delete'
      payload: {
        id: string
        chat_id: string
        content: ''
        is_deleted: true
        edited_at: null
      }
    }
  | {
      type: 'chats:read'
      payload: {
        chat_id: string
        last_read_at: string
      }
    }
  | {
      type: 'chats:added'
      payload: {
        chat_id: string
      }
    }
  | {
      type: 'chats:removed'
      payload: {
        chat_id: string
      }
    }

interface ChatContextType {
  registerMessageHandler: (chatId: string, handler: MessageHandler) => () => void
  registerReconnectHandler: (handler: () => void) => () => void
  sendWsMessage: (data: object) => void
  isReconnecting: boolean
  isFailed: boolean
  reconnect: () => void
  wsReady: boolean
  unreadCount: number
}

// ============================================
// Context
// ============================================

const ChatContext = createContext<ChatContextType | undefined>(undefined)

// ============================================
// Helpers
// ============================================

type MembershipMap = Map<string, { last_read_at: string | null; updated_at: string | null }>

// TODO: optimize — instead of iterating the full map on every event, track
// incremental changes per-chat (check if unread status flipped, +1 or -1).
function computeUnreadCount(map: MembershipMap): number {
  let count = 0
  for (const [, entry] of map) {
    if (entry.last_read_at === null || entry.updated_at > entry.last_read_at) {
      count++
    }
  }
  return count
}

// ============================================
// Provider
// ============================================

const MAX_RECONNECT_ATTEMPTS = 5
const MAX_MEMBERSHIP_FETCH_ATTEMPTS = 3

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [isReconnecting, setIsReconnecting] = useState(false)
  const [isFailed, setIsFailed] = useState(false)
  const [wsReady, setWsReady] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttemptRef = useRef<number>(0)
  const hasConnectedOnceRef = useRef<boolean>(false)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const messageHandlerRef = useRef<{
    chatId: string
    handler: MessageHandler
  } | null>(null)
  const reconnectHandlerRef = useRef<(() => void) | null>(null)
  const currentChatIdRef = useRef<string | null>(null)
  const shouldReconnectRef = useRef<boolean>(false)
  const isFailedRef = useRef<boolean>(false)

  // Chat membership hashmap — source of truth for which chats the user is in + unread state
  const chatMembershipRef = useRef<MembershipMap>(new Map())
  const wsReadyRef = useRef<boolean>(false)
  const isFetchingMembershipRef = useRef<boolean>(false)
  const eventBufferRef = useRef<WsEvent[]>([])

  const registerMessageHandler = useCallback(
    (chatId: string, handler: MessageHandler) => {
      messageHandlerRef.current = { chatId, handler }
      currentChatIdRef.current = chatId
      return () => {
        messageHandlerRef.current = null
        currentChatIdRef.current = null
      }
    },
    [],
  )

  const registerReconnectHandler = useCallback((handler: () => void) => {
    reconnectHandlerRef.current = handler
    return () => {
      reconnectHandlerRef.current = null
    }
  }, [])

  const logout = useCallback(() => {
    shouldReconnectRef.current = false
    setAccessToken(null)
    getAuthCallbacks()?.onAuthFailure()
  }, [])

  // ============================================
  // Event processing
  // ============================================

  const processChatsAdded = useCallback(
    async (chatId: string) => {
      // Skip if already in hashmap (duplicate event)
      if (chatMembershipRef.current.has(chatId)) return

      try {
        const res = await axiosPrivate.get(`/api/chats/${chatId}`)
        const chat = res.data

        chatMembershipRef.current.set(chatId, {
          last_read_at: chat.last_read_at,
          updated_at: chat.updated_at,
        })
        setUnreadCount(computeUnreadCount(chatMembershipRef.current))

        insertChatPreview(queryClient, chat)
      } catch {
        // Fallback: add with nulls so future events aren't dropped.
        // Preview will appear on next staleTime refetch or navigation.
        chatMembershipRef.current.set(chatId, {
          last_read_at: null,
          updated_at: null,
        })
        setUnreadCount(computeUnreadCount(chatMembershipRef.current))
      }
    },
    [queryClient],
  )

  const processChatsRemoved = useCallback(
    (chatId: string) => {
      chatMembershipRef.current.delete(chatId)
      setUnreadCount(computeUnreadCount(chatMembershipRef.current))

      removeChatPreview(queryClient, chatId)
      queryClient.removeQueries({ queryKey: ['messages', chatId] })
    },
    [queryClient],
  )

  const drainBuffer = useCallback(() => {
    const buffer = eventBufferRef.current
    eventBufferRef.current = []

    for (const event of buffer) {
      if (event.type === 'chats:added') {
        processChatsAdded(event.payload.chat_id)
      } else if (event.type === 'chats:removed') {
        processChatsRemoved(event.payload.chat_id)
      }
    }
  }, [processChatsAdded, processChatsRemoved])

  // ============================================
  // Membership fetch with retry
  // ============================================

  const fetchMembership = useCallback(async () => {
    isFetchingMembershipRef.current = true

    for (let attempt = 0; attempt < MAX_MEMBERSHIP_FETCH_ATTEMPTS; attempt++) {
      try {
        const res = await axiosPrivate.get<ChatMembership[]>(
          '/api/chats/membership',
        )

        const map = chatMembershipRef.current
        map.clear()
        for (const entry of res.data) {
          map.set(entry.chat_id, {
            last_read_at: entry.last_read_at,
            updated_at: entry.updated_at,
          })
        }

        isFetchingMembershipRef.current = false
        setUnreadCount(computeUnreadCount(map))
        drainBuffer()
        wsReadyRef.current = true
        setWsReady(true)
        return
      } catch {
        if (attempt < MAX_MEMBERSHIP_FETCH_ATTEMPTS - 1) {
          const delay = 500 * 2 ** attempt + Math.random() * 500
          await new Promise((r) => setTimeout(r, delay))
        }
      }
    }

    // All retries failed — close WS to trigger reconnect flow
    isFetchingMembershipRef.current = false
    eventBufferRef.current = []
    wsRef.current?.close()
  }, [drainBuffer])

  const sendWsMessage = useCallback((data: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    }
  }, [])

  // ============================================
  // WebSocket connection
  // ============================================

  const connect = useCallback(
    function connect(isPostRefresh = false) {
      const token = getAccessToken()
      const connectionId = crypto.randomUUID()
      const baseUrl = import.meta.env.VITE_BACKEND_BASE_URL || ''
      const wsUrl =
        baseUrl.replace(/^http/, 'ws') +
        `/api/ws/?token=${token}&connection_id=${connectionId}`

      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        if (hasConnectedOnceRef.current) {
          // Reconnect — reset state, queries will re-fire when wsReady flips
          queryClient.invalidateQueries({ queryKey: ['chats'] })
          queryClient.removeQueries({ queryKey: ['messages'] })
          if (currentChatIdRef.current) {
            reconnectHandlerRef.current?.()
            queryClient.invalidateQueries({
              queryKey: ['participants', currentChatIdRef.current],
            })
          }
        }
        hasConnectedOnceRef.current = true
        reconnectAttemptRef.current = 0
        isFailedRef.current = false
        setIsReconnecting(false)
        setIsFailed(false)
      }

      ws.onmessage = async (event) => {
        let parsed: WsEvent
        try {
          parsed = JSON.parse(event.data)
        } catch {
          return
        }

        if (parsed.type === 'ws:ready') {
          fetchMembership()
          return
        }

        // Buffer chats:added/chats:removed during membership fetch
        if (isFetchingMembershipRef.current) {
          if (
            parsed.type === 'chats:added' ||
            parsed.type === 'chats:removed'
          ) {
            eventBufferRef.current.push(parsed)
            return
          }
        }

        // Drop events for chats not in hashmap (except chats:added which adds to hashmap)
        if (parsed.type === 'chats:added') {
          processChatsAdded(parsed.payload.chat_id)
          return
        }

        if (parsed.type === 'chats:removed') {
          processChatsRemoved(parsed.payload.chat_id)
          return
        }

        // For message and read events, check membership
        const chatId = parsed.payload.chat_id
        if (!chatMembershipRef.current.has(chatId)) return

        if (parsed.type === 'messages:new') {
          const message = parsed.payload

          // Update hashmap — only if message is newer than current updated_at
          const entry = chatMembershipRef.current.get(message.chat_id)
          if (entry) {
            if (!entry.updated_at || message.created_at > entry.updated_at) {
              entry.updated_at = message.created_at
            }
            setUnreadCount(computeUnreadCount(chatMembershipRef.current))
          }

          // Update chat preview
          const found = updateChatPreviewOnNewMessage(queryClient, message)
          if (!found) {
            try {
              const res = await axiosPrivate.get(
                `/api/chats/${message.chat_id}`,
              )
              insertChatPreview(queryClient, res.data)
            } catch {
              // If fetch fails, next event for this chat will retry
            }
          }

          // Update messages cache
          updateMessagesCache(queryClient, message.chat_id, message)

          // Notify active chat handler
          if (messageHandlerRef.current?.chatId === message.chat_id) {
            messageHandlerRef.current.handler(parsed)
            sendWsMessage({ type: 'chats:read', chat_id: message.chat_id })
          }
        } else if (parsed.type === 'messages:edit') {
          const payload = parsed.payload

          updateChatPreviewOnEdit(queryClient, payload)
          patchMessageInCache(queryClient, payload.chat_id, payload)

          if (messageHandlerRef.current?.chatId === payload.chat_id) {
            messageHandlerRef.current.handler(parsed)
          }
        } else if (parsed.type === 'messages:delete') {
          const payload = parsed.payload

          updateChatPreviewOnDelete(queryClient, payload)
          patchMessageInCache(queryClient, payload.chat_id, payload)

          if (messageHandlerRef.current?.chatId === payload.chat_id) {
            messageHandlerRef.current.handler(parsed)
          }
        } else if (parsed.type === 'chats:read') {
          const { chat_id, last_read_at } = parsed.payload

          // Update hashmap with MAX logic
          const entry = chatMembershipRef.current.get(chat_id)
          if (entry) {
            const current = entry.last_read_at
            entry.last_read_at =
              current && current > last_read_at ? current : last_read_at
            setUnreadCount(computeUnreadCount(chatMembershipRef.current))
          }

          // Update preview cache
          queryClient.setQueryData<InfiniteData<Chat[]>>(['chats'], (old) => {
            if (!old) return old
            return {
              ...old,
              pages: old.pages.map((page) =>
                page.map((c) => {
                  if (c.id !== chat_id) return c
                  const cur = c.last_read_at
                  return {
                    ...c,
                    last_read_at:
                      cur && cur > last_read_at ? cur : last_read_at,
                  }
                }),
              ),
            }
          })
        }
      }

      ws.onclose = async (event) => {
        wsRef.current = null

        // Reset ws:ready state on disconnect
        wsReadyRef.current = false
        setWsReady(false)
        chatMembershipRef.current.clear()
        eventBufferRef.current = []
        setUnreadCount(0)

        if (!shouldReconnectRef.current) return

        if (event.code === 1008) {
          if (isPostRefresh) {
            logout()
            return
          }
          try {
            const res = await axiosPrivate.post('/api/auth/refresh')
            setAccessToken(res.data.access_token)
            getAuthCallbacks()?.onTokenRefresh(res.data.access_token)
          } catch {
            logout()
            return
          }
          connect(true)
        } else {
          const attempt = reconnectAttemptRef.current

          if (attempt === 0) {
            setIsReconnecting(true)
          }

          if (attempt >= MAX_RECONNECT_ATTEMPTS) {
            isFailedRef.current = true
            setIsReconnecting(false)
            setIsFailed(true)
            return
          }

          const delay =
            Math.min(1000 * 2 ** attempt, 30000) + Math.random() * 1000
          reconnectAttemptRef.current = attempt + 1

          reconnectTimerRef.current = setTimeout(() => {
            if (!shouldReconnectRef.current) return
            connect()
          }, delay)
        }
      }
    },
    [
      logout,
      queryClient,
      fetchMembership,
      processChatsAdded,
      processChatsRemoved,
      sendWsMessage,
    ],
  )

  const reconnect = useCallback(() => {
    shouldReconnectRef.current = true
    reconnectAttemptRef.current = 0
    isFailedRef.current = false
    setIsReconnecting(true)
    setIsFailed(false)
    connect()
  }, [connect])

  const hasAcceptedLegal = !!(
    user?.legal_acceptances.terms && user?.legal_acceptances.privacy_policy
  )

  useEffect(() => {
    if (!user || !hasAcceptedLegal) {
      shouldReconnectRef.current = false
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      wsRef.current?.close()
      wsRef.current = null
      setIsReconnecting(false)
      setIsFailed(false)
      hasConnectedOnceRef.current = false
      reconnectAttemptRef.current = 0
      wsReadyRef.current = false
      setWsReady(false)
      chatMembershipRef.current.clear()
      eventBufferRef.current = []
      setUnreadCount(0)
      return
    }

    shouldReconnectRef.current = true
    connect()

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isFailedRef.current) {
        reconnect()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      shouldReconnectRef.current = false
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      wsRef.current?.close()
      wsRef.current = null
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      setIsReconnecting(false)
      setIsFailed(false)
      wsReadyRef.current = false
      setWsReady(false)
      chatMembershipRef.current.clear()
      eventBufferRef.current = []
      setUnreadCount(0)
    }
  }, [user?.id, hasAcceptedLegal, connect, reconnect])

  return (
    <ChatContext.Provider
      value={{
        registerMessageHandler,
        registerReconnectHandler,
        sendWsMessage,
        isReconnecting,
        isFailed,
        reconnect,
        wsReady,
        unreadCount,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

// ============================================
// Hook
// ============================================

export function useChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}
