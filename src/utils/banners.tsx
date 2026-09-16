import { toast } from 'sonner'
import { BANNER_DISMISS_MS } from '@/config/constants'
import { chat as chatRoute, dadDetail } from '@/lib/routes'
import { BannerCard } from '@/features/notifications/components/BannerToast'
import type { BannerData } from '@/features/notifications/components/BannerToast'
import type { WsEvent } from '@/types/chats'

function extractBannerData(event: WsEvent, userId: string | undefined): BannerData | null {
  if (event.type === 'messages:new') {
    const p = event.payload
    if (p.sender_id === userId) return null
    if (p.is_deleted) return null

    const isDm = p.chat_type === 'dm'
    const title = isDm ? p.sender_name : (p.chat_name ?? p.sender_name)
    const body = isDm ? p.content : `${p.sender_name.split(' ')[0]}: ${p.content}`

    return {
      title,
      body,
      avatarName: isDm ? p.sender_name : (p.chat_name ?? 'Group'),
      avatarUrl: isDm ? p.sender_avatar_url : p.chat_avatar_url,
      href: chatRoute(p.chat_id),
      toastId: `chat:${p.chat_id}`,
    }
  }

  if (event.type === 'connections:request') {
    const p = event.payload
    return {
      title: 'Connection Request',
      body: `${p.from_name} sent you a connection request`,
      avatarName: p.from_name,
      avatarUrl: p.from_avatar_url,
      href: dadDetail(p.from_id),
    }
  }

  if (event.type === 'connections:accepted') {
    const p = event.payload
    return {
      title: 'New Connection',
      body: `${p.by_name} accepted your connection request`,
      avatarName: p.by_name,
      avatarUrl: p.by_avatar_url,
      href: dadDetail(p.by_id),
    }
  }

  if (event.type === 'chats:added') {
    const p = event.payload
    if (p.chat_type === 'dm') return null
    if (p.added_by === userId) return null
    return {
      title: p.chat_name ?? 'Group Chat',
      body: `${p.added_by_name} added you`,
      avatarName: p.chat_name ?? 'Group',
      avatarUrl: p.chat_avatar_url,
      href: chatRoute(p.chat_id),
    }
  }

  return null
}

export function showBanner(
  event: WsEvent,
  userId: string | undefined,
  navigate: (href: string) => void,
): void {
  const data = extractBannerData(event, userId)
  if (!data) return

  const id = data.toastId

  // For message bursts: dismiss the old toast first so the recreated one
  // appears at the front of the stack.
  if (id) toast.dismiss(id)

  toast.custom(
    (t) => (
      <BannerCard
        data={data}
        onDismiss={() => toast.dismiss(t)}
        onClick={() => {
          toast.dismiss(t)
          navigate(data.href)
        }}
      />
    ),
    { id, position: 'top-center', duration: BANNER_DISMISS_MS, unstyled: true },
  )
}
