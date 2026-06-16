import { useModerationNotifications } from '../hooks/useModerationNotifications'

/**
 * Headless component: runs the moderation notification poller for the whole
 * app. Renders nothing — it only drives toasts.
 */
export function ModerationNotifier() {
  useModerationNotifications()
  return null
}
