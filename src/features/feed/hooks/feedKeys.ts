/** Query keys for the cross-community feed. */
export const feedKeys = {
  all: ['feed'] as const,
  list: (following: boolean) => ['feed', { following }] as const,
}
