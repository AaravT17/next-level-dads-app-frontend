import { useMutation, useQueryClient } from '@tanstack/react-query'
import { communitiesApi } from '../api/communitiesApi'
import { communityKeys } from './communityKeys'

export function useHeartMessage(messageId: string, conversationId: string) {
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: communityKeys.messages(conversationId),
    })
  }

  const heart = useMutation({
    mutationFn: () => communitiesApi.heartMessage(messageId),
    onSuccess: invalidate,
  })

  const unheart = useMutation({
    mutationFn: () => communitiesApi.unheartMessage(messageId),
    onSuccess: invalidate,
  })

  return { heart, unheart }
}
