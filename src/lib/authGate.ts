import { isAdminRole, isGhostRole } from './roles'
import { ROUTES } from './routes'

/**
 * What each route guard decides, as pure functions of the session.
 *
 * The guards are components, and a component cannot be tested without rendering
 * it. Keeping the decision here means every combination of signed-out, member,
 * member-without-a-profile, ghost and admin can be checked directly, and the
 * components are left with nothing to do but act on the answer.
 *
 * A ghost has a token and a role but no `user`. Everywhere a guard used to read
 * "no user" as "has not set up a profile yet", it now asks `isSetUp`, which also
 * counts a ghost, because a ghost never will and must not be sent to setup.
 */

export type AuthGate = { kind: 'allow' } | { kind: 'redirect'; to: string }

export interface GateSession {
  accessToken: string | null
  user: unknown | null
  role: string | null
}

const allow: AuthGate = { kind: 'allow' }
const redirect = (to: string): AuthGate => ({ kind: 'redirect', to })

/** Has a profile, or holds a role that never has one. */
function isSetUp({ user, role }: GateSession): boolean {
  return user !== null || isGhostRole(role)
}

/** The app proper: needs a session, and a profile unless the role is a ghost's. */
export function protectedGate(session: GateSession): AuthGate {
  if (!session.accessToken) return redirect(ROUTES.WELCOME)
  if (!isSetUp(session)) return redirect(ROUTES.SETUP)
  return allow
}

/** Login and registration: sends anyone already signed in onward. */
export function publicGate(session: GateSession): AuthGate {
  if (!session.accessToken) return allow
  return redirect(isSetUp(session) ? ROUTES.HOME_AFTER_AUTH : ROUTES.SETUP)
}

/** Profile setup: a session with no profile yet. A ghost skips it and goes home. */
export function setupGate(session: GateSession): AuthGate {
  if (!session.accessToken) return redirect(ROUTES.WELCOME)
  if (isGhostRole(session.role)) return redirect(ROUTES.HOME_AFTER_AUTH)
  if (session.user !== null) return redirect(ROUTES.ONBOARDING_WELCOME)
  return allow
}

/**
 * The moderation dashboard. Only the role matters: an admin is a ghost with no
 * profile, so asking for a user here would lock out exactly the accounts this
 * page is for. The backend refuses anyone but an admin regardless.
 */
export function adminGate(session: GateSession): AuthGate {
  if (!session.accessToken) return redirect(ROUTES.WELCOME)
  if (!isAdminRole(session.role)) return redirect(ROUTES.HOME_AFTER_AUTH)
  return allow
}
