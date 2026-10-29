import type { User } from '@/types/auth'
import { isGhostRole } from './roles'
import { userFromResponse } from './user'

/**
 * Who the personal pages (You, Settings, Edit profile) show for a ghost.
 *
 * A ghost has no profile, so `user` in auth state is null and those pages would
 * have nothing to draw. Rather than invent a profile and store it, they are
 * given this empty one for display only. It never goes into auth state, so
 * nothing that reads `user` to decide what someone may do (the chat socket, ban
 * polling, the legal modal, the incomplete-profile banner) ever sees it.
 *
 * Built with the same mapper as a real profile, so it has every field a real
 * one does and cannot fall out of step when a field is added. It is one shared
 * object, not a new one per call: Edit profile re-seeds its form whenever the
 * user it is given changes, and a fresh object each render would do that
 * forever.
 *
 * Only the admin role is a ghost today, hence the name.
 */
export const GHOST_USER: User = userFromResponse({
  id: '',
  name: 'Admin',
  age: null,
  date_of_birth: null,
  city: '',
  province: '',
  about: '',
  avatar_url: null,
})

/**
 * The profile a personal page should draw: the member's own, the placeholder
 * for a ghost, or null when there is nothing to show (signed out, or a member
 * who has not made a profile yet).
 *
 * A real profile always wins, so a placeholder can never replace one.
 */
export function personalUser(user: User | null, role: string | null | undefined): User | null {
  if (user) return user
  return isGhostRole(role) ? GHOST_USER : null
}
