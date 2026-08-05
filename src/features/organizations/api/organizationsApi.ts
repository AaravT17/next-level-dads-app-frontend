import axiosPrivate from '@/api/axiosPrivate'
import { TIMEOUT_LENGTH_MS } from '@/config/constants'
import type { OrganizationDetail, OrganizationSummary, OrganizationDecisionStatus, InternalNote } from '@/features/organizations/types/organizations'

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

    addInternalNote: (organizationId: string, content: string) =>
        axiosPrivate.post<InternalNote>(`/api/organizations/${organizationId}/notes`, { content }, requestConfig)
                    .then((response) => response.data),

    decideOrganization: (organizationId: string, status: OrganizationDecisionStatus) =>
        axiosPrivate.patch<OrganizationDetail>(`/api/organizations/${organizationId}/decision`, { status }, requestConfig,)
                    .then((response) => response.data)
}