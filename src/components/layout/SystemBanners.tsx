import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useChat } from '@/contexts/ChatContext'
import { ROUTES } from '@/lib/routes'

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

function DobBanner() {
  const { user } = useAuth()
  const navigate = useNavigate()

  if (!user || user.date_of_birth !== null) return null

  return (
    <div className="shrink-0 bg-primary text-primary-foreground text-label py-2 flex items-center justify-center gap-2 text-center">
      <span>Please add your date of birth to complete your profile.</span>
      <button
        type="button"
        onClick={() => navigate(ROUTES.YOU)}
        className="underline font-semibold shrink-0"
      >
        Update now
      </button>
    </div>
  )
}

export function SystemBanners() {
  return (
    <div role="status" aria-live="polite">
      <ConnectionBanner />
      <DobBanner />
    </div>
  )
}
