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
    loading: true,
  })

  // Both setters are memoised, and the context value with them.
  //
  // They were rebuilt on every render, which made the value object new on
  // every render too: all 23 useAuth() consumers re-rendered whenever anything
  // in auth state changed, and no effect could honestly depend on setAuth
  // without re-running constantly. Both updaters are already functional, so
  // neither closes over state and an empty dep list is correct.
  const setAuth = useCallback(
    (auth: { user: User | null; accessToken: string | null }) => {
      setAccessToken(auth.accessToken)
      setState((prev) => ({
        ...prev,
        user: auth.user,
        accessToken: auth.accessToken,
      }))
    },
    [],
  )

  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({
      ...prev,
      loading,
    }))
  }, [])

  useEffect(() => {
    registerAuthCallbacks({
      onTokenRefresh: (token) => {
        setAccessToken(token)
        setState((prev) => ({ ...prev, accessToken: token }))
      },
      onAuthFailure: () => {
        setAccessToken(null)
        setState((prev) => ({ ...prev, user: null, accessToken: null }))
      },
    })

    const hydrate = async () => {
      try {
        const res = await axiosPrivate.get('/api/users/me', {
          timeout: TIMEOUT_LENGTH_MS,
        })
        setState((prev) => ({
          ...prev,
          user: {
            id: res.data.id,
            name: res.data.name,
            age: res.data.age,
            date_of_birth: res.data.date_of_birth,
            city: res.data.city,
            province: res.data.province,
            about: res.data.about,
            avatarUrl: res.data.avatar_url,
            interests: res.data.interests ?? [],
            children_age_ranges: res.data.children_age_ranges ?? [],
            kid_count: res.data.kid_count ?? null,
            goals: res.data.goals ?? null,
            primary_goal: res.data.primary_goal ?? null,
            connection_styles: res.data.connection_styles ?? null,
            match_priorities: res.data.match_priorities ?? null,
            icebreakers: res.data.icebreakers ?? null,
            isAdmin: res.data.is_admin ?? false,
            preferences: {
              marketing_emails_opt_in: res.data.preferences?.marketing_emails_opt_in ?? false,
            },
            legal_acceptances: {
              terms: res.data.legal_acceptances?.terms ?? false,
              privacy_policy: res.data.legal_acceptances?.privacy_policy ?? false,
            },
          },
        }))
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
    () => ({ ...state, setAuth, setLoading }),
    [state, setAuth, setLoading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
