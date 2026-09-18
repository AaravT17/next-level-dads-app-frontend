/** Query keys for the Home surface: the feed, its suggestions, and the rail. */
export const feedKeys = {
  all: ['feed'] as const,
  list: (following: boolean) => ['feed', { following }] as const,
  resume: ['feed', 'resume'] as const,
  suggestedEvents: ['feed', 'suggestions', 'events'] as const,
  suggestedDads: ['feed', 'suggestions', 'dads'] as const,
}
