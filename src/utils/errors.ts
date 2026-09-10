import axios from 'axios'

export const NETWORK_ERROR_MESSAGE =
  'Cannot reach the server. Please check your connection and try again.'

/**
 * Resolve a user-facing message from a failed request.
 *
 * Distinguishes a server-sent error from a request that never got a response —
 * without this the two are indistinguishable to the user, which hides outages
 * behind a generic "something went wrong".
 *
 * Also handles throws that never went through axios at all: Supabase's auth
 * client rejects with a plain Error, and reporting those as "cannot reach the
 * server" was actively misleading.
 */
export const getErrorMessage = (err: unknown, fallback: string): string => {
  if (axios.isAxiosError<{ detail?: string }>(err)) {
    const detail = err.response?.data?.detail
    if (typeof detail === 'string' && detail.length > 0) {
      return detail
    }
    return err.response ? fallback : NETWORK_ERROR_MESSAGE
  }
  if (err instanceof Error && err.message) {
    return err.message
  }
  return fallback
}

/**
 * Whether a caught value is an HTTP failure with a particular status.
 *
 * Keeps `axios.isAxiosError` narrowing at one call site instead of importing
 * axios into pages that otherwise only touch the wrapped clients.
 */
export const isHttpStatus = (err: unknown, status: number): boolean =>
  axios.isAxiosError(err) && err.response?.status === status
