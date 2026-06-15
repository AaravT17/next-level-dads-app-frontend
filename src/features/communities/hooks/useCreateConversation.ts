import { useMutation, useQueryClient } from '@tanstack/react-query'
import { communitiesApi } from '../api/communitiesApi'
import { communityKeys } from './communityKeys'
import type { ConversationCreate } from '@/types/communities'

export function useCreateConversation(communityId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ConversationCreate) =>
      communitiesApi.createConversation(communityId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: communityKeys.conversations(communityId),
      })
    },
  })
}
