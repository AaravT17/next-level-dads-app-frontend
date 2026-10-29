import type { User } from '@/types/auth'
import type { MeResponse } from '@/types/users'
import { isHttpStatus } from '@/utils/errors'
import { loadProfile } from './loadProfile'

/** What bringing a session back on page load turned up. */
export type Restored =
  /** No valid refresh cookie: the ordinary signed-out visitor. Nothing to report. */
  | { kind: 'signed-out' }
  | { kind: 'ghost' }
  | { kind: 'member'; user: User }
  /** Signed in, but the profile has not been set up yet. The route guard sends them to setup. */
  | { kind: 'no-profile' }
  /** A real failure — a timeout, an unreachable server, a 500, a refused role. Worth telling the user. */
  | { kind: 'failed'; error: unknown }

/**
 * Brings a session back after a page load.
 *
 * It refreshes first, and only then asks for a profile. The refresh is what
 * returns the role, and the role decides whether there is a profile to ask for:
 * a ghost has none, and `/users/me` would refuse it. A refresh that succeeds
 * has already put the token and role into the auth state; this reports what
 * came after.
 *
 * It never throws. Every outcome, failures included, comes back as a value, so
 * the caller has one switch to write and no failure path to forget.
 *
 * `refresh` and `fetchMe` are passed in so the order and the error handling can
 * be tested without a network.
 */
export async function restoreSession(
  refresh: () => Promise<{ role: string | null }>,
  fetchMe: () => Promise<MeResponse>,
): Promise<Restored> {
  try {
    const { role } = await refresh()
    return await loadProfile(role, fetchMe)
  } catch (err) {
    return isHttpStatus(err, 401) ? { kind: 'signed-out' } : { kind: 'failed', error: err }
  }
}
