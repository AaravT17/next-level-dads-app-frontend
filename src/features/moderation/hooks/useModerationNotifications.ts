import { useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import type { ModerationNotification } from '@/types/moderation'
import { moderationApi } from '../api/moderationApi'
import { moderationKeys } from './moderationKeys'

const POLL_INTERVAL_MS = 20_000
const BAN_TOAST_DURATION_MS = 12_000

// Community content queries to refresh when something gets removed, so the
// deleted item disappears for the author without a manual reload.
const CONTENT_QUERY_PREFIXES = [
  ['community-conversations'],
  ['conversation'],
  ['conversation-messages'],
  ['message-replies'],
] as const

function showToast(notification: ModerationNotification) {
  if (notification.type === 'temporary_ban') {
    toast.error(notification.message, { duration: BAN_TOAST_DURATION_MS })
  } else {
    toast.warning(notification.message)
  }
}

/**
 * Polls for moderation outcomes (content removed / temporary ban) and surfaces
 * each new one as a toast exactly once, then marks it read. Mounted once near
 * the app root via `ModerationNotifier`.
 */
export function useModerationNotifications() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const handledIds = useRef<Set<string>>(new Set())

  // Forget handled ids if the signed-in user changes.
  useEffect(() => {
    handledIds.current = new Set()
  }, [user?.id])

  const { data } = useQuery({
    queryKey: moderationKeys.notifications(true),
    queryFn: () => moderationApi.getNotifications(true),
    enabled: !!user,
    refetchInterval: user ? POLL_INTERVAL_MS : false,
    refetchOnWindowFocus: true,
  })

  useEffect(() => {
    if (!data || data.length === 0) return

    const fresh = data.filter((n) => !handledIds.current.has(n.id))
    if (fresh.length === 0) return

    let contentWasRemoved = false
    for (const notification of fresh) {
      handledIds.current.add(notification.id)
      showToast(notification)
      if (notification.type === 'content_removed') contentWasRemoved = true
      // Fire-and-forget; the next poll reflects the read state.
      moderationApi.markNotificationRead(notification.id).catch(() => {})
    }

    if (contentWasRemoved) {
      for (const prefix of CONTENT_QUERY_PREFIXES) {
        queryClient.invalidateQueries({ queryKey: prefix })
      }
    }
  }, [data, queryClient])
}
