import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { communitiesApi } from '../api/communitiesApi'
import { communityKeys } from './communityKeys'

export function useHeartReply(replyId: string, messageId: string) {
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: communityKeys.replies(messageId) })
  }

  const heart = useMutation({
    mutationFn: () => communitiesApi.heartReply(replyId),
    onSuccess: invalidate,
    onError: () => toast.error("Couldn't update your like"),
  })

  const unheart = useMutation({
    mutationFn: () => communitiesApi.unheartReply(replyId),
    onSuccess: invalidate,
    onError: () => toast.error("Couldn't update your like"),
  })

  return { heart, unheart }
}
