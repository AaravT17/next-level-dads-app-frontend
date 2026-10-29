import {
  useCallback,
  useMemo,
  useState,
  useEffect,
  ReactNode,
} from 'react'
import { AuthContext } from '@/contexts/AuthContext'
import { getErrorMessage } from '@/utils/errors'
import { toastError } from '@/lib/toast'
import { withAuth, withAuthFailure, withRefreshedToken, type AuthUpdate } from '@/lib/authState'
import { restoreSession } from '@/lib/restoreSession'
import { fetchMe } from '@/api/me'
import { User, AuthState } from '../types/auth'
import {
  refreshAccessToken,
  registerAuthCallbacks,
  setAccessToken,
} from '../api/axiosPrivate'

// Provider
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    role: null,
    loading: true,
  })

  // Both setters are memoised, and the context value with them.
  //
  // They were rebuilt on every render, which made the value object new on
  // every render too: all 23 useAuth() consumers re-rendered whenever anything
  // in auth state changed, and no effect could honestly depend on setAuth
  // without re-running constantly. Both updaters are already functional, so
  // neither closes over state and an empty dep list is correct.
  const setAuth = useCallback((auth: AuthUpdate) => {
    setAccessToken(auth.accessToken)
    setState((prev) => withAuth(prev, auth))
  }, [])

  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({
      ...prev,
      loading,
    }))
  }, [])

  const updateNotificationState = useCallback(
    (update: Partial<User['notificationState']>) => {
      setState((prev) => {
        if (!prev.user) return prev
        const current = prev.user.notificationState
        return {
          ...prev,
          user: {
            ...prev.user,
            notificationState: {
              lastReadAt:
                update.lastReadAt !== undefined
                  ? (current.lastReadAt && update.lastReadAt
                      ? current.lastReadAt > update.lastReadAt ? current.lastReadAt : update.lastReadAt
                      : update.lastReadAt ?? current.lastReadAt)
                  : current.lastReadAt,
              lastClearedAt:
                update.lastClearedAt !== undefined
                  ? (current.lastClearedAt && update.lastClearedAt
                      ? current.lastClearedAt > update.lastClearedAt ? current.lastClearedAt : update.lastClearedAt
                      : update.lastClearedAt ?? current.lastClearedAt)
                  : current.lastClearedAt,
            },
          },
        }
      })
    },
    [],
  )

  useEffect(() => {
    registerAuthCallbacks({
      onTokenRefresh: (token, role) => {
        setAccessToken(token)
        setState((prev) => withRefreshedToken(prev, token, role))
      },
      onAuthFailure: () => {
        setAccessToken(null)
        setState((prev) => withAuthFailure(prev))
      },
    })

    const hydrate = async () => {
      try {
        // A refresh that succeeds has already put the token and role into state
        // through onTokenRefresh above, so only the profile is left to apply.
        const restored = await restoreSession(refreshAccessToken, fetchMe)
        if (restored.kind === 'member') {
          setState((prev) => ({ ...prev, user: restored.user }))
        } else if (restored.kind === 'failed') {
          // Anything but the ordinary signed-out case is a real failure, and
          // swallowing it rendered the app as "signed out" so a backend incident
          // looked like an unexplained logout.
          toastError(
            'Could not restore your session',
            getErrorMessage(restored.error, 'Something went wrong. Please try again.'),
          )
        }
        // Signed out, a ghost, and an account not yet set up are all outcomes and
        // not errors: the route guards take it from here.
      } finally {
        setLoading(false)
      }
    }

    hydrate()
    // setLoading is stable, so this still runs once on mount.
  }, [setLoading])

  const value = useMemo(
    () => ({ ...state, setAuth, setLoading, updateNotificationState }),
    [state, setAuth, setLoading, updateNotificationState],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
