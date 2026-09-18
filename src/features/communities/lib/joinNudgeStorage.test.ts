import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { emptyRecord } from './joinNudgePolicy'
import { readStore, updateStore } from './joinNudgeStorage'

/**
 * The suite runs in a node environment, so it brings its own localStorage —
 * enough of one to cover what the module actually calls, plus the ability to
 * make it throw the way a browser with site data blocked does.
 */
function fakeStorage() {
  const entries = new Map<string, string>()
  return {
    entries,
    throwOnGet: false,
    throwOnSet: false,
    getItem(key: string) {
      if (this.throwOnGet) throw new Error('site data blocked')
      return entries.get(key) ?? null
    },
    setItem(key: string, value: string) {
      if (this.throwOnSet) throw new Error('quota exceeded')
      entries.set(key, value)
    },
  }
}

const USER = 'user-1'
const KEY = `nld.join-nudge.v1.${USER}`
const COMMUNITY = 'community-a'
const DAY_MS = 24 * 60 * 60 * 1000

let storage: ReturnType<typeof fakeStorage>

beforeEach(() => {
  storage = fakeStorage()
  vi.stubGlobal('window', { localStorage: storage })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

const write = (value: unknown) => storage.entries.set(KEY, JSON.stringify(value))

describe('readStore', () => {
  it('starts from scratch when nothing has been written', () => {
    expect(readStore(USER)).toEqual({ lastPromptAt: 0, communities: {} })
  })

  it('starts from scratch when the stored value is not JSON', () => {
    storage.entries.set(KEY, 'not json{')
    expect(readStore(USER)).toEqual({ lastPromptAt: 0, communities: {} })
  })

  it('starts from scratch when reading throws', () => {
    storage.throwOnGet = true
    expect(readStore(USER)).toEqual({ lastPromptAt: 0, communities: {} })
  })

  it('coerces tampered fields instead of trusting them', () => {
    // The value is user-editable text, so a hand-edited snooze must not be
    // able to push a decision anywhere the policy would not go on its own.
    write({
      lastPromptAt: 'soon',
      communities: {
        [COMMUNITY]: { points: -5, dismissals: null, snoozedUntil: Infinity },
      },
    })
    expect(readStore(USER)).toEqual({
      lastPromptAt: 0,
      communities: { [COMMUNITY]: emptyRecord() },
    })
  })

  it('keeps one user out of another user\'s history', () => {
    updateStore(USER, (store) => ({ ...store, lastPromptAt: 123 }))
    expect(readStore('user-2').lastPromptAt).toBe(0)
  })
})

describe('updateStore', () => {
  it('persists what the mutator returns', () => {
    updateStore(USER, (store) => ({ ...store, lastPromptAt: 500 }))
    expect(readStore(USER).lastPromptAt).toBe(500)
  })

  it('hands the mutator the latest value, not a stale copy', () => {
    // Showing a prompt and resolving it are separate writes to one key.
    updateStore(USER, (store) => ({ ...store, lastPromptAt: 1 }))
    updateStore(USER, (store) => ({ ...store, lastPromptAt: store.lastPromptAt + 1 }))
    expect(readStore(USER).lastPromptAt).toBe(2)
  })

  it('stays quiet when the write is refused', () => {
    storage.throwOnSet = true
    expect(() => updateStore(USER, (store) => store)).not.toThrow()
  })
})

describe('pruning', () => {
  const withRecord = (record: Partial<ReturnType<typeof emptyRecord>>) => (
    store: ReturnType<typeof readStore>,
  ) => ({
    ...store,
    communities: {
      ...store.communities,
      [COMMUNITY]: { ...emptyRecord(), ...record },
    },
  })

  it('forgets points banked in a community that has gone quiet', () => {
    const now = Date.now()
    updateStore(USER, withRecord({ points: 2, lastInteractionAt: now - 91 * DAY_MS }))
    expect(readStore(USER).communities[COMMUNITY]).toBeUndefined()
  })

  it('never forgets a decline, however long ago it was', () => {
    const now = Date.now()
    updateStore(
      USER,
      withRecord({ dismissals: 3, lastInteractionAt: now - 400 * DAY_MS }),
    )
    expect(readStore(USER).communities[COMMUNITY]?.dismissals).toBe(3)
  })

  it('keeps a community that is still active', () => {
    updateStore(USER, withRecord({ points: 2, lastInteractionAt: Date.now() }))
    expect(readStore(USER).communities[COMMUNITY]?.points).toBe(2)
  })
})
