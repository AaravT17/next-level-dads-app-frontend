import type { User } from '@/types/auth'
import type { MeResponse } from '@/types/users'

/**
 * Builds the app's `User` from the API's snake_case profile.
 *
 * Five places used to do this by hand, each with its own copy of the same
 * defaults. One mapper means a field added to the profile, or one taken away,
 * is a single edit and cannot drift between login, Google sign-in, session
 * restore, profile creation and profile update.
 *
 * Callers that need a different value for one field, because they know better
 * than the response does, spread the result and override it.
 */
export function userFromResponse(data: MeResponse): User {
  return {
    id: data.id,
    name: data.name,
    age: data.age,
    date_of_birth: data.date_of_birth,
    city: data.city,
    province: data.province,
    about: data.about,
    avatarUrl: data.avatar_url,
    interests: data.interests ?? [],
    children_age_ranges: data.children_age_ranges ?? [],
    kid_count: data.kid_count ?? null,
    goals: data.goals ?? null,
    primary_goal: data.primary_goal ?? null,
    connection_styles: data.connection_styles ?? null,
    match_priorities: data.match_priorities ?? null,
    icebreakers: data.icebreakers ?? null,
    preferences: {
      marketing_emails_opt_in: data.preferences?.marketing_emails_opt_in ?? false,
    },
    legal_acceptances: {
      terms: data.legal_acceptances?.terms ?? false,
      privacy_policy: data.legal_acceptances?.privacy_policy ?? false,
    },
    notificationState: {
      lastReadAt: data.notification_state?.last_read_at ?? null,
      lastClearedAt: data.notification_state?.last_cleared_at ?? null,
    },
  }
}
