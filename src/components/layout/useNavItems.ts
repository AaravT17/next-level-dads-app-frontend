import { useLocation } from 'react-router-dom'
import { House, UserSearch, Users, CalendarDays, MessageCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ROUTES } from '@/lib/routes'
import { useUnreadChatCount, useUserStats } from '@/hooks/useNavBadges'

/**
 * The primary destinations, defined once.
 *
 * Five places in the app, Home first. The account entry point is deliberately
 * not here — it lives in the header corner as AccountButton, because "you" is
 * not a peer of the places you browse.
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
  // Rides the stats document the shell already loads — no request of its own.
  const { data: stats } = useUserStats()

  return [
    {
      key: 'home',
      label: 'Home',
      to: ROUTES.HOME,
      active: pathname.startsWith('/home'),
      icon: House,
      badge: 0,
    },
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
      label: 'Communities',
      to: ROUTES.GROUPS,
      active: pathname.startsWith('/groups') || pathname.startsWith('/communities'),
      icon: Users,
      badge: stats?.communities_with_new_activity ?? 0,
      badgeLabel: 'communities with new activity',
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
