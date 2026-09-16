import { useEffect, useCallback, useState, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { NotificationContext } from '@/contexts/NotificationContext'
import { useAuth } from '@/contexts/useAuth'
import { useChat } from '@/contexts/useChat'
import { useUnreadNotificationCount } from '@/features/notifications/hooks/useUnreadNotificationCount'
import { notificationKeys } from '@/features/notifications/hooks/notificationKeys'
import { insertNotification, clearNotificationsCache } from '@/utils/notifications'
import { showBanner } from '@/utils/banners'
import type { WsEvent } from '@/types/chats'
import type { Notification } from '@/types/notifications'

// Step 10 will wire this to localStorage + a settings toggle.
// For now, banners are enabled by default.
const bannersEnabled = true

export function NotificationProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { user, updateNotificationState } = useAuth()
  const { registerNotificationHandler, sendWsMessage, wsReady } = useChat()

  const { data: countData } = useUnreadNotificationCount(wsReady)
  const [unreadCount, setUnreadCount] = useState(0)

  // Sync initial count from server
  useEffect(() => {
    if (countData !== undefined) {
      setUnreadCount(countData.count)
    }
  }, [countData])

  const handleEvent = useCallback(
    (event: WsEvent) => {
      if (event.type === 'connections:request') {
        const { notification_id, notification_created_at, ...rest } = event.payload
        if (notification_id && notification_created_at) {
          const notif: Notification = {
            id: notification_id,
            type: 'connection_request',
            payload: rest,
            created_at: notification_created_at,
          }
          insertNotification(queryClient, notif)
          setUnreadCount((c) => c + 1)
        }
        queryClient.invalidateQueries({ queryKey: ['connections', 'requests'] })
        queryClient.invalidateQueries({ queryKey: ['user', 'stats'] })
      } else if (event.type === 'connections:accepted') {
        const { notification_id, notification_created_at, ...rest } = event.payload
        if (notification_id && notification_created_at) {
          const notif: Notification = {
            id: notification_id,
            type: 'connection_accepted',
            payload: rest,
            created_at: notification_created_at,
          }
          insertNotification(queryClient, notif)
          setUnreadCount((c) => c + 1)
        }
        queryClient.invalidateQueries({ queryKey: ['connections'] })
        queryClient.invalidateQueries({ queryKey: ['user', 'stats'] })
        queryClient.invalidateQueries({ queryKey: ['dads'] })
      } else if (event.type === 'chats:added') {
        const { added_by, chat_type, notification_id, notification_created_at, ...rest } = event.payload
        // DMs are handled entirely by ChatProvider (hashmap + preview)
        if (chat_type === 'dm') return
        // Own action — no notification centre entry or banner
        if (added_by === user?.id) return
        // Insert into notification centre only if notification was persisted
        if (notification_id && notification_created_at) {
          const notif: Notification = {
            id: notification_id,
            type: 'chat_added',
            payload: { ...rest, added_by, chat_type },
            created_at: notification_created_at,
          }
          insertNotification(queryClient, notif)
          setUnreadCount((c) => c + 1)
        }
      } else if (event.type === 'notifications:read') {
        updateNotificationState({ lastReadAt: event.payload.last_read_at })
        queryClient.invalidateQueries({ queryKey: notificationKeys.count() })
        setUnreadCount(0)
        return // no banner
      } else if (event.type === 'notifications:cleared') {
        updateNotificationState({
          lastReadAt: event.payload.last_read_at,
          lastClearedAt: event.payload.last_cleared_at,
        })
        clearNotificationsCache(queryClient)
        queryClient.invalidateQueries({ queryKey: notificationKeys.count() })
        setUnreadCount(0)
        return // no banner
      }

      // Show banner for actionable events (messages:new, connections, chats:added)
      if (bannersEnabled) {
        showBanner(event, user?.id, navigate)
      }
    },
    [queryClient, updateNotificationState, user?.id, navigate],
  )

  useEffect(() => {
    return registerNotificationHandler(handleEvent)
  }, [registerNotificationHandler, handleEvent])

  const markRead = useCallback(() => {
    setUnreadCount(0)
    sendWsMessage({ type: 'notifications:read' })
  }, [sendWsMessage])

  const clearAll = useCallback(() => {
    setUnreadCount(0)
    clearNotificationsCache(queryClient)
    sendWsMessage({ type: 'notifications:cleared' })
  }, [sendWsMessage, queryClient])

  return (
    <NotificationContext.Provider value={{ unreadCount, markRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  )
}
