/**
 * Centralized route configuration.
 *
 * The app is organised by *object type*, not by membership state. Whether you
 * have joined a community is a property of that community — rendered as a
 * button label and a `scope` filter — not a separate section of the app. The
 * previous split (browse-all under /discover, joined under /groups) meant the
 * same card appeared in two places meaning two different things, which is why
 * cards had to inspect the pathname to know how to render themselves.
 *
 * Route structure:
 * ├── /                       Welcome
 * ├── /setup                  Profile setup
 * ├── /dads                   Browse dads
 * │   └── /dads/:id           A dad's profile
 * ├── /groups/:tab            Communities | Events, filtered by ?scope=joined|all
 * │   ├── /communities/:id                        Community detail
 * │   │   └── .../conversations/:conversationId   A post
 * │   └── /events/:eventId                        Event detail
 * ├── /chats                  Chat list
 * │   ├── /chats/:id          A conversation
 * │   └── /chats/:id/manage   Group management
 * └── /you                    Your hub
 *     ├── /you/edit           Edit profile
 *     ├── /you/settings       Preferences, legal, account
 *     ├── /you/connections    Accepted connections
 *     └── /you/requests       Incoming and outgoing requests
 */

export const ROUTES = {
  // Auth & onboarding
  WELCOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/verify-email',
  SETUP: '/setup',

  // Dads
  DADS: '/dads',
  DAD_DETAIL: '/dads/:id',

  // Groups
  GROUPS: '/groups',
  GROUPS_COMMUNITIES: '/groups/communities',
  GROUPS_EVENTS: '/groups/events',
  COMMUNITY_DETAIL: '/communities/:communityId',
  CONVERSATION_DETAIL: '/communities/:communityId/conversations/:conversationId',
  EVENT_DETAIL: '/events/:eventId',

  // Chats
  CHATS: '/chats',
  CHAT: '/chats/:id',
  CHAT_MANAGE: '/chats/:id/manage',

  // You
  YOU: '/you',
  YOU_EDIT: '/you/edit',
  YOU_SETTINGS: '/you/settings',
  CONNECTIONS: '/you/connections',
  REQUESTS: '/you/requests',

  // Admin
  ADMIN: '/admin',

  /**
   * Where an authenticated user lands.
   *
   * Named separately so auth logic never compares against a tab route. The
   * guards previously used ROUTES.DISCOVER as their "authenticated" sentinel,
   * which would have kept type-checking but silently misbehaved the moment
   * that route was renamed.
   */
  HOME_AFTER_AUTH: '/dads',
} as const

// ============================================
// Types
// ============================================
export type GroupsTab = 'communities' | 'events'

/** Whether a list shows only what you have joined, or everything. */
export type GroupScope = 'joined' | 'all'

// ============================================
// Helpers
// ============================================
export const dadDetail = (id: string) => `/dads/${id}` as const

export const groupsTab = (tab: GroupsTab, scope?: GroupScope) =>
  scope ? `/groups/${tab}?scope=${scope}` : `/groups/${tab}`

export const communityDetail = (communityId: number | string) =>
  `/communities/${communityId}` as const

export const conversationDetail = (communityId: string, conversationId: string) =>
  `/communities/${communityId}/conversations/${conversationId}` as const

export const eventDetail = (eventId: number | string) => `/events/${eventId}` as const

export const chat = (id: string) => `/chats/${id}` as const
export const chatManage = (id: string) => `/chats/${id}/manage` as const

/**
 * A dad's profile. There is one profile route now; the CTA is driven by the
 * viewer's connection_status rather than by which section they arrived from.
 */
export const profileDetail = dadDetail

// ============================================
// Defaults
// ============================================
export const DEFAULTS = {
  GROUPS_TAB: 'communities' as GroupsTab,
  GROUP_SCOPE: 'joined' as GroupScope,
}
