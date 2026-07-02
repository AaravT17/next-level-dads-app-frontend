import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { communitiesApi } from '../api/communitiesApi'
import { communityKeys } from './communityKeys'

export function useDeleteMessage(messageId: string, conversationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => communitiesApi.deleteMessage(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: communityKeys.messages(conversationId),
      })
      queryClient.invalidateQueries({
        queryKey: communityKeys.conversation(conversationId),
      })
    },
    onError: () => toast.error("Couldn't delete this reply"),
  })
}
