import { createContext } from 'react'

export interface NotificationContextType {
  unreadCount: number
  markRead: () => void
  clearAll: () => void
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined)
