import {
  FEED_SUGGESTION_INTERVAL,
  FEED_SUGGESTED_DADS_PER_RAIL,
} from '@/config/constants'
import type { Event } from '@/types/events'
import type { Profile } from '@/types/users'
import type { FeedConversation } from '../api/feedApi'

/**
 * Weaving suggestions into the feed.
 *
 * Kept as a pure function of (posts, events, dads) rather than something the
 * component does while mapping, for two reasons: the placement rule is the
 * part worth reading on its own, and a pure function stays stable across the
 * re-renders an infinite list does constantly. Feeding it the same arrays
 * gives the same rows, so a suggestion never hops position mid-scroll.
 */

export type FeedRow =
  | { kind: 'post'; key: string; post: FeedConversation }
  | { kind: 'event'; key: string; event: Event }
  | { kind: 'dads'; key: string; dads: Profile[] }

/**
 * One suggestion after every FEED_SUGGESTION_INTERVAL posts, alternating
 * event then dads. An event slot is a single card; a dads slot is a shelf of
 * FEED_SUGGESTED_DADS_PER_RAIL, dealt in order so the pool is spent rather than
 * re-read. The last shelf wraps to the front of the pool to fill itself, so the
 * rails all have the same shape and then stop, rather than trailing off.
 *
 * Suggestions are placed *after* a full run of posts, never before the first
 * one — opening the feed on an ad reads as a promotion, not a feed. A slot is
 * skipped when its kind has run dry rather than substituting the other kind,
 * so the alternation stays legible instead of degrading into a run of one
 * kind once the shorter pool empties. When both are exhausted the remaining
 * posts simply run on uninterrupted.
 */
export function interleaveFeed(
  posts: readonly FeedConversation[],
  events: readonly Event[],
  dads: readonly Profile[],
): FeedRow[] {
  const rows: FeedRow[] = []
  let eventIndex = 0
  let dadIndex = 0
  let slot = 0

  posts.forEach((post, i) => {
    rows.push({ kind: 'post', key: `post-${post.id}`, post })

    const boundary = (i + 1) % FEED_SUGGESTION_INTERVAL === 0
    const isLastPost = i === posts.length - 1
    // No suggestion after the final post: it would trail the feed rather than
    // break it up, and the infinite sentinel is what belongs at the bottom.
    if (!boundary || isLastPost) return

    const wantsEvent = slot % 2 === 0
    slot += 1

    if (wantsEvent) {
      const event = events[eventIndex]
      if (event) {
        eventIndex += 1
        rows.push({ kind: 'event', key: `event-${event.id}`, event })
      }
      return
    }

    // A whole shelf, not one profile: the slot takes the next run of dads and
    // hands them over together. Dealing forward rather than re-reading the pool
    // is what stops the second rail from being the first one again.
    const fresh = dads.slice(dadIndex, dadIndex + FEED_SUGGESTED_DADS_PER_RAIL)
    if (fresh.length === 0) return

    // The pool is spent after this one, so advance past the end: the next dads
    // slot finds nothing and is skipped, which is where the rails stop.
    dadIndex += fresh.length

    // A last run of one or two would go out as a rail with a card and then a
    // gap, which reads as something failing to load rather than as the end of
    // a short list. Top it back up to a full shelf by wrapping to the front of
    // the pool. Only the final rail ever repeats anyone, and never within
    // itself -- a dad already on this shelf is skipped over, so a pool smaller
    // than a shelf yields a short rail rather than the same face twice.
    const shelf = [...fresh]
    const shown = new Set(shelf.map((dad) => dad.id))
    for (const dad of dads) {
      if (shelf.length >= FEED_SUGGESTED_DADS_PER_RAIL) break
      if (shown.has(dad.id)) continue
      shown.add(dad.id)
      shelf.push(dad)
    }

    // Keyed on the first dad, which is unique across shelves because the first
    // of each is always freshly dealt.
    rows.push({ kind: 'dads', key: `dads-${shelf[0].id}`, dads: shelf })
  })

  return rows
}
