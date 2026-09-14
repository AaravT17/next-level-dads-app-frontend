import axiosPrivate from '@/api/axiosPrivate'
import { TIMEOUT_LENGTH_MS } from '@/config/constants'
import type {
  ConnectionResponse,
  ConnectionsCursor,
  ConnectionsFilters,
} from '@/types/users'

/** Both request directions page identically; only the path differs. */
function requestParams(
  filters: ConnectionsFilters,
  cursor?: ConnectionsCursor,
): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.name) {
    params.append('name', filters.name)
  }
  if (cursor) {
    params.append('cursor_id', cursor.cursor_id)
    params.append('cursor_updated_at', cursor.cursor_updated_at)
  }
  return params
}

/**
 * Incoming connection requests.
 *
 * Lifted out of the Requests page once the Dads screen grew a panel of its
 * own: two callers reading the same endpoint under the same query key is the
 * point — accepting from either surface has to move the card in both.
 */
export async function fetchIncomingRequests(
  filters: ConnectionsFilters,
  cursor?: ConnectionsCursor,
): Promise<ConnectionResponse[]> {
  const res = await axiosPrivate.get<ConnectionResponse[]>(
    '/api/connections/requests',
    { params: requestParams(filters, cursor), timeout: TIMEOUT_LENGTH_MS },
  )
  return res.data
}

/**
 * Requests you have sent that nobody has answered yet.
 *
 * The browse grid used to double as this list — it returned dads you had
 * already requested, in a waiting state, so the only way to take a request
 * back was to scroll to it. Browse now returns only dads with no connection
 * at all, which makes this the sole surface where a sent request exists, and
 * the sole place it can be cancelled.
 *
 * Every row comes back as `pending_outgoing` with the note you attached, so
 * DadCard draws the right button without the caller having to say anything.
 */
export async function fetchOutgoingRequests(
  filters: ConnectionsFilters,
  cursor?: ConnectionsCursor,
): Promise<ConnectionResponse[]> {
  const res = await axiosPrivate.get<ConnectionResponse[]>(
    '/api/connections/requested',
    { params: requestParams(filters, cursor), timeout: TIMEOUT_LENGTH_MS },
  )
  return res.data
}
