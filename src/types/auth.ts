export interface User {
  id: string
  name: string
  age: number | null
  date_of_birth: string | null
  city: string
  province: string
  about: string
  avatarUrl: string | null
  interests: string[]
  children_age_ranges: string[]
}

export interface AuthState {
  user: User | null
  accessToken: string | null
  loading: boolean
}

export interface AuthContextType extends AuthState {
  setAuth: (auth: { user: User | null; accessToken: string | null }) => void
  setLoading: (loading: boolean) => void
}

export interface AuthCallbacks {
  onTokenRefresh: (token: string) => void
  onAuthFailure: () => void
}
