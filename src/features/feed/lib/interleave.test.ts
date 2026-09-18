import { describe, expect, it } from 'vitest'
import {
  FEED_SUGGESTION_INTERVAL,
  FEED_SUGGESTED_DADS_PER_RAIL,
} from '@/config/constants'
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

  it('alternates event then dads at each interval boundary', () => {
    const rows = interleaveFeed(posts(20), events(6), dads(20))
    expect(suggestionKinds(rows)).toEqual(['event', 'dads', 'event', 'dads'])
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
    const rows = interleaveFeed(posts(20), [], dads(20))
    expect(suggestionKinds(rows)).toEqual(['dads', 'dads'])
  })

  it('places no dad row at all when there are no dads left to meet', () => {
    // Browse returns only dads you have no connection to, so this pool empties
    // for real once you have reached everyone. The slot has to disappear with
    // it — a "Suggested dad" heading over nothing is worse than no heading.
    const rows = interleaveFeed(posts(20), events(6), [])
    expect(suggestionKinds(rows)).toEqual(['event', 'event'])
    expect(rows.some((r) => r.kind === 'dads')).toBe(false)
  })

  it('renders a plain feed when neither pool has anything to suggest', () => {
    const rows = interleaveFeed(posts(20), [], [])
    expect(suggestionKinds(rows)).toEqual([])
    expect(rows).toHaveLength(20)
  })

  it('stops suggesting once both pools are spent', () => {
    const rows = interleaveFeed(posts(60), events(1), dads(1))
    expect(suggestionKinds(rows)).toEqual(['event', 'dads'])
  })

  it('fills a dads slot with a whole shelf, not one profile', () => {
    const rows = interleaveFeed(posts(20), [], dads(20))
    const shelves = rows.filter((r) => r.kind === 'dads')
    expect(shelves.length).toBeGreaterThan(0)
    for (const shelf of shelves) {
      expect(shelf.kind === 'dads' && shelf.dads).toHaveLength(FEED_SUGGESTED_DADS_PER_RAIL)
    }
  })

  it('never puts the same dad on a shelf twice', () => {
    // Two of the same face side by side is the one repeat that would read as a
    // bug rather than as a short list.
    const rows = interleaveFeed(posts(60), [], dads(FEED_SUGGESTED_DADS_PER_RAIL + 2))
    for (const row of rows) {
      if (row.kind !== 'dads') continue
      const ids = row.dads.map((d) => d.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })

  it('deals each dad out once before any is shown again', () => {
    const rows = interleaveFeed(posts(60), [], dads(20))
    const shelves = rows.filter((r) => r.kind === 'dads')
    // Every shelf but the last is freshly dealt; only the last may wrap.
    const dealt = shelves
      .slice(0, -1)
      .flatMap((r) => (r.kind === 'dads' ? r.dads.map((d) => d.id) : []))
    expect(new Set(dealt).size).toBe(dealt.length)
  })

  it('fills the last shelf by wrapping rather than trailing off', () => {
    // Two left over would otherwise go out as a card and a gap, which reads as
    // something failing to load rather than as the end of a short list.
    const rows = interleaveFeed(posts(60), [], dads(FEED_SUGGESTED_DADS_PER_RAIL + 2))
    const shelves = rows.filter((r) => r.kind === 'dads')
    expect(shelves).toHaveLength(2)
    for (const shelf of shelves) {
      expect(shelf.kind === 'dads' && shelf.dads).toHaveLength(FEED_SUGGESTED_DADS_PER_RAIL)
    }
  })

  it('stops once the pool is spent instead of looping forever', () => {
    // Wrapping fills a shelf; it does not refill the pool. A feed long enough
    // for ten dad slots still gets the shelves its dads can cover.
    const rows = interleaveFeed(posts(120), [], dads(FEED_SUGGESTED_DADS_PER_RAIL + 2))
    expect(rows.filter((r) => r.kind === 'dads')).toHaveLength(2)
  })

  it('leaves a pool smaller than a shelf short rather than repeating a face', () => {
    const rows = interleaveFeed(posts(60), [], dads(2))
    const shelves = rows.filter((r) => r.kind === 'dads')
    expect(shelves).toHaveLength(1)
    expect(shelves[0].kind === 'dads' && shelves[0].dads).toHaveLength(2)
  })

  it('keeps every row key unique so React can reconcile the list', () => {
    const rows = interleaveFeed(posts(60), events(6), dads(20))
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
