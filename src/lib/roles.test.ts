import { describe, expect, it } from 'vitest'
import { GHOST_ROLES, isAdminRole, isGhostRole } from './roles'

// The backend decides what a role may do. These helpers decide what to render
// and which requests to skip, so the cases that matter are the ones where a
// wrong answer would treat a member as a ghost, or a ghost as a member.
describe('isGhostRole', () => {
  it('is true for the admin role', () => {
    expect(isGhostRole('admin')).toBe(true)
  })

  it('is false for no role, which is an ordinary member', () => {
    expect(isGhostRole(null)).toBe(false)
    expect(isGhostRole(undefined)).toBe(false)
  })

  it('is false for a role it does not know, so a member-shaped role is never a ghost by accident', () => {
    expect(isGhostRole('partner')).toBe(false)
    expect(isGhostRole('')).toBe(false)
  })

  it('is case-sensitive, matching the backend', () => {
    expect(isGhostRole('Admin')).toBe(false)
  })
})

describe('isAdminRole', () => {
  it('is true only for the admin role', () => {
    expect(isAdminRole('admin')).toBe(true)
    expect(isAdminRole(null)).toBe(false)
    expect(isAdminRole(undefined)).toBe(false)
    expect(isAdminRole('Admin')).toBe(false)
    expect(isAdminRole('partner')).toBe(false)
  })
})

describe('GHOST_ROLES', () => {
  it('mirrors the backend list, which is just the admin role today', () => {
    // Pinned so that adding a ghost role is a deliberate edit here and in the
    // backend's constants.py, not something that happens to one side only.
    expect([...GHOST_ROLES]).toEqual(['admin'])
  })
})
