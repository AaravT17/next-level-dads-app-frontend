import { describe, expect, it } from 'vitest'
import { adminGate, protectedGate, publicGate, setupGate, type GateSession } from './authGate'
import { ROUTES } from './routes'

const profile = { id: 'u1' }

const signedOut: GateSession = { accessToken: null, user: null, role: null }
const member: GateSession = { accessToken: 'tok', user: profile, role: null }
const memberNoProfile: GateSession = { accessToken: 'tok', user: null, role: null }
const ghost: GateSession = { accessToken: 'tok', user: null, role: 'admin' }
// A role the backend knows that is not a ghost's, such as a future partner. It must follow the member flow.
const partner: GateSession = { accessToken: 'tok', user: profile, role: 'partner' }
const partnerNoProfile: GateSession = { accessToken: 'tok', user: null, role: 'partner' }

const to = (path: string) => ({ kind: 'redirect', to: path })
const allow = { kind: 'allow' }

// The guards run for every user on every navigation. Two things have to hold:
// a ghost, which has a token but no profile, gets through where a member
// without a profile is sent to setup; and every outcome for a member and for a
// signed-out visitor is exactly what it was before ghosts existed.
describe('protectedGate', () => {
  it('sends a signed-out visitor to welcome', () => {
    expect(protectedGate(signedOut)).toEqual(to(ROUTES.WELCOME))
  })

  it('lets a member in', () => {
    expect(protectedGate(member)).toEqual(allow)
  })

  it('sends a member with no profile to setup', () => {
    expect(protectedGate(memberNoProfile)).toEqual(to(ROUTES.SETUP))
  })

  it('lets a ghost in, with no profile, instead of sending it to setup', () => {
    expect(protectedGate(ghost)).toEqual(allow)
  })

  it('treats a role that is not a ghost role like a member', () => {
    expect(protectedGate(partner)).toEqual(allow)
    expect(protectedGate(partnerNoProfile)).toEqual(to(ROUTES.SETUP))
  })
})

describe('publicGate', () => {
  it('shows login and register to a signed-out visitor', () => {
    expect(publicGate(signedOut)).toEqual(allow)
  })

  it('sends a signed-in member onward to the app', () => {
    expect(publicGate(member)).toEqual(to(ROUTES.HOME_AFTER_AUTH))
  })

  it('sends a signed-in member with no profile onward to setup', () => {
    expect(publicGate(memberNoProfile)).toEqual(to(ROUTES.SETUP))
  })

  it('sends a signed-in ghost onward to the app, not to setup', () => {
    expect(publicGate(ghost)).toEqual(to(ROUTES.HOME_AFTER_AUTH))
  })

  it('treats a role that is not a ghost role like a member', () => {
    expect(publicGate(partnerNoProfile)).toEqual(to(ROUTES.SETUP))
  })
})

describe('setupGate', () => {
  it('sends a signed-out visitor to welcome', () => {
    expect(setupGate(signedOut)).toEqual(to(ROUTES.WELCOME))
  })

  it('shows setup to a member who has no profile yet', () => {
    expect(setupGate(memberNoProfile)).toEqual(allow)
  })

  it('moves a member who already has a profile past setup', () => {
    expect(setupGate(member)).toEqual(to(ROUTES.ONBOARDING_WELCOME))
  })

  it('skips setup for a ghost and sends it into the app', () => {
    expect(setupGate(ghost)).toEqual(to(ROUTES.HOME_AFTER_AUTH))
  })

  it('treats a role that is not a ghost role like a member', () => {
    expect(setupGate(partnerNoProfile)).toEqual(allow)
  })
})

describe('adminGate', () => {
  it('sends a signed-out visitor to welcome', () => {
    expect(adminGate(signedOut)).toEqual(to(ROUTES.WELCOME))
  })

  it('lets the admin role in without a profile', () => {
    expect(adminGate(ghost)).toEqual(allow)
  })

  it('goes by the role alone, so an admin who still has a profile gets in too', () => {
    expect(adminGate({ ...member, role: 'admin' })).toEqual(allow)
  })

  it('sends a member to the app', () => {
    expect(adminGate(member)).toEqual(to(ROUTES.HOME_AFTER_AUTH))
  })

  it('does not let another role in just because it is a recognised one', () => {
    expect(adminGate(partner)).toEqual(to(ROUTES.HOME_AFTER_AUTH))
  })
})
