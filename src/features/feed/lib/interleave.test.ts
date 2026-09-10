import { describe, expect, it } from 'vitest'
import { FEED_SUGGESTION_INTERVAL } from '@/config/constants'
import type { Event } from '@/types/events'
import type { Profile } from '@/types/users'
import { interleaveFeed, type FeedRow } from './interleave'
import type { FeedConversation } from '../api/feedApi'

const posts = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ id: `p${i}` })) as FeedConversation[]
const events = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ id: `e${i}` })) as unknown as Event[]
const dads = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ id: `d${i}` })) as unknown as Profile[]

const suggestionKinds = (rows: FeedRow[]) =>
  rows.filter((r) => r.kind !== 'post').map((r) => r.kind)

describe('interleaveFeed', () => {
  it('returns posts unchanged when there are fewer than one full interval', () => {
    const rows = interleaveFeed(posts(FEED_SUGGESTION_INTERVAL - 1), events(6), dads(6))
    expect(suggestionKinds(rows)).toEqual([])
  })

  it('alternates event then dad at each interval boundary', () => {
    const rows = interleaveFeed(posts(20), events(6), dads(6))
    expect(suggestionKinds(rows)).toEqual(['event', 'dad', 'event', 'dad'])
  })

  it('never places a suggestion after the final post', () => {
    // A trailing suggestion would end the feed rather than break it up, and the
    // infinite-scroll sentinel is what belongs at the bottom.
    const rows = interleaveFeed(posts(FEED_SUGGESTION_INTERVAL), events(6), dads(6))
    expect(rows).toHaveLength(FEED_SUGGESTION_INTERVAL)
    expect(rows.at(-1)?.kind).toBe('post')
  })

  it('skips an exhausted slot rather than substituting the other kind', () => {
    // Documented behaviour: the alternation stays legible instead of degrading
    // into a run of one kind once the shorter pool empties.
    const rows = interleaveFeed(posts(20), [], dads(6))
    expect(suggestionKinds(rows)).toEqual(['dad', 'dad'])
  })

  it('stops suggesting once both pools are spent', () => {
    const rows = interleaveFeed(posts(60), events(1), dads(1))
    expect(suggestionKinds(rows)).toEqual(['event', 'dad'])
  })

  it('keeps every row key unique so React can reconcile the list', () => {
    const rows = interleaveFeed(posts(60), events(6), dads(6))
    expect(new Set(rows.map((r) => r.key)).size).toBe(rows.length)
  })

  it('is pure — the same input yields an equal result', () => {
    // The feed re-renders constantly while scrolling; a suggestion that moved
    // between renders would visibly hop.
    const args = [posts(20), events(6), dads(6)] as const
    expect(interleaveFeed(...args)).toEqual(interleaveFeed(...args))
  })

  it('does not mutate its inputs', () => {
    const p = posts(20)
    const e = events(6)
    const d = dads(6)
    interleaveFeed(p, e, d)
    expect(p).toHaveLength(20)
    expect(e).toHaveLength(6)
    expect(d).toHaveLength(6)
  })
})
