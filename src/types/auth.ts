import type { InterestItem, IcebreakerEntry } from './users'

export interface User {
  id: string
  name: string
  age: number | null
  date_of_birth: string | null
  city: string
  province: string
  about: string
  avatarUrl: string | null
  interests: InterestItem[]
  children_age_ranges: string[]
  kid_count: number | null
  goals: string[] | null
  primary_goal: string | null
  connection_styles: string[] | null
  match_priorities: string[] | null
  icebreakers: IcebreakerEntry[] | null
  preferences: {
    marketing_emails_opt_in: boolean
  }
  legal_acceptances: {
    terms: boolean
    privacy_policy: boolean
  }
  notificationState: {
    lastReadAt: string | null
    lastClearedAt: string | null
  }
}

export interface AuthState {
  user: User | null
  accessToken: string | null
  /**
   * The account's role as the backend reports it, or null for an ordinary
   * member. It lives here and not on `user` because a role that browses without
   * a profile has no user to hang it on.
   */
  role: string | null
  loading: boolean
}

export interface AuthContextType extends AuthState {
  /** `role` is left unchanged when omitted. Signing out (a null token) always clears it. */
  setAuth: (auth: { user: User | null; accessToken: string | null; role?: string | null }) => void
  setLoading: (loading: boolean) => void
  updateNotificationState: (update: Partial<User['notificationState']>) => void
}

export interface AuthCallbacks {
  onTokenRefresh: (token: string, role: string | null) => void
  onAuthFailure: () => void
}
