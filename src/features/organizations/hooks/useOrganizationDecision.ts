import { useMutation, useQueryClient } from "@tanstack/react-query"
import { organizationsApi } from "../api/organizationsApi"
import { organizationKeys } from "./organizationKeys"
import { OrganizationDecisionStatus } from "../types/organizations"

interface DecideOrganizationParams {
    organizationId: string
    status: OrganizationDecisionStatus
}

export function useOrganizationDecision() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({organizationId, status,}: DecideOrganizationParams) =>
            organizationsApi.decideOrganization(organizationId, status),

        onSuccess: (updatedOrganization) => {
            queryClient.setQueryData(
                organizationKeys.detail(updatedOrganization.id),
                updatedOrganization)

             queryClient.invalidateQueries({
                queryKey: organizationKeys.applications(),
            })

            queryClient.invalidateQueries({
                queryKey: organizationKeys.activePartners(),
            })

            queryClient.invalidateQueries({
                queryKey: organizationKeys.actionItems(),
            })
        }
    })
}