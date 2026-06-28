import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { communitiesApi } from '../api/communitiesApi'
import { communityKeys } from './communityKeys'

export function useHeartConversation(conversationId: string, communityId: string) {
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: communityKeys.conversation(conversationId),
    })
    queryClient.invalidateQueries({
      queryKey: communityKeys.conversationsAll(communityId),
    })
  }

  const heart = useMutation({
    mutationFn: () => communitiesApi.heartConversation(conversationId),
    onSuccess: invalidate,
    onError: () => toast.error("Couldn't update your like"),
  })

  const unheart = useMutation({
    mutationFn: () => communitiesApi.unheartConversation(conversationId),
    onSuccess: invalidate,
    onError: () => toast.error("Couldn't update your like"),
  })

  return { heart, unheart }
}
