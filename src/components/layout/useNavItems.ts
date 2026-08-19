import { useLocation } from 'react-router-dom'
import { UserSearch, Users, MessageCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ROUTES } from '@/lib/routes'
import { useUnreadChatCount, usePendingRequestCount } from '@/hooks/useNavBadges'

/**
 * The primary destinations, defined once.
 *
 * Both the bottom bar (mobile) and the side rail (desktop) render from this,
 * so the two navigations cannot drift apart.
 */

export type NavItem = {
  key: string
  label: string
  to: string
  active: boolean
  /** 'avatar' renders the user's own picture instead of a glyph. */
  kind: 'icon' | 'avatar'
  icon: LucideIcon | null
  badge: number
  badgeLabel?: string
}

export function useNavItems(): NavItem[] {
  const { pathname } = useLocation()
  const unread = useUnreadChatCount()
  const pendingRequests = usePendingRequestCount()

  return [
    {
      key: 'dads',
      label: 'Dads',
      to: ROUTES.DADS,
      active: pathname.startsWith('/dads'),
      kind: 'icon',
      icon: UserSearch,
      badge: 0,
    },
    {
      key: 'groups',
      label: 'Groups',
      to: ROUTES.GROUPS_COMMUNITIES,
      active:
        pathname.startsWith('/groups') ||
        pathname.startsWith('/communities') ||
        pathname.startsWith('/events'),
      kind: 'icon',
      icon: Users,
      badge: 0,
    },
    {
      key: 'chats',
      label: 'Chats',
      to: ROUTES.CHATS,
      active: pathname.startsWith('/chats'),
      kind: 'icon',
      icon: MessageCircle,
      badge: unread,
      badgeLabel: 'unread conversations',
    },
    {
      key: 'you',
      label: 'You',
      to: ROUTES.YOU,
      active: pathname.startsWith('/you'),
      kind: 'avatar',
      icon: null,
      badge: pendingRequests,
      badgeLabel: 'pending connection requests',
    },
  ]
}
