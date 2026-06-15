import { useMutation, useQueryClient } from '@tanstack/react-query'
import { communitiesApi } from '../api/communitiesApi'
import { communityKeys } from './communityKeys'

export function useHeartConversation(conversationId: string, communityId: string) {
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: communityKeys.conversation(conversationId),
    })
    queryClient.invalidateQueries({
      queryKey: communityKeys.conversations(communityId),
    })
  }

  const heart = useMutation({
    mutationFn: () => communitiesApi.heartConversation(conversationId),
    onSuccess: invalidate,
  })

  const unheart = useMutation({
    mutationFn: () => communitiesApi.unheartConversation(conversationId),
    onSuccess: invalidate,
  })

  return { heart, unheart }
}
