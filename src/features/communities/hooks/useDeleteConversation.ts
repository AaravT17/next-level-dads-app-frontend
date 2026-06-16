import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { communitiesApi } from '../api/communitiesApi'
import { communityKeys } from './communityKeys'

export function useDeleteConversation(conversationId: string, communityId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => communitiesApi.deleteConversation(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: communityKeys.conversation(conversationId),
      })
      queryClient.invalidateQueries({
        queryKey: communityKeys.conversationsAll(communityId),
      })
    },
    onError: () => toast.error("Couldn't delete this post"),
  })
}
