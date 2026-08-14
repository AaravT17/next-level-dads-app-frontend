import { useQuery } from '@tanstack/react-query'
import { organizationsApi } from '../api/organizationsApi'
import { organizationKeys } from './organizationKeys'
import type { OrganizationListFilters } from '../types/organizations'

export function useActivePartners(filters: OrganizationListFilters = {}) {
    return useQuery({
        queryKey: organizationKeys.activePartners(filters),
        queryFn: () => organizationsApi.getActivePartners(filters),
    })
}