import { describe, expect, it } from 'vitest'
import { GHOST_USER, personalUser } from './personalUser'
import { getProfileIncomplete } from './profileCompleteness'
import { userFromResponse } from './user'

const member = userFromResponse({
  id: 'u1',
  name: 'Sam',
  age: 40,
  date_of_birth: '1986-01-01',
  city: 'Ottawa',
  province: 'ON',
  about: 'hi',
  avatar_url: null,
})

// The personal pages draw whatever this returns. For a member it has to be
// their own profile and nothing else, and for a ghost it has to be one stable
// empty profile, because Edit profile re-seeds its form every time it changes.
describe('personalUser', () => {
  it('gives a member their own profile, untouched', () => {
    expect(personalUser(member, null)).toBe(member)
  })

  it('gives a ghost the placeholder', () => {
    expect(personalUser(null, 'admin')).toBe(GHOST_USER)
  })

  it('gives the very same placeholder every time', () => {
    expect(personalUser(null, 'admin')).toBe(personalUser(null, 'admin'))
  })

  it('never swaps a real profile for the placeholder, whatever the role', () => {
    expect(personalUser(member, 'admin')).toBe(member)
  })

  it('gives nothing to a member who has no profile yet', () => {
    expect(personalUser(null, null)).toBeNull()
  })

  it('gives nothing to a role that is not a ghost role', () => {
    expect(personalUser(null, 'partner')).toBeNull()
  })

  it('gives nothing when signed out', () => {
    expect(personalUser(null, undefined)).toBeNull()
  })
})

describe('GHOST_USER', () => {
  it('is named Admin and has no profile details to show', () => {
    expect(GHOST_USER.name).toBe('Admin')
    expect(GHOST_USER.avatarUrl).toBeNull()
    expect(GHOST_USER.city).toBe('')
    expect(GHOST_USER.province).toBe('')
    expect(GHOST_USER.kid_count).toBeNull()
    expect(GHOST_USER.interests).toEqual([])
  })

  it('reads as an incomplete profile, which is why the pages hide those markers for a ghost', () => {
    const incomplete = getProfileIncomplete({
      kid_count: GHOST_USER.kid_count,
      date_of_birth: GHOST_USER.date_of_birth,
      about: GHOST_USER.about,
      goals: GHOST_USER.goals,
      primary_goal: GHOST_USER.primary_goal,
      connection_styles: GHOST_USER.connection_styles,
      match_priorities: GHOST_USER.match_priorities,
      interestCount: GHOST_USER.interests.length,
      icebreakerCount: GHOST_USER.icebreakers?.length ?? 0,
    })

    expect(Object.values(incomplete).every(Boolean)).toBe(true)
  })
})
