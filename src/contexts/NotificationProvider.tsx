import { useEffect, useCallback, useState, ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { NotificationContext } from '@/contexts/NotificationContext'
import { useAuth } from '@/contexts/useAuth'
import { useChat } from '@/contexts/useChat'
import { useUnreadNotificationCount } from '@/features/notifications/hooks/useUnreadNotificationCount'
import { notificationKeys } from '@/features/notifications/hooks/notificationKeys'
import { insertNotification, clearNotificationsCache } from '@/utils/notifications'
import type { WsEvent } from '@/types/chats'
import type { Notification } from '@/types/notifications'

export function NotificationProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const { updateNotificationState } = useAuth()
  const { registerNotificationHandler, sendWsMessage } = useChat()

  const { data: countData } = useUnreadNotificationCount()
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
      } else if (event.type === 'notifications:read') {
        updateNotificationState({ lastReadAt: event.payload.last_read_at })
        queryClient.invalidateQueries({ queryKey: notificationKeys.count() })
        setUnreadCount(0)
      } else if (event.type === 'notifications:cleared') {
        updateNotificationState({
          lastReadAt: event.payload.last_read_at,
          lastClearedAt: event.payload.last_cleared_at,
        })
        clearNotificationsCache(queryClient)
        queryClient.invalidateQueries({ queryKey: notificationKeys.count() })
        setUnreadCount(0)
      }
    },
    [queryClient, updateNotificationState],
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
