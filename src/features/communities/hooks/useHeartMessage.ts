import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
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
    onError: () => toast.error("Couldn't update your like"),
  })

  const unheart = useMutation({
    mutationFn: () => communitiesApi.unheartMessage(messageId),
    onSuccess: invalidate,
    onError: () => toast.error("Couldn't update your like"),
  })

  return { heart, unheart }
}
