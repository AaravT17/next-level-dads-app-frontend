import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { communitiesApi } from '../api/communitiesApi'
import { communityKeys } from './communityKeys'
import { useJoinNudge } from './joinNudgeContext'

export function useHeartConversation(conversationId: string, communityId: string) {
  const queryClient = useQueryClient()
  const { recordInteraction } = useJoinNudge()

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
    // The like counts toward joining; the undo below does not.
    onSuccess: () => {
      invalidate()
      recordInteraction('heart')
    },
    onError: () => toast.error("Couldn't update your like"),
  })

  const unheart = useMutation({
    mutationFn: () => communitiesApi.unheartConversation(conversationId),
    onSuccess: invalidate,
    onError: () => toast.error("Couldn't update your like"),
  })

  return { heart, unheart }
}
