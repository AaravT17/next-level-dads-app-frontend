import { FEED_SUGGESTION_INTERVAL } from '@/config/constants'
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
  | { kind: 'dad'; key: string; dad: Profile }

/**
 * One suggestion after every FEED_SUGGESTION_INTERVAL posts, alternating
 * event then dad.
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

    const dad = dads[dadIndex]
    if (dad) {
      dadIndex += 1
      rows.push({ kind: 'dad', key: `dad-${dad.id}`, dad })
    }
  })

  return rows
}
