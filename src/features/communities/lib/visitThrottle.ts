/**
 * How often a single community's visit may be stamped.
 *
 * Opening a community fires a write, and React Strict Mode double-invokes
 * effects in development, route changes remount the page, and people bounce in
 * and out of the same community while reading. Without a guard each of those is
 * another UPDATE for a value that has not meaningfully changed.
 *
 * A minute is well inside the time it takes for the badge to matter again — the
 * count only moves when somebody else posts — so nothing is lost by collapsing
 * repeat visits within it.
 */
export const VISIT_THROTTLE_MS = 60_000

/**
 * Module-level rather than component state: the whole point is to survive the
 * unmount, so a remount of the same community does not re-stamp it.
 *
 * Bounded by how many communities one person opens in a session, and each entry
 * is a string and a number, so it is left to be reclaimed with the tab rather
 * than swept. Not persisted — a reload is a fair moment to stamp again, and
 * keeping it in memory means no storage access on a hot path.
 */
const lastStampedAt = new Map<string, number>()

/**
 * Whether this visit should be written through, recording it if so.
 *
 * Deliberately not a pure predicate: callers must not be able to ask without
 * claiming, or two effects in the same tick would both be told yes.
 */
export function shouldStampVisit(communityId: string, now: number = Date.now()): boolean {
  const previous = lastStampedAt.get(communityId)
  if (previous !== undefined && now - previous < VISIT_THROTTLE_MS) return false

  lastStampedAt.set(communityId, now)
  return true
}

/** Test seam. Not used in application code. */
export function resetVisitThrottle(): void {
  lastStampedAt.clear()
}
