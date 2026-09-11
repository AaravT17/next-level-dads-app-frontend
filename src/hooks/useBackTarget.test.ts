import { describe, it, expect } from 'vitest'
import { resolveBackTarget } from './useBackTarget'

const FALLBACK = '/you'

describe('resolveBackTarget', () => {
  it('returns the path the linking screen passed', () => {
    expect(resolveBackTarget('/dads', FALLBACK)).toBe('/dads')
  })

  it('keeps the query string so browse filters survive the round trip', () => {
    expect(resolveBackTarget('/dads?provinces=ON&name=sam', FALLBACK)).toBe(
      '/dads?provinces=ON&name=sam',
    )
  })

  it('falls back when the screen was opened without state', () => {
    expect(resolveBackTarget(undefined, FALLBACK)).toBe(FALLBACK)
    expect(resolveBackTarget(null, FALLBACK)).toBe(FALLBACK)
  })

  it('falls back when state carries a non-string from', () => {
    expect(resolveBackTarget({ pathname: '/dads' }, FALLBACK)).toBe(FALLBACK)
    expect(resolveBackTarget(42, FALLBACK)).toBe(FALLBACK)
  })

  it('refuses an absolute URL, which would navigate off the app', () => {
    expect(resolveBackTarget('https://evil.com', FALLBACK)).toBe(FALLBACK)
  })

  it('refuses a protocol-relative URL', () => {
    expect(resolveBackTarget('//evil.com', FALLBACK)).toBe(FALLBACK)
  })

  it('refuses a relative path, which resolves against the current route', () => {
    expect(resolveBackTarget('dads', FALLBACK)).toBe(FALLBACK)
  })
})
