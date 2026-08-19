import { useLocation } from 'react-router-dom'
import { UserSearch, Users, CalendarDays, MessageCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ROUTES } from '@/lib/routes'
import { useUnreadChatCount } from '@/hooks/useNavBadges'

/**
 * The primary destinations, defined once.
 *
 * Four places in the app. The account entry point is deliberately not here —
 * it lives in the header corner as AccountButton, because "you" is not a peer
 * of the places you browse.
 *
 * Both the bottom bar (mobile) and the side rail (desktop) render from this,
 * so the two navigations cannot drift apart.
 */

export type NavItem = {
  key: string
  label: string
  to: string
  active: boolean
  icon: LucideIcon
  badge: number
  badgeLabel?: string
}

export function useNavItems(): NavItem[] {
  const { pathname } = useLocation()
  const unread = useUnreadChatCount()

  return [
    {
      key: 'dads',
      label: 'Dads',
      to: ROUTES.DADS,
      active: pathname.startsWith('/dads'),
      icon: UserSearch,
      badge: 0,
    },
    {
      key: 'groups',
      label: 'Groups',
      to: ROUTES.GROUPS_FEED,
      active: pathname.startsWith('/groups') || pathname.startsWith('/communities'),
      icon: Users,
      badge: 0,
    },
    {
      key: 'events',
      label: 'Events',
      to: ROUTES.EVENTS,
      active: pathname.startsWith('/events'),
      icon: CalendarDays,
      badge: 0,
    },
    {
      key: 'chats',
      label: 'Chats',
      to: ROUTES.CHATS,
      active: pathname.startsWith('/chats'),
      icon: MessageCircle,
      badge: unread,
      badgeLabel: 'unread conversations',
    },
  ]
}
