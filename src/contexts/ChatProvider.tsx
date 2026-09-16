import { useEffect, useRef, useState, useCallback, ReactNode } from 'react'
import { useQueryClient, InfiniteData } from '@tanstack/react-query'
import { ChatContext } from '@/contexts/ChatContext'
import { useAuth } from '@/contexts/useAuth'
import type { Chat, ChatMembership, MessageHandler, NotificationEventHandler, WsEvent } from '@/types/chats'
import axiosPrivate, {
  getAccessToken,
  setAccessToken,
  getAuthCallbacks,
  refreshAccessToken,
} from '@/api/axiosPrivate'
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
// Helpers
// ============================================

type MembershipMap = Map<string, { last_read_at: string | null; updated_at: string | null }>

// TODO: optimize — instead of iterating the full map on every event, track
// incremental changes per-chat (check if unread status flipped, +1 or -1).
function computeUnreadCount(map: MembershipMap): number {
  let count = 0
  for (const [, entry] of map) {
    if (entry.last_read_at === null || (entry.updated_at ?? '') > entry.last_read_at) {
      count++
    }
  }
  return count
}

// ============================================
// Provider
// ============================================

// TODO: Extract WebSocket transport into a dedicated WsProvider.
//
// Currently ChatProvider owns the socket and all domain providers (notifications,
// and eventually others) register handlers here to receive events. The end-state
// architecture should be:
//
//   WsProvider          — owns the socket, exposes event registration
//   ├─ ChatProvider     — subscribes to chat events (messages:*, chats:*)
//   ├─ NotificationProvider — subscribes to notification events (connections:*, notifications:*)
//   └─ (future providers)
//
// Each individual chat page would register with ChatProvider, and ChatProvider
// would call those handlers for chat-specific events — same pattern at every level.
// Events flow down: socket → domain provider → individual component.
//
// For now this is too large a refactor to take on alongside the notification
// feature, so ChatProvider keeps the socket and NotificationProvider hooks into
// it via registerNotificationHandler.

const MAX_RECONNECT_ATTEMPTS = 5
const MAX_MEMBERSHIP_FETCH_ATTEMPTS = 3

