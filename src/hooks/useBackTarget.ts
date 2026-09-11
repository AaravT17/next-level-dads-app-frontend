import { useLocation } from 'react-router-dom'

/**
 * Picks the back target from whatever the linking screen put in router state.
 *
 * Split out from the hook so it can be tested without a DOM: the hook is the
 * `useLocation()` call, this is the decision.
 *
 * Only same-origin paths are accepted. History state is attacker-writable via
 * a crafted link, and `navigate()` would follow "//evil.com" off the app.
 */
export function resolveBackTarget(from: unknown, fallback: string): string {
  if (typeof from !== 'string') return fallback
  if (!from.startsWith('/') || from.startsWith('//')) return fallback
  return from
}

/**
 * Where a screen's back button should land.
 *
 * A screen reachable from more than one place cannot name a single back
 * target: /you/requests is opened from the You tab, from the profile editor,
 * and from the requests panel on /dads, and a hardcoded `backTo` sends all
 * three to the same place — so two of them land somewhere the user has never
 * been. The linking screen knows where the user is; it passes that along as
 * router state, and the destination reads it here.
 *
 * Falls back whenever there is no usable state — a deep link, an entry point
 * that does not set it, a hand-edited URL.
 */
export function useBackTarget(fallback: string): string {
  const { state } = useLocation()
  return resolveBackTarget((state as { from?: unknown } | null)?.from, fallback)
}
