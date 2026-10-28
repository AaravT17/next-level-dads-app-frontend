import {
  useCallback,
  useMemo,
  useState,
  useEffect,
  ReactNode,
} from 'react'
import axios from 'axios'
import { AuthContext } from '@/contexts/AuthContext'
import { TIMEOUT_LENGTH_MS } from '@/config/constants'
import { getErrorMessage } from '@/utils/errors'
import { toastError } from '@/lib/toast'
import { withAuth, withAuthFailure, withRefreshedToken, type AuthUpdate } from '@/lib/authState'
import { userFromResponse } from '@/lib/user'
import { User, AuthState } from '../types/auth'
import axiosPrivate, {
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
        const res = await axiosPrivate.get('/api/users/me', {
          timeout: TIMEOUT_LENGTH_MS,
        })
        setState((prev) => ({ ...prev, user: userFromResponse(res.data) }))
      } catch (err) {
        // A 401 here is the ordinary signed-out case: the request goes out with
        // no token, the interceptor tries the refresh cookie, and there is no
        // valid one. Anything else — a timeout, an unreachable server, a 500 —
        // is a real failure, and swallowing it rendered the app as "signed out"
        // so a backend incident looked like an unexplained logout.
        const status = axios.isAxiosError(err) ? err.response?.status : undefined
        if (status !== 401 && status !== 403) {
          toastError(
            'Could not restore your session',
            getErrorMessage(err, 'Something went wrong. Please try again.'),
          )
        }
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
