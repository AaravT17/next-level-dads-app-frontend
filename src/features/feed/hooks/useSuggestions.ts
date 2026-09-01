import { useQueries } from '@tanstack/react-query'
import { suggestionsApi } from '../api/suggestionsApi'
import { feedKeys } from './feedKeys'
import type { Event } from '@/types/events'
import type { Profile } from '@/types/users'

/**
 * The pools the feed interleaves suggestions from.
 *
 * Both fetch in parallel via useQueries, and both fail soft: a suggestion is
 * an extra, so an empty pool just means the feed runs without that kind
 * rather than the page showing an error. The interleave already skips a slot
 * whose pool is empty, so there is nothing else to handle here.
 *
 * Suggestions go stale slowly — five minutes — because re-fetching mid-scroll
 * would reshuffle cards the reader has already passed.
 */
export function useSuggestions(): { events: Event[]; dads: Profile[] } {
  const [events, dads] = useQueries({
    queries: [
      {
        queryKey: feedKeys.suggestedEvents,
        queryFn: suggestionsApi.events,
        staleTime: 1000 * 60 * 5,
        retry: false,
      },
      {
        queryKey: feedKeys.suggestedDads,
        queryFn: suggestionsApi.dads,
        staleTime: 1000 * 60 * 5,
        retry: false,
      },
    ],
  })

  return { events: events.data ?? [], dads: dads.data ?? [] }
}
