export type CommunityRole = 'admin' | 'member' | null

export interface Community {
  id: string
  name: string
  description: string | null
  member_count: number
  created_by: string | null
  created_at: string
  is_member: boolean
  role: CommunityRole
}

export interface DiscoverCommunitiesFilters {
  name: string
}

export interface DiscoverCommunitiesCursor {
  cursor_id: string
  cursor_created_at: string
}

export interface CommunityMemberResponse {
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
  joined_at: string
  role: 'admin' | 'member'
}

export interface CommunityMembersCursor {
  cursor_id: string
  cursor_joined_at: string
}
