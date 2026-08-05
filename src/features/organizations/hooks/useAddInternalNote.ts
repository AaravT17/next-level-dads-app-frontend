import { useMutation, useQueryClient } from '@tanstack/react-query'

import { organizationsApi } from '../api/organizationsApi'
import { organizationKeys } from './organizationKeys'
import type { OrganizationDetail } from '../types/organizations'

interface AddInternalNoteInput {
  organizationId: string
  content: string
}

export function useAddInternalNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      organizationId,
      content,
    }: AddInternalNoteInput) =>
      organizationsApi.addInternalNote(
        organizationId,
        content
      ),

    onSuccess: (
      savedNote,
      { organizationId },
    ) => {
      queryClient.setQueryData<OrganizationDetail>(
        organizationKeys.detail(organizationId),
        (currentOrganization) => {
          if (!currentOrganization) {
            return currentOrganization
          }

          return {
            ...currentOrganization,
            notes: [
              ...currentOrganization.notes,
              savedNote,
            ],
          }
        },
      )
    },
  })
}