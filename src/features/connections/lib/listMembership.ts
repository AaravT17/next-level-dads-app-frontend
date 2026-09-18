import type { ConnectionStatus } from '@/types/users'

/** The lists a dad card can appear in. */
export type ListContext =
  | 'dads'
  | 'suggestion'
  | 'connections'
  | 'requests'
  | 'sent'

/**
 * Whether a dad still belongs in a list once his connection status changes.
 *
 * Each list is defined by one connection state, so acting on a card either
 * leaves it where it is or takes it out — there is no third outcome. Stating
 * that once keeps the five lists from drifting apart: the rule is applied in
 * DadCard for whichever list the card sits in, and again in ProfileDetail,
 * which writes through to every list at once because any of them could be the
 * screen underneath.
 *
 *   dads         browse, and browse is dads you have not acted on. The server
 *                agrees — /api/users/ returns only these — so a card that
 *                gains any status at all is already gone from the next page.
 *   suggestion   a dad between feed posts. Never removed: the reader is
 *                reading, and closing a gap under them moves the post they
 *                are on. Only the button changes.
 *   connections  accepted, both ways.
 *   requests     someone asking to connect with you.
 *   sent         someone you asked, still waiting.
 */
export function staysInList(list: ListContext, status: ConnectionStatus): boolean {
  switch (list) {
    case 'dads':
      return status === null
    case 'suggestion':
      return true
    case 'connections':
      return status === 'connected'
    case 'requests':
      return status === 'pending_incoming'
    case 'sent':
      return status === 'pending_outgoing'
  }
}
