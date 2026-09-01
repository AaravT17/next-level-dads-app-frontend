import axiosPrivate from '@/api/axiosPrivate'
import { TIMEOUT_LENGTH_MS, RESUME_PAGE_LIMIT } from '@/config/constants'
import type { Conversation } from '@/types/communities'

/**
 * "Get back into it" — conversations you have a stake in.
 *
 *   GET /api/users/me/conversations?limit=
 *
 * Returns threads you authored, replied in, or hearted, most recently active
 * first. Ordering is by the thread's activity rather than by when you acted:
 * the point is what moved since you last looked, so a thread you posted in a
 * month ago belongs at the top if it got a reply this morning.
 *
 * `reason` says why a thread is here, with precedence
 * authored > replied > hearted. ResumeRail renders it verbatim, so adding a
 * reason server-side means adding a copy string there too.
 *
 * `unseen_reply_count` is other people's messages added since your own last
 * action on the thread. Zero is valid and means the card shows the reason
 * alone. It applies the same moderation visibility as reply_count, so a card
 * cannot promise more replies than the thread will actually show.
 *
 * Not paginated: the rail is a fixed shelf, and the feed below it is the
 * browse surface. The server caps `limit` at RESUME_PAGE_LIMIT.
 */

/** Why a conversation earned a place in the rail. */
export type ResumeReason = 'authored' | 'replied' | 'hearted'

/** A rail card: a conversation, its community, and your stake in it. */
export interface ResumeConversation extends Conversation {
  community_name: string
  reason: ResumeReason
  unseen_reply_count: number
}

export const resumeApi = {
  list: async (): Promise<ResumeConversation[]> => {
    const res = await axiosPrivate.get<ResumeConversation[]>('/api/users/me/conversations', {
      params: { limit: RESUME_PAGE_LIMIT },
      timeout: TIMEOUT_LENGTH_MS,
    })
    return res.data
  },
}
