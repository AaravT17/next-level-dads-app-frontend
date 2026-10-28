export type ConnectionStatus =
  | 'pending_outgoing'
  | 'pending_incoming'
  | 'connected'
  | 'blocked'
  | null

export interface InterestItem {
  id: string
  slug: string
}

export interface IcebreakerEntry {
  prompt_slug: string
  answer: string
}

/**
 * The signed-in user's own profile, as GET /api/users/me returns it. The create
 * and update endpoints answer with the same shape. Fields the backend can omit
 * are optional here, and `userFromResponse` is where each one gets its default.
 */
export interface MeResponse {
  id: string
  name: string
  age: number | null
  date_of_birth: string | null
  city: string
  province: string
  about: string
  avatar_url: string | null
  interests?: InterestItem[]
  children_age_ranges?: string[]
  kid_count?: number | null
  goals?: string[] | null
  primary_goal?: string | null
  connection_styles?: string[] | null
  match_priorities?: string[] | null
  icebreakers?: IcebreakerEntry[] | null
  preferences?: { marketing_emails_opt_in?: boolean }
  legal_acceptances?: { terms?: boolean; privacy_policy?: boolean }
  notification_state?: { last_read_at?: string | null; last_cleared_at?: string | null }
}

export interface Profile {
  id: string
  created_at: string
  name: string
  age: number | null
  date_of_birth: string | null
  city: string
  province: string
  about: string
  avatar_url: string | null
  interests: InterestItem[]
  children_age_ranges: string[]
  kid_count: number | null
  icebreakers: IcebreakerEntry[] | null
  connection_status: ConnectionStatus
}

export interface DiscoverDadsFilters {
  interests: string[]
  children_age_ranges: string[]
  provinces: string[]
  age_ranges: string[]
  name: string
}

export interface DiscoverDadsCursor {
  cursor_id: string
  cursor_created_at: string
}

export interface ConnectionResponse {
  id: string
  name: string
  age: number | null
  date_of_birth: string | null
  city: string
  province: string
  about: string
  avatar_url: string | null
  interests: InterestItem[]
  children_age_ranges: string[]
  kid_count: number | null
  icebreakers: IcebreakerEntry[] | null
  created_at: string
  connection_id: string
  connection_updated_at: string
  /** Optional message the sender attached to a pending request. */
  note: string | null
  connection_status: ConnectionStatus
}

export interface ConnectionsFilters {
  name: string
}

export interface ConnectionsCursor {
  cursor_id: string
  cursor_updated_at: string
}

export interface ConnectionCounts {
  connections: number
  requests: number
}

/** GET /api/users/me/stats — drives the profile summary and the nav badge. */
export interface UserStats {
  connections: number
  requests: number
  communities_joined: number
  events_registered_for: number
  /** Communities that moved since you last opened them — the Groups nav badge. */
  communities_with_new_activity: number
}
