import axiosPrivate from '@/api/axiosPrivate'
import {
  TIMEOUT_LENGTH_MS,
  FEED_SUGGESTION_POOL_SIZE,
  FEED_SUGGESTED_DADS_POOL_SIZE,
} from '@/config/constants'
import type { Event } from '@/types/events'
import type { Profile } from '@/types/users'

/**
 * Things to suggest between feed posts.
 *
 * Unlike the feed and the resume rail, both of these endpoints exist today —
 * they are the same ones Events and Dads browse with. Suggestions are the
 * first page of each, unfiltered:
 *
 *   /api/events/  is ordered by starts_at, so its first page is the soonest
 *                 events, which is what "suggested" should mean for an event.
 *   /api/users/   is ordered by created_at, so its first page is the newest
 *                 dads — the ones least likely to have been seen already.
 *                 It also returns only dads you have no connection to,
 *                 which is what makes the pool safe to deal out in runs:
 *                 nobody is suggested who has already been asked.
 *
 * Neither endpoint reads the `limit` sent below; both answer with their own
 * page size. It is sent so the request states what the feed actually needs,
 * and so the rails keep their shape if either ever starts honouring it.
 *
 * When the backend grows a real recommender, only these two functions change;
 * the interleave and the cards do not care where the items came from.
 */

export const suggestionsApi = {
  events: async (): Promise<Event[]> => {
    const res = await axiosPrivate.get<Event[]>('/api/events/', {
      params: { limit: FEED_SUGGESTION_POOL_SIZE },
      timeout: TIMEOUT_LENGTH_MS,
    })
    return res.data
  },

  dads: async (): Promise<Profile[]> => {
    const res = await axiosPrivate.get<Profile[]>('/api/users/', {
      params: { limit: FEED_SUGGESTED_DADS_POOL_SIZE },
      timeout: TIMEOUT_LENGTH_MS,
    })
    return res.data
  },
}
