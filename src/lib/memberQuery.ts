import type { InfiniteData } from '@tanstack/react-query'

/**
 * What a member-only query runs with, given who is asking.
 *
 * A ghost has no profile, so everything keyed to "me" (my stats, my chats, my
 * connections) is refused by the backend with a 403. Letting those requests go
 * out would mean a doomed call, a retry, and an error state on a page that is
 * meant to look like an ordinary member's with nothing in it.
 *
 * For a ghost the query is switched off and handed a typed empty result as
 * `placeholderData`. Both halves matter:
 *
 *   - `enabled: false` is what stops the request.
 *   - `placeholderData` is what makes the result *settled*. A disabled query
 *     with no data stays `isPending` forever, so a page that shows a skeleton
 *     while pending would never stop showing it.
 *
 * Placeholder data, and not `initialData`, because placeholder data is never
 * written to the cache. `initialData` would be stored as real data, and a
 * member signing in afterwards on the same client would be shown the ghost's
 * empty result as fresh and never fetch their own.
 *
 * For anyone else the options are returned untouched, so a member's query is
 * exactly the query it was before ghosts existed.
 */
export function withGhostPlaceholder<O extends object, E>(options: O, ghost: boolean, empty: E): O {
  if (!ghost) return options
  return { ...options, enabled: false, placeholderData: empty } as O
}

/**
 * The empty result of an infinite query: a single page with nothing on it.
 *
 * One empty page rather than none, so code that reads `pages[0]` or flattens
 * the pages gets an empty list and not `undefined`. `hasNextPage` comes out
 * false, because every `getNextPageParam` here stops on a short page.
 *
 * Typed as pages of `never`, which fits under a list of anything. A type
 * parameter here would have to be given at every call, and left out it is
 * inferred as `unknown`, which would widen the type of the whole query.
 */
export function emptyPages(): InfiniteData<never[], undefined> {
  return { pages: [[]], pageParams: [undefined] }
}
