import { useQuery } from '@tanstack/react-query'
import { organizationsApi } from '../api/organizationsApi'
import { organizationKeys } from './organizationKeys'

export function useOrganizations() {
    return useQuery({
        queryKey: organizationKeys.list(),
        queryFn: organizationsApi.getOrganizations,
    })
}