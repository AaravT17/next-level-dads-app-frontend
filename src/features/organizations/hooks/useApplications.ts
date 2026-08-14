import { useQuery } from '@tanstack/react-query'
import { organizationsApi } from '../api/organizationsApi'
import { organizationKeys } from './organizationKeys'
import type { ApplicationFilters } from '../types/organizations'

export function useApplications(filters: ApplicationFilters = {}) {
    return useQuery({
        queryKey: organizationKeys.applicationList(filters),
        queryFn: () => organizationsApi.getApplications(filters),
    })
}