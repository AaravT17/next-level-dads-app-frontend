import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { toast } from 'sonner'
import { communitiesApi } from '../api/communitiesApi'
import { communityKeys } from './communityKeys'

function imageErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 429) {
      return 'Photo change limit reached. Please try again later.'
    }
    if (error.response?.status === 403) {
      return 'Only community admins can change the photo.'
    }
    if (error.response?.status === 400) {
      return 'That file is not a supported image. Use a PNG or JPG.'
    }
  }
  return fallback
}

/**
 * Set or replace a community's photo.
 *
 * The photo shows up in every community list as well as on the community
 * itself, so both the detail query and the collection lists are invalidated
 * rather than patched: the lists are cursor-paginated and a given community may
 * sit in several of them at once.
 */
export function useUpdateCommunityImage(communityId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => {
      // See useInviteToCommunity: reject rather than request /undefined/image.
      if (!communityId) {
        return Promise.reject(new Error('useUpdateCommunityImage: no community id'))
      }
      return communitiesApi.updateCommunityImage(communityId, file)
    },
    onSuccess: () => {
      if (communityId) {
        queryClient.invalidateQueries({ queryKey: communityKeys.detail(communityId) })
      }
      queryClient.invalidateQueries({ queryKey: communityKeys.all })
      toast.success('Community photo updated')
    },
    onError: (error) => {
      toast.error(imageErrorMessage(error, "Couldn't update the photo. Please try again."))
    },
  })
}

export function useDeleteCommunityImage(communityId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => {
      if (!communityId) {
        return Promise.reject(new Error('useDeleteCommunityImage: no community id'))
      }
      return communitiesApi.deleteCommunityImage(communityId)
    },
    onSuccess: () => {
      if (communityId) {
        queryClient.invalidateQueries({ queryKey: communityKeys.detail(communityId) })
      }
      queryClient.invalidateQueries({ queryKey: communityKeys.all })
      toast.success('Community photo removed')
    },
    onError: (error) => {
      toast.error(imageErrorMessage(error, "Couldn't remove the photo. Please try again."))
    },
  })
}
