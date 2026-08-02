import axiosPrivate from '@/api/axiosPrivate'
import { TIMEOUT_LENGTH_MS } from '@/config/constants'
import type { OrganizationDetail, OrganizationSummary } from '@/features/organizations/types/organizations'

const requestConfig = {
    timeout: TIMEOUT_LENGTH_MS, 
}

export const organizationsApi = {
    getOrganizations: () =>
        axiosPrivate.get<OrganizationSummary[]>('/api/organizations', requestConfig)
                    .then((response) => response.data),
    
    getOrganization: (organizationId: string) =>
        axiosPrivate.get<OrganizationDetail>(`/api/organizations/${organizationId}`, requestConfig)
                    .then((response) => response.data),

    approveOrganization: (organizationId: string) =>
        axiosPrivate.patch<OrganizationDetail>(`/api/organizations/${organizationId}/decision`, { status: 'approved' }, requestConfig,)
                    .then((response) => response.data)
}
