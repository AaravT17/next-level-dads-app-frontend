export const moderationKeys = {
  notifications: (unreadOnly: boolean) =>
    ['moderation-notifications', unreadOnly] as const,
  ban: () => ['moderation-ban'] as const,
}
