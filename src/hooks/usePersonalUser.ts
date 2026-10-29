import { useAuth } from '@/contexts/useAuth'
import { personalUser } from '@/lib/personalUser'
import type { User } from '@/types/auth'

/**
 * The profile a personal page (You, Settings, Edit profile) should draw.
 *
 * The member's own, or a placeholder "Admin" for a ghost, which has no profile.
 * For display only: anything that saves a profile or decides what someone may do
 * should keep reading `user` from `useAuth()`, which is null for a ghost.
 * See lib/personalUser.ts.
 */
export function usePersonalUser(): User | null {
  const { user, role } = useAuth()
  return personalUser(user, role)
}
