import { AxiosError, type AxiosResponse } from 'axios'
import { describe, expect, it, vi } from 'vitest'
import type { MeResponse } from '@/types/users'
import { restoreSession } from './restoreSession'

const me: MeResponse = {
  id: 'u1',
  name: 'Sam',
  age: 34,
  date_of_birth: null,
  city: 'Toronto',
  province: 'ON',
  about: 'hi',
  avatar_url: null,
}

const httpError = (status: number) =>
  new AxiosError('failed', 'ERR_BAD_REQUEST', undefined, undefined, {
    status,
    data: {},
    statusText: '',
    headers: {},
    config: {},
  } as AxiosResponse)

// This runs on every page load for everyone, so what it must get right is the
// order (refresh before profile), the ghost (no profile request at all), and
// the difference between a visitor who is simply signed out and a real failure.
describe('restoreSession', () => {
  it('brings back a member: refresh first, then their profile', async () => {
    const calls: string[] = []
    const refresh = vi.fn(async () => {
      calls.push('refresh')
      return { role: null }
    })
    const fetchMe = vi.fn(async () => {
      calls.push('me')
      return me
    })

    const result = await restoreSession(refresh, fetchMe)

    expect(calls).toEqual(['refresh', 'me'])
    expect(result.kind).toBe('member')
    expect(result.kind === 'member' && result.user.id).toBe('u1')
  })

  it('brings back a ghost without ever asking for a profile', async () => {
    const fetchMe = vi.fn()

    const result = await restoreSession(async () => ({ role: 'admin' }), fetchMe)

    expect(result).toEqual({ kind: 'ghost' })
    expect(fetchMe).not.toHaveBeenCalled()
  })

  it('reports an account with no profile yet as an outcome, not a failure', async () => {
    const result = await restoreSession(
      async () => ({ role: null }),
      vi.fn().mockRejectedValue(httpError(404)),
    )

    expect(result).toEqual({ kind: 'no-profile' })
  })

  it('treats a missing or expired refresh cookie as an ordinary signed-out visitor', async () => {
    const fetchMe = vi.fn()

    const result = await restoreSession(vi.fn().mockRejectedValue(httpError(401)), fetchMe)

    expect(result).toEqual({ kind: 'signed-out' })
    expect(fetchMe).not.toHaveBeenCalled()
  })

  it('reports every other refresh failure, including a refused role', async () => {
    for (const status of [403, 429, 500]) {
      const error = httpError(status)

      const result = await restoreSession(vi.fn().mockRejectedValue(error), vi.fn())

      expect(result).toEqual({ kind: 'failed', error })
    }
  })

  it('reports a refresh that never reached the server', async () => {
    const offline = new Error('Network Error')

    const result = await restoreSession(vi.fn().mockRejectedValue(offline), vi.fn())

    expect(result).toEqual({ kind: 'failed', error: offline })
  })

  it('reports a profile request that fails after a good refresh', async () => {
    const error = httpError(500)

    const result = await restoreSession(async () => ({ role: null }), vi.fn().mockRejectedValue(error))

    expect(result).toEqual({ kind: 'failed', error })
  })

  it('never throws, whatever goes wrong', async () => {
    await expect(restoreSession(() => Promise.reject(new Error('boom')), vi.fn())).resolves.toBeDefined()
  })
})
