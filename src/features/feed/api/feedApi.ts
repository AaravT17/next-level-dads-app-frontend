import axiosPrivate from '@/api/axiosPrivate'
import { TIMEOUT_LENGTH_MS } from '@/config/constants'
import type { Conversation } from '@/types/communities'

/**
 * Cross-community feed.
 *
 *   GET /api/conversations?following=&cursor_id=&cursor_created_at=
 *
 * `following=true` means communities you have joined — the app has no separate
 * follow relationship, so membership is the relationship, and it is the same
 * one /api/users/me/communities exposes.
 *
 * Rows carry `community_name` on top of the usual Conversation shape, so the
 * feed can label a post's source without a lookup per row. Ordering is
 * created_at DESC with id DESC as the tiebreaker, matching the cursor pair, so
 * pagination stays stable when timestamps collide.
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
