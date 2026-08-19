import axiosPrivate from '@/api/axiosPrivate'
import { TIMEOUT_LENGTH_MS } from '@/config/constants'
import type { Conversation } from '@/types/communities'

/**
 * Cross-community feed.
 *
 * ────────────────────────────────────────────────────────────────────────
 * BACKEND CONTRACT — not implemented yet.
 *
 *   GET /api/conversations
 *
 *   Query params
 *     following          "true" | "false"   (default "false")
 *                        false → posts from every community
 *                        true  → posts only from communities the caller has
 *                                joined, i.e. the same membership the
 *                                /api/users/me/communities list uses
 *     cursor_id          string             opaque, from the last item
 *     cursor_created_at  ISO-8601 string    from the last item
 *
 *   Response: FeedConversation[]
 *     Every field of the existing Conversation shape (see
 *     types/communities.ts) plus `community_name`, so the feed can label
 *     which community a post came from without an extra lookup per row.
 *
 *   Ordering: created_at DESC, id DESC as the tiebreaker — matching the
 *   cursor pair above, so pagination is stable when timestamps collide.
 *
 *   Page size: CONVERSATIONS_PAGE_LIMIT (see config/constants.ts).
 *
 *   Moderation: exclude removed posts, and set has_pending_report the same
 *   way the per-community conversation list already does — the feed reuses
 *   ConversationCard, which gates on that flag.
 *
 * Until this ships the feed renders its normal error state with a retry, so
 * nothing here is throwaway.
 * ────────────────────────────────────────────────────────────────────────
 */

/** A feed row: a conversation plus the community it belongs to. */
export interface FeedConversation extends Conversation {
  community_name: string
}

export interface FeedCursor {
  cursor_id: string
  cursor_created_at: string
}

export const feedApi = {
  list: async (
    following: boolean,
    cursor?: FeedCursor,
  ): Promise<FeedConversation[]> => {
    const params = new URLSearchParams()
    params.append('following', String(following))
    if (cursor) {
      params.append('cursor_id', cursor.cursor_id)
      params.append('cursor_created_at', cursor.cursor_created_at)
    }
    const res = await axiosPrivate.get<FeedConversation[]>('/api/conversations', {
      params,
      timeout: TIMEOUT_LENGTH_MS,
    })
    return res.data
  },
}
