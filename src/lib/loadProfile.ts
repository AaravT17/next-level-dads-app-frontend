import type { User } from '@/types/auth'
import type { MeResponse } from '@/types/users'
import { isHttpStatus } from '@/utils/errors'
import { isGhostRole } from './roles'
import { userFromResponse } from './user'

/** What signing in found out about the account's profile. */
export type ProfileLookup =
  | { kind: 'ghost' }
  | { kind: 'member'; user: User }
  | { kind: 'no-profile' }

/**
 * Decides whether an account has a profile to load, and loads it.
 *
 * Every way of getting a session ends here: restoring one on page load, email
 * login, and Google sign-in. Having the decision in one place is what keeps a
 * ghost, which has no profile and for which `/users/me` would be refused, from
 * ever being sent there by whichever path someone forgot to update.
 *
 * - A ghost role is answered without a request.
 * - A 404 means the account exists but has not been set up, which is an answer
 *   and not an error: the caller sends them to profile setup.
 * - Anything else is a real failure and is thrown for the caller to report.
 *
 * `fetchMe` is passed in so this stays testable without a network.
 */
export async function loadProfile(
  role: string | null,
  fetchMe: () => Promise<MeResponse>,
): Promise<ProfileLookup> {
  if (isGhostRole(role)) return { kind: 'ghost' }

  try {
    return { kind: 'member', user: userFromResponse(await fetchMe()) }
  } catch (err) {
    if (isHttpStatus(err, 404)) return { kind: 'no-profile' }
    throw err
  }
}
