import { useEffect, useRef, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/useAuth'
import { useChat } from '@/contexts/useChat'
import { useNotification } from '@/contexts/useNotification'
import { useNotifications } from '../hooks/useNotifications'
import { NotificationItem } from './NotificationItem'

export function NotificationPanel({ onClose }: { onClose: () => void }) {
  const { user } = useAuth()
  const { wsReady } = useChat()
  const { markRead, clearAll } = useNotification()
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useNotifications(wsReady)

  // Snapshot the last_read_at at mount time so we can show an unread divider
  // even after markRead() optimistically clears the badge.
  const lastReadAtRef = useRef(user?.notificationState.lastReadAt ?? null)

  // Mark read on mount
  useEffect(() => {
    markRead()
  }, [markRead])

  // Infinite scroll via intersection observer
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const sentinelCallback = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect()
      if (!node) return
      sentinelRef.current = node
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
            fetchNextPage()
          }
        },
        { threshold: 0.1 },
      )
      observerRef.current.observe(node)
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  )

  const allNotifications = data?.pages.flat() ?? []
  const lastReadAt = lastReadAtRef.current

  // Determine if there are any new (unread) notifications to highlight.
  // If lastReadAt is null everything is new but we skip the visual treatment
  // since there's no meaningful boundary to draw.
  const hasNewItems = lastReadAt != null && allNotifications.some((n) => n.created_at > lastReadAt)
  let dividerInserted = false

  return (
    <div className="flex flex-col max-h-[min(28rem,70vh)]">
      {/* Header */}
      <div className="relative flex items-center justify-center px-4 py-3 border-b border-border">
        <h2 className="font-heading text-subhead text-foreground">Notifications</h2>
        {allNotifications.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="absolute right-4 text-caption text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : allNotifications.length === 0 ? (
          <p className="text-center text-caption text-muted-foreground py-12">
            You're all caught up
          </p>
        ) : (
          <>
            {allNotifications.map((notif) => {
              const isNew = hasNewItems && notif.created_at > lastReadAt

              // Draw divider before the first old notification (only when there are new ones above)
              let showDivider = false
              if (hasNewItems && !dividerInserted && !isNew) {
                dividerInserted = true
                showDivider = true
              }

              return (
                <div key={notif.id}>
                  {showDivider && <div className="h-px bg-border" />}
                  <NotificationItem
                    notification={notif}
                    onNavigate={onClose}
                    highlight={isNew}
                  />
                </div>
              )
            })}
            {/* Infinite scroll sentinel */}
            <div ref={sentinelCallback} className="h-1" />
            {isFetchingNextPage && (
              <div className="flex items-center justify-center py-3">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
