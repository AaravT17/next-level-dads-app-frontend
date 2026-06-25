export type ConnectionStatus =
  | 'pending_outgoing'
  | 'pending_incoming'
  | 'connected'
  | 'blocked'
  | null

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
  interests: string[]
  children: string[]
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
  interests: string[]
  children: string[]
  created_at: string
  connection_id: string
  connection_updated_at: string
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
