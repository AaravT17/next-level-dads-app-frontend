import { toast } from 'sonner'
import { BANNER_DISMISS_MS } from '@/config/constants'
import { chat as chatRoute, dadDetail } from '@/lib/routes'
import { BannerCard } from '@/features/notifications/components/BannerToast'
import type { BannerData } from '@/features/notifications/components/BannerToast'
import type { WsEvent } from '@/types/chats'

// Keyed by stable chat key (e.g. "chat:123").
const chatMessageCounts = new Map<string, number>()
// Tracks the currently visible toast id per chat — used to dismiss the old one
// and to guard against stale onDismiss callbacks resetting the count.
const chatCurrentToastId = new Map<string, string>()

function extractBannerData(event: WsEvent, userId: string | undefined): BannerData | null {
  if (event.type === 'messages:new') {
    const p = event.payload
    if (p.sender_id === userId) return null
    if (p.is_deleted) return null

    const isDm = p.chat_type === 'dm'
    const title = isDm ? p.sender_name : (p.chat_name ?? p.sender_name)
    const senderFirst = p.sender_name.split(' ')[0]

    return {
      title,
      body: p.content,
      boldPrefix: isDm ? undefined : `${senderFirst}:`,
      avatarName: isDm ? p.sender_name : (p.chat_name ?? 'Group'),
      avatarUrl: isDm ? p.sender_avatar_url : p.chat_avatar_url,
      isGroup: !isDm,
      href: chatRoute(p.chat_id),
      toastId: `chat:${p.chat_id}`,
    }
  }

  if (event.type === 'connections:request') {
    const p = event.payload
    return {
      title: 'Connection Request',
      boldPrefix: p.from_name,
      body: 'sent you a connection request',
      avatarName: p.from_name,
      avatarUrl: p.from_avatar_url,
      href: dadDetail(p.from_id),
    }
  }

  if (event.type === 'connections:accepted') {
    const p = event.payload
    return {
      title: 'New Connection',
      boldPrefix: p.by_name,
      body: 'accepted your connection request',
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
      body: 'added you',
      boldPrefix: p.added_by_name,
      avatarName: p.chat_name ?? 'Group',
      avatarUrl: p.chat_avatar_url,
      isGroup: true,
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

  const chatKey = data.toastId // stable key, e.g. "chat:123"

  // For non-chat events there's no chatKey — use a simple unique id.
  if (!chatKey) {
    const id = `banner:${Date.now()}`
    toast.custom(
      (t) => (
        <BannerCard
          data={data}
          onDismiss={() => toast.dismiss(t)}
          onClick={() => { toast.dismiss(t); navigate(data.href) }}
        />
      ),
      { id, position: 'top-center', duration: BANNER_DISMISS_MS, unstyled: true },
    )
    return
  }

  const count = (chatMessageCounts.get(chatKey) ?? 0) + 1
  chatMessageCounts.set(chatKey, count)
  if (count > 1) {
    data.body = `${count} new messages`
    data.boldPrefix = undefined
  }

  // New unique id each burst — avoids the same-id dismiss+recreate conflict in sonner.
  // The old toast is dismissed by its previous id (different id = no conflict).
  const newToastId = `${chatKey}:${count}`
  const oldToastId = chatCurrentToastId.get(chatKey)

  // Update the current id BEFORE dismissing so the old toast's onDismiss
  // sees a stale id and skips the count reset.
  chatCurrentToastId.set(chatKey, newToastId)
  if (oldToastId) toast.dismiss(oldToastId)

  const resetCount = () => {
    // Only reset if this toast is still the active one for this chat.
    if (chatCurrentToastId.get(chatKey) === newToastId) {
      chatMessageCounts.delete(chatKey)
      chatCurrentToastId.delete(chatKey)
    }
  }

  toast.custom(
    (t) => (
      <BannerCard
        data={data}
        onDismiss={() => { resetCount(); toast.dismiss(t) }}
        onClick={() => {
          resetCount()
          toast.dismiss(t)
          navigate(data.href)
        }}
      />
    ),
    {
      id: newToastId,
      position: 'top-center',
      duration: BANNER_DISMISS_MS,
      unstyled: true,
      onDismiss: resetCount,
      onAutoClose: resetCount,
    },
  )
}
