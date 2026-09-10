import {
  emptyRecord,
  type CommunityNudgeRecord,
} from './joinNudgePolicy'

/**
 * Where the join-prompt policy keeps its books.
 *
 * This is per-device on purpose. The alternative — a column on the user — buys
 * cross-device consistency at the price of a migration, an endpoint and a
 * write on every like, for state whose entire job is to stop one modal
 * appearing too often. Losing it costs a user at most one extra prompt.
 *
 * The key is namespaced by user id so two people sharing a browser do not
 * inherit each other's snoozes.
 */

const STORAGE_PREFIX = 'nld.join-nudge.v1'

/** How long banked interaction points survive without being added to. */
const RECORD_TTL_MS = 90 * 24 * 60 * 60 * 1000

export interface JoinNudgeStore {
  /** Epoch ms of the last prompt resolved anywhere in the app. */
  lastPromptAt: number
  communities: Record<string, CommunityNudgeRecord>
}

const emptyStore = (): JoinNudgeStore => ({ lastPromptAt: 0, communities: {} })

const storageKey = (userId: string) => `${STORAGE_PREFIX}.${userId}`

const asCount = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0

/**
 * Anything read back is user-editable text, so treat it as untrusted input and
 * coerce it into shape rather than trusting the cast. A field that has been
 * tampered with degrades to "ask sooner", never to a crash.
 */
function normalizeRecord(value: unknown): CommunityNudgeRecord {
  if (typeof value !== 'object' || value === null) return emptyRecord()
  const raw = value as Partial<Record<keyof CommunityNudgeRecord, unknown>>
  return {
    points: asCount(raw.points),
    lastInteractionAt: asCount(raw.lastInteractionAt),
    dismissals: asCount(raw.dismissals),
    snoozedUntil: asCount(raw.snoozedUntil),
  }
}

function normalizeStore(value: unknown): JoinNudgeStore {
  if (typeof value !== 'object' || value === null) return emptyStore()
  const raw = value as Partial<Record<keyof JoinNudgeStore, unknown>>
  const communities =
    typeof raw.communities === 'object' && raw.communities !== null
      ? raw.communities
      : {}
  return {
    lastPromptAt: asCount(raw.lastPromptAt),
    communities: Object.fromEntries(
      Object.entries(communities as Record<string, unknown>).map(([id, rec]) => [
        id,
        normalizeRecord(rec),
      ]),
    ),
  }
}

/**
 * Drop what can no longer change a decision, so the key stays small.
 *
 * A record that has been declined is never dropped, however long the community
 * has been quiet: "stop asking me about this one" is the one thing here worth
 * remembering indefinitely, and a year-old decline resurfacing as a prompt is
 * the exact failure this whole module is built to avoid. Points, by contrast,
 * go stale — someone who liked two posts last spring is starting over.
 */
function prune(store: JoinNudgeStore, now: number): JoinNudgeStore {
  const communities = Object.fromEntries(
    Object.entries(store.communities).filter(
      ([, record]) =>
        record.dismissals > 0 || now - record.lastInteractionAt < RECORD_TTL_MS,
    ),
  )
  return { ...store, communities }
}

export function readStore(userId: string): JoinNudgeStore {
  // localStorage throws outright when a browser is set to block site data, and
  // the value itself can be stale JSON from an older shape. Neither is worth
  // surfacing: with no history the policy simply starts from scratch, which is
  // the same state a new device is in.
  try {
    const raw = window.localStorage.getItem(storageKey(userId))
    return raw ? normalizeStore(JSON.parse(raw)) : emptyStore()
  } catch {
    return emptyStore()
  }
}

/**
 * Read, transform and write in one step.
 *
 * Showing a prompt and resolving it are separate events that both touch this
 * key, so callers must never hold a copy of the store across an await or a
 * render and write it back later — that is how one write silently reverts
 * another.
 */
export function updateStore(
  userId: string,
  mutate: (store: JoinNudgeStore) => JoinNudgeStore,
): void {
  const next = prune(mutate(readStore(userId)), Date.now())
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(next))
  } catch {
    // Out of quota, or site data blocked. The prompt still behaves correctly
    // for this page view; it just cannot remember the outcome afterwards.
  }
}
