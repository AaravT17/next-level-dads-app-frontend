import { useQuery } from '@tanstack/react-query'
import { organizationsApi } from '../api/organizationsApi'
import { organizationKeys } from './organizationKeys'

export function useOrganization(organizationId: string | undefined) {
    return useQuery({
        queryKey: organizationKeys.detail(organizationId ?? ''),
        queryFn: () => organizationsApi.getOrganization(organizationId!),
        enabled: !!organizationId,
    })
}