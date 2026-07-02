import type { QueryClient } from '@tanstack/react-query'
import { moderationKeys } from './moderationKeys'

// Moderation runs asynchronously right after a post, finishing in ~1-2s. Rather
// than wait for the slow background poll, probe the notifications endpoint a few
// times immediately after posting so a removal surfaces within a couple seconds.
const PROBE_DELAYS_MS = [700, 1800, 3500, 6000, 9000]

/**
 * Trigger a short burst of moderation-notification refetches. Call from the
 * `onSuccess` of any content-create mutation. The global poller (mounted via
 * `ModerationNotifier`) owns the resulting toasts and content invalidation.
 */
export function scheduleModerationCheck(queryClient: QueryClient): void {
  for (const delay of PROBE_DELAYS_MS) {
    setTimeout(() => {
      void queryClient.refetchQueries({
        queryKey: moderationKeys.notifications(true),
      })
    }, delay)
  }
}
