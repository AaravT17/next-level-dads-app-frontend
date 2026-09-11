import axiosPrivate from '@/api/axiosPrivate'
import { TIMEOUT_LENGTH_MS } from '@/config/constants'
import type {
  ConnectionResponse,
  ConnectionsCursor,
  ConnectionsFilters,
} from '@/types/users'

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
  const params = new URLSearchParams()
  if (filters.name) {
    params.append('name', filters.name)
  }
  if (cursor) {
    params.append('cursor_id', cursor.cursor_id)
    params.append('cursor_updated_at', cursor.cursor_updated_at)
  }
  const res = await axiosPrivate.get<ConnectionResponse[]>(
    '/api/connections/requests',
    { params, timeout: TIMEOUT_LENGTH_MS },
  )
  return res.data
}
