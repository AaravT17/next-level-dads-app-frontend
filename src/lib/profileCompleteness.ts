import { MIN_INTERESTS } from '@/config/constants'

export interface ProfileCompletenessInput {
  kid_count: number | null
  date_of_birth: string | null | undefined
  about: string | null | undefined
  goals: string[] | null | undefined
  primary_goal: string | null | undefined
  connection_styles: string[] | null | undefined
  match_priorities: string[] | null | undefined
  interestCount: number
  icebreakerCount: number
}

/**
 * Returns a per-field incomplete map. Consumed by SystemBanners (from user state)
 * and MyProfile (from live form state) so both stay in sync from one source of truth.
 *
 * Note: icebreakerCount threshold is 3 (complete profile), not MIN_ICEBREAKERS (1),
 * which is the lower signup minimum that allows proceeding with just one answer.
 */
export function getProfileIncomplete(data: ProfileCompletenessInput) {
  return {
    dateOfBirth: !data.date_of_birth,
    about: !data.about,
    kidCount: data.kid_count == null,
    goals: !(data.goals?.length),
    primaryGoal: !data.primary_goal,
    connectionStyles: !(data.connection_styles?.length),
    matchPriorities: !(data.match_priorities?.length),
    interests: data.interestCount < MIN_INTERESTS,
    icebreakers: data.icebreakerCount < 3,
  }
}

export type ProfileIncomplete = ReturnType<typeof getProfileIncomplete>

/**
 * Nothing flagged. For someone with no profile to complete, such as an admin
 * browsing without one, so the "Incomplete" markers stay off. Typed as the full
 * map, so a field added above has to be added here too.
 */
export const PROFILE_COMPLETE: ProfileIncomplete = {
  dateOfBirth: false,
  about: false,
  kidCount: false,
  goals: false,
  primaryGoal: false,
  connectionStyles: false,
  matchPriorities: false,
  interests: false,
  icebreakers: false,
}
