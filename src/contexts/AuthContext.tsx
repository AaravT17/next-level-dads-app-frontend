import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'
import { User, AuthState, AuthContextType } from '../types/auth'
import axiosPrivate, {
  registerAuthCallbacks,
  setAccessToken,
} from '../api/axiosPrivate'
import { TIMEOUT_LENGTH_MS } from '@/config/constants'

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
            city: res.data.city,
            province: res.data.province,
            about: res.data.about,
            avatarUrl: res.data.avatar_url,
            interests: res.data.interests,
            children_age_ranges: res.data.children,
            isAdmin: res.data.is_admin ?? false,
          },
        }))
      } catch (err: any) {
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
