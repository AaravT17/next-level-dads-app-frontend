import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { UserAvatar } from '@/components/media/UserAvatar'
import { formatRelative } from '@/utils/format'
import { dadDetail, chat, communityDetail } from '@/lib/routes'
import type { Notification } from '@/types/notifications'

function getDisplay(notif: Notification): {
  name: string
  avatarUrl: string | null
  isGroup?: boolean
  text: React.ReactNode
  href: string
} {
  const p = notif.payload
  switch (notif.type) {
    case 'connection_request':
      return {
        name: p.from_name as string,
        avatarUrl: (p.from_avatar_url as string) ?? null,
        text: (
          <>
            <strong>{p.from_name as string}</strong> sent you a connection request
          </>
        ),
        href: dadDetail(p.from_id as string),
      }
    case 'connection_accepted':
      return {
        name: p.by_name as string,
        avatarUrl: (p.by_avatar_url as string) ?? null,
        text: (
          <>
            <strong>{p.by_name as string}</strong> accepted your connection request
          </>
        ),
        href: dadDetail(p.by_id as string),
      }
    case 'chat_added':
      return {
        name: p.chat_name as string,
        avatarUrl: (p.chat_avatar_url as string) ?? null,
        isGroup: true,
        text: (
          <>
            <strong>{p.added_by_name as string}</strong> added you to{' '}
            <strong>{p.chat_name as string}</strong>
          </>
        ),
        href: chat(p.chat_id as string),
      }
    case 'community_activity': {
      // The count is the whole point of a digest -- it is one row that has been
      // updated in place since the last visit, not one row per post.
      const count = (p.count as number) ?? 1
      return {
        name: p.community_name as string,
        avatarUrl: (p.community_image_url as string) ?? null,
        isGroup: true,
        text: (
          <>
            {count} new {count === 1 ? 'conversation' : 'conversations'} in{' '}
            <strong>{p.community_name as string}</strong>
          </>
        ),
        href: communityDetail(p.community_id as string),
      }
    }
    default: {
      const _exhaustive: never = notif.type
      throw new Error(`Unknown notification type: ${_exhaustive}`)
    }
  }
}

export function NotificationItem({
  notification,
  onNavigate,
  highlight = false,
}: {
  notification: Notification
  onNavigate: () => void
  highlight?: boolean
}) {
  const navigate = useNavigate()
  const { name, avatarUrl, isGroup, text, href } = getDisplay(notification)

  const handleClick = () => {
    onNavigate()
    navigate(href)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'flex items-center gap-3 w-full px-4 py-3 text-left transition-colors',
        highlight
          ? 'bg-muted/40 shadow-[inset_4px_0_0_hsl(var(--primary))] hover:bg-muted/60'
          : 'hover:bg-muted/50',
      )}
    >
      <UserAvatar name={name} src={avatarUrl} size="xs" showInitials={!isGroup} />
      <p className="flex-1 min-w-0 text-caption text-foreground leading-snug">{text}</p>
      <span className="shrink-0 text-[0.6875rem] text-muted-foreground">
        {formatRelative(notification.created_at)}
      </span>
    </button>
  )
}
