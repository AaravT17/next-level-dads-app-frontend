import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/useAuth'
import { useChat } from '@/contexts/useChat'
import { ROUTES } from '@/lib/routes'
import { getProfileIncomplete } from '@/lib/profileCompleteness'

/**
 * App-wide status strips.
 *
 * Previously these were `fixed top-0` and rendered by ProtectedRoute, so they
 * overlapped the page header rather than displacing it, and announced nothing
 * to assistive tech. Here they sit in normal flow above the AppBar and are
 * live regions.
 *
 * Order matters: the connection banner is transient and goes on top of the
 * persistent date-of-birth nag.
 */

function ConnectionBanner() {
  const { isReconnecting, isFailed, reconnect } = useChat()
  const [showReconnected, setShowReconnected] = useState(false)
  const wasReconnectingRef = useRef(false)

  useEffect(() => {
    if (isReconnecting) {
      wasReconnectingRef.current = true
    } else if (wasReconnectingRef.current && !isFailed) {
      wasReconnectingRef.current = false
      setShowReconnected(true)
      const timer = setTimeout(() => setShowReconnected(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [isReconnecting, isFailed])

  if (showReconnected) {
    return (
      <div className="shrink-0 bg-success text-success-foreground text-label text-center py-2">
        Reconnected
      </div>
    )
  }

  if (isReconnecting) {
    return (
      <div className="shrink-0 bg-warning text-warning-foreground text-label text-center py-2">
        Attempting to reconnect...
      </div>
    )
  }

  if (isFailed) {
    return (
      <div className="shrink-0 bg-destructive text-destructive-foreground text-label py-2 flex items-center justify-center gap-3">
        <span>Connection lost</span>
        <button type="button" onClick={reconnect} className="underline font-semibold">
          Retry
        </button>
      </div>
    )
  }

  return null
}

function IncompleteProfileBanner() {
  const { user } = useAuth()
  const navigate = useNavigate()

  if (!user) return null

  const incomplete = getProfileIncomplete({
    kid_count: user.kid_count,
    date_of_birth: user.date_of_birth,
    about: user.about,
    goals: user.goals,
    primary_goal: user.primary_goal,
    connection_styles: user.connection_styles,
    match_priorities: user.match_priorities,
    interestCount: user.interests?.length ?? 0,
    icebreakerCount: user.icebreakers?.length ?? 0,
  })

  if (!Object.values(incomplete).some(Boolean)) return null

  return (
    <div className="shrink-0 bg-primary text-primary-foreground text-label py-2 flex items-center justify-center gap-2 text-center">
      <span>Your profile is incomplete.</span>
      <button
        type="button"
        onClick={() => navigate(ROUTES.YOU_EDIT)}
        className="underline font-semibold shrink-0"
      >
        Complete now
      </button>
    </div>
  )
}

export function SystemBanners() {
  return (
    <div role="status" aria-live="polite">
      <ConnectionBanner />
      <IncompleteProfileBanner />
    </div>
  )
}
