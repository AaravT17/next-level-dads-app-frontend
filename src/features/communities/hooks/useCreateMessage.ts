import { useMutation, useQueryClient } from '@tanstack/react-query'
import { communitiesApi } from '../api/communitiesApi'
import { communityKeys } from './communityKeys'
import { scheduleModerationCheck } from '@/features/moderation/hooks/moderationWatch'
import type { MessageCreate } from '@/types/communities'

export function useCreateMessage(conversationId: string, communityId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: MessageCreate) =>
      communitiesApi.createMessage(conversationId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: communityKeys.messages(conversationId),
      })
      queryClient.invalidateQueries({
        queryKey: communityKeys.conversation(conversationId),
      })
      queryClient.invalidateQueries({
        queryKey: communityKeys.participants(conversationId),
      })
      queryClient.invalidateQueries({
        queryKey: communityKeys.conversations(communityId),
      })
      scheduleModerationCheck(queryClient)
    },
  })
}
