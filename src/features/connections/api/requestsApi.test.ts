import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchIncomingRequests, fetchOutgoingRequests } from './requestsApi'
import type { ConnectionsCursor, ConnectionsFilters } from '@/types/users'

/**
 * The two request directions differ by one word — `/requests` against
 * `/requested` — and the responses are the same shape, so swapping them fails
 * silently: the Sent panel would fill with people asking to connect with you,
 * each carrying an Accept button, and nothing would throw.
 *
 * Everything else here is the paging contract the two share. Both feed
 * DadCard, which rewrites their caches by key prefix, so a cursor going out
 * under the wrong parameter name means an infinite scroll that re-serves page
 * one forever.
 */

const get = vi.fn()

vi.mock('@/api/axiosPrivate', () => ({
  default: {
    get: (...args: unknown[]) => get(...args),
  },
}))

const NO_FILTERS: ConnectionsFilters = { name: '' }

const CURSOR: ConnectionsCursor = {
  cursor_id: 'connection-7',
  cursor_updated_at: '2026-09-01T12:00:00Z',
}

/** The URL and query string of the single call made during a test. */
function lastCall(): { path: string; params: URLSearchParams } {
  expect(get).toHaveBeenCalledTimes(1)
  const [path, config] = get.mock.calls[0] as [string, { params: URLSearchParams }]
  return { path, params: config.params }
}

beforeEach(() => {
  get.mockReset()
  get.mockResolvedValue({ data: [] })
})

describe('endpoint selection', () => {
  it('reads sent requests from /api/connections/requested', async () => {
    await fetchOutgoingRequests(NO_FILTERS)
    expect(lastCall().path).toBe('/api/connections/requested')
  })

  it('reads received requests from /api/connections/requests', async () => {
    await fetchIncomingRequests(NO_FILTERS)
    expect(lastCall().path).toBe('/api/connections/requests')
  })
})

describe('query parameters', () => {
  it('sends nothing when there is no search term and no cursor', async () => {
    await fetchOutgoingRequests(NO_FILTERS)
    expect([...lastCall().params]).toEqual([])
  })

  it('omits an empty search term rather than sending name=', async () => {
    // The API treats a present-but-empty name as a filter to apply.
    await fetchOutgoingRequests({ name: '' })
    expect(lastCall().params.has('name')).toBe(false)
  })

  it('passes a search term through', async () => {
    await fetchOutgoingRequests({ name: 'Sam' })
    expect(lastCall().params.get('name')).toBe('Sam')
  })

  it('pages on the connection row, not the profile', async () => {
    // These rows are ordered by when the connection last changed, so the
    // cursor has to carry the connection's id and timestamp.
    await fetchOutgoingRequests(NO_FILTERS, CURSOR)
    const { params } = lastCall()
    expect(params.get('cursor_id')).toBe('connection-7')
    expect(params.get('cursor_updated_at')).toBe('2026-09-01T12:00:00Z')
  })

  it('builds the same query for both directions', async () => {
    await fetchOutgoingRequests({ name: 'Sam' }, CURSOR)
    const sent = lastCall().params.toString()

    get.mockReset()
    get.mockResolvedValue({ data: [] })

    await fetchIncomingRequests({ name: 'Sam' }, CURSOR)
    expect(lastCall().params.toString()).toBe(sent)
  })
})

it('returns the response body', async () => {
  get.mockResolvedValue({ data: [{ id: 'dad-1' }] })
  await expect(fetchOutgoingRequests(NO_FILTERS)).resolves.toEqual([{ id: 'dad-1' }])
})
