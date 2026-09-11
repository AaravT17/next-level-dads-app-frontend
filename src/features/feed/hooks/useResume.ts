import { useQuery } from '@tanstack/react-query'
import { resumeApi } from '../api/resumeApi'
import { feedKeys } from './feedKeys'

/**
 * Conversations you have a stake in, for the Home rail.
 *
 * A plain query rather than an infinite one: the rail is a fixed shelf of at
 * most RESUME_PAGE_LIMIT cards, not a browse surface.
 *
 * `retry: false` because the endpoint does not exist yet — the default three
 * retries would mean four failed requests on every Home load for a section
 * that renders nothing when it fails.
 */
export function useResume() {
  return useQuery({
    queryKey: feedKeys.resume,
    queryFn: resumeApi.list,
    staleTime: 1000 * 60,
    retry: false,
  })
}
