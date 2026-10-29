/**
 * Account roles, as the backend reports them.
 *
 * `role` comes back from login, the OAuth session exchange and refresh, and is
 * null for an ordinary member. The backend is the authority on what a role
 * allows: the checks here only decide what to render and which requests to skip.
 *
 * GHOST_ROLES mirrors GHOST_ROLES in the backend's app/common/config/constants.py:
 * roles that browse without a profile and cannot take member actions. Keep the
 * two in step when a role is added; see docs/roles.md in the backend repo.
 */

export const ADMIN_ROLE = 'admin'

export const GHOST_ROLES: ReadonlySet<string> = new Set([ADMIN_ROLE])

/** True for a role that browses without a profile. A missing role is a member, never a ghost. */
export function isGhostRole(role: string | null | undefined): boolean {
  return role != null && GHOST_ROLES.has(role)
}

/** True only for the admin role, which is what gates the moderation dashboard. */
export function isAdminRole(role: string | null | undefined): boolean {
  return role === ADMIN_ROLE
}
