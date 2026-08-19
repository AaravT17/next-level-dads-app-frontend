import type { AxiosError } from 'axios'

export const NETWORK_ERROR_MESSAGE =
  'Cannot reach the server. Please check your connection and try again.'

/**
 * Resolve a user-facing message from a failed request.
 *
 * Distinguishes a server-sent error from a request that never got a response —
 * without this the two are indistinguishable to the user, which hides outages
 * behind a generic "something went wrong".
 */
export const getErrorMessage = (err: unknown, fallback: string): string => {
  const axiosError = err as AxiosError<{ detail?: string }> | undefined
  const detail = axiosError?.response?.data?.detail
  if (typeof detail === 'string' && detail.length > 0) {
    return detail
  }
  return axiosError?.response ? fallback : NETWORK_ERROR_MESSAGE
}