/** Must match BEARER_SUBPROTOCOL on the server. */
const WS_AUTH_SUBPROTOCOL = 'bearer'

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
  const messageHandlerRef = useRef<{ chatId: string; handler: MessageHandler } | null>(null)
  const reconnectHandlerRef = useRef<(() => void) | null>(null)
  const notificationHandlerRef = useRef<NotificationEventHandler | null>(null)
  const currentChatIdRef = useRef<string | null>(null)
  const shouldReconnectRef = useRef<boolean>(false)
  // Mirrors isFailed for synchronous reads inside the visibilitychange listener
  const isFailedRef = useRef<boolean>(false)

  // Chat membership hashmap — source of truth for which chats the user is in + unread state
  const chatMembershipRef = useRef<MembershipMap>(new Map())
  const wsReadyRef = useRef<boolean>(false)
  const isFetchingMembershipRef = useRef<boolean>(false)
  const eventBufferRef = useRef<WsEvent[]>([])

  const registerMessageHandler = useCallback((chatId: string, handler: MessageHandler) => {
    messageHandlerRef.current = { chatId, handler }
    currentChatIdRef.current = chatId
    return () => {
      messageHandlerRef.current = null
      currentChatIdRef.current = null
    }
  }, [])

  const registerReconnectHandler = useCallback((handler: () => void) => {
    reconnectHandlerRef.current = handler
    return () => {
      reconnectHandlerRef.current = null
    }
  }, [])

  const registerNotificationHandler = useCallback((handler: NotificationEventHandler) => {
    notificationHandlerRef.current = handler
    return () => {
      notificationHandlerRef.current = null
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
        const res = await axiosPrivate.get<ChatMembership[]>('/api/chats/membership')

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

  const isChatMember = useCallback((chatId: string) => {
    return chatMembershipRef.current.has(chatId)
  }, [])

  // ============================================
  // WebSocket connection
  // ============================================

  const connect = useCallback(
    function connect(isPostRefresh = false) {
      const token = getAccessToken()
      const baseUrl = import.meta.env.VITE_BACKEND_BASE_URL || ''
      const wsUrl = baseUrl.replace(/^http/, 'ws') + '/api/ws/'

      // The token goes in the subprotocol, not the query string. A WebSocket
      // handshake is an HTTP GET, so a token in the URL is written to every
      // access log between here and the server; `Sec-WebSocket-Protocol` is a
      // header, and it is the only one the browser's WebSocket API lets us set.
      // The server echoes back 'bearer', which RFC 6455 requires it to do.
      // A missing token still opens the socket, so the server rejects it and the
      // onclose 1008 path refreshes and retries -- the same route an expired
      // token takes. The sentinel exists because the browser throws on an empty
      // subprotocol value; a real JWT is always subprotocol-safe, being base64url
      // segments joined by dots.
      //
      // There is no connection id here either: the server generates one, so two
      // sockets can never collide on a client-chosen key.
      const ws = new WebSocket(wsUrl, [WS_AUTH_SUBPROTOCOL, token || 'missing'])
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
          if (parsed.type === 'chats:added' || parsed.type === 'chats:removed') {
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

        // Forward notification-domain events to the notification handler
        if (
          parsed.type === 'connections:request' ||
          parsed.type === 'connections:accepted' ||
          parsed.type === 'notifications:read' ||
          parsed.type === 'notifications:cleared'
        ) {
          notificationHandlerRef.current?.(parsed)
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
              const res = await axiosPrivate.get(`/api/chats/${message.chat_id}`)
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
            entry.last_read_at = current && current > last_read_at ? current : last_read_at
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
                  return { ...c, last_read_at: cur && cur > last_read_at ? cur : last_read_at }
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
            // Refresh succeeded but reconnect still got 1008 — log out
            logout()
            return
          }
          // Auth failure — refresh token then reconnect immediately.
          // Shares the interceptor's in-flight refresh: posting to /auth/refresh
          // here too would race it for a refresh token only one of them can
          // spend, and the loser logs the user out.
          try {
            await refreshAccessToken()
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

          const delay = Math.min(1000 * 2 ** attempt, 30000) + Math.random() * 1000
          reconnectAttemptRef.current = attempt + 1

          reconnectTimerRef.current = setTimeout(() => {
            if (!shouldReconnectRef.current) return
            connect()
          }, delay)
        }
      }
    },
    [logout, queryClient, fetchMembership, processChatsAdded, processChatsRemoved, sendWsMessage],
  )

  const reconnect = useCallback(() => {
    shouldReconnectRef.current = true
    reconnectAttemptRef.current = 0
    isFailedRef.current = false
    setIsReconnecting(true)
    setIsFailed(false)
    connect()
  }, [connect])

  // The socket keys on identity, not on the user object.
  //
  // The dep list already said `user?.id` deliberately: a profile save replaces
  // the user object, and depending on it would tear down and reconnect a live
  // socket every time someone edited their bio. The guard below now reads the
  // same id, so what the effect uses and what it depends on finally agree —
  // userId is falsy in exactly the cases `!user` was.
  const userId = user?.id
  const hasAcceptedLegal = !!(
    user?.legal_acceptances.terms && user?.legal_acceptances.privacy_policy
  )

  useEffect(() => {
    if (!userId || !hasAcceptedLegal) {
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

    // Captured for the cleanup below. The Map is created once and never
    // reassigned, so this is the same object either way -- it just lets the
    // exhaustive-deps rule see that, instead of warning about a ref read at
    // teardown time.
    const membership = chatMembershipRef.current

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
      membership.clear()
      eventBufferRef.current = []
      setUnreadCount(0)
    }
  }, [userId, hasAcceptedLegal, connect, reconnect])

  return (
    <ChatContext.Provider
      value={{
        registerMessageHandler,
        registerReconnectHandler,
        registerNotificationHandler,
        sendWsMessage,
        isChatMember,
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
