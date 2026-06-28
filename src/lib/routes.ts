/**
 * Centralized Route Configuration
 *
 * This file defines all routes in the application using clean, REST-style patterns.
 * All navigation should use these constants or helper functions.
 *
 * Route Structure:
 * ├── / (Welcome)
 * ├── /setup (Profile Setup)
 * ├── /match (Match Screen)
 * ├── /discover/:tab (Discover - dads, communities, events)
 * │   └── /discover/dads/:id (Profile from Discover)
 * ├── /communities/:communityId (Community Detail)
 * │   └── /communities/:communityId/members (Community Members)
 * ├── /groups/:tab (My Groups - communities, events)
 * │   └── /groups/:groupId/members (Group Members)
 * ├── /chats (Chats List)
 * │   ├── /chats/individual/:id (Individual Chat)
 * │   ├── /chats/group/:id (Private Group Chat)
 * │   └── /chats/community/:id (Community Chat)
 * ├── /profiles/:id (Profile Detail)
 * ├── /profile (Own Profile)
 * ├── /connections (Connections)
 * ├── /requests (Requests)
 * └── /events/:eventId (Event Detail)
 */

// ============================================
// Static Routes
// ============================================
export const ROUTES = {
  // Auth & Onboarding
  WELCOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/verify-email',
  SETUP: '/setup',
  MATCH: '/match',

  // Discover (tabbed)
  DISCOVER: '/discover',
  DISCOVER_DADS: '/discover/dads',
  DISCOVER_COMMUNITIES: '/discover/communities',
  DISCOVER_EVENTS: '/discover/events',

  // Dad Detail (from Discover) - renders ProfileDetail with discover context
  DAD_DETAIL: '/discover/dads/:id',

  // Event Detail
  EVENT_DETAIL: '/events/:eventId',

  // Communities
  COMMUNITIES: '/communities',

  // Groups (My joined communities/events - tabbed)
  GROUPS: '/groups',
  GROUPS_COMMUNITIES: '/groups/communities',
  GROUPS_EVENTS: '/groups/events',

  // Chats (typed routes)
  CHATS: '/chats',
  CHAT_INDIVIDUAL: '/chats/individual/:id',
  CHAT_GROUP: '/chats/group/:id',
  CHAT_COMMUNITY: '/chats/community/:id',

  // Profile
  PROFILE: '/profile',
  PROFILES: '/profiles',
  CONNECTIONS: '/connections',
  REQUESTS: '/requests',

  // Admin
  ADMIN: '/admin',
} as const

// ============================================
// Dynamic Route Helpers
// ============================================

/**
 * Get route for a specific discover tab
 */
export const discoverTab = (tab: 'dads' | 'communities' | 'events') =>
  `/discover/${tab}` as const

/**
 * Get route for a dad detail page (from Discover)
 */
export const dadDetail = (id: string) =>
  `/discover/dads/${id}` as const

/**
 * Get route for event detail page
 */
export const eventDetail = (eventId: number | string) =>
  `/events/${eventId}` as const

/**
 * Get route for a specific groups tab
 */
export const groupsTab = (tab: 'communities' | 'events') =>
  `/groups/${tab}` as const

/**
 * Get route for community detail page
 */
export const communityDetail = (communityId: number | string) =>
  `/communities/${communityId}` as const

/**
 * Get route for a conversation within a community
 */
export const conversationDetail = (communityId: string, conversationId: string) =>
  `/communities/${communityId}/conversations/${conversationId}` as const

/**
 * Get route for community members
 */
export const communityMembers = (communityId: number | string) =>
  `/communities/${communityId}/members` as const

/**
 * Get route for private group members (normalized pattern)
 */
export const groupMembers = (groupId: string) =>
  `/groups/${groupId}/members` as const

// ============================================
// Chat Route Helpers (typed routes, no query params for type)
// ============================================

/**
 * Get route for individual (1:1) chat
 */
export const individualChat = (id: string, from?: string) => {
  const params = new URLSearchParams()
  if (from) params.set('from', from)
  const queryString = params.toString()
  return queryString ? `/chats/individual/${id}?${queryString}` : `/chats/individual/${id}`
}

/**
 * Get route for private group chat
 */
export const groupChat = (id: string, from?: string) => {
  const params = new URLSearchParams()
  if (from) params.set('from', from)
  const queryString = params.toString()
  return queryString ? `/chats/group/${id}?${queryString}` : `/chats/group/${id}`
}

/**
 * Get route for community chat
 */
export const communityChat = (id: number | string, from?: 'discover' | 'groups') => {
  const params = new URLSearchParams()
  if (from) params.set('from', from)
  const queryString = params.toString()
  return queryString ? `/chats/community/${id}?${queryString}` : `/chats/community/${id}`
}

// ============================================
// Profile Route Helpers
// ============================================

/**
 * Get route for a profile
 */
export const profileDetail = (id: string) =>
  `/profiles/${id}` as const

// ============================================
// Route Params Types
// ============================================
export type DiscoverTab = 'dads' | 'communities' | 'events'
export type GroupsTab = 'communities' | 'events'
export type ChatType = 'individual' | 'group' | 'community'

// ============================================
// Navigation Defaults
// ============================================
export const DEFAULTS = {
  DISCOVER_TAB: 'dads' as DiscoverTab,
  GROUPS_TAB: 'communities' as GroupsTab,
}
