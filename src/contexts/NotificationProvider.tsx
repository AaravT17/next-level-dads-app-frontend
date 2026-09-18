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

const BANNERS_STORAGE_KEY = 'nld:banners-enabled'

function readBannerPref(): boolean {
  try {
    const v = localStorage.getItem(BANNERS_STORAGE_KEY)
    return v === null ? true : v === 'true'
  } catch {
    return true
  }
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { user, updateNotificationState } = useAuth()
  const { registerNotificationHandler, sendWsMessage, wsReady } = useChat()

  const [bannersEnabled, setBannersEnabledState] = useState(readBannerPref)

  const setBannersEnabled = useCallback((enabled: boolean) => {
    setBannersEnabledState(enabled)
    try {
      localStorage.setItem(BANNERS_STORAGE_KEY, String(enabled))
    } catch { /* quota exceeded — state still updated in memory */ }
  }, [])

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
      } else if (event.type === 'notifications:community_activity') {
        // A digest is one row updated in place, so there is nothing to splice
        // into the cache -- the server may have opened a row or bumped one that
        // is already there, and only it knows which. Refetch instead.
        //
        // This fires only when a digest is *opened*, not on every post into the
        // community: the backend withholds the event while a member's count is
        // merely climbing. So this is one small refetch per community per visit
        // cycle, not one per post.
        queryClient.invalidateQueries({ queryKey: notificationKeys.list() })
        queryClient.invalidateQueries({ queryKey: notificationKeys.count() })
        // The community cards and nav badge read the same activity watermark.
        queryClient.invalidateQueries({ queryKey: ['user', 'stats'] })
        return // no banner: a digest is something to find later, not to interrupt for
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
    [queryClient, updateNotificationState, user?.id, navigate, bannersEnabled],
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
    <NotificationContext.Provider value={{ unreadCount, markRead, clearAll, bannersEnabled, setBannersEnabled }}>
      {children}
    </NotificationContext.Provider>
  )
}
