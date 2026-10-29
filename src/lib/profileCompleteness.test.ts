import { describe, expect, it } from 'vitest'
import { PROFILE_COMPLETE, getProfileIncomplete } from './profileCompleteness'

const empty = {
  kid_count: null,
  date_of_birth: null,
  about: '',
  goals: null,
  primary_goal: null,
  connection_styles: null,
  match_priorities: null,
  interestCount: 0,
  icebreakerCount: 0,
}

describe('PROFILE_COMPLETE', () => {
  it('flags nothing', () => {
    expect(Object.values(PROFILE_COMPLETE).some(Boolean)).toBe(false)
  })

  it('has every field the real check reports, so no marker can slip through for a ghost', () => {
    expect(Object.keys(PROFILE_COMPLETE).sort()).toEqual(Object.keys(getProfileIncomplete(empty)).sort())
  })
})
