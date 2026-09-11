import {
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from 'react'
import { useQueryClient, InfiniteData } from '@tanstack/react-query'
import { ChatContext } from '@/contexts/ChatContext'
import { useAuth } from '@/contexts/useAuth'
import type { Chat, MessageHandler, WsEvent } from '@/types/chats'
import axiosPrivate, {
  getAccessToken,
  setAccessToken,
  getAuthCallbacks,
  refreshAccessToken,
} from '@/api/axiosPrivate'
import {
  updateChatPreviewOnNewMessage,
  insertChatPreview,
  updateChatPreviewOnEdit,
  updateChatPreviewOnDelete,
  updateMessagesCache,
  patchMessageInCache,
} from '@/utils/chats'

// ============================================
// Provider
// ============================================

const MAX_RECONNECT_ATTEMPTS = 5

/** Must match BEARER_SUBPROTOCOL on the server. */
const WS_AUTH_SUBPROTOCOL = 'bearer'

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [isReconnecting, setIsReconnecting] = useState(false)
  const [isFailed, setIsFailed] = useState(false)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttemptRef = useRef<number>(0)
  const hasConnectedOnceRef = useRef<boolean>(false)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const messageHandlerRef = useRef<{ chatId: string; handler: MessageHandler } | null>(null)
  const reconnectHandlerRef = useRef<(() => void) | null>(null)
  const currentChatIdRef = useRef<string | null>(null)
  const shouldReconnectRef = useRef<boolean>(false)
  // Mirrors isFailed for synchronous reads inside the visibilitychange listener
  const isFailedRef = useRef<boolean>(false)

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

  const logout = useCallback(() => {
    shouldReconnectRef.current = false
    setAccessToken(null)
    getAuthCallbacks()?.onAuthFailure()
  }, [])

  const sendWsMessage = useCallback((data: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    }
  }, [])

  const connect = useCallback(function connect(isPostRefresh = false) {
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
    const ws = new WebSocket(wsUrl, [WS_AUTH_SUBPROTOCOL, token || 'missing'])
    wsRef.current = ws

    ws.onopen = () => {
      if (hasConnectedOnceRef.current) {
        queryClient.invalidateQueries({ queryKey: ['chats'] })
        if (currentChatIdRef.current) {
          reconnectHandlerRef.current?.()
          queryClient.invalidateQueries({ queryKey: ['chats', currentChatIdRef.current] })
          queryClient.invalidateQueries({ queryKey: ['messages', currentChatIdRef.current] })
          queryClient.invalidateQueries({ queryKey: ['participants', currentChatIdRef.current] })
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

      if (parsed.type === 'messages:new') {
        const message = parsed.payload

        const found = updateChatPreviewOnNewMessage(queryClient, message)
        if (!found) {
          try {
            const res = await axiosPrivate.get(`/api/chats/${message.chat_id}`)
            insertChatPreview(queryClient, res.data)
          } catch {
            // If fetch fails, cache will be refreshed on next visit to Chats
          }
        }

        updateMessagesCache(queryClient, message.chat_id, message)

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
        queryClient.setQueryData<InfiniteData<Chat[]>>(['chats'], (old) => {
          if (!old) return old
          return {
            ...old,
            pages: old.pages.map((page) =>
              page.map((c) => {
                if (c.id !== chat_id) return c
                const current = c.last_read_at
                return { ...c, last_read_at: current && current > last_read_at ? current : last_read_at }
              }),
            ),
          }
        })
      }
    }

    ws.onclose = async (event) => {
      wsRef.current = null
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
  }, [logout, queryClient, sendWsMessage])

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
    }
  }, [userId, hasAcceptedLegal, connect, reconnect])

  return (
    <ChatContext.Provider value={{ registerMessageHandler, registerReconnectHandler, sendWsMessage, isReconnecting, isFailed, reconnect }}>
      {children}
    </ChatContext.Provider>
  )
}

