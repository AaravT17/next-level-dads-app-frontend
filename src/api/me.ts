import axiosPrivate from '@/api/axiosPrivate'
import { TIMEOUT_LENGTH_MS } from '@/config/constants'
import type { MeResponse } from '@/types/users'

/** The signed-in user's own profile. A 404 means the account has none yet. */
export async function fetchMe(): Promise<MeResponse> {
  const res = await axiosPrivate.get<MeResponse>('/api/users/me', { timeout: TIMEOUT_LENGTH_MS })
  return res.data
}
