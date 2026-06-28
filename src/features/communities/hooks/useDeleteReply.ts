import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { communitiesApi } from '../api/communitiesApi'
import { communityKeys } from './communityKeys'

export function useDeleteReply(
  replyId: string,
  messageId: string,
  conversationId: string,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => communitiesApi.deleteReply(replyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.replies(messageId) })
      queryClient.invalidateQueries({
        queryKey: communityKeys.messages(conversationId),
      })
    },
    onError: () => toast.error("Couldn't delete this reply"),
  })
}
