import { InfiniteData, QueryClient } from '@tanstack/react-query'
import type { Notification } from '@/types/notifications'
import { notificationKeys } from '@/features/notifications/hooks/notificationKeys'

type NotificationsCache = InfiniteData<Notification[]>

/**
 * Insert a notification into the correct sorted position across all pages
 * (created_at DESC, id DESC). Walks pages from first to last (newest to oldest),
 * within each page from first to last, inserts before the first notification
 * that is older. Deduplicates at the insertion point in the same pass — checks
 * the adjacent element (including across page boundaries).
 *
 * If the notification is older than all loaded data, returns dropped=true so
 * the caller can invalidate instead.
 */
function insertNotificationIntoPages(
  pages: Notification[][],
  notif: Notification,
): { pages: Notification[][]; dropped: boolean } {
  for (let p = 0; p < pages.length; p++) {
    const page = pages[p]
    for (let i = 0; i < page.length; i++) {
      const cur = page[i]
      const insertBefore =
        notif.created_at > cur.created_at ||
        (notif.created_at === cur.created_at && notif.id > cur.id)
      if (insertBefore) {
        // Dedup: a duplicate can only sit immediately before the insertion point
        const prev =
          i > 0 ? page[i - 1] : p > 0 ? pages[p - 1][pages[p - 1].length - 1] : undefined
        if (prev && prev.id === notif.id) return { pages, dropped: false }

        const newPage = [...page]
        newPage.splice(i, 0, notif)
        const newPages = [...pages]
        newPages[p] = newPage
        return { pages: newPages, dropped: false }
      }
    }
  }

  // Notification is older than all loaded data — drop it
  return { pages, dropped: true }
}

/**
 * Insert a notification into the ['notifications', 'list'] infinite cache.
 * Deduplicates in a single pass, invalidates if the notification falls outside
 * the loaded range. Does nothing if the cache doesn't exist.
 */
export function insertNotification(
  queryClient: QueryClient,
  notif: Notification,
): void {
  const data = queryClient.getQueryData<NotificationsCache>(
    notificationKeys.list(),
  )
  if (!data || data.pages.length === 0) return

  const { pages, dropped } = insertNotificationIntoPages(data.pages, notif)

  if (dropped) {
    queryClient.invalidateQueries({ queryKey: notificationKeys.list() })
    return
  }

  queryClient.setQueryData<NotificationsCache>(notificationKeys.list(), {
    ...data,
    pages,
  })
}

/**
 * Clear the notification list cache entirely. Used on "Clear all".
 */
export function clearNotificationsCache(queryClient: QueryClient): void {
  queryClient.removeQueries({ queryKey: notificationKeys.list() })
}
