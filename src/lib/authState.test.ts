import { describe, expect, it } from 'vitest'
import type { AuthState } from '@/types/auth'
import { userFromResponse } from './user'
import { withAuth, withAuthFailure, withRefreshedToken } from './authState'

const user = userFromResponse({
  id: 'u1',
  name: 'Sam',
  age: null,
  date_of_birth: null,
  city: 'Toronto',
  province: 'ON',
  about: '',
  avatar_url: null,
})

const signedOut: AuthState = { user: null, accessToken: null, role: null, loading: false }
const member: AuthState = { user, accessToken: 'tok', role: null, loading: false }
const ghost: AuthState = { user: null, accessToken: 'tok', role: 'admin', loading: false }

// Two invariants hold the whole design together: no token means no role, and a
// ghost role never has a user. Hooks that gate on `!!user` rely on the second to
// stay off for a ghost, so every way into the state is checked against both.
describe('withAuth', () => {
  it('signs a member in', () => {
    expect(withAuth(signedOut, { user, accessToken: 'tok', role: null })).toEqual(member)
  })

  it('keeps the current role when none is given, as a profile edit does', () => {
    const next = withAuth(ghost, { user: null, accessToken: 'tok2' })

    expect(next.role).toBe('admin')
    expect(next.accessToken).toBe('tok2')
  })

  it('sets the role when one is given', () => {
    expect(withAuth(signedOut, { user: null, accessToken: 'tok', role: 'admin' }).role).toBe('admin')
  })

  it('clears the role when signing out, even if the caller passes one', () => {
    expect(withAuth(ghost, { user: null, accessToken: null }).role).toBeNull()
    expect(withAuth(ghost, { user: null, accessToken: null, role: 'admin' }).role).toBeNull()
  })

  it('never gives a ghost a user', () => {
    expect(withAuth(signedOut, { user, accessToken: 'tok', role: 'admin' }).user).toBeNull()
  })

  it('keeps a ghost without a user when a later update omits the role', () => {
    expect(withAuth(ghost, { user, accessToken: 'tok' }).user).toBeNull()
  })

  it('keeps the user for a member', () => {
    expect(withAuth(member, { user, accessToken: 'tok' }).user).toBe(user)
  })

  it('leaves the loading flag alone', () => {
    expect(withAuth({ ...signedOut, loading: true }, { user, accessToken: 'tok' }).loading).toBe(true)
  })
})

describe('withRefreshedToken', () => {
  it('moves the token and the role together', () => {
    const next = withRefreshedToken(member, 'tok2', null)

    expect(next.accessToken).toBe('tok2')
    expect(next.role).toBeNull()
  })

  it('keeps a member signed in as themselves', () => {
    expect(withRefreshedToken(member, 'tok2', null).user).toBe(user)
  })

  it('drops the user of a member who has become a ghost mid-session', () => {
    const next = withRefreshedToken(member, 'tok2', 'admin')

    expect(next.role).toBe('admin')
    expect(next.user).toBeNull()
  })

  it('lets a ghost who has been demoted fall back to a member with no user yet', () => {
    const next = withRefreshedToken(ghost, 'tok2', null)

    expect(next.role).toBeNull()
    expect(next.user).toBeNull()
  })
})

describe('withAuthFailure', () => {
  it('clears the session whatever it was', () => {
    expect(withAuthFailure(member)).toEqual(signedOut)
    expect(withAuthFailure(ghost)).toEqual(signedOut)
  })

  it('leaves the loading flag alone', () => {
    expect(withAuthFailure({ ...member, loading: true }).loading).toBe(true)
  })
})
