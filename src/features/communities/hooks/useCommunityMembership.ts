import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { communitiesApi } from '../api/communitiesApi'
import { communityKeys } from './communityKeys'
import { useJoinNudge } from './joinNudgeContext'

/**
 * Joining and leaving a community.
 *
 * Both live here rather than inline in the page because joining now has two
 * entry points — the button on the community header and the prompt that
 * follows someone taking part without having joined — and they must invalidate
 * the same things.
 */

function useMembershipInvalidation(communityId: string) {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: communityKeys.detail(communityId) })
    queryClient.invalidateQueries({ queryKey: communityKeys.all })
  }
}

export function useJoinCommunity(communityId: string) {
  const invalidate = useMembershipInvalidation(communityId)
  const { resolveJoined } = useJoinNudge()

  return useMutation({
    mutationFn: () => communitiesApi.joinCommunity(communityId),
    onSuccess: () => {
      invalidate()
      // However they got here, the prompt has nothing left to ask.
      resolveJoined()
    },
    onError: () => toast.error("Couldn't join community"),
  })
}

export function useLeaveCommunity(communityId: string) {
  const invalidate = useMembershipInvalidation(communityId)

  return useMutation({
    mutationFn: () => communitiesApi.leaveCommunity(communityId),
    onSuccess: invalidate,
    onError: () => toast.error("Couldn't leave community"),
  })
}
