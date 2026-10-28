import { AxiosError, type AxiosResponse } from 'axios'
import { describe, expect, it, vi } from 'vitest'
import type { MeResponse } from '@/types/users'
import { loadProfile } from './loadProfile'

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

// Every way of getting a session goes through this, so it is where a ghost has
// to be kept away from /users/me (which refuses it), and where a real member
// has to keep getting exactly the profile they got before.
describe('loadProfile', () => {
  it('answers a ghost without asking the server for a profile', async () => {
    const fetchMe = vi.fn()

    expect(await loadProfile('admin', fetchMe)).toEqual({ kind: 'ghost' })
    expect(fetchMe).not.toHaveBeenCalled()
  })

  it('loads the profile of a member with no role', async () => {
    const fetchMe = vi.fn().mockResolvedValue(me)

    const result = await loadProfile(null, fetchMe)

    expect(fetchMe).toHaveBeenCalledTimes(1)
    expect(result.kind).toBe('member')
    expect(result.kind === 'member' && result.user.name).toBe('Sam')
  })

  it('loads the profile of a role it does not know to be a ghost, so a future non-ghost role works', async () => {
    const fetchMe = vi.fn().mockResolvedValue(me)

    const result = await loadProfile('partner', fetchMe)

    expect(fetchMe).toHaveBeenCalledTimes(1)
    expect(result.kind).toBe('member')
  })

  it('treats a 404 as an account that has not been set up, not as a failure', async () => {
    const fetchMe = vi.fn().mockRejectedValue(httpError(404))

    expect(await loadProfile(null, fetchMe)).toEqual({ kind: 'no-profile' })
  })

  it('lets any other failure through for the caller to report', async () => {
    for (const status of [401, 403, 500]) {
      const error = httpError(status)

      await expect(loadProfile(null, vi.fn().mockRejectedValue(error))).rejects.toBe(error)
    }
  })

  it('lets a failure that never reached the server through too', async () => {
    const offline = new Error('Network Error')

    await expect(loadProfile(null, vi.fn().mockRejectedValue(offline))).rejects.toBe(offline)
  })
})
