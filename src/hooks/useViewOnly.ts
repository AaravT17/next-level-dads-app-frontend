import { useAuth } from '@/contexts/useAuth'
import { isGhostRole } from '@/lib/roles'

/** Shown beside a control that a view-only role cannot use. */
export const VIEW_ONLY_NOTICE = 'You are viewing as an admin, so this is read-only.'

interface ViewOnlyGate {
  /** True for a role that browses without taking member actions (a ghost). */
  viewOnly: boolean
  /** Inline notice to show near a disabled control, or null. */
  notice: string | null
}

/**
 * Whether the signed-in account can act, or only look.
 *
 * A ghost role can browse the whole app but the backend refuses every member
 * action it makes. The controls for those actions stay on screen, disabled,
 * so the app looks the way a member sees it. Each one reads this, and a control
 * that is also disabled for another reason combines the two, the way the
 * composers do with a posting ban.
 *
 * The backend is what enforces it. This only keeps the UI from offering what
 * would come back as a 403.
 */
export function useViewOnly(): ViewOnlyGate {
  const { role } = useAuth()
  const viewOnly = isGhostRole(role)
  return { viewOnly, notice: viewOnly ? VIEW_ONLY_NOTICE : null }
}
