import { describe, expect, it } from 'vitest'
import type { MeResponse } from '@/types/users'
import { userFromResponse } from './user'

const minimal: MeResponse = {
  id: 'u1',
  name: 'Sam',
  age: null,
  date_of_birth: null,
  city: 'Toronto',
  province: 'ON',
  about: 'Dad of two',
  avatar_url: null,
}

// This mapper replaced five hand-written copies. What matters is that each
// default is the one every copy used, so that no sign-in path changes behaviour.
describe('userFromResponse', () => {
  it('maps the API shape to the app shape', () => {
    const user = userFromResponse({
      ...minimal,
      age: 34,
      date_of_birth: '1990-05-01',
      avatar_url: 'https://cdn.example/a.png',
      interests: [{ id: 'i1', slug: 'hiking' }],
      children_age_ranges: ['0-2'],
      kid_count: 2,
      goals: ['friends'],
      primary_goal: 'friends',
      connection_styles: ['coffee'],
      match_priorities: ['location'],
      icebreakers: [{ prompt_slug: 'p1', answer: 'hi' }],
      preferences: { marketing_emails_opt_in: true },
      legal_acceptances: { terms: true, privacy_policy: true },
      notification_state: { last_read_at: '2026-01-01T00:00:00Z', last_cleared_at: null },
    })

    expect(user).toEqual({
      id: 'u1',
      name: 'Sam',
      age: 34,
      date_of_birth: '1990-05-01',
      city: 'Toronto',
      province: 'ON',
      about: 'Dad of two',
      avatarUrl: 'https://cdn.example/a.png',
      interests: [{ id: 'i1', slug: 'hiking' }],
      children_age_ranges: ['0-2'],
      kid_count: 2,
      goals: ['friends'],
      primary_goal: 'friends',
      connection_styles: ['coffee'],
      match_priorities: ['location'],
      icebreakers: [{ prompt_slug: 'p1', answer: 'hi' }],
      preferences: { marketing_emails_opt_in: true },
      legal_acceptances: { terms: true, privacy_policy: true },
      notificationState: { lastReadAt: '2026-01-01T00:00:00Z', lastClearedAt: null },
    })
  })

  it('fills each omitted field with the default the old copies used', () => {
    const user = userFromResponse(minimal)

    expect(user.interests).toEqual([])
    expect(user.children_age_ranges).toEqual([])
    expect(user.kid_count).toBeNull()
    expect(user.goals).toBeNull()
    expect(user.primary_goal).toBeNull()
    expect(user.connection_styles).toBeNull()
    expect(user.match_priorities).toBeNull()
    expect(user.icebreakers).toBeNull()
    expect(user.preferences).toEqual({ marketing_emails_opt_in: false })
    expect(user.legal_acceptances).toEqual({ terms: false, privacy_policy: false })
    expect(user.notificationState).toEqual({ lastReadAt: null, lastClearedAt: null })
  })

  it('treats a missing acceptance as not accepted, never as accepted', () => {
    const user = userFromResponse({ ...minimal, legal_acceptances: { terms: true } })

    expect(user.legal_acceptances).toEqual({ terms: true, privacy_policy: false })
  })

  it('carries no admin flag: admin status is the role, not part of the profile', () => {
    expect(userFromResponse(minimal)).not.toHaveProperty('isAdmin')
  })

  it('lets a caller override one field by spreading, as profile creation and update do', () => {
    const user = { ...userFromResponse(minimal), avatarUrl: 'https://cdn.example/new.png' }

    expect(user.avatarUrl).toBe('https://cdn.example/new.png')
    expect(user.name).toBe('Sam')
  })
})
