import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { communitiesApi } from '../api/communitiesApi'
import { communityKeys } from './communityKeys'
import { useJoinNudge } from './joinNudgeContext'

export function useHeartMessage(messageId: string, conversationId: string) {
  const queryClient = useQueryClient()
  const { recordInteraction } = useJoinNudge()

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: communityKeys.messages(conversationId),
    })
  }

  const heart = useMutation({
    mutationFn: () => communitiesApi.heartMessage(messageId),
    // The like counts toward joining; the undo below does not.
    onSuccess: () => {
      invalidate()
      recordInteraction('heart')
    },
    onError: () => toast.error("Couldn't update your like"),
  })

  const unheart = useMutation({
    mutationFn: () => communitiesApi.unheartMessage(messageId),
    onSuccess: invalidate,
    onError: () => toast.error("Couldn't update your like"),
  })

  return { heart, unheart }
}
