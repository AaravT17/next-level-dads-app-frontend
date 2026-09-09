import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'
import axios from 'axios'
import { User, AuthState, AuthContextType } from '../types/auth'
import axiosPrivate, {
  registerAuthCallbacks,
  setAccessToken,
} from '../api/axiosPrivate'
import { TIMEOUT_LENGTH_MS } from '@/config/constants'
import { getErrorMessage } from '@/utils/errors'
import { toastError } from '@/lib/toast'

// Context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Provider
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    loading: true,
  })

  const setAuth = (auth: { user: User | null; accessToken: string | null }) => {
    setAccessToken(auth.accessToken)
    setState((prev) => ({
      ...prev,
      user: auth.user,
      accessToken: auth.accessToken,
    }))
  }

  const setLoading = (loading: boolean) => {
    setState((prev) => ({
      ...prev,
      loading,
    }))
  }

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
            interests: res.data.interests,
            children_age_ranges: res.data.children,
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
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, setAuth, setLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
