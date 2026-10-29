import { InfiniteQueryObserver, QueryClient, QueryObserver } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { emptyPages, withGhostPlaceholder } from './memberQuery'

const wait = (ms = 20) => new Promise((resolve) => setTimeout(resolve, ms))

// The helper is the only thing standing between a ghost and a wall of 403s, and
// between a member and a query that quietly stops fetching. So the properties
// that matter are checked against the real library, not just the options object.
describe('withGhostPlaceholder', () => {
  const options = { queryKey: ['user', 'stats'], staleTime: 60_000, enabled: true }

  it('hands a member back the very same options, untouched', () => {
    expect(withGhostPlaceholder(options, false, { empty: true })).toBe(options)
  })

  it('switches a ghost off and gives it the empty result, keeping everything else', () => {
    const result = withGhostPlaceholder(options, true, { empty: true })

    expect(result).toEqual({ ...options, enabled: false, placeholderData: { empty: true } })
  })

  it('switches a ghost off even where the query was enabled by something else', () => {
    expect(withGhostPlaceholder({ ...options, enabled: true }, true, []).enabled).toBe(false)
  })

  it('does not change the options it was given', () => {
    const before = { ...options }

    withGhostPlaceholder(options, true, [])

    expect(options).toEqual(before)
  })
})

describe('what a ghost gets from a real query', () => {
  const fetchStats = () => vi.fn(async () => ({ connections: 3 }))

  it('is a settled, empty result, with no request made', async () => {
    const client = new QueryClient()
    const queryFn = fetchStats()
    const observer = new QueryObserver(
      client,
      withGhostPlaceholder({ queryKey: ['stats'], queryFn }, true, { connections: 0 }),
    )
    observer.subscribe(() => {})
    await wait()

    const result = observer.getCurrentResult()
    expect(queryFn).not.toHaveBeenCalled()
    expect(result.isPending).toBe(false)
    expect(result.data).toEqual({ connections: 0 })
  })

  it('leaves nothing in the cache for a member to inherit', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { staleTime: 5 * 60_000 } } })
    const ghostFn = fetchStats()
    new QueryObserver(
      client,
      withGhostPlaceholder({ queryKey: ['stats'], queryFn: ghostFn }, true, { connections: 0 }),
    ).subscribe(() => {})
    await wait()
    expect(client.getQueryData(['stats'])).toBeUndefined()

    // a member signs in on the same client and asks for the same key
    const memberFn = fetchStats()
    const member = new QueryObserver(
      client,
      withGhostPlaceholder({ queryKey: ['stats'], queryFn: memberFn }, false, { connections: 0 }),
    )
    member.subscribe(() => {})
    await wait()

    expect(memberFn).toHaveBeenCalledTimes(1)
    expect(member.getCurrentResult().data).toEqual({ connections: 3 })
  })

  it('shows a member the loading state while the request is in flight, not an empty result', async () => {
    const client = new QueryClient()
    const slow = vi.fn(async () => {
      await wait(40)
      return { connections: 3 }
    })
    const member = new QueryObserver(
      client,
      withGhostPlaceholder({ queryKey: ['stats'], queryFn: slow }, false, { connections: 0 }),
    )
    member.subscribe(() => {})
    await wait(5)

    expect(member.getCurrentResult().isPending).toBe(true)
    expect(member.getCurrentResult().data).toBeUndefined()
  })

  it('is a settled, empty list for an infinite query, with no further page', async () => {
    const client = new QueryClient()
    const queryFn = vi.fn(async () => [{ id: 'c1' }])
    const observer = new InfiniteQueryObserver(
      client,
      withGhostPlaceholder(
        {
          queryKey: ['chats'],
          queryFn,
          initialPageParam: undefined as string | undefined,
          getNextPageParam: () => 'next' as string | undefined,
        },
        true,
        emptyPages(),
      ),
    )
    observer.subscribe(() => {})
    await wait()

    const result = observer.getCurrentResult()
    expect(queryFn).not.toHaveBeenCalled()
    expect(result.isPending).toBe(false)
    expect(result.data?.pages.flat()).toEqual([])
  })
})

describe('emptyPages', () => {
  it('is one empty page, so reading the first page or flattening both give an empty list', () => {
    const empty = emptyPages()

    expect(empty.pages).toEqual([[]])
    expect(empty.pages.flat()).toEqual([])
    expect(empty.pageParams).toEqual([undefined])
  })
})
