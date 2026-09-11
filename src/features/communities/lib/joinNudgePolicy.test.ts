import { describe, expect, it } from 'vitest'
import {
  CARRY_OVER_MS,
  GLOBAL_COOLDOWN_MS,
  MAX_DISMISSALS,
  PROMPT_THRESHOLD,
  SNOOZE_MS,
  addInteraction,
  afterDismiss,
  emptyRecord,
  shouldPrompt,
  type CommunityNudgeRecord,
  type InteractionKind,
} from './joinNudgePolicy'

const NOW = 1_700_000_000_000

/** Build a record by replaying interactions, the way the app only ever can. */
const recordOf = (kinds: InteractionKind[], at = NOW): CommunityNudgeRecord =>
  kinds.reduce((rec, kind) => addInteraction(rec, kind, at), emptyRecord())

const ask = (
  record: CommunityNudgeRecord | undefined,
  overrides: Partial<Parameters<typeof shouldPrompt>[0]> = {},
) =>
  shouldPrompt({
    record,
    lastPromptAt: 0,
    now: NOW,
    trigger: 'interaction',
    ...overrides,
  })

describe('addInteraction', () => {
  it('leaves the record it was given untouched', () => {
    const before = emptyRecord()
    addInteraction(before, 'conversation', NOW)
    expect(before).toEqual(emptyRecord())
  })

  it('accumulates weighted points across interactions', () => {
    const record = recordOf(['heart', 'heart'])
    expect(record.points).toBe(2)
    expect(record.lastInteractionAt).toBe(NOW)
  })
})

describe('shouldPrompt', () => {
  it('never asks a community with no recorded activity', () => {
    expect(ask(undefined)).toBe(false)
  })

  it('asks as soon as someone starts a conversation', () => {
    // Writing a whole post is the strongest signal in the app, so it alone
    // clears the bar.
    expect(ask(recordOf(['conversation']))).toBe(true)
  })

  it('does not ask for a single like', () => {
    expect(ask(recordOf(['heart']))).toBe(false)
  })

  it('asks once likes add up to the threshold', () => {
    expect(ask(recordOf(['heart', 'heart']))).toBe(false)
    expect(ask(recordOf(['heart', 'heart', 'heart']))).toBe(true)
  })

  it('asks for a reply plus a like', () => {
    expect(ask(recordOf(['message', 'heart']))).toBe(true)
  })

  it('stays silent while a prompt elsewhere is still inside the cooldown', () => {
    const record = recordOf(['conversation'])
    expect(ask(record, { lastPromptAt: NOW - GLOBAL_COOLDOWN_MS + 1 })).toBe(false)
    expect(ask(record, { lastPromptAt: NOW - GLOBAL_COOLDOWN_MS })).toBe(true)
  })

  it('stays silent while snoozed, and speaks again once the snooze lapses', () => {
    const snoozed = { ...recordOf(['conversation']), snoozedUntil: NOW + 1 }
    expect(ask(snoozed)).toBe(false)
    expect(ask({ ...snoozed, snoozedUntil: NOW })).toBe(true)
  })

  it('gives up permanently after the last decline', () => {
    const record = { ...recordOf(['conversation']), dismissals: MAX_DISMISSALS }
    expect(ask(record, { now: NOW + 10 * SNOOZE_MS[1] })).toBe(false)
  })

  describe('on arriving at a screen', () => {
    // Starting a conversation routes straight to the new post, so the prompt
    // it earned has to survive exactly that one navigation — and no longer.
    it('re-raises a prompt earned moments ago on the previous screen', () => {
      const record = recordOf(['conversation'], NOW - CARRY_OVER_MS)
      expect(ask(record, { trigger: 'mount' })).toBe(true)
    })

    it('does not greet a returning visitor with a stale prompt', () => {
      const record = recordOf(['conversation'], NOW - CARRY_OVER_MS - 1)
      expect(ask(record, { trigger: 'mount' })).toBe(false)
      // The banked points are not lost — the next interaction still asks.
      expect(ask(record, { trigger: 'interaction' })).toBe(true)
    })
  })
})

describe('afterDismiss', () => {
  it('escalates the snooze with each decline, then stops asking', () => {
    const first = afterDismiss(recordOf(['conversation']), NOW)
    expect(first.snoozedUntil).toBe(NOW + SNOOZE_MS[0])

    const second = afterDismiss(first, NOW)
    expect(second.snoozedUntil).toBe(NOW + SNOOZE_MS[1])

    const third = afterDismiss(second, NOW)
    expect(third.dismissals).toBe(MAX_DISMISSALS)
    expect(ask(third, { now: NOW + 10 * SNOOZE_MS[1] })).toBe(false)
  })

  it('clears banked points so a lapsed snooze does not fire on its own', () => {
    const dismissed = afterDismiss(recordOf(['conversation']), NOW)
    expect(dismissed.points).toBe(0)

    const lapsed = dismissed.snoozedUntil
    expect(ask(dismissed, { now: lapsed })).toBe(false)
    expect(
      ask(addInteraction(dismissed, 'conversation', lapsed), { now: lapsed }),
    ).toBe(true)
  })
})

describe('threshold wiring', () => {
  it('keeps the reply weight below the bar on its own', () => {
    // Guards the tuning: a single reply should invite a second interaction,
    // not a modal.
    expect(recordOf(['message']).points).toBeLessThan(PROMPT_THRESHOLD)
  })
})
