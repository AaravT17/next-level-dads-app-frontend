import { describe, it, expect, beforeEach } from 'vitest'
import { shouldStampVisit, resetVisitThrottle, VISIT_THROTTLE_MS } from './visitThrottle'

describe('shouldStampVisit', () => {
  beforeEach(() => resetVisitThrottle())

  it('allows the first visit to a community', () => {
    expect(shouldStampVisit('a', 1000)).toBe(true)
  })

  it('suppresses a second visit inside the throttle window', () => {
    shouldStampVisit('a', 1000)

    expect(shouldStampVisit('a', 1000 + VISIT_THROTTLE_MS - 1)).toBe(false)
  })

  it('allows a visit once the window has passed', () => {
    shouldStampVisit('a', 1000)

    expect(shouldStampVisit('a', 1000 + VISIT_THROTTLE_MS)).toBe(true)
  })

  it('throttles each community independently', () => {
    shouldStampVisit('a', 1000)

    expect(shouldStampVisit('b', 1000)).toBe(true)
  })

  it('does not extend the window on a suppressed visit', () => {
    shouldStampVisit('a', 0)
    // A bounce mid-window must not push the next allowed stamp further out.
    shouldStampVisit('a', VISIT_THROTTLE_MS - 1)

    expect(shouldStampVisit('a', VISIT_THROTTLE_MS)).toBe(true)
  })
})
