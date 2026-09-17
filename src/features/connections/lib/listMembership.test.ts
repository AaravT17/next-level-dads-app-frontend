import { describe, expect, it } from 'vitest'
import { staysInList, type ListContext } from './listMembership'
import type { ConnectionStatus } from '@/types/users'

/**
 * The rule that decides whether a card survives your acting on it.
 *
 * Worth testing on its own because getting it backwards is quiet in both
 * directions: too strict and a card vanishes from under the reader, too loose
 * and it lingers until a refetch silently deletes it. Neither throws, and
 * neither shows up in a type error.
 */

const ALL_STATUSES: ConnectionStatus[] = [
  null,
  'pending_outgoing',
  'pending_incoming',
  'connected',
  'blocked',
]

describe('browse', () => {
  it('keeps only dads you have not acted on', () => {
    // Matches the server: /api/users/ admits a dad only when no connection row
    // exists in either direction.
    expect(staysInList('dads', null)).toBe(true)
  })

  it('drops a dad the moment you send him a request', () => {
    // The behaviour this rule exists for. He reappears in the sent-requests
    // panel, not in the grid.
    expect(staysInList('dads', 'pending_outgoing')).toBe(false)
  })

  it.each(ALL_STATUSES.filter((s) => s !== null))('drops a dad who is %s', (status) => {
    expect(staysInList('dads', status)).toBe(false)
  })
})

describe('feed suggestions', () => {
  it.each(ALL_STATUSES)('keeps a suggested dad who is %s', (status) => {
    // A suggestion sits between posts someone is reading. Whatever you do to
    // it, the row holds its place and only its button changes — otherwise the
    // post below jumps up mid-sentence.
    expect(staysInList('suggestion', status)).toBe(true)
  })

  it('parts ways with browse on exactly the case that changed', () => {
    expect(staysInList('suggestion', 'pending_outgoing')).toBe(true)
    expect(staysInList('dads', 'pending_outgoing')).toBe(false)
  })
})

describe('the connection lists', () => {
  it.each([
    ['connections', 'connected'],
    ['requests', 'pending_incoming'],
    ['sent', 'pending_outgoing'],
  ] as [ListContext, ConnectionStatus][])(
    '%s holds exactly its own state',
    (list, own) => {
      expect(staysInList(list, own)).toBe(true)
      for (const other of ALL_STATUSES.filter((s) => s !== own)) {
        expect(staysInList(list, other)).toBe(false)
      }
    },
  )

  it('never leaves a request in both directions at once', () => {
    // pending_incoming and pending_outgoing are the same row read from
    // opposite ends; a status landing in both lists would show one request
    // twice, once with Accept and once with Cancel.
    expect(staysInList('requests', 'pending_outgoing')).toBe(false)
    expect(staysInList('sent', 'pending_incoming')).toBe(false)
  })
})

it('gives every list an answer for every status', () => {
  const lists: ListContext[] = ['dads', 'suggestion', 'connections', 'requests', 'sent']
  for (const list of lists) {
    for (const status of ALL_STATUSES) {
      expect(typeof staysInList(list, status)).toBe('boolean')
    }
  }
})
