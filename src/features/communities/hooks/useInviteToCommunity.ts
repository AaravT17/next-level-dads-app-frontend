import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { toast } from 'sonner'
import { communitiesApi } from '../api/communitiesApi'

/**
 * Send a community invite as a DM to each selected connection.
 *
 * The invites land in chats the sender already has (or that this creates), so
 * the chat list is invalidated rather than patched — the previews it needs are
 * server-derived, and a fan-out of up to ten is not worth hand-merging.
 */
export function useInviteToCommunity(communityId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (recipientIds: string[]) =>
      communitiesApi.inviteToCommunity(communityId!, recipientIds),
    onSuccess: ({ invited_count }) => {
      queryClient.invalidateQueries({ queryKey: ['chats'] })
      toast.success(
        invited_count === 1
          ? 'Invite sent'
          : `Invites sent to ${invited_count} friends`,
      )
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          return toast.error('Too many invites sent. Please slow down.')
        }
        if (error.response?.status === 403) {
          return toast.error('You can only invite people you are connected with.')
        }
      }
      toast.error("Couldn't send invites. Please try again.")
    },
  })
}
