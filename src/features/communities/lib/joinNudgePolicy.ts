/**
 * When to ask a non-member whether they want to join a community they are
 * already taking part in.
 *
 * Posting, replying and liking are open to everyone by design, so the only
 * evidence that someone has adopted a community is what they do inside it.
 * This module turns that activity into one yes/no decision and is deliberately
 * pure: every "is it time to ask?" rule lives here, so the storage layer and
 * the React layer around it stay dumb and the whole policy is testable without
 * a DOM.
 *
 * The bias throughout is toward asking too rarely. A prompt that arrives once
 * and converts is worth more than one that arrives five times and trains
 * people to dismiss it on sight.
 */

const DAY_MS = 24 * 60 * 60 * 1000

export type InteractionKind = 'conversation' | 'message' | 'reply' | 'heart'

/**
 * Not every interaction says the same thing. Writing a post is a commitment;
 * a like is a nod in passing. Weighting them means one post earns the prompt
 * outright while it takes three likes to get to the same place.
 */
export const INTERACTION_WEIGHTS: Readonly<Record<InteractionKind, number>> = {
  conversation: 3,
  message: 2,
  reply: 2,
  heart: 1,
}

/** Weighted points that must accumulate before a community may ask. */
export const PROMPT_THRESHOLD = 3

/**
 * How long "not right now" lasts, per time it has been said. The list also
 * sets the ceiling: once it runs out, the community stops asking for good.
 */
export const SNOOZE_MS: readonly number[] = [7 * DAY_MS, 30 * DAY_MS]

/** Declines after which this community never asks again. */
export const MAX_DISMISSALS = SNOOZE_MS.length + 1

/**
 * At most one join prompt anywhere in the app per day. Without it, someone
 * reading their way across five communities in a sitting would meet five
 * modals — each individually earned, collectively a nag.
 */
export const GLOBAL_COOLDOWN_MS = DAY_MS

/**
 * How long a prompt earned on one screen survives a navigation to the next.
 *
 * Starting a conversation is the strongest signal there is, and it also routes
 * straight to the new post — so the prompt it earns has to be allowed to land
 * on the page that follows. Beyond this window the visit is a new one, and a
 * modal on arrival is exactly the interruption this module exists to avoid.
 */
export const CARRY_OVER_MS = 60_000

export interface CommunityNudgeRecord {
  /** Weighted interaction points banked since the last resolved prompt. */
  points: number
  /** Epoch ms of the most recent qualifying interaction. */
  lastInteractionAt: number
  /** How many times "not right now" has been chosen here. */
  dismissals: number
  /** Epoch ms before which this community must not ask again. */
  snoozedUntil: number
}

/**
 * Whether the decision is being made as a direct result of an interaction or
 * on arriving at a screen. Only the latter has to prove it is still part of
 * the same flow — see {@link CARRY_OVER_MS}.
 */
export type PromptTrigger = 'interaction' | 'mount'

export const emptyRecord = (): CommunityNudgeRecord => ({
  points: 0,
  lastInteractionAt: 0,
  dismissals: 0,
  snoozedUntil: 0,
})

export function addInteraction(
  record: CommunityNudgeRecord,
  kind: InteractionKind,
  now: number,
): CommunityNudgeRecord {
  return {
    ...record,
    points: record.points + INTERACTION_WEIGHTS[kind],
    lastInteractionAt: now,
  }
}

/**
 * Fold a decline into the record: bank it, escalate the snooze, and drop the
 * points so the next ask has to be earned again rather than firing the moment
 * the snooze lapses.
 */
export function afterDismiss(
  record: CommunityNudgeRecord,
  now: number,
): CommunityNudgeRecord {
  const dismissals = record.dismissals + 1
  return {
    ...record,
    points: 0,
    dismissals,
    snoozedUntil: now + (SNOOZE_MS[dismissals - 1] ?? 0),
  }
}

export function shouldPrompt(params: {
  record: CommunityNudgeRecord | undefined
  /** Epoch ms of the last prompt resolved anywhere in the app. */
  lastPromptAt: number
  now: number
  trigger: PromptTrigger
}): boolean {
  const { record, lastPromptAt, now, trigger } = params
  if (!record) return false
  if (record.dismissals >= MAX_DISMISSALS) return false
  if (now < record.snoozedUntil) return false
  if (now - lastPromptAt < GLOBAL_COOLDOWN_MS) return false
  if (record.points < PROMPT_THRESHOLD) return false
  if (trigger === 'mount' && now - record.lastInteractionAt > CARRY_OVER_MS) {
    return false
  }
  return true
}
