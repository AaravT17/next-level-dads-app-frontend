import type { AuthState, User } from '@/types/auth'
import { isGhostRole } from './roles'

/**
 * The transitions of the auth state, as pure functions.
 *
 * They exist to hold two invariants in one place instead of at every call site:
 *
 *   - No token means no session, so no role.
 *   - A ghost role never has a profile, so its `user` is always null. Every hook
 *     that gates on `!!user` (the chat socket, ban status, moderation polling)
 *     then stays off for a ghost without needing to know ghosts exist.
 */

export type AuthUpdate = {
  user: User | null
  accessToken: string | null
  /** Leave out to keep the current role; pass null to clear it. */
  role?: string | null
}

/** A sign-in, a profile change, or a sign-out. */
export function withAuth(prev: AuthState, update: AuthUpdate): AuthState {
  const { accessToken } = update
  const role = accessToken === null ? null : update.role === undefined ? prev.role : update.role
  return {
    ...prev,
    accessToken,
    role,
    user: isGhostRole(role) ? null : update.user,
  }
}

/**
 * A refresh succeeded. The token and role move together, in one state change,
 * so no render sees the new token beside a stale role. The refresh response is
 * authoritative about the role: it is how an account promoted or demoted
 * mid-session finds out.
 */
export function withRefreshedToken(prev: AuthState, token: string, role: string | null): AuthState {
  return {
    ...prev,
    accessToken: token,
    role,
    user: isGhostRole(role) ? null : prev.user,
  }
}

/** A refresh failed: the session is gone. */
export function withAuthFailure(prev: AuthState): AuthState {
  return { ...prev, user: null, accessToken: null, role: null }
}
