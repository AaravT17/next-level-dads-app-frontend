import { useMutation, useQueryClient } from '@tanstack/react-query'
import { communitiesApi } from '../api/communitiesApi'
import { communityKeys } from './communityKeys'
import type { ReplyCreate } from '@/types/communities'

export function useCreateReply(messageId: string, conversationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ReplyCreate) =>
      communitiesApi.createReply(messageId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.replies(messageId) })
      queryClient.invalidateQueries({ queryKey: communityKeys.messages(conversationId) })
    },
  })
}
